/**
 * Universal Print Engine for Muavin
 * Works reliably across standard browsers, nested iframes, and sandboxed environments.
 */

import type { Invoice, CompanySettings, Contact } from "../types";

export interface InvoicePrintPayload {
  invoice: Partial<Invoice>;
  companySettings: CompanySettings;
  contact?: Contact;
  isDraft?: boolean;
  onSaveCompanySettings?: (settings: CompanySettings) => void;
}

export interface PrintOptions {
  orientation?: "portrait" | "landscape";
  title?: string;
  autoClose?: boolean;
  forceModal?: boolean;
  documentType?: "invoice" | "generic";
  invoiceData?: InvoicePrintPayload;
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
}

export interface PrintModalData {
  isOpen: boolean;
  title: string;
  elementHtml: string;
  sourceElementId?: string;
  orientation: "portrait" | "landscape";
  documentType?: "invoice" | "generic";
  invoiceData?: InvoicePrintPayload;
}

// Global subscribers for the Universal Print Modal
type PrintModalListener = (data: PrintModalData | null) => void;
const listeners: Set<PrintModalListener> = new Set();
let currentModalData: PrintModalData | null = null;
let activeInvoiceContext: InvoicePrintPayload | null = null;

export function setActiveInvoicePrintContext(ctx: InvoicePrintPayload | null): void {
  activeInvoiceContext = ctx;
}

export function getActiveInvoicePrintContext(): InvoicePrintPayload | null {
  return activeInvoiceContext;
}

export function subscribePrintModal(listener: PrintModalListener): () => void {
  listeners.add(listener);
  // Send current state immediately if active
  if (currentModalData) {
    listener(currentModalData);
  }
  return () => {
    listeners.delete(listener);
  };
}

export function openPrintModal(data: Omit<PrintModalData, "isOpen">): void {
  const isInvoiceSource =
    data.documentType === "invoice" ||
    data.sourceElementId === "invoice-preview-paper" ||
    Boolean(data.invoiceData);
  const resolvedInvoiceData = data.invoiceData || (isInvoiceSource ? activeInvoiceContext || undefined : undefined);

  currentModalData = {
    ...data,
    documentType: resolvedInvoiceData ? "invoice" : data.documentType || "generic",
    invoiceData: resolvedInvoiceData,
    isOpen: true,
  };
  listeners.forEach((l) => l(currentModalData));
}

export function openInvoicePrintModal(
  payload: InvoicePrintPayload,
  options?: { title?: string; orientation?: "portrait" | "landscape" }
): void {
  activeInvoiceContext = payload;
  const invNo = payload.invoice.invoiceNumber || "TASLAK-0001";
  openPrintModal({
    title: options?.title || `${invNo}_Fatura`,
    elementHtml: "",
    sourceElementId: "universal-print-preview-paper",
    orientation: options?.orientation || "portrait",
    documentType: "invoice",
    invoiceData: payload,
  });
}

export function closePrintModal(): void {
  currentModalData = null;
  listeners.forEach((l) => l(null));
}

/**
 * Known printable IDs and classes across Muavin ERP modules
 */
const KNOWN_PRINTABLE_SELECTORS = [
  "#printable-payroll-area",
  "#invoice-preview-paper",
  "#printable-quote",
  "#printable-order-sheet",
  "#printable-order",
  "#printable-ledger",
  "#printable-receipt",
  "#printable-waybill-sheet",
  "#hr-document-printable-area",
  "#printable-asset-label",
  "#printable-service-slip",
  "#printable-stock-ekstre",
  "#asset-custody-paper",
  "#employee-list-print-area",
  "#hr-printable-paper",
  ".payroll-main-slip-a4",
  ".printable-document",
  "[data-printable='true']",
];

/**
 * Finds the most relevant visible printable DOM element on the active page
 */
