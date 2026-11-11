import jsPDF from "jspdf";
import autoTable, { UserOptions } from "jspdf-autotable";
import html2canvas from "html2canvas";
import { CompanySettings, Contact } from "../types";
import { formatCurrency, formatDate, getCurrencySymbol, sanitizeOklchForHtml2Canvas } from "./pdfCommon";
import { triggerFormErrorNotification } from "../context/FormErrorContext";
import { GIB_OFFICIAL_UPLOADED_LOGO_DATA_URI } from "./gibOfficialAssets";
import { numberToTurkishWords } from "./numberToTurkishWords";

export interface LedgerEntryData {
  id?: string;
  date: string;
  documentType: string;
  documentNo?: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface LedgerSummaryData {
  totalDebit: number;
  totalCredit: number;
  netBalance: number;
  totalMovements: number;
  invoiceCount?: number;
  collectionCount?: number;
  paymentCount?: number;
  lastMovementDate?: string;
}

export interface AccountStatementPDFOptions {
  companySettings?: CompanySettings | null;
  contact: Contact;
  entries: LedgerEntryData[];
  summary: LedgerSummaryData;
  title?: string;
  dateRange?: { startDate?: string; endDate?: string };
  fileName?: string;
}

// --- Turkish Unicode Font Loader for jsPDF ---
let cachedRobotoRegularBase64: string | null = null;
let cachedRobotoBoldBase64: string | null = null;
let fontPreloadPromise: Promise<void> | null = null;

/**
 * Ultra-fast chunked ArrayBuffer to Base64 encoder (32KB blocks)
 */
function fastArrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const CHUNK_SIZE = 0x8000; // 32KB
  for (let i = 0; i < len; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, len));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

/**
 * Fetch font with strict timeout to prevent any network hang
 */
async function fetchFontWithTimeout(url: string, timeoutMs: number = 1800): Promise<string | null> {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const res = await fetch(url, {
      mode: "cors",
      signal: controller?.signal,
      cache: "force-cache",
    });
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      return fastArrayBufferToBase64(buffer);
    }
  } catch (_) {
    // Network timeout or blocked CDN - fallback safely
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
  return null;
}

/**
 * Pre-warms the Turkish font in the background without blocking the UI
 */
export function preloadTurkishFont(): Promise<void> {
  if (fontPreloadPromise) return fontPreloadPromise;

  fontPreloadPromise = (async () => {
    try {
      // 1. Purge massive fonts from browser storage to prevent QuotaExceededError
      if (typeof window !== "undefined") {
        try {
          window.localStorage?.removeItem("muavin_font_roboto_reg_v2");
          window.localStorage?.removeItem("muavin_font_roboto_bold_v2");
          window.localStorage?.removeItem("muavin_font_roboto_reg");
          window.localStorage?.removeItem("muavin_font_roboto_bold");
          window.sessionStorage?.removeItem("muavin_font_roboto_reg_v2");
          window.sessionStorage?.removeItem("muavin_font_roboto_bold_v2");
        } catch (_) {}
      }

      // 2. Fetch regular font if not in memory
      if (!cachedRobotoRegularBase64 && typeof fetch !== "undefined") {
        const regularUrls = [
          "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Regular.ttf",
          "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.ttf",
        ];
        for (const url of regularUrls) {
          const base64 = await fetchFontWithTimeout(url, 1500);
          if (base64) {
            cachedRobotoRegularBase64 = base64;
            break;
          }
        }
      }

      // 3. Fetch bold font if not in memory
      if (!cachedRobotoBoldBase64 && typeof fetch !== "undefined") {
        const boldUrls = [
          "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Medium.ttf",
          "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9fBBc4AMP6lQ.ttf",
        ];
        for (const url of boldUrls) {
          const base64 = await fetchFontWithTimeout(url, 1500);
          if (base64) {
            cachedRobotoBoldBase64 = base64;
            break;
          }
        }
      }
    } catch (_) {}
  })();

  return fontPreloadPromise;
}

// Automatically initiate background preloading on module load
if (typeof window !== "undefined") {
  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(() => void preloadTurkishFont());
  } else {
    setTimeout(() => void preloadTurkishFont(), 50);
  }
}

/**
 * Loads and registers full UTF-8 Unicode fonts (Roboto Regular & Bold) into jsPDF instance.
 * Enables authentic Turkish character rendering (ç, Ç, ğ, Ğ, ı, İ, ö, Ö, ş, Ş, ü, Ü, ₺) across PDF exports.
 */
export async function loadTurkishFontIntoPDF(doc: jsPDF): Promise<boolean> {
  try {
    if (!cachedRobotoRegularBase64) {
      // Wait at most 800ms for preloader, otherwise fallback cleanly to avoid freeze
      await Promise.race([
        preloadTurkishFont(),
        new Promise((resolve) => setTimeout(resolve, 800)),
      ]);
    }

    if (cachedRobotoRegularBase64) {
      doc.addFileToVFS("Roboto-Regular.ttf", cachedRobotoRegularBase64);
      doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");

      if (cachedRobotoBoldBase64) {
        doc.addFileToVFS("Roboto-Bold.ttf", cachedRobotoBoldBase64);
        doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");
      } else {
        doc.addFont("Roboto-Regular.ttf", "Roboto", "bold");
      }

      doc.setFont("Roboto", "normal");
      return true;
    }
  } catch (err) {
    console.warn("Turkish font registration fallback:", err);
  }
  return false;
}

/**
 * Turkish character normalization fallback for standard jsPDF fonts (when offline without TTF font)
 */
export function sanitizeTurkishChars(text?: string | number | boolean | null): string {
  if (text === null || text === undefined) return "";
  const str = String(text);
  return str
    .replace(/ğ/g, "g")
    .replace(/Ğ/g, "G")
    .replace(/ş/g, "s")
    .replace(/Ş/g, "S")
    .replace(/ı/g, "i")
    .replace(/İ/g, "I")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "C")
    .replace(/ö/g, "o")
    .replace(/Ö/g, "O")
    .replace(/ü/g, "u")
    .replace(/Ü/g, "U");
}

/**
 * Formats string preserving authentic Turkish characters if Unicode font is active, or sanitized if fallback
 */
function toPdfText(text: string | number | boolean | null | undefined, hasUnicode: boolean): string {
  if (text === null || text === undefined) return "";
  return hasUnicode ? String(text) : sanitizeTurkishChars(text);
}

/**
 * Native jsPDF + autoTable generator for Official Account Statement (Cari Hesap Ekstresi / Muavin Defteri)
 * Generates 100% vector-sharp, perfectly paginated multi-page PDFs with headers, summaries, repeating tables, and signature blocks.
 * Fully supports Turkish characters (ç, Ç, ğ, Ğ, ı, İ, ö, Ö, ş, Ş, ü, Ü, ₺).
 */
