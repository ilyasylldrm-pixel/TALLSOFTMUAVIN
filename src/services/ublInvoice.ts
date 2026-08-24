import type { CompanySettings, Contact, EDocumentType, Invoice, InvoiceItem } from "../types";

/** Escape text placed in an XML node or attribute. */
export function xmlEscape(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const text = (value: unknown, fallback = "") => xmlEscape(value ?? fallback);
const numberValue = (value: unknown, fallback = 0) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/** UBL amounts are decimal values with a period and no locale separators. */
export function formatUblAmount(value: unknown): string {
  return numberValue(value).toFixed(2);
}

const normalizeTaxNumber = (value?: string) =>
  String(value || "").replace(/\D/g, "").slice(0, 11);

const uuidFallback = () => {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // Older browsers may not expose crypto.randomUUID.
  }
  const random = Math.random().toString(16).slice(2).padEnd(32, "0");
  return `${random.slice(0, 8)}-${random.slice(8, 12)}-4${random.slice(13, 16)}-a${random.slice(17, 20)}-${random.slice(20, 32)}`;
};

export interface UblInvoiceBuildOptions {
  invoice: Partial<Invoice> & Record<string, unknown>;
  company: Partial<CompanySettings> & Record<string, unknown>;
  contact?: Partial<Contact> & Record<string, unknown>;
  /** e-Fatura profile (TEMELFATURA/TICARIFATURA) or EARSIVFATURA. */
  profile?: string;
  eDocumentType?: EDocumentType | string;
  uuid?: string;
}

const partyAddress = (party: Record<string, unknown>, fallbackCountry = "Türkiye") => {
  const address = String(party.address || "");
  const street = String(party.street || "");
  const buildingNo = String(party.buildingNo || "");
  const district = String(party.district || "");
  const city = String(party.city || "");
  const postalCode = String(party.postalCode || "");
  const country = String(party.country || fallbackCountry);
  const lines = [
    address || [street, buildingNo].filter(Boolean).join(" "),
    district,
    city,
    postalCode,
  ];
  return `<cac:PostalAddress>${lines[0] ? `<cbc:StreetName>${text(lines[0])}</cbc:StreetName>` : ""}${lines[1] ? `<cbc:CitySubdivisionName>${text(lines[1])}</cbc:CitySubdivisionName>` : ""}${lines[2] ? `<cbc:CityName>${text(lines[2])}</cbc:CityName>` : ""}${lines[3] ? `<cbc:PostalZone>${text(lines[3])}</cbc:PostalZone>` : ""}<cac:Country><cbc:Name>${text(country)}</cbc:Name></cac:Country></cac:PostalAddress>`;
};

const partyXml = (
  party: Record<string, unknown>,
  role: "supplier" | "customer",
  fallbackName: string,
  fallbackTaxNumber = "",
) => {
  const name = String(party.companyTitle || party.companyName || party.name || fallbackName);
  const taxNumber = normalizeTaxNumber(String(party.taxNumber || fallbackTaxNumber));
  const taxScheme = taxNumber.length === 10 ? "VKN" : "TCKN";
  const endpoint = String(party.email || "");
  const legal = `<cac:PartyName><cbc:Name>${text(name)}</cbc:Name></cac:PartyName>`;
  const id = taxNumber
    ? `<cac:PartyIdentification><cbc:ID schemeID="${taxScheme}">${text(taxNumber)}</cbc:ID></cac:PartyIdentification>`
    : "";
  const contact = endpoint
    ? `<cac:Contact><cbc:ElectronicMail>${text(endpoint)}</cbc:ElectronicMail></cac:Contact>`
    : "";
  const taxOffice = String(party.taxOffice || "");
  const tax = taxNumber
    ? `<cac:PartyTaxScheme><cbc:TaxLevelCode>${taxScheme}</cbc:TaxLevelCode><cac:TaxScheme><cbc:Name>${text(taxOffice || "Vergi Dairesi")}</cbc:Name></cac:TaxScheme></cac:PartyTaxScheme>`
    : "";
  const registration = role === "supplier" && party.tradeRegisterNo
    ? `<cac:PartyLegalEntity><cbc:CompanyID>${text(party.tradeRegisterNo)}</cbc:CompanyID><cbc:RegistrationName>${text(name)}</cbc:RegistrationName></cac:PartyLegalEntity>`
    : `<cac:PartyLegalEntity><cbc:RegistrationName>${text(name)}</cbc:RegistrationName></cac:PartyLegalEntity>`;
  return `<cac:${role === "supplier" ? "AccountingSupplierParty" : "AccountingCustomerParty"}><cac:Party>${id}${legal}${partyAddress(party)}${tax}${registration}${contact}</cac:Party></cac:${role === "supplier" ? "AccountingSupplierParty" : "AccountingCustomerParty"}>`;
};

