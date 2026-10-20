import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import {
  Printer,
  Download,
  X,
  ZoomIn,
  ZoomOut,
  Layers,
  FileText,
  Sparkles,
  QrCode,
  Upload,
  Eye,
  EyeOff,
  Palette,
  Building2,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import {
  subscribePrintModal,
  closePrintModal,
  printViaIsolatedIframe,
  PrintModalData,
} from "../../utils/printEngine";
import { exportElementToPDFWithPrintStyling } from "../../utils/pdfService";
import { getCurrencySymbol, formatDate } from "../../utils/exportUtils";
import { numberToTurkishWords } from "../../utils/numberToTurkishWords";
import {
  computeInvoiceTotals,
  formatWithholdingBadge,
  generateInvoiceLegalTaxNotes,
} from "../../utils/taxCalculationService";
import { formatAddressWithBranch } from "../../utils/storage";
import { getContactAccountCode, InvoiceItem } from "../../types";
import { Logo } from "../Logo";
import { readAndOptimizeLogoFile } from "../../utils/logoUpload";
import { saveCloudLogo } from "../../services/cloudBrandingService";

type InvoicePdfTheme = "navy" | "royal" | "classic";

const THEME_CONFIG: Record<
  InvoicePdfTheme,
  {
    label: string;
    primaryBg: string;
    primaryText: string;
    accentBg: string;
    accentBorder: string;
    accentLightBg: string;
    tableHeaderBg: string;
    tableHeaderText: string;
    qrDark: string;
  }
> = {
  navy: {
    label: "Resmi Kurumsal (Lacivert)",
    primaryBg: "#0f172a",
    primaryText: "#0f172a",
    accentBg: "#1e3a8a",
    accentBorder: "#cbd5e1",
    accentLightBg: "#f8fafc",
    tableHeaderBg: "#0f172a",
    tableHeaderText: "#ffffff",
    qrDark: "#0f172a",
  },
  royal: {
    label: "Modern İndigo",
    primaryBg: "#312e81",
    primaryText: "#1e1b4b",
    accentBg: "#4338ca",
    accentBorder: "#c7d2fe",
    accentLightBg: "#eef2ff",
    tableHeaderBg: "#312e81",
    tableHeaderText: "#ffffff",
    qrDark: "#1e1b4b",
  },
  classic: {
    label: "Lazer Baskı (Siyah/Beyaz)",
    primaryBg: "#111827",
    primaryText: "#111827",
    accentBg: "#1f2937",
    accentBorder: "#9ca3af",
    accentLightBg: "#f9fafb",
    tableHeaderBg: "#f3f4f6",
    tableHeaderText: "#111827",
    qrDark: "#000000",
  },
};

export const UniversalPrintModal: React.FC = () => {
  const [modalData, setModalData] = useState<PrintModalData | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [currentOrientation, setCurrentOrientation] = useState<"portrait" | "landscape">("portrait");
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  // Invoice PDF Template Customization States
  const [pdfTheme, setPdfTheme] = useState<InvoicePdfTheme>("navy");
  const [showQrCode, setShowQrCode] = useState<boolean>(true);
  const [showCompanyLogo, setShowCompanyLogo] = useState<boolean>(true);
  const [logoScale, setLogoScale] = useState<"sm" | "md" | "lg">("md");
  const [customLogoOverride, setCustomLogoOverride] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = subscribePrintModal((data) => {
      setModalData(data);
      if (data) {
        setCurrentOrientation(data.orientation || "portrait");
        setZoomLevel(100);
        setCustomLogoOverride(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const isInvoiceMode = Boolean(
    modalData?.isOpen &&
      modalData?.documentType === "invoice" &&
      modalData?.invoiceData?.invoice
  );

  // Generate Official GIB e-Fatura / e-Arşiv QR Code when in invoice mode
  useEffect(() => {
    if (!isInvoiceMode || !modalData?.invoiceData) {
      setQrCodeDataUrl("");
      return;
    }

    const { invoice, companySettings, contact } = modalData.invoiceData;
    const invType = invoice.type || "sales";
    const invNumber = invoice.invoiceNumber || "TASLAK-0001";
    const issueDate = invoice.issueDate || new Date().toISOString().split("T")[0];
    const items: InvoiceItem[] = invoice.items || [];
    const currency = invoice.currency || companySettings?.currency || "TRY";

    const { subtotal, totalVat, grandTotal, payableAmount } = computeInvoiceTotals(items);
    const finalSubtotal = invoice.subtotal ?? subtotal;
    const finalVat = invoice.totalVat ?? totalVat;
    const finalGrand = invoice.grandTotal ?? grandTotal;
    const finalPayable = invoice.payableAmount ?? payableAmount;

    const ettn = invoice.id
      ? `8a491029-3810-4b10-9201-${String(invoice.id).replace(/[^a-zA-Z0-9]/g, "").padEnd(12, "0").slice(0, 12)}`
      : "8a491029-3810-4b10-8201-948123019283";

    const sellerVkn = companySettings?.taxNumber || "1111111111";
    const buyerVkn = invoice.taxNumber || contact?.taxNumber || "11111111111";

    const qrPayload = JSON.stringify({
      vkntckn: sellerVkn,
      avkntckn: buyerVkn,
      senaryo: invoice.invoiceScenario || "TICARIFATURA",
      tip: invoice.invoiceProfileType || (invType === "sales" ? "SATIS" : "ALIS"),
      tarih: issueDate,
      no: invNumber,
      ettn,
      parabirimi: currency,
      malhizmettoplam: finalSubtotal.toFixed(2),
      hesaplanankdv: finalVat.toFixed(2),
      vergilerdahil: finalGrand.toFixed(2),
      odenecek: finalPayable.toFixed(2),
    });

    const themeConf = THEME_CONFIG[pdfTheme];

    QRCode.toDataURL(qrPayload, {
      width: 280,
      margin: 1,
      errorCorrectionLevel: "M",
      color: {
        dark: themeConf.qrDark,
        light: "#ffffff",
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error("Invoice QR generation error:", err));
  }, [isInvoiceMode, modalData, pdfTheme]);

  if (!modalData || !modalData.isOpen) return null;

  const handleClose = () => {
    closePrintModal();
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const optimizedDataUrl = await readAndOptimizeLogoFile(file);
      setCustomLogoOverride(optimizedDataUrl);
      setShowCompanyLogo(true);
      if (modalData.invoiceData?.companySettings) {
        const updatedSettings = {
          ...modalData.invoiceData.companySettings,
          logoUrl: optimizedDataUrl,
        };
        modalData.invoiceData.onSaveCompanySettings?.(updatedSettings);
        void saveCloudLogo(optimizedDataUrl, {
          brandName: updatedSettings.companyName || "E-MUAVİN",
          description: "Fatura PDF şablonu üzerinden güncellenen şirket logosu",
        });
      }
    } catch (err) {
      console.error("Logo yükleme hatası:", err);
    } finally {
      e.target.value = "";
    }
  };

  const handleDirectPrint = async () => {
    setIsPrinting(true);
    try {
      if (previewContainerRef.current) {
        await printViaIsolatedIframe(
          previewContainerRef.current,
          modalData.title || "Belge_Yazdir",
          currentOrientation
        );
      } else {
        window.print();
      }
    } catch (err) {
      console.warn("Direct print attempt failed:", err);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    try {
      const fileName = `${(modalData.title || "Belge").trim().replace(/[\s/\\:]+/g, "_")}.pdf`;
      // When in Invoice Template mode, always export the live rendered #universal-print-preview-paper
      const elToExport = isInvoiceMode
        ? "universal-print-preview-paper"
        : modalData.sourceElementId && document.getElementById(modalData.sourceElementId)
        ? modalData.sourceElementId
        : "universal-print-preview-paper";

      const res = await exportElementToPDFWithPrintStyling(elToExport, fileName, {
        orientation: currentOrientation === "landscape" ? "l" : "p",
        margin: currentOrientation === "landscape" ? 6 : 8,
        scale: 1.8,
        fitToSinglePage: true,
      });

      if (res) {
        res.pdf.save(res.fileName);
      }
    } catch (err) {
      console.error("Universal Print PDF export error:", err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const renderInvoicePdfTemplate = () => {
    if (!modalData.invoiceData) return null;
    const { invoice, companySettings, contact, isDraft } = modalData.invoiceData;
    const themeConf = THEME_CONFIG[pdfTheme];

    const invType = invoice.type || "sales";
    const invNumber = invoice.invoiceNumber || "TASLAK-0001";
    const issueDate = invoice.issueDate || new Date().toISOString().split("T")[0];
    const dueDate = invoice.dueDate || issueDate;
    const items: InvoiceItem[] = invoice.items || [];
    const currency = invoice.currency || companySettings?.currency || "TRY";
    const currSymbol = getCurrencySymbol(currency);

    const {
      grossTotal: computedGrossTotal,
      totalDiscount: computedTotalDiscount,
      subtotal: computedSubtotal,
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
    const remainingAmount = invoice.remainingAmount ?? payableAmount - paidAmount;
    const hasDiscounts =
      totalDiscount > 0 ||
      computedItems.some(
        (i) => (i.discountAmount && i.discountAmount > 0) || (i.discountRate && i.discountRate > 0)
      );

    const contactName =
      invoice.contactName || contact?.companyTitle || contact?.name || "Belirtilmemiş Müşteri / Cari";
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
    const contactPhone = invoice.customerPhone || contact?.phone || "-";
    const contactEmail = invoice.customerEmail || contact?.email || "-";
    const accountCode = contact
      ? getContactAccountCode(contact)
      : invType === "sales"
      ? "120.01.001"
      : "320.01.001";

    const sellerBranchName = (invoice.branchName || companySettings?.branchName || "").trim();
    const sellerBranchCode = (invoice.branchCode || companySettings?.branchCode || "").trim();
    const sellerAddress =
      formatAddressWithBranch(
        invoice.branchAddress || companySettings?.address,
        invoice.branchCity || companySettings?.city,
        invoice.branchDistrict || companySettings?.district,
        sellerBranchName,
        sellerBranchCode
      ) ||
      [companySettings?.address, companySettings?.city].filter(Boolean).join(", ") ||
      "Merkez Adres";

    const ettn = invoice.id
      ? `8a491029-3810-4b10-9201-${String(invoice.id).replace(/[^a-zA-Z0-9]/g, "").padEnd(12, "0").slice(0, 12)}`
      : "8a491029-3810-4b10-8201-948123019283";

    const writtenAmount = numberToTurkishWords(payableAmount);
    const activeLogoSrc = customLogoOverride || companySettings?.logoUrl || "";
    const logoHeightClass =
      logoScale === "sm" ? "max-h-10" : logoScale === "lg" ? "max-h-20" : "max-h-14";

    const docTypeTitle =
      invoice.docKind === "receipt"
        ? invType === "sales"
          ? "PERAKENDE SATIŞ FİŞİ"
          : "GİDER / MASRAF FİŞİ"
        : invoice.invoiceScenario === "EARSIVFATURA"
        ? "e-ARŞİV FATURA"
        : invType === "sales"
        ? "e-FATURA / e-ARŞİV FATURA"
        : "ALIŞ (GİDER) FATURASI";

    const paymentMethodLabel =
      invoice.paymentMethod === "nakit"
        ? "Nakit Ödeme"
        : invoice.paymentMethod === "kredi_karti"
        ? "Kredi Kartı / POS"
        : invoice.paymentMethod === "eft_havale"
        ? "Banka Havale / EFT"
        : "Cari Açık Hesap";

    const legalNotes = generateInvoiceLegalTaxNotes(
      invoice.items || [],
      invoice.invoiceProfileType,
      currSymbol
    );

    const bankName =
      invoice.paymentAccountName ||
      companySettings?.defaultBankName ||
      companySettings?.bankName ||
      "";
    const bankHolder =
      invoice.paymentAccountHolderName ||
      companySettings?.defaultBankAccountName ||
      companySettings?.companyTitle ||
      companySettings?.companyName ||
      "";
    const bankIban =
      invoice.paymentIban ||
      companySettings?.defaultBankIban ||
      companySettings?.defaultIban ||
      companySettings?.iban ||
      "";

    return (
      <div className="space-y-5 text-slate-900 font-sans text-xs leading-normal">
        {/* Top Corporate Theme Accent Bar */}
        <div
          style={{
            backgroundColor: themeConf.primaryBg,
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          }}
          className="h-2 w-full rounded-t-lg"
        />

        {/* 1. THREE-COLUMN OFFICIAL E-DOCUMENT HEADER */}
        <div className="grid grid-cols-12 gap-4 items-start border-b-2 border-slate-900 pb-5">
          {/* Left Column: Company Logo & Seller Identity (5 cols) */}
          <div className="col-span-12 sm:col-span-5 space-y-2">
            {showCompanyLogo && (
              <div className="mb-2 flex items-center">
                {activeLogoSrc ? (
                  <img
                    src={activeLogoSrc}
                    alt={companySettings?.companyName || "Şirket Logosu"}
                    className={`${logoHeightClass} w-auto max-w-[220px] object-contain`}
                  />
                ) : (
                  <Logo size={logoScale} />
                )}
              </div>
            )}

            <div className="space-y-0.5">
              <h1
                style={{ color: themeConf.primaryText }}
                className="text-sm sm:text-base font-black uppercase tracking-tight leading-snug"
              >
                {companySettings?.companyTitle || companySettings?.companyName || "KURUMSAL FİRMA ÜNVANI"}
              </h1>
              {sellerBranchName && (
                <p className="text-[11px] font-bold text-slate-700">
                  Şube: {sellerBranchName}
                  {sellerBranchCode ? ` (${sellerBranchCode})` : ""}
                </p>
              )}
              <p className="text-[11px] text-slate-600 leading-snug">{sellerAddress}</p>
            </div>

            <div className="pt-1 space-y-0.5 text-[11px] text-slate-700">
              <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                <span>
                  <strong className="text-slate-900">Vergi Dairesi:</strong>{" "}
                  {companySettings?.taxOffice || "-"}
                </span>
                <span>
                  <strong className="text-slate-900">VKN / TCKN:</strong>{" "}
                  <span className="font-mono font-bold">{companySettings?.taxNumber || "-"}</span>
                </span>
              </div>
              {(companySettings?.mersisNo || companySettings?.tradeRegistryNo) && (
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-slate-600">
                  {companySettings?.mersisNo && (
                    <span>
                      <strong>Mersis No:</strong> {companySettings.mersisNo}
                    </span>
                  )}
                  {companySettings?.tradeRegistryNo && (
                    <span>
                      <strong>Tic. Sicil No:</strong> {companySettings.tradeRegistryNo}
                    </span>
                  )}
                </div>
              )}
              <div className="text-[10px] text-slate-600">
                <span>Tel: {companySettings?.phone || "-"}</span>
                {companySettings?.email ? ` • E-posta: ${companySettings.email}` : ""}
                {companySettings?.website ? ` • ${companySettings.website}` : ""}
              </div>
            </div>
          </div>

          {/* Center Column: Official GIB Seal & Document Type Title (3 cols) */}
          <div className="col-span-12 sm:col-span-3 flex flex-col items-center justify-center text-center py-1">
            <div
              style={{
                borderColor: themeConf.primaryBg,
                color: themeConf.primaryText,
              }}
              className="w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center p-1 shadow-2xs bg-white"
            >
              <span className="text-[8px] font-black tracking-widest uppercase leading-none">
                T.C. GİB
              </span>
              <span className="text-[11px] font-black tracking-tight leading-tight my-0.5">
                e-BELGE
              </span>
              <span className="text-[7px] font-bold uppercase tracking-wider text-slate-500 leading-none">
                RESMİ NÜSHA
              </span>
            </div>

            <div
              style={{
                backgroundColor: themeConf.primaryBg,
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact",
              }}
              className="mt-2.5 px-3 py-1 rounded text-white text-[11px] font-black uppercase tracking-wider"
            >
              {docTypeTitle}
            </div>

            {isDraft && (
              <span className="mt-1 text-[10px] font-extrabold uppercase tracking-widest text-amber-700">
                • TASLAK BELGE •
              </span>
            )}
          </div>

          {/* Right Column: Scannable QR Code & Invoice Metadata Table (4 cols) */}
          <div className="col-span-12 sm:col-span-4 flex flex-col items-end gap-2">
            <div className="flex items-start gap-2.5 w-full justify-end">
              {showQrCode && qrCodeDataUrl && (
                <div className="border border-slate-300 rounded-lg p-1.5 bg-white flex flex-col items-center shrink-0">
                  <img
                    src={qrCodeDataUrl}
                    alt="e-Belge Doğrulama Karekodu"
                    className="w-20 h-20 object-contain"
                  />
                  <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                    GİB KAREKOD
                  </span>
                </div>
              )}

              <div className="border border-slate-300 rounded-lg overflow-hidden text-[10px] w-full max-w-[215px]">
                <table className="w-full border-collapse">
                  <tbody className="divide-y divide-slate-200">
                    <tr className="bg-slate-50">
                      <td className="py-1 px-2 font-bold text-slate-600">Fatura No:</td>
                      <td className="py-1 px-2 font-mono font-black text-slate-900 text-right">
                        {invNumber}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 font-bold text-slate-600">Fatura Tarihi:</td>
                      <td className="py-1 px-2 font-mono font-semibold text-slate-900 text-right">
                        {formatDate(issueDate)}
                      </td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="py-1 px-2 font-bold text-slate-600">Vade Tarihi:</td>
                      <td className="py-1 px-2 font-mono font-semibold text-slate-900 text-right">
                        {formatDate(dueDate)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 font-bold text-slate-600">Senaryo:</td>
                      <td className="py-1 px-2 font-mono font-bold text-slate-800 text-right">
                        {invoice.invoiceScenario || "TICARIFATURA"}
                      </td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="py-1 px-2 font-bold text-slate-600">Fatura Tipi:</td>
                      <td className="py-1 px-2 font-mono font-bold text-slate-800 text-right">
                        {invoice.invoiceProfileType || (invType === "sales" ? "SATIS" : "ALIS")}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 font-bold text-slate-600">Ödeme Şekli:</td>
                      <td className="py-1 px-2 font-bold text-slate-800 text-right">
                        {paymentMethodLabel}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* 2. ETTN & ELECTRONIC SIGNATURE IDENTIFIER BAR */}
        <div
          style={{
            backgroundColor: themeConf.accentLightBg,
            borderColor: themeConf.accentBorder,
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          }}
          className="px-3.5 py-1.5 rounded-lg border flex flex-wrap items-center justify-between gap-2 text-[10px]"
        >
          <div className="flex items-center gap-2">
            <span className="font-black uppercase tracking-wider text-slate-700">ETTN:</span>
            <span className="font-mono font-bold text-slate-900">{ettn}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-600 font-medium">
            <span>Özelleştirme No: <strong className="font-mono text-slate-800">TR1.2</strong></span>
            <span>•</span>
            <span>Para Birimi: <strong className="font-mono text-slate-800">{currency}</strong></span>
          </div>
        </div>

        {/* 3. BUYER (SAYIN / ALICI) & DELIVERY / ACCOUNT DETAILS */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-8 p-3.5 rounded-xl border border-slate-300 bg-white space-y-1.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1">
              <span
                style={{ color: themeConf.primaryText }}
                className="text-[10px] font-black uppercase tracking-wider"
              >
                SAYIN / ALICI (MÜŞTERİ) BİLGİLERİ
              </span>
              <span className="font-mono text-[10px] font-bold text-slate-600">
                Cari Kodu: {accountCode}
              </span>
            </div>
            <p className="text-sm font-black text-slate-900">{contactName}</p>
            {customerBranchName && (
              <p className="text-[11px] font-bold text-slate-700">
                Şube / Birim: {customerBranchName}
                {customerBranchCode ? ` (${customerBranchCode})` : ""}
              </p>
            )}
            <p className="text-[11px] text-slate-700">
              <strong className="text-slate-900">Adres:</strong> {contactAddress}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5 text-[11px] text-slate-700">
              <span>
                <strong className="text-slate-900">Vergi Dairesi:</strong> {contactTaxOffice}
              </span>
              <span>
                <strong className="text-slate-900">VKN / TCKN:</strong>{" "}
                <span className="font-mono font-bold">{contactTaxNo}</span>
              </span>
              {contactPhone && contactPhone !== "-" && (
                <span>
                  <strong className="text-slate-900">Tel:</strong> {contactPhone}
                </span>
              )}
              {contactEmail && contactEmail !== "-" && (
                <span>
                  <strong className="text-slate-900">E-posta:</strong> {contactEmail}
                </span>
              )}
            </div>
          </div>

          <div className="sm:col-span-4 p-3.5 rounded-xl border border-slate-300 bg-slate-50/60 flex flex-col justify-between space-y-2">
            <div>
              <div className="border-b border-slate-200 pb-1 mb-1.5">
                <span
                  style={{ color: themeConf.primaryText }}
                  className="text-[10px] font-black uppercase tracking-wider"
                >
                  MALİ & ÖDEME ÖZETİ
                </span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-600">Belge Durumu:</span>
                  <span className="font-bold text-slate-900">
                    {isDraft ? "Taslak" : remainingAmount <= 0 ? "Ödendi / Kapalı" : "Açık Fatura"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Kalem Sayısı:</span>
                  <span className="font-mono font-bold text-slate-900">{computedItems.length} Adet</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Ödeme Yöntemi:</span>
                  <span className="font-bold text-slate-900">{paymentMethodLabel}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
              <span className="text-[10px] font-black uppercase text-slate-600">Ödenecek Toplam:</span>
              <span
                style={{ color: themeConf.primaryText }}
                className="text-sm font-black font-mono"
              >
                {currSymbol}
                {payableAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* 4. INVOICE LINE ITEMS TABLE */}
        <div className="border border-slate-300 rounded-xl overflow-hidden">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr
                style={{
                  backgroundColor: themeConf.tableHeaderBg,
                  color: themeConf.tableHeaderText,
                  WebkitPrintColorAdjust: "exact",
                  printColorAdjust: "exact",
                }}
                className="uppercase text-[10px] font-bold tracking-wider border-b border-slate-300"
              >
                <th className="py-2 px-2.5 w-10 text-center">#</th>
                <th className="py-2 px-3">Mal / Hizmet Açıklaması</th>
                <th className="py-2 px-2.5 text-center">Miktar</th>
                <th className="py-2 px-2.5 text-center">Birim</th>
                <th className="py-2 px-2.5 text-right">Birim Fiyat</th>
                {hasDiscounts && (
                  <>
                    <th className="py-2 px-2.5 text-center">İsk. %</th>
                    <th className="py-2 px-2.5 text-right">İsk. Tutarı</th>
                  </>
                )}
                <th className="py-2 px-2.5 text-center">KDV %</th>
                <th className="py-2 px-2.5 text-right">KDV Tutarı</th>
                <th className="py-2 px-3 text-right">Mal / Hizmet Tutarı</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {computedItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={hasDiscounts ? 10 : 8}
                    className="py-6 text-center text-slate-400 font-medium"
                  >
                    Faturada henüz mal veya hizmet kalemi bulunmuyor.
                  </td>
                </tr>
              ) : (
                computedItems.map((item, idx) => {
                  const withholdingBadge = formatWithholdingBadge(item);
                  const isSpecialTaxBase =
                    item.specialTaxBase !== undefined && item.specialTaxBase !== null;
                  const isExempt = item.exemptionCode || item.vatRate === 0;

                  return (
                    <tr key={item.id || idx} className={idx % 2 === 1 ? "bg-slate-50/50" : "bg-white"}>
                      <td className="py-2 px-2.5 text-center font-mono text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900">
                        <div>{item.description || item.productName || "Mal / Hizmet Kalemi"}</div>
                        {(withholdingBadge || isSpecialTaxBase || (isExempt && item.exemptionCode)) && (
                          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[9px] text-slate-600 font-normal">
                            {withholdingBadge && (
                              <span>Tevkifat: <strong>{withholdingBadge}</strong></span>
                            )}
                            {isSpecialTaxBase && (
                              <span>
                                Özel Matrah:{" "}
                                <strong>
                                  {currSymbol}
                                  {Number(item.specialTaxBase).toLocaleString("tr-TR", {
                                    minimumFractionDigits: 2,
                                  })}
                                </strong>
                              </span>
                            )}
                            {isExempt && item.exemptionCode && (
                              <span>İstisna Kodu: <strong>{item.exemptionCode}</strong></span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2.5 text-center font-mono font-bold text-slate-900">
                        {item.quantity}
                      </td>
                      <td className="py-2 px-2.5 text-center text-slate-600">
                        {item.unit || "Adet"}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono text-slate-800">
                        {currSymbol}
                        {(item.unitPrice || 0).toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      {hasDiscounts && (
                        <>
                          <td className="py-2 px-2.5 text-center font-mono text-rose-700">
                            {item.discountRate && item.discountRate > 0
                              ? `%${item.discountRate}`
                              : "-"}
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono text-rose-700">
                            {item.discountAmount && item.discountAmount > 0
                              ? `-${currSymbol}${item.discountAmount.toLocaleString("tr-TR", {
                                  minimumFractionDigits: 2,
                                })}`
                              : "-"}
                          </td>
                        </>
                      )}
                      <td className="py-2 px-2.5 text-center font-mono font-bold text-slate-800">
                        %{item.vatRate || 0}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono text-slate-700">
                        {currSymbol}
                        {(item.vatAmount || 0).toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-black text-slate-900">
                        {currSymbol}
                        {(item.totalWithVat || 0).toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. BOTTOM CALCULATIONS, AMOUNT IN WORDS, BANK IBAN & NOTES */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
          {/* Left Column (7 cols): Written Amount, Bank IBAN, Legal & Custom Notes */}
          <div className="sm:col-span-7 space-y-2.5">
            <div
              style={{
                backgroundColor: themeConf.accentLightBg,
                borderColor: themeConf.accentBorder,
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact",
              }}
              className="p-2.5 rounded-lg border"
            >
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">
                YALNIZ (YAZIYLA ÖDENECEK TUTAR)
              </span>
              <p className="font-extrabold text-slate-900 text-xs mt-0.5"># {writtenAmount} #</p>
            </div>

            {(bankName || bankIban) && (
              <div className="p-2.5 rounded-lg border border-slate-300 bg-white space-y-1">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">
                  BANKA VE HAVALE / EFT IBAN BİLGİLERİ
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
                  {bankName && (
                    <p>
                      <span className="text-slate-500">Banka:</span>{" "}
                      <strong className="text-slate-900">{bankName}</strong>
                    </p>
                  )}
                  {bankHolder && (
                    <p>
                      <span className="text-slate-500">Alıcı:</span>{" "}
                      <strong className="text-slate-900">{bankHolder}</strong>
                    </p>
                  )}
                  {bankIban && (
                    <p className="sm:col-span-2">
                      <span className="text-slate-500">IBAN:</span>{" "}
                      <strong className="font-mono text-slate-900 tracking-wide">{bankIban}</strong>
                    </p>
                  )}
                </div>
              </div>
            )}

            {legalNotes.length > 0 && (
              <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50 space-y-1 text-[10px]">
                <span className="font-black uppercase tracking-wider text-slate-700 block">
                  GİB RESMİ VERGİ ŞERHLERİ VE YASAL İBARELER
                </span>
                {legalNotes.map((ln, idx) => (
                  <p key={idx} className="text-slate-700 leading-snug">
                    • {ln}
                  </p>
                ))}
              </div>
            )}

            {invoice.notes && invoice.notes.trim() && (
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white text-[11px] space-y-0.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">
                  FATURA NOTU / AÇIKLAMA
                </span>
                <p className="text-slate-700 whitespace-pre-line leading-snug">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Right Column (5 cols): Financial Totals Table */}
          <div className="sm:col-span-5 border border-slate-300 rounded-xl overflow-hidden bg-white">
            <div className="divide-y divide-slate-200 text-[11px]">
              {totalDiscount > 0 && (
                <>
                  <div className="flex justify-between py-1.5 px-3">
                    <span className="text-slate-600">Mal / Hizmet Brüt Tutar:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {currSymbol}
                      {grossTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 px-3 text-rose-700 bg-rose-50/40">
                    <span className="font-semibold">Toplam İskonto (-):</span>
                    <span className="font-mono font-bold">
                      -{currSymbol}
                      {totalDiscount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              )}

              <div className="flex justify-between py-1.5 px-3">
                <span className="text-slate-600 font-semibold">Ara Toplam (KDV Matrahı):</span>
                <span className="font-mono font-bold text-slate-900">
                  {currSymbol}
                  {subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between py-1.5 px-3">
                <span className="text-slate-600 font-semibold">Hesaplanan KDV Toplamı:</span>
                <span className="font-mono font-bold text-slate-900">
                  {currSymbol}
                  {totalVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>

              {totalWithholding > 0 && (
                <div className="flex justify-between py-1.5 px-3 text-amber-800 bg-amber-50/50">
                  <span className="font-semibold">Hesaplanan KDV Tevkifatı (-):</span>
                  <span className="font-mono font-bold">
                    -{currSymbol}
                    {totalWithholding.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <div className="flex justify-between py-1.5 px-3 bg-slate-50">
                <span className="text-slate-700 font-bold">Vergiler Dahil Toplam:</span>
                <span className="font-mono font-bold text-slate-900">
                  {currSymbol}
                  {grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div
                style={{
                  backgroundColor: themeConf.primaryBg,
                  color: "#ffffff",
                  WebkitPrintColorAdjust: "exact",
                  printColorAdjust: "exact",
                }}
                className="flex justify-between items-center py-2.5 px-3"
              >
                <span className="text-xs font-black uppercase tracking-wider">
                  ÖDENECEK TUTAR:
                </span>
                <span className="text-base font-mono font-black">
                  {currSymbol}
                  {payableAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>

              {paidAmount > 0 && (
                <>
                  <div className="flex justify-between py-1.5 px-3 text-emerald-700">
                    <span className="font-semibold">Tahsil Edilen / Ödenen:</span>
                    <span className="font-mono font-bold">
                      {currSymbol}
                      {paidAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 px-3 text-rose-700 font-bold">
                    <span>Kalan Açık Bakiye:</span>
                    <span className="font-mono">
                      {currSymbol}
                      {remainingAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 6. FOOTER: QR VERIFICATION & STAMP / SIGNATURE BLOCKS */}
        <div className="pt-4 border-t-2 border-slate-300 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          <div className="sm:col-span-6 flex items-center gap-3">
            {showQrCode && qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt="e-Fatura Doğrulama QR"
                className="w-14 h-14 border border-slate-300 rounded p-0.5 bg-white shrink-0"
              />
            ) : (
              <div className="w-12 h-12 border border-slate-300 rounded flex items-center justify-center bg-slate-50 shrink-0">
                <ShieldCheck className="w-6 h-6 text-slate-700" />
              </div>
            )}
            <div className="space-y-0.5 text-[10px] text-slate-600">
              <p className="font-bold text-slate-900">
                5070 Sayılı Elektronik İmza Kanunu Uyarınca Elektronik Ortamda Düzenlenmiştir
              </p>
              <p className="leading-snug">
                İşbu fatura GİB e-Belge standartlarına uygun olarak üretilmiştir. Karekodu okutarak
                fatura doğrulamasını gerçekleştirebilirsiniz. İrsaliye yerine geçer.
              </p>
            </div>
          </div>

          <div className="sm:col-span-6 grid grid-cols-2 gap-3 text-center text-[10px]">
            <div className="border border-dashed border-slate-300 rounded-lg p-2.5 space-y-6">
              <p className="font-bold text-slate-800 uppercase">Düzenleyen Kaşe / İmza</p>
              <p className="text-[9px] text-slate-500 truncate">
                {companySettings?.companyName || "Firma Yetkilisi"}
              </p>
            </div>
            <div className="border border-dashed border-slate-300 rounded-lg p-2.5 space-y-6">
              <p className="font-bold text-slate-800 uppercase">Teslim Alan / Onay</p>
              <p className="text-[9px] text-slate-500 truncate">{contactName}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex flex-col bg-slate-950/85 backdrop-blur-md animate-fadeIn"
    >
      {/* Hidden file input for instant company logo upload inside Invoice PDF Template */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleLogoUpload}
      />

      {/* 1. Top Control Bar */}
      <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
            <Printer className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold text-white truncate max-w-xs sm:max-w-md">
              {modalData.title || "Belge Yazdırma & PDF Önizleme"}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
              <span>{isInvoiceMode ? "Kurumsal Fatura PDF Şablonu" : "Evrensel Yazdırma Motoru"}</span>
              <span>•</span>
              <span className="font-semibold text-purple-300 uppercase">
                {currentOrientation === "landscape" ? "A4 Yan (Yatay)" : "A4 Dikey"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Invoice Template Specific Controls: Theme, Logo & QR Toggles */}
          {isInvoiceMode && (
            <div className="flex flex-wrap items-center gap-1.5 mr-1">
              {/* Theme Selector */}
              <div className="bg-slate-800 p-0.5 rounded-xl border border-slate-700 flex items-center">
                {(["navy", "royal", "classic"] as InvoicePdfTheme[]).map((tKey) => (
                  <button
                    key={tKey}
                    type="button"
                    onClick={() => setPdfTheme(tKey)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      pdfTheme === tKey
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                    title={THEME_CONFIG[tKey].label}
                  >
                    {tKey === "navy" ? "Lacivert" : tKey === "royal" ? "İndigo" : "Klasik S/B"}
                  </button>
                ))}
              </div>

              {/* Company Logo Toggle & Upload */}
              <button
                type="button"
                onClick={() => setShowCompanyLogo((v) => !v)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                  showCompanyLogo
                    ? "bg-slate-800 border-emerald-500/50 text-emerald-300"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
                title="Şirket logosunu göster / gizle"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Logo</span>
              </button>

              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all cursor-pointer flex items-center gap-1"
                title="Şirket logosu yükle veya değiştir"
              >
                <Upload className="w-3.5 h-3.5 text-purple-300" />
                <span className="hidden xl:inline">Logo Yükle</span>
              </button>

              {/* QR Code Toggle */}
              <button
                type="button"
                onClick={() => setShowQrCode((v) => !v)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                  showQrCode
                    ? "bg-slate-800 border-purple-500/50 text-purple-300"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
                title="GİB e-Fatura QR kodunu göster / gizle"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">QR Kod</span>
              </button>
            </div>
          )}

          {/* Orientation Toggle */}
          <div className="bg-slate-800 p-0.5 rounded-xl border border-slate-700 flex items-center">
            <button
              type="button"
              onClick={() => setCurrentOrientation("portrait")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                currentOrientation === "portrait"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
              title="A4 Dikey Sayfa Yönü"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dikey</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentOrientation("landscape")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                currentOrientation === "landscape"
                  ? "bg-amber-500 text-purple-950 shadow-xs font-black"
                  : "text-slate-400 hover:text-white"
              }`}
              title="A4 Yan / Yatay Sayfa Yönü"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">A4 Yan</span>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="hidden md:flex items-center bg-slate-800 rounded-xl border border-slate-700 p-0.5 text-xs text-slate-300">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
              className="p-1.5 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
              title="Uzaklaştır"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] font-bold min-w-[42px] text-center">
              %{zoomLevel}
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
              className="p-1.5 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
              title="Yakınlaştır"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Download PDF Button */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isExportingPDF}
            className="bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Yazdırılabilir yüksek çözünürlüklü PDF indir"
          >
            <Download className="w-3.5 h-3.5 text-purple-200" />
            <span className="hidden sm:inline">
              {isExportingPDF ? "PDF Hazırlanıyor..." : "PDF İndir"}
            </span>
            <span className="sm:hidden">PDF</span>
          </button>

          {/* Main Print Button */}
          <button
            type="button"
            onClick={handleDirectPrint}
            disabled={isPrinting}
            className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-xs px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Belgeyi yazıcıya gönder"
          >
            <Printer className="w-4 h-4" />
            <span>{isPrinting ? "Yazdırılıyor..." : "Yazdır"}</span>
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Kapat (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Helpful Info Banner */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-1.5 text-[11px] text-slate-400 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            {isInvoiceMode ? (
              <>
                Şirket logolu ve GİB karekodlu resmi fatura PDF şablonu hazır. Üst bardan{" "}
                <strong>renk temasını</strong> seçebilir, <strong>logo</strong> yükleyebilir veya doğrudan{" "}
                <strong>"PDF İndir" / "Yazdır"</strong> butonlarını kullanabilirsiniz.
              </>
            ) : (
              <>
                Belgeniz hazırlandı. Doğrudan <strong>"Yazdır"</strong> butonuna basabilir veya{" "}
                <strong>"PDF İndir"</strong> ile kaydedebilirsiniz.
              </>
            )}
          </span>
        </div>
        <div className="text-[10px] text-slate-500 hidden sm:block">
          Standart A4 ({currentOrientation === "landscape" ? "297mm × 210mm" : "210mm × 297mm"})
        </div>
      </div>

      {/* 3. Document Preview Sheet Canvas */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/60 custom-scrollbar flex items-start justify-center">
        {isInvoiceMode ? (
          <div
            id="universal-print-preview-paper"
            ref={previewContainerRef}
            style={{
              transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
              transformOrigin: "top center",
              transition: "transform 0.15s ease-out",
            }}
            className={`bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-9 border border-slate-200 transition-all ${
              currentOrientation === "landscape"
                ? "w-full max-w-5xl min-h-[600px] landscape-mode"
                : "w-full max-w-[840px] min-h-[880px]"
            }`}
          >
            {renderInvoicePdfTemplate()}
          </div>
        ) : (
          <div
            id="universal-print-preview-paper"
            ref={previewContainerRef}
            style={{
              transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
              transformOrigin: "top center",
              transition: "transform 0.15s ease-out",
            }}
            className={`bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-200 transition-all ${
              currentOrientation === "landscape"
                ? "w-full max-w-5xl min-h-[600px] landscape-mode"
                : "w-full max-w-3xl min-h-[850px]"
            }`}
            dangerouslySetInnerHTML={{ __html: modalData.elementHtml }}
          />
        )}
      </div>
    </div>
  );
};
