/**
 * Trendyol → Mysoft otomatik faturalama motoru.
 *
 * Bir paket için akış:
 *   1. Defter kontrolü (zaten kesildi/iletildi mi?)
 *   2. Paketi Trendyol'dan TAZE çek; pakette fatura linki varsa dokunma
 *   3. Paketi Invoice/Contact'a eşle (tutar mutabakatı tutmazsa → inceleme)
 *   4. Alıcı GİB e-Fatura mükellefi mi? → EFATURA (pkAlias ile) / EARSIVFATURA
 *   5. Deterministik ETTN ile Mysoft'a gönder (çift kesime karşı)
 *   6. Fatura PDF'ini Mysoft'tan al → Trendyol paketine yükle
 *
 * Mysoft "mock" modundayken (kimlik bilgisi yoksa) gerçek gönderim yapılmaz;
 * motor yalnızca önizleme üretir. Aksi halde sahte fatura Trendyol'a gidebilirdi.
 */
import type { CompanySettings } from "../../types.ts";
import { MysoftApiError, type MysoftEdocumentClient } from "../mysoftEdocument.ts";
import {
  buildMysoftInvoiceOutboxPayload,
  extractMysoftOutboxResult,
  MysoftPayloadValidationError,
  toMysoftDateTime,
} from "../mysoftInvoicePayload.ts";
import { normalizeMysoftTenantIdentifier } from "../mysoftTenant.ts";
import { extractFirstFileFromZip, isPdfBytes, isZipBytes } from "../../utils/mysoftZip.ts";
import {
  TRENDYOL_MAX_RANGE_MS,
  TrendyolApiError,
  TrendyolClient,
  type TrendyolPackage,
} from "./trendyolClient.ts";
import {
  istanbulToday,
  mapTrendyolPackageToInvoice,
  packageIdOf,
  type TrendyolInvoiceDraft,
} from "./trendyolInvoiceMapper.ts";
import type { LedgerEntry, TrendyolConnectionRecord, TrendyolStore } from "./trendyolStore.ts";

export interface InvoicerDeps {
  store: TrendyolStore;
  mysoft: MysoftEdocumentClient;
  /** Sunucudaki güncel firma ayarları (cloud-sync deposu). */
  resolveCompanySettings: (companyId: string) => Partial<CompanySettings> | null;
}

export interface PackageResult {
  packageId: string;
  orderNumber: string;
  state: LedgerEntry["state"] | "skipped";
  message: string;
  docNo?: string;
  ettn?: string;
}

export interface PackagePreview {
  packageId: string;
  orderNumber: string;
  status: string;
  orderDate?: number;
  buyerName: string;
  buyerKind: "individual" | "corporate";
  amount: number | null;
  hasTrendyolInvoice: boolean;
  blockingIssues: string[];
  warnings: string[];
  ledger: LedgerEntry | null;
}

const DAY = 24 * 60 * 60 * 1000;

export class TrendyolInvoicer {
  private readonly running = new Set<string>();

  constructor(private readonly deps: InvoicerDeps) {}

  private clientFor(conn: TrendyolConnectionRecord): TrendyolClient {
    return new TrendyolClient(this.deps.store.getCredentials(conn));
  }

  private companyFor(conn: TrendyolConnectionRecord): Partial<CompanySettings> {
    return { ...(conn.companySettingsSnapshot || {}), ...(this.deps.resolveCompanySettings(conn.companyId) || {}) };
  }

  private tenantFor(conn: TrendyolConnectionRecord, company: Partial<CompanySettings>): string | undefined {
    return normalizeMysoftTenantIdentifier(
      conn.tenantIdentifierNumber ||
        company.tenantIdentifierNumber ||
        company.mysoftCredentials?.tenantIdentifierNumber ||
        company.taxNumber ||
        company.vknTckn,
    );
  }

