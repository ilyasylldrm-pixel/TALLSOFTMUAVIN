/**
 * Resilient utilities for converting Mysoft URL/stream/text responses into
 * authentic browser Blob objects, downloading them, and opening them in new tabs.
 */

import { extractFirstFileFromZip, isPdfBytes, isZipBytes } from "./mysoftZip";

/**
 * Converts a URL, base64 string, binary stream, or text content into a genuine browser Blob.
 */
export async function convertUrlOrDataToBlob(
  input: string | ArrayBuffer | Uint8Array | Blob,
  fallbackMime: string = "application/pdf",
): Promise<Blob> {
  if (typeof Blob === "undefined") {
    throw new Error("Tarayıcı Blob API desteklenmiyor.");
  }

  // 1. If already a Blob
  if (input instanceof Blob) {
    if (input.type && input.type !== "application/octet-stream") {
      return input;
    }
    return new Blob([input], { type: fallbackMime });
  }

  // 2. If ArrayBuffer or Uint8Array
  if (input instanceof ArrayBuffer || input instanceof Uint8Array) {
    let bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    if (isZipBytes(bytes)) {
      try {
        const extracted = await extractFirstFileFromZip(bytes);
        if (extracted?.bytes && extracted.bytes.length > 0) {
          bytes = extracted.bytes;
        }
      } catch {}
    }
    const resolvedMime = isPdfBytes(bytes)
      ? "application/pdf"
      : fallbackMime;
    return new Blob([bytes as BlobPart], { type: resolvedMime });
  }

  // 3. If string
  if (typeof input === "string") {
    const trimmed = input.trim();

    // A) HTTP or data URL
    if (/^https?:\/\//i.test(trimmed) || /^data:/i.test(trimmed) || /^\/api\//i.test(trimmed)) {
      try {
        const res = await fetch(trimmed);
        if (res.ok) {
          const fetchedBlob = await res.blob();
          const buf = await fetchedBlob.slice(0, 8).arrayBuffer();
          const head = new Uint8Array(buf);
          let finalBytes: Uint8Array = new Uint8Array(await fetchedBlob.arrayBuffer());
          if (isZipBytes(head)) {
            try {
              const ext = await extractFirstFileFromZip(finalBytes);
              if (ext?.bytes && ext.bytes.length > 0) {
                finalBytes = ext.bytes;
              }
            } catch {}
          }
          const finalMime = isPdfBytes(finalBytes)
            ? "application/pdf"
            : fallbackMime || fetchedBlob.type || "application/pdf";
          return new Blob([finalBytes as BlobPart], { type: finalMime });
        }
      } catch (err) {
        console.warn("URL to Blob fetch note:", err);
      }
    }

    // B) Base64 encoded payload (PDF or ZIP)
    const cleanBase64 = trimmed.replace(/\s+/g, "");
    if (/^[A-Za-z0-9+/=]+$/.test(cleanBase64) && (cleanBase64.startsWith("JVBERi0") || cleanBase64.startsWith("UEsDB") || cleanBase64.length > 200)) {
      try {
        const binaryStr = atob(cleanBase64);
        let bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        if (isZipBytes(bytes)) {
          try {
            const ext = await extractFirstFileFromZip(bytes);
            if (ext?.bytes && ext.bytes.length > 0) {
              bytes = ext.bytes;
            }
          } catch {}
        }
        const mime = isPdfBytes(bytes) ? "application/pdf" : fallbackMime;
        return new Blob([bytes as BlobPart], { type: mime });
      } catch {}
    }

    // C) Markup text (HTML or XML)
    if (trimmed.startsWith("<")) {
      const isXml = trimmed.includes("<?xml") || trimmed.includes("<Invoice") || trimmed.includes("<Despatch");
      const mime = isXml ? "application/xml;charset=utf-8" : "text/html;charset=utf-8";
      return new Blob([trimmed], { type: mime });
    }

    // D) Fallback plain text / binary wrapper
    return new Blob([trimmed], { type: fallbackMime });
  }

  return new Blob([String(input)], { type: fallbackMime });
}

/**
 * Opens a Blob in a new browser tab with safe fallback for popup blockers.
 */
export function openBlobInNewTab(blob: Blob, filename?: string): Window | null {
  if (typeof window === "undefined") return null;

  const blobUrl = URL.createObjectURL(blob);
  let newTab: Window | null = null;

  try {
    newTab = window.open(blobUrl, "_blank", "noopener,noreferrer");
  } catch (err) {
    console.warn("window.open note:", err);
  }

  // Fallback if popup blocker suppressed window.open
  if (!newTab || newTab.closed || typeof newTab.closed === "undefined") {
    const a = window.document.createElement("a");
    a.href = blobUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    window.document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        window.document.body.removeChild(a);
      } catch {}
    }, 200);
  }

  // Revoke object URL after 90 seconds to allow the new tab to fully render
  setTimeout(() => {
    try {
      URL.revokeObjectURL(blobUrl);
    } catch {}
  }, 90000);

  return newTab;
}

/**
 * Triggers a file download in the browser from a Blob.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof window === "undefined") return;

  const blobUrl = URL.createObjectURL(blob);
  const a = window.document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  a.style.display = "none";
  window.document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    try {
      window.document.body.removeChild(a);
    } catch {}
  }, 300);
  setTimeout(() => {
    try {
      URL.revokeObjectURL(blobUrl);
    } catch {}
  }, 60000);
}

/**
 * Simultaneously opens a Blob in a new tab AND triggers file download.
 */
export function openAndDownloadBlob(blob: Blob, filename: string): Window | null {
  const tab = openBlobInNewTab(blob, filename);
  downloadBlob(blob, filename);
  return tab;
}

