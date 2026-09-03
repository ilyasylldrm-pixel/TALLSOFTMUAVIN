import React, { useCallback, useEffect, useState } from "react";
import {
  Invoice,
  InvoiceItem,
  InvoiceType,
  InvoiceProfileType,
  InvoiceStatus,
  Contact,
  Product,
  Account,
  CompanySettings,
  getContactAccountCode,
  EXPENSE_CATEGORIES,
  ExpenseCategory,
} from "../types";
import { InvoicePrintModal } from "./InvoicePrintModal";
import { InvoicePreviewModal } from "./InvoicePreviewModal";
import { InvoiceCreatePreviewPanel } from "./InvoiceCreatePreviewPanel";
import { InvoiceTaxSettingsModal } from "./InvoiceTaxSettingsModal";
import { AiExpenseScannerModal, ExtractedExpenseData } from "./AiExpenseScannerModal";
import { ExportButtons } from "./ExportButtons";
import { ExportData, formatCurrency, formatDate } from "../utils/exportUtils";
import { formatInvoiceWhatsAppMessage } from "../utils/whatsappTemplates";
import { UniversalWhatsAppModal } from "./common/UniversalWhatsAppModal";
import { computeInvoiceTotals, formatWithholdingBadge } from "../utils/taxCalculationService";
import { DetailPageLayout, BreadcrumbItem } from "./common/DetailPageLayout";
import { useDetailNavigation } from "../hooks/useDetailNavigation";
import { NavItem } from "./Sidebar";
import {
  sendMysoftOutgoingInvoice,
  checkRecipientTaxpayerStatus,
  RecipientTaxpayerStatus,
} from "../services/mysoftEDocumentService";
import {
  buildMysoftInvoiceOutboxPayload,
  extractMysoftOutboxResult,
} from "../services/mysoftInvoicePayload";
import { MysoftTenantPicker } from "./MysoftTenantPicker";
import { readStoredMysoftTenantVkn } from "../utils/mysoftTenantStorage";
import { normalizeMysoftTenantIdentifier } from "../services/mysoftEDocumentService";
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
  Receipt,
  ScanLine,
  Edit2,
  Hash,
  Sliders,
  Percent,
  ShieldCheck,
  Scale,
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
  onCollectAllInvoices?: (targetAccountId?: string) => void;
  onSelectTab?: (tab: NavItem) => void;
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
  onCollectAllInvoices,
  onSelectTab,
}) => {
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

  // Payment Form State
  const [displayLimit, setDisplayLimit] = useState<number>(100);
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
  const [newContactType, setNewContactType] = useState<"customer" | "vendor" | "both">("both");

  const [isProductPickerOpen, setIsProductPickerOpen] = useState<boolean>(false);
  const [productPickerSearch, setProductPickerSearch] = useState<string>("");
  const [targetItemRowId, setTargetItemRowId] = useState<string | null>(null);
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>("all");

  // New Invoice Form State
  const [invType, setInvType] = useState<InvoiceType>(forcedType || "sales");
  const [invoiceProfileType, setInvoiceProfileType] = useState<InvoiceProfileType>("SATIS");
  const [taxModalItem, setTaxModalItem] = useState<InvoiceItem | null>(null);
  const [invoiceNumberInput, setInvoiceNumberInput] = useState<string>("");
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
        setContactId(exactMatch.id);
        return;
      }

      // 2. Starts with search if >= 6 digits or 10/11 digits
      if (cleanVal.length >= 6) {
        const startsWithMatches = contacts.filter(
          (c) => c.taxNumber && c.taxNumber.replace(/\D/g, "").startsWith(cleanVal)
        );
        if (startsWithMatches.length === 1) {
          setContactId(startsWithMatches[0].id);
        }
      }
    }
  };

  const handleContactSelectChange = (newContactId: string) => {
    setContactId(newContactId);
    const found = contacts.find((c) => c.id === newContactId);
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

  const handleCloseDetail = useCallback(() => {
    setEditingInvoiceId(null);
    setEditingInvoiceNumber(null);
    setMysoftSaveError(null);
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
  const [mysoftTenantVkn, setMysoftTenantVkn] = useState<string | undefined>(() =>
    readStoredMysoftTenantVkn() ||
      normalizeMysoftTenantIdentifier(companySettings.tenantIdentifierNumber),
  );
  const [recipientStatus, setRecipientStatus] = useState<RecipientTaxpayerStatus | null>(null);
  const [isCheckingRecipient, setIsCheckingRecipient] = useState<boolean>(false);

  useEffect(() => {
    const fromSettings = normalizeMysoftTenantIdentifier(
      companySettings.tenantIdentifierNumber,
    );
    if (fromSettings) setMysoftTenantVkn(fromSettings);
  }, [companySettings.tenantIdentifierNumber]);

  // Live e-Fatura vs e-Arşiv Recipient Taxpayer Auto-Detection
  useEffect(() => {
    const contact = contacts.find((c) => c.id === contactId);
    const taxNum = (contact?.taxNumber || "").replace(/\D/g, "").trim();
    if (!taxNum || (taxNum.length !== 10 && taxNum.length !== 11)) {
      setRecipientStatus(null);
      return;
    }

    let isMounted = true;
    setIsCheckingRecipient(true);
    checkRecipientTaxpayerStatus(taxNum)
      .then((status) => {
        if (isMounted) {
          setRecipientStatus(status);
          if (status.isEFaturaUser) {
            setMysoftEDocType("e_fatura");
          } else {
            setMysoftEDocType("e_arsiv");
          }
        }
      })
      .finally(() => {
        if (isMounted) setIsCheckingRecipient(false);
      });

    return () => {
      isMounted = false;
    };
  }, [contactId, contacts]);

  const handleQuickCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim()) return;

    const createdContact: Contact = {
      id: "cnt_" + Date.now(),
      name: newContactName.trim(),
      taxNumber: newContactTaxNo.trim() || undefined,
      phone: newContactPhone.trim() || undefined,
      contactType: newContactType,
      balance: 0,
      balanceType: "balanced",
      createdAt: new Date().toISOString().split("T")[0],
    };

    contacts.push(createdContact);
    setContactId(createdContact.id);
    setVknSearchInput(createdContact.taxNumber ? createdContact.taxNumber.replace(/\D/g, "") : "");
    setIsQuickContactFormOpen(false);
    setIsContactPickerOpen(false);
    setNewContactName("");
    setNewContactTaxNo("");
    setNewContactPhone("");
  };

  const handleSelectProductFromPicker = (prod: Product) => {
    const defaultUnitPrice = invType === "sales" ? prod.sellPrice : prod.buyPrice;
    const desc = `${prod.name}${prod.code ? ` (${prod.code})` : ""}`;
    const vat = prod.vatRate || 20;

    if (targetItemRowId) {
      setItems((prevItems) =>
        prevItems.map((item) => {
          if (item.id === targetItemRowId) {
            const qty = item.quantity || 1;
            const lineNoVat = qty * defaultUnitPrice;
            const lineVat = (lineNoVat * vat) / 100;
            return {
              ...item,
              productId: prod.id,
              description: desc,
              unit: prod.unit || "Adet",
              unitPrice: defaultUnitPrice,
              vatRate: vat,
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

  const handleOpenNewInvoiceModal = (
    docKind: "invoice" | "receipt" = "invoice",
    type?: InvoiceType
  ) => {
    setEditingInvoiceId(null);
    setEditingInvoiceNumber(null);
    setInvoiceProfileType("SATIS");
    setTaxModalItem(null);
    setFormDocKind(docKind);
    const targetType = type || forcedType || "sales";
    setInvType(targetType);
    const nextSeq = String(invoices.length + 1).padStart(7, "0");
    const prefix = targetType === "sales" ? "MUV2026" : "TED2026";
    setInvoiceNumberInput(`${prefix}${nextSeq}`);
    const targetContactId = initialContactIdForNewInvoice || contacts[0]?.id || "";
    setContactId(targetContactId);
    const targetContact = contacts.find((c) => c.id === targetContactId);
    setVknSearchInput(targetContact?.taxNumber ? targetContact.taxNumber.replace(/\D/g, "") : "");
    setIssueDate(new Date().toISOString().split("T")[0]);
    setDueDate(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]
    );
    setNotes("Ödemenin süresinde yapılması rica olunur.");
    setHasDifferentDeliveryAddress(false);
    setDeliveryAddress("");
    setItems([
      {
        id: "item_1",
        description:
          targetType === "purchase"
            ? "Ofis & Kırtasiye / Mal & Hizmet Alımı"
            : "Yazılım Danışmanlık ve Sistem Destek Hizmeti",
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
    setEditingInvoiceId(inv.id);
    setEditingInvoiceNumber(inv.invoiceNumber);
    setInvoiceNumberInput(inv.invoiceNumber || "");
    setInvType(inv.type);
    setInvoiceProfileType(inv.invoiceProfileType || "SATIS");
    setTaxModalItem(null);
    setFormDocKind(inv.docKind || "invoice");
    const editContactId = inv.contactId || contacts[0]?.id || "";
    setContactId(editContactId);
    const editContact = contacts.find((c) => c.id === editContactId);
    setVknSearchInput(
      editContact?.taxNumber
        ? editContact.taxNumber.replace(/\D/g, "")
        : inv.taxNumber
        ? inv.taxNumber.replace(/\D/g, "")
        : ""
    );
    setIssueDate(inv.issueDate || new Date().toISOString().split("T")[0]);
    setDueDate(inv.dueDate || new Date().toISOString().split("T")[0]);

    let noteText = inv.notes || "";
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
      return prevItems.map((item) => {
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
            withholdingCode: item.withholdingCode || "618",
            withholdingRateNumerator: item.withholdingRateNumerator || 5,
            withholdingRateDenominator: item.withholdingRateDenominator || 10,
            withholdingRate: (item.withholdingRateNumerator || 5) / (item.withholdingRateDenominator || 10),
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
    });
  };

  // Recalculate invoice totals dynamically using central taxCalculationService
  const calculateTotals = () => {
    return computeInvoiceTotals(items);
  };

  const getDraftInvoice = (): Partial<Invoice> => {
    const contact = contacts.find((c) => c.id === contactId);
    const {
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
    const prefix = invType === "sales"
      ? isReceipt ? "GLF2026" : "MUV2026"
      : isReceipt ? "GDF2026" : "TED2026";
    const nextSeq = String(invoices.length + 1).padStart(7, "0");
    const customNum = invoiceNumberInput.trim();

    let finalNotes = notes.trim();
    if (hasDifferentDeliveryAddress && deliveryAddress.trim()) {
      const deliveryTag = `Teslimat Adresi: ${deliveryAddress.trim()}`;
      if (!finalNotes.includes(deliveryAddress.trim())) {
        finalNotes = finalNotes ? `${finalNotes}\n${deliveryTag}` : deliveryTag;
      }
    }

    const primaryExpenseCategory = computedItems.find((i) => i.expenseCategory)?.expenseCategory || computedItems[0]?.expenseCategory;

    return {
      invoiceNumber: customNum ? `${customNum} (TASLAK)` : `${prefix}${nextSeq} (TASLAK)`,
      type: invType,
      invoiceProfileType,
      docKind: forcedType ? formDocKind : "invoice",
      expenseCategory: invType === "purchase" ? primaryExpenseCategory : undefined,
      contactId: contactId,
      contactName: contact?.name || "Cari Seçilmedi",
      taxNumber: contact?.taxNumber || "",
      issueDate,
      dueDate,
      items: computedItems,
      subtotal,
      effectiveTaxableAmount,
      totalVat,
      totalWithholding,
      payableVat,
      grandTotal,
      payableAmount,
      taxItems,
      paidAmount: 0,
      remainingAmount: payableAmount,
      status: "draft",
      currency: "TRY",
      notes: finalNotes,
    };
  };

  const buildMysoftPreviewPayload = useCallback((): Record<string, unknown> | null => {
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) return null;
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
      contactId,
      contactName: contact.name,
      taxNumber: contact.taxNumber || "",
      subtotal,
      totalVat,
      grandTotal,
      status: "draft" as InvoiceStatus,
      currency: "TRY",
      paidAmount: 0,
      remainingAmount: grandTotal,
      createdAt: new Date().toISOString().split("T")[0],
    } as Invoice;
    return buildMysoftInvoiceOutboxPayload({
      invoice: invoiceForPayload,
      contact,
      company: companySettings,
      eDocumentType: mysoftEDocType,
      isSaveAsDraft: true,
      tenantIdentifierNumber: mysoftTenantVkn,
      pkAlias: recipientStatus?.pkAlias,
      gbAlias: recipientStatus?.gbAlias,
    });
  }, [
    contactId,
    contacts,
    companySettings,
    mysoftTenantVkn,
    recipientStatus,
    dueDate,
    formDocKind,
    invType,
    issueDate,
    items,
    mysoftEDocType,
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
          return updated;
        }
        return item;
      })
    );
  };

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) return;
    if (isSavingMysoft) return;

    const {
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
    const prefix = invType === "sales"
      ? isReceipt ? "GLF2026" : "MUV2026"
      : isReceipt ? "GDF2026" : "TED2026";
    const nextSeq = String(invoices.length + 1).padStart(7, "0");
    const effectiveInvoiceNumber = invoiceNumberInput.trim() || `${prefix}${nextSeq}`;

    let finalNotes = notes.trim();
    if (hasDifferentDeliveryAddress && deliveryAddress.trim()) {
      const deliveryTag = `Teslimat Adresi: ${deliveryAddress.trim()}`;
      if (!finalNotes.includes(deliveryAddress.trim())) {
        finalNotes = finalNotes ? `${finalNotes}\n${deliveryTag}` : deliveryTag;
      }
    }

    const primaryExpenseCategory = computedItems.find((i) => i.expenseCategory)?.expenseCategory || computedItems[0]?.expenseCategory;
    const shouldSendMysoft =
      sendToMysoft &&
      invType === "sales" &&
      formDocKind === "invoice" &&
      !editingInvoiceId;

    if (editingInvoiceId) {
      const existing = invoices.find((i) => i.id === editingInvoiceId);
      const paid = existing?.paidAmount || 0;
      const remaining = Math.max(0, payableAmount - paid);
      let status: InvoiceStatus = existing?.status || "sent";
      if (status !== "cancelled") {
        if (remaining <= 0) {
          status = "paid";
        } else if (paid > 0) {
          status = "partial";
        } else {
          status = "sent";
        }
      }

      const updatedInvoice: Invoice = {
        id: editingInvoiceId,
        invoiceNumber: invoiceNumberInput.trim() || existing?.invoiceNumber || `${prefix}${nextSeq}`,
        type: invType,
        invoiceProfileType,
        docKind: formDocKind,
        expenseCategory: invType === "purchase" ? primaryExpenseCategory : undefined,
        contactId: contact.id,
        contactName: contact.name,
        taxNumber: contact.taxNumber,
        issueDate,
        dueDate,
        items: computedItems,
        subtotal,
        effectiveTaxableAmount,
        totalVat,
        totalWithholding,
        payableVat,
        taxItems,
        grandTotal,
        payableAmount,
        paidAmount: paid,
        remainingAmount: remaining,
        status,
        currency: existing?.currency || "TRY",
        notes: finalNotes,
        createdAt: existing?.createdAt || new Date().toISOString().split("T")[0],
        eDocumentType: existing?.eDocumentType,
        eDocumentEttn: existing?.eDocumentEttn,
      };

      onUpdateInvoice(updatedInvoice);
      setEditingInvoiceId(null);
      setEditingInvoiceNumber(null);
      setHasDifferentDeliveryAddress(false);
      setDeliveryAddress("");
      setIsCreateModalOpen(false);
      return;
    }

    let newInvoice: Invoice = {
      id: "inv_" + Date.now(),
      invoiceNumber: effectiveInvoiceNumber,
      type: invType,
      invoiceProfileType,
      docKind: forcedType ? formDocKind : "invoice",
      expenseCategory: invType === "purchase" ? primaryExpenseCategory : undefined,
      contactId: contact.id,
      contactName: contact.name,
      taxNumber: contact.taxNumber,
      issueDate,
      dueDate,
      items: computedItems,
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
      status: "sent",
      currency: "TRY",
      notes: finalNotes,
      createdAt: new Date().toISOString().split("T")[0],
      eDocumentType: shouldSendMysoft ? mysoftEDocType : undefined,
    };

    if (shouldSendMysoft) {
      setMysoftSaveError(null);
      setMysoftSaveNotice(null);
      if (!mysoftTenantVkn) {
        setMysoftSaveError(
          "Mysoft kesimi için mükellef seçin. Listeyi yükleyip VKN/TCKN seçin veya VKN ile getirin.",
        );
        return;
      }
      setIsSavingMysoft(true);
      try {
        const payload = buildMysoftInvoiceOutboxPayload({
          invoice: newInvoice,
          contact,
          company: companySettings,
          eDocumentType: mysoftEDocType,
          isSaveAsDraft: false,
          tenantIdentifierNumber: mysoftTenantVkn,
          pkAlias: recipientStatus?.pkAlias,
          gbAlias: recipientStatus?.gbAlias,
        });
        const result = await sendMysoftOutgoingInvoice(payload);
        const outbox = extractMysoftOutboxResult(result);
        if (outbox.invoiceETTN) {
          newInvoice = {
            ...newInvoice,
            eDocumentEttn: outbox.invoiceETTN,
            invoiceNumber: outbox.docNo || newInvoice.invoiceNumber,
            eDocumentType: mysoftEDocType,
          };
        }
        setMysoftSaveNotice(
          outbox.invoiceETTN
            ? `Mysoft'a gönderildi. ETTN: ${outbox.invoiceETTN}`
            : "Fatura Mysoft giden kutuya iletildi.",
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Mysoft giden fatura gönderimi başarısız.";
        setMysoftSaveError(message);
        setIsSavingMysoft(false);
        return;
      } finally {
        setIsSavingMysoft(false);
      }
    }

    onAddInvoice(newInvoice);
    if (forcedType) {
      setDocSubTab(formDocKind === "receipt" ? "receipts" : "invoices");
    }
    setHasDifferentDeliveryAddress(false);
    setDeliveryAddress("");
    setIsCreateModalOpen(false);
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
        name: data.companyTitle.trim(),
        taxNumber: data.taxNumber?.trim() || undefined,
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

  // Filter logic
  const activeSearchQuery = (globalSearchTerm || search).toLowerCase().trim();
  const filteredInvoices = invoices.filter((inv) => {
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

    if (filterType === "overdue") return inv.status === "overdue";
    if (filterType === "paid") return inv.status === "paid";
    if (filterType === "pending") return inv.status === "sent" || inv.status === "partial";

    return true;
  });

  const displayedInvoices = filteredInvoices.slice(0, displayLimit);

  const { subtotal, totalVat, grandTotal } = calculateTotals();

  const getInvoicesExportData = (): ExportData => {
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

    filteredInvoices.forEach((inv) => {
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
      subtitle: `Toplam ${filteredInvoices.length} Adet Fatura (${rows.length} Satır Kalem Kaydı)`,
      headers,
      rows,
    };
  };

  // Detail Page Header & Actions
  const detailTitle = editingInvoiceId
    ? invType === "sales"
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
        ? `${editingInvoiceNumber || "Fatura"} - Düzenle`
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
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200 shadow-2xs">
      <Edit2 className="w-3.5 h-3.5" /> Düzenleme Modu
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs">
      <Clock className="w-3.5 h-3.5" /> Taslak Belge
    </span>
  );

  const detailPageActions = (
    <div className="flex items-center gap-2">
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
          {editingInvoiceId
            ? "Değişiklikleri Kaydet"
            : forcedType === "sales" || invType === "sales"
            ? formDocKind === "receipt"
              ? "Gelir Fişini Kaydet"
              : sendToMysoft
              ? isSavingMysoft
                ? "Mysoft'a Gönderiliyor..."
                : "Kaydet & Mysoft'a Kes"
              : "Gelir Faturasını Kaydet & Kes"
            : forcedType === "purchase" || invType === "purchase"
            ? formDocKind === "receipt"
              ? "Gider Fişini Kaydet"
              : "Gider Faturasını Kaydet"
            : "Faturayı Kaydet ve Oluştur"}
        </span>
      </button>
    </div>
  );

  // If Detail View is active (Create / Edit Invoice), render Full Page Detail Layout directly
  if (detailNav.isDetailView) {
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
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Sol Taraf: Form Alanları ve Kalemler Tablosu (8 Kolon) */}
            <div className="xl:col-span-8 min-w-0 space-y-6">
<form id="invoice-create-form" onSubmit={handleSaveInvoice} className="space-y-5 min-w-0">
              {/* AI OCR Scanner Shortcut for Gider Faturaları */}
              {(forcedType === "purchase" || invType === "purchase") && (
                <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-purple-500/10 p-3 rounded-2xl border border-amber-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Sparkles className="w-4 h-4 text-amber-100 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-amber-950">
                          Faturanız Var mı?
                        </span>
                        <span className="bg-amber-200/80 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                          AI OCR Otomatik Doldurma
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium">
                        Fotoğraf veya PDF yükleyin; firma ünvanı, VKN, tutar, KDV ve masraf kalemi anında doldurulsun.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAiScannerModalOpen(true);
                    }}
                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all shrink-0 active:scale-95"
                  >
                    <UploadCloud className="w-4 h-4 text-amber-200" />
                    <span>AI ile Fatura Tara</span>
                  </button>
                </div>
              )}

              {/* Fatura Tipi / Profili Seçim Barı (GİB e-Fatura / e-Arşiv Standartları) */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-purple-600" />
                    <span>Fatura Türü / Profili (GİB Standardı):</span>
                  </label>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                    {invoiceProfileType}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {[
                    { type: "SATIS", label: "SATIŞ", desc: "Standart Satış", activeBg: "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-400" },
                    { type: "TEVKIFAT", label: "⭐ TEVKİFAT", desc: "KDV Tevkifatlı (5/10 vb.)", activeBg: "bg-purple-700 text-white border-purple-700 shadow-md ring-2 ring-purple-400" },
                    { type: "OZELMATRAH", label: "ÖZEL MATRAH", desc: "2. El Araç / Kâr Marjı", activeBg: "bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-400" },
                    { type: "ISTISNA", label: "İSTİSNA", desc: "%0 KDV Muafiyeti", activeBg: "bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-400" },
                    { type: "IADE", label: "İADE", desc: "Alış/Satış İade", activeBg: "bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-400" },
                    { type: "IHRACKAYITLI", label: "İHRAÇ KAYITLI", desc: "3065 SK. 11/1-c", activeBg: "bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400" },
                  ].map((p) => {
                    const isSelected = invoiceProfileType === p.type;
                    return (
                      <button
                        key={p.type}
                        type="button"
                        onClick={() => handleSelectInvoiceProfile(p.type as InvoiceProfileType)}
                        className={`p-2.5 rounded-xl text-left transition-all border cursor-pointer active:scale-95 flex flex-col justify-between ${
                          isSelected
                            ? p.activeBg
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-black tracking-tight">{p.label}</span>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          )}
                        </div>
                        <div className={`text-[10px] mt-0.5 truncate ${isSelected ? "text-white/80" : "text-slate-500"}`}>
                          {p.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Top Controls & Selected Cari Information */}
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
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
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={11}
                        placeholder="10 VKN / 11 TCKN..."
                        value={vknSearchInput}
                        onChange={(e) => handleVknInputChange(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* 2. Cari Hesap Seçimi (Daraltılmış / Dengeli Alan) */}
                  <div className="flex-1 min-w-[180px]">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        Cari Hesap *
                      </label>
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
                    <select
                      value={contactId}
                      onChange={(e) => handleContactSelectChange(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 truncate shadow-2xs"
                    >
                      {contacts.map((c) => (
                        <option key={c.id} value={c.id}>
                          [{getContactAccountCode(c)}] {c.name} {c.taxNumber ? `(VKN: ${c.taxNumber})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Fatura Numarası (Yeni Eklenen Bölüm) */}
                  <div className="w-full md:w-40 lg:w-44 shrink-0">
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-purple-600" />
                      <span>Fatura Numarası *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: MUV20260000001"
                      value={invoiceNumberInput}
                      onChange={(e) => setInvoiceNumberInput(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                    />
                  </div>

                  {/* 4. Fatura Tarihi (Kompakt Tarih Alanı) */}
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

                  return (
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
                          <span className="font-extrabold text-slate-900 text-sm">
                            {selectedContact.name}
                          </span>
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

                      {(selectedContact.address || selectedContact.district || selectedContact.city) && (
                        <div className="pt-1.5 border-t border-slate-100 text-[11px] text-slate-600 flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>
                            {[selectedContact.address, selectedContact.neighborhood, selectedContact.street, selectedContact.district, selectedContact.city]
                              .filter(Boolean)
                              .join(" - ")}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

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
                      onClick={() => {
                        setTargetItemRowId(null);
                        setIsProductPickerOpen(true);
                      }}
                      className="text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all active:scale-95"
                      title="Stok listesinden seçip faturaya yeni kalem ekleyin"
                    >
                      <Package className="w-3.5 h-3.5 text-purple-200" />
                      <span>Stok Listesinden Seç & Ekle</span>
                    </button>
                    {onSelectTab && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreateModalOpen(false);
                          onSelectTab("products");
                        }}
                        className="text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                        title="Stok & Hizmet Listesine Git"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Stok Listesine Git</span>
                      </button>
                    )}
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
                  <table className="w-full text-left text-xs min-w-[720px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                        <th className="py-2 px-3">
                          <span>{invType === "purchase" ? "Masraf Kalemi / Açıklama" : "Ürün / Açıklama"}</span>
                        </th>
                        <th className="py-2 px-3 w-20 text-center">Miktar</th>
                        <th className="py-2 px-3 w-20 text-center">Birim</th>
                        <th className="py-2 px-3 w-28 text-right">Birim Fiyat</th>
                        <th className="py-2 px-3 w-20 text-center">KDV %</th>
                        <th className="py-2 px-3 w-32 text-center">Tevkifat / Matrah</th>
                        <th className="py-2 px-3 w-28 text-right">Toplam (TL)</th>
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
                                  <div className="flex items-center gap-1.5">
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
                                    {products.length > 0 && (
                                      <select
                                        value={item.productId || ""}
                                        onChange={(e) =>
                                          handleItemChange(item.id, "productId", e.target.value)
                                        }
                                        className="w-48 bg-slate-50 border border-slate-200 rounded-lg p-1 text-[11px] font-medium text-slate-900 truncate"
                                        title="Stok listesinden ürün bağla"
                                      >
                                        <option value="">-- Stok Bağla --</option>
                                        {products.map((p) => (
                                          <option key={p.id} value={p.id}>
                                            {p.name} (₺{p.buyPrice})
                                          </option>
                                        ))}
                                      </select>
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
                                  <div className="flex items-center gap-1.5">
                                    {products.length > 0 && (
                                      <select
                                        value={item.productId || ""}
                                        onChange={(e) =>
                                          handleItemChange(item.id, "productId", e.target.value)
                                        }
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 text-[11px] font-medium text-slate-900"
                                      >
                                        <option value="">-- Stok Listesinden Seç --</option>
                                        {products.map((p) => (
                                          <option key={p.id} value={p.id}>
                                            {p.stockType ? `[${p.stockType}] ` : ""}{p.name} {p.barcode ? `(Barkod: ${p.barcode})` : ""} - ₺{invType === "sales" ? p.sellPrice : p.buyPrice}
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setTargetItemRowId(item.id);
                                        setIsProductPickerOpen(true);
                                      }}
                                      className="bg-purple-100 hover:bg-purple-200 text-purple-900 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                                      title="Stok Listesinden Seç ve Ekle"
                                    >
                                      <Package className="w-3.5 h-3.5 text-purple-700" />
                                      <span>Stok Seç & Ekle</span>
                                    </button>
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

                          {/* Vergi & Tevkifat / Özel Matrah Ayar Butonu */}
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => setTaxModalItem(item)}
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Calculations Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end pt-2">
                <div className="space-y-3">
                  <div className="w-full sm:w-48">
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-purple-600" />
                      <span>Son Ödeme (Vade) Tarihi *</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Fatura Alt Notu / Şartlar
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      placeholder="Ödeme koşulları, banka hesap/IBAN bilgileri veya fatura notlarınızı buraya ekleyebilirsiniz..."
                    />
                  </div>
                </div>

                {(() => {
                  const totals = calculateTotals();
                  return (
                    <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between text-slate-500">
                        <span>Ara Toplam (KDV Hariç):</span>
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
                {invType === "sales" && formDocKind === "invoice" && !editingInvoiceId && (
                  <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-3 space-y-2">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sendToMysoft}
                        onChange={(event) => setSendToMysoft(event.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span>
                        <span className="block text-xs font-bold text-purple-950">
                          Resmi e-fatura / e-arşiv olarak kes (Mysoft)
                        </span>
                        <span className="block text-[11px] text-purple-800/80 mt-0.5">
                          Sağdaki Mysoft sekmesinde portal şablonunuzla taslak önizleme alınır.
                        </span>
                      </span>
                    </label>
                    {sendToMysoft && (
                      <div className="pl-6 space-y-3">
                        <MysoftTenantPicker
                          variant="compact"
                          hintVkn={companySettings.tenantIdentifierNumber}
                          onSelect={setMysoftTenantVkn}
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
                            onClick={() => setMysoftEDocType("e_fatura")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                              mysoftEDocType === "e_fatura"
                                ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <span>e-Fatura</span>
                            {recipientStatus?.isEFaturaUser && (
                              <span className="text-[9px] bg-emerald-400 text-emerald-950 px-1 py-0.2 rounded font-extrabold">Önerilen</span>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setMysoftEDocType("e_arsiv")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                              mysoftEDocType === "e_arsiv"
                                ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <span>e-Arşiv</span>
                            {recipientStatus && !recipientStatus.isEFaturaUser && (
                              <span className="text-[9px] bg-sky-300 text-sky-950 px-1 py-0.2 rounded font-extrabold">Önerilen</span>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                    {mysoftSaveError && (
                      <p className="text-[11px] font-semibold text-rose-700 pl-6">{mysoftSaveError}</p>
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
                    {editingInvoiceId
                      ? "Değişiklikleri Güncelle & Kaydet"
                      : forcedType === "sales" || invType === "sales"
                        ? formDocKind === "receipt"
                          ? "Gelir Fişini Kaydet"
                          : sendToMysoft
                            ? isSavingMysoft
                              ? "Mysoft'a Gönderiliyor..."
                              : "Kaydet & Mysoft'a Kes"
                            : "Gelir Faturasını Kaydet & Kes"
                        : forcedType === "purchase" || invType === "purchase"
                          ? formDocKind === "receipt"
                            ? "Gider Fişini Kaydet"
                            : "Gider Faturasını Kaydet"
                          : "Faturayı Kaydet ve Oluştur"}
                  </button>
                </div>
              </div>
            </form>
            </div>

            {/* Sağ Taraf: Canlı Hesaplama Özeti ve Belge Önizleme (4 Kolon) */}
            <div className="xl:col-span-4 min-w-0 space-y-6 xl:sticky xl:top-20">
              {/* Canlı Hesaplama Özeti Kartı */}
              {(() => {
                const totals = calculateTotals();
                return (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-purple-600" />
                        <span>Fatura Hesaplama Özeti</span>
                      </h3>
                      <span className="text-[11px] font-bold text-slate-500 font-mono">
                        {items.length} Kalem
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Ara Toplam (KDV Hariç):</span>
                        <span className="font-mono font-bold text-slate-900">
                          ₺{totals.subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {totals.effectiveTaxableAmount !== totals.subtotal && (
                        <div className="flex justify-between text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200 font-medium">
                          <span>Özel KDV Matrahı:</span>
                          <span className="font-mono font-bold">
                            ₺{totals.effectiveTaxableAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between text-slate-600">
                        <span>Toplam Hesaplanan KDV:</span>
                        <span className="font-mono font-bold text-slate-900">
                          ₺{totals.totalVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {totals.totalWithholding > 0 && (
                        <div className="flex justify-between text-purple-700 font-medium bg-purple-50 p-2 rounded-xl border border-purple-100">
                          <span className="font-bold">(-) Tevkif Edilen KDV:</span>
                          <span className="font-mono font-black">
                            -₺{totals.totalWithholding.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}

                      {totals.totalWithholding > 0 && (
                        <div className="flex justify-between text-slate-700 text-xs">
                          <span>Beyan Edilecek KDV:</span>
                          <span className="font-mono font-bold">
                            ₺{totals.payableVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}

                      <div className="pt-3 border-t border-slate-200">
                        <div className="flex justify-between items-baseline bg-gradient-to-r from-purple-50 via-fuchsia-50/50 to-purple-50 p-3.5 rounded-xl border border-purple-200">
                          <div>
                            <span className="block text-xs font-black text-purple-950 uppercase tracking-tight">Ödenecek Tutar:</span>
                            <span className="text-[10px] text-purple-700 font-medium">Genel Toplam (KDV Dahil)</span>
                          </div>
                          <span className="text-xl font-black font-mono text-purple-950">
                            ₺{totals.payableAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Canlı Belge Önizlemesi Kartı */}
              {showCreatePreviewPanel && (
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <Eye className="w-3.5 h-3.5 text-purple-600" />
                      <span>GİB / Mysoft Canlı Belge Şablonu</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                      {mysoftEDocType === "e_arsiv" ? "e-Arşiv" : "e-Fatura"}
                    </span>
                  </div>
                  <InvoiceCreatePreviewPanel
                    invoice={getDraftInvoice()}
                    companySettings={companySettings}
                    contact={contacts.find((c) => c.id === contactId)}
                    mysoftEnabled={sendToMysoft && !editingInvoiceId}
                    eDocumentLabel={mysoftEDocType === "e_arsiv" ? "e-Arşiv" : "e-Fatura"}
                    buildMysoftPayload={buildMysoftPreviewPayload}
                  />
                </div>
              )}

              {/* Sağ Yan Hızlı İşlem Kartı */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                <button
                  type="submit"
                  form="invoice-create-form"
                  disabled={isSavingMysoft}
                  className={`w-full py-3 rounded-xl text-xs font-black text-white shadow-2xs cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 transition-all active:scale-95 ${
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
                    {editingInvoiceId
                      ? "Değişiklikleri Güncelle & Kaydet"
                      : forcedType === "sales" || invType === "sales"
                      ? formDocKind === "receipt"
                        ? "Gelir Fişini Kaydet"
                        : sendToMysoft
                        ? isSavingMysoft
                          ? "Mysoft'a Gönderiliyor..."
                          : "Kaydet & Mysoft'a Kes"
                        : "Gelir Faturasını Kaydet & Kes"
                      : forcedType === "purchase" || invType === "purchase"
                      ? formDocKind === "receipt"
                        ? "Gider Fişini Kaydet"
                        : "Gider Faturasını Kaydet"
                      : "Faturayı Kaydet ve Oluştur"}
                  </span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDraftPreviewOpen(true)}
                    className="py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-indigo-600" />
                    <span>{formDocKind === "receipt" ? "Fişi Önizle" : "Önizle"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseDetail}
                    className="py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer text-center"
                  >
                    Vazgeç / İptal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </DetailPageLayout>

        {/* Detail Sayfasında Açılabilen Yardımcı Diyaloglar */}
        {isDraftPreviewOpen && (
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
          />
        )}

        {taxModalItem && (
          <InvoiceTaxSettingsModal
            isOpen={true}
            item={taxModalItem}
            currency="TRY"
            onClose={() => setTaxModalItem(null)}
            onApply={(updatedItem) => {
              setItems((prev) =>
                prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
              );
              if (updatedItem.withholdingCode && invoiceProfileType === "SATIS") {
                setInvoiceProfileType("TEVKIFAT");
              } else if (updatedItem.specialTaxBaseReasonCode && invoiceProfileType === "SATIS") {
                setInvoiceProfileType("OZELMATRAH");
              } else if (updatedItem.vatExemptionReasonCode && invoiceProfileType === "SATIS") {
                setInvoiceProfileType("ISTISNA");
              }
            }}
          />
        )}

        {isQuickContactFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <h3 className="font-extrabold text-slate-900 text-sm">Hızlı Yeni Cari Ekle</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQuickContactFormOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
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
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">VKN / TCKN</label>
                  <input
                    type="text"
                    maxLength={11}
                    placeholder="10 VKN veya 11 TCKN..."
                    value={newContactTaxNo}
                    onChange={(e) => setNewContactTaxNo(e.target.value.replace(/\D/g, "").slice(0, 11))}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Telefon</label>
                  <input
                    type="text"
                    placeholder="05xx xxx xx xx"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cari Tipi</label>
                  <select
                    value={newContactType}
                    onChange={(e) => setNewContactType(e.target.value as "customer" | "vendor" | "both")}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  >
                    <option value="customer">Müşteri (Satış Yapılan)</option>
                    <option value="vendor">Tedarikçi (Alış Yapılan)</option>
                    <option value="both">Müşteri & Tedarikçi</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuickContactFormOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleQuickCreateContact}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-sm"
                >
                  Cariyi Kaydet & Seç
                </button>
              </div>
            </div>
          </div>
        )}

        {isContactPickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  <h3 className="font-extrabold text-sm">Cari Hesap Rehberi</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsContactPickerOpen(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-3 border-b border-slate-100 bg-slate-50 flex gap-2 shrink-0">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cari adı, unvan veya VKN ile ara..."
                    value={contactPickerSearch}
                    onChange={(e) => setContactPickerSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsContactPickerOpen(false);
                    setIsQuickContactFormOpen(true);
                  }}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Yeni Ekle</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-slate-100">
                {contacts
                  .filter(
                    (c) =>
                      c.name.toLowerCase().includes(contactPickerSearch.toLowerCase()) ||
                      (c.taxNumber && c.taxNumber.includes(contactPickerSearch))
                  )
                  .map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        handleContactSelectChange(c.id);
                        setIsContactPickerOpen(false);
                      }}
                      className="p-3 hover:bg-purple-50/50 rounded-xl cursor-pointer flex items-center justify-between transition-colors pt-2"
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900">{c.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>VKN: {c.taxNumber || "—"}</span>
                          {c.taxOffice && <span>VD: {c.taxOffice}</span>}
                          {c.phone && <span>Tel: {c.phone}</span>}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-purple-700 hover:underline">Seç →</span>
                    </div>
                  ))}
              </div>
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsContactPickerOpen(false)}
                  className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        )}

        {isProductPickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-400" />
                  <h3 className="font-extrabold text-sm">Stok & Hizmet Kataloğundan Kalem Seç</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProductPickerOpen(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-3 border-b border-slate-100 bg-slate-50 flex gap-2 shrink-0">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Ürün adı, barkod veya kod ile ara..."
                    value={productPickerSearch}
                    onChange={(e) => setProductPickerSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                >
                  <option value="all">Tüm Kategoriler</option>
                  {Array.from(new Set(products.map((p) => p.category).filter(Boolean))).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {products
                  .filter((p) => {
                    const matchesSearch =
                      p.name.toLowerCase().includes(productPickerSearch.toLowerCase()) ||
                      (p.code && p.code.toLowerCase().includes(productPickerSearch.toLowerCase())) ||
                      (p.barcode && p.barcode.includes(productPickerSearch));
                    const matchesCategory =
                      productCategoryFilter === "all" || p.category === productCategoryFilter;
                    return matchesSearch && matchesCategory;
                  })
                  .map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        handleSelectProductFromPicker(p);
                        setIsProductPickerOpen(false);
                      }}
                      className="p-3 border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 rounded-xl cursor-pointer flex items-center justify-between transition-all"
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {p.stockType && (
                            <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px] uppercase font-bold">
                              {p.stockType}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-1">
                          <span>Kod: {p.code || "—"}</span>
                          {p.barcode && <span>Barkod: {p.barcode}</span>}
                          <span>Stok: {p.stockQuantity} {p.unit}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-xs text-purple-700">
                          ₺{invType === "purchase" ? p.buyPrice.toLocaleString("tr-TR") : p.sellPrice.toLocaleString("tr-TR")}
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold">+%{p.vatRate ?? 20} KDV</span>
                      </div>
                    </div>
                  ))}
              </div>
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsProductPickerOpen(false)}
                  className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        )}

        {isAiScannerModalOpen && (
          <AiExpenseScannerModal
            isOpen={isAiScannerModalOpen}
            onClose={() => setIsAiScannerModalOpen(false)}
            contacts={contacts}
            accounts={accounts}
            onSaveInvoiceDirectly={handleSaveInvoiceDirectlyFromAi}
            onApplyToForm={handleApplyAiDataToForm}
          />
        )}
      </div>
    );
  }

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
               ? "Gelir Faturaları"
               : forcedType === "purchase"
               ? "Gider Faturaları"
               : "Gelir & Gider Faturaları"}
          </h2>
          <p className="text-xs font-semibold text-purple-950/90 mt-1 leading-relaxed">
            {forcedType === "sales"
              ? "Müşterilerinize düzenlediğiniz satış faturaları ve tahsilat takibi."
              : forcedType === "purchase"
              ? "Tedarikçilerden gelen alış/gider faturaları ve ödeme takibi."
              : "Resmi e-Fatura / e-Arşiv uyumlu faturalarınızı oluşturun ve ödeme takibi yapın."}
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsCollectAllModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all shrink-0"
            title="Tüm açık/ödenmemiş faturaları topluca tahsil et"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-100" />
            <span>Tümünü Tahsil Et</span>
          </button>

          {forcedType === "sales" ? (
            <button
              onClick={() => handleOpenNewInvoiceModal("invoice", "sales")}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Yeni Gelir Faturası Kes</span>
            </button>
          ) : forcedType === "purchase" ? (
            <>
              <button
                onClick={() => setIsAiScannerModalOpen(true)}
                className="bg-gradient-to-r from-amber-600 via-orange-600 to-purple-600 hover:from-amber-700 hover:to-purple-700 text-white font-extrabold text-xs py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all shrink-0 hover:scale-[1.02] active:scale-98 ring-2 ring-amber-300/40"
                title="Yapay Zeka (AI OCR) ile fatura fotoğrafı veya PDF yükleyip otomatik ayrıştırın"
              >
                <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
                <span>✨ AI Fatura Tara & Ekle</span>
              </button>
              <button
                onClick={() => handleOpenNewInvoiceModal("invoice", "purchase")}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Yeni Gider Faturası</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAiScannerModalOpen(true)}
                className="bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-700 hover:to-purple-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all shrink-0"
                title="Yapay Zeka ile Fatura Tara"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>✨ AI Fatura Tara</span>
              </button>
              <button
                onClick={() => handleOpenNewInvoiceModal("invoice", forcedType || "sales")}
                className="bg-purple-700/15 hover:bg-purple-700/25 text-purple-950 border border-purple-400/50 backdrop-blur-md font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all shrink-0"
              >
                <Plus className="w-4 h-4 text-purple-800 font-bold" />
                <span>Yeni Fatura Kes / Kaydet</span>
              </button>
            </div>
          )}
        </div>
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

        {/* Search, Year/Month & Export */}
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

          {/* Masraf Kalemi Filtresi (Gider Modülü veya Gider Seçiliyken) */}
          {(forcedType === "purchase" || filterType === "purchase") && (
            <div className="flex items-center gap-1.5 bg-white border border-amber-300/80 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
              <Tag className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="text-slate-400 font-bold">Masraf:</span>
              <select
                value={selectedExpenseCategoryFilter}
                onChange={(e) => setSelectedExpenseCategoryFilter(e.target.value)}
                className="bg-transparent font-extrabold text-amber-900 focus:outline-none cursor-pointer max-w-[150px] truncate"
              >
                <option value="all">Tüm Kalemler ({EXPENSE_CATEGORIES.length})</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(selectedYear !== "all" || selectedMonth !== "all" || selectedExpenseCategoryFilter !== "all") && (
            <button
              onClick={() => {
                setSelectedYear("all");
                setSelectedMonth("all");
                setSelectedExpenseCategoryFilter("all");
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              title="Filtreleri temizle"
            >
              <X className="w-3.5 h-3.5" />
              <span>Temizle</span>
            </button>
          )}

          <div className="relative w-full sm:w-64">
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
      <div className="bg-slate-50/60 rounded-2xl border border-purple-200/60 p-2 sm:p-3 shadow-2xs">
        <div className="overflow-x-auto custom-scrollbar w-full">
          <table className="w-full text-left text-xs border-separate border-spacing-y-2.5 min-w-[750px]">
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
                  <td colSpan={7} className="text-center py-10 text-slate-400 bg-white rounded-xl border border-purple-100/80">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="w-8 h-8 text-purple-200" />
                      <p className="font-semibold text-slate-600">
                        {forcedType === "sales"
                          ? docSubTab === "receipts"
                            ? "Kayıtlı gelir fişi bulunamadı."
                            : docSubTab === "invoices"
                            ? "Kayıtlı gelir faturası bulunamadı."
                            : "Kayıtlı gelir faturası veya fişi bulunamadı."
                          : forcedType === "purchase"
                          ? docSubTab === "receipts"
                            ? "Kayıtlı gider fişi bulunamadı."
                            : docSubTab === "invoices"
                            ? "Kayıtlı gider faturası bulunamadı."
                            : "Kayıtlı gider faturası veya fişi bulunamadı."
                          : "Kayıtlı fatura bulunamadı."}
                      </p>
                      <p className="text-xs text-slate-400">
                        {forcedType === "sales"
                          ? docSubTab === "receipts"
                            ? "Yukarıdaki '+ Yeni Gelir Fişi Ekle' butonuyla yeni fiş ekleyebilirsiniz."
                            : "Yukarıdaki '+ Yeni Gelir Faturası Kes' butonuyla yeni fatura oluşturabilirsiniz."
                          : forcedType === "purchase"
                          ? docSubTab === "receipts"
                            ? "Yukarıdaki '+ Yeni Gider Fişi Ekle' butonuyla yeni fiş ekleyebilirsiniz."
                            : "Yukarıdaki '+ Yeni Gider Faturası Kaydet' butonuyla yeni fatura oluşturabilirsiniz."
                          : "Yeni fatura eklemek için yukarıdaki butonu kullanabilirsiniz."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="bg-white hover:bg-gradient-to-r hover:from-purple-50/90 hover:via-fuchsia-50/60 hover:to-purple-50/90 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group rounded-xl relative z-0 hover:z-10"
                  >
                    <td className="py-3.5 px-4 rounded-l-xl border-y border-l border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <div className="font-extrabold text-slate-900 group-hover:text-purple-950 font-mono text-sm transition-colors">
                        {inv.invoiceNumber}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {inv.type === "sales" ? (
                          inv.docKind === "receipt" ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 group-hover:border-indigo-300">
                              <FileSpreadsheet className="w-2.5 h-2.5 text-indigo-600" />
                              Gelir Fişi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-purple-50 text-purple-700 border border-purple-200 group-hover:border-purple-300">
                              <FileText className="w-2.5 h-2.5 text-purple-600" />
                              Gelir Faturası
                            </span>
                          )
                        ) : inv.docKind === "receipt" ? (
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-orange-50 text-orange-700 border border-orange-200 group-hover:border-orange-300">
                              <FileSpreadsheet className="w-2.5 h-2.5 text-orange-600" />
                              Gider Fişi
                            </span>
                            {(inv.expenseCategory || inv.items.find((i) => i.expenseCategory)?.expenseCategory) && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 text-amber-900 border border-amber-200 group-hover:border-amber-300">
                                <Tag className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                <span className="truncate max-w-[130px]">
                                  {inv.expenseCategory || inv.items.find((i) => i.expenseCategory)?.expenseCategory}
                                </span>
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200 group-hover:border-amber-300">
                              <FileText className="w-2.5 h-2.5 text-amber-600" />
                              Gider Faturası
                            </span>
                            {(inv.expenseCategory || inv.items.find((i) => i.expenseCategory)?.expenseCategory) && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 text-amber-900 border border-amber-200 group-hover:border-amber-300">
                                <Tag className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                <span className="truncate max-w-[130px]">
                                  {inv.expenseCategory || inv.items.find((i) => i.expenseCategory)?.expenseCategory}
                                </span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      {/* Cari (Contact) link */}
                      {onSelectTab ? (
                        <button
                          type="button"
                          onClick={() => onSelectTab("contacts")}
                          className="text-left font-extrabold text-slate-900 group-hover:text-purple-950 hover:text-purple-700 hover:underline cursor-pointer inline-flex items-center gap-1.5 transition-colors group/carilink text-xs"
                          title="Cari Hesaplar Listesine Git"
                        >
                          <span>{inv.contactName}</span>
                          <Users className="w-3.5 h-3.5 text-purple-600 opacity-70 group-hover/carilink:opacity-100 group-hover/carilink:scale-110 transition-all shrink-0" />
                        </button>
                      ) : (
                        <div className="font-extrabold text-slate-900 group-hover:text-purple-950 text-xs">
                          {inv.contactName}
                        </div>
                      )}

                      {/* Item / Stock shortcut */}
                      {inv.items.length > 0 && (
                        <div className="mt-0.5">
                          {onSelectTab ? (
                            <button
                              type="button"
                              onClick={() => onSelectTab("products")}
                              className="text-[10px] text-slate-500 hover:text-purple-700 hover:underline cursor-pointer flex items-center gap-1 transition-colors group/itemlink truncate max-w-[220px]"
                              title="Stok & Hizmet Listesine Git"
                            >
                              <Package className="w-3 h-3 text-purple-500 shrink-0 opacity-70 group-hover/itemlink:opacity-100" />
                              <span className="truncate">{inv.items[0]?.description}</span>
                              {inv.items.length > 1 && (
                                <span className="text-slate-400 text-[9px] shrink-0 font-medium">
                                  (+{inv.items.length - 1})
                                </span>
                              )}
                            </button>
                          ) : (
                            <div className="text-[10px] text-slate-500 truncate max-w-[220px]">
                              {inv.items[0]?.description}
                            </div>
                          )}
                        </div>
                      )}

                      {inv.taxNumber && (
                        <div className="text-[10px] font-normal text-slate-400 group-hover:text-purple-700/60 mt-0.5">
                          VKN: {inv.taxNumber}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <div className="font-medium text-slate-800 group-hover:text-slate-900">{formatDate(inv.issueDate)}</div>
                      <div className="text-[10px] text-slate-400 group-hover:text-purple-700/60">Vade: {formatDate(inv.dueDate)}</div>
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
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEditInvoiceModal(inv)}
                          title={inv.docKind === "receipt" ? "Fişi Düzenle" : "Faturayı Düzenle"}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                          <span>Düzenle</span>
                        </button>

                        {/* Print / View Modal */}
                        <button
                          onClick={() => setPrintingInvoice(inv)}
                          title="Faturayı Görüntüle & e-Fatura Yazdır"
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Baskı / e-Fatura</span>
                        </button>

                        {/* Direct WhatsApp Share */}
                        <button
                          onClick={() => setWhatsAppInvoice(inv)}
                          title="Faturayı WhatsApp ile Paylaş"
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="hidden xl:inline">WhatsApp</span>
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

        {filteredInvoices.length > displayLimit && (
          <div className="text-center mt-4">
            <button
              onClick={() => setDisplayLimit((prev) => prev + 100)}
              className="px-4 py-2 bg-purple-100 text-purple-900 rounded-xl font-bold text-xs hover:bg-purple-200 transition-colors cursor-pointer"
            >
              Daha Fazla Göster ({displayLimit} / {filteredInvoices.length})
            </button>
          </div>
        )}
      </div>

      {/* Create / Edit modal was replaced by DetailPageLayout */}
      {/* MODAL: Draft Invoice Preview */}
      {isDraftPreviewOpen && (
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
        />
      )}

      {/* MODAL: Kalem Vergi & Tevkifat / Özel Matrah Ayarları Modalı */}
      {taxModalItem && (
        <InvoiceTaxSettingsModal
          isOpen={true}
          item={taxModalItem}
          currency="TRY"
          onClose={() => setTaxModalItem(null)}
          onApply={(updatedItem) => {
            setItems((prevItems) =>
              prevItems.map((it) => (it.id === updatedItem.id ? updatedItem : it))
            );
            if (updatedItem.withholdingCode || (updatedItem.withholdingRate && updatedItem.withholdingRate > 0)) {
              if (invoiceProfileType === "SATIS") setInvoiceProfileType("TEVKIFAT");
            } else if (updatedItem.specialTaxBaseCode || (updatedItem.specialTaxBase !== undefined && updatedItem.specialTaxBase !== null)) {
              if (invoiceProfileType === "SATIS") setInvoiceProfileType("OZELMATRAH");
            } else if (updatedItem.exemptionCode || updatedItem.vatRate === 0) {
              if (invoiceProfileType === "SATIS") setInvoiceProfileType("ISTISNA");
            }
            setTaxModalItem(null);
          }}
        />
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

      {/* WHATSAPP SHARE MODAL */}
      {whatsAppInvoice && (
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
      )}

      {/* QUICK CONTACT PICKER MODAL */}
      {isContactPickerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-purple-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-300" />
                <div>
                  <h3 className="font-bold text-sm">Cari Hesap Seç ve Faturaya Ekle</h3>
                  <p className="text-[10px] text-purple-200">
                    Faturanız için cari seçin veya hızlıca yeni cari oluşturun
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsContactPickerOpen(false)}
                className="p-1 text-purple-200 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search & Filter Controls */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={contactPickerSearch}
                    onChange={(e) => setContactPickerSearch(e.target.value)}
                    placeholder="Cari unvanı, VKN/TCKN veya telefon ara..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsQuickContactFormOpen(!isQuickContactFormOpen)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isQuickContactFormOpen ? "Aramaya Dön" : "Yeni Cari Ekle"}</span>
                </button>
              </div>

              {/* Quick Contact Form */}
              {isQuickContactFormOpen && (
                <form
                  onSubmit={handleQuickCreateContact}
                  className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-3 animate-in fade-in duration-150"
                >
                  <div className="text-xs font-bold text-purple-900 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5 text-purple-600" />
                    <span>Hızlı Cari Kaydı & Seçimi</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Cari Unvanı / Adı *"
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-900"
                    />
                    <input
                      type="text"
                      placeholder="Vergi / TCKN No"
                      value={newContactTaxNo}
                      onChange={(e) => setNewContactTaxNo(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-900"
                    />
                    <input
                      type="text"
                      placeholder="Telefon No"
                      value={newContactPhone}
                      onChange={(e) => setNewContactPhone(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-900"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <select
                      value={newContactType}
                      onChange={(e) => setNewContactType(e.target.value as any)}
                      className="bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-800"
                    >
                      <option value="both">Müşteri & Tedarikçi</option>
                      <option value="customer">Sadece Müşteri</option>
                      <option value="vendor">Sadece Tedarikçi</option>
                    </select>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white cursor-pointer"
                    >
                      Cariyi Kaydet ve Faturada Seç
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Contact List Grid */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2 max-h-[50vh]">
              {contacts.filter((c) => {
                const q = contactPickerSearch.toLowerCase();
                return (
                  c.name.toLowerCase().includes(q) ||
                  (c.taxNumber && c.taxNumber.includes(q)) ||
                  (c.phone && c.phone.includes(q))
                );
              }).length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Aramanıza uygun cari hesap bulunamadı. "Yeni Cari Ekle" butonu ile hızlıca ekleyebilirsiniz.
                </div>
              ) : (
                contacts
                  .filter((c) => {
                    const q = contactPickerSearch.toLowerCase();
                    return (
                      c.name.toLowerCase().includes(q) ||
                      (c.taxNumber && c.taxNumber.includes(q)) ||
                      (c.phone && c.phone.includes(q))
                    );
                  })
                  .map((c) => (
                    <div
                      key={c.id}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        contactId === c.id
                          ? "bg-purple-50/80 border-purple-300 ring-1 ring-purple-400"
                          : "bg-white border-slate-200 hover:border-purple-200 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-900 truncate">
                            {c.name}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 text-[9px] font-bold rounded uppercase ${
                              c.contactType === "customer"
                                ? "bg-blue-50 text-blue-700"
                                : c.contactType === "vendor"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-purple-50 text-purple-700"
                            }`}
                          >
                            {c.contactType === "customer"
                              ? "Müşteri"
                              : c.contactType === "vendor"
                              ? "Tedarikçi"
                              : "Müşteri & Tedarikçi"}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-3">
                          {c.taxNumber && <span>VKN: {c.taxNumber}</span>}
                          {c.phone && <span>Tel: {c.phone}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {onSelectTab && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsContactPickerOpen(false);
                              setIsCreateModalOpen(false);
                              onSelectTab("contacts");
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                            title="Cari detaylarına git"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setContactId(c.id);
                            setVknSearchInput(c.taxNumber ? c.taxNumber.replace(/\D/g, "") : "");
                            setIsContactPickerOpen(false);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                            contactId === c.id
                              ? "bg-emerald-600 text-white"
                              : "bg-purple-600 hover:bg-purple-700 text-white shadow-2xs"
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{contactId === c.id ? "Seçildi" : "Seç & Faturaya Ekle"}</span>
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              {onSelectTab ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsContactPickerOpen(false);
                    setIsCreateModalOpen(false);
                    onSelectTab("contacts");
                  }}
                  className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Cari Hesap Listesine Git (Tam Sayfa)</span>
                </button>
              ) : (
                <div></div>
              )}
              <button
                type="button"
                onClick={() => setIsContactPickerOpen(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK PRODUCT / STOCK PICKER MODAL */}
      {isProductPickerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-purple-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-300" />
                <div>
                  <h3 className="font-bold text-sm">Stok & Hizmet Listesinden Seç ve Faturaya Ekle</h3>
                  <p className="text-[10px] text-purple-200">
                    Ürün veya hizmetinizi arayın, tek tıkla faturalandırma kalemlerinize ekleyin
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProductPickerOpen(false)}
                className="p-1 text-purple-200 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={productPickerSearch}
                  onChange={(e) => setProductPickerSearch(e.target.value)}
                  placeholder="Ürün adı, stok kodu, barkod veya seri numarası ara..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Product List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2.5 max-h-[55vh]">
              {products.filter((p) => {
                const q = productPickerSearch.toLowerCase();
                return (
                  p.name.toLowerCase().includes(q) ||
                  (p.code && p.code.toLowerCase().includes(q)) ||
                  (p.barcode && p.barcode.toLowerCase().includes(q)) ||
                  (p.imeiOrSerialNo && p.imeiOrSerialNo.toLowerCase().includes(q))
                );
              }).length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Aradığınız kriterlere uygun stok/hizmet bulunamadı.
                </div>
              ) : (
                products
                  .filter((p) => {
                    const q = productPickerSearch.toLowerCase();
                    return (
                      p.name.toLowerCase().includes(q) ||
                      (p.code && p.code.toLowerCase().includes(q)) ||
                      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
                      (p.imeiOrSerialNo && p.imeiOrSerialNo.toLowerCase().includes(q))
                    );
                  })
                  .map((p) => {
                    const price = invType === "sales" ? p.sellPrice : p.buyPrice;
                    return (
                      <div
                        key={p.id}
                        className="p-3.5 bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50/20 rounded-xl transition-all flex items-center justify-between gap-4 group"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-slate-900 group-hover:text-purple-950">
                              {p.name}
                            </span>
                            {p.stockType && (
                              <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                {p.stockType}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 font-medium">
                            {p.code && <span>Kod: <strong className="text-slate-700">{p.code}</strong></span>}
                            {p.barcode && <span>Barkod: <strong className="text-slate-700">{p.barcode}</strong></span>}
                            <span>Birim: <strong className="text-slate-700">{p.unit || "Adet"}</strong></span>
                            <span>Mevcut Stok: <strong className={p.stockQuantity > 0 ? "text-emerald-700 font-bold" : "text-amber-600 font-bold"}>{p.stockQuantity} {p.unit}</strong></span>
                          </div>
                        </div>

                        <div className="text-right shrink-0 space-y-1">
                          <div className="text-xs font-black text-slate-900">
                            ₺{price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            <span className="text-[10px] font-normal text-slate-400 ml-1">
                              ({invType === "sales" ? "Satış" : "Alış"})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSelectProductFromPicker(p)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-2xs cursor-pointer flex items-center gap-1.5 transition-all active:scale-95"
                          >
                            <Package className="w-3.5 h-3.5 text-purple-200" />
                            <span>Seç & Faturaya Ekle</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              {onSelectTab ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsProductPickerOpen(false);
                    setIsCreateModalOpen(false);
                    onSelectTab("products");
                  }}
                  className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Stok & Hizmet Listesine Git (Tam Sayfa)</span>
                </button>
              ) : (
                <div></div>
              )}
              <button
                type="button"
                onClick={() => setIsProductPickerOpen(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                Kapat
              </button>
            </div>
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
          onSelectTab={onSelectTab}
        />
      )}

      {/* MODAL: Collect All Invoices */}
      {isCollectAllModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Tüm Faturaları Tahsil Et & Öde</h3>
              </div>
              <button
                onClick={() => setIsCollectAllModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs text-slate-600">
              {(() => {
                const uncollectedInvoices = invoices.filter((i) => i.status !== "cancelled" && i.remainingAmount > 0);
                const totalAmount = uncollectedInvoices.reduce((acc, i) => acc + i.remainingAmount, 0);

                return (
                  <>
                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 space-y-2 text-emerald-950">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Bekleyen Fatura Sayısı:</span>
                        <span className="font-bold text-sm text-emerald-700">{uncollectedInvoices.length} Adet</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">İşlenecek Toplam Tutar:</span>
                        <span className="font-black text-base text-emerald-800">
                          ₺{totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Tahsilat / Ödemenin İşleneceği Kasa / Banka Hesabı
                      </label>
                      <select
                        value={collectAllAccountId}
                        onChange={(e) => setCollectAllAccountId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      >
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} ({acc.type === "cash" ? "Kasa" : "Banka"}) - ₺{acc.balance.toLocaleString("tr-TR")}
                          </option>
                        ))}
                      </select>
                    </div>

                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      Bu işlem sonucunda sistemdeki tüm açık, bekleyen veya kısmi ödenmiş gelir ve gider faturaları <strong>"Ödendi"</strong> statüsüne getirilecek ve kasa/banka hareketleri otomatik olarak kaydedilecektir.
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
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Evet, Hepsini Tahsil Et & Öde</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* AI Expense Scanner Modal */}
      {isAiScannerModalOpen && (
        <AiExpenseScannerModal
          isOpen={isAiScannerModalOpen}
          onClose={() => setIsAiScannerModalOpen(false)}
          contacts={contacts}
          accounts={accounts}
          onSaveInvoiceDirectly={handleSaveInvoiceDirectlyFromAi}
          onApplyToForm={handleApplyAiDataToForm}
        />
      )}
    </div>
  );
};