  /** Belirtilen pencere için paketleri 2 haftalık dilimlerle sayfa sayfa çeker. */
  async fetchPackages(
    conn: TrendyolConnectionRecord,
    options: { days: number; status?: string; maxPackages?: number },
  ): Promise<TrendyolPackage[]> {
    const client = this.clientFor(conn);
    const end = Date.now();
    const start = Math.max(end - options.days * DAY, conn.startFrom || 0, end - 30 * DAY);
    const max = options.maxPackages ?? 1000;
    const seen = new Map<string, TrendyolPackage>();
    for (let windowEnd = end; windowEnd > start && seen.size < max; windowEnd -= TRENDYOL_MAX_RANGE_MS) {
      const windowStart = Math.max(start, windowEnd - TRENDYOL_MAX_RANGE_MS + 1);
      for (let page = 0; page < 50 && seen.size < max; page += 1) {
        const res = await client.listShipmentPackages({
          startDate: windowStart,
          endDate: windowEnd,
          status: options.status,
          page,
          size: 200,
          orderByField: "PackageLastModifiedDate",
          orderByDirection: "DESC",
        });
        res.content.forEach((pkg) => {
          const id = packageIdOf(pkg);
          if (id) seen.set(id, pkg);
        });
        if (page + 1 >= res.totalPages || res.content.length === 0) break;
      }
    }
    return Array.from(seen.values());
  }

  /** Ekranda listelemek için: paket + fatura önizleme özeti + defter durumu. */
  async previewPackages(companyId: string, options: { days?: number; status?: string } = {}): Promise<PackagePreview[]> {
    const conn = this.requireConnection(companyId);
    const company = this.companyFor(conn);
    const packages = await this.fetchPackages(conn, { days: options.days ?? 7, status: options.status, maxPackages: 400 });
    return packages.map((pkg) => {
      const draft = mapTrendyolPackageToInvoice(pkg, { companyId, fallbackVatRate: conn.fallbackVatRate ?? company.defaultVatRate });
      return {
        packageId: draft.packageId,
        orderNumber: draft.orderNumber,
        status: String(pkg.shipmentPackageStatus || pkg.status || ""),
        orderDate: pkg.orderDate,
        buyerName: draft.buyerName,
        buyerKind: draft.buyerKind,
        amount: draft.totals.expected,
        hasTrendyolInvoice: Boolean(pkg.invoiceLink),
        blockingIssues: draft.blockingIssues,
        warnings: draft.warnings,
        ledger: this.deps.store.getEntry(companyId, draft.packageId),
      };
    });
  }

  /** Tek paketi faturalar (manuel buton veya otomatik tur). */
  async invoicePackage(
    companyId: string,
    packageId: string,
    options: { force?: boolean; preloaded?: TrendyolPackage } = {},
  ): Promise<PackageResult> {
    const conn = this.requireConnection(companyId);
    const lockKey = `${companyId}:${packageId}`;
    if (this.running.has(lockKey)) {
      return { packageId, orderNumber: "", state: "skipped", message: "Bu paket şu anda işleniyor." };
    }
    this.running.add(lockKey);
    try {
      return await this.invoicePackageLocked(conn, packageId, options);
    } finally {
      this.running.delete(lockKey);
    }
  }

