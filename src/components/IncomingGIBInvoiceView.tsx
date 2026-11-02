import React, { useEffect, useMemo, useState } from "react";
import type { CompanySettings, Contact, Invoice, InvoiceItem, MysoftEDocument } from "../types";
import { formatDate, getCurrencySymbol } from "../utils/exportUtils";
import { numberToTurkishWords } from "../utils/numberToTurkishWords";
import { computeInvoiceTotals } from "../utils/taxCalculationService";
import {
  GIB_OFFICIAL_UPLOADED_LOGO_DATA_URI,
  GIB_OFFICIAL_UPLOADED_QR_CODE_DATA_URI,
} from "../utils/gibOfficialAssets";
import {
  downloadMysoftEDocument,
  parseUblXmlInvoiceDetails,
  type ParsedUblInvoiceDetails,
} from "../services/mysoftEDocumentService";
import { FileCode2, FileText, Loader2 } from "lucide-react";

export interface IncomingGIBInvoiceViewProps {
  invoice: Partial<Invoice>;
  /** Buyer (our own company receiving the incoming invoice) */
  buyerCompanySettings?: CompanySettings;
  buyerCompany?: CompanySettings;
  /** Supplier / Sender contact if available */
  supplierContact?: Contact;
  /** Raw Mysoft incoming e-document if opened from EDocuments */
  rawEDocument?: MysoftEDocument | Record<string, unknown>;
  /** Tenant VKN/TCKN for Mysoft API calls */
  tenantIdentifierNumber?: string;
  /** Active company ID */
  companyId?: string;
  /** Document family (invoice or despatch) */
  family?: "invoice" | "despatch";
  /** DOM ID used by print & PDF export engines */
  paperId?: string;
}

/**
 * Extracts and transforms an embedded XSLT stylesheet from a UBL-TR XML string
 * using the browser's native DOMParser and XSLTProcessor if present.
 */
