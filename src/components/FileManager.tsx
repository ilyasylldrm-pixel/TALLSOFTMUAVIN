import React, { useState, useEffect } from "react";
import {
  UploadCloud,
  FileText,
  File,
  Image,
  FileSpreadsheet,
  FileCode,
  Code2,
  Trash2,
  Download,
  Eye,
  Search,
  Lock,
  ShieldCheck,
  Calendar,
  HardDrive,
  FolderOpen,
  Filter,
  CheckCircle2,
  X,
  FileCheck,
  Tag,
  Info,
  Sparkles,
  Receipt,
  CreditCard,
  Building2,
  DollarSign,
  Send,
  RefreshCw,
  Wallet,
  ArrowRight,
  Landmark,
  Check,
  Plus
} from "lucide-react";
import { UserProfile } from "./AuthModal";
import {
  saveUserFile,
  getUserFiles,
  deleteUserFile,
  uploadFileToStorage,
  UserFileMetadata,
  ExtractedDocumentData
} from "../lib/firebase";
import { Contact, Account, Invoice, Transaction, EXPENSE_CATEGORIES, InvoiceTaxItem, TaxType } from "../types";
import { parseXmlInvoice } from "../utils/xmlInvoiceParser";

interface FileManagerProps {
  currentUser: UserProfile;
  contacts?: Contact[];
  accounts?: Account[];
  onAddInvoice?: (inv: Invoice) => void;
  onAddTransaction?: (tx: Transaction) => void;
  onSelectTab?: (tab: string) => void;
}

const FILE_CATEGORIES = [
  "Tümü",
  "Fatura & Fişler",
  "Sözleşmeler & Protokoller",
  "Vergi Beyannameleri",
  "Banka & Dekontlar",
  "İnsan Kaynakları",
  "Genel Belgeler"
];

const PAYMENT_METHODS: Array<NonNullable<ExtractedDocumentData["paymentMethod"]>> = [
  "Nakit",
  "Kredi Kartı",
  "Banka Transferi / EFT",
  "Çek",
  "Senet",
  "Açık Hesap / Vadeli"
];