  private async invoicePackageLocked(
    conn: TrendyolConnectionRecord,
    packageId: string,
    options: { force?: boolean; preloaded?: TrendyolPackage },
  ): Promise<PackageResult> {
    const { store, mysoft } = this.deps;
    const companyId = conn.companyId;
    const client = this.clientFor(conn);
    const company = this.companyFor(conn);
    let entry = store.getEntry(companyId, packageId);

    if (mysoft.config.mockMode) {
      throw new TrendyolApiError(
        "Mysoft kimlik bilgileri tanımlı değil (mock mod). Gerçek fatura kesilemez; önce Mysoft erişim anahtarını sunucuya girin.",
        503,
        "MYSOFT_NOT_CONFIGURED",
      );
    }
    if (entry?.state === "delivered") {
      return result(entry, "Fatura zaten kesildi ve Trendyol'a iletildi.");
    }
    if (entry?.state === "needs_review" && !options.force) {
      return result(entry, entry.message || "İnceleme bekliyor.");
    }

    const tenant = this.tenantFor(conn, company);
    if (!tenant) {
      throw new TrendyolApiError("Faturayı kesen firmanın Mysoft VKN/TCKN değeri bulunamadı.", 400, "TENANT_MISSING");
    }

    // Kesildi ama Trendyol'a iletilemediyse yalnızca iletimi tekrar dene.
    if (entry?.state === "invoiced" && entry.ettn) {
      return this.deliver(conn, client, entry, tenant);
    }

    // Önceki tur "sending" aşamasında kesildiyse: fatura Mysoft'ta oluşmuş olabilir.
    if (entry?.state === "sending" && entry.ettn) {
      const existing = await this.lookupOutgoing(entry.ettn, tenant);
      if (existing) {
        entry = await store.saveEntry({
          ...entry,
          state: "invoiced",
          docNo: existing.docNo || entry.docNo,
          invoicedAt: new Date().toISOString(),
          message: "Önceki denemede kesilmiş fatura Mysoft'ta bulundu.",
        });
        return this.deliver(conn, client, entry, tenant);
      }
    }

    // Paketi her zaman taze çek: durum/iptal/fatura linki değişmiş olabilir.
    const pkg = (await client.getShipmentPackage(packageId)) || options.preloaded || null;
    if (!pkg) {
      return result(
        await store.saveEntry({ companyId, packageId, orderNumber: entry?.orderNumber || "", state: "error", message: "Paket Trendyol'da bulunamadı." }),
        "Paket Trendyol'da bulunamadı.",
      );
    }
    const orderNumber = String(pkg.orderNumber || "");
    if (pkg.invoiceLink) {
      const saved = await store.saveEntry({
        companyId,
        packageId,
        orderNumber,
        state: "delivered",
        message: "Trendyol'da bu pakete ait fatura zaten var; yeniden kesilmedi.",
        deliveredAt: new Date().toISOString(),
      });
      return result(saved, saved.message!);
    }

    const ettnAttempt = entry?.ettnAttempt ?? 0;
    const draft = mapTrendyolPackageToInvoice(pkg, {
      companyId,
      fallbackVatRate: conn.fallbackVatRate,
      ettnAttempt,
    });
    if (draft.blockingIssues.length > 0) {
      const saved = await store.saveEntry({
        companyId,
        packageId,
        orderNumber,
        state: "needs_review",
        buyerName: draft.buyerName,
        amount: draft.totals.expected ?? undefined,
        message: draft.blockingIssues.join(" "),
      });
      return result(saved, saved.message!);
    }

    // e-Fatura / e-Arşiv kararı
    let decision: { eDocumentType: "EFATURA" | "EARSIVFATURA"; pkAlias?: string };
    try {
      decision = await this.decideDocumentType(draft);
    } catch (error) {
      const saved = await store.saveEntry({
        companyId,
        packageId,
        orderNumber,
        state: "needs_review",
        buyerName: draft.buyerName,
        amount: draft.totals.expected ?? undefined,
        message: `Alıcının e-Fatura mükellefiyeti sorgulanamadı: ${errMsg(error)}`,
      });
      return result(saved, saved.message!);
    }

    const payload = buildMysoftInvoiceOutboxPayload({
      invoice: { ...draft.invoice, eDocumentType: decision.eDocumentType === "EFATURA" ? "e_fatura" : "e_arsiv" },
      contact: draft.contact,
      company: company as CompanySettings,
      eDocumentType: decision.eDocumentType,
      profile: decision.eDocumentType === "EARSIVFATURA" ? "EARSIVFATURA" : "TEMELFATURA",
      invoiceType: "SATIS",
      isSaveAsDraft: false,
      tenantIdentifierNumber: tenant,
      pkAlias: decision.pkAlias,
    });
    // Fatura notuna firma ayarlarından gelen banka/IBAN satırları pazaryeri faturasında gereksiz.
    payload.notes = [{ note: draft.invoice.notes || `Trendyol Sipariş No: ${orderNumber}` }];
    payload.orderNo = orderNumber;
    if (pkg.orderDate) payload.orderDate = toMysoftDateTime(istanbulToday(new Date(pkg.orderDate)));

    entry = await store.saveEntry({
      companyId,
      packageId,
      orderNumber,
      state: "sending",
      ettn: draft.invoice.eDocumentEttn,
      ettnAttempt,
      eDocumentType: decision.eDocumentType,
      buyerName: draft.buyerName,
      amount: draft.invoice.grandTotal,
      attempts: (entry?.attempts ?? 0) + 1,
      message: "Mysoft'a gönderiliyor…",
    });

    try {
      const response = await mysoft.createOutgoing(payload);
      const outbox = extractMysoftOutboxResult(response);
      entry = await store.saveEntry({
        ...entry,
        state: "invoiced",
        ettn: outbox.invoiceETTN || entry.ettn,
        docNo: outbox.docNo,
        invoicedAt: new Date().toISOString(),
        message: `Fatura kesildi${outbox.docNo ? `: ${outbox.docNo}` : ""}.`,
      });
    } catch (error) {
      // Aynı ETTN ile daha önce kesilmiş olabilir (ör. zaman aşımı sonrası) → Mysoft'ta ara.
      const existing = entry.ettn ? await this.lookupOutgoing(entry.ettn, tenant) : null;
      if (existing) {
        entry = await store.saveEntry({
          ...entry,
          state: "invoiced",
          docNo: existing.docNo,
          invoicedAt: new Date().toISOString(),
          message: "Fatura daha önce kesilmiş (aynı ETTN Mysoft'ta mevcut).",
        });
      } else {
        const isValidation = error instanceof MysoftPayloadValidationError;
        const saved = await store.saveEntry({
          ...entry,
          state: isValidation ? "needs_review" : "error",
          message: `Mysoft gönderimi başarısız: ${errMsg(error)}`,
        });
        return result(saved, saved.message!);
      }
    }

    return this.deliver(conn, client, entry, tenant);
  }

