export interface WhatsAppClientStatus {
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
  quoteTemplate?: string;
  orderTemplate?: string;
  waybillTemplate?: string;
  payrollTemplate?: string;
  custodyTemplate?: string;
  transactionTemplate?: string;
  reportTemplate?: string;
  tebligatTemplate?: string;
  productTemplate?: string;
}

export const fetchWhatsAppStatus = async (): Promise<WhatsAppClientStatus> => {
  try {
    const res = await fetch("/api/whatsapp/status");
    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
    return {
      status: "disconnected",
      qrCodeDataUrl: null,
      connectedPhone: null,
      connectedName: null,
      connectedAt: null,
      lastError: json.error || "Durum alınamadı",
    };
  } catch (err: any) {
    return {
      status: "disconnected",
      qrCodeDataUrl: null,
      connectedPhone: null,
      connectedName: null,
      connectedAt: null,
      lastError: err?.message || "Sunucuya ulaşılamadı",
    };
  }
};

export const connectWhatsAppApi = async (force = false): Promise<WhatsAppClientStatus> => {
  try {
    const res = await fetch("/api/whatsapp/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force }),
    });
    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
    throw new Error(json.error || "Bağlantı başlatılamadı.");
  } catch (err: any) {
    throw new Error(err?.message || "WhatsApp bağlantı isteği başarısız oldu.");
  }
};

export const logoutWhatsAppApi = async (): Promise<WhatsAppClientStatus> => {
  try {
    const res = await fetch("/api/whatsapp/logout", { method: "POST" });
    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
    throw new Error(json.error || "Çıkış yapılamadı.");
  } catch (err: any) {
    throw new Error(err?.message || "Çıkış isteği başarısız oldu.");
  }
};

export const sendWhatsAppTextApi = async (
  phone: string,
  message: string,
  contactName?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    const res = await fetch("/api/whatsapp/send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, message, contactName }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err?.message || "Ağ hatası oluştu." };
  }
};

export const sendWhatsAppDocumentApi = async (params: {
  phone: string;
  fileBase64: string;
  fileName: string;
  mimeType?: string;
  caption?: string;
  contactName?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    const res = await fetch("/api/whatsapp/send-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err?.message || "Ağ hatası oluştu." };
  }
};

export const fetchWhatsAppLogs = async (): Promise<WhatsAppLogItem[]> => {
  try {
    const res = await fetch("/api/whatsapp/logs");
    const json = await res.json();
    return json.success ? json.data : [];
  } catch {
    return [];
  }
};

export const fetchWhatsAppTemplates = async (): Promise<WhatsAppTemplates> => {
  try {
    const res = await fetch("/api/whatsapp/templates");
    const json = await res.json();
    return json.success ? json.data : {
      statementTemplate: "",
      invoiceTemplate: "",
      paymentTemplate: ""
    };
  } catch {
    return {
      statementTemplate: "",
      invoiceTemplate: "",
      paymentTemplate: ""
    };
  }
};

export const saveWhatsAppTemplatesApi = async (templates: Partial<WhatsAppTemplates>): Promise<WhatsAppTemplates> => {
  try {
    const res = await fetch("/api/whatsapp/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(templates),
    });
    const json = await res.json();
    return json.data;
  } catch (err: any) {
    throw new Error(err?.message || "Şablonlar kaydedilemedi.");
  }
};
