/**
 * Helper utility functions for TALLSOFT MUAVIN
 */

export interface ShareViaWhatsAppOptions {
  phone: string;
  pdfBase64?: string;
  fileName?: string;
  messageText?: string;
  preferWeb?: boolean;
}

/**
 * Clean and normalize phone number for WhatsApp URL
 */
export function formatPhoneForWhatsApp(phone: string): string {
  let clean = phone.replace(/\D/g, "");
  if (clean.startsWith("0")) {
    clean = "90" + clean.substring(1);
  } else if (!clean.startsWith("90") && clean.length === 10) {
    clean = "90" + clean;
  }
  return clean;
}

/**
 * Converts a base64 string to a File object
 */
export function base64ToFile(base64String: string, fileName: string = "document.pdf", mimeType: string = "application/pdf"): File {
  // Strip data URI header if present
  const base64Data = base64String.includes(",") ? base64String.split(",")[1] : base64String;
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  return new File([blob], fileName, { type: mimeType });
}

/**
 * Share PDF and message via WhatsApp using Native Web Share API if available,
 * or fallback to opening WhatsApp web/app link.
 */
export async function shareViaWhatsApp(
  phone: string,
  pdfBase64?: string,
  messageText: string = "",
  fileName: string = "Cari_Ekstre.pdf"
): Promise<{ success: boolean; method: "native" | "web" | "app"; error?: string }> {
  const cleanPhone = formatPhoneForWhatsApp(phone);

  if (!cleanPhone || cleanPhone.length < 10) {
    throw new Error("Geçerli bir telefon numarası belirtilmedi.");
  }

  // 1. Try Native System Share (Mobile / Supported Desktop browsers) if PDF is provided
  if (pdfBase64 && typeof navigator !== "undefined" && navigator.canShare) {
    try {
      const pdfFile = base64ToFile(pdfBase64, fileName, "application/pdf");
      
      if (navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          title: fileName.replace(/\.[^/.]+$/, ""),
          text: messageText,
          files: [pdfFile],
        });
        return { success: true, method: "native" };
      }
    } catch (err: unknown) {
      // User cancelled share or browser rejected native file share
      if (err instanceof Error && err.name === "AbortError") {
        return { success: false, method: "native", error: "Paylaşım kullanıcı tarafından iptal edildi." };
      }
      console.warn("Native Web Share denemesi başarısız, web bağlantısına geçiliyor:", err);
    }
  }

  // 2. Fallback: Open WhatsApp URL (wa.me / web.whatsapp.com)
  const encodedText = encodeURIComponent(messageText);
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

  if (typeof window !== "undefined") {
    window.open(waUrl, "_blank", "noopener,noreferrer");
  }

  return { success: true, method: "web" };
}
