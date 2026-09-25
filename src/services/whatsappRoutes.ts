import { Router, Request, Response } from "express";
import { whatsAppService } from "./whatsappService.ts";

export function getWhatsAppRouter(): Router {
  const router = Router();

  // Get current WhatsApp connection status & QR code if available
  router.get("/status", (req: Request, res: Response) => {
    try {
      const status = whatsAppService.getStatus();
      res.json({ success: true, data: status });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "WhatsApp durumu alınamadı." });
    }
  });

  // Start or restart connection
  router.post("/connect", async (req: Request, res: Response) => {
    try {
      const current = whatsAppService.getStatus();
      if (current.status === "connected" && !req.body?.force) {
        return res.json({ success: true, message: "WhatsApp zaten bağlı.", data: current });
      }
      await whatsAppService.init(true);
      const status = whatsAppService.getStatus();
      res.json({ success: true, message: "Bağlantı başlatıldı.", data: status });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Bağlantı başlatılamadı." });
    }
  });

  // Logout & clear session
  router.post("/logout", async (req: Request, res: Response) => {
    try {
      await whatsAppService.logout();
      const status = whatsAppService.getStatus();
      res.json({ success: true, message: "WhatsApp oturumu sonlandırıldı.", data: status });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Oturum kapatılamadı." });
    }
  });

  // Send simple text message
  router.post("/send-message", async (req: Request, res: Response) => {
    try {
      const { phone, message, contactName } = req.body;
      if (!phone || !message) {
        return res.status(400).json({ success: false, error: "Telefon numarası ve mesaj zorunludur." });
      }

      const result = await whatsAppService.sendText(phone, message, contactName);
      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }

      res.json({ success: true, messageId: result.messageId });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Mesaj gönderilirken hata oluştu." });
    }
  });

  // Send PDF / Document message
  router.post("/send-document", async (req: Request, res: Response) => {
    try {
      const { phone, fileBase64, fileName, mimeType, caption, contactName } = req.body;
      if (!phone || !fileBase64 || !fileName) {
        return res.status(400).json({
          success: false,
          error: "Telefon numarası, belge verisi (Base64) ve dosya adı zorunludur.",
        });
      }

      // Convert Base64 string to Buffer
      let cleanBase64 = fileBase64;
      if (cleanBase64.includes(",")) {
        cleanBase64 = cleanBase64.split(",")[1];
      }
      const fileBuffer = Buffer.from(cleanBase64, "base64");

      const result = await whatsAppService.sendDocument({
        phone,
        fileBuffer,
        fileName,
        mimeType: mimeType || "application/pdf",
        caption,
        contactName,
      });

      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }

      res.json({ success: true, messageId: result.messageId });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Belge gönderilirken hata oluştu." });
    }
  });

  // Get message history / activity logs
  router.get("/logs", (req: Request, res: Response) => {
    try {
      const logs = whatsAppService.getLogs();
      res.json({ success: true, data: logs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Loglar alınamadı." });
    }
  });

  // Get message templates
  router.get("/templates", (req: Request, res: Response) => {
    try {
      const templates = whatsAppService.getTemplates();
      res.json({ success: true, data: templates });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Şablonlar alınamadı." });
    }
  });

  // Update message templates
  router.post("/templates", (req: Request, res: Response) => {
    try {
      const updated = whatsAppService.saveTemplates(req.body);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Şablonlar kaydedilemedi." });
    }
  });

  return router;
}
