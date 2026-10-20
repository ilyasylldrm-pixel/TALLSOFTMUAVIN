import React, { useState } from "react";
import { Invoice, InvoiceItem, CompanySettings, Contact, getContactAccountCode } from "../types";
import { numberToTurkishWords } from "../utils/numberToTurkishWords";
import { getCurrencySymbol, formatDate, exportElementToPDF, printHtmlElement, exportToExcel } from "../utils/exportUtils";
import { formatInvoiceWhatsAppMessage } from "../utils/whatsappTemplates";
import { formatAddressWithBranch } from "../utils/storage";
import {
  computeInvoiceTotals,
  formatWithholdingBadge,
  generateInvoiceLegalTaxNotes,
} from "../utils/taxCalculationService";
import { UniversalWhatsAppModal } from "./common/UniversalWhatsAppModal";
import {
  Printer,
  Download,
  X,
  QrCode,
  Building2,
  CheckCircle2,
  Users,
  Package,
  ExternalLink,
  FileText,
  Check,
  Send,
  AlertCircle,
  Calendar,
  CreditCard,
  Zap,
  Edit2,
  Clock,
  CheckCircle,
  FileSpreadsheet,
  Upload,
} from "lucide-react";
import { Logo } from "./Logo";
import { NavItem } from "./Sidebar";
import { DetailPageLayout } from "./common/DetailPageLayout";
import { readAndOptimizeLogoFile } from "../utils/logoUpload";
import { saveCloudLogo } from "../services/cloudBrandingService";

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
  onSelectTab,
  onSaveCompanySettings,
  title,
}) => {
  const logoFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readAndOptimizeLogoFile(file);
      if (onSaveCompanySettings) {
        onSaveCompanySettings({ ...companySettings, logoUrl: dataUrl });
      }
      void saveCloudLogo(dataUrl, {
        brandName: companySettings.companyName || "E-MUAVİN",
        description: "Fatura önizleme üzerinden yüklenen kurumsal logo",
      });
    } catch (err) {
      console.error("Logo yükleme hatası:", err);
    } finally {
      e.target.value = "";
    }
  };
  const [isDownloading, setIsDownloading] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  if (!isOpen) return null;

  // Safe fallback values from existing data structure
  const invType = invoice.type || "sales";
  const invNumber = invoice.invoiceNumber || "TASLAK-0001";
  const issueDate = invoice.issueDate || new Date().toISOString().split("T")[0];
  const dueDate = invoice.dueDate || issueDate;
  const items: InvoiceItem[] = invoice.items || [];
  const currency = invoice.currency || companySettings?.currency || "TRY";
  const currSymbol = getCurrencySymbol(currency);

  // Recalculate totals accurately using computeInvoiceTotals
  const {
    grossTotal: computedGrossTotal,
    totalDiscount: computedTotalDiscount,
    subtotal: computedSubtotal,
    effectiveTaxableAmount,
    totalVat: computedVat,
    totalWithholding: computedWithholding,
    grandTotal: computedGrandTotal,
    payableAmount: computedPayableAmount,
    computedItems,
  } = computeInvoiceTotals(items);

  const grossTotal = invoice.grossTotal ?? computedGrossTotal;
  const totalDiscount = invoice.totalDiscount ?? computedTotalDiscount;
  const subtotal = invoice.subtotal ?? computedSubtotal;
  const totalVat = invoice.totalVat ?? computedVat;
  const totalWithholding = invoice.totalWithholding ?? computedWithholding;
  const grandTotal = invoice.grandTotal ?? computedGrandTotal;
  const payableAmount = invoice.payableAmount ?? computedPayableAmount;
  const paidAmount = invoice.paidAmount ?? 0;
  const remainingAmount = invoice.remainingAmount ?? (payableAmount - paidAmount);
  const hasDiscounts = totalDiscount > 0 || computedItems.some((i) => (i.discountAmount && i.discountAmount > 0) || (i.discountRate && i.discountRate > 0));

  const contactName = invoice.contactName || contact?.name || "Belirtilmemiş Müşteri / Tedarikçi";
  const contactTaxOffice = invoice.taxOffice || contact?.taxOffice || "-";
  const contactTaxNo = invoice.taxNumber || contact?.taxNumber || "-";
  const customerBranchName = (invoice.customerBranchName || contact?.branchName || "").trim();
  const customerBranchCode = (invoice.customerBranchCode || contact?.branchCode || "").trim();
  const rawContactAddress = (
    invoice.customerAddress ||
    contact?.address ||
    [contact?.neighborhood, contact?.street, contact?.buildingNo, contact?.doorNo]
      .filter(Boolean)
      .join(" ") ||
    ""
  ).trim();
  const contactCity = (invoice.customerCity || contact?.city || "").trim();
  const contactDistrict = (invoice.customerDistrict || contact?.district || "").trim();
  const contactAddress =
    formatAddressWithBranch(
      rawContactAddress,
      contactCity,
      contactDistrict,
      customerBranchName,
      customerBranchCode
    ) || "Adres Belirtilmemiş";
  const sellerBranchName = (invoice.branchName || "").trim();
  const sellerBranchCode = (invoice.branchCode || "").trim();
  const sellerAddress =
    formatAddressWithBranch(
      invoice.branchAddress || companySettings?.address,
      invoice.branchCity || companySettings?.city,
      invoice.branchDistrict || companySettings?.district,
      sellerBranchName,
      sellerBranchCode
    ) ||
    [companySettings?.address, companySettings?.city].filter(Boolean).join(", ") ||
    "Adres bilgisi girilmemiş";
  const contactPhone = invoice.customerPhone || contact?.phone || "-";
  const contactEmail = invoice.customerEmail || contact?.email || "-";
  const isManualCustomer = invoice.isManualCustomer || (!contact && !invoice.contactId?.startsWith("cnt_"));
  const accountCode = contact ? getContactAccountCode(contact) : (invType === "sales" ? "120.00000" : "320.00000");

  const writtenAmount = numberToTurkishWords(payableAmount);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      printHtmlElement("invoice-preview-paper", `${invNumber}_Fatura`);
    }
  };

  const handleDownloadPDF = async () => {
    if (onDownloadPDF) {
      onDownloadPDF();
      return;
    }
    setIsDownloading(true);
    try {
      const fileName = `${invNumber}_Fatura.pdf`;
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

    // Summary totals rows
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
      subtitle={`Resmi e-Fatura / e-Arşiv A4 Önizleme & Yazdırma Belgesi • Düzenleme: ${formatDate(issueDate)}`}
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
              : invType === "sales"
              ? "bg-indigo-50 text-indigo-800 border-indigo-200"
              : "bg-emerald-50 text-emerald-800 border-emerald-200"
          }`}
        >
          {isDraft ? "TASLAK ÖNİZLEME" : invType === "sales" ? "SATIŞ FATURASI" : "ALIŞ FATURASI"}
        </span>
      }
      headerIcon={<FileText className="w-5 h-5 text-indigo-600" />}
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
            className="bg-slate-800 hover:bg-slate-700 text-slate-100 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>Yazdır</span>
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
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top ERP Metric Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
          {/* Card 1: Toplam Tutar */}
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

          {/* Card 2: Tahsilat Durumu */}
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
                    : "Cari (Açık Hesap)"}
                </span>
              )}
              <span>
                {paidAmount > 0 ? `Tahsil Edilen: ${currSymbol}${paidAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}` : "Açık Bakiye"}
              </span>
            </div>
          </div>

          {/* Card 3: Tarih & Vade */}
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

          {/* Card 4: Resmi e-Belge & GİB */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              e-Belge / GİB Durumu
            </span>
            <div className="text-sm font-bold text-purple-700 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{isDraft ? "Taslak Belge" : "GİB Sistemine Kayıtlı"}</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1 truncate">
              {invoice.invoiceScenario || "TICARIFATURA"} • {invoice.invoiceProfileType || "SATIS"}
            </div>
          </div>
        </div>

        {/* Paper Container Desk Wrapper */}
        <div className="bg-slate-200/50 p-3 sm:p-6 md:p-8 rounded-3xl border border-slate-300/70 shadow-inner flex justify-center print:bg-white print:p-0 print:border-none print:shadow-none">
          <div
            id="invoice-preview-paper"
            className="bg-white text-slate-900 p-6 sm:p-10 border border-slate-300/80 rounded-2xl shadow-xl w-full max-w-[850px] space-y-6 print:border-none print:p-0 print:shadow-none print:rounded-none"
          >
            {/* Header / Company Banner */}
            <div className="flex flex-col sm:flex-row items-start justify-between border-b-2 border-slate-900 pb-6 gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <Logo size="md" src={companySettings?.logoUrl || "/logo.svg"} />
                </div>
                <h1 className="text-base font-extrabold tracking-tight text-slate-900">
                  {companySettings?.companyName || "FİRMA ÜNVANI"}
                </h1>
                <p className="text-xs font-medium text-slate-600 max-w-sm">
                  {companySettings?.companyTitle || companySettings?.companyName}
                </p>
                {sellerBranchName && (
                  <p className="text-xs font-bold text-purple-800">
                    Şube: {sellerBranchName}{sellerBranchCode ? ` (${sellerBranchCode})` : ""}
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  {sellerAddress}
                </p>
                <p className="text-xs text-slate-500">
                  Tel: {companySettings?.phone || "-"} | E-posta: {companySettings?.email || "-"}
                </p>
              </div>

              <div className="text-left sm:text-right space-y-1.5 shrink-0">
                <div className={`inline-block text-white text-xs font-bold uppercase px-3 py-1 rounded tracking-wider ${
                  invoice.docKind === "receipt"
                    ? invType === "sales"
                      ? "bg-indigo-700"
                      : "bg-amber-700"
                    : "bg-slate-900"
                }`}>
                  {invoice.docKind === "receipt"
                    ? invType === "sales"
                      ? "GELİR / PERAKENDE SATIŞ FİŞİ"
                      : "GİDER / MASRAF FİŞİ"
                    : invType === "sales"
                    ? "e-ARŞİV FATURA"
                    : "ALIŞ (GİDER) FATURASI"}
                </div>
                {(invoice.invoiceScenario || invoice.invoiceProfileType || invoice.paymentMethod) && (
                  <div className="flex flex-wrap items-center justify-start sm:justify-end gap-1.5 pt-0.5">
                    {invoice.invoiceScenario && (
                      <span className="text-[10px] font-mono font-bold bg-purple-50 text-purple-800 px-2 py-0.5 rounded border border-purple-200">
                        SENARYO: {invoice.invoiceScenario}
                      </span>
                    )}
                    {invoice.invoiceProfileType && (
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-300">
                        TİP: {invoice.invoiceProfileType}
                      </span>
                    )}
                    {invoice.paymentMethod && (
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          invoice.paymentMethod === "nakit"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : invoice.paymentMethod === "kredi_karti"
                            ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                            : invoice.paymentMethod === "eft_havale"
                            ? "bg-sky-50 text-sky-800 border-sky-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        ÖDEME:{" "}
                        {invoice.paymentMethod === "nakit"
                          ? "NAKİT"
                          : invoice.paymentMethod === "kredi_karti"
                          ? "KREDİ KARTI"
                          : invoice.paymentMethod === "eft_havale"
                          ? "EFT / HAVALE"
                          : "CARİ HESAP"}
                      </span>
                    )}
                  </div>
                )}
                <div className="text-xs font-mono font-bold text-slate-900">
                  {invoice.docKind === "receipt" ? "FİŞ NO:" : "FATURA NO:"} {invNumber}
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  ETTN: {invoice.id ? `8a491029-3810-4b10-${invoice.id.slice(0, 8)}` : "8a491029-3810-4b10-8201-948123019283"}
                </div>
                <div className="text-xs text-slate-600">
                  <strong>{invoice.docKind === "receipt" ? "Düzenleme Tarihi:" : "Fatura Tarihi:"}</strong> {formatDate(issueDate)}
                </div>
                <div className="text-xs text-slate-600">
                  <strong>Son Ödeme / Vade:</strong> {formatDate(dueDate)}
                </div>
              </div>
            </div>

            {/* Seller & Customer Information Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Seller */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-indigo-700 block tracking-wider">
                    SATICI BİLGİLERİ
                  </span>
                  {sellerBranchName && (
                    <span className="font-mono text-[10px] bg-purple-100 text-purple-800 border border-purple-200 font-bold px-1.5 py-0.5 rounded">
                      Şube: {sellerBranchName}{sellerBranchCode ? ` (${sellerBranchCode})` : ""}
                    </span>
                  )}
                </div>
                <p className="font-extrabold text-slate-900">
                  {companySettings?.companyTitle || companySettings?.companyName}
                </p>
                {companySettings?.taxpayerType && (
                  <p className="text-slate-600">
                    Mükellefiyet Türü: <strong>{companySettings.taxpayerType}</strong>
                  </p>
                )}
                <p className="text-slate-600">
                  Vergi Dairesi: <strong>{companySettings?.taxOffice || "-"}</strong>
                </p>
                <p className="text-slate-600">
                  VKN / TCKN: <strong>{companySettings?.taxNumber || "-"}</strong>
                </p>
                {companySettings?.mersisNo && (
                  <p className="text-slate-600">Mersis No: {companySettings.mersisNo}</p>
                )}
                <p className="text-slate-600 font-medium pt-1">
                  <strong>Adres:</strong> {sellerAddress}
                </p>
              </div>

              {/* Buyer */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="text-[10px] font-black uppercase text-indigo-700 block tracking-wider">
                    ALICI / MÜŞTERİ BİLGİLERİ
                  </span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {customerBranchName && (
                      <span className="font-mono text-[10px] bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold px-1.5 py-0.5 rounded">
                        Şube: {customerBranchName}{customerBranchCode ? ` (${customerBranchCode})` : ""}
                      </span>
                    )}
                    {isManualCustomer ? (
                      <span className="font-mono text-[10px] bg-amber-100 text-amber-800 border border-amber-200 font-bold px-1.5 py-0.5 rounded">
                        Münferit / Elle Giriş
                      </span>
                    ) : accountCode ? (
                      <span className="font-mono text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                        Cari Kodu: {accountCode}
                      </span>
                    ) : null}
                  </div>
                </div>
                <p className="font-extrabold text-slate-900">{contactName}</p>
                <p className="text-slate-600">
                  Vergi Dairesi: <strong>{contactTaxOffice}</strong>
                </p>
                <p className="text-slate-600">
                  VKN / TCKN: <strong>{contactTaxNo}</strong>
                </p>
                <p className="text-slate-600 font-medium">
                  <strong>Adres:</strong> {contactAddress}
                </p>
                <p className="text-slate-500">
                  Tel: {contactPhone} {contactEmail && contactEmail !== "-" ? `| E-posta: ${contactEmail}` : ""}
                </p>
              </div>
            </div>

            {/* Invoice Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-x-auto custom-scrollbar w-full">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead>
                  <tr className="bg-sky-100 text-sky-950 border-b border-sky-200 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3 bg-sky-100">Sıra</th>
                    <th className="py-2.5 px-3 bg-sky-100">Mal / Hizmet Açıklaması</th>
                    <th className="py-2.5 px-3 text-center bg-sky-100">Miktar</th>
                    <th className="py-2.5 px-3 text-center bg-sky-100">Birim</th>
                    <th className="py-2.5 px-3 text-right bg-sky-100">Birim Fiyat</th>
                    {hasDiscounts && (
                      <>
                        <th className="py-2.5 px-3 text-right bg-sky-100">İskonto</th>
                        <th className="py-2.5 px-3 text-center bg-sky-100">İskonto %</th>
                      </>
                    )}
                    <th className="py-2.5 px-3 text-center bg-sky-100">KDV %</th>
                    <th className="py-2.5 px-3 text-right bg-sky-100">KDV Tutarı</th>
                    <th className="py-2.5 px-3 text-right bg-sky-100">Toplam Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {computedItems.length === 0 ? (
                    <tr>
                      <td colSpan={hasDiscounts ? 10 : 8} className="py-6 text-center text-slate-400 font-medium">
                        Faturada henüz kalem bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    computedItems.map((item, idx) => {
                      const withholdingBadge = formatWithholdingBadge(item);
                      const isSpecialTaxBase = item.specialTaxBase !== undefined && item.specialTaxBase !== null;
                      const isExempt = item.exemptionCode || item.vatRate === 0;

                      return (
                      <tr key={item.id || idx} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3 font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span>{item.description || "Hizmet / Ürün Kalemi"}</span>
                            {item.expenseCategory && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                                {item.expenseCategory}
                              </span>
                            )}
                            {withholdingBadge && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                Tevkifat: {withholdingBadge}
                              </span>
                            )}
                            {isSpecialTaxBase && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                Özel Matrah: {currSymbol}{Number(item.specialTaxBase).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                              </span>
                            )}
                            {isExempt && item.exemptionCode && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                İstisna: {item.exemptionCode}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-bold">{item.quantity}</td>
                        <td className="py-3 px-3 text-center text-slate-600">{item.unit || "Adet"}</td>
                        <td className="py-3 px-3 text-right font-mono">
                          {currSymbol}
                          {(item.unitPrice || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </td>
                        {hasDiscounts && (
                          <>
                            <td className="py-3 px-3 text-right font-mono text-rose-700 font-medium">
                              {item.discountAmount && item.discountAmount > 0
                                ? `-${currSymbol}${item.discountAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`
                                : "-"}
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-rose-700">
                              {item.discountRate && item.discountRate > 0 ? `%${item.discountRate}` : "-"}
                            </td>
                          </>
                        )}
                        <td className="py-3 px-3 text-center font-bold">%{item.vatRate || 0}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          {currSymbol}
                          {(item.vatAmount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right font-black font-mono text-slate-900">
                          {currSymbol}
                          {(item.totalWithVat || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Calculations & Notes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start pt-2">
              {/* Written Amount, IBAN & Notes */}
              <div className="space-y-3">
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs">
                  <span className="text-[10px] font-black uppercase text-indigo-800 block">
                    YALNIZ
                  </span>
                  <p className="font-extrabold text-indigo-950 mt-0.5">
                    # {writtenAmount} #
                  </p>
                </div>

                {(invoice.paymentIban ||
                  companySettings?.defaultBankIban ||
                  companySettings?.iban ||
                  companySettings?.defaultBankName ||
                  companySettings?.defaultBankAccountName) && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      FATURAYA BASILACAK VARSAYILAN BANKA BİLGİLERİ (HAVALE / EFT)
                    </span>
                    <div className="space-y-1">
                      <p className="text-slate-700">
                        <span className="font-semibold text-slate-500">Banka Adı:</span>{" "}
                        <strong className="text-slate-900">
                          {invoice.paymentAccountName ||
                            companySettings?.defaultBankName ||
                            companySettings?.bankName ||
                            "-"}
                        </strong>
                      </p>
                      <p className="text-slate-700">
                        <span className="font-semibold text-slate-500">Hesap Sahibi:</span>{" "}
                        <strong className="text-slate-900">
                          {invoice.paymentAccountHolderName ||
                            companySettings?.defaultBankAccountName ||
                            companySettings?.companyTitle ||
                            companySettings?.companyName ||
                            "-"}
                        </strong>
                      </p>
                      <p className="text-slate-700">
                        <span className="font-semibold text-slate-500">IBAN:</span>{" "}
                        <strong className="font-mono text-slate-900">
                          {invoice.paymentIban ||
                            companySettings?.defaultBankIban ||
                            companySettings?.iban ||
                            "-"}
                        </strong>
                      </p>
                    </div>
                  </div>
                )}

                {(() => {
                  const legalNotes = generateInvoiceLegalTaxNotes(
                    invoice.items || [],
                    invoice.invoiceProfileType,
                    currSymbol
                  );
                  if (legalNotes.length === 0) return null;
                  return (
                    <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl text-xs text-purple-950 space-y-1.5">
                      <span className="text-[10px] font-black uppercase text-purple-900 tracking-wider block">
                        GİB RESMİ VERGİ BİLGİLERİ VE YASAL ŞERHLER
                      </span>
                      <div className="space-y-1">
                        {legalNotes.map((ln, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-[11px] leading-relaxed">
                            <span className="font-bold text-purple-700 shrink-0">•</span>
                            <p>{ln}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {(() => {
                  const rawNotes = (invoice.notes || "").trim();
                  const isSales = invoice.type === "sales";
                  const brName = (invoice.branchName || companySettings?.branchName || "Merkez").trim();
                  const brCode = (invoice.branchCode || companySettings?.branchCode || "").trim();
                  const brAddr = (invoice.branchAddress || companySettings?.address || "").replace(/\s*\((?:Şube|Merkez):[^)]+\)\s*$/i, "").trim();
                  const branchLine =
                    isSales && brAddr && !rawNotes.toLowerCase().includes("şube adresi")
                      ? `Şube Adresi (${brName}${brCode ? ` - ${brCode}` : ""}): ${brAddr}`
                      : "";
                  const finalNotes = [branchLine, rawNotes].filter(Boolean).join("\n");
                  if (!finalNotes) return null;
                  return (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">
                        FATURA NOTU
                      </span>
                      <p className="whitespace-pre-line leading-relaxed">{finalNotes}</p>
                    </div>
                  );
                })()}
              </div>

              {/* Totals Summary */}
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-2 text-xs">
                {totalDiscount > 0 && (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Brüt Tutar (İskonto Öncesi):</span>
                      <span className="font-mono font-bold">
                        {currSymbol}
                        {grossTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-rose-700 bg-rose-50 p-1.5 rounded-lg border border-rose-100 font-medium">
                      <span className="font-bold">(-) Toplam İskonto:</span>
                      <span className="font-mono font-bold">
                        -{currSymbol}
                        {totalDiscount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>{totalDiscount > 0 ? "Ara Toplam (Net Matrah):" : "Ara Toplam (Matrah):"}</span>
                  <span className="font-mono font-bold">
                    {currSymbol}
                    {subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Detailed Tax Breakdown from taxItems if present */}
                {invoice.taxItems && invoice.taxItems.length > 0 ? (
                  <div className="py-1 my-1 border-y border-dashed border-slate-300 space-y-1">
                    <span className="text-[10px] font-black uppercase text-purple-900 tracking-wider block">
                      Vergi Kalemleri Dökümü
                    </span>
                    {invoice.taxItems.map((tax, tIdx) => (
                      <div key={tax.id || tIdx} className="flex justify-between text-slate-700 text-[11px] pl-1">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block"></span>
                          <span>{tax.taxName || tax.taxType}</span>
                          {tax.rate !== undefined && tax.rate > 0 && !tax.taxName.includes(`%${tax.rate}`) && (
                            <span className="text-slate-500 font-semibold">(%{tax.rate})</span>
                          )}
                          {tax.taxableAmount !== undefined && tax.taxableAmount > 0 && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              [Matrah: {currSymbol}{tax.taxableAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}]
                            </span>
                          )}
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {tax.taxType === "KDV Tevkifatı" || tax.taxType === "Stopaj" ? "-" : "+"}
                          {currSymbol}
                          {tax.taxAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Hesaplanan Toplam KDV:</span>
                      <span className="font-mono font-bold">
                        {currSymbol}
                        {totalVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {invoice.totalOtv && invoice.totalOtv > 0 && (
                      <div className="flex justify-between text-purple-700">
                        <span>Özel Tüketim Vergisi (ÖTV):</span>
                        <span className="font-mono font-bold">
                          +{currSymbol}
                          {invoice.totalOtv.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    {invoice.totalOiv && invoice.totalOiv > 0 && (
                      <div className="flex justify-between text-purple-700">
                        <span>Özel İletişim Vergisi (ÖİV):</span>
                        <span className="font-mono font-bold">
                          +{currSymbol}
                          {invoice.totalOiv.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    {invoice.totalAccommodationTax && invoice.totalAccommodationTax > 0 && (
                      <div className="flex justify-between text-purple-700">
                        <span>Konaklama Vergisi (%2):</span>
                        <span className="font-mono font-bold">
                          +{currSymbol}
                          {invoice.totalAccommodationTax.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    {invoice.totalStampTax && invoice.totalStampTax > 0 && (
                      <div className="flex justify-between text-purple-700">
                        <span>Damga Vergisi:</span>
                        <span className="font-mono font-bold">
                          +{currSymbol}
                          {invoice.totalStampTax.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    {totalWithholding > 0 && (
                      <div className="flex justify-between text-amber-700">
                        <span>Hesaplanan Tevkifat Tutarı:</span>
                        <span className="font-mono font-bold">
                          -{currSymbol}
                          {totalWithholding.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    {invoice.totalStopaj && invoice.totalStopaj > 0 && (
                      <div className="flex justify-between text-amber-700">
                        <span>Stopaj Kesintisi:</span>
                        <span className="font-mono font-bold">
                          -{currSymbol}
                          {invoice.totalStopaj.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {totalWithholding > 0 && (
                  <div className="flex justify-between text-purple-800 bg-purple-50 p-1.5 rounded-lg border border-purple-200">
                    <span className="font-bold">(-) Tevkif Edilen KDV (Alıcı KDV2 ile öder):</span>
                    <span className="font-mono font-bold">
                      -{currSymbol}
                      {totalWithholding.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                  <span>Fatura Toplamı:</span>
                  <span className="font-mono font-bold">
                    {currSymbol}
                    {grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div
                  style={{
                    backgroundColor: "#83b8ff",
                    borderColor: "#60a5fa",
                    WebkitPrintColorAdjust: "exact",
                    printColorAdjust: "exact",
                  }}
                  className="p-2.5 rounded-lg border flex justify-between items-center text-sm font-black text-slate-950 mt-1 print:bg-[#83b8ff]"
                >
                  <span className="text-xs uppercase tracking-wide">🎯 ÖDENECEK / İŞLEM TUTARI BAKİYE:</span>
                  <span className="text-lg font-mono font-black text-slate-950">
                    {currSymbol}
                    {payableAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {paidAmount > 0 && (
                  <div className="pt-2 border-t border-slate-200 space-y-1 text-[11px]">
                    <div className="flex justify-between text-emerald-700">
                      <span>Tahsil Edilen / Ödenen Tutar:</span>
                      <span className="font-mono font-bold">
                        {currSymbol}
                        {paidAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-rose-700 font-bold">
                      <span>Kalan AÇIK Bakiye:</span>
                      <span className="font-mono">
                        {currSymbol}
                        {remainingAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stamp & Legal Seals */}
            <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs gap-4">
              <div className="flex items-center gap-3 text-slate-500">
                <div className="w-14 h-14 bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center p-1 shrink-0">
                  <QrCode className="w-10 h-10 text-slate-800" />
                </div>
                <div>
                  <p className="font-bold text-slate-700">e-Arşiv Karekod Doğrulama</p>
                  <p className="text-[10px] text-slate-400">
                    Bu fatura 5070 sayılı Elektronik İmza Kanunu kapsamında üretilmiştir.
                  </p>
                </div>
              </div>

              <div className="text-center w-48 space-y-1 shrink-0">
                <p className="font-bold text-slate-800">Düzenleyen Kaşe / İmza</p>
                <div className="h-12 border-b border-dashed border-slate-300"></div>
                <p className="text-[10px] text-slate-400">{companySettings?.companyName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Share Modal */}
      <UniversalWhatsAppModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        title="WhatsApp ile Fatura Paylaş"
        documentTypeLabel={isDraft ? "Taslak Fatura" : invType === "sales" ? "Satış e-Arşiv Faturası" : "Alış Faturası"}
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
    </DetailPageLayout>
  );
};
