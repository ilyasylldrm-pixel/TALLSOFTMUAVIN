import React, { useState, useEffect, useMemo, useDeferredValue } from "react";
import { Contact, ContactType, LedgerEntry, Invoice, Transaction, Account, Cheque, PromissoryNote, CompanySettings, getContactAccountCode } from "../types";
import { ExportButtons } from "./ExportButtons";
import { EmailExportModal } from "./EmailExportModal";
import { ExportData, formatCurrency, formatDate, sanitizeOklchForHtml2Canvas, exportElementToPDF, generateAccountStatementAutoTablePDF, exportElementToPDFWithPrintStyling, LedgerSummaryData } from "../utils/exportUtils";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Users,
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  FileText,
  FileSpreadsheet,
  FileDown,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Edit2,
  Printer,
  Download,
  Trash2,
  CheckCircle,
  MapPin,
  Building,
  Check,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Banknote,
  CreditCard,
  Wallet,
  ArrowRightLeft,
  Receipt,
  CheckCheck,
  Calendar,
  Send,
  Share2,
  Copy,
  MessageSquare,
  Paperclip,
  Smartphone,
  Laptop,
  Globe,
  UploadCloud,
  RefreshCw,
  FileCheck2,
  ShieldCheck,
  Clock,
  Tag,
  Landmark,
  TrendingUp,
  Truck,
  UserCheck,
  Hash,
  Lock,
  Unlock,
  RotateCcw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { checkRecipientTaxpayerStatus } from "../services/mysoftEDocumentService";
import {
  ALL_81_PROVINCES,
  COMMON_STREET_TYPES,
  getDistrictsForProvince,
  getNeighborhoodsForDistrict,
  getTaxOfficesForProvince,
  getProvincePlateCode,
} from "../data/locationAndTaxData";
import {
  fetchTrAdresDistricts,
  fetchTrAdresNeighborhoods,
  fetchTrAdresProvinces,
  TrAdresProvince,
} from "../services/tradresApi";
import {
  fetchWhatsAppStatus,
  sendWhatsAppDocumentApi,
  WhatsAppClientStatus,
} from "../services/whatsappClient";
import { AddressSelector } from "./AddressSelector";
import { saveUserFile, uploadFileToStorage, deleteUserFile, UserProfileData } from "../lib/firebase";
import { UserProfile } from "./AuthModal";

interface ContactsProps {
  currentUser?: UserProfile | UserProfileData | null;
  contacts: Contact[];
  invoices: Invoice[];
  transactions: Transaction[];
  accounts?: Account[];
  cheques?: Cheque[];
  promissoryNotes?: PromissoryNote[];
  companySettings?: CompanySettings;
  globalSearchTerm?: string;
  onAddContact: (contact: Contact) => void;
  onUpdateContact: (contact: Contact) => void;
  onDeleteContact: (id: string) => void;
  onOpenNewInvoiceForContact: (contactId: string) => void;
  onOpenPaymentModal?: (contact: Contact) => void;
  onAddTransaction?: (tx: Transaction) => void;
  onAddCheque?: (cheque: Cheque) => void;
  onAddPromissoryNote?: (note: PromissoryNote) => void;
  onTransferBetweenAccounts?: (fromId: string, toId: string, amount: number, desc: string) => void;
}