const unitCode = (unit?: string) => {
  const value = String(unit || "Adet").toLocaleLowerCase("tr-TR");
  if (/kg|kilogram/.test(value)) return "KGM";
  if (/saat|hour/.test(value)) return "HUR";
  if (/ay|month/.test(value)) return "MON";
  if (/metre|meter|mt/.test(value)) return "MTR";
  if (/litre|liter|lt/.test(value)) return "LTR";
  return "C62";
};

const lineXml = (item: InvoiceItem, index: number, currency: string) => {
  const qty = numberValue(item.quantity, 1);
  const price = numberValue(item.unitPrice);
  const withoutVat = numberValue(item.totalWithoutVat, qty * price);
  const vat = numberValue(item.vatAmount, withoutVat * numberValue(item.vatRate, 20) / 100);
  const vatRate = numberValue(item.vatRate, 20);
  const description = item.description || "Mal / Hizmet";
  return `<cac:InvoiceLine><cbc:ID>${index}</cbc:ID><cbc:InvoicedQuantity unitCode="${unitCode(item.unit)}">${qty}</cbc:InvoicedQuantity><cbc:LineExtensionAmount currencyID="${text(currency)}">${formatUblAmount(withoutVat)}</cbc:LineExtensionAmount><cac:TaxTotal><cbc:TaxAmount currencyID="${text(currency)}">${formatUblAmount(vat)}</cbc:TaxAmount><cac:TaxSubtotal><cbc:TaxableAmount currencyID="${text(currency)}">${formatUblAmount(withoutVat)}</cbc:TaxableAmount><cbc:TaxAmount currencyID="${text(currency)}">${formatUblAmount(vat)}</cbc:TaxAmount><cbc:Percent>${formatUblAmount(vatRate)}</cbc:Percent><cac:TaxCategory><cac:TaxScheme><cbc:Name>KDV</cbc:Name><cbc:TaxTypeCode>0015</cbc:TaxTypeCode></cac:TaxScheme></cac:TaxCategory></cac:TaxSubtotal></cac:TaxTotal><cac:Item><cbc:Description>${text(description)}</cbc:Description><cbc:Name>${text(description)}</cbc:Name>${item.productId ? `<cac:SellersItemIdentification><cbc:ID>${text(item.productId)}</cbc:ID></cac:SellersItemIdentification>` : ""}<cac:ClassifiedTaxCategory><cbc:ID>${vatRate > 0 ? "S" : "E"}</cbc:ID><cbc:Percent>${formatUblAmount(vatRate)}</cbc:Percent><cac:TaxScheme><cbc:Name>KDV</cbc:Name><cbc:TaxTypeCode>0015</cbc:TaxTypeCode></cac:TaxScheme></cac:ClassifiedTaxCategory></cac:Item><cac:Price><cbc:PriceAmount currencyID="${text(currency)}">${formatUblAmount(price)}</cbc:PriceAmount></cac:Price></cac:InvoiceLine>`;
};

