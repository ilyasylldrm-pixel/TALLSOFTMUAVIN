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
  private effectiveTenant(value?: string): string | undefined {
    return (
      normalizeMysoftTenantIdentifier(value) ||
      normalizeMysoftTenantIdentifier(this.config.tenantIdentifierNumber)
    );
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
        vknTckn: options.vknTckn.trim(),
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
    const vkn = normalizeMysoftTenantIdentifier(options.vknTckn) || options.vknTckn.trim();
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
   * Check if a recipient VKN/TCKN is a registered GİB e-Fatura taxpayer.
   * Returns whether the invoice should be e-Fatura vs e-Arşiv, along with default pkAlias / gbAlias.
   */
  async checkRecipientTaxpayer(vknTckn: string): Promise<{
    vknTckn: string;
    isEFaturaUser: boolean;
    documentType: "EFATURA" | "EARSIVFATURA";
    suggestedProfile: "TICARIFATURA" | "TEMELFATURA" | "EARSIVFATURA";
    title?: string;
    pkAlias?: string;
    gbAlias?: string;
    taxOffice?: string;
    city?: string;
  }> {
    const clean = String(vknTckn || "").replace(/\D/g, "").trim();
    if (!clean || (clean.length !== 10 && clean.length !== 11)) {
      return {
        vknTckn: clean,
        isEFaturaUser: false,
        documentType: "EARSIVFATURA",
        suggestedProfile: "EARSIVFATURA",
      };
    }

    if (this.config.mockMode) {
      // In mock/demo mode: 10-digit VKNs simulate corporate e-Fatura taxpayers
      const isCorporate = clean.length === 10;
      return {
        vknTckn: clean,
        isEFaturaUser: isCorporate,
        documentType: isCorporate ? "EFATURA" : "EARSIVFATURA",
        suggestedProfile: isCorporate ? "TICARIFATURA" : "EARSIVFATURA",
        title: isCorporate ? "GİB Kayıtlı e-Fatura Mükellefi" : "Bireysel / e-Arşiv Alıcısı",
        pkAlias: isCorporate ? `urn:mail:defaultpk@${clean}.com.tr` : undefined,
        gbAlias: isCorporate ? `urn:mail:defaultgb@${clean}.com.tr` : undefined,
      };
    }

    try {
      // 1. Try tenantInfo or tenantWithIdentifier
      const info = (await this.getTenantInfo(clean)) as Record<string, unknown> | null;
      if (info && info.succeed !== false) {
        const data = (info.data || info) as Record<string, unknown>;
        const title = typeof data.unvan === "string" ? data.unvan : typeof data.title === "string" ? data.title : typeof data.companyName === "string" ? data.companyName : undefined;
        const pkAlias = typeof data.pkAlias === "string" ? data.pkAlias : `urn:mail:defaultpk@${clean}.com.tr`;
        const gbAlias = typeof data.gbAlias === "string" ? data.gbAlias : `urn:mail:defaultgb@${clean}.com.tr`;
        return {
          vknTckn: clean,
          isEFaturaUser: true,
          documentType: "EFATURA",
          suggestedProfile: "TICARIFATURA",
          title,
          pkAlias,
          gbAlias,
          taxOffice: typeof data.taxOffice === "string" ? data.taxOffice : undefined,
          city: typeof data.city === "string" ? data.city : undefined,
        };
      }
    } catch {
      // If lookup fails or not found, fallback to e-Arşiv
    }

    // Default when not in e-Fatura registry: e-Arşiv
    return {
      vknTckn: clean,
      isEFaturaUser: false,
      documentType: "EARSIVFATURA",
      suggestedProfile: "EARSIVFATURA",
    };
  }

  /**
   * Fill empty design/numerator fields from the customer's Mysoft portal
   * defaults before posting invoiceOutbox. Explicit payload values win.
   */
  private async enrichInvoiceOutboxDefaults(payload: unknown): Promise<unknown> {
    if (!isObject(payload) || Array.isArray(payload)) return payload;
    const body = { ...payload } as Record<string, unknown>;
    const tenant =
      typeof body.tenantIdentifierNumber === "string"
        ? normalizeMysoftTenantIdentifier(body.tenantIdentifierNumber) ||
          body.tenantIdentifierNumber.trim()
        : "";
    if (!tenant) return body;

    const needsXslt = !stringOrEmpty(body.xsltName) && !stringOrEmpty(body.xsltSetCode);
    const needsPrefix =
      !stringOrEmpty(body.prefix) &&
      !stringOrEmpty(body.numeratorSetCode) &&
      !stringOrEmpty(body.docNo);
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
        if (defaults.numeratorSetCode) {
          body.numeratorSetCode = defaults.numeratorSetCode;
        } else if (defaults.prefix) {
          body.prefix = defaults.prefix;
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

  async createOutgoing(payload: unknown): Promise<unknown> {
    const body = await this.enrichInvoiceOutboxDefaults(this.submissionPayload(payload));
    return this.request(MYSOFT_ENDPOINTS.outgoingSubmit, {
      method: "POST",
      body,
    });
  }

  async createOutgoingWithUblXml(payload: unknown): Promise<unknown> {
    const body = await this.enrichInvoiceOutboxDefaults(this.submissionPayload(payload));
    return this.request(MYSOFT_ENDPOINTS.outgoingSubmitUbl, {
      method: "POST",
      body,
    });
  }

  /** Normalize outgoing invoice JSON (tenant, xslt, prefix defaults). */
  async prepareInvoiceOutboxPayload(payload: unknown): Promise<unknown> {
    return this.enrichInvoiceOutboxDefaults(this.submissionPayload(payload));
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
