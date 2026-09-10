import type { CompanySettings, Contact, Waybill, WaybillItem } from "../types";
import { normalizeMysoftTenantIdentifier } from "./mysoftTenant";

export interface BuildMysoftDespatchOutboxOptions {
  waybill: Waybill;
  contact: Contact;
  company: CompanySettings;
  isSaveAsDraft?: boolean;
  tenantIdentifierNumber?: string;
  prefix?: string;
  numeratorSetCode?: string;
  xsltSetCode?: string;
  xsltName?: string;
}

function digits(value?: string): string {
  return String(value || "").replace(/\D/g, "");
}

function toMysoftDateTime(dateStr?: string): string {
  if (!dateStr) {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(now.getMonth() + 1)}/${pad(now.getDate())}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function unitCode(unit?: string): string {
  const norm = (unit || "").toLowerCase().trim();
  switch (norm) {
    case "adet":
    case "c62":
      return "C62";
    case "kg":
    case "kilogram":
    case "kgm":
      return "KGM";
    case "lt":
    case "litre":
    case "ltr":
      return "LTR";
    case "metre":
    case "m":
    case "mtr":
      return "MTR";
    case "saat":
    case "hur":
      return "HUR";
    case "gün":
    case "day":
      return "DAY";
    case "ay":
    case "mon":
      return "MON";
    case "koli":
    case "pa":
      return "PA";
    case "paket":
    case "pk":
      return "PK";
    case "ton":
    case "tne":
      return "TNE";
    default:
      return "C62";
  }
}

/**
 * Validates GİB & Mysoft 14.09.2026 plate format:
 * PLAKA: il kodu (01-81) + büyük harf + rakam, boşluksuz (örn. 34ABC123)
 * YABANCIPLAKA: il kodu aranmaz, büyük harf, rakam, tire veya alt çizgi (örn. ABC123)
 */
export function validatePlateFormat(plate: string, schema: "PLAKA" | "YABANCIPLAKA"): { valid: boolean; message?: string } {
  const clean = plate.replace(/\s+/g, "").toUpperCase();
  if (!clean) return { valid: true };

  if (schema === "PLAKA") {
    const turkishPlateRegex = /^(0[1-9]|[1-7][0-9]|8[01])[A-Z]{1,3}\d{1,5}$/;
    if (!turkishPlateRegex.test(clean)) {
      return {
        valid: false,
        message: "Yerli plaka 'İl Kodu (01-81) + Harf + Rakam' biçiminde ve boşluksuz olmalıdır (Örn: 34ABC123).",
      };
    }
  } else if (schema === "YABANCIPLAKA") {
    const foreignPlateRegex = /^[A-Z0-9_-]{3,20}$/;
    if (!foreignPlateRegex.test(clean)) {
      return {
        valid: false,
        message: "Yabancı plaka yalnızca büyük harf, rakam, alt çizgi ve tire içerebilir (Örn: ABC123).",
      };
    }
  }
  return { valid: true };
}

/**
 * Validates GİB & Mysoft 14.09.2026 shipment number:
 * SE- veya ES- ile başlayan 7 rakam (toplam 10 karakter).
 */
export function validateShipmentNo(shipmentNo: string): { valid: boolean; message?: string } {
  const clean = shipmentNo.trim().toUpperCase();
  if (!clean) return { valid: true };

  const shipmentRegex = /^(SE|ES)-?\d{7}$/;
  if (!shipmentRegex.test(clean)) {
    return {
      valid: false,
      message: "Sevkiyat No 'SE-' veya 'ES-' ile başlamalı ve ardından 7 haneli rakam içermelidir (Örn: SE-1234567 veya ES-1234567).",
    };
  }
  return { valid: true };
}

/**
 * Build the JSON body for POST /api/DespatchOutbox/despatchOutbox.
 * Complies with GİB & Mysoft 14.09.2026 development guidelines.
 */
export function buildMysoftDespatchOutboxPayload(
  options: BuildMysoftDespatchOutboxOptions,
): Record<string, unknown> {
  const { waybill, contact, company } = options;

  const tenant =
    normalizeMysoftTenantIdentifier(
      options.tenantIdentifierNumber ||
        company.tenantIdentifierNumber ||
        company.mysoftCredentials?.tenantIdentifierNumber,
    ) || undefined;

  const buyerTax = digits(contact.taxNumber || waybill.taxNumber);
  const rawPlate = (waybill.vehiclePlate || waybill.plateNumber || "").replace(/\s+/g, "").toUpperCase();
  const plateSchema = waybill.licencePlateSchemaId || "PLAKA";

  const rawTrailerNo = waybill.trailerNo?.replace(/\s+/g, "").toUpperCase();
  const trailerNoSchema = waybill.trailerNoSchemaId || "DORSE";

  const rawTrailerPlate = waybill.trailerPlate?.replace(/\s+/g, "").toUpperCase();
  const trailerPlateSchema = waybill.trailerPlateSchemaId || "DORSEPLAKA";

  const rawShipmentNo = waybill.shipmentNo?.trim().toUpperCase();

  // Driver details
  const driverNameParts = (waybill.driverName || "").trim().split(" ");
  const driverSurname = driverNameParts.length > 1 ? driverNameParts.pop() : "";
  const driverFirstName = driverNameParts.join(" ") || waybill.driverName || "";

  const driverInfo = waybill.driverName
    ? [
        {
          name: driverFirstName,
          familyName: driverSurname,
          nationalityId: digits(waybill.driverTckn) || undefined,
        },
      ]
    : undefined;

  const payload: Record<string, unknown> = {
    isCalculateByApi: true,
    eDespatchType: "ELEKTRONIK",
    profile: "TEMELIRSALIYE",
    despatchType: "SEVK",
    ettn: (waybill as any).eDocumentEttn || undefined,
    prefix: options.numeratorSetCode ? undefined : options.prefix || undefined,
    numeratorSetCode: options.numeratorSetCode?.trim() || undefined,
    xsltSetCode: options.xsltSetCode?.trim() || undefined,
    xsltName: options.xsltName?.trim() || undefined,
    docNo: "",
    docDate: toMysoftDateTime(waybill.waybillDate),
    dispatchDate: waybill.dispatchDate
      ? toMysoftDateTime(waybill.dispatchDate)
      : toMysoftDateTime(waybill.waybillDate),
    dispatchTime: waybill.dispatchTime || "12:00:00",
    currencyCode: waybill.currency || "TRY",
    isSaveAsDraft: options.isSaveAsDraft === true,
    referanceKey: waybill.id,
    tenantIdentifierNumber: tenant,
    notes: waybill.notes?.trim() ? [{ note: waybill.notes.trim() }] : undefined,

    // GİB 14.09.2026: Araç ve Plaka Şeması (Şoför varsa zorunlu)
    lisancePlate: rawPlate || undefined,
    lisancePlateSchemaId: rawPlate ? plateSchema : undefined,

    // GİB 14.09.2026: Dorse No ve Dorse Plakası Şemaları
    trailerNo: rawTrailerNo || undefined,
    trailerNoSchemaId: rawTrailerNo ? trailerNoSchema : undefined,
    trailerPlate: rawTrailerPlate || undefined,
    trailerPlateSchemaId: rawTrailerPlate ? trailerPlateSchema : undefined,

    // Sürücü Bilgisi
    driverInfo,

    // GİB 14.09.2026: Sevkiyat No (SE- veya ES- ile başlayan 10 karakter)
    supplierPartyIdentifer: rawShipmentNo
      ? {
          shipmentNo: rawShipmentNo,
        }
      : undefined,

    // Teslimat / Alıcı Hesabı
    despatchAccount: {
      vknTckn: buyerTax || undefined,
      accountName: contact.name || waybill.contactName,
      taxOfficeName: contact.taxOffice || undefined,
      countryName: "TÜRKİYE",
      cityName: contact.city || undefined,
      citySubdivision: contact.district || undefined,
      streetName: waybill.deliveryAddress || contact.address || undefined,
      telephone1: contact.phone || undefined,
      email1: contact.email || undefined,
    },

    // Satır Detayları
    despatchDetail: (waybill.items || []).map((item, index) => {
      const lineCode = item.productId || `LINE${String(index + 1).padStart(3, "0")}`;
      return {
        productCode: lineCode.slice(0, 100),
        productName: (item.description || (item as any).productName || "Mal / Ürün").slice(0, 150),
        deliveredQty: item.quantity,
        unitCode: unitCode(item.unit),
        unitPriceTra: item.unitPrice,
        amtTra: item.totalWithoutVat,
        vatRate: item.vatRate,
        amtVatTra: item.vatAmount,
        totalAmtTra: item.totalWithVat,
      };
    }),
  };

  return payload;
}
