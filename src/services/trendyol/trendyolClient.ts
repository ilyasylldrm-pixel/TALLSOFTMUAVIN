/**
 * Trendyol Partner API istemcisi (yalnızca sunucu tarafı).
 *
 * Resmi doküman: https://developers.trendyol.com
 *  - Kimlik doğrulama: Basic auth (API Key : API Secret)
 *  - Her istekte User-Agent zorunlu: "{sellerId} - {EntegratörAdı}"
 *    (kendi entegrasyonunda "{sellerId} - SelfIntegration"). Yoksa 403.
 *  - Aynı uç noktaya 10 saniyede en fazla 50 istek; aşılırsa 429.
 *  - Sipariş paketleri: GET /integration/order/sellers/{sellerId}/v2/orders
 *    (v1 yolu 15.10.2026 itibarıyla kullanımdan kalktı).
 *  - Fatura dosyası: POST /integration/sellers/{sellerId}/seller-invoice-file (multipart)
 *  - Fatura linki:   POST /integration/sellers/{sellerId}/seller-invoice-links
 *
 * Kimlik bilgileri asla tarayıcıya veya loglara yazılmaz.
 */

export type TrendyolEnvironment = "prod" | "stage";

export interface TrendyolCredentials {
  sellerId: string;
  apiKey: string;
  apiSecret: string;
  environment?: TrendyolEnvironment;
}

export interface TrendyolAddress {
  id?: number;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  company?: string;
  address1?: string;
  address2?: string;
  fullAddress?: string;
  city?: string;
  district?: string;
  neighborhood?: string;
  postalCode?: string;
  countryCode?: string;
  phone?: string;
  taxOffice?: string;
  taxNumber?: string;
  eInvoiceAvailable?: boolean;
}

export interface TrendyolLine {
  lineId?: number;
  id?: number;
  quantity?: number;
  productName?: string;
  productSize?: string;
  productColor?: string;
  stockCode?: string;
  merchantSku?: string;
  barcode?: string;
  // v2 alanları
  lineUnitPrice?: number;
  lineGrossAmount?: number;
  lineTotalDiscount?: number;
  lineSellerDiscount?: number;
  lineTyDiscount?: number;
  vatRate?: number;
  // v1 (eski) alanları — geriye dönük uyum
  price?: number;
  amount?: number;
  discount?: number;
  tyDiscount?: number;
  vatBaseAmount?: number;
  currencyCode?: string;
  orderLineItemStatusName?: string;
}

export interface TrendyolPackage {
  shipmentPackageId?: number;
  id?: number;
  orderNumber: string;
  orderDate?: number;
  lastModifiedDate?: number;
  status?: string;
  shipmentPackageStatus?: string;
  commercial?: boolean;
  micro?: boolean;
  "3pByTrendyol"?: boolean;
  customerFirstName?: string;
  customerLastName?: string;
  customerEmail?: string;
  identityNumber?: string;
  taxNumber?: string | null;
  invoiceAddress?: TrendyolAddress;
  shipmentAddress?: TrendyolAddress;
  currencyCode?: string;
  // v2 tutarlar
  packageGrossAmount?: number;
  packageSellerDiscount?: number;
  packageTyDiscount?: number;
  packageTotalDiscount?: number;
  packageTotalPrice?: number;
  // v1 tutarlar
  grossAmount?: number;
  totalDiscount?: number;
  totalTyDiscount?: number;
  totalPrice?: number;
  invoiceLink?: string | null;
  cargoProviderName?: string;
  cargoTrackingNumber?: string | number;
  lines?: TrendyolLine[];
}

export interface TrendyolPage<T> {
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  content: T[];
}

export interface ListPackagesQuery {
  status?: string;
  startDate?: number;
  endDate?: number;
  page?: number;
  size?: number;
  orderByField?: "PackageLastModifiedDate" | "CreatedDate";
  orderByDirection?: "ASC" | "DESC";
  orderNumber?: string;
  shipmentPackageIds?: string;
}

export class TrendyolApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(message: string, status: number, code = "TRENDYOL_API_ERROR") {
    super(message);
    this.name = "TrendyolApiError";
    this.status = status;
    this.code = code;
  }
}

const BASE_URLS: Record<TrendyolEnvironment, string> = {
  prod: "https://apigw.trendyol.com",
  stage: "https://stageapigw.trendyol.com",
};

/** 2 hafta: Trendyol'un tek istekte izin verdiği en geniş tarih aralığı. */
export const TRENDYOL_MAX_RANGE_MS = 14 * 24 * 60 * 60 * 1000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Uç nokta başına basit hız sınırlayıcı (50 istek / 10 sn → ~5/sn). */
const lastCallAt = new Map<string, number>();
async function throttle(key: string, minIntervalMs = 220): Promise<void> {
  const now = Date.now();
  const last = lastCallAt.get(key) || 0;
  const wait = last + minIntervalMs - now;
  lastCallAt.set(key, Math.max(now, last + minIntervalMs));
  if (wait > 0) await sleep(wait);
}

export function normalizeSellerId(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "");
}