function tryTransformUblXmlWithEmbeddedXslt(xmlText: string): string | null {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") return null;
  try {
    const trimmed = xmlText.trim();
    if (!trimmed.startsWith("<")) return null;
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(trimmed, "application/xml");
    if (xmlDoc.getElementsByTagName("parsererror").length > 0) return null;

    // Look for EmbeddedDocumentBinaryObject containing XSLT
    const binaryNodes = Array.from(xmlDoc.getElementsByTagName("*")).filter(
      (el) => el.localName === "EmbeddedDocumentBinaryObject"
    );

    let xsltBase64 = "";
    for (const node of binaryNodes) {
      const filename = (node.getAttribute("filename") || "").toLowerCase();
      const mime = (node.getAttribute("mimeCode") || "").toLowerCase();
      const parentDocType = Array.from(node.parentElement?.parentElement?.children || [])
        .find((c) => c.localName === "DocumentType")
        ?.textContent?.toUpperCase();
      if (
        filename.endsWith(".xslt") ||
        filename.endsWith(".xsl") ||
        parentDocType === "XSLT" ||
        mime.includes("xslt") ||
        mime.includes("xml")
      ) {
        const content = (node.textContent || "").replace(/\s+/g, "");
        if (content.length > 64) {
          xsltBase64 = content;
          break;
        }
      }
    }

    if (!xsltBase64 || typeof XSLTProcessor === "undefined") return null;

    const binaryStr = atob(xsltBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const xsltString = new TextDecoder("utf-8").decode(bytes).replace(/^\uFEFF/, "").trim();
    if (!xsltString.startsWith("<")) return null;

    const xsltDoc = parser.parseFromString(xsltString, "application/xml");
    if (xsltDoc.getElementsByTagName("parsererror").length > 0) return null;

    const processor = new XSLTProcessor();
    processor.importStylesheet(xsltDoc);
    const resultDoc = processor.transformToDocument(xmlDoc);
    if (!resultDoc) return null;

    const serializer = new XMLSerializer();
    const htmlOut = serializer.serializeToString(resultDoc);
    if (htmlOut && htmlOut.length > 120 && /<(html|body|table|div)/i.test(htmlOut)) {
      return htmlOut;
    }
    return null;
  } catch {
    return null;
  }
}

export const IncomingGIBInvoiceView: React.FC<IncomingGIBInvoiceViewProps> = ({
  invoice,
  buyerCompanySettings,
  buyerCompany,
  supplierContact,
  rawEDocument,
  tenantIdentifierNumber,
  companyId,
  family = "invoice",
  paperId = "invoice-preview-paper",
}) => {
  const effectiveBuyerCompanySettings = buyerCompanySettings || buyerCompany;
  const [originalHtml, setOriginalHtml] = useState<string | null>(null);
  const [originalPdfUrl, setOriginalPdfUrl] = useState<string | null>(null);
  const [parsedUbl, setParsedUbl] = useState<ParsedUblInvoiceDetails | null>(null);
  const [isLoadingOriginal, setIsLoadingOriginal] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"original" | "ubl_standard">("original");

  const rawDoc = useMemo(
    () => (rawEDocument && typeof rawEDocument === "object" ? (rawEDocument as Record<string, unknown>) : {}),
    [rawEDocument]
  );
  const rawInner = useMemo(
    () => (rawDoc.raw && typeof rawDoc.raw === "object" ? (rawDoc.raw as Record<string, unknown>) : {}),
    [rawDoc]
  );

  const ettn = useMemo(() => {
    const candidate =
      invoice.eDocumentEttn ||
      (typeof rawDoc.ettn === "string" ? rawDoc.ettn : "") ||
      (typeof rawDoc.uuid === "string" ? rawDoc.uuid : "") ||
      (typeof rawInner.ettn === "string" ? rawInner.ettn : "") ||
      (typeof rawInner.invoiceETTN === "string" ? rawInner.invoiceETTN : "") ||
      "";
    return candidate.trim();
  }, [invoice.eDocumentEttn, rawDoc, rawInner]);

  // Attempt to load the supplier's original invoice (HTML or embedded XSLT from UBL XML) from Mysoft
  useEffect(() => {
    let cancelled = false;
    let createdPdfBlobUrl: string | null = null;

    setOriginalHtml(null);
    setOriginalPdfUrl(null);
    setParsedUbl(null);
    setViewMode("original");

    if (!ettn || ettn.startsWith("inv_") || ettn.startsWith("local_")) {
      return;
    }

    const fetchOriginalDocument = async () => {
      setIsLoadingOriginal(true);
      try {
        // 1. Always try fetching UBL-TR XML first to extract structured line items, supplier address/IBAN, and embedded XSLT
        try {
          const xmlRes = await downloadMysoftEDocument(ettn, "xml", {
            direction: "inbox",
            tenantIdentifierNumber,
            companyId,
            family,
            fallback: false,
          });
          if (!cancelled && !xmlRes.isMock) {
            let xmlText = "";
            if (xmlRes.blob) {
              xmlText = await xmlRes.blob.text();
            } else if (typeof xmlRes.data === "string") {
              xmlText = xmlRes.data;
            }
            if (xmlText && !cancelled) {
              const ublDetails = parseUblXmlInvoiceDetails(xmlText);
              if (ublDetails) {
                setParsedUbl(ublDetails);
              }
              const transformedHtml = tryTransformUblXmlWithEmbeddedXslt(xmlText);
              if (transformedHtml) {
                setOriginalHtml(transformedHtml);
                setViewMode("original");
                setIsLoadingOriginal(false);
                return;
              }
            }
          }
        } catch {
          // Continue to HTML / PDF checks
        }

        // 2. Try fetching the supplier's original HTML rendition from Mysoft (getInvoiceInboxHTMLAsZip)
        try {
          const htmlRes = await downloadMysoftEDocument(ettn, "html", {
            direction: "inbox",
            tenantIdentifierNumber,
            companyId,
            family,
            fallback: false,
          });
          if (!cancelled && !htmlRes.isMock) {
            let htmlText = "";
            if (htmlRes.blob) {
              htmlText = await htmlRes.blob.text();
            } else if (typeof htmlRes.data === "string") {
              htmlText = htmlRes.data;
            }
            const cleanHtml = htmlText.replace(/^\uFEFF/, "").trim();
            if (
              cleanHtml.length > 350 &&
              /<(html|body|table)/i.test(cleanHtml) &&
              !/Demo e-belge:/i.test(cleanHtml) &&
              !/<h2>e-Belge Görüntüsü/i.test(cleanHtml)
            ) {
              setOriginalHtml(cleanHtml);
              setViewMode("original");
              setIsLoadingOriginal(false);
              return;
            }
          }
        } catch {
          // Continue to PDF check
        }

        // 3. Try fetching the original PDF if it's a real binary PDF
        try {
          const pdfRes = await downloadMysoftEDocument(ettn, "pdf", {
            direction: "inbox",
            tenantIdentifierNumber,
            companyId,
            family,
            fallback: false,
          });
          if (!cancelled && !pdfRes.isMock && pdfRes.blob && pdfRes.mimeType === "application/pdf") {
            const buf = await pdfRes.blob.slice(0, 5).arrayBuffer();
            const header = new Uint8Array(buf);
            // Verify %PDF magic bytes
            if (header.length >= 4 && header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46) {
              createdPdfBlobUrl = URL.createObjectURL(pdfRes.blob);
              setOriginalPdfUrl(createdPdfBlobUrl);
            }
          }
        } catch {
          // Ignore and render standard UBL-TR incoming invoice view
        }
      } finally {
        if (!cancelled) {
          setIsLoadingOriginal(false);
        }
      }
    };

    void fetchOriginalDocument();

    return () => {
      cancelled = true;
      if (createdPdfBlobUrl) {
        URL.revokeObjectURL(createdPdfBlobUrl);
      }
    };
  }, [ettn, invoice.id, invoice.invoiceNumber, tenantIdentifierNumber, companyId, family]);

  // Supplier (Issuer / Satıcı) Fields — strictly from the incoming invoice / supplier, NEVER from our companySettings
  const supplierName = useMemo(() => {
    return (
      String(
        parsedUbl?.senderName ||
          rawDoc.senderName ||
          rawDoc.accountName ||
          rawInner.senderName ||
          rawInner.accountName ||
          invoice.contactName ||
          supplierContact?.companyTitle ||
          supplierContact?.name ||
          "Tedarikçi Firma"
      ).trim()
    );
  }, [parsedUbl, rawDoc, rawInner, invoice.contactName, supplierContact]);

  const supplierTaxNumber = useMemo(() => {
    return (
      String(
        parsedUbl?.senderTaxNumber ||
          rawDoc.senderTaxNumber ||
          rawDoc.vknTckn ||
          rawDoc.taxNumber ||
          rawInner.senderTaxNumber ||
          rawInner.vknTckn ||
          invoice.taxNumber ||
          supplierContact?.taxNumber ||
          "-"
      ).trim()
    );
  }, [parsedUbl, rawDoc, rawInner, invoice.taxNumber, supplierContact]);

  const supplierTaxOffice = useMemo(() => {
    const candidate =
      parsedUbl?.senderTaxOffice ||
      rawDoc.senderTaxOffice ||
      rawDoc.taxOffice ||
      rawInner.taxOfficeName ||
      rawInner.senderTaxOffice ||
      (invoice.taxOffice && invoice.taxOffice !== "-" ? invoice.taxOffice : "") ||
      supplierContact?.taxOffice ||
      "-";
    return String(candidate).trim() || "-";
  }, [parsedUbl, rawDoc, rawInner, invoice.taxOffice, supplierContact]);

  const supplierAddress = useMemo(() => {
    const rawAddr =
      parsedUbl?.senderAddress ||
      rawDoc.senderAddress ||
      rawInner.streetName ||
      invoice.customerAddress ||
      supplierContact?.address ||
      "";
    const city =
      parsedUbl?.senderCity ||
      rawDoc.senderCity ||
      rawInner.cityName ||
      invoice.customerCity ||
      supplierContact?.city ||
      "";
    const district =
      parsedUbl?.senderDistrict ||
      rawDoc.senderDistrict ||
      rawInner.townName ||
      rawInner.citySubdivisionName ||
      invoice.customerDistrict ||
      supplierContact?.district ||
      "";
    const parts = [
      String(rawAddr || "").trim(),
      [String(district || "").trim(), String(city || "").trim()].filter(Boolean).join(" / "),
    ].filter(Boolean);
    return parts.join(" — ") || "Merkez Adres";
  }, [parsedUbl, rawDoc, rawInner, invoice, supplierContact]);

  const supplierPhone = String(
    parsedUbl?.senderPhone || rawDoc.senderPhone || rawInner.telephone || invoice.customerPhone || supplierContact?.phone || ""
  ).trim();
  const supplierEmail = String(
    parsedUbl?.senderEmail || rawDoc.senderEmail || rawInner.email || invoice.customerEmail || supplierContact?.email || ""
  ).trim();
  const supplierGbAlias = String(rawDoc.gbAlias || rawInner.gbAlias || "").trim();

  // Buyer (Alıcı / SAYIN) Fields — our own company receiving the invoice
  const buyerTitle =
    effectiveBuyerCompanySettings?.companyTitle ||
    effectiveBuyerCompanySettings?.companyName ||
    parsedUbl?.receiverName ||
    String(rawDoc.receiverName || rawInner.receiverName || "Alıcı Firma");
  const buyerTaxNumber =
    effectiveBuyerCompanySettings?.vkn ||
    effectiveBuyerCompanySettings?.tckn ||
    effectiveBuyerCompanySettings?.taxNumber ||
    effectiveBuyerCompanySettings?.tenantIdentifierNumber ||
    parsedUbl?.receiverTaxNumber ||
    String(rawDoc.receiverTaxNumber || "-");
  const buyerTaxOffice = effectiveBuyerCompanySettings?.taxOffice || parsedUbl?.receiverTaxOffice || "-";
  const buyerAddress =
    [
      effectiveBuyerCompanySettings?.address || parsedUbl?.receiverAddress,
      [effectiveBuyerCompanySettings?.district, effectiveBuyerCompanySettings?.city].filter(Boolean).join(" / "),
    ]
      .filter(Boolean)
      .join(" ") || "Merkez";
  const buyerPkAlias = String(rawDoc.pkAlias || rawInner.pkAlias || "").trim();

  // Document Metadata
  const docNo = String(
    invoice.invoiceNumber || parsedUbl?.documentNo || rawDoc.documentNo || rawDoc.docNo || rawInner.docNo || "BELGE"
  ).trim();
  const issueDate = String(
    invoice.issueDate || parsedUbl?.issueDate || rawDoc.issueDate || rawDoc.docDate || rawInner.docDate || new Date().toISOString().slice(0, 10)
  ).slice(0, 10);
  const issueTime = useMemo(() => {
    if (parsedUbl?.issueTime) return parsedUbl.issueTime.slice(0, 8);
    const createStr = String(rawDoc.createdAt || rawInner.createDate || invoice.createdAt || "");
    if (createStr.includes("T")) {
      const t = createStr.split("T")[1]?.slice(0, 8);
      if (t && /^\d{2}:\d{2}/.test(t)) return t;
    }
    return "10:15:00";
  }, [parsedUbl, rawDoc, rawInner, invoice.createdAt]);

  const scenario = String(
    parsedUbl?.profile ||
      rawDoc.profile ||
      rawInner.profile ||
      invoice.invoiceScenario ||
      (invoice.eDocumentType === "e_arsiv" ? "EARSIVFATURA" : "TICARIFATURA")
  )
    .toUpperCase()
    .trim();

  const invoiceTypeCode = String(
    parsedUbl?.invoiceType || rawDoc.invoiceType || rawInner.invoiceType || invoice.invoiceProfileType || "SATIS"
  )
    .toUpperCase()
    .trim();

  const isDespatch =
    family === "despatch" ||
    String(rawDoc.documentType || invoice.eDocumentType || "")
      .toLowerCase()
      .includes("irsaliye");
  const isEArsiv =
    !isDespatch &&
    (scenario.includes("ARSIV") ||
      String(rawDoc.documentType || invoice.eDocumentType || "")
        .toLowerCase()
        .includes("arsiv"));

  const docTitle = isDespatch
    ? "e-İRSALİYE"
    : isEArsiv
      ? "e-ARŞİV FATURA"
      : "e-FATURA";

  const items: InvoiceItem[] = useMemo(() => {
    if (parsedUbl && parsedUbl.items.length > 0) {
      return parsedUbl.items.map((ln) => ({
        id: ln.id,
        productCode: ln.productCode,
        description: ln.description,
        quantity: ln.quantity,
        unit: ln.unit,
        unitPrice: ln.unitPrice,
        vatRate: ln.vatRate,
        totalWithoutVat: ln.totalWithoutVat,
        vatAmount: ln.vatAmount,
        totalWithVat: ln.totalWithVat,
      }));
    }
    if (Array.isArray(invoice.items) && invoice.items.length > 0) {
      return invoice.items;
    }
    const rawLines = Array.isArray(rawDoc.items) && rawDoc.items.length > 0
      ? rawDoc.items
      : Array.isArray(rawDoc.lines) && rawDoc.lines.length > 0
      ? rawDoc.lines
      : Array.isArray(rawDoc.invoiceDetail) && rawDoc.invoiceDetail.length > 0
      ? rawDoc.invoiceDetail
      : Array.isArray(rawInner.invoiceDetail) && rawInner.invoiceDetail.length > 0
      ? rawInner.invoiceDetail
      : Array.isArray(rawInner.items) && rawInner.items.length > 0
      ? rawInner.items
      : Array.isArray(rawDoc.invoiceLine)
      ? rawDoc.invoiceLine
      : [];
    if (rawLines.length > 0) {
      return rawLines.map((ln: any, idx: number) => {
        const qty = Number(ln.quantity ?? ln.qty ?? 1) || 1;
        const price = Number(ln.unitPrice ?? ln.unitPriceTra ?? ln.price ?? ln.amount ?? 0) || 0;
        const vatRate = Number(ln.vatRate ?? ln.taxRate ?? ln.taxPercent ?? ln.kdvPercent ?? 20);
        const totalWithoutVat = Number(ln.totalWithoutVat ?? ln.amtTra ?? ln.lineExtensionAmount ?? qty * price);
        const vatAmount = Number(ln.vatAmount ?? ln.amtVatTra ?? ln.taxAmount ?? (totalWithoutVat * vatRate) / 100);
        return {
          id: String(ln.id || `line_${idx}`),
          productCode: ln.productCode || ln.itemCode || undefined,
          description: String(ln.description || ln.productName || ln.itemName || ln.note || "Mal / Hizmet Kalemi"),
          quantity: qty,
          unit: String(ln.unit || ln.unitName || ln.unitCode || "Adet"),
          unitPrice: price,
          vatRate,
          totalWithoutVat,
          vatAmount,
          totalWithVat: totalWithoutVat + vatAmount,
        };
      });
    }
    return [];
  }, [parsedUbl, invoice.items, rawDoc, rawInner]);
  const currency = invoice.currency || parsedUbl?.currency || String(rawDoc.currency || rawInner.currencyCode || "TRY");
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
  } = useMemo(() => computeInvoiceTotals(items), [items]);

  const grossTotal = Number(parsedUbl?.subtotal ?? invoice.grossTotal ?? computedGrossTotal) || 0;
  const totalDiscount = Number(parsedUbl?.discountTotal ?? invoice.totalDiscount ?? computedTotalDiscount) || 0;
  const subtotal = Number(parsedUbl?.subtotal ?? invoice.subtotal ?? computedSubtotal) || 0;
  const totalVat = Number(parsedUbl?.vatTotal ?? invoice.totalVat ?? computedVat) || 0;
  const totalWithholding = Number(invoice.totalWithholding ?? computedWithholding) || 0;
  const grandTotal = Number(parsedUbl?.grandTotal ?? invoice.grandTotal ?? computedGrandTotal) || 0;
  const payableAmount = Number(parsedUbl?.grandTotal ?? invoice.payableAmount ?? computedPayableAmount) || 0;

  const vatBreakdown = useMemo(() => {
    const groups = new Map<number, { rate: number; matrah: number; vat: number }>();
    for (const item of computedItems) {
      const rate = Number(item.vatRate ?? 0);
      const matrah = Number(
        item.effectiveTaxableAmount ?? item.totalWithoutVat ?? item.quantity * item.unitPrice
      );
      const vat = Number(item.vatAmount ?? 0);
      const existing = groups.get(rate) || { rate, matrah: 0, vat: 0 };
      existing.matrah += matrah;
      existing.vat += vat;
      groups.set(rate, existing);
    }
    return Array.from(groups.values()).sort((a, b) => a.rate - b.rate);
  }, [computedItems]);

  const incomingNote = useMemo(() => {
    if (parsedUbl?.notes && parsedUbl.notes.length > 0) {
      return parsedUbl.notes.join(" | ");
    }
    return String(
      rawDoc.note ||
        rawInner.note ||
        rawDoc.description ||
        invoice.notes ||
        ""
    ).trim();
  }, [parsedUbl, rawDoc, rawInner, invoice.notes]);

  const supplierIban = useMemo(() => {
    return String(
      parsedUbl?.senderIban || rawDoc.iban || rawInner.iban || invoice.paymentIban || supplierContact?.iban || ""
    ).trim();
  }, [parsedUbl, rawDoc, rawInner, invoice.paymentIban, supplierContact]);

  const writtenAmount = numberToTurkishWords(payableAmount);
  const displayEttn = ettn || String(invoice.id || "-");

  return (
    <div className="w-full max-w-[860px] mx-auto space-y-3">
      {/* View Switcher Bar if Mysoft returned an original HTML/XSLT or PDF document */}
      {(originalHtml || originalPdfUrl || isLoadingOriginal) && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-white/90 border border-slate-300 rounded-xl px-3.5 py-2 text-xs shadow-2xs print:hidden">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            {isLoadingOriginal ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0f6bae]" />
                <span>Tedarikçinin orijinal e-belge görüntüsü kontrol ediliyor...</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-[#0f6bae]" />
                <span>
                  Gelen e-Fatura Orijinal Belge Görünümü (Giden fatura şablonu uygulanmaz)
                </span>
              </>
            )}
          </div>
          {(originalHtml || originalPdfUrl) && (
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode("original")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                  viewMode === "original"
                    ? "bg-[#0f6bae] text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tedarikçi Orijinal XSLT / PDF
              </button>
              <button
                type="button"
                onClick={() => setViewMode("ubl_standard")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                  viewMode === "ubl_standard"
                    ? "bg-[#0f6bae] text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileCode2 className="w-3 h-3" />
                <span>Standart GİB UBL-TR Görünümü</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 1. If supplier's original embedded XSLT / HTML from Mysoft is active */}
      {viewMode === "original" && originalHtml ? (
        <div
          id={paperId}
          data-printable="true"
          className="bg-white text-black border border-slate-300 shadow-xl rounded-none sm:rounded-lg overflow-hidden w-full max-w-[860px] mx-auto print:border-none print:shadow-none"
        >
          <iframe
            title={`Orijinal Gelen Belge - ${docNo}`}
            srcDoc={originalHtml}
            className="w-full min-h-[1080px] border-0 bg-white"
            sandbox="allow-same-origin"
          />
        </div>
      ) : viewMode === "original" && originalPdfUrl ? (
        <div
          id={paperId}
          data-printable="true"
          className="bg-white text-black border border-slate-300 shadow-xl rounded-none sm:rounded-lg overflow-hidden w-full max-w-[860px] mx-auto print:border-none print:shadow-none"
        >
          <iframe
            title={`Orijinal Gelen PDF - ${docNo}`}
            src={originalPdfUrl}
            className="w-full min-h-[1080px] border-0 bg-white"
          />
        </div>
      ) : (
        /* 2. Authentic Standard GİB UBL-TR 1.2 Incoming e-Invoice Paper (Supplier's Invoice Itself) */
        <div
          id={paperId}
          data-printable="true"
          className="bg-white text-black font-serif border border-slate-400 shadow-xl w-full max-w-[860px] mx-auto p-5 sm:p-8 space-y-4 text-[11px] leading-snug print:border-none print:shadow-none print:p-0"
        >
          {/* =================================================================
              GİB UBL-TR STANDART GELEN FATURA ÜST BİLGİ TABLOSU (3 SÜTUN)
              SOL: TEDARİKÇİ (DÜZENLEYEN) & ALICI (SAYIN)
              ORTA: T.C. HAZİNE VE MALİYE BAKANLIĞI GİB LOGOSU & e-FATURA
              SAĞ: KAREKOD & ÖZELLEŞTİRME / ETTN / FATURA METADATA TABLOSU
             ================================================================= */}
          <div className="grid grid-cols-12 gap-3 items-start pb-3 border-b-2 border-black">
            {/* SOL SÜTUN (5 Sütun): FATURAYI DÜZENLEYEN TEDARİKÇİ + SAYIN (ALICI FİRMA) */}
            <div className="col-span-12 sm:col-span-5 flex flex-col justify-between space-y-3">
              {/* TEDARİKÇİ / SATICI BİLGİLERİ */}
              <div className="border-t-2 border-b-2 border-black py-2 px-1.5 space-y-1 text-[10.5px]">
                <div className="text-[9px] font-bold uppercase tracking-wider text-neutral-600">
                  SATICI / DÜZENLEYEN FİRMA
                </div>
                <p className="font-bold text-xs sm:text-[13px] uppercase text-black leading-tight">
                  {supplierName}
                </p>
                <p className="text-neutral-900">
                  <strong>Adres:</strong> {supplierAddress}
                </p>
                {(supplierPhone || supplierEmail) && (
                  <p className="text-neutral-900 text-[10px]">
                    {supplierPhone ? `Tel: ${supplierPhone}` : ""}
                    {supplierPhone && supplierEmail ? " • " : ""}
                    {supplierEmail ? `E-Posta: ${supplierEmail}` : ""}
                  </p>
                )}
                <p className="text-neutral-900">
                  <strong>Vergi Dairesi:</strong> {supplierTaxOffice}
                </p>
                <p className="text-neutral-900">
                  <strong>
                    {String(supplierTaxNumber || "").replace(/\D/g, "").length === 11 ? "TCKN:" : "VKN:"}
                  </strong>{" "}
                  <span className="font-mono font-bold">{supplierTaxNumber}</span>
                </p>
                {supplierGbAlias && (
                  <p className="text-[9.5px] text-neutral-700 font-mono truncate">
                    <strong>Gönderici Birim:</strong> {supplierGbAlias}
                  </p>
                )}
              </div>

              {/* SAYIN (ALICI — BİZİM FİRMAMIZ) */}
              <div className="border-t-2 border-b-2 border-black py-2 px-1.5 space-y-1 text-[10.5px]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-black">
                  SAYIN (ALICI)
                </div>
                <p className="font-bold text-xs uppercase text-black leading-tight">
                  {buyerTitle}
                </p>
                <p className="text-neutral-900">
                  <strong>Adres:</strong> {buyerAddress}
                </p>
                <p className="text-neutral-900">
                  <strong>Vergi Dairesi:</strong> {buyerTaxOffice}
                </p>
                <p className="text-neutral-900">
                  <strong>
                    {String(buyerTaxNumber).replace(/\D/g, "").length === 11 ? "TCKN:" : "VKN:"}
                  </strong>{" "}
                  <span className="font-mono font-bold">{buyerTaxNumber}</span>
                </p>
                {buyerPkAlias && (
                  <p className="text-[9.5px] text-neutral-700 font-mono truncate">
                    <strong>Posta Kutusu:</strong> {buyerPkAlias}
                  </p>
                )}
              </div>
            </div>

            {/* ORTA SÜTUN (3 Sütun): GİB RESMİ MÜHÜR & BELGE TÜRÜ BAŞLIĞI */}
            <div className="col-span-12 sm:col-span-3 flex flex-col items-center justify-center text-center pt-2">
              <img
                src={GIB_OFFICIAL_UPLOADED_LOGO_DATA_URI}
                alt="T.C. Gelir İdaresi Başkanlığı"
                className="w-20 h-20 object-contain mx-auto"
              />
              <h2 className="mt-2 text-sm sm:text-base font-bold tracking-tight text-black uppercase">
                {docTitle}
              </h2>
            </div>

            {/* SAĞ SÜTUN (4 Sütun): KAREKOD & STANDART GİB FATURA METADATA TABLOSU */}
            <div className="col-span-12 sm:col-span-4 flex flex-col items-end space-y-2">
              <div className="border border-black p-1 bg-white">
                <img
                  src={GIB_OFFICIAL_UPLOADED_QR_CODE_DATA_URI}
                  alt="GİB e-Belge Karekod"
                  className="w-20 h-20 object-contain"
                />
              </div>

              <table className="w-full border-collapse border border-black text-[10px] font-sans">
                <tbody>
                  <tr className="border-b border-black">
                    <td className="bg-neutral-100 font-bold px-2 py-1 border-r border-black w-[44%]">
                      Özelleştirme No:
                    </td>
                    <td className="px-2 py-1 font-mono">TR1.2</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="bg-neutral-100 font-bold px-2 py-1 border-r border-black">
                      Senaryo:
                    </td>
                    <td className="px-2 py-1 font-mono font-semibold">{scenario}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="bg-neutral-100 font-bold px-2 py-1 border-r border-black">
                      Fatura Tipi:
                    </td>
                    <td className="px-2 py-1 font-mono font-semibold">{invoiceTypeCode}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="bg-neutral-100 font-bold px-2 py-1 border-r border-black">
                      Fatura No:
                    </td>
                    <td className="px-2 py-1 font-mono font-bold text-black">{docNo}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="bg-neutral-100 font-bold px-2 py-1 border-r border-black">
                      Fatura Tarihi:
                    </td>
                    <td className="px-2 py-1 font-mono">{formatDate(issueDate)}</td>
                  </tr>
                  <tr>
                    <td className="bg-neutral-100 font-bold px-2 py-1 border-r border-black">
                      Düzenleme Zamanı:
                    </td>
                    <td className="px-2 py-1 font-mono">{issueTime}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ETTN SATIRI */}
          <div className="border border-black bg-neutral-50 px-2.5 py-1.5 text-[10px] font-sans flex flex-wrap items-center justify-between gap-2">
            <div>
              <strong className="uppercase">ETTN:</strong>{" "}
              <span className="font-mono font-bold">{displayEttn}</span>
            </div>
            <div className="text-neutral-700">
              <strong>Para Birimi:</strong> <span className="font-mono">{currency}</span>
            </div>
          </div>

          {/* =================================================================
              MAL / HİZMET KALEMLERİ TABLOSU (STANDART GİB UBL-TR TABLOSU)
             ================================================================= */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-[10px] font-sans">
              <thead>
                <tr className="bg-neutral-100 text-black border-b border-black">
                  <th className="border border-black px-1.5 py-1.5 text-center font-bold w-8">
                    Sıra No
                  </th>
                  <th className="border border-black px-2 py-1.5 text-left font-bold w-24">
                    Mal / Hizmet Kodu
                  </th>
                  <th className="border border-black px-2 py-1.5 text-left font-bold">
                    Mal / Hizmet Açıklaması
                  </th>
                  <th className="border border-black px-2 py-1.5 text-right font-bold w-20">
                    Miktar
                  </th>
                  <th className="border border-black px-2 py-1.5 text-right font-bold w-24">
                    Birim Fiyat
                  </th>
                  <th className="border border-black px-1.5 py-1.5 text-right font-bold w-16">
                    İskonto Oranı
                  </th>
                  <th className="border border-black px-2 py-1.5 text-right font-bold w-20">
                    İskonto Tutarı
                  </th>
                  <th className="border border-black px-1.5 py-1.5 text-right font-bold w-16">
                    KDV Oranı
                  </th>
                  <th className="border border-black px-2 py-1.5 text-right font-bold w-24">
                    KDV Tutarı
                  </th>
                  <th className="border border-black px-2 py-1.5 text-right font-bold w-28">
                    Mal / Hizmet Tutarı
                  </th>
                </tr>
              </thead>
              <tbody>
                {(computedItems.length > 0 ? computedItems : (payableAmount > 0 || docNo !== "BELGE" ? [{ id: "line_fallback", description: `${docTitle} - ${supplierName}`, quantity: 1, unit: "Adet", unitPrice: subtotal || grandTotal || payableAmount, vatRate: subtotal > 0 && totalVat > 0 ? Math.round((totalVat / subtotal) * 100) : 20, totalWithoutVat: subtotal || grandTotal || payableAmount, vatAmount: totalVat, totalWithVat: grandTotal || payableAmount }] : [])).map((item: any, idx) => {
                  const qty = Number(item.quantity ?? 1);
                  const unitPrice = Number(item.unitPrice ?? 0);
                  const discRate = Number(item.discountRate ?? 0);
                  const discAmt = Number(item.discountAmount ?? 0);
                  const vatRate = Number(item.vatRate ?? 0);
                  const vatAmt = Number(item.vatAmount ?? item.calculatedVatAmount ?? 0);
                  const lineNet = Number(
                    item.effectiveTaxableAmount ?? item.totalWithoutVat ?? qty * unitPrice - discAmt
                  );

                  return (
                    <tr key={item.id || idx} className="border-b border-black">
                      <td className="border border-black px-1.5 py-1.5 text-center font-mono">
                        {idx + 1}
                      </td>
                      <td className="border border-black px-2 py-1.5 font-mono text-[9.5px]">
                        {item.productCode || "-"}
                      </td>
                      <td className="border border-black px-2 py-1.5 font-medium text-black">
                        {item.productName || item.description || "Mal / Hizmet Kalemi"}
                      </td>
                      <td className="border border-black px-2 py-1.5 text-right font-mono">
                        {qty.toLocaleString("tr-TR", { maximumFractionDigits: 4 })}{" "}
                        {item.unit || "Adet"}
                      </td>
                      <td className="border border-black px-2 py-1.5 text-right font-mono">
                        {unitPrice.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 4,
                        })}{" "}
                        {currSymbol}
                      </td>
                      <td className="border border-black px-1.5 py-1.5 text-right font-mono">
                        %{discRate.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}
                      </td>
                      <td className="border border-black px-2 py-1.5 text-right font-mono">
                        {discAmt.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        {currSymbol}
                      </td>
                      <td className="border border-black px-1.5 py-1.5 text-right font-mono">
                        %{vatRate}
                      </td>
                      <td className="border border-black px-2 py-1.5 text-right font-mono">
                        {vatAmt.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        {currSymbol}
                      </td>
                      <td className="border border-black px-2 py-1.5 text-right font-mono font-semibold">
                        {lineNet.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        {currSymbol}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* =================================================================
              ALT BÖLÜM: NOTLAR / YALNIZ (SOL) & TOPLAMLAR TABLOSU (SAĞ)
             ================================================================= */}
          <div className="grid grid-cols-12 gap-4 items-start pt-2 font-sans">
            {/* SOL: YALNIZ & GELEN FATURANIN KENDİ NOTU */}
            <div className="col-span-12 sm:col-span-7 space-y-2 text-[10px]">
              <div className="border border-black p-2.5 bg-neutral-50 space-y-1.5">
                <p>
                  <strong>YALNIZ:</strong>{" "}
                  <span className="uppercase font-semibold">{writtenAmount}</span>
                </p>
                {incomingNote && (
                  <p className="pt-1 border-t border-neutral-300">
                    <strong>NOT / AÇIKLAMA:</strong> {incomingNote}
                  </p>
                )}
                {supplierIban && (
                  <p className="pt-1 border-t border-neutral-300 font-mono">
                    <strong>SATICI IBAN:</strong> {supplierIban}
                  </p>
                )}
              </div>
            </div>

            {/* SAĞ: STANDART GİB VERGİ VE GENEL TOPLAM TABLOSU */}
            <div className="col-span-12 sm:col-span-5">
              <table className="w-full border-collapse border border-black text-[10px]">
                <tbody>
                  <tr className="border-b border-black">
                    <td className="bg-neutral-100 font-bold px-2.5 py-1.5 border-r border-black text-right">
                      Mal Hizmet Toplam Tutarı
                    </td>
                    <td className="px-2.5 py-1.5 text-right font-mono w-32">
                      {(grossTotal || subtotal).toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {currSymbol}
                    </td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="bg-neutral-100 font-bold px-2.5 py-1.5 border-r border-black text-right">
                      Toplam İskonto
                    </td>
                    <td className="px-2.5 py-1.5 text-right font-mono">
                      {totalDiscount.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {currSymbol}
                    </td>
                  </tr>
                  {vatBreakdown.length > 0 ? (
                    vatBreakdown.map((vb) => (
                      <tr key={vb.rate} className="border-b border-black">
                        <td className="bg-neutral-100 font-bold px-2.5 py-1.5 border-r border-black text-right">
                          Hesaplanan KDV (%{vb.rate})
                        </td>
                        <td className="px-2.5 py-1.5 text-right font-mono">
                          {vb.vat.toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          {currSymbol}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-b border-black">
                      <td className="bg-neutral-100 font-bold px-2.5 py-1.5 border-r border-black text-right">
                        Hesaplanan KDV
                      </td>
                      <td className="px-2.5 py-1.5 text-right font-mono">
                        {totalVat.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        {currSymbol}
                      </td>
                    </tr>
                  )}
                  {totalWithholding > 0 && (
                    <tr className="border-b border-black">
                      <td className="bg-neutral-100 font-bold px-2.5 py-1.5 border-r border-black text-right">
                        Hesaplanan KDV Tevkifatı
                      </td>
                      <td className="px-2.5 py-1.5 text-right font-mono">
                        {totalWithholding.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        {currSymbol}
                      </td>
                    </tr>
                  )}
                  <tr className="border-b border-black">
                    <td className="bg-neutral-100 font-bold px-2.5 py-1.5 border-r border-black text-right">
                      Vergiler Dahil Toplam Tutar
                    </td>
                    <td className="px-2.5 py-1.5 text-right font-mono font-semibold">
                      {grandTotal.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {currSymbol}
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-neutral-200 font-bold px-2.5 py-2 border-r border-black text-right text-[11px]">
                      Ödenecek Tutar
                    </td>
                    <td className="bg-neutral-100 px-2.5 py-2 text-right font-mono font-bold text-[11.5px] text-black">
                      {payableAmount.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {currSymbol}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
