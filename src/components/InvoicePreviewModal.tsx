import React, { useState, useEffect } from "react";
import { Invoice, InvoiceItem, CompanySettings, Contact, InvoiceDesignSettings } from "../types";
import { getCurrencySymbol, formatDate, exportElementToPDF, exportToExcel } from "../utils/exportUtils";
import { openInvoicePrintModal, setActiveInvoicePrintContext } from "../utils/printEngine";
import { formatInvoiceWhatsAppMessage } from "../utils/whatsappTemplates";
import { computeInvoiceTotals } from "../utils/taxCalculationService";
import { UniversalWhatsAppModal } from "./common/UniversalWhatsAppModal";
import {
  Printer,
  Download,
  FileText,
  Check,
  Zap,
  Edit2,
  CheckCircle,
  FileSpreadsheet,
  PenTool,
} from "lucide-react";
import { NavItem } from "./Sidebar";
import { DetailPageLayout } from "./common/DetailPageLayout";
import {
  OfficialGIBInvoicePaper,
  resolveInvoiceDesignSettings,
  resolveOfficialEDocumentKind,
  getIndependentInvoiceCssConfig,
  saveIndependentInvoiceCssConfig,
  saveCompanyInvoiceCssToFirestore,
} from "./OfficialGIBInvoicePaper";
import { EArsivSignatureStudioModal } from "./EArsivSignatureStudioModal";