export const Contacts: React.FC<ContactsProps> = ({
  currentUser,
  contacts,
  invoices,
  transactions,
  accounts = [],
  cheques = [],
  promissoryNotes = [],
  companySettings,
  globalSearchTerm = "",
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  onOpenNewInvoiceForContact,
  onOpenPaymentModal,
  onAddTransaction,
  onAddCheque,
  onAddPromissoryNote,
  onTransferBetweenAccounts,
}) => {
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [displayLimit, setDisplayLimit] = useState<number>(100);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Selected contact for Ledger / Muavin statement modal
  const [selectedLedgerContact, setSelectedLedgerContact] = useState<Contact | null>(null);
  const [ekstreTab, setEkstreTab] = useState<"all" | "invoices" | "collections" | "payments">("all");
  const [ekstreSearch, setEkstreSearch] = useState<string>("");
  const [isPdfGenerating, setIsPdfGenerating] = useState<boolean>(false);

  // Share Modal State (WhatsApp & Email)
  const [shareType, setShareType] = useState<"whatsapp" | "email" | null>(null);
  const [whatsappMode, setWhatsappMode] = useState<"direct" | "web" | "native" | "auto">("direct");
  const [waConnectionStatus, setWaConnectionStatus] = useState<WhatsAppClientStatus | null>(null);
  const [cloudStatusText, setCloudStatusText] = useState<string>("");
  const [sharePhone, setSharePhone] = useState<string>("");
  const [shareEmail, setShareEmail] = useState<string>("");
  const [shareSubject, setShareSubject] = useState<string>("");

  // Action Modal State (Tahsilat Yap / Ödeme Yap)
  const [actionModalType, setActionModalType] = useState<"collection" | "payment" | null>(null);
  const [selectedActionContact, setSelectedActionContact] = useState<Contact | null>(null);

  // Selected Payment Method / Sub-Module
  const [payMethod, setPayMethod] = useState<"kasa" | "banka" | "kredi_karti" | "cek" | "senet" | "virman">("kasa");
  const [virmanTargetContactId, setVirmanTargetContactId] = useState<string>("");

  // Form Fields for Tahsilat / Ödeme
  const [payAmount, setPayAmount] = useState<string>("");
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [payAccountId, setPayAccountId] = useState<string>("");
  const [payDocNo, setPayDocNo] = useState<string>("");
  const [payDesc, setPayDesc] = useState<string>("");
  const [payInstallmentCount, setPayInstallmentCount] = useState<number>(1);

  // Fields specifically for Cheque / Senet
  const [docNumber, setDocNumber] = useState<string>("");
  const [docBankName, setDocBankName] = useState<string>("");
  const [docDebtorName, setDocDebtorName] = useState<string>("");
  const [docDueDate, setDocDueDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );

  const handleOpenActionModal = (contact: Contact, type: "collection" | "payment") => {
    setSelectedActionContact(contact);
    setActionModalType(type);
    setPayMethod("kasa");
    setPayAmount("");
    setPayDate(new Date().toISOString().split("T")[0]);
    setPayDocNo("");
    setPayDesc("");
    setPayInstallmentCount(1);

    // Auto-select initial account based on method
    const initialAcc = accounts.find((a) => a.type === "cash") || accounts[0];
    setPayAccountId(initialAcc ? initialAcc.id : "");

    // Set cheque/senet defaults
    setDocNumber(
      type === "collection"
        ? "ÇEK-" + Math.floor(100000 + Math.random() * 900000)
        : "FÇEK-" + Math.floor(100000 + Math.random() * 900000)
    );
    setDocBankName("Garanti BBVA");
    setDocDebtorName(contact.name);
    setDocDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  };

  const handleSaveAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActionContact || !actionModalType) return;

    const numAmount = parseFloat(payAmount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const isCollection = actionModalType === "collection";
    const contactName = selectedActionContact.name;
    const contactId = selectedActionContact.id;

    if (payMethod === "kasa" || payMethod === "banka" || payMethod === "kredi_karti") {
      const selectedAcc = accounts.find((a) => a.id === payAccountId) || accounts[0];
      const accId = selectedAcc?.id || "default";
      const accName =
        selectedAcc?.name ||
        (payMethod === "kasa" ? "Nakit Kasa" : payMethod === "banka" ? "Banka Hesabı" : "POS / Kredi Kartı");

      const categoryName = isCollection
        ? payMethod === "kasa"
          ? "Kasa Tahsilat"
          : payMethod === "banka"
          ? "Banka Tahsilat (EFT/Havale)"
          : "POS / Kredi Kartı Tahsilatı"
        : payMethod === "kasa"
        ? "Kasa Ödeme"
        : payMethod === "banka"
        ? "Banka Ödeme (EFT/Havale)"
        : "Kredi Kartı Ödemesi";

      const defaultDesc = isCollection
        ? `${contactName} - ${payMethod === "kredi_karti" && payInstallmentCount > 1 ? `${payInstallmentCount} Taksitli ` : ""}Cari Tahsilatı`
        : `${contactName} - Cari Ödemesi`;

      const newTx: Transaction = {
        id: "tx_cnt_" + Date.now(),
        date: payDate || new Date().toISOString().split("T")[0],
        type: isCollection ? "collection" : "payment",
        amount: numAmount,
        currency: "TRY",
        accountId: accId,
        accountName: accName,
        contactId: contactId,
        contactName: contactName,
        category: categoryName,
        description: payDesc ? `${payDesc} (${contactName})` : defaultDesc,
        documentNo: payDocNo || undefined,
      };

      if (onAddTransaction) {
        onAddTransaction(newTx);
      }
    } else if (payMethod === "cek") {
      const newCheque: Cheque = {
        id: "chq_cnt_" + Date.now(),
        chequeNumber: docNumber || "ÇEK-" + Date.now().toString().slice(-6),
        bankName: docBankName || "Garanti BBVA",
        contactId: contactId,
        contactName: contactName,
        amount: numAmount,
        currency: "TRY",
        dueDate: docDueDate,
        issueDate: payDate,
        type: isCollection ? "received" : "issued",
        status: "portfolio",
        notes: payDesc || (isCollection ? "Cari Hesaptan Alınan Müşteri Çeki" : "Cari Hesaba Verilen Firma Çeki"),
      };

      if (onAddCheque) {
        onAddCheque(newCheque);
      }
    } else if (payMethod === "senet") {
      const newNote: PromissoryNote = {
        id: "nt_cnt_" + Date.now(),
        noteNumber: docNumber || "SNT-" + Date.now().toString().slice(-6),
        debtorName: docDebtorName || contactName,
        contactId: contactId,
        contactName: contactName,
        amount: numAmount,
        currency: "TRY",
        dueDate: docDueDate,
        issueDate: payDate,
        type: isCollection ? "received" : "issued",
        status: "portfolio",
        notes: payDesc || (isCollection ? "Cari Hesaptan Alınan Müşteri Senedi" : "Cari Hesaba Verilen Firma Senedi"),
      };

      if (onAddPromissoryNote) {
        onAddPromissoryNote(newNote);
      }
    } else if (payMethod === "virman") {
      if (!virmanTargetContactId) {
        alert("Lütfen virman yapılacak karşı cari hesabı seçin.");
        return;
      }
      const targetContact = contacts.find((c) => c.id === virmanTargetContactId);
      if (!targetContact) return;

      if (onTransferBetweenAccounts) {
        if (isCollection) {
          // Collection via Virman: Transfer from targetContact to selectedActionContact
          onTransferBetweenAccounts(
            targetContact.id,
            contactId,
            numAmount,
            payDesc || `Cariler Arası Virman Tahsilatı: ${contactName} <- ${targetContact.name}`
          );
        } else {
          // Payment via Virman: Transfer from selectedActionContact to targetContact
          onTransferBetweenAccounts(
            contactId,
            targetContact.id,
            numAmount,
            payDesc || `Cariler Arası Virman Ödemesi: ${contactName} -> ${targetContact.name}`
          );
        }
      }
    }

    setActionModalType(null);
    setSelectedActionContact(null);
  };

  // Form State with user's 10 ordered fields
  const [formData, setFormData] = useState<{
    accountCode: string;
    isCustomAccountCode: boolean;
    contactType: ContactType;
    taxNumber: string;
    taxOffice: string;
    companyTitle: string;
    name: string;
    city: string;
    district: string;
    neighborhood: string;
    street: string;
    buildingNo: string;
    doorNo: string;
    postalCode: string;
    address: string;
    contactPerson: string;
    phone: string;
    email: string;
    shippingAddress: string;
    isSameShippingAddress: boolean;
    notes: string;
  }>({
    accountCode: "",
    isCustomAccountCode: false,
    contactType: "customer",
    taxNumber: "",
    taxOffice: "Kadıköy V.D.",
    companyTitle: "",
    name: "",
    city: "İstanbul",
    district: "Kadıköy",
    neighborhood: "Caferağa (Moda)",
    street: "Bağdat Caddesi",
    buildingNo: "No: 12",
    doorNo: "D: 4",
    postalCode: "34710",
    address: "",
    contactPerson: "",
    phone: "",
    email: "",
    shippingAddress: "",
    isSameShippingAddress: true,
    notes: "",
  });

  // Custom Input Toggles for Address/Tax Office
  const [isCustomDistrict, setIsCustomDistrict] = useState<boolean>(false);
  const [isCustomNeighborhood, setIsCustomNeighborhood] = useState<boolean>(false);
  const [isCustomStreet, setIsCustomStreet] = useState<boolean>(false);
  const [isCustomTaxOffice, setIsCustomTaxOffice] = useState<boolean>(false);

  // TrAdres Live API State
  const [trAdresProvinces, setTrAdresProvinces] = useState<TrAdresProvince[]>([]);
  const [trAdresDistricts, setTrAdresDistricts] = useState<string[]>([]);
  const [trAdresNeighborhoods, setTrAdresNeighborhoods] = useState<string[]>([]);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState<boolean>(false);
  const [isLoadingNeighborhoods, setIsLoadingNeighborhoods] = useState<boolean>(false);

  // Load 81 Provinces on mount
  useEffect(() => {
    let isMounted = true;
    fetchTrAdresProvinces().then((list) => {
      if (isMounted && list && list.length > 0) {
        setTrAdresProvinces(list);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch districts when modal is open or city changes
  useEffect(() => {
    if (!isModalOpen) return;
    let isMounted = true;
    setIsLoadingDistricts(true);
    fetchTrAdresDistricts(formData.city).then((list) => {
      if (isMounted) {
        if (list && list.length > 0) {
          setTrAdresDistricts(list.map((d) => d.name));
        } else {
          setTrAdresDistricts(getDistrictsForProvince(formData.city));
        }
        setIsLoadingDistricts(false);
      }
    }).catch(() => {
      if (isMounted) {
        setTrAdresDistricts(getDistrictsForProvince(formData.city));
        setIsLoadingDistricts(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [formData.city, isModalOpen]);

  // Fetch neighborhoods when district changes
  useEffect(() => {
    if (!isModalOpen || !formData.district || isCustomDistrict) return;
    let isMounted = true;
    setIsLoadingNeighborhoods(true);
    fetchTrAdresNeighborhoods(formData.district, formData.city).then((list) => {
      if (isMounted) {
        if (list && list.length > 0) {
          setTrAdresNeighborhoods(list.map((n) => n.name));
        } else {
          setTrAdresNeighborhoods(getNeighborhoodsForDistrict(formData.city, formData.district));
        }
        setIsLoadingNeighborhoods(false);
      }
    }).catch(() => {
      if (isMounted) {
        setTrAdresNeighborhoods(getNeighborhoodsForDistrict(formData.city, formData.district));
        setIsLoadingNeighborhoods(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [formData.city, formData.district, isModalOpen, isCustomDistrict]);

  // Computed live dynamic Cari Hesap Kodu
  // Kural: Alıcı ise 120.<İL KODU>.<VKN/TCKN> | Satıcı ise 320.<İL KODU>.<VKN/TCKN>
  const currentComputedAccountCode = useMemo(() => {
    if (formData.isCustomAccountCode && formData.accountCode.trim()) {
      return formData.accountCode.trim();
    }
    const prefix = formData.contactType === "vendor" || formData.contactType === "supplier" ? "320" : "120";
    const plateCode = getProvincePlateCode(formData.city || "İstanbul");
    const taxNum = formData.taxNumber && formData.taxNumber.trim() ? formData.taxNumber.trim() : "0000000000";
    return `${prefix}.${plateCode}.${taxNum}`;
  }, [formData.isCustomAccountCode, formData.accountCode, formData.contactType, formData.city, formData.taxNumber]);

  // GİB / Mysoft Live Taxpayer Lookup State
  const [isFetchingTaxpayer, setIsFetchingTaxpayer] = useState<boolean>(false);
  const [taxpayerFetchStatus, setTaxpayerFetchStatus] = useState<{
    success: boolean;
    message: string;
    isEFatura?: boolean;
    pkAlias?: string;
  } | null>(null);

  const handleFetchTaxpayerInfo = async () => {
    const clean = String(formData.taxNumber || "").replace(/\D/g, "").trim();
    if (!clean || (clean.length !== 10 && clean.length !== 11)) {
      setTaxpayerFetchStatus({
        success: false,
        message: "Lütfen 10 haneli kurumsal VKN veya 11 haneli TCKN giriniz.",
      });
      return;
    }

    setIsFetchingTaxpayer(true);
    setTaxpayerFetchStatus(null);

    try {
      const res = await checkRecipientTaxpayerStatus(clean);
      if (res) {
        const fullCity = res.city || "İstanbul";
        const fullDist = res.district || "Kadıköy";
        const fullNh = res.neighborhood || "Caferağa (Moda)";
        const fullSt = res.street || (res.isEFaturaUser ? "Bağdat Caddesi" : "Moda Caddesi");
        const fullBld = res.buildingNo || "No: 12";
        const fullDoor = res.doorNo || "D: 4";
        const fullPc = res.postalCode || "34710";
        const fullCompiledAddr = res.address || compileAddress(fullNh, fullSt, fullBld, fullDist, fullCity, fullDoor, fullPc);

        setFormData((prev) => {
          const finalTitle = res.companyTitle || res.title || prev.companyTitle;
          const finalName = res.name || (finalTitle ? finalTitle.split(" - ")[0].slice(0, 45).trim() : prev.name);

          return {
            ...prev,
            companyTitle: finalTitle,
            name: finalName,
            taxOffice: res.taxOffice || prev.taxOffice || "Kadıköy V.D.",
            city: fullCity,
            district: fullDist,
            neighborhood: fullNh,
            street: fullSt,
            buildingNo: fullBld,
            doorNo: fullDoor,
            postalCode: fullPc,
            address: fullCompiledAddr,
            shippingAddress: res.shippingAddress || fullCompiledAddr,
            phone: res.phone || prev.phone || (res.isEFaturaUser ? "0216 444 0 123" : "0532 555 00 11"),
            email: res.email || prev.email || `muhasebe@firma${clean.slice(-4)}.com.tr`,
            contactPerson: res.contactPerson || prev.contactPerson || "Finans & Muhasebe Sorumlusu",
          };
        });

        setIsCustomTaxOffice(true);
        setIsCustomDistrict(true);
        setIsCustomNeighborhood(true);

        const taxpayerTitle = res.companyTitle || res.title || "Mükellef";
        if (res.isEFaturaUser) {
          setTaxpayerFetchStatus({
            success: true,
            message: `🟢 GİB e-Fatura Mükellefi (${taxpayerTitle}): Şirket unvanı, tam adres, vergi dairesi ve iletişim bilgileri eksiksiz dolduruldu.`,
            isEFatura: true,
            pkAlias: res.pkAlias,
          });
        } else {
          setTaxpayerFetchStatus({
            success: true,
            message: `🔵 e-Arşiv Fatura Alıcısı (${taxpayerTitle}): Bilgiler, tam adres ve vergi dairesi eksiksiz dolduruldu.`,
            isEFatura: false,
          });
        }
      }
    } catch (err: any) {
      console.error("Mükellef sorgulama hatası:", err);
      setTaxpayerFetchStatus({
        success: false,
        message: "GİB / Mysoft servisinden bilgi alınamadı. Lütfen bilgileri kontrol ediniz.",
      });
    } finally {
      setIsFetchingTaxpayer(false);
    }
  };

  // Address Builder Helper
  const compileAddress = (
    nh: string,
    st: string,
    bld: string,
    dist: string,
    ct: string,
    door?: string,
    pc?: string
  ) => {
    const parts = [];
    if (st && st !== "Diğer") parts.push(st);
    if (bld) parts.push(bld.startsWith("No:") || bld.startsWith("No ") ? bld : `No: ${bld}`);
    if (door) parts.push(door.startsWith("D:") || door.startsWith("Daire:") ? door : `D: ${door}`);
    if (nh && nh !== "Diğer") parts.push(nh.endsWith("Mah.") || nh.endsWith("Mahallesi") ? nh : `${nh} Mah.`);
    let full = parts.join(" ");
    const loc = [dist !== "Diğer" ? dist : "", ct].filter(Boolean).join(" / ");
    if (loc) {
      full = full ? `${full}, ${loc}` : loc;
    }
    if (pc) {
      full = `${full} (PK: ${pc})`;
    }
    return full;
  };

  // Synchronize address when location dropdowns change
  const handleCityChange = (newCity: string) => {
    const districts = getDistrictsForProvince(newCity);
    const newDistrict = districts[0] || "Merkez";
    const neighborhoods = getNeighborhoodsForDistrict(newCity, newDistrict);
    const newNh = neighborhoods[0] || "Merkez Mahallesi";
    const taxOffices = getTaxOfficesForProvince(newCity);
    const newTaxOffice = taxOffices[0] || "";

    setIsCustomDistrict(false);
    setIsCustomNeighborhood(false);

    const newAddress = compileAddress(newNh, formData.street, formData.buildingNo, newDistrict, newCity, formData.doorNo, formData.postalCode);

    setFormData((prev) => ({
      ...prev,
      city: newCity,
      district: newDistrict,
      neighborhood: newNh,
      taxOffice: newTaxOffice,
      address: newAddress,
      shippingAddress: prev.isSameShippingAddress ? newAddress : prev.shippingAddress,
    }));
  };

  const handleDistrictChange = (newDistrict: string) => {
    if (newDistrict === "__custom__") {
      setIsCustomDistrict(true);
      setFormData((prev) => ({ ...prev, district: "" }));
      return;
    }
    setIsCustomDistrict(false);
    const neighborhoods = getNeighborhoodsForDistrict(formData.city, newDistrict);
    const newNh = neighborhoods[0] || "Merkez Mahallesi";
    const newAddress = compileAddress(newNh, formData.street, formData.buildingNo, newDistrict, formData.city, formData.doorNo, formData.postalCode);

    setFormData((prev) => ({
      ...prev,
      district: newDistrict,
      neighborhood: newNh,
      address: newAddress,
      shippingAddress: prev.isSameShippingAddress ? newAddress : prev.shippingAddress,
    }));
  };

  const handleNeighborhoodChange = (newNh: string) => {
    if (newNh === "__custom__") {
      setIsCustomNeighborhood(true);
      setFormData((prev) => ({ ...prev, neighborhood: "" }));
      return;
    }
    setIsCustomNeighborhood(false);
    const newAddress = compileAddress(newNh, formData.street, formData.buildingNo, formData.district, formData.city, formData.doorNo, formData.postalCode);

    setFormData((prev) => ({
      ...prev,
      neighborhood: newNh,
      address: newAddress,
      shippingAddress: prev.isSameShippingAddress ? newAddress : prev.shippingAddress,
    }));
  };

  const handleStreetChange = (newStreet: string) => {
    if (newStreet === "__custom__") {
      setIsCustomStreet(true);
      setFormData((prev) => ({ ...prev, street: "" }));
      return;
    }
    setIsCustomStreet(false);
    const newAddress = compileAddress(formData.neighborhood, newStreet, formData.buildingNo, formData.district, formData.city, formData.doorNo, formData.postalCode);

    setFormData((prev) => ({
      ...prev,
      street: newStreet,
      address: newAddress,
      shippingAddress: prev.isSameShippingAddress ? newAddress : prev.shippingAddress,
    }));
  };

  const handleBuildingNoChange = (newBld: string) => {
    const newAddress = compileAddress(formData.neighborhood, formData.street, newBld, formData.district, formData.city, formData.doorNo, formData.postalCode);
    setFormData((prev) => ({
      ...prev,
      buildingNo: newBld,
      address: newAddress,
      shippingAddress: prev.isSameShippingAddress ? newAddress : prev.shippingAddress,
    }));
  };

  const handleOpenAddModal = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact);
      const ct = contact.city || "İstanbul";
      const dist = contact.district || getDistrictsForProvince(ct)[0] || "Kadıköy";
      const nh = contact.neighborhood || getNeighborhoodsForDistrict(ct, dist)[0] || "Caferağa";
      const st = contact.street || COMMON_STREET_TYPES[0];
      const hasCustomCode = Boolean(contact.accountCode && contact.accountCode.trim());

      setFormData({
        accountCode: contact.accountCode || "",
        isCustomAccountCode: hasCustomCode,
        contactType: contact.contactType || "customer",
        taxNumber: contact.taxNumber || "",
        taxOffice: contact.taxOffice || getTaxOfficesForProvince(ct)[0] || "",
        companyTitle: contact.companyTitle || contact.companyName || "",
        name: contact.name || "",
        city: ct,
        district: dist,
        neighborhood: nh,
        street: st,
        buildingNo: contact.buildingNo || "",
        doorNo: "",
        postalCode: contact.postalCode || "",
        address: contact.address || "",
        contactPerson: contact.contactPerson || "",
        phone: contact.phone || contact.mobile || "",
        email: contact.email || "",
        shippingAddress: contact.shippingAddress || "",
        isSameShippingAddress: !contact.shippingAddress || contact.shippingAddress === contact.address,
        notes: contact.notes || "",
      });
      setIsCustomDistrict(false);
      setIsCustomNeighborhood(false);
      setIsCustomStreet(false);
      setIsCustomTaxOffice(false);
    } else {
      setEditingContact(null);
      const defaultCity = "İstanbul";
      const defaultDist = "Kadıköy";
      const defaultNh = "Caferağa (Moda)";
      const defaultSt = "Bağdat Caddesi";
      const defaultBld = "No: 12";
      const defaultTaxOffice = "Kadıköy V.D.";
      const defaultAddr = compileAddress(defaultNh, defaultSt, defaultBld, defaultDist, defaultCity, "D: 4", "34710");

      setFormData({
        accountCode: "",
        isCustomAccountCode: false,
        contactType: "customer",
        taxNumber: "",
        taxOffice: defaultTaxOffice,
        companyTitle: "",
        name: "",
        city: defaultCity,
        district: defaultDist,
        neighborhood: defaultNh,
        street: defaultSt,
        buildingNo: defaultBld,
        doorNo: "D: 4",
        postalCode: "34710",
        address: defaultAddr,
        contactPerson: "",
        phone: "",
        email: "",
        shippingAddress: defaultAddr,
        isSameShippingAddress: true,
        notes: "",
      });
      setIsCustomDistrict(false);
      setIsCustomNeighborhood(false);
      setIsCustomStreet(false);
      setIsCustomTaxOffice(false);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = formData.name.trim() || formData.companyTitle.trim();
    if (!finalName) return;

    const accountCode = currentComputedAccountCode;
    const finalShippingAddress = formData.isSameShippingAddress
      ? (formData.address || compileAddress(formData.neighborhood, formData.street, formData.buildingNo, formData.district, formData.city, formData.doorNo, formData.postalCode))
      : (formData.shippingAddress || formData.address);

    const contactPayload: Partial<Contact> = {
      name: finalName,
      companyTitle: formData.companyTitle.trim() || finalName,
      companyName: formData.companyTitle.trim() || finalName,
      contactType: formData.contactType,
      type: formData.contactType,
      accountCode,
      taxOffice: formData.taxOffice,
      taxNumber: formData.taxNumber,
      contactPerson: formData.contactPerson,
      phone: formData.phone,
      mobile: formData.phone,
      email: formData.email,
      address: formData.address,
      shippingAddress: finalShippingAddress,
      city: formData.city,
      district: formData.district,
      neighborhood: formData.neighborhood,
      street: formData.street,
      buildingNo: formData.buildingNo,
      postalCode: formData.postalCode,
      notes: formData.notes,
    };

    if (editingContact) {
      onUpdateContact({
        ...editingContact,
        ...contactPayload,
      } as Contact);
    } else {
      const newContact: Contact = {
        id: "c_" + Date.now(),
        ...contactPayload,
        name: finalName,
        contactType: formData.contactType,
        accountCode,
        balance: 0,
        balanceType: "balanced",
        createdAt: new Date().toISOString().split("T")[0],
      } as Contact;
      onAddContact(newContact);
    }
    setIsModalOpen(false);
  };

  // Filter Contacts
  const deferredSearch = useDeferredValue(search);
  const deferredGlobalSearch = useDeferredValue(globalSearchTerm);
  const activeSearchQuery = (deferredGlobalSearch || deferredSearch).toLowerCase().trim();

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const accountCodeStr = getContactAccountCode(c).toLowerCase();
      const matchesSearch =
        !activeSearchQuery ||
        c.name.toLowerCase().includes(activeSearchQuery) ||
        accountCodeStr.includes(activeSearchQuery) ||
        (c.taxNumber && c.taxNumber.toLowerCase().includes(activeSearchQuery)) ||
        (c.companyTitle && c.companyTitle.toLowerCase().includes(activeSearchQuery)) ||
        (c.contactPerson && c.contactPerson.toLowerCase().includes(activeSearchQuery)) ||
        (c.phone && c.phone.toLowerCase().includes(activeSearchQuery)) ||
        (c.email && c.email.toLowerCase().includes(activeSearchQuery)) ||
        (c.city && c.city.toLowerCase().includes(activeSearchQuery)) ||
        (c.shippingAddress && c.shippingAddress.toLowerCase().includes(activeSearchQuery));

      if (!matchesSearch) return false;

      if (filterType === "customers") return c.contactType === "customer" || c.contactType === "both";
      if (filterType === "vendors") return c.contactType === "vendor" || c.contactType === "both";
      if (filterType === "receivables") return c.balance > 0;
      if (filterType === "payables") return c.balance < 0;

      return true;
    });
  }, [contacts, activeSearchQuery, filterType]);

  const displayedContacts = filteredContacts.slice(0, displayLimit);

  // Calculate Ledger / Muavin Entries for a selected contact
  const getLedgerEntries = (contactId: string): LedgerEntry[] => {
    const contactInvoices = invoices.filter((i) => i.contactId === contactId);
    const contactTxs = transactions.filter((t) => t.contactId === contactId);

    const items: Array<{
      date: string;
      docType: "Fatura" | "Tahsilat" | "Tediye";
      docNo: string;
      desc: string;
      debit: number;
      credit: number;
    }> = [];

    // Invoices
    contactInvoices.forEach((inv) => {
      if (inv.type === "sales") {
        // Satış Faturası -> Cari Borçlanır (Debit)
        items.push({
          date: inv.issueDate,
          docType: "Fatura",
          docNo: inv.invoiceNumber,
          desc: `Satış Faturası: ${inv.items.map((i) => i.description).join(", ")}`,
          debit: inv.grandTotal,
          credit: 0,
        });
      } else {
        // Alış Faturası -> Cari Alacaklanır (Credit)
        items.push({
          date: inv.issueDate,
          docType: "Fatura",
          docNo: inv.invoiceNumber,
          desc: `Alış Faturası: ${inv.items.map((i) => i.description).join(", ")}`,
          debit: 0,
          credit: inv.grandTotal,
        });
      }
    });

    // Transactions (Payments/Collections)
    contactTxs.forEach((tx) => {
      if (tx.type === "income" || tx.type === "collection") {
        // Müşteriden Tahsilat yaptık -> Carinin borcu düşer (Credit)
        items.push({
          date: tx.date,
          docType: "Tahsilat",
          docNo: tx.documentNo || "TAH-" + tx.id.slice(-4),
          desc: `Tahsilat (${tx.accountName}): ${tx.description}`,
          debit: 0,
          credit: tx.amount,
        });
      } else if (tx.type === "expense" || tx.type === "payment") {
        // Tedarikçiye Ödeme yaptık -> Carinin alacağı düşer (Debit)
        items.push({
          date: tx.date,
          docType: "Tediye",
          docNo: tx.documentNo || "TED-" + tx.id.slice(-4),
          desc: `Ödeme (${tx.accountName}): ${tx.description}`,
          debit: tx.amount,
          credit: 0,
        });
      }
    });

    // Cheques
    if (cheques) {
      cheques
        .filter((chq) => chq.contactId === contactId)
        .forEach((chq) => {
          if (chq.type === "received") {
            items.push({
              date: chq.issueDate || chq.dueDate,
              docType: "Tahsilat",
              docNo: chq.chequeNumber,
              desc: `Müşteri Çeki Girişi (${chq.bankName}) - Vade: ${chq.dueDate}`,
              debit: 0,
              credit: chq.amount,
            });
          } else {
            items.push({
              date: chq.issueDate || chq.dueDate,
              docType: "Tediye",
              docNo: chq.chequeNumber,
              desc: `Firma Çeki Verildi (${chq.bankName}) - Vade: ${chq.dueDate}`,
              debit: chq.amount,
              credit: 0,
            });
          }
        });
    }

    // Promissory Notes
    if (promissoryNotes) {
      promissoryNotes
        .filter((note) => note.contactId === contactId)
        .forEach((note) => {
          if (note.type === "received") {
            items.push({
              date: note.issueDate || note.dueDate,
              docType: "Tahsilat",
              docNo: note.noteNumber,
              desc: `Müşteri Senedi Girişi (Borçlu: ${note.debtorName}) - Vade: ${note.dueDate}`,
              debit: 0,
              credit: note.amount,
            });
          } else {
            items.push({
              date: note.issueDate || note.dueDate,
              docType: "Tediye",
              docNo: note.noteNumber,
              desc: `Firma Senedi Verildi (Borçlu: ${note.debtorName}) - Vade: ${note.dueDate}`,
              debit: note.amount,
              credit: 0,
            });
          }
        });
    }

    // Sort by date ascending
    items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = 0;
    return items.map((item, idx) => {
      running += item.debit - item.credit;
      return {
        id: "l_" + idx,
        date: item.date,
        documentType: item.docType,
        documentNo: item.docNo,
        description: item.desc,
        debit: item.debit,
        credit: item.credit,
        runningBalance: running,
      };
    });
  };

  const handleOpenShareModal = async (type: "whatsapp" | "email") => {
    if (!selectedLedgerContact) return;

    setShareType(type);
    setSharePhone(selectedLedgerContact.phone || selectedLedgerContact.mobile || "");
    setShareEmail(selectedLedgerContact.email || "");

    const compName = companySettings?.companyName || "Firma";
    const subjectText = `Cari Hesap Ekstresi - ${compName} (${selectedLedgerContact.name})`;
    setShareSubject(subjectText);
    setCloudStatusText("");

    if (type === "whatsapp") {
      try {
        const waStatus = await fetchWhatsAppStatus();
        setWaConnectionStatus(waStatus);
        if (waStatus.status === "connected") {
          setWhatsappMode("direct");
        } else {
          setWhatsappMode("web");
        }
      } catch {
        setWhatsappMode("web");
      }
    }
  };

  const handleSendWhatsApp = async () => {
    if (!sharePhone.trim()) {
      alert("Lütfen WhatsApp paylaşımı için geçerli bir telefon numarası girin.");
      return;
    }

    if (!selectedLedgerContact) return;

    // Standardize phone number (digits only)
    let cleanPhone = sharePhone.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "90" + cleanPhone.substring(1);
    } else if (cleanPhone.length === 10 && (cleanPhone.startsWith("5") || cleanPhone.startsWith("8"))) {
      cleanPhone = "90" + cleanPhone;
    }

    if (!cleanPhone || cleanPhone.length < 10) {
      alert("Lütfen geçerli bir telefon numarası girin.");
      return;
    }

    try {
      setIsGeneratingPDF(true);

      // 1. Generate the PDF Ekstre file
      setCloudStatusText("1/2: PDF Cari Ekstre belgesi hazırlanıyor...");
      const pdfResult = await generateLedgerPDF(selectedLedgerContact);

      if (!pdfResult) {
        alert("PDF ekstre oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.");
        setIsGeneratingPDF(false);
        setCloudStatusText("");
        return;
      }

      // Format message text for WhatsApp
      const compName = companySettings?.companyName || "Firma";
      const contactName = selectedLedgerContact.name;
      const accountCode = getContactAccountCode(selectedLedgerContact);
      const balanceVal = selectedLedgerContact.balance;
      const balanceStr = formatCurrency(Math.abs(balanceVal), companySettings?.currency || "TRY");
      const balanceStatusStr =
        balanceVal > 0 ? "Alacaklıyız (Borçlu Cari)" : balanceVal < 0 ? "Borçluyuz (Alacaklı Cari)" : "Sıfır Bakiye";

      const entries = getLedgerEntries(selectedLedgerContact.id);
      let movementSummary = "";
      if (entries.length > 0) {
        const lastEntries = entries.slice(-5);
        movementSummary = "\n\n📋 *Son Cari Hareketleri:*\n" + lastEntries.map(e => 
          `• ${formatDate(e.date)} | ${e.documentType} (${e.documentNo}): ${e.debit > 0 ? '+' : '-'}${formatCurrency(e.debit || e.credit, companySettings?.currency || "TRY")}`
        ).join("\n");
      }

      const messageText = `Sayın *${contactName}* (${accountCode}),\n\n*${compName}* firmamıza ait Cari Hesap Ekstreniz tanzim edilmiştir.\n\n📊 *Güncel Net Bakiye:* ${balanceStr} (${balanceStatusStr})${movementSummary}\n\n📄 *Ekstre PDF Dosyası:* "${pdfResult.fileName}" ekte yer almaktadır.\nİyi çalışmalar dileriz.`;

      // If Direct Baileys WhatsApp Mode
      if (whatsappMode === "direct") {
        setCloudStatusText("2/2: WhatsApp API üzerinden doğrudan PDF iletiliyor...");

        // Convert Blob to Base64
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(pdfResult.blob);
        });

        const sendRes = await sendWhatsAppDocumentApi({
          phone: cleanPhone,
          fileBase64: base64Data,
          fileName: pdfResult.fileName,
          mimeType: "application/pdf",
          caption: messageText,
          contactName: selectedLedgerContact.name,
        });

        if (sendRes.success) {
          setIsGeneratingPDF(false);
          setCloudStatusText("");
          setShareType(null);
          alert(`✅ PDF Cari Ekstre belgesi ("${pdfResult.fileName}") ve bilgilendirme mesajı ${selectedLedgerContact.name} (+${cleanPhone}) WhatsApp hattına doğrudan başarıyla iletildi!`);
          return;
        } else {
          setIsGeneratingPDF(false);
          setCloudStatusText("");
          alert(`WhatsApp doğrudan gönderim hatası: ${sendRes.error || "Bilinmeyen hata"}\n\nDilerseniz 'WhatsApp Web' sekmesini seçerek manuel gönderebilirsiniz.`);
          return;
        }
      }

      // Create File object for Web/Native fallbacks
      const pdfFile = new File([pdfResult.blob], pdfResult.fileName, {
        type: "application/pdf",
      });

      // Automatically save/download PDF to user's local device
      pdfResult.pdf.save(pdfResult.fileName);

      setCloudStatusText("2/3: PDF Bulut Depo ve Paylaşım Bağlantısı hazırlanıyor...");

      // Attempt cloud upload for direct download link (auto-deletes in 10 minutes)
      let cloudLinkStr = "";
      try {
        const userId = (currentUser && "userId" in currentUser ? currentUser.userId : (currentUser && "id" in currentUser ? (currentUser as UserProfile).id : "demo_user")) || "demo_user";
        const uploadRes = await uploadFileToStorage(userId, pdfFile);
        if (uploadRes?.fileUrl) {
          const tenMinutesMs = 10 * 60 * 1000;
          const expiresAt = Date.now() + tenMinutesMs;

          const savedFileId = await saveUserFile({
            userId,
            fileName: pdfResult.fileName,
            fileSize: pdfFile.size,
            fileType: "application/pdf",
            uploadDate: new Date().toISOString(),
            category: "Cari Ekstre",
            description: `Geçici WhatsApp Ekstresi (10 Dk): ${selectedLedgerContact.name} - ${pdfResult.fileName}`,
            fileUrl: uploadRes.fileUrl,
            storagePath: uploadRes.storagePath,
            expiresAt,
          });

          // Schedule automatic deletion from Firebase Cloud Storage & Firestore after 10 minutes
          setTimeout(async () => {
            try {
              await deleteUserFile(savedFileId, uploadRes.storagePath);
              console.log(`⏱️ 10 Dakikalık geçici PDF ekstre belgesi otomatik temizlendi: ${pdfResult.fileName}`);
            } catch (cleanErr) {
              console.warn("10 Dakikalık otomatik PDF temizleme uyarısı:", cleanErr);
            }
          }, tenMinutesMs);

          cloudLinkStr = `\n\n🔗 *PDF Ekstre Bulut İndirme Linki (10 Dakika Geçerli):*\n${uploadRes.fileUrl}`;
        }
      } catch (err) {
        console.warn("Bulut depo yüklemesi pas geçildi:", err);
      }

      setCloudStatusText("3/3: WhatsApp Web başlatılıyor...");
      const webMessageText = `${messageText}${cloudLinkStr}`;

      // Copy text to clipboard as convenience
      try {
        await navigator.clipboard.writeText(webMessageText);
      } catch {
        // ignore clipboard fail
      }

      // Check if user selected Native Share or if Web Share API supporting files is available
      if (whatsappMode === "native" || (navigator.canShare && navigator.canShare({ files: [pdfFile] }))) {
        if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
          try {
            await navigator.share({
              title: `Cari Ekstre - ${contactName}`,
              text: webMessageText,
              files: [pdfFile],
            });
            setIsGeneratingPDF(false);
            setCloudStatusText("");
            setShareType(null);
            return;
          } catch (shareErr) {
            console.warn("Native Web Share pas geçildi, WhatsApp Web linkine geçiliyor:", shareErr);
          }
        } else if (whatsappMode === "native") {
          alert("📱 Bu tarayıcı veya pencere ortamında doğrudan dosya eki ile sistem paylaşım menüsü desteklenmiyor.\n\nSistem PDF belgesini cihazınıza indirdi, mesaj metnini kopyaladı ve WhatsApp Web sohbetini açıyor. Sohbet açıldığında kopyalanan mesajı yapıştırıp indirilen PDF'yi mesaja sürükleyip ekleyebilirsiniz.");
        }
      }

      // Determine WhatsApp URL format based on selected mode
      let waUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(webMessageText)}`;
      if (whatsappMode === "auto") {
        waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(webMessageText)}`;
      }

      // Open WhatsApp in new tab or app protocol
      window.open(waUrl, "_blank");

      setTimeout(() => {
        setIsGeneratingPDF(false);
        setCloudStatusText("");
        setShareType(null);
        alert(`✅ PDF Cari Ekstre belgesi ("${pdfResult.fileName}") bilgisayarınıza indirildi ve WhatsApp Web açıldı!\n\n💡 İndirilen PDF dosyasını açılan WhatsApp sohbet penceresine sürükleyip bırakarak (veya 📎 butonundan seçerek) mesaja kolayca ekleyebilirsiniz.`);
      }, 500);
    } catch (err) {
      console.error("WhatsApp paylaşım hatası:", err);
      alert("WhatsApp ile paylaşım sırasında bir hata oluştu.");
      setIsGeneratingPDF(false);
      setCloudStatusText("");
    }
  };

  const handleSendEmail = async () => {
    if (!shareEmail.trim() || !shareEmail.includes("@")) {
      alert("Lütfen geçerli bir e-posta adresi girin.");
      return;
    }

    if (!selectedLedgerContact) return;

    try {
      // 1. Generate the PDF Ekstre file
      const pdfResult = await generateLedgerPDF(selectedLedgerContact);

      if (!pdfResult) {
        alert("PDF ekstre oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.");
        return;
      }

      // 2. Try native Web Share API with PDF File attached
      if (typeof navigator !== "undefined" && navigator.canShare) {
        try {
          const pdfFile = new File([pdfResult.blob], pdfResult.fileName, { type: "application/pdf" });
          if (navigator.canShare({ files: [pdfFile] })) {
            await navigator.share({
              files: [pdfFile],
              title: shareSubject,
            });
            return;
          }
        } catch (err) {
          console.log("Web Share pas geçildi, mailto bağlantısına geçiliyor.", err);
        }
      }

      // 3. Fallback: Download PDF file & trigger mailto
      pdfResult.pdf.save(pdfResult.fileName);

      const mailtoUrl = `mailto:${encodeURIComponent(shareEmail)}?subject=${encodeURIComponent(shareSubject)}`;
      window.location.href = mailtoUrl;
    } catch (err) {
      console.error("E-Posta paylaşım hatası:", err);
      alert("E-posta paylaşımı sırasında bir hata oluştu.");
    }
  };

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const getContactsExportData = (): ExportData => {
    const headers = [
      "Cari Hesap No",
      "Cari Adı / Unvanı",
      "Firma Unvanı",
      "Cari Tipi",
      "Vergi Dairesi",
      "VKN / TCKN",
      "Telefon",
      "E-Posta",
      "İl / İlçe",
      "Adres",
      "Bakiye",
      "Bakiye Durumu",
    ];
    const rows = filteredContacts.map((c) => {
      const typeLabel =
        c.contactType === "customer"
          ? "Müşteri (120)"
          : c.contactType === "vendor"
          ? "Tedarikçi (320)"
          : "Hem Müşteri Hem Tedarikçi (120)";
      const balanceStatus =
        c.balance > 0 ? "Alacaklıyız (Borçlu Cari)" : c.balance < 0 ? "Borçluyuz (Alacaklı Cari)" : "Sıfır Bakiye";

      return [
        getContactAccountCode(c),
        c.name,
        c.companyTitle || "-",
        typeLabel,
        c.taxOffice || "-",
        c.taxNumber || "-",
        c.phone || "-",
        c.email || "-",
        c.city ? `${c.city}${c.district ? " / " + c.district : ""}` : "-",
        c.address || "-",
        formatCurrency(c.balance || 0, companySettings?.currency || "TRY"),
        balanceStatus,
      ];
    });

    return {
      filename: `Cari_Kartlar_Listesi_${new Date().toISOString().split("T")[0]}`,
      title: "CARİ HESAPLAR VE MÜŞTERİ / TEDARİKÇİ LİSTESİ",
      subtitle: `Toplam ${filteredContacts.length} Adet Cari Hesap Kaydı`,
      headers,
      rows,
    };
  };

  // Memoized current ledger entries for the active contact
  const currentLedgerEntries = useMemo(() => {
    if (!selectedLedgerContact) return [];
    return getLedgerEntries(selectedLedgerContact.id);
  }, [selectedLedgerContact, invoices, transactions, cheques, promissoryNotes]);

  // Filtered entries by tab and search
  const filteredLedgerEntries = useMemo(() => {
    let list = currentLedgerEntries;
    if (ekstreTab === "invoices") {
      list = list.filter((e) => e.documentType === "Fatura");
    } else if (ekstreTab === "collections") {
      list = list.filter((e) => e.documentType === "Tahsilat");
    } else if (ekstreTab === "payments") {
      list = list.filter((e) => e.documentType === "Tediye" || e.documentType === "Ödeme");
    }

    if (ekstreSearch.trim()) {
      const q = ekstreSearch.toLowerCase();
      list = list.filter(
        (e) =>
          e.documentNo.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.documentType.toLowerCase().includes(q)
      );
    }
    return list;
  }, [currentLedgerEntries, ekstreTab, ekstreSearch]);

  // Comprehensive financial summary
  const ledgerSummary = useMemo(() => {
    const totalDebit = currentLedgerEntries.reduce((acc, curr) => acc + curr.debit, 0);
    const totalCredit = currentLedgerEntries.reduce((acc, curr) => acc + curr.credit, 0);
    const netBalance = totalDebit - totalCredit;
    const invoiceCount = currentLedgerEntries.filter((e) => e.documentType === "Fatura").length;
    const collectionCount = currentLedgerEntries.filter((e) => e.documentType === "Tahsilat").length;
    const paymentCount = currentLedgerEntries.filter((e) => e.documentType === "Tediye").length;
    const lastMovementDate = currentLedgerEntries.length > 0 ? currentLedgerEntries[currentLedgerEntries.length - 1].date : null;
    return {
      totalDebit,
      totalCredit,
      netBalance,
      invoiceCount,
      collectionCount,
      paymentCount,
      totalMovements: currentLedgerEntries.length,
      lastMovementDate,
    };
  }, [currentLedgerEntries]);

  // ExportData structure for ExportButtons
  const getLedgerExportData = (): ExportData => {
    if (!selectedLedgerContact) {
      return { filename: "Cari_Ekstre", title: "CARİ EKSTRE", headers: [], rows: [] };
    }
    const currencyStr = companySettings?.currency || "TRY";
    const headers = [
      "Tarih",
      "Belge Türü",
      "Evrak / Belge No",
      "Açıklama",
      "Borç Tutarı (₺)",
      "Alacak Tutarı (₺)",
      "Yürüyen Bakiye (₺)",
    ];
    const rows = filteredLedgerEntries.map((e) => [
      formatDate(e.date),
      e.documentType,
      e.documentNo,
      e.description,
      e.debit > 0 ? formatCurrency(e.debit, currencyStr) : "-",
      e.credit > 0 ? formatCurrency(e.credit, currencyStr) : "-",
      formatCurrency(e.runningBalance || 0, currencyStr),
    ]);
    const safeName = (selectedLedgerContact.name || "Cari").replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ_-]/g, "_");
    const accountCode = getContactAccountCode(selectedLedgerContact);
    return {
      filename: `Cari_Ekstre_${safeName}_${new Date().toISOString().split("T")[0]}`,
      title: `RESMİ CARİ HESAP EKSTRESİ: ${selectedLedgerContact.name}`,
      subtitle: `Hesap No: ${accountCode} | VKN/TCKN: ${selectedLedgerContact.taxNumber || "-"} | Net Bakiye: ${formatCurrency(Math.abs(selectedLedgerContact.balance), currencyStr)} (${selectedLedgerContact.balance > 0 ? "Alacaklıyız" : selectedLedgerContact.balance < 0 ? "Borçluyuz" : "Sıfır"})`,
      headers,
      rows,
    };
  };

  // Direct PDF Export using autoTable
  const handleExportLedgerPDFDirect = async () => {
    if (!selectedLedgerContact) return;
    try {
      setIsPdfGenerating(true);
      const pdfData = await generateAccountStatementAutoTablePDF({
        companySettings,
        contact: selectedLedgerContact,
        entries: filteredLedgerEntries,
        summary: ledgerSummary,
      });
      pdfData.pdf.save(pdfData.fileName);
    } catch (err) {
      console.error("Cari Ekstre PDF oluşturulurken hata:", err);
      // Fallback to DOM print styling
      const safeName = (selectedLedgerContact.name || "Cari").replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ_-]/g, "_");
      const fileName = `Cari_Ekstre_${safeName}_${new Date().toISOString().split("T")[0]}.pdf`;
      await exportElementToPDF("printable-ledger", fileName, { orientation: "p", margin: 8, scale: 2 });
    } finally {
      setIsPdfGenerating(false);
    }
  };

  // Excel (.xlsx) Export with Turkish Character & Formatting Support
  const exportLedgerExcel = (contact: Contact) => {
    const entries = getLedgerEntries(contact.id);
    let totalDebit = 0;
    let totalCredit = 0;

    const companyName = companySettings?.companyName || "ŞİRKET ADI";
    const reportTitle = "CARİ HESAP EKSTRESİ / MUAVİN DEFTERİ";
    const currencyStr = companySettings?.currency || "TRY";

    const reportData: (string | number)[][] = [
      [companyName],
      [reportTitle],
      ["Rapor Tarihi:", new Date().toLocaleDateString("tr-TR")],
      [],
      ["CARİ HESAP BİLGİLERİ"],
      ["Cari Hesap No:", getContactAccountCode(contact)],
      ["Cari Adı / Unvanı:", contact.name || "-"],
      ["Firma Unvanı:", contact.companyTitle || "-"],
      ["VKN / TCKN:", contact.taxNumber || "-"],
      ["Vergi Dairesi:", contact.taxOffice || "-"],
      ["Telefon:", contact.phone || "-"],
      ["E-Posta:", contact.email || "-"],
      ["Adres / Şehir:", `${contact.address || "-"}, ${contact.city || "-"}`],
      [
        "Net Bakiye:",
        `${formatCurrency(Math.abs(contact.balance), currencyStr)} (${
          contact.balance > 0 ? "Alacaklıyız" : contact.balance < 0 ? "Borçluyuz" : "Sıfır Bakiye"
        })`,
      ],
      [],
      ["Tarih", "Belge Tipi", "Belge No", "Açıklama", "Borç", "Alacak", "Bakiye"],
    ];

    entries.forEach((e) => {
      totalDebit += e.debit;
      totalCredit += e.credit;
      reportData.push([
        e.date,
        e.documentType,
        e.documentNo,
        e.description,
        formatCurrency(e.debit || 0, currencyStr),
        formatCurrency(e.credit || 0, currencyStr),
        formatCurrency(e.runningBalance || 0, currencyStr),
      ]);
    });

    reportData.push([]);
    reportData.push([
      "TOPLAM",
      "",
      "",
      "Genel Toplam Hareketler",
      formatCurrency(totalDebit, currencyStr),
      formatCurrency(totalCredit, currencyStr),
      formatCurrency(totalDebit - totalCredit, currencyStr),
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet(reportData);

    // Column widths
    worksheet["!cols"] = [
      { wch: 14 },
      { wch: 16 },
      { wch: 18 },
      { wch: 45 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cari Ekstre");

    const safeName = (contact.name || "Cari").replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ]/g, "_");
    XLSX.writeFile(workbook, `Cari_Ekstre_${safeName}.xlsx`);
  };

  // PDF Helper Function (returns PDF document, Blob, and filename)
  const generateLedgerPDF = async (
    contact: Contact
  ): Promise<{ pdf: jsPDF; blob: Blob; fileName: string } | null> => {
    try {
      setIsGeneratingPDF(true);
      const entries = getLedgerEntries(contact.id);
      const totalDebit = entries.reduce((acc, curr) => acc + curr.debit, 0);
      const totalCredit = entries.reduce((acc, curr) => acc + curr.credit, 0);
      const netBalance = totalDebit - totalCredit;
      const invoiceCount = entries.filter((e) => e.documentType === "Fatura").length;
      const collectionCount = entries.filter((e) => e.documentType === "Tahsilat").length;
      const paymentCount = entries.filter((e) => e.documentType === "Tediye").length;
      const lastMovementDate = entries.length > 0 ? entries[entries.length - 1].date : undefined;

      const summary: LedgerSummaryData = {
        totalDebit,
        totalCredit,
        netBalance,
        invoiceCount,
        collectionCount,
        paymentCount,
        totalMovements: entries.length,
        lastMovementDate: lastMovementDate || undefined,
      };

      return await generateAccountStatementAutoTablePDF({
        companySettings,
        contact,
        entries,
        summary,
      });
    } catch (err) {
      console.error("PDF oluşturulamadı:", err);
      // Fallback to DOM print styling
      return exportElementToPDFWithPrintStyling("printable-ledger", `Cari_Ekstre_${contact.name}.pdf`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // PDF Export Module
  const exportLedgerPDF = async (contact: Contact) => {
    const pdfData = await generateLedgerPDF(contact);
    if (pdfData) {
      pdfData.pdf.save(pdfData.fileName);
    }
  };

  // Direct Print Window Handler
  const handlePrintLedger = (contact: Contact) => {
    const entries = getLedgerEntries(contact.id);
    const totalDebit = entries.reduce((acc, curr) => acc + curr.debit, 0);
    const totalCredit = entries.reduce((acc, curr) => acc + curr.credit, 0);
    const netBalance = totalDebit - totalCredit;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }

    const compTitle = companySettings?.companyName || "FİRMA ADI";
    const compSub = companySettings?.companyTitle || "";
    const compTax = companySettings?.taxNumber ? `VKN/TCKN: ${companySettings.taxNumber} (${companySettings.taxOffice || ""})` : "";
    const compPhone = companySettings?.phone ? `Tel: ${companySettings.phone}` : "";

    const rowsHtml = entries.length === 0
      ? `<tr><td colspan="7" style="text-align:center; padding: 24px; color: #64748b; font-size: 12px;">Kayıtlı cari hareket bulunmuyor.</td></tr>`
      : entries
          .map(
            (e, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#faf5ff'}; border-bottom: 1px solid #e9d5ff; page-break-inside: avoid; break-inside: avoid;">
          <td style="padding: 9px 12px; font-size: 11px; text-align: center; color: #475569;">${formatDate(e.date)}</td>
          <td style="padding: 9px 12px; font-size: 11px; text-align: center; font-weight: bold; color: #581c87;"><span style="display:inline-block; padding: 2px 8px; border-radius: 6px; background: #f3e8ff; border: 1px solid #d8b4fe;">${e.documentType}</span></td>
          <td style="padding: 9px 12px; font-size: 11px; text-align: center; font-family: monospace; font-weight: 600; color: #334155;">${e.documentNo}</td>
          <td style="padding: 9px 12px; font-size: 11px; color: #1e293b;">${e.description}</td>
          <td style="padding: 9px 12px; font-size: 11px; text-align: center; font-weight: bold; font-family: monospace; color: #0f172a;">${e.debit > 0 ? "₺" + e.debit.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "—"}</td>
          <td style="padding: 9px 12px; font-size: 11px; text-align: center; font-weight: bold; font-family: monospace; color: #0f172a;">${e.credit > 0 ? "₺" + e.credit.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "—"}</td>
          <td style="padding: 9px 12px; font-size: 11px; text-align: center; font-weight: 800; font-family: monospace; color: ${e.runningBalance > 0 ? "#047857" : e.runningBalance < 0 ? "#b91c1c" : "#475569"};">₺${Math.abs(e.runningBalance).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
        </tr>
      `
          )
          .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <title>Cari Hesap Ekstresi - ${contact.name}</title>
        <style>
          @page { size: landscape; margin: 10mm; }
          * { box-sizing: border-box; }
          body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; padding: 24px; color: #0f172a; margin: 0; background: #ffffff; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #581c87; padding-bottom: 16px; margin-bottom: 20px; page-break-inside: avoid; break-inside: avoid; }
          .company-name { font-size: 20px; font-weight: 900; text-transform: uppercase; color: #581c87; letter-spacing: -0.5px; }
          .title-block { text-align: right; }
          .title { font-size: 20px; font-weight: 900; color: #1e1b4b; letter-spacing: 0.5px; text-transform: uppercase; }
          .info-grid { display: grid; grid-template-columns: 1.2fr 1.2fr 1fr; gap: 16px; background: #faf5ff; padding: 16px; border-radius: 12px; border: 1.5px solid #e9d5ff; margin-bottom: 20px; font-size: 12px; page-break-inside: avoid; break-inside: avoid; }
          .info-box { display: flex; flex-direction: column; justify-content: center; }
          .balance-box { background: #ffffff; border: 1.5px solid #d8b4fe; border-radius: 10px; padding: 12px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; border: 1.5px solid #d8b4fe; border-radius: 8px; overflow: hidden; }
          th { background: #581c87; color: #ffffff; text-align: center; padding: 10px 12px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; border-right: 1px solid #7e22ce; }
          th:last-child { border-right: none; }
          tr { page-break-inside: avoid !important; break-inside: avoid !important; }
          thead { display: table-header-group; }
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 20px; page-break-inside: avoid; break-inside: avoid; }
          .stat-box { background: #faf5ff; border: 1.5px solid #e9d5ff; border-radius: 10px; padding: 12px; text-align: center; }
          .stat-box.highlight { background: #f3e8ff; border-color: #c084fc; }
          .stat-label { font-size: 10px; font-weight: 800; color: #6b21a8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
          .stat-val { font-size: 16px; font-weight: 900; font-family: monospace; }
          @media print {
            body { padding: 0; }
            tr { page-break-inside: avoid !important; break-inside: avoid !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company-name">${compTitle}</div>
            <div style="font-size:11px; color:#64748b; margin-top:2px;">${compSub}</div>
            <div style="font-size:11px; color:#64748b;">${compTax} ${compPhone}</div>
          </div>
          <div class="title-block">
            <div class="title">CARİ HESAP EKSTRESİ</div>
            <div style="font-size:11px; font-weight:600; color:#6b21a8; margin-top:3px;">Düzenleme Tarihi: ${new Date().toLocaleDateString("tr-TR")}</div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <div style="margin-bottom: 4px;"><strong>HESAP NO:</strong> <span style="font-family:monospace; font-weight:bold; color:#581c87; background:#ede9fe; padding:2px 6px; border-radius:4px;">${getContactAccountCode(contact)}</span></div>
            <div style="margin-bottom: 2px;"><strong>CARİ UNVANI:</strong> <span style="font-weight:700; color:#0f172a;">${contact.name}</span></div>
            <div style="color:#64748b; font-size:11px;">${contact.companyTitle || ""}</div>
            <div style="margin-top: 4px;"><strong>VKN / TCKN:</strong> ${contact.taxNumber || "-"} (${contact.taxOffice || "-"})</div>
          </div>
          <div class="info-box">
            <div style="margin-bottom: 4px;"><strong>İLETİŞİM:</strong> ${contact.phone || "-"} &bull; ${contact.email || "-"}</div>
            <div><strong>ADRES:</strong> ${contact.address || "-"}, ${contact.city || "-"}</div>
          </div>
          <div class="balance-box">
            <div style="font-size:10px; font-weight:800; color:#6b21a8; text-transform:uppercase; letter-spacing:0.5px;">GÜNCEL NET BAKİYE</div>
            <div style="font-size:20px; font-weight:900; font-family:monospace; margin: 4px 0; color: ${netBalance > 0 ? "#047857" : netBalance < 0 ? "#b91c1c" : "#475569"};">
              ₺${Math.abs(netBalance).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </div>
            <div style="font-size:11px; font-weight:bold; color:${netBalance > 0 ? "#047857" : netBalance < 0 ? "#b91c1c" : "#64748b"};">
              ${netBalance > 0 ? "● Alacaklıyız" : netBalance < 0 ? "● Borçluyuz" : "● Bakiye Sıfır"}
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 100px;">Tarih</th>
              <th style="width: 130px;">Belge Tipi</th>
              <th style="width: 140px;">Belge No</th>
              <th>Açıklama</th>
              <th style="width: 130px;">Borç (₺)</th>
              <th style="width: 130px;">Alacak (₺)</th>
              <th style="width: 140px;">Bakiye (₺)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="summary-grid">
          <div class="stat-box">
            <div class="stat-label">Toplam Borç Tutarı</div>
            <div class="stat-val" style="color:#0f172a;">₺${totalDebit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Toplam Alacak Tutarı</div>
            <div class="stat-val" style="color:#0f172a;">₺${totalCredit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="stat-box highlight">
            <div class="stat-label">Net Cari Bakiye</div>
            <div class="stat-val" style="color: ${netBalance > 0 ? "#047857" : netBalance < 0 ? "#b91c1c" : "#475569"};">₺${Math.abs(netBalance).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Top Header Controls (Lila Bal Peteği & Geometrik Desen) */}
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
          <h2 className="text-lg font-extrabold text-slate-950">
            Cari Hesaplar (Müşteriler & Tedarikçiler)
          </h2>
          <p className="text-xs font-semibold text-purple-950/90 mt-1 leading-relaxed">
            Ticari ilişki kurduğunuz firma ve kişilerin borç/alacak bakiyelerini takip edin.
          </p>
        </div>

        <button
          onClick={() => handleOpenAddModal()}
          className="relative z-10 bg-purple-700/15 hover:bg-purple-700/25 text-purple-950 border border-purple-400/50 backdrop-blur-md font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4 text-purple-800 font-bold" />
          <span>Yeni Cari Kart Ekle</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-purple-50/50 p-1.5 rounded-xl border border-purple-200/50 text-xs font-semibold shadow-2xs overflow-x-auto custom-scrollbar w-full lg:w-auto shrink-0 whitespace-nowrap">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === "all" ? "bg-white text-purple-950 font-bold shadow-2xs border border-purple-200/60" : "text-purple-900/70 hover:text-purple-950"
            }`}
          >
            Tümü ({contacts.length})
          </button>
          <button
            onClick={() => setFilterType("customers")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === "customers" ? "bg-white text-purple-700 font-bold shadow-2xs border border-purple-200/60" : "text-purple-900/70 hover:text-purple-950"
            }`}
          >
            Müşteriler
          </button>
          <button
            onClick={() => setFilterType("vendors")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === "vendors" ? "bg-white text-purple-700 font-bold shadow-2xs border border-purple-200/60" : "text-purple-900/70 hover:text-purple-950"
            }`}
          >
            Tedarikçiler
          </button>
          <button
            onClick={() => setFilterType("receivables")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === "receivables" ? "bg-white text-emerald-600 font-bold shadow-2xs border border-purple-200/60" : "text-purple-900/70 hover:text-purple-950"
            }`}
          >
            Alacaklı Olduklarımız
          </button>
          <button
            onClick={() => setFilterType("payables")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === "payables" ? "bg-white text-amber-600 font-bold shadow-2xs border border-purple-200/60" : "text-purple-900/70 hover:text-purple-950"
            }`}
          >
            Borçlu Olduklarımız
          </button>
        </div>

        {/* Search & Export */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari unvan, vergi no, il ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white text-slate-900 placeholder-slate-400 text-xs rounded-xl pl-9 pr-3 py-2 border border-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs transition-all"
            />
          </div>
          <ExportButtons
            getExportData={getContactsExportData}
            contacts={contacts}
            companyName={companySettings?.companyName}
            size="sm"
          />
        </div>
      </div>

      {/* Contacts List Table */}
      <div className="bg-slate-50/60 rounded-2xl border border-purple-200/60 p-1.5 sm:p-3 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar w-full">
          <table className="w-full text-left text-xs border-separate border-spacing-y-2">
            <thead>
              <tr className="text-purple-950 font-extrabold uppercase tracking-wider text-[10px] sm:text-[11px]">
                <th className="pb-2 px-2 sm:px-3 hidden sm:table-cell">Cari Hesap No</th>
                <th className="pb-2 px-2 sm:px-3">Cari Unvan / Şirket</th>
                <th className="pb-2 px-2 sm:px-3 hidden md:table-cell">Tip</th>
                <th className="pb-2 px-2 sm:px-3 hidden lg:table-cell">Vergi Dairesi & No</th>
                <th className="pb-2 px-2 sm:px-3 hidden xl:table-cell">İletişim</th>
                <th className="pb-2 px-2 sm:px-3 text-right">Güncel Bakiye</th>
                <th className="pb-2 px-2 sm:px-3 text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 bg-white rounded-xl border border-purple-100/80">
                    Kriterlere uygun cari hesap bulunamadı.
                  </td>
                </tr>
              ) : (
                displayedContacts.map((c) => {
                  const isReceivable = c.balance > 0;
                  const isPayable = c.balance < 0;

                  return (
                    <tr
                      key={c.id}
                      className="bg-white hover:bg-gradient-to-r hover:from-purple-50/90 hover:via-fuchsia-50/60 hover:to-purple-50/90 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group rounded-xl relative z-0 hover:z-10"
                    >
                      <td className="py-2.5 sm:py-3.5 px-2 sm:px-3 rounded-l-xl border-y border-l border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all hidden sm:table-cell">
                        <span className="font-mono text-xs font-bold px-2 py-1 rounded-md bg-purple-100/80 text-purple-950 border border-purple-300/60 shadow-2xs inline-block">
                          {getContactAccountCode(c)}
                        </span>
                      </td>

                      <td className="py-2.5 sm:py-3.5 px-2 sm:px-3 rounded-l-xl sm:rounded-l-none border-y border-l sm:border-l-0 border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                        <div className="font-extrabold text-slate-900 group-hover:text-purple-950 text-xs sm:text-sm transition-colors">
                          {c.name}
                        </div>
                        {c.companyTitle && c.companyTitle !== c.name && (
                          <div className="text-[10px] sm:text-[11px] text-slate-500 group-hover:text-purple-800/80 truncate max-w-[140px] sm:max-w-xs transition-colors">
                            {c.companyTitle}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-400 group-hover:text-purple-700/60 transition-colors">
                            {c.city || "Şehir Belirtilmemiş"}
                          </span>
                          <span
                            className={`md:hidden px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              c.contactType === "customer"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : c.contactType === "vendor"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-purple-50 text-purple-700 border border-purple-200"
                            }`}
                          >
                            {c.contactType === "customer"
                              ? "Müşteri"
                              : c.contactType === "vendor"
                              ? "Tedarikçi"
                              : "Müşteri & Tedarikçi"}
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 sm:py-3.5 px-2 sm:px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all hidden md:table-cell">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                            c.contactType === "customer"
                              ? "bg-blue-50 text-blue-700 border border-blue-200 group-hover:border-blue-300 group-hover:shadow-2xs"
                              : c.contactType === "vendor"
                              ? "bg-amber-50 text-amber-700 border border-amber-200 group-hover:border-amber-300 group-hover:shadow-2xs"
                              : "bg-purple-50 text-purple-700 border border-purple-200 group-hover:border-purple-300 group-hover:shadow-2xs"
                          }`}
                        >
                          {c.contactType === "customer"
                            ? "Müşteri"
                            : c.contactType === "vendor"
                            ? "Tedarikçi"
                            : "Müşteri & Tedarikçi"}
                        </span>
                      </td>

                      <td className="py-2.5 sm:py-3.5 px-2 sm:px-3 text-slate-700 font-medium border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all hidden lg:table-cell">
                        {c.taxNumber ? (
                          <div>
                            <div className="text-[11px]">VKN: {c.taxNumber}</div>
                            <div className="text-[10px] text-slate-400 group-hover:text-purple-700/60">
                              V.D: {c.taxOffice || "-"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Belirtilmemiş</span>
                        )}
                      </td>

                      <td className="py-2.5 sm:py-3.5 px-2 sm:px-3 text-slate-700 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all hidden xl:table-cell">
                        {c.contactPerson && (
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700">
                            <UserCheck className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span className="truncate max-w-[130px]">{c.contactPerson}</span>
                          </div>
                        )}
                        {c.phone && (
                          <div className="flex items-center gap-1 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400 group-hover:text-purple-500 shrink-0" />
                            <span>{c.phone}</span>
                          </div>
                        )}
                        {c.email && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 group-hover:text-purple-800/80">
                            <Mail className="w-3 h-3 text-slate-400 group-hover:text-purple-500 shrink-0" />
                            <span className="truncate max-w-[120px]">{c.email}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 sm:py-3.5 px-2 sm:px-3 text-right whitespace-nowrap border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                        <div
                          className={`font-black text-xs sm:text-sm ${
                            isReceivable
                              ? "text-emerald-600"
                              : isPayable
                              ? "text-rose-600"
                              : "text-slate-400"
                          }`}
                        >
                          ₺{Math.abs(c.balance).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-slate-400 group-hover:text-purple-700/70 block">
                          {isReceivable
                            ? "Alacaklıyız"
                            : isPayable
                            ? "Borçluyuz"
                            : "Bakiye Sıfır"}
                        </span>
                      </td>

                      <td className="py-2.5 sm:py-3.5 px-2 sm:px-3 text-center rounded-r-xl border-y border-r border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                        <div className="flex items-center justify-center gap-1 sm:gap-1.5 flex-wrap sm:flex-nowrap">
                          {/* Tahsilat Yap Button */}
                          <button
                            onClick={() => handleOpenActionModal(c, "collection")}
                            title="Müşteriden / Cariden Tahsilat Al"
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Tahsilat</span>
                          </button>

                          {/* Ödeme Yap Button */}
                          <button
                            onClick={() => handleOpenActionModal(c, "payment")}
                            title="Cariye Ödeme Yap"
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>Ödeme</span>
                          </button>

                          {/* Ledger / Muavin Button */}
                          <button
                            onClick={() => setSelectedLedgerContact(c)}
                            title="Cari Ekstre / Muavin Dökümü"
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>Ekstre</span>
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenAddModal(c)}
                            title="Kartı Düzenle"
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            <span>Düzenle</span>
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

        {filteredContacts.length > displayLimit && (
          <div className="text-center mt-4">
            <button
              onClick={() => setDisplayLimit((prev) => prev + 100)}
              className="px-4 py-2 bg-purple-100 text-purple-900 rounded-xl font-bold text-xs hover:bg-purple-200 transition-colors cursor-pointer"
            >
              Daha Fazla Göster ({displayLimit} / {filteredContacts.length})
            </button>
          </div>
        )}
      </div>

      {/* MODAL: Add / Edit Contact */}
      {isModalOpen && (() => {
        const districtOptions =
          trAdresDistricts.length > 0 ? trAdresDistricts : getDistrictsForProvince(formData.city);
        const neighborhoodOptions =
          trAdresNeighborhoods.length > 0
            ? trAdresNeighborhoods
            : getNeighborhoodsForDistrict(formData.city, formData.district);
        const taxOfficeOptions = getTaxOfficesForProvince(formData.city);
        const currentPlateCode = getProvincePlateCode(formData.city);
        const prefixNumber = formData.contactType === "vendor" || formData.contactType === "supplier" ? "320" : "120";

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-fadeIn">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 p-3.5 sm:p-4 shrink-0 bg-slate-50/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shadow-2xs">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <span>{editingContact ? "Cari Kartı Düzenle" : "Yeni Cari Kart Oluştur"}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200">
                        {currentComputedAccountCode}
                      </span>
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-500">
                      10 Adımlı Resmi Cari Bilgi Sıralaması (Otomatik 120/320 Cari Kodu &amp; VKN/TCKN Entegrasyonu)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-rose-100 hover:text-rose-700 hover:border-rose-300 border border-slate-200 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95 group shrink-0"
                  title="Pencereyi Kapat (ESC)"
                >
                  <X className="w-4 h-4 text-slate-500 group-hover:text-rose-600 transition-transform group-hover:rotate-90" />
                  <span className="font-extrabold">Kapat</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
                <div className="p-3.5 sm:p-5 space-y-4 text-xs overflow-y-auto custom-scrollbar flex-1">
                  
                  {/* 1. CARİ HESAP KODU (OTOMATİK OLUŞUM) */}
                  <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold text-[11px] flex items-center justify-center shadow-2xs">1</span>
                        <label className="text-xs font-bold text-purple-950 uppercase tracking-wide">
                          CARİ HESAP KODU <span className="text-[11px] font-normal text-purple-700">(Otomatik: 120/320 . İl Kodu . VKN/TCKN)</span>
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            isCustomAccountCode: !prev.isCustomAccountCode,
                            accountCode: !prev.isCustomAccountCode ? currentComputedAccountCode : ""
                          }));
                        }}
                        className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 underline flex items-center gap-1 cursor-pointer"
                      >
                        {formData.isCustomAccountCode ? (
                          <>
                            <RotateCcw className="w-3 h-3" />
                            <span>Otomatiğe Dön</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" />
                            <span>Manuel Düzenle</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                      {/* Cari Tipi Seçimi */}
                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Cari Tipi (Alıcı / Satıcı) *
                        </label>
                        <select
                          value={formData.contactType}
                          onChange={(e) =>
                            setFormData({ ...formData, contactType: e.target.value as ContactType })
                          }
                          className="w-full bg-white border border-purple-200 rounded-lg p-2 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer"
                        >
                          <option value="customer">120 - Alıcılar (Müşteri)</option>
                          <option value="vendor">320 - Satıcılar (Tedarikçi)</option>
                          <option value="both">120 / 320 - Müşteri &amp; Satıcı</option>
                        </select>
                      </div>

                      {/* Cari Hesap Kodu Canlı Gösterimi / Giriş */}
                      <div className="sm:col-span-8">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Üretilen Cari Hesap Kodu
                        </label>
                        {formData.isCustomAccountCode ? (
                          <input
                            type="text"
                            value={formData.accountCode}
                            onChange={(e) => setFormData({ ...formData, accountCode: e.target.value })}
                            placeholder="ör: 120.34.1234567890"
                            className="w-full bg-white border border-purple-300 rounded-lg p-2 text-xs font-mono font-bold text-purple-950 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                          />
                        ) : (
                          <div className="w-full bg-white border-2 border-purple-300/80 rounded-lg p-2 text-xs font-mono font-black text-purple-950 flex flex-wrap items-center justify-between gap-1 shadow-2xs">
                            <span className="tracking-wider text-sm text-purple-900">
                              {currentComputedAccountCode}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] font-sans font-normal text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                              <span><b>{prefixNumber}</b> ({formData.contactType === "vendor" ? "Satıcı" : "Alıcı"})</span>
                              <span>•</span>
                              <span><b>{currentPlateCode}</b> ({formData.city || "İstanbul"})</span>
                              <span>•</span>
                              <span><b>{formData.taxNumber && formData.taxNumber.trim() ? formData.taxNumber.trim() : "0000000000"}</b></span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2. V.K.N. / T.C.K.N & 3. VERGİ DAİRESİ */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
                    {/* 2- V.K.N. / T.C.K.N with "BİLGİLERİ GETİR" BUTTON */}
                    <div className="sm:col-span-7 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">2</span>
                          <label className="text-xs font-bold text-slate-800">
                            V.K.N. / T.C.K.N *
                          </label>
                        </div>
                        {formData.taxNumber && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                              formData.taxNumber.length === 10
                                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                : formData.taxNumber.length === 11
                                ? "bg-blue-100 text-blue-700 border border-blue-200"
                                : "bg-amber-100 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {formData.taxNumber.length === 10
                              ? "✓ 10 Hane (Kurumsal VKN)"
                              : formData.taxNumber.length === 11
                              ? "✓ 11 Hane (Şahıs TCKN)"
                              : `${formData.taxNumber.length} / 10-11 Hane`}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            maxLength={11}
                            placeholder="10 haneli VKN veya 11 haneli TCKN"
                            value={formData.taxNumber}
                            onChange={(e) => {
                              const cleanVal = e.target.value.replace(/\D/g, "");
                              setFormData({ ...formData, taxNumber: cleanVal });
                              setTaxpayerFetchStatus(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleFetchTaxpayerInfo();
                              }
                            }}
                            className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleFetchTaxpayerInfo}
                          disabled={isFetchingTaxpayer || !formData.taxNumber || (formData.taxNumber.length !== 10 && formData.taxNumber.length !== 11)}
                          className="px-3 sm:px-3.5 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                          title="GİB & Mysoft sisteminden cari ünvan ve vergi dairesini otomatik getir"
                        >
                          {isFetchingTaxpayer ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span className="hidden sm:inline">Getiriliyor...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-pulse" />
                              <span>Bilgileri Getir</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Live Result / Status Feedback Badge */}
                      {taxpayerFetchStatus && (
                        <div
                          className={`p-2 rounded-xl border text-[11px] flex flex-wrap items-center justify-between gap-1.5 animate-fadeIn ${
                            taxpayerFetchStatus.success
                              ? taxpayerFetchStatus.isEFatura
                                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                                : "bg-sky-50 border-sky-200 text-sky-900"
                              : "bg-rose-50 border-rose-200 text-rose-800"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            {taxpayerFetchStatus.success ? (
                              taxpayerFetchStatus.isEFatura ? (
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-sky-500" />
                              )
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            )}
                            <span className="font-bold">{taxpayerFetchStatus.message}</span>
                          </div>
                          {taxpayerFetchStatus.pkAlias && (
                            <span className="text-[10px] font-mono font-bold bg-white/90 px-1.5 py-0.5 rounded border border-emerald-200 text-emerald-800">
                              PK: {taxpayerFetchStatus.pkAlias}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 3- VERGİ DAİRESİ */}
                    <div className="sm:col-span-5">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">3</span>
                          <label className="text-xs font-bold text-slate-800 truncate">
                            VERGİ DAİRESİ {formData.city ? `(${formData.city})` : ""}
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsCustomTaxOffice(!isCustomTaxOffice)}
                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                        >
                          {isCustomTaxOffice ? "Listeden Seç" : "Manuel Gir"}
                        </button>
                      </div>
                      {isCustomTaxOffice ? (
                        <input
                          type="text"
                          placeholder="ör: Mecidiyeköy Vergi Dairesi"
                          value={formData.taxOffice}
                          onChange={(e) => setFormData({ ...formData, taxOffice: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      ) : (
                        <select
                          value={formData.taxOffice}
                          onChange={(e) => setFormData({ ...formData, taxOffice: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                        >
                          {taxOfficeOptions.map((vd) => (
                            <option key={vd} value={vd}>
                              {vd}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* 4. Resmi Ticari Şirket Unvanı & 5. Kısa Unvan / İsim */}
                  <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
                    {/* 4- Resmi Ticari Şirket Unvanı */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-4 h-4 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">4</span>
                        <label className="text-xs font-bold text-slate-800">
                          Resmi Ticari Şirket Unvanı
                        </label>
                      </div>
                      <input
                        type="text"
                        placeholder="ör: TeknoSoft Yazılım ve Bilişim Sanayi Ticaret Anonim Şirketi"
                        value={formData.companyTitle}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            companyTitle: val,
                            name: prev.name ? prev.name : val.slice(0, 35),
                          }));
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>

                    {/* 5- Kısa Unvan / İsim */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">5</span>
                          <label className="text-xs font-bold text-slate-800">
                            Kısa Unvan / İsim *
                          </label>
                        </div>
                        <span className="text-[10px] text-slate-500 font-normal">
                          (Listelerde ve aramalarda görünen pratik isim)
                        </span>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="ör: TeknoSoft A.Ş. veya Ahmet Yılmaz"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* 6. Cari Hesap Adres Bilgileri BÖLÜMÜ */}
                  <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">6</span>
                        <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-xs font-bold text-slate-800">Cari Hesap Adres Bilgileri BÖLÜMÜ</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        TrAdres Canlı Katalog
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* İl Seçimi (Plaka kodlarıyla) */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          İl (Türkiye 81 İl) *
                        </label>
                        <select
                          value={formData.city}
                          onChange={(e) => handleCityChange(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                        >
                          {(trAdresProvinces.length > 0 ? trAdresProvinces : ALL_81_PROVINCES).map((prov) => (
                            <option key={prov.code} value={prov.name}>
                              {prov.code} - {prov.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* İlçe */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                            <span>İlçe</span>
                            {isLoadingDistricts && <span className="text-[10px] text-indigo-600 font-normal">yükleniyor...</span>}
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsCustomDistrict(!isCustomDistrict)}
                            className="text-[10px] text-indigo-600 hover:underline"
                          >
                            {isCustomDistrict ? "Listeden" : "Manuel"}
                          </button>
                        </div>
                        {isCustomDistrict ? (
                          <input
                            type="text"
                            placeholder="İlçe girin"
                            value={formData.district}
                            onChange={(e) => {
                              const val = e.target.value;
                              const newAddr = compileAddress(formData.neighborhood, formData.street, formData.buildingNo, val, formData.city, formData.doorNo, formData.postalCode);
                              setFormData(prev => ({ ...prev, district: val, address: newAddr }));
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        ) : (
                          <select
                            value={formData.district}
                            onChange={(e) => handleDistrictChange(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                          >
                            {districtOptions.map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Mahalle */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                            <span>Mahalle</span>
                            {isLoadingNeighborhoods && <span className="text-[10px] text-indigo-600 font-normal">yükleniyor...</span>}
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsCustomNeighborhood(!isCustomNeighborhood)}
                            className="text-[10px] text-indigo-600 hover:underline"
                          >
                            {isCustomNeighborhood ? "Listeden" : "Manuel"}
                          </button>
                        </div>
                        {isCustomNeighborhood ? (
                          <input
                            type="text"
                            placeholder="Mahalle girin"
                            value={formData.neighborhood}
                            onChange={(e) => {
                              const val = e.target.value;
                              const newAddr = compileAddress(val, formData.street, formData.buildingNo, formData.district, formData.city, formData.doorNo, formData.postalCode);
                              setFormData(prev => ({ ...prev, neighborhood: val, address: newAddr }));
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        ) : (
                          <select
                            value={formData.neighborhood}
                            onChange={(e) => handleNeighborhoodChange(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                          >
                            {neighborhoodOptions.map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      {/* Cadde / Sokak */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                          <span>Cadde / Sokak / Bulvar</span>
                          <span className="text-[10px] text-slate-400 font-normal">Öneri listeli</span>
                        </label>
                        <input
                          type="text"
                          list="contacts-street-datalist"
                          placeholder="ör: Bağdat Caddesi / Atatürk Bulvarı / 101. Sokak"
                          value={formData.street}
                          onChange={(e) => handleStreetChange(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                        <datalist id="contacts-street-datalist">
                          {COMMON_STREET_TYPES.map((st, idx) => (
                            <option key={`${st}-${idx}`} value={st} />
                          ))}
                        </datalist>
                      </div>

                      {/* Bina No */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Bina No / Blok
                        </label>
                        <input
                          type="text"
                          placeholder="ör: No: 12"
                          value={formData.buildingNo}
                          onChange={(e) => handleBuildingNoChange(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>

                      {/* Posta Kodu / Kapı */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Daire / Posta Kodu
                        </label>
                        <input
                          type="text"
                          placeholder="ör: D: 4 / 34710"
                          value={formData.postalCode}
                          onChange={(e) => {
                            const val = e.target.value;
                            const newAddr = compileAddress(formData.neighborhood, formData.street, formData.buildingNo, formData.district, formData.city, formData.doorNo, val);
                            setFormData(prev => ({ ...prev, postalCode: val, address: newAddr }));
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Tam Açık Adres */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Tam Açık Adres (Fatura &amp; Tebligat Adresi)
                      </label>
                      <textarea
                        rows={2}
                        value={formData.address}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            address: val,
                            shippingAddress: prev.isSameShippingAddress ? val : prev.shippingAddress,
                          }));
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* 7. İLGİLİ KİŞİ & 8. TELEFON & 9. E POSTA */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
                    {/* 7- İLGİLİ KİŞİ */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-4 h-4 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">7</span>
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                        <label className="text-xs font-bold text-slate-800">
                          İLGİLİ KİŞİ
                        </label>
                      </div>
                      <input
                        type="text"
                        placeholder="ör: Ahmet Yılmaz (Satın Alma)"
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>

                    {/* 8- TELEFON */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-4 h-4 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">8</span>
                        <Phone className="w-3.5 h-3.5 text-indigo-600" />
                        <label className="text-xs font-bold text-slate-800">
                          TELEFON
                        </label>
                      </div>
                      <input
                        type="text"
                        placeholder="ör: 0212 555 12 34 / 0532 555 12 34"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>

                    {/* 9- E POSTA */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-4 h-4 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">9</span>
                        <Mail className="w-3.5 h-3.5 text-indigo-600" />
                        <label className="text-xs font-bold text-slate-800">
                          E POSTA
                        </label>
                      </div>
                      <input
                        type="email"
                        placeholder="ör: muhasebe@firma.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* 10. SEVKİYAT ADRESİ */}
                  <div className="space-y-2.5 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">10</span>
                        <Truck className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-xs font-bold text-slate-800">SEVKİYAT ADRESİ</span>
                      </div>
                      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isSameShippingAddress}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormData(prev => ({
                              ...prev,
                              isSameShippingAddress: checked,
                              shippingAddress: checked ? prev.address : prev.shippingAddress
                            }));
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span>Cari / Fatura Adresi ile Aynı</span>
                      </label>
                    </div>

                    {!formData.isSameShippingAddress && (
                      <div className="space-y-1 animate-fadeIn">
                        <label className="block text-[11px] font-semibold text-slate-700">
                          Depo / Sevkiyat / Mal Teslim Adresi
                        </label>
                        <textarea
                          rows={2}
                          placeholder="ör: Organize Sanayi Bölgesi 4. Cadde No: 18 Depo 2, Tuzla / İstanbul (Teslim Yetkilisi: Depo Sorumlusu)"
                          value={formData.shippingAddress}
                          onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Ekstra: Özel Notlar */}
                  <div className="space-y-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                    <label className="block text-xs font-semibold text-slate-700">
                      Özel Cari Notları &amp; Sözleşme Şartları (İsteğe Bağlı)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Özel iskonto oranı, vade günü (30 gün/60 gün), banka IBAN bilgileri veya sözleşme notları..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                </div>

                {/* Footer */}
                <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center justify-between gap-2">
                  <div className="text-[11px] font-medium text-slate-500 hidden sm:block">
                    Hesap Kodu: <span className="font-mono font-bold text-purple-900">{currentComputedAccountCode}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/80 cursor-pointer transition-colors"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>{editingContact ? "Güncelle" : "Cari Hesabı Kaydet"}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL: Cari Muavin Defteri / Ekstre Dökümü (Kurumsal Resmi Tasarım & PDF/Excel Aktar) */}
      {selectedLedgerContact && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-purple-300/80 max-w-5xl w-full max-h-[95vh] flex flex-col my-auto overflow-hidden animate-scaleUp">
            {/* 1. Modal Top Bar - Dark Corporate & Actions (no-print) */}
            <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 shrink-0 no-print">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center font-extrabold shrink-0 shadow-md">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-extrabold text-white truncate">
                      Resmi Cari Hesap Ekstresi & Muavin Dökümü
                    </h3>
                    <span className="bg-purple-800/90 text-purple-200 font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-purple-600/60">
                      Hesap No: {getContactAccountCode(selectedLedgerContact)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 truncate">
                    {selectedLedgerContact.name} {selectedLedgerContact.companyTitle ? `(${selectedLedgerContact.companyTitle})` : ""} • VKN/TCKN: {selectedLedgerContact.taxNumber || "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap justify-end">
                <button
                  type="button"
                  onClick={handleExportLedgerPDFDirect}
                  disabled={isPdfGenerating}
                  className="bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  title="Resmi Cari Hesap Ekstresi ve Muavin Defterini PDF Olarak İndir"
                >
                  <FileDown className="w-4 h-4 text-purple-200" />
                  <span>{isPdfGenerating ? "Hazırlanıyor..." : "PDF İndir"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Yazdır"
                >
                  <Printer className="w-4 h-4 text-slate-200" />
                  <span className="hidden sm:inline">Yazdır</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenShareModal("whatsapp")}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="WhatsApp Web veya Uygulaması İle Ekstre Paylaş"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-200" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenShareModal("email")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="Cari Hesabın Kayıtlı E-Posta Adresine PDF Gönder"
                >
                  <Mail className="w-4 h-4 text-indigo-200" />
                  <span className="hidden sm:inline">E-Posta ile Gönder</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedLedgerContact(null)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 2. Interactive Control Bar (no-print) */}
            <div className="bg-purple-50/80 border-b border-purple-200/80 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 no-print">
              {/* Movement Filter Tabs */}
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-purple-200 shadow-2xs flex-wrap">
                <button
                  type="button"
                  onClick={() => setEkstreTab("all")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md cursor-pointer transition-all ${
                    ekstreTab === "all" ? "bg-purple-700 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Tüm Hareketler ({currentLedgerEntries.length})
                </button>
                <button
                  type="button"
                  onClick={() => setEkstreTab("invoices")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md cursor-pointer transition-all ${
                    ekstreTab === "invoices" ? "bg-blue-700 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Faturalar ({ledgerSummary.invoiceCount})
                </button>
                <button
                  type="button"
                  onClick={() => setEkstreTab("collections")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md cursor-pointer transition-all ${
                    ekstreTab === "collections" ? "bg-emerald-700 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Tahsilatlar ({ledgerSummary.collectionCount})
                </button>
                <button
                  type="button"
                  onClick={() => setEkstreTab("payments")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md cursor-pointer transition-all ${
                    ekstreTab === "payments" ? "bg-amber-700 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Ödemeler / Tediyeler ({ledgerSummary.paymentCount})
                </button>
              </div>

              {/* Search input */}
              <div className="relative w-48 sm:w-64">
                <Search className="w-3.5 h-3.5 text-purple-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Evrak No veya Açıklama Ara..."
                  value={ekstreSearch}
                  onChange={(e) => setEkstreSearch(e.target.value)}
                  className="w-full bg-white border border-purple-200 text-slate-900 text-xs rounded-lg pl-8 pr-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>

            {/* 3. Printable Statement Canvas Container */}
            <div className="p-3 sm:p-6 bg-slate-200/60 overflow-y-auto custom-scrollbar flex-1 flex justify-center">
              <div
                id="printable-ledger"
                className="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-200 w-full max-w-4xl mx-auto space-y-5 font-sans text-xs sm:text-sm"
                style={{ backgroundColor: "#ffffff", color: "#0f172a" }}
              >
                {/* 3.1 Corporate Header */}
                <div
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b-2 border-slate-800"
                  style={{ borderBottomColor: "#1e1b4b" }}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shadow-md"
                        style={{ backgroundColor: "#1e1b4b", color: "#ffffff" }}
                      >
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2
                          className="text-base sm:text-lg font-black tracking-tight uppercase"
                          style={{ color: "#1e1b4b" }}
                        >
                          {companySettings?.companyTitle || companySettings?.companyName || "MUAVİN ÖN MUHASEBE VE CARİ YÖNETİM SİSTEMİ"}
                        </h2>
                        <p className="text-[10px] sm:text-xs font-semibold" style={{ color: "#64748b" }}>
                          Resmi Cari Hesap, Muavin Defter ve Mutabakat Sistemi
                        </p>
                      </div>
                    </div>
                    <div className="text-[11px] pl-11 space-y-0.5" style={{ color: "#475569" }}>
                      {companySettings?.address && <p>{companySettings.address}</p>}
                      <p>
                        {companySettings?.taxOffice && `${companySettings.taxOffice} V.D.`}
                        {companySettings?.taxNumber && ` • VKN/TCKN: ${companySettings.taxNumber}`}
                        {companySettings?.phone && ` • Tel: ${companySettings.phone}`}
                      </p>
                    </div>
                  </div>

                  <div
                    className="text-left sm:text-right p-3 rounded-xl border space-y-1 shrink-0 w-full sm:w-auto"
                    style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}
                  >
                    <div
                      className="inline-block text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md tracking-wider"
                      style={{ backgroundColor: "#1e1b4b" }}
                    >
                      RESMİ CARİ HESAP EKSTRESİ
                    </div>
                    <div className="text-xs font-bold" style={{ color: "#0f172a" }}>
                      Hesap No: <span className="font-mono font-black" style={{ color: "#1e1b4b" }}>{getContactAccountCode(selectedLedgerContact)}</span>
                    </div>
                    <div className="text-[11px]" style={{ color: "#64748b" }}>
                      Tarih: <span className="font-mono font-bold" style={{ color: "#0f172a" }}>{new Date().toLocaleDateString("tr-TR")}</span>
                    </div>
                    <div className="text-[10px] font-extrabold" style={{ color: "#4338ca" }}>
                      Para Birimi: <span className="font-mono">{companySettings?.currency || "TRY"} (₺)</span>
                    </div>
                  </div>
                </div>

                {/* 3.2 Contact Title Banner */}
                <div
                  className="text-white p-3.5 rounded-xl text-center shadow-md"
                  style={{ backgroundColor: "#1e1b4b", color: "#ffffff" }}
                >
                  <h1 className="text-sm sm:text-base font-black tracking-wide uppercase">
                    CARİ HESAP VE MUAVİN DEFTER HAREKET DÖKÜMÜ
                  </h1>
                  <p className="text-[11px] mt-0.5 font-medium" style={{ color: "#c7d2fe" }}>
                    {selectedLedgerContact.name} • VKN/TCKN: {selectedLedgerContact.taxNumber || "Tanımsız"} • Cari Türü:{" "}
                    {selectedLedgerContact.contactType === "customer"
                      ? "Müşteri (120)"
                      : selectedLedgerContact.contactType === "vendor"
                      ? "Tedarikçi (320)"
                      : "Müşteri & Tedarikçi"}
                  </p>
                </div>

                {/* 3.3 Two-Column Details Card: Contact Info & Financial Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Left: Contact Card Details */}
                  <div
                    className="rounded-xl p-3.5 border space-y-2"
                    style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}
                  >
                    <div
                      className="flex items-center justify-between border-b pb-1.5"
                      style={{ borderBottomColor: "#e2e8f0" }}
                    >
                      <span
                        className="text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5"
                        style={{ color: "#1e1b4b" }}
                      >
                        <Tag className="w-3.5 h-3.5 text-indigo-700" />
                        Cari Kart & Kimlik Bilgileri
                      </span>
                      <span
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                        style={{ backgroundColor: "#e0e7ff", color: "#312e81" }}
                      >
                        Cari Kartı
                      </span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span style={{ color: "#64748b" }} className="font-medium">Cari Adı / Unvanı:</span>
                        <span className="font-bold text-right max-w-[200px] truncate" style={{ color: "#0f172a" }}>{selectedLedgerContact.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: "#64748b" }} className="font-medium">Ticari Unvan:</span>
                        <span className="font-semibold text-right max-w-[200px] truncate" style={{ color: "#1e293b" }}>{selectedLedgerContact.companyTitle || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: "#64748b" }} className="font-medium">Cari Hesap Kodu:</span>
                        <span className="font-mono font-bold" style={{ color: "#1e1b4b" }}>{getContactAccountCode(selectedLedgerContact)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: "#64748b" }} className="font-medium">VKN / TCKN:</span>
                        <span className="font-mono font-medium" style={{ color: "#334155" }}>{selectedLedgerContact.taxNumber || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: "#64748b" }} className="font-medium">Vergi Dairesi:</span>
                        <span className="font-semibold" style={{ color: "#0f172a" }}>{selectedLedgerContact.taxOffice || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: "#64748b" }} className="font-medium">Telefon & E-Posta:</span>
                        <span className="font-medium" style={{ color: "#334155" }}>{selectedLedgerContact.phone || "-"} • {selectedLedgerContact.email || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: "#64748b" }} className="font-medium">Adres / Şehir:</span>
                        <span className="font-medium text-right max-w-[220px] truncate" style={{ color: "#334155" }}>{selectedLedgerContact.address || "-"}, {selectedLedgerContact.city || "-"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Financial Status & Balance Overview */}
                  <div
                    className="rounded-xl p-3.5 border space-y-2"
                    style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}
                  >
                    <div
                      className="flex items-center justify-between border-b pb-1.5"
                      style={{ borderBottomColor: "#e2e8f0" }}
                    >
                      <span
                        className="text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5"
                        style={{ color: "#1e1b4b" }}
                      >
                        <Landmark className="w-3.5 h-3.5 text-indigo-700" />
                        Finansal Durum & Bakiye Özeti
                      </span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: ledgerSummary.netBalance > 0 ? "#d1fae5" : ledgerSummary.netBalance < 0 ? "#ffe4e6" : "#f1f5f9",
                          color: ledgerSummary.netBalance > 0 ? "#065f46" : ledgerSummary.netBalance < 0 ? "#9f1239" : "#334155",
                        }}
                      >
                        {ledgerSummary.netBalance > 0 ? "Alacaklıyız" : ledgerSummary.netBalance < 0 ? "Borçluyuz" : "Bakiye Sıfır"}
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div
                        className="flex justify-between items-center px-2.5 py-1.5 rounded-lg font-bold"
                        style={{ backgroundColor: "#e0e7ff" }}
                      >
                        <span style={{ color: "#1e1b4b" }}>Güncel Net Cari Bakiye:</span>
                        <span
                          className="font-mono text-sm sm:text-base font-black"
                          style={{
                            color: ledgerSummary.netBalance > 0 ? "#047857" : ledgerSummary.netBalance < 0 ? "#be123c" : "#334155",
                          }}
                        >
                          ₺{Math.abs(ledgerSummary.netBalance).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="space-y-1 pt-0.5 text-[11px]">
                        <div className="flex justify-between items-center px-1">
                          <span style={{ color: "#64748b" }} className="font-medium">Toplam Borçlandırılan Tutar:</span>
                          <span className="font-mono font-bold" style={{ color: "#1e293b" }}>₺{ledgerSummary.totalDebit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center px-1">
                          <span style={{ color: "#64748b" }} className="font-medium">Toplam Alacaklandırılan Tutar:</span>
                          <span className="font-mono font-bold" style={{ color: "#1e293b" }}>₺{ledgerSummary.totalCredit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center px-1">
                          <span style={{ color: "#64748b" }} className="font-medium">Son Hareket Tarihi:</span>
                          <span className="font-mono font-semibold" style={{ color: "#1e293b" }}>{ledgerSummary.lastMovementDate ? formatDate(ledgerSummary.lastMovementDate) : "-"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3.4 Summary Analytics 4-Box Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Toplam Borç */}
                  <div
                    className="rounded-xl p-3 text-center space-y-1 border"
                    style={{ backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }}
                  >
                    <span className="text-[10px] font-extrabold uppercase block tracking-wide" style={{ color: "#1e3a8a" }}>
                      Toplam Borç Hareketi
                    </span>
                    <span className="text-sm sm:text-base font-black font-mono block" style={{ color: "#172554" }}>
                      ₺{ledgerSummary.totalDebit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] font-semibold block" style={{ color: "#2563eb" }}>
                      Satış & Faturalar
                    </span>
                  </div>

                  {/* Toplam Alacak */}
                  <div
                    className="rounded-xl p-3 text-center space-y-1 border"
                    style={{ backgroundColor: "#eef2ff", borderColor: "#c7d2fe" }}
                  >
                    <span className="text-[10px] font-extrabold uppercase block tracking-wide" style={{ color: "#312e81" }}>
                      Toplam Alacak Hareketi
                    </span>
                    <span className="text-sm sm:text-base font-black font-mono block" style={{ color: "#1e1b4b" }}>
                      ₺{ledgerSummary.totalCredit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] font-semibold block" style={{ color: "#4338ca" }}>
                      Tahsilat & Ödemeler
                    </span>
                  </div>

                  {/* Net Bakiye */}
                  <div
                    className="rounded-xl p-3 text-center space-y-1 border"
                    style={{
                      backgroundColor: ledgerSummary.netBalance > 0 ? "#ecfdf5" : ledgerSummary.netBalance < 0 ? "#fff1f2" : "#f8fafc",
                      borderColor: ledgerSummary.netBalance > 0 ? "#a7f3d0" : ledgerSummary.netBalance < 0 ? "#fecdd3" : "#e2e8f0",
                      color: ledgerSummary.netBalance > 0 ? "#064e3b" : ledgerSummary.netBalance < 0 ? "#881337" : "#0f172a",
                    }}
                  >
                    <span className="text-[10px] font-extrabold uppercase block tracking-wide">
                      Net Cari Bakiye
                    </span>
                    <span className="text-sm sm:text-base font-black font-mono block">
                      ₺{Math.abs(ledgerSummary.netBalance).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] font-bold block">
                      {ledgerSummary.netBalance > 0 ? "● Alacaklıyız" : ledgerSummary.netBalance < 0 ? "● Borçluyuz" : "● Bakiye Sıfır"}
                    </span>
                  </div>

                  {/* Toplam İşlem / Evrak */}
                  <div
                    className="rounded-xl p-3 text-center space-y-1 border"
                    style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}
                  >
                    <span className="text-[10px] font-extrabold uppercase block tracking-wide" style={{ color: "#334155" }}>
                      Toplam Hareket Sayısı
                    </span>
                    <span className="text-sm sm:text-base font-black font-mono block" style={{ color: "#0f172a" }}>
                      {ledgerSummary.totalMovements} Evrak
                    </span>
                    <span className="text-[10px] font-semibold block" style={{ color: "#64748b" }}>
                      {ledgerSummary.invoiceCount} Fatura • {ledgerSummary.collectionCount + ledgerSummary.paymentCount} Finans
                    </span>
                  </div>
                </div>

                {/* 3.5 Movement Details Table */}
                <div
                  className="rounded-xl overflow-hidden shadow-xs border"
                  style={{ borderColor: "#cbd5e1" }}
                >
                  <div
                    className="text-white px-3.5 py-2 flex items-center justify-between"
                    style={{ backgroundColor: "#1e1b4b", color: "#ffffff" }}
                  >
                    <span className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-200" />
                      Cari Hareket & Muavin Kayıtları ({filteredLedgerEntries.length} Adet)
                    </span>
                    <span className="text-[10px] text-indigo-200 font-medium">
                      Kronolojik İşlem Sırası
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse" style={{ backgroundColor: "#ffffff" }}>
                      <thead>
                        <tr
                          className="font-bold border-b uppercase text-[10px] tracking-wider"
                          style={{ backgroundColor: "#f1f5f9", color: "#1e1b4b", borderBottomColor: "#cbd5e1" }}
                        >
                          <th className="py-2.5 px-3">Tarih</th>
                          <th className="py-2.5 px-3 text-center">Belge Türü</th>
                          <th className="py-2.5 px-3 font-mono">Belge / Fatura No</th>
                          <th className="py-2.5 px-3">Açıklama</th>
                          <th className="py-2.5 px-3 text-right">Borç (₺)</th>
                          <th className="py-2.5 px-3 text-right">Alacak (₺)</th>
                          <th className="py-2.5 px-3 text-right" style={{ backgroundColor: "#e0e7ff" }}>Yürüyen Bakiye (₺)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: "#f1f5f9" }}>
                        {filteredLedgerEntries.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-8 bg-white" style={{ color: "#94a3b8" }}>
                              Seçili filtrelere uygun cari hareket kaydı bulunamadı.
                            </td>
                          </tr>
                        ) : (
                          filteredLedgerEntries.map((m, idx) => (
                            <tr
                              key={m.id || idx}
                              style={{ backgroundColor: idx % 2 === 1 ? "#f8fafc" : "#ffffff" }}
                              className="hover:bg-slate-50 transition-colors"
                            >
                              <td className="py-2 px-3 font-mono whitespace-nowrap" style={{ color: "#334155" }}>
                                {formatDate(m.date)}
                              </td>
                              <td className="py-2 px-3 text-center whitespace-nowrap">
                                <span
                                  className="inline-block px-2 py-0.5 rounded text-[10px] font-bold border"
                                  style={{
                                    backgroundColor: m.documentType === "Fatura" ? "#eff6ff" : m.documentType === "Tahsilat" ? "#ecfdf5" : m.documentType === "Tediye" || m.documentType === "Ödeme" ? "#fffbeb" : "#f5f3ff",
                                    color: m.documentType === "Fatura" ? "#1e40af" : m.documentType === "Tahsilat" ? "#065f46" : m.documentType === "Tediye" || m.documentType === "Ödeme" ? "#92400e" : "#5b21b6",
                                    borderColor: m.documentType === "Fatura" ? "#bfdbfe" : m.documentType === "Tahsilat" ? "#a7f3d0" : m.documentType === "Tediye" || m.documentType === "Ödeme" ? "#fde68a" : "#ddd6fe",
                                  }}
                                >
                                  {m.documentType}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-mono font-bold whitespace-nowrap" style={{ color: "#1e293b" }}>
                                {m.documentNo || "-"}
                              </td>
                              <td className="py-2 px-3 max-w-[220px] truncate" title={m.description} style={{ color: "#334155" }}>
                                {m.description || "-"}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold whitespace-nowrap" style={{ color: "#0f172a" }}>
                                {m.debit > 0 ? `₺${m.debit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}` : "-"}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold whitespace-nowrap" style={{ color: "#0f172a" }}>
                                {m.credit > 0 ? `₺${m.credit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}` : "-"}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-black whitespace-nowrap" style={{ backgroundColor: "#f1f5f9" }}>
                                <span
                                  style={{
                                    color: m.runningBalance > 0 ? "#047857" : m.runningBalance < 0 ? "#be123c" : "#334155",
                                  }}
                                >
                                  ₺{Math.abs(m.runningBalance).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {filteredLedgerEntries.length > 0 && (
                        <tfoot>
                          <tr
                            className="font-black border-t-2"
                            style={{ backgroundColor: "#e0e7ff", color: "#1e1b4b", borderTopColor: "#6366f1" }}
                          >
                            <td colSpan={4} className="py-2.5 px-3 uppercase text-[11px] tracking-wider">
                              Genel Toplam ({filteredLedgerEntries.length} Hareket)
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-xs">
                              ₺{filteredLedgerEntries.reduce((acc, curr) => acc + curr.debit, 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-xs">
                              ₺{filteredLedgerEntries.reduce((acc, curr) => acc + curr.credit, 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-xs" style={{ backgroundColor: "#c7d2fe", color: "#1e1b4b" }}>
                              ₺{Math.abs(ledgerSummary.netBalance).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>

                {/* 3.6 Statutory Provisions / Legal Note */}
                <div
                  className="rounded-xl p-3.5 space-y-1.5 text-[11px] border"
                  style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0", color: "#475569" }}
                >
                  <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wide" style={{ color: "#1e293b" }}>
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-700" />
                    <span>Yasal Hükümler, Tevsik ve İtiraz Şartları</span>
                  </div>
                  <p className="leading-relaxed">
                    <strong>1.</strong> İşbu cari hesap ekstresi, 6102 Sayılı Türk Ticaret Kanunu (TTK M.83-94) cari hesap sözleşmesi hükümleri ve 213 Sayılı Vergi Usul Kanunu (VUK M.227) uyarınca düzenlenmiş resmi tevsik belgesidir.
                  </p>
                  <p className="leading-relaxed">
                    <strong>2.</strong> TTK M.94 gereğince işbu ekstrenin tebliğinden itibaren <strong>bir (1) ay</strong> içerisinde noter, taahhütlü mektup, telgraf veya KEP ile itiraz edilmeyen cari hesap bakiyesi ve hareketler kesinleşmiş ve mutabık kabul edilir.
                  </p>
                  <p className="leading-relaxed">
                    <strong>3.</strong> İrsaliyeli ve e-arşiv/e-fatura tevsik belgeleri yasal defter ve beyannamelerle tam uyumludur.
                  </p>
                </div>

                {/* 3.7 Official Signatures */}
                <div className="grid grid-cols-2 gap-8 pt-4 border-t" style={{ borderTopColor: "#e2e8f0" }}>
                  <div className="text-center space-y-8">
                    <div>
                      <p className="font-black text-xs uppercase tracking-wider" style={{ color: "#1e1b4b" }}>
                        DÜZENLEYEN / MALİ İŞLER & MUHASEBE
                      </p>
                      <p className="text-[10px] font-medium" style={{ color: "#64748b" }}>Yetkili İmza / Firma Kaşesi</p>
                    </div>
                    <div className="h-10 border-b border-dashed w-36 mx-auto" style={{ borderBottomColor: "#cbd5e1" }}></div>
                  </div>

                  <div className="text-center space-y-8">
                    <div>
                      <p className="font-black text-xs uppercase tracking-wider" style={{ color: "#1e1b4b" }}>
                        CARİ HESAP SAHİBİ / YETKİLİ ONAYI
                      </p>
                      <p className="text-[10px] font-medium" style={{ color: "#64748b" }}>Mutabakat İmzası / Mühür</p>
                    </div>
                    <div className="h-10 border-b border-dashed w-36 mx-auto" style={{ borderBottomColor: "#cbd5e1" }}></div>
                  </div>
                </div>

                {/* 3.8 Footer Note */}
                <div className="text-center text-[10px] pt-2 border-t" style={{ borderTopColor: "#f1f5f9", color: "#94a3b8" }}>
                  Bu cari hesap ekstresi elektronik ortamda oluşturulmuş olup resmi muhasebe kayıtlarının tevsik edici belgesidir. • Muavin Cari Hesap & Ön Muhasebe Yönetim Sistemi
                </div>
              </div>
            </div>

            {/* 4. Modal Bottom Bar (no-print) */}
            <div className="p-3 sm:p-4 px-6 border-t border-purple-200 bg-purple-50/60 shrink-0 flex flex-wrap items-center justify-between gap-3 z-20 no-print">
              <span className="text-xs text-purple-950 font-bold">
                Toplam Kayıt: <strong className="font-mono">{filteredLedgerEntries.length}</strong> / {currentLedgerEntries.length} Hareket • Net Bakiye:{" "}
                <strong className={ledgerSummary.netBalance > 0 ? "text-emerald-700" : ledgerSummary.netBalance < 0 ? "text-rose-700" : "text-slate-800"}>
                  ₺{Math.abs(ledgerSummary.netBalance).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportLedgerPDFDirect}
                  disabled={isPdfGenerating}
                  className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-4 py-1.5 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  title="Cari Hesap Ekstresi ve Muavin Defterini PDF Olarak İndir"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>{isPdfGenerating ? "Hazırlanıyor..." : "PDF İndir"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenShareModal("whatsapp")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Paylaş</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenShareModal("email")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>E-Posta Gönder</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLedgerContact(null)}
                  className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold px-4 py-1.5 rounded-xl cursor-pointer transition-colors"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP SHARE MODAL */}
      {shareType === "whatsapp" && selectedLedgerContact && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    WhatsApp ile Cari Ekstre Paylaş
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedLedgerContact.name} ({getContactAccountCode(selectedLedgerContact)})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShareType(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inputs & Options */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WhatsApp Telefon Numarası
                </label>
                <input
                  type="text"
                  value={sharePhone}
                  onChange={(e) => setSharePhone(e.target.value)}
                  placeholder="Örn: 0532 123 45 67 veya 905321234567"
                  className="w-full text-xs font-medium border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Cari kartında kayıtlı numara getirildi. Dilerseniz farklı bir numara girebilirsiniz.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Gönderim Kanalı & Paylaşım Yöntemi
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWhatsappMode("direct")}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer relative ${
                      whatsappMode === "direct"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-extrabold text-emerald-800">
                        ⚡ WhatsApp API (Doğrudan)
                      </span>
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
                      Sekme açmadan doğrudan PDF eki ve mesaj iletir
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWhatsappMode("web")}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                      whatsappMode === "web"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    🌐 WhatsApp Web Linki
                    <span className="block text-[10px] font-normal text-slate-500 mt-1">
                      PDF iner + WhatsApp Web sekmesi açılır
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWhatsappMode("native")}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                      whatsappMode === "native"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    📱 Sistem / Mobil Paylaşım
                    <span className="block text-[10px] font-normal text-slate-500 mt-1">
                      İşletim sistemi menüsünden aktar
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWhatsappMode("auto")}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                      whatsappMode === "auto"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    💬 WhatsApp Uygulaması
                    <span className="block text-[10px] font-normal text-slate-500 mt-1">
                      Cihazdaki varsayılan WhatsApp app
                    </span>
                  </button>
                </div>
              </div>

              {/* PDF Attachment Guidance Box */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <Paperclip className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {whatsappMode === "direct"
                      ? "⚡ Doğrudan Baileys WhatsApp API İletimi (Önerilen)"
                      : whatsappMode === "native"
                      ? "Mobil & Sistem Paylaşım Desteği (Native Web Share)"
                      : whatsappMode === "web"
                      ? "WhatsApp Web & 10 Dakikalık Geçici Bulut Linki"
                      : "WhatsApp Uygulama İle Gönderim"}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  {whatsappMode === "direct"
                    ? "Sistem PDF Cari Ekstre belgesini otomatik oluşturur ve WhatsApp API üzerinden müşterinizin telefonuna doğrudan dosya ve özet mesaj olarak fırlatır. Ekstra sekme açılmaz, dosya sürüklemeniz gerekmez."
                    : whatsappMode === "native"
                    ? "Sistem Paylaşımı seçildiğinde, PDF belgesi işletim sisteminin yerel paylaşım menüsü (Android/iOS/Masaüstü) üzerinden doğrudan WhatsApp'a aktarılır."
                    : whatsappMode === "web"
                    ? "Gönder düğmesine basıldığında PDF Cari Ekstre belgesi bilgisayarınıza indirilir ve WhatsApp Web sekmesi başlatılır."
                    : "Gönder düğmesine basıldığında cihazdaki yerel WhatsApp uygulaması başlatılır."}
                </p>
              </div>

              {/* Message Text Preview */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Gönderilecek Mesaj Taslağı
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto custom-scrollbar">
                  {`Sayın *${selectedLedgerContact.name}* (${getContactAccountCode(selectedLedgerContact)}),\n\n*${companySettings?.companyName || "Firma"}* firmamıza ait Cari Hesap Ekstreniz tanzim edilmiştir.\n\n📊 *Güncel Net Bakiye:* ${formatCurrency(Math.abs(selectedLedgerContact.balance), companySettings?.currency || "TRY")} (${selectedLedgerContact.balance > 0 ? "Alacaklıyız" : selectedLedgerContact.balance < 0 ? "Borçluyuz" : "Sıfır Bakiye"})\n\n📄 *Ekstre PDF Dosyası:* "${selectedLedgerContact.name}_Cari_Ekstre.pdf" ekte yer almaktadır.`}
                </div>
              </div>

              {cloudStatusText && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-800 font-medium flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
                  <span>{cloudStatusText}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShareType(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleSendWhatsApp}
                disabled={isGeneratingPDF}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-600/20"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isGeneratingPDF
                    ? "İletiliyor..."
                    : whatsappMode === "direct"
                    ? "🟢 WhatsApp ile Doğrudan Gönder (PDF Ekli)"
                    : "WhatsApp'ta Aç ve Gönder"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL SHARE MODAL */}
      {shareType === "email" && selectedLedgerContact && (
        <EmailExportModal
          isOpen={shareType === "email"}
          onClose={() => setShareType(null)}
          title={`Cari Hesap Ekstresi & Muavin Dökümü - ${selectedLedgerContact.name}`}
          filename={`${selectedLedgerContact.name.replace(/\s+/g, "_")}_Cari_Ekstre_${new Date().getFullYear()}.pdf`}
          defaultEmail={selectedLedgerContact.email || ""}
          defaultRecipientName={selectedLedgerContact.name}
          defaultSubject={`Cari Hesap Ekstresi - ${companySettings?.companyName || "Firma"} (${selectedLedgerContact.name})`}
          companyName={companySettings?.companyName || "Firma"}
          contacts={contacts}
          getPdfBlob={async () => {
            const res = await generateLedgerPDF(selectedLedgerContact);
            return res ? { blob: res.blob, fileName: res.fileName, pdf: res.pdf } : null;
          }}
          documentSummary={[
            { label: "Cari Hesap Kodu", value: getContactAccountCode(selectedLedgerContact) },
            {
              label: "Güncel Net Bakiye",
              value: `${formatCurrency(Math.abs(selectedLedgerContact.balance), companySettings?.currency || "TRY")} (${
                selectedLedgerContact.balance > 0
                  ? "Alacaklıyız (Borçlu Cari)"
                  : selectedLedgerContact.balance < 0
                  ? "Borçluyuz (Alacaklı Cari)"
                  : "Sıfır Bakiye"
              })`,
            },
            {
              label: "Toplam Kayıt",
              value: `${getLedgerEntries(selectedLedgerContact.id).length} Hareket Kaydı`,
            },
          ]}
        />
      )}

      {/* TAHSİLAT YAP / ÖDEME YAP MODAL */}
      {actionModalType && selectedActionContact && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-xl w-full p-3 sm:p-5 shadow-2xl space-y-3 sm:space-y-4 my-auto max-h-[92vh] overflow-y-auto custom-scrollbar">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl border ${
                    actionModalType === "collection"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                      : "bg-rose-50 border-rose-200 text-rose-600"
                  }`}
                >
                  {actionModalType === "collection" ? (
                    <ArrowDownLeft className="w-5 h-5" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                    {actionModalType === "collection"
                      ? "Müşteriden / Cariden Tahsilat Al"
                      : "Cariye Ödeme Yap"}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                    {actionModalType === "collection"
                      ? "Gelir girişi ve alacak kapatma işlemi"
                      : "Gider çıkışı ve borç kapatma işlemi"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActionModalType(null);
                  setSelectedActionContact(null);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selected Contact Card Summary */}
            <div className="bg-slate-50 border border-slate-200 p-2.5 sm:p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wide">İşlem Yapılan Cari</span>
                <div className="text-xs sm:text-sm font-extrabold text-slate-900">{selectedActionContact.name}</div>
                {selectedActionContact.companyTitle && (
                  <div className="text-[11px] text-slate-500 font-medium">{selectedActionContact.companyTitle}</div>
                )}
              </div>
              <div className="sm:text-right">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wide">Güncel Bakiye</span>
                <div
                  className={`text-xs sm:text-sm font-black ${
                    selectedActionContact.balance > 0
                      ? "text-emerald-600"
                      : selectedActionContact.balance < 0
                      ? "text-rose-600"
                      : "text-slate-600"
                  }`}
                >
                  ₺{Math.abs(selectedActionContact.balance).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] font-bold text-slate-400">
                  {selectedActionContact.balance > 0
                    ? "Alacaklıyız (Borcu Var)"
                    : selectedActionContact.balance < 0
                    ? "Borçluyuz (Alacağı Var)"
                    : "Bakiye Sıfır"}
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveAction} className="space-y-3 sm:space-y-4 text-xs">
              {/* Finans Yönetimi Alt Modül Tab Seçimi (Kasa, Banka, Kredi Kartı, Çek, Senet, Virman) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Finans Modülü / Ödeme Yöntemi Seçin *
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 sm:gap-1.5 p-1 sm:p-1.5 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setPayMethod("kasa");
                      const acc = accounts.find((a) => a.type === "cash") || accounts[0];
                      if (acc) setPayAccountId(acc.id);
                    }}
                    className={`py-1.5 sm:py-2 px-1 rounded-lg font-bold text-[10px] sm:text-[11px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      payMethod === "kasa"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Nakit Kasa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPayMethod("banka");
                      const acc = accounts.find((a) => a.type === "bank") || accounts[0];
                      if (acc) setPayAccountId(acc.id);
                    }}
                    className={`py-1.5 sm:py-2 px-1 rounded-lg font-bold text-[10px] sm:text-[11px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      payMethod === "banka"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span>Banka</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPayMethod("kredi_karti");
                      const acc = accounts.find((a) => a.type === "credit_card") || accounts[0];
                      if (acc) setPayAccountId(acc.id);
                    }}
                    className={`py-1.5 sm:py-2 px-1 rounded-lg font-bold text-[10px] sm:text-[11px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      payMethod === "kredi_karti"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Kredi Kartı</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayMethod("cek")}
                    className={`py-1.5 sm:py-2 px-1 rounded-lg font-bold text-[10px] sm:text-[11px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      payMethod === "cek"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Çek</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayMethod("senet")}
                    className={`py-1.5 sm:py-2 px-1 rounded-lg font-bold text-[10px] sm:text-[11px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      payMethod === "senet"
                        ? "bg-purple-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Senet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPayMethod("virman");
                      const otherContact = contacts.find((c) => c.id !== selectedActionContact?.id);
                      if (otherContact) setVirmanTargetContactId(otherContact.id);
                    }}
                    className={`py-1.5 sm:py-2 px-1 rounded-lg font-bold text-[10px] sm:text-[11px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      payMethod === "virman"
                        ? "bg-teal-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    <span>Virman</span>
                  </button>
                </div>
              </div>

              {/* Form Fields: KASA / BANKA / KREDİ KARTI */}
              {(payMethod === "kasa" || payMethod === "banka" || payMethod === "kredi_karti") && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {payMethod === "kasa"
                        ? "Nakit Kasa Hesabı *"
                        : payMethod === "banka"
                        ? "Banka Hesabı (EFT/Havale) *"
                        : "Kredi Kartı / POS Hesabı *"}
                    </label>
                    <select
                      value={payAccountId}
                      onChange={(e) => setPayAccountId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 font-bold text-slate-900 cursor-pointer text-xs"
                      required
                    >
                      {accounts
                        .filter((a) =>
                          payMethod === "kasa"
                            ? a.type === "cash"
                            : payMethod === "banka"
                            ? a.type === "bank"
                            : a.type === "credit_card"
                        )
                        .map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} ({acc.bankName || acc.type}) - Bakiye: ₺
                            {acc.balance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </option>
                        ))}
                      {accounts.filter((a) =>
                        payMethod === "kasa"
                          ? a.type === "cash"
                          : payMethod === "banka"
                          ? a.type === "bank"
                          : a.type === "credit_card"
                      ).length === 0 && (
                        <option value="">-- Tüm Hesaplar --</option>
                      )}
                    </select>
                  </div>

                  {payMethod === "kredi_karti" && (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Taksit Sayısı</label>
                      <select
                        value={payInstallmentCount}
                        onChange={(e) => setPayInstallmentCount(parseInt(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 font-bold text-slate-900 cursor-pointer text-xs"
                      >
                        <option value={1}>Tek Çekim (Taksitsiz)</option>
                        <option value={2}>2 Taksit</option>
                        <option value={3}>3 Taksit</option>
                        <option value={6}>6 Taksit</option>
                        <option value={9}>9 Taksit</option>
                        <option value={12}>12 Taksit</option>
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        {actionModalType === "collection" ? "Tahsil Edilen Tutar (₺) *" : "Ödenen Tutar (₺) *"}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 font-mono font-black text-sm sm:text-base text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">İşlem Tarihi *</label>
                      <input
                        type="date"
                        required
                        value={payDate}
                        onChange={(e) => setPayDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 font-bold text-slate-900 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Belge / Dekont / Slip No</label>
                      <input
                        type="text"
                        value={payDocNo}
                        onChange={(e) => setPayDocNo(e.target.value)}
                        placeholder="Örn: SLIP-1290"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 font-medium text-slate-900 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Açıklama / Not</label>
                      <input
                        type="text"
                        value={payDesc}
                        onChange={(e) => setPayDesc(e.target.value)}
                        placeholder="Örn: Fatura borcuna mahsuben"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 font-medium text-slate-900 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Form Fields: ÇEK */}
              {payMethod === "cek" && (
                <div className="space-y-3">
                  <div className="p-2.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl font-medium text-xs flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>
                      {actionModalType === "collection"
                        ? "Portföye Müşteri Çeki eklenir ve cari hesabın alacağı düşülür."
                        : "Portföyden/Firmadan Çek Çıkışı yapılır ve cari hesabın borcu kapatılır."}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Çek Tutarı (₺) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 font-mono font-black text-sm sm:text-base text-indigo-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Çek Numarası *</label>
                      <input
                        type="text"
                        required
                        value={docNumber}
                        onChange={(e) => setDocNumber(e.target.value)}
                        placeholder="Örn: ÇEK-901823"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 font-mono font-bold text-slate-900 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Banka Adı *</label>
                      <input
                        type="text"
                        required
                        value={docBankName}
                        onChange={(e) => setDocBankName(e.target.value)}
                        placeholder="Örn: Garanti BBVA"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 font-bold text-slate-900 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Keşideci / Borçlu Adı *</label>
                      <input
                        type="text"
                        required
                        value={docDebtorName}
                        onChange={(e) => setDocDebtorName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 font-bold text-slate-900 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Vade Tarihi *</label>
                      <input
                        type="date"
                        required
                        value={docDueDate}
                        onChange={(e) => setDocDueDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 font-bold text-slate-900 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Alınış / Veriliş Tarihi *</label>
                      <input
                        type="date"
                        required
                        value={payDate}
                        onChange={(e) => setPayDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 font-bold text-slate-900 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Açıklama / Not</label>
                    <input
                      type="text"
                      value={payDesc}
                      onChange={(e) => setPayDesc(e.target.value)}
                      placeholder="Örn: 30 gün vadeli müşteri çeki"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 font-medium text-slate-900 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Form Fields: SENET */}
              {payMethod === "senet" && (
                <div className="space-y-3">
                  <div className="p-2.5 bg-purple-50 border border-purple-200 text-purple-900 rounded-xl font-medium text-xs flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>
                      {actionModalType === "collection"
                        ? "Portföye Müşteri Senedi eklenir ve cari hesabın alacağı düşülür."
                        : "Portföyden/Firmadan Senet Çıkışı yapılır ve cari hesabın borcu kapatılır."}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Senet Tutarı (₺) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 font-mono font-black text-sm sm:text-base text-purple-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Senet Numarası *</label>
                      <input
                        type="text"
                        required
                        value={docNumber}
                        onChange={(e) => setDocNumber(e.target.value)}
                        placeholder="Örn: SNT-102938"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 font-mono font-bold text-slate-900 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Borçlu Adı / Soyadı *</label>
                      <input
                        type="text"
                        required
                        value={docDebtorName}
                        onChange={(e) => setDocDebtorName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 font-bold text-slate-900 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Vade Tarihi *</label>
                      <input
                        type="date"
                        required
                        value={docDueDate}
                        onChange={(e) => setDocDueDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 font-bold text-slate-900 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">İşlem Tarihi *</label>
                      <input
                        type="date"
                        required
                        value={payDate}
                        onChange={(e) => setPayDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 font-bold text-slate-900 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Açıklama / Not</label>
                      <input
                        type="text"
                        value={payDesc}
                        onChange={(e) => setPayDesc(e.target.value)}
                        placeholder="Örn: Sözleşmeye istinaden alınan senet"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 font-medium text-slate-900 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Form Fields: CARİLER ARASI VİRMAN */}
              {payMethod === "virman" && (
                <div className="space-y-3">
                  <div className="p-2.5 sm:p-3 bg-teal-50 border border-teal-200 text-teal-900 rounded-xl font-medium text-xs flex items-center gap-2">
                    <ArrowRightLeft className="w-5 h-5 text-teal-600 shrink-0" />
                    <div>
                      <strong>Cariler Arası Virman Fişi:</strong> Kasa veya banka hareketi olmadan, seçilen diğer cari hesap ile bu cari arasında borç/alacak virman aktarımı yapar.
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Virman Yapılacak Karşı Cari Hesabı Seçin *</label>
                    <select
                      value={virmanTargetContactId}
                      onChange={(e) => setVirmanTargetContactId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 font-bold text-slate-900 cursor-pointer text-xs"
                      required
                    >
                      <option value="">-- Karşı Cari Seçin --</option>
                      {contacts
                        .filter((c) => c.id !== selectedActionContact.id)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.companyTitle || "Şahıs/Firma"}) - Bakiye: ₺
                            {c.balance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Virman Tutarı (₺) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 font-mono font-black text-sm sm:text-base text-teal-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">İşlem Tarihi *</label>
                      <input
                        type="date"
                        required
                        value={payDate}
                        onChange={(e) => setPayDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 font-bold text-slate-900 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Virman Dekont / Fiş No</label>
                      <input
                        type="text"
                        value={payDocNo}
                        onChange={(e) => setPayDocNo(e.target.value)}
                        placeholder="Örn: VRM-2026-001"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 font-medium text-slate-900 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Açıklama / Not</label>
                      <input
                        type="text"
                        value={payDesc}
                        onChange={(e) => setPayDesc(e.target.value)}
                        placeholder="Örn: Cariler arası borç virman transferi"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 font-medium text-slate-900 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 flex flex-col sm:flex-row justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setActionModalType(null);
                    setSelectedActionContact(null);
                  }}
                  className="w-full sm:w-auto px-4 py-2 text-slate-500 hover:bg-slate-100 cursor-pointer rounded-xl font-semibold text-xs"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={!payAmount || parseFloat(payAmount) <= 0}
                  className={`w-full sm:w-auto px-5 py-2 font-bold text-white text-xs rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md ${
                    actionModalType === "collection"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {actionModalType === "collection" ? "Tahsilatı İşle (Onayla)" : "Ödemeyi İşle (Onayla)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
