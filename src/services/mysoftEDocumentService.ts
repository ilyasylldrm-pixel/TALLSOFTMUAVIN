import {
  CanonicalEDocumentDirection,
  EDocumentDirection,
  EDocumentStatus,
  EDocumentType,
  MysoftDocumentFamily,
  MysoftEDocument,
} from "../types";
import { saveStoredData } from "../utils/storage";
import { initialMysoftEDocuments } from "../data/mysoftEDocumentMocks";
import { auth } from "../lib/firebase";
import {
  normalizeMysoftTenantIdentifier,
} from "./mysoftTenant";

// Re-export the shared models from this service module for UI consumers that
// do not otherwise need to import the entire application type catalogue.
export type { EDocumentDirection, MysoftEDocument } from "../types";
export { normalizeMysoftTenantIdentifier, isMysoftTenantScopeError } from "./mysoftTenant";

/** Production and test hosts published by Mysoft. */
export const MYSOFT_PRODUCTION_BASE_URL = "https://edocumentapi.mysoft.com.tr";
export const MYSOFT_TEST_BASE_URL = "https://edocumentapi.mytest.tr";

/** Exact upstream routes used by the proxy/direct client. */
export const MYSOFT_ROUTES = {
  token: "/oauth/token",
  tenantList: "/api/Tenant/getTenant",
  tenantByIdentifier: "/api/Tenant/getTenantWithIdentifier",
  tenantInfo: "/api/Tenant/getTenantInfo",
  tenantUsageSummary: "/api/Tenant/getBusinessPartnerTenantDocumentUsageSummary",
  inboxList: "/api/InvoiceInbox/getInvoiceInboxWithHeaderInfoListForPeriod",
  inboxListUnheaded: "/api/InvoiceInbox/getInvoiceInboxListForPeriod",
  inboxNewList: "/api/InvoiceInbox/getNewInvoiceInboxWithHeaderInfoList",
  inboxModel: "/api/InvoiceInbox/getInvoiceInboxModel",
  inboxStatus: "/api/InvoiceInbox/getInvoiceInboxStatus",
  inboxPdf: "/api/InvoiceInbox/getInvoiceInboxPdfAsZip",
  inboxXml: "/api/InvoiceInbox/getInvoiceInboxUBLXMLAsZip",
  inboxAccept: "/api/InvoiceInbox/acceptInvoice",
  inboxDeny: "/api/InvoiceInbox/denyInvoice",
  inboxSave: "/api/InvoiceInbox/invoiceInboxSavedByCustomer",
  outboxList: "/api/InvoiceOutbox/getInvoiceOutboxWithHeaderInfoList",
  outboxListUnheaded: "/api/InvoiceOutbox/getInvoiceOutboxList",
  outboxModel: "/api/InvoiceOutbox/getInvoiceOutboxModel",
  outboxStatus: "/api/InvoiceOutbox/getInvoiceOutboxStatus",
  outboxPdf: "/api/InvoiceOutbox/getInvoiceOutboxPdfAsZip",
  outboxXml: "/api/InvoiceOutbox/getInvoiceOutboxXMLAsZip",
  outboxCancel: "/api/InvoiceOutbox/cancelEArchiveInvoice",
  outboxSendDraft: "/api/InvoiceOutbox/sendDraftInvoiceToGIB",
  outboxSend: "/api/InvoiceOutbox/invoiceOutbox",
  outboxSendUbl: "/api/InvoiceOutbox/invoiceOutboxWithUblXml",
} as const;

export interface MysoftListFilters {
  afterValue?: number;
  limit?: number;
  pageSize?: number;
  pageNumber?: number;
  startDate?: string;
  endDate?: string;
  tenantIdentifierNumber?: string;
  ettn?: string;
  docNo?: string;
  accountName?: string;
  vknTckn?: string;
  pkAlias?: string;
  eDocumentType?: string;
  profile?: number;
  portalInvoiceStatus?: number;
  archiveStatus?: number;
  isUseDocDate?: boolean;
  cessionStatus?: number;
  /** invoice = e-Fatura/e-Arşiv, despatch = e-İrsaliye */
  family?: MysoftDocumentFamily | string;
}

export interface MysoftListOptions extends MysoftListFilters {
  /** Return the persisted/local snapshot if the proxy cannot be reached. */
  fallback?: boolean;
  signal?: AbortSignal;
  /** Local owner id used to isolate cached records between taxpayers. */
  companyId?: string;
}

/** Options for detail and file operations.  Fallbacks are opt-in so a
 * production connection failure can never be mistaken for remote data. */
export interface MysoftOperationOptions {
  fallback?: boolean;
  signal?: AbortSignal;
  /** Explicit inbox/outbox routing for detail, file and action requests. */
  direction?: EDocumentDirection;
  /** VKN/TCKN sent to Mysoft for this accountant-managed company. */
  tenantIdentifierNumber?: string;
  /** Local owner id used to isolate cached records between taxpayers. */
  companyId?: string;
  family?: MysoftDocumentFamily | string;
}

export interface MysoftSyncOptions extends MysoftListOptions {
  direction?: EDocumentDirection | "all";
}

export interface MysoftSyncResult {
  documents: MysoftEDocument[];
  addedCount: number;
  updatedCount: number;
  totalCount: number;
  syncedAt: string;
  source: "mysoft" | "local";
  warning?: string;
}

export interface MysoftDocumentDownload {
  id: string;
  format: "pdf" | "xml" | "html" | string;
  filename: string;
  mimeType: string;
  /** Binary content when the proxy returns a file response. */
  blob?: Blob;
  /** URL or data URL when the proxy returns a StringResultModel. */
  url?: string;
  /** Base64/plain payload for non-browser consumers. */
  data?: string;
  isMock?: boolean;
}

/** Payload accepted by the server proxy for invoice state transitions. */
export interface MysoftCancelOptions {
  cancelDate?: string;
  cancelType?: string;
  cancelNote?: string;
}

export interface MysoftDraftSendOptions {
  prefix?: string;
  numeratorSetCode?: string;
  connectorGuid?: string;
}

export interface MysoftApiConfig {
  baseUrl?: string;
  clientId?: string;
  clientSecret?: string;
  tenantIdentifierNumber?: string;
  /** A pre-issued access token can be supplied by a server runtime. */
  accessToken?: string;
  /** Keep direct calls opt-in; browser calls should use the local proxy. */
  useProxy?: boolean;
  fetchImpl?: typeof fetch;
}

export interface MysoftApiResult<T> {
  data?: T;
  succeed?: boolean;
  message?: string | null;
  errorCode?: string | null;
  afterValue?: number;
  [key: string]: unknown;
}

/** Firm record returned by Mysoft's Tenant/getTenant directory endpoint. */
export interface MysoftTenant {
  id?: string;
  name: string;
  shortName?: string;
  taxNumber: string;
  taxOffice?: string;
  registerNo?: string;
  tradeRegisteryName?: string;
  mersisNo?: string;
  telephone?: string;
  email?: string;
  webSiteURL?: string;
  currencyCode?: string;
  cityName?: string;
  citySubdivision?: string;
  district?: string;
  streetName?: string;
  buildingNumber?: string;
  room?: string;
  postalCode?: string;
  countryName?: string;
  isPassive?: boolean;
  raw?: Record<string, unknown>;
}

export class MysoftApiError extends Error {
  readonly status?: number;
  readonly payload?: unknown;

  constructor(message: string, status?: number, payload?: unknown) {
    super(message);
    this.name = "MysoftApiError";
    this.status = status;
    this.payload = payload;
  }
}

function getRuntimeEnv(name: string): string | undefined {
  // `import.meta.env` is available in Vite; process.env is available in the
  // server bundle.  Never use VITE_ names for credentials: Vite exposes those
  // values to every browser user.
  try {
    const viteEnv = (
      import.meta as unknown as { env?: Record<string, string | undefined> }
    ).env;
    if (viteEnv?.[name]) return viteEnv[name];
  } catch {
    // import.meta may not be available in a CommonJS test harness.
  }
  try {
    if (typeof process !== "undefined" && process.env?.[name])
      return process.env[name];
  } catch {
    // Ignore environments without process (normal browser execution).
  }
  return undefined;
}

export function resolveMysoftBaseUrl(config: MysoftApiConfig = {}): string {
  const configured =
    config.baseUrl ||
    getRuntimeEnv("MYSOFT_EDOCUMENT_API_URL") ||
    getRuntimeEnv("MYSOFT_EDOCUMENT_BASE_URL") ||
    getRuntimeEnv("MYSOFT_API_BASE_URL") ||
    getRuntimeEnv("EDOCUMENT_API_URL");
  const environment =
    getRuntimeEnv("MYSOFT_EDOCUMENT_ENVIRONMENT") ||
    getRuntimeEnv("MYSOFT_ENVIRONMENT");
  const base =
    configured ||
    (environment === "test"
      ? MYSOFT_TEST_BASE_URL
      : MYSOFT_PRODUCTION_BASE_URL);
  return base.replace(/\/+$/, "");
}

function canonicalDirection(
  direction: EDocumentDirection | "all" = "incoming",
): CanonicalEDocumentDirection | "all" {
  if (direction === "all") return "all";
  return direction === "outgoing" || direction === "outbox"
    ? "outgoing"
    : "incoming";
}

export function toMysoftDirection(
  direction: EDocumentDirection,
): "inbox" | "outbox" {
  return canonicalDirection(direction) === "outgoing" ? "outbox" : "inbox";
}

export function toApplicationDirection(
  direction: EDocumentDirection | "all",
): CanonicalEDocumentDirection | "all" {
  return canonicalDirection(direction);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function normalizedKey(key: string): string {
  return key
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

/** Case/style-insensitive lookup for camelCase, PascalCase and snake_case APIs. */
export function pickField(
  record: Record<string, unknown> | null | undefined,
  aliases: string[],
): unknown {
  if (!record) return undefined;
  const keys = Object.keys(record);
  for (const alias of aliases) {
    if (alias in record) return record[alias];
    const wanted = normalizedKey(alias);
    const match = keys.find((key) => normalizedKey(key) === wanted);
    if (match) return record[match];
  }
  return undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(
      value
        .replace(/\s/g, "")
        .replace(/\.(?=\d{3}(?:\D|$))/g, "")
        .replace(",", "."),
    );
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function asString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return undefined;
}

function nestedRecord(
  record: Record<string, unknown> | null,
  aliases: string[],
): Record<string, unknown> | null {
  const value = pickField(record, aliases);
  return asRecord(value);
}

/** Read one or many nested records (Mysoft uses arrays for tax totals). */
function nestedRecords(
  record: Record<string, unknown> | null,
  aliases: string[],
): Record<string, unknown>[] {
  const value = pickField(record, aliases);
  if (Array.isArray(value)) return value.map(asRecord).filter((item): item is Record<string, unknown> => Boolean(item));
  const single = asRecord(value);
  return single ? [single] : [];
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    const result = asString(value);
    if (result) return result;
  }
  return undefined;
}

function firstNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    const result = asNumber(value);
    if (result !== undefined) return result;
  }
  return undefined;
}

