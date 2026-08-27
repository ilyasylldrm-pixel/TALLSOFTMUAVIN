import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
  WASocket,
} from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import pino from "pino";
import path from "path";
import fs from "fs";

export interface WhatsAppStatus {
  status: "disconnected" | "connecting" | "qr_ready" | "connected";
  qrCodeDataUrl: string | null;
  connectedPhone: string | null;
  connectedName: string | null;
  connectedAt: string | null;
  lastError: string | null;
}

export interface WhatsAppLogItem {
  id: string;
  timestamp: string;
  type: "text" | "document";
  phone: string;
  contactName?: string;
  fileName?: string;
  caption?: string;
  status: "sent" | "failed";
  error?: string;
}

export interface WhatsAppTemplates {
  statementTemplate: string;
  invoiceTemplate: string;
  paymentTemplate: string;
}

const DEFAULT_TEMPLATES: WhatsAppTemplates = {
  statementTemplate: `Sayın *{cari_adi}* ({hesap_kodu}),\n\n*{firma}* firmamıza ait güncel Cari Hesap Ekstreniz ekte yer almaktadır.\n\n📊 *Güncel Net Bakiye:* {bakiye} ({bakiye_durumu})\n\n📄 Ekstre belgesi bu mesaj ile birlikte PDF olarak iletilmiştir.\nİyi çalışmalar dileriz.`,
  invoiceTemplate: `Sayın *{cari_adi}*,\n\n*{firma}* tarafından düzenlenen *{fatura_no}* numaralı e-Belgeniz ektedir.\n\n💰 *Genel Toplam:* {tutar}\n📅 *Tarih:* {tarih}\n\nİyi çalışmalar dileriz.`,
  paymentTemplate: `Sayın *{cari_adi}*,\n\n*{firma}* cari hesabınıza ait tahsilat / ödeme dekontunuz düzenlenmiştir.\n\n💵 *İşlem Tutarı:* {tutar}\n📅 *Tarih:* {tarih}\n\nİyi çalışmalar dileriz.`,
};

class WhatsAppService {
  private sock: WASocket | null = null;
  private sessionDir: string;
  private logsFile: string;
  private templatesFile: string;
  private logs: WhatsAppLogItem[] = [];
  private templates: WhatsAppTemplates = { ...DEFAULT_TEMPLATES };

  private status: "disconnected" | "connecting" | "qr_ready" | "connected" = "disconnected";
  private qrCodeDataUrl: string | null = null;
  private connectedPhone: string | null = null;
  private connectedName: string | null = null;
  private connectedAt: string | null = null;
  private lastError: string | null = null;
  private isInitializing: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectTimer: any = null;

  constructor() {
    const dataDir = path.join(process.cwd(), "data");
    this.sessionDir = path.join(dataDir, "whatsapp_sessions");
    this.logsFile = path.join(dataDir, "whatsapp_logs.json");
    this.templatesFile = path.join(dataDir, "whatsapp_templates.json");

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
    }

