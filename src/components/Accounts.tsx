import React, { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { ExportButtons } from "./ExportButtons";
import { ModuleEntranceHeader } from "./common/ModuleEntranceHeader";
import { BankStatementImportModal } from "./BankStatementImportModal";
import { ExportData, formatCurrency, formatDate, sanitizeOklchForHtml2Canvas, exportElementToPDF, printHtmlElement, exportToExcel, exportToPDF } from "../utils/exportUtils";
import { exportElementToPDFWithPrintStyling } from "../utils/pdfService";
import { useTheme } from "../context/ThemeContext";
import { ASSET_ICONS } from "../utils/assetIcons";
import {
  Account,
  Transaction,
  Contact,
  Cheque,
  ChequeStatus,
  PromissoryNote,
  PromissoryNoteStatus,
  CompanySettings,
  EXPENSE_CATEGORIES,
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
  ChevronDown,
  Landmark,
  Banknote,
  Stamp,
  Filter,
  Calendar,
  Share2,
  Send,
  Edit,
  Edit2,
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
  Receipt,
  Calculator,
  Tag,
} from "lucide-react";
import { DetailPageLayout } from "./common/DetailPageLayout";
import { useDetailNavigation } from "../hooks/useDetailNavigation";
import { UniversalWhatsAppModal, QuickTemplateOption } from "./common/UniversalWhatsAppModal";
import { TableColumnFilterInput } from "./common/TableColumnFilterInput";
import { TableCheckbox } from "./common/TableCheckbox";
import { BulkActionBar } from "./common/BulkActionBar";
import { useTableSelection } from "../hooks/useTableSelection";
import { triggerFormErrorNotification } from "../context/FormErrorContext";
import { Logo } from "./Logo";
import { useColumnVisibility, ColumnDef } from "../hooks/useColumnVisibility";
import { ColumnManagementDropdown } from "./common/ColumnManagementDropdown";
import { ChequeNoteSummaryReport } from "./common/ChequeNoteSummaryReport";

const KASA_TABLE_COLUMNS: ColumnDef[] = [
  { id: "date", label: "Tarih", defaultVisible: true },
  { id: "documentNo", label: "Evrak / Makbuz No", defaultVisible: true },
  { id: "accountName", label: "Kasa", defaultVisible: true },
  { id: "contact", label: "İşlem / Cari", defaultVisible: true },
  { id: "description", label: "Açıklama", defaultVisible: true },
  { id: "amount", label: "Tutar", defaultVisible: true },
  { id: "actions", label: "İşlemler", defaultVisible: true, lockVisible: true },
];

const BANKA_TABLE_COLUMNS: ColumnDef[] = [
  { id: "date", label: "Tarih", defaultVisible: true },
  { id: "documentNo", label: "Dekont No", defaultVisible: true },
  { id: "accountName", label: "Banka Hesabı", defaultVisible: true },
  { id: "contact", label: "İşlem / Cari", defaultVisible: true },
  { id: "description", label: "Açıklama", defaultVisible: true },
  { id: "amount", label: "Tutar", defaultVisible: true },
  { id: "actions", label: "İşlemler", defaultVisible: true, lockVisible: true },
];

const CHEQUE_TABLE_COLUMNS: ColumnDef[] = [
  { id: "noType", label: "Çek No & Tipi", defaultVisible: true },
  { id: "bank", label: "Banka / Şube", defaultVisible: true },
  { id: "contact", label: "Keşideci / Cari", defaultVisible: true },
  { id: "dueDate", label: "Vade Tarihi", defaultVisible: true },
  { id: "amount", label: "Tutar", defaultVisible: true },
  { id: "status", label: "Durum", defaultVisible: true },
  { id: "actions", label: "İşlemler", defaultVisible: true, lockVisible: true },
];

const NOTE_TABLE_COLUMNS: ColumnDef[] = [
  { id: "noType", label: "Senet No & Tipi", defaultVisible: true },
  { id: "debtor", label: "Borçlu / Cari", defaultVisible: true },
  { id: "issueDate", label: "Keşide / Düzenleme", defaultVisible: true },
  { id: "dueDate", label: "Vade Tarihi", defaultVisible: true },
  { id: "amount", label: "Tutar", defaultVisible: true },
  { id: "status", label: "Durum", defaultVisible: true },
  { id: "actions", label: "İşlemler", defaultVisible: true, lockVisible: true },
];

export type FinanceSubModule = "kasa" | "banka" | "cek" | "senet" | "virman" | "fis";

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
  moduleType: "kasa" | "banka" | "cek" | "senet" | "virman" | "fis" | "account";
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
  onBulkDeleteTransactions?: (ids: string[]) => void;
  onAddCheque?: (cheque: Cheque) => void;
  onUpdateCheque?: (cheque: Cheque) => void;
  onUpdateChequeStatus?: (id: string, status: ChequeStatus) => void;
  onDeleteCheque?: (id: string) => void;
  onBulkDeleteCheques?: (ids: string[]) => void;
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
  onBulkDeletePromissoryNotes?: (ids: string[]) => void;
  onEndorsePromissoryNote?: (
    noteId: string,
    targetContactId: string,
    targetContactName: string,
    endorseDate: string
  ) => void;
  standaloneFisSubTab?: "fis_girisi" | "fis_listesi";
  onSelectStandaloneFisSubTab?: (subTab: "fis_girisi" | "fis_listesi") => void;
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
  onBulkDeleteTransactions,
  onAddCheque,
  onUpdateCheque,
  onUpdateChequeStatus,
  onDeleteCheque,
  onBulkDeleteCheques,
  onEndorseCheque,
  onAddPromissoryNote,
  onUpdatePromissoryNote,
  onUpdateNoteStatus,
  onDeletePromissoryNote,
  onBulkDeletePromissoryNotes,
  onEndorsePromissoryNote,
  standaloneFisSubTab,
  onSelectStandaloneFisSubTab,
}) => {
  const { theme } = useTheme();
  const [internalSubModule, setInternalSubModule] = useState<FinanceSubModule>("kasa");
  const [internalFisViewMode, setInternalFisViewMode] = useState<"fis_girisi" | "fis_listesi">("fis_girisi");
  const isStandaloneFis = Boolean(standaloneFisSubTab);
  const activeFisViewMode = standaloneFisSubTab || internalFisViewMode;
  const handleSelectFisViewMode = (mode: "fis_girisi" | "fis_listesi") => {
    setInternalFisViewMode(mode);
    if (onSelectStandaloneFisSubTab) {
      onSelectStandaloneFisSubTab(mode);
    }
  };
  const activeSubModule: FinanceSubModule = isStandaloneFis ? "fis" : (activeFinanceSubTab || internalSubModule);

  // Tablo Satır / İşlem Seçme (Multi-Select) Hook'ları
  const kasaSelection = useTableSelection();
  const bankaSelection = useTableSelection();
  const chequeSelection = useTableSelection();
  const noteSelection = useTableSelection();
  const virmanSelection = useTableSelection();
  const fisSelection = useTableSelection();

  // Hızlı İşlem Seçme Menüsü (Dropdown)
  const [isQuickActionMenuOpen, setIsQuickActionMenuOpen] = useState(false);

  // Display limit states for Finance Sub-Modules
  const [kasaDisplayLimit, setKasaDisplayLimit] = useState<number>(100);
  const [bankDisplayLimit, setBankDisplayLimit] = useState<number>(100);
  const [chequeDisplayLimit, setChequeDisplayLimit] = useState<number>(100);
  const [noteDisplayLimit, setNoteDisplayLimit] = useState<number>(100);
  const [virmanDisplayLimit, setVirmanDisplayLimit] = useState<number>(100);
  const [fisDisplayLimit, setFisDisplayLimit] = useState<number>(100);

  // Kolon Yönetimi (Show/Hide) - Kasa
  const {
    columns: kasaColumns,
    columnVisibility: kasaColVisibility,
    toggleColumn: toggleKasaCol,
    setAllColumns: setAllKasaCols,
    resetToDefaults: resetKasaCols,
    isVisible: isKasaColVisible,
    hiddenCount: hiddenKasaColCount,
  } = useColumnVisibility("kasa_transactions", KASA_TABLE_COLUMNS);

  const visibleKasaColCount = React.useMemo(() => {
    return 1 + KASA_TABLE_COLUMNS.filter((col) => isKasaColVisible(col.id)).length;
  }, [isKasaColVisible]);

  // Kolon Yönetimi (Show/Hide) - Banka
  const {
    columns: bankaColumns,
    columnVisibility: bankaColVisibility,
    toggleColumn: toggleBankaCol,
    setAllColumns: setAllBankaCols,
    resetToDefaults: resetBankaCols,
    isVisible: isBankaColVisible,
    hiddenCount: hiddenBankaColCount,
  } = useColumnVisibility("bank_transactions", BANKA_TABLE_COLUMNS);

  const visibleBankaColCount = React.useMemo(() => {
    return 1 + BANKA_TABLE_COLUMNS.filter((col) => isBankaColVisible(col.id)).length;
  }, [isBankaColVisible]);

  // Kolon Yönetimi (Show/Hide) - Çekler
  const {
    columns: chequeColumns,
    columnVisibility: chequeColVisibility,
    toggleColumn: toggleChequeCol,
    setAllColumns: setAllChequeCols,
    resetToDefaults: resetChequeCols,
    isVisible: isChequeColVisible,
    hiddenCount: hiddenChequeColCount,
  } = useColumnVisibility("cheques", CHEQUE_TABLE_COLUMNS);

  const visibleChequeColCount = React.useMemo(() => {
    return 1 + CHEQUE_TABLE_COLUMNS.filter((col) => isChequeColVisible(col.id)).length;
  }, [isChequeColVisible]);

  // Kolon Yönetimi (Show/Hide) - Senetler
  const {
    columns: noteColumns,
    columnVisibility: noteColVisibility,
    toggleColumn: toggleNoteCol,
    setAllColumns: setAllNoteCols,
    resetToDefaults: resetNoteCols,
    isVisible: isNoteColVisible,
    hiddenCount: hiddenNoteColCount,
  } = useColumnVisibility("promissory_notes", NOTE_TABLE_COLUMNS);

  const visibleNoteColCount = React.useMemo(() => {
    return 1 + NOTE_TABLE_COLUMNS.filter((col) => isNoteColVisible(col.id)).length;
  }, [isNoteColVisible]);

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
    setIsChequeModalOpen(false);
    setIsNoteModalOpen(false);
    setIsAddTxModalOpen(false);
    setIsEditTxModalOpen(false);
    setIsEditChequeModalOpen(false);
    setIsEditNoteModalOpen(false);
    setIsEndorseModalOpen(false);
    setIsBankStatementModalOpen(false);
    setReceiptData(null);
    setIsReceiptWhatsAppOpen(false);
    setEditingAccount(null);
    setEditingTransaction(null);
    setEditingCheque(null);
    setEditingNote(null);
    setShareConfig((prev) => ({ ...prev, isOpen: false }));
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

  // Master-Detail Expanded Rows State (like Invoices module)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const toggleRowExpand = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Receipt / Voucher (Dekont Göster) Modal State
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [isReceiptWhatsAppOpen, setIsReceiptWhatsAppOpen] = useState(false);

  // Helper to find contact by ID or Name
  const findContactInfo = (contactId?: string, contactName?: string) => {
    if (!contactId && !contactName) return undefined;
    const safeTarget = String(contactName || "").trim().toLowerCase();
    return contacts.find(
      (c) =>
        (contactId && c.id === contactId) ||
        (safeTarget && (String(c.name || "").trim().toLowerCase() === safeTarget || String(c.companyTitle || "").trim().toLowerCase() === safeTarget))
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

  const handleShowFisReceipt = (tx: Transaction) => {
    const matchedContact = findContactInfo(tx.contactId, tx.contactName);
    const isIncome = tx.type === "income" || tx.type === "collection";
    const resolvedFisType =
      tx.fisType ||
      ((tx.documentNo || "").startsWith("FIS-GDR") || (tx.totalVat && tx.totalVat > 0)
        ? "gider_fisi"
        : (tx.documentNo || "").startsWith("FIS-MHS") || (tx.category || "").toLowerCase().includes("mahsup")
        ? "mahsup"
        : isIncome
        ? "tahsilat"
        : "tediye");

    const titleMap: Record<string, string> = {
      tahsilat: "TAHSİLAT FİŞİ MAKBUZU / DEKONTU",
      tediye: "TEDİYE (ÖDEME) FİŞİ MAKBUZU / DEKONTU",
      gider_fisi: "PERAKENDE GİDER / MASRAF FİŞİ BELGESİ",
      mahsup: "MUHASEBE MAHSUP FİŞİ BELGESİ",
    };

    const typeLabelMap: Record<string, string> = {
      tahsilat: "Tahsilat Fişi (Giriş +)",
      tediye: "Tediye / Ödeme Fişi (Çıkış -)",
      gider_fisi: "Perakende Harcama / Masraf Fişi (Çıkış -)",
      mahsup: `Mahsup Fişi (${isIncome ? "Alacak +" : "Borç -"})`,
    };

    setReceiptData({
      documentTitle: titleMap[resolvedFisType] || "FİNANS FİŞİ BELGESİ",
      subTitle: "Finans & Ön Muhasebe Fiş Kayıt Belgesi",
      documentNo: tx.documentNo || `FIS-${tx.id.slice(0, 8).toUpperCase()}`,
      date: formatDate(tx.date),
      time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      moduleType: "fis",
      accountName: tx.accountName,
      contactName: tx.contactName || (matchedContact ? matchedContact.companyTitle || matchedContact.name : undefined),
      contactTaxNumber: tx.taxNumber || matchedContact?.taxNumber,
      contactTaxOffice: matchedContact?.taxOffice,
      contactPhone: matchedContact?.phone,
      contactAddress: matchedContact?.address,
      contactCity: matchedContact?.city,
      amount: tx.amount,
      currency: tx.currency || "TRY",
      type: tx.type,
      category: tx.category || "Fiş İşlemi",
      description: tx.description,
      details: [
        { label: "Fiş Türü", value: typeLabelMap[resolvedFisType] || "Finans Fişi" },
        { label: "Fiş / Belge No", value: tx.documentNo || tx.id.slice(0, 8) },
        { label: "İşlem Tarihi", value: formatDate(tx.date) },
        { label: "Kasa / Banka Hesabı", value: tx.accountName || "-" },
        { label: "İlgili Cari / Firma Unvanı", value: tx.contactName || "-" },
        ...(tx.taxNumber || matchedContact?.taxNumber
          ? [{ label: "VKN / TCKN", value: String(tx.taxNumber || matchedContact?.taxNumber) }]
          : []),
        { label: "Kategori / Masraf Kalemi", value: tx.category || "-" },
        ...(tx.paymentMethod ? [{ label: "Ödeme Yöntemi", value: tx.paymentMethod }] : []),
        ...(typeof tx.subtotal === "number" && typeof tx.totalVat === "number" && tx.totalVat > 0
          ? [
              { label: "KDV Hariç Matrah", value: formatCurrency(tx.subtotal, tx.currency || "TRY") },
              { label: `KDV Tutarı (%${tx.vatRate ?? 20})`, value: formatCurrency(tx.totalVat, tx.currency || "TRY") },
            ]
          : []),
        { label: "Açıklama / Notlar", value: tx.description || "-" },
      ],
    });
  };

  const handleExportReceiptPDF = async () => {
    const element = document.getElementById("printable-receipt");
    if (!element) {
      triggerFormErrorNotification("Yazdırılacak dekont içeriği bulunamadı.", "Yazdırma Hatası");
      return;
    }
    try {
      setIsPdfGenerating(true);
      const fileName = `Dekont_${receiptData?.documentNo || "Finans_Dekontu"}.pdf`;
      await exportElementToPDF("printable-receipt", fileName, {
        orientation: "p",
        margin: 8,
        scale: 2,
        fitToSinglePage: true,
      });
    } catch (err) {
      console.error("Dekont PDF oluşturulurken hata:", err);
      triggerFormErrorNotification("PDF belgesi oluşturulurken bir hata oluştu.", "PDF Hatası");
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handleExportReceiptExcel = () => {
    if (!receiptData) return;
    const r = receiptData;
    const headers = ["Bilgi / Alan", "Değer"];
    const rows: (string | number)[][] = [
      ["Belge Başlığı", r.documentTitle || "Finans Belgesi"],
      ["Evrak / Makbuz No", r.documentNo || "-"],
      ["İşlem Tarihi", r.date || "-"],
      ["Hesap Adı", r.accountName || "-"],
      ["İşlem Türü / Cari", r.contactName || "-"],
      ["İşlem Tutarı", formatCurrency(r.amount, r.currency || "TRY")],
      ["Para Birimi", r.currency || "TRY"],
      ["Açıklama", r.description || "-"],
    ];

    exportToExcel({
      filename: `Dekont_${r.documentNo || "Finans_Belgesi"}_${new Date().toISOString().split("T")[0]}`,
      sheetName: "Dekont Detayı",
      title: `${companySettings?.companyName || "FİRMA"} - ${r.documentTitle || "FİNANS DEKONTU"}`,
      subtitle: `Belge No: ${r.documentNo} | Tarih: ${r.date} | Tutar: ${formatCurrency(r.amount, r.currency || "TRY")}`,
      headers,
      rows,
    });
  };

  const handlePrintReceipt = async () => {
    const element = document.getElementById("printable-receipt");
    if (!element) {
      triggerFormErrorNotification("Yazdırılacak dekont içeriği bulunamadı.", "Yazdırma Hatası");
      return;
    }
    const docTitle = `Dekont_${receiptData?.documentNo || "Finans_Dekontu"}`;
    await printHtmlElement("printable-receipt", docTitle, { orientation: "portrait" });
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
      subtitle = `Vade: ${item.dueDate} - Tutar: ₺${item.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      textPayload = generateChequeShareText(item);
    } else if (docType === "note") {
      title = `Senet Bilgisi Paylaş (${item.noteNumber})`;
      subtitle = `Vade: ${item.dueDate} - Tutar: ₺${item.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      textPayload = generateNoteShareText(item);
    } else if (docType === "virman") {
      title = `Virman Transfer Dekontu Paylaş`;
      subtitle = `Tarih: ${item.date} - Tutar: ₺${item.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
    if (!String(shareConfig.recipientPhone || "").trim()) {
      triggerFormErrorNotification("Lütfen WhatsApp paylaşımı için geçerli bir telefon numarası girin.", "WhatsApp Form Uyarısı", "Telefon");
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
          setShareConfig((prev) => ({ ...prev, isOpen: false }));
        } else {
          triggerFormErrorNotification(`WhatsApp doğrudan gönderim hatası: ${res.error || "Bilinmeyen hata"}. Dilerseniz 'WhatsApp Web Linki' seçeneğini deneyebilirsiniz.`, "WhatsApp İletim Hatası");
        }
      } catch (err: any) {
        triggerFormErrorNotification("Hata: " + err.message, "WhatsApp Hatası");
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

  // New Transaction State (Kasa / Banka / POS)
  const [addTxContext, setAddTxContext] = useState<"kasa" | "banka" | "pos">("kasa");
  const [txType, setTxType] = useState<"income" | "expense">("income");
  const [txAccountId, setTxAccountId] = useState("");
  const [txContactId, setTxContactId] = useState("");
  const [txAmount, setTxAmount] = useState<number | "">("");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);
  const [txDocumentNo, setTxDocumentNo] = useState("");
  const [txCategory, setTxCategory] = useState("");
  const [txDescription, setTxDescription] = useState("");

  // Banka POS Özel Alanları
  const [posCommissionRate, setPosCommissionRate] = useState<string>("2.45");
  const [posValorDays, setPosValorDays] = useState<number>(1);
  const [posTerminalName, setPosTerminalName] = useState<string>("Fiziksel POS Terminali (Yazarkasa)");
  const [posSlipNo, setPosSlipNo] = useState<string>("");
  const [autoRecordPosCommission, setAutoRecordPosCommission] = useState<boolean>(true);

  const handleOpenAddTxModal = (
    context: "kasa" | "banka" | "pos",
    preselectedAccountId?: string,
    preselectedType: "income" | "expense" = "income",
    preselectedCategory?: string
  ) => {
    setAddTxContext(context);
    setTxType(preselectedType);
    setTxContactId("");
    setTxAmount("");
    const today = new Date().toISOString().split("T")[0];
    setTxDate(today);
    setTxDescription("");

    if (context === "kasa") {
      const defaultAcc = preselectedAccountId || selectedCashAccountId || accounts.find((a) => a.type === "cash")?.id || accounts[0]?.id || "";
      setTxAccountId(defaultAcc);
      setTxCategory(
        preselectedCategory ||
          (preselectedType === "income" ? "Kasa Tahsilat / Nakit Gelir" : "Kasa Tediye / Nakit Ödeme")
      );
      setTxDocumentNo(
        `${preselectedType === "income" ? "THS" : "TDY"}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
      );
    } else if (context === "pos") {
      const defaultAcc = preselectedAccountId || selectedBankAccountId || accounts.find((a) => a.type === "pos" || a.type === "credit_card" || a.type === "bank")?.id || accounts[0]?.id || "";
      setTxAccountId(defaultAcc);
      setTxCategory(preselectedCategory || "POS Tahsilatı (Kredi Kartı)");
      const slipCode = `SLP-${Math.floor(100000 + Math.random() * 900000)}`;
      setTxDocumentNo(slipCode);
      setPosSlipNo(slipCode);
      setPosCommissionRate("2.45");
      setPosValorDays(1);
      setPosTerminalName("Fiziksel POS Terminali (Yazarkasa)");
    } else {
      const defaultAcc =
        preselectedAccountId ||
        selectedBankAccountId ||
        accounts.find((a) => a.type === "bank" || a.type === "credit_card" || a.type === "pos")?.id ||
        accounts[0]?.id ||
        "";
      setTxAccountId(defaultAcc);
      setTxCategory(
        preselectedCategory ||
          (preselectedType === "income" ? "Banka Gelen Havale / EFT" : "Banka Giden Havale / EFT")
      );
      setTxDocumentNo(`DKN-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`);
    }

    setIsAddTxModalOpen(true);
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAccountId) {
      triggerFormErrorNotification("Lütfen işlem yapılacak hesabı seçin.", "Form Uyarısı", "Hesap");
      return;
    }
    if (!txAmount || Number(txAmount) <= 0) {
      triggerFormErrorNotification("Lütfen geçerli bir işlem tutarı girin.", "Form Uyarısı", "Tutar");
      return;
    }

    const targetAcc = accounts.find((a) => a.id === txAccountId);
    if (!targetAcc) {
      triggerFormErrorNotification("Seçilen hesap sistemde bulunamadı.", "Form Uyarısı", "Hesap");
      return;
    }

    const targetContact = contacts.find((c) => c.id === txContactId);
    const numAmount = Number(txAmount);

    let finalCategory = txCategory;
    let finalDesc = txDescription;
    const finalDocNo = String(txDocumentNo || (addTxContext === "pos" ? posSlipNo : "")).trim() || undefined;

    if (addTxContext === "pos") {
      finalCategory = txCategory || (txType === "income" ? "POS Tahsilatı" : "POS İade / İptal");
      const commRate = parseFloat(posCommissionRate) || 0;
      const commAmount = (numAmount * commRate) / 100;
      const netAmount = numAmount - commAmount;

      let valorDateStr = "";
      if (posValorDays > 0) {
        const vDate = new Date(txDate || new Date().toISOString().split("T")[0]);
        vDate.setDate(vDate.getDate() + posValorDays);
        valorDateStr = vDate.toISOString().split("T")[0];
      }

      finalDesc = [
        txDescription || (txType === "income" ? "POS Kredi Kartı Tahsilatı" : "POS İade / İptal"),
        commRate > 0 ? `Komisyon: %${commRate} (-₺${commAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })})` : null,
        commRate > 0 ? `Net Hesaba: ₺${netAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}` : null,
        valorDateStr ? `Valör: ${valorDateStr} (${posValorDays} gün)` : null,
        posTerminalName ? `Terminal: ${posTerminalName}` : null,
      ].filter(Boolean).join(" • ");
    } else if (addTxContext === "kasa") {
      finalCategory = txCategory || (txType === "income" ? "Kasa Nakit Tahsilat" : "Kasa Nakit Tediye / Ödeme");
      finalDesc = txDescription || (txType === "income" ? "Kasa Nakit Girişi" : "Kasa Nakit Çıkışı");
    } else {
      finalCategory = txCategory || (txType === "income" ? "Banka Havale / EFT Tahsilat" : "Banka Havale / EFT Ödeme");
      finalDesc = txDescription || (txType === "income" ? "Gelen Transfer / Havale" : "Gönderilen Transfer / Havale");
    }

    const nowTs = Date.now();
    const mainTxId = "tx_" + nowTs;
    const commRate = addTxContext === "pos" && autoRecordPosCommission && txType === "income" ? parseFloat(posCommissionRate) || 0 : 0;
    const commAmount = commRate > 0 ? (numAmount * commRate) / 100 : 0;
    const commTxId = commAmount > 0 ? "tx_comm_" + (nowTs + 2) : undefined;

    const newTx: Transaction = {
      id: mainTxId,
      date: txDate || new Date().toISOString().split("T")[0],
      type: txType,
      amount: numAmount,
      currency: targetAcc.currency || "TRY",
      accountId: targetAcc.id,
      accountName: targetAcc.name,
      contactId: targetContact ? targetContact.id : undefined,
      contactName: targetContact ? targetContact.name : undefined,
      linkedTransactionId: commTxId,
      category: finalCategory,
      description: finalDesc,
      documentNo: finalDocNo,
    };

    if (onAddTransaction) {
      onAddTransaction(newTx);
    }

    // POS Komisyon Kesintisini Otomatik Gider Fişi Olarak İşle
    if (commAmount > 0 && commTxId && onAddTransaction) {
      const commTx: Transaction = {
        id: commTxId,
        date: txDate || new Date().toISOString().split("T")[0],
        type: "expense",
        amount: Number(commAmount.toFixed(2)),
        currency: targetAcc.currency || "TRY",
        accountId: targetAcc.id,
        accountName: targetAcc.name,
        linkedTransactionId: mainTxId,
        category: "Banka & POS Komisyon Gideri",
        description: `POS Komisyon Kesintisi (%${commRate}) • Slip No: ${finalDocNo || "SLP"}`,
        documentNo: finalDocNo ? `KOM-${finalDocNo}` : undefined,
      };
      onAddTransaction(commTx);
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
          accountId: "portfolio_endorsement",
          accountName: "Çek / Senet Portföyü",
          contactId: targetContact.id,
          contactName: targetContact.name,
          chequeId: selectedCheque.id,
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
          accountId: "portfolio_endorsement",
          accountName: "Çek / Senet Portföyü",
          contactId: targetContact.id,
          contactName: targetContact.name,
          promissoryNoteId: selectedNote.id,
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
  const [kasaFilterType, setKasaFilterType] = useState<"all" | "income" | "expense">("all");
  const [bankFilterType, setBankFilterType] = useState<"all" | "income" | "expense" | "pos">("all");
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
  const [toAccId, setToAccId] = useState(accounts[1]?.id || contacts[0]?.id || accounts[0]?.id || "");
  const [transferAmount, setTransferAmount] = useState<number>(1000);
  const [transferDesc, setTransferDesc] = useState("Kasa Banka Virman Transferi");

  React.useEffect(() => {
    const allIds = [...accounts.map((a) => a.id), ...contacts.map((c) => c.id)];
    if (allIds.length === 0) return;
    const validFrom = allIds.includes(fromAccId) ? fromAccId : allIds[0];
    if (validFrom !== fromAccId) {
      setFromAccId(validFrom);
    }
    if (!toAccId || !allIds.includes(toAccId) || (toAccId === validFrom && allIds.length > 1)) {
      const nextTo = allIds.find((id) => id !== validFrom) || validFrom;
      if (nextTo !== toAccId) {
        setToAccId(nextTo);
      }
    }
  }, [accounts, contacts, fromAccId, toAccId]);

  // New Account Form State
  const [accName, setAccName] = useState("");
  const [accAccountHolderName, setAccAccountHolderName] = useState("");
  const [accType, setAccType] = useState<"cash" | "bank">("bank");
  const [accCurrency, setAccCurrency] = useState("TRY");
  const [accBankName, setAccBankName] = useState("");
  const [accBranchName, setAccBranchName] = useState("");
  const [accAccountNumber, setAccAccountNumber] = useState("");
  const [accIban, setAccIban] = useState("");
  const [accInitialBalance, setAccInitialBalance] = useState(0);

  // New Cheque Form State (Multi-Cheque Bordro Support)
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

  interface ChequeDraftRow {
    rowId: string;
    chequeNumber: string;
    bankName: string;
    branchName: string;
    drawerName: string;
    issueDate: string;
    dueDate: string;
    amount: number;
    currency: string;
    notes: string;
  }

  const createDefaultChequeDraftRow = (
    indexOffset = 0,
    baseRow?: Partial<ChequeDraftRow>
  ): ChequeDraftRow => {
    const baseDueMs = baseRow?.dueDate
      ? new Date(baseRow.dueDate).getTime()
      : Date.now() + 30 * 24 * 60 * 60 * 1000;
    const nextDueDate = new Date(
      baseDueMs + indexOffset * 30 * 24 * 60 * 60 * 1000
    )
      .toISOString()
      .split("T")[0];

    let nextChequeNumber = baseRow?.chequeNumber || "";
    if (nextChequeNumber && indexOffset > 0) {
      nextChequeNumber = nextChequeNumber.replace(/(\d+)$/, (match) => {
        const incremented = String(parseInt(match, 10) + indexOffset);
        return incremented.padStart(match.length, "0");
      });
    }

    return {
      rowId: `chq_row_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      chequeNumber: nextChequeNumber,
      bankName: baseRow?.bankName ?? chqBankName,
      branchName: baseRow?.branchName ?? chqBranchName,
      drawerName: baseRow?.drawerName ?? chqDrawerName,
      issueDate: baseRow?.issueDate ?? new Date().toISOString().split("T")[0],
      dueDate: nextDueDate,
      amount: baseRow?.amount ?? 5000,
      currency: baseRow?.currency ?? chqCurrency,
      notes: baseRow?.notes ?? chqNotes,
    };
  };

  const [chqBatchRows, setChqBatchRows] = useState<ChequeDraftRow[]>(() => [
    {
      rowId: "chq_row_init_1",
      chequeNumber: "",
      bankName: "",
      branchName: "",
      drawerName: "",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      amount: 5000,
      currency: "TRY",
      notes: "",
    },
  ]);

  const handleAddChequeDraftRow = (duplicateLast = false) => {
    setChqBatchRows((prev) => {
      const lastRow = prev[prev.length - 1];
      if (duplicateLast && lastRow) {
        return [...prev, createDefaultChequeDraftRow(1, lastRow)];
      }
      return [
        ...prev,
        createDefaultChequeDraftRow(1, {
          bankName: lastRow?.bankName || chqBankName,
          branchName: lastRow?.branchName || chqBranchName,
          drawerName: lastRow?.drawerName || chqDrawerName,
          issueDate: lastRow?.issueDate || chqIssueDate,
          dueDate: lastRow?.dueDate || chqDueDate,
          amount: lastRow?.amount || chqAmount,
          currency: lastRow?.currency || chqCurrency,
          notes: lastRow?.notes || chqNotes,
        }),
      ];
    });
  };

  const handleGenerateInstallmentCheques = (count: number) => {
    setChqBatchRows((prev) => {
      const seedRow = prev[prev.length - 1] || createDefaultChequeDraftRow(0);
      const generated: ChequeDraftRow[] = [];
      for (let i = 1; i <= count; i++) {
        generated.push(createDefaultChequeDraftRow(i, seedRow));
      }
      return [...prev, ...generated];
    });
  };

  const handleUpdateChequeDraftRow = <K extends keyof ChequeDraftRow>(
    rowId: string,
    field: K,
    value: ChequeDraftRow[K]
  ) => {
    setChqBatchRows((prev) =>
      prev.map((row) => (row.rowId === rowId ? { ...row, [field]: value } : row))
    );
  };

  const handleRemoveChequeDraftRow = (rowId: string) => {
    setChqBatchRows((prev) => (prev.length > 1 ? prev.filter((r) => r.rowId !== rowId) : prev));
  };

  // New Note Form State (Multi-Note Bordro Support)
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

  interface NoteDraftRow {
    rowId: string;
    noteNumber: string;
    debtorName: string;
    issueDate: string;
    dueDate: string;
    amount: number;
    currency: string;
    notes: string;
  }

  const createDefaultNoteDraftRow = (
    indexOffset = 0,
    baseRow?: Partial<NoteDraftRow>
  ): NoteDraftRow => {
    const baseDueMs = baseRow?.dueDate
      ? new Date(baseRow.dueDate).getTime()
      : Date.now() + 60 * 24 * 60 * 60 * 1000;
    const nextDueDate = new Date(
      baseDueMs + indexOffset * 30 * 24 * 60 * 60 * 1000
    )
      .toISOString()
      .split("T")[0];

    let nextNoteNumber = baseRow?.noteNumber || "";
    if (nextNoteNumber && indexOffset > 0) {
      nextNoteNumber = nextNoteNumber.replace(/(\d+)$/, (match) => {
        const incremented = String(parseInt(match, 10) + indexOffset);
        return incremented.padStart(match.length, "0");
      });
    }

    return {
      rowId: `nt_row_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      noteNumber: nextNoteNumber,
      debtorName: baseRow?.debtorName ?? ntDebtorName,
      issueDate: baseRow?.issueDate ?? new Date().toISOString().split("T")[0],
      dueDate: nextDueDate,
      amount: baseRow?.amount ?? 10000,
      currency: baseRow?.currency ?? ntCurrency,
      notes: baseRow?.notes ?? ntNotes,
    };
  };

  const [ntBatchRows, setNtBatchRows] = useState<NoteDraftRow[]>(() => [
    {
      rowId: "nt_row_init_1",
      noteNumber: "",
      debtorName: "",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      amount: 10000,
      currency: "TRY",
      notes: "",
    },
  ]);

  const handleAddNoteDraftRow = (duplicateLast = false) => {
    setNtBatchRows((prev) => {
      const lastRow = prev[prev.length - 1];
      if (duplicateLast && lastRow) {
        return [...prev, createDefaultNoteDraftRow(1, lastRow)];
      }
      return [
        ...prev,
        createDefaultNoteDraftRow(1, {
          debtorName: lastRow?.debtorName || ntDebtorName,
          issueDate: lastRow?.issueDate || ntIssueDate,
          dueDate: lastRow?.dueDate || ntDueDate,
          amount: lastRow?.amount || ntAmount,
          currency: lastRow?.currency || ntCurrency,
          notes: lastRow?.notes || ntNotes,
        }),
      ];
    });
  };

  const handleGenerateInstallmentNotes = (count: number) => {
    setNtBatchRows((prev) => {
      const seedRow = prev[prev.length - 1] || createDefaultNoteDraftRow(0);
      const generated: NoteDraftRow[] = [];
      for (let i = 1; i <= count; i++) {
        generated.push(createDefaultNoteDraftRow(i, seedRow));
      }
      return [...prev, ...generated];
    });
  };

  const handleUpdateNoteDraftRow = <K extends keyof NoteDraftRow>(
    rowId: string,
    field: K,
    value: NoteDraftRow[K]
  ) => {
    setNtBatchRows((prev) =>
      prev.map((row) => (row.rowId === rowId ? { ...row, [field]: value } : row))
    );
  };

  const handleRemoveNoteDraftRow = (rowId: string) => {
    setNtBatchRows((prev) => (prev.length > 1 ? prev.filter((r) => r.rowId !== rowId) : prev));
  };

  // Totals
  const totalCashBalance = accounts
    .filter((a) => a.type === "cash")
    .reduce((sum, a) => sum + a.balance, 0);

  const totalBankBalance = accounts
    .filter((a) => a.type === "bank" || a.type === "credit_card" || a.type === "pos")
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
    const resolvedName =
      String(accName || "").trim() ||
      String(accAccountHolderName || "").trim() ||
      (accType === "bank" && String(accBankName || "").trim()
        ? `${accBankName.trim()} (${accCurrency})`
        : accType === "cash"
        ? `Nakit Kasa (${accCurrency})`
        : `Banka Hesabı (${accCurrency})`);

    const newAcc: Account = {
      id: "acc_" + Date.now(),
      name: resolvedName,
      accountHolderName:
        accType === "bank"
          ? String(accAccountHolderName || accName || companySettings?.companyTitle || companySettings?.companyName || "").trim() || undefined
          : undefined,
      type: accType,
      currency: accCurrency,
      balance: accInitialBalance,
      bankName: accType === "bank" ? accBankName.trim() || undefined : undefined,
      branchName: accType === "bank" ? accBranchName.trim() || undefined : undefined,
      accountNumber: accType === "bank" ? accAccountNumber.trim() || undefined : undefined,
      iban: accType === "bank" ? accIban.trim() || undefined : undefined,
    };

    onAddAccount(newAcc);
    handleBackToList();
    setAccName("");
    setAccAccountHolderName("");
    setAccBankName("");
    setAccBranchName("");
    setAccAccountNumber("");
    setAccIban("");
    setAccInitialBalance(0);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAccId) {
      triggerFormErrorNotification("Lütfen borçlu (kaynak) hesabı seçin.", "Virman Uyarısı", "Kaynak Hesap");
      return;
    }
    if (!toAccId) {
      triggerFormErrorNotification("Lütfen alacaklı (hedef) hesabı seçin.", "Virman Uyarısı", "Hedef Hesap");
      return;
    }
    if (fromAccId === toAccId) {
      triggerFormErrorNotification("Kaynak ve hedef hesap aynı olamaz. Lütfen farklı iki hesap seçin.", "Virman Uyarısı");
      return;
    }
    if (!transferAmount || transferAmount <= 0) {
      triggerFormErrorNotification("Lütfen geçerli bir transfer tutarı girin.", "Virman Uyarısı", "Tutar");
      return;
    }

    onTransferBetweenAccounts(fromAccId, toAccId, transferAmount, transferDesc);
    handleBackToList();
    setTransferAmount(0);
    setTransferDesc("");
  };

  const handleSaveCheque = (e: React.FormEvent) => {
    e.preventDefault();

    if (chqBatchRows.length === 0) {
      triggerFormErrorNotification("Lütfen en az bir çek satırı ekleyin.", "Çek Uyarısı");
      return;
    }

    for (let i = 0; i < chqBatchRows.length; i++) {
      const row = chqBatchRows[i];
      if (!String(row.chequeNumber || "").trim()) {
        triggerFormErrorNotification(
          `Lütfen ${i + 1}. sıradaki çekin numarasını girin.`,
          "Çek Uyarısı",
          `#${i + 1} Çek No`
        );
        return;
      }
      if (!row.amount || row.amount <= 0) {
        triggerFormErrorNotification(
          `Lütfen ${i + 1}. sıradaki çek için geçerli bir tutar girin.`,
          "Çek Uyarısı",
          `#${i + 1} Tutar`
        );
        return;
      }
      if (!row.dueDate) {
        triggerFormErrorNotification(
          `Lütfen ${i + 1}. sıradaki çekin vade tarihini seçin.`,
          "Çek Uyarısı",
          `#${i + 1} Vade Tarihi`
        );
        return;
      }
    }

    const selectedContact = contacts.find((c) => c.id === chqContactId);
    const baseTime = Date.now();

    chqBatchRows.forEach((row, idx) => {
      const resolvedBank = String(row.bankName || chqBankName || "").trim() || "Garanti BBVA";
      const resolvedBranch = String(row.branchName || chqBranchName || "").trim();
      const resolvedDrawer =
        String(row.drawerName || chqDrawerName || "").trim() ||
        selectedContact?.name ||
        "Bilinmiyor";
      const resolvedNotes = String(row.notes || chqNotes || "").trim();

      const newChq: Cheque = {
        id: `chq_${baseTime}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
        type: chqType,
        chequeNumber: row.chequeNumber.trim(),
        bankName: resolvedBank,
        branchName: resolvedBranch,
        drawerName: resolvedDrawer,
        contactId: chqContactId || undefined,
        contactName: selectedContact?.name || resolvedDrawer || "Genel Cari",
        issueDate: row.issueDate || chqIssueDate,
        dueDate: row.dueDate,
        amount: Number(row.amount) || 0,
        currency: row.currency || chqCurrency || "TRY",
        status: "portfolio",
        notes: resolvedNotes,
      };

      if (onAddCheque) onAddCheque(newChq);
    });

    setIsChequeModalOpen(false);
    setChqNumber("");
    setChqBankName("");
    setChqBranchName("");
    setChqDrawerName("");
    setChqNotes("");
    setChqBatchRows([
      {
        rowId: `chq_row_reset_${Date.now()}`,
        chequeNumber: "",
        bankName: "",
        branchName: "",
        drawerName: "",
        issueDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        amount: 5000,
        currency: "TRY",
        notes: "",
      },
    ]);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();

    if (ntBatchRows.length === 0) {
      triggerFormErrorNotification("Lütfen en az bir senet satırı ekleyin.", "Senet Uyarısı");
      return;
    }

    for (let i = 0; i < ntBatchRows.length; i++) {
      const row = ntBatchRows[i];
      if (!String(row.noteNumber || "").trim()) {
        triggerFormErrorNotification(
          `Lütfen ${i + 1}. sıradaki senedin numarasını girin.`,
          "Senet Uyarısı",
          `#${i + 1} Senet No`
        );
        return;
      }
      if (!row.amount || row.amount <= 0) {
        triggerFormErrorNotification(
          `Lütfen ${i + 1}. sıradaki senet için geçerli bir tutar girin.`,
          "Senet Uyarısı",
          `#${i + 1} Tutar`
        );
        return;
      }
      if (!row.dueDate) {
        triggerFormErrorNotification(
          `Lütfen ${i + 1}. sıradaki senedin vade tarihini seçin.`,
          "Senet Uyarısı",
          `#${i + 1} Vade Tarihi`
        );
        return;
      }
    }

    const selectedContact = contacts.find((c) => c.id === ntContactId);
    const baseTime = Date.now();

    ntBatchRows.forEach((row, idx) => {
      const resolvedDebtor =
        String(row.debtorName || ntDebtorName || "").trim() ||
        selectedContact?.name ||
        "Bilinmiyor";
      const resolvedNotes = String(row.notes || ntNotes || "").trim();

      const newNt: PromissoryNote = {
        id: `nt_${baseTime}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
        type: ntType,
        noteNumber: row.noteNumber.trim(),
        debtorName: resolvedDebtor,
        contactId: ntContactId || undefined,
        contactName: selectedContact?.name || resolvedDebtor || "Genel Cari",
        issueDate: row.issueDate || ntIssueDate,
        dueDate: row.dueDate,
        amount: Number(row.amount) || 0,
        currency: row.currency || ntCurrency || "TRY",
        status: "portfolio",
        notes: resolvedNotes,
      };

      if (onAddPromissoryNote) onAddPromissoryNote(newNt);
    });

    setIsNoteModalOpen(false);
    setNtNumber("");
    setNtDebtorName("");
    setNtNotes("");
    setNtBatchRows([
      {
        rowId: `nt_row_reset_${Date.now()}`,
        noteNumber: "",
        debtorName: "",
        issueDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        amount: 10000,
        currency: "TRY",
        notes: "",
      },
    ]);
  };

  // Filtered lists with Date Range & Search filtering
  const activeSearchQuery = (globalSearchTerm || searchQuery).toLowerCase().trim();

  // Sütun Bazlı Filtreleme Durumu - Kasa
  const [kasaColFilters, setKasaColFilters] = useState<{
    date: string;
    documentNo: string;
    accountName: string;
    contact: string;
    description: string;
    amount: string;
  }>({
    date: "",
    documentNo: "",
    accountName: "",
    contact: "",
    description: "",
    amount: "",
  });
  const [showKasaColFilters, setShowKasaColFilters] = useState(false);

  const activeKasaColFilterCount = (Object.values(kasaColFilters) as string[]).filter((v) => Boolean(v && typeof v === "string" && v.trim() !== "")).length;

  const clearAllKasaColFilters = () => {
    setKasaColFilters({
      date: "",
      documentNo: "",
      accountName: "",
      contact: "",
      description: "",
      amount: "",
    });
  };

  // Sütun Bazlı Filtreleme Durumu - Banka
  const [bankColFilters, setBankColFilters] = useState<{
    date: string;
    documentNo: string;
    accountName: string;
    contact: string;
    description: string;
    amount: string;
  }>({
    date: "",
    documentNo: "",
    accountName: "",
    contact: "",
    description: "",
    amount: "",
  });
  const [showBankColFilters, setShowBankColFilters] = useState(false);

  const activeBankColFilterCount = (Object.values(bankColFilters) as string[]).filter((v) => Boolean(v && typeof v === "string" && v.trim() !== "")).length;

  const clearAllBankColFilters = () => {
    setBankColFilters({
      date: "",
      documentNo: "",
      accountName: "",
      contact: "",
      description: "",
      amount: "",
    });
  };

  const kasaTransactions = transactions
    .filter((t) => {
      const acc = accounts.find((a) => a.id === t.accountId);
      if (acc?.type !== "cash") return false;
      if (selectedCashAccountId && t.accountId !== selectedCashAccountId) return false;
      if (kasaFilterType === "income" && t.type !== "income" && t.type !== "collection") return false;
      if (kasaFilterType === "expense" && t.type !== "expense" && t.type !== "payment") return false;
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
      // Sütun bazlı filtreler
      if (kasaColFilters.date && !t.date.toLowerCase().includes(kasaColFilters.date.toLowerCase().trim())) return false;
      if (kasaColFilters.documentNo && !(t.documentNo || "").toLowerCase().includes(kasaColFilters.documentNo.toLowerCase().trim())) return false;
      if (kasaColFilters.accountName && !(t.accountName || "").toLowerCase().includes(kasaColFilters.accountName.toLowerCase().trim())) return false;
      if (kasaColFilters.contact) {
        const q = kasaColFilters.contact.toLowerCase().trim();
        const match = (t.contactName || "").toLowerCase().includes(q) || (t.category || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      if (kasaColFilters.description && !(t.description || "").toLowerCase().includes(kasaColFilters.description.toLowerCase().trim())) return false;
      if (kasaColFilters.amount) {
        const q = kasaColFilters.amount.toLowerCase().trim();
        const amtStr = (t.amount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 });
        if (!amtStr.includes(q) && !String(t.amount).includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const bankTransactions = transactions
    .filter((t) => {
      const acc = accounts.find((a) => a.id === t.accountId);
      if (acc?.type !== "bank" && acc?.type !== "credit_card" && acc?.type !== "pos") return false;
      if (selectedBankAccountId && t.accountId !== selectedBankAccountId) return false;
      if (bankFilterType === "income" && t.type !== "income" && t.type !== "collection") return false;
      if (bankFilterType === "expense" && t.type !== "expense" && t.type !== "payment") return false;
      if (bankFilterType === "pos") {
        const cat = (t.category || "").toLowerCase();
        const desc = (t.description || "").toLowerCase();
        const doc = (t.documentNo || "").toLowerCase();
        if (!cat.includes("pos") && !desc.includes("pos") && !doc.startsWith("slp-")) return false;
      }
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
      // Sütun bazlı filtreler
      if (bankColFilters.date && !t.date.toLowerCase().includes(bankColFilters.date.toLowerCase().trim())) return false;
      if (bankColFilters.documentNo && !(t.documentNo || "").toLowerCase().includes(bankColFilters.documentNo.toLowerCase().trim())) return false;
      if (bankColFilters.accountName && !(t.accountName || "").toLowerCase().includes(bankColFilters.accountName.toLowerCase().trim())) return false;
      if (bankColFilters.contact) {
        const q = bankColFilters.contact.toLowerCase().trim();
        const match = (t.contactName || "").toLowerCase().includes(q) || (t.category || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      if (bankColFilters.description && !(t.description || "").toLowerCase().includes(bankColFilters.description.toLowerCase().trim())) return false;
      if (bankColFilters.amount) {
        const q = bankColFilters.amount.toLowerCase().trim();
        const amtStr = (t.amount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 });
        if (!amtStr.includes(q) && !String(t.amount).includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Sütun Bazlı Filtreleme Durumu - Çekler
  const [chequeColFilters, setChequeColFilters] = useState<{
    noType: string;
    bank: string;
    contact: string;
    dueDate: string;
    amount: string;
    status: string;
  }>({
    noType: "",
    bank: "",
    contact: "",
    dueDate: "",
    amount: "",
    status: "",
  });
  const [showChequeColFilters, setShowChequeColFilters] = useState(true);

  const activeChequeColFilterCount = (Object.values(chequeColFilters) as string[]).filter((v) => Boolean(v && typeof v === "string" && v.trim() !== "")).length;

  const clearAllChequeColFilters = () => {
    setChequeColFilters({
      noType: "",
      bank: "",
      contact: "",
      dueDate: "",
      amount: "",
      status: "",
    });
  };

  // Sütun Bazlı Filtreleme Durumu - Senetler
  const [noteColFilters, setNoteColFilters] = useState<{
    noType: string;
    debtor: string;
    issueDate: string;
    dueDate: string;
    amount: string;
    status: string;
  }>({
    noType: "",
    debtor: "",
    issueDate: "",
    dueDate: "",
    amount: "",
    status: "",
  });
  const [showNoteColFilters, setShowNoteColFilters] = useState(true);

  const activeNoteColFilterCount = (Object.values(noteColFilters) as string[]).filter((v) => Boolean(v && typeof v === "string" && v.trim() !== "")).length;

  const clearAllNoteColFilters = () => {
    setNoteColFilters({
      noType: "",
      debtor: "",
      issueDate: "",
      dueDate: "",
      amount: "",
      status: "",
    });
  };

  const filteredCheques = cheques.filter((c) => {
    // Sütun Bazlı Filtreler (Header Inputs)
    if (chequeColFilters.noType) {
      const q = chequeColFilters.noType.toLowerCase().trim();
      const numStr = (c.chequeNumber || "").toLowerCase();
      const typeStr = c.type === "received" ? "alınan müşteri çeki" : "verilen firma çeki";
      if (!numStr.includes(q) && !typeStr.includes(q)) return false;
    }

    if (chequeColFilters.bank) {
      const q = chequeColFilters.bank.toLowerCase().trim();
      const bStr = `${c.bankName || ""} ${c.branchName || ""}`.toLowerCase();
      if (!bStr.includes(q)) return false;
    }

    if (chequeColFilters.contact) {
      const q = chequeColFilters.contact.toLowerCase().trim();
      const cStr = `${c.contactName || ""} ${c.drawer || ""}`.toLowerCase();
      if (!cStr.includes(q)) return false;
    }

    if (chequeColFilters.dueDate) {
      const q = chequeColFilters.dueDate.toLowerCase().trim();
      const dueStr = (c.dueDate || "").toLowerCase();
      if (!dueStr.includes(q)) return false;
    }

    if (chequeColFilters.amount) {
      const q = chequeColFilters.amount.toLowerCase().trim();
      const amtFormatted = (c.amount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 });
      if (!amtFormatted.includes(q) && !String(c.amount).includes(q)) return false;
    }

    if (chequeColFilters.status) {
      const q = chequeColFilters.status.toLowerCase().trim();
      const statusMap: Record<string, string> = {
        portfolio: "portföyde bekliyor",
        endorsed: "ciro edildi",
        collected: "tahsil edildi ödendi",
        bounced: "karşılıksız",
      };
      const stText = statusMap[c.status] || c.status;
      if (!stText.includes(q)) return false;
    }

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
    // Sütun Bazlı Filtreler (Header Inputs)
    if (noteColFilters.noType) {
      const q = noteColFilters.noType.toLowerCase().trim();
      const numStr = (n.noteNumber || "").toLowerCase();
      const typeStr = n.type === "received" ? "alınan müşteri senedi" : "verilen firma senedi";
      if (!numStr.includes(q) && !typeStr.includes(q)) return false;
    }

    if (noteColFilters.debtor) {
      const q = noteColFilters.debtor.toLowerCase().trim();
      const dStr = `${n.debtorName || ""} ${n.contactName || ""}`.toLowerCase();
      if (!dStr.includes(q)) return false;
    }

    if (noteColFilters.issueDate) {
      const q = noteColFilters.issueDate.toLowerCase().trim();
      const isStr = (n.issueDate || "").toLowerCase();
      if (!isStr.includes(q)) return false;
    }

    if (noteColFilters.dueDate) {
      const q = noteColFilters.dueDate.toLowerCase().trim();
      const dueStr = (n.dueDate || "").toLowerCase();
      if (!dueStr.includes(q)) return false;
    }

    if (noteColFilters.amount) {
      const q = noteColFilters.amount.toLowerCase().trim();
      const amtFormatted = (n.amount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 });
      if (!amtFormatted.includes(q) && !String(n.amount).includes(q)) return false;
    }

    if (noteColFilters.status) {
      const q = noteColFilters.status.toLowerCase().trim();
      const statusMap: Record<string, string> = {
        portfolio: "portföyde bekliyor",
        endorsed: "ciro edildi",
        collected: "tahsil edildi ödendi",
        protested: "protestolu",
      };
      const stText = statusMap[n.status] || n.status;
      if (!stText.includes(q)) return false;
    }

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

  // =========================================================================
  // FİŞ GİRİŞİ (SUB-MODULE 6) STATE & HANDLERS
  // =========================================================================
  const generateFisNumber = (type: "tahsilat" | "tediye" | "gider_fisi" | "mahsup") => {
    const prefixMap = {
      tahsilat: "FIS-THS",
      tediye: "FIS-TDY",
      gider_fisi: "FIS-GDR",
      mahsup: "FIS-MHS",
    };
    return `${prefixMap[type]}-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  };

  const [fisEntryMode, setFisEntryMode] = useState<"multi" | "single">("multi");
  const [isMultiFisFullPage, setIsMultiFisFullPage] = useState<boolean>(true);

  React.useEffect(() => {
    if (standaloneFisSubTab === "fis_girisi" && fisEntryMode === "multi") {
      setIsMultiFisFullPage(true);
    } else if (standaloneFisSubTab === "fis_listesi") {
      setIsMultiFisFullPage(false);
    }
  }, [standaloneFisSubTab, fisEntryMode]);
  const [fisType, setFisType] = useState<"tahsilat" | "tediye" | "gider_fisi" | "mahsup">("mahsup");
  const [fisDirection, setFisDirection] = useState<"income" | "expense">("expense"); // Mahsup fişi yönü için
  const [fisNo, setFisNo] = useState<string>(() => generateFisNumber("mahsup"));
  const [fisDate, setFisDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [fisAccountId, setFisAccountId] = useState<string>(accounts[0]?.id || "");
  const [fisContactId, setFisContactId] = useState<string>("");
  const [fisCustomTitle, setFisCustomTitle] = useState<string>("");
  const [fisTaxNumber, setFisTaxNumber] = useState<string>("");
  const [fisCategory, setFisCategory] = useState<string>("Mahsup Fişi");
  const [fisPaymentMethod, setFisPaymentMethod] = useState<string>("Cari Mahsup");
  const [fisAmount, setFisAmount] = useState<number | "">("");
  const [fisVatRate, setFisVatRate] = useState<number>(0);
  const [fisVatIncluded, setFisVatIncluded] = useState<boolean>(true);
  const [fisDescription, setFisDescription] = useState<string>("");
  const [fisFilterType, setFisFilterType] = useState<"all" | "tahsilat" | "tediye" | "gider_fisi" | "mahsup">("all");
  const [showFisColFilters, setShowFisColFilters] = useState<boolean>(false);
  const [fisColFilters, setFisColFilters] = useState<{
    date: string;
    documentNo: string;
    fisType: string;
    accountName: string;
    contact: string;
    description: string;
    amount: string;
  }>({
    date: "",
    documentNo: "",
    fisType: "",
    accountName: "",
    contact: "",
    description: "",
    amount: "",
  });

  // =========================================================================
  // ÇOKLU FİŞ GİRİŞİ (TABLO / SPREADSHEET) STATE & HANDLERS
  // =========================================================================
  interface MultiFisRow {
    id: string;
    hesapKey: string; // "acc:<id>" | "cnt:<id>" | "exp:<name>" | "tdhp:<code>" | ""
    hesapLabel: string;
    belgeTarihi: string;
    belgeNo: string;
    belgeTuru: string;
    bta: string;
    vadeTarihi: string;
    vknTckn: string;
    aciklama: string;
    borc: number | "";
    alacak: number | "";
    odemeTuru: string;
  }

  const createEmptyMultiFisRow = (index = 1, defaultDate?: string, defaultDocNo?: string): MultiFisRow => ({
    id: `mf_row_${Date.now()}_${ index }_${Math.random().toString(36).slice(2, 7)}`,
    hesapKey: "",
    hesapLabel: "",
    belgeTarihi: defaultDate || new Date().toISOString().split("T")[0],
    belgeNo: defaultDocNo || "",
    belgeTuru: "Fatura",
    bta: "",
    vadeTarihi: defaultDate || new Date().toISOString().split("T")[0],
    vknTckn: "",
    aciklama: "",
    borc: "",
    alacak: "",
    odemeTuru: "Nakit",
  });

  const [multiFisRows, setMultiFisRows] = useState<MultiFisRow[]>(() => {
    const today = new Date().toISOString().split("T")[0];
    return Array.from({ length: 12 }, (_, idx) =>
      createEmptyMultiFisRow(idx + 1, today, "")
    );
  });
  const [activeMultiFisRowId, setActiveMultiFisRowId] = useState<string>("");
  const [openHesapDropdownRowId, setOpenHesapDropdownRowId] = useState<string | null>(null);
  const [showMultiFisGridFilters, setShowMultiFisGridFilters] = useState<boolean>(false);
  const [multiFisGridFilters, setMultiFisGridFilters] = useState<{
    hesap: string;
    belgeTarihi: string;
    belgeNo: string;
    belgeTuru: string;
    bta: string;
    vadeTarihi: string;
    vknTckn: string;
    aciklama: string;
    borc: string;
    alacak: string;
    odemeTuru: string;
  }>({
    hesap: "",
    belgeTarihi: "",
    belgeNo: "",
    belgeTuru: "",
    bta: "",
    vadeTarihi: "",
    vknTckn: "",
    aciklama: "",
    borc: "",
    alacak: "",
    odemeTuru: "",
  });

  React.useEffect(() => {
    if (!activeMultiFisRowId && multiFisRows.length > 0) {
      setActiveMultiFisRowId(multiFisRows[0].id);
    }
  }, [multiFisRows, activeMultiFisRowId]);

  // Çoklu Fiş Girişi Hesap Seçenekleri (Kasa, Banka, Cari, Gider & Tek Düzen Hesap Planı)
  const multiFisAccountOptions = React.useMemo(() => {
    const cashOpts = accounts
      .filter((a) => a.type === "cash")
      .map((a, idx) => ({
        key: `acc:${a.id}`,
        code: `100.0${idx + 1}`,
        label: `100.0${idx + 1} - ${a.name}`,
        group: "100 - Nakit Kasalar",
        taxNumber: "",
        accountId: a.id,
      }));
    const bankOpts = accounts
      .filter((a) => a.type !== "cash")
      .map((a, idx) => ({
        key: `acc:${a.id}`,
        code: a.type === "pos" || a.type === "credit_card" ? `108.0${idx + 1}` : `102.0${idx + 1}`,
        label: `${a.type === "pos" || a.type === "credit_card" ? `108.0${idx + 1}` : `102.0${idx + 1}`} - ${a.name}`,
        group: "102 / 108 - Banka & POS Hesapları",
        taxNumber: "",
        accountId: a.id,
      }));
    const contactOpts = contacts.map((c, idx) => {
      const code = c.accountCode || (c.contactType === "vendor" || c.contactType === "supplier" ? `320.01.${String(idx + 1).padStart(3, "0")}` : `120.01.${String(idx + 1).padStart(3, "0")}`);
      return {
        key: `cnt:${c.id}`,
        code,
        label: `${code} - ${c.name}`,
        group: "120 / 320 - Cari Hesaplar (Müşteri & Tedarikçi)",
        taxNumber: c.taxNumber || "",
        contactId: c.id,
      };
    });
    const expenseAndTdhpOpts = [
      { key: "tdhp:191.01", code: "191.01", label: "191.01 - İndirilecek KDV (%1)", group: "191 / 391 / 600 / 770 - Muhasebe & Gider Hesapları", taxNumber: "" },
      { key: "tdhp:191.10", code: "191.10", label: "191.10 - İndirilecek KDV (%10)", group: "191 / 391 / 600 / 770 - Muhasebe & Gider Hesapları", taxNumber: "" },
      { key: "tdhp:191.20", code: "191.20", label: "191.20 - İndirilecek KDV (%20)", group: "191 / 391 / 600 / 770 - Muhasebe & Gider Hesapları", taxNumber: "" },
      { key: "tdhp:391.20", code: "391.20", label: "391.20 - Hesaplanan KDV (%20)", group: "191 / 391 / 600 / 770 - Muhasebe & Gider Hesapları", taxNumber: "" },
      { key: "tdhp:600.01", code: "600.01", label: "600.01 - Yurtiçi Satışlar", group: "191 / 391 / 600 / 770 - Muhasebe & Gider Hesapları", taxNumber: "" },
      { key: "tdhp:335.01", code: "335.01", label: "335.01 - Personele Borçlar / Maaş & Avans", group: "191 / 391 / 600 / 770 - Muhasebe & Gider Hesapları", taxNumber: "" },
      { key: "tdhp:360.01", code: "360.01", label: "360.01 - Ödenecek Vergi ve Fonlar", group: "191 / 391 / 600 / 770 - Muhasebe & Gider Hesapları", taxNumber: "" },
      { key: "tdhp:361.01", code: "361.01", label: "361.01 - Ödenecek Sosyal Güvenlik Kesintileri", group: "191 / 391 / 600 / 770 - Muhasebe & Gider Hesapları", taxNumber: "" },
      ...EXPENSE_CATEGORIES.map((cat, idx) => ({
        key: `exp:${cat}`,
        code: `770.${String(idx + 1).padStart(2, "0")}`,
        label: `770.${String(idx + 1).padStart(2, "0")} - ${cat}`,
        group: "191 / 391 / 600 / 770 - Muhasebe & Gider Hesapları",
        taxNumber: "",
      })),
    ];

    let customTdhpOpts: { key: string; code: string; label: string; group: string; taxNumber: string }[] = [];
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem("muavin_hesap_plani_custom_v1");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            customTdhpOpts = parsed.map((item: any) => ({
              key: `tdhp:${item.code}`,
              code: String(item.code || ""),
              label: `${item.code} - ${item.name}`,
              group: "Özel Tanımlı Hesap Planı (TDHP)",
              taxNumber: String(item.taxNumber || ""),
            }));
          }
        }
      } catch {
        // ignore storage parse error
      }
    }

    return [...cashOpts, ...bankOpts, ...contactOpts, ...expenseAndTdhpOpts, ...customTdhpOpts];
  }, [accounts, contacts]);

  const updateMultiFisRow = (rowId: string, patch: Partial<MultiFisRow>) => {
    setMultiFisRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, ...patch } : r))
    );
  };

  const handleSelectMultiFisHesap = (rowId: string, optionKey: string) => {
    const found = multiFisAccountOptions.find((o) => o.key === optionKey);
    if (!found) return;
    setMultiFisRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        return {
          ...r,
          hesapKey: found.key,
          hesapLabel: found.label,
          vknTckn: found.taxNumber ? found.taxNumber : r.vknTckn,
        };
      })
    );
    setOpenHesapDropdownRowId(null);
  };

  const handleAddMultiFisRow = (afterRowId?: string) => {
    setMultiFisRows((prev) => {
      const refRow = afterRowId
        ? prev.find((r) => r.id === afterRowId)
        : prev[prev.length - 1];
      const newRow: MultiFisRow = {
        ...createEmptyMultiFisRow(prev.length + 1, refRow?.belgeTarihi || fisDate, refRow?.belgeNo || ""),
        belgeTuru: refRow?.belgeTuru || "Fatura",
        vadeTarihi: refRow?.vadeTarihi || refRow?.belgeTarihi || fisDate,
        odemeTuru: refRow?.odemeTuru || "Nakit",
      };
      if (!afterRowId) {
        setActiveMultiFisRowId(newRow.id);
        return [...prev, newRow];
      }
      const idx = prev.findIndex((r) => r.id === afterRowId);
      if (idx === -1) {
        setActiveMultiFisRowId(newRow.id);
        return [...prev, newRow];
      }
      const next = [...prev];
      next.splice(idx + 1, 0, newRow);
      setActiveMultiFisRowId(newRow.id);
      return next;
    });
  };

  const handleDuplicateMultiFisRow = (rowId: string) => {
    setMultiFisRows((prev) => {
      const idx = prev.findIndex((r) => r.id === rowId);
      if (idx === -1) return prev;
      const source = prev[idx];
      const copy: MultiFisRow = {
        ...source,
        id: `mf_row_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      setActiveMultiFisRowId(copy.id);
      return next;
    });
  };

  const handleRemoveMultiFisRow = (rowId: string) => {
    setMultiFisRows((prev) => {
      if (prev.length <= 1) {
        const fresh = createEmptyMultiFisRow(1, fisDate, "");
        setActiveMultiFisRowId(fresh.id);
        return [fresh];
      }
      const filtered = prev.filter((r) => r.id !== rowId);
      if (activeMultiFisRowId === rowId && filtered.length > 0) {
        setActiveMultiFisRowId(filtered[filtered.length - 1].id);
      }
      return filtered;
    });
  };

  const multiFisTotals = React.useMemo(() => {
    let totalBorc = 0;
    let totalAlacak = 0;
    let filledRowCount = 0;
    for (const r of multiFisRows) {
      const b = Number(r.borc) || 0;
      const a = Number(r.alacak) || 0;
      totalBorc += b;
      totalAlacak += a;
      if (b > 0 || a > 0 || r.hesapLabel.trim() || r.aciklama.trim() || r.belgeNo.trim()) {
        filledRowCount++;
      }
    }
    const diff = Number((totalBorc - totalAlacak).toFixed(2));
    return {
      totalBorc: Number(totalBorc.toFixed(2)),
      totalAlacak: Number(totalAlacak.toFixed(2)),
      diff,
      isBalanced: Math.abs(diff) < 0.01 && (totalBorc > 0 || totalAlacak > 0),
      filledRowCount,
    };
  }, [multiFisRows]);

  // Bakiye Eşitle / Karşı Hesap Satırı Oluştur
  const handleBalanceMultiFisRows = () => {
    const { diff } = multiFisTotals;
    if (Math.abs(diff) < 0.01) return;

    const defaultAcc = accounts.find((a) => a.id === fisAccountId) || accounts[0];
    const defaultOpt = defaultAcc
      ? multiFisAccountOptions.find((o) => o.key === `acc:${defaultAcc.id}`)
      : undefined;

    const lastFilled = [...multiFisRows].reverse().find((r) => Number(r.borc) > 0 || Number(r.alacak) > 0);

    setMultiFisRows((prev) => {
      // Boş bir satır varsa onu doldur, yoksa yeni satır ekle
      const emptyIdx = prev.findIndex(
        (r) => !r.hesapLabel.trim() && (Number(r.borc) || 0) === 0 && (Number(r.alacak) || 0) === 0
      );
      const balanceRowPatch: Partial<MultiFisRow> = {
        hesapKey: defaultOpt?.key || (defaultAcc ? `acc:${defaultAcc.id}` : ""),
        hesapLabel: defaultOpt?.label || (defaultAcc ? `100.01 - ${defaultAcc.name}` : "100.01 - Merkez Kasa"),
        belgeTarihi: lastFilled?.belgeTarihi || fisDate,
        belgeNo: lastFilled?.belgeNo || fisNo,
        belgeTuru: lastFilled?.belgeTuru || "Makbuz",
        bta: lastFilled?.bta || "Karşı Hesap Kapama",
        vadeTarihi: lastFilled?.vadeTarihi || fisDate,
        aciklama: lastFilled?.aciklama ? `${lastFilled.aciklama} (Karşı Hesap)` : "Fiş Bakiye Kapama Satırı",
        borc: diff < 0 ? Number(Math.abs(diff).toFixed(2)) : "",
        alacak: diff > 0 ? Number(Math.abs(diff).toFixed(2)) : "",
        odemeTuru: lastFilled?.odemeTuru || "Nakit",
      };

      if (emptyIdx !== -1) {
        const next = [...prev];
        next[emptyIdx] = { ...next[emptyIdx], ...balanceRowPatch };
        setActiveMultiFisRowId(next[emptyIdx].id);
        return next;
      } else {
        const newRow: MultiFisRow = {
          ...createEmptyMultiFisRow(prev.length + 1, fisDate, fisNo),
          ...balanceRowPatch,
        };
        setActiveMultiFisRowId(newRow.id);
        return [...prev, newRow];
      }
    });
  };

  const handleSaveMultiFis = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const validRows = multiFisRows.filter(
      (r) => (Number(r.borc) || 0) > 0 || (Number(r.alacak) || 0) > 0
    );

    if (validRows.length === 0) {
      triggerFormErrorNotification(
        "Kaydedilecek en az bir fiş satırında Borç veya Alacak tutarı girilmelidir.",
        "Çoklu Fiş Girişi Uyarısı",
        "Borç / Alacak"
      );
      return;
    }

    const fallbackAcc = accounts.find((a) => a.id === fisAccountId) || accounts[0];
    if (!fallbackAcc) {
      triggerFormErrorNotification(
        "Fiş satırlarının işleneceği Kasa veya Banka hesabı bulunamadı.",
        "Çoklu Fiş Girişi Uyarısı",
        "Hesap"
      );
      return;
    }

    const effectiveFisType: "mahsup" = "mahsup";
    const batchFisNo =
      fisNo.trim() && fisNo.trim().startsWith("FIS-MHS")
        ? fisNo.trim()
        : generateFisNumber(effectiveFisType);

    validRows.forEach((row, idx) => {
      const borcVal = Number(row.borc) || 0;
      const alacakVal = Number(row.alacak) || 0;
      const amount = borcVal > 0 ? borcVal : alacakVal;

      // Seçilen Hesap Kasa/Banka mı, Cari mi, Gider mi çöz
      let resolvedAccount = fallbackAcc;
      let resolvedContact: Contact | undefined;
      let resolvedCategory = "Mahsup Fişi";

      if (row.hesapKey.startsWith("acc:")) {
        const accId = row.hesapKey.replace("acc:", "");
        const foundAcc = accounts.find((a) => a.id === accId);
        if (foundAcc) resolvedAccount = foundAcc;
      } else if (row.hesapKey.startsWith("cnt:")) {
        const cntId = row.hesapKey.replace("cnt:", "");
        resolvedContact = contacts.find((c) => c.id === cntId);
      } else if (row.hesapKey.startsWith("exp:")) {
        resolvedCategory = row.hesapKey.replace("exp:", "");
      } else if (row.hesapLabel.trim()) {
        // Kullanıcının yazdığı metinden Cari veya Kasa/Banka eşleştirmeyi dene
        const q = row.hesapLabel.toLowerCase().trim();
        const matchedAcc = accounts.find((a) => q.includes(a.name.toLowerCase()));
        if (matchedAcc) resolvedAccount = matchedAcc;
        const matchedCnt = contacts.find(
          (c) => q.includes(c.name.toLowerCase()) || (row.vknTckn && c.taxNumber === row.vknTckn.trim())
        );
        if (matchedCnt) resolvedContact = matchedCnt;
      }

      // Mahsup fişi satır yönü: Kasa/Banka satırı ise Borç = Giriş (income), Alacak = Çıkış (expense).
      // Diğer hesaplarda Alacak > 0 ise income, Borç > 0 ise expense.
      let txDirection: "income" | "expense" = "expense";
      if (row.hesapKey.startsWith("acc:")) {
        txDirection = borcVal > 0 ? "income" : "expense";
      } else {
        txDirection = alacakVal > 0 ? "income" : "expense";
      }

      const detailParts = [
        row.aciklama.trim() || `${row.belgeTuru || "Mahsup Fişi"} Kaydı`,
        row.hesapLabel.trim() ? `Hesap: ${row.hesapLabel.trim()}` : null,
        row.belgeTuru ? `Belge Türü: ${row.belgeTuru}${row.bta ? ` (${row.bta})` : ""}` : null,
        row.vadeTarihi && row.vadeTarihi !== row.belgeTarihi ? `Vade: ${formatDate(row.vadeTarihi)}` : null,
        row.vknTckn ? `VKN/TCKN: ${row.vknTckn}` : null,
        row.odemeTuru ? `Ödeme: ${row.odemeTuru}` : null,
        borcVal > 0 ? `Borç: ₺${borcVal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}` : null,
        alacakVal > 0 ? `Alacak: ₺${alacakVal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}` : null,
      ].filter(Boolean);

      const newTx: Transaction = {
        id: `tx_mfis_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
        date: row.belgeTarihi || fisDate || new Date().toISOString().split("T")[0],
        type: txDirection,
        amount: Number(amount.toFixed(2)),
        currency: resolvedAccount.currency || "TRY",
        accountId: resolvedAccount.id,
        accountName: resolvedAccount.name,
        contactId: resolvedContact?.id,
        contactName: resolvedContact?.name || (row.hesapLabel.trim() ? row.hesapLabel.trim() : undefined),
        category: resolvedCategory,
        description: detailParts.join(" • "),
        documentNo: row.belgeNo.trim() || `${batchFisNo}-${idx + 1}`,
        fisType: effectiveFisType,
        paymentMethod: row.odemeTuru || "Nakit",
        taxNumber: row.vknTckn.trim() || resolvedContact?.taxNumber || undefined,
        documentType: row.belgeTuru || "Fatura",
        bta: row.bta.trim() || undefined,
        dueDate: row.vadeTarihi || undefined,
        debit: borcVal,
        credit: alacakVal,
        accountCode: row.hesapLabel.trim() || undefined,
      };

      if (onAddTransaction) {
        onAddTransaction(newTx);
      }
    });

    // Kayıt sonrası tabloyu yeni mahsup fişi için sıfırla
    setFisType("mahsup");
    const nextFisNo = generateFisNumber("mahsup");
    setFisNo(nextFisNo);
    const today = fisDate || new Date().toISOString().split("T")[0];
    const freshRows = Array.from({ length: 12 }, (_, idx) =>
      createEmptyMultiFisRow(idx + 1, today, "")
    );
    setMultiFisRows(freshRows);
    setActiveMultiFisRowId(freshRows[0].id);
  };

  React.useEffect(() => {
    if (!fisAccountId && accounts.length > 0) {
      setFisAccountId(accounts[0].id);
    }
  }, [accounts, fisAccountId]);

  const handleSelectFisType = (newType: "tahsilat" | "tediye" | "gider_fisi" | "mahsup") => {
    setFisType(newType);
    setFisNo(generateFisNumber(newType));
    if (newType === "tahsilat") {
      setFisDirection("income");
      setFisVatRate(0);
      setFisCategory("Tahsilat Fişi (Cari / Müşteri Tahsilatı)");
      setFisPaymentMethod("Nakit");
    } else if (newType === "tediye") {
      setFisDirection("expense");
      setFisVatRate(0);
      setFisCategory("Tediye Fişi (Tedarikçi / Cari Ödemesi)");
      setFisPaymentMethod("Nakit");
    } else if (newType === "gider_fisi") {
      setFisDirection("expense");
      setFisVatRate(20);
      setFisCategory(EXPENSE_CATEGORIES[1] || "Yemek ve ulaşım");
      setFisPaymentMethod("Nakit");
    } else if (newType === "mahsup") {
      setFisDirection("expense");
      setFisVatRate(0);
      setFisCategory("Muhasebe Mahsup Fişi");
      setFisPaymentMethod("Cari Mahsup");
    }
  };

  // Fiş KDV & Matrah Hesaplaması
  const parsedFisAmount = Number(fisAmount) || 0;
  const fisCalculated = React.useMemo(() => {
    if (parsedFisAmount <= 0) {
      return { subtotal: 0, vatAmount: 0, grandTotal: 0 };
    }
    if (!fisVatRate || fisVatRate <= 0) {
      return { subtotal: parsedFisAmount, vatAmount: 0, grandTotal: parsedFisAmount };
    }
    if (fisVatIncluded) {
      const subtotal = parsedFisAmount / (1 + fisVatRate / 100);
      const vatAmount = parsedFisAmount - subtotal;
      return {
        subtotal: Number(subtotal.toFixed(2)),
        vatAmount: Number(vatAmount.toFixed(2)),
        grandTotal: Number(parsedFisAmount.toFixed(2)),
      };
    } else {
      const subtotal = parsedFisAmount;
      const vatAmount = (parsedFisAmount * fisVatRate) / 100;
      const grandTotal = subtotal + vatAmount;
      return {
        subtotal: Number(subtotal.toFixed(2)),
        vatAmount: Number(vatAmount.toFixed(2)),
        grandTotal: Number(grandTotal.toFixed(2)),
      };
    }
  }, [parsedFisAmount, fisVatRate, fisVatIncluded]);

  const handleSaveFis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fisAccountId) {
      triggerFormErrorNotification("Lütfen fişin işleneceği Kasa veya Banka hesabını seçin.", "Fiş Girişi Uyarısı", "Hesap");
      return;
    }
    if (!fisAmount || Number(fisAmount) <= 0) {
      triggerFormErrorNotification("Lütfen geçerli bir fiş tutarı girin.", "Fiş Girişi Uyarısı", "Tutar");
      return;
    }

    const targetAcc = accounts.find((a) => a.id === fisAccountId);
    if (!targetAcc) {
      triggerFormErrorNotification("Seçilen hesap bulunamadı.", "Fiş Girişi Uyarısı", "Hesap");
      return;
    }

    const selectedContact = contacts.find((c) => c.id === fisContactId);
    const resolvedContactName =
      selectedContact?.name ||
      String(fisCustomTitle || "").trim() ||
      undefined;
    const resolvedTaxNo =
      String(fisTaxNumber || "").trim() ||
      selectedContact?.taxNumber ||
      undefined;

    const effectiveSingleFisType: "mahsup" = "mahsup";
    const txDirection: "income" | "expense" = fisDirection;

    const vatSummaryText =
      fisVatRate > 0
        ? ` • Matrah: ₺${fisCalculated.subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} + KDV (%${fisVatRate}): ₺${fisCalculated.vatAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`
        : "";

    const finalDescription = [
      fisDescription.trim() || "Mahsup Fişi Kaydı",
      resolvedTaxNo ? `VKN/TCKN: ${resolvedTaxNo}` : null,
      fisPaymentMethod ? `Ödeme: ${fisPaymentMethod}` : null,
    ]
      .filter(Boolean)
      .join(" • ") + vatSummaryText;

    const newFisTx: Transaction = {
      id: "tx_fis_" + Date.now(),
      date: fisDate || new Date().toISOString().split("T")[0],
      type: txDirection,
      amount: fisCalculated.grandTotal,
      currency: targetAcc.currency || "TRY",
      accountId: targetAcc.id,
      accountName: targetAcc.name,
      contactId: selectedContact?.id,
      contactName: resolvedContactName,
      category: fisCategory.trim() || "Mahsup Fişi",
      description: finalDescription,
      documentNo: fisNo.trim() || generateFisNumber(effectiveSingleFisType),
      fisType: effectiveSingleFisType,
      vatRate: fisVatRate,
      vatIncluded: fisVatIncluded,
      subtotal: fisCalculated.subtotal,
      totalVat: fisCalculated.vatAmount,
      paymentMethod: fisPaymentMethod,
      taxNumber: resolvedTaxNo,
    };

    if (onAddTransaction) {
      onAddTransaction(newFisTx);
    }

    // Formu yeni fiş için sıfırla
    setFisType("mahsup");
    setFisAmount("");
    setFisDescription("");
    setFisCustomTitle("");
    setFisTaxNumber("");
    setFisNo(generateFisNumber("mahsup"));
  };

  const resolveTransactionFisType = (t: Transaction): "tahsilat" | "tediye" | "gider_fisi" | "mahsup" => {
    if (t.fisType) return t.fisType;
    const doc = (t.documentNo || "").toUpperCase();
    const cat = (t.category || "").toLowerCase();
    const desc = (t.description || "").toLowerCase();
    if (doc.startsWith("FIS-GDR") || doc.startsWith("GDR-") || (t.totalVat && t.totalVat > 0) || cat.includes("masraf") || cat.includes("perakende") || desc.includes("kdv")) {
      return "gider_fisi";
    }
    if (doc.startsWith("FIS-MHS") || doc.startsWith("MHS-") || cat.includes("mahsup") || desc.includes("mahsup")) {
      return "mahsup";
    }
    if (t.type === "income" || t.type === "collection") {
      return "tahsilat";
    }
    return "tediye";
  };

  const fisTransactions = transactions
    .filter((t) => {
      // Virman satırlarını hariç tut, diğer tüm fiş/makbuz ve kasa-banka fiş kayıtlarını göster
      const isVirman =
        t.category === "Virman / Transfer" ||
        t.category === "Virman" ||
        t.category === "Transfer" ||
        (t.description || "").toLowerCase().includes("virman");
      if (isVirman) return false;

      const resolvedType = resolveTransactionFisType(t);
      if (fisFilterType !== "all" && resolvedType !== fisFilterType) return false;
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;

      if (activeSearchQuery) {
        const match =
          (t.description || "").toLowerCase().includes(activeSearchQuery) ||
          (t.contactName || "").toLowerCase().includes(activeSearchQuery) ||
          (t.documentNo || "").toLowerCase().includes(activeSearchQuery) ||
          (t.category || "").toLowerCase().includes(activeSearchQuery) ||
          (t.accountName || "").toLowerCase().includes(activeSearchQuery);
        if (!match) return false;
      }

      if (fisColFilters.date && !(t.date || "").toLowerCase().includes(fisColFilters.date.toLowerCase().trim())) return false;
      if (fisColFilters.documentNo && !(t.documentNo || "").toLowerCase().includes(fisColFilters.documentNo.toLowerCase().trim())) return false;
      if (fisColFilters.accountName && !(t.accountName || "").toLowerCase().includes(fisColFilters.accountName.toLowerCase().trim())) return false;
      if (fisColFilters.contact) {
        const q = fisColFilters.contact.toLowerCase().trim();
        const match = (t.contactName || "").toLowerCase().includes(q) || (t.category || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      if (fisColFilters.description && !(t.description || "").toLowerCase().includes(fisColFilters.description.toLowerCase().trim())) return false;
      if (fisColFilters.amount) {
        const q = fisColFilters.amount.toLowerCase().trim();
        const amtStr = (t.amount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 });
        if (!amtStr.includes(q) && !String(t.amount).includes(q)) return false;
      }

      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const activeFisColFilterCount = (Object.values(fisColFilters) as string[]).filter((v) => Boolean(v && v.trim() !== "")).length;
  const clearAllFisColFilters = () =>
    setFisColFilters({
      date: "",
      documentNo: "",
      fisType: "",
      accountName: "",
      contact: "",
      description: "",
      amount: "",
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
  const displayedFisTransactions = fisTransactions.slice(0, fisDisplayLimit);

  const displayedKasaIds = displayedKasaTransactions.map((t) => t.id);
  const displayedBankIds = displayedBankTransactions.map((t) => t.id);
  const displayedChequeIds = displayedCheques.map((c) => c.id);
  const displayedNoteIds = displayedNotes.map((n) => n.id);
  const displayedVirmanIds = displayedVirmanTransactions.map((t) => t.id);
  const displayedFisIds = displayedFisTransactions.map((t) => t.id);

  // Direct Excel (.xlsx) & PDF (.pdf) Export Data Getters and Handlers
  const getKasaExportData = (list: Transaction[] = kasaTransactions): ExportData => {
    const selectedAcc = accounts.find((a) => a.id === selectedCashAccountId);
    const subtitle = selectedAcc
      ? `Seçili Kasa: ${selectedAcc.name} (${selectedAcc.currency || "TRY"}) - Toplam ${list.length} Hareket`
      : `Tüm Nakit Kasalar - Toplam ${list.length} Hareket`;

    const headers = [
      "Sıra",
      "Tarih",
      "Evrak / Makbuz No",
      "Kasa Adı",
      "İşlem Türü",
      "Cari / Kategori",
      "Açıklama",
      "Tutar",
      "Para Birimi",
    ];

    const rows = list.map((tx, idx) => {
      const typeLabel =
        tx.type === "income" || tx.type === "collection"
          ? "Giriş / Tahsilat"
          : "Çıkış / Ödeme";
      return [
        idx + 1,
        tx.date || "-",
        tx.documentNo || "-",
        tx.accountName || "-",
        typeLabel,
        tx.contactName || tx.category || "-",
        tx.description || "-",
        tx.amount || 0,
        tx.currency || "TRY",
      ];
    });

    return {
      filename: `Kasa_Hareketleri_${selectedAcc ? selectedAcc.name.replace(/[^a-zA-Z0-9_-]/g, "_") : "Genel"}_${new Date().toISOString().split("T")[0]}`,
      sheetName: "Kasa Hareketleri",
      title: "NAKİT KASA HAREKETLERİ LİSTESİ",
      subtitle,
      headers,
      rows,
    };
  };

  const handleExportKasaExcel = () => exportToExcel(getKasaExportData());
  const handleExportKasaPDF = () => exportToPDF(getKasaExportData());

  const handleBulkDeleteKasa = () => {
    const ids = Array.from(kasaSelection.selectedIds);
    if (ids.length === 0) return;
    if (onBulkDeleteTransactions) {
      onBulkDeleteTransactions(ids);
    } else if (onDeleteTransaction) {
      ids.forEach((id) => onDeleteTransaction(id));
    }
    kasaSelection.clearSelection();
  };

  const handleBulkExportKasaExcel = () => {
    const selectedList = kasaTransactions.filter((t) => kasaSelection.isSelected(t.id));
    if (selectedList.length > 0) exportToExcel(getKasaExportData(selectedList));
  };

  const handleBulkExportKasaPDF = () => {
    const selectedList = kasaTransactions.filter((t) => kasaSelection.isSelected(t.id));
    if (selectedList.length > 0) exportToPDF(getKasaExportData(selectedList));
  };

  const getBankaExportData = (list: Transaction[] = bankTransactions): ExportData => {
    const selectedAcc = accounts.find((a) => a.id === selectedBankAccountId);
    const subtitle = selectedAcc
      ? `Seçili Banka Hesabı: ${selectedAcc.name} (${selectedAcc.currency || "TRY"}) - Toplam ${list.length} Hareket`
      : `Tüm Banka ve POS Hesapları - Toplam ${list.length} Hareket`;

    const headers = [
      "Sıra",
      "Tarih",
      "Dekont / İşlem No",
      "Banka Hesabı",
      "İşlem Türü",
      "Cari / Kategori",
      "Açıklama",
      "Tutar",
      "Para Birimi",
    ];

    const rows = list.map((tx, idx) => {
      const typeLabel =
        tx.type === "income" || tx.type === "collection"
          ? "Gelen Havale / Tahsilat"
          : "Giden Havale / Ödeme";
      return [
        idx + 1,
        tx.date || "-",
        tx.documentNo || "-",
        tx.accountName || "-",
        typeLabel,
        tx.contactName || tx.category || "-",
        tx.description || "-",
        tx.amount || 0,
        tx.currency || "TRY",
      ];
    });

    return {
      filename: `Banka_Hareketleri_${selectedAcc ? selectedAcc.name.replace(/[^a-zA-Z0-9_-]/g, "_") : "Genel"}_${new Date().toISOString().split("T")[0]}`,
      sheetName: "Banka Hareketleri",
      title: "BANKA VE POS HESAP HAREKETLERİ LİSTESİ",
      subtitle,
      headers,
      rows,
    };
  };

  const handleExportBankaExcel = () => exportToExcel(getBankaExportData());
  const handleExportBankaPDF = () => exportToPDF(getBankaExportData());

  const handleBulkDeleteBanka = () => {
    const ids = Array.from(bankaSelection.selectedIds);
    if (ids.length === 0) return;
    if (onBulkDeleteTransactions) {
      onBulkDeleteTransactions(ids);
    } else if (onDeleteTransaction) {
      ids.forEach((id) => onDeleteTransaction(id));
    }
    bankaSelection.clearSelection();
  };

  const handleBulkExportBankaExcel = () => {
    const selectedList = bankTransactions.filter((t) => bankaSelection.isSelected(t.id));
    if (selectedList.length > 0) exportToExcel(getBankaExportData(selectedList));
  };

  const handleBulkExportBankaPDF = () => {
    const selectedList = bankTransactions.filter((t) => bankaSelection.isSelected(t.id));
    if (selectedList.length > 0) exportToPDF(getBankaExportData(selectedList));
  };

  const getChequesExportData = (list: Cheque[] = filteredCheques): ExportData => {
    const headers = [
      "Sıra",
      "Çek No",
      "Çek Tipi",
      "Banka",
      "Şube",
      "Hesap No",
      "Keşideci / Cari",
      "Düzenleme Tarihi",
      "Vade Tarihi",
      "Tutar",
      "Para Birimi",
      "Durum",
    ];

    const statusMap: Record<string, string> = {
      portfolio: "Portföyde",
      endorsed: "Ciro Edildi",
      collected: "Tahsil Edildi",
      bounced: "Karşılıksız",
    };

    const rows = list.map((c, idx) => [
      idx + 1,
      c.chequeNumber || "-",
      c.type === "received" ? "Alınan (Müşteri) Çeki" : "Verilen (Firma) Çeki",
      c.bankName || "-",
      c.branchName || "-",
      c.accountNumber || "-",
      c.contactName || c.drawer || "-",
      c.issueDate || "-",
      c.dueDate || "-",
      c.amount || 0,
      c.currency || "TRY",
      statusMap[c.status] || c.status,
    ]);

    return {
      filename: `Cek_Portfoy_Listesi_${new Date().toISOString().split("T")[0]}`,
      sheetName: "Çek Portföyü",
      title: "ÇEK PORTFÖYÜ LİSTESİ",
      subtitle: `Toplam ${list.length} Adet Çek Kaydı`,
      headers,
      rows,
    };
  };

  const handleExportChequesExcel = () => exportToExcel(getChequesExportData());
  const handleExportChequesPDF = () => exportToPDF(getChequesExportData());

  const handleBulkDeleteChequesLocal = () => {
    const ids = Array.from(chequeSelection.selectedIds);
    if (ids.length === 0) return;
    if (onBulkDeleteCheques) {
      onBulkDeleteCheques(ids);
    } else if (onDeleteCheque) {
      ids.forEach((id) => onDeleteCheque(id));
    }
    chequeSelection.clearSelection();
  };

  const handleBulkExportChequesExcel = () => {
    const selectedList = filteredCheques.filter((c) => chequeSelection.isSelected(c.id));
    if (selectedList.length > 0) exportToExcel(getChequesExportData(selectedList));
  };

  const handleBulkExportChequesPDF = () => {
    const selectedList = filteredCheques.filter((c) => chequeSelection.isSelected(c.id));
    if (selectedList.length > 0) exportToPDF(getChequesExportData(selectedList));
  };

  const handleBulkUpdateChequeStatus = (status: ChequeStatus) => {
    if (!onUpdateChequeStatus) return;
    const ids = Array.from(chequeSelection.selectedIds);
    ids.forEach((id) => onUpdateChequeStatus(id, status));
    chequeSelection.clearSelection();
  };

  const getNotesExportData = (list: PromissoryNote[] = filteredNotes): ExportData => {
    const headers = [
      "Sıra",
      "Senet No",
      "Senet Tipi",
      "Borçlu / Muhatap",
      "İlgili Cari",
      "Düzenleme Tarihi",
      "Vade Tarihi",
      "Tutar",
      "Para Birimi",
      "Durum",
    ];

    const statusMap: Record<string, string> = {
      portfolio: "Portföyde",
      endorsed: "Ciro Edildi",
      collected: "Tahsil Edildi",
      protested: "Protestolu",
    };

    const rows = list.map((n, idx) => [
      idx + 1,
      n.noteNumber || "-",
      n.type === "received" ? "Alınan (Müşteri) Senedi" : "Verilen (Firma) Senedi",
      n.debtorName || "-",
      n.contactName || "-",
      n.issueDate || "-",
      n.dueDate || "-",
      n.amount || 0,
      n.currency || "TRY",
      statusMap[n.status] || n.status,
    ]);

    return {
      filename: `Senet_Portfoy_Listesi_${new Date().toISOString().split("T")[0]}`,
      sheetName: "Senet Portföyü",
      title: "SENET PORTFÖYÜ LİSTESİ",
      subtitle: `Toplam ${list.length} Adet Senet Kaydı`,
      headers,
      rows,
    };
  };

  const handleExportNotesExcel = () => exportToExcel(getNotesExportData());
  const handleExportNotesPDF = () => exportToPDF(getNotesExportData());

  const handleBulkDeleteNotesLocal = () => {
    const ids = Array.from(noteSelection.selectedIds);
    if (ids.length === 0) return;
    if (onBulkDeletePromissoryNotes) {
      onBulkDeletePromissoryNotes(ids);
    } else if (onDeletePromissoryNote) {
      ids.forEach((id) => onDeletePromissoryNote(id));
    }
    noteSelection.clearSelection();
  };

  const handleBulkExportNotesExcel = () => {
    const selectedList = filteredNotes.filter((n) => noteSelection.isSelected(n.id));
    if (selectedList.length > 0) exportToExcel(getNotesExportData(selectedList));
  };

  const handleBulkExportNotesPDF = () => {
    const selectedList = filteredNotes.filter((n) => noteSelection.isSelected(n.id));
    if (selectedList.length > 0) exportToPDF(getNotesExportData(selectedList));
  };

  const handleBulkUpdateNoteStatus = (status: PromissoryNoteStatus) => {
    if (!onUpdateNoteStatus) return;
    const ids = Array.from(noteSelection.selectedIds);
    ids.forEach((id) => onUpdateNoteStatus(id, status));
    noteSelection.clearSelection();
  };

  const getVirmanExportData = (list: Transaction[] = virmanTransactions): ExportData => {
    const headers = [
      "Sıra",
      "Tarih",
      "İşlem Fiş No",
      "Hesap",
      "İşlem Türü",
      "Kategori",
      "Açıklama",
      "Tutar",
      "Para Birimi",
    ];

    const rows = list.map((tx, idx) => [
      idx + 1,
      tx.date || "-",
      tx.documentNo || "-",
      tx.accountName || "-",
      tx.type === "income" ? "Giriş (Alacak)" : "Çıkış (Borç)",
      tx.category || "-",
      tx.description || "-",
      tx.amount || 0,
      tx.currency || "TRY",
    ]);

    return {
      filename: `Virman_Transfer_Gecmisi_${new Date().toISOString().split("T")[0]}`,
      sheetName: "Virman Transfer",
      title: "HESAPLAR ARASI VİRMAN TRANSFER GEÇMİŞİ",
      subtitle: `Toplam ${list.length} Adet Virman Hareketi`,
      headers,
      rows,
    };
  };

  const handleExportVirmanExcel = () => exportToExcel(getVirmanExportData());
  const handleExportVirmanPDF = () => exportToPDF(getVirmanExportData());

  const handleBulkDeleteVirman = () => {
    const ids = Array.from(virmanSelection.selectedIds);
    if (ids.length === 0) return;
    if (onBulkDeleteTransactions) {
      onBulkDeleteTransactions(ids);
    } else if (onDeleteTransaction) {
      ids.forEach((id) => onDeleteTransaction(id));
    }
    virmanSelection.clearSelection();
  };

  const handleBulkExportVirmanExcel = () => {
    const selectedList = virmanTransactions.filter((t) => virmanSelection.isSelected(t.id));
    if (selectedList.length > 0) exportToExcel(getVirmanExportData(selectedList));
  };

  const handleBulkExportVirmanPDF = () => {
    const selectedList = virmanTransactions.filter((t) => virmanSelection.isSelected(t.id));
    if (selectedList.length > 0) exportToPDF(getVirmanExportData(selectedList));
  };

  const getFisExportData = (list: Transaction[] = fisTransactions): ExportData => {
    const headers = [
      "Sıra",
      "Tarih",
      "Fiş / Belge No",
      "Fiş Türü",
      "Kasa / Banka Hesabı",
      "Cari / Ünvan",
      "Kategori",
      "Açıklama",
      "KDV Hariç",
      "KDV Tutarı",
      "Genel Toplam",
      "Para Birimi",
    ];

    const typeLabelMap: Record<string, string> = {
      tahsilat: "Tahsilat Fişi (+)",
      tediye: "Tediye Fişi (-)",
      gider_fisi: "Gider / Masraf Fişi (-)",
      mahsup: "Mahsup Fişi",
    };

    const rows = list.map((tx, idx) => {
      const fType = resolveTransactionFisType(tx);
      return [
        idx + 1,
        tx.date || "-",
        tx.documentNo || "-",
        typeLabelMap[fType] || "Fiş",
        tx.accountName || "-",
        tx.contactName || "-",
        tx.category || "-",
        tx.description || "-",
        tx.subtotal ?? tx.amount ?? 0,
        tx.totalVat ?? 0,
        tx.amount || 0,
        tx.currency || "TRY",
      ];
    });

    return {
      filename: `Finans_Fis_Listesi_${new Date().toISOString().split("T")[0]}`,
      sheetName: "Fiş Listesi",
      title: "FİNANS & MUHASEBE FİŞ HAREKETLERİ LİSTESİ",
      subtitle: `Toplam ${list.length} Adet Fiş Kaydı`,
      headers,
      rows,
    };
  };

  const handleExportFisExcel = () => exportToExcel(getFisExportData());
  const handleExportFisPDF = () => exportToPDF(getFisExportData());

  const handleBulkDeleteFis = () => {
    const ids = Array.from(fisSelection.selectedIds);
    if (ids.length === 0) return;
    if (onBulkDeleteTransactions) {
      onBulkDeleteTransactions(ids);
    } else if (onDeleteTransaction) {
      ids.forEach((id) => onDeleteTransaction(id));
    }
    fisSelection.clearSelection();
  };

  const handleBulkExportFisExcel = () => {
    const selectedList = fisTransactions.filter((t) => fisSelection.isSelected(t.id));
    if (selectedList.length > 0) exportToExcel(getFisExportData(selectedList));
  };

  const handleBulkExportFisPDF = () => {
    const selectedList = fisTransactions.filter((t) => fisSelection.isSelected(t.id));
    if (selectedList.length > 0) exportToPDF(getFisExportData(selectedList));
  };

  const renderDateFilterBar = (subModuleName: string) => {
    const isFiltered = Boolean(startDate || endDate);
    return (
      <div
        className="rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border shadow-2xs transition-colors"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: theme.pageText }}>
                Tarih Aralığı Filtresi ({subModuleName})
              </span>
              {isFiltered && (
                <span className="text-[10px] font-bold bg-purple-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                  Filtre Aktif
                </span>
              )}
            </div>
            <p className="text-xs font-medium mt-0.5" style={{ color: theme.pageTextMuted }}>
              {isFiltered
                ? `${startDate ? new Date(startDate).toLocaleDateString("tr-TR") : "Başlangıç Sınırsız"} — ${
                    endDate ? new Date(endDate).toLocaleDateString("tr-TR") : "Bitiş Sınırsız"
                  } arasındaki hareketler`
                : "Tarih aralığı seçerek belirli tarihler arasındaki finansal hareketleri süzün."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Inputs */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl px-2.5 py-1.5 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-slate-400">Tarih:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs font-bold bg-transparent outline-none cursor-pointer"
              style={{ color: theme.pageText }}
            />
            <span className="text-slate-400 font-bold text-xs">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs font-bold bg-transparent outline-none cursor-pointer"
              style={{ color: theme.pageText }}
            />
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={handlePresetThisMonth}
              type="button"
              className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              style={{ color: theme.pageText }}
            >
              Bu Ay
            </button>
            <button
              onClick={handlePresetLastMonth}
              type="button"
              className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              style={{ color: theme.pageText }}
            >
              Geçen Ay
            </button>
            <button
              onClick={handlePresetLast30Days}
              type="button"
              className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              style={{ color: theme.pageText }}
            >
              Son 30 Gün
            </button>
            <button
              onClick={handlePresetThisYear}
              type="button"
              className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              style={{ color: theme.pageText }}
            >
              Bu Yıl
            </button>
            {isFiltered && (
              <button
                onClick={handleClearDates}
                type="button"
                className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
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
                    <div className="md:col-span-2 bg-purple-50/40 border border-purple-200/80 rounded-2xl p-4 space-y-4">
                      <div className="text-xs font-extrabold text-purple-950 flex items-center justify-between border-b border-purple-200/60 pb-2">
                        <span>Banka Hesap Bilgileri</span>
                        <span className="text-[10px] font-semibold text-purple-700 bg-white px-2 py-0.5 rounded border border-purple-200">
                          Hesap Adı & IBAN Tanımı
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Hesap Adı (Banka Hesap Tanımı) *
                          </label>
                          <input
                            type="text"
                            placeholder="Örn: Garanti Ticari TL Hesabı, İş Bankası Ana Hesap..."
                            value={accName}
                            onChange={(e) => setAccName(e.target.value)}
                            className="w-full bg-white border border-purple-200 rounded-xl p-3 text-xs font-bold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Hesap Sahibi Ünvanı / Alıcı Hesap Adı
                          </label>
                          <input
                            type="text"
                            placeholder={companySettings?.companyTitle || companySettings?.companyName || "Örn: Şirket Resmi Ticari Ünvanı"}
                            value={accAccountHolderName}
                            onChange={(e) => {
                              setAccAccountHolderName(e.target.value);
                              if (!accName.trim()) {
                                setAccName(e.target.value);
                              }
                            }}
                            className="w-full bg-white border border-purple-200 rounded-xl p-3 text-xs font-bold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Banka Adı
                          </label>
                          <input
                            type="text"
                            placeholder="Örn: Yapı Kredi, Garanti BBVA, İş Bankası..."
                            value={accBankName}
                            onChange={(e) => setAccBankName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Şube Adı / Şube Kodu
                          </label>
                          <input
                            type="text"
                            placeholder="Örn: Ticari Şube / 1245"
                            value={accBranchName}
                            onChange={(e) => setAccBranchName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500"
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
                            className="w-full bg-white border border-slate-200 rounded-xl p-3 font-mono text-xs font-bold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Hesap Numarası
                          </label>
                          <input
                            type="text"
                            placeholder="Örn: 12345678"
                            value={accAccountNumber}
                            onChange={(e) => setAccAccountNumber(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-3 font-mono text-xs font-bold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
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
            {onDeleteAccount && (
              <button
                type="button"
                onClick={() => {
                  const deletedId = editingAccount.id;
                  onDeleteAccount(deletedId);
                  if (selectedCashAccountId === deletedId) setSelectedCashAccountId(null);
                  if (selectedBankAccountId === deletedId) setSelectedBankAccountId(null);
                  handleBackToList();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1.5"
                title="Bu kasa veya banka hesabını sil"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hesabı Sil</span>
              </button>
            )}
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
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Banka Hesap Adı / Alıcı Hesap Sahibi Ünvanı
                      </label>
                      <input
                        type="text"
                        value={editingAccount.accountHolderName ?? editingAccount.name ?? ""}
                        onChange={(e) =>
                          setEditingAccount({
                            ...editingAccount,
                            accountHolderName: e.target.value,
                          })
                        }
                        placeholder="Örn: Şirket Ünvanı veya Banka Hesap Adı"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

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

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Güncel Hesap Bakiyesi ({editingAccount.currency || "TRY"})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingAccount.balance}
                    onChange={(e) =>
                      setEditingAccount({
                        ...editingAccount,
                        balance: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                >
                  İptal / Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Değişiklikleri Kaydet</span>
                </button>
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

  // Helper to render printable receipt content in strict A4 format
  const renderPrintableReceiptContent = (receipt: ReceiptData) => (
    <div
      id="printable-receipt"
      style={{ backgroundColor: "#ffffff", color: "#0f172a", maxWidth: "794px", minHeight: "1123px" }}
      className="bg-white text-slate-900 p-8 sm:p-12 border border-slate-300/90 shadow-2xl rounded-sm w-full max-w-[794px] min-h-[1123px] mx-auto flex flex-col justify-between font-sans text-xs sm:text-sm print:border-none print:shadow-none print:rounded-none print:p-0 print:m-0 print:max-w-none print:w-full print:min-h-0"
    >
      {/* Top Half of A4 Sheet: Corporate Header, Subtitle, Details Grid, Grand Total */}
      <div className="space-y-5 sm:space-y-6">
        {/* Corporate Header Section */}
        <div className="border-b-2 border-indigo-900 pb-4 sm:pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="shrink-0 mt-0.5">
              <Logo size="lg" src={companySettings?.logoUrl || "/logo.svg"} />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="font-black text-sm sm:text-base md:text-lg text-slate-950 tracking-tight leading-tight">
                {companySettings?.companyTitle || companySettings?.companyName || "MUAVİN KURUMSAL FİNANS VE YÖNETİM HİZMETLERİ"}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-600 space-y-0.5">
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
            className="text-left sm:text-center p-3 rounded-xl border w-full sm:w-auto min-w-[210px] shrink-0"
          >
            <span className="text-[10px] sm:text-[11px] font-black text-indigo-950 uppercase tracking-widest block">
              RESMİ FİNANS DEKONTU
            </span>
            <div
              style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }}
              className="font-mono text-xs font-black py-1 px-2.5 rounded-lg border mt-1 tracking-wider"
            >
              {receipt.documentNo}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 font-semibold mt-1">
              Tarih: {receipt.date} {receipt.time ? `• ${receipt.time}` : ""}
            </div>
          </div>
        </div>

        {/* Subtitle / Description - Tam Gösterim (Full visibility & high contrast in Print & PDF) */}
        <div
          data-testid="receipt-header-banner"
          style={{
            backgroundColor: "#f0f4ff",
            borderColor: "#c7d2fe",
            color: "#0f172a",
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          }}
          className="p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 overflow-visible w-full print:bg-[#f0f4ff] print:border-[#c7d2fe] print:flex print:flex-row print:justify-between print:items-center print:p-4 print:my-2 print:visible print:opacity-100"
        >
          <div className="min-w-0 flex-1">
            <h2 className="font-black text-indigo-950 text-xs sm:text-sm md:text-base block whitespace-normal break-words leading-tight print:text-indigo-950 print:text-base print:font-black">
              {receipt.documentTitle}
            </h2>
            <p className="text-[11px] sm:text-xs text-indigo-800 font-semibold block whitespace-normal break-words mt-1 leading-normal print:text-indigo-800 print:text-xs">
              {receipt.subTitle || "Resmi muhasebe işlem ve bakiye kaydı"}
            </p>
          </div>
          {receipt.statusText && (
            <span
              style={{
                backgroundColor: "#312e81",
                color: "#ffffff",
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact",
              }}
              className="px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-black tracking-wider uppercase shrink-0 self-start sm:self-auto whitespace-nowrap shadow-2xs print:bg-[#312e81] print:text-white print:px-3 print:py-1.5 print:rounded-lg print:text-xs print:font-black"
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
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:px-4 text-xs gap-1 sm:gap-4 ${
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
          style={{
            backgroundColor: "#83b8ff",
            color: "#0f172a",
            borderColor: "#60a5fa",
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          }}
          className="rounded-xl p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border print:bg-[#83b8ff]"
        >
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-900/80 block">
              İŞLEM TUTARI / BAKİYE
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-950 italic mt-0.5 block break-words">
              # {numberToTurkishWords(receipt.amount, receipt.currency)} #
            </span>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-950 block">
              {formatCurrency(receipt.amount, receipt.currency)}
            </span>
          </div>
        </div>

        {/* Description / Notes if any */}
        {receipt.description && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700">
            <span className="font-bold text-slate-900 block mb-0.5">İşlem Açıklaması / Not:</span>
            {receipt.description}
          </div>
        )}
      </div>

      {/* Bottom Half of A4 Sheet: Official Signatures Zone & Institutional Footer */}
      <div className="pt-8 sm:pt-12 space-y-4">
        {/* Signatures Zone */}
        <div className="grid grid-cols-2 gap-8 border-t border-slate-300 pt-6 text-center">
          <div className="space-y-8">
            <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              TESLİM EDEN / ONAYLAYAN
            </div>
            <div className="border-t border-dashed border-slate-400 pt-1 text-[11px] text-slate-500 w-48 mx-auto font-medium">
              Yetkili İmza &amp; Kaşe
            </div>
          </div>
          <div className="space-y-8">
            <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              TESLİM ALAN / CARİ FİRMA
            </div>
            <div className="border-t border-dashed border-slate-400 pt-1 text-[11px] text-slate-500 w-48 mx-auto font-medium">
              Yetkili İmza &amp; Kaşe
            </div>
          </div>
        </div>

        {/* Footer Notice & Security Stamp */}
        <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row items-center justify-between gap-1 text-[10px] text-slate-400">
          <span>Bu dekont Muavin ERP Finans Yönetim Sistemi tarafından elektronik ortamda üretilmiştir.</span>
          <span className="font-mono text-[9px] text-slate-400 font-semibold">
            BELGE KODU: {receipt.documentNo} • STANDART A4 (210 × 297 MM)
          </span>
        </div>
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
              width: "794px",
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
                  { orientation: "p", margin: 8, scale: 2, fitToSinglePage: true }
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
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={handleBackToList}
              className="px-3 sm:px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.cardBorder,
                color: theme.pageText,
              }}
            >
              ← Listeye Dön
            </button>
            <button
              type="button"
              onClick={handlePrintReceipt}
              className="px-3 sm:px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
              title="A4 formatında yazdır"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Yazdır</span>
            </button>
            <button
              type="button"
              onClick={handleExportReceiptExcel}
              className="px-3 sm:px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer active:scale-95"
              title="Dekont Detayını Excel (.xlsx) Olarak İndir"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Excel İndir</span>
            </button>
            <button
              type="button"
              onClick={handleExportReceiptPDF}
              disabled={isPdfGenerating}
              className="px-3 sm:px-4 py-2 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50 active:scale-95"
              title="A4 formatında yüksek kaliteli PDF indir"
            >
              <FileCheck2 className="w-4 h-4 text-purple-200" />
              <span>{isPdfGenerating ? "Hazırlanıyor..." : "PDF İndir"}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsReceiptWhatsAppOpen(true)}
              className="px-3 sm:px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer active:scale-95"
              title="WhatsApp İletişim & Entegrasyon Merkezi ile Paylaş"
            >
              <MessageSquare className="w-4 h-4 text-emerald-100 fill-emerald-100" />
              <span className="hidden sm:inline">WhatsApp ile Paylaş</span>
              <span className="sm:hidden">WhatsApp</span>
            </button>
          </div>
        }
      >
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 flex justify-center overflow-x-auto print:p-0">
          {renderPrintableReceiptContent(receiptData)}
        </div>
      </DetailPageLayout>
    );
  }

  if (isChequeModalOpen) {
    const totalBatchAmount = chqBatchRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const selectedChequeContact = contacts.find((c) => c.id === chqContactId);

    return (
      <DetailPageLayout
        title="Yeni Finansal Çek Kaydı (Çoklu Çek / Bordro Girişi)"
        subtitle="Tek seferde bir veya birden fazla müşteri çeki (tahsilat) ya da firma borç çeki (ödeme) portföy girişi yapabilirsiniz"
        breadcrumbs={[
          { label: "Finans Yönetimi", onClick: handleBackToList },
          { label: "Çek & Senet Portföyü", onClick: handleBackToList },
          { label: "Yeni Çek Kaydı", active: true },
        ]}
        onBack={handleBackToList}
        statusBadge={
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-bold rounded-xl border bg-indigo-50 text-indigo-700 border-indigo-200">
              {chqType === "received" ? "Alınan Müşteri Çeki" : "Verilen Borç Çeki"}
            </span>
            <span className="px-3 py-1 text-xs font-black rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-200 font-mono">
              {chqBatchRows.length} Adet Çek • Toplam: {formatCurrency(totalBatchAmount, chqCurrency)}
            </span>
          </div>
        }
        headerIcon={<FileCheck2 className="w-5 h-5 text-indigo-600" />}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleAddChequeDraftRow(false)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Çek Satırı Ekle</span>
            </button>
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
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {chqBatchRows.length > 1
                  ? `${chqBatchRows.length} Adet Çek Kaydını Oluştur`
                  : "Çek Kaydını Oluştur"}
              </span>
            </button>
          </div>
        }
      >
        <div className="max-w-6xl w-full mx-auto space-y-5">
          <form id="add-cheque-form" onSubmit={handleSaveCheque} className="space-y-5 text-xs">
            {/* BİRLEŞTİRİLMİŞ ÇOKLU ÇEK LİSTESİ TABLOSU & ORTAK BORDRO / CARİ HESAP BİLGİLERİ */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-5">
              {/* Tablo Üst Başlık ve Satır Ekleme Aksiyonları */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-emerald-600" />
                    <span>Çoklu Çek Listesi Tablosu &amp; Ortak Bordro / Cari Hesap Bilgileri ({chqBatchRows.length} Satır)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Ortak bordro ve cari hesap bilgilerini tablo üst barından seçebilir, <strong>&quot;+ Satır Ekle&quot;</strong> ile birden fazla çek girişi yapabilirsiniz.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleAddChequeDraftRow(false)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Satır Ekle</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddChequeDraftRow(true)}
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                    title="Son çekin bilgilerini kopyalar, çek numarasını 1 artırır ve vadesini 30 gün ileri atar"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Son Satırı Çoğalt (+1 Ay Vade)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGenerateInstallmentCheques(3)}
                    className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-bold cursor-pointer transition-all"
                    title="Aylık sıralı 3 adet daha çek satırı ekler"
                  >
                    +3 Sıralı Satır
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGenerateInstallmentCheques(6)}
                    className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-bold cursor-pointer transition-all"
                    title="Aylık sıralı 6 adet daha çek satırı ekler"
                  >
                    +6 Sıralı Satır
                  </button>
                </div>
              </div>

              {/* Çoklu Çek Giriş Tablosu (Ortak Bordro & Cari Hesap Bilgileri Tablo İçinde Gösterilir) */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left border-collapse min-w-[680px]">
                  <thead>
                    {/* TABLO İÇİ ORTAK BORDRO & CARİ HESAP BİLGİLERİ BÖLÜMÜ */}
                    <tr className="bg-indigo-50/60 border-b-2 border-indigo-200/80">
                      <th colSpan={6} className="p-4">
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Landmark className="w-4 h-4 text-indigo-700" />
                              <span className="text-xs font-extrabold text-indigo-950 uppercase tracking-wide">
                                Ortak Bordro &amp; Cari Hesap Bilgileri (Tablo Genel Varsayılanları)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setChqBatchRows((prev) =>
                                  prev.map((r) => ({
                                    ...r,
                                    bankName: chqBankName || r.bankName,
                                    branchName: chqBranchName || r.branchName,
                                    drawerName: chqDrawerName || selectedChequeContact?.name || r.drawerName,
                                    issueDate: chqIssueDate || r.issueDate,
                                    currency: chqCurrency || r.currency,
                                    notes: chqNotes || r.notes,
                                  }))
                                );
                              }}
                              className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer"
                            >
                              Ortak Bilgileri Tablodaki Tüm Satırlara Uygula
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-normal normal-case">
                            <div>
                              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Çek Bordro Tipi *</label>
                              <select
                                value={chqType}
                                onChange={(e) => setChqType(e.target.value as any)}
                                className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-900 text-xs"
                              >
                                <option value="received">Müşteri Çeki (Alınan)</option>
                                <option value="issued">Borç / Firma Çeki (Verilen)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1 text-[11px]">İlişkili Cari Hesap</label>
                              <select
                                value={chqContactId}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setChqContactId(val);
                                  const found = contacts.find((c) => c.id === val);
                                  if (found && !chqDrawerName) {
                                    setChqDrawerName(found.name);
                                    setChqBatchRows((prev) =>
                                      prev.map((r) => (r.drawerName ? r : { ...r, drawerName: found.name }))
                                    );
                                  }
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-900 text-xs"
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
                              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Varsayılan Banka Adı</label>
                              <input
                                type="text"
                                placeholder="ör: Garanti BBVA"
                                value={chqBankName}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setChqBankName(val);
                                  setChqBatchRows((prev) =>
                                    prev.map((r, i) => (i === 0 && !r.bankName ? { ...r, bankName: val } : r))
                                  );
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-900 text-xs"
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Varsayılan Şube</label>
                              <input
                                type="text"
                                placeholder="ör: Levent Şubesi"
                                value={chqBranchName}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setChqBranchName(val);
                                  setChqBatchRows((prev) =>
                                    prev.map((r, i) => (i === 0 && !r.branchName ? { ...r, branchName: val } : r))
                                  );
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-900 text-xs"
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Varsayılan Keşideci / Düzenleyen</label>
                              <input
                                type="text"
                                placeholder="ör: Anadolu Marketler Zinciri A.Ş."
                                value={chqDrawerName}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setChqDrawerName(val);
                                  setChqBatchRows((prev) =>
                                    prev.map((r, i) => (i === 0 && !r.drawerName ? { ...r, drawerName: val } : r))
                                  );
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-900 text-xs"
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Varsayılan Keşide Tarihi</label>
                              <input
                                type="date"
                                value={chqIssueDate}
                                onChange={(e) => setChqIssueDate(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-900 font-mono text-xs"
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Varsayılan Para Birimi</label>
                              <select
                                value={chqCurrency}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setChqCurrency(val);
                                  setChqBatchRows((prev) => prev.map((r) => ({ ...r, currency: val })));
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-900 text-xs"
                              >
                                <option value="TRY">TRY (₺)</option>
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Ortak Açıklama / Bordro Notu</label>
                              <input
                                type="text"
                                placeholder="Örn: Fatura tahsilatına istinaden alınan çekler"
                                value={chqNotes}
                                onChange={(e) => setChqNotes(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-900 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      </th>
                    </tr>
                    <tr className="bg-slate-100/90 border-b border-slate-200 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-2.5 w-44">Çek Numarası *</th>
                      <th className="py-2.5 px-2.5 w-40">Vade Tarihi *</th>
                      <th className="py-2.5 px-2.5 w-44 text-right">Tutar ({chqCurrency}) *</th>
                      <th className="py-2.5 px-2.5">Açıklama / Not</th>
                      <th className="py-2.5 px-3 w-24 text-center">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {chqBatchRows.map((row, idx) => (
                      <tr
                        key={row.rowId}
                        className="hover:bg-indigo-50/30 transition-colors group"
                      >
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-[11px] items-center justify-center shadow-2xs">
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            required
                            placeholder={`CHK-${1001 + idx}`}
                            value={row.chequeNumber}
                            onChange={(e) =>
                              handleUpdateChequeDraftRow(row.rowId, "chequeNumber", e.target.value)
                            }
                            className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900 focus:border-indigo-500 outline-none"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="date"
                            required
                            value={row.dueDate}
                            onChange={(e) =>
                              handleUpdateChequeDraftRow(row.rowId, "dueDate", e.target.value)
                            }
                            className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-900 font-mono font-bold focus:border-indigo-500 outline-none"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={row.amount}
                            onChange={(e) =>
                              handleUpdateChequeDraftRow(
                                row.rowId,
                                "amount",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono font-bold text-right text-slate-900 focus:border-indigo-500 outline-none"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            placeholder={chqNotes || "Açıklama..."}
                            value={row.notes}
                            onChange={(e) =>
                              handleUpdateChequeDraftRow(row.rowId, "notes", e.target.value)
                            }
                            className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:border-indigo-500 outline-none"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setChqBatchRows((prev) => {
                                  const copy = createDefaultChequeDraftRow(1, row);
                                  const next = [...prev];
                                  next.splice(idx + 1, 0, copy);
                                  return next;
                                });
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-700 border border-slate-200 cursor-pointer transition-colors"
                              title="Bu satırı 1 ay sonraki vadeyle altına kopyala"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={chqBatchRows.length <= 1}
                              onClick={() => handleRemoveChequeDraftRow(row.rowId)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Satırı Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-900">
                      <td colSpan={3} className="py-3 px-4 text-right uppercase text-[11px] tracking-wider text-slate-600">
                        Toplam Çek Bordrosu ({chqBatchRows.length} Adet Çek):
                      </td>
                      <td className="py-3 px-2.5 text-right font-mono text-sm font-black text-indigo-700">
                        {formatCurrency(totalBatchAmount, chqCurrency)}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Alt Özet ve Hızlı Satır Ekleme Barı */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleAddChequeDraftRow(false)}
                    className="px-4 py-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Satır Ekle</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddChequeDraftRow(true)}
                    className="px-4 py-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Son Satırı Çoğalt (+1 Ay Vade)</span>
                  </button>
                </div>

                <div className="flex items-center gap-4 justify-end">
                  <div className="text-right">
                    <div className="text-[11px] font-semibold text-slate-500">
                      Toplam Girilen Çek ({chqBatchRows.length} Adet)
                    </div>
                    <div className="text-base font-black font-mono text-indigo-700">
                      {formatCurrency(totalBatchAmount, chqCurrency)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleBackToList}
                    className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer rounded-xl font-bold text-xs"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer text-xs shadow-xs flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {chqBatchRows.length > 1
                        ? `${chqBatchRows.length} Adet Çeki Portföye Kaydet`
                        : "Çek Kaydını Oluştur"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </DetailPageLayout>
    );
  }

  /* FULL-PAGE DETAIL VIEW: ADD PROMISSORY NOTE (MULTI-ROW TABLE SUPPORT) */
  if (isNoteModalOpen) {
    const totalNoteBatchAmount = ntBatchRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const selectedNoteContact = contacts.find((c) => c.id === ntContactId);

    return (
      <DetailPageLayout
        title="Yeni Finansal Senet Kaydı (Çoklu Senet / Bordro Girişi)"
        subtitle="Tek seferde bir veya birden fazla müşteri senedi (alınan) ya da borç senedi (verilen) portföy kaydı yapabilirsiniz"
        breadcrumbs={[
          { label: "Finans Yönetimi", onClick: handleBackToList },
          { label: "Çek & Senet Portföyü", onClick: handleBackToList },
          { label: "Yeni Senet Kaydı", active: true },
        ]}
        onBack={handleBackToList}
        statusBadge={
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-bold rounded-xl border bg-purple-50 text-purple-700 border-purple-200">
              {ntType === "received" ? "Alınan Müşteri Senedi" : "Verilen Borç Senedi"}
            </span>
            <span className="px-3 py-1 text-xs font-black rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-200 font-mono">
              {ntBatchRows.length} Adet Senet • Toplam: {formatCurrency(totalNoteBatchAmount, ntCurrency)}
            </span>
          </div>
        }
        headerIcon={<Stamp className="w-5 h-5 text-purple-600" />}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleAddNoteDraftRow(false)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Satır Ekle</span>
            </button>
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
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {ntBatchRows.length > 1
                  ? `${ntBatchRows.length} Adet Senet Kaydını Oluştur`
                  : "Senet Kaydını Oluştur"}
              </span>
            </button>
          </div>
        }
      >
        <div className="max-w-6xl w-full mx-auto space-y-5">
          <form id="add-note-form" onSubmit={handleSaveNote} className="space-y-5 text-xs">
            {/* 1. ÜST ORTAK SENET BORDRO BİLGİLERİ */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Stamp className="w-4 h-4 text-purple-600" />
                    <span>Ortak Senet Bordrosu &amp; Cari Hesap Bilgileri</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Seçtiğiniz cari hesap ve varsayılan borçlu/düzenleme bilgileri eklenen tüm senet satırlarına uygulanır.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNtBatchRows((prev) =>
                      prev.map((r) => ({
                        ...r,
                        debtorName: ntDebtorName || selectedNoteContact?.name || r.debtorName,
                        issueDate: ntIssueDate || r.issueDate,
                        currency: ntCurrency || r.currency,
                        notes: ntNotes || r.notes,
                      }))
                    );
                  }}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors cursor-pointer"
                >
                  Ortak Bilgileri Tüm Satırlara Uygula
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Senet Tipi *</label>
                  <select
                    value={ntType}
                    onChange={(e) => setNtType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                  >
                    <option value="received">Müşteri Senedi (Alınan)</option>
                    <option value="issued">Borç Senedi (Verilen)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">İlişkili Cari Hesap</label>
                  <select
                    value={ntContactId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNtContactId(val);
                      const found = contacts.find((c) => c.id === val);
                      if (found && !ntDebtorName) {
                        setNtDebtorName(found.name);
                        setNtBatchRows((prev) =>
                          prev.map((r) => (r.debtorName ? r : { ...r, debtorName: found.name }))
                        );
                      }
                    }}
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
                  <label className="block font-bold text-slate-700 mb-1">Varsayılan Borçlu / Keşideci Adı</label>
                  <input
                    type="text"
                    placeholder="ör: Mavi Derinlik Yayıncılık A.Ş."
                    value={ntDebtorName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNtDebtorName(val);
                      setNtBatchRows((prev) =>
                        prev.map((r, i) => (i === 0 && !r.debtorName ? { ...r, debtorName: val } : r))
                      );
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Varsayılan Düzenleme Tarihi</label>
                  <input
                    type="date"
                    value={ntIssueDate}
                    onChange={(e) => setNtIssueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Varsayılan Para Birimi</label>
                  <select
                    value={ntCurrency}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNtCurrency(val);
                      setNtBatchRows((prev) => prev.map((r) => ({ ...r, currency: val })));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                  >
                    <option value="TRY">TRY (₺)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ortak Açıklama / Notlar</label>
                  <input
                    type="text"
                    placeholder="Örn: Vadeli satışa istinaden alınan sıralı senetler"
                    value={ntNotes}
                    onChange={(e) => setNtNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* 2. ÇOKLU SENET LİSTESİ TABLOSU KARTI */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Stamp className="w-4 h-4 text-purple-600" />
                    <span>Çoklu Senet Listesi Tablosu ({ntBatchRows.length} Satır)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tablodaki her satır ayrı bir finansal senet olarak kaydedilir. Yeni senet eklemek için <strong>&quot;+ Satır Ekle&quot;</strong> butonunu kullanabilirsiniz.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleAddNoteDraftRow(false)}
                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Satır Ekle</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddNoteDraftRow(true)}
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Son Satırı Çoğalt (+1 Ay Vade)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGenerateInstallmentNotes(3)}
                    className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-bold cursor-pointer transition-all"
                  >
                    +3 Sıralı Satır
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGenerateInstallmentNotes(6)}
                    className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-bold cursor-pointer transition-all"
                  >
                    +6 Sıralı Satır
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left border-collapse min-w-[860px]">
                  <thead>
                    <tr className="bg-slate-100/90 border-b border-slate-200 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-2.5 w-40">Senet Numarası *</th>
                      <th className="py-2.5 px-2.5 w-48">Borçlu / Keşideci Adı</th>
                      <th className="py-2.5 px-2.5 w-36">Düzenleme Tarihi</th>
                      <th className="py-2.5 px-2.5 w-36">Vade Tarihi *</th>
                      <th className="py-2.5 px-2.5 w-40 text-right">Tutar ({ntCurrency}) *</th>
                      <th className="py-2.5 px-2.5">Açıklama / Not</th>
                      <th className="py-2.5 px-3 w-24 text-center">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {ntBatchRows.map((row, idx) => (
                      <tr key={row.rowId} className="hover:bg-purple-50/30 transition-colors">
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex w-6 h-6 rounded-lg bg-purple-600 text-white font-black text-[11px] items-center justify-center shadow-2xs">
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            required
                            placeholder={`SNT-2026-0${idx + 1}`}
                            value={row.noteNumber}
                            onChange={(e) =>
                              handleUpdateNoteDraftRow(row.rowId, "noteNumber", e.target.value)
                            }
                            className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900 focus:border-purple-500 outline-none"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            placeholder={
                              ntDebtorName || selectedNoteContact?.name || "Borçlu Adı"
                            }
                            value={row.debtorName}
                            onChange={(e) =>
                              handleUpdateNoteDraftRow(row.rowId, "debtorName", e.target.value)
                            }
                            className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:border-purple-500 outline-none"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="date"
                            value={row.issueDate}
                            onChange={(e) =>
                              handleUpdateNoteDraftRow(row.rowId, "issueDate", e.target.value)
                            }
                            className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 font-mono focus:border-purple-500 outline-none"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="date"
                            required
                            value={row.dueDate}
                            onChange={(e) =>
                              handleUpdateNoteDraftRow(row.rowId, "dueDate", e.target.value)
                            }
                            className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-900 font-mono font-bold focus:border-purple-500 outline-none"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={row.amount}
                            onChange={(e) =>
                              handleUpdateNoteDraftRow(
                                row.rowId,
                                "amount",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono font-bold text-right text-slate-900 focus:border-purple-500 outline-none"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            placeholder={ntNotes || "Açıklama..."}
                            value={row.notes}
                            onChange={(e) =>
                              handleUpdateNoteDraftRow(row.rowId, "notes", e.target.value)
                            }
                            className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:border-purple-500 outline-none"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setNtBatchRows((prev) => {
                                  const copy = createDefaultNoteDraftRow(1, row);
                                  const next = [...prev];
                                  next.splice(idx + 1, 0, copy);
                                  return next;
                                });
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700 border border-slate-200 cursor-pointer transition-colors"
                              title="Bu satırı 1 ay sonraki vadeyle altına kopyala"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={ntBatchRows.length <= 1}
                              onClick={() => handleRemoveNoteDraftRow(row.rowId)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Satırı Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-900">
                      <td colSpan={5} className="py-3 px-4 text-right uppercase text-[11px] tracking-wider text-slate-600">
                        Toplam Senet Bordrosu ({ntBatchRows.length} Adet Senet):
                      </td>
                      <td className="py-3 px-2.5 text-right font-mono text-sm font-black text-purple-700">
                        {formatCurrency(totalNoteBatchAmount, ntCurrency)}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleAddNoteDraftRow(false)}
                    className="px-4 py-2 rounded-xl border border-dashed border-purple-300 bg-purple-50/50 hover:bg-purple-50 text-purple-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Satır Ekle</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddNoteDraftRow(true)}
                    className="px-4 py-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Son Satırı Çoğalt (+1 Ay Vade)</span>
                  </button>
                </div>

                <div className="flex items-center gap-4 justify-end">
                  <div className="text-right">
                    <div className="text-[11px] font-semibold text-slate-500">
                      Toplam Girilen Senet ({ntBatchRows.length} Adet)
                    </div>
                    <div className="text-base font-black font-mono text-purple-700">
                      {formatCurrency(totalNoteBatchAmount, ntCurrency)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleBackToList}
                    className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer rounded-xl font-bold text-xs"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl cursor-pointer text-xs shadow-xs flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {ntBatchRows.length > 1
                        ? `${ntBatchRows.length} Adet Senedi Portföye Kaydet`
                        : "Senet Kaydını Oluştur"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </DetailPageLayout>
    );
  }

  {/* NEW TRANSACTION MODAL (Kasa / Banka / POS) */}
  if (isAddTxModalOpen) {
    return (
      <DetailPageLayout
          title={
            addTxContext === "kasa"
              ? "Yeni Kasa Hareketi Ekle"
              : addTxContext === "pos"
              ? "Yeni Banka POS Hareketi Ekle"
              : "Yeni Banka Hareketi Ekle"
          }
          subtitle={
            addTxContext === "kasa"
              ? "Nakit Giriş / Çıkış Fişi ve Kasa Tahsilat/Tediye Kaydı"
              : addTxContext === "pos"
              ? "Kredi Kartı POS Tahsilatı, Komisyon Oranı ve Slip Belgesi Kaydı"
              : "Banka Havale / EFT / Gelen & Giden Transfer Kaydı"
          }
          breadcrumbs={[
            { label: "Finans Yönetimi", onClick: () => setIsAddTxModalOpen(false) },
            {
              label:
                addTxContext === "kasa"
                  ? "Kasa Hareketleri"
                  : addTxContext === "pos"
                  ? "Banka POS Hareketleri"
                  : "Banka Hareketleri",
              onClick: () => setIsAddTxModalOpen(false),
            },
            {
              label:
                addTxContext === "kasa"
                  ? "Yeni Kasa Hareketi"
                  : addTxContext === "pos"
                  ? "Yeni POS Slip Kaydı"
                  : "Yeni Banka Hareketi",
              active: true,
            },
          ]}
          onBack={() => setIsAddTxModalOpen(false)}
          statusBadge={
            <span
              className={`text-xs font-bold px-3 py-1 rounded-xl border ${
                addTxContext === "kasa"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : addTxContext === "pos"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-blue-50 text-blue-800 border-blue-200"
              }`}
            >
              {addTxContext === "kasa"
                ? "KASA FİŞİ"
                : addTxContext === "pos"
                ? "BANKA POS SLİP"
                : "BANKA DEKONTU"}
            </span>
          }
          headerIcon={
            addTxContext === "kasa" ? (
              <Banknote className="w-5 h-5 text-amber-600" />
            ) : addTxContext === "pos" ? (
              <CreditCard className="w-5 h-5 text-emerald-600" />
            ) : (
              <Building className="w-5 h-5 text-blue-600" />
            )
          }
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddTxModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                form="add-transaction-form"
                className={`px-5 py-2 font-bold text-white rounded-xl cursor-pointer text-xs flex items-center gap-1.5 shadow-xs transition-all ${
                  addTxContext === "kasa"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : addTxContext === "pos"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {addTxContext === "kasa"
                    ? "Kasa Hareketini Kaydet"
                    : addTxContext === "pos"
                    ? "POS Tahsilatını Kaydet"
                    : "Banka Hareketini Kaydet"}
                </span>
              </button>
            </div>
          }
        >
          <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl max-w-2xl mx-auto p-6 shadow-sm space-y-4">
            {/* Quick Context Switcher: Kasa / Banka / Banka POS */}
            <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80 mb-2">
              <button
                type="button"
                onClick={() => handleOpenAddTxModal("kasa")}
                className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  addTxContext === "kasa"
                    ? "bg-white text-amber-800 shadow-xs border border-amber-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Banknote className="w-3.5 h-3.5 text-amber-600" />
                <span>Kasa (Nakit)</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddTxModal("banka")}
                className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  addTxContext === "banka"
                    ? "bg-white text-blue-800 shadow-xs border border-blue-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Building className="w-3.5 h-3.5 text-blue-600" />
                <span>Banka (Havale)</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddTxModal("pos")}
                className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  addTxContext === "pos"
                    ? "bg-white text-emerald-800 shadow-xs border border-emerald-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <span>Banka POS</span>
              </button>
            </div>

            <form id="add-transaction-form" onSubmit={handleSaveTransaction} className="space-y-4 text-xs">
              {/* Hazır Finansal İşlem Seçimi */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  İşlem Seçin (Hazır İşlem Türü)
                </label>
                <select
                  value={`${txType}:${txCategory}`}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    const [selectedDir, ...catParts] = val.split(":");
                    const selectedCat = catParts.join(":");
                    const newDir = (selectedDir === "expense" ? "expense" : "income") as "income" | "expense";
                    setTxType(newDir);
                    setTxCategory(selectedCat);
                    if (addTxContext === "kasa") {
                      setTxDocumentNo(
                        `${newDir === "income" ? "THS" : "TDY"}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
                      );
                    }
                  }}
                  className="w-full bg-indigo-50/60 border border-indigo-200 rounded-xl p-2.5 font-bold text-slate-900 cursor-pointer focus:bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  {addTxContext === "kasa" && (
                    <>
                      <optgroup label="➕ Nakit Giriş / Tahsilat İşlemleri">
                        <option value="income:Kasa Tahsilat / Nakit Gelir">Nakit Kasa Tahsilatı (Genel Giriş +)</option>
                        <option value="income:Cari Nakit Tahsilatı">Cari Hesap Nakit Tahsilatı (+)</option>
                        <option value="income:Fatura Nakit Tahsilatı">Satış Faturası Nakit Tahsilatı (+)</option>
                        <option value="income:Peşin Satış Tahsilatı">Peşin Satış / Perakende Nakit Girişi (+)</option>
                        <option value="income:Bankadan Kasaya Nakit Çekim">Bankadan Kasaya Nakit Çekim (+)</option>
                        <option value="income:Ortaklar Cari Nakit Girişi">Ortaklar Cari / Sermaye Nakit Girişi (+)</option>
                      </optgroup>
                      <optgroup label="➖ Nakit Çıkış / Tediye İşlemleri">
                        <option value="expense:Kasa Tediye / Nakit Ödeme">Nakit Kasa Tediyesi (Genel Çıkış -)</option>
                        <option value="expense:Tedarikçi Cari Nakit Ödemesi">Tedarikçi / Cari Nakit Ödemesi (-)</option>
                        <option value="expense:Gider Faturası Nakit Ödemesi">Alış / Gider Faturası Nakit Ödemesi (-)</option>
                        <option value="expense:Personel Maaş / Avans Ödemesi">Personel Maaş / Avans Nakit Ödemesi (-)</option>
                        <option value="expense:Ofis & İşletme Gideri">Ofis, Mutfak, Ulaşım & İşletme Masrafı (-)</option>
                        <option value="expense:Kira / Aidat Nakit Ödemesi">Kira / Aidat Nakit Ödemesi (-)</option>
                        <option value="expense:Vergi / SGK / Harç Ödemesi">Vergi / SGK / Resmi Harç Ödemesi (-)</option>
                        <option value="expense:Kasadan Bankaya Nakit Yatırma">Kasadan Bankaya Nakit Yatırma (-)</option>
                      </optgroup>
                    </>
                  )}
                  {addTxContext === "banka" && (
                    <>
                      <optgroup label="➕ Banka Gelen Transfer / Tahsilat İşlemleri">
                        <option value="income:Banka Gelen Havale / EFT">Gelen Havale / EFT / FAST Tahsilatı (+)</option>
                        <option value="income:Müşteri Cari Banka Tahsilatı">Müşteri Cari Hesap Havale/EFT Tahsilatı (+)</option>
                        <option value="income:Fatura Banka Tahsilatı">Satış Faturası Banka Havale/EFT Tahsilatı (+)</option>
                        <option value="income:Döviz Bozdurma / Kur Girişi">Döviz Satış / Hesaba TL Aktarımı (+)</option>
                        <option value="income:Mevduat Faiz / Fon Getirisi">Mevduat Faiz / Repo / Fon Getirisi (+)</option>
                      </optgroup>
                      <optgroup label="➖ Banka Giden Transfer / Ödeme İşlemleri">
                        <option value="expense:Banka Giden Havale / EFT">Gönderilen Havale / EFT / FAST Ödemesi (-)</option>
                        <option value="expense:Tedarikçi Cari Banka Ödemesi">Tedarikçi Cari Hesap Havale/EFT Ödemesi (-)</option>
                        <option value="expense:Gider Faturası Banka Ödemesi">Alış / Gider Faturası Banka Ödemesi (-)</option>
                        <option value="expense:Personel Maaş Banka Ödemesi">Personel Maaş / Prim Banka Ödemesi (-)</option>
                        <option value="expense:Kira Banka Transferi">İşyeri / Ofis Kira Banka Ödemesi (-)</option>
                        <option value="expense:Vergi / SGK Banka Ödemesi">Vergi / SGK / Bağ-Kur Banka Ödemesi (-)</option>
                        <option value="expense:Banka Kredi / Taksit Ödemesi">Ticari Kredi / Kredi Kartı Borç Ödemesi (-)</option>
                        <option value="expense:Banka Havale / EFT Masrafı">Banka İşlem / EFT Masraf & Komisyonu (-)</option>
                      </optgroup>
                    </>
                  )}
                  {addTxContext === "pos" && (
                    <>
                      <optgroup label="💳 POS Kredi Kartı İşlemleri">
                        <option value="income:POS Tahsilatı (Kredi Kartı)">Fiziksel POS Tek Çekim Tahsilatı (+)</option>
                        <option value="income:POS Taksitli Kredi Kartı Tahsilatı">POS Taksitli Kredi Kartı Tahsilatı (+)</option>
                        <option value="income:Sanal POS / E-Ticaret Tahsilatı">Sanal POS / Online Ödeme Tahsilatı (+)</option>
                        <option value="expense:POS İade / İptal İşlemi">POS Satış İptal / Müşteri İade Çıkışı (-)</option>
                      </optgroup>
                    </>
                  )}
                </select>
              </div>

              {/* İşlem Tipi */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTxType("income")}
                  className={`py-2 px-3 rounded-lg font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    txType === "income"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>
                    {addTxContext === "kasa"
                      ? "Tahsilat / Kasa Gelir (+)"
                      : addTxContext === "pos"
                      ? "POS Kredi Kartı Tahsilatı (+)"
                      : "Gelen Transfer / Tahsilat (+)"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTxType("expense")}
                  className={`py-2 px-3 rounded-lg font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    txType === "expense"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>
                    {addTxContext === "kasa"
                      ? "Tediye / Kasa Gider (-)"
                      : addTxContext === "pos"
                      ? "POS İptal / İade Çıkışı (-)"
                      : "Gönderilen Transfer / Ödeme (-)"}
                  </span>
                </button>
              </div>

              {/* Hesap Seçimi */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {addTxContext === "kasa"
                    ? "Kasa Hesabı *"
                    : addTxContext === "pos"
                    ? "Tahsilatın Aktarılacağı Banka / POS Hesabı *"
                    : "Banka Hesabı *"}
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
                        : a.type === "bank" || a.type === "credit_card" || a.type === "pos"
                    )
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.bankName || (acc.type === "cash" ? "Nakit Kasa" : "Banka/POS")}) - Bakiye: ₺
                        {acc.balance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </option>
                    ))}
                </select>
              </div>

              {/* POS Özel Alanları */}
              {addTxContext === "pos" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200/90">
                  <div>
                    <label className="block font-bold text-emerald-950 mb-1">
                      POS Terminal Türü / Cihaz Adı *
                    </label>
                    <select
                      value={posTerminalName}
                      onChange={(e) => setPosTerminalName(e.target.value)}
                      className="w-full bg-white border border-emerald-300 rounded-xl p-2.5 font-bold text-emerald-950 text-xs cursor-pointer"
                    >
                      <option value="Fiziksel POS Terminali (Yazarkasa)">Fiziksel POS Terminali (Yazarkasa / Mağaza)</option>
                      <option value="Sanal POS (E-Ticaret / Web Ödeme)">Sanal POS (E-Ticaret / Web Ödeme)</option>
                      <option value="Mobil Saha POS (Android POS)">Mobil Saha POS (Android POS)</option>
                      <option value="Garanti BBVA Sanal POS">Garanti BBVA Sanal POS</option>
                      <option value="Akbank Sanal POS">Akbank Sanal POS</option>
                      <option value="Yapı Kredi Sanal POS">Yapı Kredi Sanal POS</option>
                      <option value="İş Bankası Sanal POS">İş Bankası Sanal POS</option>
                      <option value="QNB Finansbank POS">QNB Finansbank POS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-emerald-950 mb-1">
                      Kredi Kartı Slip / Referans No *
                    </label>
                    <input
                      type="text"
                      value={posSlipNo}
                      onChange={(e) => {
                        setPosSlipNo(e.target.value);
                        setTxDocumentNo(e.target.value);
                      }}
                      placeholder="Örn: SLP-891024"
                      className="w-full bg-white border border-emerald-300 rounded-xl p-2.5 font-mono font-bold text-emerald-950 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-emerald-950 mb-1">
                      Banka Komisyon Oranı (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={posCommissionRate}
                        onChange={(e) => setPosCommissionRate(e.target.value)}
                        placeholder="2.45"
                        className="w-full bg-white border border-emerald-300 rounded-xl p-2.5 pr-8 font-mono font-bold text-emerald-950 text-xs"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-emerald-700 text-xs">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-emerald-950 mb-1">
                      Valör Süresi (Bloke Gün)
                    </label>
                    <select
                      value={posValorDays}
                      onChange={(e) => setPosValorDays(parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-emerald-300 rounded-xl p-2.5 font-bold text-emerald-950 text-xs cursor-pointer"
                    >
                      <option value="0">0 Gün (Aynı Gün Anında)</option>
                      <option value="1">1 Gün (Ertesi Gün Valörlü)</option>
                      <option value="7">7 Gün (Haftalık Valör)</option>
                      <option value="14">14 Gün (2 Hafta Valör)</option>
                      <option value="28">28 Gün (Aylık Blokeli)</option>
                      <option value="30">30 Gün (Aylık Blokeli)</option>
                    </select>
                  </div>

                  {/* Canlı POS Hesaplama Bilgi Kartı */}
                  {Number(txAmount) > 0 && (
                    <div className="col-span-full bg-white rounded-xl p-3 border border-emerald-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-extrabold block">Brüt Tahsilat</span>
                        <span className="font-bold text-slate-900 font-mono text-sm">
                          ₺{Number(txAmount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-rose-600 uppercase font-extrabold block">
                          Kesilen POS Komisyonu (%{posCommissionRate || "0"})
                        </span>
                        <span className="font-bold text-rose-600 font-mono text-sm">
                          -₺{((Number(txAmount) * (parseFloat(posCommissionRate) || 0)) / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-700 uppercase font-extrabold block">Net Hesaba Geçecek</span>
                        <span className="font-extrabold text-emerald-700 font-mono text-base">
                          ₺{(Number(txAmount) - ((Number(txAmount) * (parseFloat(posCommissionRate) || 0)) / 100)).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="col-span-full flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="auto-record-comm"
                      checked={autoRecordPosCommission}
                      onChange={(e) => setAutoRecordPosCommission(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 border-emerald-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="auto-record-comm" className="text-xs font-semibold text-emerald-950 cursor-pointer">
                      POS komisyon kesintisini otomatik olarak "Banka & POS Komisyon Gideri" fişi olarak kaydet
                    </label>
                  </div>
                </div>
              )}

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

              {/* Evrak / Makbuz / Dekont No (POS harici ise) */}
              {addTxContext !== "pos" && (
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
              )}

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
                    placeholder={
                      addTxContext === "pos"
                        ? "POS Tahsilatı (Kredi Kartı)"
                        : "Örn: Tahsilat, Ödeme, Masraf"
                    }
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
                      : addTxContext === "pos"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {addTxContext === "kasa"
                    ? "Kasa Hareketini Kaydet"
                    : addTxContext === "pos"
                    ? "POS Tahsilatını Kaydet"
                    : "Banka Hareketini Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </DetailPageLayout>
    );
  }

  /* ENDORSEMENT (CİRO / CİRANTA) DETAIL VIEW */
  if (isEndorseModalOpen) {
    return (
      <DetailPageLayout
        title="Portföydeki Çek / Senedi Ciro Et (Ciranta Yap)"
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
            <button
              type="submit"
              form="endorsement-form"
              disabled={!endorseSelectedDocId || !endorseContactId}
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                endorseDocType === "cheque"
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              Ciro İşlemini Onayla
            </button>
          </div>
        }
      >
        <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl max-w-2xl mx-auto p-6 shadow-sm space-y-4">
          <form id="endorsement-form" onSubmit={handleSaveEndorsement} className="space-y-4 text-xs">
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
              ) : promissoryNotes.filter((n) => n.status === "portfolio").length > 0 ? (
                <select
                  value={endorseSelectedDocId}
                  onChange={(e) => setEndorseSelectedDocId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 cursor-pointer"
                  required
                >
                  <option value="">-- Portföydeki Senedi Seçin --</option>
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
                  <span>Portföyünüzde henüz ciro edilebilir (aktif) müşteri senedi bulunmuyor.</span>
                </div>
              )}
            </div>

            {/* Seçilen Evrak Detay Kartı */}
            {endorseSelectedDocId && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-slate-700">
                {endorseDocType === "cheque" ? (
                  (() => {
                    const doc = cheques.find((c) => c.id === endorseSelectedDocId);
                    if (!doc) return null;
                    return (
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400">Çek No:</span>{" "}
                          <strong className="text-slate-900 font-mono">{doc.chequeNumber}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Banka:</span>{" "}
                          <strong className="text-slate-900">{doc.bankName}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Keşideci / Cari:</span>{" "}
                          <strong className="text-slate-900">{doc.contactName}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Vade Tarihi:</span>{" "}
                          <strong className="text-slate-900 font-mono">{doc.dueDate}</strong>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-slate-200 flex justify-between items-center">
                          <span className="text-slate-500 font-bold">Çek Tutarı:</span>
                          <span className="text-base font-black font-mono text-indigo-700">
                            ₺{doc.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  (() => {
                    const doc = promissoryNotes.find((n) => n.id === endorseSelectedDocId);
                    if (!doc) return null;
                    return (
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400">Senet No:</span>{" "}
                          <strong className="text-slate-900 font-mono">{doc.noteNumber}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Borçlu:</span>{" "}
                          <strong className="text-slate-900">{doc.debtorName}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Cari Hesap:</span>{" "}
                          <strong className="text-slate-900">{doc.contactName}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Vade Tarihi:</span>{" "}
                          <strong className="text-slate-900 font-mono">{doc.dueDate}</strong>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-slate-200 flex justify-between items-center">
                          <span className="text-slate-500 font-bold">Senet Tutarı:</span>
                          <span className="text-base font-black font-mono text-purple-700">
                            ₺{doc.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    );
                  })()
                )}
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
                <option value="">-- Ciro Edilecek Cariyi Seçin --</option>
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

  /* FULL-PAGE DETAIL VIEW: EDIT TRANSACTION (HAREKET DÜZENLE) */
  if (isEditTxModalOpen && editingTransaction) {
    return (
      <DetailPageLayout
        title="Finans Hareketini / Fişi Düzenle"
        subtitle={`${editingTransaction.accountName || "Fiş"} • Tarih: ${editingTransaction.date} • Tutar: ${formatCurrency(editingTransaction.amount, editingTransaction.currency)}`}
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
            {onDeleteTransaction && (
              <button
                type="button"
                onClick={() => {
                  onDeleteTransaction(editingTransaction.id);
                  setIsEditTxModalOpen(false);
                  setEditingTransaction(null);
                }}
                className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sil</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsEditTxModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              form="edit-tx-form"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Kaydet</span>
            </button>
          </div>
        }
      >
        <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl max-w-2xl mx-auto p-6 shadow-sm space-y-4">
          <form
            id="edit-tx-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (onUpdateTransaction && editingTransaction) {
                onUpdateTransaction(editingTransaction);
              }
              setIsEditTxModalOpen(false);
              setEditingTransaction(null);
            }}
            className="space-y-4 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">İşlem Hesabı (Kasa / Banka) *</label>
                <select
                  value={editingTransaction.accountId}
                  onChange={(e) => {
                    const selectedAcc = accounts.find((a) => a.id === e.target.value);
                    setEditingTransaction({
                      ...editingTransaction,
                      accountId: e.target.value,
                      accountName: selectedAcc ? selectedAcc.name : editingTransaction.accountName,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 cursor-pointer"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type === "cash" ? "Kasa" : "Banka"})
                    </option>
                  ))}
                  {!accounts.some((a) => a.id === editingTransaction.accountId) && (
                    <option value={editingTransaction.accountId}>{editingTransaction.accountName}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">İlgili Cari Hesap</label>
                <select
                  value={editingTransaction.contactId || ""}
                  onChange={(e) => {
                    const selectedC = contacts.find((c) => c.id === e.target.value);
                    setEditingTransaction({
                      ...editingTransaction,
                      contactId: e.target.value || undefined,
                      contactName: selectedC ? selectedC.name : undefined,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 cursor-pointer"
                >
                  <option value="">-- Cari Seçilmedi (Genel İşlem) --</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

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
              <label className="block font-bold text-slate-700 mb-1">İşlem Kategorisi</label>
              <input
                type="text"
                value={editingTransaction.category || ""}
                onChange={(e) =>
                  setEditingTransaction({ ...editingTransaction, category: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900"
              />
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

  /* FULL-PAGE DETAIL VIEW: EDIT CHEQUE (ÇEK DÜZENLE) */
  if (isEditChequeModalOpen && editingCheque) {
    return (
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
            {onDeleteCheque && (
              <button
                type="button"
                onClick={() => {
                  onDeleteCheque(editingCheque.id);
                  setIsEditChequeModalOpen(false);
                  setEditingCheque(null);
                }}
                className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sil</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsEditChequeModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              form="edit-cheque-form"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Kaydet</span>
            </button>
          </div>
        }
      >
        <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl max-w-2xl mx-auto p-6 shadow-sm space-y-4">
          <form
            id="edit-cheque-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (onUpdateCheque && editingCheque) {
                onUpdateCheque(editingCheque);
              }
              setIsEditChequeModalOpen(false);
              setEditingCheque(null);
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
                <label className="block font-bold text-slate-700 mb-1">İlgili Cari Hesap</label>
                <select
                  value={editingCheque.contactId || ""}
                  onChange={(e) => {
                    const selectedC = contacts.find((c) => c.id === e.target.value);
                    setEditingCheque({
                      ...editingCheque,
                      contactId: e.target.value || undefined,
                      contactName: selectedC ? selectedC.name : editingCheque.contactName,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 cursor-pointer"
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
                  value={editingCheque.drawerName || ""}
                  onChange={(e) =>
                    setEditingCheque({ ...editingCheque, drawerName: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Keşide Tarihi</label>
                <input
                  type="date"
                  value={editingCheque.issueDate || ""}
                  onChange={(e) =>
                    setEditingCheque({ ...editingCheque, issueDate: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                />
              </div>
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
            </div>

            <div className="grid grid-cols-2 gap-3">
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
              <div>
                <label className="block font-bold text-slate-700 mb-1">Çek Durumu</label>
                <select
                  value={editingCheque.status}
                  onChange={(e) =>
                    setEditingCheque({
                      ...editingCheque,
                      status: e.target.value as ChequeStatus,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 cursor-pointer"
                >
                  <option value="portfolio">Portföyde</option>
                  <option value="collected">Tahsil Edildi</option>
                  <option value="endorsed">Ciro Edildi</option>
                  <option value="paid">Ödendi</option>
                  <option value="bounced">Karşılıksız</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Açıklama / Notlar</label>
              <input
                type="text"
                value={editingCheque.notes || ""}
                onChange={(e) =>
                  setEditingCheque({ ...editingCheque, notes: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
              />
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

  /* FULL-PAGE DETAIL VIEW: EDIT NOTE (SENET DÜZENLE) */
  if (isEditNoteModalOpen && editingNote) {
    return (
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
            {onDeletePromissoryNote && (
              <button
                type="button"
                onClick={() => {
                  onDeletePromissoryNote(editingNote.id);
                  setIsEditNoteModalOpen(false);
                  setEditingNote(null);
                }}
                className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sil</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsEditNoteModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              form="edit-note-form"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Kaydet</span>
            </button>
          </div>
        }
      >
        <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl max-w-2xl mx-auto p-6 shadow-sm space-y-4">
          <form
            id="edit-note-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (onUpdatePromissoryNote && editingNote) {
                onUpdatePromissoryNote(editingNote);
              }
              setIsEditNoteModalOpen(false);
              setEditingNote(null);
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
                <label className="block font-bold text-slate-700 mb-1">İlgili Cari Hesap</label>
                <select
                  value={editingNote.contactId || ""}
                  onChange={(e) => {
                    const selectedC = contacts.find((c) => c.id === e.target.value);
                    setEditingNote({
                      ...editingNote,
                      contactId: e.target.value || undefined,
                      contactName: selectedC ? selectedC.name : editingNote.contactName,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 cursor-pointer"
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
                  value={editingNote.debtorName || ""}
                  onChange={(e) =>
                    setEditingNote({ ...editingNote, debtorName: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
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
            </div>

            <div className="grid grid-cols-2 gap-3">
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
              <div>
                <label className="block font-bold text-slate-700 mb-1">Senet Durumu</label>
                <select
                  value={editingNote.status}
                  onChange={(e) =>
                    setEditingNote({
                      ...editingNote,
                      status: e.target.value as PromissoryNoteStatus,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 cursor-pointer"
                >
                  <option value="portfolio">Portföyde</option>
                  <option value="collected">Tahsil Edildi</option>
                  <option value="endorsed">Ciro Edildi</option>
                  <option value="paid">Ödendi</option>
                  <option value="protested">Protestolu</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Açıklama / Notlar</label>
              <input
                type="text"
                value={editingNote.notes || ""}
                onChange={(e) =>
                  setEditingNote({ ...editingNote, notes: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
              />
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

  /* FULL-PAGE DETAIL VIEW: UNIVERSAL FINANCE & TRANSACTION SHARE */
  if (shareConfig.isOpen) {
    return (
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
    <div
      className={`p-4 sm:p-6 space-y-6 sm:space-y-7 mx-auto ${
        activeSubModule === "fis" ? "w-full max-w-none" : "max-w-7xl"
      }`}
    >
      {/* 1. Modern Clean Header With Editorial Background */}
      <ModuleEntranceHeader
        className={isQuickActionMenuOpen ? "z-50" : "z-30"}
        badge={isStandaloneFis ? "Muhasebe & Fiş Yönetimi" : "Finans & Nakit Akışı"}
        badgeIcon={
          isStandaloneFis ? (
            <Receipt className="w-2.5 h-2.5 text-[#0f6bae]" />
          ) : (
            <Wallet className="w-2.5 h-2.5 text-[#0f6bae]" />
          )
        }
        title={
          isStandaloneFis
            ? activeFisViewMode === "fis_listesi"
              ? "Fiş Listesi"
              : "Fiş Girişi"
            : "Finans & Nakit Yönetimi"
        }
        description={
          isStandaloneFis
            ? activeFisViewMode === "fis_listesi"
              ? "Kayıtlı Tahsilat, Tediye, Perakende Gider/Masraf ve Mahsup Fişleri Listesi ve Raporlama."
              : "Tahsilat Fişi, Tediye Fişi, Perakende Harcama/Masraf Fişi ve Muhasebe Mahsup Fişi Girişi (Çoklu & Tekli)."
            : "Nakit Kasa, Banka Hesapları, Çek, Senet ve Hesaplar Arası Virman Yönetimi."
        }
        actions={
          <>
            {!isStandaloneFis && (
              /* Hızlı İşlem Seçme Menüsü (Dropdown) */
              <div className={`relative ${isQuickActionMenuOpen ? "z-50" : ""}`}>
                <button
                  type="button"
                  onClick={() => setIsQuickActionMenuOpen((prev) => !prev)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-xs shrink-0"
                  title="Finansal işlem türü seçerek hızlı kayıt oluşturun"
                >
                  <CheckCircle2 className="w-4 h-4 text-indigo-100" />
                  <span>İşlem Seç</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isQuickActionMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {isQuickActionMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsQuickActionMenuOpen(false)}
                    />
                    <div className="absolute left-0 right-auto top-full mt-2 w-80 sm:w-88 max-h-[min(82vh,560px)] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-[100] text-xs custom-scrollbar">
                      <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50/70">
                        💵 Nakit Kasa İşlemleri
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsQuickActionMenuOpen(false);
                          setActiveSubModule("kasa");
                          handleOpenAddTxModal("kasa");
                          setTxType("income");
                          setTxCategory("Kasa Tahsilat / Nakit Gelir");
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-amber-50 flex items-center justify-between text-slate-700 font-semibold cursor-pointer"
                      >
                        <span>Nakit Kasa Tahsilatı (Giriş +)</span>
                        <span className="text-[10px] font-bold text-emerald-600">+ Tahsilat</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsQuickActionMenuOpen(false);
                          setActiveSubModule("kasa");
                          handleOpenAddTxModal("kasa");
                          setTxType("expense");
                          setTxCategory("Kasa Tediye / Nakit Ödeme");
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-amber-50 flex items-center justify-between text-slate-700 font-semibold cursor-pointer"
                      >
                        <span>Nakit Kasa Tediyesi (Çıkış -)</span>
                        <span className="text-[10px] font-bold text-rose-600">- Ödeme</span>
                      </button>

                      <div className="px-3 py-1.5 mt-1 text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50/70">
                        🏦 Banka & POS İşlemleri
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsQuickActionMenuOpen(false);
                          setActiveSubModule("banka");
                          handleOpenAddTxModal("banka");
                          setTxType("income");
                          setTxCategory("Banka Gelen Havale / EFT");
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-blue-50 flex items-center justify-between text-slate-700 font-semibold cursor-pointer"
                      >
                        <span>Gelen Havale / EFT Tahsilatı (+)</span>
                        <span className="text-[10px] font-bold text-emerald-600">+ Gelen</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsQuickActionMenuOpen(false);
                          setActiveSubModule("banka");
                          handleOpenAddTxModal("banka");
                          setTxType("expense");
                          setTxCategory("Banka Giden Havale / EFT");
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-blue-50 flex items-center justify-between text-slate-700 font-semibold cursor-pointer"
                      >
                        <span>Giden Havale / EFT Ödemesi (-)</span>
                        <span className="text-[10px] font-bold text-rose-600">- Giden</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsQuickActionMenuOpen(false);
                          setActiveSubModule("banka");
                          handleOpenAddTxModal("pos");
                          setTxType("income");
                          setTxCategory("POS Tahsilatı (Kredi Kartı)");
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 flex items-center justify-between text-slate-700 font-semibold cursor-pointer"
                      >
                        <span>Kredi Kartı POS Slip Tahsilatı</span>
                        <span className="text-[10px] font-bold text-emerald-600">POS</span>
                      </button>

                      <div className="px-3 py-1.5 mt-1 text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50/70">
                        📑 Çek & Senet İşlemleri
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsQuickActionMenuOpen(false);
                          setActiveSubModule("cek");
                          setChqType("received");
                          setChqNumber(`CHK-${Math.floor(100000 + Math.random() * 900000)}`);
                          setIsChequeModalOpen(true);
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-indigo-50 flex items-center justify-between text-slate-700 font-semibold cursor-pointer"
                      >
                        <span>Müşteri Çeki Girişi (Alınan Çek)</span>
                        <span className="text-[10px] font-bold text-indigo-600">Çek Al</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsQuickActionMenuOpen(false);
                          setActiveSubModule("cek");
                          setChqType("issued");
                          setChqNumber(`CHK-${Math.floor(100000 + Math.random() * 900000)}`);
                          setIsChequeModalOpen(true);
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-indigo-50 flex items-center justify-between text-slate-700 font-semibold cursor-pointer"
                      >
                        <span>Firma Borç Çeki Çıkışı (Verilen)</span>
                        <span className="text-[10px] font-bold text-amber-600">Çek Ver</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsQuickActionMenuOpen(false);
                          setActiveSubModule("cek");
                          handleOpenEndorseModal("cheque");
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-indigo-50 flex items-center justify-between text-slate-700 font-semibold cursor-pointer"
                      >
                        <span>Portföyden Çek Ciro Et</span>
                        <span className="text-[10px] font-bold text-purple-600">Ciro</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsQuickActionMenuOpen(false);
                          setActiveSubModule("senet");
                          setNtType("received");
                          setNtNumber(`SNT-2026-${Math.floor(100 + Math.random() * 900)}`);
                          setIsNoteModalOpen(true);
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-purple-50 flex items-center justify-between text-slate-700 font-semibold cursor-pointer"
                      >
                        <span>Müşteri Senedi Girişi (Alınan)</span>
                        <span className="text-[10px] font-bold text-purple-600">Senet Al</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsQuickActionMenuOpen(false);
                          setActiveSubModule("senet");
                          setNtType("issued");
                          setNtNumber(`SNT-2026-${Math.floor(100 + Math.random() * 900)}`);
                          setIsNoteModalOpen(true);
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-purple-50 flex items-center justify-between text-slate-700 font-semibold cursor-pointer"
                      >
                        <span>Borç Senedi Çıkışı (Verilen)</span>
                        <span className="text-[10px] font-bold text-amber-600">Senet Ver</span>
                      </button>

                      <div className="px-3 py-1.5 mt-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50/70">
                        🔄 Virman & Hesap Tanımları
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsQuickActionMenuOpen(false);
                          setIsTransferModalOpen(true);
                          detailNav.openTransfer();
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 flex items-center justify-between text-slate-700 font-semibold cursor-pointer"
                      >
                        <span>Hesaplar Arası Virman / Transfer</span>
                        <span className="text-[10px] font-bold text-emerald-600">Virman</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsQuickActionMenuOpen(false);
                          setAccType("cash");
                          setIsAccountModalOpen(true);
                          detailNav.openCreate();
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-100 flex items-center justify-between text-slate-700 font-semibold cursor-pointer"
                      >
                        <span>Yeni Nakit Kasa Hesabı Aç</span>
                        <span className="text-[10px] font-bold text-slate-500">Kasa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsQuickActionMenuOpen(false);
                          setAccType("bank");
                          setIsAccountModalOpen(true);
                          detailNav.openCreate();
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-100 flex items-center justify-between text-slate-700 font-semibold cursor-pointer"
                      >
                        <span>Yeni Banka Hesabı Aç</span>
                        <span className="text-[10px] font-bold text-slate-500">Banka</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {!isStandaloneFis && activeSubModule !== "virman" && (
              <button
                onClick={() => {
                  setIsTransferModalOpen(true);
                  detailNav.openTransfer();
                }}
                className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-2xs shrink-0"
                title="Hesaplar arası anlık virman transferi yap"
              >
                <ArrowRightLeft className="w-4 h-4 text-purple-600" />
                <span>Hızlı Virman</span>
              </button>
            )}

            {activeSubModule === "kasa" && (
              <>
                <button
                  onClick={() => handleOpenAddTxModal("kasa")}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-2xs transition-all shrink-0"
                  title="Yeni Nakit Kasa Hareketi (Giriş / Çıkış) Ekle"
                >
                  <Plus className="w-4 h-4" />
                  <span>Kasa Hareketi Ekle</span>
                </button>
                <button
                  onClick={() => {
                    setAccType("cash");
                    setIsAccountModalOpen(true);
                    detailNav.openCreate();
                  }}
                  className="text-white font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-2xs transition-all shrink-0"
                  style={{ backgroundColor: theme.primaryColor }}
                  title="Yeni Nakit Kasa Hesabı Tanımla"
                >
                  <Plus className="w-4 h-4" />
                  <span>Yeni Kasa Ekle</span>
                </button>
              </>
            )}

            {activeSubModule === "banka" && (
              <>
                <button
                  onClick={() => handleOpenAddTxModal("banka")}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-2xs transition-all shrink-0"
                  title="Yeni Banka Havale / EFT Hareketi Ekle"
                >
                  <Plus className="w-4 h-4" />
                  <span>Banka Hareketi Ekle</span>
                </button>
                <button
                  onClick={() => handleOpenAddTxModal("pos")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-2xs transition-all shrink-0"
                  title="Yeni Kredi Kartı POS Tahsilatı ve Slip Kaydı Ekle"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Banka POS Hareketi Ekle</span>
                </button>
                <button
                  onClick={() => setIsBankStatementModalOpen(true)}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-2xs transition-all shrink-0"
                  title="Banka Ekstresi (CSV / Excel) Yükle"
                >
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  <span>Banka Ekstresi Yükle</span>
                </button>
                <button
                  onClick={() => {
                    setAccType("bank");
                    setIsAccountModalOpen(true);
                    detailNav.openCreate();
                  }}
                  className="text-white font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-2xs transition-all shrink-0"
                  style={{ backgroundColor: theme.primaryColor }}
                  title="Yeni Banka Hesabı Tanımla"
                >
                  <Plus className="w-4 h-4" />
                  <span>Yeni Banka Hesabı</span>
                </button>
              </>
            )}

            {activeSubModule === "cek" && (
              <>
                <button
                  onClick={() => {
                    setChqNumber(`CHK-${Math.floor(100000 + Math.random() * 900000)}`);
                    setIsChequeModalOpen(true);
                  }}
                  className="text-white font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-2xs transition-all shrink-0"
                  style={{ backgroundColor: theme.primaryColor }}
                  title="Yeni Alınan veya Verilen Çek Kaydı Ekle"
                >
                  <Plus className="w-4 h-4" />
                  <span>Çek Ekle</span>
                </button>
                <button
                  onClick={() => handleOpenEndorseModal("cheque")}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-2xs shrink-0"
                  title="Portföydeki bir çeki ciro et"
                >
                  <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                  <span>Çek Ciro Et</span>
                </button>
              </>
            )}

            {activeSubModule === "senet" && (
              <>
                <button
                  onClick={() => {
                    setNtNumber(`SNT-2026-${Math.floor(100 + Math.random() * 900)}`);
                    setIsNoteModalOpen(true);
                  }}
                  className="text-white font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-2xs transition-all shrink-0"
                  style={{ backgroundColor: theme.primaryColor }}
                  title="Yeni Alınan veya Verilen Senet Kaydı Ekle"
                >
                  <Plus className="w-4 h-4" />
                  <span>Senet Ekle</span>
                </button>
                <button
                  onClick={() => handleOpenEndorseModal("note")}
                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-2xs shrink-0"
                  title="Portföydeki bir senedi ciro et"
                >
                  <ArrowRightLeft className="w-4 h-4 text-purple-600" />
                  <span>Senet Ciro Et</span>
                </button>
              </>
            )}

            {activeSubModule === "virman" && (
              <button
                onClick={() => {
                  setIsTransferModalOpen(true);
                  detailNav.openTransfer();
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-2xs transition-all shrink-0"
                title="Yeni Hesaplar Arası Virman Transferi Ekle"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Yeni Virman Kaydı Ekle</span>
              </button>
            )}

            {activeSubModule === "fis" && (
              <>
                <button
                  onClick={() => {
                    handleSelectFisViewMode("fis_girisi");
                    handleSelectFisType("tahsilat");
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all shrink-0"
                  title="Yeni Tahsilat Fişi (Giriş +) Oluştur"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tahsilat Fişi</span>
                </button>
                <button
                  onClick={() => {
                    handleSelectFisViewMode("fis_girisi");
                    handleSelectFisType("tediye");
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all shrink-0"
                  title="Yeni Tediye / Ödeme Fişi (Çıkış -) Oluştur"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tediye Fişi</span>
                </button>
                <button
                  onClick={() => {
                    handleSelectFisViewMode("fis_girisi");
                    handleSelectFisType("gider_fisi");
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all shrink-0"
                  title="Yeni Perakende Harcama / Masraf Fişi (KDV'li) Oluştur"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Masraf / Gider Fişi</span>
                </button>
              </>
            )}
          </>
        }
      />

      {!isStandaloneFis && (
        <>
          {/* 2. Top 4 KPI Summary Cards Grid (Reference Design) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Nakit Kasalar */}
            <div
              onClick={() => {
                setActiveSubModule("kasa");
                setSelectedCashAccountId(null);
              }}
              className={`rounded-2xl p-5 border shadow-2xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer haze-kpi-card-bg relative overflow-hidden ${
                activeSubModule === "kasa" ? "ring-2 ring-amber-500/50" : ""
              }`}
              style={{ backgroundColor: theme.cardBg, borderColor: activeSubModule === "kasa" ? "#f59e0b" : theme.cardBorder }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">Nakit Kasa Bakiyesi</p>
                  <p className="text-2xl font-bold font-mono tracking-tight text-amber-600 mt-2">
                    ₺{totalCashBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                  <img src={ASSET_ICONS.nakit} alt="Nakit" className="w-6 h-6 object-contain" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                <span className="font-semibold text-amber-600">
                  {accounts.filter((a) => a.type === "cash").length}
                </span>
                <span>aktif nakit kasa</span>
              </div>
            </div>

            {/* Card 2: Banka Bakiyeleri */}
            <div
              onClick={() => {
                setActiveSubModule("banka");
                setSelectedBankAccountId(null);
              }}
              className={`rounded-2xl p-5 border shadow-2xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer haze-kpi-card-bg relative overflow-hidden ${
                activeSubModule === "banka" ? "ring-2 ring-blue-500/50" : ""
              }`}
              style={{ backgroundColor: theme.cardBg, borderColor: activeSubModule === "banka" ? "#3b82f6" : theme.cardBorder }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">Banka & POS Bakiyesi</p>
                  <p className="text-2xl font-bold font-mono tracking-tight text-blue-600 mt-2">
                    ₺{totalBankBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                  <img src={ASSET_ICONS.nakit} alt="Banka" className="w-6 h-6 object-contain" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                <span className="font-semibold text-blue-600">
                  {accounts.filter((a) => a.type === "bank" || a.type === "credit_card").length}
                </span>
                <span>banka hesabı</span>
              </div>
            </div>

            {/* Card 3: Çek & Senet Portföyü */}
            <div
              onClick={() => setActiveSubModule("cek")}
              className={`rounded-2xl p-5 border shadow-2xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer haze-kpi-card-bg relative overflow-hidden ${
                activeSubModule === "cek" || activeSubModule === "senet" ? "ring-2 ring-indigo-500/50" : ""
              }`}
              style={{ backgroundColor: theme.cardBg, borderColor: (activeSubModule === "cek" || activeSubModule === "senet") ? (theme.primaryColor || "#005289") : theme.cardBorder }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">Çek / Senet Portföyü</p>
                  <p className="text-2xl font-bold font-mono tracking-tight text-indigo-600 mt-2">
                    ₺{(portfolioChequesTotal + portfolioNotesTotal).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <img src={ASSET_ICONS.toplamAlacak} alt="Portföy" className="w-6 h-6 object-contain" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                <span className="font-semibold text-indigo-600">
                  {cheques.filter((c) => c.status === "portfolio").length} çek
                </span>
                <span>•</span>
                <span className="font-semibold text-indigo-600">
                  {promissoryNotes.filter((n) => n.status === "portfolio").length} senet
                </span>
              </div>
            </div>

            {/* Card 4: Toplam Net Likidite */}
            <div
              className="rounded-2xl p-5 border shadow-2xs hover:shadow-md transition-all flex flex-col justify-between haze-kpi-card-bg relative overflow-hidden"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">Kullanılabilir Net Likidite</p>
                  <p className="text-2xl font-bold font-mono tracking-tight text-emerald-600 mt-2">
                    ₺{(totalCashBalance + totalBankBalance).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <img src={ASSET_ICONS.ciro} alt="Likidite" className="w-6 h-6 object-contain" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Kasa + Banka toplam fon</span>
              </div>
            </div>
          </div>

          {/* 3. Sub-Module Navigation Toolbar */}
          <div
            className="rounded-2xl p-3 sm:p-4 border shadow-2xs flex flex-wrap items-center justify-between gap-3"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
          >
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
              <button
                onClick={() => {
                  setActiveSubModule("kasa");
                  setSelectedCashAccountId(null);
                }}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                  activeSubModule === "kasa"
                    ? "bg-amber-600 text-white font-bold shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Nakit Kasalar ({accounts.filter((a) => a.type === "cash").length})</span>
              </button>

              <button
                onClick={() => {
                  setActiveSubModule("banka");
                  setSelectedBankAccountId(null);
                }}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                  activeSubModule === "banka"
                    ? "bg-blue-600 text-white font-bold shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Building className="w-4 h-4" />
                <span>Banka & POS ({accounts.filter((a) => a.type === "bank" || a.type === "credit_card" || a.type === "pos").length})</span>
              </button>

              <button
                onClick={() => setActiveSubModule("cek")}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                  activeSubModule === "cek"
                    ? "bg-indigo-600 text-white font-bold shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Çek Portföyü ({cheques.filter((c) => c.status === "portfolio").length})</span>
              </button>

              <button
                onClick={() => setActiveSubModule("senet")}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                  activeSubModule === "senet"
                    ? "bg-fuchsia-600 text-white font-bold shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Stamp className="w-4 h-4" />
                <span>Senet Portföyü ({promissoryNotes.filter((n) => n.status === "portfolio").length})</span>
              </button>

              <button
                onClick={() => setActiveSubModule("virman")}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                  activeSubModule === "virman"
                    ? "bg-emerald-600 text-white font-bold shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Virman / Transfer ({virmanTransactions.length})</span>
              </button>
            </div>
          </div>
        </>
      )}

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
                            onClick={() => {
                              setEditingAccount(acc);
                              setIsEditAccountModalOpen(true);
                              detailNav.openEdit(acc, acc.id);
                            }}
                            className="p-1.5 rounded-lg border border-amber-300/80 hover:bg-amber-300 text-amber-950 transition-colors cursor-pointer shadow-2xs shrink-0"
                            title="Hesabı Düzenle"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-amber-900" />
                          </button>
                          {onDeleteAccount && (
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteAccount(acc.id);
                                if (selectedCashAccountId === acc.id) {
                                  setSelectedCashAccountId(null);
                                }
                              }}
                              className="p-1.5 rounded-lg border border-rose-300 bg-rose-50/90 hover:bg-rose-200 text-rose-700 transition-colors cursor-pointer shadow-2xs shrink-0"
                              title="Kasayı Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-700" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleShowAccountReceipt(acc)}
                            className="p-1.5 rounded-lg border border-amber-300/80 hover:bg-amber-300 text-amber-950 transition-colors cursor-pointer shadow-2xs shrink-0"
                            title="Dekont / Ekstre Göster (Yazdır / PDF)"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-900" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleShowAccountReceipt(acc);
                              setIsReceiptWhatsAppOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-emerald-300 hover:bg-emerald-200 text-emerald-950 transition-colors cursor-pointer shadow-2xs shrink-0"
                            title="Ekstre / Dekontu WhatsApp ile Paylaş"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-850" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenAddTxModal("kasa", acc.id)}
                            className="p-1.5 rounded-lg border border-amber-400 bg-amber-200/80 hover:bg-amber-300 text-amber-950 transition-colors cursor-pointer shadow-2xs shrink-0 flex items-center gap-1 text-[11px] font-bold"
                            title="Bu Kasaya Nakit Giriş/Çıkış Hareketi Ekle"
                          >
                            <Plus className="w-3.5 h-3.5 text-amber-900" />
                            <span className="hidden sm:inline">Hareket Ekle</span>
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
            {accounts.filter((a) => a.type === "cash").length === 0 && (
              <div className="sm:col-span-2 lg:col-span-3 rounded-2xl p-6 border border-dashed border-amber-300 bg-amber-50/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">Kayıtlı Nakit Kasa Bulunmuyor</h4>
                    <p className="text-xs text-slate-500">Yeni bir nakit kasa oluşturarak tahsilat ve tediye işlemlerinizi takip edebilirsiniz.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAccType("cash");
                    setIsAccountModalOpen(true);
                    detailNav.openCreate();
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Yeni Kasa Ekle</span>
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-amber-600" />
                  <span>Nakit Kasa Gelir ve Gider Hareketleri</span>
                  {selectedCashAccountId && (
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                      Seçili: {accounts.find((a) => a.id === selectedCashAccountId)?.name}
                    </span>
                  )}
                </h3>

                {/* Kasa İşlem Türü Filtre Seçimi */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setKasaFilterType("all")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      kasaFilterType === "all"
                        ? "bg-amber-600 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Tüm İşlemler
                  </button>
                  <button
                    type="button"
                    onClick={() => setKasaFilterType("income")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      kasaFilterType === "income"
                        ? "bg-emerald-600 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Tahsilat (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setKasaFilterType("expense")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      kasaFilterType === "expense"
                        ? "bg-rose-600 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Tediye (-)
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                {selectedCashAccountId && (
                  <>
                    <button
                      onClick={() => setSelectedCashAccountId(null)}
                      className="text-xs text-amber-700 hover:text-amber-900 font-bold bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-xl border border-amber-200 transition-colors cursor-pointer"
                    >
                      Tüm Kasaları Göster
                    </button>
                    {onDeleteAccount && (
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteAccount(selectedCashAccountId);
                          setSelectedCashAccountId(null);
                        }}
                        className="text-xs text-rose-700 hover:text-rose-900 font-bold bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-xl border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                        title="Seçili kasayı sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Seçili Kasayı Sil</span>
                      </button>
                    )}
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setShowKasaColFilters((prev) => !prev)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                    showKasaColFilters
                      ? "bg-amber-50 border-amber-300 text-amber-900 font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium"
                  }`}
                  title="Sütun bazlı arama ve filtreleme alanlarını göster/gizle"
                >
                  <Filter className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">Sütun Filtreleri</span>
                  {activeKasaColFilterCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {activeKasaColFilterCount}
                    </span>
                  )}
                </button>
                <ExportButtons getExportData={getKasaExportData} size="sm" />
                <ColumnManagementDropdown
                  columns={kasaColumns}
                  columnVisibility={kasaColVisibility}
                  onToggleColumn={toggleKasaCol}
                  onSetAllColumns={setAllKasaCols}
                  onResetToDefaults={resetKasaCols}
                  hiddenCount={hiddenKasaColCount}
                />
                <button
                  onClick={() => handleOpenAddTxModal("kasa")}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Kasa Hareketi Ekle</span>
                </button>
              </div>
            </div>

            <BulkActionBar
              selectedCount={kasaSelection.selectedCount}
              totalCount={kasaTransactions.length}
              itemLabel="kasa işlemi"
              deleteLabel="Seçilen İşlemleri Sil"
              onSelectAll={() => kasaSelection.selectAll(kasaTransactions.map((t) => t.id))}
              onClearSelection={kasaSelection.clearSelection}
              onDelete={onDeleteTransaction || onBulkDeleteTransactions ? handleBulkDeleteKasa : undefined}
              onExportExcel={handleBulkExportKasaExcel}
              onExportPdf={handleBulkExportKasaPDF}
            />

            <div
              className="overflow-x-auto custom-scrollbar w-full rounded-2xl border shadow-2xs overflow-hidden p-2"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
            >
              <table className="w-full text-left text-xs min-w-[750px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-9 text-center">
                      <TableCheckbox
                        checked={kasaSelection.isAllSelected(displayedKasaIds)}
                        indeterminate={kasaSelection.isIndeterminate(displayedKasaIds)}
                        onChange={() => kasaSelection.toggleSelectAll(displayedKasaIds)}
                        ariaLabel="Tüm kasa işlemlerini seç"
                      />
                    </th>
                    {isKasaColVisible("date") && <th className="py-2.5 px-4">Tarih</th>}
                    {isKasaColVisible("documentNo") && <th className="py-2.5 px-4">Evrak / Makbuz No</th>}
                    {isKasaColVisible("accountName") && <th className="py-2.5 px-4">Kasa</th>}
                    {isKasaColVisible("contact") && <th className="py-2.5 px-4">İşlem / Cari</th>}
                    {isKasaColVisible("description") && <th className="py-2.5 px-4">Açıklama</th>}
                    {isKasaColVisible("amount") && <th className="py-2.5 px-4 text-right">Tutar</th>}
                    {isKasaColVisible("actions") && <th className="py-2.5 px-4 text-center">İşlemler</th>}
                  </tr>
                  {/* Sütun Bazlı Filtreleme Satırı */}
                  {showKasaColFilters && (
                    <tr className="bg-slate-50/40 transition-colors">
                      <th className="py-1.5 px-2 w-9" />
                      {isKasaColVisible("date") && (
                        <th className="py-1.5 px-2 font-normal">
                          <TableColumnFilterInput
                            value={kasaColFilters.date}
                            onChange={(val) => setKasaColFilters((prev) => ({ ...prev, date: val }))}
                            placeholder="Tarih..."
                          />
                        </th>
                      )}
                      {isKasaColVisible("documentNo") && (
                        <th className="py-1.5 px-2 font-normal">
                          <TableColumnFilterInput
                            value={kasaColFilters.documentNo}
                            onChange={(val) => setKasaColFilters((prev) => ({ ...prev, documentNo: val }))}
                            placeholder="Evrak / Makbuz..."
                          />
                        </th>
                      )}
                      {isKasaColVisible("accountName") && (
                        <th className="py-1.5 px-2 font-normal">
                          <TableColumnFilterInput
                            value={kasaColFilters.accountName}
                            onChange={(val) => setKasaColFilters((prev) => ({ ...prev, accountName: val }))}
                            placeholder="Kasa adı..."
                          />
                        </th>
                      )}
                      {isKasaColVisible("contact") && (
                        <th className="py-1.5 px-2 font-normal">
                          <TableColumnFilterInput
                            value={kasaColFilters.contact}
                            onChange={(val) => setKasaColFilters((prev) => ({ ...prev, contact: val }))}
                            placeholder="İşlem / Cari..."
                          />
                        </th>
                      )}
                      {isKasaColVisible("description") && (
                        <th className="py-1.5 px-2 font-normal">
                          <TableColumnFilterInput
                            value={kasaColFilters.description}
                            onChange={(val) => setKasaColFilters((prev) => ({ ...prev, description: val }))}
                            placeholder="Açıklama..."
                          />
                        </th>
                      )}
                      {isKasaColVisible("amount") && (
                        <th className="py-1.5 px-2 font-normal w-28">
                          <TableColumnFilterInput
                            value={kasaColFilters.amount}
                            onChange={(val) => setKasaColFilters((prev) => ({ ...prev, amount: val }))}
                            placeholder="Tutar..."
                          />
                        </th>
                      )}
                      {isKasaColVisible("actions") && (
                        <th className="py-1.5 px-2 font-normal text-center">
                          {activeKasaColFilterCount > 0 ? (
                            <button
                              type="button"
                              onClick={clearAllKasaColFilters}
                              className="px-2 py-1 text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Tüm sütun filtrelerini temizle"
                            >
                              <X className="w-3 h-3" />
                              <span>Temizle</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">Filtrele</span>
                          )}
                        </th>
                      )}
                    </tr>
                  )}
                </thead>
                <tbody>
                  {kasaTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={visibleKasaColCount} className="text-center py-8 text-slate-400">
                        Kasa hareketi bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    displayedKasaTransactions.map((tx) => {
                      const isIncome = tx.type === "income" || tx.type === "collection";
                      const isExpanded = !!expandedRows[tx.id];
                      const isSelected = kasaSelection.isSelected(tx.id);
                      return (
                        <React.Fragment key={tx.id}>
                          <tr
                            className={`${
                              isSelected ? "bg-indigo-50/70" : "bg-white"
                            } hover:bg-blue-50/80 transition-all group cursor-pointer shadow-2xs`}
                          >
                            <td
                              className="py-3 px-3 text-center w-9 rounded-l-xl border-y border-l border-slate-200/80"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <TableCheckbox
                                checked={isSelected}
                                onChange={() => kasaSelection.toggleSelect(tx.id)}
                                ariaLabel={`${tx.documentNo || tx.description} işlemini seç`}
                              />
                            </td>
                            {isKasaColVisible("date") && (
                              <td className="py-3 px-4 font-medium text-slate-600 font-mono tabular-nums border-y border-slate-200/80 last:rounded-r-xl last:border-r">
                                {formatDate(tx.date)}
                              </td>
                            )}
                            {isKasaColVisible("documentNo") && (
                              <td className="py-3 px-4 font-mono tabular-nums font-semibold text-slate-700 border-y border-slate-200/80 first:rounded-l-xl first:border-l last:rounded-r-xl last:border-r">
                                {tx.documentNo ? (
                                  <span className="bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded text-[11px] font-mono tabular-nums">
                                    {tx.documentNo}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                            )}
                            {isKasaColVisible("accountName") && (
                              <td className="py-3 px-4 font-bold text-slate-800 border-y border-slate-200/80 first:rounded-l-xl first:border-l last:rounded-r-xl last:border-r">
                                {tx.accountName}
                              </td>
                            )}
                            {isKasaColVisible("contact") && (
                              <td className="py-3 px-4 text-slate-700 font-medium border-y border-slate-200/80 first:rounded-l-xl first:border-l last:rounded-r-xl last:border-r">
                                {tx.contactName || tx.category}
                              </td>
                            )}
                            {isKasaColVisible("description") && (
                              <td className="py-3 px-4 text-slate-500 border-y border-slate-200/80 first:rounded-l-xl first:border-l last:rounded-r-xl last:border-r">
                                {tx.description}
                              </td>
                            )}
                            {isKasaColVisible("amount") && (
                              <td
                                className={`py-3 px-4 text-right font-mono tabular-nums font-tabular-num-md font-bold border-y border-slate-200/80 first:rounded-l-xl first:border-l last:rounded-r-xl last:border-r ${
                                  isIncome ? "text-emerald-600" : "text-rose-600"
                                }`}
                              >
                                {isIncome ? "+" : "-"}₺
                                {tx.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                              </td>
                            )}
                            {isKasaColVisible("actions") && (
                              <td className="py-3 px-4 text-center border-y border-slate-200/80 first:rounded-l-xl first:border-l last:rounded-r-xl last:border-r">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => toggleRowExpand(tx.id)}
                                    title={isExpanded ? "Detayları Gizle" : "Hızlı İncele (Master-Detail)"}
                                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                      isExpanded
                                        ? "bg-purple-50 text-purple-700 border-purple-200"
                                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                                    }`}
                                  >
                                    <ChevronDown
                                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                        isExpanded ? "rotate-180 text-purple-600" : "text-slate-600"
                                      }`}
                                    />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingTransaction(tx);
                                      setIsEditTxModalOpen(true);
                                    }}
                                    className="p-1.5 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-600 hover:text-amber-700 transition-colors cursor-pointer"
                                    title="İşlemi Düzenle"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleShowTransactionReceipt(tx)}
                                    className="p-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 transition-colors cursor-pointer"
                                    title="Kasa Makbuzu & Dekont Yazdır / PDF"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleShowTransactionReceipt(tx);
                                      setIsReceiptWhatsAppOpen(true);
                                    }}
                                    className="p-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                                    title="Makbuz / Dekontu WhatsApp ile Paylaş"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAddTxContext("kasa");
                                      setTxAccountId(tx.accountId);
                                      setTxAmount(tx.amount);
                                      setTxContactId(tx.contactId || "");
                                      setTxDescription(`${tx.description ? tx.description + " - " : ""}Kasa Tahsilat/Ödeme İşlemi`);
                                      setIsAddTxModalOpen(true);
                                    }}
                                    title="Nakit / Tahsilat / Ödeme Ekle"
                                    className="p-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                  </button>
                                  {onDeleteTransaction && (
                                    <button
                                      type="button"
                                      onClick={() => onDeleteTransaction(tx.id)}
                                      className="p-1.5 rounded-lg border border-transparent hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                      title="İşlemi Sil"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>

                          {/* Master-Detail Expanded Row Section */}
                          {isExpanded && (
                            <tr className="bg-slate-50/70 border-y border-slate-200" data-skip-row-highlight="true">
                              <td colSpan={visibleKasaColCount} className="p-0">
                                <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-50 via-[#eaedff]/30 to-white border-l-4 border-l-[#005289] space-y-3">
                                  <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span
                                        className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                                          isIncome
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : "bg-rose-50 text-rose-700 border-rose-200"
                                        }`}
                                      >
                                        {isIncome ? "NAKİT TAHSİLAT (+)" : "NAKİT TEDİYE (-)"}
                                      </span>
                                      <span className="text-xs text-slate-500 font-medium">
                                        Evrak No: <span className="font-mono font-bold text-slate-900">{tx.documentNo || `#${tx.id.slice(0, 8)}`}</span>
                                      </span>
                                      {tx.category && (
                                        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                                          {tx.category}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleShowTransactionReceipt(tx)}
                                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                      >
                                        <Printer className="w-3.5 h-3.5" />
                                        <span>Makbuz / Dekont</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleShowTransactionReceipt(tx);
                                          setIsReceiptWhatsAppOpen(true);
                                        }}
                                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                        <span>WhatsApp</span>
                                      </button>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Kasa Hesabı</span>
                                      <span className="font-bold text-slate-800">{tx.accountName}</span>
                                    </div>
                                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Cari / Muhatap</span>
                                      <span className="font-bold text-slate-800">{tx.contactName || tx.category || "-"}</span>
                                    </div>
                                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Açıklama / Not</span>
                                      <span className="text-slate-600 font-medium">{tx.description || "Açıklama belirtilmemiş"}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
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
              .filter((a) => a.type === "bank" || a.type === "credit_card" || a.type === "pos")
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
                            onClick={() => {
                              setEditingAccount(acc);
                              setIsEditAccountModalOpen(true);
                              detailNav.openEdit(acc, acc.id);
                            }}
                            className="p-1.5 rounded-lg border border-blue-300/80 hover:bg-blue-300 text-blue-950 transition-colors cursor-pointer shadow-2xs shrink-0"
                            title="Hesabı Düzenle"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-blue-900" />
                          </button>
                          {onDeleteAccount && (() => {
                            const isZeroBalance = Math.abs(Number(acc.balance || 0)) < 0.005;
                            return (
                              <button
                                type="button"
                                disabled={!isZeroBalance}
                                onClick={() => {
                                  if (!isZeroBalance) return;
                                  onDeleteAccount(acc.id);
                                  if (selectedBankAccountId === acc.id) {
                                    setSelectedBankAccountId(null);
                                  }
                                }}
                                className={`p-1.5 rounded-lg border transition-colors shadow-2xs shrink-0 ${
                                  isZeroBalance
                                    ? "border-rose-300 bg-rose-50/90 hover:bg-rose-200 text-rose-700 cursor-pointer"
                                    : "border-slate-200 bg-slate-100/70 text-slate-400 opacity-50 cursor-not-allowed"
                                }`}
                                title={
                                  isZeroBalance
                                    ? "Banka Hesabını Sil"
                                    : "Bakiyesi sıfır (0,00) olmayan banka hesabı silinemez"
                                }
                              >
                                <Trash2 className={`w-3.5 h-3.5 ${isZeroBalance ? "text-rose-700" : "text-slate-400"}`} />
                              </button>
                            );
                          })()}
                          <button
                            type="button"
                            onClick={() => handleShowAccountReceipt(acc)}
                            className="p-1.5 rounded-lg border border-blue-300/80 hover:bg-blue-300 text-blue-950 transition-colors cursor-pointer shadow-2xs shrink-0"
                            title="Dekont / Ekstre Göster (Yazdır / PDF)"
                          >
                            <Printer className="w-3.5 h-3.5 text-blue-900" />
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
            {accounts.filter((a) => a.type === "bank" || a.type === "credit_card" || a.type === "pos").length === 0 && (
              <div className="sm:col-span-2 lg:col-span-3 rounded-2xl p-6 border border-dashed border-blue-300 bg-blue-50/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">Kayıtlı Banka Hesabı Bulunmuyor</h4>
                    <p className="text-xs text-slate-500">Yeni bir banka veya POS hesabı oluşturarak havale, EFT ve POS işlemlerinizi takip edebilirsiniz.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAccType("bank");
                    setIsAccountModalOpen(true);
                    detailNav.openCreate();
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Yeni Banka Ekle</span>
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-600" />
                  <span>Banka Hesabı Havale / EFT / POS Hareketleri</span>
                  {selectedBankAccountId && (
                    <span className="text-xs font-bold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
                      Seçili: {accounts.find((a) => a.id === selectedBankAccountId)?.name}
                    </span>
                  )}
                </h3>

                {/* Banka İşlem Türü Filtre Seçimi */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setBankFilterType("all")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      bankFilterType === "all"
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Tümü
                  </button>
                  <button
                    type="button"
                    onClick={() => setBankFilterType("income")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      bankFilterType === "income"
                        ? "bg-emerald-600 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Gelen (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBankFilterType("expense")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      bankFilterType === "expense"
                        ? "bg-rose-600 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Giden (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBankFilterType("pos")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      bankFilterType === "pos"
                        ? "bg-indigo-600 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    POS Slip
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                {selectedBankAccountId && (
                  <>
                    <button
                      onClick={() => setSelectedBankAccountId(null)}
                      className="text-xs text-blue-700 hover:text-blue-900 font-bold bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-xl border border-blue-200 transition-colors cursor-pointer"
                    >
                      Tüm Bankaları Göster
                    </button>
                    {onDeleteAccount && (() => {
                      const selectedBankAcc = accounts.find((a) => a.id === selectedBankAccountId);
                      const isZeroBalance = Math.abs(Number(selectedBankAcc?.balance || 0)) < 0.005;
                      return (
                        <button
                          type="button"
                          disabled={!isZeroBalance}
                          onClick={() => {
                            if (!isZeroBalance) return;
                            onDeleteAccount(selectedBankAccountId);
                            setSelectedBankAccountId(null);
                          }}
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-colors flex items-center gap-1 ${
                            isZeroBalance
                              ? "text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border-rose-200 cursor-pointer"
                              : "text-slate-400 bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed"
                          }`}
                          title={
                            isZeroBalance
                              ? "Seçili banka hesabını sil"
                              : "Bakiyesi sıfır (0,00) olmayan banka hesabı silinemez"
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Seçili Bankayı Sil</span>
                        </button>
                      );
                    })()}
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setShowBankColFilters((prev) => !prev)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                    showBankColFilters
                      ? "bg-blue-50 border-blue-300 text-blue-900 font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium"
                  }`}
                  title="Sütun bazlı arama ve filtreleme alanlarını göster/gizle"
                >
                  <Filter className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">Sütun Filtreleri</span>
                  {activeBankColFilterCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {activeBankColFilterCount}
                    </span>
                  )}
                </button>
                <ExportButtons getExportData={getBankaExportData} size="sm" />
                <ColumnManagementDropdown
                  columns={bankaColumns}
                  columnVisibility={bankaColVisibility}
                  onToggleColumn={toggleBankaCol}
                  onSetAllColumns={setAllBankaCols}
                  onResetToDefaults={resetBankaCols}
                  hiddenCount={hiddenBankaColCount}
                />
              </div>
            </div>

            <BulkActionBar
              selectedCount={bankaSelection.selectedCount}
              totalCount={bankTransactions.length}
              itemLabel="banka işlemi"
              deleteLabel="Seçilen İşlemleri Sil"
              onSelectAll={() => bankaSelection.selectAll(bankTransactions.map((t) => t.id))}
              onClearSelection={bankaSelection.clearSelection}
              onDelete={onDeleteTransaction || onBulkDeleteTransactions ? handleBulkDeleteBanka : undefined}
              onExportExcel={handleBulkExportBankaExcel}
              onExportPdf={handleBulkExportBankaPDF}
            />

            <div
              className="overflow-x-auto custom-scrollbar w-full rounded-2xl border shadow-2xs overflow-hidden p-2"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
            >
              <table className="w-full text-left text-xs min-w-[750px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-9 text-center">
                      <TableCheckbox
                        checked={bankaSelection.isAllSelected(displayedBankIds)}
                        indeterminate={bankaSelection.isIndeterminate(displayedBankIds)}
                        onChange={() => bankaSelection.toggleSelectAll(displayedBankIds)}
                        ariaLabel="Tüm banka işlemlerini seç"
                      />
                    </th>
                    {isBankaColVisible("date") && <th className="py-2.5 px-4">Tarih</th>}
                    {isBankaColVisible("documentNo") && <th className="py-2.5 px-4">Dekont No</th>}
                    {isBankaColVisible("accountName") && <th className="py-2.5 px-4">Banka Hesabı</th>}
                    {isBankaColVisible("contact") && <th className="py-2.5 px-4">İşlem / Cari</th>}
                    {isBankaColVisible("description") && <th className="py-2.5 px-4">Açıklama</th>}
                    {isBankaColVisible("amount") && <th className="py-2.5 px-4 text-right">Tutar</th>}
                    {isBankaColVisible("actions") && <th className="py-2.5 px-4 text-center">İşlemler</th>}
                  </tr>
                  {/* Sütun Bazlı Filtreleme Satırı */}
                  {showBankColFilters && (
                    <tr className="bg-slate-50/40 transition-colors">
                      <th className="py-1.5 px-2 w-9" />
                      {isBankaColVisible("date") && (
                        <th className="py-1.5 px-2 font-normal">
                          <TableColumnFilterInput
                            value={bankColFilters.date}
                            onChange={(val) => setBankColFilters((prev) => ({ ...prev, date: val }))}
                            placeholder="Tarih..."
                          />
                        </th>
                      )}
                      {isBankaColVisible("documentNo") && (
                        <th className="py-1.5 px-2 font-normal">
                          <TableColumnFilterInput
                            value={bankColFilters.documentNo}
                            onChange={(val) => setBankColFilters((prev) => ({ ...prev, documentNo: val }))}
                            placeholder="Dekont No..."
                          />
                        </th>
                      )}
                      {isBankaColVisible("accountName") && (
                        <th className="py-1.5 px-2 font-normal">
                          <TableColumnFilterInput
                            value={bankColFilters.accountName}
                            onChange={(val) => setBankColFilters((prev) => ({ ...prev, accountName: val }))}
                            placeholder="Banka hesabı..."
                          />
                        </th>
                      )}
                      {isBankaColVisible("contact") && (
                        <th className="py-1.5 px-2 font-normal">
                          <TableColumnFilterInput
                            value={bankColFilters.contact}
                            onChange={(val) => setBankColFilters((prev) => ({ ...prev, contact: val }))}
                            placeholder="İşlem / Cari..."
                          />
                        </th>
                      )}
                      {isBankaColVisible("description") && (
                        <th className="py-1.5 px-2 font-normal">
                          <TableColumnFilterInput
                            value={bankColFilters.description}
                            onChange={(val) => setBankColFilters((prev) => ({ ...prev, description: val }))}
                            placeholder="Açıklama..."
                          />
                        </th>
                      )}
                      {isBankaColVisible("amount") && (
                        <th className="py-1.5 px-2 font-normal w-28">
                          <TableColumnFilterInput
                            value={bankColFilters.amount}
                            onChange={(val) => setBankColFilters((prev) => ({ ...prev, amount: val }))}
                            placeholder="Tutar..."
                          />
                        </th>
                      )}
                      {isBankaColVisible("actions") && (
                        <th className="py-1.5 px-2 font-normal text-center">
                          {activeBankColFilterCount > 0 ? (
                            <button
                              type="button"
                              onClick={clearAllBankColFilters}
                              className="px-2 py-1 text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Tüm sütun filtrelerini temizle"
                            >
                              <X className="w-3 h-3" />
                              <span>Temizle</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">Filtrele</span>
                          )}
                        </th>
                      )}
                    </tr>
                  )}
                </thead>
                <tbody>
                  {bankTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={visibleBankaColCount} className="text-center py-8 text-slate-400 font-medium">
                        Seçilen tarih aralığında veya bu banka hesabına ait işlem hareketi bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    displayedBankTransactions.map((tx) => {
                      const isIncome = tx.type === "income" || tx.type === "collection";
                      const isExpanded = !!expandedRows[tx.id];
                      const isSelected = bankaSelection.isSelected(tx.id);
                      return (
                        <React.Fragment key={tx.id}>
                          <tr
                            className={`${
                              isSelected ? "bg-indigo-50/70" : "bg-white"
                            } hover:bg-blue-50/80 transition-all group cursor-pointer shadow-2xs`}
                          >
                            <td
                              className="py-3 px-3 text-center w-9 rounded-l-xl border-y border-l border-slate-200/80"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <TableCheckbox
                                checked={isSelected}
                                onChange={() => bankaSelection.toggleSelect(tx.id)}
                                ariaLabel={`${tx.documentNo || tx.description} işlemini seç`}
                              />
                            </td>
                            {isBankaColVisible("date") && (
                              <td className="py-3 px-4 font-medium text-slate-600 font-mono tabular-nums border-y border-slate-200/80 last:rounded-r-xl last:border-r">
                                {formatDate(tx.date)}
                              </td>
                            )}
                            {isBankaColVisible("documentNo") && (
                              <td className="py-3 px-4 font-mono tabular-nums font-semibold text-slate-700 border-y border-slate-200/80 first:rounded-l-xl first:border-l last:rounded-r-xl last:border-r">
                                {tx.documentNo ? (
                                  <span className="bg-blue-50 text-blue-800 border border-blue-200/80 px-2 py-0.5 rounded text-[11px] font-mono tabular-nums">
                                    {tx.documentNo}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                            )}
                            {isBankaColVisible("accountName") && (
                              <td className="py-3 px-4 font-bold text-slate-800 border-y border-slate-200/80 first:rounded-l-xl first:border-l last:rounded-r-xl last:border-r">
                                {tx.accountName}
                              </td>
                            )}
                            {isBankaColVisible("contact") && (
                              <td className="py-3 px-4 text-slate-700 font-medium border-y border-slate-200/80 first:rounded-l-xl first:border-l last:rounded-r-xl last:border-r">
                                {tx.contactName || tx.category}
                              </td>
                            )}
                            {isBankaColVisible("description") && (
                              <td className="py-3 px-4 text-slate-500 border-y border-slate-200/80 first:rounded-l-xl first:border-l last:rounded-r-xl last:border-r">
                                {tx.description}
                              </td>
                            )}
                            {isBankaColVisible("amount") && (
                              <td
                                className={`py-3 px-4 text-right font-mono tabular-nums font-tabular-num-md font-bold border-y border-slate-200/80 first:rounded-l-xl first:border-l last:rounded-r-xl last:border-r ${
                                  isIncome ? "text-emerald-600" : "text-rose-600"
                                }`}
                              >
                                {isIncome ? "+" : "-"}₺
                                {tx.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                              </td>
                            )}
                            {isBankaColVisible("actions") && (
                              <td className="py-3 px-4 text-center border-y border-slate-200/80 first:rounded-l-xl first:border-l last:rounded-r-xl last:border-r">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => toggleRowExpand(tx.id)}
                                    title={isExpanded ? "Detayları Gizle" : "Hızlı İncele (Master-Detail)"}
                                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                      isExpanded
                                        ? "bg-purple-50 text-purple-700 border-purple-200"
                                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                                    }`}
                                  >
                                    <ChevronDown
                                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                        isExpanded ? "rotate-180 text-purple-600" : "text-slate-600"
                                      }`}
                                    />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingTransaction(tx);
                                      setIsEditTxModalOpen(true);
                                    }}
                                    className="p-1.5 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-600 hover:text-amber-700 transition-colors cursor-pointer"
                                    title="Banka İşlemini Düzenle"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleShowTransactionReceipt(tx)}
                                    className="p-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 transition-colors cursor-pointer"
                                    title="Banka Dekontu Görüntüle & Yazdır"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleShowTransactionReceipt(tx);
                                      setIsReceiptWhatsAppOpen(true);
                                    }}
                                    className="p-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                                    title="Banka Dekontunu WhatsApp ile Paylaş"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAddTxContext("banka");
                                      setTxAccountId(tx.accountId);
                                      setTxAmount(tx.amount);
                                      setTxContactId(tx.contactId || "");
                                      setTxDescription(`${tx.description ? tx.description + " - " : ""}Banka Havale/EFT İşlemi`);
                                      setIsAddTxModalOpen(true);
                                    }}
                                    title="Banka Tahsilat / Ödeme Ekle"
                                    className="p-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                  </button>
                                  {onDeleteTransaction && (
                                    <button
                                      type="button"
                                      onClick={() => onDeleteTransaction(tx.id)}
                                      className="p-1.5 rounded-lg border border-transparent hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                      title="Banka İşlemini Sil"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>

                          {/* Master-Detail Expanded Row Section */}
                          {isExpanded && (
                            <tr className="bg-slate-50/70 border-y border-slate-200" data-skip-row-highlight="true">
                              <td colSpan={visibleBankaColCount} className="p-0">
                                <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-50 via-[#eaedff]/30 to-white border-l-4 border-l-[#005289] space-y-3">
                                  <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span
                                        className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                                          isIncome
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : "bg-rose-50 text-rose-700 border-rose-200"
                                        }`}
                                      >
                                        {isIncome ? "BANKA GELEN TRANSFER (+)" : "BANKA GİDEN TRANSFER (-)"}
                                      </span>
                                      <span className="text-xs text-slate-500 font-medium">
                                        Dekont No: <span className="font-mono font-bold text-slate-900">{tx.documentNo || `#${tx.id.slice(0, 8)}`}</span>
                                      </span>
                                      {tx.category && (
                                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                                          {tx.category}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleShowTransactionReceipt(tx)}
                                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                      >
                                        <Printer className="w-3.5 h-3.5" />
                                        <span>Banka Dekontu</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleShowTransactionReceipt(tx);
                                          setIsReceiptWhatsAppOpen(true);
                                        }}
                                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                        <span>WhatsApp</span>
                                      </button>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Banka Hesabı</span>
                                      <span className="font-bold text-slate-800">{tx.accountName}</span>
                                    </div>
                                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Cari / Muhatap</span>
                                      <span className="font-bold text-slate-800">{tx.contactName || tx.category || "-"}</span>
                                    </div>
                                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Açıklama / Not</span>
                                      <span className="text-slate-600 font-medium">{tx.description || "Açıklama belirtilmemiş"}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
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
          <ChequeNoteSummaryReport
            cheques={cheques}
            promissoryNotes={promissoryNotes}
            contacts={contacts}
          />
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
                onClick={() => {
                  setChqNumber(`CHK-${Math.floor(100000 + Math.random() * 900000)}`);
                  setIsChequeModalOpen(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                title="Yeni Alınan veya Verilen Çek Kaydı Ekle"
              >
                <Plus className="w-4 h-4" />
                <span>Çek Ekle</span>
              </button>

              <button
                onClick={() => handleOpenEndorseModal("cheque")}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                title="Portföydeki bir çeki başka bir cariye devret/ciro et"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Çek Ciro Et (Ciranta)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowChequeColFilters((prev) => !prev)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                  showChequeColFilters
                    ? "bg-purple-50 border-purple-200 text-purple-900 font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium"
                }`}
                title="Sütun bazlı arama ve filtreleme alanlarını göster/gizle"
              >
                <Filter className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden sm:inline">Sütun Filtreleri</span>
                {activeChequeColFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {activeChequeColFilterCount}
                  </span>
                )}
              </button>

              <ExportButtons getExportData={getChequesExportData} size="sm" />
              <ColumnManagementDropdown
                columns={chequeColumns}
                columnVisibility={chequeColVisibility}
                onToggleColumn={toggleChequeCol}
                onSetAllColumns={setAllChequeCols}
                onResetToDefaults={resetChequeCols}
                hiddenCount={hiddenChequeColCount}
              />
            </div>
          </div>

          <BulkActionBar
            selectedCount={chequeSelection.selectedCount}
            totalCount={filteredCheques.length}
            itemLabel="çek"
            deleteLabel="Seçilen Çekleri Sil"
            onSelectAll={() => chequeSelection.selectAll(filteredCheques.map((c) => c.id))}
            onClearSelection={chequeSelection.clearSelection}
            onDelete={onDeleteCheque || onBulkDeleteCheques ? handleBulkDeleteChequesLocal : undefined}
            onExportExcel={handleBulkExportChequesExcel}
            onExportPdf={handleBulkExportChequesPDF}
            customActions={
              onUpdateChequeStatus ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleBulkUpdateChequeStatus("collected")}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Tahsil Edildi İşaretle
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkUpdateChequeStatus("portfolio")}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Portföye Al
                  </button>
                </div>
              ) : undefined
            }
          />

          <div
            className="overflow-x-auto custom-scrollbar w-full rounded-2xl border shadow-2xs overflow-hidden p-2"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
          >
            <table className="w-full text-left text-xs min-w-[800px] border-separate border-spacing-y-2">
              <thead>
                <tr className="bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-9 text-center">
                    <TableCheckbox
                      checked={chequeSelection.isAllSelected(displayedChequeIds)}
                      indeterminate={chequeSelection.isIndeterminate(displayedChequeIds)}
                      onChange={() => chequeSelection.toggleSelectAll(displayedChequeIds)}
                      ariaLabel="Tüm çekleri seç"
                    />
                  </th>
                  {isChequeColVisible("noType") && <th className="py-2.5 px-4">Çek No & Tipi</th>}
                  {isChequeColVisible("bank") && <th className="py-2.5 px-4">Banka / Şube</th>}
                  {isChequeColVisible("contact") && <th className="py-2.5 px-4">Keşideci / Cari</th>}
                  {isChequeColVisible("dueDate") && <th className="py-2.5 px-4">Vade Tarihi</th>}
                  {isChequeColVisible("amount") && <th className="py-2.5 px-4 text-right">Tutar</th>}
                  {isChequeColVisible("status") && <th className="py-2.5 px-4 text-center">Durum</th>}
                  {isChequeColVisible("actions") && <th className="py-2.5 px-4 text-center">İşlemler</th>}
                </tr>
                {/* Sütun Bazlı Filtreleme Satırı */}
                {showChequeColFilters && (
                  <tr className="bg-slate-50/40 transition-colors">
                    <th className="py-1.5 px-2 w-9" />
                    {isChequeColVisible("noType") && (
                      <th className="py-1.5 px-2 font-normal">
                        <TableColumnFilterInput
                          value={chequeColFilters.noType}
                          onChange={(val) => setChequeColFilters((prev) => ({ ...prev, noType: val }))}
                          placeholder="Çek no / tip..."
                        />
                      </th>
                    )}
                    {isChequeColVisible("bank") && (
                      <th className="py-1.5 px-2 font-normal">
                        <TableColumnFilterInput
                          value={chequeColFilters.bank}
                          onChange={(val) => setChequeColFilters((prev) => ({ ...prev, bank: val }))}
                          placeholder="Banka / Şube..."
                        />
                      </th>
                    )}
                    {isChequeColVisible("contact") && (
                      <th className="py-1.5 px-2 font-normal">
                        <TableColumnFilterInput
                          value={chequeColFilters.contact}
                          onChange={(val) => setChequeColFilters((prev) => ({ ...prev, contact: val }))}
                          placeholder="Keşideci / Cari..."
                        />
                      </th>
                    )}
                    {isChequeColVisible("dueDate") && (
                      <th className="py-1.5 px-2 font-normal w-28">
                        <TableColumnFilterInput
                          value={chequeColFilters.dueDate}
                          onChange={(val) => setChequeColFilters((prev) => ({ ...prev, dueDate: val }))}
                          placeholder="Vade..."
                        />
                      </th>
                    )}
                    {isChequeColVisible("amount") && (
                      <th className="py-1.5 px-2 font-normal w-28">
                        <TableColumnFilterInput
                          value={chequeColFilters.amount}
                          onChange={(val) => setChequeColFilters((prev) => ({ ...prev, amount: val }))}
                          placeholder="Tutar..."
                        />
                      </th>
                    )}
                    {isChequeColVisible("status") && (
                      <th className="py-1.5 px-2 font-normal w-28">
                        <TableColumnFilterInput
                          value={chequeColFilters.status}
                          onChange={(val) => setChequeColFilters((prev) => ({ ...prev, status: val }))}
                          placeholder="Durum..."
                        />
                      </th>
                    )}
                    {isChequeColVisible("actions") && (
                      <th className="py-1.5 px-2 font-normal text-center">
                        {activeChequeColFilterCount > 0 ? (
                          <button
                            type="button"
                            onClick={clearAllChequeColFilters}
                            className="px-2 py-1 text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="Tüm sütun filtrelerini temizle"
                          >
                            <X className="w-3 h-3" />
                            <span>Temizle</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">Filtrele</span>
                        )}
                      </th>
                    )}
                  </tr>
                )}
              </thead>
              <tbody>
                {filteredCheques.length === 0 ? (
                  <tr>
                    <td colSpan={visibleChequeColCount} className="text-center py-8 text-slate-400">
                      Kayıtlı çek bulunamadı.
                    </td>
                  </tr>
                ) : (
                  displayedCheques.map((c) => {
                    const isExpanded = !!expandedRows[c.id];
                    const isSelected = chequeSelection.isSelected(c.id);
                    return (
                      <React.Fragment key={c.id}>
                        <tr
                          className={`${
                            isSelected ? "bg-indigo-50/70" : "bg-white"
                          } hover:bg-blue-50/80 transition-all group cursor-pointer shadow-2xs`}
                        >
                          <td
                            className="py-3 px-3 text-center w-9 rounded-l-xl border-y border-l border-slate-200/80"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <TableCheckbox
                              checked={isSelected}
                              onChange={() => chequeSelection.toggleSelect(c.id)}
                              ariaLabel={`${c.chequeNumber} çekini seç`}
                            />
                          </td>
                          {isChequeColVisible("noType") && (
                            <td className="py-3 px-4 last:rounded-r-xl last:border-r border-y border-slate-200/80">
                              <div className="font-mono font-bold text-slate-900">{c.chequeNumber}</div>
                              <span
                                className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  c.type === "received"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-amber-50 text-amber-800 border border-amber-200"
                                }`}
                              >
                                {c.type === "received" ? "Müşteri Çeki" : "Firma Çeki"}
                              </span>
                            </td>
                          )}
                          {isChequeColVisible("bank") && (
                            <td className="py-3 px-4 first:rounded-l-xl first:border-l last:rounded-r-xl last:border-r border-y border-slate-200/80">
                              <div className="font-bold text-slate-800">{c.bankName}</div>
                              <div className="text-[10px] text-slate-400">{c.branchName || "-"}</div>
                            </td>
                          )}
                          {isChequeColVisible("contact") && (
                            <td className="py-3 px-4 first:rounded-l-xl first:border-l last:rounded-r-xl last:border-r border-y border-slate-200/80">
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 truncate">{c.contactName}</div>
                                <div className="text-[10px] text-slate-400 truncate">{c.drawerName}</div>
                              </div>
                            </td>
                          )}
                          {isChequeColVisible("dueDate") && (
                            <td className="py-3 px-4 font-mono font-semibold text-slate-700 first:rounded-l-xl first:border-l last:rounded-r-xl last:border-r border-y border-slate-200/80">
                              {formatDate(c.dueDate)}
                            </td>
                          )}
                          {isChequeColVisible("amount") && (
                            <td className="py-3 px-4 text-right font-bold font-mono tabular-nums font-tabular-num-md text-slate-900 first:rounded-l-xl first:border-l last:rounded-r-xl last:border-r border-y border-slate-200/80">
                              ₺{c.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            </td>
                          )}
                          {isChequeColVisible("status") && (
                            <td className="py-3 px-4 text-center first:rounded-l-xl first:border-l last:rounded-r-xl last:border-r border-y border-slate-200/80">
                              {getChequeStatusBadge(c.status, c.endorsedToContactName)}
                            </td>
                          )}
                          {isChequeColVisible("actions") && (
                            <td className="py-3 px-4 text-center first:rounded-l-xl first:border-l last:rounded-r-xl last:border-r border-y border-slate-200/80">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => toggleRowExpand(c.id)}
                                  title={isExpanded ? "Detayları Gizle" : "Hızlı İncele (Master-Detail)"}
                                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                    isExpanded
                                      ? "bg-purple-50 text-purple-700 border-purple-200"
                                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                                  }`}
                                >
                                  <ChevronDown
                                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                      isExpanded ? "rotate-180 text-purple-600" : "text-slate-600"
                                    }`}
                                  />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCheque(c);
                                    setIsEditChequeModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-600 hover:text-amber-700 transition-colors cursor-pointer"
                                  title="Çeki Düzenle"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleShowChequeReceipt(c)}
                                  className="p-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 transition-colors cursor-pointer"
                                  title="Çek Bordrosu Görüntüle & Yazdır"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleShowChequeReceipt(c);
                                    setIsReceiptWhatsAppOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                                  title="Çek Bordrosunu WhatsApp ile Paylaş"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </button>

                                {c.status === "portfolio" && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEndorseModal("cheque", c.id)}
                                      className="p-1.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
                                      title="Bu Çeki Ciro Et"
                                    >
                                      <ArrowRightLeft className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (onUpdateChequeStatus) {
                                          onUpdateChequeStatus(c.id, c.type === "received" ? "collected" : "paid");
                                        }
                                      }}
                                      className="p-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                                      title={c.type === "received" ? "Tahsil Edildi Olarak İşle" : "Ödendi Olarak İşle"}
                                    >
                                      <CreditCard className="w-3.5 h-3.5" />
                                    </button>
                                  </>
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
                                  className="text-xs bg-slate-50 font-bold text-slate-700 rounded-lg border border-slate-200 px-2 py-1 cursor-pointer shadow-2xs hover:border-purple-300 transition-colors shrink-0"
                                  title="Çek Durumunu Güncelle"
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
                                    className="p-1.5 rounded-lg border border-transparent hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                    title="Çeki Sil"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>

                        {/* Master-Detail Expanded Row Section */}
                        {isExpanded && (
                          <tr className="bg-slate-50/70 border-y border-slate-200" data-skip-row-highlight="true">
                            <td colSpan={visibleChequeColCount} className="p-0">
                              <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-50 via-[#eaedff]/30 to-white border-l-4 border-l-[#005289] space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                                        c.type === "received"
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : "bg-amber-50 text-amber-800 border border-amber-200"
                                      }`}
                                    >
                                      {c.type === "received" ? "MÜŞTERİ ALACAK ÇEKİ" : "FİRMA BORÇ ÇEKİ"}
                                    </span>
                                    <span className="text-xs text-slate-500 font-medium">
                                      Çek No: <span className="font-mono font-bold text-slate-900">{c.chequeNumber}</span>
                                    </span>
                                    <span className="text-xs text-slate-500 font-medium">
                                      Vade: <span className="font-mono font-bold text-slate-900">{formatDate(c.dueDate)}</span>
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleShowChequeReceipt(c)}
                                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                      <span>Çek Bordrosu</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleShowChequeReceipt(c);
                                        setIsReceiptWhatsAppOpen(true);
                                      }}
                                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                      <span>WhatsApp</span>
                                    </button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Banka / Şube</span>
                                    <span className="font-bold text-slate-800">{c.bankName} {c.branchName ? `(${c.branchName})` : ""}</span>
                                  </div>
                                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Hesap No</span>
                                    <span className="font-mono font-bold text-slate-800">{c.accountNumber || "-"}</span>
                                  </div>
                                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Cari / Keşideci</span>
                                    <span className="font-bold text-slate-800">{c.contactName} {c.drawerName ? `| ${c.drawerName}` : ""}</span>
                                  </div>
                                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Durum Bilgisi</span>
                                    <span className="font-medium text-slate-700">{c.status} {c.endorsedToContactName ? `-> ${c.endorsedToContactName}` : ""}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
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
          <ChequeNoteSummaryReport
            cheques={cheques}
            promissoryNotes={promissoryNotes}
            contacts={contacts}
          />
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
                onClick={() => {
                  setNtNumber(`SNT-2026-${Math.floor(100 + Math.random() * 900)}`);
                  setIsNoteModalOpen(true);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                title="Yeni Alınan veya Verilen Senet Kaydı Ekle"
              >
                <Plus className="w-4 h-4" />
                <span>Senet Ekle</span>
              </button>

              <button
                onClick={() => handleOpenEndorseModal("note")}
                className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                title="Portföydeki bir seneti başka bir cariye devret/ciro et"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Senet Ciro Et (Ciranta)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowNoteColFilters((prev) => !prev)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                  showNoteColFilters
                    ? "bg-purple-50 border-purple-200 text-purple-900 font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium"
                }`}
                title="Sütun bazlı arama ve filtreleme alanlarını göster/gizle"
              >
                <Filter className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden sm:inline">Sütun Filtreleri</span>
                {activeNoteColFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {activeNoteColFilterCount}
                  </span>
                )}
              </button>

              <ExportButtons getExportData={getNotesExportData} size="sm" />
              <ColumnManagementDropdown
                columns={noteColumns}
                columnVisibility={noteColVisibility}
                onToggleColumn={toggleNoteCol}
                onSetAllColumns={setAllNoteCols}
                onResetToDefaults={resetNoteCols}
                hiddenCount={hiddenNoteColCount}
              />
            </div>
          </div>

          <BulkActionBar
            selectedCount={noteSelection.selectedCount}
            totalCount={filteredNotes.length}
            itemLabel="senet"
            deleteLabel="Seçilen Senetleri Sil"
            onSelectAll={() => noteSelection.selectAll(filteredNotes.map((n) => n.id))}
            onClearSelection={noteSelection.clearSelection}
            onDelete={onDeletePromissoryNote || onBulkDeletePromissoryNotes ? handleBulkDeleteNotesLocal : undefined}
            onExportExcel={handleBulkExportNotesExcel}
            onExportPdf={handleBulkExportNotesPDF}
            customActions={
              onUpdateNoteStatus ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleBulkUpdateNoteStatus("collected")}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Tahsil Edildi İşaretle
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkUpdateNoteStatus("portfolio")}
                    className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Portföye Al
                  </button>
                </div>
              ) : undefined
            }
          />

          <div
            className="overflow-x-auto custom-scrollbar w-full rounded-2xl border shadow-2xs overflow-hidden p-2"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
          >
            <table className="w-full text-left text-xs min-w-[800px] border-separate border-spacing-y-2">
              <thead>
                <tr className="bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-9 text-center">
                    <TableCheckbox
                      checked={noteSelection.isAllSelected(displayedNoteIds)}
                      indeterminate={noteSelection.isIndeterminate(displayedNoteIds)}
                      onChange={() => noteSelection.toggleSelectAll(displayedNoteIds)}
                      ariaLabel="Tüm senetleri seç"
                    />
                  </th>
                  {isNoteColVisible("noType") && <th className="py-2.5 px-4">Senet No & Tipi</th>}
                  {isNoteColVisible("debtor") && <th className="py-2.5 px-4">Borçlu / Cari</th>}
                  {isNoteColVisible("issueDate") && <th className="py-2.5 px-4">Keşide / Düzenleme</th>}
                  {isNoteColVisible("dueDate") && <th className="py-2.5 px-4">Vade Tarihi</th>}
                  {isNoteColVisible("amount") && <th className="py-2.5 px-4 text-right">Tutar</th>}
                  {isNoteColVisible("status") && <th className="py-2.5 px-4 text-center">Durum</th>}
                  {isNoteColVisible("actions") && <th className="py-2.5 px-4 text-center">İşlemler</th>}
                </tr>
                {/* Sütun Bazlı Filtreleme Satırı */}
                {showNoteColFilters && (
                  <tr className="bg-slate-50/40 transition-colors">
                    <th className="py-1.5 px-2 w-9" />
                    {isNoteColVisible("noType") && (
                      <th className="py-1.5 px-2 font-normal">
                        <TableColumnFilterInput
                          value={noteColFilters.noType}
                          onChange={(val) => setNoteColFilters((prev) => ({ ...prev, noType: val }))}
                          placeholder="Senet no / tip..."
                        />
                      </th>
                    )}
                    {isNoteColVisible("debtor") && (
                      <th className="py-1.5 px-2 font-normal">
                        <TableColumnFilterInput
                          value={noteColFilters.debtor}
                          onChange={(val) => setNoteColFilters((prev) => ({ ...prev, debtor: val }))}
                          placeholder="Borçlu / Cari..."
                        />
                      </th>
                    )}
                    {isNoteColVisible("issueDate") && (
                      <th className="py-1.5 px-2 font-normal w-28">
                        <TableColumnFilterInput
                          value={noteColFilters.issueDate}
                          onChange={(val) => setNoteColFilters((prev) => ({ ...prev, issueDate: val }))}
                          placeholder="Düzenleme..."
                        />
                      </th>
                    )}
                    {isNoteColVisible("dueDate") && (
                      <th className="py-1.5 px-2 font-normal w-28">
                        <TableColumnFilterInput
                          value={noteColFilters.dueDate}
                          onChange={(val) => setNoteColFilters((prev) => ({ ...prev, dueDate: val }))}
                          placeholder="Vade..."
                        />
                      </th>
                    )}
                    {isNoteColVisible("amount") && (
                      <th className="py-1.5 px-2 font-normal w-28">
                        <TableColumnFilterInput
                          value={noteColFilters.amount}
                          onChange={(val) => setNoteColFilters((prev) => ({ ...prev, amount: val }))}
                          placeholder="Tutar..."
                        />
                      </th>
                    )}
                    {isNoteColVisible("status") && (
                      <th className="py-1.5 px-2 font-normal w-28">
                        <TableColumnFilterInput
                          value={noteColFilters.status}
                          onChange={(val) => setNoteColFilters((prev) => ({ ...prev, status: val }))}
                          placeholder="Durum..."
                        />
                      </th>
                    )}
                    {isNoteColVisible("actions") && (
                      <th className="py-1.5 px-2 font-normal text-center">
                        {activeNoteColFilterCount > 0 ? (
                          <button
                            type="button"
                            onClick={clearAllNoteColFilters}
                            className="px-2 py-1 text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="Tüm sütun filtrelerini temizle"
                          >
                            <X className="w-3 h-3" />
                            <span>Temizle</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">Filtrele</span>
                        )}
                      </th>
                    )}
                  </tr>
                )}
              </thead>
              <tbody>
                {filteredNotes.length === 0 ? (
                  <tr>
                    <td colSpan={visibleNoteColCount} className="text-center py-8 text-slate-400">
                      Kayıtlı senet bulunamadı.
                    </td>
                  </tr>
                ) : (
                  displayedNotes.map((n) => {
                    const isExpanded = !!expandedRows[n.id];
                    const isSelected = noteSelection.isSelected(n.id);
                    return (
                      <React.Fragment key={n.id}>
                        <tr
                          className={`${
                            isSelected ? "bg-indigo-50/70" : "bg-white"
                          } hover:bg-blue-50/80 transition-all group cursor-pointer shadow-2xs`}
                        >
                          <td
                            className="py-3 px-3 text-center w-9 rounded-l-xl border-y border-l border-slate-200/80"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <TableCheckbox
                              checked={isSelected}
                              onChange={() => noteSelection.toggleSelect(n.id)}
                              ariaLabel={`${n.noteNumber} senedini seç`}
                            />
                          </td>
                          {isNoteColVisible("noType") && (
                            <td className="py-3 px-4 last:rounded-r-xl last:border-r border-y border-slate-200/80">
                              <div className="font-mono font-bold text-slate-900">{n.noteNumber}</div>
                              <span
                                className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  n.type === "received"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-amber-50 text-amber-800 border border-amber-200"
                                }`}
                              >
                                {n.type === "received" ? "Müşteri Senedi" : "Borç Senedi"}
                              </span>
                            </td>
                          )}
                          {isNoteColVisible("debtor") && (
                            <td className="py-3 px-4 first:rounded-l-xl first:border-l last:rounded-r-xl last:border-r border-y border-slate-200/80">
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 truncate">{n.contactName}</div>
                                <div className="text-[10px] text-slate-400 truncate">{n.debtorName}</div>
                              </div>
                            </td>
                          )}
                          {isNoteColVisible("issueDate") && (
                            <td className="py-3 px-4 font-mono text-slate-500 first:rounded-l-xl first:border-l last:rounded-r-xl last:border-r border-y border-slate-200/80">
                              {formatDate(n.issueDate)}
                            </td>
                          )}
                          {isNoteColVisible("dueDate") && (
                            <td className="py-3 px-4 font-mono font-semibold text-slate-700 first:rounded-l-xl first:border-l last:rounded-r-xl last:border-r border-y border-slate-200/80">
                              {formatDate(n.dueDate)}
                            </td>
                          )}
                          {isNoteColVisible("amount") && (
                            <td className="py-3 px-4 text-right font-bold font-mono tabular-nums font-tabular-num-md text-slate-900 first:rounded-l-xl first:border-l last:rounded-r-xl last:border-r border-y border-slate-200/80">
                              ₺{n.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            </td>
                          )}
                          {isNoteColVisible("status") && (
                            <td className="py-3 px-4 text-center first:rounded-l-xl first:border-l last:rounded-r-xl last:border-r border-y border-slate-200/80">
                              {getNoteStatusBadge(n.status, n.endorsedToContactName)}
                            </td>
                          )}
                          {isNoteColVisible("actions") && (
                            <td className="py-3 px-4 text-center first:rounded-l-xl first:border-l last:rounded-r-xl last:border-r border-y border-slate-200/80">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => toggleRowExpand(n.id)}
                                  title={isExpanded ? "Detayları Gizle" : "Hızlı İncele (Master-Detail)"}
                                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                    isExpanded
                                      ? "bg-purple-50 text-purple-700 border-purple-200"
                                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                                  }`}
                                >
                                  <ChevronDown
                                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                      isExpanded ? "rotate-180 text-purple-600" : "text-slate-600"
                                    }`}
                                  />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingNote(n);
                                    setIsEditNoteModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-600 hover:text-amber-700 transition-colors cursor-pointer"
                                  title="Senedi Düzenle"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleShowNoteReceipt(n)}
                                  className="p-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 transition-colors cursor-pointer"
                                  title="Senet Bordrosu Görüntüle & Yazdır"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleShowNoteReceipt(n);
                                    setIsReceiptWhatsAppOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                                  title="Senet Bordrosunu WhatsApp ile Paylaş"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </button>

                                {n.status === "portfolio" && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEndorseModal("note", n.id)}
                                      className="p-1.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
                                      title="Bu Senedi Ciro Et"
                                    >
                                      <ArrowRightLeft className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (onUpdateNoteStatus) {
                                          onUpdateNoteStatus(n.id, n.type === "received" ? "collected" : "paid");
                                        }
                                      }}
                                      className="p-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                                      title={n.type === "received" ? "Tahsil Edildi Olarak İşle" : "Ödendi Olarak İşle"}
                                    >
                                      <CreditCard className="w-3.5 h-3.5" />
                                    </button>
                                  </>
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
                                  className="text-xs bg-slate-50 font-bold text-slate-700 rounded-lg border border-slate-200 px-2 py-1 cursor-pointer shadow-2xs hover:border-purple-300 transition-colors shrink-0"
                                  title="Senet Durumunu Güncelle"
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
                                    className="p-1.5 rounded-lg border border-transparent hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                    title="Senedi Sil"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>

                        {/* Master-Detail Expanded Row Section */}
                        {isExpanded && (
                          <tr className="bg-slate-50/70 border-y border-slate-200" data-skip-row-highlight="true">
                            <td colSpan={visibleNoteColCount} className="p-0">
                              <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-50 via-[#eaedff]/30 to-white border-l-4 border-l-[#005289] space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                                        n.type === "received"
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : "bg-amber-50 text-amber-800 border border-amber-200"
                                      }`}
                                    >
                                      {n.type === "received" ? "MÜŞTERİ ALACAK SENEDİ" : "FİRMA BORÇ SENEDİ"}
                                    </span>
                                    <span className="text-xs text-slate-500 font-medium">
                                      Senet No: <span className="font-mono font-bold text-slate-900">{n.noteNumber}</span>
                                    </span>
                                    <span className="text-xs text-slate-500 font-medium">
                                      Düzenleme: <span className="font-mono font-bold text-slate-900">{formatDate(n.issueDate)}</span>
                                    </span>
                                    <span className="text-xs text-slate-500 font-medium">
                                      Vade: <span className="font-mono font-bold text-slate-900">{formatDate(n.dueDate)}</span>
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleShowNoteReceipt(n)}
                                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                      <span>Senet Bordrosu</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleShowNoteReceipt(n);
                                        setIsReceiptWhatsAppOpen(true);
                                      }}
                                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                      <span>WhatsApp</span>
                                    </button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Cari / Alacaklı</span>
                                    <span className="font-bold text-slate-800">{n.contactName}</span>
                                  </div>
                                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Borçlu Kişi / Firma</span>
                                    <span className="font-bold text-slate-800">{n.debtorName || "-"}</span>
                                  </div>
                                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Durum Bilgisi</span>
                                    <span className="font-medium text-slate-700">{n.status} {n.endorsedToContactName ? `-> ${n.endorsedToContactName}` : ""}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
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

          {/* Virman Form - Artık listenin tam üzerinde yer alıyor */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-base font-extrabold text-slate-900">Yeni Virman (Transfer) İşlemi</span>
                  <p className="text-[11px] font-normal text-slate-500">
                    Kasa, Banka ve Cari hesaplar arasında bakiye aktarımı ve karşılıklı mahsup işlemi gerçekleştirin.
                  </p>
                </div>
              </h3>
              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                <span className="text-[11px] font-bold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg shrink-0">
                  Çift Taraflı Mahsup / Bakiye Aktarımı
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsTransferModalOpen(true);
                    detailNav.openTransfer();
                  }}
                  className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="Tam sayfa detaylı virman fişi düzenle"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-purple-600" />
                  <span>Tam Ekran Virman Belgesi</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-4 text-xs">
              {/* Hesap Seçimleri: Borçlu -> Ok -> Alacaklı */}
              <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
                <div className="md:col-span-5">
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Borçlu Hesap (Kaynak / Çıkan Hesap) *</span>
                    <span className="text-[10px] text-rose-600 font-semibold">Paranın Çıktığı Hesap</span>
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

                <div className="md:col-span-1 flex justify-center py-1">
                  <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
                    <ArrowRightLeft className="w-4 h-4" />
                  </div>
                </div>

                <div className="md:col-span-5">
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Alacaklı Hesap (Hedef / Giren Hesap) *</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Paranın Girdiği Hesap</span>
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
              </div>

              {/* Tutar, Açıklama ve Onay Butonu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end pt-1">
                <div className="lg:col-span-3">
                  <label className="block font-bold text-slate-700 mb-1">
                    Virman Tutarı (₺) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₺</span>
                    <input
                      type="number"
                      required
                      min="1"
                      step="0.01"
                      value={transferAmount || ""}
                      onChange={(e) => setTransferAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pl-7 font-mono font-bold text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="lg:col-span-6">
                  <label className="block font-bold text-slate-700 mb-1">
                    Açıklama / Virman Notu
                  </label>
                  <input
                    type="text"
                    value={transferDesc}
                    onChange={(e) => setTransferDesc(e.target.value)}
                    placeholder="Örn: Kasa-Banka virman aktarımı"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-[0.98]"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    <span>Virman Transferini Onayla</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Virman History Table - Formun tam altında ve tam genişlikte */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span>Virman Transfer Geçmişi</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                    {virmanTransactions.length} Kayıt
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={handleExportVirmanExcel}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0 active:scale-95"
                  title="Virman transfer geçmişini Excel (.xlsx) olarak indir"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Excel İndir</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportVirmanPDF}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0 active:scale-95"
                  title="Virman transfer geçmişini aynı formatta PDF (.pdf) olarak indir"
                >
                  <FileText className="w-3.5 h-3.5 text-rose-600" />
                  <span className="hidden sm:inline">PDF İndir</span>
                </button>
              </div>

            <BulkActionBar
              selectedCount={virmanSelection.selectedCount}
              totalCount={virmanTransactions.length}
              itemLabel="virman işlemi"
              deleteLabel="Seçilen Virmanları Sil"
              onSelectAll={() => virmanSelection.selectAll(virmanTransactions.map((t) => t.id))}
              onClearSelection={virmanSelection.clearSelection}
              onDelete={onDeleteTransaction || onBulkDeleteTransactions ? handleBulkDeleteVirman : undefined}
              onExportExcel={handleBulkExportVirmanExcel}
              onExportPdf={handleBulkExportVirmanPDF}
            />

            <div
              className="overflow-x-auto custom-scrollbar w-full rounded-2xl border shadow-2xs overflow-hidden p-2"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
            >
              <table className="w-full text-left text-xs min-w-[700px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-9 text-center">
                      <TableCheckbox
                        checked={virmanSelection.isAllSelected(displayedVirmanIds)}
                        indeterminate={virmanSelection.isIndeterminate(displayedVirmanIds)}
                        onChange={() => virmanSelection.toggleSelectAll(displayedVirmanIds)}
                        ariaLabel="Tüm virman işlemlerini seç"
                      />
                    </th>
                    <th className="py-2.5 px-4">Tarih</th>
                    <th className="py-2.5 px-4">Hesap</th>
                    <th className="py-2.5 px-4">Kategori / Açıklama</th>
                    <th className="py-2.5 px-4 text-right">Tutar</th>
                    <th className="py-2.5 px-4 text-center">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {virmanTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        Seçilen tarih aralığında virman transfer hareketi bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    displayedVirmanTransactions.map((tx) => {
                      const isExpanded = !!expandedRows[tx.id];
                      const isSelected = virmanSelection.isSelected(tx.id);
                      return (
                        <React.Fragment key={tx.id}>
                          <tr
                            className={`${
                              isSelected ? "bg-indigo-50/70" : "bg-white"
                            } hover:bg-blue-50/80 transition-all group cursor-pointer shadow-2xs`}
                          >
                            <td
                              className="py-3 px-3 text-center w-9 rounded-l-xl border-y border-l border-slate-200/80"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <TableCheckbox
                                checked={isSelected}
                                onChange={() => virmanSelection.toggleSelect(tx.id)}
                                ariaLabel={`${tx.documentNo || tx.description} işlemini seç`}
                              />
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-600 border-y border-slate-200/80">
                              {formatDate(tx.date)}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900 border-y border-slate-200/80">
                              {tx.accountName}
                            </td>
                            <td className="py-3 px-4 text-slate-700 border-y border-slate-200/80">
                              {tx.description}
                            </td>
                            <td
                              className={`py-3 px-4 text-right font-bold font-mono border-y border-slate-200/80 ${
                                tx.type === "income" ? "text-emerald-600" : "text-rose-600"
                              }`}
                            >
                              {tx.type === "income" ? "+" : "-"}₺
                              {tx.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4 text-center rounded-r-xl border-y border-r border-slate-200/80">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => toggleRowExpand(tx.id)}
                                  title={isExpanded ? "Detayları Gizle" : "Hızlı İncele (Master-Detail)"}
                                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                    isExpanded
                                      ? "bg-purple-50 text-purple-700 border-purple-200"
                                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                                  }`}
                                >
                                  <ChevronDown
                                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                      isExpanded ? "rotate-180 text-purple-600" : "text-slate-600"
                                    }`}
                                  />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingTransaction(tx);
                                    setIsEditTxModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-600 hover:text-amber-700 transition-colors cursor-pointer"
                                  title="Virman İşlemini Düzenle"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleShowVirmanReceipt(tx)}
                                  className="p-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 transition-colors cursor-pointer"
                                  title="Virman Dekontu Görüntüle & Yazdır"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleShowVirmanReceipt(tx);
                                    setIsReceiptWhatsAppOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                                  title="Virman Dekontunu WhatsApp ile Paylaş"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTransferAmount(tx.amount);
                                    setTransferDesc(`Virman Tekrarı: ${tx.description || ""}`);
                                    const pairedTx = tx.linkedTransactionId
                                      ? transactions.find((t) => t.id === tx.linkedTransactionId)
                                      : undefined;
                                    const outTx = tx.type === "expense" ? tx : pairedTx;
                                    const inTx = tx.type === "income" ? tx : pairedTx;
                                    if (outTx) {
                                      const outId = outTx.contactId || outTx.accountId;
                                      if (outId && outId !== "virman_cari_bridge") setFromAccId(outId);
                                    }
                                    if (inTx) {
                                      const inId = inTx.contactId || inTx.accountId;
                                      if (inId && inId !== "virman_cari_bridge") setToAccId(inId);
                                    }
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                  }}
                                  className="p-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                                  title="Virman Transferini Tekrarla"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                </button>
                                {onDeleteTransaction && (
                                  <button
                                    type="button"
                                    onClick={() => onDeleteTransaction(tx.id)}
                                    className="p-1.5 rounded-lg border border-transparent hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                    title="Virman İşlemini Sil"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Master-Detail Expanded Row Section */}
                          {isExpanded && (
                            <tr className="bg-slate-50/70 border-y border-slate-200" data-skip-row-highlight="true">
                              <td colSpan={6} className="p-0">
                                <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-50 via-[#eaedff]/30 to-white border-l-4 border-l-[#005289] space-y-3">
                                  <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span
                                        className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                                          tx.type === "income"
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : "bg-rose-50 text-rose-700 border-rose-200"
                                        }`}
                                      >
                                        {tx.type === "income" ? "VİRMAN GİRİŞİ (+)" : "VİRMAN ÇIKIŞI (-)"}
                                      </span>
                                      <span className="text-xs text-slate-500 font-medium">
                                        İşlem No: <span className="font-mono font-bold text-slate-900">{tx.documentNo || `#${tx.id.slice(0, 8)}`}</span>
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleShowVirmanReceipt(tx)}
                                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                      >
                                        <Printer className="w-3.5 h-3.5" />
                                        <span>Virman Dekontu</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleShowVirmanReceipt(tx);
                                          setIsReceiptWhatsAppOpen(true);
                                        }}
                                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                        <span>WhatsApp</span>
                                      </button>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Hesap</span>
                                      <span className="font-bold text-slate-800">{tx.accountName}</span>
                                    </div>
                                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Virman Detayı</span>
                                      <span className="font-bold text-slate-800">{tx.description}</span>
                                    </div>
                                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                                      <span className="text-slate-400 block text-[10px] font-bold uppercase">İşlem Tarihi</span>
                                      <span className="font-medium text-slate-700">{formatDate(tx.date)}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
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
      )}

      {/* SUB-MODULE 6: FİŞ GİRİŞİ & FİŞ LİSTESİ (TAHSİLAT, TEDİYE, PERAKENDE GİDER/MASRAF & MAHSUP FİŞLERİ) */}
      {activeSubModule === "fis" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Alt Modül Sekme Seçici: Fiş Girişi | Fiş Listesi */}
          <div
            className="rounded-2xl border p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  handleSelectFisViewMode("fis_girisi");
                  if (fisEntryMode === "multi") {
                    setIsMultiFisFullPage(true);
                  }
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                  activeFisViewMode === "fis_girisi"
                    ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Fiş Girişi (Yeni Fiş Oluştur)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMultiFisFullPage(false);
                  handleSelectFisViewMode("fis_listesi");
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                  activeFisViewMode === "fis_listesi"
                    ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Fiş Listesi</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeFisViewMode === "fis_listesi"
                      ? "bg-white/20 text-white"
                      : "bg-teal-100 text-teal-800"
                  }`}
                >
                  {fisTransactions.length}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              {activeFisViewMode === "fis_girisi" ? (
                <span>Çoklu Fiş Girişi Sayfası veya Tekli Fiş Girişi ile yeni muhasebe fişi oluşturun</span>
              ) : (
                <span>Kayıtlı tahsilat, tediye, gider/masraf ve mahsup fişlerini görüntüleyin</span>
              )}
            </div>
          </div>

          {activeFisViewMode === "fis_listesi" && renderDateFilterBar("Fiş Listesi & Muhasebe Fiş Hareketleri")}

          {/* Fiş Girişi KPI Özet Şeridi (Sadece Fiş Listesi ekranında gösterilir) */}
          {activeFisViewMode === "fis_listesi" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div
              onClick={() => {
                setFisFilterType(fisFilterType === "tahsilat" ? "all" : "tahsilat");
                if (activeFisViewMode !== "fis_listesi") handleSelectFisViewMode("fis_listesi");
              }}
              className={`rounded-2xl p-4 border shadow-2xs cursor-pointer transition-all flex items-center justify-between ${
                fisFilterType === "tahsilat" ? "ring-2 ring-emerald-500/60 bg-emerald-50/30" : ""
              }`}
              style={{ backgroundColor: theme.cardBg, borderColor: fisFilterType === "tahsilat" ? "#10b981" : theme.cardBorder }}
            >
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
                  Tahsilat Fişleri (+)
                </span>
                <p className="text-xl font-black font-mono text-emerald-600 mt-1">
                  ₺
                  {fisTransactions
                    .filter((t) => resolveTransactionFisType(t) === "tahsilat")
                    .reduce((s, t) => s + (t.amount || 0), 0)
                    .toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[11px] text-slate-400">
                  {fisTransactions.filter((t) => resolveTransactionFisType(t) === "tahsilat").length} adet fiş
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
            </div>

            <div
              onClick={() => {
                setFisFilterType(fisFilterType === "tediye" ? "all" : "tediye");
                if (activeFisViewMode !== "fis_listesi") handleSelectFisViewMode("fis_listesi");
              }}
              className={`rounded-2xl p-4 border shadow-2xs cursor-pointer transition-all flex items-center justify-between ${
                fisFilterType === "tediye" ? "ring-2 ring-rose-500/60 bg-rose-50/30" : ""
              }`}
              style={{ backgroundColor: theme.cardBg, borderColor: fisFilterType === "tediye" ? "#f43f5e" : theme.cardBorder }}
            >
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block">
                  Tediye / Ödeme Fişleri (-)
                </span>
                <p className="text-xl font-black font-mono text-rose-600 mt-1">
                  ₺
                  {fisTransactions
                    .filter((t) => resolveTransactionFisType(t) === "tediye")
                    .reduce((s, t) => s + (t.amount || 0), 0)
                    .toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[11px] text-slate-400">
                  {fisTransactions.filter((t) => resolveTransactionFisType(t) === "tediye").length} adet fiş
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>

            <div
              onClick={() => {
                setFisFilterType(fisFilterType === "gider_fisi" ? "all" : "gider_fisi");
                if (activeFisViewMode !== "fis_listesi") handleSelectFisViewMode("fis_listesi");
              }}
              className={`rounded-2xl p-4 border shadow-2xs cursor-pointer transition-all flex items-center justify-between ${
                fisFilterType === "gider_fisi" ? "ring-2 ring-amber-500/60 bg-amber-50/30" : ""
              }`}
              style={{ backgroundColor: theme.cardBg, borderColor: fisFilterType === "gider_fisi" ? "#f59e0b" : theme.cardBorder }}
            >
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">
                  Perakende Gider / Masraf Fişi
                </span>
                <p className="text-xl font-black font-mono text-amber-600 mt-1">
                  ₺
                  {fisTransactions
                    .filter((t) => resolveTransactionFisType(t) === "gider_fisi")
                    .reduce((s, t) => s + (t.amount || 0), 0)
                    .toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[11px] text-slate-400">
                  {fisTransactions.filter((t) => resolveTransactionFisType(t) === "gider_fisi").length} adet masraf fişi
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
            </div>

            <div
              onClick={() => {
                setFisFilterType(fisFilterType === "mahsup" ? "all" : "mahsup");
                if (activeFisViewMode !== "fis_listesi") handleSelectFisViewMode("fis_listesi");
              }}
              className={`rounded-2xl p-4 border shadow-2xs cursor-pointer transition-all flex items-center justify-between ${
                fisFilterType === "mahsup" ? "ring-2 ring-indigo-500/60 bg-indigo-50/30" : ""
              }`}
              style={{ backgroundColor: theme.cardBg, borderColor: fisFilterType === "mahsup" ? "#6366f1" : theme.cardBorder }}
            >
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 block">
                  Mahsup Fişleri & Toplam KDV
                </span>
                <p className="text-xl font-black font-mono text-indigo-600 mt-1">
                  ₺
                  {fisTransactions
                    .reduce((s, t) => s + (t.totalVat || 0), 0)
                    .toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[11px] text-slate-400">
                  {fisTransactions.filter((t) => resolveTransactionFisType(t) === "mahsup").length} mahsup • İndirilecek KDV
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Calculator className="w-5 h-5" />
              </div>
            </div>
          </div>
          )}

          {/* ALT MODÜL 1: YENİ FİŞ GİRİŞİ FORMU & ÇOKLU FİŞ GİRİŞİ SAYFASI KARTI */}
          {activeFisViewMode === "fis_girisi" && (
          <div
            className={
              isMultiFisFullPage && fisEntryMode === "multi"
                ? "fixed inset-0 z-50 w-full h-[100dvh] overflow-y-auto md:overflow-hidden bg-white flex flex-col"
                : "w-full"
            }
          >
            <div
              className={`w-full ${
                isMultiFisFullPage && fisEntryMode === "multi"
                  ? "flex-1 flex flex-col min-h-0 p-2.5 sm:p-4 lg:px-5 lg:py-3.5 overflow-y-auto md:overflow-hidden"
                  : "rounded-2xl border p-4 sm:p-6 shadow-2xs"
              }`}
              style={{
                backgroundColor: theme.cardBg,
                borderColor: isMultiFisFullPage && fisEntryMode === "multi" ? "transparent" : theme.cardBorder,
              }}
            >
              <div className="shrink-0 flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 pb-3 mb-3 border-b border-slate-200">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold truncate" style={{ color: theme.pageText }}>
                        {fisEntryMode === "multi"
                          ? "Yeni Fiş Girişi Oluştur — Çoklu Fiş Girişi Sayfası"
                          : "Yeni Fiş Girişi Oluştur — Tekli Fiş Formu"}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                        {fisEntryMode === "multi" ? "Tam Ekran Responsive Tablo" : "Tekli Kayıt"}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs mt-0.5 line-clamp-1" style={{ color: theme.pageTextMuted }}>
                      Tahsilat fişi, tediye (ödeme) fişi, perakende harcama/masraf fişi veya muhasebe mahsup fişlerini çoklu tablo satırlarıyla hızlıca kaydedin.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-extrabold">
                    <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Kayıt Türü: Mahsup Fişi</span>
                  </div>
                </div>
              </div>

              {fisEntryMode === "multi" ? (
                /* ==============================================================
                   ÇOKLU FİŞ GİRİŞİ SAYFASI (RESPONSIVE TAM EKRAN TABLO TASARIMI)
                   ============================================================== */
                <div className="flex-1 flex flex-col min-h-0 justify-between gap-2.5">
                  {/* ÇOKLU FİŞ GİRİŞİ TABLOSU (RESPONSIVE TAM EKRAN TABLO) */}
                  <div className="flex-1 min-h-0 border border-slate-300 bg-white shadow-xs flex flex-col overflow-hidden rounded-lg">
                    <div className="overflow-auto flex-1 custom-scrollbar">
                      <table className="w-full border-collapse table-fixed min-w-[1020px] xl:min-w-0 text-left select-none">
                        <thead className="sticky top-0 z-20 bg-[#f8f9fa] shadow-2xs">
                          <tr className="bg-[#f8f9fa] border-b border-slate-300 text-xs 2xl:text-[13px] font-bold text-slate-900">
                            {/* 1. Hesap */}
                            <th className="py-2 px-2 border-r border-slate-300 w-[17%]">
                              <div className="flex items-center justify-between gap-1">
                                <span className="truncate">Hesap</span>
                                <button
                                  type="button"
                                  onClick={() => setShowMultiFisGridFilters((p) => !p)}
                                  className="text-slate-400 hover:text-blue-600 cursor-pointer shrink-0"
                                  title="Sütun filtresini aç/kapat"
                                >
                                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                                    <path d="M1 3H11M3 6H9M5 9H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                                  </svg>
                                </button>
                              </div>
                            </th>
                            {/* 2. Belge Tarihi */}
                            <th className="py-2 px-2 border-r border-slate-300 w-[8.5%]">
                              <div className="flex items-center justify-between gap-1">
                                <span className="truncate">Belge Tarihi</span>
                                <button
                                  type="button"
                                  onClick={() => setShowMultiFisGridFilters((p) => !p)}
                                  className="text-slate-400 hover:text-blue-600 cursor-pointer shrink-0"
                                >
                                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                                    <path d="M1 3H11M3 6H9M5 9H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                                  </svg>
                                </button>
                              </div>
                            </th>
                            {/* 3. Belge No */}
                            <th className="py-2 px-2 border-r border-slate-300 w-[8%]">
                              <div className="flex items-center justify-between gap-1">
                                <span className="truncate">Belge No</span>
                                <button
                                  type="button"
                                  onClick={() => setShowMultiFisGridFilters((p) => !p)}
                                  className="text-slate-400 hover:text-blue-600 cursor-pointer shrink-0"
                                >
                                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                                    <path d="M1 3H11M3 6H9M5 9H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                                  </svg>
                                </button>
                              </div>
                            </th>
                            {/* 4. Belge Türü */}
                            <th className="py-2 px-2 border-r border-slate-300 w-[9.5%]">
                              <div className="flex items-center justify-between gap-1">
                                <span className="truncate">Belge Türü</span>
                                <button
                                  type="button"
                                  onClick={() => setShowMultiFisGridFilters((p) => !p)}
                                  className="text-slate-400 hover:text-blue-600 cursor-pointer shrink-0"
                                >
                                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                                    <path d="M1 3H11M3 6H9M5 9H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                                  </svg>
                                </button>
                              </div>
                            </th>
                            {/* 5. B.T.A. */}
                            <th className="py-2 px-2 border-r border-slate-300 w-[6%]">
                              <div className="flex items-center justify-between gap-1">
                                <span className="truncate" title="Belge Türü Açıklaması">B.T.A.</span>
                                <button
                                  type="button"
                                  onClick={() => setShowMultiFisGridFilters((p) => !p)}
                                  className="text-slate-400 hover:text-blue-600 cursor-pointer shrink-0"
                                >
                                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                                    <path d="M1 3H11M3 6H9M5 9H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                                  </svg>
                                </button>
                              </div>
                            </th>
                            {/* 6. Vade Tarihi */}
                            <th className="py-2 px-2 border-r border-slate-300 w-[8.5%]">
                              <div className="flex items-center justify-between gap-1">
                                <span className="truncate">Vade Tarihi</span>
                              </div>
                            </th>
                            {/* 7. VKN/TCKN */}
                            <th className="py-2 px-2 border-r border-slate-300 w-[8%]">
                              <div className="flex items-center justify-between gap-1">
                                <span className="truncate">VKN/TCKN</span>
                                <button
                                  type="button"
                                  onClick={() => setShowMultiFisGridFilters((p) => !p)}
                                  className="text-slate-400 hover:text-blue-600 cursor-pointer shrink-0"
                                >
                                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                                    <path d="M1 3H11M3 6H9M5 9H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                                  </svg>
                                </button>
                              </div>
                            </th>
                            {/* 8. Açıklama */}
                            <th className="py-2 px-2 border-r border-slate-300 w-[13%]">
                              <div className="flex items-center justify-between gap-1">
                                <span className="truncate">Açıklama</span>
                                <button
                                  type="button"
                                  onClick={() => setShowMultiFisGridFilters((p) => !p)}
                                  className="text-slate-400 hover:text-blue-600 cursor-pointer shrink-0"
                                >
                                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                                    <path d="M1 3H11M3 6H9M5 9H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                                  </svg>
                                </button>
                              </div>
                            </th>
                            {/* 9. Borç */}
                            <th className="py-2 px-2 border-r border-slate-300 w-[7%]">
                              <div className="flex items-center justify-between gap-1">
                                <span className="truncate">Borç</span>
                                <button
                                  type="button"
                                  onClick={() => setShowMultiFisGridFilters((p) => !p)}
                                  className="text-slate-400 hover:text-blue-600 cursor-pointer shrink-0"
                                >
                                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                                    <path d="M1 3H11M3 6H9M5 9H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                                  </svg>
                                </button>
                              </div>
                            </th>
                            {/* 10. Alacak */}
                            <th className="py-2 px-2 border-r border-slate-300 w-[7%]">
                              <div className="flex items-center justify-between gap-1">
                                <span className="truncate">Alacak</span>
                                <button
                                  type="button"
                                  onClick={() => setShowMultiFisGridFilters((p) => !p)}
                                  className="text-slate-400 hover:text-blue-600 cursor-pointer shrink-0"
                                >
                                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                                    <path d="M1 3H11M3 6H9M5 9H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                                  </svg>
                                </button>
                              </div>
                            </th>
                            {/* 11. Ödeme Türü */}
                            <th className="py-2 px-2 border-r border-slate-300 w-[7.5%]">
                              <div className="flex items-center justify-between gap-1">
                                <span className="truncate">Ödeme Türü</span>
                                <button
                                  type="button"
                                  onClick={() => setShowMultiFisGridFilters((p) => !p)}
                                  className="text-slate-400 hover:text-blue-600 cursor-pointer shrink-0"
                                >
                                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                                    <path d="M1 3H11M3 6H9M5 9H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                                  </svg>
                                </button>
                              </div>
                            </th>
                            {/* 12. Sağ Boşluk / Satır İşlem Sütunu */}
                            <th className="py-2 px-1.5 w-[72px]"></th>
                          </tr>

                          {/* Sütun İçi Arama / Filtreleme Satırı (Başlıktaki ≡ ikonuna tıklanınca açılır) */}
                          {showMultiFisGridFilters && (
                            <tr className="bg-slate-100/90 border-b border-slate-300 text-[11px]">
                              <th className="p-1 border-r border-slate-300">
                                <input
                                  type="text"
                                  value={multiFisGridFilters.hesap}
                                  onChange={(e) => setMultiFisGridFilters((p) => ({ ...p, hesap: e.target.value }))}
                                  placeholder="Hesap filtrele..."
                                  className="w-full bg-white border border-slate-300 px-1.5 py-1 text-[11px] font-normal outline-none focus:border-blue-600"
                                />
                              </th>
                              <th className="p-1 border-r border-slate-300">
                                <input
                                  type="text"
                                  value={multiFisGridFilters.belgeTarihi}
                                  onChange={(e) => setMultiFisGridFilters((p) => ({ ...p, belgeTarihi: e.target.value }))}
                                  placeholder="Tarih..."
                                  className="w-full bg-white border border-slate-300 px-1.5 py-1 text-[11px] font-normal outline-none focus:border-blue-600"
                                />
                              </th>
                              <th className="p-1 border-r border-slate-300">
                                <input
                                  type="text"
                                  value={multiFisGridFilters.belgeNo}
                                  onChange={(e) => setMultiFisGridFilters((p) => ({ ...p, belgeNo: e.target.value }))}
                                  placeholder="Belge no..."
                                  className="w-full bg-white border border-slate-300 px-1.5 py-1 text-[11px] font-normal outline-none focus:border-blue-600"
                                />
                              </th>
                              <th className="p-1 border-r border-slate-300">
                                <input
                                  type="text"
                                  value={multiFisGridFilters.belgeTuru}
                                  onChange={(e) => setMultiFisGridFilters((p) => ({ ...p, belgeTuru: e.target.value }))}
                                  placeholder="Tür..."
                                  className="w-full bg-white border border-slate-300 px-1.5 py-1 text-[11px] font-normal outline-none focus:border-blue-600"
                                />
                              </th>
                              <th className="p-1 border-r border-slate-300">
                                <input
                                  type="text"
                                  value={multiFisGridFilters.bta}
                                  onChange={(e) => setMultiFisGridFilters((p) => ({ ...p, bta: e.target.value }))}
                                  placeholder="B.T.A..."
                                  className="w-full bg-white border border-slate-300 px-1.5 py-1 text-[11px] font-normal outline-none focus:border-blue-600"
                                />
                              </th>
                              <th className="p-1 border-r border-slate-300">
                                <input
                                  type="text"
                                  value={multiFisGridFilters.vadeTarihi}
                                  onChange={(e) => setMultiFisGridFilters((p) => ({ ...p, vadeTarihi: e.target.value }))}
                                  placeholder="Vade..."
                                  className="w-full bg-white border border-slate-300 px-1.5 py-1 text-[11px] font-normal outline-none focus:border-blue-600"
                                />
                              </th>
                              <th className="p-1 border-r border-slate-300">
                                <input
                                  type="text"
                                  value={multiFisGridFilters.vknTckn}
                                  onChange={(e) => setMultiFisGridFilters((p) => ({ ...p, vknTckn: e.target.value }))}
                                  placeholder="VKN/TCKN..."
                                  className="w-full bg-white border border-slate-300 px-1.5 py-1 text-[11px] font-normal outline-none focus:border-blue-600"
                                />
                              </th>
                              <th className="p-1 border-r border-slate-300">
                                <input
                                  type="text"
                                  value={multiFisGridFilters.aciklama}
                                  onChange={(e) => setMultiFisGridFilters((p) => ({ ...p, aciklama: e.target.value }))}
                                  placeholder="Açıklama..."
                                  className="w-full bg-white border border-slate-300 px-1.5 py-1 text-[11px] font-normal outline-none focus:border-blue-600"
                                />
                              </th>
                              <th className="p-1 border-r border-slate-300">
                                <input
                                  type="text"
                                  value={multiFisGridFilters.borc}
                                  onChange={(e) => setMultiFisGridFilters((p) => ({ ...p, borc: e.target.value }))}
                                  placeholder="Borç..."
                                  className="w-full bg-white border border-slate-300 px-1.5 py-1 text-[11px] font-normal outline-none focus:border-blue-600"
                                />
                              </th>
                              <th className="p-1 border-r border-slate-300">
                                <input
                                  type="text"
                                  value={multiFisGridFilters.alacak}
                                  onChange={(e) => setMultiFisGridFilters((p) => ({ ...p, alacak: e.target.value }))}
                                  placeholder="Alacak..."
                                  className="w-full bg-white border border-slate-300 px-1.5 py-1 text-[11px] font-normal outline-none focus:border-blue-600"
                                />
                              </th>
                              <th className="p-1 border-r border-slate-300">
                                <input
                                  type="text"
                                  value={multiFisGridFilters.odemeTuru}
                                  onChange={(e) => setMultiFisGridFilters((p) => ({ ...p, odemeTuru: e.target.value }))}
                                  placeholder="Ödeme..."
                                  className="w-full bg-white border border-slate-300 px-1.5 py-1 text-[11px] font-normal outline-none focus:border-blue-600"
                                />
                              </th>
                              <th className="p-1 text-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setMultiFisGridFilters({
                                      hesap: "",
                                      belgeTarihi: "",
                                      belgeNo: "",
                                      belgeTuru: "",
                                      bta: "",
                                      vadeTarihi: "",
                                      vknTckn: "",
                                      aciklama: "",
                                      borc: "",
                                      alacak: "",
                                      odemeTuru: "",
                                    })
                                  }
                                  className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                                >
                                  Temizle
                                </button>
                              </th>
                            </tr>
                          )}
                        </thead>

                        <tbody>
                          {multiFisRows
                            .filter((row) => {
                              if (multiFisGridFilters.hesap && !row.hesapLabel.toLowerCase().includes(multiFisGridFilters.hesap.toLowerCase())) return false;
                              if (multiFisGridFilters.belgeTarihi && !row.belgeTarihi.includes(multiFisGridFilters.belgeTarihi)) return false;
                              if (multiFisGridFilters.belgeNo && !row.belgeNo.toLowerCase().includes(multiFisGridFilters.belgeNo.toLowerCase())) return false;
                              if (multiFisGridFilters.belgeTuru && !row.belgeTuru.toLowerCase().includes(multiFisGridFilters.belgeTuru.toLowerCase())) return false;
                              if (multiFisGridFilters.bta && !row.bta.toLowerCase().includes(multiFisGridFilters.bta.toLowerCase())) return false;
                              if (multiFisGridFilters.vadeTarihi && !row.vadeTarihi.includes(multiFisGridFilters.vadeTarihi)) return false;
                              if (multiFisGridFilters.vknTckn && !row.vknTckn.includes(multiFisGridFilters.vknTckn)) return false;
                              if (multiFisGridFilters.aciklama && !row.aciklama.toLowerCase().includes(multiFisGridFilters.aciklama.toLowerCase())) return false;
                              if (multiFisGridFilters.borc && !String(row.borc).includes(multiFisGridFilters.borc)) return false;
                              if (multiFisGridFilters.alacak && !String(row.alacak).includes(multiFisGridFilters.alacak)) return false;
                              if (multiFisGridFilters.odemeTuru && !row.odemeTuru.toLowerCase().includes(multiFisGridFilters.odemeTuru.toLowerCase())) return false;
                              return true;
                            })
                            .map((row) => {
                              const isActiveRow = activeMultiFisRowId === row.id;
                              const isDropdownOpen = openHesapDropdownRowId === row.id;
                              const searchQ = row.hesapLabel.toLowerCase().trim();
                              const filteredAccountOptions = multiFisAccountOptions.filter((opt) =>
                                !searchQ ||
                                opt.label.toLowerCase().includes(searchQ) ||
                                opt.code.toLowerCase().includes(searchQ) ||
                                (opt.taxNumber && opt.taxNumber.includes(searchQ))
                              );

                              return (
                                <tr
                                  key={row.id}
                                  onClick={() => setActiveMultiFisRowId(row.id)}
                                  className={`bg-white transition-none ${
                                    isDropdownOpen
                                      ? "relative z-30 ring-2 ring-[#1d5ef4]"
                                      : isActiveRow
                                      ? "outline-2 outline-[#1d5ef4] -outline-offset-2 relative z-10"
                                      : "border-b border-slate-200 hover:bg-blue-50/20"
                                  }`}
                                >
                                  {/* 1. Hesap Hücresi (Sağ kenarında mavi yukarı-aşağı ok butonu ile) */}
                                  <td className="p-0 border-r border-slate-200 relative align-middle h-9">
                                    <div className="flex items-stretch h-9 w-full">
                                      <input
                                        type="text"
                                        value={row.hesapLabel}
                                        onFocus={() => setActiveMultiFisRowId(row.id)}
                                        onChange={(e) => {
                                          updateMultiFisRow(row.id, {
                                            hesapLabel: e.target.value,
                                            hesapKey: "",
                                          });
                                          setOpenHesapDropdownRowId(row.id);
                                        }}
                                        placeholder="Hesap kodu veya cari seçin..."
                                        className="w-full h-full px-1.5 text-xs font-semibold text-slate-900 bg-transparent outline-none placeholder:text-slate-300 min-w-0"
                                      />
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveMultiFisRowId(row.id);
                                          setOpenHesapDropdownRowId((prev) =>
                                            prev === row.id ? null : row.id
                                          );
                                        }}
                                        className="w-6 h-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                                        title="Hesap / Cari Listesini Aç"
                                      >
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                                          <path
                                            d="M5 6L8 3L11 6"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                          <path
                                            d="M5 10L8 13L11 10"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        </svg>
                                      </button>
                                    </div>

                                    {/* Açılır Hesap / Cari Seçim Listesi */}
                                    {isDropdownOpen && (
                                      <div
                                        className="absolute left-0 top-full mt-0.5 w-[min(380px,85vw)] max-h-64 overflow-y-auto bg-white border-2 border-[#2563eb] rounded-lg shadow-xl z-50 text-xs"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <div className="sticky top-0 bg-slate-100 px-2.5 py-1.5 border-b border-slate-200 flex items-center justify-between">
                                          <span className="text-[10px] font-extrabold uppercase text-slate-600">
                                            Hesap Planı / Cari Seçimi ({filteredAccountOptions.length})
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => setOpenHesapDropdownRowId(null)}
                                            className="text-slate-500 hover:text-slate-900 font-bold text-[11px] cursor-pointer"
                                          >
                                            Kapat ✕
                                          </button>
                                        </div>
                                        {filteredAccountOptions.length === 0 ? (
                                          <div className="p-3 text-slate-500 text-xs">
                                            Eşleşen hesap bulunamadı. Yazdığınız metin özel hesap olarak kaydedilecektir.
                                          </div>
                                        ) : (
                                          filteredAccountOptions.map((opt) => (
                                            <button
                                              key={opt.key}
                                              type="button"
                                              onClick={() => handleSelectMultiFisHesap(row.id, opt.key)}
                                              className="w-full text-left px-3 py-1.5 hover:bg-blue-50 border-b border-slate-100 flex items-center justify-between gap-2 cursor-pointer"
                                            >
                                              <span className="font-semibold text-slate-800 truncate">
                                                {opt.label}
                                              </span>
                                              {opt.taxNumber && (
                                                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                                  {opt.taxNumber}
                                                </span>
                                              )}
                                            </button>
                                          ))
                                        )}
                                      </div>
                                    )}
                                  </td>

                                  {/* 2. Belge Tarihi */}
                                  <td className="p-0 border-r border-slate-200 align-middle h-9">
                                    <input
                                      type="date"
                                      value={row.belgeTarihi}
                                      onFocus={() => setActiveMultiFisRowId(row.id)}
                                      onChange={(e) =>
                                        updateMultiFisRow(row.id, { belgeTarihi: e.target.value })
                                      }
                                      className="w-full h-9 px-1.5 text-[11px] xl:text-xs font-medium text-slate-900 bg-transparent outline-none"
                                    />
                                  </td>

                                  {/* 3. Belge No */}
                                  <td className="p-0 border-r border-slate-200 align-middle h-9">
                                    <input
                                      type="text"
                                      value={row.belgeNo}
                                      onFocus={() => setActiveMultiFisRowId(row.id)}
                                      onChange={(e) =>
                                        updateMultiFisRow(row.id, { belgeNo: e.target.value })
                                      }
                                      placeholder="Belge No"
                                      className="w-full h-9 px-1.5 text-xs font-mono font-semibold text-slate-900 bg-transparent outline-none placeholder:text-slate-300"
                                    />
                                  </td>

                                  {/* 4. Belge Türü */}
                                  <td className="p-0 border-r border-slate-200 align-middle h-9">
                                    <select
                                      value={row.belgeTuru}
                                      onFocus={() => setActiveMultiFisRowId(row.id)}
                                      onChange={(e) =>
                                        updateMultiFisRow(row.id, { belgeTuru: e.target.value })
                                      }
                                      className="w-full h-9 px-1 text-xs font-medium text-slate-900 bg-transparent outline-none cursor-pointer truncate"
                                    >
                                      <option value="Fatura">Fatura</option>
                                      <option value="Perakende Satış Fişi">Perakende Satış Fişi</option>
                                      <option value="Tahsilat Makbuzu">Tahsilat Makbuzu</option>
                                      <option value="Tediye Makbuzu">Tediye Makbuzu</option>
                                      <option value="Banka Dekontu">Banka Dekontu</option>
                                      <option value="Çek">Çek</option>
                                      <option value="Senet">Senet</option>
                                      <option value="Gider Pusulası">Gider Pusulası</option>
                                      <option value="Serbest Meslek Makbuzu">Serbest Meslek Makbuzu</option>
                                      <option value="Diğer">Diğer</option>
                                    </select>
                                  </td>

                                  {/* 5. B.T.A. (Belge Türü Açıklaması) */}
                                  <td className="p-0 border-r border-slate-200 align-middle h-9">
                                    <input
                                      type="text"
                                      value={row.bta}
                                      onFocus={() => setActiveMultiFisRowId(row.id)}
                                      onChange={(e) =>
                                        updateMultiFisRow(row.id, { bta: e.target.value })
                                      }
                                      placeholder="B.T.A."
                                      className="w-full h-9 px-1.5 text-xs text-slate-900 bg-transparent outline-none placeholder:text-slate-300"
                                    />
                                  </td>

                                  {/* 6. Vade Tarihi */}
                                  <td className="p-0 border-r border-slate-200 align-middle h-9">
                                    <input
                                      type="date"
                                      value={row.vadeTarihi}
                                      onFocus={() => setActiveMultiFisRowId(row.id)}
                                      onChange={(e) =>
                                        updateMultiFisRow(row.id, { vadeTarihi: e.target.value })
                                      }
                                      className="w-full h-9 px-1.5 text-[11px] xl:text-xs font-medium text-slate-900 bg-transparent outline-none"
                                    />
                                  </td>

                                  {/* 7. VKN/TCKN */}
                                  <td className="p-0 border-r border-slate-200 align-middle h-9">
                                    <input
                                      type="text"
                                      maxLength={11}
                                      value={row.vknTckn}
                                      onFocus={() => setActiveMultiFisRowId(row.id)}
                                      onChange={(e) =>
                                        updateMultiFisRow(row.id, { vknTckn: e.target.value })
                                      }
                                      placeholder="VKN / TCKN"
                                      className="w-full h-9 px-1.5 text-xs font-mono text-slate-900 bg-transparent outline-none placeholder:text-slate-300"
                                    />
                                  </td>

                                  {/* 8. Açıklama */}
                                  <td className="p-0 border-r border-slate-200 align-middle h-9">
                                    <input
                                      type="text"
                                      value={row.aciklama}
                                      onFocus={() => setActiveMultiFisRowId(row.id)}
                                      onChange={(e) =>
                                        updateMultiFisRow(row.id, { aciklama: e.target.value })
                                      }
                                      placeholder="Satır açıklaması..."
                                      className="w-full h-9 px-1.5 text-xs text-slate-900 bg-transparent outline-none placeholder:text-slate-300"
                                    />
                                  </td>

                                  {/* 9. Borç */}
                                  <td className="p-0 border-r border-slate-200 align-middle h-9">
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={row.borc}
                                      onFocus={() => setActiveMultiFisRowId(row.id)}
                                      onChange={(e) => {
                                        const val = e.target.value === "" ? "" : Number(e.target.value);
                                        updateMultiFisRow(row.id, {
                                          borc: val,
                                          alacak: val !== "" && Number(val) > 0 ? "" : row.alacak,
                                        });
                                      }}
                                      placeholder="0,00"
                                      className="w-full h-9 px-1.5 text-xs font-mono font-bold text-right text-slate-900 bg-transparent outline-none placeholder:text-slate-300"
                                    />
                                  </td>

                                  {/* 10. Alacak */}
                                  <td className="p-0 border-r border-slate-200 align-middle h-9">
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={row.alacak}
                                      onFocus={() => setActiveMultiFisRowId(row.id)}
                                      onChange={(e) => {
                                        const val = e.target.value === "" ? "" : Number(e.target.value);
                                        updateMultiFisRow(row.id, {
                                          alacak: val,
                                          borc: val !== "" && Number(val) > 0 ? "" : row.borc,
                                        });
                                      }}
                                      placeholder="0,00"
                                      className="w-full h-9 px-1.5 text-xs font-mono font-bold text-right text-slate-900 bg-transparent outline-none placeholder:text-slate-300"
                                    />
                                  </td>

                                  {/* 11. Ödeme Türü */}
                                  <td className="p-0 border-r border-slate-200 align-middle h-9">
                                    <select
                                      value={row.odemeTuru}
                                      onFocus={() => setActiveMultiFisRowId(row.id)}
                                      onChange={(e) =>
                                        updateMultiFisRow(row.id, { odemeTuru: e.target.value })
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          handleAddMultiFisRow(row.id);
                                        }
                                      }}
                                      className="w-full h-9 px-1 text-xs font-medium text-slate-900 bg-transparent outline-none cursor-pointer truncate"
                                    >
                                      <option value="Nakit">Nakit</option>
                                      <option value="Banka">Banka</option>
                                      <option value="Kredi Kartı">Kredi Kartı</option>
                                      <option value="Çek / Senet">Çek / Senet</option>
                                      <option value="Cari Mahsup">Cari Mahsup</option>
                                      <option value="Açık Hesap">Açık Hesap</option>
                                    </select>
                                  </td>

                                  {/* 12. Satır İşlemleri (Ekle / Kopyala / Sil) */}
                                  <td className="p-0 align-middle h-9 px-1">
                                    <div className="flex items-center justify-end gap-0.5">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAddMultiFisRow(row.id);
                                        }}
                                        className="p-1 rounded text-blue-600 hover:bg-blue-50 cursor-pointer"
                                        title="Altına yeni satır ekle"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDuplicateMultiFisRow(row.id);
                                        }}
                                        className="p-1 rounded text-slate-500 hover:bg-slate-100 cursor-pointer"
                                        title="Satırı çoğalt"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveMultiFisRow(row.id);
                                        }}
                                        className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer"
                                        title="Satırı sil"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Alt Özet & Çoklu Fiş Kaydet Çubuğu */}
                  <div className="shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pt-2 border-t border-slate-200 bg-white">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-bold">
                        Satır: {multiFisRows.length} (Dolu: {multiFisTotals.filledRowCount})
                      </span>
                      <div className="px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 font-bold flex items-center gap-1.5">
                        <span>Toplam Borç:</span>
                        <span className="font-mono text-xs sm:text-sm">
                          ₺{multiFisTotals.totalBorc.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold flex items-center gap-1.5">
                        <span>Toplam Alacak:</span>
                        <span className="font-mono text-xs sm:text-sm">
                          ₺{multiFisTotals.totalAlacak.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div
                        className={`px-2.5 py-1.5 rounded-lg border font-bold flex items-center gap-1.5 ${
                          Math.abs(multiFisTotals.diff) < 0.01
                            ? "bg-slate-50 border-slate-200 text-slate-600"
                            : "bg-amber-50 border-amber-200 text-amber-800"
                        }`}
                      >
                        <span>Fark:</span>
                        <span className="font-mono text-xs sm:text-sm">
                          ₺{Math.abs(multiFisTotals.diff).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          {multiFisTotals.diff > 0
                            ? " (Borç)"
                            : multiFisTotals.diff < 0
                            ? " (Alacak)"
                            : " (Dengeli)"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddMultiFisRow()}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4 text-blue-600" />
                        <span>Satır Ekle</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveMultiFis()}
                        className="px-5 py-2 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Fişi Kaydet</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsMultiFisFullPage((prev) => !prev)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                          isMultiFisFullPage
                            ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                            : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                        }`}
                        title={
                          isMultiFisFullPage
                            ? "Sol menüyü göster / Tam ekrandan çık"
                            : "Çoklu fiş girişini tam ekran olarak aç"
                        }
                      >
                        {isMultiFisFullPage ? (
                          <>
                            <X className="w-4 h-4" />
                            <span>Tam Ekrandan Çık</span>
                          </>
                        ) : (
                          <>
                            <ExternalLink className="w-4 h-4" />
                            <span>Tam Ekran Aç</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* ==============================================================
                   TEKLİ FİŞ GİRİŞİ FORMU
                   ============================================================== */
                <form onSubmit={handleSaveFis} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 1. Fiş / Evrak No */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          Fiş / Belge Numarası *
                        </label>
                        <button
                          type="button"
                          onClick={() => setFisNo(generateFisNumber(fisType))}
                          className="text-[10px] font-bold text-teal-600 hover:text-teal-800 cursor-pointer"
                        >
                          Yeni No Üret
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={fisNo}
                        onChange={(e) => setFisNo(e.target.value)}
                        placeholder="Örn: FIS-THS-2026-1024"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>

                    {/* 2. Fiş Tarihi */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Fiş Tarihi *
                      </label>
                      <input
                        type="date"
                        required
                        value={fisDate}
                        onChange={(e) => setFisDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>

                    {/* 3. Kasa / Banka Hesabı */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        İşlenecek Kasa / Banka Hesabı *
                      </label>
                      <select
                        value={fisAccountId}
                        onChange={(e) => setFisAccountId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 cursor-pointer focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                      >
                        <optgroup label="💵 Nakit Kasalar">
                          {accounts
                            .filter((a) => a.type === "cash")
                            .map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.name} ({formatCurrency(a.balance, a.currency)})
                              </option>
                            ))}
                        </optgroup>
                        <optgroup label="🏦 Banka & POS Hesapları">
                          {accounts
                            .filter((a) => a.type !== "cash")
                            .map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.name} ({formatCurrency(a.balance, a.currency)})
                              </option>
                            ))}
                        </optgroup>
                      </select>
                    </div>

                    {/* 4. Ödeme Yöntemi veya Mahsup Yönü */}
                    {fisType === "mahsup" ? (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Mahsup İşlem Yönü *
                        </label>
                        <select
                          value={fisDirection}
                          onChange={(e) => setFisDirection(e.target.value as "income" | "expense")}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 cursor-pointer focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                        >
                          <option value="expense">Borç / Çıkış (-)</option>
                          <option value="income">Alacak / Giriş (+)</option>
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Ödeme / Tahsilat Şekli
                        </label>
                        <select
                          value={fisPaymentMethod}
                          onChange={(e) => setFisPaymentMethod(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 cursor-pointer focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                        >
                          <option value="Nakit">Nakit (Kasa)</option>
                          <option value="Kredi Kartı / POS">Kredi Kartı / POS Slip</option>
                          <option value="Banka Havale / EFT">Banka Havale / EFT / FAST</option>
                          <option value="Cari Mahsup">Cari Hesap Mahsubu</option>
                        </select>
                      </div>
                    )}

                    {/* 5. İlgili Cari Hesap Seçimi */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        İlgili Cari Hesap (Müşteri / Tedarikçi)
                      </label>
                      <select
                        value={fisContactId}
                        onChange={(e) => {
                          const cId = e.target.value;
                          setFisContactId(cId);
                          const found = contacts.find((c) => c.id === cId);
                          if (found?.taxNumber) {
                            setFisTaxNumber(found.taxNumber);
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 cursor-pointer focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                      >
                        <option value="">-- Cari Seçin veya Manuel Ünvan Girin --</option>
                        {contacts.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.taxNumber ? `(${c.taxNumber})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 6. Manuel Firma / Kişi Ünvanı & VKN (Özellikle Perakende Gider Fişi için) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {fisContactId ? "Vergi No / TCKN" : "Firma / Kişi Adı (Cari Dışı Fiş)"}
                      </label>
                      {fisContactId ? (
                        <input
                          type="text"
                          value={fisTaxNumber}
                          onChange={(e) => setFisTaxNumber(e.target.value)}
                          placeholder="VKN / TCKN"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                      ) : (
                        <div className="grid grid-cols-5 gap-1.5">
                          <input
                            type="text"
                            value={fisCustomTitle}
                            onChange={(e) => setFisCustomTitle(e.target.value)}
                            placeholder="Örn: Opet Akaryakıt / Market"
                            className="col-span-3 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                          />
                          <input
                            type="text"
                            value={fisTaxNumber}
                            onChange={(e) => setFisTaxNumber(e.target.value)}
                            placeholder="VKN/TCKN"
                            maxLength={11}
                            className="col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                          />
                        </div>
                      )}
                    </div>

                    {/* 7. Kategori / Masraf Kalemi */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Fiş Kategorisi / Masraf Kalemi
                      </label>
                      <select
                        value={fisCategory}
                        onChange={(e) => setFisCategory(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 cursor-pointer focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                      >
                        <optgroup label="📌 Fiş İşlem Türleri">
                          <option value="Tahsilat Fişi (Cari / Müşteri Tahsilatı)">Tahsilat Fişi (Cari / Müşteri Tahsilatı)</option>
                          <option value="Kasa Nakit Tahsilat Fişi">Kasa Nakit Tahsilat Fişi</option>
                          <option value="Tediye Fişi (Tedarikçi / Cari Ödemesi)">Tediye Fişi (Tedarikçi / Cari Ödemesi)</option>
                          <option value="Personel Avans / Maaş Ödeme Fişi">Personel Avans / Maaş Ödeme Fişi</option>
                          <option value="Vergi / SGK / Resmi Kurum Ödeme Fişi">Vergi / SGK / Resmi Kurum Ödeme Fişi</option>
                          <option value="Muhasebe Mahsup Fişi">Muhasebe Mahsup Fişi</option>
                        </optgroup>
                        <optgroup label="🧾 Perakende Gider & Masraf Kalemleri">
                          {EXPENSE_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    {/* 8. Tutar & KDV Ayarları */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          Fiş Tutarı (₺) *
                        </label>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-slate-500">KDV:</span>
                          {[0, 1, 10, 20].map((rate) => (
                            <button
                              key={rate}
                              type="button"
                              onClick={() => setFisVatRate(rate)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                fisVatRate === rate
                                  ? "bg-teal-600 text-white"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              %{rate}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={fisAmount}
                          onChange={(e) => setFisAmount(e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="0,00"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                        {fisVatRate > 0 && (
                          <button
                            type="button"
                            onClick={() => setFisVatIncluded((prev) => !prev)}
                            className={`px-2.5 py-2.5 rounded-xl text-[10px] font-extrabold border shrink-0 cursor-pointer transition-colors ${
                              fisVatIncluded
                                ? "bg-teal-50 text-teal-800 border-teal-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                            title="Tutarın KDV Dahil mi yoksa KDV Hariç mi olduğunu değiştirin"
                          >
                            {fisVatIncluded ? "KDV Dahil" : "KDV Hariç"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Açıklama + KDV Hesaplama Özeti + Kaydet Butonu */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end pt-1">
                    <div className="lg:col-span-6">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Fiş Açıklaması / Detay Notu
                      </label>
                      <input
                        type="text"
                        value={fisDescription}
                        onChange={(e) => setFisDescription(e.target.value)}
                        placeholder={
                          fisType === "tahsilat"
                            ? "Örn: Nisan ayı cari hesap nakit tahsilatı..."
                            : fisType === "tediye"
                            ? "Örn: Tedarikçi cari hesap ödeme makbuzu..."
                            : fisType === "gider_fisi"
                            ? "Örn: Şirket aracı yakıt alımı ÖKC yazar kasa fişi..."
                            : "Örn: Dönem içi cari hesap mahsup fişi kaydı..."
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>

                    <div className="lg:col-span-4">
                      <div className="bg-slate-50 border border-slate-200/90 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">
                            Matrah / KDV (%{fisVatRate})
                          </span>
                          <span className="font-mono font-semibold text-slate-700">
                            ₺{fisCalculated.subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            {fisVatRate > 0 && (
                              <span className="text-amber-600 ml-1">
                                + ₺{fisCalculated.vatAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">
                            Net Fiş Toplamı
                          </span>
                          <span
                            className={`font-mono text-sm font-black ${
                              fisType === "tahsilat" || (fisType === "mahsup" && fisDirection === "income")
                                ? "text-emerald-600"
                                : "text-rose-600"
                            }`}
                          >
                            {fisType === "tahsilat" || (fisType === "mahsup" && fisDirection === "income") ? "+" : "-"}₺
                            {fisCalculated.grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-2">
                      <button
                        type="submit"
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 text-xs"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Fişi Kaydet</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
          )}

          {/* ALT MODÜL 2: FİŞ HAREKETLERİ LİSTESİ TABLOSU */}
          {activeFisViewMode === "fis_listesi" && (
          <div
            className="rounded-2xl border p-6 shadow-2xs space-y-4"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: theme.pageText }}>
                  <Receipt className="w-4 h-4 text-teal-600" />
                  <span>Kayıtlı Fişler & Muhasebe Fiş Hareketleri ({fisTransactions.length})</span>
                </h3>
                <p className="text-xs mt-0.5" style={{ color: theme.pageTextMuted }}>
                  Girilen tahsilat, tediye, gider/masraf ve mahsup fişlerini filtreleyin, yazdırın veya dışa aktarın.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectFisViewMode("fis_girisi")}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Yeni Fiş Girişi</span>
                </button>
                {/* Fiş Türü Filtre Butonları */}
                <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                  {[
                    { id: "all", label: "Tümü" },
                    { id: "tahsilat", label: "Tahsilat" },
                    { id: "tediye", label: "Tediye" },
                    { id: "gider_fisi", label: "Gider Fişi" },
                    { id: "mahsup", label: "Mahsup" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFisFilterType(tab.id as any)}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        fisFilterType === tab.id
                          ? "bg-white text-teal-700 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowFisColFilters((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-colors ${
                    showFisColFilters || activeFisColFilterCount > 0
                      ? "bg-teal-50 text-teal-700 border-teal-200"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Sütun Filtresi</span>
                  {activeFisColFilterCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-teal-600 text-white text-[10px]">
                      {activeFisColFilterCount}
                    </span>
                  )}
                </button>

                <ExportButtons
                  onExportExcel={handleExportFisExcel}
                  onExportPDF={handleExportFisPDF}
                />
              </div>
            </div>

            {fisSelection.selectedCount > 0 && (
              <BulkActionBar
                selectedCount={fisSelection.selectedCount}
                totalCount={displayedFisTransactions.length}
                allSelected={fisSelection.isAllSelected(displayedFisIds)}
                onToggleSelectAll={() => fisSelection.toggleSelectAll(displayedFisIds)}
                onClearSelection={fisSelection.clearSelection}
                onDeleteSelected={onDeleteTransaction || onBulkDeleteTransactions ? handleBulkDeleteFis : undefined}
                onExportExcelSelected={handleBulkExportFisExcel}
                onExportPDFSelected={handleBulkExportFisPDF}
                entityLabel="fiş kaydı"
              />
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                  <tr
                    style={{
                      backgroundColor: theme.tableHeaderBg || "#005289",
                      color: theme.tableHeaderText || "#ffffff",
                    }}
                    className="text-xs font-semibold uppercase tracking-wider shadow-2xs"
                  >
                    <th className="py-2.5 px-3 rounded-l-xl w-9 text-center">
                      <TableCheckbox
                        checked={fisSelection.isAllSelected(displayedFisIds)}
                        indeterminate={fisSelection.isIndeterminate(displayedFisIds)}
                        onChange={() => fisSelection.toggleSelectAll(displayedFisIds)}
                        ariaLabel="Tüm fişleri seç"
                      />
                    </th>
                    <th className="py-2.5 px-3">Tarih</th>
                    <th className="py-2.5 px-3">Fiş No & Türü</th>
                    <th className="py-2.5 px-3">Hesap (Kasa/Banka)</th>
                    <th className="py-2.5 px-3">Cari / Kategori</th>
                    <th className="py-2.5 px-3">Açıklama</th>
                    <th className="py-2.5 px-3 text-right">Tutar</th>
                    <th className="py-2.5 px-3 text-center rounded-r-xl">İşlemler</th>
                  </tr>

                  {showFisColFilters && (
                    <tr className="bg-slate-50/90">
                      <th className="p-1.5 text-center">
                        {activeFisColFilterCount > 0 && (
                          <button
                            type="button"
                            onClick={clearAllFisColFilters}
                            className="p-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                            title="Sütun filtrelerini temizle"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </th>
                      <th className="p-1.5">
                        <TableColumnFilterInput
                          value={fisColFilters.date}
                          onChange={(val) => setFisColFilters((p) => ({ ...p, date: val }))}
                          placeholder="Tarih..."
                        />
                      </th>
                      <th className="p-1.5">
                        <TableColumnFilterInput
                          value={fisColFilters.documentNo}
                          onChange={(val) => setFisColFilters((p) => ({ ...p, documentNo: val }))}
                          placeholder="Fiş No..."
                        />
                      </th>
                      <th className="p-1.5">
                        <TableColumnFilterInput
                          value={fisColFilters.accountName}
                          onChange={(val) => setFisColFilters((p) => ({ ...p, accountName: val }))}
                          placeholder="Kasa/Banka..."
                        />
                      </th>
                      <th className="p-1.5">
                        <TableColumnFilterInput
                          value={fisColFilters.contact}
                          onChange={(val) => setFisColFilters((p) => ({ ...p, contact: val }))}
                          placeholder="Cari / Kategori..."
                        />
                      </th>
                      <th className="p-1.5">
                        <TableColumnFilterInput
                          value={fisColFilters.description}
                          onChange={(val) => setFisColFilters((p) => ({ ...p, description: val }))}
                          placeholder="Açıklama..."
                        />
                      </th>
                      <th className="p-1.5">
                        <TableColumnFilterInput
                          value={fisColFilters.amount}
                          onChange={(val) => setFisColFilters((p) => ({ ...p, amount: val }))}
                          placeholder="Tutar..."
                        />
                      </th>
                      <th className="p-1.5" />
                    </tr>
                  )}
                </thead>
                <tbody className="text-xs">
                  {fisTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Seçili kriterlere uygun fiş kaydı bulunmuyor. Yukarıdaki formdan yeni fiş girişi yapabilirsiniz.
                      </td>
                    </tr>
                  ) : (
                    displayedFisTransactions.map((tx, idx) => {
                      const isExpanded = !!expandedRows[tx.id];
                      const isSelected = fisSelection.isSelected(tx.id);
                      const resolvedType = resolveTransactionFisType(tx);
                      const isIncome = tx.type === "income" || tx.type === "collection";

                      const badgeMap: Record<
                        "tahsilat" | "tediye" | "gider_fisi" | "mahsup",
                        { label: string; cls: string }
                      > = {
                        tahsilat: {
                          label: "Tahsilat Fişi",
                          cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
                        },
                        tediye: {
                          label: "Tediye Fişi",
                          cls: "bg-rose-50 text-rose-700 border-rose-200",
                        },
                        gider_fisi: {
                          label: "Gider / Masraf Fişi",
                          cls: "bg-amber-50 text-amber-700 border-amber-200",
                        },
                        mahsup: {
                          label: "Mahsup Fişi",
                          cls: "bg-indigo-50 text-indigo-700 border-indigo-200",
                        },
                      };
                      const badge = badgeMap[resolvedType];

                      return (
                        <React.Fragment key={tx.id}>
                          <tr
                            onClick={() => handleShowFisReceipt(tx)}
                            className={`${
                              isSelected
                                ? "bg-teal-50/90 ring-1 ring-teal-300"
                                : idx % 2 === 0
                                ? "bg-white"
                                : "bg-[#f8f9ff]"
                            } hover:bg-teal-50/70 transition-all group cursor-pointer shadow-2xs`}
                          >
                            <td
                              className="py-3 px-3 text-center w-9 rounded-l-xl border-y border-l border-slate-200/80"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <TableCheckbox
                                checked={isSelected}
                                onChange={() => fisSelection.toggleSelect(tx.id)}
                                ariaLabel={`${tx.documentNo || tx.description} fişini seç`}
                              />
                            </td>
                            <td className="py-3 px-3 font-medium text-slate-600 border-y border-slate-200/80 whitespace-nowrap">
                              {formatDate(tx.date)}
                            </td>
                            <td className="py-3 px-3 border-y border-slate-200/80">
                              <div className="flex flex-col gap-1">
                                <span className="font-mono font-bold text-slate-900">
                                  {tx.documentNo || `FIS-${tx.id.slice(0, 6).toUpperCase()}`}
                                </span>
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border w-fit ${badge.cls}`}
                                >
                                  {badge.label}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-800 border-y border-slate-200/80">
                              {tx.accountName}
                            </td>
                            <td className="py-3 px-3 border-y border-slate-200/80">
                              <div className="font-bold text-slate-900">
                                {tx.contactName || "-"}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {tx.category}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-slate-700 border-y border-slate-200/80 max-w-xs truncate" title={tx.description}>
                              {tx.description}
                            </td>
                            <td
                              className={`py-3 px-3 text-right font-bold font-mono border-y border-slate-200/80 whitespace-nowrap ${
                                isIncome ? "text-emerald-600" : "text-rose-600"
                              }`}
                            >
                              <div>
                                {isIncome ? "+" : "-"}₺
                                {tx.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                              </div>
                              {typeof tx.totalVat === "number" && tx.totalVat > 0 && (
                                <div className="text-[10px] font-normal text-amber-600">
                                  KDV: ₺{tx.totalVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                </div>
                              )}
                            </td>
                            <td
                              className="py-3 px-3 text-center rounded-r-xl border-y border-r border-slate-200/80"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => toggleRowExpand(tx.id)}
                                  title={isExpanded ? "Detayları Gizle" : "Fiş Detayını Aç"}
                                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                    isExpanded
                                      ? "bg-teal-50 text-teal-700 border-teal-200"
                                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                                  }`}
                                >
                                  <ChevronDown
                                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                      isExpanded ? "rotate-180 text-teal-600" : "text-slate-600"
                                    }`}
                                  />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingTransaction(tx);
                                    setIsEditTxModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-600 hover:text-amber-700 transition-colors cursor-pointer"
                                  title="Fişi Düzenle"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleShowFisReceipt(tx)}
                                  className="p-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 transition-colors cursor-pointer"
                                  title="Fiş Dekontunu Görüntüle & Yazdır / PDF İndir"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleShowFisReceipt(tx);
                                    setIsReceiptWhatsAppOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                                  title="Fiş Dekontunu WhatsApp ile Paylaş"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </button>
                                {onDeleteTransaction && (
                                  <button
                                    type="button"
                                    onClick={() => onDeleteTransaction(tx.id)}
                                    className="p-1.5 rounded-lg border border-transparent hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                    title="Fiş Kaydını Sil"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="bg-slate-50/70 border-y border-slate-200" data-skip-row-highlight="true">
                              <td colSpan={8} className="p-0">
                                <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-50 via-teal-50/30 to-white border-l-4 border-l-teal-600 space-y-3">
                                  <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${badge.cls}`}>
                                        {badge.label.toUpperCase()}
                                      </span>
                                      <span className="text-xs text-slate-500 font-medium">
                                        Fiş No:{" "}
                                        <span className="font-mono font-bold text-slate-900">
                                          {tx.documentNo || `#${tx.id.slice(0, 8)}`}
                                        </span>
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleShowFisReceipt(tx)}
                                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                      >
                                        <Printer className="w-3.5 h-3.5" />
                                        <span>Fiş Makbuzu / PDF</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleShowFisReceipt(tx);
                                          setIsReceiptWhatsAppOpen(true);
                                        }}
                                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                        <span>WhatsApp</span>
                                      </button>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                                      <span className="text-slate-400 block text-[10px] font-bold uppercase">
                                        Kasa / Banka Hesabı
                                      </span>
                                      <span className="font-bold text-slate-800">{tx.accountName}</span>
                                    </div>
                                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                                      <span className="text-slate-400 block text-[10px] font-bold uppercase">
                                        Cari / Kategori
                                      </span>
                                      <span className="font-bold text-slate-800">
                                        {tx.contactName || tx.category || "-"}
                                      </span>
                                    </div>
                                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                                      <span className="text-slate-400 block text-[10px] font-bold uppercase">
                                        KDV & Matrah Detayı
                                      </span>
                                      <span className="font-mono font-bold text-slate-800">
                                        Matrah: ₺{(tx.subtotal ?? tx.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} • KDV: ₺{(tx.totalVat ?? 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                                      <span className="text-slate-400 block text-[10px] font-bold uppercase">
                                        Açıklama
                                      </span>
                                      <span className="font-medium text-slate-700">{tx.description || "-"}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {fisTransactions.length > fisDisplayLimit && (
              <div className="text-center mt-4">
                <button
                  onClick={() => setFisDisplayLimit((prev) => prev + 100)}
                  className="px-4 py-2 bg-teal-100 text-teal-900 rounded-xl font-bold text-xs hover:bg-teal-200 transition-colors cursor-pointer"
                >
                  Daha Fazla Göster ({fisDisplayLimit} / {fisTransactions.length})
                </button>
              </div>
            )}
          </div>
          )}
        </div>
      )}

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
    </div>
  );
};