/** Build a UBL 2.1 invoice XML document suitable for Mysoft's UBL endpoint. */
export function buildUblInvoiceXml(options: UblInvoiceBuildOptions): string {
  const invoice = options.invoice || {};
  const company = options.company || {};
  const contact = options.contact || {};
  const type = String(options.eDocumentType || invoice.eDocumentType || "e_fatura")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const isArchive = ["e_arsiv", "earsiv", "earsivfatura", "e-arsiv"].includes(type);
  const profile = isArchive ? "EARSIVFATURA" : String(options.profile || "TEMELFATURA").toUpperCase();
  const currency = String(invoice.currency || company.currency || "TRY").replace("₺", "TRY");
  const id = String(invoice.invoiceNumber || invoice.id || `MUV${new Date().getFullYear()}${Date.now()}`).replace(/\s+\(.*?\)$/, "");
  const uuid = String(options.uuid || invoice.eDocumentEttn || uuidFallback());
  const issueDate = String(invoice.issueDate || new Date().toISOString().slice(0, 10)).slice(0, 10);
  const invoiceTypeCode = String(invoice.type || "sales") === "purchase" ? "IADE" : "SATIS";
  const items = Array.isArray(invoice.items) ? invoice.items as InvoiceItem[] : [];
  const subtotal = numberValue(invoice.subtotal, items.reduce((sum, item) => sum + numberValue(item.totalWithoutVat, numberValue(item.quantity, 1) * numberValue(item.unitPrice)), 0));
  const vatTotal = numberValue(invoice.totalVat, items.reduce((sum, item) => sum + numberValue(item.vatAmount, 0), 0));
  const grandTotal = numberValue(invoice.grandTotal, subtotal + vatTotal);
  const note = invoice.notes ? `<cbc:Note>${text(invoice.notes)}</cbc:Note>` : "";
  const delivery = invoice.dueDate && invoice.dueDate !== issueDate
    ? `<cac:PaymentTerms><cbc:Note>Vade tarihi: ${text(invoice.dueDate)}</cbc:Note><cbc:PaymentDueDate>${text(invoice.dueDate)}</cbc:PaymentDueDate></cac:PaymentTerms>`
    : "";
  const supplier = partyXml(company as Record<string, unknown>, "supplier", "Firma", String(company.taxNumber || ""));
  const customer = partyXml(contact as Record<string, unknown>, "customer", String(invoice.contactName || "Cari"), String(invoice.taxNumber || contact.taxNumber || ""));
  const lines = items.length ? items.map((item, index) => lineXml(item, index + 1, currency)).join("") : lineXml({ id: "1", description: "Mal / Hizmet", quantity: 1, unit: "Adet", unitPrice: subtotal, vatRate: vatTotal && subtotal ? vatTotal / subtotal * 100 : 0, totalWithoutVat: subtotal, vatAmount: vatTotal, totalWithVat: grandTotal }, 1, currency);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><cbc:UBLVersionID>2.1</cbc:UBLVersionID><cbc:CustomizationID>TR1.2</cbc:CustomizationID><cbc:ProfileID>${text(profile)}</cbc:ProfileID><cbc:ID>${text(id)}</cbc:ID><cbc:CopyIndicator>false</cbc:CopyIndicator><cbc:UUID>${text(uuid)}</cbc:UUID><cbc:IssueDate>${text(issueDate)}</cbc:IssueDate><cbc:InvoiceTypeCode>${text(invoiceTypeCode)}</cbc:InvoiceTypeCode><cbc:DocumentCurrencyCode>${text(currency)}</cbc:DocumentCurrencyCode>${note}${delivery}${supplier}${customer}<cac:TaxTotal><cbc:TaxAmount currencyID="${text(currency)}">${formatUblAmount(vatTotal)}</cbc:TaxAmount><cac:TaxSubtotal><cbc:TaxableAmount currencyID="${text(currency)}">${formatUblAmount(subtotal)}</cbc:TaxableAmount><cbc:TaxAmount currencyID="${text(currency)}">${formatUblAmount(vatTotal)}</cbc:TaxAmount><cbc:Percent>${formatUblAmount(subtotal ? vatTotal / subtotal * 100 : 0)}</cbc:Percent><cac:TaxCategory><cac:TaxScheme><cbc:Name>KDV</cbc:Name><cbc:TaxTypeCode>0015</cbc:TaxTypeCode></cac:TaxScheme></cac:TaxCategory></cac:TaxSubtotal></cac:TaxTotal><cac:LegalMonetaryTotal><cbc:LineExtensionAmount currencyID="${text(currency)}">${formatUblAmount(subtotal)}</cbc:LineExtensionAmount><cbc:TaxExclusiveAmount currencyID="${text(currency)}">${formatUblAmount(subtotal)}</cbc:TaxExclusiveAmount><cbc:TaxInclusiveAmount currencyID="${text(currency)}">${formatUblAmount(grandTotal)}</cbc:TaxInclusiveAmount><cbc:PayableAmount currencyID="${text(currency)}">${formatUblAmount(grandTotal)}</cbc:PayableAmount></cac:LegalMonetaryTotal>${lines}</Invoice>`;
}

/** Base64 encode UTF-8 bytes without depending on Node's Buffer in the browser. */
export function utf8ToBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  if (typeof btoa === "function") return btoa(binary);
  // Server-side tests/SSR fallback. Buffer is intentionally looked up lazily.
  const nodeBuffer = (globalThis as unknown as { Buffer?: { from(value: Uint8Array): { toString(encoding: string): string } } }).Buffer;
  if (nodeBuffer) return nodeBuffer.from(bytes).toString("base64");
  throw new Error("Base64 kodlayıcı kullanılamıyor.");
}

/**
 * Mysoft's UBL endpoint expects a base64 encoded ZIP.  This creates a small
 * standards-compliant ZIP using the store method (no browser-only library).
 */
export function ublXmlToZipBase64(xml: string, filename = "invoice.xml"): string {
  const data = new TextEncoder().encode(xml);
  const name = new TextEncoder().encode(filename);
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1); crcTable[n] = c >>> 0; }
  let crc = 0xffffffff;
  for (const byte of data) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  crc = (crc ^ 0xffffffff) >>> 0;
  const local = new Uint8Array(30 + name.length + data.length);
  const view = new DataView(local.buffer);
  view.setUint32(0, 0x04034b50, true); view.setUint16(4, 20, true); view.setUint16(8, 0, true); view.setUint16(10, 0, true); view.setUint32(14, crc, true); view.setUint32(18, data.length, true); view.setUint32(22, data.length, true); view.setUint16(26, name.length, true); view.setUint16(28, 0, true); local.set(name, 30); local.set(data, 30 + name.length);
  const centralOffset = local.length;
  const central = new Uint8Array(46 + name.length); const cv = new DataView(central.buffer);
  cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true); cv.setUint16(8, 0, true); cv.setUint16(10, 0, true); cv.setUint32(16, crc, true); cv.setUint32(20, data.length, true); cv.setUint32(24, data.length, true); cv.setUint16(28, name.length, true); cv.setUint32(42, 0, true); central.set(name, 46);
  const end = new Uint8Array(22); const ev = new DataView(end.buffer); ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, 1, true); ev.setUint16(10, 1, true); ev.setUint32(12, central.length, true); ev.setUint32(16, centralOffset, true);
  const zip = new Uint8Array(local.length + central.length + end.length); zip.set(local, 0); zip.set(central, local.length); zip.set(end, local.length + central.length);
  let binary = ""; const chunk = 0x8000; for (let index = 0; index < zip.length; index += chunk) binary += String.fromCharCode(...zip.subarray(index, index + chunk));
  if (typeof btoa === "function") return btoa(binary);
  const nodeBuffer = (globalThis as unknown as { Buffer?: { from(value: Uint8Array): { toString(encoding: string): string } } }).Buffer;
  if (nodeBuffer) return nodeBuffer.from(zip).toString("base64");
  throw new Error("Base64 kodlayıcı kullanılamıyor.");
}

export function buildUblInvoicePayload(options: UblInvoiceBuildOptions & { tenantIdentifierNumber?: string; connectorGuid?: string; prefix?: string }) {
  const xml = buildUblInvoiceXml(options);
  const normalizedType = String(
    options.eDocumentType || options.invoice.eDocumentType || "e_fatura",
  )
    .toUpperCase()
    .replace(/[ _-]/g, "");
  return {
    invoiceTypeUblString: ublXmlToZipBase64(xml, `${String(options.invoice.invoiceNumber || "invoice")}.xml`),
    eDocumentType: normalizedType === "EARSIV" || normalizedType === "EARSIVFATURA" ? "EARSIVFATURA" : "EFATURA",
    tenantIdentifierNumber: options.tenantIdentifierNumber,
    connectorGuid: options.connectorGuid,
    prefix: options.prefix,
  };
}