    this.loadLogs();
    this.loadTemplates();
  }

  private loadLogs() {
    try {
      if (fs.existsSync(this.logsFile)) {
        const raw = fs.readFileSync(this.logsFile, "utf-8");
        this.logs = JSON.parse(raw);
      }
    } catch (e) {
      console.warn("WhatsApp logları okunamadı:", e);
      this.logs = [];
    }
  }

  private saveLogs() {
    try {
      fs.writeFileSync(this.logsFile, JSON.stringify(this.logs.slice(-200), null, 2), "utf-8");
    } catch (e) {
      console.warn("WhatsApp logları kaydedilemedi:", e);
    }
  }

  private loadTemplates() {
    try {
      if (fs.existsSync(this.templatesFile)) {
        const raw = fs.readFileSync(this.templatesFile, "utf-8");
        this.templates = { ...DEFAULT_TEMPLATES, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn("WhatsApp şablonları okunamadı:", e);
      this.templates = { ...DEFAULT_TEMPLATES };
    }
  }

  public saveTemplates(newTemplates: Partial<WhatsAppTemplates>): WhatsAppTemplates {
    this.templates = { ...this.templates, ...newTemplates };
    try {
      fs.writeFileSync(this.templatesFile, JSON.stringify(this.templates, null, 2), "utf-8");
    } catch (e) {
      console.warn("WhatsApp şablonları kaydedilemedi:", e);
    }
    return this.templates;
  }

  public getTemplates(): WhatsAppTemplates {
    return this.templates;
  }

  public getLogs(): WhatsAppLogItem[] {
    return this.logs;
  }

  public getStatus(): WhatsAppStatus {
    return {
      status: this.status,
      qrCodeDataUrl: this.qrCodeDataUrl,
      connectedPhone: this.connectedPhone,
      connectedName: this.connectedName,
      connectedAt: this.connectedAt,
      lastError: this.lastError,
    };
  }

  private async cleanupSocket() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.sock) {
      try {
        this.sock.ev.removeAllListeners("connection.update");
        this.sock.ev.removeAllListeners("creds.update");
        this.sock.ev.removeAllListeners("messages.upsert");
        this.sock.end(undefined);
      } catch (e) {
        // ignore cleanup error
      }
      this.sock = null;
    }
  }

  /**
   * Initializes the WhatsApp Baileys socket connection.
   */
  public async init(autoReconnect = true): Promise<void> {
    if (this.isInitializing) return;
    if (this.status === "connected" && this.sock) {
      return;
    }

    this.isInitializing = true;

    try {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      await this.cleanupSocket();

      this.status = "connecting";
      this.lastError = null;

      const { state, saveCreds } = await useMultiFileAuthState(this.sessionDir);
      const { version } = await fetchLatestBaileysVersion().catch(() => ({
        version: [2, 3000, 1043857760] as any,
      }));

      const silentLogger = pino({ level: "silent" });

      this.sock = makeWASocket({
        version,
        logger: silentLogger,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, silentLogger),
        },
        printQRInTerminal: false,
        browser: Browsers.ubuntu("Chrome"),
        syncFullHistory: false,
        generateHighQualityLinkPreview: false,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
        retryRequestDelayMs: 500,
        maxMsgRetryCount: 3,
        getMessage: async () => undefined,
      });

      this.sock.ev.on("creds.update", saveCreds);

      this.sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            this.qrCodeDataUrl = await QRCode.toDataURL(qr, {
              width: 320,
              margin: 2,
              color: {
                dark: "#0f172a",
                light: "#ffffff",
              },
            });
            this.status = "qr_ready";
            this.lastError = null;
          } catch (qrErr: any) {
            console.error("QR Kod oluşturma hatası:", qrErr);
            this.lastError = "QR Kod oluşturulamadı.";
          }
        }

        if (connection === "close") {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401;
          const shouldReconnect = !isLoggedOut;

          console.log(`WhatsApp bağlantısı kapandı. Sebep Kodu: ${statusCode}, Yeniden bağlanacak mı: ${shouldReconnect}`);

          this.status = "disconnected";
          this.qrCodeDataUrl = null;

          if (isLoggedOut) {
            this.connectedPhone = null;
            this.connectedName = null;
            this.connectedAt = null;
            this.lastError = "WhatsApp oturumu sonlandırıldı. Lütfen yeni QR kod okutun.";
            await this.cleanupSocket();
            this.clearSessionFiles();
          } else if (shouldReconnect && autoReconnect) {
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
              this.reconnectAttempts++;
              const delay = statusCode === 440 ? 5000 : 3000;
              console.log(`WhatsApp ${delay}ms sonra yeniden bağlanıyor (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
              this.reconnectTimer = setTimeout(() => {
                this.init(true).catch((err) => console.warn("Yeniden bağlanma hatası:", err));
              }, delay);
            } else {
              this.lastError = "WhatsApp bağlantısı koptu. Lütfen 'Yeniden Bağlan' butonuna tıklayın.";
            }
          }
        } else if (connection === "open") {
          this.status = "connected";
          this.qrCodeDataUrl = null;
          this.lastError = null;
          this.reconnectAttempts = 0;
          this.connectedAt = new Date().toISOString();

          // Get connected user details
          const userJid = this.sock?.user?.id || "";
          const cleanPhone = userJid.split(":")[0]?.split("@")[0] || "";
          this.connectedPhone = cleanPhone ? `+${cleanPhone}` : "Bağlı";
          this.connectedName = this.sock?.user?.name || "Muavin WhatsApp Kullanıcısı";

          console.log(`✅ WhatsApp başarıyla bağlandı! Numara: ${this.connectedPhone} (${this.connectedName})`);
        }
      });
    } catch (err: any) {
      console.error("WhatsApp başlatma hatası:", err);
      this.status = "disconnected";
      this.lastError = err?.message || "WhatsApp servisi başlatılırken bir hata oluştu.";
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Safely logs out and removes session credentials.
   */
  public async logout(): Promise<void> {
    try {
      if (this.sock) {
        await this.sock.logout().catch(() => {});
      }
      await this.cleanupSocket();
    } catch (err) {
      console.warn("WhatsApp logout uyarısı:", err);
    } finally {
      this.status = "disconnected";
      this.qrCodeDataUrl = null;
      this.connectedPhone = null;
      this.connectedName = null;
      this.connectedAt = null;
      this.lastError = null;
      this.clearSessionFiles();
    }
  }

  public clearSessionFiles() {
    try {
      if (fs.existsSync(this.sessionDir)) {
        const files = fs.readdirSync(this.sessionDir);
        for (const file of files) {
          fs.unlinkSync(path.join(this.sessionDir, file));
        }
      }
    } catch (e) {
      console.warn("WhatsApp oturum dosyaları temizlenirken hata:", e);
    }
  }

  /**
   * Resolves canonical WhatsApp JID for a given phone number.
   */
  private async resolveJid(phone: string): Promise<string> {
    let clean = phone.replace(/[^0-9]/g, "");
    if (clean.startsWith("0")) {
      clean = "90" + clean.substring(1);
    } else if (clean.length === 10 && (clean.startsWith("5") || clean.startsWith("8"))) {
      clean = "90" + clean;
    }

    if (this.sock && this.status === "connected") {
      try {
        const results = await this.sock.onWhatsApp(clean);
        if (results && results.length > 0 && results[0]?.exists && results[0]?.jid) {
          return results[0].jid;
        }
      } catch (e) {
        // ignore lookup fail and fallback
      }
    }

    return `${clean}@s.whatsapp.net`;
  }

  /**
   * Sends a simple text message.
   */
  public async sendText(
    phone: string,
    text: string,
    contactName?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (this.status !== "connected" || !this.sock) {
      const errMsg = "WhatsApp bağlı değil. Lütfen önce WhatsApp Merkezi'nden QR kod ile bağlanın.";
      this.addLog({
        id: `msg_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "text",
        phone,
        contactName,
        caption: text.substring(0, 100),
        status: "failed",
        error: errMsg,
      });
      return { success: false, error: errMsg };
    }

    try {
      const jid = await this.resolveJid(phone);
      const sentMsg = await this.sock.sendMessage(jid, { text });
      const msgId = sentMsg?.key?.id || `msg_${Date.now()}`;

      this.addLog({
        id: msgId,
        timestamp: new Date().toISOString(),
        type: "text",
        phone,
        contactName,
        caption: text.substring(0, 100),
        status: "sent",
      });

      return { success: true, messageId: msgId };
    } catch (err: any) {
      console.error("WhatsApp metin gönderme hatası:", err);
      const errMsg = err?.message || "Mesaj gönderilemedi.";

      this.addLog({
        id: `msg_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "text",
        phone,
        contactName,
        caption: text.substring(0, 100),
        status: "failed",
        error: errMsg,
      });

      return { success: false, error: errMsg };
    }
  }

  /**
   * Sends a PDF or document with an optional caption.
   */
  public async sendDocument(params: {
    phone: string;
    fileBuffer: Buffer;
    fileName: string;
    mimeType?: string;
    caption?: string;
    contactName?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { phone, fileBuffer, fileName, mimeType = "application/pdf", caption, contactName } = params;

    if (this.status !== "connected" || !this.sock) {
      const errMsg = "WhatsApp bağlı değil. Lütfen önce WhatsApp Merkezi'nden QR kod ile bağlanın.";
      this.addLog({
        id: `doc_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "document",
        phone,
        contactName,
        fileName,
        caption: caption?.substring(0, 100),
        status: "failed",
        error: errMsg,
      });
      return { success: false, error: errMsg };
    }

    try {
      const jid = await this.resolveJid(phone);
      const cleanFileName = fileName.toLowerCase().endsWith(".pdf") ? fileName : `${fileName}.pdf`;

      const sentMsg = await this.sock.sendMessage(jid, {
        document: fileBuffer,
        mimetype: mimeType,
        fileName: cleanFileName,
        caption: caption || undefined,
      });

      const msgId = sentMsg?.key?.id || `doc_${Date.now()}`;

      this.addLog({
        id: msgId,
        timestamp: new Date().toISOString(),
        type: "document",
        phone,
        contactName,
        fileName: cleanFileName,
        caption: caption?.substring(0, 100),
        status: "sent",
      });

      return { success: true, messageId: msgId };
    } catch (err: any) {
      console.error("WhatsApp belge gönderme hatası:", err);
      const errMsg = err?.message || "Belge WhatsApp üzerinden gönderilemedi.";

      this.addLog({
        id: `doc_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "document",
        phone,
        contactName,
        fileName,
        caption: caption?.substring(0, 100),
        status: "failed",
        error: errMsg,
      });

      return { success: false, error: errMsg };
    }
  }

  private addLog(item: WhatsAppLogItem) {
    this.logs.unshift(item);
    if (this.logs.length > 200) {
      this.logs = this.logs.slice(0, 200);
    }
    this.saveLogs();
  }
}

// Singleton WhatsApp service instance
export const whatsAppService = new WhatsAppService();
