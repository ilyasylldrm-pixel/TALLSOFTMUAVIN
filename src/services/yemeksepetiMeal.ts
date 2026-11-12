import { Router } from "express";

// Delivery Hero POS middleware Order Report Service. The production URL is issued
// during Yemeksepeti POS onboarding and must be configured by the operator.
export function createYemeksepetiMealRouter(fetcher: typeof fetch = fetch): Router {
  const router = Router();
  router.post("/orders", async (req, res) => {
    const { chainCode, vendorId, username, password, mode } = req.body || {};
    const base = process.env.YEMEKSEPETI_POS_BASE_URL?.trim().replace(/\/$/, "");
    if (!base) { res.status(503).json({ error: "Yemeksepeti POS üretim API adresi sunucuda YEMEKSEPETI_POS_BASE_URL olarak tanımlanmalı." }); return; }
    let origin: URL;
    try { origin = new URL(base); } catch { res.status(503).json({ error: "Yemeksepeti POS API adresi geçersiz." }); return; }
    if (origin.protocol !== "https:" || origin.pathname !== "/" || origin.search || origin.hash || !origin.hostname.endsWith(".restaurant-partners.com")) {
      res.status(503).json({ error: "Yemeksepeti POS API adresi HTTPS restaurant-partners.com alanında olmalı." }); return;
    }
    if (![chainCode, vendorId, username, password].every((value) => typeof value === "string" && value.trim()) || !["test", "sync"].includes(mode)) {
      res.status(400).json({ error: "Yemeksepeti için zincir kodu, restoran kodu, POS kullanıcı adı ve şifre gerekli." }); return;
    }
    if (!/^[\w-]{1,100}$/.test(chainCode) || !/^[\w-]{1,100}$/.test(vendorId)) {
      res.status(400).json({ error: "Zincir ve restoran kodları geçersiz." }); return;
    }
    const api = async (path: string, token: string, options?: RequestInit) => {
      const response = await fetcher(`${base}${path}`, { ...options, headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options?.headers }, signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(response.status === 401 ? "POS kullanıcı adı veya şifre reddedildi (401)." : response.status === 403 ? "Zincir/restoran erişim yetkisi reddedildi (403)." : `Yemeksepeti POS API hatası (${response.status}).`);
      return response.json();
    };
    try {
      const form = new URLSearchParams({ username, password, grant_type: "client_credentials" });
      const login = await api("/v2/login", "", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form });
      if (typeof login.access_token !== "string" || !login.access_token) throw new Error("POS giriş yanıtında erişim tokenı yok.");
      const prefix = `/v2/chains/${encodeURIComponent(chainCode)}/orders`;
      const query = (status: string) => `${prefix}/ids?status=${status}&pastNumberOfHours=24&vendorId=${encodeURIComponent(vendorId)}`;
      const accepted = await api(query("accepted"), login.access_token);
      if (!Array.isArray(accepted.orderIdentifiers)) throw new Error("POS sipariş kimlikleri okunamadı.");
      if (mode === "test") { res.json({ connected: true }); return; }
      const cancelled = await api(query("cancelled"), login.access_token);
      if (!Array.isArray(cancelled.orderIdentifiers)) throw new Error("POS iptal kimlikleri okunamadı.");
      const ids = [...new Set([...accepted.orderIdentifiers, ...cancelled.orderIdentifiers])];
      if (ids.length > 500) throw new Error("24 saatlik sipariş sayısı 500 sınırını aştı; eksik veri kaydedilmedi.");
      const orders = [];
      for (const id of ids) {
        if (typeof id !== "string" || !id) throw new Error("POS geçersiz sipariş kimliği döndürdü.");
        const detail = await api(`${prefix}/${encodeURIComponent(id)}`, login.access_token);
        if (!detail?.order || typeof detail.order !== "object") throw new Error(`POS sipariş detayı okunamadı: ${id}`);
        orders.push(detail.order);
      }
      res.json({ orders });
    } catch (error) {
      res.status(502).json({ error: error instanceof Error ? error.message : "Yemeksepeti POS bağlantı hatası." });
    }
  });
  return router;
}