  /** Kesilmiş faturanın PDF'ini Trendyol paketine yükler. */
  private async deliver(
    conn: TrendyolConnectionRecord,
    client: TrendyolClient,
    entry: LedgerEntry,
    tenant: string,
  ): Promise<PackageResult> {
    const { store, mysoft } = this.deps;
    if (!conn.uploadInvoiceToTrendyol) {
      const saved = await store.saveEntry({ ...entry, state: "delivered", message: `${entry.message || "Fatura kesildi."} (Trendyol'a yükleme kapalı)` });
      return result(saved, saved.message!);
    }
    try {
      const pdf = await this.fetchPdf(mysoft, entry.ettn!, tenant);
      const invoiceNumber = entry.docNo && /^[A-Z0-9]{3}\d{13}$/.test(entry.docNo) ? entry.docNo : undefined;
      await client.uploadInvoiceFile({
        shipmentPackageId: entry.packageId,
        pdf,
        fileName: `${invoiceNumber || entry.ettn}.pdf`,
        invoiceNumber,
        invoiceDateTime: entry.invoicedAt ? Date.parse(entry.invoicedAt) : Date.now(),
        storeFrontCode: conn.storeFrontCode,
      });
      if (conn.markPackageInvoiced && invoiceNumber) {
        await this.tryMarkInvoiced(client, entry.packageId, invoiceNumber);
      }
      const saved = await store.saveEntry({
        ...entry,
        state: "delivered",
        deliveredAt: new Date().toISOString(),
        message: `Fatura kesildi${entry.docNo ? ` (${entry.docNo})` : ""} ve Trendyol'a yüklendi.`,
      });
      return result(saved, saved.message!);
    } catch (error) {
      if (error instanceof TrendyolApiError && error.status === 409) {
        const saved = await store.saveEntry({
          ...entry,
          state: "delivered",
          deliveredAt: new Date().toISOString(),
          message: "Trendyol bu paket için faturayı zaten kayıtlı gösteriyor.",
        });
        return result(saved, saved.message!);
      }
      const saved = await store.saveEntry({
        ...entry,
        state: "invoiced",
        message: `Fatura kesildi ama Trendyol'a yüklenemedi (tekrar denenecek): ${errMsg(error)}`,
      });
      return result(saved, saved.message!);
    }
  }

