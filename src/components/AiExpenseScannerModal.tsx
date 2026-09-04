import React, { useState } from "react";
import {
  Sparkles,
  UploadCloud,
  X,
  Building2,
  ShieldCheck,
  Receipt,
  FileText,
  FileCode,
  Calendar,
  Wallet,
  CreditCard,
  Landmark,
  FileCheck,
  DollarSign,
  CheckCircle2,
  RefreshCw,
  Eye,
  Check,
  ArrowRight,
  Plus,
  Cpu,
  Zap,
  Globe,
  Copy,
  AlertCircle,
  RotateCw,
  QrCode,
  CheckCheck,
  UserCheck,
  UserPlus
} from "lucide-react";
import { Contact, Account, Invoice, EXPENSE_CATEGORIES, InvoiceTaxItem, TaxType } from "../types";
import { parseXmlInvoice } from "../utils/xmlInvoiceParser";
import { parseTurkishReceiptText, validateVKN, validateTCKN, parseGibQrCode, ParsedAccountingData } from "../utils/turkishReceiptParser";
import { processDocumentWithLocalOcr } from "../utils/turkishOcrService";
import { DetailPageLayout } from "./common/DetailPageLayout";

export type ExtractedExpenseData = {
  taxNumber?: string;
  companyTitle?: string;
  invoiceNumber?: string;
  issueDate?: string;
  docType?: "Mal Alımı" | "Fatura" | "Fiş" | "Diğer";
  subtotal?: number;
  vatRate?: number;
  vatAmount?: number;
  taxItems?: InvoiceTaxItem[];
  withholdingAmount?: number;
  otvAmount?: number;
  oivAmount?: number;
  accommodationTaxAmount?: number;
  stampTaxAmount?: number;
  withholdingTaxAmount?: number;
  grandTotal?: number;
  paymentMethod?: "Nakit" | "Kredi Kartı" | "Banka Transferi / EFT" | "Çek" | "Senet" | "Açık Hesap / Vadeli";
  expenseCategory?: string;
  notes?: string;
  ettn?: string;
  iban?: string;
  buyerTaxNumber?: string;
  isQrDecoded?: boolean;
};

interface AiExpenseScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  accounts: Account[];
  onSaveInvoiceDirectly: (
    invoice: Invoice,
    paymentInfo?: { accountId: string; paidAmount: number; paymentMethod: string }
  ) => void;
  onApplyToForm?: (data: ExtractedExpenseData, matchedContactId?: string) => void;
}

