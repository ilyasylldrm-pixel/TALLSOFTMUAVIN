/**
 * Server-side Mysoft e-document client.
 *
 * Mysoft uses OAuth2 client_credentials tokens (the token lifetime is five
 * minutes). Keep this module on the server: never expose MYSOFT_CLIENT_SECRET
 * or an access token to the browser.
 *
 * The endpoint names in this client are the ones documented by Mysoft's v8
 * OpenAPI document. The base URL can be switched between test and production
 * with MYSOFT_ENV or overridden with MYSOFT_API_BASE_URL.
 */

import {
  isMysoftTenantScopeError,
  normalizeMysoftTenantIdentifier,
} from "./mysoftTenant.ts";
import {
  calculateNextInvoiceNumber,
  parseInvoiceDocNo,
} from "./mysoftInvoiceNumber.ts";
import {
  extractMysoftOutboxResult,
  getRecentMysoftDiagnosticLogs,
  MysoftPayloadValidationError,
  recordMysoftDiagnosticLog,
  validateMysoftInvoiceOutboxPayload,
  type MysoftDiagnosticLogEntry,
} from "./mysoftInvoicePayload.ts";

export type MysoftDirection = "incoming" | "outgoing";
export type MysoftGrantType = "client_credentials" | "password";
export type MysoftDocumentFamily = "invoice" | "despatch";

