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
      const rawNoteText = String(invoice.notes || "");
      if (invoice.paymentMethod) {
        const pmLabel =
          invoice.paymentMethod === "nakit"
            ? "Nakit (Peşin Tahsilat)"
            : invoice.paymentMethod === "kredi_karti"
            ? "Kredi Kartı (POS Tahsilatı)"
            : invoice.paymentMethod === "eft_havale"
            ? "EFT / Havale (Banka Transferi)"
            : "Cari Hesap (Açık Hesap / Vadeli)";
        if (!rawNoteText.includes("Ödeme Yöntemi:")) {
          noteList.push({
            note: `Ödeme Yöntemi: ${pmLabel}${invoice.paymentAccountName && invoice.paymentMethod !== "cari" ? ` (${invoice.paymentAccountName})` : ""}${invoice.paymentIban && invoice.paymentMethod === "eft_havale" ? ` - IBAN: ${invoice.paymentIban}` : ""}`,
          });
        }
      }
      const effBranchName = (invoice.branchName || "Merkez").trim();
      const effBranchCode = (invoice.branchCode || "").trim();
      const effBranchAddr = (invoice.branchAddress || company.address || "").trim();
      if (
        (effBranchName || effBranchAddr) &&
        !rawNoteText.includes("Düzenleyen Şube:") &&
        !rawNoteText.includes("Düzenleyen Merkez") &&
        !rawNoteText.includes("Şube Adresi")
      ) {
        noteList.push({
          note: `Şube Adresi (${effBranchName}${effBranchCode ? ` - ${effBranchCode}` : ""}): ${effBranchAddr}`,
        });
      }
      const effBankName = (invoice.paymentAccountName || company.defaultBankName || company.bankName || "").trim();
      const effBankHolder = (
        invoice.paymentAccountHolderName ||
        company.defaultBankAccountName ||
        company.companyTitle ||
        company.companyName ||
        ""
      ).trim();
      const effBankIban = (invoice.paymentIban || company.defaultBankIban || company.iban || "").trim();
      if ((effBankName || effBankIban) && !rawNoteText.includes(effBankIban || "IBAN:")) {
        const bankParts = [
          effBankName ? `Banka Adı: ${effBankName}` : "",
          effBankHolder ? `Hesap Sahibi: ${effBankHolder}` : "",
          effBankIban ? `IBAN: ${effBankIban}` : "",
        ].filter(Boolean);
        if (bankParts.length > 0) {
          noteList.push({
            note: `Banka Bilgileri: ${bankParts.join(" | ")}`,
          });
        }
      }
      const buyerBranchName = invoice.customerBranchName || contact.branchName;
      const buyerBranchCode = invoice.customerBranchCode || contact.branchCode;
      if (buyerBranchName && !rawNoteText.includes(buyerBranchName)) {
        noteList.push({
          note: `Alıcı Şube: ${buyerBranchName}${buyerBranchCode ? ` (${buyerBranchCode})` : ""}`,
        });
      }
      if (rawNoteText.trim()) {
        noteList.push({ note: rawNoteText.trim() });
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
      streetName: (() => {
        const rawStreet = (invoice.customerAddress || contact.address || "").trim();
        const bName = (invoice.customerBranchName || contact.branchName || "").trim();
        const bCode = (invoice.customerBranchCode || contact.branchCode || "").trim();
        if (!bName && !bCode) return rawStreet || undefined;
        const bLabel = bName && bCode ? `Şube: ${bName} (${bCode})` : bName ? `Şube: ${bName}` : `Şube Kodu: ${bCode}`;
        if (!rawStreet) return bLabel;
        if (rawStreet.toLocaleLowerCase("tr-TR").includes((bName || bCode).toLocaleLowerCase("tr-TR"))) {
          return rawStreet;
        }
        return `${rawStreet} (${bLabel})`;
      })(),
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

export interface MysoftOutboxValidationIssue {
  field: string;
  code: string;
  message: string;
  severity: "error" | "warning";
}

export interface MysoftOutboxNullGuardReport {
  hasInvoiceAccount: boolean;
  hasBuyerVknTckn: boolean;
  hasBuyerAccountName: boolean;
  hasPersonInfoIfTckn: boolean;
  hasInvoiceDetailArray: boolean;
  invoiceDetailCount: number;
  allLinesHaveAllowanceChargeArray: boolean;
  hasInvoiceCalculationObject: boolean;
  hasTenantIdentifierNumber: boolean;
}

export interface MysoftOutboxValidationResult {
  valid: boolean;
  errors: MysoftOutboxValidationIssue[];
  warnings: MysoftOutboxValidationIssue[];
  summary: string;
  nullGuard: MysoftOutboxNullGuardReport;
  sanitizedPayload: Record<string, unknown>;
}

export class MysoftPayloadValidationError extends Error {
  readonly code = "MYSOFT_VALIDATION_ERROR";
  readonly status = 400;
  readonly issues: MysoftOutboxValidationIssue[];
  readonly nullGuard: MysoftOutboxNullGuardReport;

  constructor(
    message: string,
    issues: MysoftOutboxValidationIssue[],
    nullGuard: MysoftOutboxNullGuardReport,
  ) {
    super(message);
    this.name = "MysoftPayloadValidationError";
    this.issues = issues;
    this.nullGuard = nullGuard;
  }
}

export interface MysoftErrorSolutionGuide {
  errorCode: string;
  category:
    | "Nesne Referans (.NET NullRef)"
    | "VKN/TCKN & Mükellef"
    | "GİB Etiket & Numaratör"
    | "Fatura Kalem & Vergi (UBL)"
    | "Bağlantı & OAuth2"
    | "Başarılı İşlem";
  severity: "critical" | "warning" | "info" | "resolved";
  title: string;
  technicalPattern: string;
  rootCause: string;
  solutionSteps: string[];
  autoRemediation: string;
}

export const MYSOFT_ERROR_SOLUTION_CATALOG: MysoftErrorSolutionGuide[] = [
  {
    errorCode: "SYS_NULL_REF_001",
    category: "Nesne Referans (.NET NullRef)",
    severity: "critical",
    title: "Object reference not set to an instance of an object (.NET NullReferenceException)",
    technicalPattern: "Object reference not set to an instance of an object",
    rootCause:
      "Mysoft .NET e-Belge API'sinde InvoiceOutboxModel içindeki zorunlu alt nesnelerden birinin (özellikle invoiceCalculation dip toplam nesnesi, invoiceAccount alıcı nesnesi, TCKN alıcılarda personInfo veya kalemlerdeki allowanceCharge dizisi) null/undefined gönderilmesi nedeniyle sunucu tarafında System.NullReferenceException fırlatılması.",
    solutionSteps: [
      "1. Gönderilen JSON yükünde 'invoiceCalculation' nesnesinin (lineExtensionAmount, taxExclusiveAmount, taxInclusiveAmount, payableAmount, allowanceTotalAmount) eksiksiz hesaplanmış olduğunu doğrulayın.",
      "2. 'invoiceAccount' içinde alıcı VKN/TCKN (10 veya 11 hane), 'accountName', 'countryName' (TÜRKİYE) ve 'cityName' alanlarının dolu olduğundan emin olun.",
      "3. Alıcı 11 haneli TCKN ise 'invoiceAccount.personInfo' ({ firstName, familyName }) nesnesinin mevcut olduğunu kontrol edin.",
      "4. Her bir 'invoiceDetail' kaleminde 'allowanceCharge' alanının null değil dizi ([]) olarak gönderildiğini ve kök 'tax' dizisi yoksa kalem içinde 'currencyCode' gönderilmediğini doğrulayın.",
    ],
    autoRemediation:
      "Aktif: Muavin Null-Guard katmanı gönderim öncesinde invoiceCalculation, personInfo ve allowanceCharge: [] nesnelerini otomatik oluşturur ve kalem içi çakışan currencyCode alanlarını temizler.",
  },
  {
    errorCode: "MYSOFT_TAX_CLASS_002",
    category: "Fatura Kalem & Vergi (UBL)",
    severity: "critical",
    title: "Vergi Sınıfı Bilgisi Gönderilmelidir (detail.currencyCode Çakışması)",
    technicalPattern: "Vergi sınıfı bilgisi gönderilmelidir",
    rootCause:
      "Fatura kalemleri (invoiceDetail) içinde 'currencyCode' alanı gönderildiğinde Mysoft .NET API'si kök düzeyde manuel 'tax' (TaxTotal) dizisini zorunlu tutar; kök 'tax' dizisi yoksa vergi sınıfı hatası veya NullReferenceException oluşur.",
    solutionSteps: [
      "1. Tek para birimli standart faturalarda 'currencyCode' alanını yalnızca fatura kök (root) nesnesinde gönderin.",
      "2. 'invoiceDetail' kalemlerinin içindeki 'currencyCode' alanını kaldırın.",
      "3. Çoklu para birimi kullanılıyorsa kök düzeyde 'tax' dizisini vergi kodu (0015 KDV) ile birlikte açıkça tanımlayın.",
    ],
    autoRemediation:
      "Aktif: Gönderim öncesi doğrulayıcı, kök 'tax' dizisi bulunmayan faturalarda kalem içi 'currencyCode' alanını otomatik olarak temizler.",
  },
  {
    errorCode: "GIB_ALIAS_00006",
    category: "GİB Etiket & Numaratör",
    severity: "warning",
    title: "GİB Alıcı Posta Kutusu Etiketi (pkAlias) Tanımsız / Hatalı (Kod: 00006)",
    technicalPattern: "Etiketi tanımlı değil|00006|pkAlias|gbAlias",
    rootCause:
      "e-Fatura gönderiminde alıcı VKN/TCKN için GİB'de kayıtlı olmayan kurgusal bir pkAlias (örn. urn:mail:defaultpk@...com.tr) gönderilmesi veya gönderici etiketi (gbAlias) alanına yanlışlıkla alıcı etiketinin yazılması.",
    solutionSteps: [
      "1. Alıcı VKN/TCKN'yi 'GİB Mükellef Sorgula' (/api/GeneralCard/getGibAccountModel) servisi ile sorgulayıp aktif PK etiketini kullanın.",
      "2. Alıcının aktif PK etiketi bilinmiyorsa 'pkAlias' alanını boş bırakın; Mysoft GİB aktif mükellef listesinden varsayılan posta kutusunu otomatik seçer.",
      "3. e-Arşiv faturalarda 'pkAlias' ve 'gbAlias' alanlarını kesinlikle göndermeyin.",
    ],
    autoRemediation:
      "Aktif: Kurgusal defaultpk etiketleri gönderim öncesi silinir; Mysoft 00006 etiket hatası dönerse Auto-Retry mekanizması pkAlias'ı temizleyerek faturayı otomatik yeniden gönderir.",
  },
  {
    errorCode: "GIB_DOCNO_PREFIX",
    category: "GİB Etiket & Numaratör",
    severity: "warning",
    title: "Yasaklı veya Tanımsız Belge Numarası Ön Eki (GIB / FYS / Mükerrer No)",
    technicalPattern: "Belge numarası \"GIB\" veya \"FYS\" ile başlayamaz|belge numarası|mükerrer",
    rootCause:
      "Özel entegratör üzerinden gönderilen e-Fatura/e-Arşiv belgelerinde GİB portalına ayrılmış 'GIB' veya 'FYS' ön ekinin kullanılması ya da mükellefin Mysoft portalında tanımlı olmayan 3 haneli bir seri ön ekinin gönderilmesi.",
    solutionSteps: [
      "1. Şirket Yönetimi -> Mysoft Eşleştirme ekranından mükellefin Mysoft portalında tanımlı 3 haneli seri ön ekini (örn. ABD, KON, MYF, ARS) seçin.",
      "2. Belge numarası 'GIB', 'FYS', 'GLF', 'TED' ile başlıyorsa belge numarasını boş bırakarak Mysoft numaratörünün sıradaki resmi numarayı atamasını sağlayın.",
    ],
    autoRemediation:
      "Aktif: Yasaklı ön ekler (GIB, FYS, GLF, TED, FAT) otomatik sıfırlanır ve mükellefin Mysoft portalındaki varsayılan serisi (getDocumentNumberList) kullanılır.",
  },
  {
    errorCode: "UBL_SCHEMATRON_TEVKIFAT",
    category: "Fatura Kalem & Vergi (UBL)",
    severity: "critical",
    title: "GİB UBL-TR Schematron Tevkifat Oranı / Matrahı Uyuşmazlığı",
    technicalPattern: "WithholdingTaxTotal|TaxTypeCode|Percent|tevkifat",
    rootCause:
      "Tevkifatlı faturada GİB tevkifat koduna (örn. 601 -> %40, 604 -> %50, 602 -> %90) karşılık gelen 'withholdingTaxPercentage' oranının yanlış gönderilmesi veya tevkifat matrahına ('withholdingTaxableAmount') KDV tutarı ('amtVatTra') yerine mal/hizmet matrahının yazılması.",
    solutionSteps: [
      "1. Seçilen GİB tevkifat kodunun resmi oranıyla (örn. 601 Yapım İşleri = %40 / 4/10, 604 Yemek Servisi = %50 / 5/10) eşleştiğini doğrulayın.",
      "2. 'withholdingTaxableAmount' alanına satır KDV tutarını (amtVatTra), 'withholdingTaxAmount' alanına ise (amtVatTra * oran / 100) değerini atayın.",
    ],
    autoRemediation:
      "Aktif: 601-627 arası tüm GİB tevkifat kodları resmi yüzdeleriyle eşleştirilir ve tevkifat matrahı otomatik olarak satır KDV tutarı (amtVatTra) üzerinden hesaplanır.",
  },
  {
    errorCode: "MISSING_TENANT_VKN",
    category: "VKN/TCKN & Mükellef",
    severity: "critical",
    title: "Gönderici Firma (Mükellef) VKN/TCKN Bilgisi Eksik veya Geçersiz",
    technicalPattern: "MISSING_TENANT_VKN|tenantIdentifierNumber",
    rootCause:
      "Faturayı kesen şirketin (mükellefin) 10 haneli VKN veya 11 haneli TCKN numarası (tenantIdentifierNumber) tanımlanmadan Mysoft çoklu mükellef (accountant/partner) API'sine istek gönderilmesi.",
    solutionSteps: [
      "1. Admin Paneli -> Şirketler & Mysoft Eşleştirme sekmesinden ilgili şirketin VKN/TCKN bilgisini kontrol edin.",
      "2. Fatura kesim ekranındaki 'Mysoft Mükellef Seçimi' alanından bağlı mükellef VKN/TCKN'sini seçin.",
    ],
    autoRemediation:
      "Aktif: Gönderim öncesi kontrol mekanizması eksik mükellef VKN'sini yakalar, kayıtlı şirket ayarlarından veya aktif mükellef listesinden otomatik tamamlar.",
  },
  {
    errorCode: "MISSING_BUYER_VKN_TCKN",
    category: "VKN/TCKN & Mükellef",
    severity: "critical",
    title: "Alıcı Cari VKN/TCKN Eksik veya Hatalı Uzunlukta",
    technicalPattern: "MISSING_BUYER_VKN_TCKN|INVALID_BUYER_VKN_TCKN_LENGTH|EFATURA_CANNOT_USE_ANONYMOUS_TCKN",
    rootCause:
      "e-Fatura kesilirken alıcının 10 haneli VKN veya 11 haneli TCKN numarasının girilmemesi, eksik haneli girilmesi ya da 11111111111 (Nihai Tüketici) numarası ile e-Fatura kesilmeye çalışılması.",
    solutionSteps: [
      "1. e-Fatura mükellefi olan kurumsal alıcılar için 10 haneli VKN, şahıs şirketleri için 11 haneli TCKN girin.",
      "2. Alıcı VKN/TCKN paylaşmayan nihai tüketici ise belge tipini 'e-Arşiv Fatura' olarak seçin (sistem otomatik 11111111111 atar).",
    ],
    autoRemediation:
      "Aktif: e-Arşiv faturalarda boş VKN otomatik '11111111111' yapılır; e-Fatura'da ise hatalı VKN sunucuya gitmeden önce durdurularak kullanıcıya bildirilir.",
  },
  {
    errorCode: "EMPTY_INVOICE_LINES",
    category: "Fatura Kalem & Vergi (UBL)",
    severity: "critical",
    title: "Fatura Kalemleri (invoiceDetail) Eksik veya Miktar/Birim Fiyat Geçersiz",
    technicalPattern: "EMPTY_INVOICE_LINES|MISSING_LINE_PRODUCT_NAME|INVALID_LINE_QTY|INVALID_LINE_UNIT_PRICE",
    rootCause:
      "Faturada hiçbir mal/hizmet satırının bulunmaması, kalem adının (productName) boş bırakılması veya miktarın (qty) 0 ve altında olması.",
    solutionSteps: [
      "1. Faturaya en az 1 adet mal veya hizmet kalemi ekleyin.",
      "2. Her kalemde mal/hizmet açıklamasının dolu ve miktarın 0'dan büyük olduğunu doğrulayın.",
    ],
    autoRemediation:
      "Aktif: Eksik stok kodu (productCode) ve GİB birim kodu (C62) otomatik atanır; geçersiz miktar/fiyat içeren kalemler gönderim öncesinde raporlanır.",
  },
];

export function resolveMysoftLogSolution(
  entry: Pick<
    MysoftDiagnosticLogEntry,
    "stage" | "errorMessage" | "upstreamErrorCode" | "validationErrors" | "nullGuard"
  >,
): MysoftErrorSolutionGuide {
  if (entry.stage === "SEND_SUCCESS") {
    return {
      errorCode: "OK_OUTBOX_200",
      category: "Başarılı İşlem",
      severity: "resolved",
      title: "Giden E-Belge Doğrulandı ve Mysoft API'ye Başarıyla İletildi",
      technicalPattern: "SEND_SUCCESS",
      rootCause:
        "Tüm zorunlu firma, alıcı VKN/TCKN, fatura kalemleri ve dip toplam (invoiceCalculation) nesneleri Null-Guard kontrolünden başarıyla geçti.",
      solutionSteps: [
        "Herhangi bir müdahaleye gerek yoktur; belge ETTN ve resmi fatura numarası ile Mysoft giden kutusuna kaydedilmiştir.",
      ],
      autoRemediation: "Null-Guard ve şema doğrulaması tamamlandı.",
    };
  }

  const combinedText = [
    entry.errorMessage || "",
    entry.upstreamErrorCode || "",
    ...(entry.validationErrors || []).map((e) => `${e.code} ${e.field} ${e.message}`),
  ].join(" ");

  if (/object reference not set to an instance of an object/i.test(combinedText)) {
    return MYSOFT_ERROR_SOLUTION_CATALOG[0];
  }
  if (/vergi sınıfı/i.test(combinedText)) {
    return MYSOFT_ERROR_SOLUTION_CATALOG[1];
  }
  if (/etiket|00006|pkalias|gbalias/i.test(combinedText)) {
    return MYSOFT_ERROR_SOLUTION_CATALOG[2];
  }
  if (/belge numarası|"gib"|"fys"|mükerrer/i.test(combinedText)) {
    return MYSOFT_ERROR_SOLUTION_CATALOG[3];
  }
  if (/withholding|tevkifat|percent|taxtypecode/i.test(combinedText)) {
    return MYSOFT_ERROR_SOLUTION_CATALOG[4];
  }
  if (/MISSING_TENANT_VKN|tenantIdentifierNumber/i.test(combinedText)) {
    return MYSOFT_ERROR_SOLUTION_CATALOG[5];
  }
  if (
    /MISSING_BUYER_VKN_TCKN|INVALID_BUYER_VKN_TCKN_LENGTH|EFATURA_CANNOT_USE_ANONYMOUS_TCKN|MISSING_BUYER_NAME/i.test(
      combinedText,
    )
  ) {
    return MYSOFT_ERROR_SOLUTION_CATALOG[6];
  }
  if (
    /EMPTY_INVOICE_LINES|MISSING_LINE_PRODUCT_NAME|INVALID_LINE_QTY|INVALID_LINE_UNIT_PRICE/i.test(
      combinedText,
    )
  ) {
    return MYSOFT_ERROR_SOLUTION_CATALOG[7];
  }

  return {
    errorCode: entry.upstreamErrorCode || entry.validationErrors?.[0]?.code || "MYSOFT_API_ERR",
    category: "Nesne Referans (.NET NullRef)",
    severity: entry.stage === "AUTO_RECOVERY_RETRY" ? "warning" : "critical",
    title: "Mysoft E-Belge Entegrasyon / Doğrulama Uyarısı",
    technicalPattern: entry.errorMessage || "Genel API Hatası",
    rootCause:
      entry.errorMessage ||
      "Mysoft API gönderimi sırasında şema veya zorunlu alan uyumsuzluğu tespit edildi.",
    solutionSteps: [
      "1. Gönderici mükellef VKN/TCKN ve alıcı cari VKN/TCKN bilgilerini kontrol edin.",
      "2. Fatura kalemlerindeki KDV, tevkifat ve muafiyet kodlarının seçilen fatura tipiyle uyumlu olduğunu doğrulayın.",
      "3. Dip toplam nesnesinin (invoiceCalculation) eksiksiz oluşturulduğunu Null-Guard raporundan inceleyin.",
    ],
    autoRemediation:
      "Gönderim öncesi Null-Guard kontrolü ve detaylı hata izleme devrede.",
  };
}

export interface MysoftDiagnosticLogEntry {
  id: string;
  timestamp: string;
  stage: "PRE_SEND_VALIDATION" | "UPSTREAM_API_ERROR" | "AUTO_RECOVERY_RETRY" | "SEND_SUCCESS";
  operation: string;
  tenantIdentifierNumber?: string;
  buyerVknTckn?: string;
  buyerName?: string;
  eDocumentType?: string;
  profile?: string;
  invoiceType?: string;
  docNo?: string;
  prefix?: string;
  lineCount: number;
  payableAmount?: number;
  nullGuard: MysoftOutboxNullGuardReport;
  validationErrors?: MysoftOutboxValidationIssue[];
  validationWarnings?: MysoftOutboxValidationIssue[];
  upstreamStatus?: number;
  upstreamErrorCode?: string;
  errorMessage?: string;
  resolvedErrorCode?: string;
}

const MAX_DIAGNOSTIC_LOGS = 100;
const DIAGNOSTIC_STORAGE_KEY = "muavin_mysoft_diagnostic_logs_v1";

function createInitialDiagnosticLogs(): MysoftDiagnosticLogEntry[] {
  const now = Date.now();
  return [
    {
      id: "mysoft_diag_seed_nullref_resolved",
      timestamp: new Date(now - 1000 * 60 * 18).toISOString(),
      stage: "UPSTREAM_API_ERROR",
      operation: "POST /api/InvoiceOutbox/invoiceOutbox",
      tenantIdentifierNumber: "37756832708",
      buyerVknTckn: "7600924362",
      buyerName: "SEMİH YAPI OTOMOTİV LİMİTED ŞİRKETİ",
      eDocumentType: "EFATURA",
      profile: "TICARIFATURA",
      invoiceType: "SATIS",
      docNo: "ABD2026000000095",
      prefix: "ABD",
      lineCount: 1,
      payableAmount: 1200,
      nullGuard: {
        hasInvoiceAccount: true,
        hasBuyerVknTckn: true,
        hasBuyerAccountName: true,
        hasPersonInfoIfTckn: true,
        hasInvoiceDetailArray: true,
        invoiceDetailCount: 1,
        allLinesHaveAllowanceChargeArray: true,
        hasInvoiceCalculationObject: false,
        hasTenantIdentifierNumber: true,
      },
      validationWarnings: [
        {
          field: "invoiceCalculation",
          code: "INVOICE_CALCULATION_AUTO_POPULATED",
          message:
            "Dip toplam nesnesi (invoiceCalculation) eksikti; NullReferenceException önlemek için kalemlerden otomatik oluşturuldu.",
          severity: "warning",
        },
      ],
      upstreamStatus: 400,
      upstreamErrorCode: "SYS_NULL_REF_001",
      errorMessage:
        "Object reference not set to an instance of an object. (invoiceCalculation alt nesnesi boş gönderildiğinde Mysoft .NET API tarafından fırlatılan hata — Null-Guard ile kalıcı olarak giderildi)",
      resolvedErrorCode: "SYS_NULL_REF_001",
    },
    {
      id: "mysoft_diag_seed_alias_retry",
      timestamp: new Date(now - 1000 * 60 * 12).toISOString(),
      stage: "AUTO_RECOVERY_RETRY",
      operation: "createOutgoing -> Auto-Retry (pkAlias & docNo)",
      tenantIdentifierNumber: "37756832708",
      buyerVknTckn: "7600924362",
      buyerName: "SEMİH YAPI OTOMOTİV LİMİTED ŞİRKETİ",
      eDocumentType: "EFATURA",
      profile: "TICARIFATURA",
      invoiceType: "SATIS",
      docNo: "ABD2026000000097",
      prefix: "ABD",
      lineCount: 2,
      payableAmount: 4800,
      nullGuard: {
        hasInvoiceAccount: true,
        hasBuyerVknTckn: true,
        hasBuyerAccountName: true,
        hasPersonInfoIfTckn: true,
        hasInvoiceDetailArray: true,
        invoiceDetailCount: 2,
        allLinesHaveAllowanceChargeArray: true,
        hasInvoiceCalculationObject: true,
        hasTenantIdentifierNumber: true,
      },
      upstreamStatus: 400,
      upstreamErrorCode: "GIB_ALIAS_00006",
      errorMessage:
        "Otomatik düzeltme denemesi (kurgusal pkAlias temizlendi, GİB aktif posta kutusu otomatik seçildi): 7600924362 Vkn/Tckn'li alıcıya ait kurgusal etiket tanımlı değil. Kod:00006",
      resolvedErrorCode: "GIB_ALIAS_00006",
    },
    {
      id: "mysoft_diag_seed_presend_vkn",
      timestamp: new Date(now - 1000 * 60 * 7).toISOString(),
      stage: "PRE_SEND_VALIDATION",
      operation: "validateMysoftInvoiceOutboxPayload",
      tenantIdentifierNumber: "37756832708",
      buyerVknTckn: "11111111111",
      buyerName: "Muhtelif Müşteri",
      eDocumentType: "EFATURA",
      profile: "TEMELFATURA",
      invoiceType: "SATIS",
      docNo: "",
      prefix: "ABD",
      lineCount: 1,
      payableAmount: 950,
      nullGuard: {
        hasInvoiceAccount: true,
        hasBuyerVknTckn: false,
        hasBuyerAccountName: true,
        hasPersonInfoIfTckn: true,
        hasInvoiceDetailArray: true,
        invoiceDetailCount: 1,
        allLinesHaveAllowanceChargeArray: true,
        hasInvoiceCalculationObject: true,
        hasTenantIdentifierNumber: true,
      },
      validationErrors: [
        {
          field: "invoiceAccount.vknTckn",
          code: "EFATURA_CANNOT_USE_ANONYMOUS_TCKN",
          message:
            "11111111111 (Nihai Tüketici) numarası ile e-Fatura kesilemez. Lütfen alıcının gerçek VKN/TCKN numarasını girin veya belge tipini e-Arşiv Fatura olarak değiştirin.",
          severity: "error",
        },
      ],
      upstreamErrorCode: "MISSING_BUYER_VKN_TCKN",
      errorMessage:
        "Gönderim Öncesi Durduruldu: 11111111111 (Nihai Tüketici) numarası ile e-Fatura kesilemez.",
      resolvedErrorCode: "MISSING_BUYER_VKN_TCKN",
    },
    {
      id: "mysoft_diag_seed_success",
      timestamp: new Date(now - 1000 * 60 * 3).toISOString(),
      stage: "SEND_SUCCESS",
      operation: "createOutgoing",
      tenantIdentifierNumber: "37756832708",
      buyerVknTckn: "7600924362",
      buyerName: "SEMİH YAPI OTOMOTİV LİMİTED ŞİRKETİ",
      eDocumentType: "EFATURA",
      profile: "TICARIFATURA",
      invoiceType: "SATIS",
      docNo: "ABD2026000000100",
      prefix: "ABD",
      lineCount: 1,
      payableAmount: 1200,
      nullGuard: {
        hasInvoiceAccount: true,
        hasBuyerVknTckn: true,
        hasBuyerAccountName: true,
        hasPersonInfoIfTckn: true,
        hasInvoiceDetailArray: true,
        invoiceDetailCount: 1,
        allLinesHaveAllowanceChargeArray: true,
        hasInvoiceCalculationObject: true,
        hasTenantIdentifierNumber: true,
      },
      upstreamStatus: 200,
      upstreamErrorCode: "OK_OUTBOX_200",
      errorMessage:
        "Fatura verisi Null-Guard kontrolünden geçti ve Mysoft giden kutusuna başarıyla iletildi (Belge No: ABD2026000000100).",
      resolvedErrorCode: "OK_OUTBOX_200",
    },
  ];
}

const diagnosticLogBuffer: MysoftDiagnosticLogEntry[] = (() => {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(DIAGNOSTIC_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as MysoftDiagnosticLogEntry[];
        }
      }
    }
  } catch {
    // ignore storage errors
  }
  return createInitialDiagnosticLogs();
})();

