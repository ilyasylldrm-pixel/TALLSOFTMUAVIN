import type { CompanySettings, Contact, EDocumentType, Invoice, InvoiceItem } from "../types";
import { normalizeMysoftTenantIdentifier } from "./mysoftTenant.ts";

/**
 * Maps Muavin's "Yeni Gelir Faturası Kes / Hazırla" form onto Mysoft's
 * InvoiceOutboxModel (Swagger: Giden Fatura İşlemleri → invoiceOutbox).
 */

export type MysoftOutgoingEDocumentType = "EFATURA" | "EARSIVFATURA";

export interface BuildMysoftInvoiceOutboxOptions {
  invoice: Invoice;
  contact: Contact;
  company: CompanySettings;
  /** Defaults from invoice.eDocumentType or e-Fatura. */
  eDocumentType?: EDocumentType | MysoftOutgoingEDocumentType | string;
  /** TEMELFATURA | TICARIFATURA | EARSIVFATURA … (Swagger InvoiceOutboxModel.profile) */
  profile?: string;
  invoiceType?: string;
  /** true = only draft in Mysoft (not sent to GİB). */
  isSaveAsDraft?: boolean;
  /** @deprecated Mysoft: leave empty; field will be removed. Ignored by builder. */
  connectorGuid?: string;
  prefix?: string;
  /** İlgili tenanttan veya sistemden atanan fatura numarası (örn: ABC2026000000207). */
  docNo?: string;
  /** Portal numaratör set kodu — doluysa prefix kullanılmaz. */
  numeratorSetCode?: string;
  /** Portal dizayn set kodu (e-fatura / e-arşiv XSLT seti). */
  xsltSetCode?: string;
  /** Portal’daki özel XSLT kodu; boşsa varsayılan veya GİB standart. */
  xsltName?: string;
  tenantIdentifierNumber?: string;
  pkAlias?: string;
  gbAlias?: string;
}

function digits(value?: string): string {
  return String(value || "").replace(/\D/g, "");
}

/** Mysoft InvoiceOutboxModel examples use MM/dd/yyyy HH:mm:ss. */
export function toMysoftDateTime(isoDate: string, time = "00:00:00"): string {
  const raw = String(isoDate || "").trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (match) return `${match[2]}/${match[3]}/${match[1]} ${time}`;
  const tr = /^(\d{2})\.(\d{2})\.(\d{4})/.exec(raw);
  if (tr) return `${tr[2]}/${tr[1]}/${tr[3]} ${time}`;
  return raw;
}

function unitCode(unit?: string): string {
  const value = String(unit || "Adet").toLocaleLowerCase("tr-TR");
  if (/kg|kilogram/.test(value)) return "KGM";
  if (/saat|hour/.test(value)) return "HUR";
  if (/ay|month/.test(value)) return "MON";
  if (/metre|meter|mt/.test(value)) return "MTR";
  if (/litre|liter|lt/.test(value)) return "LTR";
  return "C62";
}

function resolveEDocumentType(
  value?: string,
): MysoftOutgoingEDocumentType {
  const raw = String(value || "EFATURA")
    .toUpperCase()
    .replace(/[ _-]/g, "");
  if (raw.includes("ARSIV") || raw === "EARSIV" || raw === "E_ARSIV") {
    return "EARSIVFATURA";
  }
  return "EFATURA";
}

function round2(val: number): number {
  return Math.round((Number(val) + Number.EPSILON) * 100) / 100;
}

const STANDARD_WITHHOLDING_PERCENTAGES: Record<string, number> = {
  "601": 40,
  "602": 90,
  "603": 70,
  "604": 50,
  "605": 50,
  "606": 90,
  "607": 90,
  "608": 90,
  "609": 70,
  "610": 90,
  "611": 90,
  "612": 90,
  "613": 90,
  "614": 50,
  "615": 70,
  "616": 50,
  "617": 70,
  "618": 70,
  "619": 70,
  "620": 70,
  "621": 90,
  "622": 90,
  "623": 50,
  "624": 20,
  "625": 30,
  "626": 20,
  "627": 50,
};