  private async tryMarkInvoiced(client: TrendyolClient, packageId: string, invoiceNumber: string) {
    try {
      const fresh = await client.getShipmentPackage(packageId);
      if (!fresh || !/picking/i.test(String(fresh.shipmentPackageStatus || fresh.status))) return;
      const lines = (fresh.lines || [])
        .filter((l) => (l.lineId ?? l.id) !== undefined)
        .map((l) => ({ lineId: Number(l.lineId ?? l.id), quantity: Number(l.quantity) || 1 }));
      if (lines.length) await client.markPackageInvoiced({ shipmentPackageId: packageId, invoiceNumber, lines });
    } catch (error) {
      console.warn(`[trendyol] ${packageId} paketi Invoiced yapılamadı:`, errMsg(error));
    }
  }

  private async decideDocumentType(
    draft: TrendyolInvoiceDraft,
  ): Promise<{ eDocumentType: "EFATURA" | "EARSIVFATURA"; pkAlias?: string }> {
    const id = draft.buyerVknTckn;
    if (!id || id === "11111111111") return { eDocumentType: "EARSIVFATURA" };
    const res = await this.deps.mysoft.getGibAccountModel(id);
    const data = res?.data;
    const registered = Boolean(data && data.isPassive !== true && data.eInvoiceStartDate);
    if (!registered) return { eDocumentType: "EARSIVFATURA" };
    const aliases = (data!.gibAccountAliasList || []).filter((a) => a?.alias && !a.deletionTime) as Array<
      Record<string, unknown>
    >;
    const pk =
      aliases.find((a) => a.role === 1 || a.aliasType === 1) ||
      aliases.find((a) => a.role !== 2 && a.aliasType !== 2 && String(a.alias).toLowerCase().includes("pk"));
    if (!pk) throw new Error("Alıcı e-Fatura mükellefi ama posta kutusu (PK) etiketi bulunamadı.");
    return { eDocumentType: "EFATURA", pkAlias: String(pk.alias) };
  }

  private async lookupOutgoing(ettn: string, tenant: string): Promise<{ docNo?: string } | null> {
    try {
      const model = (await this.deps.mysoft.getOutgoingModel(ettn, tenant)) as Record<string, unknown> | null;
      const data = (model && typeof model.data === "object" ? model.data : model) as Record<string, unknown> | null;
      if (!data) return null;
      const docNo = typeof data.docNo === "string" ? data.docNo : undefined;
      const foundEttn = String(data.ettn || data.invoiceETTN || "").toLowerCase();
      if (foundEttn && foundEttn !== ettn.toLowerCase()) return null;
      return { docNo };
    } catch (error) {
      if (error instanceof MysoftApiError) return null;
      throw error;
    }
  }

  private async fetchPdf(mysoft: MysoftEdocumentClient, ettn: string, tenant: string): Promise<Uint8Array> {
    const raw = await mysoft.getOutgoingPdf(ettn, tenant);
    let bytes = toBytes(raw);
    if (!bytes) throw new Error("Mysoft fatura PDF'i okunamadı.");
    if (isZipBytes(bytes)) {
      const inner = await extractFirstFileFromZip(bytes);
      if (!inner) throw new Error("Mysoft PDF zip dosyası açılamadı.");
      bytes = inner.bytes;
    }
    if (!isPdfBytes(bytes)) throw new Error("Mysoft'tan dönen dosya PDF değil.");
    return bytes;
  }

