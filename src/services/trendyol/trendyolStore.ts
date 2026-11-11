/**
 * Trendyol bağlantıları ve paket faturalama defteri (sunucu tarafı).
 *
 * - API Secret ve API Key AES-256-GCM ile şifrelenir. Anahtar:
 *   TRENDYOL_SECRET_KEY (önerilen; en az 32 karakter rastgele değer).
 *   Tanımlı değilse data/.trendyol.key dosyasında rastgele bir anahtar üretilir
 *   (yalnızca kalıcı diskli VPS için uygundur; Cloud Run'da mutlaka env verin).
 * - Defter (ledger), her paketin hangi aşamada olduğunu tutar ve aynı paketin
 *   iki kez faturalanmasını engelleyen ilk savunma hattıdır. (İkinci hat:
 *   deterministik ETTN, üçüncü hat: Trendyol'daki paket faturası kontrolü.)
 * - Depo, atomik yazımla (tmp + rename) tek JSON dosyasıdır. Yoğun kullanımda
 *   PostgreSQL tablosuna taşınması önerilir (docs/trendyol-entegrasyon.md).
 *
 * Bu dosya asla /api/cloud-sync içine yazılmaz: o uç noktalar kimlik
 * doğrulamasızdır ve içerik herkese açık okunabilir.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { CompanySettings } from "../../types.ts";
import type { TrendyolEnvironment } from "./trendyolClient.ts";

export type LedgerState =
  | "sending" // Mysoft'a gönderim başladı (süreç kesilirse ETTN ile doğrulanır)
  | "invoiced" // e-Fatura/e-Arşiv kesildi, Trendyol'a henüz iletilmedi
  | "delivered" // fatura Trendyol paketine yüklendi — iş bitti
  | "needs_review" // otomatik kesilmedi; kullanıcı bakmalı
  | "error"; // geçici hata; sonraki turda yeniden denenir

export interface TrendyolConnectionSettings {
  environment: TrendyolEnvironment;
  /** Otomatik faturalama açık mı (zamanlayıcı / cron). */
  autoInvoice: boolean;
  /** Bu durumlardaki paketler faturalanır. */
  invoiceStatuses: string[];
  /** Bu tarihten (ms) önce oluşturulan siparişlere dokunulmaz. */
  startFrom: number;
  /** Fatura PDF'i Trendyol paketine yüklensin mi. */
  uploadInvoiceToTrendyol: boolean;
  /** Yüklemeden sonra paket statüsü "Invoiced" yapılsın mı (Picking aşamasındaki paketler için). */
  markPackageInvoiced: boolean;
  /** Satırda KDV oranı gelmezse kullanılacak oran; boşsa paket incelemeye düşer. */
  fallbackVatRate?: number;
  /** Faturayı kesen firmanın Mysoft VKN/TCKN değeri (boşsa firma ayarlarından). */
  tenantIdentifierNumber?: string;
  /** Trendyol "storeFrontCode" başlığı (dosya yüklemede; gerekirse). */
  storeFrontCode?: string;
}

export interface TrendyolConnectionRecord extends TrendyolConnectionSettings {
  companyId: string;
  ownerUid: string;
  sellerId: string;
  apiKeyEnc: string;
  apiSecretEnc: string;
  /** Firma bilgisinin son kopyası (sunucu senkron verisi yoksa yedek). */
  companySettingsSnapshot?: Partial<CompanySettings>;
  createdAt: string;
  updatedAt: string;
  lastSyncAt?: string;
  lastSyncSummary?: string;
  lastError?: string;
}

export interface LedgerEntry {
  companyId: string;
  packageId: string;
  orderNumber: string;
  state: LedgerState;
  ettn?: string;
  ettnAttempt: number;
  docNo?: string;
  eDocumentType?: "EFATURA" | "EARSIVFATURA";
  buyerName?: string;
  amount?: number;
  message?: string;
  attempts: number;
  invoicedAt?: string;
  deliveredAt?: string;
  updatedAt: string;
}

interface StoreShape {
  version: 1;
  connections: Record<string, TrendyolConnectionRecord>;
  ledger: Record<string, LedgerEntry>; // anahtar: `${companyId}:${packageId}`
}

export const DEFAULT_SETTINGS: TrendyolConnectionSettings = {
  environment: "prod",
  autoInvoice: false,
  invoiceStatuses: ["Picking", "Invoiced", "Shipped", "Delivered"],
  startFrom: 0,
  uploadInvoiceToTrendyol: true,
  markPackageInvoiced: false,
};

function resolveKey(dataDir: string): Buffer {
  const fromEnv = process.env.TRENDYOL_SECRET_KEY?.trim();
  if (fromEnv) return crypto.createHash("sha256").update(fromEnv).digest();
  const keyPath = path.join(dataDir, ".trendyol.key");
  try {
    const existing = fs.readFileSync(keyPath, "utf8").trim();
    if (existing) return Buffer.from(existing, "base64");
  } catch {
    /* yok — üret */
  }
  const generated = crypto.randomBytes(32);
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(keyPath, generated.toString("base64"), { mode: 0o600 });
  console.warn(
    "[trendyol] TRENDYOL_SECRET_KEY tanımlı değil; data/.trendyol.key üretildi. " +
      "Sunucu diski kalıcı değilse kayıtlı Trendyol bilgileri yeniden başlatmada okunamaz.",
  );
  return generated;
}