function isFabricatedDefaultAlias(alias?: string): boolean {
  if (!alias) return false;
  return /^urn:mail:default(pk|gb)@\d{10,11}\.com\.tr$/i.test(alias.trim());
}

function mapLine(item: InvoiceItem, index: number) {
  const qty = Number(item.quantity) || 1;
  const unitPrice = round2(Number(item.unitPrice) || 0);
  const grossAmt = round2(qty * unitPrice);
  const discAmt = round2(Math.max(0, Number(item.discountAmount) || 0));
  const discRate = Number(item.discountRate) || (grossAmt > 0 && discAmt > 0 ? round2((discAmt / grossAmt) * 100) : 0);
  const amtTra = round2(
    item.totalWithoutVat !== undefined && item.totalWithoutVat !== null
      ? Number(item.totalWithoutVat)
      : Math.max(0, grossAmt - discAmt),
  );
  const vatRate = Number(item.vatRate) || 0;

  // Effective taxable amount (for special tax base / kar marji)
  const taxableAmtTra = round2(
    item.specialTaxBase !== undefined && item.specialTaxBase !== null && item.specialTaxBase >= 0
      ? Number(item.specialTaxBase)
      : amtTra,
  );
  const amtVatTra = round2(
    item.vatAmount !== undefined && item.vatAmount !== null
      ? Number(item.vatAmount)
      : (taxableAmtTra * vatRate) / 100,
  );

  // Tevkifat mapping (GİB UBL-TR: withholdingTaxableAmount is the VAT amount amtVatTra)
  const withholdingTaxTypeCode: string | undefined = item.withholdingCode
    ? String(item.withholdingCode).trim()
    : undefined;
  let withholdingTaxPercentage: number | undefined = undefined;
  let withholdingTaxAmount: number | undefined = undefined;
  let withholdingTaxableAmount: number | undefined = undefined;

  if (withholdingTaxTypeCode) {
    const standardPct = STANDARD_WITHHOLDING_PERCENTAGES[withholdingTaxTypeCode];
    if (standardPct !== undefined) {
      withholdingTaxPercentage = standardPct;
    } else if (
      item.withholdingRateNumerator &&
      item.withholdingRateDenominator &&
      item.withholdingRateDenominator > 0
    ) {
      withholdingTaxPercentage = Math.round(
        (item.withholdingRateNumerator / item.withholdingRateDenominator) * 100,
      );
    } else if (item.withholdingRate && item.withholdingRate > 0) {
      withholdingTaxPercentage =
        item.withholdingRate <= 1
          ? Math.round(item.withholdingRate * 100)
          : Math.round(item.withholdingRate);
    }

    if (withholdingTaxPercentage && withholdingTaxPercentage > 0) {
      withholdingTaxableAmount = amtVatTra;
      withholdingTaxAmount = round2((amtVatTra * withholdingTaxPercentage) / 100);
    }
  }

  // İstisna or Özel Matrah Reason Code
  const taxExemptionReasonCode =
    item.exemptionCode ||
    item.specialTaxBaseCode ||
    (vatRate === 0 ? "350" : undefined);

  const code =
    item.productId ||
    `LINE${String(index + 1).padStart(3, "0")}`;

  const allowanceCharge =
    discAmt > 0
      ? [
          {
            chargeIndicator: false,
            allowanceChargeReason: "İskonto",
            multiplierFactorNumeric: discRate,
            sequenceNumeric: 1,
            amount: discAmt,
            baseAmount: grossAmt,
          },
        ]
      : [];

  // Note: Do NOT send currencyCode inside invoiceDetail unless multi-currency
  // line items with manual root tax are used; Mysoft rejects detail.currencyCode otherwise.
  return {
    productCode: code.slice(0, 100),
    productName: (item.description || "Mal / Hizmet").slice(0, 150),
    unitCode: unitCode(item.unit),
    qty,
    unitPriceTra: unitPrice,
    amtTra,
    vatRate,
    amtVatTra,
    taxableAmtTra,
    taxExemptionReasonCode: taxExemptionReasonCode || undefined,
    withholdingTaxTypeCode: withholdingTaxTypeCode || undefined,
    withholdingTaxPercentage: withholdingTaxPercentage || undefined,
    withholdingTaxableAmount: withholdingTaxableAmount || undefined,
    withholdingTaxAmount: withholdingTaxAmount || undefined,
    allowanceCharge,
  };
}