  /** Bir bağlantı için otomatik tur: uygun paketleri bulur ve sırayla faturalar. */
  async syncConnection(companyId: string, options: { days?: number } = {}): Promise<{ summary: string; results: PackageResult[] }> {
    const conn = this.requireConnection(companyId);
    const results: PackageResult[] = [];
    try {
      const statuses = new Set(conn.invoiceStatuses.map((s) => s.toLowerCase()));
      const packages = await this.fetchPackages(conn, { days: options.days ?? 3 });
      const candidates = packages
        .filter((p) => statuses.has(String(p.shipmentPackageStatus || p.status || "").toLowerCase()))
        .filter((p) => !p.invoiceLink)
        .filter((p) => !conn.startFrom || !p.orderDate || p.orderDate >= conn.startFrom - 3 * 60 * 60 * 1000)
        .sort((a, b) => (a.orderDate || 0) - (b.orderDate || 0));

      for (const pkg of candidates) {
        const id = packageIdOf(pkg);
        const entry = this.deps.store.getEntry(companyId, id);
        if (entry && (entry.state === "delivered" || entry.state === "needs_review")) continue;
        if (entry?.state === "error" && entry.attempts >= 5) continue; // 5 başarısız denemeden sonra elle bakılsın
        try {
          results.push(await this.invoicePackage(companyId, id, { preloaded: pkg }));
        } catch (error) {
          results.push({ packageId: id, orderNumber: String(pkg.orderNumber || ""), state: "error", message: errMsg(error) });
          if (error instanceof TrendyolApiError && (error.status === 401 || error.status === 403 || error.status === 503)) break;
        }
      }
      // Kesilmiş ama Trendyol'a yüklenememiş eski kayıtları da tekrar dene.
      for (const entry of this.deps.store.listEntries(companyId, 500)) {
        if (entry.state !== "invoiced" || results.some((r) => r.packageId === entry.packageId)) continue;
        try {
          results.push(await this.invoicePackage(companyId, entry.packageId));
        } catch (error) {
          results.push({ packageId: entry.packageId, orderNumber: entry.orderNumber, state: "error", message: errMsg(error) });
        }
      }
      const count = (state: string) => results.filter((r) => r.state === state).length;
      const summary =
        results.length === 0
          ? "Faturalanacak yeni paket yok."
          : `${count("delivered")} iletildi, ${count("invoiced")} kesildi (iletim bekliyor), ${count("needs_review")} inceleme, ${count("error")} hata.`;
      await this.deps.store.patchConnection(companyId, { lastSyncAt: new Date().toISOString(), lastSyncSummary: summary, lastError: "" });
      return { summary, results };
    } catch (error) {
      await this.deps.store.patchConnection(companyId, { lastSyncAt: new Date().toISOString(), lastError: errMsg(error) });
      throw error;
    }
  }

  /** Otomatik faturalaması açık tüm bağlantılar için tur atar. */
  async syncAll(): Promise<Array<{ companyId: string; summary: string }>> {
    const out: Array<{ companyId: string; summary: string }> = [];
    for (const conn of this.deps.store.listConnections()) {
      if (!conn.autoInvoice) continue;
      try {
        const { summary } = await this.syncConnection(conn.companyId);
        out.push({ companyId: conn.companyId, summary });
      } catch (error) {
        out.push({ companyId: conn.companyId, summary: `Hata: ${errMsg(error)}` });
      }
    }
    return out;
  }

  private requireConnection(companyId: string): TrendyolConnectionRecord {
    const conn = this.deps.store.getConnection(companyId);
    if (!conn) throw new TrendyolApiError("Bu firma için Trendyol bağlantısı yok.", 404, "TRENDYOL_NOT_CONNECTED");
    return conn;
  }
}

function result(entry: LedgerEntry, message: string): PackageResult {
  return {
    packageId: entry.packageId,
    orderNumber: entry.orderNumber,
    state: entry.state,
    message,
    docNo: entry.docNo,
    ettn: entry.ettn,
  };
}

function errMsg(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function toBytes(raw: unknown): Uint8Array | null {
  if (raw instanceof Uint8Array) return raw;
  if (raw instanceof ArrayBuffer) return new Uint8Array(raw);
  if (raw && typeof raw === "object") {
    const rec = raw as Record<string, unknown>;
    if (rec.bytes instanceof Uint8Array) return rec.bytes;
    for (const key of ["data", "file", "content", "result"]) {
      const value = rec[key];
      if (typeof value === "string") return fromBase64(value);
      if (value && typeof value === "object") {
        const nested = toBytes(value);
        if (nested) return nested;
      }
    }
  }
  if (typeof raw === "string") return fromBase64(raw);
  return null;
}

function fromBase64(value: string): Uint8Array | null {
  const clean = value.replace(/^data:[^,]+,/, "").replace(/\s/g, "");
  if (!clean || !/^[A-Za-z0-9+/=]+$/.test(clean)) return null;
  const buf = Buffer.from(clean, "base64");
  return buf.length ? new Uint8Array(buf) : null;
}