export async function generateAccountStatementAutoTablePDF({
  companySettings,
  contact,
  entries,
  summary,
  title = "RESMİ CARİ HESAP EKSTRESİ VE MUAVİN DEFTERİ",
  dateRange,
  fileName,
}: AccountStatementPDFOptions): Promise<{ pdf: jsPDF; blob: Blob; fileName: string }> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const hasUnicode = await loadTurkishFontIntoPDF(doc);
  const activeFont = hasUnicode ? "Roboto" : "helvetica";

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  const currencyStr = companySettings?.currency || "TRY";
  const currencySym = getCurrencySymbol(currencyStr);

  const companyTitle = companySettings?.companyTitle || companySettings?.companyName || "ÖN MUHASEBE VE CARİ YÖNETİM SİSTEMİ";
  const companyTaxInfo = [
    companySettings?.taxOffice ? `${companySettings.taxOffice} V.D.` : "",
    companySettings?.taxNumber ? `VKN: ${companySettings.taxNumber}` : "",
  ]
    .filter(Boolean)
    .join(" - ");
  const companyContactInfo = [companySettings?.phone, companySettings?.email].filter(Boolean).join(" | ");

  const contactCode = contact.accountCode || contact.taxNumber || "CARİ-001";
  const formattedToday = new Date().toLocaleDateString("tr-TR");

  // --- Page 1 Header Section ---
  let cursorY = margin;

  // Header background banner
  doc.setFillColor(30, 27, 75); // Dark Indigo #1e1b4b
  doc.roundedRect(margin, cursorY, contentWidth, 22, 2, 2, "F");

  // Header texts inside banner
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont(activeFont, "bold");
  doc.text(toPdfText(companyTitle.toUpperCase(), hasUnicode), margin + 5, cursorY + 7);

  doc.setFontSize(8);
  doc.setFont(activeFont, "normal");
  doc.setTextColor(199, 210, 254); // Light Indigo
  const subText = [companyTaxInfo, companyContactInfo].filter(Boolean).join(" • ") || "Resmi Cari Hesap & Muavin Defter Sistemi";
  doc.text(toPdfText(subText, hasUnicode), margin + 5, cursorY + 12);
  doc.text(
    toPdfText(`Belge: ${title} • Tarih: ${formattedToday} • Para Birimi: ${currencyStr} (${currencySym})`, hasUnicode),
    margin + 5,
    cursorY + 17
  );

  cursorY += 26;

  // --- Contact & Financial Overview 2-Column Box ---
  const boxHeight = 36;
  const colWidth = (contentWidth - 4) / 2;

  // Left Box: Contact Details
  doc.setFillColor(248, 250, 252); // #f8fafc
  doc.setDrawColor(226, 232, 240); // #e2e8f0
  doc.roundedRect(margin, cursorY, colWidth, boxHeight, 2, 2, "FD");

  // Left Box Header
  doc.setFillColor(238, 242, 255); // #eef2ff
  doc.roundedRect(margin, cursorY, colWidth, 7, 2, 2, "F");
  doc.setTextColor(49, 46, 129); // #312e81
  doc.setFontSize(8.5);
  doc.setFont(activeFont, "bold");
  doc.text(toPdfText("CARİ HESAP & MÜŞTERİ BİLGİLERİ", hasUnicode), margin + 3, cursorY + 5);

  doc.setFontSize(7.5);
  doc.setFont(activeFont, "normal");
  doc.setTextColor(71, 85, 105);

  let cY = cursorY + 11.5;
  const lineSpacing = 4.2;

  doc.text(toPdfText(`Cari Ünvanı: ${contact.name}`, hasUnicode), margin + 3, cY);
  cY += lineSpacing;
  doc.text(toPdfText(`Hesap Kodu: ${contactCode}  |  VKN/TCKN: ${contact.taxNumber || "-"}`, hasUnicode), margin + 3, cY);
  cY += lineSpacing;
  doc.text(toPdfText(`Vergi Dairesi: ${contact.taxOffice || "-"}  |  Tel: ${contact.phone || "-"}`, hasUnicode), margin + 3, cY);
  cY += lineSpacing;
  const addrStr = [contact.address, contact.city].filter(Boolean).join(", ") || "-";
  doc.text(toPdfText(`Adres / Şehir: ${addrStr.length > 48 ? addrStr.slice(0, 48) + "..." : addrStr}`, hasUnicode), margin + 3, cY);
  cY += lineSpacing;
  doc.text(toPdfText(`E-Posta: ${contact.email || "-"}`, hasUnicode), margin + 3, cY);

  // Right Box: Financial Balance Status
  const rightX = margin + colWidth + 4;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightX, cursorY, colWidth, boxHeight, 2, 2, "FD");

  doc.setFillColor(238, 242, 255);
  doc.roundedRect(rightX, cursorY, colWidth, 7, 2, 2, "F");
  doc.setTextColor(49, 46, 129);
  doc.setFontSize(8.5);
  doc.setFont(activeFont, "bold");
  doc.text(toPdfText("FİNANSAL DURUM VE GÜNCEL BAKİYE", hasUnicode), rightX + 3, cursorY + 5);

  let rY = cursorY + 12;
  doc.setFontSize(8);
  doc.setFont(activeFont, "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(toPdfText("Toplam Borçlandırılan:", hasUnicode), rightX + 3, rY);
  doc.setFont(activeFont, "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(formatCurrency(summary.totalDebit, currencyStr), rightX + colWidth - 3, rY, { align: "right" });

  rY += 4.5;
  doc.setFont(activeFont, "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(toPdfText("Toplam Alacaklandırılan:", hasUnicode), rightX + 3, rY);
  doc.setFont(activeFont, "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(formatCurrency(summary.totalCredit, currencyStr), rightX + colWidth - 3, rY, { align: "right" });

  rY += 5;
  // Highlighted Net Balance Box
  const isReceivable = summary.netBalance > 0;
  const isPayable = summary.netBalance < 0;
  if (isReceivable) {
    doc.setFillColor(209, 250, 229); // emerald-100
    doc.setDrawColor(167, 243, 208);
  } else if (isPayable) {
    doc.setFillColor(255, 228, 230); // rose-100
    doc.setDrawColor(254, 205, 211);
  } else {
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
  }
  doc.roundedRect(rightX + 2, rY, colWidth - 4, 11, 1.5, 1.5, "FD");

  doc.setFontSize(8);
  doc.setFont(activeFont, "bold");
  doc.setTextColor(isReceivable ? 6 : isPayable ? 159 : 51, isReceivable ? 95 : isPayable ? 18 : 65, isReceivable ? 70 : isPayable ? 57 : 85);
  doc.text(
    toPdfText(`NET BAKİYE (${isReceivable ? "ALACAKLIYIZ" : isPayable ? "BORÇLUYUZ" : "SIFIR"})`, hasUnicode),
    rightX + 4,
    rY + 7
  );

  doc.setFontSize(10);
  doc.text(
    formatCurrency(Math.abs(summary.netBalance), currencyStr),
    rightX + colWidth - 5,
    rY + 7.5,
    { align: "right" }
  );

  cursorY += boxHeight + 4;

  // --- Summary Metric 4-Pill Row ---
  const pillWidth = (contentWidth - 9) / 4;
  const pillHeight = 11;
  const pills = [
    {
      title: "Toplam Borç",
      val: formatCurrency(summary.totalDebit, currencyStr),
      bg: [239, 246, 255],
      border: [191, 219, 254],
      text: [30, 58, 138],
    },
    {
      title: "Toplam Alacak",
      val: formatCurrency(summary.totalCredit, currencyStr),
      bg: [238, 242, 255],
      border: [199, 210, 254],
      text: [49, 46, 129],
    },
    {
      title: "Net Bakiye",
      val: formatCurrency(Math.abs(summary.netBalance), currencyStr),
      bg: isReceivable ? [236, 253, 245] : isPayable ? [255, 241, 242] : [248, 250, 252],
      border: isReceivable ? [167, 243, 208] : isPayable ? [254, 205, 211] : [226, 232, 240],
      text: isReceivable ? [6, 78, 59] : isPayable ? [136, 19, 55] : [15, 23, 42],
    },
    {
      title: "Toplam Hareket",
      val: `${entries.length} Evrak`,
      bg: [248, 250, 252],
      border: [226, 232, 240],
      text: [51, 65, 85],
    },
  ];

  pills.forEach((p, idx) => {
    const px = margin + idx * (pillWidth + 3);
    doc.setFillColor(p.bg[0], p.bg[1], p.bg[2]);
    doc.setDrawColor(p.border[0], p.border[1], p.border[2]);
    doc.roundedRect(px, cursorY, pillWidth, pillHeight, 1.5, 1.5, "FD");

    doc.setFontSize(6.5);
    doc.setFont(activeFont, "normal");
    doc.setTextColor(p.text[0], p.text[1], p.text[2]);
    doc.text(toPdfText(p.title, hasUnicode), px + pillWidth / 2, cursorY + 3.8, { align: "center" });

    doc.setFontSize(8.5);
    doc.setFont(activeFont, "bold");
    doc.text(p.val, px + pillWidth / 2, cursorY + 8.5, { align: "center" });
  });

  cursorY += pillHeight + 5;

  // --- Transactions Table using jspdf-autotable ---
  const tableHeaders = [
    "Tarih",
    "Belge Türü",
    "Evrak No",
    "Açıklama",
    `Borç (${currencySym})`,
    `Alacak (${currencySym})`,
    `Bakiye (${currencySym})`,
  ];

  const tableBody = entries.map((entry) => [
    formatDate(entry.date),
    toPdfText(entry.documentType || "İşlem", hasUnicode),
    toPdfText(entry.documentNo || "-", hasUnicode),
    toPdfText(entry.description || "-", hasUnicode),
    entry.debit > 0 ? entry.debit.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-",
    entry.credit > 0 ? entry.credit.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-",
    Math.abs(entry.runningBalance).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
      (entry.runningBalance > 0 ? " (A)" : entry.runningBalance < 0 ? " (B)" : ""),
  ]);

  // Total row at bottom of table
  const tableFoot = [
    [
      toPdfText("GENEL TOPLAM", hasUnicode),
      "",
      "",
      toPdfText(`${entries.length} Adet Hareket`, hasUnicode),
      summary.totalDebit.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      summary.totalCredit.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      Math.abs(summary.netBalance).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
        (summary.netBalance > 0 ? " (A)" : summary.netBalance < 0 ? " (B)" : ""),
    ],
  ];

  autoTable(doc, {
    startY: cursorY,
    head: [tableHeaders.map((h) => toPdfText(h, hasUnicode))],
    body: tableBody,
    foot: tableFoot,
    theme: "grid",
    margin: { left: margin, right: margin, bottom: 20 },
    styles: {
      font: activeFont,
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [15, 23, 42], // slate-900
      lineColor: [226, 232, 240], // slate-200
      lineWidth: 0.2,
      overflow: "linebreak",
    },
    headStyles: {
      font: activeFont,
      fillColor: [30, 27, 75], // #1e1b4b Dark Indigo
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "left",
    },
    footStyles: {
      font: activeFont,
      fillColor: [224, 231, 255], // #e0e7ff
      textColor: [30, 27, 75],
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // #f8fafc
    },
    columnStyles: {
      0: { cellWidth: 20, halign: "center" }, // Tarih
      1: { cellWidth: 22, halign: "center" }, // Belge Türü
      2: { cellWidth: 24, halign: "center" }, // Evrak No
      3: { cellWidth: "auto", halign: "left" }, // Açıklama
      4: { cellWidth: 24, halign: "right", fontStyle: "bold" }, // Borç
      5: { cellWidth: 24, halign: "right", fontStyle: "bold" }, // Alacak
      6: { cellWidth: 26, halign: "right", fontStyle: "bold" }, // Bakiye
    },
    showHead: "everyPage",
    showFoot: "lastPage",
    didDrawPage: (data) => {
      const pageNum = doc.getNumberOfPages();
      // Running top header for subsequent pages
      if (pageNum > 1) {
        doc.setFillColor(30, 27, 75);
        doc.rect(margin, 6, contentWidth, 6, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7.5);
        doc.setFont(activeFont, "bold");
        doc.text(
          toPdfText(`${companyTitle} - ${contact.name} CARİ HESAP EKSTRESİ`, hasUnicode),
          margin + 3,
          10.2
        );
        doc.setFont(activeFont, "normal");
        doc.text(
          toPdfText(`Tarih: ${formattedToday}  |  Sayfa ${pageNum}`, hasUnicode),
          pageWidth - margin - 3,
          10.2,
          { align: "right" }
        );
      }

      // Page footer
      doc.setFontSize(6.5);
      doc.setFont(activeFont, "normal");
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(
        toPdfText(
          "Bu ekstre elektronik ortamda üretilmiş olup resmi kayıt niteliğindedir. Muavin Ön Muhasebe & ERP Sistemi",
          hasUnicode
        ),
        margin,
        pageHeight - 6
      );
      doc.text(
        `Sayfa ${pageNum}`,
        pageWidth - margin,
        pageHeight - 6,
        { align: "right" }
      );
    },
  });

  // Position after table
  const finalY = (doc as any).lastAutoTable?.finalY || cursorY + 40;

  // Check if we need a new page for legal note + signatures (requires ~40mm)
  let footerY = finalY + 4;
  if (footerY + 38 > pageHeight - 15) {
    doc.addPage();
    footerY = margin + 4;
  }

  // Legal Notice Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, footerY, contentWidth, 12, 1.5, 1.5, "FD");

  doc.setFontSize(6.5);
  doc.setFont(activeFont, "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(
    toPdfText("YASAL HÜKÜMLER, TEVSİK VE İTİRAZ ŞARTLARI:", hasUnicode),
    margin + 3,
    footerY + 4
  );

  doc.setFontSize(6);
  doc.setFont(activeFont, "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(
    toPdfText(
      "TTK 94. ve VUK ilgili maddeleri uyarınca işbu hesap özetine tebliğ tarihinden itibaren 8 gün içinde itiraz edilmediği takdirde mutabık kalınmış sayılır.",
      hasUnicode
    ),
    margin + 3,
    footerY + 8
  );

  footerY += 16;

  // Signatures Section (2 Columns)
  const sigColWidth = (contentWidth - 20) / 2;

  // Left: Düzenleyen
  doc.setFontSize(7.5);
  doc.setFont(activeFont, "bold");
  doc.setTextColor(30, 27, 75);
  doc.text(toPdfText("DÜZENLEYEN / MALİ İŞLER & MUHASEBE", hasUnicode), margin + sigColWidth / 2, footerY, { align: "center" });

  doc.setFontSize(6.5);
  doc.setFont(activeFont, "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(toPdfText("Yetkili İmza / Firma Kaşesi", hasUnicode), margin + sigColWidth / 2, footerY + 3.5, { align: "center" });

  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin + 10, footerY + 16, margin + sigColWidth - 10, footerY + 16);

  // Right: Cari Hesap Sahibi Onayı
  const sigRightX = margin + sigColWidth + 20;
  doc.setFontSize(7.5);
  doc.setFont(activeFont, "bold");
  doc.setTextColor(30, 27, 75);
  doc.text(toPdfText("CARİ HESAP SAHİBİ / YETKİLİ ONAYI", hasUnicode), sigRightX + sigColWidth / 2, footerY, { align: "center" });

  doc.setFontSize(6.5);
  doc.setFont(activeFont, "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(toPdfText("Mutabakat İmzası / Mühür", hasUnicode), sigRightX + sigColWidth / 2, footerY + 3.5, { align: "center" });

  doc.line(sigRightX + 10, footerY + 16, sigRightX + sigColWidth - 10, footerY + 16);
  doc.setLineDashPattern([], 0); // reset dash pattern

  // Safe Filename
  const safeName = (contact.name || "Cari").replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ_-]/g, "_");
  const finalFileName = fileName || `Cari_Ekstre_${safeName}_${new Date().toISOString().split("T")[0]}.pdf`;
  const blob = doc.output("blob");

  return { pdf: doc, blob, fileName: finalFileName };
}

/**
 * Prints a jsPDF document directly using a hidden iframe.
 * Invokes doc.autoPrint() so standard PDF viewers immediately display the print dialog.
 */
export function printJsPdfDocument(pdf: jsPDF, blob?: Blob): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      if (typeof window === "undefined") {
        resolve(false);
        return;
      }

      pdf.autoPrint();
      const pdfBlob = blob || pdf.output("blob");
      const blobUrl = URL.createObjectURL(pdfBlob);

      // Clean up previously created PDF print frames
      document.querySelectorAll(".muavin-pdf-print-frame").forEach((el) => el.remove());

      const iframe = document.createElement("iframe");
      iframe.className = "muavin-pdf-print-frame";
      iframe.setAttribute("aria-hidden", "true");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      iframe.style.opacity = "0";
      iframe.style.pointerEvents = "none";
      iframe.style.zIndex = "-1";
      iframe.src = blobUrl;
      document.body.appendChild(iframe);

      let triggered = false;
      const doPrint = () => {
        if (triggered) return;
        triggered = true;

        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          resolve(true);
        } catch (err) {
          console.warn("Direct iframe PDF print failed:", err);
          resolve(false);
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              iframe.remove();
            }
            URL.revokeObjectURL(blobUrl);
          }, 60000);
        }
      };

      iframe.onload = () => {
        setTimeout(doPrint, 250);
      };

      // Fallback timer if onload does not fire for application/pdf in some browser engines
      setTimeout(doPrint, 800);
    } catch (err) {
      console.error("printJsPdfDocument exception:", err);
      resolve(false);
    }
  });
}