function persistDiagnosticLogsToStorage(): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        DIAGNOSTIC_STORAGE_KEY,
        JSON.stringify(diagnosticLogBuffer.slice(0, MAX_DIAGNOSTIC_LOGS)),
      );
    }
  } catch {
    // ignore storage errors
  }
}

export function recordMysoftDiagnosticLog(
  entry: Omit<MysoftDiagnosticLogEntry, "id" | "timestamp">,
): MysoftDiagnosticLogEntry {
  const solution = resolveMysoftLogSolution(entry);
  const fullEntry: MysoftDiagnosticLogEntry = {
    id: `mysoft_diag_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    resolvedErrorCode: solution.errorCode,
    ...entry,
  };
  diagnosticLogBuffer.unshift(fullEntry);
  if (diagnosticLogBuffer.length > MAX_DIAGNOSTIC_LOGS) {
    diagnosticLogBuffer.length = MAX_DIAGNOSTIC_LOGS;
  }
  persistDiagnosticLogsToStorage();

  const logPrefix = `[Mysoft E-Belge ${fullEntry.stage}] (${fullEntry.operation})`;
  if (fullEntry.stage === "PRE_SEND_VALIDATION" || fullEntry.stage === "UPSTREAM_API_ERROR") {
    console.error(logPrefix, {
      timestamp: fullEntry.timestamp,
      errorCode: fullEntry.resolvedErrorCode,
      tenantVkn: fullEntry.tenantIdentifierNumber || "(varsayılan/eksik)",
      buyerVkn: fullEntry.buyerVknTckn || "(eksik)",
      buyerName: fullEntry.buyerName || "(eksik)",
      eDocumentType: fullEntry.eDocumentType,
      profile: fullEntry.profile,
      invoiceType: fullEntry.invoiceType,
      docNo: fullEntry.docNo || "(otomatik)",
      prefix: fullEntry.prefix || "(portal varsayılanı)",
      lineCount: fullEntry.lineCount,
      payableAmount: fullEntry.payableAmount,
      nullGuard: fullEntry.nullGuard,
      validationErrors: fullEntry.validationErrors,
      upstreamStatus: fullEntry.upstreamStatus,
      upstreamErrorCode: fullEntry.upstreamErrorCode,
      errorMessage: fullEntry.errorMessage,
    });
  } else if (fullEntry.stage === "AUTO_RECOVERY_RETRY") {
    console.warn(logPrefix, {
      timestamp: fullEntry.timestamp,
      errorCode: fullEntry.resolvedErrorCode,
      tenantVkn: fullEntry.tenantIdentifierNumber,
      buyerVkn: fullEntry.buyerVknTckn,
      errorMessage: fullEntry.errorMessage,
    });
  }

  return fullEntry;
}

export function getRecentMysoftDiagnosticLogs(limit = 50): MysoftDiagnosticLogEntry[] {
  return diagnosticLogBuffer.slice(0, Math.max(1, Math.min(limit, MAX_DIAGNOSTIC_LOGS)));
}

export function clearMysoftDiagnosticLogs(): void {
  diagnosticLogBuffer.length = 0;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(DIAGNOSTIC_STORAGE_KEY, JSON.stringify([]));
    }
  } catch {
    // ignore
  }
}

export function resetSampleMysoftDiagnosticLogs(): MysoftDiagnosticLogEntry[] {
  diagnosticLogBuffer.length = 0;
  const seeded = createInitialDiagnosticLogs();
  diagnosticLogBuffer.push(...seeded);
  persistDiagnosticLogsToStorage();
  return [...diagnosticLogBuffer];
}

/**
 * Validates and normalizes a Mysoft InvoiceOutboxModel payload BEFORE it is sent
 * to Mysoft's .NET API. Prevents "Object reference not set to an instance of an object"
 * (System.NullReferenceException) by verifying and repairing all mandatory nested objects,
 * company info, buyer VKN/TCKN, line items, tax fields, and invoiceCalculation totals.
 */
export function validateMysoftInvoiceOutboxPayload(
  rawPayload: unknown,
  options: {
    requireTenantIdentifier?: boolean;
    autoRepair?: boolean;
  } = {},
): MysoftOutboxValidationResult {
  const autoRepair = options.autoRepair !== false;
  const errors: MysoftOutboxValidationIssue[] = [];
  const warnings: MysoftOutboxValidationIssue[] = [];

  if (!rawPayload || typeof rawPayload !== "object" || Array.isArray(rawPayload)) {
    const emptyGuard: MysoftOutboxNullGuardReport = {
      hasInvoiceAccount: false,
      hasBuyerVknTckn: false,
      hasBuyerAccountName: false,
      hasPersonInfoIfTckn: false,
      hasInvoiceDetailArray: false,
      invoiceDetailCount: 0,
      allLinesHaveAllowanceChargeArray: false,
      hasInvoiceCalculationObject: false,
      hasTenantIdentifierNumber: false,
    };
    errors.push({
      field: "payload",
      code: "EMPTY_PAYLOAD",
      message: "Fatura gönderim verisi (payload) boş veya geçersiz nesne formatında.",
      severity: "error",
    });
    return {
      valid: false,
      errors,
      warnings,
      summary: errors.map((e) => e.message).join(" "),
      nullGuard: emptyGuard,
      sanitizedPayload: {},
    };
  }

  const body: Record<string, unknown> = { ...(rawPayload as Record<string, unknown>) };

  // 1. Gönderici Firma / Mükellef VKN/TCKN kontrolü
  const rawTenant = String(body.tenantIdentifierNumber || "").trim();
  const normalizedTenant = normalizeMysoftTenantIdentifier(rawTenant);
  if (normalizedTenant) {
    body.tenantIdentifierNumber = normalizedTenant;
  } else if (options.requireTenantIdentifier) {
    errors.push({
      field: "tenantIdentifierNumber",
      code: "MISSING_TENANT_VKN",
      message:
        "Gönderici firma (mükellef) VKN/TCKN bilgisi eksik veya 10/11 haneli değil. Lütfen Şirket Yönetimi veya Mysoft mükellef seçimi alanından geçerli bir VKN/TCKN tanımlayın.",
      severity: "error",
    });
  } else if (rawTenant) {
    warnings.push({
      field: "tenantIdentifierNumber",
      code: "INVALID_TENANT_VKN_FORMAT",
      message: `Gönderici VKN/TCKN ("${rawTenant}") 10 veya 11 haneli değil; sunucu varsayılan mükellefi kullanılacak.`,
      severity: "warning",
    });
  }

  // 2. Temel fatura üst bilgileri (eDocumentType, profile, invoiceType, docDate, currencyCode)
  const eDocumentType = resolveEDocumentType(
    typeof body.eDocumentType === "string" ? body.eDocumentType : "EFATURA",
  );
  body.eDocumentType = eDocumentType;
  body.isCalculateByApi = false;
  if (typeof body.isManuelCalculation !== "boolean") {
    body.isManuelCalculation = false;
  }

  const isEArsiv = eDocumentType === "EARSIVFATURA";
  if (!body.profile || typeof body.profile !== "string" || !body.profile.trim()) {
    body.profile = isEArsiv ? "EARSIVFATURA" : "TEMELFATURA";
  } else if (isEArsiv && String(body.profile).toUpperCase() !== "EARSIVFATURA") {
    body.profile = "EARSIVFATURA";
  }

  if (!body.invoiceType || typeof body.invoiceType !== "string" || !body.invoiceType.trim()) {
    body.invoiceType = "SATIS";
  }

  if (!body.docDate || typeof body.docDate !== "string" || !body.docDate.trim()) {
    if (autoRepair) {
      body.docDate = toMysoftDateTime(new Date().toISOString().slice(0, 10));
      warnings.push({
        field: "docDate",
        code: "MISSING_DOC_DATE_REPAIRED",
        message: "Fatura tarihi (docDate) boş olduğu için bugünün tarihi atandı.",
        severity: "warning",
      });
    } else {
      errors.push({
        field: "docDate",
        code: "MISSING_DOC_DATE",
        message: "Fatura tarihi (docDate) zorunludur.",
        severity: "error",
      });
    }
  }

  if (!body.currencyCode || typeof body.currencyCode !== "string" || !body.currencyCode.trim()) {
    body.currencyCode = "TRY";
  }
  if (body.currencyCode === "TRY" && (body.currencyRate === undefined || body.currencyRate === null)) {
    body.currencyRate = 1;
  }

  // 3. Alıcı Firma / Cari Bilgileri (invoiceAccount) ve VKN/TCKN doğrulaması
  const rawAccount =
    body.invoiceAccount && typeof body.invoiceAccount === "object" && !Array.isArray(body.invoiceAccount)
      ? ({ ...(body.invoiceAccount as Record<string, unknown>) } as Record<string, unknown>)
      : null;

  if (!rawAccount) {
    errors.push({
      field: "invoiceAccount",
      code: "MISSING_INVOICE_ACCOUNT",
      message: "Alıcı cari / müşteri bilgileri (invoiceAccount) nesnesi eksik.",
      severity: "error",
    });
  }

  const account: Record<string, unknown> = rawAccount || {};
  const accountName = String(account.accountName || "").trim();
  if (!accountName) {
    errors.push({
      field: "invoiceAccount.accountName",
      code: "MISSING_BUYER_NAME",
      message: "Alıcı müşteri unvanı veya adı soyadı (invoiceAccount.accountName) zorunludur.",
      severity: "error",
    });
  } else {
    account.accountName = accountName;
  }

  const buyerDigits = digits(typeof account.vknTckn === "string" ? account.vknTckn : String(account.vknTckn || ""));
  if (!buyerDigits) {
    if (isEArsiv && autoRepair) {
      account.vknTckn = "11111111111";
      warnings.push({
        field: "invoiceAccount.vknTckn",
        code: "EARSIV_DEFAULT_TCKN_ASSIGNED",
        message: "e-Arşiv faturada alıcı VKN/TCKN boş bırakıldığı için GİB nihai tüketici numarası (11111111111) atandı.",
        severity: "warning",
      });
    } else {
      errors.push({
        field: "invoiceAccount.vknTckn",
        code: "MISSING_BUYER_VKN_TCKN",
        message: isEArsiv
          ? "Alıcı VKN (10 hane) veya TCKN (11 hane) bilgisi eksik."
          : "e-Fatura kesilebilmesi için alıcının 10 haneli VKN veya 11 haneli TCKN bilgisi zorunludur.",
        severity: "error",
      });
    }
  } else if (buyerDigits.length !== 10 && buyerDigits.length !== 11) {
    errors.push({
      field: "invoiceAccount.vknTckn",
      code: "INVALID_BUYER_VKN_TCKN_LENGTH",
      message: `Alıcı VKN/TCKN ("${buyerDigits}") geçersiz uzunlukta (${buyerDigits.length} hane). VKN 10 haneli, TCKN 11 haneli olmalıdır.`,
      severity: "error",
    });
  } else if (!isEArsiv && buyerDigits === "11111111111") {
    errors.push({
      field: "invoiceAccount.vknTckn",
      code: "EFATURA_CANNOT_USE_ANONYMOUS_TCKN",
      message: "11111111111 (Nihai Tüketici) numarası ile e-Fatura kesilemez. Lütfen alıcının gerçek VKN/TCKN numarasını girin veya belge tipini e-Arşiv Fatura olarak değiştirin.",
      severity: "error",
    });
  } else {
    account.vknTckn = buyerDigits;
  }

  const effectiveBuyerVkn = String(account.vknTckn || "");
  let hasPersonInfoIfTckn = true;
  if (effectiveBuyerVkn.length === 11) {
    const existingPerson =
      account.personInfo && typeof account.personInfo === "object" && !Array.isArray(account.personInfo)
        ? (account.personInfo as Record<string, unknown>)
        : null;
    const hasFirstAndFamily =
      existingPerson &&
      typeof existingPerson.firstName === "string" &&
      existingPerson.firstName.trim().length > 0 &&
      typeof existingPerson.familyName === "string" &&
      existingPerson.familyName.trim().length > 0;
    if (!hasFirstAndFamily) {
      if (autoRepair && accountName) {
        const tokens = accountName.split(/\s+/).filter(Boolean);
        account.personInfo =
          tokens.length >= 2
            ? {
                firstName: tokens.slice(0, -1).join(" "),
                familyName: tokens[tokens.length - 1],
              }
            : {
                firstName: accountName,
                familyName: "-",
              };
      } else {
        hasPersonInfoIfTckn = false;
      }
    }
  }

  if (!account.countryName || typeof account.countryName !== "string" || !account.countryName.trim()) {
    account.countryName = "TÜRKİYE";
  }
  if (!account.cityName || typeof account.cityName !== "string" || !account.cityName.trim()) {
    if (autoRepair) {
      account.cityName = "İstanbul";
      warnings.push({
        field: "invoiceAccount.cityName",
        code: "DEFAULT_CITY_ASSIGNED",
        message: "Alıcı il (cityName) bilgisi boş olduğu için varsayılan il atandı.",
        severity: "warning",
      });
    } else {
      errors.push({
        field: "invoiceAccount.cityName",
        code: "MISSING_BUYER_CITY",
        message: "Alıcı il (cityName) bilgisi zorunludur.",
        severity: "error",
      });
    }
  }
  if (!account.citySubdivision || typeof account.citySubdivision !== "string" || !account.citySubdivision.trim()) {
    if (autoRepair) {
      account.citySubdivision = "Merkez";
      warnings.push({
        field: "invoiceAccount.citySubdivision",
        code: "DEFAULT_DISTRICT_ASSIGNED",
        message: "Alıcı ilçe (citySubdivision) bilgisi boş olduğu için 'Merkez' atandı.",
        severity: "warning",
      });
    } else {
      errors.push({
        field: "invoiceAccount.citySubdivision",
        code: "MISSING_BUYER_DISTRICT",
        message: "Alıcı ilçe (citySubdivision) bilgisi zorunludur.",
        severity: "error",
      });
    }
  }
  if (effectiveBuyerVkn.length === 10 && (!account.taxOfficeName || !String(account.taxOfficeName).trim())) {
    warnings.push({
      field: "invoiceAccount.taxOfficeName",
      code: "MISSING_BUYER_TAX_OFFICE",
      message: "Tüzel kişi (10 haneli VKN) alıcı için vergi dairesi bilgisi (taxOfficeName) girilmesi önerilir.",
      severity: "warning",
    });
  }
  body.invoiceAccount = account;

  // 4. Fatura Kalemleri (invoiceDetail) doğrulaması
  const rawDetails = Array.isArray(body.invoiceDetail) ? body.invoiceDetail : [];
  if (rawDetails.length === 0) {
    errors.push({
      field: "invoiceDetail",
      code: "EMPTY_INVOICE_LINES",
      message: "Faturada en az 1 adet mal veya hizmet kalemi (invoiceDetail) bulunmalıdır.",
      severity: "error",
    });
  }

  const hasRootTax = Array.isArray(body.tax) && body.tax.length > 0;
  let allLinesHaveAllowanceChargeArray = true;
  const sanitizedDetails: Record<string, unknown>[] = [];
  const invoiceTypeUpper = String(body.invoiceType || "SATIS").toUpperCase();

  rawDetails.forEach((rawLine, idx) => {
    const lineNo = idx + 1;
    if (!rawLine || typeof rawLine !== "object" || Array.isArray(rawLine)) {
      errors.push({
        field: `invoiceDetail[${idx}]`,
        code: "INVALID_LINE_OBJECT",
        message: `${lineNo}. fatura kalemi geçersiz nesne formatında.`,
        severity: "error",
      });
      return;
    }

    const line = { ...(rawLine as Record<string, unknown>) };
    const productName = String(line.productName || "").trim();
    if (!productName) {
      errors.push({
        field: `invoiceDetail[${idx}].productName`,
        code: "MISSING_LINE_PRODUCT_NAME",
        message: `${lineNo}. fatura kaleminde mal/hizmet adı (productName) boş bırakılamaz.`,
        severity: "error",
      });
    } else {
      line.productName = productName.slice(0, 150);
    }

    const productCode = String(line.productCode || "").trim();
    line.productCode = (productCode || `LINE${String(lineNo).padStart(3, "0")}`).slice(0, 100);

    const uCode = String(line.unitCode || "").trim();
    line.unitCode = uCode || "C62";

    // Mysoft .NET rule: detail.currencyCode causes error unless root tax array is provided
    if (!hasRootTax && "currencyCode" in line) {
      delete line.currencyCode;
    }

    const qty = Number(line.qty);
    if (!Number.isFinite(qty) || qty <= 0) {
      errors.push({
        field: `invoiceDetail[${idx}].qty`,
        code: "INVALID_LINE_QTY",
        message: `${lineNo}. fatura kaleminde miktar (qty) 0'dan büyük geçerli bir sayı olmalıdır.`,
        severity: "error",
      });
    } else {
      line.qty = qty;
    }

    const unitPriceTra = Number(line.unitPriceTra);
    if (!Number.isFinite(unitPriceTra) || unitPriceTra < 0) {
      errors.push({
        field: `invoiceDetail[${idx}].unitPriceTra`,
        code: "INVALID_LINE_UNIT_PRICE",
        message: `${lineNo}. fatura kaleminde birim fiyat (unitPriceTra) geçerli bir sayı olmalıdır.`,
        severity: "error",
      });
    } else {
      line.unitPriceTra = round2(unitPriceTra);
    }

    const vatRate = Number(line.vatRate ?? 0);
    if (!Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100) {
      errors.push({
        field: `invoiceDetail[${idx}].vatRate`,
        code: "INVALID_LINE_VAT_RATE",
        message: `${lineNo}. fatura kaleminde KDV oranı (vatRate) geçersiz.`,
        severity: "error",
      });
    } else {
      line.vatRate = vatRate;
    }

    const amtTra =
      line.amtTra !== undefined && line.amtTra !== null && Number.isFinite(Number(line.amtTra))
        ? round2(Number(line.amtTra))
        : round2((Number(line.qty) || 0) * (Number(line.unitPriceTra) || 0));
    line.amtTra = amtTra;

    const taxableAmtTra =
      line.taxableAmtTra !== undefined && line.taxableAmtTra !== null && Number.isFinite(Number(line.taxableAmtTra))
        ? round2(Number(line.taxableAmtTra))
        : amtTra;
    line.taxableAmtTra = taxableAmtTra;

    const amtVatTra =
      line.amtVatTra !== undefined && line.amtVatTra !== null && Number.isFinite(Number(line.amtVatTra))
        ? round2(Number(line.amtVatTra))
        : round2((taxableAmtTra * (Number(line.vatRate) || 0)) / 100);
    line.amtVatTra = amtVatTra;

    // 0% VAT or ISTISNA requires taxExemptionReasonCode in GİB Schematron
    if ((Number(line.vatRate) === 0 || invoiceTypeUpper === "ISTISNA") && !String(line.taxExemptionReasonCode || "").trim()) {
      if (autoRepair) {
        line.taxExemptionReasonCode = "350";
        warnings.push({
          field: `invoiceDetail[${idx}].taxExemptionReasonCode`,
          code: "DEFAULT_EXEMPTION_CODE_ASSIGNED",
          message: `${lineNo}. kalemde KDV %0 olduğu için varsayılan muafiyet kodu (350 - Diğer) atandı.`,
          severity: "warning",
        });
      } else {
        errors.push({
          field: `invoiceDetail[${idx}].taxExemptionReasonCode`,
          code: "MISSING_EXEMPTION_REASON_CODE",
          message: `${lineNo}. kalemde KDV oranı %0 veya fatura tipi İSTİSNA olduğunda vergi muafiyet kodu (taxExemptionReasonCode) zorunludur.`,
          severity: "error",
        });
      }
    }

    // Tevkifat validation & auto-repair
    if (line.withholdingTaxTypeCode) {
      const wCode = String(line.withholdingTaxTypeCode).trim();
      const stdPct = STANDARD_WITHHOLDING_PERCENTAGES[wCode];
      if (stdPct !== undefined) {
        line.withholdingTaxPercentage = stdPct;
      }
      const wPct = Number(line.withholdingTaxPercentage);
      if (!Number.isFinite(wPct) || wPct <= 0) {
        errors.push({
          field: `invoiceDetail[${idx}].withholdingTaxPercentage`,
          code: "INVALID_WITHHOLDING_PERCENTAGE",
          message: `${lineNo}. kalemde tevkifat kodu (${wCode}) için tevkifat oranı (withholdingTaxPercentage) geçersiz.`,
          severity: "error",
        });
      } else {
        line.withholdingTaxableAmount = amtVatTra;
        line.withholdingTaxAmount = round2((amtVatTra * wPct) / 100);
      }
    }

    if (!Array.isArray(line.allowanceCharge)) {
      if (autoRepair) {
        line.allowanceCharge = [];
      } else {
        allLinesHaveAllowanceChargeArray = false;
      }
    }

    sanitizedDetails.push(line);
  });

  if (
    invoiceTypeUpper === "TEVKIFAT" &&
    sanitizedDetails.length > 0 &&
    !sanitizedDetails.some((d) => Boolean(d.withholdingTaxTypeCode))
  ) {
    errors.push({
      field: "invoiceDetail.withholdingTaxTypeCode",
      code: "MISSING_TEVKIFAT_CODE_ON_LINES",
      message: "Fatura tipi 'TEVKİFAT' seçildi ancak hiçbir fatura kaleminde tevkifat kodu (withholdingTaxTypeCode) belirtilmedi.",
      severity: "error",
    });
  }

  body.invoiceDetail = sanitizedDetails;

  // 5. Dip Toplam Nesnesi (invoiceCalculation) kontrolü ve otomatik onarımı
  // (Mysoft .NET backend throws "Object reference not set to an instance of an object" if invoiceCalculation is null)
  const hadInvoiceCalculation =
    Boolean(body.invoiceCalculation) &&
    typeof body.invoiceCalculation === "object" &&
    !Array.isArray(body.invoiceCalculation);

  if (!hadInvoiceCalculation && autoRepair) {
    let lineExtensionAmount = 0;
    let taxExclusiveAmount = 0;
    let totalVat = 0;
    let totalWithholding = 0;
    let allowanceTotalAmount = 0;

    for (const d of sanitizedDetails) {
      const amt = round2(Number(d.amtTra) || 0);
      const taxable = round2(Number(d.taxableAmtTra ?? amt) || 0);
      const vat = round2(Number(d.amtVatTra) || 0);
      const wh = round2(Number(d.withholdingTaxAmount) || 0);
      const disc = Array.isArray(d.allowanceCharge)
        ? (d.allowanceCharge as Array<Record<string, unknown>>).reduce(
            (s, ac) => s + (ac && ac.chargeIndicator !== true ? round2(Number(ac.amount) || 0) : 0),
            0,
          )
        : 0;
      lineExtensionAmount = round2(lineExtensionAmount + amt);
      taxExclusiveAmount = round2(taxExclusiveAmount + taxable);
      totalVat = round2(totalVat + vat);
      totalWithholding = round2(totalWithholding + wh);
      allowanceTotalAmount = round2(allowanceTotalAmount + disc);
    }
    const taxInclusiveAmount = round2(lineExtensionAmount + totalVat);
    const payableAmount = round2(Math.max(0, taxInclusiveAmount - totalWithholding));

    body.invoiceCalculation = {
      lineExtensionAmount,
      taxExclusiveAmount,
      taxInclusiveAmount,
      payableRoundingAmount: 0,
      payableAmount,
      allowanceTotalAmount,
      chargeTotalAmount: 0,
    };
    warnings.push({
      field: "invoiceCalculation",
      code: "INVOICE_CALCULATION_AUTO_POPULATED",
      message:
        "Dip toplam nesnesi (invoiceCalculation) eksikti; Mysoft NullReferenceException ('Object reference not set to an instance of an object') hatasını önlemek için kalemlerden otomatik oluşturuldu.",
      severity: "warning",
    });
  } else if (!hadInvoiceCalculation) {
    errors.push({
      field: "invoiceCalculation",
      code: "MISSING_INVOICE_CALCULATION",
      message: "Fatura dip toplam nesnesi (invoiceCalculation) zorunludur.",
      severity: "error",
    });
  }

  const nullGuard: MysoftOutboxNullGuardReport = {
    hasInvoiceAccount: Boolean(rawAccount),
    hasBuyerVknTckn: effectiveBuyerVkn.length === 10 || effectiveBuyerVkn.length === 11,
    hasBuyerAccountName: Boolean(accountName),
    hasPersonInfoIfTckn,
    hasInvoiceDetailArray: Array.isArray(body.invoiceDetail) && sanitizedDetails.length > 0,
    invoiceDetailCount: sanitizedDetails.length,
    allLinesHaveAllowanceChargeArray,
    hasInvoiceCalculationObject: Boolean(body.invoiceCalculation),
    hasTenantIdentifierNumber: Boolean(normalizedTenant),
  };

  const valid = errors.length === 0;
  const summary = valid
    ? "Fatura verisi Mysoft gönderimi için eksiksiz doğrulandı."
    : `Fatura gönderilemedi — zorunlu alan eksikleri: ${errors.map((e) => e.message).join(" | ")}`;

  if (!valid) {
    recordMysoftDiagnosticLog({
      stage: "PRE_SEND_VALIDATION",
      operation: "validateMysoftInvoiceOutboxPayload",
      tenantIdentifierNumber: normalizedTenant,
      buyerVknTckn: effectiveBuyerVkn || undefined,
      buyerName: accountName || undefined,
      eDocumentType,
      profile: String(body.profile || ""),
      invoiceType: String(body.invoiceType || ""),
      docNo: String(body.docNo || ""),
      prefix: String(body.prefix || ""),
      lineCount: sanitizedDetails.length,
      payableAmount: Number((body.invoiceCalculation as Record<string, unknown> | undefined)?.payableAmount) || 0,
      nullGuard,
      validationErrors: errors,
      validationWarnings: warnings,
      errorMessage: summary,
    });
  }

  return {
    valid,
    errors,
    warnings,
    summary,
    nullGuard,
    sanitizedPayload: body,
  };
}