/** Build the JSON body for POST /api/InvoiceOutbox/invoiceOutbox. */
export function buildMysoftInvoiceOutboxPayload(
  options: BuildMysoftInvoiceOutboxOptions,
): Record<string, unknown> {
  const { invoice, contact, company } = options;
  const eDocumentType = resolveEDocumentType(
    options.eDocumentType || invoice.eDocumentType,
  );
  const profile =
    eDocumentType === "EARSIVFATURA"
      ? "EARSIVFATURA"
      : String(options.profile || "TEMELFATURA").toUpperCase();
  const currency = String(invoice.currency || company.currency || "TRY").replace(
    "₺",
    "TRY",
  );

  // Auto-detect invoiceType if not explicitly passed
  let resolvedInvoiceType = String(options.invoiceType || invoice.invoiceProfileType || "SATIS").toUpperCase();
  if (!options.invoiceType && !invoice.invoiceProfileType) {
    if (invoice.items?.some((i) => i.withholdingCode || (i.withholdingRate && i.withholdingRate > 0))) {
      resolvedInvoiceType = "TEVKIFAT";
    } else if (invoice.items?.some((i) => i.specialTaxBaseCode || i.specialTaxBase !== undefined)) {
      resolvedInvoiceType = "OZELMATRAH";
    } else if (invoice.items?.some((i) => i.exemptionCode || i.vatRate === 0)) {
      resolvedInvoiceType = "ISTISNA";
    }
  }

  // Mükellef VKN/TCKN çözümü: options -> company tenantIdentifierNumber -> taxNumber / vknTckn -> mysoftCredentials
  const tenant =
    normalizeMysoftTenantIdentifier(
      options.tenantIdentifierNumber ||
        company.tenantIdentifierNumber ||
        company.taxNumber ||
        company.vknTckn ||
        company.mysoftCredentials?.tenantIdentifierNumber,
    ) || undefined;
  const rawBuyerTax = digits(contact.taxNumber || invoice.taxNumber);
  const buyerTax =
    rawBuyerTax.length === 10 || rawBuyerTax.length === 11
      ? rawBuyerTax
      : eDocumentType === "EARSIVFATURA"
        ? "11111111111"
        : rawBuyerTax || undefined;

  const rawDocNo =
    typeof options.docNo === "string" && options.docNo.trim()
      ? options.docNo.trim()
      : typeof invoice.invoiceNumber === "string" && invoice.invoiceNumber.trim()
        ? invoice.invoiceNumber.replace(/\s*\(TASLAK\)\s*$/i, "").trim()
        : "";

  // GİB & Mysoft rule: Belge numarası "GIB" veya "FYS" (veya geçersiz ön ek) ile başlayamaz.
  const isForbiddenOrInternalDocNo =
    /^(GIB|FYS|GLF|GDF|TED|FAT)/i.test(rawDocNo) ||
    !/^[A-Za-z0-9]{3}20\d{2}\d{9}$/.test(rawDocNo);
  const effectiveDocNo = isForbiddenOrInternalDocNo ? "" : rawDocNo.toUpperCase();

  const invoicePrefixMatch = /^[A-Za-z0-9]{3}20\d{2}/.test(effectiveDocNo)
    ? effectiveDocNo.slice(0, 3).toUpperCase()
    : "";
  const rawCompanyTypePrefix = (
    eDocumentType === "EARSIVFATURA" ? company.eArsivPrefix : company.eFaturaPrefix
  )
    ?.trim()
    .toUpperCase()
    .slice(0, 3);
  const companyTypePrefix =
    rawCompanyTypePrefix && !/^(GIB|FYS|GLF|GDF|TED|FAT)$/i.test(rawCompanyTypePrefix)
      ? rawCompanyTypePrefix
      : undefined;
  const rawOptPrefix = options.prefix?.trim().toUpperCase().slice(0, 3);
  const optPrefix =
    rawOptPrefix && !/^(GIB|FYS|GLF|GDF|TED|FAT)$/i.test(rawOptPrefix)
      ? rawOptPrefix
      : undefined;

  const prefix =
    optPrefix ||
    invoicePrefixMatch ||
    companyTypePrefix ||
    undefined;

  const mappedDetails = (invoice.items || []).map((item, index) =>
    mapLine(item, index),
  );

  // Compute invoiceCalculation totals (REQUIRED by Mysoft .NET backend even when isManuelCalculation is false;
  // omitting invoiceCalculation causes System.NullReferenceException: "Object reference not set to an instance of an object.")
  const calcLineExtension = round2(
    invoice.subtotal !== undefined && invoice.subtotal !== null
      ? Number(invoice.subtotal)
      : mappedDetails.reduce((sum, d) => sum + (Number(d.amtTra) || 0), 0),
  );
  const calcAllowanceTotal = round2(
    invoice.totalDiscount !== undefined && invoice.totalDiscount !== null
      ? Number(invoice.totalDiscount)
      : mappedDetails.reduce(
          (sum, d) => sum + (Number(d.allowanceCharge?.[0]?.amount) || 0),
          0,
        ),
  );
  const calcTaxExclusive = round2(
    invoice.effectiveTaxableAmount !== undefined && invoice.effectiveTaxableAmount !== null
      ? Number(invoice.effectiveTaxableAmount)
      : mappedDetails.reduce((sum, d) => sum + (Number(d.taxableAmtTra) || 0), 0),
  );
  const calcTotalVat = round2(
    invoice.totalVat !== undefined && invoice.totalVat !== null
      ? Number(invoice.totalVat)
      : mappedDetails.reduce((sum, d) => sum + (Number(d.amtVatTra) || 0), 0),
  );
  const calcWithholding = round2(
    invoice.totalWithholding !== undefined && invoice.totalWithholding !== null
      ? Number(invoice.totalWithholding)
      : mappedDetails.reduce((sum, d) => sum + (Number(d.withholdingTaxAmount) || 0), 0),
  );
  const calcTaxInclusive = round2(calcLineExtension + calcTotalVat);
  const calcPayable = round2(
    invoice.payableAmount !== undefined && invoice.payableAmount !== null
      ? Number(invoice.payableAmount)
      : invoice.grandTotal !== undefined && invoice.grandTotal !== null
        ? Number(invoice.grandTotal)
        : Math.max(0, calcTaxInclusive - calcWithholding),
  );

  const cleanPkAlias =
    eDocumentType === "EARSIVFATURA"
      ? undefined
      : options.pkAlias?.trim() && !isFabricatedDefaultAlias(options.pkAlias)
        ? options.pkAlias.trim()
        : undefined;

  const accountName = (contact.name || invoice.contactName || "Alıcı").trim();
  const isIndividualTckn = buyerTax && buyerTax.length === 11;
  const nameTokens = accountName.split(/\s+/).filter(Boolean);
  const personInfo =
    isIndividualTckn && nameTokens.length >= 2
      ? {
          firstName: nameTokens.slice(0, -1).join(" "),
          familyName: nameTokens[nameTokens.length - 1],
        }
      : isIndividualTckn
        ? {
            firstName: accountName,
            familyName: "-",
          }
        : undefined;

  // Shape mirrors Mysoft GET /api/InvoiceOutbox/createInvoiceOutboxTestJson
  // (docs/mysoft/invoice-outbox-sablon.json) — production defaults: SATIS / TEMEL.
  const payload: Record<string, unknown> = {
    isCalculateByApi: false, // Mysoft API: "isCalculateByApi Geliştirme aşamasındadır. Lütfen bu alanı false olarak geçiniz."
    eDocumentType,

    profile,
    invoiceType: resolvedInvoiceType,
    ettn: invoice.eDocumentEttn || undefined,
    prefix: options.numeratorSetCode ? undefined : prefix || undefined,
    numeratorSetCode: options.numeratorSetCode?.trim() || undefined,
    xsltSetCode: options.xsltSetCode?.trim() || undefined,
    xsltName: options.xsltName?.trim() || undefined,
    docNo: effectiveDocNo,
    docDate: toMysoftDateTime(invoice.issueDate),
    dueDate: invoice.dueDate
      ? toMysoftDateTime(invoice.dueDate)
      : undefined,
    currencyCode: currency,
    currencyRate: currency === "TRY" ? 1 : undefined,
    senderType: eDocumentType === "EARSIVFATURA" ? "ELEKTRONIK" : undefined,
    isSaveAsDraft: options.isSaveAsDraft === true,
    isAddPayableAmountString: true,
    isManuelCalculation: false,
    invoiceCalculation: {
      lineExtensionAmount: calcLineExtension,
      taxExclusiveAmount: calcTaxExclusive,
      taxInclusiveAmount: calcTaxInclusive,
      payableRoundingAmount: 0,
      payableAmount: calcPayable,
      allowanceTotalAmount: calcAllowanceTotal,
      chargeTotalAmount: 0,
    },
    referanceKey: invoice.id,
    tenantIdentifierNumber: tenant,
    pkAlias: cleanPkAlias,
    gbAlias: options.gbAlias?.trim() && !isFabricatedDefaultAlias(options.gbAlias) ? options.gbAlias.trim() : undefined,
    notes: (() => {
      const noteList: { note: string }[] = [];
      if (invoice.paymentMethod) {
        const pmLabel =
          invoice.paymentMethod === "nakit"
            ? "Nakit (Peşin Tahsilat)"
            : invoice.paymentMethod === "kredi_karti"
            ? "Kredi Kartı (POS Tahsilatı)"
            : invoice.paymentMethod === "eft_havale"
            ? "EFT / Havale (Banka Transferi)"
            : "Cari Hesap (Açık Hesap / Vadeli)";
        const rawNoteText = String(invoice.notes || "");
        if (!rawNoteText.includes("Ödeme Yöntemi:")) {
          noteList.push({
            note: `Ödeme Yöntemi: ${pmLabel}${invoice.paymentAccountName && invoice.paymentMethod !== "cari" ? ` (${invoice.paymentAccountName})` : ""}${invoice.paymentIban && invoice.paymentMethod === "eft_havale" ? ` - IBAN: ${invoice.paymentIban}` : ""}`,
          });
        }
      }
      if (String(invoice.notes || "").trim()) {
        noteList.push({ note: String(invoice.notes || "").trim() });
      }
      return noteList.length > 0 ? noteList : undefined;
    })(),
    invoiceAccount: {
      vknTckn: buyerTax || undefined,
      accountName,
      taxOfficeName: contact.taxOffice || invoice.taxOffice || undefined,
      countryName: "TÜRKİYE",
      cityName: contact.city || invoice.customerCity || "İstanbul",
      citySubdivision: contact.district || invoice.customerDistrict || "Merkez",
      streetName: contact.address || invoice.customerAddress || undefined,
      telephone1: contact.phone || invoice.customerPhone || undefined,
      email1: contact.email || invoice.customerEmail || undefined,
      personInfo,
    },
    invoiceDetail: mappedDetails,
  };

  // Mysoft (2026-08-25): connectorGuid kullanılmamalı — boş bırakılır.
  return payload;
}

/** Read invoiceETTN / docNo from Mysoft's InvoiceOutboxResultModel wrapper. */
export function extractMysoftOutboxResult(payload: unknown): {
  invoiceETTN?: string;
  docNo?: string;
  invoiceId?: number;
  message?: string;
} {
  const root =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};
  const data =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;
  const ettn = [data.invoiceETTN, data.ettn, root.invoiceETTN]
    .find((value) => typeof value === "string" && value.trim()) as
    | string
    | undefined;
  const docNo = [data.docNo, data.documentNo, root.docNo]
    .find((value) => typeof value === "string" && value.trim()) as
    | string
    | undefined;
  const invoiceIdRaw = data.invoiceId ?? root.invoiceId;
  const invoiceId =
    typeof invoiceIdRaw === "number"
      ? invoiceIdRaw
      : Number.isFinite(Number(invoiceIdRaw))
        ? Number(invoiceIdRaw)
        : undefined;
  const message =
    typeof root.message === "string"
      ? root.message
      : typeof data.message === "string"
        ? data.message
        : undefined;
  return { invoiceETTN: ettn, docNo, invoiceId, message };
}
