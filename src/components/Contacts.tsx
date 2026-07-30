import React, { useState, useEffect } from "react";
import { Contact, ContactType, LedgerEntry, Invoice, Transaction, Account, Cheque, PromissoryNote, CompanySettings, getContactAccountCode } from "../types";
import { ExportButtons } from "./ExportButtons";
import { ExportData, formatCurrency } from "../utils/exportUtils";
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
} from "lucide-react";
import {
  ALL_81_PROVINCES,
  COMMON_STREET_TYPES,
  getDistrictsForProvince,
  getNeighborhoodsForDistrict,
  getTaxOfficesForProvince,
} from "../data/locationAndTaxData";
import { AddressSelector } from "./AddressSelector";

interface ContactsProps {
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
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Selected contact for Ledger / Muavin statement modal
  const [selectedLedgerContact, setSelectedLedgerContact] = useState<Contact | null>(null);

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

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    companyTitle: string;
    contactType: ContactType;
    taxOffice: string;
    taxNumber: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    district: string;
    neighborhood: string;
    street: string;
    buildingNo: string;
    notes: string;
  }>({
    name: "",
    companyTitle: "",
    contactType: "customer",
    taxOffice: "Kadıköy V.D.",
    taxNumber: "",
    email: "",
    phone: "",
    address: "",
    city: "İstanbul",
    district: "Kadıköy",
    neighborhood: "Caferağa (Moda)",
    street: "Bağdat Caddesi",
    buildingNo: "No: 12 D: 4",
    notes: "",
  });

  // Custom Input Toggles for Address/Tax Office
  const [isCustomDistrict, setIsCustomDistrict] = useState<boolean>(false);
  const [isCustomNeighborhood, setIsCustomNeighborhood] = useState<boolean>(false);
  const [isCustomStreet, setIsCustomStreet] = useState<boolean>(false);
  const [isCustomTaxOffice, setIsCustomTaxOffice] = useState<boolean>(false);

  // Address Builder Helper
  const compileAddress = (
    nh: string,
    st: string,
    bld: string,
    dist: string,
    ct: string
  ) => {
    const parts = [];
    if (nh && nh !== "Diğer") parts.push(nh.endsWith("Mah.") || nh.endsWith("Mahallesi") ? nh : `${nh} Mah.`);
    if (st && st !== "Diğer") parts.push(st);
    if (bld) parts.push(bld);
    let full = parts.join(" ");
    const loc = [dist !== "Diğer" ? dist : "", ct].filter(Boolean).join(" / ");
    if (loc) {
      full = full ? `${full}, ${loc}` : loc;
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

    const newAddress = compileAddress(newNh, formData.street, formData.buildingNo, newDistrict, newCity);

    setFormData((prev) => ({
      ...prev,
      city: newCity,
      district: newDistrict,
      neighborhood: newNh,
      taxOffice: newTaxOffice,
      address: newAddress,
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
    const newAddress = compileAddress(newNh, formData.street, formData.buildingNo, newDistrict, formData.city);

    setFormData((prev) => ({
      ...prev,
      district: newDistrict,
      neighborhood: newNh,
      address: newAddress,
    }));
  };

  const handleNeighborhoodChange = (newNh: string) => {
    if (newNh === "__custom__") {
      setIsCustomNeighborhood(true);
      setFormData((prev) => ({ ...prev, neighborhood: "" }));
      return;
    }
    setIsCustomNeighborhood(false);
    const newAddress = compileAddress(newNh, formData.street, formData.buildingNo, formData.district, formData.city);

    setFormData((prev) => ({
      ...prev,
      neighborhood: newNh,
      address: newAddress,
    }));
  };

  const handleStreetChange = (newStreet: string) => {
    if (newStreet === "__custom__") {
      setIsCustomStreet(true);
      setFormData((prev) => ({ ...prev, street: "" }));
      return;
    }
    setIsCustomStreet(false);
    const newAddress = compileAddress(formData.neighborhood, newStreet, formData.buildingNo, formData.district, formData.city);

    setFormData((prev) => ({
      ...prev,
      street: newStreet,
      address: newAddress,
    }));
  };

  const handleBuildingNoChange = (newBld: string) => {
    const newAddress = compileAddress(formData.neighborhood, formData.street, newBld, formData.district, formData.city);
    setFormData((prev) => ({
      ...prev,
      buildingNo: newBld,
      address: newAddress,
    }));
  };

  const handleOpenAddModal = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact);
      const ct = contact.city || "İstanbul";
      const dist = contact.district || getDistrictsForProvince(ct)[0] || "Kadıköy";
      const nh = contact.neighborhood || getNeighborhoodsForDistrict(ct, dist)[0] || "Caferağa";
      const st = contact.street || COMMON_STREET_TYPES[0];

      setFormData({
        name: contact.name,
        companyTitle: contact.companyTitle || "",
        contactType: contact.contactType,
        taxOffice: contact.taxOffice || getTaxOfficesForProvince(ct)[0] || "",
        taxNumber: contact.taxNumber || "",
        email: contact.email || "",
        phone: contact.phone || "",
        address: contact.address || "",
        city: ct,
        district: dist,
        neighborhood: nh,
        street: st,
        buildingNo: "",
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
      const defaultBld = "No: 12 D: 4";
      const defaultTaxOffice = "Kadıköy V.D.";
      const defaultAddr = compileAddress(defaultNh, defaultSt, defaultBld, defaultDist, defaultCity);

      setFormData({
        name: "",
        companyTitle: "",
        contactType: "customer",
        taxOffice: defaultTaxOffice,
        taxNumber: "",
        email: "",
        phone: "",
        address: defaultAddr,
        city: defaultCity,
        district: defaultDist,
        neighborhood: defaultNh,
        street: defaultSt,
        buildingNo: defaultBld,
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
    if (!formData.name.trim()) return;

    const prefix = formData.contactType === "vendor" ? "320" : "120";
    const taxNum = formData.taxNumber && formData.taxNumber.trim() ? formData.taxNumber.trim() : "0000000000";
    const accountCode = `${prefix}.${taxNum}`;

    if (editingContact) {
      onUpdateContact({
        ...editingContact,
        ...formData,
        accountCode,
      });
    } else {
      const newContact: Contact = {
        id: "c_" + Date.now(),
        ...formData,
        accountCode,
        balance: 0,
        balanceType: "balanced",
        createdAt: new Date().toISOString().split("T")[0],
      };
      onAddContact(newContact);
    }
    setIsModalOpen(false);
  };

  // Filter Contacts
  const activeSearchQuery = (globalSearchTerm || search).toLowerCase().trim();
  const filteredContacts = contacts.filter((c) => {
    const accountCodeStr = getContactAccountCode(c).toLowerCase();
    const matchesSearch =
      !activeSearchQuery ||
      c.name.toLowerCase().includes(activeSearchQuery) ||
      accountCodeStr.includes(activeSearchQuery) ||
      (c.taxNumber && c.taxNumber.toLowerCase().includes(activeSearchQuery)) ||
      (c.companyTitle && c.companyTitle.toLowerCase().includes(activeSearchQuery)) ||
      (c.phone && c.phone.toLowerCase().includes(activeSearchQuery)) ||
      (c.email && c.email.toLowerCase().includes(activeSearchQuery));

    if (!matchesSearch) return false;

    if (filterType === "customers") return c.contactType === "customer" || c.contactType === "both";
    if (filterType === "vendors") return c.contactType === "vendor" || c.contactType === "both";
    if (filterType === "receivables") return c.balance > 0;
    if (filterType === "payables") return c.balance < 0;

    return true;
  });

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

  // PDF Export Module
  const exportLedgerPDF = async (contact: Contact) => {
    const element = document.getElementById("printable-ledger");
    if (!element) return;

    try {
      setIsGeneratingPDF(true);
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          // Replace oklch in stylesheet tags with #ffffff to prevent html2canvas color parser errors
          const styleTags = clonedDoc.getElementsByTagName("style");
          for (let i = 0; i < styleTags.length; i++) {
            if (styleTags[i].innerHTML.includes("oklch")) {
              styleTags[i].innerHTML = styleTags[i].innerHTML.replace(/oklch\([^)]+\)/g, "#ffffff");
            }
          }
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // 10mm margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight - 20;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const safeName = (contact.name || "Cari").replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ]/g, "_");
      pdf.save(`Cari_Ekstre_${safeName}.pdf`);
    } catch (err) {
      console.error("PDF indirilemedi:", err);
      alert("PDF oluşturulurken bir hata oluştu. Lütfen tekrar deneyiniz.");
    } finally {
      setIsGeneratingPDF(false);
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
      ? `<tr><td colspan="7" style="text-align:center; padding: 20px; color: #64748b;">Kayıtlı hareket bulunmuyor.</td></tr>`
      : entries
          .map(
            (e) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 10px; font-size: 11px;">${e.date}</td>
          <td style="padding: 8px 10px; font-size: 11px; font-weight: bold;">${e.documentType}</td>
          <td style="padding: 8px 10px; font-size: 11px; font-family: monospace;">${e.documentNo}</td>
          <td style="padding: 8px 10px; font-size: 11px;">${e.description}</td>
          <td style="padding: 8px 10px; font-size: 11px; text-align: right; font-weight: bold;">${e.debit > 0 ? "₺" + e.debit.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "-"}</td>
          <td style="padding: 8px 10px; font-size: 11px; text-align: right; font-weight: bold;">${e.credit > 0 ? "₺" + e.credit.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "-"}</td>
          <td style="padding: 8px 10px; font-size: 11px; text-align: right; font-weight: 800; color: ${e.runningBalance > 0 ? "#059669" : e.runningBalance < 0 ? "#dc2626" : "#475569"};">₺${Math.abs(e.runningBalance).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
        </tr>
      `
          )
          .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <title>Cari Ekstre - ${contact.name}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #0f172a; margin: 0; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; }
          .company-name { font-size: 18px; font-weight: bold; text-transform: uppercase; color: #0f172a; }
          .title { font-size: 20px; font-weight: 900; text-align: right; color: #1e293b; }
          .info-grid { display: flex; justify-content: space-between; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #f1f5f9; text-align: left; padding: 10px; font-size: 11px; font-weight: bold; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; color: #475569; }
          .summary { display: flex; justify-content: flex-end; gap: 20px; margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; font-size: 12px; font-weight: bold; border: 1px solid #e2e8f0; }
          @page { size: landscape; margin: 10mm; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company-name">${compTitle}</div>
            <div style="font-size:11px; color:#64748b;">${compSub}</div>
            <div style="font-size:11px; color:#64748b;">${compTax} ${compPhone}</div>
          </div>
          <div>
            <div class="title">CARİ HESAP EKSTRESİ</div>
            <div style="font-size:11px; text-align:right; color:#64748b;">Tarih: ${new Date().toLocaleDateString("tr-TR")}</div>
          </div>
        </div>

        <div class="info-grid">
          <div>
            <strong>HESAP NO:</strong> <span style="font-family:monospace; font-weight:bold; color:#581c87;">${getContactAccountCode(contact)}</span><br>
            <strong>CARİ UNVANI:</strong> ${contact.name}<br>
            <span style="color:#64748b;">${contact.companyTitle || ""}</span><br>
            <strong>VKN/TCKN:</strong> ${contact.taxNumber || "-"} (${contact.taxOffice || "-"})
          </div>
          <div>
            <strong>İLETİŞİM:</strong> ${contact.phone || "-"} | ${contact.email || "-"}<br>
            <strong>ADRES:</strong> ${contact.address || "-"}, ${contact.city || "-"}
          </div>
          <div style="text-align:right;">
            <strong style="color:#64748b;">NET CARİ BAKİYE:</strong><br>
            <span style="font-size:18px; font-weight:bold; color: ${netBalance > 0 ? "#059669" : netBalance < 0 ? "#dc2626" : "#475569"};">
              ₺${Math.abs(netBalance).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </span><br>
            <span style="font-size:10px; color:#64748b;">(${netBalance > 0 ? "Alacaklıyız" : netBalance < 0 ? "Borçluyuz" : "Sıfır Bakiye"})</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Belge Tipi</th>
              <th>Belge No</th>
              <th>Açıklama</th>
              <th style="text-align:right;">Borç (₺)</th>
              <th style="text-align:right;">Alacak (₺)</th>
              <th style="text-align:right;">Bakiye (₺)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="summary">
          <div>Toplam Borç: <span style="color:#0f172a;">₺${totalDebit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span></div>
          <div>Toplam Alacak: <span style="color:#0f172a;">₺${totalCredit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span></div>
          <div>Net Bakiye: <span style="color: ${netBalance > 0 ? "#059669" : netBalance < 0 ? "#dc2626" : "#475569"};">₺${Math.abs(netBalance).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span></div>
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-purple-50/50 p-1.5 rounded-xl border border-purple-200/50 text-xs font-semibold shadow-2xs">
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
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari unvan, vergi no, il ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white text-slate-900 placeholder-slate-400 text-xs rounded-xl pl-9 pr-3 py-2 border border-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs transition-all"
            />
          </div>
          <ExportButtons getExportData={getContactsExportData} size="sm" />
        </div>
      </div>

      {/* Contacts List Table */}
      <div className="bg-slate-50/60 rounded-2xl border border-purple-200/60 p-3 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-separate border-spacing-y-2.5">
            <thead>
              <tr className="text-purple-950 font-extrabold uppercase tracking-wider text-[11px]">
                <th className="pb-2 px-4">Cari Hesap No</th>
                <th className="pb-2 px-4">Cari Unvan / Şirket</th>
                <th className="pb-2 px-4">Tip</th>
                <th className="pb-2 px-4">Vergi Dairesi & No</th>
                <th className="pb-2 px-4">İletişim</th>
                <th className="pb-2 px-4 text-right">Güncel Bakiye</th>
                <th className="pb-2 px-4 text-center">İşlemler</th>
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
                filteredContacts.map((c) => {
                  const isReceivable = c.balance > 0;
                  const isPayable = c.balance < 0;

                  return (
                    <tr
                      key={c.id}
                      className="bg-white hover:bg-gradient-to-r hover:from-purple-50/90 hover:via-fuchsia-50/60 hover:to-purple-50/90 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group rounded-xl relative z-0 hover:z-10"
                    >
                      <td className="py-3.5 px-4 rounded-l-xl border-y border-l border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                        <span className="font-mono text-xs font-bold px-2 py-1 rounded-md bg-purple-100/80 text-purple-950 border border-purple-300/60 shadow-2xs inline-block">
                          {getContactAccountCode(c)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                        <div className="font-extrabold text-slate-900 group-hover:text-purple-950 text-sm transition-colors">
                          {c.name}
                        </div>
                        {c.companyTitle && c.companyTitle !== c.name && (
                          <div className="text-[11px] text-slate-500 group-hover:text-purple-800/80 truncate max-w-xs transition-colors">
                            {c.companyTitle}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 group-hover:text-purple-700/60 transition-colors">
                          {c.city || "Şehir Belirtilmemiş"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
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

                      <td className="py-3.5 px-4 text-slate-700 font-medium border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                        {c.taxNumber ? (
                          <div>
                            <div>VKN: {c.taxNumber}</div>
                            <div className="text-[10px] text-slate-400 group-hover:text-purple-700/60">
                              V.D: {c.taxOffice || "-"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Belirtilmemiş</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                        {c.phone && (
                          <div className="flex items-center gap-1 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400 group-hover:text-purple-500" />
                            <span>{c.phone}</span>
                          </div>
                        )}
                        {c.email && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 group-hover:text-purple-800/80">
                            <Mail className="w-3 h-3 text-slate-400 group-hover:text-purple-500" />
                            <span className="truncate max-w-[140px]">{c.email}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                        <div
                          className={`font-black text-sm ${
                            isReceivable
                              ? "text-emerald-600"
                              : isPayable
                              ? "text-rose-600"
                              : "text-slate-400"
                          }`}
                        >
                          ₺{Math.abs(c.balance).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 group-hover:text-purple-700/70">
                          {isReceivable
                            ? "Alacaklıyız"
                            : isPayable
                            ? "Borçluyuz"
                            : "Bakiye Sıfır"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center rounded-r-xl border-y border-r border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Tahsilat Yap Button */}
                          <button
                            onClick={() => handleOpenActionModal(c, "collection")}
                            title="Müşteriden / Cariden Tahsilat Al"
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Tahsilat</span>
                          </button>

                          {/* Ödeme Yap Button */}
                          <button
                            onClick={() => handleOpenActionModal(c, "payment")}
                            title="Cariye Ödeme Yap"
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                            <span>Ödeme</span>
                          </button>

                          {/* Ledger / Muavin Button */}
                          <button
                            onClick={() => setSelectedLedgerContact(c)}
                            title="Cari Ekstre / Muavin Dökümü"
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span>Ekstre</span>
                          </button>


                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenAddModal(c)}
                            title="Kartı Düzenle"
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
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
      </div>

      {/* MODAL: Add / Edit Contact */}
      {isModalOpen && (() => {
        const districtOptions = getDistrictsForProvince(formData.city);
        const neighborhoodOptions = getNeighborhoodsForDistrict(formData.city, formData.district);
        const taxOfficeOptions = getTaxOfficesForProvince(formData.city);

        return (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      {editingContact ? "Cari Kartı Düzenle" : "Yeni Cari Kart Oluştur"}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Resmi vergi dairesi ve il, ilçe, mahalle adres bilgileri ile cari kaydı
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 text-xs">
                {/* SECTION 1: Cari Kimlik Bilgileri */}
                <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 border-b border-slate-200/60 pb-2">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Cari Kimlik & Ticari Unvan</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Cari Tipi *
                      </label>
                      <select
                        value={formData.contactType}
                        onChange={(e) =>
                          setFormData({ ...formData, contactType: e.target.value as ContactType })
                        }
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      >
                        <option value="customer">Müşteri (120 Alıcılar)</option>
                        <option value="vendor">Tedarikçi (320 Satıcılar)</option>
                        <option value="both">Müşteri & Tedarikçi (120 / 320)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Kısa Unvan / İsim *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="ör: TeknoSoft A.Ş."
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cari Hesap Kodu (Otomatik 120 / 320 Formatı)
                    </label>
                    <div className="w-full bg-purple-50/80 border border-purple-200 rounded-xl p-2 text-xs font-mono font-bold text-purple-950 flex items-center justify-between">
                      <span>
                        {formData.contactType === "vendor" ? "320." : "120."}
                        {formData.taxNumber && formData.taxNumber.trim() ? formData.taxNumber.trim() : "0000000000"}
                      </span>
                      <span className="text-[10px] text-purple-700 font-sans font-normal">
                        {formData.contactType === "vendor" ? "320 Satıcılar Hesabı" : "120 Alıcılar Hesabı"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Resmi Ticari Şirket Unvanı
                    </label>
                    <input
                      type="text"
                      placeholder="ör: TeknoSoft Yazılım ve Teknoloji A.Ş."
                      value={formData.companyTitle}
                      onChange={(e) => setFormData({ ...formData, companyTitle: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* SECTION 2: Vergi Dairesi ve Numarası */}
                <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Building className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Vergi Dairesi & Numarası (Türkiye Listesi)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCustomTaxOffice(!isCustomTaxOffice)}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                    >
                      {isCustomTaxOffice ? "Listeden Seç" : "Manuel Gir"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Vergi Dairesi {formData.city ? `(${formData.city})` : ""}
                      </label>
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

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          VKN / TCKN No
                        </label>
                        {formData.taxNumber && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                              formData.taxNumber.length === 10 || formData.taxNumber.length === 11
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {formData.taxNumber.length === 10
                              ? "VKN (10 hane)"
                              : formData.taxNumber.length === 11
                              ? "TCKN (11 hane)"
                              : `${formData.taxNumber.length} Hane`}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="10 (VKN) veya 11 (TCKN) haneli numara"
                        value={formData.taxNumber}
                        onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: Adres Bilgileri */}
                <AddressSelector
                  title="Cari Hesap Adres Bilgileri"
                  address={{
                    country: "Türkiye",
                    city: formData.city || "İstanbul",
                    district: formData.district || "Kadıköy",
                    neighborhood: formData.neighborhood || "Caferağa",
                    street: formData.street || "",
                    buildingNo: formData.buildingNo || "",
                    doorNo: "",
                    postalCode: "",
                    fullAddress: formData.address || "",
                  }}
                  onChange={(updatedDetails) => {
                    setFormData((prev) => ({
                      ...prev,
                      city: updatedDetails.city,
                      district: updatedDetails.district,
                      neighborhood: updatedDetails.neighborhood,
                      street: updatedDetails.street,
                      buildingNo: updatedDetails.buildingNo,
                      address: updatedDetails.fullAddress || prev.address,
                    }));
                  }}
                />

                {/* SECTION 4: İletişim Bilgileri ve Notlar */}
                <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Telefon
                      </label>
                      <input
                        type="text"
                        placeholder="+90 212 000 0000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        E-posta
                      </label>
                      <input
                        type="email"
                        placeholder="muhasebe@firma.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Özel Notlar
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Sözleşme şartları, özel iskonto oranı vb..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingContact ? "Güncelle" : "Cari Hesabı Kaydet"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL: Cari Muavin Defteri / Ekstre Dökümü */}
      {selectedLedgerContact && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Header - Fixed on top */}
            <div className="p-5 border-b border-slate-200 bg-white shrink-0 flex items-start justify-between z-20">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded">
                    Muavin Defteri & Ekstre
                  </span>
                  <span className="text-xs text-slate-500">Cari Hareket Raporu</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  {selectedLedgerContact.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-950 border border-purple-300 shadow-2xs">
                    Hesap No: {getContactAccountCode(selectedLedgerContact)}
                  </span>
                  <span>
                    {selectedLedgerContact.companyTitle} | VKN: {selectedLedgerContact.taxNumber || "-"} ({selectedLedgerContact.taxOffice || "-"})
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportLedgerExcel(selectedLedgerContact)}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Türkçe Karakter Destekli Excel (.xlsx) İndir"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Excel İndir (.xlsx)</span>
                </button>
                <button
                  onClick={() => exportLedgerPDF(selectedLedgerContact)}
                  disabled={isGeneratingPDF}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="PDF Belgesi Olarak İndir"
                >
                  <FileText className="w-4 h-4 text-rose-600" />
                  <span>{isGeneratingPDF ? "Hazırlanıyor..." : "PDF İndir"}</span>
                </button>
                <button
                  onClick={() => handlePrintLedger(selectedLedgerContact)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Cari Ekstre Raporunu Yazdır"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>Yazdır</span>
                </button>
                <button
                  onClick={() => setSelectedLedgerContact(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Printable Content Area */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              <div id="printable-ledger" className="space-y-5 p-4 rounded-xl" style={{ backgroundColor: "#ffffff", color: "#0f172a" }}>
              {/* Company Info Header for PDF/Print/Screen */}
              <div className="border-b-2 pb-4 mb-4" style={{ borderColor: "#0f172a" }}>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-base font-black uppercase tracking-tight" style={{ color: "#0f172a" }}>
                      {companySettings?.companyName || "FİRMA ADI"}
                    </h2>
                    <p className="text-xs font-medium" style={{ color: "#475569" }}>{companySettings?.companyTitle}</p>
                    <p className="text-xs" style={{ color: "#64748b" }}>
                      VKN/TCKN: {companySettings?.taxNumber || "-"} ({companySettings?.taxOffice || "-"}) | Tel: {companySettings?.phone || "-"}
                    </p>
                  </div>
                  <div className="text-right">
                    <h1 className="text-lg font-black uppercase tracking-tight" style={{ color: "#0f172a" }}>
                      CARİ HESAP EKSTRESİ
                    </h1>
                    <p className="text-xs font-semibold" style={{ color: "#64748b" }}>Tarih: {new Date().toLocaleDateString("tr-TR")}</p>
                  </div>
                </div>
              </div>

              {/* Current Balance Summary Box */}
              <div className="rounded-xl p-4 flex flex-wrap items-center justify-between gap-4" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <div>
                <span className="text-[10px] font-bold uppercase block" style={{ color: "#64748b" }}>
                  Cari Telefon / E-posta
                </span>
                <span className="text-xs font-semibold" style={{ color: "#1e293b" }}>
                  {selectedLedgerContact.phone || "-"} | {selectedLedgerContact.email || "-"}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase block" style={{ color: "#64748b" }}>
                  Şehir / Adres
                </span>
                <span className="text-xs font-semibold" style={{ color: "#1e293b" }}>
                  {selectedLedgerContact.address || "-"}, {selectedLedgerContact.city}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold uppercase block" style={{ color: "#64748b" }}>
                  Net Cari Bakiye
                </span>
                <span
                  className="text-lg font-black"
                  style={{
                    color: selectedLedgerContact.balance > 0
                      ? "#059669"
                      : selectedLedgerContact.balance < 0
                      ? "#dc2626"
                      : "#64748b"
                  }}
                >
                  ₺{Math.abs(selectedLedgerContact.balance).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}{" "}
                  <span className="text-xs font-normal" style={{ color: "#64748b" }}>
                    ({selectedLedgerContact.balance > 0 ? "Alacaklıyız" : selectedLedgerContact.balance < 0 ? "Borçluyuz" : "Sıfır"})
                  </span>
                </span>
              </div>
            </div>

            {/* Ledger Table */}
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
              <table className="w-full text-left text-xs" style={{ backgroundColor: "#ffffff" }}>
                <thead>
                  <tr className="font-bold uppercase tracking-wider" style={{ backgroundColor: "#f1f5f9", borderBottom: "1px solid #cbd5e1", color: "#475569" }}>
                    <th className="py-2.5 px-3">Tarih</th>
                    <th className="py-2.5 px-3">Belge Tipi</th>
                    <th className="py-2.5 px-3">Belge No</th>
                    <th className="py-2.5 px-3">Açıklama</th>
                    <th className="py-2.5 px-3 text-right">Borç (₺)</th>
                    <th className="py-2.5 px-3 text-right">Alacak (₺)</th>
                    <th className="py-2.5 px-3 text-right">Bakiye (₺)</th>
                  </tr>
                </thead>
                <tbody>
                  {getLedgerEntries(selectedLedgerContact.id).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6" style={{ color: "#94a3b8" }}>
                        Bu cari hesaba ait henüz fatura veya ödeme hareketi kayıtlı değil.
                      </td>
                    </tr>
                  ) : (
                    getLedgerEntries(selectedLedgerContact.id).map((entry) => (
                      <tr key={entry.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td className="py-2.5 px-3 font-medium whitespace-nowrap" style={{ color: "#64748b" }}>
                          {entry.date}
                        </td>
                        <td className="py-2.5 px-3 font-bold">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold inline-block"
                            style={{
                              backgroundColor:
                                entry.documentType === "Fatura"
                                  ? "#eff6ff"
                                  : entry.documentType === "Tahsilat"
                                  ? "#ecfdf5"
                                  : "#fffbeb",
                              color:
                                entry.documentType === "Fatura"
                                  ? "#1d4ed8"
                                  : entry.documentType === "Tahsilat"
                                  ? "#047857"
                                  : "#b45309",
                              border:
                                entry.documentType === "Fatura"
                                  ? "1px solid #bfdbfe"
                                  : entry.documentType === "Tahsilat"
                                  ? "1px solid #a7f3d0"
                                  : "1px solid #fde68a",
                            }}
                          >
                            {entry.documentType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold" style={{ color: "#334155" }}>
                          {entry.documentNo}
                        </td>
                        <td className="py-2.5 px-3 font-medium" style={{ color: "#0f172a" }}>
                          {entry.description}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold" style={{ color: "#0f172a" }}>
                          {entry.debit > 0
                            ? `₺${entry.debit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`
                            : "-"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold" style={{ color: "#0f172a" }}>
                          {entry.credit > 0
                            ? `₺${entry.credit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`
                            : "-"}
                        </td>
                        <td
                          className="py-2.5 px-3 text-right font-black"
                          style={{
                            color:
                              entry.runningBalance > 0
                                ? "#059669"
                                : entry.runningBalance < 0
                                ? "#dc2626"
                                : "#64748b"
                          }}
                        >
                          ₺{Math.abs(entry.runningBalance).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            </div>
            </div>

            <div className="p-4 px-6 border-t border-slate-200 bg-slate-50/80 shrink-0 flex items-center justify-between z-20">
              <span className="text-xs text-slate-500 font-medium">
                Toplama esas kayıt sayısı: <strong className="text-slate-800">{getLedgerEntries(selectedLedgerContact.id).length}</strong>
              </span>
              <button
                onClick={() => setSelectedLedgerContact(null)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2 rounded-xl cursor-pointer transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAHSİLAT YAP / ÖDEME YAP MODAL */}
      {actionModalType && selectedActionContact && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
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
                  <h3 className="text-base font-extrabold text-slate-900">
                    {actionModalType === "collection"
                      ? "Müşteriden / Cariden Tahsilat Al"
                      : "Cariye Ödeme Yap"}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
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
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">İşlem Yapılan Cari</span>
                <div className="text-sm font-extrabold text-slate-900">{selectedActionContact.name}</div>
                {selectedActionContact.companyTitle && (
                  <div className="text-xs text-slate-500 font-medium">{selectedActionContact.companyTitle}</div>
                )}
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Güncel Bakiye</span>
                <div
                  className={`text-sm font-black ${
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

            <form onSubmit={handleSaveAction} className="space-y-4 text-xs">
              {/* Finans Yönetimi Alt Modül Tab Seçimi (Kasa, Banka, Kredi Kartı, Çek, Senet) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Finans Modülü / Ödeme Yöntemi Seçin *
                </label>
                <div className="grid grid-cols-5 gap-1.5 p-1.5 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setPayMethod("kasa");
                      const acc = accounts.find((a) => a.type === "cash") || accounts[0];
                      if (acc) setPayAccountId(acc.id);
                    }}
                    className={`py-2 px-1 rounded-lg font-bold text-[11px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
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
                    className={`py-2 px-1 rounded-lg font-bold text-[11px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
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
                    className={`py-2 px-1 rounded-lg font-bold text-[11px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
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
                    className={`py-2 px-1 rounded-lg font-bold text-[11px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
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
                    className={`py-2 px-1 rounded-lg font-bold text-[11px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
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
                    className={`py-2 px-1 rounded-lg font-bold text-[11px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      payMethod === "virman"
                        ? "bg-teal-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    <span>Virman (Cari)</span>
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 cursor-pointer"
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 cursor-pointer"
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

                  <div className="grid grid-cols-2 gap-3">
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-black text-base text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">İşlem Tarihi *</label>
                      <input
                        type="date"
                        required
                        value={payDate}
                        onChange={(e) => setPayDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Belge / Dekont / Slip No</label>
                      <input
                        type="text"
                        value={payDocNo}
                        onChange={(e) => setPayDocNo(e.target.value)}
                        placeholder="Örn: SLIP-1290"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Açıklama / Not</label>
                      <input
                        type="text"
                        value={payDesc}
                        onChange={(e) => setPayDesc(e.target.value)}
                        placeholder="Örn: Fatura borcuna mahsuben"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900"
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

                  <div className="grid grid-cols-2 gap-3">
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-black text-base text-indigo-900"
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Banka Adı *</label>
                      <input
                        type="text"
                        required
                        value={docBankName}
                        onChange={(e) => setDocBankName(e.target.value)}
                        placeholder="Örn: Garanti BBVA"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Keşideci / Borçlu Adı *</label>
                      <input
                        type="text"
                        required
                        value={docDebtorName}
                        onChange={(e) => setDocDebtorName(e.target.value)}
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
                        value={docDueDate}
                        onChange={(e) => setDocDueDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Alınış / Veriliş Tarihi *</label>
                      <input
                        type="date"
                        required
                        value={payDate}
                        onChange={(e) => setPayDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900"
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

                  <div className="grid grid-cols-2 gap-3">
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-black text-base text-purple-900"
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Borçlu Adı / Soyadı *</label>
                      <input
                        type="text"
                        required
                        value={docDebtorName}
                        onChange={(e) => setDocDebtorName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Vade Tarihi *</label>
                      <input
                        type="date"
                        required
                        value={docDueDate}
                        onChange={(e) => setDocDueDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">İşlem Tarihi *</label>
                      <input
                        type="date"
                        required
                        value={payDate}
                        onChange={(e) => setPayDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Açıklama / Not</label>
                      <input
                        type="text"
                        value={payDesc}
                        onChange={(e) => setPayDesc(e.target.value)}
                        placeholder="Örn: Sözleşmeye istinaden alınan senet"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Form Fields: CARİLER ARASI VİRMAN */}
              {payMethod === "virman" && (
                <div className="space-y-3">
                  <div className="p-3 bg-teal-50 border border-teal-200 text-teal-900 rounded-xl font-medium text-xs flex items-center gap-2">
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 cursor-pointer text-xs"
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

                  <div className="grid grid-cols-2 gap-3">
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-black text-base text-teal-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">İşlem Tarihi *</label>
                      <input
                        type="date"
                        required
                        value={payDate}
                        onChange={(e) => setPayDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Virman Dekont / Fiş No</label>
                      <input
                        type="text"
                        value={payDocNo}
                        onChange={(e) => setPayDocNo(e.target.value)}
                        placeholder="Örn: VRM-2026-001"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Açıklama / Not</label>
                      <input
                        type="text"
                        value={payDesc}
                        onChange={(e) => setPayDesc(e.target.value)}
                        placeholder="Örn: Cariler arası borç virman transferi"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setActionModalType(null);
                    setSelectedActionContact(null);
                  }}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 cursor-pointer rounded-xl font-semibold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={!payAmount || parseFloat(payAmount) <= 0}
                  className={`px-5 py-2 font-bold text-white rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md ${
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