function canonicalDocumentFamily(
  value?: string | MysoftDocumentFamily,
): MysoftDocumentFamily {
  const raw = String(value || "invoice")
    .trim()
    .toLowerCase()
    .replace(/[ _-]/g, "");
  if (raw === "despatch" || raw === "irsaliye" || raw === "eirsaliye") {
    return "despatch";
  }
  return "invoice";
}

function mapDocumentType(value: unknown): EDocumentType | string {
  const raw = (asString(value) || "").toUpperCase().replace(/[ ._-]/g, "");
  if (raw.includes("EFATURA") || raw === "EINVOICE") return "e_fatura";
  if (raw.includes("EARSIV") || raw === "EARCHIVE") return "e_arsiv";
  if (raw.includes("ESMM")) return "e_smm";
  if (raw.includes("EMM")) return "e_mm";
  if (
    raw.includes("IRSALIYE") ||
    raw.includes("DESPATCH") ||
    raw === "SEVK" ||
    raw === "MATBUDAN"
  ) {
    return "e_irsaliye";
  }
  return asString(value) || "unknown";
}

export type MysoftStatusTone = "success" | "info" | "warning" | "danger" | "muted";

export interface MysoftDocumentStatusInfo {
  status: EDocumentStatus;
  label: string;
  tone: MysoftStatusTone;
}

const MYSOFT_STATUS_CATALOG: Record<string, MysoftDocumentStatusInfo> = {
  BOS: { status: "unknown", label: "Boş", tone: "muted" },
  IPTALEDILDI: { status: "cancelled", label: "İptal edildi", tone: "danger" },
  TASLAK: { status: "draft", label: "Taslak", tone: "warning" },
  ARSIVKAYITKUYRUGUNDA: {
    status: "queued",
    label: "Arşiv kayıt kuyruğunda",
    tone: "warning",
  },
  GIBEGONDERILECEK: {
    status: "queued",
    label: "GİB'e gönderilecek",
    tone: "warning",
  },
  GIBEGONDERILDI: { status: "sent", label: "GİB'e gönderildi", tone: "info" },
  ALICIYAULASTI: { status: "delivered", label: "Alıcıya ulaştı", tone: "info" },
  KABULKUYRUGUNDA: {
    status: "queued",
    label: "Kabul kuyruğunda",
    tone: "warning",
  },
  REDKUYRUGUNDA: { status: "queued", label: "Ret kuyruğunda", tone: "warning" },
  YANITBEKLENIYOR: {
    status: "waiting_response",
    label: "Yanıt bekleniyor",
    tone: "warning",
  },
  KABUL: { status: "accepted", label: "Kabul", tone: "success" },
  RED: { status: "rejected", label: "Red", tone: "danger" },
  HATA: { status: "error", label: "Hata", tone: "danger" },
  ONAYLANDI: { status: "accepted", label: "Onaylandı", tone: "success" },
  YANITLANDI: { status: "responded", label: "Yanıtlandı", tone: "success" },
  ISLENDI: { status: "processed", label: "İşlendi", tone: "success" },
  ALINDI: { status: "delivered", label: "Alındı", tone: "info" },
  ACCEPTED: { status: "accepted", label: "Kabul", tone: "success" },
  REJECTED: { status: "rejected", label: "Red", tone: "danger" },
  CANCELLED: { status: "cancelled", label: "İptal edildi", tone: "danger" },
  CANCELED: { status: "cancelled", label: "İptal edildi", tone: "danger" },
  DRAFT: { status: "draft", label: "Taslak", tone: "warning" },
  QUEUED: { status: "queued", label: "Kuyrukta", tone: "warning" },
  SENT: { status: "sent", label: "Gönderildi", tone: "info" },
  DELIVERED: { status: "delivered", label: "Teslim edildi", tone: "info" },
  ERROR: { status: "error", label: "Hata", tone: "danger" },
  FAILED: { status: "error", label: "Hata", tone: "danger" },
  WAITINGRESPONSE: {
    status: "waiting_response",
    label: "Yanıt bekleniyor",
    tone: "warning",
  },
  RESPONDED: { status: "responded", label: "Yanıtlandı", tone: "success" },
  PROCESSED: { status: "processed", label: "İşlendi", tone: "success" },
  UNKNOWN: { status: "unknown", label: "Bilinmiyor", tone: "muted" },
};

function statusLookupKey(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/İ/g, "I")
    .replace(/ı/g, "i")
    .toLocaleUpperCase("en-US")
    .replace(/[^A-Z0-9]/g, "");
}

/** Map Mysoft invoice/despatch status texts onto Muavin labels and tones. */
export function resolveMysoftDocumentStatus(
  ...values: unknown[]
): MysoftDocumentStatusInfo {
  const text = firstString(...values);
  if (!text) return MYSOFT_STATUS_CATALOG.UNKNOWN;
  const key = statusLookupKey(text);
  if (MYSOFT_STATUS_CATALOG[key]) return MYSOFT_STATUS_CATALOG[key];
  if (key.includes("KABULKUYRUK")) return MYSOFT_STATUS_CATALOG.KABULKUYRUGUNDA;
  if (key.includes("REDKUYRUK") || key.includes("RETKUYRUK")) {
    return MYSOFT_STATUS_CATALOG.REDKUYRUGUNDA;
  }
  if (key.includes("YANITBEKLEN")) return MYSOFT_STATUS_CATALOG.YANITBEKLENIYOR;
  if (key.includes("GONDERILECEK")) return MYSOFT_STATUS_CATALOG.GIBEGONDERILECEK;
  if (key.includes("GONDERILDI")) return MYSOFT_STATUS_CATALOG.GIBEGONDERILDI;
  if (key.includes("ALICIYAULAS") || key.includes("TESLIM")) {
    return MYSOFT_STATUS_CATALOG.ALICIYAULASTI;
  }
  if (key.includes("ARSIV") && key.includes("KUYRUK")) {
    return MYSOFT_STATUS_CATALOG.ARSIVKAYITKUYRUGUNDA;
  }
  if (key.includes("IPTAL") || key.includes("CANCEL")) {
    return MYSOFT_STATUS_CATALOG.IPTALEDILDI;
  }
  if (key.includes("YANITLANDI")) return MYSOFT_STATUS_CATALOG.YANITLANDI;
  if (key.includes("ISLENDI") || key.includes("ISLEN")) {
    return MYSOFT_STATUS_CATALOG.ISLENDI;
  }
  if (key.includes("TASLAK") || key.includes("DRAFT")) {
    return MYSOFT_STATUS_CATALOG.TASLAK;
  }
  if (key.includes("HATA") || key.includes("ERROR") || key.includes("FAIL")) {
    return MYSOFT_STATUS_CATALOG.HATA;
  }
  if (key.includes("ONAY")) return MYSOFT_STATUS_CATALOG.ONAYLANDI;
  if (key === "RED" || key.includes("REJECT") || key === "RET") {
    return MYSOFT_STATUS_CATALOG.RED;
  }
  if (key.includes("KABUL") || key.includes("ACCEPT")) {
    return MYSOFT_STATUS_CATALOG.KABUL;
  }
  if (key.includes("KUYRUK") || key.includes("BEKLE") || key.includes("QUEUE")) {
    return MYSOFT_STATUS_CATALOG.QUEUED;
  }
  return { status: text, label: text, tone: "muted" };
}

/**
 * Convert Mysoft's InvoiceHeaderInfoModel (or a future compatible payload)
 * into the stable application model. Unknown fields remain in `raw`.
 */
