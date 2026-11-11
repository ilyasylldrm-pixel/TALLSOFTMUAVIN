/**
 * Trendyol sipariş paketi → Muavin Invoice + Contact eşlemesi (saf fonksiyonlar).
 *
 * Ana kurallar
 *  - Trendyol fiyatları KDV DAHİLDİR. Faturada KDV hariç birim fiyat + iskonto
 *    + KDV olarak ayrıştırılır; satır toplamı kuruşu kuruşuna Trendyol'daki
 *    tutara eşit kalır (KDV = toplam − matrah).
 *  - Faturalanacak tutarın kaynağı Trendyol'un `packageTotalPrice` alanıdır
 *    ("Amount to be invoiced"). Satırlardan hesaplanan toplam bununla
 *    tutmazsa paket OTOMATİK KESİLMEZ, "inceleme gerekli" olarak işaretlenir.
 *  - Kurumsal (commercial=true) siparişte alıcı VKN/vergi dairesi
 *    invoiceAddress'ten alınır; e-Fatura mı e-Arşiv mi olacağı ayrıca
 *    GİB mükellef sorgusuyla belirlenir (bkz. trendyolInvoicer.ts).
 *  - Bireysel siparişte geçerli TCKN varsa (Trendyol yalnızca bazı
 *    siparişlerde gönderir) o, yoksa 11111111111 kullanılır.
 */
import { createHash } from "node:crypto";
import type { Contact, Invoice, InvoiceItem } from "../../types.ts";
import type { TrendyolLine, TrendyolPackage } from "./trendyolClient.ts";

export type BuyerKind = "individual" | "corporate";

export interface TrendyolInvoiceDraft {
  packageId: string;
  orderNumber: string;
  buyerKind: BuyerKind;
  buyerVknTckn: string;
  buyerName: string;
  invoice: Invoice;
  contact: Contact;
  /** Trendyol'un "faturalanacak tutar" alanı ile hesaplanan toplam. */
  totals: { expected: number | null; computed: number; interpretation: string | null };
  /** Otomatik kesimi durduran sorunlar. Boşsa fatura kesilebilir. */
  blockingIssues: string[];
  warnings: string[];
}

const SKIPPED_LINE_STATUSES = new Set(["cancelled", "unsupplied"]);

