import { Router } from "express";

const BASE_URL = "https://api.tgoapis.com";
const MAX_PAGES = 20;
const PAGE_SIZE = 50;
const REQUEST_TIMEOUT_MS = 15_000;

export function createTgoMealRouter(fetcher: typeof fetch = fetch): Router {
  const router = Router();

  /** İstek gövdesindeki TGO kimlik bilgilerini doğrular; geçersizse 400 yazar ve null döner. */
  const resolveTgoContext = (
    req: { body?: Record<string, unknown> },
    res: { status(code: number): { json(body: unknown): void } },
  ): { supplierId: string; headers: Record<string, string> } | null => {
    const { supplierId, apiKey, apiSecret, executorEmail } = req.body || {};
    if (
      !/^\d+$/.test(String(supplierId || "")) ||
      !String(apiKey || "").trim() ||
      !String(apiSecret || "").trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(executorEmail || ""))
    ) {
      res.status(400).json({
        error: "TGO için sayısal Satıcı ID, API Key, API Secret ve işlem yapan kişinin e-postası gerekli.",
      });
      return null;
    }
    const integratorName =
      (process.env.TGO_INTEGRATOR_NAME || "TallsoftMuavin")
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 30) || "SelfIntegration";
    return {
      supplierId: String(supplierId),
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`,
        "User-Agent": `${supplierId} - ${integratorName}`,
        "x-agentname": integratorName,
        "x-executor-user": String(executorEmail).trim(),
        Accept: "application/json",
      },
    };
  };

  /** TGO hata yanıtını standart mesaja çevirip istemciye yazar. */
  const sendTgoError = (
    res: { status(code: number): { json(body: unknown): void } },
    response: Response,
  ): void => {
    const message =
      response.status === 401
        ? "TGO kimlik bilgileri veya Satıcı ID hatalı (401)."
        : response.status === 403
          ? "TGO erişimi reddetti (403). User-Agent veya entegrasyon yetkisini kontrol edin."
          : response.status === 404
            ? "TGO paketi bulunamadı (404); paket kimliğini doğrulayın."
            : response.status === 409
              ? "TGO çakışma hatası (409); paket teslim edilmiş veya iptal edilmiş olabilir."
              : response.status === 429
                ? "TGO istek sınırına ulaşıldı (429); kısa süre sonra tekrar deneyin."
                : `TGO API hatası (${response.status}).`;
    res
      .status(response.status >= 400 && response.status < 500 ? response.status : 502)
      .json({ error: message });
  };

  router.post("/packages", async (req, res) => {
    const { mode } = req.body || {};
    const context = resolveTgoContext(req, res);
    if (!context) return;
    const { supplierId, headers } = context;

    try {
      const packages: unknown[] = [];
      for (let page = 0; page < MAX_PAGES; page += 1) {
        const url = new URL(`${BASE_URL}/integrator/order/meal/suppliers/${supplierId}/packages`);
        url.searchParams.set("page", String(page));
        url.searchParams.set("size", String(PAGE_SIZE));
        if (mode !== "test") {
          url.searchParams.set(
            "packageModificationStartDate",
            String(Date.now() - 14 * 24 * 60 * 60 * 1000),
          );
        }

        const response = await fetcher(url, {
          headers,
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        if (!response.ok) {
          sendTgoError(res, response);
          return;
        }

        const data = (await response.json()) as { content?: unknown[]; totalPages?: number };
        if (!Array.isArray(data.content)) {
          throw new Error("TGO beklenmeyen sipariş yanıtı döndürdü.");
        }
        if (mode === "test") {
          res.json({ connected: true });
          return;
        }

        packages.push(...data.content);
        if (page + 1 >= (Number(data.totalPages) || 1)) {
          res.json({ packages });
          return;
        }
      }

      res.status(502).json({
        error: `TGO sonucu ${MAX_PAGES} sayfayı aştı; eksik veri kaydedilmedi. Daha dar tarih aralığıyla tekrar deneyin.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bilinmeyen bağlantı hatası";
      res.status(502).json({
        error:
          message === "TGO beklenmeyen sipariş yanıtı döndürdü."
            ? message
            : "TGO servisine bağlanılamadı veya yanıt zaman aşımına uğradı.",
      });
    }
  });

  /**
   * Kesilen faturayı TGO siparişine bildirir:
   *  1) Paketi "Invoiced" yapar (PUT /integrator/order/meal/suppliers/{id}/packages/invoiced)
   *     — TGO'nun satıcı ödemesini hesaplaması için zorunlu bildirim.
   *  2) Fatura linki verilmişse iletir (POST /integrator/invoice/meal/suppliers/{id}/supplier-invoice-links/4/{orderId})
   *     — link yasal olarak 10 yıl erişilebilir olmalıdır.
   */
  router.post("/notify-invoiced", async (req, res) => {
    const context = resolveTgoContext(req, res);
    if (!context) return;
    const { supplierId, headers } = context;

    const { packageId, orderId, invoiceLink } = req.body || {};
    const trimmedPackageId = String(packageId || "").trim();
    const trimmedOrderId = String(orderId || "").trim();
    const trimmedLink = String(invoiceLink || "").trim();

    if (!trimmedPackageId) {
      res.status(400).json({ error: "TGO paket kimliği (packageId) gerekli." });
      return;
    }
    if (trimmedLink && !/^https?:\/\//i.test(trimmedLink)) {
      res.status(400).json({ error: "Fatura linki http(s) ile başlayan bir adres olmalıdır." });
      return;
    }
    if (trimmedLink && !trimmedOrderId) {
      res.status(400).json({ error: "Fatura linki gönderebilmek için TGO sipariş kimliği (orderId) gerekli." });
      return;
    }

    try {
      const invoicedResponse = await fetcher(
        new URL(`${BASE_URL}/integrator/order/meal/suppliers/${supplierId}/packages/invoiced`),
        {
          method: "PUT",
          headers,
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          body: JSON.stringify({ packageId: trimmedPackageId, actualDate: Date.now() }),
        },
      );
      if (!invoicedResponse.ok) {
        sendTgoError(res, invoicedResponse);
        return;
      }

      let linkSent = false;
      if (trimmedLink) {
        const linkResponse = await fetcher(
          new URL(
            `${BASE_URL}/integrator/invoice/meal/suppliers/${supplierId}/supplier-invoice-links/4/${encodeURIComponent(trimmedOrderId)}`,
          ),
          {
            method: "POST",
            headers,
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            body: JSON.stringify({ invoiceLink: trimmedLink }),
          },
        );
        if (!linkResponse.ok) {
          sendTgoError(res, linkResponse);
          return;
        }
        linkSent = true;
      }

      res.json({ statusNotified: true, linkSent });
    } catch {
      res.status(502).json({ error: "TGO servisine bağlanılamadı veya yanıt zaman aşımına uğradı." });
    }
  });

  return router;
}