/**
 * Direct print handler for Official Account Statement (Cari Hesap Ekstresi & Muavin Defteri).
 * Generates the EXACT same official vector-sharp PDF as the 'PDF İndir' action and triggers print.
 */
export async function printAccountStatementPDF(
  options: AccountStatementPDFOptions
): Promise<boolean> {
  const result = await generateAccountStatementAutoTablePDF(options);
  if (!result || !result.pdf) return false;
  return printJsPdfDocument(result.pdf, result.blob);
}

/**
 * Universal autoTable PDF table generator from ExportData interface
 * Replaces unreliable DOM scraping with pure vector rendering and full Turkish Unicode support
 */
export async function generateAutoTableFromExportData({
  filename,
  title,
  subtitle,
  headers,
  rows,
}: {
  filename: string;
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
}): Promise<{ pdf: jsPDF; blob: Blob; fileName: string }> {
  const doc = new jsPDF({
    orientation: headers.length > 5 ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });

  const hasUnicode = await loadTurkishFontIntoPDF(doc);
  const activeFont = hasUnicode ? "Roboto" : "helvetica";

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const formattedToday = new Date().toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  let cursorY = margin;

  // Title Banner
  doc.setFillColor(30, 27, 75); // Dark Indigo
  doc.roundedRect(margin, cursorY, contentWidth, subtitle ? 18 : 14, 2, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont(activeFont, "bold");
  doc.text(toPdfText(title, hasUnicode), margin + 4, cursorY + 6);

  if (subtitle) {
    doc.setFontSize(7.5);
    doc.setFont(activeFont, "normal");
    doc.setTextColor(199, 210, 254);
    doc.text(toPdfText(subtitle, hasUnicode), margin + 4, cursorY + 11.5);
  }

  doc.setFontSize(7);
  doc.setFont(activeFont, "normal");
  doc.setTextColor(224, 231, 255);
  doc.text(
    toPdfText(`Rapor Tarihi: ${formattedToday}  |  Toplam: ${rows.length} Kayıt`, hasUnicode),
    pageWidth - margin - 4,
    cursorY + 6,
    { align: "right" }
  );

  cursorY += (subtitle ? 18 : 14) + 4;

  // Detect numeric and currency columns for alignment
  const columnAlignments: Record<number, "left" | "center" | "right"> = {};
  headers.forEach((h, colIdx) => {
    const isCurrencyOrNumericHeader = /tutar|bakiye|toplam|fiyat|miktar|alacak|borç|maaş|gelir|gider|kdv|oran/i.test(h);
    const sampleVal = rows[0]?.[colIdx];
    const isSampleNumeric =
      typeof sampleVal === "number" ||
      (sampleVal && typeof sampleVal === "string" && /^[\₺\$\€\£\d\s\.\,\-\%\+]+$/.test(sampleVal.trim()));

    if (isCurrencyOrNumericHeader || isSampleNumeric) {
      columnAlignments[colIdx] = "right";
    } else if (/tarih|kod|no|durum|tip|tür/i.test(h)) {
      columnAlignments[colIdx] = "center";
    } else {
      columnAlignments[colIdx] = "left";
    }
  });

  const formattedRows = rows.map((r) =>
    r.map((c) => toPdfText(c, hasUnicode))
  );

  const columnStylesConfig: Record<number, any> = {};
  headers.forEach((_, idx) => {
    columnStylesConfig[idx] = { halign: columnAlignments[idx] || "left" };
  });

  autoTable(doc, {
    startY: cursorY,
    head: [headers.map((h) => toPdfText(h, hasUnicode))],
    body: formattedRows,
    theme: "grid",
    margin: { left: margin, right: margin, bottom: 16 },
    styles: {
      font: activeFont,
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      overflow: "linebreak",
    },
    headStyles: {
      font: activeFont,
      fillColor: [79, 70, 229], // Indigo 600
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: columnStylesConfig,
    showHead: "everyPage",
    didDrawPage: (data) => {
      const pageNum = doc.getNumberOfPages();
      if (pageNum > 1) {
        doc.setFillColor(79, 70, 229);
        doc.rect(margin, 5, contentWidth, 5, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont(activeFont, "bold");
        doc.text(toPdfText(title, hasUnicode), margin + 2, 8.5);
        doc.text(`Sayfa ${pageNum}`, pageWidth - margin - 2, 8.5, { align: "right" });
      }

      doc.setFontSize(6.5);
      doc.setFont(activeFont, "normal");
      doc.setTextColor(148, 163, 184);
      doc.text(toPdfText("Ön Muhasebe & ERP Yönetim Sistemi", hasUnicode), margin, pageHeight - 5);
      doc.text(`Sayfa ${pageNum}`, pageWidth - margin, pageHeight - 5, { align: "right" });
    },
  });

  const cleanFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  const blob = doc.output("blob");

  return { pdf: doc, blob, fileName: cleanFilename };
}

export interface ExportElementToPDFOptions {
  orientation?: "p" | "l";
  format?: string | [number, number];
  margin?: number;
  scale?: number;
  pageMode?: "all" | "slip_only" | "forms_only";
  targetSelector?: string;
  fitToSinglePage?: boolean;
}

/**
 * Injects exact print styling, extracted @media print rules, and print:* utilities
 * directly into cloned document for HTML2Canvas to guarantee 100% fidelity with window.print() view
 */
export function injectPrintStylesIntoClone(
  clonedDoc: Document,
  orientation: "p" | "l" = "l",
  targetElementId?: string
): void {
  // 1. Extract existing @media print CSS rules from all active stylesheets
  let extractedPrintCss = "";
  try {
    const styleSheets = Array.from(document.styleSheets || []);
    styleSheets.forEach((sheet) => {
      try {
        const rules = Array.from(sheet.cssRules || []);
        rules.forEach((rule) => {
          if (
            rule instanceof CSSMediaRule &&
            (rule.conditionText === "print" || (rule as any).media?.mediaText?.includes("print"))
          ) {
            Array.from(rule.cssRules || []).forEach((innerRule) => {
              extractedPrintCss += innerRule.cssText + "\n";
            });
          }
        });
      } catch {
        // Cross-origin stylesheet security or CORS - ignore
      }
    });
  } catch {
    // Ignore stylesheet iteration errors
  }

  // 2. Comprehensive print reset, exact typography, and Tailwind print:* utilities
  const printStyleEl = clonedDoc.createElement("style");
  printStyleEl.id = "cloned-exact-print-stylesheet";
  const containerWidth = orientation === "l" ? "1100px" : "794px";

  printStyleEl.textContent = `
    /* === Extracted @media print rules from app === */
    ${extractedPrintCss}

    /* === Universal Print Overrides for HTML2Canvas Clone === */
    * {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      text-rendering: optimizeLegibility !important;
    }
    html, body {
      background: #ffffff !important;
      background-color: #ffffff !important;
      color: #0f172a !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      height: auto !important;
      min-height: 0 !important;
      overflow: visible !important;
    }
    header, nav, aside, .no-print, [data-no-print="true"], button {
      display: none !important;
    }

    /* === Tailwind print:* utility classes activation in cloned view === */
    .print\\:hidden { display: none !important; }
    .print\\:block { display: block !important; }
    .print\\:inline-block { display: inline-block !important; }
    .print\\:flex { display: flex !important; }
    .print\\:grid { display: grid !important; }
    .print\\:grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)) !important; }
    .print\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    .print\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
    .print\\:grid-cols-8 { grid-template-columns: repeat(8, minmax(0, 1fr)) !important; }
    .print\\:shadow-none { box-shadow: none !important; }
    .print\\:border-0 { border-width: 0px !important; border-style: none !important; }
    .print\\:border-slate-400 { border-color: #94a3b8 !important; }
    .print\\:p-0 { padding: 0px !important; }
    .print\\:m-0 { margin: 0px !important; }
    .print\\:p-0\\.5 { padding: 0.125rem !important; }
    .print\\:p-1\\.5 { padding: 0.375rem !important; }
    .print\\:p-2 { padding: 0.5rem !important; }
    .print\\:py-0\\.5 { padding-top: 0.125rem !important; padding-bottom: 0.125rem !important; }
    .print\\:px-1\\.5 { padding-left: 0.375rem !important; padding-right: 0.375rem !important; }
    .print\\:py-1 { padding-top: 0.25rem !important; padding-bottom: 0.25rem !important; }
    .print\\:pb-1 { padding-bottom: 0.25rem !important; }
    .print\\:mb-1 { margin-bottom: 0.25rem !important; }
    .print\\:mb-1\\.5 { margin-bottom: 0.375rem !important; }
    .print\\:mb-2 { margin-bottom: 0.5rem !important; }
    .print\\:mt-0 { margin-top: 0px !important; }
    .print\\:gap-1 { gap: 0.25rem !important; }
    .print\\:gap-2 { gap: 0.5rem !important; }
    .print\\:text-lg { font-size: 1.125rem !important; line-height: 1.75rem !important; }
    .print\\:text-\\[8px\\] { font-size: 8px !important; line-height: 1.25 !important; }
    .print\\:text-\\[7\\.5px\\] { font-size: 7.5px !important; line-height: 1.25 !important; }
    .print\\:h-5 { height: 1.25rem !important; }
    .print\\:overflow-hidden { overflow: hidden !important; }
    .print\\:overflow-visible { overflow: visible !important; }
    .print\\:divide-y-0 > :not([hidden]) ~ :not([hidden]) { border-top-width: 0px !important; }
    .print\\:divide-slate-300 > :not([hidden]) ~ :not([hidden]) { border-color: #cbd5e1 !important; }
    .print\\:bg-white { background-color: #ffffff !important; }
    .print\\:bg-slate-900 { background-color: #0f172a !important; }
    .print\\:w-full { width: 100% !important; }
    .print\\:max-w-none { max-width: none !important; }
    .print\\:space-y-0 > :not([hidden]) ~ :not([hidden]) { margin-top: 0px !important; }
    .print\\:break-inside-avoid { break-inside: avoid !important; page-break-inside: avoid !important; }
    .print\\:visible { visibility: visible !important; }
    .print\\:opacity-100 { opacity: 1 !important; }

    /* === Exact Payroll Print Formatting (Matches A4 Landscape) === */
    #printable-payroll-area {
      visibility: visible !important;
      display: block !important;
      position: static !important;
      width: ${containerWidth} !important;
      max-width: ${containerWidth} !important;
      margin: 0 auto !important;
      padding: 0 !important;
      background: #ffffff !important;
    }
    .payroll-main-slip-a4 {
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      padding: 1.5mm 2.5mm !important;
      font-size: 8.5px !important;
      line-height: 1.3 !important;
      border: none !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      background: #ffffff !important;
    }
    .payroll-main-slip-a4.landscape-mode {
      font-size: 8.5px !important;
      padding: 1.5mm 2.5mm !important;
    }
    .payroll-main-slip-a4.landscape-mode .payroll-company-header {
      padding-bottom: 2px !important;
      margin-bottom: 2.5px !important;
    }
    .payroll-main-slip-a4.landscape-mode .payroll-company-header h1 {
      font-size: 13px !important;
      font-weight: bold !important;
      line-height: 1.2 !important;
      text-align: center !important;
    }
    .payroll-main-slip-a4.landscape-mode .payroll-company-header p {
      font-size: 8px !important;
      line-height: 1.2 !important;
    }
    .payroll-main-slip-a4.landscape-mode .payroll-employee-card {
      padding: 2px 4px !important;
      margin-bottom: 2.5px !important;
      gap: 2px !important;
      font-size: 8px !important;
      line-height: 1.25 !important;
      display: grid !important;
      grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
    }
    .payroll-main-slip-a4.landscape-mode .payroll-employee-card span {
      line-height: 1.25 !important;
    }
    .payroll-main-slip-a4.landscape-mode table {
      font-size: 8px !important;
      line-height: 1.35 !important;
    }
    .payroll-main-slip-a4.landscape-mode table td,
    .payroll-main-slip-a4.landscape-mode table th {
      padding: 1.5px 3px !important;
      line-height: 1.35 !important;
      vertical-align: middle !important;
    }
    .payroll-main-slip-a4.landscape-mode .puantaj-visual-container {
      margin-bottom: 2.5px !important;
      width: 100% !important;
      box-sizing: border-box !important;
      overflow: visible !important;
    }
    .payroll-main-slip-a4.landscape-mode .puantaj-visual-container table {
      table-layout: fixed !important;
      width: 100% !important;
      border-collapse: collapse !important;
    }
    .payroll-main-slip-a4.landscape-mode .puantaj-visual-container table th,
    .payroll-main-slip-a4.landscape-mode .puantaj-visual-container table td {
      padding: 2px 0.5px !important;
      font-size: 7.5px !important;
      line-height: 1.25 !important;
      height: auto !important;
      vertical-align: middle !important;
      overflow: visible !important;
    }
    .payroll-main-slip-a4.landscape-mode .puantaj-visual-container table tr {
      height: auto !important;
    }
    .payroll-main-slip-a4.landscape-mode .net-salary-banner {
      padding: 3px 6px !important;
      border-radius: 8px !important;
    }
    .net-salary-banner {
      background-color: #83b8ff !important;
      border: 2px solid #60a5fa !important;
      color: #0f172a !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .payroll-supplemental-form-a4 {
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
      margin-top: 0 !important;
      padding: 4px 6px !important;
      border: none !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      background: #ffffff !important;
    }

    /* === Exact Finance Receipt Print & PDF Formatting === */
    #printable-receipt {
      visibility: visible !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      width: 794px !important;
      max-width: 794px !important;
      margin: 0 auto !important;
      padding: 32px 40px !important;
      background: #ffffff !important;
      box-shadow: none !important;
      border: 1px solid #cbd5e1 !important;
      border-radius: 4px !important;
      overflow: visible !important;
    }
    #printable-receipt * {
      text-overflow: clip !important;
      overflow: visible !important;
    }
    #printable-receipt .truncate {
      text-overflow: clip !important;
      overflow: visible !important;
      white-space: normal !important;
    }
    #printable-receipt [data-testid='receipt-header-banner'],
    #printable-receipt > div:first-child > div:nth-child(2) {
      display: flex !important;
      visibility: visible !important;
      opacity: 1 !important;
      width: 100% !important;
      background-color: #f0f4ff !important;
      border: 1px solid #c7d2fe !important;
      border-radius: 12px !important;
      padding: 14px 16px !important;
      overflow: visible !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    #printable-receipt > div:first-child > div:nth-child(4) {
      background-color: #83b8ff !important;
      border: 1px solid #60a5fa !important;
      color: #0f172a !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* === Technical Service A4 Forms (Oto, BT & Bilişim, Beyaz Eşya & Klima) === */
    #printable-auto-service-slip,
    #printable-it-service-slip,
    #printable-appliance-service-slip,
    #printable-service-slip,
    .printable-a4-document {
      visibility: visible !important;
      display: block !important;
      width: 794px !important;
      max-width: 794px !important;
      box-sizing: border-box !important;
      margin: 0 auto !important;
      padding: 28px 32px !important;
      background: #ffffff !important;
      box-shadow: none !important;
      border: 1px solid #cbd5e1 !important;
      border-radius: 4px !important;
      overflow: visible !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    #printable-auto-service-slip *,
    #printable-it-service-slip *,
    #printable-appliance-service-slip *,
    #printable-service-slip *,
    .printable-a4-document * {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* === Stock Ekstre A4 Landscape Print & PDF Formatting === */
    #printable-stock-ekstre {
      visibility: visible !important;
      display: block !important;
      width: 1080px !important;
      max-width: 1080px !important;
      box-sizing: border-box !important;
      margin: 0 auto !important;
      padding: 16px 20px !important;
      background: #ffffff !important;
      box-shadow: none !important;
      border: none !important;
      overflow: visible !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    #printable-stock-ekstre [data-testid='stock-movements-banner'],
    #printable-stock-ekstre .stock-movements-banner {
      background-color: #83b8ff !important;
      border: 1px solid #60a5fa !important;
      color: #0f172a !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    #printable-stock-ekstre .stock-th-colored,
    #printable-stock-ekstre th.stock-th-colored,
    #printable-stock-ekstre .stock-badge-colored,
    .stock-th-colored,
    .stock-badge-colored {
      background-color: #83b8ff !important;
      color: #0f172a !important;
      border-color: #60a5fa !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    #printable-stock-ekstre .pdf-page-block,
    #printable-stock-ekstre .stock-ekstre-page {
      width: 1080px !important;
      max-width: 1080px !important;
      box-sizing: border-box !important;
      margin: 0 auto !important;
      padding: 16px 20px !important;
      background: #ffffff !important;
      box-shadow: none !important;
      border: none !important;
    }

    /* === Official Account Statement (Cari Hesap Ekstresi & Muavin) === */
    #printable-ledger {
      visibility: visible !important;
      display: block !important;
      width: 100% !important;
      max-width: 820px !important;
      box-sizing: border-box !important;
      margin: 0 auto !important;
      padding: 16px 20px !important;
      background: #ffffff !important;
      box-shadow: none !important;
      border: none !important;
      overflow: visible !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    #printable-ledger thead tr th {
      background-color: #1e1b4b !important;
      color: #ffffff !important;
      border-color: #1e1b4b !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    #printable-ledger tfoot tr {
      background-color: #e0e7ff !important;
      color: #1e1b4b !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    #printable-ledger tr {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
  `;
  clonedDoc.head.appendChild(printStyleEl);

  // 3. Normalize container elements in cloned document
  if (targetElementId) {
    const clonedTarget = clonedDoc.getElementById(targetElementId);
    if (clonedTarget) {
      let curr: HTMLElement | null = clonedTarget;
      while (curr && curr !== clonedDoc.body) {
        curr.style.overflow = "visible";
        curr.style.maxHeight = "none";
        curr.style.height = "auto";
        curr.style.maxWidth = "none";
        curr = curr.parentElement;
      }
      clonedTarget.style.width = containerWidth;
      clonedTarget.style.maxWidth = containerWidth;
      clonedTarget.style.margin = "0 auto";
      clonedTarget.style.boxShadow = "none";
      clonedTarget.style.border = "none";
    }
  }

  // 4. Strip modal styling (shadow, rounded borders) from discrete blocks
  const blocks = clonedDoc.querySelectorAll(
    ".payroll-main-slip-a4, .payroll-supplemental-form-a4, #printable-payroll-area, .printable-paper"
  );
  blocks.forEach((el: any) => {
    el.style.boxShadow = "none";
    el.style.border = "none";
    el.style.borderRadius = "0";
    el.style.maxWidth = "100%";
  });
}

/**
 * Enhanced DOM-to-PDF export service using html2canvas with print-specific styling and element-aware page breaks
 * Optimized for lightning-fast execution and zero UI lag
 */
export async function exportElementToPDFWithPrintStyling(
  elementId: string,
  filename: string = "belge.pdf",
  options: ExportElementToPDFOptions = {}
): Promise<{ pdf: jsPDF; blob: Blob; fileName: string } | null> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`exportElementToPDFWithPrintStyling: Element #${elementId} bulunamadı.`);
    triggerFormErrorNotification("Yazdırılacak belge içeriği bulunamadı.", "Yazdırma Hatası");
    return null;
  }

  // Yield to the browser to ensure UI loading indicators and spinners render smoothly
  await new Promise((resolve) => setTimeout(resolve, 30));

  const orientation = options.orientation || "p";
  const margin = typeof options.margin === "number" ? options.margin : (orientation === "l" ? 3 : 6);
  const { pageMode = "all", targetSelector } = options;
  const targetScale = typeof options.scale === "number" ? options.scale : 2;

  try {
    const pdf = new jsPDF(orientation, "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth - margin * 2;
    const pageUsableHeight = pdfHeight - margin * 2;
    const defaultWindowWidth = orientation === "l" ? 1100 : 794;

    // Check if element contains discrete document blocks (e.g. Bordro slip, SGK Eksik Gün Formu)
    const rawBlocks = Array.from(
      element.querySelectorAll<HTMLElement>(
        ".payroll-main-slip-a4, .payroll-supplemental-form-a4, .pdf-page-block, .page-break-before"
      )
    ).filter((el) => {
      const style = window.getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden";
    });

    // Only take top-level blocks among these
    const topLevelBlocks = rawBlocks.filter(
      (b) => !rawBlocks.some((other) => other !== b && other.contains(b))
    );

    let targetBlocks = topLevelBlocks;
    if (pageMode === "slip_only") {
      targetBlocks = topLevelBlocks.filter((b) => b.classList.contains("payroll-main-slip-a4"));
    } else if (pageMode === "forms_only") {
      targetBlocks = topLevelBlocks.filter((b) => b.classList.contains("payroll-supplemental-form-a4"));
    } else if (targetSelector) {
      targetBlocks = topLevelBlocks.filter((b) => b.matches(targetSelector) || b.querySelector(targetSelector));
    }

    // MULTI-BLOCK MODE: Render each distinct page block strictly on its own page(s)
    if (targetBlocks.length > 0) {
      let globalPageIndex = 0;

      for (let i = 0; i < targetBlocks.length; i++) {
        const block = targetBlocks[i];
        const blockH = block.scrollHeight || block.clientHeight || 750;

        const blockCanvas = await html2canvas(block, {
          scale: targetScale,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          scrollX: 0,
          scrollY: 0,
          windowWidth: defaultWindowWidth,
          windowHeight: Math.max(blockH, orientation === "l" ? 780 : 1120),
          onclone: (clonedDoc) => {
            sanitizeOklchForHtml2Canvas(clonedDoc);
            injectPrintStylesIntoClone(clonedDoc, orientation, elementId);
          },
        });

        const blockImgHeightMm = (blockCanvas.height * imgWidth) / blockCanvas.width;
        const isPayrollSlip = block.classList.contains("payroll-main-slip-a4");
        const shouldFitToSinglePage =
          options.fitToSinglePage ||
          isPayrollSlip ||
          Boolean(block.querySelector(".payroll-main-slip-a4"));

        if (shouldFitToSinglePage || blockImgHeightMm <= pageUsableHeight + 4) {
          if (globalPageIndex > 0) {
            pdf.addPage();
          }
          const imgData = blockCanvas.toDataURL("image/jpeg", 0.98);

          if (shouldFitToSinglePage && blockImgHeightMm > pageUsableHeight + 4) {
            // Proportional single-page fit with top-aligned margin
            const scaleFactor = Math.min(1, pageUsableHeight / blockImgHeightMm);
            const fittedH = blockImgHeightMm * scaleFactor;
            const fittedW = imgWidth * scaleFactor;
            const xOffset = margin + (imgWidth - fittedW) / 2;
            const yOffset = margin;
            pdf.addImage(imgData, "JPEG", xOffset, yOffset, fittedW, fittedH);
          } else {
            pdf.addImage(imgData, "JPEG", margin, margin, imgWidth, Math.min(blockImgHeightMm, pageUsableHeight));
          }
          globalPageIndex++;
        } else {
          // Block exceeds single page: paginate this block individually
          const pxPerMm = blockCanvas.width / imgWidth;
          const targetPagePx = pageUsableHeight * pxPerMm;

          let yStart = 0;
          while (yStart < blockCanvas.height - 5) {
            const chunkHeightPx = Math.min(targetPagePx, blockCanvas.height - yStart);
            if (chunkHeightPx <= 0) break;

            const subCanvas = document.createElement("canvas");
            subCanvas.width = blockCanvas.width;
            subCanvas.height = chunkHeightPx;
            const ctx = subCanvas.getContext("2d");
            if (ctx) {
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, subCanvas.width, subCanvas.height);
              ctx.drawImage(
                blockCanvas,
                0,
                yStart,
                blockCanvas.width,
                chunkHeightPx,
                0,
                0,
                blockCanvas.width,
                chunkHeightPx
              );
            }

            if (globalPageIndex > 0) {
              pdf.addPage();
            }

            const subImgData = subCanvas.toDataURL("image/jpeg", 0.98);
            const subImgHeightMm = (chunkHeightPx * imgWidth) / blockCanvas.width;
            pdf.addImage(subImgData, "JPEG", margin, margin, imgWidth, subImgHeightMm);

            yStart += chunkHeightPx;
            globalPageIndex++;
          }
        }
      }

      const cleanFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
      const blob = pdf.output("blob");
      return { pdf, blob, fileName: cleanFilename };
    }

    const elHeight = element.scrollHeight || element.clientHeight || 1200;

    const canvas = await html2canvas(element, {
      scale: targetScale,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      scrollX: 0,
      scrollY: 0,
      windowWidth: defaultWindowWidth,
      windowHeight: Math.max(elHeight, orientation === "l" ? 780 : 1120),
      onclone: (clonedDoc) => {
        sanitizeOklchForHtml2Canvas(clonedDoc);
        injectPrintStylesIntoClone(clonedDoc, orientation, elementId);
      },
    });
    const totalImgHeightMm = (canvas.height * imgWidth) / canvas.width;

    const shouldFitSinglePage =
      options.fitToSinglePage ||
      Boolean(element.querySelector(".payroll-main-slip-a4")) ||
      element.classList.contains("payroll-main-slip-a4");

    if (shouldFitSinglePage || totalImgHeightMm <= pageUsableHeight + 4) {
      // Single Page Fast Path
      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      if (shouldFitSinglePage && totalImgHeightMm > pageUsableHeight + 4) {
        const scaleFactor = Math.min(1, pageUsableHeight / totalImgHeightMm);
        const fittedH = totalImgHeightMm * scaleFactor;
        const fittedW = imgWidth * scaleFactor;
        const xOffset = margin + (imgWidth - fittedW) / 2;
        const yOffset = margin;
        pdf.addImage(imgData, "JPEG", xOffset, yOffset, fittedW, fittedH);
      } else {
        pdf.addImage(imgData, "JPEG", margin, margin, imgWidth, Math.min(totalImgHeightMm, pageUsableHeight));
      }
    } else {
      // Element-aware page break calculation
      const pxPerMm = canvas.width / imgWidth;
      const targetPagePx = pageUsableHeight * pxPerMm;

      const rawElements = Array.from(
        element.querySelectorAll("tr, #printable-ledger > div, #printable-receipt > div, .printable-block, .avoid-break")
      ) as HTMLElement[];

      const containerRect = element.getBoundingClientRect();
      const scaleY = canvas.height / (containerRect.height || element.scrollHeight || 1);

      const breakElements = rawElements.filter(
        (el) => el.tagName === "TR" || !el.querySelector("table, tr")
      );

      const breakPoints = breakElements
        .map((el) => {
          const r = el.getBoundingClientRect();
          return {
            top: Math.round((r.top - containerRect.top) * scaleY),
            bottom: Math.round((r.bottom - containerRect.top) * scaleY),
          };
        })
        .filter((bp) => bp.bottom > bp.top);

      let yStart = 0;
      let pageIndex = 0;

      while (yStart < canvas.height - 5) {
        let yNextCut = yStart + targetPagePx;

        if (yNextCut < canvas.height) {
          const straddlingElements = breakPoints.filter(
            (bp) => bp.top > yStart + 15 && bp.top < yNextCut && bp.bottom > yNextCut
          );

          if (straddlingElements.length > 0) {
            const minTop = Math.min(...straddlingElements.map((e) => e.top));
            if (minTop > yStart + 30) {
              yNextCut = minTop;
            }
          }
        } else {
          yNextCut = canvas.height;
        }

        const chunkHeightPx = yNextCut - yStart;
        if (chunkHeightPx <= 0) break;

        const subCanvas = document.createElement("canvas");
        subCanvas.width = canvas.width;
        subCanvas.height = chunkHeightPx;

        const ctx = subCanvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, subCanvas.width, subCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            yStart,
            canvas.width,
            chunkHeightPx,
            0,
            0,
            canvas.width,
            chunkHeightPx
          );
        }

        const subImgData = subCanvas.toDataURL("image/jpeg", 0.95);
        const subImgHeightMm = (chunkHeightPx * imgWidth) / canvas.width;

        if (pageIndex > 0) {
          pdf.addPage();
        }

        pdf.addImage(subImgData, "JPEG", margin, margin, imgWidth, subImgHeightMm);

        yStart = yNextCut;
        pageIndex++;
      }
    }

    const cleanFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
    const blob = pdf.output("blob");

    return { pdf, blob, fileName: cleanFilename };
  } catch (err) {
    console.error("DOM PDF Export hatası:", err);
    triggerFormErrorNotification("PDF hazırlanırken bir hata oluştu. Lütfen tekrar deneyin.", "PDF Hatası");
    return null;
  }
}