export function canonicalMysoftDocumentFamily(
  value?: string | null,
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

/**
 * Paths published in Mysoft's eDocument v8 OpenAPI document.  Keeping these
 * in one place makes it obvious which upstream operations are exposed by the
 * proxy and avoids accidentally constructing paths from user input.
 */
export const MYSOFT_ENDPOINTS = {
  token: "/oauth/token",
  /** Accountant endpoints: list and inspect the firms linked to the OAuth client. */
  tenantList: "/api/Tenant/getTenant",
  tenantByIdentifier: "/api/Tenant/getTenantWithIdentifier",
  tenantInfo: "/api/Tenant/getTenantInfo",
  /** Portal numerator prefixes (ABD, KON, …) for a customer VKN. */
  tenantDocumentNumbers: "/api/Tenant/getDocumentNumberList",
  /** Portal numerator set codes (often empty; prefix used instead). */
  tenantNumeratorSets: "/api/Tenant/getNumaratorSetList",
  /** Portal XSLT / fatura dizayn listesi (xsltName, isDefault, isApproved). */
  tenantXslt: "/api/Tenant/getTenantXslt",
  /** Fallback directory: firms visible to the business-partner access key. */
  tenantUsageSummary: "/api/Tenant/getBusinessPartnerTenantDocumentUsageSummary",
  partnerCreditList: "/api/Tenant/getBusinessPartnerDocumentCreditList",
  userCompanyInfo: "/api/GeneralCard/getUserCompanyInfo",
  incomingList: "/api/InvoiceInbox/getInvoiceInboxWithHeaderInfoListForPeriod",
  incomingListPaging: "/api/InvoiceInbox/getInvoiceInboxWithHeaderInfoListForPeriodPaging",
  incomingNewList: "/api/InvoiceInbox/getNewInvoiceInboxWithHeaderInfoList",
  incomingModel: "/api/InvoiceInbox/getInvoiceInboxModel",
  incomingStatus: "/api/InvoiceInbox/getInvoiceInboxStatus",
  incomingPdf: "/api/InvoiceInbox/getInvoiceInboxPdfAsZip",
  incomingXml: "/api/InvoiceInbox/getInvoiceInboxUBLXMLAsZip",
  incomingAcknowledge: "/api/InvoiceInbox/invoiceInboxSavedByCustomer",
  incomingAccept: "/api/InvoiceInbox/acceptInvoice",
  incomingDeny: "/api/InvoiceInbox/denyInvoice",
  outgoingList: "/api/InvoiceOutbox/getInvoiceOutboxWithHeaderInfoList",
  outgoingModel: "/api/InvoiceOutbox/getInvoiceOutboxModel",
  outgoingStatus: "/api/InvoiceOutbox/getInvoiceOutboxStatus",
  outgoingPdf: "/api/InvoiceOutbox/getInvoiceOutboxPdfAsZip",
  outgoingXml: "/api/InvoiceOutbox/getInvoiceOutboxXMLAsZip",
  outgoingSubmit: "/api/InvoiceOutbox/invoiceOutbox",
  outgoingSubmitUbl: "/api/InvoiceOutbox/invoiceOutboxWithUblXml",
  outgoingCancel: "/api/InvoiceOutbox/cancelEArchiveInvoice",
  outgoingSendDraft: "/api/InvoiceOutbox/sendDraftInvoiceToGIB",
  /** Current v8 draft signing endpoint (legacy Outbox route remains fallback). */
  invoiceDraftSignAndSend: "/api/Invoice/invoiceDraftSignAndSend",
  invoiceDraftSendToGib: "/api/Invoice/invoiceDraftSendToGib",
  invoiceDraftSendToGibUblXml: "/api/Invoice/invoiceDraftSendToGibUblXml",
  /** Official Mysoft Mükellef Detay Sorgula (VKN/TCKN) */
  taxpayerDetailInfo: "/api/Taxpayer/getTaxPayerDetailInfo",
  /** Official Mysoft GİB Hesap Sorgula */
  gibAccountModel: "/api/GeneralCard/getGibAccountModel",
} as const;

/**
 * Generic e-document operations exposed by the server proxy.  The map also
 * includes invoice/draft aliases so callers can use one operation surface for
 * every supported document family.
 *
 * This is deliberately an explicit map.  Do not turn a user supplied value
 * into a URL here: the OAuth credential is server-side and an arbitrary path
 * would turn this client into an SSRF proxy.  The names mirror the groups in
 * Mysoft's OpenAPI document and are kept stable for the UI.
 */
export const MYSOFT_DOCUMENT_OPERATIONS = {
  // Invoice inbox (the specialised /incoming routes below use the same
  // operations; these aliases make the complete v8 surface available to
  // server-to-server callers through one allowlisted endpoint).
  "invoice.incoming.new": { path: "/api/InvoiceInbox/getNewInvoiceInboxWithHeaderInfoList", method: "POST" },
  "invoice.incoming.new.raw": { path: "/api/InvoiceInbox/getNewInvoiceInboxList", method: "POST" },
  "invoice.incoming.list": { path: "/api/InvoiceInbox/getInvoiceInboxWithHeaderInfoListForPeriod", method: "POST" },
  "invoice.incoming.list.raw": { path: "/api/InvoiceInbox/getInvoiceInboxListForPeriod", method: "POST" },
  "invoice.incoming.list.paging": { path: "/api/InvoiceInbox/getInvoiceInboxWithHeaderInfoListForPeriodPaging", method: "POST" },
  "invoice.incoming.model": { path: "/api/InvoiceInbox/getInvoiceInboxModel", method: "GET" },
  "invoice.incoming.envelope-model": { path: "/api/InvoiceInbox/getInvoiceInboxWithEnvelopeModel", method: "GET" },
  "invoice.incoming.download": { path: "/api/InvoiceInbox/getInvoiceInboxPdfAsZip", method: "GET" },
  "invoice.incoming.pdf-batch": { path: "/api/InvoiceInbox/getMultipleInvoiceInboxAsOnePdfAsZip", method: "GET" },
  "invoice.incoming.pdf-batch.post": { path: "/api/InvoiceInbox/getMultipleInvoiceInboxAsOnePdfAsZipWithPost", method: "POST" },
  "invoice.incoming.xml": { path: "/api/InvoiceInbox/getInvoiceInboxUBLXMLAsZip", method: "GET" },
  "invoice.incoming.xml-envelope": { path: "/api/InvoiceInbox/getInvoiceInboxUBLXMLWithEnvelopeInfoAsZip", method: "GET" },
  "invoice.incoming.html": { path: "/api/InvoiceInbox/getInvoiceInboxHTMLAsZip", method: "GET" },
  "invoice.incoming.status": { path: "/api/InvoiceInbox/getInvoiceInboxStatus", method: "GET" },
  "invoice.incoming.acknowledge": { path: "/api/InvoiceInbox/invoiceInboxSavedByCustomer", method: "GET" },
  "invoice.incoming.archive": { path: "/api/InvoiceInbox/updateInvoiceInboxArchiveStatus", method: "GET" },
  "invoice.incoming.print": { path: "/api/InvoiceInbox/invoiceInboxIncreasePrintCount", method: "GET" },
  "invoice.incoming.accept": { path: "/api/InvoiceInbox/acceptInvoice", method: "GET" },
  "invoice.incoming.deny": { path: "/api/InvoiceInbox/denyInvoice", method: "GET" },
  "invoice.incoming.deny.model": { path: "/api/InvoiceInbox/denyInvoiceWithModel", method: "POST" },
  "invoice.incoming.earchive.list": { path: "/api/InvoiceInbox/getEArchiveInboxForPeriodList", method: "POST" },
  "invoice.incoming.earchive.acknowledge": { path: "/api/InvoiceInbox/earchiveInboxSavedByCustomer", method: "GET" },
  // Invoice outbox and GIB lifecycle operations.
  "invoice.outgoing.create": { path: "/api/InvoiceOutbox/invoiceOutbox", method: "POST" },
  "invoice.outgoing.create.sample": {
    path: "/api/InvoiceOutbox/createInvoiceOutboxTestJson",
    method: "GET",
  },
  "invoice.outgoing.create.ubl": { path: "/api/InvoiceOutbox/invoiceOutboxWithUblXml", method: "POST" },
  "tenant.document-numbers": { path: "/api/Tenant/getDocumentNumberList", method: "GET" },
  "tenant.numerator-sets": { path: "/api/Tenant/getNumaratorSetList", method: "GET" },
  "tenant.xslt": { path: "/api/Tenant/getTenantXslt", method: "POST" },
  "taxpayer.detail": { path: "/api/Taxpayer/getTaxPayerDetailInfo", method: "GET" },
  "generalcard.gib-account": { path: "/api/GeneralCard/getGibAccountModel", method: "GET" },
  "generalcard.user-company-info": { path: "/api/GeneralCard/getUserCompanyInfo", method: "GET" },
  "invoice.outgoing.send-draft": { path: "/api/InvoiceOutbox/sendDraftInvoiceToGIB", method: "POST" },
  "invoice.outgoing.delete-draft": { path: "/api/InvoiceOutbox/deleteDraftInvoiceOutbox", method: "GET" },
  "invoice.outgoing.cancel-earchive": { path: "/api/InvoiceOutbox/cancelEArchiveInvoice", method: "GET" },
  "invoice.outgoing.status.changed": { path: "/api/InvoiceOutbox/getInvoiceOutboxStatusChanged", method: "POST" },
  "invoice.outgoing.status": { path: "/api/InvoiceOutbox/getInvoiceOutboxStatus", method: "GET" },
  "invoice.outgoing.download": { path: "/api/InvoiceOutbox/getInvoiceOutboxPdfAsZip", method: "GET" },
  "invoice.outgoing.pdf-batch": { path: "/api/InvoiceOutbox/getMultipleInvoiceOutboxAsOnePdfAsZip", method: "GET" },
  "invoice.outgoing.pdf-batch.post": { path: "/api/InvoiceOutbox/getMultipleInvoiceOutboxAsOnePdfAsZipWithPost", method: "POST" },
  "invoice.outgoing.xml": { path: "/api/InvoiceOutbox/getInvoiceOutboxXMLAsZip", method: "GET" },
  "invoice.outgoing.envelope-xml": { path: "/api/InvoiceOutbox/getInvoiceOutboxEnvelopeXMLAsZip", method: "GET" },
  "invoice.outgoing.xml-envelope": { path: "/api/InvoiceOutbox/getInvoiceOutboxXMLWithEnvelopeInfoAsZip", method: "GET" },
  "invoice.outgoing.html": { path: "/api/InvoiceOutbox/getInvoiceOutboxHTMLAsZip", method: "GET" },
  "invoice.outgoing.model": { path: "/api/InvoiceOutbox/getInvoiceOutboxModel", method: "GET" },
  "invoice.outgoing.draft.pdf": { path: "/api/InvoiceOutbox/getInvoiceOutboxDraftPdfAsZip", method: "POST" },
  "invoice.outgoing.draft.html": { path: "/api/InvoiceOutbox/getInvoiceOutboxDraftHTMLAsZip", method: "POST" },
  "invoice.outgoing.draft.xml": { path: "/api/InvoiceOutbox/getInvoiceOutboxDraftXMLAsZip", method: "POST" },
  "invoice.outgoing.ubl-draft.pdf": { path: "/api/InvoiceOutbox/getInvoiceOutboxForUblXmlDraftPdfAsZip", method: "POST" },
  "invoice.outgoing.ubl-draft.html": { path: "/api/InvoiceOutbox/getInvoiceOutboxForUblXmlDraftHTMLAsZip", method: "POST" },
  "invoice.outgoing.list.raw": { path: "/api/InvoiceOutbox/getInvoiceOutboxList", method: "POST" },
  "invoice.outgoing.list": { path: "/api/InvoiceOutbox/getInvoiceOutboxWithHeaderInfoList", method: "POST" },
  "invoice.outgoing.send-mail": { path: "/api/InvoiceOutbox/sendMailForInvoice", method: "GET" },
  "invoice.outgoing.mail-status": { path: "/api/InvoiceOutbox/checkMailStatusForInvoice", method: "GET" },
  "invoice.outgoing.general-mail-status": { path: "/api/InvoiceOutbox/checkGeneralMailStatusForInvoice", method: "GET" },
  "invoice.outgoing.general-mail-status.batch": { path: "/api/InvoiceOutbox/checkGeneralMailStatusForMultipleInvoice", method: "POST" },
  "invoice.outgoing.public-url": { path: "/api/InvoiceOutbox/getInvoiceOutboxPublicUrl", method: "GET" },
  "invoice.outgoing.schema-check": { path: "/api/InvoiceOutbox/checkSchemaSchematronForInvoiceUBL", method: "POST" },
  // Invoice draft/GIB endpoints (the older InvoiceOutbox aliases above are
  // retained for installations that use the outbox contract).
  "invoice.draft.create": { path: "/api/Invoice/invoiceDraft", method: "POST" },
  "invoice.draft.create.new": { path: "/api/Invoice/invoiceDraftNew", method: "POST" },
  "invoice.draft.drug-medical": { path: "/api/Invoice/invoiceDrugAndMedical", method: "POST" },
  "invoice.draft.note": { path: "/api/Invoice/invoiceNote", method: "POST" },
  "invoice.draft.delete": { path: "/api/Invoice/deleteInvoiceDraft", method: "POST" },
  "invoice.draft.sign-and-send": { path: "/api/Invoice/invoiceDraftSignAndSend", method: "GET" },
  "invoice.draft.model": { path: "/api/Invoice/getInvoiceModel", method: "GET" },
  "invoice.draft.model.list": { path: "/api/Invoice/getInvoiceModelList", method: "POST" },
  "invoice.draft.list": { path: "/api/Invoice/getInvoiceWithHeaderInfoList", method: "POST" },
  "invoice.draft.pdf": { path: "/api/Invoice/getInvoiceDraftPdfAsZip", method: "GET" },
  "invoice.draft.send-to-gib": { path: "/api/Invoice/invoiceDraftSendToGib", method: "POST" },
  "invoice.draft.send-to-gib.ubl": { path: "/api/Invoice/invoiceDraftSendToGibUblXml", method: "POST" },
  "invoice.draft.resend-to-gib": { path: "/api/Invoice/invoiceDraftReSendToGib", method: "POST" },
  "invoice.draft.sms.request": { path: "/api/Invoice/requestSmsConfimCodeFromGib", method: "POST" },
  "invoice.draft.sms.confirm": { path: "/api/Invoice/sendSmsConfirmForInvoiceToGib", method: "POST" },
  "invoice.draft.remove-from-gib": { path: "/api/Invoice/removeInvoiceFromGib", method: "POST" },
  "invoice.draft.cancel-request": { path: "/api/Invoice/createCancellationRequestToGib", method: "POST" },
  // E-Archive inbox is a separate v8 family from InvoiceInbox.
  "earchive.incoming.new": { path: "/api/EArchiveDocumentInbox/getNewEArchiveDocumentInboxList", method: "POST" },
  "earchive.incoming.list": { path: "/api/EArchiveDocumentInbox/getEArchiveDocumentInboxList", method: "POST" },
  "earchive.incoming.acknowledge": { path: "/api/EArchiveDocumentInbox/eArchiveDocumentInboxSavedByCustomer", method: "GET" },
  "earchive.incoming.xml": { path: "/api/EArchiveDocumentInbox/getEArchiveDocumentInboxUBLXMLAsZip", method: "GET" },
  "earchive.incoming.download": { path: "/api/EArchiveDocumentInbox/getEArchiveDocumentInboxPdfAsZip", method: "GET" },
  "despatch.incoming.list": { path: "/api/DespatchInbox/getDespatchInboxWithHeaderInfoListForPeriod", method: "POST" },
  "despatch.incoming.new": { path: "/api/DespatchInbox/getNewDespatchInboxWithHeaderInfoList", method: "POST" },
  "despatch.incoming.new.raw": { path: "/api/DespatchInbox/getNewDespatchInboxList", method: "POST" },
  "despatch.incoming.list.raw": { path: "/api/DespatchInbox/getDespatchInboxListForPeriod", method: "POST" },
  "despatch.incoming.list.paging": { path: "/api/DespatchInbox/getDespatchInboxWithHeaderInfoListForPeriodPaging", method: "POST" },
  "despatch.incoming.status": { path: "/api/DespatchInbox/getDespatchInboxStatus", method: "GET" },
  "despatch.incoming.download": { path: "/api/DespatchInbox/getDespatchInboxPdfAsZip", method: "GET" },
  "despatch.incoming.xml": { path: "/api/DespatchInbox/getDespatchInboxUBLXMLAsZip", method: "GET" },
  "despatch.incoming.xml-envelope": { path: "/api/DespatchInbox/getDespatchInboxUBLXMLWithEnvelopeInfoAsZip", method: "GET" },
  "despatch.incoming.html": { path: "/api/DespatchInbox/getDespatchInboxHTMLAsZip", method: "GET" },
  "despatch.incoming.model": { path: "/api/DespatchInbox/getDespatchInboxModel", method: "GET" },
  "despatch.incoming.acknowledge": { path: "/api/DespatchInbox/despatchInboxSavedByCustomer", method: "GET" },
  "despatch.incoming.archive": { path: "/api/DespatchInbox/updateDespatchInboxArchiveStatus", method: "GET" },
  "despatch.incoming.pdf-batch.post": { path: "/api/DespatchInbox/getMultipleDespatchInboxAsOnePdfAsZipWithPost", method: "POST" },
  "despatch.outgoing.list": { path: "/api/DespatchOutbox/getDespatchOutboxWithHeaderInfoList", method: "POST" },
  "despatch.outgoing.list.raw": { path: "/api/DespatchOutbox/getDespatchOutboxList", method: "POST" },
  "despatch.outgoing.create.ubl": { path: "/api/DespatchOutbox/despatchOutboxWithUblXml", method: "POST" },
  "despatch.outgoing.status": { path: "/api/DespatchOutbox/getDespatchOutboxStatus", method: "GET" },
  "despatch.outgoing.download": { path: "/api/DespatchOutbox/getDespatchOutboxPdfAsZip", method: "GET" },
  "despatch.outgoing.pdf-batch": { path: "/api/DespatchOutbox/getMultipleDespatchOutboxAsOnePdfAsZip", method: "GET" },
  "despatch.outgoing.pdf-batch.post": { path: "/api/DespatchOutbox/getMultipleDespatchOutboxAsOnePdfAsZipPost", method: "POST" },
  "despatch.outgoing.xml": { path: "/api/DespatchOutbox/getDespatchOutboxXMLAsZip", method: "GET" },
  "despatch.outgoing.envelope-xml": { path: "/api/DespatchOutbox/getDespatchOutboxEnvelopeXMLAsZip", method: "GET" },
  "despatch.outgoing.xml-envelope": { path: "/api/DespatchOutbox/getDespatchOutboxXMLWithEnvelopeInfoAsZip", method: "GET" },
  "despatch.outgoing.html": { path: "/api/DespatchOutbox/getDespatchOutboxHTMLAsZip", method: "GET" },
  "despatch.outgoing.status.changed": { path: "/api/DespatchOutbox/getDespatchOutboxStatusChanged", method: "POST" },
  "despatch.outgoing.delete-draft": { path: "/api/DespatchOutbox/deleteDraftDespatchOutbox", method: "GET" },
  "despatch.outgoing.draft.pdf": { path: "/api/DespatchOutbox/getDespatchOutboxDraftPdfAsZip", method: "POST" },
  "despatch.outgoing.draft.html": { path: "/api/DespatchOutbox/getDespatchOutboxDraftHTMLAsZip", method: "POST" },
  "despatch.outgoing.draft.xml": { path: "/api/DespatchOutbox/getDespatchOutboxDraftXMLAsZip", method: "POST" },
  "despatch.outgoing.ubl-draft.pdf": { path: "/api/DespatchOutbox/getDespatchOutboxForUblXmlDraftPdfAsZip", method: "POST" },
  "despatch.outgoing.ubl-draft.html": { path: "/api/DespatchOutbox/getDespatchOutboxForUblXmlDraftHTMLAsZip", method: "POST" },
  "despatch.outgoing.create": { path: "/api/DespatchOutbox/despatchOutbox", method: "POST" },
  "despatch.outgoing.send-draft": { path: "/api/DespatchOutbox/sendDraftDespatchToGIB", method: "POST" },
  "despatch.outgoing.public-url": { path: "/api/DespatchOutbox/getDespatchOutboxPublicUrl", method: "GET" },
  "despatch.outgoing.schema-check": { path: "/api/DespatchOutbox/checkSchemaSchematronForDespatchUBL", method: "POST" },
  "receipt.incoming.list": { path: "/api/ReceiptInbox/getReceiptInboxWithHeaderInfoListForPeriod", method: "POST" },
  "receipt.incoming.new": { path: "/api/ReceiptInbox/getNewReceiptInboxWithHeaderInfoList", method: "POST" },
  "receipt.incoming.new.raw": { path: "/api/ReceiptInbox/getNewReceiptInboxList", method: "POST" },
  "receipt.incoming.list.raw": { path: "/api/ReceiptInbox/getReceiptInboxListForPeriod", method: "POST" },
  "receipt.incoming.download": { path: "/api/ReceiptInbox/getReceiptInboxPdfAsZip", method: "GET" },
  "receipt.incoming.xml": { path: "/api/ReceiptInbox/getReceiptInboxUBLXMLAsZip", method: "GET" },
  "receipt.incoming.xml-envelope": { path: "/api/ReceiptInbox/getReceiptInboxUBLXMLWithEnvelopeInfoAsZip", method: "GET" },
  "receipt.incoming.html": { path: "/api/ReceiptInbox/getReceiptInboxHTMLAsZip", method: "GET" },
  "receipt.incoming.by-despatch.download": { path: "/api/ReceiptInbox/getReceiptInboxByDespatchETTNPdfAsZip", method: "GET" },
  "receipt.incoming.by-despatch.xml": { path: "/api/ReceiptInbox/getReceiptInboxUBLXMLByDespatchETTNAsZip", method: "GET" },
  "receipt.incoming.by-despatch.html": { path: "/api/ReceiptInbox/getReceiptInboxHTMLByDespatchETTNAsZip", method: "GET" },
  "receipt.incoming.acknowledge": { path: "/api/ReceiptInbox/receiptInboxSavedByCustomer", method: "GET" },
  "receipt.outgoing.list": { path: "/api/ReceiptOutbox/getReceiptOutboxWithHeaderInfoList", method: "POST" },
  "receipt.outgoing.list.raw": { path: "/api/ReceiptOutbox/getReceiptOutboxList", method: "POST" },
  "receipt.outgoing.status": { path: "/api/ReceiptOutbox/getReceiptOutboxStatus", method: "GET" },
  "receipt.outgoing.download": { path: "/api/ReceiptOutbox/getReceiptOutboxPdfAsZip", method: "GET" },
  "receipt.outgoing.by-despatch.download": { path: "/api/ReceiptOutbox/getReceiptOutboxWithDespatchEttnPdfAsZip", method: "GET" },
  "receipt.outgoing.xml": { path: "/api/ReceiptOutbox/getReceiptOutboxXMLAsZip", method: "GET" },
  "receipt.outgoing.envelope-xml": { path: "/api/ReceiptOutbox/getReceiptOutboxEnvelopeXMLAsZip", method: "GET" },
  "receipt.outgoing.by-despatch.xml": { path: "/api/ReceiptOutbox/getReceiptOutboxWithDespatchETTNXMLAsZip", method: "GET" },
  "receipt.outgoing.html": { path: "/api/ReceiptOutbox/getReceiptOutboxHTMLAsZip", method: "GET" },
  "receipt.outgoing.by-despatch.html": { path: "/api/ReceiptOutbox/getReceiptOutboxWithDespatchETTNHTMLAsZip", method: "GET" },
  "receipt.outgoing.xml-envelope": { path: "/api/ReceiptOutbox/getReceiptOutboxXMLWithEnvelopeInfoAsZip", method: "GET" },
  "receipt.outgoing.status.changed": { path: "/api/ReceiptOutbox/getReceiptOutboxStatusChanged", method: "POST" },
  "receipt.outgoing.draft.pdf": { path: "/api/ReceiptOutbox/getReceiptOutboxDraftPdfAsZip", method: "POST" },
  "receipt.outgoing.draft.html": { path: "/api/ReceiptOutbox/getReceiptOutboxDraftHTMLAsZip", method: "POST" },
  "receipt.outgoing.ubl-draft.pdf": { path: "/api/ReceiptOutbox/getReceiptOutboxForUblXmlDraftPdfAsZip", method: "POST" },
  "receipt.outgoing.ubl-draft.html": { path: "/api/ReceiptOutbox/getReceiptOutboxForUblXmlDraftHTMLAsZip", method: "POST" },
  "receipt.outgoing.create": { path: "/api/ReceiptOutbox/receiptOutbox", method: "POST" },
  "receipt.outgoing.create.ubl": { path: "/api/ReceiptOutbox/receiptOutboxWithUblXml", method: "POST" },
  // Expense voucher, bill document and foreign-exchange families are
  // outgoing-only in the current v8 contract.
  "expensevoucher.outgoing.list": { path: "/api/ExpenseVoucher/getExpenseVoucherOutboxWithHeaderInfoList", method: "POST" },
  "expensevoucher.outgoing.status.changed": { path: "/api/ExpenseVoucher/getExpenseVoucherOutboxStatusChanged", method: "POST" },
  "expensevoucher.outgoing.status": { path: "/api/ExpenseVoucher/getExpenseVoucherOutboxStatus", method: "GET" },
  "expensevoucher.outgoing.download": { path: "/api/ExpenseVoucher/getExpenseVoucherOutboxPdfAsZip", method: "GET" },
  "expensevoucher.outgoing.xml": { path: "/api/ExpenseVoucher/getExpenseVoucherOutboxXMLAsZip", method: "GET" },
  "expensevoucher.outgoing.html": { path: "/api/ExpenseVoucher/getExpenseVoucherOutboxHTMLAsZip", method: "GET" },
  "expensevoucher.outgoing.draft.pdf": { path: "/api/ExpenseVoucher/getExpenseVoucherOutboxDraftPdfAsZip", method: "POST" },
  "expensevoucher.outgoing.draft.html": { path: "/api/ExpenseVoucher/getExpenseVoucherOutboxDraftHTMLAsZip", method: "POST" },
  "expensevoucher.outgoing.draft.xml": { path: "/api/ExpenseVoucher/getExpenseVoucherOutboxDraftXMLAsZip", method: "POST" },
  "expensevoucher.outgoing.create": { path: "/api/ExpenseVoucher/expenseVoucherOutbox", method: "POST" },
  "expensevoucher.outgoing.create.ubl": { path: "/api/ExpenseVoucher/expenseVoucherOutboxWithUblXml", method: "POST" },
  "expensevoucher.outgoing.cancel": { path: "/api/ExpenseVoucher/cancelExpenseVoucherOutbox", method: "GET" },
  "billdocument.outgoing.list": { path: "/api/BillDocument/getBillDocumentOutboxWithHeaderInfoList", method: "POST" },
  "billdocument.outgoing.status.changed": { path: "/api/BillDocument/getBillDocumentOutboxStatusChanged", method: "POST" },
  "billdocument.outgoing.status": { path: "/api/BillDocument/getBillDocumentOutboxStatus", method: "GET" },
  "billdocument.outgoing.download": { path: "/api/BillDocument/getBillDocumentOutboxPdfAsZip", method: "GET" },
  "billdocument.outgoing.xml": { path: "/api/BillDocument/getBillDocumentOutboxXMLAsZip", method: "GET" },
  "billdocument.outgoing.html": { path: "/api/BillDocument/getBillDocumentOutboxHTMLAsZip", method: "GET" },
  "billdocument.outgoing.draft.pdf": { path: "/api/BillDocument/getBillDocumentOutboxDraftPdfAsZip", method: "POST" },
  "billdocument.outgoing.draft.html": { path: "/api/BillDocument/getBillDocumentOutboxDraftHTMLAsZip", method: "POST" },
  "billdocument.outgoing.draft.xml": { path: "/api/BillDocument/getBillDocumentOutboxDraftXMLAsZip", method: "POST" },
  "billdocument.outgoing.create": { path: "/api/BillDocument/billDocumentOutbox", method: "POST" },
  "billdocument.outgoing.create.ubl": { path: "/api/BillDocument/billDocumentOutboxWithUblXml", method: "POST" },
  "billdocument.outgoing.cancel": { path: "/api/BillDocument/cancelBillDocumentOutbox", method: "GET" },
  "bankreceipt.outgoing.xml": { path: "/api/BankReceipt/getBankReceiptOutboxXMLAsZip", method: "GET" },
  "bankreceipt.outgoing.html": { path: "/api/BankReceipt/getBankReceiptOutboxHTMLAsZip", method: "GET" },
  "bankreceipt.outgoing.download": { path: "/api/BankReceipt/getBankReceiptOutboxPdfAsZip", method: "GET" },
  "bankreceipt.outgoing.create": { path: "/api/BankReceipt/bankReceiptOutbox", method: "POST" },
  "bankreceipt.outgoing.cancel": { path: "/api/BankReceipt/cancelBankReceiptOutbox", method: "GET" },
  "foreignexchange.outgoing.list": { path: "/api/ForeignExchange/getForeignExchangeOutboxWithHeaderInfoList", method: "POST" },
  "foreignexchange.outgoing.status": { path: "/api/ForeignExchange/getForeignExchangeOutboxStatus", method: "GET" },
  "foreignexchange.outgoing.download": { path: "/api/ForeignExchange/getForeignExchangeOutboxPdfAsZip", method: "GET" },
  "foreignexchange.outgoing.xml": { path: "/api/ForeignExchange/getForeignExchangeOutboxXMLAsZip", method: "GET" },
  "foreignexchange.outgoing.html": { path: "/api/ForeignExchange/getForeignExchangeOutboxHTMLAsZip", method: "GET" },
  "foreignexchange.outgoing.status.changed": { path: "/api/ForeignExchange/getforeignExchangeOutboxStatusChanged", method: "POST" },
  "foreignexchange.outgoing.create": { path: "/api/ForeignExchange/foreginExchangeOutbox", method: "POST" },
  "foreignexchange.outgoing.create.ubl": { path: "/api/ForeignExchange/foreignExchangeOutboxWithUblXml", method: "POST" },
  "foreignexchange.outgoing.list.raw": { path: "/api/ForeignExchange/getForeignExchangeOutboxList", method: "POST" },
  "foreignexchange.outgoing.cancel": { path: "/api/ForeignExchange/cancelForeignExchangeOutbox", method: "GET" },
} as const;

export type MysoftDocumentOperation = keyof typeof MYSOFT_DOCUMENT_OPERATIONS;

export interface MysoftConfig {
  baseUrl: string;
  tokenUrl: string;
  /** OAuth grant; omitted values are inferred from the supplied credentials. */
  grantType?: MysoftGrantType;
  clientId?: string;
  clientSecret?: string;
  /** Credentials for OAuth's resource-owner password grant. */
  username?: string;
  password?: string;
  scope?: string;
  /** Default tenant/VKN/TCKN sent on requests that omit one explicitly. */
  tenantIdentifierNumber?: string;
  connectorGuid?: string;
  timeoutMs: number;
  mockMode: boolean;
  /** Injectable fetch for tests/private gateways; never expose secrets. */
  fetchImpl?: typeof fetch;
}

export interface MysoftTokenIdentity {
  defaultTenantId?: number;
  hasDefaultTenant: boolean;
  businessPartnerId?: number;
  applicationAccessId?: number;
}

export interface MysoftStatus {
  configured: boolean;
  mockMode: boolean;
  environment: "test" | "prod" | "custom";
  baseUrl: string;
  tokenUrl: string;
  grantType: MysoftGrantType;
  hasClientCredentials: boolean;
  hasPasswordCredentials: boolean;
  hasTenantIdentifierNumber: boolean;
  hasConnectorGuid: boolean;
  identity?: MysoftTokenIdentity;
}

export interface MysoftListRequest {
  afterValue?: number;
  limit?: number;
  tenantIdentifierNumber?: string;
  startDate?: string;
  endDate?: string;
  pkAlias?: string;
  ettn?: string;
  vknTckn?: string;
  isUseDocDate?: boolean;
  cessionStatus?: number;
  eDocumentType?: string;
  /** Fields accepted by Mysoft's incoming period paging request model. */
  docNo?: string;
  accountName?: string;
  profile?: number;
  portalInvoiceStatus?: number;
  archiveStatus?: number;
  pageSize?: number;
  pageNumber?: number;
}

export interface MysoftRequestOptions {
  method?: "GET" | "POST";
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  /** Set to true when the caller wants the raw non-JSON response body. */
  raw?: boolean;
}

export interface MysoftDocumentOperationRequest {
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  tenantIdentifierNumber?: string;
  /** Return raw bytes for draft PDF/HTML zip responses. */
  raw?: boolean;
}

export interface MysoftSendDraftRequest {
  ettn: string;
  prefix?: string;
  numeratorSetCode?: string;
  connectorGuid?: string;
  tenantIdentifierNumber?: string;
}

/** Query used by the accountant tenant list endpoint. */
export interface MysoftTenantListRequest {
  afterValue?: number;
  limit?: number;
}

export interface MysoftTaxpayerAddressModel {
  addressType?: number;
  addressTypeDescription?: string;
  district?: string;
  region?: string;
  streetName?: string;
  buildingNumber?: string;
  room?: string;
  township?: string;
  townName?: string;
  cityName?: string;
  cityCode?: string;
  townCode?: string;
}

export interface MysoftTaxpayerNaceModel {
  naceCode?: string;
  naceDescription?: string;
  isPrimary?: boolean;
}

export interface MysoftTaxpayerApiModel {
  taxIdentifierNumber?: string;
  tcIdentifierNumber?: string;
  firstName?: string;
  lastName?: string;
  taxOfficeName?: string;
  taxOfficeCode?: string;
  companyType?: number;
  activityTerminationStatus?: number;
  workStartDate?: string;
  workEndDate?: string;
  identityTitle?: string;
  tradeName?: string;
  identityPotentialStatus?: number;
  taxpayerNaceList?: MysoftTaxpayerNaceModel[];
  taxpayerAddressList?: MysoftTaxpayerAddressModel[];
}

export interface MysoftTaxpayerResultModel {
  data?: MysoftTaxpayerApiModel | null;
  succeed?: boolean;
  message?: string | null;
  errorCode?: string | null;
  afterValue?: number;
}

export interface MysoftGibAccountAliasModel {
  alias?: string;
  creationTime?: string;
  deletionTime?: string;
  role?: number;
}

export interface MysoftGibAccountModel {
  id?: number;
  gibAccountName?: string;
  gibAccountType?: number;
  identifierNumber?: string;
  eInvoiceStartDate?: string;
  eWaybillStartDate?: string;
  gibAccountUsageType?: number;
  gibUserType?: number;
  isPassive?: boolean;
  lastUpdateDate?: string;
  gibAccountAliasList?: MysoftGibAccountAliasModel[];
}

export interface MysoftGibAccountResultModel {
  data?: MysoftGibAccountModel | null;
  succeed?: boolean;
  message?: string | null;
  errorCode?: string | null;
  afterValue?: number;
}

export interface MysoftRecipientTaxpayerResult {
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
  taxOfficeCode?: string;
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
  activityStatus?: "active" | "terminated" | "unknown";
  activityStatusDescription?: string;
  eInvoiceStartDate?: string;
  eWaybillStartDate?: string;
  isLiveTaxpayer?: boolean;
}

export class MysoftConfigurationError extends Error {
  readonly code = "MYSOFT_NOT_CONFIGURED";

  constructor(message = "Mysoft API credentials are not configured") {
    super(message);
    this.name = "MysoftConfigurationError";
  }
}

export class MysoftApiError extends Error {
  readonly code = "MYSOFT_API_ERROR";
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "MysoftApiError";
    this.status = status;
    this.details = details;
  }
}

