import React, { useCallback, useEffect, useState } from "react";
import {
  Invoice,
  InvoiceItem,
  InvoiceType,
  InvoiceProfileType,
  InvoiceScenario,
  InvoiceStatus,
  InvoicePaymentMethod,
  Contact,
  Product,
  Account,
  Branch,
  CompanySettings,
  getContactAccountCode,
  EXPENSE_CATEGORIES,
  ExpenseCategory,
} from "../types";
import { InvoicePrintModal } from "./InvoicePrintModal";
import { InvoicePreviewModal } from "./InvoicePreviewModal";
import { InvoiceTaxSettingsModal } from "./InvoiceTaxSettingsModal";
import { EArsivSignatureStudioModal } from "./EArsivSignatureStudioModal";
import { AiExpenseScannerModal, ExtractedExpenseData } from "./AiExpenseScannerModal";
import { ExportButtons } from "./ExportButtons";
import { Pagination } from "./common/Pagination";
import { ExportData, formatCurrency, formatDate, exportToExcel, exportToPDF } from "../utils/exportUtils";
import { openInvoicePrintModal } from "../utils/printEngine";
import { useTheme } from "../context/ThemeContext";
import { ASSET_ICONS } from "../utils/assetIcons";
import { formatInvoiceWhatsAppMessage } from "../utils/whatsappTemplates";
import { UniversalWhatsAppModal } from "./common/UniversalWhatsAppModal";
import { TableColumnFilterInput } from "./common/TableColumnFilterInput";
import { ColumnManagementDropdown } from "./common/ColumnManagementDropdown";
import { useColumnVisibility, ColumnDef } from "../hooks/useColumnVisibility";
import { TableCheckbox } from "./common/TableCheckbox";
import { BulkActionBar } from "./common/BulkActionBar";
import { useTableSelection } from "../hooks/useTableSelection";
import {
  computeInvoiceTotals,
  formatWithholdingBadge,
  generateInvoiceLegalTaxNotes,
} from "../utils/taxCalculationService";
import { DetailPageLayout, BreadcrumbItem } from "./common/DetailPageLayout";
import { ModuleEntranceHeader } from "./common/ModuleEntranceHeader";
import { useDetailNavigation } from "../hooks/useDetailNavigation";
import { NavItem } from "./Sidebar";
import {
  sendMysoftOutgoingInvoice,
  checkRecipientTaxpayerStatus,
  RecipientTaxpayerStatus,
  getMysoftMappingDefaults,
  MysoftMappingDefaults,
  getNextMysoftInvoiceNumber,
  type MysoftNextInvoiceNumberResult,
  listMysoftTenants,
  normalizeMysoftTenantIdentifier,
  readPersistedEDocuments,
} from "../services/mysoftEDocumentService";
import {
  buildMysoftInvoiceOutboxPayload,
  extractMysoftOutboxResult,
  getRecentMysoftDiagnosticLogs,
  MysoftPayloadValidationError,
  validateMysoftInvoiceOutboxPayload,
  type MysoftDiagnosticLogEntry,
  type MysoftOutboxValidationIssue,
} from "../services/mysoftInvoicePayload";
import { MysoftTenantPicker } from "./MysoftTenantPicker";
import { readStoredMysoftTenantVkn } from "../utils/mysoftTenantStorage";
import {
  calculateNextInvoiceNumber,
  parseInvoiceDocNo,
} from "../services/mysoftInvoiceNumber";
import {
  getCompaniesList,
  updateCompanyItem,
  appendCityDistrictToAddress,
  formatAddressWithBranch,
  compileStructuredAddress,
  getCompanyHeadquartersAddress,
  getBranchAddressFromBranchItem,
} from "../utils/storage";
import { Logo } from "./Logo";
import { readAndOptimizeLogoFile } from "../utils/logoUpload";
import { saveCloudLogo } from "../services/cloudBrandingService";
import {
  FileText,
  FileSpreadsheet,
  Plus,
  Search,
  Printer,
  MessageCircle,
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
  Users,
  Package,
  ExternalLink,
  AlertCircle,
  Building2,
  MapPin,
  Eye,
  Calendar,
  Filter,
  Tag,
  Sparkles,
  UploadCloud,
  Loader2,
  Camera,
  ChevronRight,
  ChevronDown,
  Receipt,
  ScanLine,
  Edit2,
  Hash,
  Sliders,
  Percent,
  ShieldCheck,
  Scale,
  UserPlus,
  User,
  Mail,
  Phone,
  Info,
  RefreshCw,
  Banknote,
  Wallet,
  Save,
  Upload,
  Landmark,
  Send,
  PenTool,
} from "lucide-react";

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

interface InvoicesProps {
  invoices: Invoice[];
  contacts: Contact[];
  products: Product[];
  accounts: Account[];
  branches?: Branch[];
  companySettings: CompanySettings;
  forcedType?: "sales" | "purchase";
  globalSearchTerm?: string;
  onAddInvoice: (invoice: Invoice) => void;
  onUpdateInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  onBulkDeleteInvoices?: (ids: string[]) => void;
  onAddTransactionFromInvoice: (
    invoice: Invoice,
    accountId: string,
    paidAmount: number
  ) => void;
  initialContactIdForNewInvoice?: string | null;
  onCollectAllInvoices?: (targetAccountId?: string) => void;
  onSelectTab?: (tab: NavItem) => void;
  onAddContact?: (contact: Contact) => void;
  onSaveCompanySettings?: (settings: CompanySettings) => void;
  onAddBranch?: (branch: Branch) => void;
  onUpdateBranch?: (branch: Branch) => void;
}

const INVOICE_TABLE_COLUMNS: ColumnDef[] = [
  { id: "invoiceNo", label: "Fatura No & Tip", alwaysVisible: true },
  { id: "contact", label: "Cari Hesap", defaultVisible: true },
  { id: "date", label: "Tarih & Vade", defaultVisible: true },
  { id: "subtotal", label: "KDV Hariç Tutar", defaultVisible: true },
  { id: "grandTotal", label: "Genel Toplam", defaultVisible: true },
  { id: "status", label: "Durum", defaultVisible: true },
  { id: "actions", label: "İşlemler", alwaysVisible: true },
];