export interface InvoicePreviewModalProps {
  invoice: Partial<Invoice>;
  companySettings: CompanySettings;
  contact?: Contact;
  isOpen?: boolean;
  isDraft?: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  onEdit?: () => void;
  onDownloadPDF?: () => void;
  onPrint?: () => void;
  onSelectTab?: (tab: NavItem) => void;
  onSaveCompanySettings?: (settings: CompanySettings) => void;
  title?: string;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  invoice,
  companySettings,
  contact,
  isOpen = true,
  isDraft = false,
  onClose,
  onConfirm,
  onEdit,
  onDownloadPDF,
  onPrint,
  onSaveCompanySettings,
  title,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isSignatureStudioOpen, setIsSignatureStudioOpen] = useState(false);
  const [previewDocType, setPreviewDocType] = useState<"auto" | "e_fatura" | "e_arsiv">("auto");
  const [localDesign, setLocalDesign] = useState<InvoiceDesignSettings>(() =>
    resolveInvoiceDesignSettings(companySettings)
  );

  useEffect(() => {
    setLocalDesign(resolveInvoiceDesignSettings(companySettings));
  }, [companySettings]);

  useEffect(() => {
    if (!isOpen) return;
    setActiveInvoicePrintContext({
      invoice,
      companySettings: { ...companySettings, invoiceDesign: localDesign },
      contact,
      isDraft,
      onSaveCompanySettings,
    });
    return () => {
      setActiveInvoicePrintContext(null);
    };
  }, [isOpen, invoice, companySettings, localDesign, contact, isDraft, onSaveCompanySettings]);

  if (!isOpen) return null;

  const invType = invoice.type || "sales";
  const invNumber = invoice.invoiceNumber || "TASLAK-0001";
  const issueDate = invoice.issueDate || new Date().toISOString().split("T")[0];
  const dueDate = invoice.dueDate || issueDate;
  const items: InvoiceItem[] = invoice.items || [];
  const currency = invoice.currency || companySettings?.currency || "TRY";
  const currSymbol = getCurrencySymbol(currency);

  const {
    totalDiscount: computedTotalDiscount,
    subtotal: computedSubtotal,
    totalVat: computedVat,
    totalWithholding: computedWithholding,
    payableAmount: computedPayableAmount,
    computedItems,
  } = computeInvoiceTotals(items);

  const totalDiscount = invoice.totalDiscount ?? computedTotalDiscount;
  const subtotal = invoice.subtotal ?? computedSubtotal;
  const totalVat = invoice.totalVat ?? computedVat;
  const totalWithholding = invoice.totalWithholding ?? computedWithholding;
  const payableAmount = invoice.payableAmount ?? computedPayableAmount;
  const paidAmount = invoice.paidAmount ?? 0;
  const remainingAmount = invoice.remainingAmount ?? payableAmount - paidAmount;

  const contactName = invoice.contactName || contact?.name || "Belirtilmemiş Müşteri / Tedarikçi";

  const docMeta = resolveOfficialEDocumentKind(
    invoice,
    companySettings,
    contact,
    previewDocType
  );

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      openInvoicePrintModal(
        {
          invoice,
          companySettings: { ...companySettings, invoiceDesign: localDesign },
          contact,
          isDraft,
          onSaveCompanySettings,
        },
        { title: `${invNumber}_${docMeta.isEArsiv ? "eArsiv" : "eFatura"}` }
      );
    }
  };

  const handleDownloadPDF = async () => {
    if (onDownloadPDF) {
      onDownloadPDF();
      return;
    }
    setIsDownloading(true);
    try {
      const fileName = `${invNumber}_${docMeta.isEArsiv ? "eArsiv_Fatura" : "eFatura"}.pdf`;
      await exportElementToPDF("invoice-preview-paper", fileName);
    } catch (err) {
      console.error("PDF Export Hatası:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleExportExcel = () => {
    const headers = [
      "Sıra No",
      "Mal / Hizmet Adı",
      "Miktar",
      "Birim",
      "Birim Fiyat",
      "İskonto (%)",
      "KDV Oranı (%)",
      "KDV Tutarı",
      "Mal / Hizmet Tutarı",
      "Genel Toplam (KDV Dahil)",
    ];

    const rows: (string | number)[][] = computedItems.map((item, idx) => [
      idx + 1,
      item.productName || item.description || "Kalem",
      item.quantity || 1,
      item.unit || "Adet",
      (item.unitPrice || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 }),
      item.discountRate ? `%${item.discountRate}` : "%0",
      `%${item.vatRate || 0}`,
      (item.vatAmount || item.calculatedVatAmount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 }),
      (item.subtotal || item.effectiveTaxableAmount || item.totalWithoutVat || item.grossAmount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 }),
      (item.total || item.lineGrandTotal || item.totalWithVat || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 }),
    ]);

    rows.push([]);
    rows.push(["", "", "", "", "", "", "Ara Toplam:", (subtotal || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 }), currency]);
    if (totalDiscount > 0) {
      rows.push(["", "", "", "", "", "", "Toplam İskonto:", `-${(totalDiscount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`, currency]);
    }
    rows.push(["", "", "", "", "", "", "Hesaplanan KDV:", (totalVat || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 }), currency]);
    if (totalWithholding > 0) {
      rows.push(["", "", "", "", "", "", "Tevkifat Tutarı:", `-${(totalWithholding || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`, currency]);
    }
    rows.push(["", "", "", "", "", "", "Ödenecek Tutar:", (payableAmount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 }), currency]);

    exportToExcel({
      filename: `${invNumber}_Fatura_Detayi_${new Date().toISOString().split("T")[0]}`,
      sheetName: "Fatura Detayı",
      title: `${companySettings.companyName || "FİRMA"} - FATURA DETAYI VE KALEM LİSTESİ`,
      subtitle: `Fatura No: ${invNumber} | Cari: ${contactName} | Tarih: ${formatDate(issueDate)} | Vade: ${formatDate(dueDate)}`,
      headers,
      rows,
    });
  };

  return (
    <DetailPageLayout
      title={title || `${invNumber} - ${contactName}`}
      subtitle={`Resmi GİB ${docMeta.docTitle} A4 XSLT Önizleme & Tasarım • Düzenleme: ${formatDate(issueDate)}`}
      breadcrumbs={[
        { label: "Faturalar", onClick: onClose },
        { label: invNumber, active: true },
      ]}
      onBack={onClose}
      statusBadge={
        <span
          className={`text-[11px] sm:text-xs font-extrabold px-3 py-1 rounded-xl uppercase tracking-wider border ${
            isDraft
              ? "bg-amber-50 text-amber-800 border-amber-200"
              : docMeta.isEArsiv
              ? "bg-red-50 text-red-800 border-red-200"
              : invType === "sales"
              ? "bg-indigo-50 text-indigo-800 border-indigo-200"
              : "bg-emerald-50 text-emerald-800 border-emerald-200"
          }`}
        >
          {isDraft
            ? `TASLAK (${docMeta.docTitle.toUpperCase()})`
            : docMeta.docTitle.toUpperCase()}
        </span>
      }
      headerIcon={<FileText className="w-5 h-5 text-red-700" />}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
            >
              <Edit2 className="w-4 h-4" />
              <span>Faturayı Düzenle</span>
            </button>
          )}

          {onConfirm && isDraft && (
            <button
              type="button"
              onClick={onConfirm}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Faturayı Onayla & Kaydet</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsSignatureStudioOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
            title="e-Arşiv Faturaya Canlı Islak İmza Çiz, İmza/Kaşe Yükle veya Yetkili İmzası Ekle"
          >
            <PenTool className="w-4 h-4 text-blue-100" />
            <span>e-Arşiv İmza / Kaşe Ekle</span>
          </button>

          <button
            type="button"
            onClick={() => setIsWhatsAppModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
          >
            <Zap className="w-4 h-4 text-emerald-100 fill-emerald-100" />
            <span>WhatsApp ile Gönder</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="bg-emerald-700 hover:bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
            title="Fatura Detaylarını ve Kalemlerini Excel (.xlsx) Olarak İndir"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>Excel İndir</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-indigo-100" />
            <span>{isDownloading ? "İndiriliyor..." : "PDF İndir"}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
            title="Logolu ve QR Kodlu Kurumsal PDF Şablonunu Aç & Yazdır"
          >
            <Printer className="w-4 h-4 text-purple-300" />
            <span>PDF Şablonu & Yazdır</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="border border-slate-200 text-slate-600 hover:bg-slate-100 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95"
          >
            Geri Dön
          </button>
        </div>
      }
    >
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Top ERP Metric Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Ödenecek Toplam
            </span>
            <div className="text-xl font-black text-slate-900 font-mono">
              {currSymbol}{payableAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {items.length} Kalem • KDV Dahil
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Tahsilat / Ödeme Yöntemi
            </span>
            <div className={`text-xl font-black font-mono ${remainingAmount <= 0 ? "text-emerald-600" : "text-amber-600"}`}>
              {remainingAmount <= 0 ? "Tamamı Ödendi" : `${currSymbol}${remainingAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-1.5">
              {invoice.paymentMethod && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold border ${
                    invoice.paymentMethod === "nakit"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : invoice.paymentMethod === "kredi_karti"
                      ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                      : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}
                >
                  {invoice.paymentMethod === "nakit"
                    ? "Nakit"
                    : invoice.paymentMethod === "kredi_karti"
                    ? "Kredi Kartı"
                    : invoice.paymentMethod === "eft_havale"
                    ? "EFT / Havale"
                    : "Cari (Açık Hesap)"}
                </span>
              )}
              <span>
                {paidAmount > 0 ? `Tahsil Edilen: ${currSymbol}${paidAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}` : "Açık Bakiye"}
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Fatura / Vade Tarihi
            </span>
            <div className="text-sm font-bold text-slate-800">
              {formatDate(issueDate)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Vade: <strong className="text-slate-700">{formatDate(dueDate)}</strong>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              e-Belge Türü & GİB Senaryosu
            </span>
            <div className="text-sm font-bold text-red-700 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{docMeta.docTitle}</span>
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-1 truncate font-bold">
              {docMeta.scenarioCode} • {docMeta.profileCode}
            </div>
          </div>
        </div>

        {/* Official GİB e-Fatura / e-Arşiv Paper Container */}
        <div className="bg-slate-200/60 p-3 sm:p-6 md:p-8 rounded-3xl border border-slate-300/70 shadow-inner flex justify-center print:bg-white print:p-0 print:border-none print:shadow-none">
          <OfficialGIBInvoicePaper
            invoice={invoice}
            companySettings={companySettings}
            contact={contact}
            isDraft={isDraft}
            designOverride={localDesign}
            previewDocTypeOverride={previewDocType}
            paperId="invoice-preview-paper"
          />
        </div>
      </div>

      {/* WhatsApp Share Modal */}
      <UniversalWhatsAppModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        title="WhatsApp ile Fatura Paylaş"
        documentTypeLabel={isDraft ? `Taslak ${docMeta.docTitle}` : docMeta.docTitle}
        recipientName={contactName}
        recipientPhone={contact?.phone || ""}
        defaultMessage={formatInvoiceWhatsAppMessage(invoice, companySettings, contact)}
        documentFileName={`${invNumber}_Fatura.pdf`}
        companySettings={companySettings}
        onGeneratePdf={async () => {
          const { exportElementToPDFWithPrintStyling } = await import("../utils/pdfService");
          return exportElementToPDFWithPrintStyling("invoice-preview-paper", `${invNumber}_Fatura.pdf`, {
            orientation: "p",
            margin: 8,
            scale: 1.6,
          });
        }}
      />

      <EArsivSignatureStudioModal
        isOpen={isSignatureStudioOpen}
        onClose={() => setIsSignatureStudioOpen(false)}
        companySettings={companySettings}
        currentDesign={localDesign}
        initialSignatureUrl={invoice.eArsivSignatureUrl ?? localDesign.signatureImageUrl}
        initialStampUrl={invoice.eArsivStampUrl ?? localDesign.stampImageUrl}
        initialSignerName={invoice.signerName ?? localDesign.signerName}
        initialSignerTitle={invoice.signerTitle ?? localDesign.signerTitle}
        onApply={(res, saveDefault) => {
          const currentCss = getIndependentInvoiceCssConfig(
            localDesign.cssConfig,
            companySettings.id
          );
          const nextCss = saveIndependentInvoiceCssConfig(
            {
              ...currentCss,
              ...(res.signatureZone ? { signatureZone: res.signatureZone } : {}),
              ...(res.signatureScale !== undefined ? { signatureScale: res.signatureScale } : {}),
            },
            companySettings.id
          );
          const nextDesign: InvoiceDesignSettings = {
            ...localDesign,
            signatureImageUrl: res.signatureImageUrl,
            stampImageUrl: res.stampImageUrl,
            signerName: res.signerName,
            signerTitle: res.signerTitle,
            eArsivSignatureMode: res.eArsivSignatureMode,
            eArsivSignatureColor: res.eArsivSignatureColor,
            showSigningTimestamp: res.showSigningTimestamp,
            showSignatureStamp: res.showSignatureStamp,
            autoDigitalStamp: res.autoDigitalStamp,
            cssConfig: nextCss,
          };
          setLocalDesign(nextDesign);
          if (saveDefault) {
            const updatedSettings: CompanySettings = {
              ...companySettings,
              invoiceDesign: nextDesign,
            };
            onSaveCompanySettings?.(updatedSettings);
            void saveCompanyInvoiceCssToFirestore(companySettings, nextCss, nextDesign);
          }
        }}
      />
    </DetailPageLayout>
  );
};