export class TrendyolStore {
  private readonly filePath: string;
  private readonly key: Buffer;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(filePath = process.env.TRENDYOL_STORE_PATH || path.join(process.cwd(), "data", "trendyol_store.json")) {
    this.filePath = filePath;
    this.key = resolveKey(path.dirname(filePath));
  }

  // ---------- şifreleme ----------
  encrypt(plain: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", this.key, iv);
    const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return ["v1", iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(".");
  }

  decrypt(payload: string): string {
    const [version, ivB64, tagB64, dataB64] = String(payload || "").split(".");
    if (version !== "v1" || !ivB64 || !tagB64 || !dataB64) throw new Error("Şifreli veri biçimi tanınmadı.");
    const decipher = crypto.createDecipheriv("aes-256-gcm", this.key, Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]).toString("utf8");
  }

  // ---------- dosya ----------
  private read(): StoreShape {
    try {
      const raw = fs.readFileSync(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as StoreShape;
      return {
        version: 1,
        connections: parsed.connections || {},
        ledger: parsed.ledger || {},
      };
    } catch {
      return { version: 1, connections: {}, ledger: {} };
    }
  }

  private write(data: StoreShape): void {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data), { mode: 0o600 });
    fs.renameSync(tmp, this.filePath);
  }

  /** Okuma-değiştir-yaz işlemlerini sıraya sokar (aynı süreç içinde yarış olmasın). */
  private mutate<T>(fn: (data: StoreShape) => T): Promise<T> {
    const run = this.queue.then(() => {
      const data = this.read();
      const result = fn(data);
      this.write(data);
      return result;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  // ---------- bağlantılar ----------
  getConnection(companyId: string): TrendyolConnectionRecord | null {
    return this.read().connections[companyId] || null;
  }

  listConnections(): TrendyolConnectionRecord[] {
    return Object.values(this.read().connections);
  }

  getCredentials(record: TrendyolConnectionRecord) {
    return {
      sellerId: record.sellerId,
      apiKey: this.decrypt(record.apiKeyEnc),
      apiSecret: this.decrypt(record.apiSecretEnc),
      environment: record.environment,
    };
  }

  upsertConnection(input: {
    companyId: string;
    ownerUid: string;
    sellerId: string;
    apiKey?: string;
    apiSecret?: string;
    settings: Partial<TrendyolConnectionSettings>;
    companySettingsSnapshot?: Partial<CompanySettings>;
  }): Promise<TrendyolConnectionRecord> {
    return this.mutate((data) => {
      const existing = data.connections[input.companyId];
      const nowIso = new Date().toISOString();
      if (!existing && (!input.apiKey || !input.apiSecret)) {
        throw new Error("İlk kayıtta API Key ve API Secret zorunludur.");
      }
      const record: TrendyolConnectionRecord = {
        ...DEFAULT_SETTINGS,
        ...(existing || {}),
        ...stripUndefined(input.settings),
        companyId: input.companyId,
        ownerUid: existing?.ownerUid || input.ownerUid,
        sellerId: input.sellerId,
        apiKeyEnc: input.apiKey ? this.encrypt(input.apiKey.trim()) : existing!.apiKeyEnc,
        apiSecretEnc: input.apiSecret ? this.encrypt(input.apiSecret.trim()) : existing!.apiSecretEnc,
        companySettingsSnapshot: input.companySettingsSnapshot || existing?.companySettingsSnapshot,
        createdAt: existing?.createdAt || nowIso,
        updatedAt: nowIso,
      };
      // İlk kurulumda geriye dönük toplu fatura kesilmesin: başlangıç = şimdi.
      if (!record.startFrom) record.startFrom = Date.now();
      data.connections[input.companyId] = record;
      return record;
    });
  }

  patchConnection(companyId: string, patch: Partial<TrendyolConnectionRecord>): Promise<void> {
    return this.mutate((data) => {
      const existing = data.connections[companyId];
      if (existing) data.connections[companyId] = { ...existing, ...stripUndefined(patch) };
    });
  }

  deleteConnection(companyId: string): Promise<void> {
    return this.mutate((data) => {
      delete data.connections[companyId];
    });
  }

  // ---------- defter ----------
  getEntry(companyId: string, packageId: string): LedgerEntry | null {
    return this.read().ledger[`${companyId}:${packageId}`] || null;
  }

  listEntries(companyId: string, limit = 200): LedgerEntry[] {
    return Object.values(this.read().ledger)
      .filter((e) => e.companyId === companyId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, limit);
  }

  saveEntry(entry: Omit<LedgerEntry, "updatedAt" | "attempts" | "ettnAttempt"> & Partial<LedgerEntry>): Promise<LedgerEntry> {
    return this.mutate((data) => {
      const key = `${entry.companyId}:${entry.packageId}`;
      const prev = data.ledger[key];
      const next = {
        ...(prev || {}),
        ...stripUndefined(entry),
        attempts: entry.attempts ?? prev?.attempts ?? 0,
        ettnAttempt: entry.ettnAttempt ?? prev?.ettnAttempt ?? 0,
        updatedAt: new Date().toISOString(),
      } as LedgerEntry;
      data.ledger[key] = next;
      return next;
    });
  }
}

function stripUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
}

export function maskSecret(value: string): string {
  if (!value) return "";
  return value.length <= 4 ? "••••" : `••••${value.slice(-4)}`;
}