export const Invoices: React.FC<InvoicesProps> = ({
  invoices,
  contacts,
  products,
  accounts,
  branches = [],
  companySettings,
  forcedType,
  globalSearchTerm = "",
  onAddInvoice,
  onUpdateInvoice,
  onDeleteInvoice,
  onBulkDeleteInvoices,
  onAddTransactionFromInvoice,
  initialContactIdForNewInvoice,
  onCollectAllInvoices,
  onSelectTab,
  onAddContact,
  onSaveCompanySettings,
  onAddBranch,
  onUpdateBranch,
}) => {
  const { theme } = useTheme();
  const selection = useTableSelection();
  const [filterType, setFilterType] = useState<string>(forcedType || "all");
  const [docSubTab, setDocSubTab] = useState<"invoices" | "receipts" | "all">("invoices");
  const [formDocKind, setFormDocKind] = useState<"invoice" | "receipt">("invoice");
  const [search, setSearch] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedExpenseCategoryFilter, setSelectedExpenseCategoryFilter] = useState<string>("all");

  // Navigation & Detail View
  const detailNav = useDetailNavigation<Invoice>({
    moduleKey: forcedType === "purchase" ? "purchase-invoices" : forcedType === "sales" ? "sales-invoices" : "invoices",
    initialMode: initialContactIdForNewInvoice ? "create" : "list",
  });
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [editingInvoiceNumber, setEditingInvoiceNumber] = useState<string | null>(null);
  const [isAiScannerModalOpen, setIsAiScannerModalOpen] = useState<boolean>(false);
  const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null);
  const [whatsAppInvoice, setWhatsAppInvoice] = useState<Invoice | null>(null);
  const [isDraftPreviewOpen, setIsDraftPreviewOpen] = useState<boolean>(false);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [isCollectAllModalOpen, setIsCollectAllModalOpen] = useState<boolean>(false);
  const [collectAllAccountId, setCollectAllAccountId] = useState<string>(accounts[0]?.id || "");

  // Master-Detail Expanded Rows State (set of expanded invoice IDs)
  const [expandedInvoiceIds, setExpandedInvoiceIds] = useState<Set<string>>(new Set());

  const toggleInvoiceExpand = (id: string) => {
    setExpandedInvoiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterType, docSubTab, selectedYear, selectedMonth, selectedExpenseCategoryFilter, forcedType, globalSearchTerm]);

  // Payment Form State
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    accounts[0]?.id || ""
  );
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  // Quick Picker Modals
  const [isContactPickerOpen, setIsContactPickerOpen] = useState<boolean>(false);
  const [contactPickerSearch, setContactPickerSearch] = useState<string>("");
  const [isQuickContactFormOpen, setIsQuickContactFormOpen] = useState<boolean>(false);
  const [newContactName, setNewContactName] = useState<string>("");
  const [newContactTaxNo, setNewContactTaxNo] = useState<string>("");
  const [newContactPhone, setNewContactPhone] = useState<string>("");
  const [newContactNeighborhood, setNewContactNeighborhood] = useState<string>("");
  const [newContactStreet, setNewContactStreet] = useState<string>("");
  const [newContactDistrict, setNewContactDistrict] = useState<string>("");
  const [newContactCity, setNewContactCity] = useState<string>("");
  const [newContactAddress, setNewContactAddress] = useState<string>("");
  const [newContactBranchName, setNewContactBranchName] = useState<string>("");
  const [newContactBranchCode, setNewContactBranchCode] = useState<string>("");
  const [newContactType, setNewContactType] = useState<"customer" | "vendor" | "both">("both");
  const [quickContactStatus, setQuickContactStatus] = useState<RecipientTaxpayerStatus | null>(null);
  const [isQuickContactChecking, setIsQuickContactChecking] = useState<boolean>(false);

  const [isProductPickerOpen, setIsProductPickerOpen] = useState<boolean>(false);
  const [productPickerSearch, setProductPickerSearch] = useState<string>("");
  const [targetItemRowId, setTargetItemRowId] = useState<string | null>(null);
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>("all");

  // New Invoice Form State
  const [invType, setInvType] = useState<InvoiceType>(forcedType || "sales");
  const [invoiceScenario, setInvoiceScenario] = useState<InvoiceScenario>("TICARIFATURA");
  const [invoiceProfileType, setInvoiceProfileType] = useState<InvoiceProfileType>("SATIS");
  const [paymentMethod, setPaymentMethod] = useState<InvoicePaymentMethod>("cari");
  const [paymentAccountId, setPaymentAccountId] = useState<string>(() => {
    const cashAcc = accounts.find((a) => a.type === "cash");
    return cashAcc?.id || accounts[0]?.id || "";
  });
  const [paymentIban, setPaymentIban] = useState<string>(() => {
    const bankAcc = accounts.find((a) => a.type === "bank");
    return bankAcc?.iban || companySettings.defaultBankIban || companySettings.iban || "";
  });
  const [paymentAccountHolderName, setPaymentAccountHolderName] = useState<string>(() => {
    const bankAcc = accounts.find((a) => a.type === "bank");
    return (
      bankAcc?.accountHolderName ||
      companySettings.defaultBankAccountName ||
      companySettings.companyTitle ||
      companySettings.companyName ||
      ""
    );
  });
  const [includeIbanInNotes, setIncludeIbanInNotes] = useState<boolean>(true);
  const invoiceLogoInputRef = React.useRef<HTMLInputElement | null>(null);
  const [logoUploadNotice, setLogoUploadNotice] = useState<string | null>(null);

  const handleInvoiceLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const optimizedDataUrl = await readAndOptimizeLogoFile(file);
      if (onSaveCompanySettings) {
        onSaveCompanySettings({
          ...companySettings,
          logoUrl: optimizedDataUrl,
        });
      }
      try {
        const compList = getCompaniesList();
        const activeComp = compList.find(
          (c) =>
            c.id === companySettings.id ||
            (companySettings.taxNumber && c.taxNumber === companySettings.taxNumber)
        );
        if (activeComp) {
          updateCompanyItem({ ...activeComp, logoUrl: optimizedDataUrl });
        }
      } catch {}
      void saveCloudLogo(optimizedDataUrl, {
        brandName: companySettings.companyName || "E-MUAVİN",
        description: "Fatura hazırlama ekranından bilgisayardan yüklenen kurumsal logo",
      });
      setLogoUploadNotice("Logo bilgisayardan başarıyla yüklendi ve faturaya uygulandı.");
      setTimeout(() => setLogoUploadNotice(null), 4000);
    } catch (err) {
      setLogoUploadNotice(
        err instanceof Error ? err.message : "Logo yüklenirken hata oluştu."
      );
    } finally {
      e.target.value = "";
    }
  };
  const [taxModalItem, setTaxModalItem] = useState<InvoiceItem | null>(null);
  const [taxModalInitialTab, setTaxModalInitialTab] = useState<"tevkifat" | "ozel_matrah" | "istisna" | "ek_vergiler" | undefined>(undefined);
  const [invoiceNumberInput, setInvoiceNumberInput] = useState<string>("");

  // Customer Mode: "registered" (Kayıtlı Cari Hesap) vs "manual" (Elle Müşteri Bilgisi Gir)
  const [customerMode, setCustomerMode] = useState<"registered" | "manual">(
    initialContactIdForNewInvoice ? "registered" : (contacts.length === 0 ? "manual" : "registered")
  );
  const [manualCustomerName, setManualCustomerName] = useState<string>("");
  const [manualTaxNumber, setManualTaxNumber] = useState<string>("");
  const [manualTaxOffice, setManualTaxOffice] = useState<string>("");
  const [manualNeighborhood, setManualNeighborhood] = useState<string>("");
  const [manualStreet, setManualStreet] = useState<string>("");
  const [manualAddress, setManualAddress] = useState<string>("");
  const [manualCity, setManualCity] = useState<string>("");
  const [manualDistrict, setManualDistrict] = useState<string>("");
  const [manualPhone, setManualPhone] = useState<string>("");
  const [manualEmail, setManualEmail] = useState<string>("");
  const [saveManualAsContact, setSaveManualAsContact] = useState<boolean>(false);
  const manualAddressInputRef = React.useRef<HTMLInputElement | null>(null);
  const lastQueriedManualVknRef = React.useRef<string>("");

  // Firma Merkez Adresi: Doğrudan Firma Profili (companySettings) bölümündeki adresten alınır
  const companyHeadquartersAddress = React.useMemo(
    () => getCompanyHeadquartersAddress(companySettings),
    [companySettings]
  );

  // Şube Bilgileri: Şube adresi doğrudan Şubeler (branches) bölümündeki adresten alınır
  const effectiveBranchesList = React.useMemo(() => {
    if (Array.isArray(branches) && branches.length > 0) {
      return branches;
    }
    return [];
  }, [branches]);

  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    const firstActive =
      branches.find((b) => b.status !== "passive") || branches[0];
    return firstActive?.id || "";
  });
  const [customBranchAddressOverride, setCustomBranchAddressOverride] = useState<string>("");

  const [customerBranchName, setCustomerBranchName] = useState<string>(() => {
    const initContact = contacts.find(
      (c) => c.id === (initialContactIdForNewInvoice || contacts[0]?.id)
    );
    return initContact?.branchName || "";
  });
  const [customerBranchCode, setCustomerBranchCode] = useState<string>(() => {
    const initContact = contacts.find(
      (c) => c.id === (initialContactIdForNewInvoice || contacts[0]?.id)
    );
    return initContact?.branchCode || "";
  });

  const selectedCompanyBranch = React.useMemo(
    () =>
      effectiveBranchesList.find((b) => b.id === selectedBranchId) ||
      effectiveBranchesList.find((b) => b.status !== "passive") ||
      effectiveBranchesList[0] ||
      null,
    [effectiveBranchesList, selectedBranchId]
  );

  // Şube Adresi: Yalnızca Şubeler (branches) bölümündeki seçili şubenin adresinden alınır
  const computedCompanyBranchAddress = React.useMemo(() => {
    if (!selectedCompanyBranch) return "";
    return getBranchAddressFromBranchItem(selectedCompanyBranch);
  }, [selectedCompanyBranch]);

  const resolvedCompanyBranchAddress = React.useMemo(
    () => (customBranchAddressOverride.trim() ? customBranchAddressOverride.trim() : computedCompanyBranchAddress),
    [customBranchAddressOverride, computedCompanyBranchAddress]
  );

  // Clean address helper & automatic counterpart (Merkez <-> Şube) note line builder for Gelir (Sales) Invoices
  const cleanBranchAddressText = useCallback((rawAddr: string) => {
    return String(rawAddr || "")
      .replace(/\s*—\s*Şube:\s*.*$/i, "")
      .replace(/\s*-\s*Şube:\s*.*$/i, "")
      .replace(/\s*\((?:Şube|Merkez):[^)]+\)\s*$/i, "")
      .trim();
  }, []);

  const selectedBranchCleanAddress = React.useMemo(
    () => cleanBranchAddressText(resolvedCompanyBranchAddress),
    [resolvedCompanyBranchAddress, cleanBranchAddressText]
  );

  const isMainBranchSelected = React.useMemo(() => {
    if (!selectedCompanyBranch) return true;
    const lowerName = String(selectedCompanyBranch.name || "").trim().toLocaleLowerCase("tr-TR");
    const lowerCode = String(selectedCompanyBranch.code || "").trim().toLocaleLowerCase("tr-TR");
    return Boolean(
      selectedCompanyBranch.isMain ||
        lowerName === "merkez" ||
        lowerName.includes("merkez şube") ||
        lowerCode === "mrk" ||
        lowerCode === "merkez"
    );
  }, [selectedCompanyBranch]);

  const selectedBranchNoteLine = React.useMemo(() => {
    if (!isMainBranchSelected) {
      // Şube adresi seçilmişse -> Merkez adresini not bölümüne yazdır
      const mainBr = effectiveBranchesList.find((b) => {
        const lName = String(b.name || "").trim().toLocaleLowerCase("tr-TR");
        const lCode = String(b.code || "").trim().toLocaleLowerCase("tr-TR");
        return b.isMain || lName === "merkez" || lName.includes("merkez şube") || lCode === "mrk" || lCode === "merkez";
      });
      const mainBrAddr = mainBr ? cleanBranchAddressText(getBranchAddressFromBranchItem(mainBr)) : "";
      const hqAddr = cleanBranchAddressText(companyHeadquartersAddress) || mainBrAddr;
      if (!hqAddr) return "";
      return `Merkez Adresi: ${hqAddr}`;
    } else {
      // Merkez adresi seçildiyse -> Şube adresini not bölümüne yazdır
      const subBranches = effectiveBranchesList.filter((b) => {
        if (b.status === "passive") return false;
        if (selectedCompanyBranch && b.id === selectedCompanyBranch.id) return false;
        const lName = String(b.name || "").trim().toLocaleLowerCase("tr-TR");
        const lCode = String(b.code || "").trim().toLocaleLowerCase("tr-TR");
        const isMain = b.isMain || lName === "merkez" || lName.includes("merkez şube") || lCode === "mrk" || lCode === "merkez";
        return !isMain;
      });
      if (subBranches.length === 0) return "";
      const subLines = subBranches
        .map((sb) => {
          const sbAddr = cleanBranchAddressText(getBranchAddressFromBranchItem(sb));
          if (!sbAddr) return "";
          const sbName = String(sb.name || "").trim();
          const sbLabel = sbName && sbName.toLocaleLowerCase("tr-TR") !== "şube" ? ` (${sbName})` : "";
          return subBranches.length === 1
            ? `Şube Adresi: ${sbAddr}`
            : `Şube Adresi${sbLabel}: ${sbAddr}`;
        })
        .filter(Boolean);
      return subLines.join("\n");
    }
  }, [
    isMainBranchSelected,
    effectiveBranchesList,
    companyHeadquartersAddress,
    selectedCompanyBranch,
    cleanBranchAddressText,
  ]);

  const syncBranchAddressIntoNotes = useCallback((prevNotes: string, branchLine: string) => {
    const branchLineRegex =
      /^(?:Merkez Adresi|Firma Merkez Adresi|Şube Adresi|Faturanın Kesildiği Şube|Kesilen Şube Adresi|Düzenleyen Merkez\s*\/\s*Şube|Merkez\s*\/\s*Şube Adresi)/i;
    const forbiddenNoteLineRegex =
      /^(?:Esnaf Sicil No|Esnaf Sicil Numarası|İşletme Merkezi)\s*:/i;
    const lines = (prevNotes || "")
      .split("\n")
      .map((l) => l.trimEnd())
      .filter((l) => !forbiddenNoteLineRegex.test(l.trim()));

    if (!branchLine) {
      return lines
        .filter((l) => !branchLineRegex.test(l.trim()))
        .join("\n")
        .trim();
    }

    const hasExisting = lines.some((l) => branchLineRegex.test(l.trim()));
    if (hasExisting) {
      let replaced = false;
      const nextLines: string[] = [];
      for (const l of lines) {
        if (branchLineRegex.test(l.trim())) {
          if (!replaced) {
            nextLines.push(branchLine);
            replaced = true;
          }
        } else {
          nextLines.push(l);
        }
      }
      return nextLines.join("\n").trim();
    }
    const trimmedPrev = lines.join("\n").trim();
    return trimmedPrev ? `${branchLine}\n${trimmedPrev}` : branchLine;
  }, []);

  // Automatically sync counterpart address (Merkez <-> Şube) into notes whenever Gelir Faturası (sales) is active
  useEffect(() => {
    if (!detailNav.isDetailView) return;
    if (invType === "sales") {
      setNotes((prev) => {
        const next = syncBranchAddressIntoNotes(prev, selectedBranchNoteLine);
        return next === prev ? prev : next;
      });
    } else if (invType === "purchase") {
      setNotes((prev) => {
        const branchLineRegex =
          /^(?:Merkez Adresi|Firma Merkez Adresi|Şube Adresi|Faturanın Kesildiği Şube|Kesilen Şube Adresi|Düzenleyen Merkez\s*\/\s*Şube|Merkez\s*\/\s*Şube Adresi|Esnaf Sicil No|Esnaf Sicil Numarası|İşletme Merkezi)/i;
        const filtered = (prev || "")
          .split("\n")
          .filter((l) => !branchLineRegex.test(l.trim()))
          .join("\n")
          .trim();
        return filtered === prev ? prev : filtered;
      });
    }
  }, [detailNav.isDetailView, invType, selectedBranchNoteLine, syncBranchAddressIntoNotes]);

  // Quick inline branch creation / editing inside the invoice form
  const [isQuickBranchFormOpen, setIsQuickBranchFormOpen] = useState(false);
  const [quickBranchMode, setQuickBranchMode] = useState<"create" | "edit">("create");
  const [quickBranchName, setQuickBranchName] = useState("");
  const [quickBranchCode, setQuickBranchCode] = useState("");
  const [quickBranchNeighborhood, setQuickBranchNeighborhood] = useState("");
  const [quickBranchStreet, setQuickBranchStreet] = useState("");
  const [quickBranchCity, setQuickBranchCity] = useState("");
  const [quickBranchDistrict, setQuickBranchDistrict] = useState("");
  const [quickBranchAddress, setQuickBranchAddress] = useState("");

  const handleOpenQuickBranchCreate = () => {
    setQuickBranchMode("create");
    const nextIdx = effectiveBranchesList.length + 1;
    setQuickBranchCode(`SUB-00${nextIdx}`);
    setQuickBranchName("");
    setQuickBranchNeighborhood("");
    setQuickBranchStreet("");
    setQuickBranchCity("");
    setQuickBranchDistrict("");
    setQuickBranchAddress("");
    setIsQuickBranchFormOpen(true);
  };

  const handleOpenQuickBranchEdit = () => {
    if (!selectedCompanyBranch) return;
    setQuickBranchMode("edit");
    setQuickBranchCode(selectedCompanyBranch.code || "SUB-001");
    setQuickBranchName(selectedCompanyBranch.name || "");
    setQuickBranchNeighborhood(selectedCompanyBranch.address?.neighborhood || "");
    setQuickBranchStreet(selectedCompanyBranch.address?.street || "");
    setQuickBranchCity(selectedCompanyBranch.address?.city || "");
    setQuickBranchDistrict(selectedCompanyBranch.address?.district || "");
    setQuickBranchAddress(
      selectedCompanyBranch.address?.fullAddress || selectedBranchCleanAddress || ""
    );
    setIsQuickBranchFormOpen(true);
  };

  const handleSaveQuickBranch = () => {
    const cleanName = quickBranchName.trim();
    const cleanCode = quickBranchCode.trim() || `SUB-00${effectiveBranchesList.length + 1}`;
    const cleanNh = quickBranchNeighborhood.trim();
    const cleanSt = quickBranchStreet.trim();
    const cleanCity = quickBranchCity.trim();
    const cleanDist = quickBranchDistrict.trim();
    if (!cleanName) return;

    const explicitFull = quickBranchAddress.trim();
    const compiledFull = compileStructuredAddress(cleanNh, cleanSt, cleanDist, cleanCity);
    const formattedFullAddr = explicitFull
      ? appendCityDistrictToAddress(explicitFull, cleanCity, cleanDist) || explicitFull
      : compiledFull || "";

    if (quickBranchMode === "edit" && selectedCompanyBranch) {
      const updatedBr: Branch = {
        ...selectedCompanyBranch,
        name: cleanName,
        code: cleanCode,
        address: {
          ...(selectedCompanyBranch.address || { country: "Türkiye", city: cleanCity, district: cleanDist }),
          neighborhood: cleanNh,
          street: cleanSt,
          city: cleanCity,
          district: cleanDist,
          fullAddress: formattedFullAddr,
        },
      };
      if (onUpdateBranch) {
        onUpdateBranch(updatedBr);
      }
      setCustomBranchAddressOverride("");
      setIsQuickBranchFormOpen(false);
    } else {
      const newBr: Branch = {
        id: `br_${Date.now()}`,
        code: cleanCode,
        name: cleanName,
        managerName: "",
        phone: companySettings.phone || "",
        email: companySettings.email || "",
        isMain: false,
        status: "active",
        address: {
          country: "Türkiye",
          neighborhood: cleanNh,
          street: cleanSt,
          city: cleanCity,
          district: cleanDist,
          fullAddress: formattedFullAddr,
        },
        createdAt: new Date().toISOString().split("T")[0],
      };
      if (onAddBranch) {
        onAddBranch(newBr);
      }
      setSelectedBranchId(newBr.id);
      setCustomBranchAddressOverride("");
      setIsQuickBranchFormOpen(false);
    }
  };

  const applyQueriedTaxpayerToManualForm = useCallback(
    (status: RecipientTaxpayerStatus, queriedTaxNo?: string) => {
      const resolvedCity = String(status.city || "").trim();
      const resolvedDistrict = String(status.district || "").trim();
      const resolvedNh = String(status.neighborhood || "").trim();
      const resolvedSt = [status.street, status.buildingNo, status.doorNo].filter(Boolean).join(" ").trim();

      if (queriedTaxNo) {
        setManualTaxNumber(queriedTaxNo);
      }
      if (status.companyTitle || status.title || status.name) {
        setManualCustomerName(status.companyTitle || status.title || status.name || "");
      }
      if (status.taxOffice) {
        setManualTaxOffice(status.taxOffice);
      }
      if (resolvedNh) {
        setManualNeighborhood(resolvedNh);
      }
      if (resolvedSt) {
        setManualStreet(resolvedSt);
      }
      if (resolvedCity) {
        setManualCity(resolvedCity);
      }
      if (resolvedDistrict) {
        setManualDistrict(resolvedDistrict);
      }
      if (status.branchName) {
        setCustomerBranchName(status.branchName);
      }
      if (status.branchCode) {
        setCustomerBranchCode(status.branchCode);
      }
      if (status.phone) {
        setManualPhone((prev) => prev.trim() || status.phone || "");
      }
      if (status.email) {
        setManualEmail((prev) => prev.trim() || status.email || "");
      }

      const structuredAddr = compileStructuredAddress(
        resolvedNh || manualNeighborhood,
        resolvedSt || manualStreet || status.address,
        resolvedDistrict || manualDistrict,
        resolvedCity || manualCity,
        undefined,
        undefined,
        status.postalCode,
        status.branchName || customerBranchName,
        status.branchCode || customerBranchCode
      );
      if (structuredAddr) {
        setManualAddress(structuredAddr);
      }
    },
    [manualNeighborhood, manualStreet, manualCity, manualDistrict, customerBranchName, customerBranchCode]
  );

  const handleManualNeighborhoodChange = (newNh: string) => {
    setManualNeighborhood(newNh);
    const compiled = compileStructuredAddress(
      newNh,
      manualStreet,
      manualDistrict,
      manualCity,
      undefined,
      undefined,
      undefined,
      customerBranchName,
      customerBranchCode
    );
    if (compiled) setManualAddress(compiled);
  };

  const handleManualStreetChange = (newSt: string) => {
    setManualStreet(newSt);
    const compiled = compileStructuredAddress(
      manualNeighborhood,
      newSt,
      manualDistrict,
      manualCity,
      undefined,
      undefined,
      undefined,
      customerBranchName,
      customerBranchCode
    );
    if (compiled) setManualAddress(compiled);
  };

  const handleManualCitySelect = (newCity: string) => {
    const prevCity = manualCity;
    setManualCity(newCity);
    const compiled = compileStructuredAddress(
      manualNeighborhood,
      manualStreet,
      manualDistrict,
      newCity,
      undefined,
      undefined,
      undefined,
      customerBranchName,
      customerBranchCode
    );
    if (compiled && (manualNeighborhood || manualStreet)) {
      setManualAddress(compiled);
    } else {
      setManualAddress((prevAddr) =>
        formatAddressWithBranch(
          appendCityDistrictToAddress(prevAddr, newCity, manualDistrict, prevCity, manualDistrict),
          newCity,
          manualDistrict,
          customerBranchName,
          customerBranchCode
        )
      );
    }
  };

  const handleManualDistrictSelect = (newDistrict: string) => {
    const prevDistrict = manualDistrict;
    setManualDistrict(newDistrict);
    const compiled = compileStructuredAddress(
      manualNeighborhood,
      manualStreet,
      newDistrict,
      manualCity,
      undefined,
      undefined,
      undefined,
      customerBranchName,
      customerBranchCode
    );
    if (compiled && (manualNeighborhood || manualStreet)) {
      setManualAddress(compiled);
    } else {
      setManualAddress((prevAddr) =>
        formatAddressWithBranch(
          appendCityDistrictToAddress(prevAddr, manualCity, newDistrict, manualCity, prevDistrict),
          manualCity,
          newDistrict,
          customerBranchName,
          customerBranchCode
        )
      );
    }
  };

  const clampManualAddressCaret = () => {};

  const handleManualAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualAddress(e.target.value);
  };

  const [contactId, setContactId] = useState<string>(
    initialContactIdForNewInvoice || contacts[0]?.id || ""
  );
  const [vknSearchInput, setVknSearchInput] = useState<string>(() => {
    const initContact = contacts.find(
      (c) => c.id === (initialContactIdForNewInvoice || contacts[0]?.id)
    );
    return initContact?.taxNumber ? initContact.taxNumber.replace(/\D/g, "") : "";
  });

  const handleVknInputChange = (val: string) => {
    const cleanVal = val.replace(/\D/g, "").slice(0, 11);
    setVknSearchInput(cleanVal);

    if (cleanVal.length >= 2) {
      // 1. Exact match on taxNumber
      const exactMatch = contacts.find(
        (c) => c.taxNumber && c.taxNumber.replace(/\D/g, "") === cleanVal
      );
      if (exactMatch) {
        setCustomerMode("registered");
        setContactId(exactMatch.id);
        setCustomerBranchName(exactMatch.branchName || "");
        setCustomerBranchCode(exactMatch.branchCode || "");
        return;
      }

      // 2. Starts with search if >= 6 digits or 10/11 digits
      if (cleanVal.length >= 6) {
        const startsWithMatches = contacts.filter(
          (c) => c.taxNumber && c.taxNumber.replace(/\D/g, "").startsWith(cleanVal)
        );
        if (startsWithMatches.length === 1) {
          setCustomerMode("registered");
          setContactId(startsWithMatches[0].id);
          setCustomerBranchName(startsWithMatches[0].branchName || "");
          setCustomerBranchCode(startsWithMatches[0].branchCode || "");
        }
      }
    }
  };

  const handleContactSelectChange = (newContactId: string) => {
    if (newContactId === "__manual_entry__") {
      setCustomerMode("manual");
      if (vknSearchInput && !manualTaxNumber) {
        setManualTaxNumber(vknSearchInput);
      }
      return;
    }
    setCustomerMode("registered");
    setContactId(newContactId);
    const found = contacts.find((c) => c.id === newContactId);
    if (found) {
      setCustomerBranchName(found.branchName || "");
      setCustomerBranchCode(found.branchCode || "");
    }
    if (found && found.taxNumber) {
      setVknSearchInput(found.taxNumber.replace(/\D/g, ""));
    } else {
      setVknSearchInput("");
    }
  };

  // Delivery Address State
  const [hasDifferentDeliveryAddress, setHasDifferentDeliveryAddress] = useState<boolean>(false);
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  /** Mysoft Giden Fatura (invoiceOutbox) — only for gelir e-fatura. */
  const [sendToMysoft, setSendToMysoft] = useState(true);
  const [mysoftEDocType, setMysoftEDocType] = useState<"e_fatura" | "e_arsiv">("e_fatura");
  const [isSavingMysoft, setIsSavingMysoft] = useState(false);
  const [mysoftSaveError, setMysoftSaveError] = useState<string | null>(null);
  const [mysoftSaveNotice, setMysoftSaveNotice] = useState<string | null>(null);
  const [mysoftValidationIssues, setMysoftValidationIssues] = useState<MysoftOutboxValidationIssue[]>([]);
  const [mysoftDiagnosticLog, setMysoftDiagnosticLog] = useState<MysoftDiagnosticLogEntry | null>(null);
  const [isSignatureStudioOpen, setIsSignatureStudioOpen] = useState(false);

  const handleCloseDetail = useCallback(() => {
    setEditingInvoiceId(null);
    setEditingInvoiceNumber(null);
    setMysoftSaveError(null);
    setMysoftValidationIssues([]);
    setMysoftDiagnosticLog(null);
    detailNav.backToList();
  }, [detailNav]);

  const isCreateModalOpen = detailNav.isDetailView;
  const setIsCreateModalOpen = useCallback(
    (open: boolean) => {
      if (open) {
        detailNav.openCreate();
      } else {
        handleCloseDetail();
      }
    },
    [detailNav, handleCloseDetail]
  );
  const [mysoftTenantVkn, setMysoftTenantVkn] = useState<string | undefined>(() => {
    return (
      readStoredMysoftTenantVkn() ||
      normalizeMysoftTenantIdentifier(companySettings.tenantIdentifierNumber) ||
      normalizeMysoftTenantIdentifier(companySettings.taxNumber) ||
      normalizeMysoftTenantIdentifier(companySettings.vknTckn) ||
      normalizeMysoftTenantIdentifier(companySettings.mysoftCredentials?.tenantIdentifierNumber)
    );
  });
  const selectedTenantVkn = mysoftTenantVkn;
  const [isFetchingNextDocNo, setIsFetchingNextDocNo] = useState<boolean>(false);
  const [mysoftNumberInfo, setMysoftNumberInfo] = useState<MysoftNextInvoiceNumberResult | null>(null);
  const [recipientStatus, setRecipientStatus] = useState<RecipientTaxpayerStatus | null>(null);
  const [isCheckingRecipient, setIsCheckingRecipient] = useState<boolean>(false);
  const [mysoftMappingDefaults, setMysoftMappingDefaults] = useState<MysoftMappingDefaults | null>(null);
  const [selectedEFaturaPrefix, setSelectedEFaturaPrefix] = useState<string>(
    () =>
      (
        companySettings.eFaturaPrefix ||
        (companySettings.defaultInvoicePrefix &&
        companySettings.defaultInvoicePrefix.trim().toUpperCase() !== "MUV2026"
          ? companySettings.defaultInvoicePrefix
          : "") ||
        "GIB"
      )
        .trim()
        .toUpperCase()
        .slice(0, 3) || "GIB",
  );
  const [selectedEArsivPrefix, setSelectedEArsivPrefix] = useState<string>(
    () => (companySettings.eArsivPrefix || "EAR").trim().toUpperCase().slice(0, 3) || "EAR",
  );
  const [isLoadingMysoftSeries, setIsLoadingMysoftSeries] = useState<boolean>(false);

  // Sync e-Fatura & e-Arşiv prefixes when Fatura & Belge Format Parametreleri (companySettings) changes
  useEffect(() => {
    const nextEFat = (
      companySettings.eFaturaPrefix ||
      (companySettings.defaultInvoicePrefix &&
      companySettings.defaultInvoicePrefix.trim().toUpperCase() !== "MUV2026"
        ? companySettings.defaultInvoicePrefix
        : "") ||
      ""
    )
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 3);
    if (nextEFat) {
      setSelectedEFaturaPrefix(nextEFat);
    }
    const nextEArs = (companySettings.eArsivPrefix || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 3);
    if (nextEArs) {
      setSelectedEArsivPrefix(nextEArs);
    }
  }, [
    companySettings.eFaturaPrefix,
    companySettings.eArsivPrefix,
    companySettings.defaultInvoicePrefix,
    companySettings.eFaturaNextNumber,
    companySettings.eArsivNextNumber,
  ]);
  const [isManualInvoiceNumber, setIsManualInvoiceNumber] = useState<boolean>(false);

  useEffect(() => {
    const fromSettings = normalizeMysoftTenantIdentifier(
      companySettings.tenantIdentifierNumber ||
        companySettings.taxNumber ||
        companySettings.vknTckn ||
        companySettings.mysoftCredentials?.tenantIdentifierNumber,
    );
    if (fromSettings && !mysoftTenantVkn) {
      setMysoftTenantVkn(fromSettings);
    }
  }, [
    companySettings.tenantIdentifierNumber,
    companySettings.taxNumber,
    companySettings.vknTckn,
    companySettings.mysoftCredentials?.tenantIdentifierNumber,
    mysoftTenantVkn,
  ]);

  useEffect(() => {
    if (companySettings.eFaturaPrefix) {
      setSelectedEFaturaPrefix(companySettings.eFaturaPrefix.trim().toUpperCase().slice(0, 3));
    }
    if (companySettings.eArsivPrefix) {
      setSelectedEArsivPrefix(companySettings.eArsivPrefix.trim().toUpperCase().slice(0, 3));
    }
  }, [companySettings.eFaturaPrefix, companySettings.eArsivPrefix]);

  const refreshMysoftSerialNumbers = useCallback(
    async (targetVkn?: string) => {
      const vkn =
        normalizeMysoftTenantIdentifier(targetVkn) ||
        mysoftTenantVkn ||
        normalizeMysoftTenantIdentifier(companySettings.tenantIdentifierNumber) ||
        normalizeMysoftTenantIdentifier(
          companySettings.vkn || companySettings.tckn || companySettings.taxNumber,
        );
      if (!vkn) return;
      setIsLoadingMysoftSeries(true);
      try {
        const currentYear = new Date().getFullYear();
        const [defaultsSettled, efatNextSettled, earsNextSettled] = await Promise.allSettled([
          getMysoftMappingDefaults(vkn),
          getNextMysoftInvoiceNumber({
            tenantIdentifierNumber: vkn,
            eDocumentType: "EFATURA",
            year: currentYear,
          }),
          getNextMysoftInvoiceNumber({
            tenantIdentifierNumber: vkn,
            eDocumentType: "EARSIVFATURA",
            year: currentYear,
          }),
        ]);

        const defaults = defaultsSettled.status === "fulfilled" ? defaultsSettled.value : null;
        const efatNext = efatNextSettled.status === "fulfilled" ? efatNextSettled.value : null;
        const earsNext = earsNextSettled.status === "fulfilled" ? earsNextSettled.value : null;

        const persistedOutboxDocNos = readPersistedEDocuments()
          .filter(
            (doc) =>
              doc.direction === "outbox" ||
              doc.direction === "outgoing" ||
              doc.canonicalDirection === "outgoing",
          )
          .map((doc) => String(doc.documentNo || doc.documentNumber || ""))
          .filter(Boolean);

        const localSalesDocNos = [
          ...invoices
            .filter((inv) => inv.type === "sales" && inv.status !== "draft")
            .map((inv) => inv.invoiceNumber)
            .filter(Boolean),
          ...persistedOutboxDocNos,
        ];

        const savedEFatPfx = (
          companySettings.eFaturaPrefix ||
          (companySettings.defaultInvoicePrefix &&
          companySettings.defaultInvoicePrefix.trim().toUpperCase() !== "MUV2026"
            ? companySettings.defaultInvoicePrefix
            : "") ||
          ""
        )
          .trim()
          .toUpperCase()
          .slice(0, 3);

        const resolvedEFatPrefix = (
          (savedEFatPfx && savedEFatPfx !== "GIB" ? savedEFatPfx : "") ||
          (efatNext?.prefix && efatNext.prefix !== "GIB" ? efatNext.prefix : "") ||
          (defaults?.eFaturaPrefix && defaults.eFaturaPrefix !== "GIB" ? defaults.eFaturaPrefix : "") ||
          savedEFatPfx ||
          efatNext?.prefix ||
          defaults?.eFaturaPrefix ||
          "GIB"
        )
          .trim()
          .toUpperCase()
          .slice(0, 3);

        let savedEFatNextSeq = 0;
        if (companySettings.eFaturaNextNumber) {
          const m = /^([A-Za-z0-9]{3})(20\d{2})(\d{1,9})$/.exec(
            companySettings.eFaturaNextNumber.trim(),
          );
          if (
            m &&
            m[1].toUpperCase() === resolvedEFatPrefix &&
            Number(m[2]) === currentYear
          ) {
            savedEFatNextSeq = parseInt(m[3], 10) || 0;
          }
        }

        const efatMerged = calculateNextInvoiceNumber({
          existingDocNos: [
            efatNext?.prefix?.toUpperCase() === resolvedEFatPrefix
              ? efatNext?.lastInvoiceNumber
              : undefined,
            defaults?.eFaturaPrefix?.toUpperCase() === resolvedEFatPrefix
              ? defaults?.eFaturaLastNumber
              : undefined,
            ...localSalesDocNos,
          ].filter((x): x is string => Boolean(x)),
          targetPrefix: resolvedEFatPrefix,
          targetYear: currentYear,
          fallbackPrefix: "GIB",
        });

        const finalEFatSeq = Math.max(
          efatNext?.prefix?.toUpperCase() === resolvedEFatPrefix
            ? efatNext?.nextSequence || 1
            : 1,
          defaults?.eFaturaPrefix?.toUpperCase() === resolvedEFatPrefix
            ? defaults?.eFaturaSequence || 1
            : 1,
          savedEFatNextSeq,
          efatMerged.nextSequence || 1,
        );
        const finalEFatNextNo = `${resolvedEFatPrefix}${currentYear}${String(finalEFatSeq).padStart(9, "0")}`;
        const finalEFatLastNo =
          finalEFatSeq > 1
            ? `${resolvedEFatPrefix}${currentYear}${String(finalEFatSeq - 1).padStart(9, "0")}`
            : efatNext?.lastInvoiceNumber || defaults?.eFaturaLastNumber;

        const savedEArsPfx = (companySettings.eArsivPrefix || "")
          .trim()
          .toUpperCase()
          .slice(0, 3);

        const resolvedEArsPrefix = (
          (savedEArsPfx && savedEArsPfx !== "EAR" ? savedEArsPfx : "") ||
          (earsNext?.prefix && earsNext.prefix !== "EAR" ? earsNext.prefix : "") ||
          (defaults?.eArsivPrefix && defaults.eArsivPrefix !== "EAR" ? defaults.eArsivPrefix : "") ||
          savedEArsPfx ||
          earsNext?.prefix ||
          defaults?.eArsivPrefix ||
          "EAR"
        )
          .trim()
          .toUpperCase()
          .slice(0, 3);

        let savedEArsNextSeq = 0;
        if (companySettings.eArsivNextNumber) {
          const m = /^([A-Za-z0-9]{3})(20\d{2})(\d{1,9})$/.exec(
            companySettings.eArsivNextNumber.trim(),
          );
          if (
            m &&
            m[1].toUpperCase() === resolvedEArsPrefix &&
            Number(m[2]) === currentYear
          ) {
            savedEArsNextSeq = parseInt(m[3], 10) || 0;
          }
        }

        const earsMerged = calculateNextInvoiceNumber({
          existingDocNos: [
            earsNext?.prefix?.toUpperCase() === resolvedEArsPrefix
              ? earsNext?.lastInvoiceNumber
              : undefined,
            defaults?.eArsivPrefix?.toUpperCase() === resolvedEArsPrefix
              ? defaults?.eArsivLastNumber
              : undefined,
            ...localSalesDocNos,
          ].filter((x): x is string => Boolean(x)),
          targetPrefix: resolvedEArsPrefix,
          targetYear: currentYear,
          fallbackPrefix: "EAR",
        });

        const finalEArsSeq = Math.max(
          earsNext?.prefix?.toUpperCase() === resolvedEArsPrefix
            ? earsNext?.nextSequence || 1
            : 1,
          defaults?.eArsivPrefix?.toUpperCase() === resolvedEArsPrefix
            ? defaults?.eArsivSequence || 1
            : 1,
          savedEArsNextSeq,
          earsMerged.nextSequence || 1,
        );
        const finalEArsNextNo = `${resolvedEArsPrefix}${currentYear}${String(finalEArsSeq).padStart(9, "0")}`;
        const finalEArsLastNo =
          finalEArsSeq > 1
            ? `${resolvedEArsPrefix}${currentYear}${String(finalEArsSeq - 1).padStart(9, "0")}`
            : earsNext?.lastInvoiceNumber || defaults?.eArsivLastNumber;

        setSelectedEFaturaPrefix(resolvedEFatPrefix);
        setSelectedEArsivPrefix(resolvedEArsPrefix);

        const mergedPrefixes = [...(defaults?.prefixes || [])];
        if (
          !mergedPrefixes.some(
            (p) => String(p.prefix || "").toUpperCase() === resolvedEFatPrefix,
          )
        ) {
          mergedPrefixes.unshift({
            prefix: resolvedEFatPrefix,
            edocumentType: 1,
            currentNumber: finalEFatSeq > 1 ? finalEFatSeq - 1 : 0,
          });
        }
        if (
          !mergedPrefixes.some(
            (p) => String(p.prefix || "").toUpperCase() === resolvedEArsPrefix,
          )
        ) {
          mergedPrefixes.push({
            prefix: resolvedEArsPrefix,
            edocumentType: 2,
            currentNumber: finalEArsSeq > 1 ? finalEArsSeq - 1 : 0,
          });
        }

        setMysoftMappingDefaults({
          vknTckn: vkn,
          eFaturaPrefix: resolvedEFatPrefix,
          eFaturaLastNumber: finalEFatLastNo,
          eFaturaNextNumber: finalEFatNextNo,
          eFaturaSequence: finalEFatSeq,
          eArsivPrefix: resolvedEArsPrefix,
          eArsivLastNumber: finalEArsLastNo,
          eArsivNextNumber: finalEArsNextNo,
          eArsivSequence: finalEArsSeq,
          prefixes: mergedPrefixes,
        });
      } catch {
        // Keep current prefixes/settings
      } finally {
        setIsLoadingMysoftSeries(false);
      }
    },
    [
      mysoftTenantVkn,
      companySettings.tenantIdentifierNumber,
      companySettings.vkn,
      companySettings.tckn,
      companySettings.taxNumber,
      companySettings.eFaturaPrefix,
      companySettings.eArsivPrefix,
      companySettings.defaultInvoicePrefix,
      companySettings.eFaturaNextNumber,
      companySettings.eArsivNextNumber,
      invoices,
    ],
  );

  const fetchAndApplyNextInvoiceNumber = useCallback(
    async (overrideTenant?: string, overrideDocType?: "e_fatura" | "e_arsiv") => {
      let targetTenant =
        overrideTenant ||
        mysoftTenantVkn ||
        readStoredMysoftTenantVkn() ||
        normalizeMysoftTenantIdentifier(companySettings.tenantIdentifierNumber) ||
        normalizeMysoftTenantIdentifier(companySettings.taxNumber) ||
        normalizeMysoftTenantIdentifier(companySettings.vknTckn) ||
        normalizeMysoftTenantIdentifier(companySettings.mysoftCredentials?.tenantIdentifierNumber);

      if (!targetTenant) {
        try {
          const tenants = await listMysoftTenants();
          if (tenants.length > 0) {
            targetTenant = tenants[0].taxNumber;
            setMysoftTenantVkn(targetTenant);
          }
        } catch {
          // ignore
        }
      }

      const targetDocType = overrideDocType || mysoftEDocType;
      setIsFetchingNextDocNo(true);
      try {
        const result = await getNextMysoftInvoiceNumber({
          tenantIdentifierNumber: targetTenant,
          eDocumentType: targetDocType === "e_arsiv" ? "EARSIVFATURA" : "EFATURA",
        });

        // Localdeki faturaları ve Mysoft giden e-belgeleri de kontrol ederek çakışmayı önle
        const persistedOutboxDocNos = readPersistedEDocuments()
          .filter(
            (doc) =>
              doc.direction === "outbox" ||
              doc.direction === "outgoing" ||
              doc.canonicalDirection === "outgoing",
          )
          .map((doc) => String(doc.documentNo || doc.documentNumber || ""))
          .filter(Boolean);

        const localDocNos = [
          ...invoices
            .filter((inv) => inv.type === "sales")
            .map((inv) => inv.invoiceNumber)
            .filter(Boolean),
          ...persistedOutboxDocNos,
        ];

        // Kullanıcının Fatura & Belge Format Parametreleri / Portaldaki Seriler bölümündeki ön ekini koru
        const configuredPrefix = (
          targetDocType === "e_arsiv"
            ? (selectedEArsivPrefix && selectedEArsivPrefix !== "EAR"
                ? selectedEArsivPrefix
                : "") ||
              (companySettings.eArsivPrefix && companySettings.eArsivPrefix !== "EAR"
                ? companySettings.eArsivPrefix
                : "") ||
              (mysoftMappingDefaults?.eArsivPrefix &&
              mysoftMappingDefaults.eArsivPrefix !== "EAR"
                ? mysoftMappingDefaults.eArsivPrefix
                : "") ||
              (result.prefix && result.prefix !== "EAR" && result.prefix !== "GIB"
                ? result.prefix
                : "") ||
              companySettings.eArsivPrefix ||
              selectedEArsivPrefix ||
              result.prefix ||
              "EAR"
            : (selectedEFaturaPrefix && selectedEFaturaPrefix !== "GIB"
                ? selectedEFaturaPrefix
                : "") ||
              (companySettings.eFaturaPrefix && companySettings.eFaturaPrefix !== "GIB"
                ? companySettings.eFaturaPrefix
                : "") ||
              (mysoftMappingDefaults?.eFaturaPrefix &&
              mysoftMappingDefaults.eFaturaPrefix !== "GIB"
                ? mysoftMappingDefaults.eFaturaPrefix
                : "") ||
              (result.prefix && result.prefix !== "GIB" && result.prefix !== "EAR"
                ? result.prefix
                : "") ||
              companySettings.eFaturaPrefix ||
              selectedEFaturaPrefix ||
              result.prefix ||
              "GIB"
        )
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 3);

        let savedSeq = 0;
        const savedCandidates =
          targetDocType === "e_arsiv"
            ? [mysoftMappingDefaults?.eArsivNextNumber, companySettings.eArsivNextNumber]
            : [mysoftMappingDefaults?.eFaturaNextNumber, companySettings.eFaturaNextNumber];
        for (const cand of savedCandidates) {
          if (!cand) continue;
          const m = /^([A-Za-z0-9]{3})(20\d{2})(\d{1,9})$/.exec(cand.trim());
          if (
            m &&
            m[1].toUpperCase() === configuredPrefix &&
            Number(m[2]) === result.year
          ) {
            const parsed = parseInt(m[3], 10) || 0;
            if (parsed > savedSeq) savedSeq = parsed;
          }
        }

        const mergedCalc = calculateNextInvoiceNumber({
          existingDocNos: [
            result.prefix?.toUpperCase() === configuredPrefix
              ? result.lastInvoiceNumber
              : undefined,
            ...localDocNos,
          ].filter((x): x is string => Boolean(x)),
          targetPrefix: configuredPrefix,
          targetYear: result.year,
          fallbackPrefix: targetDocType === "e_arsiv" ? "EAR" : "GIB",
        });

        const apiMatchesPrefix = result.prefix?.toUpperCase() === configuredPrefix;
        const finalNextSeq = Math.max(
          1,
          apiMatchesPrefix ? result.nextSequence || 1 : 1,
          savedSeq,
          mergedCalc.nextSequence || 1,
        );
        const finalNextDocNo = `${configuredPrefix}${result.year}${String(finalNextSeq).padStart(9, "0")}`;

        if (configuredPrefix) {
          if (targetDocType === "e_arsiv") {
            setSelectedEArsivPrefix(configuredPrefix);
          } else {
            setSelectedEFaturaPrefix(configuredPrefix);
          }
        }

        setMysoftNumberInfo({
          ...result,
          prefix: configuredPrefix,
          lastSequence: Math.max(
            apiMatchesPrefix ? result.lastSequence : 0,
            mergedCalc.lastSequence,
            finalNextSeq > 1 ? finalNextSeq - 1 : 0,
          ),
          nextSequence: finalNextSeq,
          nextInvoiceNumber: finalNextDocNo,
        });

        if (sendToMysoft) {
          setInvoiceNumberInput(finalNextDocNo);
        }

        setMysoftMappingDefaults((prev) => ({
          ...(prev || { vknTckn: targetTenant || "", prefixes: [] }),
          ...(targetDocType === "e_arsiv"
            ? {
                eArsivPrefix: configuredPrefix,
                eArsivNextNumber: finalNextDocNo,
                eArsivSequence: finalNextSeq,
              }
            : {
                eFaturaPrefix: configuredPrefix,
                eFaturaNextNumber: finalNextDocNo,
                eFaturaSequence: finalNextSeq,
              }),
        }));

        if (result.tenantIdentifierNumber && !mysoftTenantVkn) {
          setMysoftTenantVkn(result.tenantIdentifierNumber);
        }
      } catch (err) {
        console.warn("Mysoft sıradaki fatura numarası sorgusu başarısız:", err);
      } finally {
        setIsFetchingNextDocNo(false);
      }
    },
    [
      mysoftTenantVkn,
      companySettings,
      mysoftEDocType,
      invoices,
      sendToMysoft,
      selectedEFaturaPrefix,
      selectedEArsivPrefix,
      mysoftMappingDefaults,
    ],
  );

  const handleTenantSelect = useCallback((vkn: string | undefined) => {
    setMysoftTenantVkn(vkn);
    setMysoftSaveError(null);
    if (vkn) {
      void fetchAndApplyNextInvoiceNumber(vkn);
      void refreshMysoftSerialNumbers(vkn);
    }
  }, [fetchAndApplyNextInvoiceNumber, refreshMysoftSerialNumbers]);

  const handleEDocTypeChange = useCallback((nextType: "e_fatura" | "e_arsiv") => {
    setMysoftEDocType(nextType);
    if (nextType === "e_arsiv") {
      setInvoiceScenario("EARSIVFATURA");
    } else if (invoiceScenario === "EARSIVFATURA") {
      setInvoiceScenario("TICARIFATURA");
    }
    setIsManualInvoiceNumber(false);
    void fetchAndApplyNextInvoiceNumber(undefined, nextType);
  }, [fetchAndApplyNextInvoiceNumber, invoiceScenario]);

  useEffect(() => {
    refreshMysoftSerialNumbers();
  }, [refreshMysoftSerialNumbers]);

  // Live e-Fatura vs e-Arşiv Recipient Taxpayer Auto-Detection
  useEffect(() => {
    const contact = contacts.find((c) => c.id === contactId);
    const taxNum = (
      customerMode === "manual"
        ? (manualTaxNumber || vknSearchInput || "")
        : (contact?.taxNumber || vknSearchInput || "")
    ).replace(/\D/g, "").trim();

    if (!taxNum || (taxNum.length !== 10 && taxNum.length !== 11)) {
      setRecipientStatus(null);
      return;
    }

    let isMounted = true;
    setIsCheckingRecipient(true);
    checkRecipientTaxpayerStatus(taxNum, undefined, mysoftTenantVkn)
      .then((status) => {
        if (isMounted) {
          setRecipientStatus(status);
          const nextType = status.isEFaturaUser ? "e_fatura" : "e_arsiv";
          setMysoftEDocType(nextType);
          if (status.isEFaturaUser) {
            setInvoiceScenario((prev) =>
              prev === "EARSIVFATURA"
                ? status.suggestedProfile === "TEMELFATURA"
                  ? "TEMELFATURA"
                  : "TICARIFATURA"
                : prev,
            );
          } else {
            setInvoiceScenario("EARSIVFATURA");
          }
          if (customerMode === "manual" && taxNum !== "11111111111") {
            if (lastQueriedManualVknRef.current !== taxNum) {
              lastQueriedManualVknRef.current = taxNum;
              applyQueriedTaxpayerToManualForm(status, taxNum);
            }
          }
          void fetchAndApplyNextInvoiceNumber(undefined, nextType);
        }
      })
      .finally(() => {
        if (isMounted) setIsCheckingRecipient(false);
      });

    return () => {
      isMounted = false;
    };
  }, [contactId, contacts, customerMode, manualTaxNumber, vknSearchInput, mysoftTenantVkn, fetchAndApplyNextInvoiceNumber, applyQueriedTaxpayerToManualForm]);

  const handleQuickLookupVkn = async (overrideVkn?: string) => {
    const rawVal = overrideVkn !== undefined ? overrideVkn : newContactTaxNo;
    const clean = String(rawVal || "").replace(/\D/g, "").slice(0, 11);
    if (clean.length !== 10 && clean.length !== 11) return;
    setIsQuickContactChecking(true);
    try {
      const status = await checkRecipientTaxpayerStatus(clean, undefined, mysoftTenantVkn);
      setQuickContactStatus(status);
      if (status.companyTitle || status.title || status.name) {
        setNewContactName(status.companyTitle || status.title || status.name || "");
      }
      if (status.phone) {
        setNewContactPhone(status.phone);
      }
      if (status.neighborhood) setNewContactNeighborhood(status.neighborhood);
      if (status.street) setNewContactStreet(status.street);
      if (status.district) setNewContactDistrict(status.district);
      if (status.city) setNewContactCity(status.city);
      const compiled = compileStructuredAddress(
        status.neighborhood,
        status.street || status.address,
        status.district,
        status.city,
        status.buildingNo,
        status.doorNo,
        status.postalCode
      );
      if (compiled) setNewContactAddress(compiled);
    } catch (e) {
      console.error("Hızlı cari sorgulama hatası:", e);
    } finally {
      setIsQuickContactChecking(false);
    }
  };

  const handleQuickCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim()) return;

    const effBranchName = newContactBranchName.trim() || quickContactStatus?.branchName || undefined;
    const effBranchCode = newContactBranchCode.trim() || quickContactStatus?.branchCode || undefined;
    const effNh = newContactNeighborhood.trim() || quickContactStatus?.neighborhood || undefined;
    const effSt = newContactStreet.trim() || quickContactStatus?.street || undefined;
    const effDist = newContactDistrict.trim() || quickContactStatus?.district || undefined;
    const effCity = newContactCity.trim() || quickContactStatus?.city || undefined;

    const compiledFullAddr =
      compileStructuredAddress(
        effNh,
        effSt,
        effDist,
        effCity,
        quickContactStatus?.buildingNo,
        quickContactStatus?.doorNo,
        quickContactStatus?.postalCode,
        effBranchName,
        effBranchCode
      ) ||
      newContactAddress.trim() ||
      formatAddressWithBranch(
        quickContactStatus?.address,
        effCity,
        effDist,
        effBranchName,
        effBranchCode
      );

    const createdContact: Contact = {
      id: "cnt_" + Date.now(),
      name: newContactName.trim(),
      companyTitle: quickContactStatus?.companyTitle || quickContactStatus?.title || newContactName.trim(),
      companyName: quickContactStatus?.companyTitle || quickContactStatus?.title || newContactName.trim(),
      taxNumber: newContactTaxNo.trim() || undefined,
      taxOffice: quickContactStatus?.taxOffice || undefined,
      city: effCity,
      district: effDist,
      neighborhood: effNh,
      street: effSt,
      buildingNo: quickContactStatus?.buildingNo || undefined,
      doorNo: quickContactStatus?.doorNo || undefined,
      postalCode: quickContactStatus?.postalCode || undefined,
      branchName: effBranchName,
      branchCode: effBranchCode,
      address: compiledFullAddr || undefined,
      shippingAddress: compiledFullAddr || undefined,
      phone: newContactPhone.trim() || quickContactStatus?.phone || undefined,
      email: quickContactStatus?.email || undefined,
      contactPerson: quickContactStatus?.contactPerson || undefined,
      contactType: newContactType,
      isEFaturaUser: quickContactStatus?.isEFaturaUser,
      pkAlias: quickContactStatus?.pkAlias,
      gbAlias: quickContactStatus?.gbAlias,
      activityStatus: quickContactStatus?.activityStatus,
      balance: 0,
      balanceType: "balanced",
      createdAt: new Date().toISOString().split("T")[0],
    };

    if (onAddContact) {
      onAddContact(createdContact);
    } else {
      contacts.push(createdContact);
    }
    setContactId(createdContact.id);
    setCustomerBranchName(createdContact.branchName || "");
    setCustomerBranchCode(createdContact.branchCode || "");
    setVknSearchInput(createdContact.taxNumber ? createdContact.taxNumber.replace(/\D/g, "") : "");
    setIsQuickContactFormOpen(false);
    setIsContactPickerOpen(false);
    setNewContactName("");
    setNewContactTaxNo("");
    setNewContactNeighborhood("");
    setNewContactStreet("");
    setNewContactDistrict("");
    setNewContactCity("");
    setNewContactAddress("");
    setNewContactPhone("");
    setNewContactBranchName("");
    setNewContactBranchCode("");
    setQuickContactStatus(null);
  };

  const handleSelectProductFromPicker = (prod: Product) => {
    const defaultUnitPrice = invType === "sales" ? prod.sellPrice : prod.buyPrice;
    const desc = `${prod.name}${prod.code ? ` (${prod.code})` : ""}`;
    const vat = prod.vatRate || 20;

    if (targetItemRowId) {
      setItems((prevItems) =>
        prevItems.map((item) => {
          if (item.id === targetItemRowId) {
            const qty = Number(item.quantity) || 1;
            const gross = qty * defaultUnitPrice;
            let discAmt = Number(item.discountAmount) || 0;
            if (item.discountRate && item.discountRate > 0) {
              discAmt = parseFloat(((gross * item.discountRate) / 100).toFixed(2));
            } else if (discAmt > gross) {
              discAmt = gross;
            }
            const lineNoVat = Math.max(0, gross - discAmt);
            const lineVat = (lineNoVat * vat) / 100;
            return {
              ...item,
              productId: prod.id,
              description: desc,
              unit: prod.unit || "Adet",
              unitPrice: defaultUnitPrice,
              vatRate: vat,
              discountAmount: discAmt,
              totalWithoutVat: lineNoVat,
              vatAmount: lineVat,
              totalWithVat: lineNoVat + lineVat,
            };
          }
          return item;
        })
      );
    } else {
      const lineNoVat = 1 * defaultUnitPrice;
      const lineVat = (lineNoVat * vat) / 100;
      const newItem: InvoiceItem = {
        id: "item_" + Date.now(),
        productId: prod.id,
        description: desc,
        quantity: 1,
        unit: prod.unit || "Adet",
        unitPrice: defaultUnitPrice,
        vatRate: vat,
        totalWithoutVat: lineNoVat,
        vatAmount: lineVat,
        totalWithVat: lineNoVat + lineVat,
      };
      setItems((prev) => [...prev, newItem]);
    }

    setIsProductPickerOpen(false);
    setTargetItemRowId(null);
  };
  const [issueDate, setIssueDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState<string>("");

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: "item_1",
      description: "",
      quantity: 1,
      unit: "Adet",
      unitPrice: 5000,
      vatRate: 20,
      totalWithoutVat: 5000,
      vatAmount: 1000,
      totalWithVat: 6000,
    },
  ]);

  const computeMysoftSequentialNumber = useCallback(
    (docType: "e_fatura" | "e_arsiv", customPrefix?: string): string => {
      const isEArsiv = docType === "e_arsiv";
      const currentYear =
        issueDate && /^\d{4}/.test(issueDate)
          ? Number(issueDate.slice(0, 4))
          : new Date().getFullYear();

      // Persisted Mysoft outgoing e-documents: discover active prefix and highest sequence
      const persistedEDocs = readPersistedEDocuments().filter(
        (doc) =>
          doc.direction === "outbox" ||
          doc.direction === "outgoing" ||
          doc.canonicalDirection === "outgoing",
      );

      let discoveredEDocPrefix = "";
      let discoveredEDocMaxSeq = 0;
      const eDocMaxSeqByPrefix: Record<string, number> = {};

      for (const doc of persistedEDocs) {
        const rawDocNo = String(doc.documentNo || doc.documentNumber || "")
          .replace(/\s*\(TASLAK\)\s*$/i, "")
          .trim();
        const match = /^([A-Za-z0-9]{3})(20\d{2})(\d{1,9})$/.exec(rawDocNo);
        if (!match) continue;
        const pfx = match[1].toUpperCase();
        if (pfx === "GYR") continue;
        const yr = Number(match[2]);
        const seq = parseInt(match[3], 10);
        if (yr !== currentYear || isNaN(seq)) continue;

        if (!eDocMaxSeqByPrefix[pfx] || seq > eDocMaxSeqByPrefix[pfx]) {
          eDocMaxSeqByPrefix[pfx] = seq;
        }
        const docIsEArsiv =
          doc.documentType === "e_arsiv" ||
          String(doc.profile || "").toUpperCase().includes("ARSIV") ||
          pfx === "EAR";
        if (docIsEArsiv === isEArsiv && seq >= discoveredEDocMaxSeq) {
          discoveredEDocMaxSeq = seq;
          discoveredEDocPrefix = pfx;
        }
      }

      const infoPrefix =
        mysoftNumberInfo &&
        (mysoftNumberInfo.eDocumentType === "EARSIVFATURA") === isEArsiv &&
        mysoftNumberInfo.prefix &&
        mysoftNumberInfo.prefix !== "GIB" &&
        mysoftNumberInfo.prefix !== "EAR"
          ? mysoftNumberInfo.prefix
          : "";

      const nonGenericCandidate = (val?: string) => {
        const cleaned = String(val || "").trim().toUpperCase().slice(0, 3);
        return cleaned && cleaned !== "GIB" && cleaned !== "EAR" ? cleaned : "";
      };

      const rawPrefix =
        customPrefix ||
        (isEArsiv
          ? nonGenericCandidate(selectedEArsivPrefix) ||
            nonGenericCandidate(infoPrefix) ||
            nonGenericCandidate(mysoftMappingDefaults?.eArsivPrefix) ||
            nonGenericCandidate(companySettings.eArsivPrefix) ||
            nonGenericCandidate(discoveredEDocPrefix) ||
            selectedEArsivPrefix ||
            mysoftMappingDefaults?.eArsivPrefix ||
            companySettings.eArsivPrefix ||
            discoveredEDocPrefix ||
            "EAR"
          : nonGenericCandidate(selectedEFaturaPrefix) ||
            nonGenericCandidate(infoPrefix) ||
            nonGenericCandidate(mysoftMappingDefaults?.eFaturaPrefix) ||
            nonGenericCandidate(companySettings.eFaturaPrefix) ||
            nonGenericCandidate(discoveredEDocPrefix) ||
            nonGenericCandidate(companySettings.defaultInvoicePrefix) ||
            selectedEFaturaPrefix ||
            mysoftMappingDefaults?.eFaturaPrefix ||
            companySettings.eFaturaPrefix ||
            discoveredEDocPrefix ||
            companySettings.defaultInvoicePrefix ||
            "GIB");

      const prefix =
        rawPrefix
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 3) || (isEArsiv ? "EAR" : "GIB");

      let infoSeq = 0;
      if (mysoftNumberInfo && (mysoftNumberInfo.eDocumentType === "EARSIVFATURA") === isEArsiv) {
        if (mysoftNumberInfo.prefix?.toUpperCase() === prefix) {
          infoSeq = Number(mysoftNumberInfo.nextSequence) || 0;
        }
      }

      let rowSeq = 0;
      const prefixRow = mysoftMappingDefaults?.prefixes?.find(
        (p) => String(p.prefix || "").trim().toUpperCase() === prefix,
      );
      if (prefixRow && prefixRow.currentNumber !== undefined) {
        rowSeq = (Number(prefixRow.currentNumber) || 0) + 1;
      }

      let savedSeq = 0;
      const savedNextCandidates = isEArsiv
        ? [mysoftMappingDefaults?.eArsivNextNumber, companySettings.eArsivNextNumber]
        : [mysoftMappingDefaults?.eFaturaNextNumber, companySettings.eFaturaNextNumber];
      for (const savedNext of savedNextCandidates) {
        if (!savedNext) continue;
        const match = /^([A-Za-z0-9]{3})(20\d{2})(\d{1,9})$/.exec(savedNext.trim());
        if (
          match &&
          match[1].toUpperCase() === prefix &&
          Number(match[2]) === currentYear
        ) {
          const parsed = parseInt(match[3], 10) || 0;
          if (parsed > savedSeq) savedSeq = parsed;
        }
      }

      let maxInvoiceSeq = 0;
      for (const inv of invoices) {
        if (editingInvoiceId && inv.id === editingInvoiceId) continue;
        if (inv.status === "draft") continue;
        const cleaned = String(inv.invoiceNumber || "")
          .replace(/\s*\(TASLAK\)\s*$/i, "")
          .trim();
        if (cleaned.toUpperCase().startsWith(`${prefix}${currentYear}`)) {
          const tail = cleaned.slice(prefix.length + 4);
          const parsed = parseInt(tail, 10);
          if (!isNaN(parsed) && parsed > maxInvoiceSeq) {
            maxInvoiceSeq = parsed;
          }
        }
      }

      const maxEDocSeq = Math.max(
        eDocMaxSeqByPrefix[prefix] || 0,
        prefix === discoveredEDocPrefix ? discoveredEDocMaxSeq : 0,
      );

      const nextSeq = Math.max(
        1,
        infoSeq,
        rowSeq,
        savedSeq,
        maxInvoiceSeq + 1,
        maxEDocSeq + 1,
      );
      return `${prefix}${currentYear}${String(nextSeq).padStart(9, "0")}`;
    },
    [
      selectedEArsivPrefix,
      selectedEFaturaPrefix,
      mysoftMappingDefaults,
      mysoftNumberInfo,
      companySettings.eArsivPrefix,
      companySettings.eFaturaPrefix,
      companySettings.defaultInvoicePrefix,
      companySettings.eArsivNextNumber,
      companySettings.eFaturaNextNumber,
      issueDate,
      invoices,
      editingInvoiceId,
    ],
  );

  const computeGyrSequentialNumber = useCallback((): string => {
    const currentYear = Number(
      String(issueDate || "").slice(0, 4) || new Date().getFullYear(),
    );
    const prefix = "GYR";
    let maxInvoiceSeq = 0;
    for (const inv of invoices) {
      if (editingInvoiceId && inv.id === editingInvoiceId) continue;
      const cleaned = String(inv.invoiceNumber || "")
        .replace(/\s*\(TASLAK\)\s*$/i, "")
        .trim()
        .toUpperCase();
      if (cleaned.startsWith(`${prefix}${currentYear}`)) {
        const tail = cleaned.slice(prefix.length + 4);
        const parsed = parseInt(tail, 10);
        if (!isNaN(parsed) && parsed > maxInvoiceSeq) {
          maxInvoiceSeq = parsed;
        }
      }
    }
    return `${prefix}${currentYear}${String(maxInvoiceSeq + 1).padStart(9, "0")}`;
  }, [issueDate, invoices, editingInvoiceId]);

  const isCurrentSalesEArsiv =
    mysoftEDocType === "e_arsiv" || invoiceScenario === "EARSIVFATURA";
  const activeEFaturaNextNo = computeMysoftSequentialNumber("e_fatura");
  const activeEArsivNextNo = computeMysoftSequentialNumber("e_arsiv");
  const activeGyrNextNo = computeGyrSequentialNumber();
  const activeMysoftSerialNumber = isCurrentSalesEArsiv
    ? activeEArsivNextNo
    : activeEFaturaNextNo;
  const activeSalesSerialNumber = sendToMysoft
    ? activeMysoftSerialNumber
    : activeGyrNextNo;
  const activeMysoftPrefix = (
    !sendToMysoft
      ? "GYR"
      : isCurrentSalesEArsiv
        ? selectedEArsivPrefix ||
          mysoftMappingDefaults?.eArsivPrefix ||
          companySettings.eArsivPrefix ||
          "EAR"
        : selectedEFaturaPrefix ||
          mysoftMappingDefaults?.eFaturaPrefix ||
          companySettings.eFaturaPrefix ||
          companySettings.defaultInvoicePrefix ||
          "GIB"
  )
    .trim()
    .toUpperCase()
    .slice(0, 3);

  // Automatically sync Fatura Numarası input to Mysoft e-Fatura / e-Arşiv or GYR serial number when cutting a new sales invoice
  useEffect(() => {
    if (
      !editingInvoiceId &&
      invType === "sales" &&
      formDocKind === "invoice" &&
      !isManualInvoiceNumber
    ) {
      setInvoiceNumberInput(activeSalesSerialNumber);
    }
  }, [
    editingInvoiceId,
    invType,
    formDocKind,
    isManualInvoiceNumber,
    activeSalesSerialNumber,
  ]);

  const handleOpenNewInvoiceModal = (
    docKind: "invoice" | "receipt" = "invoice",
    type?: InvoiceType
  ) => {
    setEditingInvoiceId(null);
    setEditingInvoiceNumber(null);
    setInvoiceScenario("TICARIFATURA");
    setMysoftEDocType("e_fatura");
    setInvoiceProfileType("SATIS");
    setPaymentMethod("cari");
    const defaultCashAcc = accounts.find((a) => a.type === "cash") || accounts[0];
    if (defaultCashAcc) {
      setPaymentAccountId(defaultCashAcc.id);
    }
    const defaultBankAcc = accounts.find((a) => a.type === "bank") || accounts[0];
    setPaymentAccountHolderName(
      defaultBankAcc?.accountHolderName ||
        companySettings.defaultBankAccountName ||
        companySettings.companyTitle ||
        companySettings.companyName ||
        ""
    );
    setTaxModalItem(null);
    setTaxModalInitialTab(undefined);
    setFormDocKind(docKind);
    const targetType = type || forcedType || "sales";
    setInvType(targetType);
    setIsManualInvoiceNumber(false);
    if (targetType === "sales" && docKind === "invoice") {
      setInvoiceNumberInput(
        sendToMysoft
          ? computeMysoftSequentialNumber("e_fatura")
          : computeGyrSequentialNumber(),
      );
      refreshMysoftSerialNumbers();
      if (sendToMysoft) {
        void fetchAndApplyNextInvoiceNumber();
      }
    } else {
      setInvoiceNumberInput("");
    }

    // Reset manual customer fields & branch fields
    lastQueriedManualVknRef.current = "";
    const defaultCompanyBranch =
      branches.find((b) => b.isMain && b.status !== "passive") ||
      branches.find((b) => b.status !== "passive") ||
      branches[0];
    setSelectedBranchId(defaultCompanyBranch?.id || "");
    setCustomerMode(initialContactIdForNewInvoice ? "registered" : (contacts.length === 0 ? "manual" : "registered"));
    setManualCustomerName("");
    setManualTaxNumber("");
    setManualTaxOffice("");
    setManualAddress("");
    setManualCity("");
    setManualDistrict("");
    setManualPhone("");
    setManualEmail("");
    setSaveManualAsContact(false);

    const targetContactId = initialContactIdForNewInvoice || contacts[0]?.id || "";
    setContactId(targetContactId);
    const targetContact = contacts.find((c) => c.id === targetContactId);
    setCustomerBranchName(targetContact?.branchName || "");
    setCustomerBranchCode(targetContact?.branchCode || "");
    setVknSearchInput(targetContact?.taxNumber ? targetContact.taxNumber.replace(/\D/g, "") : "");
    setIssueDate(new Date().toISOString().split("T")[0]);
    setDueDate(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]
    );
    setNotes("");
    setHasDifferentDeliveryAddress(false);
    setDeliveryAddress("");
    setItems([
      {
        id: "item_1",
        description:
          targetType === "purchase"
            ? "Ofis & Kırtasiye / Mal & Hizmet Alımı"
            : "",
        quantity: 1,
        unit: "Adet",
        unitPrice: targetType === "purchase" ? 1500 : 5000,
        vatRate: 20,
        totalWithoutVat: targetType === "purchase" ? 1500 : 5000,
        vatAmount: targetType === "purchase" ? 300 : 1000,
        totalWithVat: targetType === "purchase" ? 1800 : 6000,
      },
    ]);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditInvoiceModal = (inv: Invoice) => {
    const cleanInvNo = String(inv.invoiceNumber || "")
      .replace(/\s*\(TASLAK\)\s*$/i, "")
      .trim();
    setEditingInvoiceId(inv.id);
    setEditingInvoiceNumber(cleanInvNo);
    setInvoiceNumberInput(cleanInvNo);
    setIsManualInvoiceNumber(false);
    setInvType(inv.type);
    const nextScenario = inv.invoiceScenario || "TICARIFATURA";
    setInvoiceScenario(nextScenario);
    setMysoftEDocType(
      inv.eDocumentType === "e_arsiv" || nextScenario === "EARSIVFATURA"
        ? "e_arsiv"
        : "e_fatura",
    );
    setInvoiceProfileType(inv.invoiceProfileType || "SATIS");
    setPaymentMethod(inv.paymentMethod || (inv.status === "paid" ? "nakit" : "cari"));
    if (inv.paymentAccountId) {
      setPaymentAccountId(inv.paymentAccountId);
    } else if (accounts[0]?.id) {
      setPaymentAccountId(accounts[0].id);
    }
    if (inv.paymentIban) {
      setPaymentIban(inv.paymentIban);
    } else {
      const acc = accounts.find((a) => a.id === inv.paymentAccountId) || accounts.find((a) => a.type === "bank");
      setPaymentIban(acc?.iban || companySettings.defaultBankIban || companySettings.iban || "");
    }
    const editAcc = accounts.find((a) => a.id === inv.paymentAccountId) || accounts.find((a) => a.type === "bank");
    setPaymentAccountHolderName(
      inv.paymentAccountHolderName ||
        editAcc?.accountHolderName ||
        companySettings.defaultBankAccountName ||
        companySettings.companyTitle ||
        companySettings.companyName ||
        ""
    );
    setTaxModalItem(null);
    setTaxModalInitialTab(undefined);
    setFormDocKind(inv.docKind || "invoice");

    const defaultCompanyBranch =
      effectiveBranchesList.find((b) => b.id === inv.branchId) ||
      effectiveBranchesList.find((b) => b.isMain && b.status !== "passive") ||
      effectiveBranchesList.find((b) => b.status !== "passive") ||
      effectiveBranchesList[0];
    setSelectedBranchId(defaultCompanyBranch?.id || "__MERKEZ__");
    setCustomBranchAddressOverride(inv.branchAddress || "");

    const matchedContact = contacts.find((c) => c.id === inv.contactId);
    const isManual = Boolean(
      inv.isManualCustomer ||
      (!matchedContact && (inv.contactId?.startsWith("manual_") || !inv.contactId))
    );

    if (isManual) {
      setCustomerMode("manual");
      setManualCustomerName(inv.contactName || "");
      setManualTaxNumber(inv.taxNumber || "");
      setManualTaxOffice(inv.taxOffice || "");
      setCustomerBranchName(inv.customerBranchName || "");
      setCustomerBranchCode(inv.customerBranchCode || "");
      setManualAddress(
        formatAddressWithBranch(
          inv.customerAddress || "",
          inv.customerCity || "",
          inv.customerDistrict || "",
          inv.customerBranchName,
          inv.customerBranchCode
        )
      );
      setManualCity(inv.customerCity || "");
      setManualDistrict(inv.customerDistrict || "");
      setManualPhone(inv.customerPhone || "");
      setManualEmail(inv.customerEmail || "");
      setSaveManualAsContact(false);
      setContactId(inv.contactId || `manual_${Date.now()}`);
      setVknSearchInput(inv.taxNumber ? inv.taxNumber.replace(/\D/g, "") : "");
    } else {
      setCustomerMode("registered");
      const editContactId = inv.contactId || contacts[0]?.id || "";
      setContactId(editContactId);
      const editContact = contacts.find((c) => c.id === editContactId);
      setCustomerBranchName(inv.customerBranchName || editContact?.branchName || "");
      setCustomerBranchCode(inv.customerBranchCode || editContact?.branchCode || "");
      setVknSearchInput(
        editContact?.taxNumber
          ? editContact.taxNumber.replace(/\D/g, "")
          : inv.taxNumber
          ? inv.taxNumber.replace(/\D/g, "")
          : ""
      );
      setManualCustomerName("");
      setManualTaxNumber("");
      setManualTaxOffice("");
      setManualAddress("");
      setManualCity("");
      setManualDistrict("");
      setManualPhone("");
      setManualEmail("");
      setSaveManualAsContact(false);
    }
    setIssueDate(inv.issueDate || new Date().toISOString().split("T")[0]);
    setDueDate(inv.dueDate || new Date().toISOString().split("T")[0]);

    let noteText = (inv.notes || "")
      .replace(/Ödemenin süresinde yapılması rica olunur\.?/gi, "")
      .replace(/^(?:Esnaf Sicil No|Esnaf Sicil Numarası|İşletme Merkezi)\s*:.*$/gim, "")
      .trim();
    if (noteText.includes("Teslimat Adresi: ")) {
      const match = noteText.match(/Teslimat Adresi:\s*(.*)/);
      if (match && match[1]) {
        setHasDifferentDeliveryAddress(true);
        setDeliveryAddress(match[1]);
        noteText = noteText.replace(/Teslimat Adresi:\s*.*\n?/, "").trim();
      }
    } else {
      setHasDifferentDeliveryAddress(false);
      setDeliveryAddress("");
    }
    setNotes(noteText);

    if (inv.items && inv.items.length > 0) {
      setItems(
        inv.items.map((item, idx) => ({
          ...item,
          id: item.id || `item_${idx}_${Date.now()}`,
        }))
      );
    } else {
      setItems([
        {
          id: "item_1",
          description: "Hizmet / Ürün Kalemi",
          quantity: 1,
          unit: "Adet",
          unitPrice: inv.subtotal || 0,
          vatRate: 20,
          totalWithoutVat: inv.subtotal || 0,
          vatAmount: inv.totalVat || 0,
          totalWithVat: inv.grandTotal || 0,
        },
      ]);
    }
    detailNav.openEdit(inv, inv.id);
  };

  // Switch invoice profile type and update line items immediately so changes reflect everywhere in real-time
  const handleSelectInvoiceProfile = (profile: InvoiceProfileType) => {
    setInvoiceProfileType(profile);

    setItems((prevItems) => {
      const updatedItems = prevItems.map((item) => {
        if (profile === "SATIS") {
          return {
            ...item,
            vatRate: item.vatRate === 0 ? 20 : item.vatRate,
            withholdingCode: undefined,
            withholdingRateNumerator: undefined,
            withholdingRateDenominator: undefined,
            withholdingRate: undefined,
            withholdingAmount: undefined,
            specialTaxBase: undefined,
            specialTaxBaseCode: undefined,
            costPrice: undefined,
            exemptionCode: undefined,
            exemptionReason: undefined,
          };
        } else if (profile === "TEVKIFAT") {
          return {
            ...item,
            vatRate: item.vatRate === 0 ? 20 : item.vatRate,
            withholdingCode: item.withholdingCode || "601",
            withholdingRateNumerator: item.withholdingRateNumerator || 4,
            withholdingRateDenominator: item.withholdingRateDenominator || 10,
            withholdingRate: (item.withholdingRateNumerator || 4) / (item.withholdingRateDenominator || 10),
            specialTaxBase: undefined,
            specialTaxBaseCode: undefined,
            costPrice: undefined,
            exemptionCode: undefined,
            exemptionReason: undefined,
          };
        } else if (profile === "OZELMATRAH") {
          const lineTotal = item.quantity * item.unitPrice;
          const defaultMargin = item.specialTaxBase !== undefined && item.specialTaxBase !== null
            ? item.specialTaxBase
            : Math.max(0, lineTotal * 0.1);
          return {
            ...item,
            vatRate: item.vatRate === 0 ? 20 : item.vatRate,
            specialTaxBaseCode: item.specialTaxBaseCode || "809",
            specialTaxBase: defaultMargin,
            withholdingCode: undefined,
            withholdingRateNumerator: undefined,
            withholdingRateDenominator: undefined,
            withholdingRate: undefined,
            withholdingAmount: undefined,
            exemptionCode: undefined,
            exemptionReason: undefined,
          };
        } else if (profile === "ISTISNA") {
          return {
            ...item,
            vatRate: 0,
            exemptionCode: item.exemptionCode || "301",
            exemptionReason: item.exemptionReason || "301 - Mal İhracatı",
            withholdingCode: undefined,
            withholdingRateNumerator: undefined,
            withholdingRateDenominator: undefined,
            withholdingRate: undefined,
            withholdingAmount: undefined,
            specialTaxBase: undefined,
            specialTaxBaseCode: undefined,
            costPrice: undefined,
          };
        } else if (profile === "IADE") {
          return {
            ...item,
            vatRate: item.vatRate === 0 ? 20 : item.vatRate,
            withholdingCode: undefined,
            withholdingRateNumerator: undefined,
            withholdingRateDenominator: undefined,
            withholdingRate: undefined,
            withholdingAmount: undefined,
            specialTaxBase: undefined,
            specialTaxBaseCode: undefined,
            costPrice: undefined,
            exemptionCode: undefined,
            exemptionReason: undefined,
          };
        } else if (profile === "IHRACKAYITLI") {
          return {
            ...item,
            vatRate: item.vatRate === 0 ? 20 : item.vatRate,
            exemptionCode: "701",
            exemptionReason: "3065 SK. 11/1-c İhraç Kayıtlı Teslimler",
            withholdingCode: undefined,
            withholdingRateNumerator: undefined,
            withholdingRateDenominator: undefined,
            withholdingRate: undefined,
            withholdingAmount: undefined,
            specialTaxBase: undefined,
            specialTaxBaseCode: undefined,
            costPrice: undefined,
          };
        }
        return item;
      });

      // GİB Yasal Şerhlerini ve Oranlarını Otomatik Fatura Altı Notlarına Senkronize Et
      const legalNotes = generateInvoiceLegalTaxNotes(updatedItems, profile);
      if (legalNotes.length > 0) {
        setNotes((prevNotes) => {
          let n = prevNotes.trim();
          legalNotes.forEach((ln) => {
            if (!n.includes(ln)) {
              n = n ? `${n}\n${ln}` : ln;
            }
          });
          return n;
        });
      }

      return updatedItems;
    });
  };

  // Recalculate invoice totals dynamically using central taxCalculationService
  const calculateTotals = () => {
    return computeInvoiceTotals(items);
  };

  const getDraftInvoice = (): Partial<Invoice> => {
    const contact = contacts.find((c) => c.id === contactId);
    const {
      grossTotal,
      totalDiscount,
      subtotal,
      effectiveTaxableAmount,
      totalVat,
      totalWithholding,
      payableVat,
      grandTotal,
      payableAmount,
      taxItems,
      computedItems,
    } = calculateTotals();
    const isReceipt = formDocKind === "receipt";
    const currentYear = new Date().getFullYear();
    const nextSeq = String(invoices.length + 1).padStart(7, "0");
    const defaultNumber =
      invType === "sales"
        ? isReceipt
          ? `GLF${currentYear}${nextSeq}`
          : activeMysoftSerialNumber
        : isReceipt
          ? `GDF${currentYear}${nextSeq}`
          : `TED${currentYear}${nextSeq}`;
    const customNum = String(invoiceNumberInput || "").trim();

    let finalNotes = String(notes || "")
      .replace(/^(?:Esnaf Sicil No|Esnaf Sicil Numarası|İşletme Merkezi)\s*:.*$/gim, "")
      .trim();
    if (invType === "sales") {
      finalNotes = syncBranchAddressIntoNotes(finalNotes, selectedBranchNoteLine);
    }
    const safeDelivery = String(deliveryAddress || "").trim();
    if (hasDifferentDeliveryAddress && safeDelivery) {
      const deliveryTag = `Teslimat Adresi: ${safeDelivery}`;
      if (!finalNotes.includes(safeDelivery)) {
        finalNotes = finalNotes ? `${finalNotes}\n${deliveryTag}` : deliveryTag;
      }
    }

    // GİB Resmi Vergi Notları & Şerhleri (Tevkifat, Özel Matrah, İstisna, İhraç Kayıtlı)
    const legalNotes = generateInvoiceLegalTaxNotes(computedItems, invoiceProfileType);
    if (legalNotes.length > 0) {
      legalNotes.forEach((ln) => {
        if (!finalNotes.includes(ln)) {
          finalNotes = finalNotes ? `${finalNotes}\n${ln}` : ln;
        }
      });
    }

    const primaryExpenseCategory = computedItems.find((i) => i.expenseCategory)?.expenseCategory || computedItems[0]?.expenseCategory;

    const selectedPaymentAccount = accounts.find((a) => a.id === paymentAccountId);
    const isImmediatePayment =
      paymentMethod === "nakit" ||
      paymentMethod === "kredi_karti" ||
      paymentMethod === "eft_havale";
    const effectiveIban =
      paymentMethod === "eft_havale"
        ? (paymentIban.trim() || selectedPaymentAccount?.iban || companySettings.defaultBankIban || companySettings.iban || "")
        : undefined;
    let draftNotes = finalNotes;
    if (paymentMethod === "eft_havale" && includeIbanInNotes && effectiveIban && !draftNotes.includes(effectiveIban)) {
      const bankNote = `EFT / Havale Banka Bilgisi: ${selectedPaymentAccount?.name ? `${selectedPaymentAccount.name} - ` : ""}IBAN: ${effectiveIban}`;
      draftNotes = draftNotes ? `${draftNotes} | ${bankNote}` : bankNote;
    }

    const effCustBranchName = customerBranchName.trim() || contact?.branchName || undefined;
    const effCustBranchCode = customerBranchCode.trim() || contact?.branchCode || undefined;

    return {
      invoiceNumber: customNum ? `${customNum} (TASLAK)` : `${defaultNumber} (TASLAK)`,
      type: invType,
      invoiceScenario: isCurrentSalesEArsiv ? "EARSIVFATURA" : invoiceScenario,
      invoiceProfileType,
      docKind: forcedType ? formDocKind : "invoice",
      paymentMethod,
      paymentAccountId: isImmediatePayment ? paymentAccountId : undefined,
      paymentAccountName:
        (isImmediatePayment ? selectedPaymentAccount?.name : undefined) ||
        companySettings.defaultBankName ||
        companySettings.bankName ||
        undefined,
      paymentAccountHolderName:
        paymentAccountHolderName.trim() ||
        selectedPaymentAccount?.accountHolderName ||
        companySettings.defaultBankAccountName ||
        companySettings.companyTitle ||
        companySettings.companyName ||
        undefined,
      paymentIban:
        effectiveIban ||
        companySettings.defaultBankIban ||
        companySettings.iban ||
        undefined,
      expenseCategory: invType === "purchase" ? primaryExpenseCategory : undefined,
      branchId: selectedCompanyBranch?.id,
      branchName: selectedCompanyBranch?.name,
      branchCode: selectedCompanyBranch?.code,
      branchAddress: resolvedCompanyBranchAddress || undefined,
      branchCity: selectedCompanyBranch?.address?.city || undefined,
      branchDistrict: selectedCompanyBranch?.address?.district || undefined,
      contactId: customerMode === "manual" ? "manual_draft" : contactId,
      contactName: customerMode === "manual"
        ? (manualCustomerName.trim() || "Münferit Müşteri")
        : (contact?.name || "Cari Seçilmedi"),
      taxNumber: customerMode === "manual"
        ? (manualTaxNumber.trim() || vknSearchInput.trim() || "")
        : (contact?.taxNumber || vknSearchInput.trim() || ""),
      taxOffice: customerMode === "manual" ? manualTaxOffice.trim() : (contact?.taxOffice || ""),
      customerBranchName: effCustBranchName,
      customerBranchCode: effCustBranchCode,
      customerAddress:
        customerMode === "manual"
          ? formatAddressWithBranch(
              manualAddress,
              manualCity,
              manualDistrict,
              effCustBranchName,
              effCustBranchCode
            )
          : formatAddressWithBranch(
              contact?.address || "",
              contact?.city || "",
              contact?.district || "",
              effCustBranchName,
              effCustBranchCode
            ),
      customerCity: customerMode === "manual" ? manualCity.trim() : (contact?.city || ""),
      customerDistrict: customerMode === "manual" ? manualDistrict.trim() : (contact?.district || ""),
      customerPhone: customerMode === "manual" ? manualPhone.trim() : (contact?.phone || ""),
      customerEmail: customerMode === "manual" ? manualEmail.trim() : (contact?.email || ""),
      isManualCustomer: customerMode === "manual",
      issueDate,
      dueDate,
      items: computedItems,
      grossTotal,
      totalDiscount,
      subtotal,
      effectiveTaxableAmount,
      totalVat,
      totalWithholding,
      payableVat,
      grandTotal,
      payableAmount,
      taxItems,
      paidAmount: isImmediatePayment ? payableAmount : 0,
      remainingAmount: isImmediatePayment ? 0 : payableAmount,
      status: "draft",
      currency: "TRY",
      notes: draftNotes,
      eArsivSignatureUrl: isCurrentSalesEArsiv
        ? companySettings.invoiceDesign?.signatureImageUrl || companySettings.stampUrl
        : undefined,
      eArsivStampUrl: isCurrentSalesEArsiv ? companySettings.stampUrl : undefined,
      signerName: isCurrentSalesEArsiv ? companySettings.invoiceDesign?.signerName : undefined,
      signerTitle: isCurrentSalesEArsiv ? companySettings.invoiceDesign?.signerTitle : undefined,
      signedAt: isCurrentSalesEArsiv ? new Date().toISOString() : undefined,
    };
  };

  const buildMysoftPreviewPayload = useCallback((): Record<string, unknown> | null => {
    const isManual = customerMode === "manual";
    const contact = contacts.find((c) => c.id === contactId);
    if (!isManual && !contact) return null;
    if (isManual && !manualCustomerName.trim()) return null;

    const effCustBranchName = customerBranchName.trim() || contact?.branchName || undefined;
    const effCustBranchCode = customerBranchCode.trim() || contact?.branchCode || undefined;

    const effectiveContact: Contact = isManual
      ? {
          id: "manual_preview",
          name: manualCustomerName.trim(),
          taxNumber: manualTaxNumber.trim() || vknSearchInput.trim() || undefined,
          taxOffice: manualTaxOffice.trim() || undefined,
          branchName: effCustBranchName,
          branchCode: effCustBranchCode,
          address:
            formatAddressWithBranch(
              manualAddress,
              manualCity,
              manualDistrict,
              effCustBranchName,
              effCustBranchCode
            ) || undefined,
          city: manualCity.trim() || undefined,
          district: manualDistrict.trim() || undefined,
          phone: manualPhone.trim() || undefined,
          email: manualEmail.trim() || undefined,
          contactType: invType === "sales" ? "customer" : "vendor",
          balance: 0,
          balanceType: "balanced",
          createdAt: new Date().toISOString().split("T")[0],
        }
      : {
          ...contact!,
          branchName: effCustBranchName,
          branchCode: effCustBranchCode,
          address:
            formatAddressWithBranch(
              contact!.address,
              contact!.city,
              contact!.district,
              effCustBranchName,
              effCustBranchCode
            ) || contact!.address,
        };

    const { subtotal, totalVat, grandTotal, computedItems } = calculateTotals();
    if (!computedItems.some((item) => String(item.description || "").trim())) {
      return null;
    }
    const draft = getDraftInvoice();
    const invoiceForPayload = {
      ...draft,
      id: `preview_${Date.now()}`,
      type: invType,
      docKind: formDocKind,
      issueDate,
      dueDate,
      items: computedItems,
      branchId: selectedCompanyBranch?.id,
      branchName: selectedCompanyBranch?.name,
      branchCode: selectedCompanyBranch?.code,
      branchAddress: resolvedCompanyBranchAddress || undefined,
      contactId: effectiveContact.id,
      contactName: effectiveContact.name,
      taxNumber: effectiveContact.taxNumber || "",
      taxOffice: effectiveContact.taxOffice || "",
      customerBranchName: effCustBranchName,
      customerBranchCode: effCustBranchCode,
      customerAddress: effectiveContact.address,
      customerCity: effectiveContact.city,
      customerDistrict: effectiveContact.district,
      customerPhone: effectiveContact.phone,
      customerEmail: effectiveContact.email,
      isManualCustomer: isManual,
      subtotal,
      totalVat,
      grandTotal,
      status: "draft" as InvoiceStatus,
      currency: "TRY",
      paidAmount: 0,
      remainingAmount: grandTotal,
      createdAt: new Date().toISOString().split("T")[0],
    } as Invoice;
    const effectiveTenant =
      mysoftTenantVkn ||
      readStoredMysoftTenantVkn() ||
      normalizeMysoftTenantIdentifier(companySettings.tenantIdentifierNumber) ||
      normalizeMysoftTenantIdentifier(companySettings.taxNumber) ||
      normalizeMysoftTenantIdentifier(companySettings.vknTckn) ||
      normalizeMysoftTenantIdentifier(companySettings.mysoftCredentials?.tenantIdentifierNumber);

    return buildMysoftInvoiceOutboxPayload({
      invoice: invoiceForPayload,
      contact: effectiveContact,
      company: companySettings,
      eDocumentType: isCurrentSalesEArsiv ? "e_arsiv" : "e_fatura",
      profile: isCurrentSalesEArsiv ? "EARSIVFATURA" : invoiceScenario,
      prefix: activeMysoftPrefix,
      docNo: invoiceNumberInput,
      isSaveAsDraft: true,
      tenantIdentifierNumber: effectiveTenant,
      pkAlias: isCurrentSalesEArsiv ? undefined : recipientStatus?.pkAlias,
    });
  }, [
    customerMode,
    manualCustomerName,
    manualTaxNumber,
    manualTaxOffice,
    manualAddress,
    manualCity,
    manualDistrict,
    manualPhone,
    manualEmail,
    vknSearchInput,
    contactId,
    contacts,
    companySettings,
    mysoftTenantVkn,
    invoiceNumberInput,
    recipientStatus,
    dueDate,
    formDocKind,
    invType,
    issueDate,
    calculateTotals,
    getDraftInvoice,
    mysoftEDocType,
    items,
    notes,
    hasDifferentDeliveryAddress,
    deliveryAddress,
    invoices.length,
  ]);

  const showCreatePreviewPanel =
    formDocKind === "invoice" && (forcedType === "sales" || invType === "sales");

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

  const handleAddExpenseCategoryItem = (cat: string) => {
    const isFirstEmpty =
      items.length === 1 &&
      (!items[0].description ||
        items[0].description === "Yazılım Danışmanlık ve Sistem Destek Hizmeti" ||
        (EXPENSE_CATEGORIES as readonly string[]).includes(items[0].description));

    if (isFirstEmpty) {
      setItems([
        {
          id: items[0].id,
          expenseCategory: cat,
          description: cat,
          quantity: items[0].quantity || 1,
          unit: "Adet",
          unitPrice: items[0].unitPrice || 0,
          vatRate: 20,
          totalWithoutVat: 0,
          vatAmount: 0,
          totalWithVat: 0,
        },
      ]);
    } else {
      setItems([
        ...items,
        {
          id: "item_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
          expenseCategory: cat,
          description: cat,
          quantity: 1,
          unit: "Adet",
          unitPrice: 0,
          vatRate: 20,
          totalWithoutVat: 0,
          vatAmount: 0,
          totalWithVat: 0,
        },
      ]);
    }
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

          const qty = Number(updated.quantity) || 0;
          const price = Number(updated.unitPrice) || 0;
          const gross = qty * price;

          if (field === "discountAmount") {
            const rawVal = parseFloat(value);
            const discAmt = isNaN(rawVal) ? 0 : Math.max(0, rawVal);
            updated.discountAmount = discAmt;
            updated.discountRate = gross > 0 ? parseFloat(((discAmt / gross) * 100).toFixed(2)) : 0;
          } else if (field === "discountRate") {
            const rawVal = parseFloat(value);
            const discRate = isNaN(rawVal) ? 0 : Math.max(0, Math.min(100, rawVal));
            updated.discountRate = discRate;
            updated.discountAmount = parseFloat(((gross * discRate) / 100).toFixed(2));
          } else if (field === "quantity" || field === "unitPrice" || field === "productId") {
            if (updated.discountRate && updated.discountRate > 0) {
              updated.discountAmount = parseFloat(((gross * updated.discountRate) / 100).toFixed(2));
            } else if (updated.discountAmount && updated.discountAmount > 0) {
              if (updated.discountAmount > gross) {
                updated.discountAmount = gross;
              }
              updated.discountRate = gross > 0 ? parseFloat(((updated.discountAmount / gross) * 100).toFixed(2)) : 0;
            }
          }

          const disc = Number(updated.discountAmount) || 0;
          const net = Math.max(0, gross - disc);
          updated.totalWithoutVat = net;
          updated.vatAmount = (net * (Number(updated.vatRate) || 0)) / 100;
          updated.totalWithVat = net + updated.vatAmount;

          return updated;
        }
        return item;
      })
    );
  };

  const handleSaveInvoice = async (e?: React.FormEvent, saveAsDraft: boolean = false) => {
    if (e) e.preventDefault();
    const isManual = customerMode === "manual";
    const contact = contacts.find((c) => c.id === contactId);

    if (!saveAsDraft) {
      if (isManual) {
        if (!manualCustomerName.trim()) {
          alert("Lütfen müşteri adını veya ticari ünvanını giriniz.");
          return;
        }
      } else {
        if (!contact) {
          alert("Lütfen bir cari hesap seçiniz veya 'Elle Müşteri Bilgisi Gir' seçeneğini kullanınız.");
          return;
        }
      }
    }

    if (isSavingMysoft) return;

    const existingInvoice = editingInvoiceId ? invoices.find((i) => i.id === editingInvoiceId) : null;
    const wasDraft = existingInvoice?.status === "draft";

    let finalContactId = contactId;
    const effectiveContactName = isManual
      ? manualCustomerName.trim() || "Taslak Müşteri"
      : contact?.name || "Cari Seçilmedi";
    const effectiveTaxNumber = isManual
      ? (manualTaxNumber.trim() || vknSearchInput.trim() || "")
      : (contact?.taxNumber || vknSearchInput.trim() || "");
    const effectiveTaxOffice = isManual ? manualTaxOffice.trim() : (contact?.taxOffice || "");
    const effectiveCity = isManual ? manualCity.trim() : (contact?.city || "");
    const effectiveDistrict = isManual ? manualDistrict.trim() : (contact?.district || "");
    const effectiveCustomerBranchName =
      customerBranchName.trim() || (!isManual ? contact?.branchName || "" : "");
    const effectiveCustomerBranchCode =
      customerBranchCode.trim() || (!isManual ? contact?.branchCode || "" : "");
    const rawContactOpenAddress = !isManual
      ? contact?.address ||
        [contact?.neighborhood, contact?.street, contact?.buildingNo, contact?.doorNo]
          .filter(Boolean)
          .join(" ")
      : manualAddress;
    const effectiveAddress = isManual
      ? formatAddressWithBranch(
          manualAddress,
          effectiveCity,
          effectiveDistrict,
          effectiveCustomerBranchName,
          effectiveCustomerBranchCode
        )
      : formatAddressWithBranch(
          rawContactOpenAddress,
          effectiveCity,
          effectiveDistrict,
          effectiveCustomerBranchName,
          effectiveCustomerBranchCode
        );
    const effectivePhone = isManual ? manualPhone.trim() : (contact?.phone || "");
    const effectiveEmail = isManual ? manualEmail.trim() : (contact?.email || "");

    let effectiveContactObj: Contact;

    if (isManual) {
      if (saveManualAsContact && manualCustomerName.trim()) {
        const newContact: Contact = {
          id: "cnt_" + Date.now(),
          name: effectiveContactName,
          taxNumber: effectiveTaxNumber || undefined,
          taxOffice: effectiveTaxOffice || undefined,
          branchName: effectiveCustomerBranchName || undefined,
          branchCode: effectiveCustomerBranchCode || undefined,
          address: effectiveAddress || undefined,
          city: effectiveCity || undefined,
          district: effectiveDistrict || undefined,
          phone: effectivePhone || undefined,
          email: effectiveEmail || undefined,
          contactType: invType === "sales" ? "customer" : "vendor",
          balance: 0,
          balanceType: "balanced",
          createdAt: new Date().toISOString().split("T")[0],
        };
        if (onAddContact) {
          onAddContact(newContact);
        } else {
          contacts.push(newContact);
        }
        finalContactId = newContact.id;
        effectiveContactObj = newContact;
      } else {
        finalContactId = existingInvoice?.contactId?.startsWith("manual_")
          ? existingInvoice.contactId
          : `manual_${Date.now()}`;
        effectiveContactObj = {
          id: finalContactId,
          name: effectiveContactName,
          taxNumber: effectiveTaxNumber || undefined,
          taxOffice: effectiveTaxOffice || undefined,
          branchName: effectiveCustomerBranchName || undefined,
          branchCode: effectiveCustomerBranchCode || undefined,
          address: effectiveAddress || undefined,
          city: effectiveCity || undefined,
          district: effectiveDistrict || undefined,
          phone: effectivePhone || undefined,
          email: effectiveEmail || undefined,
          contactType: invType === "sales" ? "customer" : "vendor",
          balance: 0,
          balanceType: "balanced",
          createdAt: new Date().toISOString().split("T")[0],
        };
      }
    } else if (contact) {
      effectiveContactObj = {
        ...contact,
        branchName: effectiveCustomerBranchName || contact.branchName,
        branchCode: effectiveCustomerBranchCode || contact.branchCode,
        address: effectiveAddress || contact.address,
      };
    } else {
      finalContactId = existingInvoice?.contactId || `manual_${Date.now()}`;
      effectiveContactObj = {
        id: finalContactId,
        name: effectiveContactName,
        taxNumber: effectiveTaxNumber || undefined,
        branchName: effectiveCustomerBranchName || undefined,
        branchCode: effectiveCustomerBranchCode || undefined,
        address: effectiveAddress || undefined,
        contactType: invType === "sales" ? "customer" : "vendor",
        balance: 0,
        balanceType: "balanced",
        createdAt: new Date().toISOString().split("T")[0],
      };
    }

    const {
      grossTotal,
      totalDiscount,
      subtotal,
      effectiveTaxableAmount,
      totalVat,
      totalWithholding,
      payableVat,
      grandTotal,
      payableAmount,
      taxItems,
      computedItems,
    } = calculateTotals();

    const isReceipt = formDocKind === "receipt";
    const currentYear = new Date().getFullYear();
    const nextSeq = String(invoices.length + 1).padStart(7, "0");
    const defaultNumber =
      invType === "sales"
        ? isReceipt
          ? `GLF${currentYear}${nextSeq}`
          : sendToMysoft
            ? activeMysoftSerialNumber
            : activeGyrNextNo
        : isReceipt
          ? `GDF${currentYear}${nextSeq}`
          : `TED${currentYear}${nextSeq}`;
    const cleanedInputNo = String(invoiceNumberInput || "")
      .replace(/\s*\(TASLAK\)\s*$/i, "")
      .trim();

    let resolvedInputNo = cleanedInputNo;
    if (invType === "sales" && !isReceipt) {
      if (!sendToMysoft) {
        // Resmi e-fatura / e-arşiv olarak kes (Mysoft) seçilmediyse GYR ön eki ile kaydet
        if (!resolvedInputNo || !isManualInvoiceNumber) {
          resolvedInputNo = activeGyrNextNo;
        } else if (!resolvedInputNo.toUpperCase().startsWith("GYR")) {
          if (/^[A-Za-z0-9]{3}20\d{2}\d+$/.test(resolvedInputNo)) {
            resolvedInputNo = `GYR${resolvedInputNo.slice(3)}`;
          } else {
            resolvedInputNo = `GYR-${resolvedInputNo}`;
          }
        }
      } else {
        // Resmi e-Fatura veya e-Arşiv seçildiyse ardışık numara ver
        if (!resolvedInputNo || resolvedInputNo.toUpperCase().startsWith("GYR")) {
          resolvedInputNo = activeMysoftSerialNumber;
        }
      }
    }

    const effectiveInvoiceNumber =
      resolvedInputNo ||
      String(existingInvoice?.invoiceNumber || "")
        .replace(/\s*\(TASLAK\)\s*$/i, "")
        .trim() ||
      defaultNumber;

    let finalNotes = String(notes || "")
      .replace(/^(?:Esnaf Sicil No|Esnaf Sicil Numarası|İşletme Merkezi)\s*:.*$/gim, "")
      .trim();
    if (invType === "sales") {
      finalNotes = syncBranchAddressIntoNotes(finalNotes, selectedBranchNoteLine);
    }
    const safeDelivery = String(deliveryAddress || "").trim();
    if (hasDifferentDeliveryAddress && safeDelivery) {
      const deliveryTag = `Teslimat Adresi: ${safeDelivery}`;
      if (!finalNotes.includes(safeDelivery)) {
        finalNotes = finalNotes ? `${finalNotes}\n${deliveryTag}` : deliveryTag;
      }
    }

    // GİB Resmi Vergi Notları & Şerhleri (Tevkifat, Özel Matrah, İstisna, İhraç Kayıtlı)
    const legalNotes = generateInvoiceLegalTaxNotes(computedItems, invoiceProfileType);
    if (legalNotes.length > 0) {
      legalNotes.forEach((ln) => {
        if (!finalNotes.includes(ln)) {
          finalNotes = finalNotes ? `${finalNotes}\n${ln}` : ln;
        }
      });
    }

    const primaryExpenseCategory =
      computedItems.find((i) => i.expenseCategory)?.expenseCategory || computedItems[0]?.expenseCategory;
    const shouldSendMysoft =
      !saveAsDraft &&
      sendToMysoft &&
      invType === "sales" &&
      formDocKind === "invoice" &&
      (!editingInvoiceId || wasDraft) &&
      !existingInvoice?.eDocumentEttn;

    const selectedPaymentAccount =
      accounts.find((a) => a.id === paymentAccountId) || accounts[0];
    const isImmediatePayment =
      paymentMethod === "nakit" ||
      paymentMethod === "kredi_karti" ||
      paymentMethod === "eft_havale";
    const effectiveIban =
      paymentMethod === "eft_havale"
        ? (paymentIban.trim() || selectedPaymentAccount?.iban || companySettings.defaultBankIban || companySettings.iban || "")
        : undefined;
    const effectiveAccountHolder =
      paymentMethod === "eft_havale"
        ? (paymentAccountHolderName.trim() ||
            selectedPaymentAccount?.accountHolderName ||
            companySettings.defaultBankAccountName ||
            companySettings.companyTitle ||
            companySettings.companyName ||
            "")
        : undefined;
    if (paymentMethod === "eft_havale" && includeIbanInNotes && effectiveIban && !finalNotes.includes(effectiveIban)) {
      const holderPart = effectiveAccountHolder ? `Hesap Adı: ${effectiveAccountHolder} - ` : "";
      const bankPart = selectedPaymentAccount?.name ? `${selectedPaymentAccount.name} - ` : "";
      const bankNote = `EFT / Havale Banka Bilgisi: ${holderPart}${bankPart}IBAN: ${effectiveIban}`;
      finalNotes = finalNotes ? `${finalNotes} | ${bankNote}` : bankNote;
    }

    let baseInvoice: Invoice = {
      id: editingInvoiceId || "inv_" + Date.now(),
      invoiceNumber: effectiveInvoiceNumber,
      type: invType,
      invoiceScenario:
        invType === "sales" && formDocKind === "invoice" && isCurrentSalesEArsiv
          ? "EARSIVFATURA"
          : invoiceScenario,
      invoiceProfileType,
      docKind: editingInvoiceId ? formDocKind : forcedType ? formDocKind : "invoice",
      paymentMethod,
      paymentAccountId: isImmediatePayment ? selectedPaymentAccount?.id : undefined,
      paymentAccountName:
        (isImmediatePayment ? selectedPaymentAccount?.name : undefined) ||
        companySettings.defaultBankName ||
        companySettings.bankName ||
        undefined,
      paymentAccountHolderName:
        effectiveAccountHolder ||
        companySettings.defaultBankAccountName ||
        companySettings.companyTitle ||
        companySettings.companyName ||
        undefined,
      paymentIban:
        effectiveIban ||
        companySettings.defaultBankIban ||
        companySettings.iban ||
        undefined,
      expenseCategory: invType === "purchase" ? primaryExpenseCategory : undefined,
      branchId: selectedCompanyBranch?.id,
      branchName: selectedCompanyBranch?.name,
      branchCode: selectedCompanyBranch?.code,
      branchAddress: resolvedCompanyBranchAddress || undefined,
      branchCity: selectedCompanyBranch?.address?.city || undefined,
      branchDistrict: selectedCompanyBranch?.address?.district || undefined,
      contactId: finalContactId,
      contactName: effectiveContactName,
      taxNumber: effectiveTaxNumber || undefined,
      taxOffice: effectiveTaxOffice || undefined,
      customerBranchName: effectiveCustomerBranchName || undefined,
      customerBranchCode: effectiveCustomerBranchCode || undefined,
      customerAddress: effectiveAddress || undefined,
      customerCity: effectiveCity || undefined,
      customerDistrict: effectiveDistrict || undefined,
      customerPhone: effectivePhone || undefined,
      customerEmail: effectiveEmail || undefined,
      isManualCustomer: isManual && !saveManualAsContact,
      issueDate,
      dueDate,
      items: computedItems,
      grossTotal,
      totalDiscount,
      subtotal,
      effectiveTaxableAmount,
      totalVat,
      totalWithholding,
      payableVat,
      taxItems,
      grandTotal,
      payableAmount,
      paidAmount: 0,
      remainingAmount: payableAmount,
      status: saveAsDraft ? "draft" : "sent",
      currency: existingInvoice?.currency || "TRY",
      notes: finalNotes,
      createdAt: existingInvoice?.createdAt || new Date().toISOString().split("T")[0],
      eDocumentType:
        invType === "sales" && formDocKind === "invoice"
          ? sendToMysoft
            ? isCurrentSalesEArsiv
              ? "e_arsiv"
              : "e_fatura"
            : undefined
          : existingInvoice?.eDocumentType,
      eDocumentEttn: existingInvoice?.eDocumentEttn,
      eArsivSignatureUrl:
        invType === "sales" && isCurrentSalesEArsiv
          ? existingInvoice?.eArsivSignatureUrl ||
            companySettings.invoiceDesign?.signatureImageUrl ||
            companySettings.stampUrl
          : existingInvoice?.eArsivSignatureUrl,
      eArsivStampUrl:
        invType === "sales" && isCurrentSalesEArsiv
          ? existingInvoice?.eArsivStampUrl || companySettings.stampUrl
          : existingInvoice?.eArsivStampUrl,
      signerName:
        invType === "sales" && isCurrentSalesEArsiv
          ? existingInvoice?.signerName || companySettings.invoiceDesign?.signerName
          : existingInvoice?.signerName,
      signerTitle:
        invType === "sales" && isCurrentSalesEArsiv
          ? existingInvoice?.signerTitle || companySettings.invoiceDesign?.signerTitle
          : existingInvoice?.signerTitle,
      signedAt:
        invType === "sales" && isCurrentSalesEArsiv
          ? existingInvoice?.signedAt || new Date().toISOString()
          : existingInvoice?.signedAt,
    };

    if (saveAsDraft) {
      if (editingInvoiceId) {
        onUpdateInvoice(baseInvoice);
      } else {
        onAddInvoice(baseInvoice);
      }
      if (forcedType) {
        setDocSubTab(formDocKind === "receipt" ? "receipts" : "invoices");
      }
      setEditingInvoiceId(null);
      setEditingInvoiceNumber(null);
      setHasDifferentDeliveryAddress(false);
      setDeliveryAddress("");
      setIsCreateModalOpen(false);
      return;
    }

    if (shouldSendMysoft) {
      setMysoftSaveError(null);
      setMysoftSaveNotice(null);

      let effectiveTenant = mysoftTenantVkn;
      if (!effectiveTenant) {
        effectiveTenant =
          normalizeMysoftTenantIdentifier(companySettings.tenantIdentifierNumber) ||
          normalizeMysoftTenantIdentifier(companySettings.taxNumber) ||
          normalizeMysoftTenantIdentifier(companySettings.vknTckn) ||
          normalizeMysoftTenantIdentifier(companySettings.mysoftCredentials?.tenantIdentifierNumber) ||
          readStoredMysoftTenantVkn();
        if (effectiveTenant) {
          setMysoftTenantVkn(effectiveTenant);
        }
      }
      if (!effectiveTenant) {
        try {
          const tenantRows = await listMysoftTenants();
          if (tenantRows.length > 0) {
            effectiveTenant = tenantRows[0].taxNumber;
            setMysoftTenantVkn(effectiveTenant);
          }
        } catch {
          // ignore
        }
      }

      if (effectiveTenant) {
        setIsSavingMysoft(true);
        setMysoftValidationIssues([]);
        setMysoftDiagnosticLog(null);
        try {
          const effectiveEDocType = isCurrentSalesEArsiv ? "e_arsiv" : "e_fatura";
          const payload = buildMysoftInvoiceOutboxPayload({
            invoice: baseInvoice,
            contact: effectiveContactObj,
            company: companySettings,
            eDocumentType: effectiveEDocType,
            profile: isCurrentSalesEArsiv ? "EARSIVFATURA" : invoiceScenario,
            prefix: activeMysoftPrefix,
            docNo: baseInvoice.invoiceNumber,
            isSaveAsDraft: false,
            tenantIdentifierNumber: effectiveTenant,
            pkAlias: isCurrentSalesEArsiv ? undefined : recipientStatus?.pkAlias,
          });
          const preCheck = validateMysoftInvoiceOutboxPayload(payload, {
            requireTenantIdentifier: true,
            autoRepair: true,
          });
          if (preCheck.valid) {
            const result = await sendMysoftOutgoingInvoice(preCheck.sanitizedPayload);
            const outbox = extractMysoftOutboxResult(result);
            if (outbox.invoiceETTN) {
              baseInvoice = {
                ...baseInvoice,
                eDocumentEttn: outbox.invoiceETTN,
                invoiceNumber: outbox.docNo || baseInvoice.invoiceNumber,
                eDocumentType: effectiveEDocType,
              };
            }
            setMysoftSaveNotice(
              outbox.invoiceETTN
                ? `Mysoft'a başarıyla iletildi. Belge No: ${baseInvoice.invoiceNumber} (ETTN: ${outbox.invoiceETTN})`
                : `Fatura Mysoft giden kutusuna iletildi (Belge No: ${baseInvoice.invoiceNumber}).`,
            );
          }
        } catch {
          // Mysoft uzaktan gönderim yapılamasa bile yerel faturayı ardışık numarayla kaydet ve Giden e-Faturalara aktar
        } finally {
          setIsSavingMysoft(false);
        }
      }
    }

    // Advance Mysoft e-Fatura / e-Arşiv sequential invoice counter after cutting an official sales invoice (new or finalized draft)
    if (
      invType === "sales" &&
      formDocKind === "invoice" &&
      sendToMysoft &&
      (!editingInvoiceId || wasDraft)
    ) {
      const issuedNo = String(baseInvoice.invoiceNumber || "").trim();
      const match = /^([A-Za-z0-9]{3})(20\d{2})(\d{1,9})$/.exec(issuedNo);
      if (match) {
        const usedPrefix = match[1].toUpperCase();
        const usedYear = Number(match[2]);
        const usedSeq = parseInt(match[3], 10);
        if (!isNaN(usedSeq) && usedPrefix !== "GYR") {
          const nextFormatted = `${usedPrefix}${usedYear}${String(usedSeq + 1).padStart(9, "0")}`;
          setMysoftMappingDefaults((prev) => {
            const base = prev || {
              vknTckn: mysoftTenantVkn || companySettings.tenantIdentifierNumber || "",
              eFaturaPrefix: selectedEFaturaPrefix || "GIB",
              eFaturaNextNumber: activeEFaturaNextNo,
              eFaturaSequence: 1,
              eArsivPrefix: selectedEArsivPrefix || "EAR",
              eArsivNextNumber: activeEArsivNextNo,
              eArsivSequence: 1,
              prefixes: [],
            };
            const updatedPrefixes = (base.prefixes || []).map((p) =>
              String(p.prefix || "").toUpperCase() === usedPrefix
                ? { ...p, currentNumber: usedSeq, nextNumber: nextFormatted }
                : p,
            );
            return isCurrentSalesEArsiv
              ? {
                  ...base,
                  eArsivPrefix: usedPrefix,
                  eArsivLastNumber: issuedNo,
                  eArsivNextNumber: nextFormatted,
                  eArsivSequence: usedSeq + 1,
                  prefixes: updatedPrefixes,
                }
              : {
                  ...base,
                  eFaturaPrefix: usedPrefix,
                  eFaturaLastNumber: issuedNo,
                  eFaturaNextNumber: nextFormatted,
                  eFaturaSequence: usedSeq + 1,
                  prefixes: updatedPrefixes,
                };
          });

          try {
            const cleanVkn = (
              mysoftTenantVkn ||
              companySettings.tenantIdentifierNumber ||
              companySettings.taxNumber ||
              ""
            ).replace(/\D/g, "");
            const compList = getCompaniesList();
            const matchedComp = compList.find(
              (c) =>
                c.id === companySettings.id ||
                (cleanVkn &&
                  ((c.tenantIdentifierNumber &&
                    c.tenantIdentifierNumber.replace(/\D/g, "") === cleanVkn) ||
                    (c.vkn && c.vkn.replace(/\D/g, "") === cleanVkn) ||
                    (c.tckn && c.tckn.replace(/\D/g, "") === cleanVkn))),
            );
            if (matchedComp) {
              updateCompanyItem(
                isCurrentSalesEArsiv
                  ? {
                      ...matchedComp,
                      eArsivPrefix: usedPrefix,
                      eArsivNextNumber: nextFormatted,
                    }
                  : {
                      ...matchedComp,
                      eFaturaPrefix: usedPrefix,
                      eFaturaNextNumber: nextFormatted,
                      defaultInvoicePrefix: usedPrefix,
                    },
              );
            }
          } catch {}
        }
      }
    }

    if (editingInvoiceId) {
      const wasUnpaid = wasDraft || (existingInvoice?.paidAmount || 0) <= 0;
      const paid =
        isImmediatePayment && wasUnpaid && !selectedPaymentAccount
          ? payableAmount
          : wasDraft
          ? 0
          : existingInvoice?.paidAmount || 0;
      const remaining = Math.max(0, payableAmount - paid);
      let nextStatus: InvoiceStatus =
        existingInvoice?.status && existingInvoice.status !== "draft"
          ? existingInvoice.status
          : "sent";
      if (nextStatus !== "cancelled") {
        if (remaining <= 0) {
          nextStatus = "paid";
        } else if (paid > 0) {
          nextStatus = "partial";
        } else {
          nextStatus = "sent";
        }
      }

      const updatedInvoice: Invoice = {
        ...baseInvoice,
        paidAmount: paid,
        remainingAmount: remaining,
        status: nextStatus,
      };

      const targetPayAcc = selectedPaymentAccount || accounts[0];
      onUpdateInvoice(updatedInvoice);
      if (isImmediatePayment && wasUnpaid && targetPayAcc && payableAmount > 0) {
        onAddTransactionFromInvoice(updatedInvoice, targetPayAcc.id, payableAmount);
      }
      setEditingInvoiceId(null);
      setEditingInvoiceNumber(null);
      setHasDifferentDeliveryAddress(false);
      setDeliveryAddress("");
      setIsCreateModalOpen(false);
      return;
    }

    const targetPayAcc = selectedPaymentAccount || accounts[0];
    const newInvoice: Invoice = {
      ...baseInvoice,
      paidAmount: 0,
      remainingAmount: payableAmount,
      status: "sent",
    };

    onAddInvoice(newInvoice);
    if (isImmediatePayment && targetPayAcc && payableAmount > 0) {
      onAddTransactionFromInvoice(newInvoice, targetPayAcc.id, payableAmount);
    }
    if (forcedType) {
      setDocSubTab(formDocKind === "receipt" ? "receipts" : "invoices");
    }
    setHasDifferentDeliveryAddress(false);
    setDeliveryAddress("");
    setIsCreateModalOpen(false);
  };

  const handleSaveDraftClick = () => {
    void handleSaveInvoice(undefined, true);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInvoice || paymentAmount <= 0) return;

    onAddTransactionFromInvoice(paymentModalInvoice, selectedAccountId, paymentAmount);
    setPaymentModalInvoice(null);
  };

  const handleSaveInvoiceDirectlyFromAi = (
    newInvoice: Invoice,
    paymentInfo?: { accountId: string; paidAmount: number; paymentMethod: string }
  ) => {
    // If contact doesn't exist, create it locally
    const existingContact = contacts.find((c) => c.id === newInvoice.contactId);
    if (!existingContact && newInvoice.contactName) {
      const newContact: Contact = {
        id: newInvoice.contactId,
        name: newInvoice.contactName,
        taxNumber: newInvoice.taxNumber || undefined,
        contactType: "vendor",
        balance: 0,
        balanceType: "balanced",
        createdAt: new Date().toISOString().split("T")[0],
      };
      contacts.push(newContact);
    }

    onAddInvoice(newInvoice);

    if (paymentInfo && paymentInfo.paidAmount > 0) {
      onAddTransactionFromInvoice(newInvoice, paymentInfo.accountId, paymentInfo.paidAmount);
    }
  };

  const handleApplyAiDataToForm = (data: ExtractedExpenseData, matchedContactId?: string) => {
    setInvType("purchase");
    setFormDocKind(data.docType === "Fatura" ? "invoice" : "receipt");
    if (data.invoiceNumber) {
      setInvoiceNumberInput(data.invoiceNumber);
    } else {
      const nextSeq = String(invoices.length + 1).padStart(7, "0");
      setInvoiceNumberInput(`TED2026${nextSeq}`);
    }

    if (matchedContactId) {
      setContactId(matchedContactId);
    } else if (data.companyTitle) {
      const createdContact: Contact = {
        id: "cnt_ocr_" + Date.now(),
        name: String(data.companyTitle || "Cari").trim(),
        taxNumber: String(data.taxNumber || "").trim() || undefined,
        contactType: "vendor",
        balance: 0,
        balanceType: "balanced",
        createdAt: new Date().toISOString().split("T")[0],
      };
      contacts.push(createdContact);
      setContactId(createdContact.id);
    }

    if (data.issueDate) {
      setIssueDate(data.issueDate);
      setDueDate(data.issueDate);
    }

    if (data.notes) {
      setNotes(data.notes);
    }

    const subtotal = data.subtotal || 0;
    const vatRate = data.vatRate || 20;
    const vatAmount = data.vatAmount || (subtotal * vatRate) / 100;
    const grandTotal = data.grandTotal || subtotal + vatAmount;
    const expenseCategory = data.expenseCategory || "Yemek ve ulaşım";

    setItems([
      {
        id: "item_ocr_" + Date.now(),
        description: `${data.companyTitle || "Gider"} - ${expenseCategory}`,
        expenseCategory: expenseCategory,
        quantity: 1,
        unit: "Adet",
        unitPrice: subtotal,
        vatRate: vatRate,
        totalWithoutVat: subtotal,
        vatAmount: vatAmount,
        totalWithVat: grandTotal,
      },
    ]);

    setIsCreateModalOpen(true);
  };

  // Years memo
  const availableYears = React.useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(new Date().getFullYear());
    invoices.forEach((inv) => {
      const { year } = getDateYearAndMonth(inv.issueDate || inv.createdAt);
      if (year) yearsSet.add(year);
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [invoices]);

  // Counts for Gelir Faturası vs Gelir Fişi
  const salesInvoicesCount = React.useMemo(() => {
    return invoices.filter((i) => i.type === "sales" && (i.docKind === "invoice" || !i.docKind)).length;
  }, [invoices]);

  const salesReceiptsCount = React.useMemo(() => {
    return invoices.filter((i) => i.type === "sales" && i.docKind === "receipt").length;
  }, [invoices]);

  const allSalesCount = React.useMemo(() => {
    return invoices.filter((i) => i.type === "sales").length;
  }, [invoices]);

  // Counts for Gider Faturası vs Gider Fişi
  const purchaseInvoicesCount = React.useMemo(() => {
    return invoices.filter((i) => i.type === "purchase" && (i.docKind === "invoice" || !i.docKind)).length;
  }, [invoices]);

  const purchaseReceiptsCount = React.useMemo(() => {
    return invoices.filter((i) => i.type === "purchase" && i.docKind === "receipt").length;
  }, [invoices]);

  const allPurchaseCount = React.useMemo(() => {
    return invoices.filter((i) => i.type === "purchase").length;
  }, [invoices]);

  // Sütun Bazlı Filtreleme Durumu
  const [colFilters, setColFilters] = useState<{
    invoiceNo: string;
    contact: string;
    date: string;
    subtotal: string;
    grandTotal: string;
    status: string;
  }>({
    invoiceNo: "",
    contact: "",
    date: "",
    subtotal: "",
    grandTotal: "",
    status: "",
  });
  const [showColFilters, setShowColFilters] = useState(true);

  const activeColFilterCount = React.useMemo(() => {
    return (Object.values(colFilters) as string[]).filter((v) => Boolean(v && typeof v === "string" && v.trim() !== "")).length;
  }, [colFilters]);

  const clearAllColFilters = () => {
    setColFilters({
      invoiceNo: "",
      contact: "",
      date: "",
      subtotal: "",
      grandTotal: "",
      status: "",
    });
  };

  // Sütun Görünürlüğü (Kolon Yönetimi & LocalStorage)
  const {
    columns: invoiceColumns,
    columnVisibility: invoiceColVisibility,
    isVisible: isInvoiceColVisible,
    toggleColumn: toggleInvoiceCol,
    setAllColumns: setAllInvoiceCols,
    resetToDefaults: resetInvoiceCols,
    hiddenCount: hiddenInvoiceColsCount,
  } = useColumnVisibility("invoices", INVOICE_TABLE_COLUMNS);

  const visibleInvoiceColCount = React.useMemo(() => {
    return 1 + invoiceColumns.filter((col) => isInvoiceColVisible(col.id)).length;
  }, [invoiceColumns, isInvoiceColVisible]);

  // Filter logic
  const activeSearchQuery = String(globalSearchTerm || search || "").toLowerCase().trim();
  const filteredInvoices = invoices.filter((inv) => {
    // Sütun Bazlı Filtreler (Header Inputs)
    if (colFilters.invoiceNo) {
      const q = colFilters.invoiceNo.toLowerCase().trim();
      const typeStr = inv.type === "sales" ? "satış gelir" : "alış gider";
      const noStr = (inv.invoiceNumber || "").toLowerCase();
      if (!noStr.includes(q) && !typeStr.includes(q)) return false;
    }

    if (colFilters.contact) {
      const q = colFilters.contact.toLowerCase().trim();
      if (!inv.contactName.toLowerCase().includes(q)) return false;
    }

    if (colFilters.date) {
      const q = colFilters.date.toLowerCase().trim();
      const issueStr = formatDate(inv.issueDate).toLowerCase();
      const dueStr = inv.dueDate ? formatDate(inv.dueDate).toLowerCase() : "";
      if (!issueStr.includes(q) && !dueStr.includes(q) && !inv.issueDate.includes(q)) return false;
    }

    if (colFilters.subtotal) {
      const q = colFilters.subtotal.toLowerCase().trim();
      const subFormatted = inv.subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 });
      if (!subFormatted.includes(q) && !String(inv.subtotal).includes(q)) return false;
    }

    if (colFilters.grandTotal) {
      const q = colFilters.grandTotal.toLowerCase().trim();
      const totalFormatted = inv.grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 });
      if (!totalFormatted.includes(q) && !String(inv.grandTotal).includes(q)) return false;
    }

    if (colFilters.status) {
      const q = colFilters.status.toLowerCase().trim();
      const statusMap: Record<string, string> = {
        paid: "ödendi tahsil edildi",
        overdue: "vadesi geçmiş gecikmiş",
        sent: "bekliyor bekleyen açık",
        partial: "kısmi ödendi parça",
        draft: "taslak hazırlanan",
        cancelled: "iptal edildi",
      };
      const mapped = statusMap[inv.status] || inv.status;
      if (!mapped.includes(q) && inv.status !== q) return false;
    }

    // Year & Month Filter
    const { year: invYear, month: invMonth } = getDateYearAndMonth(inv.issueDate || inv.createdAt);

    if (selectedYear !== "all" && invYear !== parseInt(selectedYear, 10)) {
      return false;
    }

    if (selectedMonth !== "all" && invMonth !== parseInt(selectedMonth, 10)) {
      return false;
    }

    if (selectedExpenseCategoryFilter !== "all") {
      const matchesCat =
        inv.expenseCategory === selectedExpenseCategoryFilter ||
        inv.items.some(
          (item) =>
            item.expenseCategory === selectedExpenseCategoryFilter ||
            item.description === selectedExpenseCategoryFilter
        );
      if (!matchesCat) return false;
    }

    const matchesSearch =
      !activeSearchQuery ||
      inv.invoiceNumber.toLowerCase().includes(activeSearchQuery) ||
      inv.contactName.toLowerCase().includes(activeSearchQuery) ||
      (inv.notes && inv.notes.toLowerCase().includes(activeSearchQuery)) ||
      inv.items.some((item) => item.description.toLowerCase().includes(activeSearchQuery));

    if (!matchesSearch) return false;

    // When inside "Gelir Faturaları" module (forcedType === "sales")
    if (forcedType === "sales") {
      if (inv.type !== "sales") return false;
    } else if (forcedType === "purchase") {
      // When inside "Gider Faturaları" module (forcedType === "purchase")
      if (inv.type !== "purchase") return false;
    } else {
      if (filterType === "sales") return inv.type === "sales";
      if (filterType === "purchase") return inv.type === "purchase";
    }

    if (filterType === "draft") return inv.status === "draft";
    if (filterType === "overdue") return inv.status === "overdue";
    if (filterType === "paid") return inv.status === "paid";
    if (filterType === "pending") return inv.status === "sent" || inv.status === "partial";

    return true;
  });

  const displayedInvoices = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, currentPage, pageSize]);

  const displayedInvoiceIds = React.useMemo(() => {
    return displayedInvoices.map((inv) => inv.id);
  }, [displayedInvoices]);

  const kpiStats = React.useMemo(() => {
    const relevant = forcedType
      ? invoices.filter((i) => i.type === forcedType)
      : invoices;

    let totalAmount = 0;
    let paidAmount = 0;
    let remainingAmount = 0;
    let overdueAmount = 0;
    let overdueCount = 0;

    relevant.forEach((inv) => {
      const gTotal = inv.grandTotal || 0;
      const paid = inv.paidAmount || 0;
      const remaining = inv.remainingAmount !== undefined ? inv.remainingAmount : Math.max(0, gTotal - paid);
      totalAmount += gTotal;
      paidAmount += paid;
      remainingAmount += remaining;
      if (inv.status === "overdue" || (remaining > 0 && inv.dueDate && new Date(inv.dueDate) < new Date())) {
        overdueAmount += remaining;
        overdueCount += 1;
      }
    });

    return {
      totalAmount,
      paidAmount,
      remainingAmount,
      overdueAmount,
      overdueCount,
      totalCount: relevant.length,
    };
  }, [invoices, forcedType]);

  const { subtotal, totalVat, grandTotal } = calculateTotals();

  const getInvoicesExportData = (targetInvoices: Invoice[] = filteredInvoices): ExportData => {
    const headers = [
      "Fatura / Fiş No",
      "Belge Türü",
      "Cari Hesap / Müşteri",
      "Düzenleme Tarihi",
      "Vade Tarihi",
      "Stok / Kalem Adı",
      "Miktar",
      "Birim",
      "Birim Fiyat",
      "KDV (%)",
      "KDV Tutarı",
      "Kalem Toplamı (KDV Dahil)",
      "Fatura Genel Toplamı",
      "Ödenen Tutar",
      "Kalan Bakiye",
      "Para Birimi",
      "Durum",
      "Açıklama / Not",
    ];

    const rows: (string | number | boolean | null | undefined)[][] = [];

    targetInvoices.forEach((inv) => {
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
      const typeLabel =
        inv.type === "sales"
          ? inv.docKind === "receipt"
            ? "Satış (Gelir) Fişi"
            : "Satış (Gelir) Faturası"
          : inv.docKind === "receipt"
          ? "Alış (Gider) Fişi"
          : "Alış (Gider) Faturası";
      const invCurrency = inv.currency || "TRY";

      if (inv.items && inv.items.length > 0) {
        inv.items.forEach((item) => {
          rows.push([
            inv.invoiceNumber,
            typeLabel,
            inv.contactName,
            inv.issueDate,
            inv.dueDate || "-",
            item.description || "Belirtilmedi",
            item.quantity ?? 0,
            item.unit || "Adet",
            formatCurrency(item.unitPrice || 0, invCurrency),
            `%${item.vatRate ?? 0}`,
            formatCurrency(item.vatAmount || 0, invCurrency),
            formatCurrency(item.totalWithVat ?? ((item.totalWithoutVat || 0) + (item.vatAmount || 0)), invCurrency),
            formatCurrency(inv.grandTotal || 0, invCurrency),
            formatCurrency(inv.paidAmount || 0, invCurrency),
            formatCurrency(inv.remainingAmount ?? ((inv.grandTotal || 0) - (inv.paidAmount || 0)), invCurrency),
            invCurrency,
            statusLabel,
            inv.notes || "-",
          ]);
        });
      } else {
        rows.push([
          inv.invoiceNumber,
          typeLabel,
          inv.contactName,
          inv.issueDate,
          inv.dueDate || "-",
          inv.notes || "Genel Kalem / Belirtilmedi",
          1,
          "Adet",
          formatCurrency(inv.subtotal || inv.grandTotal || 0, invCurrency),
          `%${inv.totalVat && inv.subtotal ? Math.round((inv.totalVat / inv.subtotal) * 100) : 0}`,
          formatCurrency(inv.totalVat || 0, invCurrency),
          formatCurrency(inv.grandTotal || 0, invCurrency),
          formatCurrency(inv.grandTotal || 0, invCurrency),
          formatCurrency(inv.paidAmount || 0, invCurrency),
          formatCurrency(inv.remainingAmount ?? ((inv.grandTotal || 0) - (inv.paidAmount || 0)), invCurrency),
          invCurrency,
          statusLabel,
          inv.notes || "-",
        ]);
      }
    });

    return {
      filename: `Fatura_Detayli_Stok_Listesi_${new Date().toISOString().split("T")[0]}`,
      title:
        forcedType === "sales"
          ? "SATIŞ (GELİR) FATURALARI STOK & KALEM DETAY LİSTESİ"
          : forcedType === "purchase"
          ? "ALIŞ (GİDER) FATURALARI STOK & KALEM DETAY LİSTESİ"
          : "GELİR VE GİDER FATURALARI STOK & KALEM DETAY LİSTESİ",
      subtitle: `Toplam ${targetInvoices.length} Adet Fatura (${rows.length} Satır Kalem Kaydı)`,
      headers,
      rows,
    };
  };

  const handleBulkDelete = async () => {
    const ids = selection.selectedIdArray;
    if (onBulkDeleteInvoices) {
      onBulkDeleteInvoices(ids);
    } else {
      ids.forEach((id) => onDeleteInvoice(id));
    }
    selection.clearSelection();
  };

  const handleBulkExportExcel = () => {
    const selectedInvs = filteredInvoices.filter((i) => selection.isSelected(i.id));
    exportToExcel(getInvoicesExportData(selectedInvs));
  };

  const handleBulkExportPdf = () => {
    const selectedInvs = filteredInvoices.filter((i) => selection.isSelected(i.id));
    exportToPDF(getInvoicesExportData(selectedInvs));
  };

  const editingInvoiceObj = editingInvoiceId ? invoices.find((i) => i.id === editingInvoiceId) : null;
  const isEditingDraft = editingInvoiceObj?.status === "draft";

  // Detail Page Header & Actions
  const detailTitle = editingInvoiceId
    ? isEditingDraft
      ? invType === "sales"
        ? "Taslak Gelir Faturasını Düzenle / Kes"
        : "Taslak Gider Faturasını Düzenle / Kaydet"
      : invType === "sales"
      ? "Gelir Faturasını Düzenle"
      : "Gider Faturasını Düzenle"
    : forcedType === "sales" || invType === "sales"
    ? formDocKind === "receipt"
      ? "Yeni Satış (Gelir) Fişi"
      : "Yeni Gelir Faturası Kes / Hazırla"
    : forcedType === "purchase" || invType === "purchase"
    ? formDocKind === "receipt"
      ? "Yeni Alış (Gider) Fişi"
      : "Yeni Gider Faturası Kaydet / Hazırla"
    : "Yeni Fatura Hazırla (Satış / Alış)";

  const detailBreadcrumbs: BreadcrumbItem[] = [
    {
      label:
        forcedType === "sales"
          ? "Satış Faturaları"
          : forcedType === "purchase"
          ? "Alış Faturaları"
          : "Faturalar",
      onClick: handleCloseDetail,
    },
    {
      label: editingInvoiceId
        ? `${editingInvoiceNumber || "Fatura"} - ${isEditingDraft ? "Taslak Düzenle" : "Düzenle"}`
        : forcedType === "sales" || invType === "sales"
        ? formDocKind === "receipt"
          ? "Yeni Satış Fişi"
          : "Yeni Satış Faturası"
        : formDocKind === "receipt"
        ? "Yeni Alış Fişi"
        : "Yeni Gider Faturası",
      active: true,
    },
  ];

  const detailStatusBadge = editingInvoiceId ? (
    isEditingDraft ? (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
        <Clock className="w-3.5 h-3.5" /> Taslak Fatura Düzenleniyor
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200 shadow-2xs">
        <Edit2 className="w-3.5 h-3.5" /> Düzenleme Modu
      </span>
    )
  ) : (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs">
      <Clock className="w-3.5 h-3.5" /> Yeni Belge Hazırlanıyor
    </span>
  );

  const detailPageActions = (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleCloseDetail}
        className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
      >
        Vazgeç
      </button>
      <button
        type="button"
        onClick={() => setIsDraftPreviewOpen(true)}
        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
      >
        <Eye className="w-4 h-4 text-indigo-600" />
        <span>{formDocKind === "receipt" ? "Fişi Önizle" : "Faturayı Önizle"}</span>
      </button>
      {(!editingInvoiceId || isEditingDraft) && (
        <button
          type="button"
          onClick={handleSaveDraftClick}
          disabled={isSavingMysoft}
          className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
          title="Faturayı resmi olarak kesmeden taslak olarak kaydedin ve daha sonra düzenleyin"
        >
          <Save className="w-4 h-4 text-amber-600" />
          <span>{isEditingDraft ? "Taslağı Güncelle" : "Taslak Olarak Kaydet"}</span>
        </button>
      )}
      <button
        type="submit"
        form="invoice-create-form"
        disabled={isSavingMysoft}
        className={`px-5 py-2 rounded-xl text-xs font-extrabold text-white shadow-2xs cursor-pointer disabled:opacity-60 flex items-center gap-2 transition-all active:scale-95 ${
          forcedType === "purchase" || invType === "purchase"
            ? formDocKind === "receipt"
              ? "bg-orange-600 hover:bg-orange-700"
              : "bg-amber-600 hover:bg-amber-700"
            : formDocKind === "receipt"
            ? "bg-indigo-600 hover:bg-indigo-700"
            : "bg-purple-600 hover:bg-purple-700"
        }`}
      >
        {isSavingMysoft && <Loader2 className="w-4 h-4 animate-spin" />}
        <span>
          {editingInvoiceId && !isEditingDraft
            ? "Değişiklikleri Kaydet"
            : forcedType === "sales" || invType === "sales"
            ? formDocKind === "receipt"
              ? "Gelir Fişini Kaydet"
              : sendToMysoft
              ? isSavingMysoft
                ? "Mysoft'a Gönderiliyor..."
                : isEditingDraft
                ? "Taslağı Onayla & Mysoft'a Kes"
                : "Kaydet & Mysoft'a Kes"
              : isEditingDraft
              ? "Taslağı Onayla & Faturayı Kes"
              : "Gelir Faturasını Kaydet & Kes"
            : forcedType === "purchase" || invType === "purchase"
            ? formDocKind === "receipt"
              ? "Gider Fişini Kaydet"
              : isEditingDraft
              ? "Taslağı Onayla & Faturayı Kaydet"
              : "Gider Faturasını Kaydet"
            : "Faturayı Kaydet ve Oluştur"}
        </span>
      </button>
    </div>
  );

  // If Detail View is active (Create / Edit Invoice), render Full Page Detail Layout directly
  if (detailNav.isDetailView) {
    // 1. DRAFT INVOICE PREVIEW
    if (isDraftPreviewOpen) {
      return (
        <InvoicePreviewModal
          invoice={getDraftInvoice()}
          companySettings={companySettings}
          contact={contacts.find((c) => c.id === contactId)}
          isDraft={true}
          onClose={() => setIsDraftPreviewOpen(false)}
          onConfirm={() => {
            setIsDraftPreviewOpen(false);
            const dummyEvent = { preventDefault: () => {} } as React.FormEvent;
            handleSaveInvoice(dummyEvent);
          }}
          onSelectTab={onSelectTab}
          onSaveCompanySettings={onSaveCompanySettings}
        />
      );
    }

    // 2. TAX & WITHHOLDING SETTINGS
    if (taxModalItem) {
      return (
        <InvoiceTaxSettingsModal
          isOpen={true}
          item={taxModalItem}
          initialTab={taxModalInitialTab}
          currency="TRY"
          onClose={() => {
            setTaxModalItem(null);
            setTaxModalInitialTab(undefined);
          }}
          onApply={(updatedItem) => {
            const nextItems = items.map((it) => (it.id === updatedItem.id ? updatedItem : it));
            setItems(nextItems);

            let nextProfile = invoiceProfileType;
            if (updatedItem.withholdingCode || (updatedItem.withholdingRate && updatedItem.withholdingRate > 0)) {
              if (invoiceProfileType === "SATIS") {
                nextProfile = "TEVKIFAT";
                setInvoiceProfileType("TEVKIFAT");
              }
            } else if (updatedItem.specialTaxBaseCode || (updatedItem.specialTaxBase !== undefined && updatedItem.specialTaxBase !== null)) {
              if (invoiceProfileType === "SATIS") {
                nextProfile = "OZELMATRAH";
                setInvoiceProfileType("OZELMATRAH");
              }
            } else if (updatedItem.exemptionCode || updatedItem.vatRate === 0) {
              if (invoiceProfileType === "SATIS") {
                nextProfile = "ISTISNA";
                setInvoiceProfileType("ISTISNA");
              }
            }

            const legalNotes = generateInvoiceLegalTaxNotes(nextItems, nextProfile);
            if (legalNotes.length > 0) {
              setNotes((prevNotes) => {
                let n = prevNotes.trim();
                legalNotes.forEach((ln) => {
                  if (!n.includes(ln)) {
                    n = n ? `${n}\n${ln}` : ln;
                  }
                });
                return n;
              });
            }

            setTaxModalItem(null);
            setTaxModalInitialTab(undefined);
          }}
        />
      );
    }

    // 3. QUICK CONTACT CREATION
    if (isQuickContactFormOpen) {
      return (
        <DetailPageLayout
          title="Hızlı Yeni Cari Ekle"
          subtitle="Fatura için yeni müşteri veya tedarikçi kartı oluşturun"
          breadcrumbs={[
            { label: "Fatura Düzenle", onClick: () => setIsQuickContactFormOpen(false) },
            { label: "Hızlı Cari Ekle", active: true },
          ]}
          onBack={() => setIsQuickContactFormOpen(false)}
          statusBadge={
            <span className="bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold px-3 py-1 rounded-xl">
              YENİ CARİ
            </span>
          }
          headerIcon={<Users className="w-5 h-5 text-purple-600" />}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsQuickContactFormOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleQuickCreateContact}
                className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-colors cursor-pointer active:scale-95"
              >
                Cariyi Kaydet & Seç
              </button>
            </div>
          }
        >
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg mx-auto p-6 sm:p-8 shadow-sm space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">VKN / TCKN</label>
                  {newContactTaxNo && (
                    <span className="text-[10px] font-mono font-bold text-purple-600">
                      {newContactTaxNo.length === 10 ? "10 Hane (VKN)" : newContactTaxNo.length === 11 ? "11 Hane (TCKN)" : `${newContactTaxNo.length}/11`}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    maxLength={11}
                    placeholder="10 VKN veya 11 TCKN..."
                    value={newContactTaxNo}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, "").slice(0, 11);
                      setNewContactTaxNo(clean);
                      setQuickContactStatus(null);
                      if (clean.length === 10 || clean.length === 11) {
                        void handleQuickLookupVkn(clean);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleQuickLookupVkn();
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => void handleQuickLookupVkn()}
                    disabled={isQuickContactChecking || (!newContactTaxNo || (newContactTaxNo.length !== 10 && newContactTaxNo.length !== 11))}
                    className="px-3 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    title="Mysoft & GİB üzerinden firma bilgilerini otomatik çek"
                  >
                    {isQuickContactChecking ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                    )}
                    <span>Sorgula</span>
                  </button>
                </div>

                {quickContactStatus && (
                  <div
                    className={`mt-2 p-2 rounded-xl border text-[11px] flex items-center justify-between gap-1.5 animate-fadeIn ${
                      quickContactStatus.isEFaturaUser
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700"
                        : "bg-sky-500/10 border-sky-500/20 text-sky-700"
                    }`}
                  >
                    <span className="font-semibold truncate">
                      {quickContactStatus.isEFaturaUser ? "🟢 GİB e-Fatura Mükellefi" : "🔵 e-Arşiv Alıcısı"}
                      {quickContactStatus.activityStatus === "terminated" ? " (⚠️ Terk)" : ""}
                    </span>
                    {quickContactStatus.pkAlias && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-emerald-500/30 truncate max-w-[150px]" title={quickContactStatus.pkAlias}>
                        PK: {quickContactStatus.pkAlias.split("@")[0]}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cari Ünvanı / Adı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: ABC Lojistik A.Ş."
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mahalle</label>
                  <input
                    type="text"
                    placeholder="Örn: Mecidiyeköy Mah."
                    value={newContactNeighborhood}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewContactNeighborhood(val);
                      setNewContactAddress(
                        compileStructuredAddress(val, newContactStreet, newContactDistrict, newContactCity)
                      );
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cadde - Sokak</label>
                  <input
                    type="text"
                    placeholder="Örn: Büyükdere Cad. No: 195"
                    value={newContactStreet}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewContactStreet(val);
                      setNewContactAddress(
                        compileStructuredAddress(newContactNeighborhood, val, newContactDistrict, newContactCity)
                      );
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">İlçe</label>
                  <input
                    type="text"
                    placeholder="Örn: Şişli"
                    value={newContactDistrict}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewContactDistrict(val);
                      setNewContactAddress(
                        compileStructuredAddress(newContactNeighborhood, newContactStreet, val, newContactCity)
                      );
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">İl</label>
                  <input
                    type="text"
                    placeholder="Örn: İstanbul"
                    value={newContactCity}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewContactCity(val);
                      setNewContactAddress(
                        compileStructuredAddress(newContactNeighborhood, newContactStreet, newContactDistrict, val)
                      );
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tam Adres (Mahalle, Cadde-Sokak, İlçe, İl)
                </label>
                <input
                  type="text"
                  placeholder="Mahalle, Cadde-Sokak, İlçe, İl"
                  value={newContactAddress}
                  onChange={(e) => setNewContactAddress(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Şube Adı / Birim (Adreste Görünür)
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Kadıköy Şubesi"
                    value={newContactBranchName}
                    onChange={(e) => setNewContactBranchName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Şube Kodu
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: SB-02"
                    value={newContactBranchCode}
                    onChange={(e) => setNewContactBranchCode(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Telefon</label>
                <input
                  type="text"
                  placeholder="05XX XXX XX XX"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cari Türü</label>
                <select
                  value={newContactType}
                  onChange={(e) => setNewContactType(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                >
                  <option value="both">Müşteri & Tedarikçi (Her İkisi)</option>
                  <option value="customer">Yalnızca Müşteri (120)</option>
                  <option value="vendor">Yalnızca Tedarikçi (320)</option>
                </select>
              </div>
            </div>
            <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsQuickContactFormOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleQuickCreateContact}
                className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs cursor-pointer active:scale-95"
              >
                Kaydet & Seç
              </button>
            </div>
          </div>
        </DetailPageLayout>
      );
    }

    // 4. CONTACT PICKER
    if (isContactPickerOpen) {
      return (
        <DetailPageLayout
          title="Cari Hesap Seç ve Faturaya Ekle"
          subtitle="Faturanız için cari seçin veya hızlıca yeni cari oluşturun"
          breadcrumbs={[
            { label: "Fatura Düzenle", onClick: () => setIsContactPickerOpen(false) },
            { label: "Cari Seçici", active: true },
          ]}
          onBack={() => setIsContactPickerOpen(false)}
          statusBadge={
            <span className="bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold px-3 py-1 rounded-xl">
              CARİ LİSTESİ
            </span>
          }
          headerIcon={<Users className="w-5 h-5 text-purple-600" />}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsContactPickerOpen(false);
                  setIsQuickContactFormOpen(true);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 cursor-pointer"
              >
                + Yeni Cari Oluştur
              </button>
              <button
                type="button"
                onClick={() => setIsContactPickerOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              >
                Vazgeç
              </button>
            </div>
          }
        >
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl mx-auto p-6 sm:p-8 shadow-sm space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Cari adı, vergi no veya telefon ile ara..."
                value={contactPickerSearch}
                onChange={(e) => setContactPickerSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
              />
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-2 custom-scrollbar pr-1">
              {contacts
                .filter((c) => {
                  const s = contactPickerSearch.toLowerCase().trim();
                  if (!s) return true;
                  return (
                    c.name.toLowerCase().includes(s) ||
                    (c.taxNumber && c.taxNumber.includes(s)) ||
                    (c.phone && c.phone.includes(s))
                  );
                })
                .map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setContactId(c.id);
                      setCustomerBranchName(c.branchName || "");
                      setCustomerBranchCode(c.branchCode || "");
                      setVknSearchInput(c.taxNumber ? c.taxNumber.replace(/\D/g, "") : "");
                      setIsContactPickerOpen(false);
                    }}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900 group-hover:text-purple-900">{c.name}</span>
                        {c.branchName && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                            Şube: {c.branchName}{c.branchCode ? ` (${c.branchCode})` : ""}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        VKN/TCKN: {c.taxNumber || "-"} • Tel: {c.phone || "-"}
                      </div>
                      {(c.address || c.city || c.branchName) && (
                        <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-purple-500 shrink-0" />
                          <span>
                            {formatAddressWithBranch(c.address, c.city, c.district, c.branchName, c.branchCode)}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-purple-700 bg-purple-50 group-hover:bg-purple-600 group-hover:text-white px-3 py-1.5 rounded-xl border border-purple-200 transition-colors">
                      Seç
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </DetailPageLayout>
      );
    }

    // 5. PRODUCT PICKER
    if (isProductPickerOpen) {
      return (
        <DetailPageLayout
          title="Stok & Hizmet Listesinden Seç ve Faturaya Ekle"
          subtitle="Faturanıza eklemek istediğiniz stok veya hizmeti seçin"
          breadcrumbs={[
            { label: "Fatura Düzenle", onClick: () => setIsProductPickerOpen(false) },
            { label: "Stok & Hizmet Seçici", active: true },
          ]}
          onBack={() => setIsProductPickerOpen(false)}
          statusBadge={
            <span className="bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold px-3 py-1 rounded-xl">
              ÜRÜN REHBERİ
            </span>
          }
          headerIcon={<Package className="w-5 h-5 text-purple-600" />}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsProductPickerOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              >
                Vazgeç
              </button>
            </div>
          }
        >
          <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl mx-auto p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Ürün adı, stok kodu veya barkod ile ara..."
                  value={productPickerSearch}
                  onChange={(e) => setProductPickerSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                />
              </div>

              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 w-full sm:w-auto"
              >
                <option value="all">Tüm Kategoriler</option>
                {Array.from(new Set(products.map((p) => p.category).filter(Boolean))).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Stok Rehberi Toplam Özet Bandı */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-purple-50/70 border border-purple-200/80 rounded-2xl text-xs">
              <div className="flex items-center gap-2 font-bold text-purple-900">
                <Package className="w-4 h-4 text-purple-600" />
                <span>Stok Rehberi Envanter Özeti ({products.length} Kalem Stok/Hizmet)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-white border border-purple-200 font-mono font-extrabold text-purple-800 shadow-2xs">
                  Toplam Mevcut Adet:{" "}
                  {products
                    .reduce((sum, p) => sum + Number(p.stockQuantity ?? p.stock ?? 0), 0)
                    .toLocaleString("tr-TR")}{" "}
                  Birim
                </span>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-2 custom-scrollbar pr-1">
              {products
                .filter((p) => {
                  const s = productPickerSearch.toLowerCase().trim();
                  const matchesSearch = !s || p.name.toLowerCase().includes(s) || (p.code && p.code.toLowerCase().includes(s)) || (p.barcode && p.barcode.includes(s));
                  const matchesCat = productCategoryFilter === "all" || p.category === productCategoryFilter;
                  return matchesSearch && matchesCat;
                })
                .map((p) => {
                  const stockQty = Number(p.stockQuantity ?? p.stock ?? 0);
                  const unitLabel = p.unit || "Adet";
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectProductFromPicker(p)}
                      className="p-3.5 rounded-2xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-slate-900 group-hover:text-purple-900">
                            {p.name}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-extrabold border ${
                              p.isService
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : stockQty <= 0
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            Stok: {stockQty.toLocaleString("tr-TR")} {unitLabel}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          Kod: {p.code || "-"} • Kategori: {p.category || "Genel"} • Mevcut Miktar:{" "}
                          <strong className={stockQty <= 0 && !p.isService ? "text-rose-600" : "text-emerald-700"}>
                            {stockQty.toLocaleString("tr-TR")} {unitLabel}
                          </strong>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-xs text-purple-700">
                          ₺{invType === "purchase" ? p.buyPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : p.sellPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold">+%{p.vatRate ?? 20} KDV</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </DetailPageLayout>
      );
    }

    // 6. AI EXPENSE SCANNER
    if (isAiScannerModalOpen) {
      return (
        <AiExpenseScannerModal
          isOpen={isAiScannerModalOpen}
          onClose={() => setIsAiScannerModalOpen(false)}
          contacts={contacts}
          accounts={accounts}
          onSaveInvoiceDirectly={handleSaveInvoiceDirectlyFromAi}
          onApplyToForm={handleApplyAiDataToForm}
        />
      );
    }
    return (
      <div className="animate-fadeIn">
        <DetailPageLayout
          title={detailTitle}
          subtitle="Resmi e-Fatura, e-Arşiv ve ticari fatura oluşturucu"
          breadcrumbs={detailBreadcrumbs}
          onBack={handleCloseDetail}
          statusBadge={detailStatusBadge}
          headerIcon={
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                forcedType === "purchase" || invType === "purchase"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-purple-100 text-purple-700"
              }`}
            >
              <FileText className="w-5 h-5" />
            </div>
          }
          actions={detailPageActions}
          fullWidth={true}
        >
          <div className="w-full min-w-0 space-y-6">
            <form id="invoice-create-form" onSubmit={handleSaveInvoice} className="space-y-5 min-w-0">
              {/* AI OCR Scanner Shortcut for Gider Faturaları */}
              {(forcedType === "purchase" || invType === "purchase") && (
                <div
                  className="p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs transition-all"
                  style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold" style={{ color: theme.pageText }}>
                          Faturanız Var mı?
                        </span>
                        <span className="bg-purple-500/10 text-purple-600 border border-purple-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          AI OCR Otomatik Doldurma
                        </span>
                      </div>
                      <p className="text-[11px] font-medium" style={{ color: theme.pageTextMuted }}>
                        Fotoğraf veya PDF yükleyin; firma ünvanı, VKN, tutar, KDV ve masraf kalemi anında doldurulsun.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAiScannerModalOpen(true);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all shrink-0 active:scale-95"
                  >
                    <UploadCloud className="w-4 h-4 text-purple-200" />
                    <span>AI ile Fatura Tara</span>
                  </button>
                </div>
              )}

              {/* Fatura & Firma Logosu (Sadece Gider Faturası Ekleme Bölümünde Gösterilir) */}
              {forcedType !== "sales" && invType !== "sales" && (
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 flex items-center justify-center shrink-0">
                      <Logo size="sm" src={companySettings?.logoUrl || "/logo.svg"} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold text-slate-900 truncate">
                          {companySettings?.companyName || "Firma Logosu & Başlığı"}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          Fatura Logosu
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Bilgisayarınızdan yüklediğiniz logo fatura şablonunda, PDF çıktısında ve sistem genelinde kullanılır.
                      </p>
                      {logoUploadNotice && (
                        <p className="text-[11px] font-bold text-emerald-700 mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>{logoUploadNotice}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      ref={invoiceLogoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp,image/*"
                      onChange={handleInvoiceLogoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => invoiceLogoInputRef.current?.click()}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Bilgisayardan Logo Yükle</span>
                    </button>
                    {companySettings?.logoUrl && companySettings.logoUrl !== "/logo.svg" && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onSaveCompanySettings) {
                            onSaveCompanySettings({ ...companySettings, logoUrl: "/logo.svg" });
                          }
                          void saveCloudLogo("/logo.svg", {
                            brandName: companySettings.companyName || "E-MUAVİN",
                            description: "Varsayılan kurumsal logo",
                          });
                          setLogoUploadNotice("Varsayılan kurumsal logoya dönüldü.");
                          setTimeout(() => setLogoUploadNotice(null), 3000);
                        }}
                        className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold border border-slate-200 transition-all cursor-pointer"
                        title="Varsayılan logoya dön"
                      >
                        Varsayılan
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Top Controls & Selected Cari / Müşteri Information */}
              <div className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                {/* 0. Faturayı Kesilen / Düzenleyen Şube & Merkez Adresi Seçimi */}
                <div className="bg-white p-3.5 rounded-xl border border-purple-200/90 shadow-2xs space-y-3">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-extrabold text-slate-900">
                            {invType === "sales"
                              ? "Faturayı Kesilen / Düzenleyen Şube:"
                              : "İşlemin Yapıldığı Şirket Şubesi:"}
                          </span>
                          {selectedCompanyBranch && (
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                                selectedCompanyBranch.isMain
                                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                  : "bg-purple-50 text-purple-700 border-purple-200"
                              }`}
                            >
                              {selectedCompanyBranch.isMain ? "🏢 MERKEZ: " : "🏬 ŞUBE: "}
                              {selectedCompanyBranch.name}
                              {selectedCompanyBranch.code ? ` (${selectedCompanyBranch.code})` : ""}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Merkez veya şube seçildiğinde seçilen merkez veya şubenin adresi gösterilir ve fatura bu adres ile gönderilir.
                        </p>
                      </div>
                    </div>

                    <div className="w-full lg:w-96 shrink-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <label className="block text-[10px] font-bold text-purple-800 uppercase tracking-wider">
                          {invType === "sales" ? "Faturanın Kesildiği Şube Seçimi" : "Merkez / Şube Seçimi"}
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handleOpenQuickBranchEdit}
                            className="text-[10px] font-bold text-slate-600 hover:text-purple-700 bg-slate-100 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition-all"
                            title="Seçili şubenin adres ve bilgilerini düzenle"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                            <span>Düzenle</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleOpenQuickBranchCreate}
                            className="text-[10px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition-all"
                            title="Yeni şube ve şube adresi tanımla"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>Yeni Şube Ekle</span>
                          </button>
                        </div>
                      </div>
                      <select
                        value={selectedCompanyBranch?.id || selectedBranchId}
                        onChange={(e) => {
                          setSelectedBranchId(e.target.value);
                          setCustomBranchAddressOverride("");
                        }}
                        className="w-full bg-purple-50/50 hover:bg-white border border-purple-300 focus:border-purple-600 rounded-xl p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 shadow-2xs cursor-pointer"
                      >
                        {effectiveBranchesList
                          .filter((b) => b.status !== "passive" || b.id === selectedBranchId)
                          .map((b) => {
                            const brCity = b.address?.city || "";
                            const brDist = b.address?.district || "";
                            const locStr = [brDist, brCity].filter(Boolean).join("/");
                            return (
                              <option key={b.id} value={b.id}>
                                {b.isMain ? "🏢 [MERKEZ]" : "🏬 [ŞUBE]"} {b.name} ({b.code}){locStr ? ` - ${locStr}` : ""}
                              </option>
                            );
                          })}
                      </select>
                    </div>
                  </div>

                  {/* Hızlı Şube Ekleme / Düzenleme Paneli */}
                  {isQuickBranchFormOpen && (
                    <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                          {quickBranchMode === "edit"
                            ? "Seçili Şube Bilgilerini ve Adresini Düzenle"
                            : "Yeni Şube Tanımla (Kaydedildiğinde Otomatik Seçilir ve Adres Bölümüne Yansır)"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsQuickBranchFormOpen(false)}
                          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">
                            Şube Adı *
                          </label>
                          <input
                            type="text"
                            value={quickBranchName}
                            onChange={(e) => setQuickBranchName(e.target.value)}
                            placeholder="Örn: Kadıköy Şubesi"
                            className="w-full bg-white border border-indigo-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">
                            Şube Kodu *
                          </label>
                          <input
                            type="text"
                            value={quickBranchCode}
                            onChange={(e) => setQuickBranchCode(e.target.value)}
                            placeholder="SUB-003"
                            className="w-full bg-white border border-indigo-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">
                            Mahalle
                          </label>
                          <input
                            type="text"
                            value={quickBranchNeighborhood}
                            onChange={(e) => {
                              const val = e.target.value;
                              setQuickBranchNeighborhood(val);
                              setQuickBranchAddress(
                                compileStructuredAddress(val, quickBranchStreet, quickBranchDistrict, quickBranchCity)
                              );
                            }}
                            placeholder="Örn: Caferağa Mah."
                            className="w-full bg-white border border-indigo-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">
                            Cadde - Sokak
                          </label>
                          <input
                            type="text"
                            value={quickBranchStreet}
                            onChange={(e) => {
                              const val = e.target.value;
                              setQuickBranchStreet(val);
                              setQuickBranchAddress(
                                compileStructuredAddress(quickBranchNeighborhood, val, quickBranchDistrict, quickBranchCity)
                              );
                            }}
                            placeholder="Örn: Bağdat Cad. No: 12"
                            className="w-full bg-white border border-indigo-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">
                            İlçe
                          </label>
                          <input
                            type="text"
                            value={quickBranchDistrict}
                            onChange={(e) => {
                              const val = e.target.value;
                              setQuickBranchDistrict(val);
                              setQuickBranchAddress(
                                compileStructuredAddress(quickBranchNeighborhood, quickBranchStreet, val, quickBranchCity)
                              );
                            }}
                            placeholder="Örn: Kadıköy"
                            className="w-full bg-white border border-indigo-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">
                            İl
                          </label>
                          <input
                            type="text"
                            value={quickBranchCity}
                            onChange={(e) => {
                              const val = e.target.value;
                              setQuickBranchCity(val);
                              setQuickBranchAddress(
                                compileStructuredAddress(quickBranchNeighborhood, quickBranchStreet, quickBranchDistrict, val)
                              );
                            }}
                            placeholder="Örn: İstanbul"
                            className="w-full bg-white border border-indigo-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">
                            Şube Tam Adresi (Mahalle, Cadde-Sokak, İlçe, İl - Adres Bölümüne Otomatik Yazılır) *
                          </label>
                          <input
                            type="text"
                            value={quickBranchAddress}
                            onChange={(e) => setQuickBranchAddress(e.target.value)}
                            placeholder="Mahalle, Cadde-Sokak, İlçe, İl..."
                            className="w-full bg-white border border-indigo-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900"
                          />
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setIsQuickBranchFormOpen(false)}
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold cursor-pointer"
                          >
                            Vazgeç
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveQuickBranch}
                            disabled={!quickBranchName.trim()}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>
                              {quickBranchMode === "edit" ? "Şube Adresini Güncelle" : "Şubeyi Kaydet & Seç"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Adres Bölümü: Şube Seçildiyse Şube Adresini, Merkez Seçildiyse Merkez Adresini Gösterir */}
                  <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[11px] font-extrabold text-purple-950 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span>
                              {selectedCompanyBranch && !selectedCompanyBranch.isMain
                                ? `Adres Bölümü (Seçilen Şube Adresi — ${selectedCompanyBranch.name}):`
                                : "Adres Bölümü (Firma Merkez Adresi):"}
                            </span>
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            {selectedCompanyBranch && !selectedCompanyBranch.isMain
                              ? "✓ Şube Seçildi: Faturanın Adres Bölümünde Şube Adresi Gösterilir"
                              : "✓ Merkez Seçili: Faturanın Adres Bölümünde Merkez Adresi Gösterilir"}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={
                            customBranchAddressOverride !== ""
                              ? customBranchAddressOverride
                              : selectedCompanyBranch && !selectedCompanyBranch.isMain
                                ? computedCompanyBranchAddress || companyHeadquartersAddress || ""
                                : computedCompanyBranchAddress || companyHeadquartersAddress || ""
                          }
                          onChange={(e) => setCustomBranchAddressOverride(e.target.value)}
                          placeholder={
                            selectedCompanyBranch && !selectedCompanyBranch.isMain
                              ? "Seçilen şubenin adresi..."
                              : "Firma merkez adresi..."
                          }
                          className="w-full bg-white border border-purple-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        />
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
                          <span>
                            <strong>Seçili Birim:</strong>{" "}
                            {selectedCompanyBranch?.name || "Merkez"}
                            {selectedCompanyBranch?.code ? ` (${selectedCompanyBranch.code})` : ""}
                          </span>
                          <span>•</span>
                          <span>
                            <strong>İlçe / İl:</strong>{" "}
                            {[
                              selectedCompanyBranch?.address?.district || companySettings.district,
                              selectedCompanyBranch?.address?.city || companySettings.city,
                            ]
                              .filter(Boolean)
                              .join(" / ") || "-"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {invType === "sales" && (
                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          type="submit"
                          disabled={isSavingMysoft}
                          className="w-full md:w-auto px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                          title="Seçilen şube adresiyle faturayı kaydet ve gönder"
                        >
                          {isSavingMysoft ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {sendToMysoft
                              ? "Seçilen Şube Adresiyle Gönder"
                              : "Seçilen Şube Adresiyle Kes"}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 1. Müşteri Seçim Modu: Kayıtlı Cari vs Elle Giriş */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setCustomerMode("registered")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        customerMode === "registered"
                          ? "bg-white text-purple-700 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Kayıtlı Cari Hesap Seç</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 font-mono text-slate-500">
                        {contacts.length}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerMode("manual");
                        const cleanVkn = vknSearchInput.replace(/\D/g, "").trim();
                        if (cleanVkn) {
                          setManualTaxNumber(cleanVkn);
                          if (recipientStatus && recipientStatus.vknTckn === cleanVkn) {
                            lastQueriedManualVknRef.current = cleanVkn;
                            applyQueriedTaxpayerToManualForm(recipientStatus, cleanVkn);
                          }
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        customerMode === "manual"
                          ? "bg-white text-purple-700 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Elle Müşteri Bilgisi Gir</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold uppercase">
                        Cari Hesapsız
                      </span>
                    </button>
                  </div>

                  {customerMode === "manual" ? (
                    <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200/90 px-3 py-1 rounded-lg flex items-center gap-1.5 font-medium">
                      <Info className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      <span>Cari kartı açmaya gerek olmadan müşteri ve şube bilgileriyle doğrudan fatura düzenlenir.</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1">
                      <span>Kayıtlı cari listeden seçebilir veya "Elle Müşteri Bilgisi Gir" ile cari açmadan fatura kesebilirsiniz.</span>
                    </div>
                  )}
                </div>

                {customerMode === "registered" ? (
                  <>
                    <div className="flex flex-col md:flex-row items-stretch md:items-end gap-3">
                      {/* 1. VKN / TCKN No ile Arama / Otomatik Getirme (Kompakt Genişlik) */}
                      <div className="w-full md:w-36 lg:w-40 shrink-0">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                            <span>VKN / TCKN No</span>
                          </label>
                          {vknSearchInput && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                contacts.some(
                                  (c) => c.taxNumber && c.taxNumber.replace(/\D/g, "") === vknSearchInput
                                )
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : vknSearchInput.length >= 10
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : "text-slate-400 font-semibold"
                              }`}
                            >
                              {contacts.some(
                                (c) => c.taxNumber && c.taxNumber.replace(/\D/g, "") === vknSearchInput
                              )
                                ? "✓ Kayıtlı"
                                : vknSearchInput.length >= 10
                                ? "Yok"
                                : `${vknSearchInput.length}/11`}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            maxLength={11}
                            placeholder="10 VKN / 11 TCKN..."
                            value={vknSearchInput}
                            onChange={(e) => handleVknInputChange(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                          />
                          {(vknSearchInput.length === 10 || vknSearchInput.length === 11) &&
                            !contacts.some(
                              (c) => c.taxNumber && c.taxNumber.replace(/\D/g, "") === vknSearchInput
                            ) && (
                              <button
                                type="button"
                                onClick={() => {
                                  const clean = vknSearchInput.replace(/\D/g, "").trim();
                                  setCustomerMode("manual");
                                  setManualTaxNumber(clean);
                                  setIsCheckingRecipient(true);
                                  checkRecipientTaxpayerStatus(clean, undefined, mysoftTenantVkn)
                                    .then((status) => {
                                      setRecipientStatus(status);
                                      lastQueriedManualVknRef.current = clean;
                                      applyQueriedTaxpayerToManualForm(status, clean);
                                      const nextType = status.isEFaturaUser ? "e_fatura" : "e_arsiv";
                                      setMysoftEDocType(nextType);
                                      setInvoiceScenario(
                                        status.isEFaturaUser
                                          ? status.suggestedProfile === "TEMELFATURA"
                                            ? "TEMELFATURA"
                                            : "TICARIFATURA"
                                          : "EARSIVFATURA"
                                      );
                                      void fetchAndApplyNextInvoiceNumber(undefined, nextType);
                                    })
                                    .finally(() => setIsCheckingRecipient(false));
                                }}
                                className="px-2 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer shrink-0"
                                title="Sorgula ve müşteri bilgilerini doldur"
                              >
                                <Sparkles className="w-3 h-3 text-purple-200" />
                                <span>Sorgula</span>
                              </button>
                            )}
                        </div>
                      </div>

                      {/* 2. Cari Hesap Seçimi (Daraltılmış / Dengeli Alan) */}
                      <div className="flex-1 min-w-[180px]">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700">
                            Cari Hesap *
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setCustomerMode("manual");
                                const cleanVkn = vknSearchInput.replace(/\D/g, "").trim();
                                if (cleanVkn) {
                                  setManualTaxNumber(cleanVkn);
                                  if (recipientStatus && recipientStatus.vknTckn === cleanVkn) {
                                    lastQueriedManualVknRef.current = cleanVkn;
                                    applyQueriedTaxpayerToManualForm(recipientStatus, cleanVkn);
                                  }
                                }
                              }}
                              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer flex items-center gap-0.5"
                            >
                              <UserPlus className="w-3 h-3" />
                              <span>Elle Gir</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setNewContactTaxNo(vknSearchInput);
                                setIsContactPickerOpen(true);
                              }}
                              className="text-[11px] font-bold text-purple-600 hover:text-purple-800 cursor-pointer flex items-center gap-0.5"
                            >
                              <Search className="w-3 h-3" />
                              <span>Rehber</span>
                            </button>
                          </div>
                        </div>
                        <select
                          value={contactId}
                          onChange={(e) => handleContactSelectChange(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 truncate shadow-2xs"
                        >
                          <option value="__manual_entry__" className="font-bold text-purple-700 bg-purple-50">
                            ✍️ [+ Cari Hesap Seçmeden Elle Müşteri Bilgisi Gir...]
                          </option>
                          {contacts.map((c) => (
                            <option key={c.id} value={c.id}>
                              [{getContactAccountCode(c)}] {c.name}
                              {c.branchName ? ` - Şube: ${c.branchName}` : ""}
                              {c.taxNumber ? ` (VKN: ${c.taxNumber})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 3. Fatura Numarası */}
                      <div className="w-full md:w-44 lg:w-48 shrink-0">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <Hash className="w-3.5 h-3.5 text-purple-600" />
                            <span>Fatura Numarası</span>
                          </label>
                          {invType === "sales" && !editingInvoiceId ? (
                            sendToMysoft ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsManualInvoiceNumber(false);
                                  setInvoiceNumberInput(activeMysoftSerialNumber);
                                  void fetchAndApplyNextInvoiceNumber();
                                }}
                                disabled={isFetchingNextDocNo}
                                title="İlgili tenanttan son faturayı çek ve sıradaki numarayı otomatik ata"
                                className="text-[10px] text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 hover:underline cursor-pointer disabled:opacity-50"
                              >
                                <RefreshCw className={`w-3 h-3 ${isFetchingNextDocNo ? "animate-spin text-purple-600" : ""}`} />
                                <span>{isFetchingNextDocNo ? "Çekiliyor..." : "Sıradaki No"}</span>
                              </button>
                            ) : (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                GYR Ön Eki
                              </span>
                            )
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">Otomatik</span>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder={sendToMysoft ? "Örn: GIB2026000000001" : "Örn: GYR2026000000001"}
                            value={invoiceNumberInput}
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase();
                              setInvoiceNumberInput(val);
                              setIsManualInvoiceNumber(
                                val.trim().length > 0 && val.trim() !== activeSalesSerialNumber,
                              );
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2 pr-8 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                          />
                          {invType === "sales" && !editingInvoiceId && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsManualInvoiceNumber(false);
                                if (sendToMysoft) {
                                  setInvoiceNumberInput(activeMysoftSerialNumber);
                                  void fetchAndApplyNextInvoiceNumber();
                                } else {
                                  setInvoiceNumberInput(activeGyrNextNo);
                                }
                              }}
                              disabled={isFetchingNextDocNo}
                              title="Sıradaki Fatura Numarasını Ata"
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingNextDocNo ? "animate-spin text-purple-600" : ""}`} />
                            </button>
                          )}
                        </div>
                        {invType === "sales" && !editingInvoiceId && (
                          <p className="mt-1 text-[10px] text-purple-800 flex items-center gap-1 font-medium truncate">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>
                              {!sendToMysoft
                                ? `GYR Serisi → Sıradaki: ${invoiceNumberInput || activeGyrNextNo}`
                                : mysoftNumberInfo?.lastInvoiceNumber
                                  ? `Son: ${mysoftNumberInfo.lastInvoiceNumber} → Sıradaki: ${invoiceNumberInput}`
                                  : `Ardışık No: ${invoiceNumberInput || activeMysoftSerialNumber}`}
                            </span>
                          </p>
                        )}
                      </div>

                      {/* 4. Fatura Tarihi */}
                      <div className="w-full md:w-36 lg:w-38 shrink-0">
                        <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-purple-600" />
                          <span>Fatura Tarihi *</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={issueDate}
                          onChange={(e) => setIssueDate(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Selected Cari Details Card */}
                    {(() => {
                      const selectedContact = contacts.find((c) => c.id === contactId);
                      if (!selectedContact) return null;

                      const rawOpenAddr =
                        selectedContact.address ||
                        [
                          selectedContact.neighborhood,
                          selectedContact.street,
                          selectedContact.buildingNo,
                          selectedContact.doorNo,
                        ]
                          .filter(Boolean)
                          .join(" ");
                      const formattedAddressWithBranch = formatAddressWithBranch(
                        rawOpenAddr,
                        selectedContact.city,
                        selectedContact.district,
                        customerBranchName || selectedContact.branchName,
                        customerBranchCode || selectedContact.branchCode
                      );

                      return (
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-2.5 shadow-2xs">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
                              <span className="font-extrabold text-slate-900 text-sm">
                                {selectedContact.name}
                              </span>
                              {(customerBranchName || selectedContact.branchName) && (
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  Şube: {customerBranchName || selectedContact.branchName}
                                  {(customerBranchCode || selectedContact.branchCode)
                                    ? ` (${customerBranchCode || selectedContact.branchCode})`
                                    : ""}
                                </span>
                              )}
                              {selectedContact.contactType && (
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-50 text-purple-700 border border-purple-100 uppercase">
                                  {selectedContact.contactType === "customer"
                                    ? "Müşteri"
                                    : selectedContact.contactType === "vendor"
                                    ? "Tedarikçi"
                                    : "Müşteri & Tedarikçi"}
                                </span>
                              )}
                            </div>
                            {onSelectTab && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsCreateModalOpen(false);
                                  onSelectTab("contacts");
                                }}
                                className="text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
                                title="Cari detaylarına git"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Cari Listesinde Aç</span>
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-700">
                            <div>
                              <span className="text-slate-400 font-semibold block text-[10px] uppercase">VKN / TCKN</span>
                              <span className="font-extrabold text-slate-900">
                                {selectedContact.taxNumber || "— (Belirtilmedi)"}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Vergi Dairesi</span>
                              <span className="font-semibold text-slate-800">
                                {selectedContact.taxOffice || "— (Belirtilmedi)"}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Telefon / E-posta</span>
                              <span className="font-medium text-slate-800">
                                {[selectedContact.phone, selectedContact.email].filter(Boolean).join(" | ") || "— (Belirtilmedi)"}
                              </span>
                            </div>
                          </div>

                          {/* Müşteri / Cari Şube Bilgisi Girişi ve Adres Önizlemesi */}
                          <div className="pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
                            <div className="md:col-span-4">
                              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-purple-600" />
                                <span>Müşteri Şube Adı / Birimi (Adreste Görünür)</span>
                              </label>
                              <input
                                type="text"
                                placeholder="Örn: Merkez Şube, Kadıköy Şubesi, Depo..."
                                value={customerBranchName}
                                onChange={(e) => setCustomerBranchName(e.target.value)}
                                className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                                Şube Kodu
                              </label>
                              <input
                                type="text"
                                placeholder="Örn: SB-01"
                                value={customerBranchCode}
                                onChange={(e) => setCustomerBranchCode(e.target.value)}
                                className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                              />
                            </div>
                            <div className="md:col-span-6">
                              <span className="text-[10px] font-bold text-purple-800 uppercase block mb-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-purple-600 shrink-0" />
                                <span>Faturada Kaydedilecek Müşteri Adresi (Şube Bilgisi Dahil):</span>
                              </span>
                              <div className="bg-purple-50/60 border border-purple-200/80 rounded-lg p-1.5 text-xs font-semibold text-slate-900 min-h-[32px] flex items-center">
                                {formattedAddressWithBranch || "Adres veya şube bilgisi girildiğinde burada görünür"}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                ) : (
                  /* MANUEL MÜŞTERİ GİRİŞİ ALANLARI (Cari Hesapsız / Münferit) */
                  <div className="space-y-3.5 bg-white p-4 rounded-xl border border-purple-200/80 shadow-2xs">
                    {/* Üst Satır: Müşteri Adı, VKN/TCKN, Vergi Dairesi, Fatura No, Fatura Tarihi */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                      {/* Müşteri / Firma Adı / Ünvanı */}
                      <div className="md:col-span-4">
                        <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-purple-600" />
                          <span>Müşteri Adı / Ticari Ünvanı *</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Örn: Ahmet Yılmaz veya ABC Ticaret Ltd. Şti."
                          value={manualCustomerName}
                          onChange={(e) => setManualCustomerName(e.target.value)}
                          className="w-full bg-purple-50/20 border border-purple-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 shadow-2xs"
                        />
                      </div>

                      {/* VKN / TCKN No */}
                      <div className="md:col-span-3">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                            <span>VKN / TCKN</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setManualTaxNumber("11111111111");
                              setInvoiceScenario("EARSIVFATURA");
                              setMysoftEDocType("e_arsiv");
                            }}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100"
                            title="e-Arşiv Nihai Tüketici için 11111111111 doldur"
                          >
                            11111111111 (Nihai)
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            maxLength={11}
                            placeholder="10 VKN veya 11 TCKN..."
                            value={manualTaxNumber}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "").slice(0, 11);
                              setManualTaxNumber(val);
                              if (val === "11111111111") {
                                setInvoiceScenario("EARSIVFATURA");
                                setMysoftEDocType("e_arsiv");
                              }
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const clean = manualTaxNumber.replace(/\D/g, "").trim();
                              if (clean.length === 10 || clean.length === 11) {
                                setIsCheckingRecipient(true);
                                checkRecipientTaxpayerStatus(clean, undefined, mysoftTenantVkn)
                                  .then((status) => {
                                    setRecipientStatus(status);
                                    lastQueriedManualVknRef.current = clean;
                                    applyQueriedTaxpayerToManualForm(status, clean);
                                    const nextType = status.isEFaturaUser ? "e_fatura" : "e_arsiv";
                                    setMysoftEDocType(nextType);
                                    setInvoiceScenario(status.isEFaturaUser ? (status.suggestedProfile === "TEMELFATURA" ? "TEMELFATURA" : "TICARIFATURA") : "EARSIVFATURA");
                                    void fetchAndApplyNextInvoiceNumber(undefined, nextType);
                                  })
                                  .finally(() => setIsCheckingRecipient(false));
                              }
                            }}
                            disabled={isCheckingRecipient || !manualTaxNumber || (manualTaxNumber.length !== 10 && manualTaxNumber.length !== 11) || manualTaxNumber === "11111111111"}
                            className="px-2.5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                            title="GİB & Mysoft'tan firma ünvanı, vergi dairesi ve adresini otomatik getir"
                          >
                            {isCheckingRecipient ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                            )}
                            <span className="hidden sm:inline">Sorgula</span>
                          </button>
                        </div>
                        {customerMode === "manual" && recipientStatus && recipientStatus.vknTckn === manualTaxNumber && (
                          <div
                            className={`mt-1.5 p-1.5 rounded-lg border text-[11px] flex items-center justify-between gap-1.5 animate-fadeIn ${
                              recipientStatus.isEFaturaUser
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700"
                                : "bg-sky-500/10 border-sky-500/20 text-sky-700"
                            }`}
                          >
                            <span className="font-semibold truncate">
                              {recipientStatus.isEFaturaUser
                                ? "🟢 GİB e-Fatura Mükellefi"
                                : "🔵 e-Arşiv Alıcısı"}
                              {recipientStatus.activityStatus === "terminated" ? " (⚠️ Terk/Kapalı)" : ""}
                            </span>
                            {recipientStatus.pkAlias && (
                              <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-white/60 border border-emerald-500/30 truncate max-w-[140px]" title={recipientStatus.pkAlias}>
                                PK: {recipientStatus.pkAlias.split("@")[0]}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Vergi Dairesi */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Vergi Dairesi
                        </label>
                        <input
                          type="text"
                          placeholder="Örn: Kadıköy V.D."
                          value={manualTaxOffice}
                          onChange={(e) => setManualTaxOffice(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                        />
                      </div>

                      {/* Fatura Numarası */}
                      <div className="md:col-span-3">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <Hash className="w-3.5 h-3.5 text-purple-600" />
                            <span>Fatura Numarası</span>
                          </label>
                          {invType === "sales" && formDocKind === "invoice" && !editingInvoiceId ? (
                            <div className="flex items-center gap-1">
                              <span
                                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                                  !sendToMysoft
                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                    : isCurrentSalesEArsiv
                                      ? "bg-sky-50 text-sky-800 border-sky-200"
                                      : "bg-emerald-50 text-emerald-800 border-emerald-200"
                                }`}
                              >
                                {!sendToMysoft
                                  ? "GYR Ön Eki"
                                  : isCurrentSalesEArsiv
                                    ? `e-Arşiv (${activeMysoftPrefix})`
                                    : `e-Fatura (${activeMysoftPrefix})`}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsManualInvoiceNumber(false);
                                  if (sendToMysoft) {
                                    setInvoiceNumberInput(activeMysoftSerialNumber);
                                    void fetchAndApplyNextInvoiceNumber();
                                  } else {
                                    setInvoiceNumberInput(activeGyrNextNo);
                                  }
                                }}
                                disabled={isFetchingNextDocNo}
                                className="text-[10px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 cursor-pointer flex items-center gap-0.5 disabled:opacity-50"
                                title="Sıradaki ardışık fatura numarasını ata"
                              >
                                <RefreshCw className={`w-2.5 h-2.5 ${isFetchingNextDocNo ? "animate-spin" : ""}`} />
                                <span>Sıradaki No</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-purple-700 font-semibold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                              İsteğe Bağlı (Otomatik)
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="Boş bırakılırsa otomatik üretilir"
                          value={invoiceNumberInput}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            setInvoiceNumberInput(val);
                            setIsManualInvoiceNumber(
                              val.trim().length > 0 && val.trim() !== activeSalesSerialNumber,
                            );
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                        />
                        {invType === "sales" && !editingInvoiceId && (
                          <p className="mt-1 text-[10px] text-purple-800 flex items-center gap-1 font-medium truncate">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>
                              {!sendToMysoft
                                ? `GYR Serisi → Sıradaki: ${invoiceNumberInput || activeGyrNextNo}`
                                : mysoftNumberInfo?.lastInvoiceNumber
                                  ? `Son: ${mysoftNumberInfo.lastInvoiceNumber} → Sıradaki: ${invoiceNumberInput}`
                                  : `Ardışık No: ${invoiceNumberInput || activeMysoftSerialNumber}`}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* İkinci Satır: Fatura Tarihi, Telefon, E-posta */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      {/* Fatura Tarihi */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-purple-600" />
                          <span>Fatura Tarihi *</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={issueDate}
                          onChange={(e) => setIssueDate(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                        />
                      </div>

                      {/* Telefon No */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-purple-600" />
                          <span>Telefon No</span>
                        </label>
                        <input
                          type="tel"
                          placeholder="05XX XXX XX XX"
                          value={manualPhone}
                          onChange={(e) => setManualPhone(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                        />
                      </div>

                      {/* E-Posta */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-purple-600" />
                          <span>E-posta (e-Arşiv İçin)</span>
                        </label>
                        <input
                          type="email"
                          placeholder="musteri@ornek.com"
                          value={manualEmail}
                          onChange={(e) => setManualEmail(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Üçüncü Satır: Adres Alanları (Mahalle, Cadde-Sokak, İlçe, İl) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Mahalle
                        </label>
                        <input
                          type="text"
                          placeholder="Örn: Barbaros Mah."
                          value={manualNeighborhood}
                          onChange={(e) => handleManualNeighborhoodChange(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Cadde - Sokak
                        </label>
                        <input
                          type="text"
                          placeholder="Örn: Çiğdem Sk. No: 14 D: 6"
                          value={manualStreet}
                          onChange={(e) => handleManualStreetChange(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          İlçe
                        </label>
                        <input
                          type="text"
                          placeholder="Örn: Kadıköy"
                          value={manualDistrict}
                          onChange={(e) => handleManualDistrictSelect(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          İl
                        </label>
                        <input
                          type="text"
                          placeholder="Örn: İstanbul"
                          value={manualCity}
                          onChange={(e) => handleManualCitySelect(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Şube Bilgileri & Açık Adres Satırı */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                      <div className="md:col-span-3">
                        <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-purple-600" />
                          <span>Müşteri Şube Adı / Birimi</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Örn: Merkez, Kadıköy Şubesi"
                          value={customerBranchName}
                          onChange={(e) => {
                            const nextBrName = e.target.value;
                            setCustomerBranchName(nextBrName);
                          }}
                          onBlur={() =>
                            setManualAddress((prev) =>
                              formatAddressWithBranch(
                                prev,
                                manualCity,
                                manualDistrict,
                                customerBranchName,
                                customerBranchCode
                              )
                            )
                          }
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Şube Kodu
                        </label>
                        <input
                          type="text"
                          placeholder="Örn: SB-01"
                          value={customerBranchCode}
                          onChange={(e) => setCustomerBranchCode(e.target.value)}
                          onBlur={() =>
                            setManualAddress((prev) =>
                              formatAddressWithBranch(
                                prev,
                                manualCity,
                                manualDistrict,
                                customerBranchName,
                                customerBranchCode
                              )
                            )
                          }
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                        />
                      </div>

                      <div className="md:col-span-7">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-purple-600" />
                            <span>Müşteri Açık Adresi (Şube Bilgisi Adreste Görünür)</span>
                          </label>
                          {(manualCity || manualDistrict || customerBranchName) && (
                            <span className="text-[10px] font-semibold text-purple-700">
                              {[
                                customerBranchName
                                  ? `Şube: ${customerBranchName}${customerBranchCode ? ` (${customerBranchCode})` : ""}`
                                  : "",
                                [manualCity, manualDistrict].filter(Boolean).join(" / "),
                              ]
                                .filter(Boolean)
                                .join(" • ")}
                            </span>
                          )}
                        </div>
                        <input
                          ref={manualAddressInputRef}
                          type="text"
                          placeholder="Örn: Barbaros Mah. Çiğdem Sk. No: 14 D: 6"
                          value={manualAddress}
                          onFocus={clampManualAddressCaret}
                          onClick={clampManualAddressCaret}
                          onChange={handleManualAddressInputChange}
                          onBlur={() =>
                            setManualAddress((prev) =>
                              formatAddressWithBranch(
                                prev,
                                manualCity,
                                manualDistrict,
                                customerBranchName,
                                customerBranchCode
                              )
                            )
                          }
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Cari Hesaba Kaydetme Seçeneği */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-purple-50/60 border border-purple-200/70 rounded-xl text-xs">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={saveManualAsContact}
                          onChange={(e) => setSaveManualAsContact(e.target.checked)}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 cursor-pointer"
                        />
                        <span className="font-bold text-purple-950">
                          Bu müşteriyi aynı zamanda <strong>Cari Hesaplar</strong> rehberine kalıcı olarak kaydet
                        </span>
                      </label>
                      <span className="text-[11px] text-purple-700 font-medium">
                        {saveManualAsContact
                          ? "✓ Fatura kesildiğinde yeni cari kart da oluşturulur"
                          : "İşaretsiz: Cari hesap açılmadan doğrudan münferit fatura olarak kaydedilir"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Fatura Senaryosu ve Fatura Türü (Aynı Satırda - Teslimat / Sevkiyat Adresi Bölümünün Üstünde) */}
                <div className="w-full lg:w-3/4 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs space-y-1.5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {/* Sol Sütun: Fatura Senaryosu (GİB e-Belge) */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-purple-600" />
                          <span>Fatura Senaryosu:</span>
                        </label>
                        <span className="text-[9px] font-mono font-bold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">
                          {invoiceScenario}
                        </span>
                      </div>
                      <select
                        value={invoiceScenario}
                        onChange={(e) => {
                          const val = e.target.value as InvoiceScenario;
                          setInvoiceScenario(val);
                          if (val === "EARSIVFATURA") {
                            setMysoftEDocType("e_arsiv");
                          } else {
                            setMysoftEDocType("e_fatura");
                          }
                        }}
                        className="w-full bg-slate-50 hover:bg-white border border-slate-200 focus:border-purple-500 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-2xs cursor-pointer"
                      >
                        <option value="TICARIFATURA">TICARIFATURA - Ticari Fatura (7 Gün İtiraz/Kabul Süreli)</option>
                        <option value="TEMELFATURA">TEMELFATURA - Temel Fatura (Doğrudan Kabul Edilen)</option>
                        <option value="EARSIVFATURA">EARSIVFATURA - e-Arşiv Fatura (Standart / Nihai Tüketici)</option>
                        <option value="IHRACAT">IHRACAT - İhracat e-Faturası (Gümrük Çıkışlı)</option>
                        <option value="KAMU">KAMU - Kamu Kurumu Faturası</option>
                        <option value="HAL">HAL - Hal Kayıt Sistemi (HKS) Faturası</option>
                      </select>
                      <p className="text-[9px] leading-tight text-slate-500 font-medium">
                        {invoiceScenario === "TICARIFATURA" && "Alıcı firma 7 gün içerisinde sistem üzerinden kabul veya ticari ret verebilir."}
                        {invoiceScenario === "TEMELFATURA" && "Sistemden doğrudan kabul edilir; itirazlar harici yollarla yapılır."}
                        {invoiceScenario === "EARSIVFATURA" && "e-Fatura mükellefi olmayanlara ve nihai tüketicilere iletilen arşiv faturası."}
                        {invoiceScenario === "IHRACAT" && "Gümrük ve Ticaret Bakanlığı GTİP onaylı mal ihracatı faturası senaryosu."}
                        {invoiceScenario === "KAMU" && "Kamu kurum ve kuruluşlarına yönelik harcama onaylı kamu faturası."}
                        {invoiceScenario === "HAL" && "Hal Kayıt Sistemi bildirimli toptancı hal satış faturası senaryosu."}
                      </p>
                    </div>

                    {/* Sağ Sütun: Fatura Türü (GİB Standardı) ve Ek Vergi Butonu */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                          <Tag className="w-3 h-3 text-purple-600" />
                          <span>Fatura Türü (GİB Standardı):</span>
                        </label>
                        <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                          {invoiceProfileType}
                        </span>
                      </div>
                      <select
                        value={invoiceProfileType}
                        onChange={(e) => handleSelectInvoiceProfile(e.target.value as InvoiceProfileType)}
                        className="w-full bg-slate-50 hover:bg-white border border-slate-200 focus:border-purple-500 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-2xs cursor-pointer"
                      >
                        <option value="SATIS">SATIŞ - Standart Satış Faturası</option>
                        <option value="TEVKIFAT">TEVKİFAT - KDV Tevkifatlı Fatura (2/10, 5/10, 7/10, 9/10 vb.)</option>
                        <option value="OZELMATRAH">ÖZEL MATRAH - 2. El Araç / Kâr Marjı / Kıymetli Maden (3065 SK. 23)</option>
                        <option value="ISTISNA">İSTİSNA - KDV'den Muaf / İstisna Satış (%0 KDV)</option>
                        <option value="IADE">İADE - Satış / Alış İade Faturası</option>
                        <option value="IHRACKAYITLI">İHRAÇ KAYITLI - İhraç Kaydıyla Teslim (3065 SK. 11/1-c)</option>
                        <option value="SGK">SGK - Sosyal Güvenlik Kurumu Faturası</option>
                        <option value="KOMISYONCU">KOMİSYONCU - Komisyoncu / Aracı Faturası</option>
                      </select>
                      <p className="text-[9px] leading-tight text-slate-500 font-medium">
                        {invoiceProfileType === "SATIS" && "Standart mal ve hizmet teslimi satış faturası profili."}
                        {invoiceProfileType === "TEVKIFAT" && "KDV'nin bir kısmının alıcı tarafından sorumlu sıfatıyla ödendiği fatura türü."}
                        {invoiceProfileType === "OZELMATRAH" && "KDV yalnızca kâr marjı veya işçilik farkı üzerinden hesaplanır."}
                        {invoiceProfileType === "ISTISNA" && "Kanuni istisna maddeleri uyarınca %0 KDV uygulanan teslimler."}
                        {invoiceProfileType === "IADE" && "Daha önce düzenlenen faturaya istinaden mal/hizmet iade faturası."}
                        {invoiceProfileType === "IHRACKAYITLI" && "3065 SK. 11/1-c uyarınca ihraç kaydıyla teslim edilen mallar."}
                        {invoiceProfileType === "SGK" && "Sosyal Güvenlik Kurumu'na yönelik sağlık ve medikal hizmet faturası."}
                        {invoiceProfileType === "KOMISYONCU" && "Komisyonculuk ve aracılık faaliyetlerine konu fatura türü."}
                      </p>
                    </div>
                  </div>
                </div>


                {/* Delivery Address Section (Teslimat Adresi Farklı mı?) */}
                <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-purple-950 select-none">
                      <input
                        type="checkbox"
                        checked={hasDifferentDeliveryAddress}
                        onChange={(e) => {
                          setHasDifferentDeliveryAddress(e.target.checked);
                          if (!e.target.checked) {
                            setDeliveryAddress("");
                          }
                        }}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                      />
                      <MapPin className="w-4 h-4 text-purple-600" />
                      <span>Teslimat / Sevkiyat Adresi Farklı mı?</span>
                    </label>
                  </div>

                  {hasDifferentDeliveryAddress && (
                    <div className="pt-1 animate-in fade-in duration-150 space-y-1">
                      <label className="block text-[11px] font-bold text-purple-900">
                        Farklı Teslimat Adresi (Faturaya not olarak eklenecektir):
                      </label>
                      <textarea
                        rows={2}
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Örnek: Sevkiyat Depo - Org. Sanayi Bölgesi 3. Cadde No:12 Nilüfer / Bursa"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-medium placeholder-slate-400 focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Invoice Items Table */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                    {invType === "purchase" ? "Gider / Masraf Kalemleri & Ürünler" : "Fatura Kalemleri & Ürün/Hizmetler"}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer border border-indigo-200 px-3 py-1.5 rounded-lg bg-indigo-50/50 hover:bg-indigo-100 transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Boş Satır Ekle</span>
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-x-auto custom-scrollbar w-full">
                  <table className="w-full text-left text-xs min-w-[880px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                        <th className="py-2 px-3">
                          <span>{invType === "purchase" ? "Masraf Kalemi / Açıklama" : "Ürün / Açıklama"}</span>
                        </th>
                        <th className="py-2 px-2.5 w-16 text-center">Miktar</th>
                        <th className="py-2 px-2.5 w-16 text-center">Birim</th>
                        <th className="py-2 px-2.5 w-24 text-right">Birim Fiyat</th>
                        <th className="py-2 px-2 w-24 text-right">İskonto Tutarı</th>
                        <th className="py-2 px-1.5 w-16 text-center">İskonto %</th>
                        <th className="py-2 px-1.5 w-16 text-center">KDV %</th>
                        <th className="py-2 px-2.5 w-28 text-right">Toplam (TL)</th>
                        <th className="py-2 px-3 w-40 text-center">Tevkifat & Ek Vergi</th>
                        <th className="py-2 px-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item) => {
                        const withholdingBadge = formatWithholdingBadge(item);
                        const isSpecialTaxBase = item.specialTaxBase !== undefined && item.specialTaxBase !== null;
                        const isExempt = item.exemptionCode || item.vatRate === 0;

                        return (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="p-2">
                            <div className="space-y-1.5">
                              {invType === "purchase" ? (
                                <div className="space-y-1.5">
                                  <select
                                    value={item.expenseCategory || ""}
                                    onChange={(e) => {
                                      const selectedCat = e.target.value;
                                      handleItemChange(item.id, "expenseCategory", selectedCat);
                                      if (
                                        selectedCat &&
                                        (!item.description ||
                                          (EXPENSE_CATEGORIES as readonly string[]).includes(item.description) ||
                                          item.description === "Yazılım Danışmanlık ve Sistem Destek Hizmeti")
                                      ) {
                                        handleItemChange(item.id, "description", selectedCat);
                                      }
                                    }}
                                    className="w-full bg-amber-50/90 border border-amber-300 rounded-lg p-1.5 text-xs font-bold text-amber-950 focus:ring-2 focus:ring-amber-500"
                                  >
                                    <option value="">-- Masraf / Gider Kalemi Seçin ({EXPENSE_CATEGORIES.length} Kalem) --</option>
                                    {EXPENSE_CATEGORIES.map((cat) => (
                                      <option key={cat} value={cat}>
                                        {cat}
                                      </option>
                                    ))}
                                  </select>

                                  {/* Stok Rehberi Kutucuğu */}
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      id={`stock-directory-trigger-purchase-${item.id}`}
                                      onClick={() => {
                                        setTargetItemRowId(item.id);
                                        setIsProductPickerOpen(true);
                                      }}
                                      className="flex-1 flex items-center justify-between gap-2 px-2.5 py-1.5 bg-slate-50 hover:bg-purple-50/70 border border-slate-200 hover:border-purple-300 rounded-lg text-xs cursor-pointer transition-all shadow-2xs group text-left"
                                      title="Stok Rehberini Aç ve Ürün / Hizmet / Malzeme Seç"
                                    >
                                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                        <Package className="w-3.5 h-3.5 text-purple-600 shrink-0 group-hover:scale-110 transition-transform" />
                                        <span className="font-bold text-[11px] text-slate-700 shrink-0">Stok Rehberi:</span>
                                        <span className="text-[11px] text-slate-600 font-medium truncate">
                                          {item.productId
                                            ? (() => {
                                                const selProd = products.find((p) => p.id === item.productId);
                                                const qty = Number(selProd?.stockQuantity ?? selProd?.stock ?? 0);
                                                return `${selProd?.name || item.description || "Stok Seçildi"} (Stok: ${qty.toLocaleString("tr-TR")} ${selProd?.unit || "Adet"})`;
                                              })()
                                            : `Stok rehberinden seçin (${products.length} ürün • Top. ${products.reduce((s, p) => s + Number(p.stockQuantity ?? p.stock ?? 0), 0).toLocaleString("tr-TR")} adet)...`}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        {item.productId && (() => {
                                          const selProd = products.find((p) => p.id === item.productId);
                                          const qty = Number(selProd?.stockQuantity ?? selProd?.stock ?? 0);
                                          return (
                                            <>
                                              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded">
                                                {qty.toLocaleString("tr-TR")} {selProd?.unit || "Adet"}
                                              </span>
                                              <span className="text-[10px] font-mono font-bold text-purple-800 bg-purple-100 px-1.5 py-0.5 rounded">
                                                {selProd?.code || "Seçili"}
                                              </span>
                                            </>
                                          );
                                        })()}
                                        <span className="text-[10px] font-bold text-purple-700 bg-white border border-purple-200 group-hover:bg-purple-100 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs transition-colors">
                                          <Search className="w-2.5 h-2.5 text-purple-600" />
                                          <span>Rehber</span>
                                        </span>
                                      </div>
                                    </button>
                                    {item.productId && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleItemChange(item.id, "productId", "");
                                        }}
                                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                                        title="Stok seçimini temizle"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>

                                  <input
                                    type="text"
                                    required
                                    placeholder="Açıklama / Masraf Detayı (ör: Araç Yakıtı - 34 ABC 123 Plaka)"
                                    value={item.description}
                                    onChange={(e) =>
                                      handleItemChange(item.id, "description", e.target.value)
                                    }
                                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 placeholder-slate-400 font-medium"
                                  />
                                </div>
                              ) : (
                                <div className="space-y-1.5">
                                  {/* Stok Rehberi Kutucuğu */}
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      id={`stock-directory-trigger-${item.id}`}
                                      onClick={() => {
                                        setTargetItemRowId(item.id);
                                        setIsProductPickerOpen(true);
                                      }}
                                      className="flex-1 flex items-center justify-between gap-2 px-2.5 py-1.5 bg-slate-50 hover:bg-purple-50/70 border border-slate-200 hover:border-purple-300 rounded-lg text-xs cursor-pointer transition-all shadow-2xs group text-left"
                                      title="Stok Rehberini Aç ve Ürün/Hizmet Seç"
                                    >
                                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                        <Package className="w-3.5 h-3.5 text-purple-600 shrink-0 group-hover:scale-110 transition-transform" />
                                        <span className="font-bold text-[11px] text-slate-700 shrink-0">Stok Rehberi:</span>
                                        <span className="text-[11px] text-slate-600 font-medium truncate">
                                          {item.productId
                                            ? (() => {
                                                const selProd = products.find((p) => p.id === item.productId);
                                                const qty = Number(selProd?.stockQuantity ?? selProd?.stock ?? 0);
                                                return `${selProd?.name || item.description || "Stok Seçildi"} (Stok: ${qty.toLocaleString("tr-TR")} ${selProd?.unit || "Adet"})`;
                                              })()
                                            : `Stok rehberinden seçin (${products.length} ürün • Top. ${products.reduce((s, p) => s + Number(p.stockQuantity ?? p.stock ?? 0), 0).toLocaleString("tr-TR")} adet)...`}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        {item.productId && (() => {
                                          const selProd = products.find((p) => p.id === item.productId);
                                          const qty = Number(selProd?.stockQuantity ?? selProd?.stock ?? 0);
                                          return (
                                            <>
                                              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded">
                                                {qty.toLocaleString("tr-TR")} {selProd?.unit || "Adet"}
                                              </span>
                                              <span className="text-[10px] font-mono font-bold text-purple-800 bg-purple-100 px-1.5 py-0.5 rounded">
                                                {selProd?.code || "Seçili"}
                                              </span>
                                            </>
                                          );
                                        })()}
                                        <span className="text-[10px] font-bold text-purple-700 bg-white border border-purple-200 group-hover:bg-purple-100 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs transition-colors">
                                          <Search className="w-2.5 h-2.5 text-purple-600" />
                                          <span>Rehber</span>
                                        </span>
                                      </div>
                                    </button>
                                    {item.productId && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleItemChange(item.id, "productId", "");
                                        }}
                                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                                        title="Stok seçimini temizle"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>

                                  <input
                                    type="text"
                                    required
                                    placeholder="Açıklama (ör: Yazılım danışmanlık hizmeti)"
                                    value={item.description}
                                    onChange={(e) =>
                                      handleItemChange(item.id, "description", e.target.value)
                                    }
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 placeholder-slate-400 font-medium"
                                  />
                                </div>
                              )}
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

                          {/* İskonto Tutarı (TL) */}
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              placeholder="0,00"
                              value={item.discountAmount !== undefined && item.discountAmount !== null && item.discountAmount !== 0 ? item.discountAmount : ""}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "discountAmount",
                                  e.target.value
                                )
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-right font-mono font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:ring-2 focus:ring-purple-500/20"
                              title="İskonto Tutarı (TL)"
                            />
                          </td>

                          {/* İskonto Oranı (%) */}
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="any"
                              placeholder="%0"
                              value={item.discountRate !== undefined && item.discountRate !== null && item.discountRate !== 0 ? item.discountRate : ""}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "discountRate",
                                  e.target.value
                                )
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-center font-mono font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:ring-2 focus:ring-purple-500/20"
                              title="İskonto Oranı (%)"
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
                            {(() => {
                              const singleTotals = computeInvoiceTotals([item]);
                              return (
                                <div>
                                  <div>
                                    ₺{singleTotals.grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                  </div>
                                  {singleTotals.totalDiscount > 0 && (
                                    <div className="text-[9px] font-semibold text-rose-600 font-sans">
                                      -₺{singleTotals.totalDiscount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} İskonto
                                    </div>
                                  )}
                                  {singleTotals.totalExtraTaxes > 0 && (
                                    <div className="text-[9px] font-bold text-indigo-700 font-sans">
                                      +₺{singleTotals.totalExtraTaxes.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} Ek Vergi
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </td>

                          {/* Vergi, Tevkifat & Tekil Ek Vergi Ayar Butonları */}
                          <td className="p-2 text-center">
                            <div className="space-y-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setTaxModalItem(item);
                                  setTaxModalInitialTab(undefined);
                                }}
                                className={`w-full px-2 py-1.5 rounded-lg text-[11px] font-extrabold flex flex-col items-center justify-center gap-0.5 transition-all border cursor-pointer active:scale-95 ${
                                  withholdingBadge
                                    ? "bg-purple-100 text-purple-800 border-purple-300 shadow-2xs"
                                    : isSpecialTaxBase
                                    ? "bg-amber-100 text-amber-800 border-amber-300 shadow-2xs"
                                    : isExempt
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                    : "bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-700 border-slate-200"
                                }`}
                                title="Kalem Vergi, Tevkifat ve Özel Matrah Ayarlarını Aç"
                              >
                                <div className="flex items-center gap-1">
                                  <Sliders className="w-3 h-3" />
                                  <span>
                                    {withholdingBadge
                                      ? withholdingBadge
                                      : isSpecialTaxBase
                                      ? "Özel Matrah"
                                      : isExempt
                                      ? "İstisna"
                                      : "Ayarlar"}
                                  </span>
                                </div>
                                {withholdingBadge && (
                                  <span className="text-[9px] font-normal text-purple-700">Tevkifatlı</span>
                                )}
                              </button>

                              {/* Tekli Kalem İçin GİB Listesinden Ek Vergi Ekleme Butonu */}
                              <button
                                type="button"
                                onClick={() => {
                                  setTaxModalItem(item);
                                  setTaxModalInitialTab("ek_vergiler");
                                }}
                                className={`w-full px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center justify-center gap-1 transition-all border cursor-pointer active:scale-95 ${
                                  item.additionalTaxes && item.additionalTaxes.length > 0
                                    ? "bg-indigo-100 text-indigo-900 border-indigo-300 shadow-2xs"
                                    : "bg-white hover:bg-indigo-50 text-indigo-700 border-dashed border-indigo-300"
                                }`}
                                title="Bu kaleme GİB ek vergi listesinden (ÖTV, ÖİV, Damga vb.) vergi ekle"
                              >
                                <Plus className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">
                                  {item.additionalTaxes && item.additionalTaxes.length > 0
                                    ? `${item.additionalTaxes.length} Ek Vergi`
                                    : "+ Ek Vergi"}
                                </span>
                              </button>
                            </div>
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Calculations Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end pt-2">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Fatura Alt Notu / Şartlar & Yasal Şerhler
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {invType === "sales" && selectedBranchNoteLine && (
                          <button
                            type="button"
                            onClick={() =>
                              setNotes((prev) => syncBranchAddressIntoNotes(prev, selectedBranchNoteLine))
                            }
                            className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-all"
                            title={
                              !isMainBranchSelected
                                ? "Merkez adresini not alanına yansıt / güncelle"
                                : "Şube adresini not alanına yansıt / güncelle"
                            }
                          >
                            <MapPin className="w-3 h-3" />
                            <span>
                              {!isMainBranchSelected
                                ? "Merkez Adresini Nota Yansıt"
                                : "Şube Adresini Nota Yansıt"}
                            </span>
                          </button>
                        )}
                        {(() => {
                          const legalNotes = generateInvoiceLegalTaxNotes(items, invoiceProfileType);
                          if (legalNotes.length === 0) return null;
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                setNotes((prevNotes) => {
                                  let n = prevNotes.trim();
                                  legalNotes.forEach((ln) => {
                                    if (!n.includes(ln)) {
                                      n = n ? `${n}\n${ln}` : ln;
                                    }
                                  });
                                  return n;
                                });
                              }}
                              className="text-[10px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-0.5 rounded cursor-pointer transition-all"
                            >
                              + Yasal Şerhleri Notlara Aktar
                            </button>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Gelir Faturası Kesilirken Not Kısmı Üzerinden Hızlı Şube Seçimi & Otomatik Merkez/Şube Adresi */}
                    {invType === "sales" && (
                      <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200 space-y-1.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-[11px] font-extrabold text-purple-950 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span>Faturanın Kesildiği Şube:</span>
                          </span>
                          <select
                            value={selectedCompanyBranch?.id || selectedBranchId}
                            onChange={(e) => {
                              setSelectedBranchId(e.target.value);
                              setCustomBranchAddressOverride("");
                            }}
                            className="bg-white border border-purple-300 focus:border-purple-600 rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-900 cursor-pointer shadow-2xs"
                          >
                            {effectiveBranchesList
                              .filter((b) => b.status !== "passive" || b.id === selectedBranchId)
                              .map((b) => {
                                const brCity = b.address?.city || "";
                                const brDist = b.address?.district || "";
                                const locStr = [brDist, brCity].filter(Boolean).join("/");
                                return (
                                  <option key={b.id} value={b.id}>
                                    🏬 [ŞUBE] {b.name} ({b.code}){locStr ? ` - ${locStr}` : ""}
                                  </option>
                                );
                              })}
                          </select>
                        </div>
                        {selectedBranchNoteLine && (
                          <div className="text-[10px] text-purple-900 flex items-start gap-1.5">
                            <MapPin className="w-3 h-3 text-purple-600 shrink-0 mt-0.5" />
                            <span>
                              <strong>
                                {!isMainBranchSelected
                                  ? "Not Kısmına Gelen Merkez Adresi:"
                                  : "Not Kısmına Gelen Şube Adresi:"}
                              </strong>{" "}
                              {selectedBranchNoteLine}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium"
                      placeholder="Seçilen şube adresi buraya otomatik gelir. Ayrıca ödeme koşulları, banka hesap/IBAN bilgileri veya fatura notlarınızı ekleyebilirsiniz..."
                    />

                    {/* GİB Resmi Vergi Notları ve Şerhleri Özeti (Tevkifat, Özel Matrah, İstisna, İhraç Kayıtlı) */}
                    {(() => {
                      const legalNotes = generateInvoiceLegalTaxNotes(items, invoiceProfileType);
                      if (legalNotes.length === 0) return null;
                      return (
                        <div className="p-2.5 bg-purple-50/70 border border-purple-200 rounded-xl text-[11px] text-purple-950 space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase text-purple-900 tracking-wider">
                            <span>GİB Resmi Vergi Şerhleri & Oranları:</span>
                            <span className="bg-purple-200/80 text-purple-900 px-1.5 py-0.2 rounded text-[9px]">
                              Mevzuata Uygun
                            </span>
                          </div>
                          <div className="space-y-1 text-slate-700">
                            {legalNotes.map((note, idx) => (
                              <div key={idx} className="flex items-start gap-1.5 leading-snug">
                                <span className="font-bold text-purple-700 shrink-0">•</span>
                                <span className="font-medium">{note}</span>
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px] text-purple-800 font-semibold pt-0.5">
                            * Bu açıklamalar ve oranlar e-Fatura / e-Arşiv faturanızın resmi alt notuna otomatik olarak yansıtılacaktır.
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {(() => {
                  const totals = calculateTotals();
                  return (
                    <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-2 text-xs">
                      {totals.totalDiscount > 0 && (
                        <>
                          <div className="flex justify-between text-slate-500">
                            <span>Brüt Tutar (İskonto Öncesi):</span>
                            <span className="font-mono font-bold text-slate-800">
                              ₺{totals.grossTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex justify-between text-rose-700 bg-rose-50 p-1.5 rounded-lg border border-rose-100 font-medium">
                            <span className="font-bold">(-) Toplam İskonto:</span>
                            <span className="font-mono font-bold">
                              -₺{totals.totalDiscount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </>
                      )}

                      <div className="flex justify-between text-slate-500">
                        <span>{totals.totalDiscount > 0 ? "Ara Toplam (Net KDV Hariç):" : "Ara Toplam (KDV Hariç):"}</span>
                        <span className="font-mono font-bold text-slate-800">
                          ₺{totals.subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {totals.effectiveTaxableAmount !== totals.subtotal && (
                        <div className="flex justify-between text-amber-700 bg-amber-50 p-1.5 rounded-lg border border-amber-200 font-medium">
                          <span>Özel KDV Matrahı:</span>
                          <span className="font-mono font-bold">
                            ₺{totals.effectiveTaxableAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between text-slate-500">
                        <span>Toplam Hesaplanan KDV:</span>
                        <span className="font-mono font-bold text-slate-800">
                          ₺{totals.totalVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {totals.totalWithholding > 0 && (
                        <div className="flex justify-between text-purple-700 font-medium bg-purple-50 p-1.5 rounded-lg border border-purple-100">
                          <span className="font-bold">(-) Tevkif Edilen KDV:</span>
                          <span className="font-mono font-bold">
                            -₺{totals.totalWithholding.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                        <span>Fatura Genel Toplamı:</span>
                        <span className="font-mono font-bold">
                          ₺{totals.grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-sm font-black">
                        <span className="text-slate-900">🎯 ÖDENECEK / TAHSİL EDİLECEK:</span>
                        <span className="text-indigo-600 font-mono text-base">
                          ₺{totals.payableAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="pt-3 flex flex-col gap-3 border-t border-slate-200">
                {/* Ödeme / Tahsilat Yöntemi ve Vade Günleri (Listbox) */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Sol Sütun: Ödeme / Tahsilat Yöntemi Listbox */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                          <Wallet className="w-4 h-4 text-purple-600" />
                          <span>Ödeme / Tahsilat Yöntemi:</span>
                        </label>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                            paymentMethod === "nakit"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : paymentMethod === "kredi_karti"
                              ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                              : paymentMethod === "eft_havale"
                              ? "bg-sky-50 text-sky-800 border-sky-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {paymentMethod === "nakit"
                            ? "Nakit (Peşin)"
                            : paymentMethod === "kredi_karti"
                            ? "Kredi Kartı (POS)"
                            : paymentMethod === "eft_havale"
                            ? "EFT & Havale"
                            : "Cari (Vadeli)"}
                        </span>
                      </div>
                      <select
                        value={paymentMethod}
                        onChange={(e) => {
                          const nextMethod = e.target.value as InvoicePaymentMethod;
                          if (nextMethod === "nakit") {
                            setPaymentMethod("nakit");
                            setDueDate(issueDate);
                            const cashAcc = accounts.find((a) => a.type === "cash") || accounts[0];
                            if (cashAcc) setPaymentAccountId(cashAcc.id);
                          } else if (nextMethod === "cari") {
                            setPaymentMethod("cari");
                          } else if (nextMethod === "kredi_karti") {
                            setPaymentMethod("kredi_karti");
                            setDueDate(issueDate);
                            const posOrBankAcc =
                              accounts.find(
                                (a) => a.type === "credit_card" || a.type === "pos" || a.type === "bank"
                              ) || accounts[0];
                            if (posOrBankAcc) setPaymentAccountId(posOrBankAcc.id);
                          } else if (nextMethod === "eft_havale") {
                            setPaymentMethod("eft_havale");
                            setDueDate(issueDate);
                            const bankAcc = accounts.find((a) => a.type === "bank") || accounts[0];
                            if (bankAcc) {
                              setPaymentAccountId(bankAcc.id);
                              if (bankAcc.iban) {
                                setPaymentIban(bankAcc.iban);
                              } else if (!paymentIban) {
                                setPaymentIban(companySettings.defaultBankIban || companySettings.iban || "");
                              }
                            }
                          }
                        }}
                        className="w-full bg-slate-50 hover:bg-white border border-slate-200 focus:border-purple-500 rounded-xl p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-2xs cursor-pointer"
                      >
                        <option value="cari">Cari — Açık Hesap / Vadeli (Müşteri Cari Bakiyesine İşlenir)</option>
                        <option value="nakit">Nakit — Peşin / Kasa Tahsilatı (Anında Ödendi Kapatılır)</option>
                        <option value="kredi_karti">Kredi Kartı — POS / Banka Tahsilatı (Anında Ödendi Kapatılır)</option>
                        <option value="eft_havale">EFT & Havale — Banka Transferi / IBAN (Anında Ödendi Kapatılır)</option>
                      </select>
                    </div>

                    {/* Sağ Sütun: Vade Günleri Listbox */}
                    <div className="space-y-1.5">
                      {(() => {
                        const presetDays = [0, 7, 10, 15, 30, 45, 60, 90, 120];
                        let dayDiff: number | null = null;
                        if (issueDate && dueDate) {
                          const p1 = issueDate.split("-").map(Number);
                          const p2 = dueDate.split("-").map(Number);
                          if (p1.length === 3 && p2.length === 3) {
                            const u1 = Date.UTC(p1[0], (p1[1] || 1) - 1, p1[2] || 1);
                            const u2 = Date.UTC(p2[0], (p2[1] || 1) - 1, p2[2] || 1);
                            if (!isNaN(u1) && !isNaN(u2)) {
                              dayDiff = Math.round((u2 - u1) / (24 * 60 * 60 * 1000));
                            }
                          }
                        }
                        const selectVal =
                          dayDiff !== null && presetDays.includes(dayDiff)
                            ? String(dayDiff)
                            : "custom";
                        return (
                          <>
                            <div className="flex items-center justify-between gap-2">
                              <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-amber-600" />
                                <span>Vade Günü (Hızlı Vade Seçimi):</span>
                              </label>
                              <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200">
                                Vade: {dueDate ? formatDate(dueDate) : "—"}
                              </span>
                            </div>
                            <select
                              value={selectVal}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "custom") return;
                                const days = parseInt(val, 10);
                                if (isNaN(days)) return;
                                const baseStr = issueDate || new Date().toISOString().split("T")[0];
                                const p = baseStr.split("-").map(Number);
                                if (p.length === 3) {
                                  const baseUtc = Date.UTC(p[0], (p[1] || 1) - 1, p[2] || 1);
                                  const targetUtc = new Date(baseUtc + days * 24 * 60 * 60 * 1000);
                                  if (!isNaN(targetUtc.getTime())) {
                                    setDueDate(targetUtc.toISOString().split("T")[0]);
                                  }
                                }
                              }}
                              className="w-full bg-slate-50 hover:bg-white border border-slate-200 focus:border-purple-500 rounded-xl p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-2xs cursor-pointer"
                            >
                              <option value="0">Aynı Gün (0 Gün / Peşin)</option>
                              <option value="7">+7 Gün Vadeli</option>
                              <option value="10">+10 Gün Vadeli</option>
                              <option value="15">+15 Gün Vadeli</option>
                              <option value="30">+30 Gün Vadeli</option>
                              <option value="45">+45 Gün Vadeli</option>
                              <option value="60">+60 Gün Vadeli</option>
                              <option value="90">+90 Gün Vadeli</option>
                              <option value="120">+120 Gün Vadeli</option>
                              {selectVal === "custom" && (
                                <option value="custom">
                                  Özel Vade Tarihi{dayDiff !== null ? ` (${dayDiff >= 0 ? `+${dayDiff}` : dayDiff} Gün)` : ""}
                                </option>
                              )}
                            </select>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Seçilen Ödeme Yöntemine Göre Kasa / Banka / EFT-Havale / Vade Detay Alanı */}
                  {paymentMethod === "nakit" || paymentMethod === "kredi_karti" ? (
                    <div
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        paymentMethod === "nakit"
                          ? "bg-emerald-50/60 border-emerald-200"
                          : "bg-indigo-50/60 border-indigo-200"
                      }`}
                    >
                      <div className="flex-1 min-w-[220px]">
                        <label
                          className={`block text-[11px] font-bold mb-1 ${
                            paymentMethod === "nakit" ? "text-emerald-950" : "text-indigo-950"
                          }`}
                        >
                          {paymentMethod === "nakit"
                            ? "Nakit Tahsilatın İşleneceği Kasa / Hesap *"
                            : "Kredi Kartı (POS) Tahsilatının İşleneceği Banka / Hesap *"}
                        </label>
                        {accounts.length > 0 ? (
                          <select
                            value={paymentAccountId}
                            onChange={(e) => setPaymentAccountId(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 shadow-2xs"
                          >
                            {accounts.map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                {acc.name} ({acc.type === "cash" ? "Kasa" : acc.type === "bank" ? "Banka" : "POS / Kart"} • Bakiye: ₺
                                {acc.balance.toLocaleString("tr-TR", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                                )
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-xs font-semibold text-slate-600 bg-white px-3 py-2 rounded-xl border border-slate-200">
                            Varsayılan Kasa / POS Hesabı (Otomatik Ödendi Olarak İşlenir)
                          </div>
                        )}
                      </div>
                      <div
                        className={`text-[11px] font-semibold sm:max-w-xs leading-relaxed ${
                          paymentMethod === "nakit" ? "text-emerald-800" : "text-indigo-800"
                        }`}
                      >
                        ✓ Fatura kesildiğinde{" "}
                        <strong>
                          {paymentMethod === "nakit" ? "Nakit" : "Kredi Kartı"}
                        </strong>{" "}
                        olarak tahsil edilmiş sayılır ve fatura durumu{" "}
                        <strong>Ödendi</strong> olarak kaydedilir.
                      </div>
                    </div>
                  ) : paymentMethod === "eft_havale" ? (
                    <div className="p-3.5 rounded-xl border bg-sky-50/70 border-sky-200 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-200/70 pb-2">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-sky-950">
                          <Landmark className="w-4 h-4 text-sky-600" />
                          <span>EFT & Havale Yönetimi (Banka Transferi & IBAN)</span>
                        </div>
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-sky-900 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={includeIbanInNotes}
                            onChange={(e) => setIncludeIbanInNotes(e.target.checked)}
                            className="rounded border-sky-300 text-sky-600 focus:ring-sky-500"
                          />
                          <span>IBAN bilgisini fatura açıklamasına otomatik ekle</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-sky-950 mb-1">
                            EFT / Havale Tahsilatının İşleneceği Banka Hesabı *
                          </label>
                          {accounts.length > 0 ? (
                            <select
                              value={paymentAccountId}
                              onChange={(e) => {
                                const nextId = e.target.value;
                                setPaymentAccountId(nextId);
                                const selectedAcc = accounts.find((a) => a.id === nextId);
                                if (selectedAcc?.iban) {
                                  setPaymentIban(selectedAcc.iban);
                                }
                                if (selectedAcc?.accountHolderName || selectedAcc?.name) {
                                  setPaymentAccountHolderName(
                                    selectedAcc.accountHolderName ||
                                      companySettings.defaultBankAccountName ||
                                      companySettings.companyTitle ||
                                      companySettings.companyName ||
                                      selectedAcc.name
                                  );
                                }
                              }}
                              className="w-full bg-white border border-sky-200 rounded-xl p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-sky-500/20 shadow-2xs"
                            >
                              {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.name} ({acc.type === "bank" ? "Banka" : acc.type === "cash" ? "Kasa" : "POS / Kart"}
                                  {acc.iban ? ` • ${acc.iban}` : ""} • Bakiye: ₺
                                  {acc.balance.toLocaleString("tr-TR", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                  )
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="text-xs font-semibold text-slate-600 bg-white px-3 py-2 rounded-xl border border-slate-200">
                              Varsayılan Banka Hesabı (Otomatik Ödendi Olarak İşlenir)
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-sky-950 mb-1">
                            Banka Hesap Adı (Alıcı / Hesap Sahibi Ünvanı)
                          </label>
                          <input
                            type="text"
                            value={paymentAccountHolderName}
                            onChange={(e) => setPaymentAccountHolderName(e.target.value)}
                            placeholder={
                              companySettings.defaultBankAccountName ||
                              companySettings.companyTitle ||
                              companySettings.companyName ||
                              "Örn: Şirket Ticari Ünvanı / Hesap Adı"
                            }
                            className="w-full bg-white border border-sky-200 rounded-xl p-2 text-xs font-bold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-sky-500/20 shadow-2xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-sky-950 mb-1">
                            Faturada Görünecek Banka / IBAN Numarası
                          </label>
                          <input
                            type="text"
                            value={paymentIban}
                            onChange={(e) => setPaymentIban(e.target.value)}
                            placeholder="TR00 0000 0000 0000 0000 0000 00"
                            className="w-full bg-white border border-sky-200 rounded-xl p-2 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-sky-500/20 shadow-2xs"
                          />
                        </div>
                      </div>

                      <div className="text-[11px] font-semibold text-sky-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span>
                          Fatura kesildiğinde <strong>EFT & Havale</strong> olarak seçilen banka hesabına tahsil edilmiş sayılır ve fatura durumu <strong>Ödendi</strong> olarak kaydedilir.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-amber-900">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>
                          Fatura tutarı cari hesaba <strong>Açık Bakiye (Vadeli)</strong> olarak kaydedilir.
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-800">
                        Son Ödeme (Vade) Tarihi: <strong>{dueDate ? formatDate(dueDate) : "—"}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {invType === "sales" && formDocKind === "invoice" && (!editingInvoiceId || isEditingDraft) && (
                  <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-3 space-y-2">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sendToMysoft}
                        onChange={(event) => {
                          const checked = event.target.checked;
                          setSendToMysoft(checked);
                          setIsManualInvoiceNumber(false);
                          if (checked) {
                            const targetDocType: "e_fatura" | "e_arsiv" =
                              recipientStatus !== null
                                ? recipientStatus.isEFaturaUser
                                  ? "e_fatura"
                                  : "e_arsiv"
                                : isCurrentSalesEArsiv
                                  ? "e_arsiv"
                                  : "e_fatura";
                            setMysoftEDocType(targetDocType);
                            if (targetDocType === "e_arsiv") {
                              setInvoiceScenario("EARSIVFATURA");
                            } else if (invoiceScenario === "EARSIVFATURA") {
                              setInvoiceScenario("TICARIFATURA");
                            }
                            const nextSequentialNo =
                              computeMysoftSequentialNumber(targetDocType);
                            setInvoiceNumberInput(nextSequentialNo);
                            void fetchAndApplyNextInvoiceNumber(
                              mysoftTenantVkn,
                              targetDocType,
                            );
                          } else {
                            setInvoiceNumberInput(activeGyrNextNo);
                          }
                        }}
                        className="mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span>
                        <span className="block text-xs font-bold text-purple-950">
                          Resmi e-fatura / e-arşiv olarak kes (Mysoft)
                        </span>
                        <span className="block text-[11px] text-purple-800/80 mt-0.5">
                          {sendToMysoft
                            ? "Faturanız resmi e-Fatura veya e-Arşiv şablonuyla ardışık numaralandırılarak kaydedilir ve Giden e-Faturalara aktarılır."
                            : "Seçilmediğinde fatura GYR ön eki ile ardışık numaralandırılarak (Örn: " +
                              activeGyrNextNo +
                              ") kaydedilir ve Giden e-Faturalara aktarılır."}
                        </span>
                      </span>
                    </label>
                    {sendToMysoft && (
                      <div className="pl-6 space-y-3">
                        <MysoftTenantPicker
                          value={mysoftTenantVkn}
                          variant="compact"
                          hideWhenMatched={true}
                          hintVkn={
                            companySettings.tenantIdentifierNumber ||
                            companySettings.taxNumber ||
                            companySettings.vknTckn ||
                            companySettings.mysoftCredentials?.tenantIdentifierNumber
                          }
                          onSelect={handleTenantSelect}
                        />
                        {/* Live GİB Recipient Taxpayer Status Card */}
                        {isCheckingRecipient ? (
                          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-xs text-slate-600">
                            <span className="w-3.5 h-3.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                            <span>Alıcı GİB e-Fatura mükellefiyeti sorgulanıyor...</span>
                          </div>
                        ) : recipientStatus ? (
                          recipientStatus.isEFaturaUser ? (
                            <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                  🟢 GİB e-Fatura Mükellefi (Otomatik Algılandı)
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-200 text-emerald-800">
                                  e-Fatura Zorunlu
                                </span>
                              </div>
                              <p className="text-[11px] text-emerald-700">
                                Alıcı vergi kimlik numarası GİB sistemine kayıtlıdır. Fatura doğrudan UBL posta kutusuna iletilecektir.
                              </p>
                              {recipientStatus.pkAlias && (
                                <div className="text-[10px] font-mono text-emerald-800 bg-white/70 border border-emerald-200 px-2 py-0.5 rounded inline-block">
                                  Posta Kutusu: {recipientStatus.pkAlias}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-2.5 bg-sky-50/80 border border-sky-200 rounded-xl space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-xs font-bold text-sky-900">
                                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                                  🔵 e-Arşiv Fatura Alıcısı
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-sky-200 text-sky-800">
                                  e-Arşiv
                                </span>
                              </div>
                              <p className="text-[11px] text-sky-700">
                                Alıcının GİB e-Fatura kaydı bulunmamaktadır (Şahıs / Nihai Tüketici / e-Faturaya geçmemiş). Belge resmi e-Arşiv Fatura olarak düzenlenecektir.
                              </p>
                            </div>
                          )
                        ) : null}

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEDocTypeChange("e_fatura")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                              !isCurrentSalesEArsiv
                                ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <span>e-Fatura</span>
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                                !isCurrentSalesEArsiv
                                  ? "bg-purple-800/60 text-purple-100"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {selectedEFaturaPrefix}
                            </span>
                            {recipientStatus?.isEFaturaUser && (
                              <span className="text-[9px] bg-emerald-400 text-emerald-950 px-1 py-0.2 rounded font-extrabold">Önerilen</span>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEDocTypeChange("e_arsiv")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                              isCurrentSalesEArsiv
                                ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <span>e-Arşiv</span>
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                                isCurrentSalesEArsiv
                                  ? "bg-purple-800/60 text-purple-100"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {selectedEArsivPrefix}
                            </span>
                            {recipientStatus && !recipientStatus.isEFaturaUser && (
                              <span className="text-[9px] bg-sky-300 text-sky-950 px-1 py-0.2 rounded font-extrabold">Önerilen</span>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setIsSignatureStudioOpen(true)}
                            className="px-3 py-1.5 rounded-lg text-xs font-extrabold border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ml-auto"
                            title="e-Arşiv fatura için ıslak imza çiz, bilgisayarından imza/kaşe yükle veya otomatik kaligrafik imza oluştur"
                          >
                            <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                            <span>
                              {companySettings.invoiceDesign?.signatureImageUrl || companySettings.stampUrl
                                ? "e-Arşiv İmza & Kaşe Düzenle"
                                : "e-Arşiv İmza & Kaşe Ekle"}
                            </span>
                            {(companySettings.invoiceDesign?.signatureImageUrl || companySettings.stampUrl) && (
                              <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-extrabold">
                                Hazır
                              </span>
                            )}
                          </button>
                        </div>

                        {isCurrentSalesEArsiv && (
                          <div className="bg-indigo-50/70 border border-indigo-200/90 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {companySettings.invoiceDesign?.signatureImageUrl || companySettings.stampUrl ? (
                                <div className="h-9 px-2 bg-white border border-indigo-200 rounded-lg flex items-center justify-center shrink-0">
                                  <img
                                    src={companySettings.invoiceDesign?.signatureImageUrl || companySettings.stampUrl}
                                    alt="e-Arşiv İmza"
                                    className="max-h-7 max-w-[90px] object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                                  <PenTool className="w-4 h-4" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="text-[11px] font-extrabold text-indigo-950 flex items-center gap-1.5">
                                  <span>e-Arşiv Fatura İmza & Kaşe Ayarı</span>
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-200/80 text-indigo-900 font-bold">
                                    {companySettings.invoiceDesign?.signatureImageUrl || companySettings.stampUrl
                                      ? "Görsel İmza Aktif"
                                      : "Dijital Onay Mührü"}
                                  </span>
                                </div>
                                <p className="text-[10px] text-indigo-700 truncate">
                                  {companySettings.invoiceDesign?.signerName
                                    ? `İmzalayan: ${companySettings.invoiceDesign.signerName}${
                                        companySettings.invoiceDesign.signerTitle
                                          ? ` (${companySettings.invoiceDesign.signerTitle})`
                                          : ""
                                      }`
                                    : "GİB e-Arşiv standartlarına uygun canlı imza çizebilir, imza/kaşe görseli yükleyebilir veya otomatik imza üretebilirsiniz."}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsSignatureStudioOpen(true)}
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-extrabold flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                            >
                              <PenTool className="w-3 h-3" />
                              <span>İmza Stüdyosunu Aç</span>
                            </button>
                          </div>
                        )}

                        {/* Mysoft e-Fatura ve e-Arşiv Seri / Ardışık Fatura Numarası Kartı */}
                        <div className="bg-white/95 border border-purple-200/80 rounded-xl p-3 space-y-2.5 shadow-2xs">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-1.5">
                              <Hash className="w-3.5 h-3.5 text-purple-600" />
                              <span className="text-xs font-extrabold text-slate-800">
                                Mysoft e-Fatura & e-Arşiv Seri ve Ardışık Fatura Numaraları
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setIsManualInvoiceNumber(false);
                                refreshMysoftSerialNumbers(mysoftTenantVkn);
                              }}
                              disabled={isLoadingMysoftSeries}
                              className="text-[10px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                              title="Mysoft portalından tanımlı e-Fatura ve e-Arşiv seri numaralarını yeniden sorgula"
                            >
                              <RefreshCw className={`w-3 h-3 ${isLoadingMysoftSeries ? "animate-spin" : ""}`} />
                              <span>{isLoadingMysoftSeries ? "Sorgulanıyor..." : "Mysoft'tan Seri/No Al"}</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {/* e-Fatura Seri & Ardışık No */}
                            <div
                              onClick={() => {
                                setMysoftEDocType("e_fatura");
                                if (invoiceScenario === "EARSIVFATURA") {
                                  setInvoiceScenario("TICARIFATURA");
                                }
                                setIsManualInvoiceNumber(false);
                                setInvoiceNumberInput(
                                  computeMysoftSequentialNumber("e_fatura"),
                                );
                                void fetchAndApplyNextInvoiceNumber(
                                  mysoftTenantVkn,
                                  "e_fatura",
                                );
                              }}
                              className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                                !isCurrentSalesEArsiv
                                  ? "bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300"
                                  : "bg-slate-50/70 border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                                  <span className={`w-1.5 h-1.5 rounded-full ${!isCurrentSalesEArsiv ? "bg-emerald-500" : "bg-slate-400"}`} />
                                  <span>e-Fatura Serisi</span>
                                </span>
                                {!isCurrentSalesEArsiv && (
                                  <span className="text-[9px] font-extrabold bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded">
                                    Aktif Seri
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  maxLength={3}
                                  value={selectedEFaturaPrefix}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    const p = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
                                    setSelectedEFaturaPrefix(p);
                                    setIsManualInvoiceNumber(false);
                                  }}
                                  className="w-14 bg-white border border-slate-200 rounded-md px-1.5 py-1 text-xs font-mono font-extrabold text-center text-slate-900 uppercase"
                                  title="Mysoft e-Fatura 3 harfli ön ek (seri)"
                                />
                                <div className="flex-1 bg-white border border-slate-200 rounded-md px-2 py-1 text-xs font-mono font-bold text-slate-900 truncate">
                                  {activeEFaturaNextNo}
                                </div>
                              </div>
                              {mysoftMappingDefaults?.eFaturaLastNumber && (
                                <p className="mt-1 text-[10px] text-emerald-800 font-mono truncate">
                                  Son: {mysoftMappingDefaults.eFaturaLastNumber} → Sıradaki: {activeEFaturaNextNo}
                                </p>
                              )}
                            </div>

                            {/* e-Arşiv Seri & Ardışık No */}
                            <div
                              onClick={() => {
                                setMysoftEDocType("e_arsiv");
                                setInvoiceScenario("EARSIVFATURA");
                                setIsManualInvoiceNumber(false);
                                setInvoiceNumberInput(
                                  computeMysoftSequentialNumber("e_arsiv"),
                                );
                                void fetchAndApplyNextInvoiceNumber(mysoftTenantVkn, "e_arsiv");
                              }}
                              className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                                isCurrentSalesEArsiv
                                  ? "bg-sky-50/70 border-sky-300 ring-1 ring-sky-300"
                                  : "bg-slate-50/70 border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                                  <span className={`w-1.5 h-1.5 rounded-full ${isCurrentSalesEArsiv ? "bg-sky-500" : "bg-slate-400"}`} />
                                  <span>e-Arşiv Serisi</span>
                                </span>
                                {isCurrentSalesEArsiv && (
                                  <span className="text-[9px] font-extrabold bg-sky-200 text-sky-900 px-1.5 py-0.2 rounded">
                                    Aktif Seri
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  maxLength={3}
                                  value={selectedEArsivPrefix}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    const p = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
                                    setSelectedEArsivPrefix(p);
                                    setIsManualInvoiceNumber(false);
                                  }}
                                  className="w-14 bg-white border border-slate-200 rounded-md px-1.5 py-1 text-xs font-mono font-extrabold text-center text-slate-900 uppercase"
                                  title="Mysoft e-Arşiv 3 harfli ön ek (seri)"
                                />
                                <div className="flex-1 bg-white border border-slate-200 rounded-md px-2 py-1 text-xs font-mono font-bold text-slate-900 truncate">
                                  {activeEArsivNextNo}
                                </div>
                              </div>
                              {mysoftMappingDefaults?.eArsivLastNumber && (
                                <p className="mt-1 text-[10px] text-sky-800 font-mono truncate">
                                  Son: {mysoftMappingDefaults.eArsivLastNumber} → Sıradaki: {activeEArsivNextNo}
                                </p>
                              )}
                            </div>
                          </div>

                          {mysoftMappingDefaults?.prefixes && mysoftMappingDefaults.prefixes.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              <span className="text-[10px] font-semibold text-slate-500">
                                Mysoft Tanımlı Ön Ekler:
                              </span>
                              {mysoftMappingDefaults.prefixes.map((p, idx) => {
                                const pfx = String(p.prefix || "").toUpperCase();
                                const isEArs =
                                  Number(p.edocumentType) === 2 ||
                                  String(p.edocumentType || "").toUpperCase().includes("ARSIV");
                                return (
                                  <button
                                    key={`${pfx}_${idx}`}
                                    type="button"
                                    onClick={() => {
                                      if (isEArs) {
                                        setSelectedEArsivPrefix(pfx);
                                        setMysoftEDocType("e_arsiv");
                                        setInvoiceScenario("EARSIVFATURA");
                                      } else {
                                        setSelectedEFaturaPrefix(pfx);
                                        setMysoftEDocType("e_fatura");
                                        if (invoiceScenario === "EARSIVFATURA") {
                                          setInvoiceScenario("TICARIFATURA");
                                        }
                                      }
                                      setIsManualInvoiceNumber(false);
                                    }}
                                    className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-900 border border-slate-200 cursor-pointer transition-colors"
                                  >
                                    {pfx} ({isEArs ? "e-Arşiv" : "e-Fatura"})
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {mysoftSaveError && (
                      <div className="ml-6 mt-2 rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-rose-900 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[11px] font-bold text-rose-800">
                            Mysoft Gönderim Kontrolü & Hata Detayı
                          </p>
                          {mysoftDiagnosticLog && (
                            <span className="text-[10px] font-mono text-rose-600">
                              {new Date(mysoftDiagnosticLog.timestamp).toLocaleTimeString("tr-TR")}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-semibold text-rose-700 leading-relaxed">
                          {mysoftSaveError}
                        </p>
                        {mysoftValidationIssues.length > 0 && (
                          <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-rose-800">
                            {mysoftValidationIssues.map((issue, idx) => (
                              <li key={`${issue.code}_${idx}`}>
                                <span className="font-mono font-bold text-[10px] mr-1">
                                  [{issue.field}]
                                </span>
                                {issue.message}
                              </li>
                            ))}
                          </ul>
                        )}
                        {mysoftDiagnosticLog && (
                          <div className="pt-1.5 mt-1 border-t border-rose-200/80 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono text-rose-700">
                            <span>
                              Mükellef VKN: {mysoftDiagnosticLog.tenantIdentifierNumber || "Eksik"}
                            </span>
                            <span>
                              Alıcı VKN/TCKN: {mysoftDiagnosticLog.buyerVknTckn || "Eksik"}
                            </span>
                            <span>
                              Kalem: {mysoftDiagnosticLog.lineCount} adet
                            </span>
                            <span>
                              Dip Toplam Nesnesi:{" "}
                              {mysoftDiagnosticLog.nullGuard.hasInvoiceCalculationObject
                                ? "Tamam"
                                : "Eksik"}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    {mysoftSaveNotice && (
                      <p className="text-[11px] font-semibold text-emerald-700 pl-6">{mysoftSaveNotice}</p>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingInvoiceId(null);
                      setEditingInvoiceNumber(null);
                      setMysoftSaveError(null);
                      setIsCreateModalOpen(false);
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer"
                  >
                    Vazgeç / İptal
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDraftPreviewOpen(true)}
                    className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-indigo-600" />
                    <span>
                      {formDocKind === "receipt" ? "Fişi Önizle" : "Faturayı Önizle"}
                    </span>
                  </button>
                  {(!editingInvoiceId || isEditingDraft) && (
                    <button
                      type="button"
                      onClick={handleSaveDraftClick}
                      disabled={isSavingMysoft}
                      className="px-5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                      title="Bilgileri girilmiş faturayı resmi kesim yapmadan taslak olarak kaydeder; daha sonra istediğiniz zaman düzenleyebilirsiniz."
                    >
                      <Save className="w-4 h-4 text-amber-600" />
                      <span>{isEditingDraft ? "Taslağı Güncelle" : "Taslak Olarak Kaydet"}</span>
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSavingMysoft}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm cursor-pointer disabled:opacity-60 flex items-center gap-2 transition-all active:scale-95 ${
                      forcedType === "purchase" || invType === "purchase"
                        ? formDocKind === "receipt"
                          ? "bg-orange-600 hover:bg-orange-700"
                          : "bg-amber-600 hover:bg-amber-700"
                        : formDocKind === "receipt"
                        ? "bg-indigo-600 hover:bg-indigo-700"
                        : "bg-purple-600 hover:bg-purple-700"
                    }`}
                  >
                    {isSavingMysoft && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingInvoiceId && !isEditingDraft
                      ? "Değişiklikleri Güncelle & Kaydet"
                      : forcedType === "sales" || invType === "sales"
                        ? formDocKind === "receipt"
                          ? "Gelir Fişini Kaydet"
                          : sendToMysoft
                            ? isSavingMysoft
                              ? "Mysoft'a Gönderiliyor..."
                              : isEditingDraft
                              ? "Taslağı Onayla & Mysoft'a Kes"
                              : "Kaydet & Mysoft'a Kes"
                            : isEditingDraft
                            ? "Taslağı Onayla & Faturayı Kes"
                            : "Gelir Faturasını Kaydet & Kes"
                        : forcedType === "purchase" || invType === "purchase"
                          ? formDocKind === "receipt"
                            ? "Gider Fişini Kaydet"
                            : isEditingDraft
                            ? "Taslağı Onayla & Faturayı Kaydet"
                            : "Gider Faturasını Kaydet"
                          : "Faturayı Kaydet ve Oluştur"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </DetailPageLayout>

        <EArsivSignatureStudioModal
          isOpen={isSignatureStudioOpen}
          onClose={() => setIsSignatureStudioOpen(false)}
          companySettings={companySettings}
          onSaveCompanySettings={onSaveCompanySettings}
        />
      </div>
    );
  }

  // 1. FULL-PAGE EXISTING INVOICE PREVIEW & DETAIL VIEW
  if (printingInvoice) {
    return (
      <InvoicePreviewModal
        invoice={printingInvoice}
        companySettings={companySettings}
        contact={contacts.find((c) => c.id === printingInvoice.contactId)}
        onClose={() => setPrintingInvoice(null)}
        onEdit={() => {
          const invToEdit = printingInvoice;
          setPrintingInvoice(null);
          handleOpenEditInvoiceModal(invToEdit);
        }}
        onSelectTab={onSelectTab}
        onSaveCompanySettings={onSaveCompanySettings}
      />
    );
  }

  // 2. FULL-PAGE PAYMENT & COLLECTION VIEW
  if (paymentModalInvoice) {
    return (
      <DetailPageLayout
        title={paymentModalInvoice.type === "sales" ? "Faturadan Tahsilat Ekle (Kasa / Banka Girişi)" : "Faturaya Ödeme Yap (Kasa / Banka Çıkışı)"}
        subtitle={`${paymentModalInvoice.contactName} • Fatura No: ${paymentModalInvoice.invoiceNumber} • Kalan Bakiye: ₺${paymentModalInvoice.remainingAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`}
        breadcrumbs={[
          { label: "Faturalar", onClick: () => setPaymentModalInvoice(null) },
          { label: paymentModalInvoice.invoiceNumber, onClick: () => setPaymentModalInvoice(null) },
          { label: paymentModalInvoice.type === "sales" ? "Tahsilat Al" : "Ödeme Yap", active: true },
        ]}
        onBack={() => setPaymentModalInvoice(null)}
        statusBadge={
          <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${
            paymentModalInvoice.type === "sales"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-blue-50 text-blue-800 border-blue-200"
          }`}>
            {paymentModalInvoice.type === "sales" ? "GELİR TAHSİLATI" : "GİDER ÖDEMESİ"}
          </span>
        }
        headerIcon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPaymentModalInvoice(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              form="payment-record-form"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              {paymentModalInvoice.type === "sales" ? "Tahsilatı İşle" : "Ödemeyi Kaydet"}
            </button>
          </div>
        }
      >
        <div className="max-w-xl mx-auto bg-white border border-slate-200 text-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Cari Hesap:</span>
              <strong className="text-slate-800 font-bold">{paymentModalInvoice.contactName}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Fatura Numarası:</span>
              <strong className="font-mono text-slate-800 font-bold">{paymentModalInvoice.invoiceNumber}</strong>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-slate-500 font-semibold">Fatura Toplamı:</span>
              <span className="font-bold text-slate-700">₺{paymentModalInvoice.payableAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Kalan Ödenecek / Tahsil Edilecek:</span>
              <span className="font-extrabold text-emerald-700 text-sm">₺{paymentModalInvoice.remainingAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <form id="payment-record-form" onSubmit={handleRecordPayment} className="space-y-4">
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
                    {a.name} (Mevcut: ₺{a.balance.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
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

            <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
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
                {paymentModalInvoice.type === "sales" ? "Tahsilatı İşle" : "Ödemeyi Kaydet"}
              </button>
            </div>
          </form>
        </div>
      </DetailPageLayout>
    );
  }

  // 3. FULL-PAGE COLLECT ALL INVOICES VIEW
  if (isCollectAllModalOpen) {
    return (
      <DetailPageLayout
        title="Tüm Faturaları Toplu Tahsil Et & Öde"
        subtitle="Açık ve vadesi gelen tüm fatura bakiyelerinin tek tıkla kapatılması ve muhasebeleştirilmesi"
        breadcrumbs={[
          { label: "Faturalar", onClick: () => setIsCollectAllModalOpen(false) },
          { label: "Toplu Tahsilat & Tediye", active: true },
        ]}
        onBack={() => setIsCollectAllModalOpen(false)}
        statusBadge={
          <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            TOPLU İŞLEM
          </span>
        }
        headerIcon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCollectAllModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={() => {
                if (onCollectAllInvoices) {
                  onCollectAllInvoices(collectAllAccountId);
                }
                setIsCollectAllModalOpen(false);
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Evet, Hepsini Tahsil Et & Öde</span>
            </button>
          </div>
        }
      >
        <div className="max-w-xl mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="space-y-4 text-xs text-slate-600">
            {(() => {
              const uncollectedInvoices = invoices.filter((i) => i.status !== "cancelled" && i.remainingAmount > 0);
              const totalAmount = uncollectedInvoices.reduce((acc, i) => acc + i.remainingAmount, 0);

              return (
                <>
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 space-y-3 text-emerald-950">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Bekleyen Açık Fatura Sayısı:</span>
                      <span className="font-bold text-sm text-emerald-700">{uncollectedInvoices.length} Adet</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-emerald-200">
                      <span className="font-semibold">Kapatılacak Toplam Tutar:</span>
                      <span className="font-black text-lg text-emerald-800">
                        ₺{totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">
                      Tahsilat / Ödemenin İşleneceği Kasa / Banka Hesabı *
                    </label>
                    <select
                      value={collectAllAccountId}
                      onChange={(e) => setCollectAllAccountId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.type === "cash" ? "Kasa" : "Banka"}) - ₺{acc.balance.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </option>
                      ))}
                    </select>
                  </div>

                  <p className="text-slate-500 text-[11px] leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                    Bu işlem sonucunda sistemdeki tüm açık, bekleyen veya kısmi ödenmiş gelir ve gider faturaları <strong>"Ödendi"</strong> statüsüne getirilecek ve kasa/banka hareketleri otomatik olarak muhasebeleştirilecektir.
                  </p>
                </>
              );
            })()}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCollectAllModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={() => {
                if (onCollectAllInvoices) {
                  onCollectAllInvoices(collectAllAccountId);
                }
                setIsCollectAllModalOpen(false);
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Evet, Hepsini Tahsil Et & Öde</span>
            </button>
          </div>
        </div>
      </DetailPageLayout>
    );
  }

  // 4. FULL-PAGE WHATSAPP SHARE VIEW
  if (whatsAppInvoice) {
    return (
      <UniversalWhatsAppModal
        isOpen={!!whatsAppInvoice}
        onClose={() => setWhatsAppInvoice(null)}
        title="WhatsApp ile Fatura Paylaş"
        documentTypeLabel={whatsAppInvoice.type === "sales" ? "Satış e-Arşiv Faturası" : "Alış Faturası"}
        recipientName={whatsAppInvoice.contactName}
        recipientPhone={contacts.find((c) => c.id === whatsAppInvoice.contactId)?.phone || ""}
        defaultMessage={formatInvoiceWhatsAppMessage(
          whatsAppInvoice,
          companySettings,
          contacts.find((c) => c.id === whatsAppInvoice.contactId)
        )}
        documentFileName={`${whatsAppInvoice.invoiceNumber}_Fatura.pdf`}
        companySettings={companySettings}
        onGeneratePdf={async () => {
          const { generateAutoTableFromExportData } = await import("../utils/pdfService");
          const expData: ExportData = {
            filename: `${whatsAppInvoice.invoiceNumber}_Fatura`,
            title: `${companySettings?.companyName || "Fatura"} - ${whatsAppInvoice.invoiceNumber}`,
            subtitle: `Cari: ${whatsAppInvoice.contactName} | Tarih: ${formatDate(whatsAppInvoice.issueDate)} | Genel Toplam: ${formatCurrency(whatsAppInvoice.grandTotal)}`,
            headers: ["Ürün / Açıklama", "Miktar", "Birim", "Birim Fiyat", "KDV Oranı", "Toplam Tutar"],
            rows: (whatsAppInvoice.items || []).map((i) => [
              i.description,
              i.quantity,
              i.unit || "Adet",
              formatCurrency(i.unitPrice),
              `%${i.vatRate ?? 20}`,
              formatCurrency(i.totalWithVat),
            ]),
          };
          return generateAutoTableFromExportData(expData);
        }}
      />
    );
  }

  // AI & OCR EXPENSE SCANNER FULL-PAGE VIEW
  if (isAiScannerModalOpen) {
    return (
      <AiExpenseScannerModal
        isOpen={isAiScannerModalOpen}
        onClose={() => setIsAiScannerModalOpen(false)}
        contacts={contacts}
        accounts={accounts}
        onSaveInvoiceDirectly={handleSaveInvoiceDirectlyFromAi}
        onApplyToForm={handleApplyAiDataToForm}
      />
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-7 max-w-7xl mx-auto">
      {/* 1. Modern Clean Header With Editorial Background */}
      <ModuleEntranceHeader
        badge={
          forcedType === "sales"
            ? "Gelir Faturaları"
            : forcedType === "purchase"
            ? "Gider & Alış Faturaları"
            : "E-Fatura & E-Arşiv"
        }
        title={
          forcedType === "sales"
            ? "Gelir Faturaları"
            : forcedType === "purchase"
            ? "Gider Faturaları"
            : "Faturalar & Belgeler"
        }
        description={
          forcedType === "sales"
            ? "Müşterilerinize düzenlenen satış faturaları ve tahsilat takibi."
            : forcedType === "purchase"
            ? "Tedarikçilerden gelen alış/gider faturaları ve ödeme takibi."
            : "Resmi e-Fatura / e-Arşiv uyumlu faturalarınızı oluşturun ve ödeme takibi yapın."
        }
        actions={
          <>
            <button
              onClick={() => setIsCollectAllModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-all shrink-0"
              title="Tüm açık/ödenmemiş faturaları topluca tahsil et"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-100" />
              <span>Tümünü Tahsil Et</span>
            </button>

            {(forcedType === "purchase" || !forcedType) && (
              <button
                onClick={() => setIsAiScannerModalOpen(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-all shrink-0"
                title="Yapay Zeka (AI OCR) ile fatura tara"
              >
                <Sparkles className="w-4 h-4 text-amber-100" />
                <span>AI Fatura Tara</span>
              </button>
            )}

            <button
              onClick={() => handleOpenNewInvoiceModal("invoice", forcedType || "sales")}
              className="text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all shrink-0"
              style={{ backgroundColor: theme.primaryColor }}
            >
              <Plus className="w-4 h-4" />
              <span>
                {forcedType === "sales"
                  ? "+ Yeni Gelir Faturası Kes"
                  : forcedType === "purchase"
                  ? "+ Yeni Gider Faturası"
                  : "+ Yeni Fatura Kes / Kaydet"}
              </span>
            </button>
          </>
        }
      />

      {/* 2. Top 4 KPI Summary Cards Grid (Reference Design) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Ciro / Toplam Tutar */}
        <div
          className="rounded-2xl p-5 border shadow-2xs hover:shadow-md transition-all flex flex-col justify-between haze-kpi-card-bg relative overflow-hidden"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">
                {forcedType === "purchase"
                  ? "Toplam Gider / Alış"
                  : forcedType === "sales"
                  ? "Toplam Ciro / Satış"
                  : "Genel Fatura Hacmi"}
              </p>
              <p className="text-2xl font-bold font-mono tracking-tight text-slate-900 mt-2">
                ₺{kpiStats.totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
              <img src={ASSET_ICONS.ciro} alt="Ciro" className="w-6 h-6 object-contain" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <span className="font-semibold text-purple-700">{kpiStats.totalCount}</span>
            <span>fatura kaydı</span>
          </div>
        </div>

        {/* Card 2: Tahsil Edilen */}
        <div
          className="rounded-2xl p-5 border shadow-2xs hover:shadow-md transition-all flex flex-col justify-between haze-kpi-card-bg relative overflow-hidden"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">
                {forcedType === "purchase" ? "Ödenen Gider Tutarı" : "Tahsil Edilen Tutar"}
              </p>
              <p className="text-2xl font-bold font-mono tracking-tight text-emerald-600 mt-2">
                ₺{kpiStats.paidAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
              <img src={ASSET_ICONS.tahsilat} alt="Tahsilat" className="w-6 h-6 object-contain" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Kapanmış / Ödenmiş</span>
          </div>
        </div>

        {/* Card 3: Bekleyen / Açık Alacak */}
        <div
          className="rounded-2xl p-5 border shadow-2xs hover:shadow-md transition-all flex flex-col justify-between haze-kpi-card-bg relative overflow-hidden"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">
                {forcedType === "purchase" ? "Ödenecek Borç Bakiye" : "Açık / Bekleyen Alacak"}
              </p>
              <p className="text-2xl font-bold font-mono tracking-tight text-blue-600 mt-2">
                ₺{kpiStats.remainingAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
              <img src={ASSET_ICONS.alacak} alt="Alacak" className="w-6 h-6 object-contain" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Tahsilat / Ödeme bekleyen</span>
          </div>
        </div>

        {/* Card 4: Vadesi Geçen */}
        <div
          className="rounded-2xl p-5 border shadow-2xs hover:shadow-md transition-all flex flex-col justify-between haze-kpi-card-bg relative overflow-hidden"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Vadesi Geçen Tutar</p>
              <p className="text-2xl font-bold font-mono tracking-tight text-rose-600 mt-2">
                ₺{kpiStats.overdueAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
              <img src={ASSET_ICONS.vadesiGecenAlacak} alt="Gecikmiş" className="w-6 h-6 object-contain" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <span className="font-semibold text-rose-600">{kpiStats.overdueCount}</span>
            <span>fatura gecikmede</span>
          </div>
        </div>
      </div>

      {/* 3. Filter & Action Toolbar */}
      <div
        className="rounded-2xl p-3 sm:p-4 border shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
      >
        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          {!forcedType ? (
            <>
              <button
                onClick={() => setFilterType("all")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  filterType === "all"
                    ? "bg-slate-900 text-white font-bold shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Tümü ({invoices.length})
              </button>
              <button
                onClick={() => setFilterType("sales")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  filterType === "sales"
                    ? "bg-purple-600 text-white font-bold shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Gelir Faturaları
              </button>
              <button
                onClick={() => setFilterType("purchase")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  filterType === "purchase"
                    ? "bg-amber-600 text-white font-bold shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Gider Faturaları
              </button>
            </>
          ) : (
            <button
              onClick={() => setFilterType(forcedType)}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterType === forcedType
                  ? "bg-slate-900 text-white font-bold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Tümü ({invoices.filter((i) => i.type === forcedType).length})
            </button>
          )}

          <button
            onClick={() => setFilterType("draft")}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === "draft"
                ? "bg-amber-500 text-white font-bold shadow-2xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>Taslaklar</span>
            {invoices.filter((i) => (!forcedType || i.type === forcedType) && i.status === "draft").length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  filterType === "draft"
                    ? "bg-white/25 text-white"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {invoices.filter((i) => (!forcedType || i.type === forcedType) && i.status === "draft").length}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilterType("pending")}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              filterType === "pending"
                ? "bg-blue-600 text-white font-bold shadow-2xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Bekleyenler
          </button>
          <button
            onClick={() => setFilterType("overdue")}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              filterType === "overdue"
                ? "bg-rose-600 text-white font-bold shadow-2xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Vadesi Geçenler
          </button>
          <button
            onClick={() => setFilterType("paid")}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              filterType === "paid"
                ? "bg-emerald-600 text-white font-bold shadow-2xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Ödenmiş
          </button>
        </div>

        {/* Filter Controls: Year, Month, Masraf, Search, Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Yıl Dropdown */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="rounded-xl px-2.5 py-1.5 border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
          >
            <option value="all">Tüm Yıllar</option>
            {availableYears.map((y) => (
              <option key={y} value={y.toString()}>{y}</option>
            ))}
          </select>

          {/* Ay Dropdown */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-xl px-2.5 py-1.5 border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
          >
            <option value="all">Tüm Aylar</option>
            {TURKISH_MONTHS.map((m) => (
              <option key={m.id} value={m.id.toString()}>{m.name}</option>
            ))}
          </select>

          {/* Masraf Kalemi (Gider Modülü veya Gider Seçiliyken) */}
          {(forcedType === "purchase" || filterType === "purchase") && (
            <select
              value={selectedExpenseCategoryFilter}
              onChange={(e) => setSelectedExpenseCategoryFilter(e.target.value)}
              className="rounded-xl px-2.5 py-1.5 border border-amber-200 bg-amber-50/50 text-xs font-semibold text-amber-900 focus:outline-none cursor-pointer max-w-[140px] truncate"
            >
              <option value="all">Tüm Masraflar ({EXPENSE_CATEGORIES.length})</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}

          {(selectedYear !== "all" || selectedMonth !== "all" || selectedExpenseCategoryFilter !== "all") && (
            <button
              onClick={() => {
                setSelectedYear("all");
                setSelectedMonth("all");
                setSelectedExpenseCategoryFilter("all");
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
              title="Filtreleri temizle"
            >
              <X className="w-3.5 h-3.5" />
              <span>Temizle</span>
            </button>
          )}

          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <img
              src={ASSET_ICONS.search}
              alt="Search"
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Fatura No veya Cari ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs rounded-xl pl-9 pr-8 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowColFilters((prev) => !prev)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
              showColFilters
                ? "bg-purple-50 border-purple-200 text-purple-900 font-bold"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium"
            }`}
            title="Sütun bazlı arama ve filtreleme alanlarını göster/gizle"
          >
            <Filter className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden sm:inline">Sütun Filtreleri</span>
            {activeColFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center">
                {activeColFilterCount}
              </span>
            )}
          </button>
          <ExportButtons getExportData={getInvoicesExportData} size="sm" />
          <ColumnManagementDropdown
            columns={invoiceColumns}
            columnVisibility={invoiceColVisibility}
            onToggleColumn={toggleInvoiceCol}
            onSetAllColumns={setAllInvoiceCols}
            onResetToDefaults={resetInvoiceCols}
            hiddenCount={hiddenInvoiceColsCount}
          />
        </div>
      </div>

      {/* Aylık Fatura Seçenekleri Barı (Ocak - Aralık) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold text-slate-800">
              Aylık Fatura Dönemi Seçenekleri
            </span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
            >
              <option value="all">Tüm Yıllar</option>
              {availableYears.map((y) => (
                <option key={y} value={y.toString()}>
                  {y} Yılı
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setSelectedYear(String(now.getFullYear()));
                setSelectedMonth(String(now.getMonth() + 1));
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                selectedMonth === String(new Date().getMonth() + 1) &&
                selectedYear === String(new Date().getFullYear())
                  ? "bg-purple-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Bu Ay
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedMonth("all");
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                selectedMonth === "all"
                  ? "bg-purple-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Tüm Aylar
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-1.5">
          {TURKISH_MONTHS.map((m) => {
            const isSelected = selectedMonth === String(m.id);
            const monthCount = invoices.filter((inv) => {
              if (forcedType && inv.type !== forcedType) return false;
              const d = new Date(inv.issueDate);
              if (Number.isNaN(d.getTime())) return false;
              const yearMatches =
                selectedYear === "all" || d.getFullYear().toString() === selectedYear;
              return yearMatches && d.getMonth() + 1 === m.id;
            }).length;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  if (selectedYear === "all") {
                    setSelectedYear(String(new Date().getFullYear()));
                  }
                  setSelectedMonth(isSelected ? "all" : String(m.id));
                }}
                className={`px-2 py-1.5 rounded-xl text-xs font-bold border transition flex items-center justify-between gap-1 cursor-pointer ${
                  isSelected
                    ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                    : monthCount > 0
                      ? "bg-purple-50/60 text-purple-950 border-purple-200 hover:bg-purple-100/70"
                      : "bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100"
                }`}
              >
                <span className="truncate">{m.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    isSelected
                      ? "bg-white/25 text-white"
                      : monthCount > 0
                        ? "bg-purple-200/80 text-purple-900"
                        : "bg-slate-200/70 text-slate-500"
                  }`}
                >
                  {monthCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <BulkActionBar
        selectedCount={selection.selectedCount}
        totalCount={filteredInvoices.length}
        itemLabel="fatura"
        onClearSelection={selection.clearSelection}
        onSelectAll={() => selection.selectAll(filteredInvoices.map((i) => i.id))}
        onDelete={handleBulkDelete}
        deleteLabel="Seçilen Faturaları Sil"
        onExportExcel={handleBulkExportExcel}
        onExportPdf={handleBulkExportPdf}
      />

      {/* 4. Modern Invoices Table */}
      <div
        className="rounded-2xl border shadow-2xs overflow-hidden"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
      >
        <div className="overflow-x-auto custom-scrollbar w-full">
          <table className="w-full text-left text-xs min-w-[750px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="w-10 py-3.5 px-3 text-center">
                  <TableCheckbox
                    checked={displayedInvoiceIds.length > 0 && selection.isAllSelected(displayedInvoiceIds)}
                    indeterminate={selection.isIndeterminate(displayedInvoiceIds)}
                    onChange={() => selection.toggleSelectAll(displayedInvoiceIds)}
                    title="Tümünü Seç / Seçimi Kaldır"
                  />
                </th>
                {isInvoiceColVisible("invoiceNo") && <th className="py-3.5 px-4">Fatura No / Tip</th>}
                {isInvoiceColVisible("contact") && <th className="py-3.5 px-4">Cari Hesap</th>}
                {isInvoiceColVisible("date") && <th className="py-3.5 px-4">Tarih / Vade</th>}
                {isInvoiceColVisible("subtotal") && <th className="py-3.5 px-4 text-right">KDV Hariç</th>}
                {isInvoiceColVisible("grandTotal") && <th className="py-3.5 px-4 text-right">Genel Toplam</th>}
                {isInvoiceColVisible("status") && <th className="py-3.5 px-4 text-center">Durum</th>}
                {isInvoiceColVisible("actions") && <th className="py-3.5 px-4 text-center">İşlemler</th>}
              </tr>
              {/* Sütun Bazlı Filtreleme Satırı */}
              {showColFilters && (
                <tr
                  className="border-b bg-slate-50/40 dark:bg-slate-800/40 transition-colors"
                  style={{ borderColor: theme.cardBorder }}
                >
                  <th className="w-10 py-2 px-3 text-center"></th>
                  {isInvoiceColVisible("invoiceNo") && (
                    <th className="py-2 px-3 font-normal">
                      <TableColumnFilterInput
                        value={colFilters.invoiceNo}
                        onChange={(val) => setColFilters((prev) => ({ ...prev, invoiceNo: val }))}
                        placeholder="Fatura No / Tip..."
                      />
                    </th>
                  )}
                  {isInvoiceColVisible("contact") && (
                    <th className="py-2 px-3 font-normal">
                      <TableColumnFilterInput
                        value={colFilters.contact}
                        onChange={(val) => setColFilters((prev) => ({ ...prev, contact: val }))}
                        placeholder="Cari ara..."
                      />
                    </th>
                  )}
                  {isInvoiceColVisible("date") && (
                    <th className="py-2 px-3 font-normal w-32">
                      <TableColumnFilterInput
                        value={colFilters.date}
                        onChange={(val) => setColFilters((prev) => ({ ...prev, date: val }))}
                        placeholder="Tarih / Vade..."
                      />
                    </th>
                  )}
                  {isInvoiceColVisible("subtotal") && (
                    <th className="py-2 px-3 font-normal w-28">
                      <TableColumnFilterInput
                        value={colFilters.subtotal}
                        onChange={(val) => setColFilters((prev) => ({ ...prev, subtotal: val }))}
                        placeholder="Tutar..."
                      />
                    </th>
                  )}
                  {isInvoiceColVisible("grandTotal") && (
                    <th className="py-2 px-3 font-normal w-28">
                      <TableColumnFilterInput
                        value={colFilters.grandTotal}
                        onChange={(val) => setColFilters((prev) => ({ ...prev, grandTotal: val }))}
                        placeholder="Toplam..."
                      />
                    </th>
                  )}
                  {isInvoiceColVisible("status") && (
                    <th className="py-2 px-2 font-normal w-28">
                      <TableColumnFilterInput
                        type="select"
                        value={colFilters.status}
                        onChange={(val) => setColFilters((prev) => ({ ...prev, status: val }))}
                        options={[
                          { label: "Tümü", value: "" },
                          { label: "Taslak", value: "draft" },
                          { label: "Ödendi", value: "paid" },
                          { label: "Bekliyor", value: "sent" },
                          { label: "Kısmi", value: "partial" },
                          { label: "Gecikmiş", value: "overdue" },
                          { label: "İptal", value: "cancelled" },
                        ]}
                      />
                    </th>
                  )}
                  {isInvoiceColVisible("actions") && (
                    <th className="py-2 px-2 font-normal text-center">
                      {activeColFilterCount > 0 ? (
                        <button
                          type="button"
                          onClick={clearAllColFilters}
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
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={visibleInvoiceColCount} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                      <p className="font-semibold text-slate-600">
                        {forcedType === "sales"
                          ? "Kayıtlı gelir faturası bulunamadı."
                          : forcedType === "purchase"
                          ? "Kayıtlı gider faturası bulunamadı."
                          : "Kayıtlı fatura bulunamadı."}
                      </p>
                      <p className="text-xs text-slate-400">
                        {forcedType === "sales"
                          ? "Yukarıdaki '+ Yeni Gelir Faturası Kes' butonuyla yeni fatura oluşturabilirsiniz."
                          : forcedType === "purchase"
                          ? "Yukarıdaki '+ Yeni Gider Faturası' butonuyla yeni fatura kaydedebilirsiniz."
                          : "Yeni fatura eklemek için yukarıdaki butonu kullanabilirsiniz."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedInvoices.map((inv) => {
                  const isExpanded = expandedInvoiceIds.has(inv.id);
                  const isRowSelected = selection.isSelected(inv.id);
                  return (
                    <React.Fragment key={inv.id}>
                      <tr
                        className={`transition-colors group cursor-pointer ${
                          isRowSelected
                            ? "bg-indigo-50/80 dark:bg-indigo-950/40"
                            : isExpanded
                            ? "bg-[var(--color-periwinkle-wash)] shadow-2xs row-clicked-highlight"
                            : "hover:bg-blue-50/80"
                        }`}
                      >
                        <td className="w-10 py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <TableCheckbox
                            checked={isRowSelected}
                            onChange={() => selection.toggleSelect(inv.id)}
                            title="Faturayı Seç"
                          />
                        </td>
                        {/* Fatura No with Clickable Chevron */}
                        {isInvoiceColVisible("invoiceNo") && (
                          <td className="py-3.5 px-4 font-mono tabular-nums whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {/* Clickable Chevron Icon for Master-Detail Toggle */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleInvoiceExpand(inv.id);
                                }}
                                aria-expanded={isExpanded}
                                className={`p-1.5 -ml-1 rounded-lg transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                                  isExpanded
                                    ? "bg-purple-100 text-purple-700 shadow-2xs ring-1 ring-purple-300"
                                    : "text-slate-400 hover:text-purple-600 hover:bg-slate-100"
                                }`}
                                title={isExpanded ? "Detayları gizle" : "Detayları aç (Sayfadan ayrılmadan incele)"}
                              >
                                <ChevronRight
                                  className={`w-4 h-4 transition-transform duration-200 ${
                                    isExpanded ? "rotate-90 text-purple-700" : "text-slate-400"
                                  }`}
                                />
                              </button>
                              <div>
                                <button
                                  type="button"
                                  onClick={() => toggleInvoiceExpand(inv.id)}
                                  className="font-bold text-slate-900 font-mono tabular-nums text-xs text-left hover:text-purple-600 cursor-pointer block"
                                  title="Satır Detayını Aç / Kapat"
                                >
                                  {inv.invoiceNumber}
                                </button>
                                <div className="flex items-center gap-1 mt-1">
                                  {inv.type === "sales" ? (
                                    inv.docKind === "receipt" ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                        Gelir Fişi
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                                        Gelir Faturası
                                      </span>
                                    )
                                  ) : inv.docKind === "receipt" ? (
                                    <div className="flex flex-wrap items-center gap-1">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                                        Gider Fişi
                                      </span>
                                      {(inv.expenseCategory || inv.items?.find((i) => i.expenseCategory)?.expenseCategory) && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 text-amber-900 border border-amber-200 truncate max-w-[130px]">
                                          {inv.expenseCategory || inv.items.find((i) => i.expenseCategory)?.expenseCategory}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex flex-wrap items-center gap-1">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                        Gider Faturası
                                      </span>
                                      {(inv.expenseCategory || inv.items?.find((i) => i.expenseCategory)?.expenseCategory) && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 text-amber-900 border border-amber-200 truncate max-w-[130px]">
                                          {inv.expenseCategory || inv.items.find((i) => i.expenseCategory)?.expenseCategory}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {inv.paymentMethod && (
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold rounded-full border ${
                                        inv.paymentMethod === "nakit"
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : inv.paymentMethod === "kredi_karti"
                                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                          : inv.paymentMethod === "eft_havale"
                                          ? "bg-sky-50 text-sky-700 border-sky-200"
                                          : "bg-amber-50 text-amber-800 border-amber-200"
                                      }`}
                                    >
                                      {inv.paymentMethod === "nakit"
                                        ? "Nakit"
                                        : inv.paymentMethod === "kredi_karti"
                                        ? "Kredi Kartı"
                                        : inv.paymentMethod === "eft_havale"
                                        ? "EFT / Havale"
                                        : "Cari"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        )}

                        {isInvoiceColVisible("contact") && (
                          <td className="py-3.5 px-4">
                            <div className="min-w-0">
                              {(() => {
                                const isManual = inv.isManualCustomer || !contacts.some((c) => c.id === inv.contactId);
                                return (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {onSelectTab && !isManual ? (
                                      <button
                                        type="button"
                                        onClick={() => onSelectTab("contacts")}
                                        className="text-left font-bold text-slate-900 hover:text-purple-600 transition-colors truncate block text-xs cursor-pointer"
                                        title="Cari detayı"
                                      >
                                        {inv.contactName}
                                      </button>
                                    ) : (
                                      <div className="font-bold text-slate-900 truncate text-xs">
                                        {inv.contactName}
                                      </div>
                                    )}
                                    {isManual && (
                                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200" title="Cari kart açılmadan doğrudan müşteri bilgisiyle kesildi">
                                        Münferit
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}

                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 flex-wrap">
                                {inv.taxNumber && <span>VKN/TC: {inv.taxNumber}</span>}
                                {inv.taxOffice && <span>({inv.taxOffice})</span>}
                                {inv.customerBranchName && (
                                  <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                                    Şube: {inv.customerBranchName}
                                    {inv.customerBranchCode ? ` (${inv.customerBranchCode})` : ""}
                                  </span>
                                )}
                                {inv.branchName && (
                                  <span className="px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                                    Düzenleyen: {inv.branchName}
                                  </span>
                                )}
                                {inv.customerAddress ? (
                                  <span className="text-slate-500 font-medium truncate max-w-[260px]" title={inv.customerAddress}>
                                    • {inv.customerAddress}
                                  </span>
                                ) : inv.customerCity ? (
                                  <span>• {inv.customerCity}</span>
                                ) : null}
                              </div>
                            </div>
                          </td>
                        )}

                        {isInvoiceColVisible("date") && (
                          <td className="py-3.5 px-4 font-mono tabular-nums">
                            <div className="font-medium text-slate-800 font-mono tabular-nums">{formatDate(inv.issueDate)}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5 font-mono tabular-nums">Vade: {formatDate(inv.dueDate)}</div>
                          </td>
                        )}

                        {isInvoiceColVisible("subtotal") && (
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums font-tabular-num-md font-medium text-slate-700">
                            ₺{inv.subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </td>
                        )}

                        {isInvoiceColVisible("grandTotal") && (
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums font-tabular-num-md font-bold text-slate-900 text-sm">
                            ₺{inv.grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </td>
                        )}

                        {isInvoiceColVisible("status") && (
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                inv.status === "paid"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : inv.status === "overdue"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : inv.status === "draft"
                                  ? "bg-amber-50 text-amber-800 border border-amber-300"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  inv.status === "paid"
                                    ? "bg-emerald-500"
                                    : inv.status === "overdue"
                                    ? "bg-rose-500"
                                    : inv.status === "draft"
                                    ? "bg-amber-500"
                                    : "bg-blue-500"
                                }`}
                              />
                              {inv.status === "paid"
                                ? "Ödendi"
                                : inv.status === "overdue"
                                ? "Vadesi Geçti"
                                : inv.status === "draft"
                                ? "Taslak"
                                : "Bekliyor"}
                            </span>
                          </td>
                        )}

                        {isInvoiceColVisible("actions") && (
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => toggleInvoiceExpand(inv.id)}
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
                                onClick={() => handleOpenEditInvoiceModal(inv)}
                                title={
                                  inv.status === "draft"
                                    ? "Hazırlanan Taslağı Düzenle / Tamamla"
                                    : inv.docKind === "receipt"
                                    ? "Fişi Düzenle"
                                    : "Faturayı Düzenle"
                                }
                                className={`p-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                                  inv.status === "draft"
                                    ? "border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 px-2 font-bold text-[11px]"
                                    : "border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-600 hover:text-amber-700"
                                }`}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                {inv.status === "draft" && <span>Düzenle</span>}
                              </button>

                              <button
                                onClick={() => setPrintingInvoice(inv)}
                                title="Faturayı Görüntüle & Detay"
                                className="p-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 transition-colors cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() =>
                                  openInvoicePrintModal({
                                    invoice: inv,
                                    companySettings,
                                    contact: contacts.find((c) => c.id === inv.contactId),
                                    isDraft: inv.status === "draft",
                                    onSaveCompanySettings,
                                  })
                                }
                                title="Logolu & QR Kodlu Kurumsal PDF Şablonu / Yazdır"
                                className="p-1.5 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-slate-600 hover:text-purple-700 transition-colors cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setWhatsAppInvoice(inv)}
                                title="Faturayı WhatsApp ile Paylaş"
                                className="p-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>

                              {inv.status !== "paid" && inv.status !== "draft" && (
                                <button
                                  onClick={() => {
                                    setPaymentModalInvoice(inv);
                                    setPaymentAmount(inv.remainingAmount);
                                  }}
                                  title="Tahsilat / Ödeme Ekle"
                                  className="p-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                onClick={() => onDeleteInvoice(inv.id)}
                                title="Faturayı Sil"
                                className="p-1.5 rounded-lg border border-transparent hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>

                      {/* Hidden Master-Detail View Section for Invoice */}
                      {isExpanded && (
                        <tr className="expanded-detail-row bg-slate-50/70 border-y border-slate-200" data-skip-row-highlight="true">
                          <td colSpan={visibleInvoiceColCount} className="p-0">
                            <div className="p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-[#eaedff]/40 to-white border-l-4 border-l-[#005289] space-y-4">
                              {/* Header strip */}
                              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                                <div className="flex flex-wrap items-center gap-2.5">
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-xs font-black border ${
                                      inv.type === "sales"
                                        ? "bg-purple-50 text-purple-700 border-purple-200"
                                        : "bg-amber-50 text-amber-700 border-amber-200"
                                    }`}
                                  >
                                    {inv.type === "sales" ? "SATIŞ / GELİR FATURASI" : "ALIŞ / GİDER FATURASI"}
                                  </span>
                                  <span className="text-xs text-slate-500 font-medium">
                                    Fatura No:{" "}
                                    <span className="font-mono tabular-nums font-bold text-slate-900">
                                      {inv.invoiceNumber}
                                    </span>
                                  </span>
                                  {inv.profileType && (
                                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                                      {inv.profileType.toUpperCase()}
                                    </span>
                                  )}
                                  {inv.scenario && (
                                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                                      {inv.scenario === "commercial" ? "Ticari Fatura" : "Temel Fatura"}
                                    </span>
                                  )}
                                </div>

                                {/* Quick inline actions */}
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openInvoicePrintModal({
                                        invoice: inv,
                                        companySettings,
                                        contact: contacts.find((c) => c.id === inv.contactId),
                                        isDraft: inv.status === "draft",
                                        onSaveCompanySettings,
                                      })
                                    }
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                    title="Logolu ve QR Kodlu PDF Şablonu / Yazdır"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>PDF Şablonu / Yazdır</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPrintingInvoice(inv)}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                    title="Tam Sayfa Önizleme"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>e-Belge Detay</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setWhatsAppInvoice(inv)}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                    title="WhatsApp ile Paylaş"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    <span>WhatsApp</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditInvoiceModal(inv)}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                    title={inv.status === "draft" ? "Taslağı Düzenle & Kes" : "Düzenle"}
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                                    <span>{inv.status === "draft" ? "Taslağı Düzenle / Kes" : "Düzenle"}</span>
                                  </button>
                                </div>
                              </div>

                              {/* Master-Detail Metadata Grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
                                <div>
                                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                                    Düzenlenme Tarihi
                                  </span>
                                  <span className="font-mono tabular-nums font-bold text-slate-800 mt-0.5 block">
                                    {formatDate(inv.issueDate)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                                    Vade / Ödeme Tarihi
                                  </span>
                                  <span className="font-mono tabular-nums font-bold text-slate-800 mt-0.5 block">
                                    {formatDate(inv.dueDate)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                                    Cari, Şube & Adres Bilgisi
                                  </span>
                                  <span className="font-bold text-slate-900 truncate block mt-0.5" title={inv.contactName}>
                                    {inv.contactName}
                                  </span>
                                  {inv.taxNumber && (
                                    <span className="text-[10px] text-slate-400 font-mono tabular-nums block">
                                      VKN/TC: {inv.taxNumber} {inv.taxOffice ? `(${inv.taxOffice})` : ""}
                                    </span>
                                  )}
                                  {(inv.customerBranchName || inv.customerAddress) && (
                                    <span className="text-[10px] text-slate-600 font-medium block mt-0.5">
                                      📍 {formatAddressWithBranch(
                                        inv.customerAddress,
                                        inv.customerCity,
                                        inv.customerDistrict,
                                        inv.customerBranchName,
                                        inv.customerBranchCode
                                      )}
                                    </span>
                                  )}
                                  {inv.branchName && (
                                    <span className="text-[10px] text-purple-700 font-semibold block mt-0.5">
                                      🏢 Düzenleyen Şube: {inv.branchName}{inv.branchCode ? ` (${inv.branchCode})` : ""}{inv.branchAddress ? ` — ${inv.branchAddress}` : ""}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                                    Ödeme Durumu & Yöntemi
                                  </span>
                                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                        inv.status === "paid"
                                          ? "bg-emerald-100 text-emerald-800"
                                          : inv.status === "overdue"
                                          ? "bg-rose-100 text-rose-800"
                                          : inv.status === "draft"
                                          ? "bg-amber-100 text-amber-900"
                                          : "bg-blue-100 text-blue-800"
                                      }`}
                                    >
                                      {inv.status === "paid"
                                        ? "Tamamen Ödendi"
                                        : inv.status === "overdue"
                                        ? "Vadesi Geçti"
                                        : inv.status === "draft"
                                        ? "Taslak (Henüz Kesilmedi)"
                                        : "Tahsilat Bekliyor"}
                                    </span>
                                    {inv.paymentMethod && (
                                      <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                                          inv.paymentMethod === "nakit"
                                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                            : inv.paymentMethod === "kredi_karti"
                                            ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                                            : inv.paymentMethod === "eft_havale"
                                            ? "bg-sky-50 text-sky-800 border-sky-200"
                                            : "bg-amber-50 text-amber-800 border-amber-200"
                                        }`}
                                      >
                                        {inv.paymentMethod === "nakit"
                                          ? "Nakit"
                                          : inv.paymentMethod === "kredi_karti"
                                          ? "Kredi Kartı"
                                          : inv.paymentMethod === "eft_havale"
                                          ? "EFT & Havale"
                                          : "Cari Hesap"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Itemized Line Items Table */}
                              {inv.items && inv.items.length > 0 && (
                                <div className="space-y-2">
                                  <div className="text-[11px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-purple-600" />
                                    <span>Fatura Kalemleri ({inv.items.length} Kalem)</span>
                                  </div>
                                  <div className="border border-slate-200 rounded-xl overflow-x-auto custom-scrollbar bg-white shadow-2xs">
                                    <table className="w-full text-left text-xs min-w-[580px]">
                                      <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                                          <th className="py-2.5 px-3">Mal / Hizmet Açıklaması</th>
                                          <th className="py-2.5 px-3 text-center">Miktar</th>
                                          <th className="py-2.5 px-3 text-right">Birim Fiyat</th>
                                          <th className="py-2.5 px-3 text-center">İskonto %</th>
                                          <th className="py-2.5 px-3 text-center">KDV %</th>
                                          <th className="py-2.5 px-3 text-right">Net Tutar</th>
                                          <th className="py-2.5 px-3 text-right">Genel Toplam</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {inv.items.map((item, idx) => (
                                          <tr key={idx} className="hover:bg-blue-50/80 transition-colors">
                                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                                              {item.description}
                                            </td>
                                            <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-700">
                                              {item.quantity} {item.unit || "Adet"}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-mono tabular-nums font-tabular-num-md text-slate-700">
                                              ₺{item.unitPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-2.5 px-3 text-center font-mono tabular-nums font-tabular-num-md text-slate-500">
                                              {item.discountPercent ? `%${item.discountPercent}` : "-"}
                                            </td>
                                            <td className="py-2.5 px-3 text-center font-mono tabular-nums font-tabular-num-md text-slate-600">
                                              %{item.vatRate}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-mono tabular-nums font-tabular-num-md text-slate-700">
                                              ₺{((item.quantity * item.unitPrice) * (1 - (item.discountPercent || 0) / 100)).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-mono tabular-nums font-tabular-num-md font-bold text-slate-900">
                                              ₺{item.totalWithVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {/* Description & Financial Summary Footer */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                                <div className="md:col-span-2 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs text-xs space-y-2">
                                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                                    Fatura Notları & Bilgilendirme
                                  </span>
                                  <p className="text-slate-700 font-medium leading-relaxed">
                                    {inv.notes || "Fatura için ilave not eklenmemiş."}
                                  </p>
                                  {inv.paymentTerms && (
                                    <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                                      <span className="font-semibold text-slate-700">Ödeme Şartı:</span> {inv.paymentTerms}
                                    </div>
                                  )}
                                </div>

                                <div className="bg-purple-50/60 border border-purple-200/80 p-3.5 rounded-xl shadow-2xs space-y-1.5 text-xs">
                                  <div className="flex justify-between text-slate-600">
                                    <span>Ara Toplam (Matrah):</span>
                                    <span className="font-mono tabular-nums font-bold text-slate-800">
                                      ₺{inv.subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                  {inv.totalDiscount !== undefined && inv.totalDiscount > 0 && (
                                    <div className="flex justify-between text-rose-600">
                                      <span>İskonto Toplamı:</span>
                                      <span className="font-mono tabular-nums font-bold">
                                        -₺{inv.totalDiscount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-slate-600">
                                    <span>Toplam KDV:</span>
                                    <span className="font-mono tabular-nums font-bold text-slate-800">
                                      ₺{inv.totalVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                  {inv.withholdingAmount !== undefined && inv.withholdingAmount > 0 && (
                                    <div className="flex justify-between text-amber-700">
                                      <span>Tevkifat Tutarı:</span>
                                      <span className="font-mono tabular-nums font-bold">
                                        -₺{inv.withholdingAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex justify-between pt-1.5 border-t border-purple-200 font-bold text-sm">
                                    <span className="text-slate-800">Fatura Genel Toplamı:</span>
                                    <span className="font-mono tabular-nums font-black text-purple-900">
                                      ₺{inv.grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                  {inv.remainingAmount > 0 && inv.status !== "paid" && (
                                    <div className="flex justify-between text-rose-700 font-semibold text-xs pt-1 border-t border-purple-200/40">
                                      <span>Kalan Bakiye:</span>
                                      <span className="font-mono tabular-nums font-bold">
                                        ₺{inv.remainingAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  )}
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

        <Pagination
          currentPage={currentPage}
          totalItems={filteredInvoices.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          pageSizeOptions={[10, 15, 25, 50, 100]}
          itemLabel="fatura"
          className="border-t border-slate-100"
        />
      </div>
    </div>
  );
};