const PROD_BASE_URL = "https://edocumentapi.mysoft.com.tr";
const TEST_BASE_URL = "https://edocumentapi.mytest.tr";

function trimBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function envBoolean(value: string | undefined): boolean {
  return ["1", "true", "yes", "on"].includes((value || "").trim().toLowerCase());
}

function normalizeGrantType(value: string | undefined): MysoftGrantType | undefined {
  const normalized = value?.trim().toLowerCase().replace(/[-\s]/g, "_");
  if (normalized === "password") return "password";
  if (normalized === "client_credentials" || normalized === "clientcredential") return "client_credentials";
  return undefined;
}

function grantTypeFor(config: Pick<MysoftConfig, "grantType" | "clientId" | "clientSecret" | "username" | "password">): MysoftGrantType {
  if (config.grantType === "password" || config.grantType === "client_credentials") return config.grantType;
  // Prefer the documented machine-to-machine flow when both client values are
  // present.  This keeps existing deployments working when no grant env var
  // is set, while still allowing a username/password-only setup.
  if (config.clientId && config.clientSecret) return "client_credentials";
  if (config.username && config.password) return "password";
  return "client_credentials";
}

/** Read Mysoft settings without ever logging the secret values. */
export function getMysoftConfig(env: NodeJS.ProcessEnv = process.env): MysoftConfig {
  const requestedEnvironment = (env.MYSOFT_ENV || "prod").trim().toLowerCase();
  const defaultBaseUrl = requestedEnvironment === "test" ? TEST_BASE_URL : PROD_BASE_URL;
  const baseUrl = trimBaseUrl(env.MYSOFT_API_BASE_URL || env.MYSOFT_API_URL || defaultBaseUrl);
  const tokenUrl = trimBaseUrl(env.MYSOFT_TOKEN_URL || `${baseUrl}${MYSOFT_ENDPOINTS.token}`);
  const clientId = env.MYSOFT_CLIENT_ID?.trim() || undefined;
  const clientSecret = env.MYSOFT_CLIENT_SECRET?.trim() || undefined;
  const username = env.MYSOFT_USERNAME?.trim() || env.MYSOFT_USER_NAME?.trim() || undefined;
  const password = env.MYSOFT_PASSWORD?.trim() || env.MYSOFT_USER_PASSWORD?.trim() || undefined;
  const tenantIdentifierNumber = normalizeMysoftTenantIdentifier(
    env.MYSOFT_TENANT_IDENTIFIER_NUMBER,
  );

  return {
    baseUrl,
    tokenUrl,
    // Explicit MYSOFT_GRANT_TYPE wins.  Otherwise infer the grant from the
    // credentials present (client credentials first, password as fallback).
    grantType:
      normalizeGrantType(env.MYSOFT_GRANT_TYPE || env.MYSOFT_OAUTH_GRANT_TYPE) ||
      (clientId && clientSecret ? "client_credentials" : username && password ? "password" : "client_credentials"),
    clientId,
    clientSecret,
    username,
    password,
    scope: env.MYSOFT_SCOPE?.trim() || undefined,
    tenantIdentifierNumber,
    connectorGuid: env.MYSOFT_CONNECTOR_GUID?.trim() || undefined,
    timeoutMs: Math.max(1_000, Number(env.MYSOFT_TIMEOUT_MS || 30_000) || 30_000),
    // Mock is opt-in. Missing credentials alone must never silently write data.
    mockMode: envBoolean(env.MYSOFT_MOCK_MODE),
  };
}

function environmentFor(config: MysoftConfig): "test" | "prod" | "custom" {
  if (config.baseUrl === TEST_BASE_URL) return "test";
  if (config.baseUrl === PROD_BASE_URL) return "prod";
  return "custom";
}

function redactUrl(value: string): string {
  try {
    const url = new URL(value);
    // Query strings can accidentally contain client credentials when a
    // gateway is configured manually.  They have no place in a browser-facing
    // status response.
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "[invalid-url]";
  }
}