export interface OfficialGibInvoicePDFOptions {
  docNo: string;
  ettn: string;
  issueDate: string;
  issueTime?: string;
  scenario?: string;
  invoiceType?: string;
  currency?: string;
  senderName: string;
  senderVkn: string;
  senderTaxOffice?: string;
  senderAddress?: string;
  senderPhone?: string;
  senderEmail?: string;
  receiverName: string;
  receiverVkn: string;
  receiverTaxOffice?: string;
  receiverAddress?: string;
  items: Array<{
    id?: string | number;
    description: string;
    productCode?: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    vatRate: number;
    vatAmount?: number;
    total: number;
  }>;
  subtotal: number;
  vatTotal: number;
  grandTotal: number;
  notes?: string;
  qrCodeDataUrl?: string;
  fileName?: string;
}

/**
 * Generates an authentic, vector-sharp official GİB invoice PDF using jsPDF + autoTable.
 * Guaranteed to succeed without relying on DOM elements or external PDF plugins.
 */
export async function generateOfficialGibInvoicePDF(
  options: OfficialGibInvoicePDFOptions
): Promise<{ pdf: jsPDF; blob: Blob; fileName: string }> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const hasUnicode = await loadTurkishFontIntoPDF(doc);
  const activeFont = hasUnicode ? "Roboto" : "helvetica";

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const currency = options.currency || "TRY";
  const docNo = options.docNo || "BELGE";
  const ettn = options.ettn || "-";
  const scenario = (options.scenario || "TICARIFATURA").toUpperCase();
  const invoiceType = (options.invoiceType || "SATIS").toUpperCase();

  let cursorY = margin;

  // 1. TOP HEADER (Satıcı, GİB Logo & e-Belge Başlığı, Karekod & Metadata)
  const leftColW = 75;
  const rightColW = 75;
  const centerColX = margin + leftColW + 2;
  const centerColW = contentWidth - leftColW - rightColW - 4;
  const rightColX = pageWidth - margin - rightColW;

  // SATICI / DÜZENLEYEN
  doc.setFont(activeFont, "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(toPdfText("SATICI / DÜZENLEYEN", hasUnicode), margin, cursorY + 3);

  doc.setFont(activeFont, "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const senderLines = doc.splitTextToSize(toPdfText(options.senderName || "Tedarikçi Firma", hasUnicode), leftColW);
  doc.text(senderLines, margin, cursorY + 7);

  let senderEndY = cursorY + 7 + senderLines.length * 3.5;
  doc.setFont(activeFont, "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(toPdfText(`VKN / TCKN: ${options.senderVkn || "-"}`, hasUnicode), margin, senderEndY);
  senderEndY += 3.5;
  if (options.senderTaxOffice) {
    doc.text(toPdfText(`Vergi Dairesi: ${options.senderTaxOffice}`, hasUnicode), margin, senderEndY);
    senderEndY += 3.5;
  }
  if (options.senderAddress) {
    const addrLines = doc.splitTextToSize(toPdfText(`Adres: ${options.senderAddress}`, hasUnicode), leftColW);
    doc.text(addrLines, margin, senderEndY);
    senderEndY += addrLines.length * 3.2;
  }

  // ORTA: GİB AMBLEMİ & e-FATURA BAŞLIĞI
  try {
    if (GIB_OFFICIAL_UPLOADED_LOGO_DATA_URI) {
      doc.addImage(GIB_OFFICIAL_UPLOADED_LOGO_DATA_URI, "JPEG", centerColX + (centerColW - 16) / 2, cursorY, 16, 16);
    }
  } catch {}

  doc.setFont(activeFont, "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  const isArchive = scenario.includes("ARSIV") || options.docNo?.startsWith("EAR");
  const docTitle = isArchive ? "e-ARŞİV FATURA" : "e-FATURA";
  doc.text(toPdfText(docTitle, hasUnicode), centerColX + centerColW / 2, cursorY + 21, { align: "center" });

  // SAĞ: KAREKOD & GİB METADATA TABLOSU
  const qrSize = 22;
  const qrX = rightColX + rightColW - qrSize;
  const qrY = cursorY;
  if (options.qrCodeDataUrl) {
    try {
      doc.addImage(options.qrCodeDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
    } catch {}
  }

  // Metadata Table beside/below QR
  const metaTableX = rightColX;
  const metaTableY = qrY + qrSize + 2;
  autoTable(doc, {
    startY: metaTableY,
    margin: { left: metaTableX, right: margin },
    tableWidth: rightColW,
    theme: "grid",
    head: [],
    body: [
      [toPdfText("Özelleştirme No:", hasUnicode), "TR1.2"],
      [toPdfText("Senaryo:", hasUnicode), scenario],
      [toPdfText("Fatura Tipi:", hasUnicode), invoiceType],
      [toPdfText("Fatura No:", hasUnicode), docNo],
      [toPdfText("Fatura Tarihi:", hasUnicode), options.issueDate || "-"],
      [toPdfText("ETTN:", hasUnicode), ettn],
    ],
    styles: {
      font: activeFont,
      fontSize: 6.5,
      cellPadding: 1,
      textColor: [15, 23, 42],
      lineColor: [100, 116, 139],
      lineWidth: 0.15,
    },
    columnStyles: {
      0: { fontStyle: "bold", fillColor: [241, 245, 249], cellWidth: 26 },
      1: { cellWidth: rightColW - 26 },
    },
  });

  const lastTableY = (doc as any).lastAutoTable?.finalY || metaTableY + 20;
  cursorY = Math.max(senderEndY + 2, lastTableY + 4);

  // Divider Line
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 3;

  // 2. ALICI / SAYIN BİLGİ KUTUSU
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, cursorY, contentWidth, 18, 1, 1, "FD");

  doc.setFont(activeFont, "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(toPdfText("SAYIN (ALICI FİRMA):", hasUnicode), margin + 3, cursorY + 4);

  doc.setFont(activeFont, "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(toPdfText(options.receiverName || "Alıcı Firma", hasUnicode), margin + 3, cursorY + 8);

  doc.setFont(activeFont, "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    toPdfText(`VKN / TCKN: ${options.receiverVkn || "-"}  |  Vergi Dairesi: ${options.receiverTaxOffice || "-"}`, hasUnicode),
    margin + 3,
    cursorY + 12
  );
  if (options.receiverAddress) {
    doc.text(toPdfText(`Adres: ${options.receiverAddress}`, hasUnicode), margin + 3, cursorY + 15.5);
  }

  cursorY += 21;

  // 3. KALEMLER TABLOSU (UBL Lines via autoTable)
  const items = options.items && options.items.length > 0
    ? options.items
    : [
        {
          id: 1,
          description: "Mal / Hizmet Teslimi",
          quantity: 1,
          unit: "Adet",
          unitPrice: options.subtotal,
          vatRate: 20,
          vatAmount: options.vatTotal,
          total: options.grandTotal,
        },
      ];

  const tableBody = items.map((item, idx) => {
    const qty = Number(item.quantity || 1);
    const price = Number(item.unitPrice || 0);
    const vatRate = Number(item.vatRate || 20);
    const lineTotal = Number(item.total || qty * price);
    const vatAmt = Number(item.vatAmount || (lineTotal * vatRate) / 100);
    const desc = item.description || `Kalem ${idx + 1}`;
    return [
      String(idx + 1),
      toPdfText(desc, hasUnicode),
      `${qty} ${toPdfText(item.unit || "Adet", hasUnicode)}`,
      `${price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${currency}`,
      `%${vatRate}`,
      `${vatAmt.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${currency}`,
      `${lineTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${currency}`,
    ];
  });

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    theme: "grid",
    head: [
      [
        "#",
        toPdfText("Mal / Hizmet Açıklaması", hasUnicode),
        toPdfText("Miktar", hasUnicode),
        toPdfText("Birim Fiyat", hasUnicode),
        "KDV %",
        toPdfText("KDV Tutarı", hasUnicode),
        toPdfText("Toplam Tutar", hasUnicode),
      ],
    ],
    body: tableBody,
    styles: {
      font: activeFont,
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 22, halign: "right" },
      3: { cellWidth: 24, halign: "right" },
      4: { cellWidth: 16, halign: "center" },
      5: { cellWidth: 24, halign: "right" },
      6: { cellWidth: 28, halign: "right", fontStyle: "bold" },
    },
  });

  cursorY = (doc as any).lastAutoTable?.finalY || cursorY + 40;
  cursorY += 4;

  // 4. ALT TOPLAMLAR & YAZIYLA TUTAR
  const totalsTableW = 85;
  const totalsTableX = pageWidth - margin - totalsTableW;

  // Sol Taraf: Yazıyla Tutar & Notlar
  const leftSummaryW = totalsTableX - margin - 5;
  const writtenAmount = numberToTurkishWords(options.grandTotal);
  doc.setFont(activeFont, "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(toPdfText(`YALNIZ: ${writtenAmount}`, hasUnicode), margin, cursorY + 4);

  if (options.notes) {
    doc.setFont(activeFont, "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    const noteLines = doc.splitTextToSize(toPdfText(`Not: ${options.notes}`, hasUnicode), leftSummaryW);
    doc.text(noteLines, margin, cursorY + 8);
  }

  // Sağ Taraf: Toplamlar Tablosu
  autoTable(doc, {
    startY: cursorY,
    margin: { left: totalsTableX, right: margin },
    tableWidth: totalsTableW,
    theme: "grid",
    head: [],
    body: [
      [toPdfText("Mal/Hizmet Toplamı:", hasUnicode), `${Number(options.subtotal || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${currency}`],
      [toPdfText("Hesaplanan KDV:", hasUnicode), `${Number(options.vatTotal || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${currency}`],
      [toPdfText("Ödenecek Tutar:", hasUnicode), `${Number(options.grandTotal || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${currency}`],
    ],
    styles: {
      font: activeFont,
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.15,
    },
    columnStyles: {
      0: { fontStyle: "bold", fillColor: [248, 250, 252], cellWidth: 42 },
      1: { halign: "right", cellWidth: totalsTableW - 42 },
    },
    didParseCell: (data) => {
      if (data.row.index === 2) {
        data.cell.styles.fillColor = [226, 232, 240];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  const totalsEndY = (doc as any).lastAutoTable?.finalY || cursorY + 20;

  // 5. FOOTER
  const footerY = Math.max(totalsEndY + 10, doc.internal.pageSize.getHeight() - 12);
  doc.setFont(activeFont, "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    toPdfText("Bu belge 213 sayılı VUK hükümlerine göre Gelir İdaresi Başkanlığı e-Belge standartlarında üretilmiştir.", hasUnicode),
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  const cleanFilename = options.fileName
    ? (options.fileName.endsWith(".pdf") ? options.fileName : `${options.fileName}.pdf`)
    : `${docNo}.pdf`;
  const blob = doc.output("blob");

  return { pdf: doc, blob, fileName: cleanFilename };
}

export interface CariReconciliationPDFOptions {
  companySettings?: CompanySettings | null;
  periodLabel: string;
  counterparty: {
    formType: "BS" | "BA";
    contactName: string;
    taxNumber: string;
    phone?: string;
    docCount: number;
    netBaseTotal: number;
    vatTotal: number;
    grandTotal: number;
  };
  invoices?: {
    date?: string;
    docNo?: string;
    description?: string;
    netBase: number;
    vat: number;
    grandTotal: number;
  }[];
  status?: "pending" | "agreed" | "discrepancy";
  advisorName?: string;
  fileName?: string;
}

/**
 * Generates an authentic, vector-sharp Turkish Official Cari Mutabakat Mektubu (Cari Reconciliation Letter)
 * Includes official legal clause (TTK M.94), summary comparison boxes, breakdown table, and mutual approval signature blocks.
 */
export async function generateCariReconciliationPDF({
  companySettings,
  periodLabel,
  counterparty,
  invoices = [],
  status = "pending",
  advisorName,
  fileName,
}: CariReconciliationPDFOptions): Promise<{ pdf: jsPDF; blob: Blob; fileName: string }> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const hasUnicode = await loadTurkishFontIntoPDF(doc);
  const activeFont = hasUnicode ? "Roboto" : "helvetica";

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  const currencyStr = companySettings?.currency || "TRY";
  const currencySym = getCurrencySymbol(currencyStr);

  const companyTitle = companySettings?.companyTitle || companySettings?.companyName || "FİRMA YÖNETİMİ";
  const companyTaxInfo = [
    companySettings?.taxOffice ? `${companySettings.taxOffice} V.D.` : "",
    companySettings?.taxNumber ? `VKN: ${companySettings.taxNumber}` : "",
  ]
    .filter(Boolean)
    .join(" - ");
  const companyContactInfo = [companySettings?.phone, companySettings?.email].filter(Boolean).join(" | ");

  const todayStr = new Date().toLocaleDateString("tr-TR");
  const isSales = counterparty.formType === "BS";
  const operationTypeLabel = isSales ? "SATIŞ / GELİR" : "ALIŞ / GİDER";

  // --- 1. HEADER BANNER ---
  let cursorY = margin;
  doc.setFillColor(15, 107, 174); // Corporate Blue #0f6bae
  doc.roundedRect(margin, cursorY, contentWidth, 22, 2, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont(activeFont, "bold");
  doc.text(toPdfText(companyTitle.toUpperCase(), hasUnicode), margin + 5, cursorY + 7);

  doc.setFontSize(8);
  doc.setFont(activeFont, "normal");
  doc.setTextColor(224, 242, 254);
  const subText = [companyTaxInfo, companyContactInfo].filter(Boolean).join(" • ") || "Mali Müşavirlik & Cari Mutabakat Masası";
  doc.text(toPdfText(subText, hasUnicode), margin + 5, cursorY + 12);
  doc.text(
    toPdfText(`RESMİ CARİ HESAP MUTABAKAT MEKTUBU  •  Dönem: ${periodLabel}  •  Tarih: ${todayStr}`, hasUnicode),
    margin + 5,
    cursorY + 17
  );

  cursorY += 26;

  // --- 2. RECIPIENT & OVERVIEW 2-COLUMN BOX ---
  const boxHeight = 34;
  const colWidth = (contentWidth - 4) / 2;

  // Left Box: Muhatap Cari Bilgileri
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, cursorY, colWidth, boxHeight, 1.5, 1.5, "FD");

  doc.setFont(activeFont, "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(toPdfText("SAYIN MUHATAP CARİ / FİRMA BİLGİLERİ", hasUnicode), margin + 3.5, cursorY + 5.5);

  doc.setFont(activeFont, "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 107, 174);
  const splitContactName = doc.splitTextToSize(toPdfText(counterparty.contactName || "Cari", hasUnicode), colWidth - 8);
  doc.text(splitContactName.slice(0, 2), margin + 3.5, cursorY + 11);

  doc.setFont(activeFont, "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(toPdfText(`Vergi Kimlik No (VKN/TCKN): ${counterparty.taxNumber || "—"}`, hasUnicode), margin + 3.5, cursorY + 20);
  if (counterparty.phone) {
    doc.text(toPdfText(`İletişim / Tel: ${counterparty.phone}`, hasUnicode), margin + 3.5, cursorY + 25);
  }

  // Right Box: Mutabakat Dönemi Finansal İcmali
  const rightBoxX = margin + colWidth + 4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightBoxX, cursorY, colWidth, boxHeight, 1.5, 1.5, "FD");

  doc.setFont(activeFont, "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(toPdfText("DÖNEM MUTABAKAT ÖZETİ", hasUnicode), rightBoxX + 3.5, cursorY + 5.5);

  doc.setFont(activeFont, "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(toPdfText(`İşlem Türü: ${operationTypeLabel}`, hasUnicode), rightBoxX + 3.5, cursorY + 11);
  doc.text(toPdfText(`Dönem İçi Belge Adedi: ${counterparty.docCount} Adet`, hasUnicode), rightBoxX + 3.5, cursorY + 16);
  doc.text(
    toPdfText(`KDV Hariç Matrah Toplamı: ${Number(counterparty.netBaseTotal || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${currencySym}`, hasUnicode),
    rightBoxX + 3.5,
    cursorY + 21
  );

  doc.setFont(activeFont, "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 107, 174);
  doc.text(
    toPdfText(`KDV Dahil Genel Toplam: ${Number(counterparty.grandTotal || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${currencySym}`, hasUnicode),
    rightBoxX + 3.5,
    cursorY + 27
  );

  cursorY += boxHeight + 5;

  // --- 3. FORMAL MUTABAKAT CLAUSE / LETTER TEXT ---
  doc.setFillColor(254, 252, 232); // Light yellow warm notice #fefce8
  doc.setDrawColor(254, 240, 138); // Border yellow #fef08a
  doc.roundedRect(margin, cursorY, contentWidth, 18, 1.5, 1.5, "FD");

  doc.setFont(activeFont, "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(133, 77, 14); // Dark amber
  doc.text(toPdfText("RESMİ MUTABAKAT BİLDİRİMİ VE MEVZUAT HÜKMÜ (TTK M.94)", hasUnicode), margin + 3.5, cursorY + 4.5);

  doc.setFont(activeFont, "normal");
  doc.setFontSize(7);
  doc.setTextColor(113, 63, 18);
  const clauseText =
    `Firmamız muhasebe kayıtlarına göre ${periodLabel} dönemi sonu itibariyle aramızdaki ${operationTypeLabel.toLowerCase()} faturaları kapsamında ` +
    `toplam ${counterparty.docCount} adet belge karşılığında KDV hariç ₺${Number(counterparty.netBaseTotal || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ` +
    `(KDV Dahil: ₺${Number(counterparty.grandTotal || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}) bakiyemiz bulunmaktadır. ` +
    `İşbu bakiyede mutabık olup olmadığınızı kaşe ve imzalayarak tarafımıza iletmenizi rica ederiz. ` +
    `Türk Ticaret Kanunu (TTK) 94. maddesi gereğince tebliğ tarihinden itibaren 8 gün içinde itiraz edilmeyen hesap özetleri kabul edilmiş sayılır.`;

  const clauseLines = doc.splitTextToSize(toPdfText(clauseText, hasUnicode), contentWidth - 7);
  doc.text(clauseLines.slice(0, 3), margin + 3.5, cursorY + 8.5);

  cursorY += 22;

  // --- 4. INVOICES BREAKDOWN TABLE (jspdf-autotable) ---
  const headers = ["S.No", "Tarih", "Belge No", "Açıklama", "KDV Hariç Tutar", "KDV Tutarı", "KDV Dahil Toplam"];
  const tableRows =
    invoices.length > 0
      ? invoices.map((inv, idx) => [
          String(idx + 1),
          inv.date || `${periodLabel}`,
          inv.docNo || "—",
          inv.description || `${counterparty.contactName} - Fatura`,
          `${Number(inv.netBase || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${currencySym}`,
          `${Number(inv.vat || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${currencySym}`,
          `${Number(inv.grandTotal || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${currencySym}`,
        ])
      : [
          [
            "1",
            todayStr,
            `${counterparty.formType}-${counterparty.docCount} Belge`,
            `${periodLabel} Dönemi İcmal Fatura Kayıtları (${counterparty.docCount} Belge)`,
            `${Number(counterparty.netBaseTotal || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${currencySym}`,
            `${Number(counterparty.vatTotal || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${currencySym}`,
            `${Number(counterparty.grandTotal || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${currencySym}`,
          ],
        ];

  autoTable(doc, {
    startY: cursorY,
    head: [headers.map((h) => toPdfText(h, hasUnicode))],
    body: tableRows.map((r) => r.map((c) => toPdfText(c, hasUnicode))),
    foot: [
      [
        toPdfText("GENEL TOPLAM", hasUnicode),
        "",
        "",
        toPdfText(`${counterparty.docCount} Adet Fatura`, hasUnicode),
        `${Number(counterparty.netBaseTotal || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${currencySym}`,
        `${Number(counterparty.vatTotal || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${currencySym}`,
        `${Number(counterparty.grandTotal || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${currencySym}`,
      ],
    ],
    theme: "grid",
    margin: { left: margin, right: margin, bottom: 35 },
    styles: {
      font: activeFont,
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
      overflow: "linebreak",
    },
    headStyles: {
      font: activeFont,
      fillColor: [15, 107, 174], // Corporate Blue
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
    },
    footStyles: {
      font: activeFont,
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: "bold",
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { halign: "center", cellWidth: 20 },
      2: { halign: "center", cellWidth: 28 },
      3: { halign: "left" },
      4: { halign: "right", cellWidth: 28 },
      5: { halign: "right", cellWidth: 22 },
      6: { halign: "right", cellWidth: 28 },
    },
  });

  const finalTableY = (doc as any).lastAutoTable?.finalY || cursorY + 40;

  // --- 5. MUTABAKAT ONAY VE İMZA KUTULARI ---
  const signatureY = Math.max(finalTableY + 8, pageHeight - 38);
  const sigColWidth = (contentWidth - 10) / 2;

  // Left Sign: Bildiren Firma (Düzenleyen)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, signatureY, sigColWidth, 24, 1.5, 1.5, "FD");

  doc.setFont(activeFont, "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(toPdfText("BİLDİREN FİRMA / MALİ MÜŞAVİR", hasUnicode), margin + sigColWidth / 2, signatureY + 4.5, { align: "center" });

  doc.setFont(activeFont, "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(toPdfText(advisorName || companyTitle, hasUnicode), margin + sigColWidth / 2, signatureY + 8, { align: "center" });
  doc.text(toPdfText("Yetkili Kaşe / İmza", hasUnicode), margin + sigColWidth / 2, signatureY + 11.5, { align: "center" });

  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin + 8, signatureY + 20, margin + sigColWidth - 8, signatureY + 20);

  // Right Sign: Muhatap Cari Onay Kutusu
  const sigRightX = margin + sigColWidth + 10;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(sigRightX, signatureY, sigColWidth, 24, 1.5, 1.5, "FD");

  doc.setFont(activeFont, "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(toPdfText("MUHATAP CARİ MUTABAKAT ONAYI", hasUnicode), sigRightX + sigColWidth / 2, signatureY + 4.5, { align: "center" });

  doc.setFont(activeFont, "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(15, 107, 174);
  const statusLabel = status === "agreed" ? "[X] MUTABIKIZ" : status === "discrepancy" ? "[X] MUTABIK DEĞİLİZ" : "[ ] MUTABIKIZ      [ ] MUTABIK DEĞİLİZ";
  doc.text(toPdfText(statusLabel, hasUnicode), sigRightX + sigColWidth / 2, signatureY + 8, { align: "center" });

  doc.setFont(activeFont, "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(toPdfText("Yetkili Kaşe / İmza / Tarih", hasUnicode), sigRightX + sigColWidth / 2, signatureY + 11.5, { align: "center" });

  doc.line(sigRightX + 8, signatureY + 20, sigRightX + sigColWidth - 8, signatureY + 20);
  doc.setLineDashPattern([], 0);

  // --- 6. FOOTER NOTICE ---
  doc.setFont(activeFont, "normal");
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text(
    toPdfText("Bu mutabakat formu sistem üzerinden elektronik olarak üretilmiş olup 213 sayılı VUK ve 6102 sayılı TTK hükümleri kapsamındadır.", hasUnicode),
    pageWidth / 2,
    pageHeight - 5,
    { align: "center" }
  );

  const cleanPartyName = (counterparty.contactName || "Cari").replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ_-]/g, "_");
  const cleanPeriod = periodLabel.replace(/\s+/g, "_");
  const finalFileName =
    fileName || `Cari_Mutabakat_${cleanPartyName}_${cleanPeriod}.pdf`;
  const blob = doc.output("blob");

  return { pdf: doc, blob, fileName: finalFileName };
}