export const FileManager: React.FC<FileManagerProps> = ({
  currentUser,
  contacts = [],
  accounts = [],
  onAddInvoice,
  onAddTransaction,
  onSelectTab
}) => {
  const [files, setFiles] = useState<UserFileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tümü");
  const [previewFile, setPreviewFile] = useState<UserFileMetadata | null>(null);

  // Upload Form State
  const [category, setCategory] = useState("Fatura & Fişler");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64Preview, setFileBase64Preview] = useState<string | null>(null);

  // AI Extracted Data Form State
  const [extractedData, setExtractedData] = useState<ExtractedDocumentData>({
    taxNumber: "",
    companyTitle: "",
    invoiceNumber: "",
    issueDate: new Date().toISOString().split("T")[0],
    docType: "Fiş",
    subtotal: 0,
    vatRate: 20,
    vatAmount: 0,
    grandTotal: 0,
    paymentMethod: "Nakit",
    expenseCategory: "Yemek ve ulaşım",
    notes: ""
  });

  const [autoCreateInvoice, setAutoCreateInvoice] = useState(true);
  const [transferSuccessMessage, setTransferSuccessMessage] = useState<string | null>(null);

  // Load user files from Firestore
  useEffect(() => {
    loadFiles();
  }, [currentUser.id]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const userFiles = await getUserFiles(currentUser.id);
      setFiles(userFiles);
    } catch (err) {
      console.error("Dosyalar yüklenirken hata oluştu:", err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger OCR analysis when a receipt/invoice file is chosen
  const triggerAiOcrAnalysis = async (file: File, base64: string, textContent?: string) => {
    setOcrLoading(true);
    try {
      const res = await fetch("/api/gemini/parse-invoice-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileData: base64,
          fileName: file.name,
          fileType: file.type || (file.name.endsWith(".xml") ? "application/xml" : undefined),
          textContent: textContent || undefined
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          const subtotalVal = Number(d.subtotal) || 0;
          const vatRateVal = Number(d.vatRate) || 20;
          const vatAmountVal = Number(d.vatAmount) || (subtotalVal * vatRateVal) / 100;
          const grandTotalVal = Number(d.grandTotal) || (subtotalVal + vatAmountVal);

          let detectedPayment: ExtractedDocumentData["paymentMethod"] = "Nakit";
          if (d.suggestedPaymentMethod && PAYMENT_METHODS.includes(d.suggestedPaymentMethod)) {
            detectedPayment = d.suggestedPaymentMethod;
          }

          setExtractedData({
            taxNumber: d.taxNumber ? String(d.taxNumber).replace(/\D/g, "") : "",
            companyTitle: d.companyTitle || "",
            invoiceNumber: d.invoiceNumber || `FİŞ-${Date.now().toString().slice(-4)}`,
            issueDate: d.issueDate || new Date().toISOString().split("T")[0],
            docType: d.docType === "Mal Alımı" ? "Mal Alımı" : d.docType === "Fatura" ? "Fatura" : "Fiş",
            subtotal: Number(subtotalVal.toFixed(2)),
            vatRate: vatRateVal,
            vatAmount: Number(vatAmountVal.toFixed(2)),
            taxItems: Array.isArray(d.taxItems) ? d.taxItems : undefined,
            withholdingAmount: d.withholdingAmount ? Number(d.withholdingAmount) : undefined,
            otvAmount: d.otvAmount ? Number(d.otvAmount) : undefined,
            oivAmount: d.oivAmount ? Number(d.oivAmount) : undefined,
            accommodationTaxAmount: d.accommodationTaxAmount ? Number(d.accommodationTaxAmount) : undefined,
            stampTaxAmount: d.stampTaxAmount ? Number(d.stampTaxAmount) : undefined,
            withholdingTaxAmount: d.withholdingTaxAmount ? Number(d.withholdingTaxAmount) : undefined,
            grandTotal: Number(grandTotalVal.toFixed(2)),
            paymentMethod: detectedPayment,
            expenseCategory: d.expenseCategory || (d.docType === "Mal Alımı" ? "Mal Alımı" : "Mal Alımı"),
            notes: d.notes || ""
          });

          if (!description) {
            setDescription(`${d.companyTitle || "Fiş/Fatura"} - ${d.invoiceNumber || file.name}`);
          }
          return;
        }
      }

      // Fallback if AI endpoint had an issue
      fallbackParsing(file);
    } catch (err) {
      console.warn("AI OCR servisi çağrılamadı, yerel ayrıştırma yapılıyor:", err);
      fallbackParsing(file);
    } finally {
      setOcrLoading(false);
    }
  };

  const fallbackParsing = (file: File) => {
    const cleanName = file.name.replace(/\.[^/.]+$/, "");
    const today = new Date().toISOString().split("T")[0];
    const dummyNum = `FİŞ-${Math.floor(1000 + Math.random() * 9000)}`;

    setExtractedData((prev) => ({
      ...prev,
      companyTitle: prev.companyTitle || cleanName,
      invoiceNumber: prev.invoiceNumber || dummyNum,
      issueDate: prev.issueDate || today,
      subtotal: prev.subtotal || 1000,
      vatRate: prev.vatRate || 20,
      vatAmount: prev.vatAmount || 200,
      grandTotal: prev.grandTotal || 1200,
      paymentMethod: prev.paymentMethod || "Nakit"
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 8 * 1024 * 1024) {
        alert("Seçilen dosya çok büyük! Lütfen 8 MB'tan küçük bir dosya yükleyin.");
        e.target.value = "";
        setSelectedFile(null);
        setFileBase64Preview(null);
        return;
      }
      setSelectedFile(file);

      const isXml = file.name.toLowerCase().endsWith(".xml") || file.type.includes("xml");

      if (isXml) {
        // Parse XML directly (UBL-TR / e-Fatura / e-Arşiv / Fiş XML)
        const textReader = new FileReader();
        textReader.onload = () => {
          const xmlText = textReader.result as string;
          const parsed = parseXmlInvoice(xmlText, file.name);
          if (parsed.success && parsed.data) {
            setCategory("Fatura & Fişler");
            setExtractedData(parsed.data);
            if (!description) {
              setDescription(`${parsed.data.companyTitle || "e-Fatura"} - ${parsed.data.invoiceNumber || file.name}`);
            }
          } else {
            // If local XML parser failed, try server OCR with XML text content
            triggerAiOcrAnalysis(file, "", xmlText);
          }
        };
        textReader.readAsText(file);

        // Also read as base64/data URL for file storage
        const base64Reader = new FileReader();
        base64Reader.onload = () => {
          setFileBase64Preview(base64Reader.result as string);
        };
        base64Reader.readAsDataURL(file);
      } else {
        // Read as base64 for preview & AI analysis
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          setFileBase64Preview(base64);
          if (category === "Fatura & Fişler" || file.type.startsWith("image/") || file.type.includes("pdf")) {
            triggerAiOcrAnalysis(file, base64);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Recalculate totals when Matrah or VAT rate changes
  const handleSubtotalChange = (val: number) => {
    const vatRate = extractedData.vatRate || 20;
    const vatAmount = (val * vatRate) / 100;
    const grandTotal = val + vatAmount;
    setExtractedData((prev) => ({
      ...prev,
      subtotal: val,
      vatAmount: Number(vatAmount.toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2))
    }));
  };

  const handleVatRateChange = (rate: number) => {
    const subtotal = extractedData.subtotal || 0;
    const vatAmount = (subtotal * rate) / 100;
    const grandTotal = subtotal + vatAmount;
    setExtractedData((prev) => ({
      ...prev,
      vatRate: rate,
      vatAmount: Number(vatAmount.toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2))
    }));
  };

  const handleGrandTotalChange = (total: number) => {
    const vatRate = extractedData.vatRate || 20;
    const subtotal = total / (1 + vatRate / 100);
    const vatAmount = total - subtotal;
    setExtractedData((prev) => ({
      ...prev,
      grandTotal: total,
      subtotal: Number(subtotal.toFixed(2)),
      vatAmount: Number(vatAmount.toFixed(2))
    }));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    if (selectedFile.size > 8 * 1024 * 1024) {
      alert("Seçilen dosya çok büyük! Lütfen 8 MB'tan küçük bir dosya seçin.");
      return;
    }

    setUploading(true);

    try {
      let fileUrl = "";
      let storagePath = "";
      let base64Data: string | undefined = fileBase64Preview || undefined;

      // 1. Try uploading to Firebase Storage
      try {
        const uploadResult = await uploadFileToStorage(currentUser.id, selectedFile);
        fileUrl = uploadResult.fileUrl;
        storagePath = uploadResult.storagePath;
      } catch (storageErr) {
        console.warn("Firebase Storage upload fallback:", storageErr);

        if (selectedFile.size > 700 * 1024) {
          throw new Error("Bulut depolama alanı aktif değilken veritabanına 700 KB'tan büyük dosya doğrudan kaydedilemez. Lütfen dosya boyutunu küçültün.");
        }

        if (!base64Data) {
          base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(selectedFile);
          });
        }
      }

      // Check if extractedData has content for Fatura & Fişler
      const isInvoiceOrReceipt = category === "Fatura & Fişler";
      const finalExtractedData: ExtractedDocumentData | undefined = isInvoiceOrReceipt
        ? {
            ...extractedData,
            isTransferredToAccounting: autoCreateInvoice
          }
        : undefined;

      // 2. Save metadata to Firestore user_files collection
      const fileData: Omit<UserFileMetadata, "id"> = {
        userId: currentUser.id,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type || "application/octet-stream",
        uploadDate: new Date().toISOString(),
        category,
        description: description || `${selectedFile.name} evrak yüklemesi`,
        ...(fileUrl ? { fileUrl } : {}),
        ...(storagePath ? { storagePath } : {}),
        ...(base64Data ? { fileData: base64Data } : {}),
        ...(finalExtractedData ? { extractedData: finalExtractedData } : {})
      };

      const newId = await saveUserFile(fileData);

      const newFileEntry: UserFileMetadata = {
        id: newId,
        ...fileData
      };

      setFiles((prev) => [newFileEntry, ...prev]);

      // 3. If user opted to automatically create invoice/receipt in accounting
      if (isInvoiceOrReceipt && autoCreateInvoice && onAddInvoice) {
        createInvoiceFromExtractedData(finalExtractedData!, selectedFile.name, newId);
      }

      setSelectedFile(null);
      setFileBase64Preview(null);
      setDescription("");
      setTransferSuccessMessage("✅ Fiş/Fatura başarıyla buluta yüklendi ve bilgileri kaydedildi!");
      setTimeout(() => setTransferSuccessMessage(null), 5000);
    } catch (err: unknown) {
      console.error("Dosya yükleme hatası:", err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("payload") || msg.includes("exceeds") || msg.includes("11534336")) {
        alert("❌ Dosya Yükleme Hatası: Seçilen dosya boyutu sunucu yükleme sınırını (10 MB) aşıyor. Lütfen daha küçük bir dosya seçin.");
      } else {
        alert("❌ Dosya yüklenirken bir hata oluştu:\n" + msg);
      }
    } finally {
      setUploading(false);
    }
  };

  const createInvoiceFromExtractedData = (
    data: ExtractedDocumentData,
    fileName: string,
    fileId: string
  ) => {
    if (!onAddInvoice) return;

    // Match or create vendor contact
    const vendorName = data.companyTitle || "Gider Tedarikçisi / Satıcı";
    const existingContact = contacts.find(
      (c) =>
        (data.taxNumber && c.taxNumber === data.taxNumber) ||
        c.name.toLowerCase() === vendorName.toLowerCase()
    );

    const contactId = existingContact ? existingContact.id : `cont_${Date.now()}`;
    const subtotal = data.subtotal || 0;
    const vatAmount = data.vatAmount || 0;
    const grandTotal = data.grandTotal || subtotal + vatAmount;
    const vatRate = data.vatRate || 20;
    const isGoodsPurchase = data.docType === "Mal Alımı" || data.expenseCategory === "Mal Alımı";

    const newInvoice: Invoice = {
      id: `inv_file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      invoiceNumber: data.invoiceNumber || `${isGoodsPurchase ? "MAL-" : "FİŞ-"}${Date.now().toString().slice(-5)}`,
      type: "purchase", // Alış / Gider Faturası
      docKind: data.docType === "Fiş" ? "receipt" : "invoice",
      contactId,
      contactName: vendorName,
      taxNumber: data.taxNumber || "",
      issueDate: data.issueDate || new Date().toISOString().split("T")[0],
      dueDate: data.issueDate || new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
      status: "paid", // Ödendi olarak işaretlenir
      subtotal,
      totalVat: vatAmount,
      taxItems: data.taxItems,
      totalWithholding: data.withholdingAmount,
      totalOtv: data.otvAmount,
      totalOiv: data.oivAmount,
      totalAccommodationTax: data.accommodationTaxAmount,
      totalStampTax: data.stampTaxAmount,
      totalStopaj: data.withholdingTaxAmount,
      grandTotal,
      paidAmount: grandTotal,
      remainingAmount: 0,
      currency: "TRY",
      expenseCategory: data.expenseCategory || (isGoodsPurchase ? "Mal Alımı" : "Yemek ve ulaşım"),
      notes: `Bulut Dosya Deposundan AI/XML ile yüklendi (${fileName}). Tür: ${data.docType || "Fatura"}. Ödeme Yöntemi: ${data.paymentMethod || "Nakit"}.`,
      items: [
        {
          id: `item_${Date.now()}`,
          description: `${data.companyTitle || "Satıcı"} - ${data.expenseCategory || (isGoodsPurchase ? "Mal Alımı" : "Gider")}`,
          expenseCategory: data.expenseCategory || (isGoodsPurchase ? "Mal Alımı" : "Yemek ve ulaşım"),
          quantity: 1,
          unit: "Adet",
          unitPrice: subtotal,
          vatRate: vatRate,
          totalWithoutVat: subtotal,
          vatAmount: vatAmount,
          totalWithVat: grandTotal
        }
      ]
    };

    onAddInvoice(newInvoice);

    // If onAddTransaction exists, record the payment transaction automatically
    if (onAddTransaction) {
      const defaultAccount = accounts[0] || { id: "acc_cash", name: "Merkez TL Kasası" };
      const tx: Transaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        date: data.issueDate || new Date().toISOString().split("T")[0],
        type: "expense",
        amount: grandTotal,
        currency: "TRY",
        accountId: defaultAccount.id,
        accountName: defaultAccount.name,
        contactId,
        contactName: vendorName,
        invoiceId: newInvoice.id,
        invoiceNumber: newInvoice.invoiceNumber,
        category: data.expenseCategory || "Gider",
        description: `${data.companyTitle || "Satıcı"} fiş/fatura ödemesi (${data.paymentMethod || "Nakit"})`,
        documentNo: data.invoiceNumber
      };
      onAddTransaction(tx);
    }
  };

  const handleTransferExistingFileToInvoice = (file: UserFileMetadata) => {
    if (!file.extractedData || !onAddInvoice) return;
    createInvoiceFromExtractedData(file.extractedData, file.fileName, file.id);

    // Update local state to show transferred
    setFiles((prev) =>
      prev.map((f) =>
        f.id === file.id
          ? {
              ...f,
              extractedData: {
                ...f.extractedData!,
                isTransferredToAccounting: true
              }
            }
          : f
      )
    );

    setTransferSuccessMessage(`✅ "${file.fileName}" faturası başarıyla ön muhasebeye aktarıldı!`);
    setTimeout(() => setTransferSuccessMessage(null), 4000);
  };

  const handleDelete = async (file: UserFileMetadata) => {
    if (!window.confirm(`"${file.fileName}" dosyasını ve tüm kayıtlarını silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      await deleteUserFile(file.id, file.storagePath);
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      if (previewFile?.id === file.id) {
        setPreviewFile(null);
      }
    } catch (err) {
      console.error("Dosya silme hatası:", err);
      alert("Dosya silinemedi. Güvenlik yetkilerini kontrol edin.");
    }
  };

  // Filtered Files
  const filteredFiles = files.filter((f) => {
    const matchesCategory =
      selectedCategory === "Tümü" || f.category === selectedCategory;
    const matchesSearch =
      f.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.extractedData?.companyTitle &&
        f.extractedData.companyTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.extractedData?.taxNumber &&
        f.extractedData.taxNumber.includes(searchTerm)) ||
      (f.extractedData?.invoiceNumber &&
        f.extractedData.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (type: string, fileName?: string) => {
    const isXml = type.includes("xml") || (fileName && fileName.toLowerCase().endsWith(".xml"));
    if (isXml) return <FileCode className="w-5 h-5 text-amber-600" />;
    if (type.startsWith("image/")) return <Image className="w-5 h-5 text-purple-600" />;
    if (type.includes("pdf")) return <FileText className="w-5 h-5 text-rose-600" />;
    if (type.includes("sheet") || type.includes("excel") || type.includes("csv"))
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    return <File className="w-5 h-5 text-indigo-600" />;
  };

  const getPaymentBadge = (method?: string) => {
    switch (method) {
      case "Nakit":
        return { bg: "bg-emerald-50 text-emerald-800 border-emerald-300", icon: Wallet };
      case "Kredi Kartı":
        return { bg: "bg-indigo-50 text-indigo-800 border-indigo-300", icon: CreditCard };
      case "Banka Transferi / EFT":
        return { bg: "bg-blue-50 text-blue-800 border-blue-300", icon: Landmark };
      case "Çek":
        return { bg: "bg-amber-50 text-amber-800 border-amber-300", icon: FileText };
      case "Senet":
        return { bg: "bg-purple-50 text-purple-800 border-purple-300", icon: FileCheck };
      default:
        return { bg: "bg-slate-100 text-slate-800 border-slate-300", icon: DollarSign };
    }
  };

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      
      {/* Success Notification */}
      {transferSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 p-4 rounded-2xl flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{transferSuccessMessage}</span>
          </div>
          {onSelectTab && (
            <button
              onClick={() => onSelectTab("invoices_purchase")}
              className="text-xs font-extrabold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-xl border border-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Gider Faturalarına Git</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Top Header Controls (Lila Bal Peteği & Geometrik Desen - Cari Hesaplar Tasarımı) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-50 via-fuchsia-50/40 to-slate-50/80 rounded-2xl p-5 border border-purple-200/60 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
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
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-purple-600/10 text-purple-900 border border-purple-300/80 font-extrabold text-[10px] uppercase px-2.5 py-0.5 rounded-md flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-700" />
              Yapay Zeka (AI OCR) Fiş & Fatura Okuyucu
            </span>
            <span className="bg-emerald-500/10 text-emerald-800 border border-emerald-300/60 font-extrabold text-[10px] uppercase px-2.5 py-0.5 rounded-md flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Firestore Güvenli Depolama
            </span>
          </div>
          <h2 className="text-lg font-extrabold text-slate-950 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-purple-700" />
            <span>Bulut Dosya Deposu & Fiş/Fatura Ayrıştırıcı</span>
          </h2>
          <p className="text-xs font-semibold text-purple-950/90 mt-1 leading-relaxed">
            Yüklediğiniz fiş veya faturalardan Vergi No, Ünvan, Fiş/Fatura No, Matrah, KDV ve Toplam tutarlar otomatik okunur; ödeme yönteminizi seçerek tek tıkla muhasebeleştirebilirsiniz.
          </p>
        </div>

        {/* User Auth ID & Security Card */}
        <div className="relative z-10 bg-white/80 backdrop-blur-md border border-purple-200/80 p-3 rounded-xl flex flex-col gap-1 shrink-0 max-w-xs shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-purple-950">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kullanıcı Güvenlik Kuralı</span>
          </div>
          <div className="text-[10px] font-mono bg-purple-50 text-purple-900 px-2 py-0.5 rounded border border-purple-200/60 truncate">
            UID: {currentUser.id}
          </div>
          <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Kişiselleştirilmiş güvenli evrak klasörü</span>
          </div>
        </div>
      </div>

      {/* Main Layout: Upload Box & File List Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* UPLOAD FORM (5 cols on lg) */}
        <div className="lg:col-span-5 bg-slate-50/60 p-4 sm:p-5 rounded-2xl border border-purple-200/60 shadow-2xs space-y-4 h-fit">
          <div className="flex items-center justify-between pb-2.5 border-b border-purple-200/50">
            <h2 className="text-xs font-extrabold text-purple-950 flex items-center gap-2 uppercase tracking-wider">
              <UploadCloud className="w-4 h-4 text-purple-700" />
              <span>Yeni Evrak Yükle & OCR Tara</span>
            </h2>
            <span className="text-[10px] font-bold text-purple-800 bg-purple-100/80 border border-purple-200 px-2 py-0.5 rounded-md">
              AI Otomatik Ayrıştırma
            </span>
          </div>

          <form onSubmit={handleUpload} className="space-y-4">
            {/* File Drop Area */}
            <div className="relative border-2 border-dashed border-purple-300/80 hover:border-purple-600 bg-white hover:bg-purple-50/50 p-4 sm:p-5 rounded-xl text-center transition-all cursor-pointer group shadow-2xs">
              <input
                type="file"
                required
                accept="image/*,.pdf,.xml,.xlsx,.xls,.doc,.docx,.csv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-11 h-11 rounded-xl bg-purple-100 border border-purple-200/80 text-purple-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                  <UploadCloud className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-slate-900 block group-hover:text-purple-950">
                    {selectedFile ? selectedFile.name : "Fiş, Fatura veya XML Belgesi Seçin ya da Sürükleyin"}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                    {selectedFile ? formatBytes(selectedFile.size) : "e-Fatura / e-Arşiv XML, PDF, JPEG, PNG vb. (Max 8MB)"}
                  </span>
                </div>
              </div>
            </div>

            {/* Category Select */}
            <div>
              <label className="block text-xs font-bold text-purple-950 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-purple-600" />
                <span>Evrak Kategori Türü</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white border border-purple-200/80 focus:border-purple-400 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-2xs transition-all"
              >
                {FILE_CATEGORIES.filter((c) => c !== "Tümü").map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* OCR Progress Indicator */}
            {ocrLoading && (
              <div className="p-3 bg-purple-50 border border-purple-300 rounded-xl flex items-center gap-3 animate-pulse">
                <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin shrink-0" />
                <div className="text-xs text-purple-950 font-bold">
                  <p>Yapay Zeka (Gemini OCR) Fiş / Faturayı Okuyor...</p>
                  <p className="text-[10px] text-purple-700 font-normal">
                    Vergi no, ünvan, fatura no, matrah ve KDV ayrıştırılıyor
                  </p>
                </div>
              </div>
            )}

            {/* AI EXTRACTED DATA PANEL (Shows if category is Fatura & Fişler or file chosen) */}
            {(category === "Fatura & Fişler" || selectedFile) && (
              <div className="bg-white p-3.5 rounded-xl border border-purple-300/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-purple-100">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-purple-950">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Okunan Belge Bilgileri (AI OCR)</span>
                  </div>
                  {selectedFile && fileBase64Preview && (
                    <button
                      type="button"
                      onClick={() => triggerAiOcrAnalysis(selectedFile, fileBase64Preview)}
                      disabled={ocrLoading}
                      className="text-[10px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200 transition-colors cursor-pointer"
                      title="Yeniden AI ile Tara"
                    >
                      <RefreshCw className={`w-3 h-3 ${ocrLoading ? "animate-spin" : ""}`} />
                      <span>Yeniden Oku</span>
                    </button>
                  )}
                </div>

                {/* Satıcı Ünvanı & Vergi Numarası */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Firma / Satıcı Ünvanı
                    </label>
                    <div className="relative">
                      <Building2 className="w-3.5 h-3.5 text-purple-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Örn: Petrol Ofisi A.Ş."
                        value={extractedData.companyTitle || ""}
                        onChange={(e) =>
                          setExtractedData({ ...extractedData, companyTitle: e.target.value })
                        }
                        className="w-full bg-slate-50 focus:bg-white border border-slate-300 focus:border-purple-400 rounded-lg pl-8 pr-2 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Vergi No (VKN / TCKN)
                    </label>
                    <div className="relative">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        maxLength={11}
                        placeholder="10 veya 11 hane"
                        value={extractedData.taxNumber || ""}
                        onChange={(e) =>
                          setExtractedData({
                            ...extractedData,
                            taxNumber: e.target.value.replace(/\D/g, "")
                          })
                        }
                        className="w-full bg-slate-50 focus:bg-white border border-slate-300 focus:border-purple-400 rounded-lg pl-8 pr-2 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                  </div>
                </div>

                {/* İşlem / Belge Türü Seçimi (Mal Alımı, Gider Faturası, Masraf Fişi) */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    İşlem / Belge Türü Seçimi
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setExtractedData({
                          ...extractedData,
                          docType: "Mal Alımı",
                          expenseCategory: "Mal Alımı"
                        })
                      }
                      className={`p-1.5 rounded-lg text-center border transition-all text-xs font-black cursor-pointer flex items-center justify-center gap-1 ${
                        extractedData.docType === "Mal Alımı" || extractedData.expenseCategory === "Mal Alımı"
                          ? "bg-purple-700 text-white border-purple-800 shadow-xs ring-2 ring-purple-400/40"
                          : "bg-purple-50/70 hover:bg-purple-100 text-purple-950 border-purple-200"
                      }`}
                    >
                      <span>📦 Mal Alımı (Stok)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setExtractedData({
                          ...extractedData,
                          docType: "Fatura",
                          expenseCategory: extractedData.expenseCategory === "Mal Alımı" ? "Yemek ve ulaşım" : extractedData.expenseCategory
                        })
                      }
                      className={`p-1.5 rounded-lg text-center border transition-all text-xs font-bold cursor-pointer flex items-center justify-center gap-1 ${
                        extractedData.docType === "Fatura" && extractedData.expenseCategory !== "Mal Alımı"
                          ? "bg-purple-700 text-white border-purple-800 shadow-xs ring-2 ring-purple-400/40"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                      }`}
                    >
                      <span>🏢 Gider Faturası</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setExtractedData({
                          ...extractedData,
                          docType: "Fiş",
                          expenseCategory: extractedData.expenseCategory === "Mal Alımı" ? "Yemek ve ulaşım" : extractedData.expenseCategory
                        })
                      }
                      className={`p-1.5 rounded-lg text-center border transition-all text-xs font-bold cursor-pointer flex items-center justify-center gap-1 ${
                        extractedData.docType === "Fiş" && extractedData.expenseCategory !== "Mal Alımı"
                          ? "bg-purple-700 text-white border-purple-800 shadow-xs ring-2 ring-purple-400/40"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                      }`}
                    >
                      <span>🧾 Masraf Fişi</span>
                    </button>
                  </div>
                </div>

                {/* Belge Türü & Fiş/Fatura Numarası & Tarih */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Belge Türü
                    </label>
                    <select
                      value={extractedData.docType || "Fiş"}
                      onChange={(e) => {
                        const val = e.target.value as "Mal Alımı" | "Fatura" | "Fiş";
                        setExtractedData({
                          ...extractedData,
                          docType: val,
                          expenseCategory: val === "Mal Alımı" ? "Mal Alımı" : extractedData.expenseCategory
                        });
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs font-bold text-slate-900"
                    >
                      <option value="Mal Alımı">Mal Alımı Faturası (Ticari Mal)</option>
                      <option value="Fatura">Gider Faturası (e-Arşiv/Hizmet)</option>
                      <option value="Fiş">Fiş (ÖKC/Yazar Kasa)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Fiş / Fatura No
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: FİŞ-0042 / GIB2026..."
                      value={extractedData.invoiceNumber || ""}
                      onChange={(e) =>
                        setExtractedData({ ...extractedData, invoiceNumber: e.target.value })
                      }
                      className="w-full bg-slate-50 focus:bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Belge Tarihi
                    </label>
                    <input
                      type="date"
                      value={extractedData.issueDate || new Date().toISOString().split("T")[0]}
                      onChange={(e) =>
                        setExtractedData({ ...extractedData, issueDate: e.target.value })
                      }
                      className="w-full bg-slate-50 focus:bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-semibold text-slate-900"
                    />
                  </div>
                </div>

                {/* Matrah, KDV Oranı, KDV Tutarı, Genel Toplam */}
                <div className="bg-purple-50/50 p-2.5 rounded-xl border border-purple-200/80 space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] font-extrabold text-purple-950 uppercase mb-0.5">
                        Matrah (KDV Hariç)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={extractedData.subtotal || 0}
                        onChange={(e) => handleSubtotalChange(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-purple-200 rounded-lg p-1 text-xs font-extrabold text-slate-900 text-right"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-purple-950 uppercase mb-0.5">
                        KDV %
                      </label>
                      <select
                        value={extractedData.vatRate || 20}
                        onChange={(e) => handleVatRateChange(parseInt(e.target.value) || 20)}
                        className="w-full bg-white border border-purple-200 rounded-lg p-1 text-xs font-extrabold text-slate-900 text-center"
                      >
                        <option value={20}>%20</option>
                        <option value={10}>%10</option>
                        <option value={1}>%1</option>
                        <option value={0}>%0</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-purple-950 uppercase mb-0.5">
                        KDV Tutarı
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={extractedData.vatAmount || 0}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value) || 0;
                          setExtractedData((prev) => ({
                            ...prev,
                            vatAmount: v,
                            grandTotal: (prev.subtotal || 0) + v
                          }));
                        }}
                        className="w-full bg-white border border-purple-200 rounded-lg p-1 text-xs font-bold text-slate-900 text-right"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-emerald-950 uppercase mb-0.5">
                        Genel Toplam (₺)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={extractedData.grandTotal || 0}
                        onChange={(e) => handleGrandTotalChange(parseFloat(e.target.value) || 0)}
                        className="w-full bg-emerald-50 border border-emerald-300 rounded-lg p-1 text-xs font-black text-emerald-950 text-right"
                      />
                    </div>
                  </div>

                  {/* Vergi Kalemleri Dökümü (Tüm Vergi Türleri) */}
                  <div className="pt-2 border-t border-purple-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-purple-950 flex items-center gap-1">
                        <span>📋 Tüm Vergi Kalemleri</span>
                        <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded-full">
                          {(extractedData.taxItems && extractedData.taxItems.length) || 1} Kalem
                        </span>
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          const currentItems = extractedData.taxItems || [
                            {
                              id: `tax_${Date.now()}`,
                              taxType: "KDV" as const,
                              taxName: `Katma Değer Vergisi (%${extractedData.vatRate || 20})`,
                              rate: extractedData.vatRate || 20,
                              taxAmount: extractedData.vatAmount || 0,
                              taxableAmount: extractedData.subtotal || 0,
                            }
                          ];
                          const newItem: InvoiceTaxItem = {
                            id: `tax_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                            taxType: "ÖİV",
                            taxName: "Özel İletişim Vergisi (%10)",
                            rate: 10,
                            taxableAmount: extractedData.subtotal || 0,
                            taxAmount: Number((((extractedData.subtotal || 0) * 10) / 100).toFixed(2)),
                          };
                          const updated = [...currentItems, newItem];
                          const totalTax = updated.reduce((s, it) => (it.taxType === "KDV Tevkifatı" || it.taxType === "Stopaj" ? s - it.taxAmount : s + it.taxAmount), 0);
                          setExtractedData((prev) => ({
                            ...prev,
                            taxItems: updated,
                            grandTotal: Number(((prev.subtotal || 0) + totalTax).toFixed(2))
                          }));
                        }}
                        className="text-[10px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200 flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Vergi Türü Ekle</span>
                      </button>
                    </div>

                    <div className="space-y-1 max-h-32 overflow-y-auto pr-0.5">
                      {extractedData.taxItems && extractedData.taxItems.length > 0 ? (
                        extractedData.taxItems.map((tax, idx) => (
                          <div
                            key={tax.id || idx}
                            className="bg-purple-50/50 border border-purple-100 rounded-lg p-1.5 flex items-center justify-between gap-1.5 text-xs"
                          >
                            <div className="flex items-center gap-1 min-w-0 flex-1">
                              <select
                                value={tax.taxType}
                                onChange={(e) => {
                                  const tType = e.target.value as TaxType;
                                  const updated = [...(extractedData.taxItems || [])];
                                  updated[idx] = { ...updated[idx], taxType: tType, taxName: tType };
                                  setExtractedData({ ...extractedData, taxItems: updated });
                                }}
                                className="bg-white border border-slate-300 rounded px-1 py-0.5 text-[10px] font-bold text-slate-800"
                              >
                                <option value="KDV">KDV</option>
                                <option value="KDV Tevkifatı">KDV Tevkifatı</option>
                                <option value="ÖTV">ÖTV</option>
                                <option value="ÖİV">ÖİV</option>
                                <option value="Konaklama Vergisi">Konaklama</option>
                                <option value="Damga Vergisi">Damga</option>
                                <option value="Stopaj">Stopaj</option>
                                <option value="BSMV">BSMV</option>
                              </select>

                              <input
                                type="text"
                                value={tax.taxName}
                                placeholder="Vergi Açıklaması"
                                onChange={(e) => {
                                  const updated = [...(extractedData.taxItems || [])];
                                  updated[idx] = { ...updated[idx], taxName: e.target.value };
                                  setExtractedData({ ...extractedData, taxItems: updated });
                                }}
                                className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 flex-1 min-w-[70px]"
                              />
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[10px] text-slate-400 font-bold">%</span>
                              <input
                                type="number"
                                value={tax.rate ?? 0}
                                onChange={(e) => {
                                  const r = parseFloat(e.target.value) || 0;
                                  const updated = [...(extractedData.taxItems || [])];
                                  const matrah = updated[idx].taxableAmount || extractedData.subtotal || 0;
                                  const taxAmt = Number(((matrah * r) / 100).toFixed(2));
                                  updated[idx] = { ...updated[idx], rate: r, taxAmount: taxAmt };
                                  const totalTax = updated.reduce((s, it) => (it.taxType === "KDV Tevkifatı" || it.taxType === "Stopaj" ? s - it.taxAmount : s + it.taxAmount), 0);
                                  setExtractedData({
                                    ...extractedData,
                                    taxItems: updated,
                                    grandTotal: Number(((extractedData.subtotal || 0) + totalTax).toFixed(2))
                                  });
                                }}
                                className="w-8 bg-white border border-slate-300 rounded px-1 py-0.5 text-[10px] font-bold text-center"
                              />

                              <span className="text-[10px] text-slate-400 font-bold">₺</span>
                              <input
                                type="number"
                                step="0.01"
                                value={tax.taxAmount}
                                onChange={(e) => {
                                  const amt = parseFloat(e.target.value) || 0;
                                  const updated = [...(extractedData.taxItems || [])];
                                  updated[idx] = { ...updated[idx], taxAmount: amt };
                                  const totalTax = updated.reduce((s, it) => (it.taxType === "KDV Tevkifatı" || it.taxType === "Stopaj" ? s - it.taxAmount : s + it.taxAmount), 0);
                                  setExtractedData({
                                    ...extractedData,
                                    taxItems: updated,
                                    grandTotal: Number(((extractedData.subtotal || 0) + totalTax).toFixed(2))
                                  });
                                }}
                                className="w-16 bg-white border border-slate-300 rounded px-1 py-0.5 text-[10px] font-mono font-bold text-right"
                              />

                              <button
                                type="button"
                                onClick={() => {
                                  const updated = (extractedData.taxItems || []).filter((_, i) => i !== idx);
                                  const totalTax = updated.reduce((s, it) => (it.taxType === "KDV Tevkifatı" || it.taxType === "Stopaj" ? s - it.taxAmount : s + it.taxAmount), 0);
                                  setExtractedData({
                                    ...extractedData,
                                    taxItems: updated.length > 0 ? updated : undefined,
                                    grandTotal: Number(((extractedData.subtotal || 0) + (updated.length > 0 ? totalTax : (extractedData.vatAmount || 0))).toFixed(2))
                                  });
                                }}
                                className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-[10px] text-slate-500 italic">
                          Standart KDV (%{extractedData.vatRate || 20}): ₺{(extractedData.vatAmount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ÖDEME YÖNTEMİ (KULLANICI KENDİSİ SEÇSİN) */}
                <div>
                  <label className="block text-xs font-extrabold text-purple-950 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-purple-700" />
                      <span>Ödeme Yöntemi (Kullanıcı Seçimi)</span>
                    </span>
                    <span className="text-[10px] font-semibold text-purple-700">
                      Zorunlu Alan
                    </span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {PAYMENT_METHODS.map((method) => {
                      const isSelected = extractedData.paymentMethod === method;
                      const badge = getPaymentBadge(method);
                      const IconComp = badge.icon;
                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() =>
                            setExtractedData({
                              ...extractedData,
                              paymentMethod: method
                            })
                          }
                          className={`p-2 rounded-xl text-left border transition-all flex items-center gap-1.5 cursor-pointer text-xs font-bold ${
                            isSelected
                              ? "bg-purple-700 text-white border-purple-800 shadow-sm ring-2 ring-purple-400/40"
                              : "bg-slate-50 hover:bg-purple-50/60 text-slate-800 border-slate-200"
                          }`}
                        >
                          <IconComp className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-white" : "text-purple-600"}`} />
                          <span className="truncate">{method}</span>
                          {isSelected && <Check className="w-3 h-3 ml-auto text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Gider / Masraf / Alış Kalemi */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Gider / Alış Kalemi *
                  </label>
                  <select
                    value={extractedData.expenseCategory || (extractedData.docType === "Mal Alımı" ? "Mal Alımı" : "Yemek ve ulaşım")}
                    onChange={(e) => {
                      const cat = e.target.value;
                      setExtractedData({
                        ...extractedData,
                        expenseCategory: cat,
                        docType: cat === "Mal Alımı" ? "Mal Alımı" : extractedData.docType
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === "Mal Alımı" ? "📦 Mal Alımı (Ticari Mallar / Stok)" : cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Auto create invoice checkbox */}
                {onAddInvoice && (
                  <label className="flex items-center gap-2 p-2 bg-emerald-50/70 border border-emerald-200 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoCreateInvoice}
                      onChange={(e) => setAutoCreateInvoice(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <div className="text-[11px] leading-tight">
                      <span className="font-extrabold text-emerald-950 block">
                        Ön Muhasebeye / Gider Faturalarına Otomatik Kaydet
                      </span>
                      <span className="text-[10px] text-emerald-800">
                        Fiş/Fatura tutarı ve seçilen ödeme yöntemiyle gider kaydı oluşturulur
                      </span>
                    </div>
                  </label>
                )}
              </div>
            )}

            {/* Description / Notes */}
            <div>
              <label className="block text-xs font-bold text-purple-950 mb-1 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-purple-600" />
                <span>Dosya Açıklaması / Not</span>
              </label>
              <input
                type="text"
                placeholder="Örn: 2026 Temmuz Ayı Kira Kontratı veya Fiş Açıklaması"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-purple-200/80 focus:border-purple-400 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-2xs transition-all"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className="w-full bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Buluta Yükleniyor & Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Buluta Yükle & Kaydet</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* FILE LISTING & METADATA SECTION (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">

          {/* Search and Category Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 bg-purple-50/50 p-1.5 rounded-xl border border-purple-200/50 text-xs font-semibold shadow-2xs overflow-x-auto custom-scrollbar">
              <Filter className="w-3.5 h-3.5 text-purple-600 ml-1 shrink-0 hidden sm:block" />
              {FILE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-white text-purple-950 font-bold shadow-2xs border border-purple-200/60"
                      : "text-purple-900/70 hover:text-purple-950"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Dosya, VKN, Ünvan veya Belge No ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white text-slate-900 placeholder-slate-400 text-xs rounded-xl pl-9 pr-3 py-2 border border-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs transition-all"
              />
            </div>
          </div>

          {/* Files List Container */}
          <div className="bg-slate-50/60 rounded-2xl border border-purple-200/60 p-3.5 shadow-2xs space-y-3">
            <div className="px-1 pb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-purple-700" />
                <h3 className="text-xs font-extrabold text-purple-950 uppercase tracking-wider">
                  Yüklü Evraklar ({filteredFiles.length})
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                Firma Yetkilisi: <strong className="text-purple-900">{currentUser.name}</strong>
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-purple-100/80 space-y-2">
                <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-extrabold">Firestore verileri getiriliyor...</p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-xl border border-purple-100/80 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center mx-auto border border-purple-200/60">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800">Henüz Dosya Yüklenmedi</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm mx-auto">
                    Sol taraftaki yükleme kutusunu kullanarak faturanıza veya firmanıza ait belgeleri yükleyebilir ve OCR ile ayrıştırabilirsiniz.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFiles.map((file) => {
                  const ext = file.extractedData;
                  const paymentBadge = getPaymentBadge(ext?.paymentMethod);
                  const PaymentIcon = paymentBadge.icon;

                  return (
                    <div
                      key={file.id}
                      className="bg-white hover:bg-purple-50/30 transition-all duration-200 group rounded-xl p-3.5 border border-purple-200/60 hover:border-purple-300 shadow-2xs space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                            {getFileIcon(file.fileType, file.fileName)}
                          </div>
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-purple-950 truncate">
                                {file.fileName}
                              </h4>
                              <span className="bg-purple-50 border border-purple-200 text-purple-900 text-[9px] font-bold px-2 py-0.5 rounded shrink-0">
                                {file.category}
                              </span>
                              {ext?.docType && (
                                <span className="bg-amber-50 border border-amber-200 text-amber-900 text-[9px] font-extrabold px-1.5 py-0.5 rounded shrink-0">
                                  {ext.docType}
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-600 font-medium truncate">
                              {file.description}
                            </p>

                            <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 font-semibold">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-purple-400" />
                                {new Date(file.uploadDate).toLocaleDateString("tr-TR", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </span>
                              <span>•</span>
                              <span className="font-mono text-purple-700/70">{formatBytes(file.fileSize)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          {(file.fileUrl || file.fileData) && (
                            <>
                              <button
                                type="button"
                                onClick={() => setPreviewFile(file)}
                                className="bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 p-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                title="Görüntüle / Önizle"
                              >
                                <Eye className="w-3.5 h-3.5 text-purple-700" />
                                <span>Önizle</span>
                              </button>

                              <a
                                href={file.fileUrl || file.fileData}
                                download={file.fileName}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 p-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                title="Dosyayı İndir"
                              >
                                <Download className="w-3.5 h-3.5 text-slate-700" />
                                <span>İndir</span>
                              </a>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDelete(file)}
                            className="p-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            title="Dosyayı Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* AI EXTRACTED INFO CARD (If document has extracted data) */}
                      {ext && (
                        <div className="bg-gradient-to-r from-purple-50/70 via-fuchsia-50/30 to-amber-50/50 p-2.5 rounded-xl border border-purple-200/70 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            {ext.companyTitle && (
                              <span className="font-extrabold text-purple-950 flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-purple-200">
                                <Building2 className="w-3 h-3 text-purple-600" />
                                {ext.companyTitle}
                              </span>
                            )}

                            {ext.taxNumber && (
                              <span className="font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
                                VKN: <strong>{ext.taxNumber}</strong>
                              </span>
                            )}

                            {ext.invoiceNumber && (
                              <span className="font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
                                No: <strong>{ext.invoiceNumber}</strong>
                              </span>
                            )}

                            {/* Ödeme Yöntemi Badge */}
                            {ext.paymentMethod && (
                              <span className={`font-extrabold px-2 py-0.5 rounded-md border text-[11px] flex items-center gap-1 ${paymentBadge.bg}`}>
                                <PaymentIcon className="w-3 h-3" />
                                <span>Ödeme: {ext.paymentMethod}</span>
                              </span>
                            )}
                          </div>

                          {/* Financial Totals */}
                          <div className="flex items-center gap-2 ml-auto">
                            {ext.subtotal !== undefined && (
                              <span className="text-[11px] text-slate-600">
                                Matrah: <strong className="text-slate-900">₺{ext.subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</strong>
                              </span>
                            )}
                            {ext.vatAmount !== undefined && (
                              <span className="text-[11px] text-slate-600">
                                KDV (%{ext.vatRate || 20}): <strong className="text-slate-900">₺{ext.vatAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</strong>
                              </span>
                            )}
                            {ext.grandTotal !== undefined && (
                              <span className="text-xs font-black text-emerald-950 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-md">
                                Toplam: ₺{ext.grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                              </span>
                            )}

                            {/* One-click accounting transfer button if not transferred */}
                            {onAddInvoice && !ext.isTransferredToAccounting && (
                              <button
                                type="button"
                                onClick={() => handleTransferExistingFileToInvoice(file)}
                                className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg shadow-2xs flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                                title="Ön Muhasebe Gider Faturasına Aktar"
                              >
                                <Send className="w-3 h-3" />
                                <span>Muhasebeye Aktar</span>
                              </button>
                            )}

                            {ext.isTransferredToAccounting && (
                              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Muhasebeleştirildi</span>
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* FILE PREVIEW MODAL */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-purple-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-purple-950 text-white p-4 flex items-center justify-between border-b border-purple-800/40">
              <div className="flex items-center gap-2.5">
                {getFileIcon(previewFile.fileType, previewFile.fileName)}
                <div>
                  <h3 className="text-xs font-black text-white">{previewFile.fileName}</h3>
                  <p className="text-[10px] text-purple-200/80">{previewFile.category} • {formatBytes(previewFile.fileSize)}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col md:flex-row items-stretch gap-6 bg-slate-100">
              {/* Document Image/File Area */}
              <div className="flex-1 flex items-center justify-center w-full min-h-[300px]">
                {previewFile.fileType.startsWith("image/") ? (
                  <img
                    src={previewFile.fileUrl || previewFile.fileData}
                    alt={previewFile.fileName}
                    className="max-h-[65vh] max-w-full object-contain rounded-2xl shadow-md border border-slate-200"
                  />
                ) : previewFile.fileName.toLowerCase().endsWith(".xml") || previewFile.fileType.includes("xml") ? (
                  <div className="w-full bg-white rounded-2xl border border-purple-200/80 shadow-md p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                      <div className="flex items-center gap-2 text-xs font-extrabold text-purple-950">
                        <FileCode className="w-5 h-5 text-amber-600" />
                        <span>e-Fatura / e-Arşiv UBL-TR XML Belgesi</span>
                      </div>
                      <span className="text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md">
                        XML Formatı
                      </span>
                    </div>

                    <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200/70 text-xs space-y-1.5">
                      <div className="flex justify-between text-slate-700">
                        <span className="font-semibold text-slate-500">Dosya Adı:</span>
                        <span className="font-bold font-mono text-purple-950">{previewFile.fileName}</span>
                      </div>
                      {previewFile.extractedData?.companyTitle && (
                        <div className="flex justify-between text-slate-700">
                          <span className="font-semibold text-slate-500">Satıcı:</span>
                          <span className="font-bold text-slate-900">{previewFile.extractedData.companyTitle}</span>
                        </div>
                      )}
                      {previewFile.extractedData?.invoiceNumber && (
                        <div className="flex justify-between text-slate-700">
                          <span className="font-semibold text-slate-500">Fatura No:</span>
                          <span className="font-bold font-mono text-slate-900">{previewFile.extractedData.invoiceNumber}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] text-slate-500 font-medium">
                        UBL-TR standartlarına uygun olarak okunmuş ve ayrıştırılmıştır.
                      </span>
                      <a
                        href={previewFile.fileUrl || previewFile.fileData}
                        download={previewFile.fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>XML Dosyasını İndir</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 max-w-md space-y-4">
                    <FileText className="w-12 h-12 text-purple-600 mx-auto" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{previewFile.fileName}</h4>
                      <p className="text-xs text-slate-500 mt-1">{previewFile.description}</p>
                    </div>
                    <a
                      href={previewFile.fileUrl || previewFile.fileData}
                      download={previewFile.fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-purple-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md hover:bg-purple-800 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Dosyayı İndir</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Extracted Details Sidebar if available */}
              {previewFile.extractedData && (
                <div className="w-full md:w-80 bg-white p-4 rounded-2xl border border-purple-200 shadow-md space-y-3 shrink-0">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-purple-100 text-xs font-black text-purple-950">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>AI Ayrıştırma Özeti</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Firma Ünvanı</span>
                      <span className="font-extrabold text-slate-900">{previewFile.extractedData.companyTitle || "-"}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">VKN / TCKN</span>
                        <span className="font-mono font-bold text-slate-900">{previewFile.extractedData.taxNumber || "-"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Belge No</span>
                        <span className="font-bold text-slate-900">{previewFile.extractedData.invoiceNumber || "-"}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Tarih</span>
                        <span className="font-semibold text-slate-900">{previewFile.extractedData.issueDate || "-"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Ödeme Yöntemi</span>
                        <span className="font-extrabold text-purple-900">{previewFile.extractedData.paymentMethod || "Nakit"}</span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-purple-50 rounded-xl space-y-1 border border-purple-200/80">
                      <div className="flex justify-between text-slate-600 text-[11px]">
                        <span>Matrah:</span>
                        <span className="font-bold">₺{(previewFile.extractedData.subtotal || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                      </div>
                      {previewFile.extractedData.taxItems && previewFile.extractedData.taxItems.length > 0 ? (
                        <div className="py-1 my-1 border-y border-purple-200/60 space-y-0.5">
                          {previewFile.extractedData.taxItems.map((tx, ti) => (
                            <div key={tx.id || ti} className="flex justify-between text-slate-700 text-[10px]">
                              <span>{tx.taxName || tx.taxType}</span>
                              <span className="font-mono font-bold">
                                {tx.taxType === "KDV Tevkifatı" || tx.taxType === "Stopaj" ? "-" : "+"}
                                ₺{tx.taxAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex justify-between text-slate-600 text-[11px]">
                          <span>KDV (%{previewFile.extractedData.vatRate || 20}):</span>
                          <span className="font-bold">₺{(previewFile.extractedData.vatAmount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-emerald-950 font-black text-xs pt-1 border-t border-purple-200">
                        <span>Genel Toplam:</span>
                        <span>₺{(previewFile.extractedData.grandTotal || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  {onAddInvoice && !previewFile.extractedData.isTransferredToAccounting && (
                    <button
                      type="button"
                      onClick={() => handleTransferExistingFileToInvoice(previewFile)}
                      className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Ön Muhasebeye Aktar</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
