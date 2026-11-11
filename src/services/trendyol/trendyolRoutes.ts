/**
 * /api/marketplace/trendyol — Trendyol bağlantısı ve otomatik faturalama uç noktaları.
 *
 * GET    /connection?companyId=          Bağlantı durumu (secret maskeli)
 * PUT    /connection                      API bilgilerini kaydet/güncelle (+ bağlantı testi)
 * POST   /connection/test                 Kayıtlı bilgilerle bağlantı testi
 * DELETE /connection?companyId=          Bağlantıyı sil
 * GET    /packages?companyId=&days=&status=   Paketler + fatura önizleme + defter
 * POST   /packages/:packageId/invoice     Tek paketi faturala (body: companyId, force?)
 * POST   /sync                            Bu firma için otomatik turu şimdi çalıştır
 * GET    /ledger?companyId=              Son fatura kayıtları
 * POST   /cron                            Tüm firmalar (x-cron-secret başlığı ile; Cloud Scheduler için)
 */
import { Router, type Response } from "express";
import type { CompanySettings } from "../../types.ts";
import { requireAuth, type AuthRequest } from "../../middleware/auth.ts";
import { MysoftEdocumentClient, getMysoftConfig } from "../mysoftEdocument.ts";
import { TrendyolApiError, TrendyolClient, normalizeSellerId, type TrendyolEnvironment } from "./trendyolClient.ts";
import { TrendyolInvoicer } from "./trendyolInvoicer.ts";
import { DEFAULT_SETTINGS, TrendyolStore, maskSecret, type TrendyolConnectionRecord } from "./trendyolStore.ts";

const VALID_STATUSES = ["Created", "Picking", "Invoiced", "Shipped", "Delivered", "AtCollectionPoint"];

export interface TrendyolModule {
  router: Router;
  invoicer: TrendyolInvoicer;
  startScheduler: () => void;
}