export class TrendyolClient {
  private readonly sellerId: string;
  private readonly authHeader: string;
  private readonly baseUrl: string;
  private readonly userAgent: string;
  private readonly timeoutMs: number;

  constructor(credentials: TrendyolCredentials, options: { integratorName?: string; timeoutMs?: number } = {}) {
    const sellerId = normalizeSellerId(credentials.sellerId);
    if (!sellerId) throw new TrendyolApiError("Satıcı ID (sellerId) boş olamaz.", 400, "TRENDYOL_CONFIG");
    if (!credentials.apiKey?.trim() || !credentials.apiSecret?.trim()) {
      throw new TrendyolApiError("API Key ve API Secret zorunludur.", 400, "TRENDYOL_CONFIG");
    }
    this.sellerId = sellerId;
    this.authHeader =
      "Basic " + Buffer.from(`${credentials.apiKey.trim()}:${credentials.apiSecret.trim()}`).toString("base64");
    this.baseUrl = BASE_URLS[credentials.environment === "stage" ? "stage" : "prod"];
    // Trendyol: entegratör adı alfanümerik ve en fazla 30 karakter.
    const integrator = String(options.integratorName || process.env.TRENDYOL_INTEGRATOR_NAME || "SelfIntegration")
      .replace(/[^A-Za-z0-9]/g, "")
      .slice(0, 30) || "SelfIntegration";
    this.userAgent = `${sellerId} - ${integrator}`;
    this.timeoutMs = options.timeoutMs ?? Number(process.env.TRENDYOL_TIMEOUT_MS || 30_000);
  }

  private async request<T>(
    method: "GET" | "POST" | "PUT",
    path: string,
    init: { query?: Record<string, unknown>; json?: unknown; form?: FormData; throttleKey: string },
  ): Promise<T> {
    const url = new URL(this.baseUrl + path);
    Object.entries(init.query || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      url.searchParams.set(key, String(value));
    });