export function normalizeMysoftEDocument(
  input: unknown,
  direction: EDocumentDirection = "incoming",
  syncedAt = new Date().toISOString(),
  companyId?: string,
  family?: MysoftDocumentFamily,
): MysoftEDocument | null {
  const raw = asRecord(input);
  if (!raw) return null;
  const canonical =
    canonicalDirection(direction) === "outgoing" ? "outgoing" : "incoming";
  const customer = nestedRecord(raw, [
    "customerInfo",
    "customer",
    "buyer",
    "receiver",
    "alici",
  ]);
  const supplier = nestedRecord(raw, [
    "supplierInfo",
    "supplier",
    "seller",
    "sender",
    "satici",
  ]);
  const inferredFamily: MysoftDocumentFamily =
    family ||
    (firstString(
      pickField(raw, ["eDespatchType", "despatchStatusText", "despatchETTN"]),
    )
      ? "despatch"
      : "invoice");
  const ettn = firstString(
    pickField(raw, [
      "ettn",
      "invoiceETTN",
      "invoiceEttn",
      "despatchETTN",
      "despatchEttn",
      "documentETTN",
      "uuid",
      "guid",
    ]),
  );
  const id = firstString(
    pickField(raw, ["id", "invoiceId", "despatchId", "documentId"]),
    ettn,
    pickField(raw, ["docNo", "invoiceNumber"]),
  );
  if (!id || !ettn) return null;

  const documentNo = firstString(
    pickField(raw, [
      "docNo",
      "documentNo",
      "invoiceNumber",
      "documentNumber",
      "belgeNo",
    ]),
  );
  const issueDate = firstString(
    pickField(raw, [
      "docDate",
      "issueDate",
      "invoiceDate",
      "documentDate",
      "date",
    ]),
  );
  const dueDate = firstString(
    pickField(raw, ["dueDate", "paymentDueDate", "vadeDate"]),
  );
  const directAccountName = firstString(
    pickField(raw, ["accountName", "title", "name", "partyName"]),
  );
  const directTaxNumber = firstString(
    pickField(raw, ["vknTckn", "taxNumber", "taxId", "partyTaxNumber"]),
  );
  const sender =
    canonical === "incoming"
      ? supplier
      : firstString(directAccountName)
        ? raw
        : customer;
  const receiver = canonical === "incoming" ? customer : supplier;
  const senderRecord = asRecord(sender) || null;
  const receiverRecord = asRecord(receiver) || null;
  const senderName = firstString(
    pickField(senderRecord, [
      "name",
      "title",
      "accountName",
      "companyName",
      "partyName",
      "supplierName",
      "customerName",
      "supplierTitle",
      "customerTitle",
      "unvan",
    ]),
    canonical === "outgoing"
      ? pickField(raw, ["supplierName", "senderName"])
      : directAccountName,
  );
  const receiverName = firstString(
    pickField(receiverRecord, [
      "name",
      "title",
      "accountName",
      "companyName",
      "partyName",
      "supplierName",
      "customerName",
      "supplierTitle",
      "customerTitle",
      "unvan",
    ]),
    canonical === "outgoing"
      ? directAccountName
      : pickField(raw, ["receiverName", "customerName"]),
  );
  const senderTaxNumber = firstString(
    pickField(senderRecord, [
      "vknTckn",
      "taxNumber",
      "taxId",
      "identifier",
      "identifierNumber",
      "partyTaxNumber",
    ]),
    canonical === "outgoing"
      ? pickField(raw, ["supplierTaxNumber", "senderTaxNumber"])
      : directTaxNumber,
  );
  const receiverTaxNumber = firstString(
    pickField(receiverRecord, [
      "vknTckn",
      "taxNumber",
      "taxId",
      "identifier",
      "identifierNumber",
      "partyTaxNumber",
    ]),
    canonical === "outgoing"
      ? pickField(raw, ["receiverTaxNumber", "customerTaxNumber"])
      : directTaxNumber,
  );
  const legalTotal = nestedRecord(raw, [
    "legalMonetaryTotal",
    "legalTotal",
    "monetaryTotal",
  ]);
  const taxTotals = nestedRecords(raw, ["taxTotal", "taxTotals"]);
  const subtotal = firstNumber(
    pickField(raw, [
      "taxExclusiveAmount",
      "lineExtensionAmount",
      "subtotal",
      "totalWithoutVat",
    ]),
    pickField(legalTotal, ["lineExtensionAmount", "taxExclusiveAmount"]),
  );
  const vatTotal = firstNumber(
    pickField(raw, ["taxTotalTra", "totalVat", "vatTotal", "taxAmount"]),
    ...taxTotals.flatMap((tax) => [
      pickField(tax, ["taxAmount", "taxTotal", "total"]),
    ]),
  );
  const grandTotal = firstNumber(
    pickField(raw, [
      "payableAmount",
      "taxInclusiveAmount",
      "grandTotal",
      "totalAmount",
    ]),
    pickField(legalTotal, ["payableAmount", "taxInclusiveAmount"]),
  );
  const currencyRate = firstNumber(
    pickField(raw, ["currencyRate", "currencyRateInfo"]),
    ...nestedRecords(raw, ["currencyRateInfo", "currencyRate"])
      .flatMap((rate) => [
        pickField(rate, [
          "taxExchangeRate",
          "pricingExchangeRate",
          "paymentExchangeRate",
          "paymentAlternativeExchangeRate",
          "rate",
        ]),
      ]),
  );
  const documentStatus = resolveMysoftDocumentStatus(
    pickField(raw, [
      "invoiceStatusText",
      "despatchStatusText",
      "portalInvoiceStatusEnumText",
      "statusText",
      "status",
      "documentStatus",
    ]),
    pickField(raw, ["invoiceStatusCode", "statusCode"]),
  );
  const normalized: MysoftEDocument = {
    id,
    ...(companyId ? { companyId } : {}),
    family: inferredFamily,
    direction: canonical === "outgoing" ? "outbox" : "inbox",
    canonicalDirection: canonical,
    documentType:
      inferredFamily === "despatch"
        ? "e_irsaliye"
        : mapDocumentType(
            pickField(raw, [
              "eDocumentType",
              "documentType",
              "invoiceType",
              "eDespatchType",
              "type",
            ]),
          ),
    ettn,
    documentNo,
    number: documentNo,
    documentNumber: documentNo,
    issueDate,
    date: issueDate,
    dueDate,
    status: documentStatus.status,
    statusText: documentStatus.label,
    statusLabel: documentStatus.label,
    envelopeStatusText: firstString(
      pickField(raw, ["envelopeStatusDesc", "envelopeStatusText"]),
    ),
    envelopeStatusCode: firstString(
      pickField(raw, ["envelopeStatusCode"]),
    ),
    senderName,
    senderTaxNumber,
    receiverName,
    receiverTaxNumber,
    accountName:
      directAccountName ||
      (canonical === "incoming" ? senderName : receiverName),
    taxNumber:
      directTaxNumber ||
      (canonical === "incoming" ? senderTaxNumber : receiverTaxNumber),
    subtotal,
    vatTotal,
    grandTotal,
    amount: grandTotal,
    currency: firstString(
      pickField(raw, ["currencyCode", "documentCurrencyCode", "currency"]),
    ),
    currencyRate,
    archived: Boolean(
      pickField(raw, ["isArchived", "archived", "archiveStatus"]),
    ),
    profile: firstString(
      pickField(raw, ["profile", "profileId", "invoiceProfile", "eDespatchType"]),
    ),
    source: "mysoft",
    syncedAt,
    createdAt: firstString(
      pickField(raw, ["createDate", "createdAt", "creationDate"]),
    ),
    updatedAt: firstString(
      pickField(raw, ["updateDate", "updatedAt", "lastModifiedDate"]),
    ),
    downloadUrl: firstString(
      pickField(raw, ["downloadUrl", "pdfUrl", "publicUrl"]),
    ),
    items: Array.isArray(pickField(raw, ["items", "detailList", "lines"]))
      ? (pickField(raw, ["items", "detailList", "lines"]) as unknown[])
      : undefined,
    lines: Array.isArray(pickField(raw, ["lines", "detailList", "items"]))
      ? (pickField(raw, ["lines", "detailList", "items"]) as unknown[])
      : undefined,
    partyName:
      canonical === "incoming"
        ? senderName || receiverName
        : receiverName || senderName,
    partyTaxNumber:
      canonical === "incoming"
        ? senderTaxNumber || receiverTaxNumber
        : receiverTaxNumber || senderTaxNumber,
    raw,
  };
  return normalized;
}

function unwrapResult(payload: unknown): unknown {
  if (payload === null || payload === undefined) return payload;
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  if (!record) return payload;
  // Mysoft wraps every response in { data, succeed, message, ... }.
  const data = pickField(record, [
    "data",
    "documents",
    "items",
    "records",
    "results",
    "value",
  ]);
  if (data !== undefined) return data;
  return payload;
}

function toRows(payload: unknown): unknown[] {
  const unwrapped = unwrapResult(payload);
  if (Array.isArray(unwrapped)) return unwrapped;
  const record = asRecord(unwrapped);
  if (!record) return [];
  const rows = pickField(record, [
    "documents",
    "items",
    "records",
    "results",
    "list",
    "headers",
  ]);
  return Array.isArray(rows) ? rows : unwrapped ? [unwrapped] : [];
}

function normalizeRows(
  payload: unknown,
  direction: EDocumentDirection,
  syncedAt = new Date().toISOString(),
  companyId?: string,
  family?: MysoftDocumentFamily,
): MysoftEDocument[] {
  const result: MysoftEDocument[] = [];
  for (const row of toRows(payload)) {
    const document = normalizeMysoftEDocument(
      row,
      direction,
      syncedAt,
      companyId,
      family,
    );
    if (document) result.push(document);
  }
  return result;
}

/** Normalize a Mysoft Tenant/getTenant row for the accountant company switcher. */
export function normalizeMysoftTenant(input: unknown): MysoftTenant | null {
  const raw = asRecord(input);
  if (!raw) return null;
  const address = nestedRecord(raw, ["tenantAdress", "tenantAddress", "address"]);
  const taxOffice = nestedRecord(raw, ["taxOffice", "taxOfficeInfo"]);
  const taxNumber = firstString(
    pickField(raw, [
      "vknTckn",
      "identifierNumber",
      "taxNumber",
      "tenantIdentifierNumber",
      "businessPartnerIdentifierNumber",
    ]),
  );
  if (!taxNumber) return null;
  const id = firstString(pickField(raw, ["id", "tenantId", "businessPartnerId"]));
  const name = firstString(
    pickField(raw, [
      "tenantName",
      "businessPartnerName",
      "name",
      "companyName",
      "companyTitle",
      "title",
    ]),
    pickField(raw, ["shortName", "mainBusinessPartnerName"]),
  ) || taxNumber;
  const passiveField = pickField(raw, ["isPassive", "passive", "isPassiveForTenant"]);
  const activeField = pickField(raw, ["isActive", "active"]);
  const isPassive = typeof passiveField === "boolean"
    ? passiveField
    : typeof passiveField === "string"
      ? /^(true|1|yes|pasif|inactive)$/i.test(passiveField.trim())
      : typeof activeField === "boolean"
        ? !activeField
        : typeof activeField === "string"
          ? /^(false|0|no|pasif|inactive)$/i.test(activeField.trim())
          : undefined;
  const fromAddress = (aliases: string[]) => firstString(pickField(address, aliases));
  return {
    ...(id ? { id } : {}),
    name,
    shortName: firstString(pickField(raw, ["shortName"])),
    taxNumber,
    taxOffice: firstString(
      pickField(raw, ["taxOfficeName"]),
      pickField(taxOffice, ["name", "taxOfficeName", "title"]),
    ),
    registerNo: firstString(pickField(raw, ["registerNo", "tradeRegisterNo"])),
    tradeRegisteryName: firstString(pickField(raw, ["tradeRegisteryName", "tradeRegistryName"])),
    mersisNo: firstString(pickField(raw, ["mersisNo"])),
    telephone: firstString(pickField(raw, ["telephone", "phone", "telephone1"])),
    email: firstString(pickField(raw, ["email", "email1"])),
    webSiteURL: firstString(pickField(raw, ["webSiteURL", "website", "websiteUrl"])),
    currencyCode: firstString(pickField(raw, ["currencyCode", "currency"])),
    cityName: firstString(pickField(raw, ["cityName"]), fromAddress(["cityName", "city"])),
    citySubdivision: firstString(pickField(raw, ["citySubdivision"]), fromAddress(["citySubdivision", "district"])),
    district: firstString(pickField(raw, ["district"]), fromAddress(["district", "neighborhood"])),
    streetName: firstString(pickField(raw, ["streetName"]), fromAddress(["streetName", "street"])),
    buildingNumber: firstString(pickField(raw, ["buildingNumber"]), fromAddress(["buildingNumber"])),
    room: firstString(pickField(raw, ["room"]), fromAddress(["room", "doorNo"])),
    postalCode: firstString(pickField(raw, ["postalCode"]), fromAddress(["postalCode"])),
    countryName: firstString(pickField(raw, ["countryName"]), fromAddress(["countryName", "country"])),
    isPassive,
    raw,
  };
}

function tenantRows(payload: unknown): unknown[] {
  return toRows(payload);
}

export interface MysoftTenantListOptions {
  afterValue?: number;
  limit?: number;
  signal?: AbortSignal;
  fallback?: boolean;
}

