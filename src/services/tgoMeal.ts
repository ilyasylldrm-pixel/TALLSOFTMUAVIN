import { Router } from "express";

const BASE_URL = "https://api.tgoapis.com";
const MAX_PAGES = 20;
const PAGE_SIZE = 50;
const REQUEST_TIMEOUT_MS = 15_000;

export function createTgoMealRouter(fetcher: typeof fetch = fetch): Router {
  const router = Router();

  router.post("/packages", async (req, res) => {
    const { supplierId, apiKey, apiSecret, executorEmail, mode } = req.body || {};
    if (
      !/^\d+$/.test(String(supplierId || "")) ||
      !String(apiKey || "").trim() ||
      !String(apiSecret || "").trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(executorEmail || ""))
    ) {
      res.status(400).json({
        error: "TGO için sayısal Satıcı ID, API Key, API Secret ve işlem yapan kişinin e-postası gerekli.",
      });
      return;
    }

    const integratorName =
      (process.env.TGO_INTEGRATOR_NAME || "TallsoftMuavin")
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 30) || "SelfIntegration";
    const headers = {
      Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`,
      "User-Agent": `${supplierId} - ${integratorName}`,
      "x-agentname": integratorName,
      "x-executor-user": String(executorEmail).trim(),
      Accept: "application/json",
    };

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
          const message =
            response.status === 401
              ? "TGO kimlik bilgileri veya Satıcı ID hatalı (401)."
              : response.status === 403
                ? "TGO erişimi reddetti (403). User-Agent veya entegrasyon yetkisini kontrol edin."
                : response.status === 429
                  ? "TGO istek sınırına ulaşıldı (429); kısa süre sonra tekrar deneyin."
                  : `TGO API hatası (${response.status}).`;
          res
            .status(response.status >= 400 && response.status < 500 ? response.status : 502)
            .json({ error: message });
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

  return router;
}