export function round2(value: number): number {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function ceil2(value: number): number {
  return Math.ceil(round2(value * 100) - 1e-9) / 100;
}

const num = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const text = (value: unknown): string => (typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim());

export function packageIdOf(pkg: TrendyolPackage): string {
  return String(pkg.shipmentPackageId ?? pkg.id ?? "").trim();
}

/** Resmi TCKN algoritması (11 hane, ilk hane 0 değil, 10. ve 11. hane kontrolü). */
export function isValidTckn(value: string): boolean {
  if (!/^[1-9]\d{10}$/.test(value)) return false;
  if (value === "11111111111") return false;
  const d = value.split("").map(Number);
  const odd = d[0] + d[2] + d[4] + d[6] + d[8];
  const even = d[1] + d[3] + d[5] + d[7];
  const d10 = (((odd * 7 - even) % 10) + 10) % 10;
  const d11 = (d.slice(0, 10).reduce((a, b) => a + b, 0)) % 10;
  return d10 === d[9] && d11 === d[10];
}

/** İstanbul saatine göre bugünün tarihi (YYYY-MM-DD). */
export function istanbulToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * Paket için deterministik ETTN (UUID biçiminde). Aynı paket aynı ETTN'i
 * üretir; böylece süreç yarıda kesilip yeniden denense bile Mysoft/GİB aynı
 * faturayı ikinci kez kabul etmez. `attempt` yalnızca iptal sonrası bilinçli
 * yeniden kesimde artırılır.
 */
export function deterministicEttn(companyId: string, packageId: string, attempt = 0): string {
  const hash = createHash("sha1").update(`muavin:trendyol:${companyId}:${packageId}:${attempt}`).digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // sürüm 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 varyantı
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

interface LineAmounts {
  line: TrendyolLine;
  qty: number;
  vatRate: number;
  gross: number; // KDV dahil, iskonto öncesi satır toplamı
  total: number; // KDV dahil, faturalanacak satır toplamı
}

interface Interpretation {
  label: string;
  compute: (line: TrendyolLine, qty: number, commercial: boolean) => { gross: number; total: number } | null;
}

const lineGross = (l: TrendyolLine) => num(l.lineGrossAmount) ?? num(l.amount);
const lineUnit = (l: TrendyolLine) => num(l.lineUnitPrice) ?? num(l.price);
const sellerDisc = (l: TrendyolLine) => num(l.lineSellerDiscount) ?? num(l.discount) ?? 0;
const tyDisc = (l: TrendyolLine) => num(l.lineTyDiscount) ?? num(l.tyDiscount) ?? 0;

/**
 * Trendyol'un satır alanlarının anlamı sürümler arasında değişebildiği için
 * birkaç yorum sırayla denenir; paket toplamını tutturan İLK yorum kullanılır.
 */
const INTERPRETATIONS: Interpretation[] = [
  {
    label: "brüt satır − satıcı indirimi (kurumsalda + Trendyol indirimi)",
    compute: (l, _q, commercial) => {
      const g = lineGross(l);
      if (g === undefined) return null;
      return { gross: g, total: g - sellerDisc(l) - (commercial ? tyDisc(l) : 0) };
    },
  },
  {
    label: "brüt satır − satıcı indirimi − Trendyol indirimi",
    compute: (l) => {
      const g = lineGross(l);
      if (g === undefined) return null;
      return { gross: g, total: g - sellerDisc(l) - tyDisc(l) };
    },
  },
  {
    label: "birim fiyat × adet − satıcı indirimi (kurumsalda + Trendyol indirimi)",
    compute: (l, q, commercial) => {
      const u = lineUnit(l);
      if (u === undefined) return null;
      return { gross: u * q, total: u * q - sellerDisc(l) - (commercial ? tyDisc(l) : 0) };
    },
  },
  {
    label: "brüt (birim) × adet − satıcı indirimi",
    compute: (l, q, commercial) => {
      const g = lineGross(l);
      if (g === undefined || q <= 1) return null;
      return { gross: g * q, total: g * q - sellerDisc(l) - (commercial ? tyDisc(l) : 0) };
    },
  },
  {
    label: "birim fiyat × adet (indirimli fiyat)",
    compute: (l, q) => {
      const u = lineUnit(l);
      if (u === undefined) return null;
      return { gross: u * q, total: u * q };
    },
  },
];

export interface MapOptions {
  companyId: string;
  /** Kesim tarihi; verilmezse bugün (İstanbul). */
  issueDate?: string;
  /** Varsayılan KDV oranı — satırda oran yoksa. Verilmezse satır bloklanır. */
  fallbackVatRate?: number;
  ettnAttempt?: number;
}

export function mapTrendyolPackageToInvoice(pkg: TrendyolPackage, options: MapOptions): TrendyolInvoiceDraft {
  const blockingIssues: string[] = [];
  const warnings: string[] = [];
  const packageId = packageIdOf(pkg);
  const orderNumber = text(pkg.orderNumber);
  const commercial = pkg.commercial === true;
  const inv = pkg.invoiceAddress || {};
  const currency = text(pkg.currencyCode || pkg.lines?.[0]?.currencyCode || "TRY").toUpperCase() || "TRY";

  if (!packageId) blockingIssues.push("Paket numarası (shipmentPackageId) okunamadı.");
  if (pkg.micro === true) blockingIssues.push("Mikro ihracat paketi: ihracat faturası gerekir, otomatik kesilmez.");
  if (pkg["3pByTrendyol"] === true) warnings.push("Trendyol İhracat Ortaklığı (3pByTrendyol) paketi.");
  if (currency !== "TRY") blockingIssues.push(`Döviz cinsi ${currency}: yalnızca TRY otomatik faturalanır.`);
  const statusText = text(pkg.shipmentPackageStatus || pkg.status);
  if (/cancel|unsupplied|returned/i.test(statusText)) {
    blockingIssues.push(`Paket durumu "${statusText}": faturalanmaz.`);
  }

  // ---- Alıcı ----
  let buyerKind: BuyerKind = "individual";
  let buyerVknTckn = "";
  let buyerName = "";
  if (commercial) {
    buyerKind = "corporate";
    buyerVknTckn = text(inv.taxNumber || pkg.taxNumber).replace(/\D/g, "");
    buyerName = text(inv.company) || text(inv.fullName);
    if (buyerVknTckn.length !== 10 && buyerVknTckn.length !== 11) {
      blockingIssues.push("Kurumsal sipariş ama geçerli VKN/TCKN yok.");
    }
    if (!text(inv.taxOffice)) warnings.push("Kurumsal alıcının vergi dairesi boş.");
    if (!buyerName) blockingIssues.push("Kurumsal alıcının unvanı boş.");
  } else {
    const identity = text(pkg.identityNumber).replace(/\D/g, "");
    buyerVknTckn = isValidTckn(identity) ? identity : "11111111111";
    buyerName =
      text(inv.fullName) ||
      [text(inv.firstName), text(inv.lastName)].filter(Boolean).join(" ") ||
      [text(pkg.customerFirstName), text(pkg.customerLastName)].filter(Boolean).join(" ");
    if (!buyerName) blockingIssues.push("Alıcı adı boş.");
  }

  // ---- Satırlar ----
  const rawLines = (pkg.lines || []).filter(
    (l) => !SKIPPED_LINE_STATUSES.has(text(l.orderLineItemStatusName).toLowerCase()),
  );
  if (rawLines.length === 0) blockingIssues.push("Faturalanacak satır yok.");

  const expected = num(pkg.packageTotalPrice) ?? num(pkg.totalPrice) ?? null;
  if (expected === null) blockingIssues.push("Trendyol paket tutarı (packageTotalPrice) okunamadı.");

  let chosen: { label: string; lines: LineAmounts[] } | null = null;
  let fallbackComputed = 0;
  for (const interp of INTERPRETATIONS) {
    const lines: LineAmounts[] = [];
    let ok = true;
    for (const l of rawLines) {
      const qty = Math.max(1, Math.round(num(l.quantity) ?? 1));
      const vatRate = num(l.vatRate) ?? num(l.vatBaseAmount) ?? options.fallbackVatRate;
      const res = interp.compute(l, qty, commercial);
      if (!res || vatRate === undefined || res.total < 0) {
        ok = false;
        break;
      }
      lines.push({ line: l, qty, vatRate, gross: round2(res.gross), total: round2(res.total) });
    }
    if (!ok || lines.length === 0) continue;
    const sum = round2(lines.reduce((a, b) => a + b.total, 0));
    if (!fallbackComputed) fallbackComputed = sum;
    const tolerance = 0.01 * lines.length + 0.001;
    if (expected !== null && Math.abs(sum - expected) <= tolerance) {
      chosen = { label: interp.label, lines };
      break;
    }
  }

  if (!chosen && rawLines.length > 0 && expected !== null) {
    blockingIssues.push(
      `Satır toplamı (${fallbackComputed.toFixed(2)} TL) Trendyol'un faturalanacak tutarıyla (${expected.toFixed(2)} TL) tutmuyor.`,
    );
  }
  if (rawLines.some((l) => num(l.vatRate) === undefined && num(l.vatBaseAmount) === undefined)) {
    if (options.fallbackVatRate === undefined) blockingIssues.push("Satırda KDV oranı yok.");
    else warnings.push(`KDV oranı olmayan satırlara varsayılan %${options.fallbackVatRate} uygulandı.`);
  }

  // Kuruş farkını son satıra yedir (tolerans içindeyse fatura tutarı Trendyol ile birebir olsun)
  if (chosen && expected !== null) {
    const diff = round2(expected - chosen.lines.reduce((a, b) => a + b.total, 0));
    if (diff !== 0) {
      const last = chosen.lines[chosen.lines.length - 1];
      last.total = round2(last.total + diff);
      warnings.push(`${diff.toFixed(2)} TL kuruş farkı son satıra yansıtıldı.`);
    }
  }

  const items: InvoiceItem[] = (chosen?.lines || []).map((entry, index) => toInvoiceItem(entry, index));
  const subtotal = round2(items.reduce((a, i) => a + i.totalWithoutVat, 0));
  const totalVat = round2(items.reduce((a, i) => a + i.vatAmount, 0));
  const grandTotal = round2(items.reduce((a, i) => a + i.totalWithVat, 0));
  const totalDiscount = round2(items.reduce((a, i) => a + (i.discountAmount || 0), 0));
  const grossTotal = round2(subtotal + totalDiscount);

  const issueDate = options.issueDate || istanbulToday();
  const nowIso = new Date().toISOString();
  const addressLine =
    text(inv.fullAddress) || [text(inv.address1), text(inv.address2)].filter(Boolean).join(" ");

  const contact: Contact = {
    id: `trendyol-${orderNumber || packageId}`,
    name: buyerName || "Trendyol Müşterisi",
    companyTitle: buyerKind === "corporate" ? buyerName : undefined,
    contactType: "customer",
    taxNumber: buyerVknTckn,
    taxOffice: buyerKind === "corporate" ? text(inv.taxOffice) || undefined : undefined,
    phone: text(inv.phone) || undefined,
    email: text(pkg.customerEmail) || undefined,
    address: addressLine || undefined,
    city: text(inv.city) || undefined,
    district: text(inv.district) || undefined,
    neighborhood: text(inv.neighborhood) || undefined,
    postalCode: text(inv.postalCode) || undefined,
    balance: 0,
    balanceType: "balanced",
    notes: `Trendyol sipariş ${orderNumber}`,
    createdAt: nowIso,
  };

  const invoice: Invoice = {
    id: `trendyol-${packageId}`,
    invoiceNumber: "",
    type: "sales",
    invoiceProfileType: "SATIS",
    docKind: "invoice",
    contactId: contact.id,
    contactName: contact.name,
    taxNumber: buyerVknTckn,
    taxOffice: contact.taxOffice,
    customerAddress: contact.address,
    customerCity: contact.city,
    customerDistrict: contact.district,
    customerPhone: contact.phone,
    customerEmail: contact.email,
    isManualCustomer: true,
    issueDate,
    dueDate: issueDate,
    items,
    grossTotal,
    totalDiscount,
    subtotal,
    totalVat,
    grandTotal,
    payableAmount: grandTotal,
    // Tahsilat Trendyol üzerinden yapıldığı için fatura kapalı kabul edilir.
    paidAmount: grandTotal,
    remainingAmount: 0,
    status: "paid",
    currency: "TRY",
    notes: `Trendyol Sipariş No: ${orderNumber} / Paket No: ${packageId}`,
    createdAt: issueDate,
    eDocumentEttn: packageId ? deterministicEttn(options.companyId, packageId, options.ettnAttempt ?? 0) : undefined,
    orderId: orderNumber,
  };

  return {
    packageId,
    orderNumber,
    buyerKind,
    buyerVknTckn,
    buyerName,
    invoice,
    contact,
    totals: { expected, computed: chosen ? grandTotal : fallbackComputed, interpretation: chosen?.label ?? null },
    blockingIssues,
    warnings,
  };
}

/**
 * KDV dahil tutarları KDV hariç fatura satırına çevirir. Tutarlılık:
 *   round2(birimFiyat × adet) − iskonto = matrah,  matrah + KDV = KDV dahil toplam
 */
function toInvoiceItem(entry: LineAmounts, index: number): InvoiceItem {
  const { line, qty, vatRate, gross, total } = entry;
  const factor = 1 + vatRate / 100;
  const net = round2(total / factor);
  const vatAmount = round2(total - net);
  let unitNet = round2(gross / qty / factor);
  let grossNet = round2(unitNet * qty);
  let discount = round2(grossNet - net);
  if (discount < 0) {
    // Yuvarlama yüzünden brüt < net kaldıysa birim fiyatı yukarı yuvarla.
    unitNet = ceil2(net / qty);
    grossNet = round2(unitNet * qty);
    discount = round2(grossNet - net);
  }
  const variant = [text(line.productSize), text(line.productColor)].filter(Boolean).join(" / ");
  const name = text(line.productName) || "Ürün";
  const code = text(line.stockCode) || text(line.merchantSku) || text(line.barcode);
  return {
    id: `ty-line-${line.lineId ?? line.id ?? index + 1}`,
    productId: code || undefined,
    productCode: code || undefined,
    description: variant ? `${name} (${variant})` : name,
    quantity: qty,
    unit: "Adet",
    unitPrice: unitNet,
    discountAmount: discount > 0 ? discount : undefined,
    discountRate: discount > 0 && grossNet > 0 ? round2((discount / grossNet) * 100) : undefined,
    vatRate,
    totalWithoutVat: net,
    vatAmount,
    totalWithVat: round2(net + vatAmount),
  };
}