export function createTrendyolModule(options: {
  resolveCompanySettings: (companyId: string) => Partial<CompanySettings> | null;
}): TrendyolModule {
  const store = new TrendyolStore();
  // Ortam değişkenleri dotenv ile yüklendikten sonra oluşturulur (modül içi singleton erken okunabilir).
  const mysoftEdocumentClient = new MysoftEdocumentClient(getMysoftConfig());
  const invoicer = new TrendyolInvoicer({
    store,
    mysoft: mysoftEdocumentClient,
    resolveCompanySettings: options.resolveCompanySettings,
  });
  const router = Router();

  const fail = (res: Response, error: unknown) => {
    if (error instanceof TrendyolApiError) {
      res.status(error.status >= 400 && error.status < 600 ? error.status : 502).json({ error: error.message, code: error.code });
      return;
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error("[trendyol]", message);
    res.status(500).json({ error: message, code: "TRENDYOL_INTERNAL" });
  };

  const companyIdOf = (req: AuthRequest): string => {
    const raw = (req.body && req.body.companyId) || req.query.companyId || req.headers["x-company-id"];
    const value = String(raw || "").trim();
    if (!value || value.length > 120) throw new TrendyolApiError("companyId zorunlu.", 400, "INVALID_REQUEST");
    return value;
  };

  /** Bağlantıyı yalnızca kuran kullanıcı (veya admin) yönetebilir. */
  const authorizeConnection = (req: AuthRequest, conn: TrendyolConnectionRecord | null) => {
    if (!conn) return;
    const uid = req.user?.uid;
    const isAdmin = (req.user as { role?: string } | undefined)?.role === "admin";
    if (conn.ownerUid && uid !== conn.ownerUid && !isAdmin) {
      throw new TrendyolApiError("Bu firmanın Trendyol bağlantısına erişim yetkiniz yok.", 403, "FORBIDDEN");
    }
  };

  const publicView = (conn: TrendyolConnectionRecord | null) => {
    if (!conn) return { connected: false, defaults: DEFAULT_SETTINGS };
    let apiKeyMasked = "";
    let secretReadable = true;
    try {
      apiKeyMasked = maskSecret(store.decrypt(conn.apiKeyEnc));
      store.decrypt(conn.apiSecretEnc);
    } catch {
      secretReadable = false;
    }
    return {
      connected: true,
      secretReadable,
      sellerId: conn.sellerId,
      apiKeyMasked,
      environment: conn.environment,
      autoInvoice: conn.autoInvoice,
      invoiceStatuses: conn.invoiceStatuses,
      startFrom: conn.startFrom,
      uploadInvoiceToTrendyol: conn.uploadInvoiceToTrendyol,
      markPackageInvoiced: conn.markPackageInvoiced,
      fallbackVatRate: conn.fallbackVatRate ?? null,
      tenantIdentifierNumber: conn.tenantIdentifierNumber || "",
      storeFrontCode: conn.storeFrontCode || "",
      lastSyncAt: conn.lastSyncAt || null,
      lastSyncSummary: conn.lastSyncSummary || "",
      lastError: conn.lastError || "",
      mysoftMockMode: mysoftEdocumentClient.config.mockMode,
      updatedAt: conn.updatedAt,
    };
  };

  router.get("/connection", requireAuth, (req: AuthRequest, res) => {
    try {
      const companyId = companyIdOf(req);
      const conn = store.getConnection(companyId);
      authorizeConnection(req, conn);
      res.json(publicView(conn));
    } catch (error) {
      fail(res, error);
    }
  });

  router.put("/connection", requireAuth, async (req: AuthRequest, res) => {
    try {
      const companyId = companyIdOf(req);
      const existing = store.getConnection(companyId);
      authorizeConnection(req, existing);
      const body = (req.body || {}) as Record<string, unknown>;
      const sellerId = normalizeSellerId(body.sellerId ?? existing?.sellerId);
      const apiKey = typeof body.apiKey === "string" && body.apiKey.trim() ? body.apiKey.trim() : undefined;
      const apiSecret = typeof body.apiSecret === "string" && body.apiSecret.trim() ? body.apiSecret.trim() : undefined;
      const environment: TrendyolEnvironment = body.environment === "stage" ? "stage" : "prod";
      if (!sellerId) throw new TrendyolApiError("Satıcı ID (Cari ID) zorunlu.", 400, "INVALID_REQUEST");

      // Yeni bilgi girildiyse kaydetmeden önce Trendyol'da doğrula.
      if (apiKey || apiSecret || !existing || sellerId !== existing.sellerId || environment !== existing.environment) {
        const creds = existing ? store.getCredentials(existing) : { apiKey: "", apiSecret: "" };
        const client = new TrendyolClient({
          sellerId,
          apiKey: apiKey || creds.apiKey,
          apiSecret: apiSecret || creds.apiSecret,
          environment,
        });
        await client.testConnection();
      }

      const statuses = Array.isArray(body.invoiceStatuses)
        ? (body.invoiceStatuses as unknown[]).map(String).filter((s) => VALID_STATUSES.includes(s))
        : undefined;
      const vat = body.fallbackVatRate === null || body.fallbackVatRate === "" ? undefined : Number(body.fallbackVatRate);
      const record = await store.upsertConnection({
        companyId,
        ownerUid: req.user?.uid || "",
        sellerId,
        apiKey,
        apiSecret,
        companySettingsSnapshot:
          body.companySettings && typeof body.companySettings === "object"
            ? (body.companySettings as Partial<CompanySettings>)
            : undefined,
        settings: {
          environment,
          autoInvoice: typeof body.autoInvoice === "boolean" ? body.autoInvoice : undefined,
          invoiceStatuses: statuses && statuses.length ? statuses : undefined,
          uploadInvoiceToTrendyol: typeof body.uploadInvoiceToTrendyol === "boolean" ? body.uploadInvoiceToTrendyol : undefined,
          markPackageInvoiced: typeof body.markPackageInvoiced === "boolean" ? body.markPackageInvoiced : undefined,
          fallbackVatRate: vat !== undefined && [0, 1, 10, 20].includes(vat) ? vat : undefined,
          tenantIdentifierNumber:
            typeof body.tenantIdentifierNumber === "string" ? body.tenantIdentifierNumber.replace(/\D/g, "") : undefined,
          storeFrontCode: typeof body.storeFrontCode === "string" ? body.storeFrontCode.trim() : undefined,
          startFrom: typeof body.startFrom === "number" && body.startFrom > 0 ? body.startFrom : undefined,
        },
      });
      res.json(publicView(record));
    } catch (error) {
      fail(res, error);
    }
  });

  router.post("/connection/test", requireAuth, async (req: AuthRequest, res) => {
    try {
      const conn = store.getConnection(companyIdOf(req));
      authorizeConnection(req, conn);
      if (!conn) throw new TrendyolApiError("Kayıtlı bağlantı yok.", 404, "TRENDYOL_NOT_CONNECTED");
      const result = await new TrendyolClient(store.getCredentials(conn)).testConnection();
      res.json({ ...result, mysoftMockMode: mysoftEdocumentClient.config.mockMode });
    } catch (error) {
      fail(res, error);
    }
  });

  router.delete("/connection", requireAuth, async (req: AuthRequest, res) => {
    try {
      const companyId = companyIdOf(req);
      authorizeConnection(req, store.getConnection(companyId));
      await store.deleteConnection(companyId);
      res.json({ ok: true });
    } catch (error) {
      fail(res, error);
    }
  });

  router.get("/packages", requireAuth, async (req: AuthRequest, res) => {
    try {
      const companyId = companyIdOf(req);
      authorizeConnection(req, store.getConnection(companyId));
      const days = Math.min(30, Math.max(1, Number(req.query.days) || 7));
      const status = typeof req.query.status === "string" && VALID_STATUSES.includes(req.query.status) ? req.query.status : undefined;
      res.json({ packages: await invoicer.previewPackages(companyId, { days, status }) });
    } catch (error) {
      fail(res, error);
    }
  });

  router.post("/packages/:packageId/invoice", requireAuth, async (req: AuthRequest, res) => {
    try {
      const companyId = companyIdOf(req);
      authorizeConnection(req, store.getConnection(companyId));
      const packageId = String(req.params.packageId || "").replace(/\D/g, "");
      if (!packageId) throw new TrendyolApiError("Geçersiz paket numarası.", 400, "INVALID_REQUEST");
      res.json(await invoicer.invoicePackage(companyId, packageId, { force: req.body?.force === true }));
    } catch (error) {
      fail(res, error);
    }
  });

  router.post("/sync", requireAuth, async (req: AuthRequest, res) => {
    try {
      const companyId = companyIdOf(req);
      authorizeConnection(req, store.getConnection(companyId));
      res.json(await invoicer.syncConnection(companyId, { days: Math.min(30, Number(req.body?.days) || 3) }));
    } catch (error) {
      fail(res, error);
    }
  });

  router.get("/ledger", requireAuth, (req: AuthRequest, res) => {
    try {
      const companyId = companyIdOf(req);
      authorizeConnection(req, store.getConnection(companyId));
      res.json({ entries: store.listEntries(companyId, 200) });
    } catch (error) {
      fail(res, error);
    }
  });

  // Cloud Scheduler / harici cron: x-cron-secret başlığı TRENDYOL_CRON_SECRET ile eşleşmeli.
  router.post("/cron", async (req, res) => {
    const secret = process.env.TRENDYOL_CRON_SECRET?.trim();
    if (!secret || req.headers["x-cron-secret"] !== secret) {
      res.status(401).json({ error: "Yetkisiz" });
      return;
    }
    try {
      res.json({ results: await invoicer.syncAll() });
    } catch (error) {
      fail(res, error);
    }
  });

  /**
   * Süreç içi zamanlayıcı (VPS / PM2 için). Cloud Run'da örnek sayısı 0'a
   * inebildiği için /cron + Cloud Scheduler kullanın.
   * PM2 cluster modunda yalnızca 0 numaralı süreç çalıştırır (çift kesim olmasın).
   */
  const startScheduler = () => {
    if (process.env.TRENDYOL_AUTO_SYNC !== "true") return;
    const instance = process.env.NODE_APP_INSTANCE;
    if (instance !== undefined && instance !== "0") return;
    const minutes = Math.max(5, Number(process.env.TRENDYOL_SYNC_INTERVAL_MINUTES) || 15);
    let busy = false;
    const tick = async () => {
      if (busy) return;
      busy = true;
      try {
        const results = await invoicer.syncAll();
        results.forEach((r) => console.log(`[trendyol] ${r.companyId}: ${r.summary}`));
      } catch (error) {
        console.error("[trendyol] otomatik tur hatası:", error instanceof Error ? error.message : error);
      } finally {
        busy = false;
      }
    };
    setTimeout(tick, 60_000);
    setInterval(tick, minutes * 60_000).unref();
    console.log(`[trendyol] Otomatik faturalama zamanlayıcısı aktif (${minutes} dk).`);
  };

  return { router, invoicer, startScheduler };
}