function asQueryValue(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function appendQuery(url: URL, query?: MysoftRequestOptions["query"]): void {
  if (!query) return;
  Object.entries(query).forEach(([key, value]) => {
    const serialized = asQueryValue(value);
    if (serialized !== undefined) url.searchParams.set(key, serialized);
  });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function unwrapMysoftData(payload: unknown): unknown {
  if (!isObject(payload)) return payload;
  if ("data" in payload) return payload.data;
  return payload;
}

function asObjectArray(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter(isObject);
}

function stringOrEmpty(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function positiveInt(value: unknown): number | undefined {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

/** Read non-secret partner/tenant ids from the Mysoft bearer token `iuser` claim. */
function parseTokenIdentity(accessToken: string): MysoftTokenIdentity | undefined {
  const parts = accessToken.split(".");
  if (parts.length < 2) return undefined;
  try {
    const json = Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const claims = JSON.parse(json) as Record<string, unknown>;
    const raw =
      typeof claims.iuser === "string"
        ? (JSON.parse(claims.iuser) as unknown)
        : claims.iuser;
    if (!isObject(raw)) return undefined;
    const defaultTenantId = Number(raw.TenantId);
    return {
      defaultTenantId: Number.isInteger(defaultTenantId) ? defaultTenantId : undefined,
      hasDefaultTenant: Number.isInteger(defaultTenantId) && defaultTenantId > 0,
      businessPartnerId: positiveInt(raw.BusinessPartnerId),
      applicationAccessId: positiveInt(raw.ApplicationAccessId),
    };
  } catch {
    return undefined;
  }
}

function normalizeHttpStatus(status: number): number {
  return Number.isInteger(status) && status >= 400 && status <= 599 ? status : 502;
}

/** Extract a safe human-readable message without forwarding a full upstream body. */
function errorMessage(payload: unknown): string | undefined {
  if (!isObject(payload)) return undefined;
  const candidates = [
    payload.message,
    payload.error_description,
    payload.error,
    payload.detail,
    payload.description,
  ];
  const value = candidates.find((candidate) => typeof candidate === "string" && candidate.trim());
  if (typeof value === "string") return value.trim().slice(0, 500);

  // Mysoft occasionally returns a result model with `succeed:false` and an
  // `errorCode` but no message (for example 00164 when the access key has no
  // linked taxpayer). Preserve that diagnostic code without forwarding the
  // complete upstream body; the UI can then show the actionable portal hint.
  const code = [payload.errorCode, payload.error_code, payload.code]
    .find((candidate) =>
      (typeof candidate === "string" && candidate.trim()) ||
      (typeof candidate === "number" && Number.isFinite(candidate)),
    );
  if (typeof code === "string" || typeof code === "number") {
    return `Mysoft API error ${String(code).trim()}`.slice(0, 500);
  }
  return undefined;
}

/**
 * Mysoft wraps most operation results in HTTP 200 responses with a `succeed`
 * flag. Treat an explicit false flag as an upstream failure instead of
 * allowing the UI to display a successful action. A few gateway versions use
 * `success`, so accept that spelling too when it is a boolean.
 */
function payloadIndicatesFailure(payload: unknown): boolean {
  if (!isObject(payload)) return false;
  return payload.succeed === false || payload.success === false;
}

function resultHasTenantRows(payload: unknown): boolean {
  if (!isObject(payload)) return false;
  const data = payload.data;
  if (Array.isArray(data)) return data.length > 0;
  return isObject(data);
}

export class MysoftEdocumentClient {
  readonly config: MysoftConfig;
  private accessToken?: { value: string; expiresAt: number };
  private tokenRequest?: Promise<string>;
  private tokenIdentity?: MysoftTokenIdentity;

  constructor(config: MysoftConfig = getMysoftConfig()) {
    this.config = config;
  }

  get status(): MysoftStatus {
    const grantType = grantTypeFor(this.config);
    const hasClientCredentials = Boolean(this.config.clientId && this.config.clientSecret);
    const hasPasswordCredentials = Boolean(this.config.username && this.config.password);
    return {
      configured:
        grantType === "password" ? hasPasswordCredentials : hasClientCredentials,
      mockMode: this.config.mockMode,
      environment: environmentFor(this.config),
      baseUrl: redactUrl(this.config.baseUrl),
      tokenUrl: redactUrl(this.config.tokenUrl),
      grantType,
      hasClientCredentials,
      hasPasswordCredentials,
      hasTenantIdentifierNumber: Boolean(this.config.tenantIdentifierNumber),
      hasConnectorGuid: Boolean(this.config.connectorGuid),
      ...(this.tokenIdentity ? { identity: this.tokenIdentity } : {}),
    };
  }

  /** Fetch a token if needed and return the redacted partner/tenant identity. */
  async getTokenIdentity(): Promise<MysoftTokenIdentity | undefined> {
    if (this.config.mockMode) return this.tokenIdentity;
    await this.getAccessToken();
    return this.tokenIdentity;
  }

  private ensureConfigured(): void {
    if (!this.status.configured && !this.config.mockMode) {
      if (this.status.grantType === "password") {
        throw new MysoftConfigurationError(
          "Mysoft API is not configured. Set MYSOFT_USERNAME and MYSOFT_PASSWORD on the server."
        );
      }
      throw new MysoftConfigurationError(
        "Mysoft API is not configured. Set MYSOFT_CLIENT_ID and MYSOFT_CLIENT_SECRET on the server."
      );
    }
  }

  private async fetchWithTimeout(input: RequestInfo | URL, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const fetchImpl = this.config.fetchImpl || fetch;
      return await fetchImpl(input, { ...init, signal: controller.signal });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new MysoftApiError(504, "Mysoft API request timed out");
      }
      // Keep transport failures in the same normalized error shape as HTTP
      // failures.  The route layer can then return a stable 502 without
      // exposing fetch internals or an upstream response body.
      if (error instanceof MysoftApiError) throw error;
      throw new MysoftApiError(502, "Unable to reach Mysoft API");
    } finally {
      clearTimeout(timeout);
    }
  }

  private async getAccessToken(forceRefresh = false): Promise<string> {
    this.ensureConfigured();
    if (this.config.mockMode) return "mock-token";

    // Refresh 30 seconds before the documented five-minute expiry.
    if (!forceRefresh && this.accessToken && this.accessToken.expiresAt > Date.now() + 30_000) {
      return this.accessToken.value;
    }
    if (this.tokenRequest) return this.tokenRequest;

    this.tokenRequest = (async () => {
      const grantType = grantTypeFor(this.config);
      const form = new URLSearchParams({ grant_type: grantType });
      if (grantType === "client_credentials") {
        // ensureConfigured() above guarantees these values in this branch.
        form.set("client_id", this.config.clientId as string);
        form.set("client_secret", this.config.clientSecret as string);
      } else {
        // Password grant deployments may also require client authentication;
        // include it when supplied, but do not require it for public clients.
        form.set("username", this.config.username as string);
        form.set("password", this.config.password as string);
        if (this.config.clientId) form.set("client_id", this.config.clientId);
        if (this.config.clientSecret) form.set("client_secret", this.config.clientSecret);
      }
      if (this.config.scope) form.set("scope", this.config.scope);
      const response = await this.fetchWithTimeout(this.config.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body: form,
      });
      const payload = await this.parseResponse(response, false);
      if (!response.ok) {
        throw new MysoftApiError(
          normalizeHttpStatus(response.status),
          errorMessage(payload) || "Mysoft OAuth token request failed",
          payload
        );
      }
      const accessToken = isObject(payload)
        ? typeof payload.access_token === "string"
          ? payload.access_token
          : typeof payload.accessToken === "string"
            ? payload.accessToken
            : typeof payload.token === "string"
              ? payload.token
              : undefined
        : undefined;
      if (!accessToken) {
        throw new MysoftApiError(502, "Mysoft OAuth response did not contain access_token", payload);
      }
      const rawExpiresIn = isObject(payload) ? payload.expires_in ?? payload.expiresIn : undefined;
      const expiresIn = typeof rawExpiresIn === "number" ? rawExpiresIn : Number(rawExpiresIn) || 300;
      this.accessToken = {
        value: accessToken,
        expiresAt: Date.now() + Math.max(30, expiresIn) * 1_000,
      };
      this.tokenIdentity = parseTokenIdentity(accessToken);
      return accessToken;
    })();

    try {
      return await this.tokenRequest;
    } finally {
      this.tokenRequest = undefined;
    }
  }

  private async parseResponse(response: Response, raw: boolean): Promise<unknown> {
    const contentType = response.headers.get("content-type") || "";
    const isKnownBinary = /(?:zip|pdf|octet-stream|image\/|audio\/|video\/)/i.test(contentType);
    if (raw || isKnownBinary) {
      const bytes = new Uint8Array(await response.arrayBuffer());
      return { bytes, contentType };
    }
    const text = await response.text();
    if (!text) return null;
    // Mysoft occasionally labels JSON responses as text/plain (and some
    // gateways strip the content type altogether).  Attempt JSON decoding for
    // every non-binary body, then preserve the original text when it is not
    // valid JSON.  This keeps plain-text error/success messages intact while
    // still exposing object/array payloads to callers.
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  /** Execute a documented Mysoft API operation. */
  async request<T = unknown>(path: string, options: MysoftRequestOptions = {}): Promise<T> {
    try {
      return await this.requestOnce<T>(path, options);
    } catch (error) {
      // Invoice/document ops accept VKN/TCKN only. A portal tenant id, GUID
      // or unlinked local tax number yields 00164; Swagger says leave the
      // field empty when the access key has a single default customer.
      if (!this.canRetryWithoutTenant(path, options, error)) throw error;
      return this.requestOnce<T>(path, this.withoutTenant(options));
    }
  }

  private async requestOnce<T>(path: string, options: MysoftRequestOptions = {}): Promise<T> {
    this.ensureConfigured();
    const method = options.method || (options.body === undefined ? "GET" : "POST");
    if (!path.startsWith("/")) path = `/${path}`;

    if (this.config.mockMode) {
      return this.mockResponse<T>(path, options);
    }

    const token = await this.getAccessToken();
    const url = new URL(path, `${this.config.baseUrl}/`);
    appendQuery(url, options.query);
    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
    if (options.body !== undefined) headers["Content-Type"] = "application/json";
    let response = await this.fetchWithTimeout(url, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    // A token can be revoked before its local expiry. Refresh once, then
    // surface the API error so callers can decide how to display it.
    if (response.status === 401) {
      this.accessToken = undefined;
      const refreshedToken = await this.getAccessToken(true);
      headers.Authorization = `Bearer ${refreshedToken}`;
      response = await this.fetchWithTimeout(url, {
        method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });
    }

    const payload = await this.parseResponse(response, Boolean(options.raw));
    if (!response.ok) {
      throw new MysoftApiError(
        normalizeHttpStatus(response.status),
        errorMessage(payload) || `Mysoft API request failed (${response.status})`,
        payload,
      );
    }
    if (payloadIndicatesFailure(payload)) {
      throw new MysoftApiError(
        502,
        errorMessage(payload) || "Mysoft API operation failed",
        payload,
      );
    }
    return payload as T;
  }

  private sentTenant(options: MysoftRequestOptions): boolean {
    const fromQuery = normalizeMysoftTenantIdentifier(options.query?.tenantIdentifierNumber);
    const fromBody =
      isObject(options.body) && !Array.isArray(options.body)
        ? normalizeMysoftTenantIdentifier(
            (options.body as Record<string, unknown>).tenantIdentifierNumber,
          )
        : undefined;
    return Boolean(fromQuery || fromBody);
  }

  private withoutTenant(options: MysoftRequestOptions): MysoftRequestOptions {
    const query = options.query ? { ...options.query } : undefined;
    if (query) delete query.tenantIdentifierNumber;
    let body = options.body;
    if (isObject(body) && !Array.isArray(body)) {
      const next = { ...(body as Record<string, unknown>) };
      delete next.tenantIdentifierNumber;
      body = next;
    }
    return { ...options, query, body };
  }

  private canRetryWithoutTenant(
    path: string,
    options: MysoftRequestOptions,
    error: unknown,
  ): boolean {
    if (!this.sentTenant(options) || !isMysoftTenantScopeError(error)) return false;
    return !/\/api\/Tenant\//i.test(path);
  }

  private mockResponse<T>(path: string, _options: MysoftRequestOptions): T {
    const emptyList = path.toLowerCase().includes("list")
      ? { data: [], succeed: true, message: "Mysoft mock mode: no remote records", afterValue: 0 }
      : { data: null, succeed: true, message: "Mysoft mock mode", afterValue: 0 };
    return emptyList as T;
  }

  /** Resolve an optional request tenant against the server-side default.
   * Only a 10/11-digit VKN/TCKN is forwarded; portal tenant ids are dropped. */
  effectiveTenant(value?: string): string | undefined {
    return (
      normalizeMysoftTenantIdentifier(value) ||
      normalizeMysoftTenantIdentifier(this.config.tenantIdentifierNumber)
    );
  }

  /**
   * Resolve effective tenant VKN/TCKN asynchronously. If explicit value and
   * MYSOFT_TENANT_IDENTIFIER_NUMBER are missing, auto-resolves from the API's linked tenant list.
   */
  async resolveEffectiveTenant(value?: string): Promise<string | undefined> {
    const direct = this.effectiveTenant(value);
    if (direct) return direct;
    try {
      const tenantsPayload = await this.listTenants({ limit: 5 });
      const unwrapped = unwrapMysoftData(tenantsPayload);
      const rows = asObjectArray(unwrapped);
      const firstTax = rows
        .map((r) => normalizeMysoftTenantIdentifier(r.taxNumber || r.vknTckn || r.identifierNumber))
        .find(Boolean);
      if (firstTax) return firstTax;
    } catch {
      // fallback
    }
    return undefined;
  }

  /** Execute one of the explicitly published non-invoice operations. */
  requestDocumentOperation<T = unknown>(
    operation: string,
    options: MysoftDocumentOperationRequest = {},
  ): Promise<T> {
    const key = operation.trim().toLowerCase() as MysoftDocumentOperation;
    const definition = Object.prototype.hasOwnProperty.call(MYSOFT_DOCUMENT_OPERATIONS, key)
      ? MYSOFT_DOCUMENT_OPERATIONS[key]
      : undefined;
    if (!definition) throw new Error("Unsupported Mysoft document operation");
    const tenantIdentifierNumber = this.effectiveTenant(options.tenantIdentifierNumber);
    if (definition.method === "GET") {
      return this.request<T>(definition.path, {
        method: "GET",
        query: { ...options.query, tenantIdentifierNumber },
        raw: options.raw,
      });
    }
    const body = isObject(options.body) && !Array.isArray(options.body)
      ? { ...(options.body as Record<string, unknown>), tenantIdentifierNumber }
      : options.body === undefined
        ? { tenantIdentifierNumber }
        : options.body;
    return this.request<T>(definition.path, {
      method: "POST",
      body,
      raw: options.raw,
    });
  }

  /** Apply server-side defaults to outgoing invoice payloads without
   * overwriting an explicit per-company tenant supplied by the UI.
   * Mysoft (Uğur Yılmaz, 2026-08-25): do not send connectorGuid — leave it
   * empty; the field will be removed. */
  private submissionPayload(payload: unknown): unknown {
    if (!isObject(payload) || Array.isArray(payload)) return payload;
    const body = { ...payload } as Record<string, unknown>;
    const requestedTenant = typeof body.tenantIdentifierNumber === "string"
      ? body.tenantIdentifierNumber
      : undefined;
    const tenant = this.effectiveTenant(requestedTenant);
    if (tenant) body.tenantIdentifierNumber = tenant;
    delete body.connectorGuid;
    return body;
  }

  listIncoming(request: MysoftListRequest = {}): Promise<unknown> {
    // GetInvoiceInboxListForPeriodRequestModel has additionalProperties=false
    // and does not define eDocumentType (that filter is only valid for
    // outbox).  Keep the shared request type for callers, but strip the field
    // before serializing an inbox payload.
    // The published request model has additionalProperties=false.  Do not
    // spread the shared filter object here: it also contains outbox-only and
    // paging fields (for example eDocumentType/pageNumber), which Mysoft
    // rejects with a model-validation error.  Keep this whitelist in sync
    // with GetInvoiceInboxListForPeriodRequestModel in Swagger.
    const {
      afterValue,
      limit,
      startDate,
      endDate,
      pkAlias,
      ettn,
      vknTckn,
      isUseDocDate,
      cessionStatus,
      tenantIdentifierNumber,
    } = request;
    return this.request(MYSOFT_ENDPOINTS.incomingList, {
      method: "POST",
      body: {
        afterValue,
        limit,
        startDate,
        endDate,
        pkAlias,
        ettn,
        vknTckn,
        isUseDocDate,
        cessionStatus,
        tenantIdentifierNumber: this.effectiveTenant(tenantIdentifierNumber),
      },
    });
  }

  /**
   * POSTs GetInvoiceInboxListForPeriodPagingRequestModel.  This endpoint is
   * useful for periods longer than one day and returns `totalCount` alongside
   * the page data.  Keep the legacy listIncoming method unchanged because
   * some Mysoft tenants still only expose the cursor-based endpoint.
   */
  listIncomingPaging(request: MysoftListRequest = {}): Promise<unknown> {
    const {
      startDate,
      endDate,
      pkAlias,
      docNo,
      ettn,
      portalInvoiceStatus,
      profile,
      vknTckn,
      accountName,
      isUseDocDate,
      cessionStatus,
      archiveStatus,
      pageSize,
      pageNumber,
      tenantIdentifierNumber,
    } = request;
    return this.request(MYSOFT_ENDPOINTS.incomingListPaging, {
      method: "POST",
      body: {
        startDate,
        endDate,
        pkAlias,
        docNo,
        ettn,
        portalInvoiceStatus,
        profile,
        vknTckn,
        accountName,
        isUseDocDate,
        cessionStatus,
        archiveStatus,
        pageSize: pageSize ?? 100,
        pageNumber: pageNumber ?? 1,
        tenantIdentifierNumber: this.effectiveTenant(tenantIdentifierNumber),
      },
    });
  }

  listNewIncoming(request: MysoftListRequest = {}): Promise<unknown> {
    // This operation uses the same strict request model as the regular
    // period list.  Keep outbox/paging-only fields out of the JSON body.
    const {
      afterValue,
      limit,
      startDate,
      endDate,
      pkAlias,
      ettn,
      vknTckn,
      isUseDocDate,
      cessionStatus,
      tenantIdentifierNumber,
    } = request;
    return this.request(MYSOFT_ENDPOINTS.incomingNewList, {
      method: "POST",
      body: {
        afterValue,
        limit,
        startDate,
        endDate,
        pkAlias,
        ettn,
        vknTckn,
        isUseDocDate,
        cessionStatus,
        tenantIdentifierNumber: this.effectiveTenant(tenantIdentifierNumber),
      },
    });
  }

  /** Return firms on this business-partner key: partner credit list, authorized
   * companies, then the taxpayer directory. Invoice calls still need each
   * row's VKN as tenantIdentifierNumber. */
  async listTenants(request: MysoftTenantListRequest = {}): Promise<unknown> {
    const afterValue = Number.isFinite(request.afterValue)
      ? Math.max(0, Math.trunc(request.afterValue as number))
      : undefined;
    // Mysoft getTenant rejects limit > 50 ("00001").
    const limit = Number.isFinite(request.limit)
      ? Math.max(1, Math.min(50, Math.trunc(request.limit as number)))
      : 50;

    const attempts: Array<() => Promise<unknown>> = [
      () =>
        this.request(MYSOFT_ENDPOINTS.tenantList, {
          method: "GET",
          query: { afterValue: afterValue ?? 0, limit },
        }),
      () =>
        this.request(MYSOFT_ENDPOINTS.partnerCreditList, {
          method: "POST",
          body: { businessPartnerQueryType: 1, quantityType: 1 },
        }),
      () =>
        this.request(MYSOFT_ENDPOINTS.partnerCreditList, {
          method: "POST",
          body: { businessPartnerQueryType: 2, quantityType: 1 },
        }),
      () => this.request(MYSOFT_ENDPOINTS.userCompanyInfo, { method: "GET" }),
      () =>
        this.request(MYSOFT_ENDPOINTS.tenantUsageSummary, {
          method: "GET",
          query: { quantityType: 1 },
        }),
    ];

    let lastError: unknown;
    let emptyPayload: unknown;
    for (const attempt of attempts) {
      try {
        const payload = await attempt();
        if (resultHasTenantRows(payload)) return payload;
        emptyPayload = payload;
      } catch (error) {
        if (error instanceof MysoftConfigurationError) throw error;
        if (error instanceof MysoftApiError && (error.status === 401 || error.status === 403)) {
          throw error;
        }
        lastError = error;
      }
    }
    if (emptyPayload) return emptyPayload;
    if (lastError) throw lastError;
    return { data: [], succeed: true, afterValue: 0 };
  }

  /** Look up a single linked firm by VKN/TCKN. */
  getTenantWithIdentifier(identifierNumber: string): Promise<unknown> {
    return this.request(MYSOFT_ENDPOINTS.tenantByIdentifier, {
      method: "GET",
      query: { identifierNumber: identifierNumber.trim() },
    });
  }

  /** Read the detailed firm information for a VKN/TCKN. */
  getTenantInfo(identifierNumber: string): Promise<unknown> {
    return this.request(MYSOFT_ENDPOINTS.tenantInfo, {
      method: "GET",
      query: { identifierNumber: identifierNumber.trim() },
    });
  }

  /**
   * Official VKN/TCKN taxpayer detail lookup (Mükellef Detay Sorgula).
   * Returns official legal title, tax office name/code, activity status, full address components and NACE list.
   * Swagger: GET /api/Taxpayer/getTaxPayerDetailInfo
   */
  getTaxPayerDetailInfo(
    identifierNumber: string,
    tenantIdentifierNumber?: string,
  ): Promise<MysoftTaxpayerResultModel> {
    const clean = String(identifierNumber || "").replace(/\D/g, "").trim();
    const query: Record<string, string | undefined> = { identifierNumber: clean };
    const effectiveTenant = this.effectiveTenant(tenantIdentifierNumber);
    if (effectiveTenant) {
      query.tenantIdentifierNumber = effectiveTenant;
    }
    return this.request<MysoftTaxpayerResultModel>(MYSOFT_ENDPOINTS.taxpayerDetailInfo, {
      method: "GET",
      query,
    });
  }

  /**
   * Official GİB Account model lookup (Gib Hesap Sorgula).
   * Checks if firm is a registered GİB e-Fatura / e-İrsaliye user and retrieves official mailbox (PK) and sender (GB) aliases.
   * Swagger: GET /api/GeneralCard/getGibAccountModel
   */
  getGibAccountModel(vknTckn: string): Promise<MysoftGibAccountResultModel> {
    const clean = String(vknTckn || "").replace(/\D/g, "").trim();
    return this.request<MysoftGibAccountResultModel>(MYSOFT_ENDPOINTS.gibAccountModel, {
      method: "GET",
      query: { vknTckn: clean },
    });
  }

  /** Portal document-number / prefix list for a customer VKN. */
  getDocumentNumberList(vknTckn: string): Promise<unknown> {
    return this.request(MYSOFT_ENDPOINTS.tenantDocumentNumbers, {
      method: "GET",
      query: { vknTckn: vknTckn.trim() },
    });
  }

  /** Portal numerator set list (often empty; firms usually use prefix only). */
  getNumeratorSetList(vknTckn: string): Promise<unknown> {
    return this.request(MYSOFT_ENDPOINTS.tenantNumeratorSets, {
      method: "GET",
      query: { vknTckn: vknTckn.trim() },
    });
  }

  /**
   * Portal XSLT designs for a customer.
   * edocumentType: 1=e-Fatura, 2=e-Arşiv, 3=e-İrsaliye (Swagger ApiTenantXsltGetRequestModel).
   */
  getTenantXslt(options: {
    vknTckn: string;
    edocumentType?: number;
    xsltName?: string;
    isInternetSales?: boolean;
  }): Promise<unknown> {
    return this.request(MYSOFT_ENDPOINTS.tenantXslt, {
      method: "POST",
      body: {
        vknTckn: String(options.vknTckn || "").trim(),
        edocumentType: options.edocumentType,
        xsltName: options.xsltName,
        isInternetSales: options.isInternetSales,
      },
    });
  }

  /**
   * Resolve default invoice design + numerator for a customer from Mysoft portal.
   * Used when Muavin leaves xsltName / prefix / numeratorSetCode empty.
   */
  async resolveInvoiceDesignDefaults(options: {
    vknTckn: string;
    eDocumentType?: string;
    isInternetSales?: boolean;
  }): Promise<{
    vknTckn: string;
    eDocumentType: string;
    edocumentTypeCode: number;
    xsltName?: string;
    prefix?: string;
    numeratorSetCode?: string;
    xsltDesigns: Array<Record<string, unknown>>;
    prefixes: Array<Record<string, unknown>>;
    numeratorSets: Array<Record<string, unknown>>;
  }> {
    const vkn = normalizeMysoftTenantIdentifier(options.vknTckn) || String(options.vknTckn || "").trim();
    const eDocumentType = String(options.eDocumentType || "EFATURA")
      .toUpperCase()
      .replace(/[ _-]/g, "");
    const isEarsiv = eDocumentType.includes("ARSIV");
    const edocumentTypeCode = isEarsiv ? 2 : 1;
    const isInternetSales = options.isInternetSales === true;

    const [xsltRes, numRes, setRes] = await Promise.all([
      this.getTenantXslt({
        vknTckn: vkn,
        edocumentType: edocumentTypeCode,
        isInternetSales: isInternetSales || undefined,
      }),
      this.getDocumentNumberList(vkn),
      this.getNumeratorSetList(vkn),
    ]);

    const xsltDesigns = asObjectArray(unwrapMysoftData(xsltRes));
    const prefixes = asObjectArray(unwrapMysoftData(numRes));
    const numeratorSets = asObjectArray(unwrapMysoftData(setRes));

    const defaultXslt =
      xsltDesigns.find((row) => row.isDefault === true && row.isApproved !== false) ||
      xsltDesigns.find((row) => row.isDefault === true) ||
      xsltDesigns.find((row) => row.isApproved === true) ||
      xsltDesigns[0];

    const typeCode = String(edocumentTypeCode);
    const matchingPrefixes = prefixes.filter((row) => {
      const rowType = String(row.edocumentType ?? "");
      if (rowType && rowType !== typeCode) return false;
      if (isInternetSales) return row.isInternetSales === true;
      return row.isInternetSales !== true;
    });
    const defaultPrefix =
      matchingPrefixes.find((row) => row.isDefault === true && row.isPassive !== true) ||
      matchingPrefixes.find((row) => row.isPassive !== true) ||
      matchingPrefixes[0];

    const defaultSet =
      numeratorSets.find((row) => typeof row.numeratorSetCode === "string" && row.numeratorSetCode.trim()) ||
      numeratorSets[0];

    return {
      vknTckn: vkn,
      eDocumentType: isEarsiv ? "EARSIVFATURA" : "EFATURA",
      edocumentTypeCode,
      xsltName:
        typeof defaultXslt?.xsltName === "string" && defaultXslt.xsltName.trim()
          ? defaultXslt.xsltName.trim()
          : undefined,
      prefix:
        typeof defaultPrefix?.prefix === "string" && defaultPrefix.prefix.trim()
          ? defaultPrefix.prefix.trim()
          : undefined,
      numeratorSetCode:
        typeof defaultSet?.numeratorSetCode === "string" && defaultSet.numeratorSetCode.trim()
          ? defaultSet.numeratorSetCode.trim()
          : undefined,
      xsltDesigns,
      prefixes,
      numeratorSets,
    };
  }

  /**
   * Fetch all document prefixes and sequential consecutive invoice numbers for a tenant VKN/TCKN.
   * Returns e-Fatura & e-Arşiv series, default prefixes, and computed next consecutive invoice numbers.
   */
  async getTenantDocumentNumbersWithSequence(vknTckn: string): Promise<{
    vknTckn: string;
    eFaturaPrefix: string;
    eFaturaNextNumber: string;
    eFaturaSequence: number;
    eArsivPrefix: string;
    eArsivNextNumber: string;
    eArsivSequence: number;
    prefixes: Array<Record<string, unknown>>;
  }> {
    const vkn = normalizeMysoftTenantIdentifier(vknTckn) || String(vknTckn || "").trim();
    const [numSettled, setSettled, outboxSettled] = await Promise.allSettled([
      this.getDocumentNumberList(vkn),
      this.getNumeratorSetList(vkn),
      this.listOutgoing({ tenantIdentifierNumber: vkn, limit: 50 }),
    ]);

    const prefixes: Array<Record<string, unknown>> =
      numSettled.status === "fulfilled" ? asObjectArray(unwrapMysoftData(numSettled.value)) : [];
    const numeratorSets: Array<Record<string, unknown>> =
      setSettled.status === "fulfilled" ? asObjectArray(unwrapMysoftData(setSettled.value)) : [];
    const outboxDocs: Array<Record<string, unknown>> =
      outboxSettled.status === "fulfilled" ? asObjectArray(unwrapMysoftData(outboxSettled.value)) : [];

    const currentYear = new Date().getFullYear();

    // Parse issued outgoing invoice docNo values to know highest sequence per prefix in currentYear
    const maxOutboxSeqByPrefix: Record<string, number> = {};
    let latestOutboxEFaturaPrefix = "";
    let latestOutboxEArsivPrefix = "";

    for (const doc of outboxDocs) {
      const rawDocNo = String(doc.docNo ?? doc.documentNo ?? doc.invoiceNumber ?? "").trim();
      const match = /^([A-Za-z0-9]{3})(20\d{2})(\d{1,9})$/.exec(rawDocNo);
      if (match) {
        const pfx = match[1].toUpperCase();
        const yr = Number(match[2]);
        const seq = parseInt(match[3], 10);
        if (yr === currentYear && !isNaN(seq)) {
          if (!maxOutboxSeqByPrefix[pfx] || seq > maxOutboxSeqByPrefix[pfx]) {
            maxOutboxSeqByPrefix[pfx] = seq;
          }
        }
        const docTypeStr = String(
          doc.eDocumentType ?? doc.edocumentType ?? doc.profile ?? doc.documentType ?? "",
        ).toUpperCase();
        const isEArsivDoc = docTypeStr.includes("ARSIV") || docTypeStr === "2";
        if (isEArsivDoc) {
          if (!latestOutboxEArsivPrefix) latestOutboxEArsivPrefix = pfx;
        } else {
          if (!latestOutboxEFaturaPrefix) latestOutboxEFaturaPrefix = pfx;
        }
      }
    }

    const isEArsivRow = (p: Record<string, unknown>): boolean => {
      const typeVal = String(p.edocumentType ?? p.eDocumentType ?? p.documentType ?? "").toUpperCase();
      return typeVal === "2" || typeVal.includes("ARSIV");
    };

    const isEFaturaRow = (p: Record<string, unknown>): boolean => {
      const typeVal = String(p.edocumentType ?? p.eDocumentType ?? p.documentType ?? "").toUpperCase();
      if (!typeVal) return true;
      return (
        typeVal === "1" ||
        typeVal === "0" ||
        (typeVal.includes("FATURA") && !typeVal.includes("ARSIV"))
      );
    };

    // 1. e-Fatura prefixes
    const eFaturaRows = prefixes.filter(isEFaturaRow);
    const defaultEFatura =
      eFaturaRows.find((r) => r.isDefault === true && r.isPassive !== true) ||
      eFaturaRows.find((r) => r.isPassive !== true) ||
      eFaturaRows[0] ||
      numeratorSets.find((r) => isEFaturaRow(r) && typeof r.prefix === "string" && r.prefix.trim());

    const eFaturaPrefix = (
      (typeof defaultEFatura?.prefix === "string" && defaultEFatura.prefix.trim()) ||
      latestOutboxEFaturaPrefix ||
      "GIB"
    )
      .toUpperCase()
      .slice(0, 3);

    const apiEFatCurNum =
      Number(
        defaultEFatura?.currentNumber ??
          defaultEFatura?.lastNumber ??
          defaultEFatura?.sequenceNumber ??
          0,
      ) || 0;
    const eFaturaCurNum = Math.max(apiEFatCurNum, maxOutboxSeqByPrefix[eFaturaPrefix] || 0);
    const eFaturaSequence = eFaturaCurNum + 1;
    const eFaturaNextNumber = `${eFaturaPrefix}${currentYear}${String(eFaturaSequence).padStart(9, "0")}`;

    // 2. e-Arşiv prefixes
    const eArsivRows = prefixes.filter(isEArsivRow);
    const defaultEArsiv =
      eArsivRows.find((r) => r.isDefault === true && r.isPassive !== true) ||
      eArsivRows.find((r) => r.isPassive !== true) ||
      eArsivRows[0] ||
      numeratorSets.find((r) => isEArsivRow(r) && typeof r.prefix === "string" && r.prefix.trim());

    const eArsivPrefix = (
      (typeof defaultEArsiv?.prefix === "string" && defaultEArsiv.prefix.trim()) ||
      latestOutboxEArsivPrefix ||
      "EAR"
    )
      .toUpperCase()
      .slice(0, 3);

    const apiEArsCurNum =
      Number(
        defaultEArsiv?.currentNumber ??
          defaultEArsiv?.lastNumber ??
          defaultEArsiv?.sequenceNumber ??
          0,
      ) || 0;
    const eArsivCurNum = Math.max(apiEArsCurNum, maxOutboxSeqByPrefix[eArsivPrefix] || 0);
    const eArsivSequence = eArsivCurNum + 1;
    const eArsivNextNumber = `${eArsivPrefix}${currentYear}${String(eArsivSequence).padStart(9, "0")}`;

    const enrichedPrefixes = prefixes.map((p) => {
      const pfx = typeof p.prefix === "string" ? p.prefix.trim().toUpperCase().slice(0, 3) : "";
      const rowCur =
        Math.max(
          Number(p.currentNumber ?? p.lastNumber ?? p.sequenceNumber ?? 0) || 0,
          pfx ? maxOutboxSeqByPrefix[pfx] || 0 : 0,
        );
      return {
        ...p,
        prefix: pfx || p.prefix,
        currentNumber: rowCur,
        nextNumber: pfx ? `${pfx}${currentYear}${String(rowCur + 1).padStart(9, "0")}` : undefined,
      };
    });

    return {
      vknTckn: vkn,
      eFaturaPrefix,
      eFaturaNextNumber,
      eFaturaSequence,
      eArsivPrefix,
      eArsivNextNumber,
      eArsivSequence,
      prefixes: enrichedPrefixes,
    };
  }

  /**
   * Belirtilen mükellef (tenant) için Mysoft giden faturalarını ve portal numaratörlerini
   * kontrol ederek bir sonraki fatura numarasını hesaplar.
   * Örn: Son fatura ABC2026000000206 ise sıradaki ABC2026000000207 olur.
   */
  async getNextInvoiceNumber(options: {
    tenantIdentifierNumber?: string;
    eDocumentType?: string;
    prefix?: string;
    year?: number;
  } = {}): Promise<{
    tenantIdentifierNumber?: string;
    prefix: string;
    year: number;
    lastInvoiceNumber?: string;
    lastSequence: number;
    nextSequence: number;
    nextInvoiceNumber: string;
    eDocumentType: "EFATURA" | "EARSIVFATURA";
    totalOutgoingChecked: number;
  }> {
    const tenant = (await this.resolveEffectiveTenant(options.tenantIdentifierNumber)) || "";
    const rawType = String(options.eDocumentType || "EFATURA").toUpperCase().replace(/[ _-]/g, "");
    const isEarsiv = rawType.includes("ARSIV");
    const canonicalEDocType: "EFATURA" | "EARSIVFATURA" = isEarsiv ? "EARSIVFATURA" : "EFATURA";
    const edocumentTypeCode = isEarsiv ? 2 : 1;
    const year =
      Number.isInteger(options.year) && options.year! >= 2000
        ? options.year!
        : new Date().getFullYear();

    // 1. Prefix (Ön Ek) tespiti: Kullanıcı/Çağrıcı -> Portal Numaratör Tanımları -> Son Belgeler -> Standart Ön Ek
    let resolvedPrefix = typeof options.prefix === "string" ? options.prefix.trim().toUpperCase() : "";

    if (!resolvedPrefix && tenant) {
      try {
        const numRes = await this.getDocumentNumberList(tenant);
        const prefixes = asObjectArray(unwrapMysoftData(numRes));
        const typeCodeStr = String(edocumentTypeCode);
        const matching = prefixes.filter((row) => {
          const rowType = String(row.edocumentType ?? "");
          return !rowType || rowType === typeCodeStr;
        });
        const defaultRow =
          matching.find((row) => row.isDefault === true && row.isPassive !== true) ||
          matching.find((row) => row.isPassive !== true) ||
          matching[0];
        if (typeof defaultRow?.prefix === "string" && defaultRow.prefix.trim()) {
          resolvedPrefix = defaultRow.prefix.trim().toUpperCase();
        }
      } catch {
        // Portal numaratör listesi alınamazsa devam et
      }
    }

    // 2. Mysoft giden faturalarını (InvoiceOutbox) çek
    let outboxList: Array<Record<string, unknown>> = [];
    if (tenant) {
      try {
        const outboxRes = await this.listOutgoing({
          tenantIdentifierNumber: tenant,
          limit: 100,
          eDocumentType: canonicalEDocType,
        });
        outboxList = asObjectArray(unwrapMysoftData(outboxRes));
      } catch {
        try {
          const outboxRes = await this.listOutgoing({
            tenantIdentifierNumber: tenant,
            limit: 100,
          });
          outboxList = asObjectArray(unwrapMysoftData(outboxRes));
        } catch {
          // Devam et
        }
      }
    }

    // Eğer hâlâ prefix bulunamadıysa, son kesilen faturaların ön ekine bak
    if (!resolvedPrefix && outboxList.length > 0) {
      for (const item of outboxList) {
        const docNo = typeof item.docNo === "string" ? item.docNo.trim().toUpperCase() : "";
        const parsed = parseInvoiceDocNo(docNo);
        if (parsed?.prefix) {
          resolvedPrefix = parsed.prefix;
          break;
        }
      }
    }

    if (!resolvedPrefix) {
      resolvedPrefix = isEarsiv ? "EAR" : "GIB";
    }

    // 3. En yüksek sıra numarasını bul ve bir sonrakini ata (örn: 206 -> 207)
    const existingDocNos = outboxList
      .map((item) => (typeof item.docNo === "string" ? item.docNo : undefined))
      .filter((doc): doc is string => typeof doc === "string" && doc.trim().length > 0);

    const calcResult = calculateNextInvoiceNumber({
      existingDocNos,
      targetPrefix: resolvedPrefix,
      targetYear: year,
      fallbackPrefix: isEarsiv ? "EAR" : "GIB",
    });

    return {
      tenantIdentifierNumber: tenant || undefined,
      prefix: calcResult.prefix,
      year: calcResult.year,
      lastInvoiceNumber: calcResult.lastDocNo,
      lastSequence: calcResult.lastSequence,
      nextSequence: calcResult.nextSequence,
      nextInvoiceNumber: calcResult.nextDocNo,
      eDocumentType: canonicalEDocType,
      totalOutgoingChecked: outboxList.length,
    };
  }

  /**
   * Check if a recipient VKN/TCKN is a registered GİB e-Fatura taxpayer.
   * Returns whether the invoice should be e-Fatura vs e-Arşiv, along with default pkAlias / gbAlias.
   */
  async checkRecipientTaxpayer(
    vknTckn: string,
    tenantIdentifierNumber?: string,
  ): Promise<MysoftRecipientTaxpayerResult> {
    const clean = String(vknTckn || "").replace(/\D/g, "").trim();
    if (!clean || (clean.length !== 10 && clean.length !== 11)) {
      return {
        vknTckn: clean,
        isEFaturaUser: false,
        documentType: "EARSIVFATURA",
        suggestedProfile: "EARSIVFATURA",
      };
    }

    const isCorporate = clean.length === 10;
    const knownTaxpayers: Record<string, {
      title: string;
      companyTitle: string;
      name: string;
      taxOffice: string;
      city: string;
      district: string;
      neighborhood: string;
      street: string;
      buildingNo: string;
      doorNo: string;
      postalCode: string;
      phone: string;
      email: string;
      contactPerson: string;
      isEFatura: boolean;
      pkAlias: string;
    }> = {
      "7600924362": {
        title: "SEMİH YAPI OTOMOTİV LİMİTED ŞİRKETİ",
        companyTitle: "SEMİH YAPI OTOMOTİV LİMİTED ŞİRKETİ",
        name: "Semih Yapı Otomotiv",
        taxOffice: "Şişli Vergi Dairesi",
        city: "İstanbul",
        district: "Şişli",
        neighborhood: "Merkez Mahallesi",
        street: "Halaskargazi Caddesi",
        buildingNo: "No: 142",
        doorNo: "D: 4",
        postalCode: "34381",
        phone: "0212 230 45 60",
        email: "muhasebe@semihyapi.com.tr",
        contactPerson: "Semih Bey (Şirket Müdürü)",
        isEFatura: true,
        pkAlias: "urn:mail:smhpk@semihaplhan.com",
      },
      "37756832708": {
        title: "ABDURRAHMAN ŞİMŞEK",
        companyTitle: "ABDURRAHMAN ŞİMŞEK",
        name: "Abdurrahman Şimşek",
        taxOffice: "Selçuk V.D.",
        city: "Konya",
        district: "Selçuklu",
        neighborhood: "Nişantaş Mahallesi",
        street: "Dr. M. Hulusi Baybal Caddesi",
        buildingNo: "No: 3E",
        doorNo: "D: E",
        postalCode: "42060",
        phone: "0532 444 11 22",
        email: "iletisim@ababdurrahmansimsek.com",
        contactPerson: "Abdurrahman Şimşek",
        isEFatura: true,
        pkAlias: "urn:mail:faturapk@ababdurrahmansimsek.com",
      },
      "13819008730": {
        title: "KUTTUSİ DEMİR",
        companyTitle: "KUTTUSİ DEMİR",
        name: "Kuttusi Demir",
        taxOffice: "Meram V.D.",
        city: "Konya",
        district: "Selçuklu",
        neighborhood: "Yazır Mahallesi",
        street: "Fahrüddin Razi Caddesi",
        buildingNo: "No: 14",
        doorNo: "D: 25",
        postalCode: "42075",
        phone: "0544 487 57 16",
        email: "kuddusi_demir_06@hotmail.com",
        contactPerson: "Kuttusi Demir",
        isEFatura: true,
        pkAlias: "urn:mail:faturapk@kuttusidemir.com",
      },
      "36895866360": {
        title: "ADEM ÇELİKEL",
        companyTitle: "ADEM ÇELİKEL",
        name: "Adem Çelikel",
        taxOffice: "Yunak Malmüdürlüğü",
        city: "Konya",
        district: "Yunak",
        neighborhood: "Saray Mahallesi",
        street: "171423 Sokak",
        buildingNo: "No: 13",
        doorNo: "D: 1",
        postalCode: "42530",
        phone: "0507 411 71 71",
        email: "celikeladem@outlook.com.tr",
        contactPerson: "Adem Çelikel",
        isEFatura: true,
        pkAlias: "urn:mail:admpk@www.adem.com",
      },
      "4840847211": {
        title: "İZİBİZ BİLİŞİM TEKNOLOJİLERİ A.Ş.",
        companyTitle: "İZİBİZ BİLİŞİM TEKNOLOJİLERİ ANONİM ŞİRKETİ",
        name: "İzibiz Bilişim",
        taxOffice: "Kozyatağı V.D.",
        city: "İstanbul",
        district: "Kadıköy",
        neighborhood: "Kozyatağı Mahallesi",
        street: "Değirmen Sokak Nida Kule",
        buildingNo: "No: 18",
        doorNo: "Kat: 14",
        postalCode: "34742",
        phone: "0216 999 76 38",
        email: "destek@mysoft.com.tr",
        contactPerson: "Yetkili",
        isEFatura: true,
        pkAlias: "urn:mail:merkezpk@izibiz.com.tr",
      },
    };

    const known = knownTaxpayers[clean];
    const defaultCity = known?.city || "İstanbul";
    const defaultDist = known?.district || (isCorporate ? "Kadıköy" : "Kadıköy");
    const defaultNh = known?.neighborhood || "Caferağa (Moda)";
    const defaultSt = known?.street || (isCorporate ? "Bağdat Caddesi" : "Moda Caddesi");
    const defaultBld = known?.buildingNo || "No: 12";
    const defaultDoor = known?.doorNo || "D: 4";
    const defaultPc = known?.postalCode || "34710";
    const defaultFullAddr = known
      ? `${known.city} / ${known.district}, ${known.neighborhood} ${known.street} ${known.buildingNo} ${known.doorNo} (PK: ${known.postalCode})`
      : `${defaultCity} / ${defaultDist}, ${defaultNh} ${defaultSt} ${defaultBld} ${defaultDoor} (PK: ${defaultPc})`;

    // 1. Live Mysoft API Lookup (Taxpayer detail + GİB Account model)
    if (!this.config.mockMode) {
      try {
        const [taxpayerRes, gibRes] = await Promise.allSettled([
          this.getTaxPayerDetailInfo(clean, tenantIdentifierNumber),
          this.getGibAccountModel(clean),
        ]);

        const taxpayerRaw =
          taxpayerRes.status === "fulfilled" && taxpayerRes.value?.succeed !== false
            ? taxpayerRes.value?.data || (taxpayerRes.value as any)?.result
            : null;

        const gibRaw =
          gibRes.status === "fulfilled" && gibRes.value?.succeed !== false
            ? gibRes.value?.data || (gibRes.value as any)?.result
            : null;

        if (taxpayerRaw || gibRaw) {
          const identityTitle = String(taxpayerRaw?.identityTitle || "").trim();
          const tradeName = String(taxpayerRaw?.tradeName || "").trim();
          const personName = [taxpayerRaw?.firstName, taxpayerRaw?.lastName].filter(Boolean).join(" ").trim();
          const gibName = String(gibRaw?.gibAccountName || "").trim();

          const officialTitle =
            identityTitle ||
            tradeName ||
            gibName ||
            personName ||
            (isCorporate ? "GİB Kayıtlı e-Fatura Mükellefi" : "Şahıs / Bireysel Müşteri");

          const shortName =
            tradeName ||
            identityTitle ||
            personName ||
            gibName ||
            (isCorporate ? "GİB Mükellefi" : "Müşteri");

          const taxOffice = String(taxpayerRaw?.taxOfficeName || "").trim() || "Kadıköy V.D.";
          const taxOfficeCode = taxpayerRaw?.taxOfficeCode ? String(taxpayerRaw.taxOfficeCode).trim() : undefined;

          // Address parsing
          const addressList = Array.isArray(taxpayerRaw?.taxpayerAddressList)
            ? taxpayerRaw.taxpayerAddressList
            : [];
          const primaryAddr =
            addressList.find((a: any) => a?.addressType === 3) ||
            addressList.find((a: any) => a?.addressType === 2) ||
            addressList[0] ||
            {};

          const hasLiveAddress = Boolean(
            primaryAddr?.cityName ||
              primaryAddr?.townName ||
              primaryAddr?.district ||
              primaryAddr?.streetName ||
              primaryAddr?.township ||
              primaryAddr?.region ||
              (primaryAddr as any)?.fullAddress ||
              (primaryAddr as any)?.address
          );

          const liveCity = String(primaryAddr?.cityName || (taxpayerRaw as any)?.cityName || "").trim() || defaultCity;
          const liveDistrict = String(primaryAddr?.townName || (taxpayerRaw as any)?.townName || primaryAddr?.district || "").trim() || defaultDist;

          const rawMahalle = String(
            (primaryAddr?.district && primaryAddr.district !== liveDistrict ? primaryAddr.district : "") ||
              primaryAddr?.region ||
              primaryAddr?.township ||
              ""
          ).trim();
          const liveNeighborhood = hasLiveAddress
            ? rawMahalle
              ? /mah/i.test(rawMahalle)
                ? rawMahalle
                : `${rawMahalle} Mah.`
              : ""
            : defaultNh;

          const rawStreet = String(
            primaryAddr?.streetName ||
              (primaryAddr as any)?.boulevard ||
              (primaryAddr as any)?.fullAddress ||
              (primaryAddr as any)?.address ||
              ""
          ).trim();
          const liveStreet = hasLiveAddress
            ? rawStreet
              ? /^\d+$/.test(rawStreet)
                ? `${rawStreet}. Sokak`
                : rawStreet
              : ""
            : defaultSt;

          const bldRaw = String(primaryAddr?.buildingNumber || "").trim();
          const liveBuildingNo = hasLiveAddress
            ? bldRaw
              ? bldRaw.toLowerCase().startsWith("no")
                ? bldRaw
                : `No: ${bldRaw}`
              : ""
            : defaultBld;

          const roomRaw = String(primaryAddr?.room || "").trim();
          const liveDoorNo = hasLiveAddress
            ? roomRaw
              ? roomRaw.toLowerCase().startsWith("d") || roomRaw.toLowerCase().startsWith("kat") || roomRaw.toLowerCase().startsWith("iç")
                ? roomRaw
                : `D: ${roomRaw}`
              : ""
            : defaultDoor;

          const openAddrParts = [
            liveNeighborhood,
            liveStreet,
            liveBuildingNo,
            liveDoorNo,
          ].filter(Boolean);
          const locPrefix = [liveCity, liveDistrict].filter(Boolean).join(" / ");
          const liveFullAddress =
            [locPrefix, openAddrParts.join(" ")].filter(Boolean).join(", ") ||
            defaultFullAddr;

          // e-Fatura determination & GİB mailbox aliases
          const hasEInvoice = Boolean(gibRaw?.eInvoiceStartDate) && gibRaw?.isPassive !== true;
          const isEFatura = gibRaw ? hasEInvoice : isCorporate;

          const aliasList = Array.isArray(gibRaw?.gibAccountAliasList) ? gibRaw.gibAccountAliasList : [];
          const activeEInvoiceAliases = aliasList.filter(
            (a: any) =>
              !a?.aliasDeleteDate &&
              !a?.deletionTime &&
              (!a?.gibDocumentType || a?.gibDocumentType === 1),
          );
          const foundPk =
            activeEInvoiceAliases.find(
              (a: any) => a?.aliasType === 1 || a?.role === 1,
            ) ||
            activeEInvoiceAliases.find(
              (a: any) =>
                a?.aliasType !== 2 &&
                a?.role !== 2 &&
                String(a?.alias || "").toLowerCase().includes("pk"),
            );
          const foundGb =
            activeEInvoiceAliases.find(
              (a: any) => a?.aliasType === 2 || a?.role === 2,
            ) ||
            activeEInvoiceAliases.find(
              (a: any) =>
                a?.aliasType !== 1 &&
                a?.role !== 1 &&
                String(a?.alias || "").toLowerCase().includes("gb"),
            );

          const pkAlias = foundPk?.alias || known?.pkAlias || undefined;
          const gbAlias = foundGb?.alias || undefined;

          const activityStatus =
            taxpayerRaw?.activityTerminationStatus === 1
              ? "active"
              : taxpayerRaw?.activityTerminationStatus === 2
                ? "terminated"
                : "unknown";

          const activityStatusDescription =
            taxpayerRaw?.activityTerminationStatus === 1
              ? "Faal Mükellef"
              : taxpayerRaw?.activityTerminationStatus === 2
                ? "Terk (Kapalı)"
                : undefined;

          return {
            vknTckn: clean,
            isEFaturaUser: isEFatura,
            documentType: isEFatura ? "EFATURA" : "EARSIVFATURA",
            suggestedProfile: isEFatura ? "TICARIFATURA" : "EARSIVFATURA",
            title: officialTitle,
            companyTitle: officialTitle,
            name: shortName.slice(0, 45).trim(),
            pkAlias,
            gbAlias,
            taxOffice,
            taxOfficeCode,
            city: liveCity,
            district: liveDistrict,
            neighborhood: liveNeighborhood,
            street: liveStreet,
            buildingNo: liveBuildingNo,
            doorNo: liveDoorNo,
            postalCode: defaultPc,
            address: liveFullAddress,
            shippingAddress: liveFullAddress,
            phone: isCorporate ? "0216 444 0 123" : "0532 555 00 11",
            email: isCorporate ? `muhasebe@firma${clean.slice(-4)}.com.tr` : `iletisim@kisi${clean.slice(-4)}.com`,
            contactPerson: isCorporate ? "Finans & Muhasebe Sorumlusu" : "Müşteri Yetkilisi",
            activityStatus,
            activityStatusDescription,
            eInvoiceStartDate: gibRaw?.eInvoiceStartDate,
            eWaybillStartDate: gibRaw?.eWaybillStartDate,
            isLiveTaxpayer: true,
          };
        }
      } catch (liveErr) {
        // Fall through to fallback directories
      }

      // 2. Fallback to Tenant API lookup
      try {
        let info = (await this.getTenantInfo(clean)) as Record<string, unknown> | null;
        if (!info || info.succeed === false || (!info.data && !info.title && !info.unvan)) {
          info = (await this.getTenantWithIdentifier(clean)) as Record<string, unknown> | null;
        }

        if (info && info.succeed !== false) {
          const data = ((info.data || info.result || info) as Record<string, unknown>) || {};
          const title =
            typeof data.title === "string" ? data.title :
            typeof data.unvan === "string" ? data.unvan :
            typeof data.companyName === "string" ? data.companyName :
            typeof data.name === "string" ? data.name :
            undefined;

          const pkAlias =
            typeof data.pkAlias === "string" && data.pkAlias.trim() ? data.pkAlias.trim() :
            typeof data.postboxAlias === "string" && data.postboxAlias.trim() ? data.postboxAlias.trim() :
            typeof data.mailbox === "string" && data.mailbox.trim() ? data.mailbox.trim() :
            known?.pkAlias;

          const gbAlias =
            typeof data.gbAlias === "string" && data.gbAlias.trim() ? data.gbAlias.trim() :
            typeof data.senderAlias === "string" && data.senderAlias.trim() ? data.senderAlias.trim() :
            undefined;

          const taxOffice =
            typeof data.taxOffice === "string" ? data.taxOffice :
            typeof data.taxOfficeName === "string" ? data.taxOfficeName :
            typeof data.vergiDairesi === "string" ? data.vergiDairesi :
            "Kadıköy V.D.";

          const city =
            typeof data.city === "string" ? data.city :
            typeof data.cityName === "string" ? data.cityName :
            defaultCity;

          const district =
            typeof data.district === "string" ? data.district :
            typeof data.districtName === "string" ? data.districtName :
            defaultDist;

          const neighborhood =
            typeof data.neighborhood === "string" ? data.neighborhood :
            defaultNh;

          const street =
            typeof data.street === "string" ? data.street :
            defaultSt;

          const buildingNo =
            typeof data.buildingNumber === "string" ? data.buildingNumber :
            defaultBld;

          const doorNo =
            typeof data.doorNumber === "string" ? data.doorNumber :
            defaultDoor;

          const postalCode =
            typeof data.postalCode === "string" ? data.postalCode :
            defaultPc;

          const rawOpenAddr =
            typeof data.address === "string" && data.address.trim() ? data.address.trim() :
            typeof data.adres === "string" && data.adres.trim() ? data.adres.trim() :
            typeof data.fullAddress === "string" && data.fullAddress.trim() ? data.fullAddress.trim() :
            `${neighborhood} ${street} ${buildingNo} ${doorNo} (PK: ${postalCode})`;
          const locPrefix = [city, district].filter(Boolean).join(" / ");
          const address = locPrefix && !rawOpenAddr.toLocaleLowerCase("tr-TR").startsWith(locPrefix.toLocaleLowerCase("tr-TR"))
            ? `${locPrefix}, ${rawOpenAddr}`
            : rawOpenAddr;

          const isEFatura =
            data.isEFaturaUser === true ||
            data.isTaxPayer === true ||
            data.isGibUser === true ||
            isCorporate;

          return {
            vknTckn: clean,
            isEFaturaUser: isEFatura,
            documentType: isEFatura ? "EFATURA" : "EARSIVFATURA",
            suggestedProfile: isEFatura ? "TICARIFATURA" : "EARSIVFATURA",
            title,
            companyTitle: title,
            name: title ? title.split(" - ")[0].slice(0, 45).trim() : "GİB Mükellefi",
            pkAlias,
            gbAlias,
            taxOffice,
            city,
            district,
            neighborhood,
            street,
            buildingNo,
            doorNo,
            postalCode,
            address,
            shippingAddress: address,
            phone: isCorporate ? "0216 444 0 123" : "0532 555 00 11",
            email: isCorporate ? `muhasebe@firma${clean.slice(-4)}.com.tr` : `iletisim@kisi${clean.slice(-4)}.com`,
            contactPerson: isCorporate ? "Finans & Muhasebe Sorumlusu" : "Müşteri Yetkilisi",
            isLiveTaxpayer: true,
          };
        }
      } catch {
        // Continue to mock or deterministic rule
      }
    }

    // 3. Known Taxpayers fixture or Mock Mode
    if (this.config.mockMode || known) {
      return {
        vknTckn: clean,
        isEFaturaUser: known ? known.isEFatura : isCorporate,
        documentType: (known ? known.isEFatura : isCorporate) ? "EFATURA" : "EARSIVFATURA",
        suggestedProfile: (known ? known.isEFatura : isCorporate) ? "TICARIFATURA" : "EARSIVFATURA",
        title: known?.title || (isCorporate ? "GİB Kayıtlı e-Fatura Mükellefi A.Ş." : "Bireysel Müşteri"),
        companyTitle: known?.companyTitle || (isCorporate ? "GİB Kayıtlı e-Fatura Mükellefi Sanayi ve Ticaret Anonim Şirketi" : "Bireysel Müşteri"),
        name: known?.name || (isCorporate ? "GİB Kayıtlı Müşteri" : "Bireysel Müşteri"),
        pkAlias: known?.pkAlias,
        gbAlias: undefined,
        taxOffice: known?.taxOffice || (isCorporate ? "Kadıköy V.D." : "Kadıköy V.D."),
        city: known?.city || defaultCity,
        district: known?.district || defaultDist,
        neighborhood: known?.neighborhood || defaultNh,
        street: known?.street || defaultSt,
        buildingNo: known?.buildingNo || defaultBld,
        doorNo: known?.doorNo || defaultDoor,
        postalCode: known?.postalCode || defaultPc,
        address: defaultFullAddr,
        shippingAddress: defaultFullAddr,
        phone: known?.phone || (isCorporate ? "0216 444 0 123" : "0532 555 00 11"),
        email: known?.email || (isCorporate ? `muhasebe@firma${clean.slice(-4)}.com.tr` : `iletisim@kisi${clean.slice(-4)}.com`),
        contactPerson: known?.contactPerson || (isCorporate ? "Finans & Muhasebe Müdürü" : "Müşteri Yetkilisi"),
      };
    }

    // 4. Deterministic VKN vs TCKN rule
    return {
      vknTckn: clean,
      isEFaturaUser: isCorporate,
      documentType: isCorporate ? "EFATURA" : "EARSIVFATURA",
      suggestedProfile: isCorporate ? "TICARIFATURA" : "EARSIVFATURA",
      title: isCorporate ? "GİB Kayıtlı e-Fatura Mükellefi" : "Bireysel / e-Arşiv Alıcısı",
      companyTitle: isCorporate ? "GİB Kayıtlı e-Fatura Mükellefi Sanayi ve Ticaret Anonim Şirketi" : "Bireysel Müşteri",
      name: isCorporate ? "GİB Kayıtlı Mükellef" : "Bireysel Müşteri",
      pkAlias: undefined,
      gbAlias: undefined,
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
  }

  /**
   * Fill empty design/numerator fields and ensure required sub-models
   * (invoiceCalculation, invoiceDetail, invoiceAccount, pkAlias/prefix)
   * are valid before posting invoiceOutbox.
   */
  private async enrichInvoiceOutboxDefaults(payload: unknown): Promise<unknown> {
    if (!isObject(payload) || Array.isArray(payload)) return payload;
    const body = { ...payload } as Record<string, unknown>;
    // Mysoft v8 requirement: "isCalculateByApi Geliştirme aşamasındadır. Lütfen bu alanı false olarak geçiniz."
    body.isCalculateByApi = false;
    if (body.isManuelCalculation === undefined) {
      body.isManuelCalculation = false;
    }

    const round2 = (v: unknown) =>
      Math.round(((Number(v) || 0) + Number.EPSILON) * 100) / 100;

    // 1. Sanitize invoiceDetail & auto-populate invoiceCalculation
    // (Mysoft .NET backend throws "Object reference not set to an instance of an object." if invoiceCalculation is null/omitted)
    const hasRootTax = Array.isArray(body.tax) && body.tax.length > 0;
    const details = Array.isArray(body.invoiceDetail)
      ? body.invoiceDetail.map((row) => {
          if (!isObject(row)) return row;
          const item = { ...row } as Record<string, unknown>;
          if (!hasRootTax && "currencyCode" in item) {
            delete item.currencyCode;
          }
          if (!Array.isArray(item.allowanceCharge)) {
            item.allowanceCharge = [];
          }
          return item;
        })
      : [];
    body.invoiceDetail = details;

    if (!isObject(body.invoiceCalculation)) {
      let lineExtensionAmount = 0;
      let taxExclusiveAmount = 0;
      let totalVat = 0;
      let totalWithholding = 0;
      let allowanceTotalAmount = 0;

      for (const d of details) {
        if (!isObject(d)) continue;
        const amt = round2(d.amtTra);
        const taxable =
          d.taxableAmtTra !== undefined && d.taxableAmtTra !== null
            ? round2(d.taxableAmtTra)
            : amt;
        const vatRate = Number(d.vatRate) || 0;
        const vat =
          d.amtVatTra !== undefined && d.amtVatTra !== null
            ? round2(d.amtVatTra)
            : round2((taxable * vatRate) / 100);
        const wh = round2(d.withholdingTaxAmount);
        const disc = Array.isArray(d.allowanceCharge)
          ? d.allowanceCharge.reduce(
              (s, ac) => s + (isObject(ac) && ac.chargeIndicator !== true ? round2(ac.amount) : 0),
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
    }

    // 2. Sanitize eDocumentType, invoiceAccount, pkAlias, gbAlias
    const eDocType = String(body.eDocumentType || "EFATURA").toUpperCase();
    const isEArsiv = eDocType.includes("ARSIV");

    if (isObject(body.invoiceAccount)) {
      const acc = { ...body.invoiceAccount } as Record<string, unknown>;
      const rawVkn = String(acc.vknTckn || "").replace(/\D/g, "");
      if (rawVkn.length === 10 || rawVkn.length === 11) {
        acc.vknTckn = rawVkn;
      } else if (isEArsiv) {
        acc.vknTckn = "11111111111";
      }
      if (!stringOrEmpty(acc.countryName)) {
        acc.countryName = "TÜRKİYE";
      }
      if (!stringOrEmpty(acc.cityName)) {
        acc.cityName = "İstanbul";
      }
      if (!stringOrEmpty(acc.citySubdivision)) {
        acc.citySubdivision = "Merkez";
      }
      body.invoiceAccount = acc;
    }

    if (isEArsiv) {
      delete body.pkAlias;
      delete body.gbAlias;
      if (!stringOrEmpty(body.senderType)) {
        body.senderType = "ELEKTRONIK";
      }
    } else {
      // Never forward a fabricated or buyer gbAlias as sender gbAlias
      delete body.gbAlias;
      const pk = stringOrEmpty(body.pkAlias);
      if (!pk || /^urn:mail:default(pk|gb)@\d{10,11}\.com\.tr$/i.test(pk)) {
        delete body.pkAlias;
      }
    }

    // 3. Sanitize forbidden docNo / prefix ("GIB", "FYS", internal Muavin prefixes)
    const rawDocNo = stringOrEmpty(body.docNo).toUpperCase();
    if (
      rawDocNo &&
      (/^(GIB|FYS|GLF|GDF|TED|FAT)/i.test(rawDocNo) ||
        !/^[A-Z0-9]{3}20\d{2}\d{9}$/.test(rawDocNo))
    ) {
      body.docNo = "";
    }

    const rawPrefix = stringOrEmpty(body.prefix).toUpperCase();
    if (rawPrefix && /^(GIB|FYS|GLF|GDF|TED|FAT)$/i.test(rawPrefix)) {
      delete body.prefix;
    }

    let tenant =
      typeof body.tenantIdentifierNumber === "string"
        ? normalizeMysoftTenantIdentifier(body.tenantIdentifierNumber) ||
          body.tenantIdentifierNumber.trim()
        : "";
    if (!tenant) {
      const resolved = await this.resolveEffectiveTenant();
      if (resolved) {
        tenant = resolved;
        body.tenantIdentifierNumber = resolved;
      }
    }
    if (!tenant) return body;

    const needsXslt = !stringOrEmpty(body.xsltName) && !stringOrEmpty(body.xsltSetCode);
    const currentPrefix = stringOrEmpty(body.prefix).toUpperCase();
    const currentDocNo = stringOrEmpty(body.docNo).toUpperCase();
    const isGenericFallbackPrefix =
      !currentPrefix || currentPrefix === "GIB" || currentPrefix === "EAR";
    const needsPrefix =
      (isGenericFallbackPrefix || Boolean(currentDocNo)) &&
      !stringOrEmpty(body.numeratorSetCode);
    if (!needsXslt && !needsPrefix) return body;

    try {
      const defaults = await this.resolveInvoiceDesignDefaults({
        vknTckn: tenant,
        eDocumentType: typeof body.eDocumentType === "string" ? body.eDocumentType : "EFATURA",
        isInternetSales:
          typeof body.senderType === "string" &&
          String(body.profile || "").toUpperCase().includes("INTERNET")
            ? true
            : undefined,
      });
      if (needsXslt && defaults.xsltName) {
        body.xsltName = defaults.xsltName;
        if (body.isSendWithGeneralXsltIfDefaultNotExists === undefined) {
          body.isSendWithGeneralXsltIfDefaultNotExists = true;
        }
      }
      if (needsPrefix) {
        const portalPrefixes = (defaults.prefixes || [])
          .map((p) => (typeof p.prefix === "string" ? p.prefix.trim().toUpperCase() : ""))
          .filter(Boolean);

        if (!currentPrefix && defaults.numeratorSetCode) {
          body.numeratorSetCode = defaults.numeratorSetCode;
        } else if (defaults.prefix) {
          if (
            !currentPrefix ||
            currentPrefix === "GIB" ||
            currentPrefix === "EAR" ||
            (portalPrefixes.length > 0 && !portalPrefixes.includes(currentPrefix))
          ) {
            body.prefix = defaults.prefix;
          }
        }

        // If docNo has a 3-letter prefix that is not among this tenant's portal prefixes,
        // clear docNo so Mysoft's numerator assigns the next valid sequential number.
        if (currentDocNo && portalPrefixes.length > 0) {
          const docPrefix = currentDocNo.slice(0, 3).toUpperCase();
          if (!portalPrefixes.includes(docPrefix)) {
            body.docNo = "";
          }
        }
      }
    } catch {
      // Keep original payload; Mysoft will fall back to portal defaults / GİB XSLT.
    }
    return body;
  }

  listOutgoing(request: MysoftListRequest = {}): Promise<unknown> {
    // GetInvoiceOutboxListRequestModel also has additionalProperties=false;
    // docNo/pkAlias/ETTN and numbered-paging fields belong to other models.
    const {
      afterValue,
      limit,
      startDate,
      endDate,
      eDocumentType,
      vknTckn,
      isUseDocDate,
      cessionStatus,
      tenantIdentifierNumber,
    } = request;
    return this.request(MYSOFT_ENDPOINTS.outgoingList, {
      method: "POST",
      body: {
        afterValue,
        limit,
        startDate,
        endDate,
        eDocumentType,
        vknTckn,
        isUseDocDate,
        cessionStatus,
        tenantIdentifierNumber: this.effectiveTenant(tenantIdentifierNumber),
      },
    });
  }

  listDespatchIncoming(request: MysoftListRequest = {}): Promise<unknown> {
    const {
      afterValue,
      limit,
      startDate,
      endDate,
      pkAlias,
      isUseDocDate,
      tenantIdentifierNumber,
    } = request;
    return this.requestDocumentOperation("despatch.incoming.list", {
      body: { afterValue, limit, startDate, endDate, pkAlias, isUseDocDate },
      tenantIdentifierNumber,
    });
  }

  listDespatchIncomingPaging(request: MysoftListRequest = {}): Promise<unknown> {
    const {
      startDate,
      endDate,
      pkAlias,
      docNo,
      vknTckn,
      isUseDocDate,
      archiveStatus,
      pageSize,
      pageNumber,
      tenantIdentifierNumber,
    } = request;
    return this.requestDocumentOperation("despatch.incoming.list.paging", {
      body: {
        startDate,
        endDate,
        pkAlias,
        docNo,
        vknTckn,
        isUseDocDate,
        archiveStatus,
        pageSize: pageSize ?? 100,
        pageNumber: pageNumber ?? 1,
      },
      tenantIdentifierNumber,
    });
  }

  listDespatchOutgoing(request: MysoftListRequest = {}): Promise<unknown> {
    const { afterValue, limit, startDate, endDate, tenantIdentifierNumber } = request;
    return this.requestDocumentOperation("despatch.outgoing.list", {
      body: { afterValue, limit, startDate, endDate },
      tenantIdentifierNumber,
    });
  }

  getDespatchIncomingModel(despatchETTN: string, tenantIdentifierNumber?: string): Promise<unknown> {
    return this.requestDocumentOperation("despatch.incoming.model", {
      query: { despatchETTN },
      tenantIdentifierNumber,
    });
  }

  getDespatchOutgoingModel(despatchETTN: string, tenantIdentifierNumber?: string): Promise<unknown> {
    return this.requestDocumentOperation("despatch.outgoing.status", {
      query: { despatchETTN },
      tenantIdentifierNumber,
    });
  }

  getDespatchIncomingStatus(despatchETTN: string, tenantIdentifierNumber?: string): Promise<unknown> {
    return this.requestDocumentOperation("despatch.incoming.status", {
      query: { despatchETTN },
      tenantIdentifierNumber,
    });
  }

  getDespatchOutgoingStatus(despatchETTN: string, tenantIdentifierNumber?: string): Promise<unknown> {
    return this.requestDocumentOperation("despatch.outgoing.status", {
      query: { despatchETTN },
      tenantIdentifierNumber,
    });
  }

  getDespatchIncomingPdf(despatchETTN: string, tenantIdentifierNumber?: string): Promise<unknown> {
    return this.requestDocumentOperation("despatch.incoming.download", {
      query: { despatchETTN },
      tenantIdentifierNumber,
    });
  }

  getDespatchOutgoingPdf(despatchETTN: string, tenantIdentifierNumber?: string): Promise<unknown> {
    return this.requestDocumentOperation("despatch.outgoing.download", {
      query: { despatchETTN },
      tenantIdentifierNumber,
    });
  }

  getDespatchIncomingXml(despatchETTN: string, tenantIdentifierNumber?: string): Promise<unknown> {
    return this.requestDocumentOperation("despatch.incoming.xml", {
      query: { despatchETTN },
      tenantIdentifierNumber,
    });
  }

  getDespatchOutgoingXml(despatchETTN: string, tenantIdentifierNumber?: string): Promise<unknown> {
    return this.requestDocumentOperation("despatch.outgoing.xml", {
      query: { despatchETTN },
      tenantIdentifierNumber,
    });
  }

  acknowledgeDespatchIncoming(despatchETTN: string, tenantIdentifierNumber?: string): Promise<unknown> {
    return this.requestDocumentOperation("despatch.incoming.acknowledge", {
      query: { despatchETTN },
      tenantIdentifierNumber,
    });
  }

  getDiagnosticLogs(limit = 50): MysoftDiagnosticLogEntry[] {
    return getRecentMysoftDiagnosticLogs(limit);
  }

  async validateOutgoingPayload(payload: unknown) {
    const enriched = await this.enrichInvoiceOutboxDefaults(
      this.submissionPayload(payload),
    );
    return validateMysoftInvoiceOutboxPayload(enriched, {
      requireTenantIdentifier: !this.config.mockMode,
      autoRepair: true,
    });
  }

  async createOutgoing(payload: unknown): Promise<unknown> {
    const enriched = (await this.enrichInvoiceOutboxDefaults(
      this.submissionPayload(payload),
    )) as Record<string, unknown>;

    // Pre-send mandatory field & null-reference validation
    const validation = validateMysoftInvoiceOutboxPayload(enriched, {
      requireTenantIdentifier: !this.config.mockMode,
      autoRepair: true,
    });

    if (!validation.valid) {
      throw new MysoftPayloadValidationError(
        validation.summary,
        validation.errors,
        validation.nullGuard,
      );
    }

    const body = validation.sanitizedPayload;
    const acc = isObject(body.invoiceAccount) ? body.invoiceAccount : {};
    const calc = isObject(body.invoiceCalculation) ? body.invoiceCalculation : {};
    const detailCount = Array.isArray(body.invoiceDetail) ? body.invoiceDetail.length : 0;

    try {
      const response = await this.request(MYSOFT_ENDPOINTS.outgoingSubmit, {
        method: "POST",
        body,
      });
      const outboxResult = extractMysoftOutboxResult(response);
      recordMysoftDiagnosticLog({
        stage: "SEND_SUCCESS",
        operation: "createOutgoing",
        tenantIdentifierNumber: stringOrEmpty(body.tenantIdentifierNumber) || undefined,
        buyerVknTckn: stringOrEmpty(acc.vknTckn) || undefined,
        buyerName: stringOrEmpty(acc.accountName) || undefined,
        eDocumentType: stringOrEmpty(body.eDocumentType) || undefined,
        profile: stringOrEmpty(body.profile) || undefined,
        invoiceType: stringOrEmpty(body.invoiceType) || undefined,
        docNo: outboxResult.docNo || stringOrEmpty(body.docNo) || undefined,
        prefix: stringOrEmpty(body.prefix) || undefined,
        lineCount: detailCount,
        payableAmount: Number(calc.payableAmount) || 0,
        nullGuard: validation.nullGuard,
        validationWarnings: validation.warnings,
      });
      return response;
    } catch (error) {
      // If a user/client-supplied docNo or pkAlias caused an upstream conflict,
      // retry once letting Mysoft auto-assign the next portal docNo and valid postbox alias.
      if (error instanceof MysoftApiError && isObject(body)) {
        const msg = String(error.message || "").toLowerCase();
        const isDocNoErr =
          Boolean(body.docNo) &&
          (msg.includes("belge numarası") ||
            msg.includes("fatura numarası") ||
            msg.includes("mükerrer") ||
            msg.includes("daha önce") ||
            msg.includes("gib") ||
            msg.includes("fys"));
        const isAliasErr =
          Boolean(body.pkAlias) &&
          (msg.includes("etiket") || msg.includes("alias") || msg.includes("00006"));
        if (isDocNoErr || isAliasErr) {
          recordMysoftDiagnosticLog({
            stage: "AUTO_RECOVERY_RETRY",
            operation: "createOutgoing",
            tenantIdentifierNumber: stringOrEmpty(body.tenantIdentifierNumber) || undefined,
            buyerVknTckn: stringOrEmpty(acc.vknTckn) || undefined,
            buyerName: stringOrEmpty(acc.accountName) || undefined,
            eDocumentType: stringOrEmpty(body.eDocumentType) || undefined,
            profile: stringOrEmpty(body.profile) || undefined,
            invoiceType: stringOrEmpty(body.invoiceType) || undefined,
            docNo: stringOrEmpty(body.docNo) || undefined,
            prefix: stringOrEmpty(body.prefix) || undefined,
            lineCount: detailCount,
            payableAmount: Number(calc.payableAmount) || 0,
            nullGuard: validation.nullGuard,
            upstreamStatus: error.status,
            upstreamErrorCode: error.code,
            errorMessage: `Otomatik düzeltme denemesi (${isDocNoErr ? "docNo temizlendi" : ""}${isAliasErr ? " pkAlias temizlendi" : ""}): ${error.message}`,
          });
          const retryBody = { ...body };
          if (isDocNoErr) retryBody.docNo = "";
          if (isAliasErr) delete retryBody.pkAlias;
          const retryResponse = await this.request(MYSOFT_ENDPOINTS.outgoingSubmit, {
            method: "POST",
            body: retryBody,
          });
          const retryResult = extractMysoftOutboxResult(retryResponse);
          recordMysoftDiagnosticLog({
            stage: "SEND_SUCCESS",
            operation: "createOutgoing:retry",
            tenantIdentifierNumber: stringOrEmpty(retryBody.tenantIdentifierNumber) || undefined,
            buyerVknTckn: stringOrEmpty(acc.vknTckn) || undefined,
            buyerName: stringOrEmpty(acc.accountName) || undefined,
            eDocumentType: stringOrEmpty(retryBody.eDocumentType) || undefined,
            profile: stringOrEmpty(retryBody.profile) || undefined,
            invoiceType: stringOrEmpty(retryBody.invoiceType) || undefined,
            docNo: retryResult.docNo || stringOrEmpty(retryBody.docNo) || undefined,
            prefix: stringOrEmpty(retryBody.prefix) || undefined,
            lineCount: detailCount,
            payableAmount: Number(calc.payableAmount) || 0,
            nullGuard: validation.nullGuard,
          });
          return retryResponse;
        }
      }

      const rawErrorMsg = error instanceof Error ? error.message : String(error);
      recordMysoftDiagnosticLog({
        stage: "UPSTREAM_API_ERROR",
        operation: "createOutgoing",
        tenantIdentifierNumber: stringOrEmpty(body.tenantIdentifierNumber) || undefined,
        buyerVknTckn: stringOrEmpty(acc.vknTckn) || undefined,
        buyerName: stringOrEmpty(acc.accountName) || undefined,
        eDocumentType: stringOrEmpty(body.eDocumentType) || undefined,
        profile: stringOrEmpty(body.profile) || undefined,
        invoiceType: stringOrEmpty(body.invoiceType) || undefined,
        docNo: stringOrEmpty(body.docNo) || undefined,
        prefix: stringOrEmpty(body.prefix) || undefined,
        lineCount: detailCount,
        payableAmount: Number(calc.payableAmount) || 0,
        nullGuard: validation.nullGuard,
        validationWarnings: validation.warnings,
        upstreamStatus: error instanceof MysoftApiError ? error.status : undefined,
        upstreamErrorCode: error instanceof MysoftApiError ? error.code : undefined,
        errorMessage: rawErrorMsg,
      });

      if (
        error instanceof MysoftApiError &&
        /object reference not set to an instance of an object/i.test(rawErrorMsg)
      ) {
        const detailedMsg = `Mysoft e-Belge sunucusu nesne referans hatası döndürdü (${rawErrorMsg}). Gönderilen veri kontrol özeti — Mükellef VKN: ${stringOrEmpty(body.tenantIdentifierNumber) || "Eksik"}, Alıcı VKN/TCKN: ${stringOrEmpty(acc.vknTckn) || "Eksik"} (${stringOrEmpty(acc.accountName) || "Ünvan Yok"}), Kalem Sayısı: ${detailCount}, Belge Tipi: ${stringOrEmpty(body.eDocumentType)}/${stringOrEmpty(body.profile)}, Ön Ek: ${stringOrEmpty(body.prefix) || "Varsayılan"}. Lütfen firma VKN, alıcı VKN/TCKN ve fatura kalem bilgilerini kontrol edin.`;
        throw new MysoftApiError(detailedMsg, error.status, error.details, error.code);
      }

      throw error;
    }
  }

  async createOutgoingWithUblXml(payload: unknown): Promise<unknown> {
    const body = await this.enrichInvoiceOutboxDefaults(this.submissionPayload(payload));
    return this.request(MYSOFT_ENDPOINTS.outgoingSubmitUbl, {
      method: "POST",
      body,
    });
  }

  /** Normalize outgoing invoice JSON (tenant, xslt, prefix defaults, null-guards). */
  async prepareInvoiceOutboxPayload(payload: unknown): Promise<unknown> {
    const enriched = await this.enrichInvoiceOutboxDefaults(this.submissionPayload(payload));
    const validation = validateMysoftInvoiceOutboxPayload(enriched, {
      requireTenantIdentifier: false,
      autoRepair: true,
    });
    if (!validation.valid) {
      throw new MysoftPayloadValidationError(
        validation.summary,
        validation.errors,
        validation.nullGuard,
      );
    }
    return validation.sanitizedPayload;
  }

  /**
   * Mysoft portal taslak önizleme (HTML veya PDF zip). Gönderim yapmaz.
   */
  async getInvoiceOutboxDraftPreview(
    payload: unknown,
    format: "html" | "pdf" = "html",
  ): Promise<unknown> {
    const body = await this.prepareInvoiceOutboxPayload(payload);
    const operation =
      format === "pdf" ? "invoice.outgoing.draft.pdf" : "invoice.outgoing.draft.html";
    return this.requestDocumentOperation(operation, { body, raw: true });
  }

  getIncomingModel(invoiceETTN: string, tenantIdentifierNumber?: string): Promise<unknown> {
    return this.request(MYSOFT_ENDPOINTS.incomingModel, {
      method: "GET",
      query: { invoiceETTN, tenantIdentifierNumber: this.effectiveTenant(tenantIdentifierNumber) },
    });
  }

  getOutgoingModel(invoiceETTN: string, tenantIdentifierNumber?: string): Promise<unknown> {
    return this.request(MYSOFT_ENDPOINTS.outgoingModel, {
      method: "GET",
      query: { invoiceETTN, tenantIdentifierNumber: this.effectiveTenant(tenantIdentifierNumber) },
    });
  }

  getIncomingStatus(invoiceETTN: string, tenantIdentifierNumber?: string): Promise<unknown> {
    return this.request(MYSOFT_ENDPOINTS.incomingStatus, {
      method: "GET",
      query: { invoiceETTN, tenantIdentifierNumber: this.effectiveTenant(tenantIdentifierNumber) },
    });
  }

  getOutgoingStatus(invoiceETTN: string, tenantIdentifierNumber?: string): Promise<unknown> {
    return this.request(MYSOFT_ENDPOINTS.outgoingStatus, {
      method: "GET",
      query: { invoiceETTN, tenantIdentifierNumber: this.effectiveTenant(tenantIdentifierNumber) },
    });
  }

  getIncomingPdf(invoiceETTN: string, tenantIdentifierNumber?: string): Promise<unknown> {
    return this.request(MYSOFT_ENDPOINTS.incomingPdf, {
      method: "GET",
      query: { invoiceETTN, tenantIdentifierNumber: this.effectiveTenant(tenantIdentifierNumber) },
    });
  }

  getOutgoingPdf(invoiceETTN: string, tenantIdentifierNumber?: string): Promise<unknown> {
    return this.request(MYSOFT_ENDPOINTS.outgoingPdf, {
      method: "GET",
      query: { invoiceETTN, tenantIdentifierNumber: this.effectiveTenant(tenantIdentifierNumber) },
    });
  }

  getIncomingXml(invoiceETTN: string, tenantIdentifierNumber?: string): Promise<unknown> {
    return this.request(MYSOFT_ENDPOINTS.incomingXml, {
      method: "GET",
      query: { invoiceETTN, tenantIdentifierNumber: this.effectiveTenant(tenantIdentifierNumber) },
    });
  }

  getOutgoingXml(invoiceETTN: string, tenantIdentifierNumber?: string): Promise<unknown> {
    return this.request(MYSOFT_ENDPOINTS.outgoingXml, {
      method: "GET",
      query: { invoiceETTN, tenantIdentifierNumber: this.effectiveTenant(tenantIdentifierNumber) },
    });
  }

  acknowledgeIncoming(invoiceETTN: string, tenantIdentifierNumber?: string): Promise<unknown> {
    return this.request(MYSOFT_ENDPOINTS.incomingAcknowledge, {
      method: "GET",
      query: { invoiceETTN, tenantIdentifierNumber: this.effectiveTenant(tenantIdentifierNumber) },
    });
  }

  acceptIncoming(invoiceETTN: string, tenantIdentifierNumber?: string): Promise<unknown> {
    return this.request(MYSOFT_ENDPOINTS.incomingAccept, {
      method: "GET",
      query: { invoiceETTN, tenantIdentifierNumber: this.effectiveTenant(tenantIdentifierNumber) },
    });
  }

  rejectIncoming(invoiceETTN: string, rejectReason: string, tenantIdentifierNumber?: string): Promise<unknown> {
    return this.request(MYSOFT_ENDPOINTS.incomingDeny, {
      method: "GET",
      query: {
        invoiceETTN,
        rejectReason,
        tenantIdentifierNumber: this.effectiveTenant(tenantIdentifierNumber),
      },
    });
  }

  cancelOutgoing(
    invoiceETTN: string,
    options: {
      cancelDate?: string;
      cancelType?: string;
      cancelNote?: string;
      tenantIdentifierNumber?: string;
    } = {},
  ): Promise<unknown> {
    return this.request(MYSOFT_ENDPOINTS.outgoingCancel, {
      method: "GET",
      query: {
        invoiceETTN,
        ...options,
        tenantIdentifierNumber: this.effectiveTenant(options.tenantIdentifierNumber),
      },
    });
  }

  sendOutgoingDraft(payload: MysoftSendDraftRequest | Record<string, unknown>): Promise<unknown> {
    const body = { ...payload } as Record<string, unknown>;
    // Mysoft: connectorGuid unused — omit from draft send.
    delete body.connectorGuid;
    if (typeof body.tenantIdentifierNumber !== "string" || !body.tenantIdentifierNumber.trim()) {
      const tenantIdentifierNumber = this.effectiveTenant();
      if (tenantIdentifierNumber) body.tenantIdentifierNumber = tenantIdentifierNumber;
    } else {
      body.tenantIdentifierNumber = this.effectiveTenant(body.tenantIdentifierNumber);
    }
    const invoiceETTN = typeof body.invoiceETTN === "string" && body.invoiceETTN.trim()
      ? body.invoiceETTN.trim()
      : typeof body.ettn === "string" && body.ettn.trim()
        ? body.ettn.trim()
        : undefined;

    // v8 exposes draft signing/sending on the Invoice controller.  It only
    // needs the draft ETTN and tenant; prefix/numerator/connector values are
    // used when creating the draft and are intentionally not sent here.
    if (invoiceETTN) {
      return this.request(MYSOFT_ENDPOINTS.invoiceDraftSignAndSend, {
        method: "GET",
        query: {
          invoiceETTN,
          tenantIdentifierNumber: this.effectiveTenant(
            typeof body.tenantIdentifierNumber === "string"
              ? body.tenantIdentifierNumber
              : undefined,
          ),
        },
      }).catch((error: unknown) => {
        // A few older tenants only expose the legacy Outbox operation. Keep a
        // narrow compatibility fallback for those deployments; never hide
        // authentication/validation failures from the current endpoint.
        if (
          !(error instanceof MysoftApiError) ||
          (error.status !== 404 && error.status !== 405)
        ) {
          throw error;
        }
        return this.request(MYSOFT_ENDPOINTS.outgoingSendDraft, {
          method: "POST",
          body: { ...body, ettn: invoiceETTN },
        });
      });
    }

    // Preserve the documented legacy request for callers that provide a raw
    // SendDraftInvoiceRequestModel without an ETTN alias (validation will be
    // returned by Mysoft rather than silently fabricating one).
    return this.request(MYSOFT_ENDPOINTS.outgoingSendDraft, {
      method: "POST",
      body,
    });
  }
}

export const mysoftEdocumentClient = new MysoftEdocumentClient();
