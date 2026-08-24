import type { CompanySettings, Contact, EDocumentType, Invoice, InvoiceItem } from "../types";
import { normalizeMysoftTenantIdentifier } from "./mysoftTenant";

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
  profile?: string;
  /** true = only draft in Mysoft (not sent to GİB). */
  isSaveAsDraft?: boolean;
  connectorGuid?: string;
  prefix?: string;
  tenantIdentifierNumber?: string;
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

function mapLine(item: InvoiceItem, index: number, currency: string) {
  const qty = Number(item.quantity) || 1;
  const unitPrice = Number(item.unitPrice) || 0;
  const amtTra = Number(item.totalWithoutVat) || qty * unitPrice;
  const vatRate = Number(item.vatRate) || 0;
  const amtVatTra = Number(item.vatAmount) || (amtTra * vatRate) / 100;
  const code =
    item.productId ||
    `LINE${String(index + 1).padStart(3, "0")}`;
  return {
    productCode: code.slice(0, 100),
    productName: (item.description || "Mal / Hizmet").slice(0, 150),
    unitCode: unitCode(item.unit),
    currencyCode: currency,
    qty,
    unitPriceTra: unitPrice,
    amtTra,
    vatRate,
    amtVatTra,
    taxableAmtTra: amtTra,
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
  const tenant =
    normalizeMysoftTenantIdentifier(
      options.tenantIdentifierNumber ||
        company.tenantIdentifierNumber ||
        company.mysoftCredentials?.tenantIdentifierNumber ||
        company.taxNumber,
    ) || undefined;
  const buyerTax = digits(contact.taxNumber || invoice.taxNumber);
  const prefix =
    options.prefix ||
    String(invoice.invoiceNumber || "")
      .replace(/\d+$/, "")
      .slice(0, 3)
      .toUpperCase() ||
    undefined;

  const payload: Record<string, unknown> = {
    eDocumentType,
    profile,
    invoiceType: "SATIS",
    ettn: invoice.eDocumentEttn || undefined,
    prefix: prefix || undefined,
    // Leave docNo empty so Mysoft assigns from the numerator when possible.
    docDate: toMysoftDateTime(invoice.issueDate),
    dueDate: invoice.dueDate
      ? toMysoftDateTime(invoice.dueDate)
      : undefined,
    currencyCode: currency,
    currencyRate: currency === "TRY" ? 1 : undefined,
    senderType: eDocumentType === "EARSIVFATURA" ? "ELEKTRONIK" : undefined,
    isSaveAsDraft: options.isSaveAsDraft === true,
    isAddPayableAmountString: true,
    referanceKey: invoice.id,
    tenantIdentifierNumber: tenant,
    notes: invoice.notes?.trim()
      ? [{ note: invoice.notes.trim() }]
      : undefined,
    invoiceAccount: {
      vknTckn: buyerTax || undefined,
      accountName: contact.name || invoice.contactName,
      taxOfficeName: contact.taxOffice || undefined,
      countryName: "TÜRKİYE",
      cityName: contact.city || undefined,
      citySubdivision: contact.district || undefined,
      streetName: contact.address || undefined,
      telephone1: contact.phone || undefined,
      email1: contact.email || undefined,
    },
    invoiceDetail: (invoice.items || []).map((item, index) =>
      mapLine(item, index, currency),
    ),
  };

  if (options.connectorGuid?.trim()) {
    payload.connectorGuid = options.connectorGuid.trim();
  }

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