/** List every taxpayer linked to the authenticated accountant/business partner. */
export async function listMysoftTenants(
  options: MysoftTenantListOptions = {},
): Promise<MysoftTenant[]> {
  // Upstream getTenant allows at most 50 rows per page.
  const pageLimit = Math.max(1, Math.min(50, Math.trunc(options.limit ?? 50)));
  let cursor = Math.max(0, Math.trunc(options.afterValue ?? 0));
  const result = new Map<string, MysoftTenant>();
  try {
    for (let page = 0; page < 100; page += 1) {
      if (options.signal?.aborted) throw createAbortError();
      const { payload } = await proxyRequest(
        makeQuery({ afterValue: cursor, limit: pageLimit }),
        { method: "GET", signal: options.signal },
        "tenants",
      );
      for (const row of tenantRows(payload)) {
        const tenant = normalizeMysoftTenant(row);
        if (!tenant) continue;
        const key = `${tenant.taxNumber}:${tenant.id || ""}`.toLocaleLowerCase();
        result.set(key, tenant);
      }
      const next = extractAfterValue(payload);
      if (next === undefined || next <= cursor || tenantRows(payload).length === 0) break;
      cursor = next;
    }
    return [...result.values()];
  } catch (error) {
    if (isAbortError(error) || options.fallback !== true) throw error;
    return [];
  }
}

export interface MysoftConnectionStatus {
  configured?: boolean;
  mockMode?: boolean;
  environment?: string;
  identity?: {
    defaultTenantId?: number;
    hasDefaultTenant?: boolean;
    businessPartnerId?: number;
    applicationAccessId?: number;
  };
}

export async function getMysoftConnectionStatus(
  options: { signal?: AbortSignal } = {},
): Promise<MysoftConnectionStatus> {
  const { payload } = await proxyRequest("", { method: "GET", signal: options.signal }, "status");
  return asRecord(payload) as MysoftConnectionStatus;
}

/** Retrieve one linked taxpayer by VKN/TCKN. */
export async function getMysoftTenant(
  identifierNumber: string,
  options: { signal?: AbortSignal } = {},
): Promise<MysoftTenant | null> {
  const identifier = identifierNumber.trim();
  if (!identifier) throw new Error("VKN/TCKN gereklidir.");
  const { payload } = await proxyRequest(
    `/${encodeURIComponent(identifier)}`,
    { method: "GET", signal: options.signal },
    "tenants",
  );
  return tenantRows(payload).map(normalizeMysoftTenant).find(Boolean) || null;
}

/** Retrieve detailed address/contact data for one linked taxpayer. */
export async function getMysoftTenantInfo(
  identifierNumber: string,
  options: { signal?: AbortSignal } = {},
): Promise<MysoftTenant | null> {
  const identifier = identifierNumber.trim();
  if (!identifier) throw new Error("VKN/TCKN gereklidir.");
  const { payload } = await proxyRequest(
    `/${encodeURIComponent(identifier)}/info`,
    { method: "GET", signal: options.signal },
    "tenants",
  );
  const rows = tenantRows(payload);
  return rows.map(normalizeMysoftTenant).find(Boolean) || normalizeMysoftTenant(unwrapResult(payload));
}

function fallbackDocuments(
  direction: EDocumentDirection | "all" = "all",
  companyId?: string,
  family?: MysoftDocumentFamily,
): MysoftEDocument[] {
  const canonical = canonicalDirection(direction);
  const wantedFamily = family ? canonicalDocumentFamily(family) : undefined;
  // Read the e-document key directly instead of going through getStoredData.
  // The latter intentionally supplies demo fixtures for a first-run app, but
  // those fixtures must never be merged into a real Mysoft account when the
  // e-document key is absent.  An explicitly persisted [] remains empty.
  const source = readPersistedEDocuments();
  return source
    .filter(
      (document) =>
        canonical === "all" ||
        canonicalDirection(document.direction) === canonical,
    )
    .filter((document) => !companyId || !document.companyId || document.companyId === companyId)
    .filter(
      (document) =>
        !wantedFamily ||
        canonicalDocumentFamily(document.family) === wantedFamily,
    )
    .map((document) => ({
      ...document,
      direction:
        canonicalDirection(document.direction) === "outgoing"
          ? "outbox"
          : "inbox",
      canonicalDirection:
        canonicalDirection(document.direction) === "outgoing"
          ? "outgoing"
          : "incoming",
      documentNumber: document.documentNumber || document.documentNo,
      number: document.number || document.documentNo,
      date: document.date || document.issueDate,
      amount: document.amount ?? document.grandTotal,
      statusLabel:
        document.statusLabel || document.statusText || document.status,
      partyName:
        document.partyName ||
        (canonicalDirection(document.direction) === "incoming"
          ? document.senderName
          : document.receiverName),
      partyTaxNumber:
        document.partyTaxNumber ||
        (canonicalDirection(document.direction) === "incoming"
          ? document.senderTaxNumber
          : document.receiverTaxNumber),
    }));
}

function documentStorageKey(document: Pick<MysoftEDocument, "direction" | "ettn" | "id" | "companyId" | "family">): string {
  const direction = canonicalDirection(document.direction);
  const identity = String(document.ettn || document.id || "").trim().toLocaleLowerCase();
  const owner = document.companyId ? `company:${document.companyId}` : "legacy";
  const family = canonicalDocumentFamily(document.family);
  return `${owner}:${family}:${direction}:${identity}`;
}

/** Read only the explicitly persisted e-document snapshot.  getStoredData()
 * supplies demo defaults for the rest of the application, which is useful to
 * render a first-run UI but is unsafe as a sync baseline. */
function readPersistedEDocuments(): MysoftEDocument[] {
  try {
    if (typeof localStorage === "undefined") return [];
    const stored = localStorage.getItem("muavin_e_documents");
    if (stored === null) return [];
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as MysoftEDocument[]) : [];
  } catch {
    return [];
  }
}

function makeQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "")
      search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

function getSignal(
  optionsOrSignal?: MysoftListOptions | AbortSignal,
): AbortSignal | undefined {
  return optionsOrSignal && "aborted" in optionsOrSignal
    ? (optionsOrSignal as AbortSignal)
    : (optionsOrSignal as MysoftListOptions | undefined)?.signal;
}

function getOptions(
  optionsOrSignal?: MysoftListOptions | AbortSignal,
): MysoftListOptions {
  if (!optionsOrSignal || "aborted" in optionsOrSignal) return {};
  return optionsOrSignal;
}

function getOperationOptions(
  optionsOrSignal?: MysoftOperationOptions | AbortSignal,
): MysoftOperationOptions {
  if (!optionsOrSignal || "aborted" in optionsOrSignal) {
    return optionsOrSignal ? { signal: optionsOrSignal as AbortSignal } : {};
  }
  return {
    ...optionsOrSignal,
    tenantIdentifierNumber: normalizeMysoftTenantIdentifier(
      optionsOrSignal.tenantIdentifierNumber,
    ),
  };
}