const PAYMENT_METHODS = [
  { id: "Nakit", label: "Nakit", icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  { id: "Kredi Kartı", label: "Kredi Kartı", icon: CreditCard, color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200" },
  { id: "Banka Transferi / EFT", label: "Havale / EFT", icon: Landmark, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  { id: "Çek", label: "Çek", icon: FileText, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  { id: "Senet", label: "Senet", icon: FileCheck, color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
  { id: "Açık Hesap / Vadeli", label: "Açık Hesap (Vadeli)", icon: DollarSign, color: "text-slate-600", bg: "bg-slate-50 border-slate-200" }
] as const;

// Sample documents provided by user for instant testing
const SAMPLE_1_FUEL_TEXT = `ü | TAŞPINAR İNOVASYON PETROL A.Ş |
ERENLER MH ADANA ÇEVRE YOLU CD
NO. 58 42210 KARATAY/KONYA
TEL:03323420173
Selçuk VD:4910025014 |
MERSİS NO:0491-0025-0140-0001
LISANS NO:BAY/939-82/44176
TIC SIC NO:14454
ADA NO:4-3
13-04-2026 16:19
FİŞ NO: 0108
42BBD033
46,170 LT X 64,63
K.BENZİN 95 SVP %20 *2.984,00
TOPKDV *497,33
TOPLAM *2.984,00
K.KARTI/B.KARTI *2.984,00
UTTS
ULUSAL TAŞIT TANIMA SİSTEMİ
Shell Card: 70044104146863411`;

const SAMPLE_2_INVOICE_TEXT = `E-ARŞİV
GEKA MOB. İNŞ. TAAH. SAN. TİC. LTD. ŞTİ.
MERKEZ: HOROZLUHAN MAH. ÜZÜMLÜ SK. NO:1 42120 SELÇUKLU/ KONYA
E-Posta: kazimtunall@gmail.com
Vergi Dairesi: SELÇUK VERGİ DAİRESİ
VKN: 3901021947
Mersis No: 0390102194700001
Ticaret Sicil No: 57770

SAYIN
ZELAL EĞİTİM SAĞLIK TURİZM YAPI SANAYİ TİCARET LİMİTED ŞİRKETİ
ŞEKER MAH. UZUNYOL SK. Kapı No: 21 A Daire No: 1- SELÇUKLU/ KONYA
Vergi Dairesi: MERAM VERGİ DAİRESİ
VKN: 9970751040

e-Arşiv Fatura
Özelleştirme No: TR1.2
Senaryo: EARSIVFATURA
Fatura Tipi: SATIS
Fatura No: GKA2024000000098
Fatura Tarihi: 17-05-2024
Fatura Saati: 14:32:36
ETTN: ac3cb695-282a-4060-a700-ad3268d3595c

Sıra No | Malzeme/ Hizmet Açıklaması | Miktar | Birim Fiyatı | KDV Oranı | KDV Tutarı | Mal Hizmet Tutarı
1 | LAMİNANT PARKE 2.K | 3.000,00 M2 | 125,00 TL | %20,00 | 75.000,00 TL | 375.000,00 TL

Mal Hizmet Toplam Tutarı 375.000,00 TL
Hesaplanan KDV(%20.00) 75.000,00 TL
Vergiler Dahil Toplam Tutar 450.000,00 TL
Ödenecek Tutar 450.000,00 TL

Banka: İŞ BANKASI Şube: KARATAY SANAYİ IBAN: TR68 0006 4000 0014 5030 7062 43`;

// Official GİB standard JSON QR code payload
const SAMPLE_3_GIB_QR_JSON = JSON.stringify({
  vkntckn: "3901021947",
  avkntckn: "9970751040",
  senaryo: "EARSIVFATURA",
  tip: "SATIS",
  tarih: "2024-05-17",
  no: "GKA2024000000098",
  ettn: "ac3cb695-282a-4060-a700-ad3268d3595c",
  parabirimi: "TRY",
  malhizmettoplam: "375000.00",
  kdvmatrah: "375000.00",
  hesaplanankdv: "75000.00",
  vergidahil: "450000.00",
  odenecek: "450000.00"
}, null, 2);

export const AiExpenseScannerModal: React.FC<AiExpenseScannerModalProps> = ({
  isOpen,
  onClose,
  contacts,
  accounts,
  onSaveInvoiceDirectly,
  onApplyToForm
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || "");
  const [ocrEngine, setOcrEngine] = useState<"local" | "gemini">("local");
  const [ocrProgress, setOcrProgress] = useState<{ percent: number; message: string }>({ percent: 0, message: "" });
  const [activeTab, setActiveTab] = useState<"fields" | "rawText">("fields");
  const [rawOcrText, setRawOcrText] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [rotationDegrees, setRotationDegrees] = useState<number>(0);

  const [extractedData, setExtractedData] = useState<ExtractedExpenseData>({
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

  if (!isOpen) return null;

  // Check matching contact in system
  const matchedContact = contacts.find(
    (c) =>
      (extractedData.taxNumber && c.taxNumber === extractedData.taxNumber) ||
      (extractedData.companyTitle && c.name.toLowerCase() === extractedData.companyTitle.trim().toLowerCase())
  );

  // VKN MOD 10 Checksum Validity
  const isVknValidGib = validateVKN(extractedData.taxNumber) || validateTCKN(extractedData.taxNumber);

  // Apply parsed accounting result to state
  const applyParsedData = (parsed: ParsedAccountingData) => {
    setRawOcrText(parsed.rawText);
    setExtractedData({
      taxNumber: parsed.taxNumber,
      companyTitle: parsed.companyTitle,
      invoiceNumber: parsed.invoiceNumber,
      issueDate: parsed.issueDate,
      docType: parsed.docType === "Fiş" ? "Fiş" : "Fatura",
      subtotal: parsed.subtotal,
      vatRate: parsed.vatRate,
      vatAmount: parsed.vatAmount,
      grandTotal: parsed.grandTotal,
      paymentMethod: parsed.paymentMethod,
      expenseCategory: parsed.expenseCategory,
      notes: parsed.notes,
      ettn: parsed.ettn,
      iban: parsed.iban,
      buyerTaxNumber: parsed.buyerTaxNumber,
      isQrDecoded: parsed.isQrDecoded,
      taxItems: [
        {
          id: `tax_${Date.now()}`,
          taxType: "KDV",
          taxName: `Katma Değer Vergisi (%${parsed.vatRate})`,
          rate: parsed.vatRate,
          taxableAmount: parsed.subtotal,
          taxAmount: parsed.vatAmount
        }
      ]
    });
  };

  // 1. Local Multi-Stage Processing (QR Code, PDF, Adaptive Binarization, OCR)
  const triggerLocalOcr = async (file: File, rot = rotationDegrees) => {
    setScanning(true);
    setOcrProgress({ percent: 5, message: "Dosya hazırlanıyor..." });

    try {
      const parsed = await processDocumentWithLocalOcr(
        file,
        (percent, message) => {
          setOcrProgress({ percent, message });
        },
        { rotationDegrees: rot }
      );
      applyParsedData(parsed);
    } catch (err: any) {
      console.error("Yerel OCR hatası, Gemini AI yedek moduna yönlendiriliyor:", err);
      if (filePreview) {
        triggerGeminiAiOcr(file, filePreview);
      } else {
        fallbackParsing(file);
      }
    } finally {
      setScanning(false);
    }
  };

  // 2. Cloud Gemini AI (Backup fallback mode)
  const triggerGeminiAiOcr = async (file: File, base64: string, textContent?: string) => {
    setScanning(true);
    setOcrProgress({ percent: 30, message: "Bulut Gemini AI'ya bağlanılıyor..." });

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
          const grandTotalVal = Number(d.grandTotal) || subtotalVal + vatAmountVal;

          let detectedPayment: ExtractedExpenseData["paymentMethod"] = "Nakit";
          if (
            d.suggestedPaymentMethod &&
            PAYMENT_METHODS.some((p) => p.id === d.suggestedPaymentMethod)
          ) {
            detectedPayment = d.suggestedPaymentMethod as any;
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
          setRawOcrText(textContent || JSON.stringify(d, null, 2));
          return;
        }
      }

      fallbackParsing(file);
    } catch (err) {
      console.warn("AI OCR ayrıştırma yerel fallback'e yönlendirildi:", err);
      fallbackParsing(file);
    } finally {
      setScanning(false);
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
      subtotal: prev.subtotal || 500,
      vatRate: prev.vatRate || 20,
      vatAmount: prev.vatAmount || 100,
      grandTotal: prev.grandTotal || 600,
      paymentMethod: prev.paymentMethod || "Nakit"
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 15 * 1024 * 1024) {
        alert("Dosya boyutu çok büyük (Max: 15 MB). Lütfen daha küçük bir belge yükleyin.");
        return;
      }
      setSelectedFile(file);
      setRotationDegrees(0);

      const isXml = file.name.toLowerCase().endsWith(".xml") || file.type.includes("xml");

      if (isXml) {
        const textReader = new FileReader();
        textReader.onload = () => {
          const xmlText = textReader.result as string;
          setRawOcrText(xmlText);
          const parsed = parseXmlInvoice(xmlText, file.name);
          if (parsed.success && parsed.data) {
            setExtractedData(parsed.data);
          } else {
            triggerLocalOcr(file, 0);
          }
        };
        textReader.readAsText(file);

        const base64Reader = new FileReader();
        base64Reader.onload = () => {
          setFilePreview(base64Reader.result as string);
        };
        base64Reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          setFilePreview(base64);

          if (ocrEngine === "local") {
            triggerLocalOcr(file, 0);
          } else {
            triggerGeminiAiOcr(file, base64);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleRotateClockwise = () => {
    const nextRot = (rotationDegrees + 90) % 360;
    setRotationDegrees(nextRot);
    if (selectedFile && ocrEngine === "local") {
      triggerLocalOcr(selectedFile, nextRot);
    }
  };

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

  const handleDirectSave = () => {
    const vendorName = extractedData.companyTitle?.trim() || "Gider Tedarikçisi / Satıcı";
    const contactId = matchedContact ? matchedContact.id : `cnt_ven_${Date.now()}`;
    const isPaid = extractedData.paymentMethod !== "Açık Hesap / Vadeli";
    const subtotal = extractedData.subtotal || 0;
    const vatAmount = extractedData.vatAmount || 0;
    const grandTotal = extractedData.grandTotal || subtotal + vatAmount;
    const vatRate = extractedData.vatRate || 20;

    const isGoodsPurchase = extractedData.docType === "Mal Alımı" || extractedData.expenseCategory === "Mal Alımı";
    const newInvoice: Invoice = {
      id: `inv_ocr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      invoiceNumber:
        extractedData.invoiceNumber ||
        `${isGoodsPurchase ? "MAL2026" : extractedData.docType === "Fatura" ? "TED2026" : "GDF2026"}${Date.now().toString().slice(-6)}`,
      type: "purchase",
      docKind: extractedData.docType === "Fiş" ? "receipt" : "invoice",
      expenseCategory: extractedData.expenseCategory || (isGoodsPurchase ? "Mal Alımı" : "Yemek ve ulaşım"),
      contactId,
      contactName: vendorName,
      taxNumber: extractedData.taxNumber || "",
      issueDate: extractedData.issueDate || new Date().toISOString().split("T")[0],
      dueDate: extractedData.issueDate || new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
      status: isPaid ? "paid" : "sent",
      subtotal,
      totalVat: vatAmount,
      taxItems: extractedData.taxItems,
      totalWithholding: extractedData.withholdingAmount,
      totalOtv: extractedData.otvAmount,
      totalOiv: extractedData.oivAmount,
      totalAccommodationTax: extractedData.accommodationTaxAmount,
      totalStampTax: extractedData.stampTaxAmount,
      totalStopaj: extractedData.withholdingTaxAmount,
      grandTotal,
      paidAmount: isPaid ? grandTotal : 0,
      remainingAmount: isPaid ? 0 : grandTotal,
      currency: "TRY",
      notes: `${ocrEngine === "local" ? "⚡ Sıfır Maliyetli Yerel OCR" : "🌐 Bulut Gemini AI"} ile tarandı (${selectedFile?.name || "Evrak"}). Tür: ${extractedData.docType || "Fatura"}. Ödeme: ${extractedData.paymentMethod || "Nakit"}. ${extractedData.ettn ? "ETTN: " + extractedData.ettn : ""} ${extractedData.iban ? "IBAN: " + extractedData.iban : ""} ${extractedData.notes || ""}`.trim(),
      items: [
        {
          id: `item_${Date.now()}`,
          description: `${vendorName} - ${extractedData.expenseCategory || (isGoodsPurchase ? "Mal Alımı" : "Gider / Masraf")}`,
          expenseCategory: extractedData.expenseCategory || (isGoodsPurchase ? "Mal Alımı" : "Yemek ve ulaşım"),
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

    const paymentInfo = isPaid
      ? {
          accountId: selectedAccountId || accounts[0]?.id || "acc_cash",
          paidAmount: grandTotal,
          paymentMethod: extractedData.paymentMethod || "Nakit"
        }
      : undefined;

    onSaveInvoiceDirectly(newInvoice, paymentInfo);
    onClose();
  };

  const handleApplyToForm = () => {
    if (onApplyToForm) {
      onApplyToForm(extractedData, matchedContact?.id);
    }
    onClose();
  };

  // Quick test with sample texts
  const runQuickTest = (type: "fuel" | "invoice" | "gib_qr") => {
    if (type === "gib_qr") {
      const parsed = parseTurkishReceiptText(SAMPLE_3_GIB_QR_JSON, "gib_resmi_karekod.json");
      applyParsedData(parsed);
      setSelectedFile(new File([SAMPLE_3_GIB_QR_JSON], "gib_karekod_ornegi.json", { type: "application/json" }));
      return;
    }
    const text = type === "fuel" ? SAMPLE_1_FUEL_TEXT : SAMPLE_2_INVOICE_TEXT;
    const dummyFile = new File([text], type === "fuel" ? "akaryakit_pompa_fisi.png" : "resmi_earciv_fatura.pdf", {
      type: type === "fuel" ? "image/png" : "application/pdf"
    });
    setSelectedFile(dummyFile);
    const parsed = parseTurkishReceiptText(text, dummyFile.name);
    applyParsedData(parsed);
  };

  // Math check: subtotal + vat == grandTotal
  const mathIsConsistent =
    Math.abs(((extractedData.subtotal || 0) + (extractedData.vatAmount || 0)) - (extractedData.grandTotal || 0)) < 0.05;

  return (
    <DetailPageLayout
      title="Akıllı Fiş & Fatura OCR Tarayıcı"
      subtitle="GİB Karekod çözücü, resmi VKN MOD 10 doğrulaması ve yerel Türkçe OCR ile sıfır yapay zeka maliyetiyle faturaları aktarın"
      breadcrumbs={[
        { label: "Faturalar", onClick: onClose },
        { label: "Akıllı OCR Tarayıcı", active: true },
      ]}
      onBack={onClose}
      statusBadge={
        <div className="flex items-center gap-1.5">
          {ocrEngine === "local" ? (
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-black px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-2xs">
              <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
              <span>SIFIR MALİYETLİ YEREL MOTOR</span>
            </span>
          ) : (
            <span className="bg-amber-50 text-amber-800 border border-amber-300 text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-amber-600" />
              <span>BULUT GEMINI AI (YEDEK)</span>
            </span>
          )}
        </div>
      }
      headerIcon={<Cpu className="w-5 h-5 text-purple-700" />}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Geri Dön
          </button>
        </div>
      }
    >
      <div className="bg-white border border-purple-200/80 rounded-3xl max-w-5xl mx-auto shadow-sm p-5 sm:p-6 space-y-5">
        
        {/* Engine Switcher Ribbon & Quick Test Buttons */}
        <div className="bg-gradient-to-r from-purple-50 via-slate-50 to-indigo-50/60 p-3 rounded-2xl border border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-slate-800">Motor:</span>
            <div className="inline-flex p-1 bg-white rounded-xl border border-purple-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setOcrEngine("local")}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  ocrEngine === "local"
                    ? "bg-purple-700 text-white shadow-xs"
                    : "text-slate-600 hover:text-purple-900"
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>⚡ Yerel OCR (Sıfır Maliyet)</span>
              </button>
              <button
                type="button"
                onClick={() => setOcrEngine("gemini")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  ocrEngine === "gemini"
                    ? "bg-purple-700 text-white shadow-xs"
                    : "text-slate-600 hover:text-purple-900"
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>🌐 Bulut Gemini AI</span>
              </button>
            </div>
          </div>

          {/* Quick Test Demo Buttons */}
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="text-[11px] font-bold text-slate-500">Hızlı Test:</span>
            <button
              type="button"
              onClick={() => runQuickTest("fuel")}
              className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg cursor-pointer transition-colors shadow-2xs"
            >
              ⛽ Örnek 1 (Akaryakıt Fişi)
            </button>
            <button
              type="button"
              onClick={() => runQuickTest("invoice")}
              className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 rounded-lg cursor-pointer transition-colors shadow-2xs"
            >
              📄 Örnek 2 (e-Arşiv Fatura)
            </button>
            <button
              type="button"
              onClick={() => runQuickTest("gib_qr")}
              className="px-2.5 py-1 text-[11px] font-black bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg cursor-pointer transition-colors shadow-2xs flex items-center gap-1"
            >
              <QrCode className="w-3 h-3 text-emerald-700" />
              <span>GİB Karekod</span>
            </button>
          </div>
        </div>

        {/* File Upload Dropzone with Rotation Controls */}
        <div className="relative border-2 border-dashed border-purple-300 hover:border-purple-600 bg-purple-50/40 hover:bg-purple-50/80 p-4 sm:p-5 rounded-2xl text-center transition-all cursor-pointer group">
          <input
            type="file"
            accept="image/*,.pdf,.xml,.xlsx,.csv"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center border border-purple-300 group-hover:scale-105 transition-transform shadow-xs">
              <UploadCloud className="w-6 h-6 text-purple-700" />
            </div>
            <div className="text-center sm:text-left">
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-purple-900">
                {selectedFile ? selectedFile.name : "Fiş, Fatura veya PDF Belgesi Seçin ya da Sürükleyin"}
              </h4>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                PDF (dijital veya taranmış), JPG, PNG, WebP veya e-Fatura XML formatında belge (Max 15 MB)
              </p>
            </div>
            {selectedFile && (
              <div className="sm:ml-auto z-20 flex items-center gap-2">
                {/* 90° Clockwise Rotate Button for Sideways Photos */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRotateClockwise();
                  }}
                  title="Görseli 90° Sağa Döndür"
                  className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl shadow-2xs flex items-center gap-1 text-xs font-bold cursor-pointer transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5 text-purple-700" />
                  <span>Döndür ({rotationDegrees}°)</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (ocrEngine === "local") {
                      triggerLocalOcr(selectedFile, rotationDegrees);
                    } else if (filePreview) {
                      triggerGeminiAiOcr(selectedFile, filePreview);
                    }
                  }}
                  disabled={scanning}
                  className="text-xs font-extrabold text-purple-900 bg-white hover:bg-purple-100 px-3.5 py-2 rounded-xl border border-purple-300 flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${scanning ? "animate-spin text-purple-600" : ""}`} />
                  <span>Yeniden Tara</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* OCR Scanning Progress Bar */}
        {scanning && (
          <div className="p-4 bg-purple-50 border border-purple-300 rounded-2xl space-y-2 animate-pulse">
            <div className="flex items-center justify-between text-xs font-extrabold text-purple-950">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-purple-700 border-t-transparent rounded-full animate-spin" />
                <span>{ocrProgress.message || "Belge taranıyor ve ayrıştırılıyor..."}</span>
              </div>
              <span className="font-mono text-purple-700 font-black">%{ocrProgress.percent}</span>
            </div>
            <div className="w-full bg-purple-200/70 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${ocrProgress.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Live Validation Badges Ribbon */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* GİB QR Badge */}
          {extractedData.isQrDecoded && (
            <span className="bg-indigo-50 text-indigo-900 border border-indigo-300 px-2.5 py-1 rounded-xl font-black flex items-center gap-1 shadow-2xs">
              <QrCode className="w-3.5 h-3.5 text-indigo-600" />
              <span>GİB Resmi Karekod Okundu (%100 Doğruluk)</span>
            </span>
          )}

          {/* VKN MOD 10 Badge */}
          {extractedData.taxNumber && (
            <span
              className={`px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 border shadow-2xs ${
                isVknValidGib
                  ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-black"
                  : "bg-slate-100 text-slate-700 border-slate-300"
              }`}
            >
              {isVknValidGib ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />}
              <span>{isVknValidGib ? "GİB MOD 10 Doğrulanmış VKN: " : "VKN: "}{extractedData.taxNumber}</span>
            </span>
          )}

          {/* Matrah + KDV = Toplam Check */}
          {extractedData.grandTotal > 0 && (
            <span
              className={`px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 border shadow-2xs ${
                mathIsConsistent
                  ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-black"
                  : "bg-amber-50 text-amber-900 border-amber-300"
              }`}
            >
              {mathIsConsistent ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-600" />}
              <span>{mathIsConsistent ? "Matematiksel Eşitlik Sağlandı (Matrah + KDV = Toplam)" : "Tutarları Kontrol Ediniz"}</span>
            </span>
          )}

          {/* Contact Match Badge */}
          {matchedContact ? (
            <span className="bg-purple-50 text-purple-900 border border-purple-300 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 shadow-2xs">
              <UserCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Kayıtlı Cari: <strong>{matchedContact.name}</strong></span>
            </span>
          ) : extractedData.companyTitle ? (
            <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-xl font-medium flex items-center gap-1">
              <UserPlus className="w-3.5 h-3.5 text-slate-400" />
              <span>Yeni Cari (Otomatik Kart Açılır)</span>
            </span>
          ) : null}
        </div>

        {/* Inspection Tabs Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("fields")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === "fields"
                  ? "bg-purple-700 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              📋 Ayrıştırılan Muhasebe Alanları
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("rawText")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "rawText"
                  ? "bg-purple-700 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Taranan Ham Metin (OCR Raw)</span>
              {rawOcrText && (
                <span className="text-[10px] bg-purple-200 text-purple-900 px-1.5 py-0.2 rounded-full font-mono">
                  {rawOcrText.length} krk
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab 2: Raw Text Inspection View */}
        {activeTab === "rawText" && (
          <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700">
              <span className="text-slate-400 font-bold">OCR Tarafından Okunan Ham Karakter Akışı:</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(rawOcrText);
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 2000);
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded-lg flex items-center gap-1 cursor-pointer transition-colors border border-slate-600"
              >
                {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copySuccess ? "Kopyalandı" : "Metni Kopyala"}</span>
              </button>
            </div>
            <pre className="whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed text-[11px] text-slate-200">
              {rawOcrText || "Henüz bir belge taranmadı. Yukarıdan bir fiş/fatura yükleyin veya 'Hızlı Test' butonlarını kullanın."}
            </pre>
          </div>
        )}

        {/* Tab 1: Form & Accounting Fields */}
        {activeTab === "fields" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Left Col: Extracted Details Form (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-purple-200/60 shadow-2xs space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-purple-950">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Okunan Belge ve Satıcı Bilgileri</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    Otomatik Ayrıştırıldı
                  </span>
                </div>

                {/* Satıcı Firma & Vergi No */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Firma / Satıcı Ünvanı *
                    </label>
                    <div className="relative">
                      <Building2 className="w-3.5 h-3.5 text-purple-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Örn: TAŞPINAR İNOVASYON PETROL A.Ş"
                        value={extractedData.companyTitle || ""}
                        onChange={(e) =>
                          setExtractedData({ ...extractedData, companyTitle: e.target.value })
                        }
                        className="w-full bg-white border border-slate-300 focus:border-purple-500 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Vergi Kimlik No (VKN / TCKN)
                    </label>
                    <div className="relative">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-500 absolute left-3 top-1/2 -translate-y-1/2" />
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
                        className="w-full bg-white border border-slate-300 focus:border-purple-500 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Belge / İşlem Türü Seçimi */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-700">
                    İşlem / Belge Türü
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
                      className={`p-2 rounded-xl text-center border transition-all text-xs font-black cursor-pointer flex items-center justify-center gap-1.5 ${
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
                      className={`p-2 rounded-xl text-center border transition-all text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 ${
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
                      className={`p-2 rounded-xl text-center border transition-all text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 ${
                        extractedData.docType === "Fiş" && extractedData.expenseCategory !== "Mal Alımı"
                          ? "bg-purple-700 text-white border-purple-800 shadow-xs ring-2 ring-purple-400/40"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                      }`}
                    >
                      <span>🧾 Masraf Fişi</span>
                    </button>
                  </div>
                </div>

                {/* Belge Türü, No ve Tarih */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900"
                    >
                      <option value="Mal Alımı">Mal Alımı Faturası (Ticari Mal)</option>
                      <option value="Fatura">Gider Faturası (e-Arşiv / Hizmet)</option>
                      <option value="Fiş">Masraf Fişi (Yazar Kasa / ÖKC)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Fiş / Fatura No
                    </label>
                    <input
                      type="text"
                      placeholder="FİŞ-0108 / GKA2024..."
                      value={extractedData.invoiceNumber || ""}
                      onChange={(e) =>
                        setExtractedData({ ...extractedData, invoiceNumber: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold font-mono text-slate-900"
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
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-semibold text-slate-900"
                    />
                  </div>
                </div>

                {/* Gider / Masraf / Alış Kalemi */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Gider / Alış Kategorisi *
                  </label>
                  <select
                    value={extractedData.expenseCategory || (extractedData.docType === "Mal Alımı" ? "Mal Alımı" : "Yakıt harcamaları")}
                    onChange={(e) => {
                      const cat = e.target.value;
                      setExtractedData({
                        ...extractedData,
                        expenseCategory: cat,
                        docType: cat === "Mal Alımı" ? "Mal Alımı" : extractedData.docType
                      });
                    }}
                    className="w-full bg-purple-50/60 border border-purple-300 rounded-xl p-2 text-xs font-bold text-purple-950 focus:ring-2 focus:ring-purple-500"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === "Mal Alımı" ? "📦 Mal Alımı (Ticari Mallar / Stok)" : cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tutarlar & KDV Kutusu */}
                <div className="bg-white p-3.5 rounded-2xl border border-purple-200 space-y-2.5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
                        Matrah (KDV Hariç)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={extractedData.subtotal || 0}
                        onChange={(e) => handleSubtotalChange(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-extrabold text-slate-900 text-right"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
                        KDV %
                      </label>
                      <select
                        value={extractedData.vatRate || 20}
                        onChange={(e) => handleVatRateChange(parseInt(e.target.value) || 20)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-extrabold text-slate-900 text-center"
                      >
                        <option value={20}>%20</option>
                        <option value={10}>%10</option>
                        <option value={1}>%1</option>
                        <option value={0}>%0</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
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
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900 text-right"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-emerald-900 uppercase mb-1">
                        Genel Toplam (₺)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={extractedData.grandTotal || 0}
                        onChange={(e) => handleGrandTotalChange(parseFloat(e.target.value) || 0)}
                        className="w-full bg-emerald-50 border border-emerald-300 rounded-xl p-2 text-xs font-black text-emerald-950 text-right"
                      />
                    </div>
                  </div>

                  {/* Vergi Kalemleri Dökümü */}
                  <div className="pt-2 border-t border-purple-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-purple-950 flex items-center gap-1">
                        <span>📋 Belgedeki Vergi Kalemleri</span>
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
                        className="text-[10px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200 flex items-center gap-0.5 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Vergi Türü Ekle</span>
                      </button>
                    </div>

                    {/* Tax Items List */}
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                      {extractedData.taxItems && extractedData.taxItems.length > 0 ? (
                        extractedData.taxItems.map((tax, idx) => (
                          <div
                            key={tax.id || idx}
                            className="bg-slate-50/90 border border-slate-200 rounded-lg p-1.5 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <select
                                value={tax.taxType}
                                onChange={(e) => {
                                  const tType = e.target.value as TaxType;
                                  const updated = [...(extractedData.taxItems || [])];
                                  updated[idx] = { ...updated[idx], taxType: tType, taxName: tType };
                                  setExtractedData({ ...extractedData, taxItems: updated });
                                }}
                                className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[11px] font-bold text-slate-800"
                              >
                                <option value="KDV">KDV</option>
                                <option value="KDV Tevkifatı">KDV Tevkifatı</option>
                                <option value="ÖTV">ÖTV</option>
                                <option value="ÖİV">ÖİV</option>
                                <option value="Konaklama Vergisi">Konaklama Vergisi</option>
                                <option value="Damga Vergisi">Damga Vergisi</option>
                                <option value="Stopaj">Stopaj</option>
                                <option value="BSMV">BSMV</option>
                                <option value="Borsa Tescil / Fon">Borsa Tescil</option>
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
                                className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[11px] font-semibold text-slate-700 flex-1 min-w-[100px]"
                              />
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[10px] text-slate-500 font-bold">%</span>
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
                                className="w-10 bg-white border border-slate-300 rounded px-1 py-0.5 text-[11px] font-bold text-center"
                              />

                              <span className="text-[10px] text-slate-500 font-bold">₺</span>
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
                                className="w-18 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[11px] font-mono font-black text-right"
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
                                title="Vergi Kalemini Sil"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-[11px] text-slate-500 italic bg-slate-50 rounded-lg p-1.5 border border-slate-200 flex items-center justify-between">
                          <span>Standart KDV (%{extractedData.vatRate || 20}): <strong>₺{(extractedData.vatAmount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</strong></span>
                          <span className="text-[10px] text-purple-700 font-bold">(Tüm vergi türleri desteklenir)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ETTN & IBAN & Notlar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {extractedData.ettn && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        ETTN (Evrensel Fatura Kodu)
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={extractedData.ettn}
                        className="w-full bg-slate-100 border border-slate-300 rounded-xl p-1.5 text-[11px] font-mono font-bold text-purple-900"
                      />
                    </div>
                  )}

                  {extractedData.iban && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Banka IBAN Numarası
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={extractedData.iban}
                        className="w-full bg-slate-100 border border-slate-300 rounded-xl p-1.5 text-[11px] font-mono font-bold text-blue-900"
                      />
                    </div>
                  )}
                </div>

                {/* Ek Notlar */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tespit Edilen Belge Notları & Detaylar
                  </label>
                  <input
                    type="text"
                    placeholder="Araç plakası, UTTS onay no vb."
                    value={extractedData.notes || ""}
                    onChange={(e) => setExtractedData({ ...extractedData, notes: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Right Col: Payment Method Selection & Account (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-purple-200/60 shadow-2xs space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-purple-950">
                    <CreditCard className="w-4 h-4 text-purple-700" />
                    <span>Ödeme Yöntemi & Kasa/Banka</span>
                  </div>
                  <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md">
                    Kullanıcı Seçimi
                  </span>
                </div>

                {/* Payment Methods Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((pm) => {
                    const isSelected = extractedData.paymentMethod === pm.id;
                    const IconComp = pm.icon;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() =>
                          setExtractedData({
                            ...extractedData,
                            paymentMethod: pm.id as any
                          })
                        }
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                          isSelected
                            ? "bg-purple-700 text-white border-purple-800 shadow-sm ring-2 ring-purple-400/40"
                            : "bg-white hover:bg-purple-50 text-slate-800 border-slate-200"
                        }`}
                      >
                        <IconComp
                          className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : pm.color}`}
                        />
                        <span className="text-xs font-extrabold truncate">{pm.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 ml-auto text-white" />}
                      </button>
                    );
                  })}
                </div>

                {/* Kasa / Banka Hesabı Seçimi */}
                {extractedData.paymentMethod !== "Açık Hesap / Vadeli" && (
                  <div className="bg-white p-3 rounded-xl border border-purple-200 space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Ödemenin Düştüğü Kasa / Banka Hesabı *
                    </label>
                    <select
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.type === "cash" ? "Kasa" : acc.type === "bank" ? "Banka" : "POS"} - ₺{acc.balance.toLocaleString("tr-TR")})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Gider faturası kaydedildiğinde bu hesaptan otomatik çıkış işlemi (ödeme kaydı) yapılacaktır.
                    </p>
                  </div>
                )}

                {/* Belge Önizleme (Varsa) */}
                {filePreview && (
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase">
                        Yüklenen Belge Önizlemesi {rotationDegrees !== 0 ? `(${rotationDegrees}° Döndürüldü)` : ""}
                      </span>
                      {selectedFile?.type.startsWith("image/") && (
                        <button
                          type="button"
                          onClick={handleRotateClockwise}
                          className="text-[10px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCw className="w-3 h-3" />
                          <span>Döndür</span>
                        </button>
                      )}
                    </div>
                    {selectedFile?.type.startsWith("image/") ? (
                      <div className="overflow-hidden flex items-center justify-center bg-slate-50 rounded-lg border border-slate-100 p-1">
                        <img
                          src={filePreview}
                          alt="Fiş Önizleme"
                          style={{ transform: `rotate(${rotationDegrees}deg)` }}
                          className="max-h-48 w-full object-contain rounded-lg transition-transform duration-200"
                        />
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs font-bold text-slate-600 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center gap-2">
                        <FileText className="w-5 h-5 text-rose-600" />
                        <span>{selectedFile?.name} (PDF Dokümanı)</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-slate-50 border-t border-purple-200/60 flex flex-wrap items-center justify-between gap-3 max-w-5xl mx-auto mt-4 rounded-2xl">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl cursor-pointer transition-colors"
        >
          Vazgeç
        </button>

        <div className="flex items-center gap-2">
          {onApplyToForm && (
            <button
              type="button"
              onClick={handleApplyToForm}
              disabled={scanning}
              className="px-4 py-2.5 bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-purple-300 shadow-2xs"
            >
              <span>Fatura Formuna Aktar & Düzenle</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleDirectSave}
            disabled={scanning || (!extractedData.companyTitle && !extractedData.grandTotal)}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 active:scale-98"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>Gider Olarak Kaydet & Muhasebeleştir</span>
          </button>
        </div>
      </div>
    </DetailPageLayout>
  );
};