export function findActivePrintableElement(): HTMLElement | null {
  for (const selector of KNOWN_PRINTABLE_SELECTORS) {
    const el = document.querySelector<HTMLElement>(selector);
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return el;
      }
    }
  }

  // Fallback: look for any visible paper/sheet card
  const modalPaper = document.querySelector<HTMLElement>(
    ".haze-card, .bg-white.rounded-2xl, .bg-white.rounded-3xl"
  );
  if (modalPaper) {
    const rect = modalPaper.getBoundingClientRect();
    if (rect.width > 200 && rect.height > 200) {
      return modalPaper;
    }
  }

  return null;
}

/**
 * Collects all style tags and stylesheets from current document
 */
export function collectDocumentStyles(): string {
  let styles = "";
  try {
    const styleNodes = document.querySelectorAll("style, link[rel='stylesheet']");
    styleNodes.forEach((node) => {
      styles += node.outerHTML + "\n";
    });
  } catch (err) {
    console.warn("Error collecting styles:", err);
  }
  return styles;
}

/**
 * Direct print using an isolated iframe with visible rendering geometry (not -9999px)
 */
export function printViaIsolatedIframe(
  element: HTMLElement,
  title: string = "Belge_Yazdir",
  orientation: "portrait" | "landscape" = "portrait"
): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // Remove any leftover print frames
      document.querySelectorAll(".muavin-print-frame").forEach((el) => el.remove());

      const iframe = document.createElement("iframe");
      iframe.className = "muavin-print-frame";
      iframe.setAttribute("aria-hidden", "true");
      // Use zero-size fixed in-viewport positioning so Chromium render/print pipeline doesn't suppress it
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      iframe.style.margin = "0";
      iframe.style.padding = "0";
      iframe.style.opacity = "0";
      iframe.style.pointerEvents = "none";
      iframe.style.zIndex = "-1";
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document;
      if (!frameDoc || !iframe.contentWindow) {
        iframe.remove();
        resolve(false);
        return;
      }

      const styles = collectDocumentStyles();
      const pageMargin = orientation === "landscape" ? "5mm 6mm" : "8mm 10mm";

      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html lang="tr">
          <head>
            <meta charset="utf-8" />
            <title>${title}</title>
            ${styles}
            <style>
              @page {
                size: A4 ${orientation} !important;
                margin: ${pageMargin} !important;
              }
              html, body {
                background: #ffffff !important;
                color: #0f172a !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: auto !important;
                min-height: 0 !important;
                overflow: visible !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              header, nav, aside, .no-print, [data-no-print="true"] {
                display: none !important;
              }
              * {
                box-sizing: border-box !important;
              }
            </style>
          </head>
          <body>
            ${element.outerHTML}
          </body>
        </html>
      `);
      frameDoc.close();

      let executed = false;
      const triggerPrint = () => {
        if (executed) return;
        executed = true;

        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          resolve(true);
        } catch (err) {
          console.warn("Iframe contentWindow.print failed:", err);
          resolve(false);
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              iframe.remove();
            }
          }, 3000);
        }
      };

      iframe.onload = () => {
        setTimeout(triggerPrint, 150);
      };

      // Fallback timer if onload does not trigger
      setTimeout(triggerPrint, 400);
    } catch (err) {
      console.warn("printViaIsolatedIframe exception:", err);
      resolve(false);
    }
  });
}

/**
 * Universal print handler:
 * 1. Finds target element
 * 2. If forceModal is specified, opens in-app print & preview modal
 * 3. Otherwise executes native window.print() with dynamic @page orientation
 * 4. Falls back to isolated iframe or UniversalPrintModal if print is blocked by sandbox
 */
export async function printHtmlElement(
  elementIdOrRef?: string | HTMLElement | null,
  title: string = "Belge_Yazdir",
  options: PrintOptions = {}
): Promise<boolean> {
  if (typeof window === "undefined") return false;

  let targetElement: HTMLElement | null = null;
  let sourceId = "";

  if (typeof elementIdOrRef === "string") {
    sourceId = elementIdOrRef.replace(/^#/, "");
    targetElement = document.getElementById(sourceId);
  } else if (elementIdOrRef instanceof HTMLElement) {
    targetElement = elementIdOrRef;
    sourceId = targetElement.id || "";
  }

  // If not found, search active known printable elements
  if (!targetElement) {
    targetElement = findActivePrintableElement();
    if (targetElement) {
      sourceId = targetElement.id || "";
    }
  }

  // Fallback to main document
  if (!targetElement) {
    targetElement = document.querySelector("main") || document.body;
  }

  const orientation =
    options.orientation ||
    (targetElement.classList.contains("landscape-mode") ||
    targetElement.dataset.orientation === "landscape"
      ? "landscape"
      : "portrait");

  options.onBeforePrint?.();

  const isInvoiceTarget =
    options.documentType === "invoice" ||
    Boolean(options.invoiceData) ||
    sourceId === "invoice-preview-paper";

  // If forceModal is set or if printing an invoice template, open UniversalPrintModal directly
  if (options.forceModal || isInvoiceTarget) {
    openPrintModal({
      title,
      elementHtml: targetElement.outerHTML,
      sourceElementId: sourceId,
      orientation,
      documentType: isInvoiceTarget ? "invoice" : options.documentType,
      invoiceData: options.invoiceData || (isInvoiceTarget ? activeInvoiceContext || undefined : undefined),
    });
    options.onAfterPrint?.();
    return true;
  }

  // Inject temporary @page orientation override for this print action
  let tempStyle: HTMLStyleElement | null = null;
  try {
    tempStyle = document.createElement("style");
    tempStyle.setAttribute("data-muavin-print-override", "true");
    tempStyle.textContent = `
      @media print {
        @page {
          size: A4 ${orientation} !important;
          margin: ${orientation === "landscape" ? "5mm 6mm" : "8mm 10mm"} !important;
        }
      }
    `;
    document.head.appendChild(tempStyle);

    window.focus();
    // Directly invoke native browser print!
    window.print();

    setTimeout(() => {
      tempStyle?.remove();
    }, 1500);

    options.onAfterPrint?.();
    return true;
  } catch (err) {
    console.warn("Direct window.print encountered error, attempting fallback:", err);
    if (tempStyle) tempStyle.remove();
  }

  // Fallback: try isolated iframe
  const iframeSuccess = await printViaIsolatedIframe(targetElement, title, orientation);
  if (iframeSuccess) {
    options.onAfterPrint?.();
    return true;
  }

  // Final fallback for restricted sandboxes: Open UniversalPrintModal
  openPrintModal({
    title,
    elementHtml: targetElement.outerHTML,
    sourceElementId: sourceId,
    orientation,
  });

  options.onAfterPrint?.();
  return true;
}

/**
 * Global print wrapper:
 * Keeps standard window.print intact, but safely guards against sandbox crashes
 * and provides fallback if native print dialog throws.
 */
let polyfillInstalled = false;
export function installGlobalPrintPolyfill(): void {
  if (typeof window === "undefined" || polyfillInstalled) return;
  polyfillInstalled = true;

  const originalWindowPrint = window.print.bind(window);

  window.print = function () {
    try {
      window.focus();
      originalWindowPrint();
    } catch (err) {
      console.warn("Native window.print failed (likely sandbox restriction), opening UniversalPrintModal:", err);
      const activeEl = findActivePrintableElement() || document.querySelector("main") || document.body;
      if (activeEl) {
        openPrintModal({
          title: document.title || "Belge Yazdır",
          elementHtml: activeEl.outerHTML,
          sourceElementId: activeEl.id || undefined,
          orientation:
            activeEl.classList.contains("landscape-mode") || activeEl.dataset.orientation === "landscape"
              ? "landscape"
              : "portrait",
        });
      }
    }
  };
}

// Auto-install polyfill on client side
if (typeof window !== "undefined") {
  installGlobalPrintPolyfill();
}