    const headers: Record<string, string> = {
      Authorization: this.authHeader,
      "User-Agent": this.userAgent,
      Accept: "application/json",
    };
    let body: BodyInit | undefined;
    if (init.form) {
      body = init.form; // Content-Type (boundary) fetch tarafından eklenir
    } else if (init.json !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(init.json);
    }

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await throttle(init.throttleKey);
      let response: Response;
      try {
        response = await fetch(url, { method, headers, body, signal: AbortSignal.timeout(this.timeoutMs) });
      } catch (error) {
        if (attempt < 2 && method === "GET") {
          await sleep(1000 * (attempt + 1));
          continue;
        }
        throw new TrendyolApiError(
          `Trendyol'a ulaşılamadı: ${error instanceof Error ? error.message : String(error)}`,
          502,
          "TRENDYOL_UNREACHABLE",
        );
      }

      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("retry-after"));
        await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2000 * (attempt + 1));
        continue;
      }

      const text = await response.text();
      let parsed: unknown = undefined;
      try {
        parsed = text ? JSON.parse(text) : undefined;
      } catch {
        parsed = text;
      }

      if (!response.ok) {
        throw new TrendyolApiError(describeTrendyolError(response.status, parsed), response.status, errorCode(response.status));
      }
      return parsed as T;
    }
    throw new TrendyolApiError("Trendyol istek limiti aşıldı (429). Biraz sonra tekrar deneyin.", 429, "TRENDYOL_RATE_LIMIT");
  }

  /** Sipariş paketlerini listeler (v2). Tarih aralığı en fazla 2 hafta olmalı. */
  listShipmentPackages(query: ListPackagesQuery = {}): Promise<TrendyolPage<TrendyolPackage>> {
    if (query.startDate && query.endDate && query.endDate - query.startDate > TRENDYOL_MAX_RANGE_MS) {
      throw new TrendyolApiError("Trendyol tek seferde en fazla 2 haftalık aralık verir.", 400, "TRENDYOL_RANGE");
    }
    return this.request<TrendyolPage<TrendyolPackage>>("GET", `/integration/order/sellers/${this.sellerId}/v2/orders`, {
      query: {
        ...query,
        size: Math.min(200, Math.max(1, query.size ?? 50)),
        page: Math.max(0, query.page ?? 0),
      },
      throttleKey: "orders",
    }).then((page) => ({
      totalElements: Number(page?.totalElements) || 0,
      totalPages: Number(page?.totalPages) || 0,
      page: Number(page?.page) || 0,
      size: Number(page?.size) || 0,
      content: Array.isArray(page?.content) ? page.content : [],
    }));
  }

  /** Belirli bir paketi ID ile çeker (fatura öncesi son kontrol için). */
  async getShipmentPackage(shipmentPackageId: string | number): Promise<TrendyolPackage | null> {
    const page = await this.listShipmentPackages({ shipmentPackageIds: String(shipmentPackageId), size: 1 });
    return page.content[0] || null;
  }

  /** Bağlantı testi: tek kayıtlık sipariş sorgusu. 401/403 ise bilgiler hatalıdır. */
  async testConnection(): Promise<{ ok: true; sellerId: string; sampleCount: number }> {
    const page = await this.listShipmentPackages({ size: 1 });
    return { ok: true, sellerId: this.sellerId, sampleCount: page.totalElements };
  }

  /** Müşteri faturasını (PDF) pakete yükler. Aynı pakete ikinci kez yüklenemez. */
  async uploadInvoiceFile(input: {
    shipmentPackageId: string | number;
    pdf: Uint8Array;
    fileName: string;
    invoiceNumber?: string;
    invoiceDateTime?: number;
    storeFrontCode?: string;
  }): Promise<void> {
    if (input.pdf.byteLength > 10 * 1024 * 1024) {
      throw new TrendyolApiError("Fatura dosyası 10 MB sınırını aşıyor.", 400, "TRENDYOL_FILE_TOO_LARGE");
    }
    const form = new FormData();
    form.set("shipmentPackageId", String(input.shipmentPackageId));
    if (input.invoiceNumber) form.set("invoiceNumber", input.invoiceNumber);
    if (input.invoiceDateTime) form.set("invoiceDateTime", String(input.invoiceDateTime));
    form.set("file", new Blob([new Uint8Array(input.pdf)], { type: "application/pdf" }), input.fileName);
    const path = `/integration/sellers/${this.sellerId}/seller-invoice-file`;
    // storeFrontCode, dokümanda başlık parametresi olarak geçiyor; değer verilmişse gönderilir.
    if (input.storeFrontCode) {
      await this.requestWithExtraHeader("POST", path, form, { storeFrontCode: input.storeFrontCode });
      return;
    }
    await this.request("POST", path, { form, throttleKey: "invoice-file" });
  }

  /** Alternatif: fatura PDF'inin herkese açık linkini gönderir (link 8 yıl erişilebilir kalmalı). */
  async sendInvoiceLink(input: {
    shipmentPackageId: string | number;
    invoiceLink: string;
    invoiceNumber?: string;
    invoiceDateTime?: number;
  }): Promise<void> {
    await this.request("POST", `/integration/sellers/${this.sellerId}/seller-invoice-links`, {
      json: {
        shipmentPackageId: Number(input.shipmentPackageId),
        invoiceLink: input.invoiceLink,
        invoiceNumber: input.invoiceNumber,
        invoiceDateTime: input.invoiceDateTime,
      },
      throttleKey: "invoice-link",
    });
  }

  /** Paket durumunu "Invoiced" yapar (opsiyonel; satıcı paneli akışına göre). */
  async markPackageInvoiced(input: {
    shipmentPackageId: string | number;
    invoiceNumber: string;
    lines: Array<{ lineId: number; quantity: number }>;
  }): Promise<void> {
    await this.request("PUT", `/integration/order/sellers/${this.sellerId}/shipment-packages/${input.shipmentPackageId}`, {
      json: { lines: input.lines, params: { invoiceNumber: input.invoiceNumber }, status: "Invoiced" },
      throttleKey: "package-status",
    });
  }

  private async requestWithExtraHeader(method: "POST", path: string, form: FormData, extra: Record<string, string>) {
    await throttle("invoice-file");
    const response = await fetch(this.baseUrl + path, {
      method,
      headers: { Authorization: this.authHeader, "User-Agent": this.userAgent, Accept: "application/json", ...extra },
      body: form,
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      let parsed: unknown = text;
      try {
        parsed = text ? JSON.parse(text) : undefined;
      } catch {
        /* düz metin */
      }
      throw new TrendyolApiError(describeTrendyolError(response.status, parsed), response.status, errorCode(response.status));
    }
  }
}

function errorCode(status: number): string {
  if (status === 401) return "TRENDYOL_UNAUTHORIZED";
  if (status === 403) return "TRENDYOL_FORBIDDEN";
  if (status === 409) return "TRENDYOL_CONFLICT";
  if (status === 429) return "TRENDYOL_RATE_LIMIT";
  return "TRENDYOL_API_ERROR";
}

/** Upstream gövdesinden yalnızca kısa, güvenli bir mesaj çıkarır. */
function describeTrendyolError(status: number, body: unknown): string {
  if (status === 401) return "Trendyol yetkilendirme hatası: API Key / Secret veya Satıcı ID hatalı.";
  if (status === 403) return "Trendyol isteği reddetti (403). User-Agent / IP yetkisi veya hesap durumu kontrol edilmeli.";
  const pick = (value: unknown): string | undefined => (typeof value === "string" && value.trim() ? value.trim() : undefined);
  let detail: string | undefined;
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const errors = Array.isArray(record.errors) ? (record.errors as Array<Record<string, unknown>>) : [];
    detail =
      pick(errors[0]?.message) ||
      pick(errors[0]?.key) ||
      pick(record.message) ||
      pick(record.errorMessage) ||
      pick(record.exception);
  } else {
    detail = pick(body);
  }
  const safe = detail ? detail.slice(0, 300) : "";
  if (status === 409) return `Trendyol çakışma (409): ${safe || "Bu pakete daha önce fatura gönderilmiş."}`;
  return `Trendyol hata (${status})${safe ? `: ${safe}` : ""}`;
}