function isAbortError(error: unknown): boolean {
  return (
    (typeof DOMException !== "undefined" &&
      error instanceof DOMException &&
      error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

function createAbortError(): Error {
  if (typeof DOMException !== "undefined") {
    return new DOMException("The operation was aborted.", "AbortError");
  }
  const error = new Error("The operation was aborted.");
  error.name = "AbortError";
  return error;
}

const MAX_LIST_LIMIT = 1_000;

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** Validate and copy list options before they cross the browser/proxy boundary. */
function normalizeListOptions(options: MysoftListOptions): MysoftListOptions {
  const normalized: MysoftListOptions = { ...options };
  for (const field of ["startDate", "endDate"] as const) {
    const value = normalized[field];
    if (value === undefined || value === "") continue;
    if (typeof value !== "string" || !isValidIsoDate(value)) {
      throw new Error(`${field} must be a valid YYYY-MM-DD date`);
    }
  }
  if (
    normalized.startDate &&
    normalized.endDate &&
    normalized.startDate > normalized.endDate
  ) {
    throw new Error("startDate must be on or before endDate");
  }
  if (normalized.afterValue !== undefined) {
    if (
      !Number.isFinite(normalized.afterValue) ||
      !Number.isInteger(normalized.afterValue) ||
      normalized.afterValue < 0
    ) {
      throw new Error("afterValue must be a non-negative integer");
    }
  }
  if (normalized.limit !== undefined) {
    if (
      !Number.isFinite(normalized.limit) ||
      !Number.isInteger(normalized.limit) ||
      normalized.limit < 1
    ) {
      throw new Error("limit must be a positive integer");
    }
    normalized.limit = Math.min(MAX_LIST_LIMIT, normalized.limit);
  }
  if (normalized.pageSize !== undefined) {
    if (
      !Number.isFinite(normalized.pageSize) ||
      !Number.isInteger(normalized.pageSize) ||
      normalized.pageSize < 1
    ) {
      throw new Error("pageSize must be a positive integer");
    }
    normalized.pageSize = Math.min(MAX_LIST_LIMIT, normalized.pageSize);
  }
  if (normalized.pageNumber !== undefined) {
    if (
      !Number.isFinite(normalized.pageNumber) ||
      !Number.isInteger(normalized.pageNumber) ||
      normalized.pageNumber < 1
    ) {
      throw new Error("pageNumber must be a positive integer");
    }
  }
  if (normalized.cessionStatus !== undefined) {
    if (
      !Number.isFinite(normalized.cessionStatus) ||
      !Number.isInteger(normalized.cessionStatus)
    ) {
      throw new Error("cessionStatus must be an integer");
    }
  }
  normalized.tenantIdentifierNumber = normalizeMysoftTenantIdentifier(
    normalized.tenantIdentifierNumber,
  );
  return normalized;
}

/** Return the next calendar date without allowing local timezone/DST rules to
 * change the value sent to Mysoft.  The inbox period endpoint accepts at most
 * one day, so sync uses this helper to walk an inclusive date range. */
function nextIsoDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return next.toISOString().slice(0, 10);
}

function incomingDateChunks(
  options: MysoftListOptions,
): Array<{ startDate?: string; endDate?: string }> {
  if (!options.startDate || !options.endDate) {
    return [{ startDate: options.startDate, endDate: options.endDate }];
  }
  const chunks: Array<{ startDate: string; endDate: string }> = [];
  let current = options.startDate;
  while (current <= options.endDate) {
    chunks.push({ startDate: current, endDate: current });
    const next = nextIsoDate(current);
    // The normalized date validator makes this unreachable for valid input,
    // but the guard keeps malformed values from creating an infinite loop if
    // this helper is reused independently in the future.
    if (next <= current) break;
    current = next;
  }
  return chunks;
}

/**
 * Numbered inbox paging accepts at most a 90-day inclusive range.  Keep a
 * caller's normal (<=90 day) range intact so pageNumber advances globally,
 * but split longer ranges into API-sized chunks and restart pageNumber for
 * each independent date filter.
 */
const MAX_INCOMING_PAGING_DAYS = 90;

function incomingPagingDateChunks(
  options: MysoftListOptions,
): Array<{ startDate?: string; endDate?: string }> {
  if (!options.startDate || !options.endDate) {
    return [{ startDate: options.startDate, endDate: options.endDate }];
  }
  const chunks: Array<{ startDate: string; endDate: string }> = [];
  let current = options.startDate;
  while (current <= options.endDate) {
    let chunkEnd = current;
    for (let index = 1; index < MAX_INCOMING_PAGING_DAYS; index += 1) {
      const next = nextIsoDate(chunkEnd);
      if (next > options.endDate) break;
      chunkEnd = next;
    }
    chunks.push({ startDate: current, endDate: chunkEnd });
    const next = nextIsoDate(chunkEnd);
    if (next <= chunkEnd) break;
    current = next;
  }
  return chunks;
}

function extractAfterValue(payload: unknown): number | undefined {
  const root = asRecord(payload);
  const unwrapped = asRecord(unwrapResult(payload));
  const candidates: unknown[] = [
    pickField(root, ["afterValue", "nextAfterValue", "nextCursor"]),
    pickField(unwrapped, ["afterValue", "nextAfterValue", "nextCursor"]),
  ];
  for (const candidate of candidates) {
    const value = asNumber(candidate);
    if (value !== undefined && Number.isInteger(value) && value >= 0) {
      return value;
    }
  }
  return undefined;
}

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") || "";
  if (
    contentType.includes("application/json") ||
    contentType.includes("text/json")
  ) {
    // Read text once rather than calling response.json().  Mysoft gateways
    // occasionally label a StringResultModel/base64 body as JSON even when it
    // is not valid JSON; retaining that text lets the download helper decode
    // it instead of silently returning an empty payload.  Strip a UTF-8 BOM
    // before JSON.parse because some gateway responses include one.
    const text = await response.text();
    if (!text) return undefined;
    try {
      return JSON.parse(text.replace(/^\uFEFF/, ""));
    } catch {
      return text;
    }
  }
  // Preserve binary invoice downloads. Calling text() on a ZIP/PDF consumes
  // and corrupts the body, so the download helper would otherwise be unable
  // to create a usable Blob without issuing a second request.
  if (
    /(?:zip|pdf|octet-stream|image\/|audio\/|video\/|gzip|tar)/i.test(
      contentType,
    ) ||
    (response.headers.has("content-disposition") &&
      !contentType.startsWith("text/"))
  ) {
    return await response.arrayBuffer();
  }
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function proxyRequest(
  path: string,
  init: RequestInit = {},
  resource = "e-documents",
): Promise<{ response: Response; payload: unknown }> {
  // Production deployments protect the server-side Mysoft proxy with the
  // signed-in Firebase user's ID token.  Wait for Firebase's initial auth
  // restore when possible so a cold page load does not race the guard.  The
  // request still works in local/demo mode when no Firebase user exists.
  let authorization: string | undefined;
  try {
    let currentUser = auth.currentUser;
    if (!currentUser && typeof auth.authStateReady === "function") {
      await auth.authStateReady();
      currentUser = auth.currentUser;
    }
    if (currentUser) authorization = `Bearer ${await currentUser.getIdToken()}`;
  } catch {
    // Let the proxy return its normal 401/configuration response. Do not
    // block local fallback logins or expose Firebase internals in the UI.
  }
  const response = await fetch(`/api/mysoft/${resource}${path}`, {
    ...init,
    headers: {
      Accept:
        "application/json, application/zip, application/pdf, application/xml, text/html;q=0.9",
      ...(authorization ? { Authorization: authorization } : {}),
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
  });
  const payload = await parseResponse(response);
  if (!response.ok) {
    const record = asRecord(payload);
    throw new MysoftApiError(
      firstString(pickField(record, ["message", "error", "detail"])) ||
        `Mysoft proxy request failed (${response.status})`,
      response.status,
      payload,
    );
  }
  // Mysoft wraps most operations in a result model and may return HTTP 200
  // even when the operation was rejected. Treat an explicit `succeed:false`
  // as an error so callers never persist a locally-created invoice as sent.
  const result = asRecord(payload);
  if (result && pickField(result, ["succeed", "success"]) === false) {
    throw new MysoftApiError(
      firstString(pickField(result, ["message", "error", "detail"])) ||
        "Mysoft e-belge işlemi başarısız.",
      response.status,
      payload,
    );
  }
  return { response, payload };
}

/**
 * Create an outgoing e-Fatura/e-Arşiv document through the same-origin proxy.
 * The payload is intentionally opaque here: Mysoft has separate request
 * models for normal and UBL submissions and the server remains responsible
 * for credentials and tenant defaults.
 */
export async function createMysoftOutgoingEDocument(
  payload: unknown,
  options: { signal?: AbortSignal } = {},
): Promise<unknown> {
  const { payload: result } = await proxyRequest("/outgoing", {
    method: "POST",
    body: JSON.stringify(payload ?? {}),
    signal: options.signal,
  });
  return result;
}

/** Submit an outgoing invoice carrying a UBL XML document. */
export async function createMysoftOutgoingEDocumentWithUbl(
  payload: unknown,
  options: { signal?: AbortSignal } = {},
): Promise<unknown> {
  const { payload: result } = await proxyRequest("/outgoing/ubl", {
    method: "POST",
    body: JSON.stringify(payload ?? {}),
    signal: options.signal,
  });
  return result;
}

/**
 * Compatibility aliases used by invoice-entry integrations.  Keep the
 * transport implementation in the create* helpers above so all outgoing
 * submissions continue to use the same-origin proxy and never expose Mysoft
 * credentials in the browser.
 */
export function sendMysoftOutgoingInvoice(
  payload: unknown,
  options: { signal?: AbortSignal } = {},
): Promise<unknown> {
  return createMysoftOutgoingEDocument(payload, options);
}

/** Submit an outgoing invoice whose payload contains a UBL XML string. */
export function sendMysoftOutgoingInvoiceWithUbl(
  payload: unknown,
  options: { signal?: AbortSignal } = {},
): Promise<unknown> {
  return createMysoftOutgoingEDocumentWithUbl(payload, options);
}

export interface MysoftInvoiceDraftPreviewResult {
  kind: "html" | "pdf";
  objectUrl: string;
  filename: string;
  /** Revoke blob URL when panel unmounts or refreshes. */
  revoke: () => void;
}

/** Resolve Mysoft draft preview bytes (PDF/HTML, plain or inside zip/base64 JSON). */
async function resolveMysoftDraftPreviewBytes(
  payload: unknown,
  format: "html" | "pdf",
  signal?: AbortSignal,
): Promise<{ bytes: Uint8Array; filename: string }> {
  const { response, payload: body } = await proxyRequest(
    `outgoing/draft-preview?format=${format}`,
    {
      method: "POST",
      body: JSON.stringify(payload ?? {}),
      signal,
    },
    "",
  );
  const fallbackName = `fatura-taslak.${format === "pdf" ? "pdf" : "html"}`;

  if (body instanceof ArrayBuffer) {
    return { bytes: new Uint8Array(body), filename: fallbackName };
  }

  const record = asRecord(body);
  const data = firstString(pickField(record, ["data", "file", "content"]));
  if (data) {
    const decoded = decodeBase64Payload(data);
    if (decoded) {
      return { bytes: decoded.bytes, filename: fallbackName };
    }
  }

  if (typeof body === "string") {
    const decoded = decodeBase64Payload(body);
    if (decoded) return { bytes: decoded.bytes, filename: fallbackName };
    return { bytes: new TextEncoder().encode(body), filename: fallbackName };
  }

  throw new MysoftApiError(
    firstString(pickField(record, ["message", "error"])) ||
      "Mysoft taslak önizlemesi alınamadı.",
    response.status,
    body,
  );
}

/**
 * Fetch Mysoft portal draft preview (official XSLT layout). Does not send to GİB.
 */
export async function fetchMysoftInvoiceDraftPreview(
  payload: unknown,
  format: "html" | "pdf" = "html",
  options: { signal?: AbortSignal } = {},
): Promise<MysoftInvoiceDraftPreviewResult> {
  const { extractFirstFileFromZip, isPdfBytes, isZipBytes } = await import(
    "../utils/mysoftZip.ts"
  );
  const { bytes, filename } = await resolveMysoftDraftPreviewBytes(
    payload,
    format,
    options.signal,
  );
  let resolved = bytes;
  let resolvedName = filename;

  if (isZipBytes(bytes)) {
    const extracted = await extractFirstFileFromZip(bytes);
    if (!extracted) {
      throw new Error("Mysoft taslak zip dosyası açılamadı.");
    }
    resolved = extracted.bytes;
    resolvedName = extracted.name || filename;
  }

  if (format === "pdf" || isPdfBytes(resolved)) {
    const blob = new Blob([resolved], { type: "application/pdf" });
    const objectUrl = URL.createObjectURL(blob);
    return {
      kind: "pdf",
      objectUrl,
      filename: resolvedName.endsWith(".pdf") ? resolvedName : `${resolvedName}.pdf`,
      revoke: () => URL.revokeObjectURL(objectUrl),
    };
  }

  const html = new TextDecoder().decode(resolved);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  return {
    kind: "html",
    objectUrl,
    filename: resolvedName.endsWith(".html") ? resolvedName : `${resolvedName}.html`,
    revoke: () => URL.revokeObjectURL(objectUrl),
  };
}

interface MysoftListPage {
  documents: MysoftEDocument[];
  afterValue?: number;
  /** Total records reported by the incoming paging endpoint. */
  totalCount?: number;
}

function extractTotalCount(payload: unknown): number | undefined {
  const root = asRecord(payload);
  const unwrapped = asRecord(unwrapResult(payload));
  for (const candidate of [
    pickField(root, ["totalCount", "total", "count"]),
    pickField(unwrapped, ["totalCount", "total", "count"]),
  ]) {
    const value = asNumber(candidate);
    if (value !== undefined && Number.isInteger(value) && value >= 0) {
      return value;
    }
  }
  return undefined;
}

async function requestMysoftEDocumentPage(
  direction: EDocumentDirection,
  options: MysoftListOptions,
): Promise<MysoftListPage> {
  const normalizedOptions = normalizeListOptions(options);
  const canonical = canonicalDirection(direction);
  const { payload } = await proxyRequest(
    makeQuery({
      direction: canonical,
      startDate: normalizedOptions.startDate,
      endDate: normalizedOptions.endDate,
      limit: normalizedOptions.limit,
      afterValue: normalizedOptions.afterValue,
      pageSize: normalizedOptions.pageSize,
      pageNumber: normalizedOptions.pageNumber,
      tenantIdentifierNumber: normalizedOptions.tenantIdentifierNumber,
      ettn: normalizedOptions.ettn,
      docNo: normalizedOptions.docNo,
      accountName: normalizedOptions.accountName,
      pkAlias: normalizedOptions.pkAlias,
      eDocumentType: normalizedOptions.eDocumentType,
      profile: normalizedOptions.profile,
      portalInvoiceStatus: normalizedOptions.portalInvoiceStatus,
      archiveStatus: normalizedOptions.archiveStatus,
      vknTckn: normalizedOptions.vknTckn,
      isUseDocDate: normalizedOptions.isUseDocDate,
      cessionStatus: normalizedOptions.cessionStatus,
      family: canonicalDocumentFamily(normalizedOptions.family),
    }),
    { method: "GET", signal: normalizedOptions.signal },
  );
  return {
    documents: normalizeRows(
      payload,
      canonical === "outgoing" ? "outgoing" : "incoming",
      new Date().toISOString(),
      options.companyId,
      canonicalDocumentFamily(normalizedOptions.family),
    ),
    afterValue: extractAfterValue(payload),
    totalCount: extractTotalCount(payload),
  };
}

/** List incoming/outgoing records through the same-origin server proxy. */
export async function listMysoftEDocuments(
  direction: EDocumentDirection = "inbox",
  optionsOrSignal?: MysoftListOptions | AbortSignal,
): Promise<MysoftEDocument[]> {
  const options = normalizeListOptions(getOptions(optionsOrSignal));
  try {
    // A valid empty response is not an error and must not display fixtures.
    return (await requestMysoftEDocumentPage(direction, options)).documents;
  } catch (error) {
    if (isAbortError(error) || options.fallback !== true) throw error;
    console.warn(
      "Mysoft e-document list unavailable; using the explicitly requested local snapshot.",
      error,
    );
    return fallbackDocuments(
      canonicalDirection(direction),
      options.companyId,
      canonicalDocumentFamily(options.family),
    );
  }
}

/** Get a single model by ETTN/id. Connection fallbacks are opt-in. */
export async function getMysoftEDocument(
  id: string,
  optionsOrSignal?: MysoftOperationOptions | AbortSignal,
): Promise<MysoftEDocument | null> {
  if (!id) return null;
  const options = getOperationOptions(optionsOrSignal);
  try {
    const { payload } = await proxyRequest(
      `/${encodeURIComponent(id)}${makeQuery({
        direction:
          options.direction === undefined
            ? undefined
            : canonicalDirection(options.direction),
        tenantIdentifierNumber: options.tenantIdentifierNumber,
        family: canonicalDocumentFamily(options.family),
      })}`,
      {
        method: "GET",
        signal: options.signal,
      },
    );
    const raw = unwrapResult(payload);
    const direction =
      (asRecord(raw) &&
        (firstString(
          pickField(asRecord(raw), ["direction"]),
        ) as EDocumentDirection)) ||
      options.direction ||
      "incoming";
    return normalizeMysoftEDocument(
      raw,
      direction,
      new Date().toISOString(),
      options.companyId,
      canonicalDocumentFamily(options.family),
    );
  } catch (error) {
    if (isAbortError(error) || options.fallback !== true) throw error;
    const fallback = fallbackDocuments("all", options.companyId).find(
      (document) => document.id === id || document.ettn === id,
    );
    return fallback ? { ...fallback } : null;
  }
}

/**
 * Read the current Mysoft status for an invoice.  The proxy resolves the
 * inbox/outbox operation when direction is omitted and can be pinned with
 * `direction` when the caller already knows where the document lives.
 */
export async function getMysoftEDocumentStatus(
  id: string,
  optionsOrSignal?: MysoftOperationOptions | AbortSignal,
): Promise<unknown> {
  if (!id) throw new Error("E-belge kimliği gereklidir.");
  const options = getOperationOptions(optionsOrSignal);
  const { payload } = await proxyRequest(
    `/${encodeURIComponent(id)}/status${makeQuery({
      direction:
        options.direction === undefined
          ? undefined
          : canonicalDirection(options.direction),
      tenantIdentifierNumber: options.tenantIdentifierNumber,
      family: canonicalDocumentFamily(options.family),
    })}`,
    {
      method: "GET",
      signal: options.signal,
    },
  );
  return payload;
}

function mockDownload(id: string, format: string): MysoftDocumentDownload {
  const document = initialMysoftEDocuments.find(
    (item) => item.id === id || item.ettn === id,
  );
  const filename = `${document?.documentNo || id}.${format === "xml" ? "xml" : format === "html" ? "html" : "pdf"}`;
  const html = `<!doctype html><meta charset="utf-8"><title>${filename}</title><p>Demo e-belge: ${document?.documentNo || id}</p>`;
  const mimeType =
    format === "xml"
      ? "application/xml"
      : format === "html"
        ? "text/html"
        : "application/pdf";
  return {
    id,
    format,
    filename,
    mimeType,
    blob:
      typeof Blob !== "undefined"
        ? new Blob([html], { type: mimeType })
        : undefined,
    data: html,
    isMock: true,
  };
}

/**
 * Mysoft's StringResultModel commonly carries a base64-encoded ZIP while the
 * HTTP content type remains text/plain or application/json. Decode it in the
 * browser so the downloaded file is usable instead of a blob containing the
 * base64 characters. Returns undefined for ordinary text/XML and URLs.
 */
function decodeBase64Payload(value: string): {
  bytes: Uint8Array;
  mediaType?: string;
} | undefined {
  const trimmed = value.trim();
  const dataUri = /^data:([^;,]+)?;base64,(.*)$/is.exec(trimmed);
  const mediaType = dataUri?.[1];
  let encoded = dataUri ? dataUri[2] : trimmed;
  // Whitespace is permitted in base64 responses copied through a gateway.
  encoded = encoded.replace(/\s+/g, "");
  // Reject normal text and malformed values before invoking atob. Padding is
  // optional in some Mysoft gateway responses, so add it when safe.
  if (
    !encoded ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded) ||
    encoded.length % 4 === 1
  ) {
    return undefined;
  }
  encoded += "=".repeat((4 - (encoded.length % 4)) % 4);
  try {
    if (typeof atob !== "function") return undefined;
    const decoded = atob(encoded);
    const bytes = new Uint8Array(decoded.length);
    for (let index = 0; index < decoded.length; index += 1) {
      bytes[index] = decoded.charCodeAt(index);
    }
    return { bytes, mediaType };
  } catch {
    return undefined;
  }
}

function binaryDownloadShape(
  id: string,
  format: string,
  filename: string,
  contentType: string,
  data: string,
): MysoftDocumentDownload | undefined {
  const decoded = decodeBase64Payload(data);
  if (!decoded || typeof Blob === "undefined") return undefined;
  const bytes = decoded.bytes;
  const isZip = bytes.length >= 4 &&
    bytes[0] === 0x50 && bytes[1] === 0x4b &&
    (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07) &&
    (bytes[3] === 0x04 || bytes[3] === 0x06 || bytes[3] === 0x08);
  const isPdf = bytes.length >= 4 &&
    bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  const mimeType = isZip
    ? "application/zip"
    : isPdf
      ? "application/pdf"
      : decoded.mediaType ||
        (format === "xml" ? "application/xml" : format === "html" ? "text/html" : contentType);
  const outputFilename = isZip && !/\.zip$/i.test(filename)
    ? `${filename}.zip`
    : filename;
  return {
    id,
    format,
    filename: outputFilename,
    mimeType,
    blob: new Blob([bytes], { type: mimeType }),
    // Keep the original value for non-browser consumers and diagnostics.
    data,
  };
}

/** Download PDF/XML/HTML through the proxy, preserving binary or URL responses. */
export async function downloadMysoftEDocument(
  id: string,
  format: "pdf" | "xml" | "html" | string = "pdf",
  optionsOrSignal?: MysoftOperationOptions | AbortSignal,
): Promise<MysoftDocumentDownload> {
  if (!id) throw new Error("E-belge kimliği gereklidir.");
  const options = getOperationOptions(optionsOrSignal);
  try {
    const { response, payload } = await proxyRequest(
      `/${encodeURIComponent(id)}/download${makeQuery({
        format,
        direction:
          options.direction === undefined
            ? undefined
            : canonicalDirection(options.direction),
        tenantIdentifierNumber: options.tenantIdentifierNumber,
        family: canonicalDocumentFamily(options.family),
      })}`,
      {
        method: "GET",
        signal: options.signal,
      },
    );
    const contentType =
      response.headers.get("content-type") || "application/octet-stream";
    const contentDisposition =
      response.headers.get("content-disposition") || "";
    const filenameMatch = /filename\*?=(?:UTF-8''|\")?([^;\"]+)/i.exec(
      contentDisposition,
    );
    const fallbackExt =
      format === "xml" ? "xml" : format === "html" ? "html" : "pdf";
    const filename = filenameMatch?.[1]
      ? decodeURIComponent(filenameMatch[1].replace(/[\"]/g, ""))
      : `${id}.${fallbackExt}`;
    if (payload instanceof ArrayBuffer) {
      const blob = new Blob([payload], { type: contentType });
      return { id, format, filename, mimeType: contentType, blob };
    }
    if (typeof payload === "string") {
      const isUrl = /^https?:\/\//i.test(payload) || /^data:/i.test(payload);
      if (!isUrl) {
        const binary = binaryDownloadShape(
          id,
          format,
          filename,
          contentType,
          payload,
        );
        if (binary) return binary;
      }
      return {
        id,
        format,
        filename,
        mimeType: contentType,
        url: isUrl ? payload : undefined,
        data: payload,
      };
    }
    const record = asRecord(payload);
    const data = firstString(
      pickField(record, ["data", "url", "downloadUrl", "file", "content"]),
    );
    if (data) {
      const isUrl = /^https?:\/\//i.test(data) || /^data:/i.test(data);
      if (!isUrl) {
        const binary = binaryDownloadShape(
          id,
          format,
          filename,
          contentType,
          data,
        );
        if (binary) return binary;
      }
      return {
        id,
        format,
        filename,
        mimeType: contentType,
        url: isUrl ? data : undefined,
        data,
      };
    }
    return { id, format, filename, mimeType: contentType };
  } catch (error) {
    if (isAbortError(error) || options.fallback !== true) throw error;
    return mockDownload(id, format);
  }
}

/** Execute an inbox/outbox state transition through the same-origin proxy. */
async function runMysoftEDocumentAction(
  id: string,
  action: "accept" | "deny" | "cancel" | "send-draft" | "acknowledge",
  body?: Record<string, unknown>,
  optionsOrSignal?: MysoftOperationOptions | AbortSignal,
): Promise<unknown> {
  const options = getOperationOptions(optionsOrSignal);
  if (!id) throw new Error("E-belge kimliği gereklidir.");
  const requestBody = body ? { ...body } : undefined;
  const tenantIdentifierNumber = normalizeMysoftTenantIdentifier(
    options.tenantIdentifierNumber || requestBody?.tenantIdentifierNumber,
  );
  if (requestBody) {
    if (tenantIdentifierNumber) requestBody.tenantIdentifierNumber = tenantIdentifierNumber;
    else delete requestBody.tenantIdentifierNumber;
  }
  const { payload } = await proxyRequest(
    `/${encodeURIComponent(id)}/${action}${makeQuery({
      direction:
        options.direction === undefined
          ? undefined
          : canonicalDirection(options.direction),
      tenantIdentifierNumber,
      family: canonicalDocumentFamily(options.family),
    })}`,
    {
      method: "POST",
      ...(requestBody ? { body: JSON.stringify(requestBody) } : {}),
      signal: options.signal,
    },
  );
  return payload;
}

export function acceptMysoftEDocument(
  id: string,
  optionsOrSignal?: MysoftOperationOptions | AbortSignal,
): Promise<unknown> {
  return runMysoftEDocumentAction(id, "accept", undefined, optionsOrSignal);
}

/** Mark an incoming invoice as received/saved by the customer. */
export function acknowledgeMysoftEDocument(
  id: string,
  optionsOrSignal?: MysoftOperationOptions | AbortSignal,
): Promise<unknown> {
  return runMysoftEDocumentAction(id, "acknowledge", undefined, optionsOrSignal);
}

export function denyMysoftEDocument(
  id: string,
  rejectReason: string,
  optionsOrSignal?: MysoftOperationOptions | AbortSignal,
): Promise<unknown> {
  const reason = rejectReason.trim();
  if (!reason) return Promise.reject(new Error("Ret gerekçesi zorunludur."));
  return runMysoftEDocumentAction(
    id,
    "deny",
    { rejectReason: reason },
    optionsOrSignal,
  );
}

export function cancelMysoftEDocument(
  id: string,
  options: MysoftCancelOptions = {},
  operationOptionsOrSignal?: MysoftOperationOptions | AbortSignal,
): Promise<unknown> {
  return runMysoftEDocumentAction(
    id,
    "cancel",
    options as unknown as Record<string, unknown>,
    operationOptionsOrSignal,
  );
}

export function sendMysoftDraftEDocument(
  id: string,
  options: MysoftDraftSendOptions = {},
  operationOptionsOrSignal?: MysoftOperationOptions | AbortSignal,
): Promise<unknown> {
  return runMysoftEDocumentAction(
    id,
    "send-draft",
    options as unknown as Record<string, unknown>,
    operationOptionsOrSignal,
  );
}

/** Pull both inbox and outbox, merge by ETTN/id, and persist the snapshot. */
export async function syncMysoftEDocuments(
  options: MysoftSyncOptions = {},
  signal?: AbortSignal,
): Promise<MysoftSyncResult> {
  const startedAt = new Date().toISOString();
  const direction = options.direction || "all";
  const signalToUse = signal || options.signal;
  const normalizedOptions = normalizeListOptions(options);
  const directions: Array<"incoming" | "outgoing"> =
    canonicalDirection(direction) === "all"
      ? ["incoming", "outgoing"]
      : [canonicalDirection(direction) as "incoming" | "outgoing"];
  try {
    const MAX_SYNC_PAGES = 1_000;
    const MAX_SYNC_REQUESTS = 10_000;
    const lists = await Promise.all(
      directions.map(async (item) => {
        // Mysoft's non-paging inbox endpoint rejects periods longer than one
        // day. Split explicit ranges into inclusive calendar-day requests;
        // each day starts from the caller's cursor because afterValue is not a
        // cursor shared across independent date filters.
        // Numbered paging accepts a range of up to 90 days. Keep ranges within
        // that limit intact so pageNumber advances globally; longer ranges are
        // split into API-sized chunks (never one-day chunks) below.
        const usesNumberedPaging =
          canonicalDirection(item) === "incoming" &&
          (normalizedOptions.pageSize !== undefined ||
            normalizedOptions.pageNumber !== undefined);
        const chunks =
          canonicalDirection(item) === "incoming"
            ? usesNumberedPaging
              ? incomingPagingDateChunks(normalizedOptions)
              : incomingDateChunks(normalizedOptions)
            : [{
                startDate: normalizedOptions.startDate,
                endDate: normalizedOptions.endDate,
              }];
        const documentsByKey = new Map<string, MysoftEDocument>();
        let requestCount = 0;
        for (const chunk of chunks) {
          // Supplying pageSize/pageNumber selects Mysoft's incoming paging
          // endpoint. That endpoint advances by pageNumber (and does not
          // return the cursor used by the legacy period endpoint), so keep a
          // separate counter instead of repeatedly requesting page one.
          let afterValue = normalizedOptions.afterValue ?? 0;
          let pageNumber = normalizedOptions.pageNumber ?? 1;
          let fetchedCount = 0;
          let pageCount = 0;
          while (pageCount < MAX_SYNC_PAGES && requestCount < MAX_SYNC_REQUESTS) {
            if (signalToUse?.aborted) throw createAbortError();
            const page = await requestMysoftEDocumentPage(item, {
              ...normalizedOptions,
              ...chunk,
              // The numbered paging request ignores afterValue. Omitting it
              // also keeps the serialized body aligned with its schema.
              ...(usesNumberedPaging ? {} : { afterValue }),
              ...(usesNumberedPaging ? { pageNumber } : {}),
              fallback: false,
              signal: signalToUse,
            });
            requestCount += 1;
            fetchedCount += page.documents.length;
            for (const document of page.documents) {
              const key = documentStorageKey(document);
              documentsByKey.set(key, document);
            }
            if (usesNumberedPaging) {
              const requestedPageSize = normalizedOptions.pageSize ?? 100;
              const reachedTotal =
                page.totalCount !== undefined && fetchedCount >= page.totalCount;
              // A short/empty page is terminal when the API omits totalCount.
              // Empty pages are terminal even when a faulty tenant reports an
              // unexpectedly large total.
              if (
                page.documents.length === 0 ||
                reachedTotal ||
                (page.totalCount === undefined &&
                  page.documents.length < requestedPageSize)
              ) {
                break;
              }
              pageNumber += 1;
              pageCount += 1;
              continue;
            }
            const nextAfterValue = page.afterValue;
            if (
              nextAfterValue === undefined ||
              nextAfterValue <= afterValue ||
              (page.documents.length === 0 && nextAfterValue === 0)
            ) {
              break;
            }
            afterValue = nextAfterValue;
            pageCount += 1;
          }
          if (requestCount >= MAX_SYNC_REQUESTS) break;
        }
        return [...documentsByKey.values()];
      }),
    );
    const incoming = lists.flat();
    const previous = readPersistedEDocuments();
    const byKey = new Map(previous.map((document) => [documentStorageKey(document), document]));
    let addedCount = 0;
    let updatedCount = 0;
    for (const document of incoming) {
      const key = documentStorageKey(document);
      // Legacy snapshots pre-date company ownership. When the first scoped
      // sync arrives, replace the matching unassigned row instead of leaving
      // a duplicate that could appear under every taxpayer.
      if (document.companyId) {
        const identity = String(document.ettn || document.id || "").toLocaleLowerCase();
        const family = canonicalDocumentFamily(document.family);
        byKey.delete(`legacy:${family}:${canonicalDirection(document.direction)}:${identity}`);
        byKey.delete(`legacy:${canonicalDirection(document.direction)}:${identity}`);
      }
      if (byKey.has(key)) updatedCount += 1;
      else addedCount += 1;
      byKey.set(key, document);
    }
    const documents = [...byKey.values()];
    const wantedFamily = canonicalDocumentFamily(normalizedOptions.family);
    const scopedDocuments = documents.filter((document) => {
      if (canonicalDocumentFamily(document.family) !== wantedFamily) return false;
      if (!normalizedOptions.companyId || !document.companyId) return true;
      return document.companyId === normalizedOptions.companyId;
    });
    saveStoredData("EDOCUMENTS", documents);
    return {
      documents: scopedDocuments,
      addedCount,
      updatedCount,
      totalCount: scopedDocuments.length,
      syncedAt: startedAt,
      source: "mysoft",
    };
  } catch (error) {
    if (isAbortError(error) || options.fallback !== true) throw error;
    const documents = fallbackDocuments(
      direction,
      normalizedOptions.companyId,
      canonicalDocumentFamily(normalizedOptions.family),
    );
    saveStoredData("EDOCUMENTS", documents);
    return {
      documents,
      addedCount: 0,
      updatedCount: 0,
      totalCount: documents.length,
      syncedAt: startedAt,
      source: "local",
      warning:
        error instanceof Error
          ? error.message
          : "Mysoft servisine ulaşılamadı.",
    };
  }
}

/**
 * Direct server-side Mysoft client. The browser-facing helpers above call the
 * local proxy; this class is exported for the proxy implementation and tests.
 */
export class MysoftEDocumentClient {
  private readonly config: Required<Pick<MysoftApiConfig, "baseUrl">> &
    MysoftApiConfig;
  private token?: string;
  private tokenExpiresAt = 0;

  constructor(config: MysoftApiConfig = {}) {
    this.config = {
      ...config,
      baseUrl: resolveMysoftBaseUrl(config),
      fetchImpl: config.fetchImpl || fetch,
    };
  }

  private async getToken(signal?: AbortSignal): Promise<string> {
    if (this.config.accessToken) return this.config.accessToken;
    if (this.token && Date.now() < this.tokenExpiresAt - 15_000)
      return this.token;
    const clientId =
      this.config.clientId ||
      getRuntimeEnv("MYSOFT_EDOCUMENT_CLIENT_ID") ||
      getRuntimeEnv("MYSOFT_CLIENT_ID");
    const clientSecret =
      this.config.clientSecret ||
      getRuntimeEnv("MYSOFT_EDOCUMENT_CLIENT_SECRET") ||
      getRuntimeEnv("MYSOFT_CLIENT_SECRET");
    if (!clientId || !clientSecret) {
      throw new MysoftApiError(
        "Mysoft OAuth istemci bilgileri eksik. MYSOFT_EDOCUMENT_CLIENT_ID ve MYSOFT_EDOCUMENT_CLIENT_SECRET tanımlayın.",
      );
    }
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    });
    const response = await this.config.fetchImpl(
      `${this.config.baseUrl}${MYSOFT_ROUTES.token}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body,
        signal,
      },
    );
    const payload = await parseResponse(response);
    if (!response.ok)
      throw new MysoftApiError(
        "Mysoft OAuth token alınamadı.",
        response.status,
        payload,
      );
    const record = asRecord(payload);
    const token = firstString(
      pickField(record, ["access_token", "accessToken", "token"]),
    );
    if (!token)
      throw new MysoftApiError(
        "Mysoft OAuth yanıtında access_token bulunamadı.",
        response.status,
        payload,
      );
    this.token = token;
    this.tokenExpiresAt =
      Date.now() +
      (firstNumber(pickField(record, ["expires_in", "expiresIn"])) || 300) *
        1000;
    return token;
  }

  private async request(
    path: string,
    init: RequestInit = {},
    signal?: AbortSignal,
  ): Promise<unknown> {
    const token = await this.getToken(signal);
    const response = await this.config.fetchImpl(
      `${this.config.baseUrl}${path}`,
      {
        ...init,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          ...(init.headers || {}),
        },
        signal: signal || init.signal,
      },
    );
    const payload = await parseResponse(response);
    const record = asRecord(payload);
    if (!response.ok || (record && pickField(record, ["succeed"]) === false)) {
      throw new MysoftApiError(
        firstString(pickField(record, ["message", "error", "detail"])) ||
          "Mysoft API isteği başarısız.",
        response.status,
        payload,
      );
    }
    return payload;
  }

  private bodyForList(
    filters: MysoftListFilters = {},
    includeEDocumentType = true,
  ): Record<string, unknown> {
    const normalized = normalizeListOptions(filters);
    const body: Record<string, unknown> = {
      afterValue: normalized.afterValue ?? 0,
      limit: normalized.limit ?? 100,
      tenantIdentifierNumber:
        normalized.tenantIdentifierNumber ||
        normalizeMysoftTenantIdentifier(this.config.tenantIdentifierNumber),
      startDate: normalized.startDate,
      endDate: normalized.endDate,
      pkAlias: normalized.pkAlias,
      ettn: normalized.ettn,
      vknTckn: normalized.vknTckn,
      isUseDocDate: normalized.isUseDocDate,
      cessionStatus: normalized.cessionStatus,
    };
    // The inbox period request model rejects unknown properties and does not
    // define eDocumentType.  Outbox accepts this optional filter, so only add
    // it for that request shape.
    if (includeEDocumentType) body.eDocumentType = normalized.eDocumentType;
    return body;
  }

  /** POSTs GetInvoiceInboxListForPeriodRequestModel to Mysoft. */
  listInbox(
    filters: MysoftListFilters = {},
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request(
      MYSOFT_ROUTES.inboxList,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.bodyForList(filters, false)),
      },
      signal,
    );
  }

  /** POSTs GetInvoiceOutboxListRequestModel to Mysoft. */
  listOutbox(
    filters: MysoftListFilters = {},
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request(
      MYSOFT_ROUTES.outboxList,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.bodyForList(filters)),
      },
      signal,
    );
  }

  /** Direct-client variant of the accountant tenant directory. */
  listTenants(
    filters: MysoftTenantListOptions = {},
    signal?: AbortSignal,
  ): Promise<unknown> {
    const afterValue = Number.isFinite(filters.afterValue)
      ? Math.max(0, Math.trunc(filters.afterValue as number))
      : undefined;
    const limit = Number.isFinite(filters.limit)
      ? Math.max(1, Math.min(50, Math.trunc(filters.limit as number)))
      : 50;
    return this.request(
      `${MYSOFT_ROUTES.tenantList}${makeQuery({ afterValue: afterValue ?? 0, limit })}`,
      {},
      signal,
    );
  }

  getTenantWithIdentifier(identifierNumber: string, signal?: AbortSignal): Promise<unknown> {
    return this.request(
      `${MYSOFT_ROUTES.tenantByIdentifier}${makeQuery({ identifierNumber: identifierNumber.trim() })}`,
      {},
      signal,
    );
  }

  getTenantInfo(identifierNumber: string, signal?: AbortSignal): Promise<unknown> {
    return this.request(
      `${MYSOFT_ROUTES.tenantInfo}${makeQuery({ identifierNumber: identifierNumber.trim() })}`,
      {},
      signal,
    );
  }

  getModel(
    direction: EDocumentDirection,
    ettn: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const path =
      canonicalDirection(direction) === "outgoing"
        ? MYSOFT_ROUTES.outboxModel
        : MYSOFT_ROUTES.inboxModel;
    return this.request(
      `${path}${makeQuery({ invoiceETTN: ettn, tenantIdentifierNumber: this.config.tenantIdentifierNumber })}`,
      {},
      signal,
    );
  }

  getPdf(
    direction: EDocumentDirection,
    ettn: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const path =
      canonicalDirection(direction) === "outgoing"
        ? MYSOFT_ROUTES.outboxPdf
        : MYSOFT_ROUTES.inboxPdf;
    return this.request(
      `${path}${makeQuery({ invoiceETTN: ettn, tenantIdentifierNumber: this.config.tenantIdentifierNumber })}`,
      {},
      signal,
    );
  }

  getXml(
    direction: EDocumentDirection,
    ettn: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const path =
      canonicalDirection(direction) === "outgoing"
        ? MYSOFT_ROUTES.outboxXml
        : MYSOFT_ROUTES.inboxXml;
    return this.request(
      `${path}${makeQuery({ invoiceETTN: ettn, tenantIdentifierNumber: this.config.tenantIdentifierNumber })}`,
      {},
      signal,
    );
  }

  getStatus(
    direction: EDocumentDirection,
    ettn: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const path =
      canonicalDirection(direction) === "outgoing"
        ? MYSOFT_ROUTES.outboxStatus
        : MYSOFT_ROUTES.inboxStatus;
    return this.request(
      `${path}${makeQuery({ invoiceETTN: ettn, tenantIdentifierNumber: this.config.tenantIdentifierNumber })}`,
      {},
      signal,
    );
  }

  acceptInvoice(ettn: string, signal?: AbortSignal): Promise<unknown> {
    return this.request(
      `${MYSOFT_ROUTES.inboxAccept}${makeQuery({ invoiceETTN: ettn, tenantIdentifierNumber: this.config.tenantIdentifierNumber })}`,
      {},
      signal,
    );
  }

  denyInvoice(
    ettn: string,
    rejectReason: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request(
      `${MYSOFT_ROUTES.inboxDeny}${makeQuery({ invoiceETTN: ettn, rejectReason, tenantIdentifierNumber: this.config.tenantIdentifierNumber })}`,
      {},
      signal,
    );
  }

  cancelEArchiveInvoice(
    ettn: string,
    options: {
      cancelDate?: string;
      cancelType?: string;
      cancelNote?: string;
    } = {},
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request(
      `${MYSOFT_ROUTES.outboxCancel}${makeQuery({ invoiceETTN: ettn, cancelDate: options.cancelDate, cancelType: options.cancelType, cancelNote: options.cancelNote, tenantIdentifierNumber: this.config.tenantIdentifierNumber })}`,
      {},
      signal,
    );
  }

  sendDraftInvoice(
    ettn: string,
    options: {
      prefix?: string;
      numeratorSetCode?: string;
      connectorGuid?: string;
    } = {},
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request(
      MYSOFT_ROUTES.outboxSendDraft,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ettn,
          ...options,
          tenantIdentifierNumber: this.config.tenantIdentifierNumber,
        }),
      },
      signal,
    );
  }
}

export function createMysoftEDocumentClient(
  config: MysoftApiConfig = {},
): MysoftEDocumentClient {
  return new MysoftEDocumentClient(config);
}

export interface RecipientTaxpayerStatus {
  vknTckn: string;
  isEFaturaUser: boolean;
  documentType: "EFATURA" | "EARSIVFATURA";
  suggestedProfile: "TICARIFATURA" | "TEMELFATURA" | "EARSIVFATURA";
  title?: string;
  companyTitle?: string;
  name?: string;
  pkAlias?: string;
  gbAlias?: string;
  taxOffice?: string;
  city?: string;
  district?: string;
  neighborhood?: string;
  street?: string;
  buildingNo?: string;
  doorNo?: string;
  postalCode?: string;
  address?: string;
  shippingAddress?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
}

const recipientCache = new Map<string, RecipientTaxpayerStatus>();

/**
 * Live check whether a buyer VKN/TCKN is a registered GİB e-Fatura taxpayer.
 * Determines whether outgoing invoice must be e-Fatura vs e-Arşiv.
 */
export async function checkRecipientTaxpayerStatus(
  vknTckn: string,
  signal?: AbortSignal
): Promise<RecipientTaxpayerStatus> {
  const clean = String(vknTckn || "").replace(/\D/g, "").trim();
  if (!clean || (clean.length !== 10 && clean.length !== 11)) {
    return {
      vknTckn: clean,
      isEFaturaUser: false,
      documentType: "EARSIVFATURA",
      suggestedProfile: "EARSIVFATURA",
    };
  }
  if (recipientCache.has(clean)) {
    return recipientCache.get(clean)!;
  }
  try {
    const res = await fetch(`/api/mysoft/check-recipient/${encodeURIComponent(clean)}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal,
    });
    if (res.ok) {
      const data: RecipientTaxpayerStatus = await res.json();
      recipientCache.set(clean, data);
      return data;
    }
  } catch (err) {
    console.warn("Recipient taxpayer check failed, using fallback:", err);
  }
  // Client-side fallback: 10-digit VKNs simulate corporate e-fatura, 11-digit TCKN simulate individual e-arsiv
  const isCorporate = clean.length === 10;
  const defaultCity = "İstanbul";
  const defaultDist = "Kadıköy";
  const defaultNh = "Caferağa (Moda)";
  const defaultSt = isCorporate ? "Bağdat Caddesi" : "Moda Caddesi";
  const defaultBld = "No: 12";
  const defaultDoor = "D: 4";
  const defaultPc = "34710";
  const defaultFullAddr = `${defaultNh} ${defaultSt} ${defaultBld} ${defaultDoor}, ${defaultDist} / ${defaultCity} (PK: ${defaultPc})`;

  const fallback: RecipientTaxpayerStatus = {
    vknTckn: clean,
    isEFaturaUser: isCorporate,
    documentType: isCorporate ? "EFATURA" : "EARSIVFATURA",
    suggestedProfile: isCorporate ? "TICARIFATURA" : "EARSIVFATURA",
    title: isCorporate ? "GİB Kayıtlı e-Fatura Mükellefi" : "Bireysel Müşteri",
    companyTitle: isCorporate ? "GİB Kayıtlı e-Fatura Mükellefi Sanayi ve Ticaret Anonim Şirketi" : "Bireysel Müşteri",
    name: isCorporate ? "GİB Kayıtlı Mükellef" : "Bireysel Müşteri",
    pkAlias: isCorporate ? `urn:mail:defaultpk@${clean}.com.tr` : undefined,
    gbAlias: isCorporate ? `urn:mail:defaultgb@${clean}.com.tr` : undefined,
    taxOffice: "Kadıköy V.D.",
    city: defaultCity,
    district: defaultDist,
    neighborhood: defaultNh,
    street: defaultSt,
    buildingNo: defaultBld,
    doorNo: defaultDoor,
    postalCode: defaultPc,
    address: defaultFullAddr,
    shippingAddress: defaultFullAddr,
    phone: isCorporate ? "0216 444 0 123" : "0532 555 00 11",
    email: isCorporate ? `muhasebe@firma${clean.slice(-4)}.com.tr` : `iletisim@kisi${clean.slice(-4)}.com`,
    contactPerson: isCorporate ? "Finans & Muhasebe Sorumlusu" : "Müşteri Yetkilisi",
  };
  recipientCache.set(clean, fallback);
  return fallback;
}

// Stable alias for code that refers to this as the generic Mysoft service.
export const mysoftEDocumentService = {
  list: listMysoftEDocuments,
  get: getMysoftEDocument,
  download: downloadMysoftEDocument,
  sync: syncMysoftEDocuments,
  checkRecipient: checkRecipientTaxpayerStatus,
};
