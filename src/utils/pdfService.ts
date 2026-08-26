import jsPDF from "jspdf";
import autoTable, { UserOptions } from "jspdf-autotable";
import html2canvas from "html2canvas";
import { CompanySettings, Contact } from "../types";
import { formatCurrency, formatDate, getCurrencySymbol, sanitizeOklchForHtml2Canvas } from "./exportUtils";

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

/**
 * Turkish character normalization helper for standard jsPDF fonts
 * Ensures that Turkish characters (ç, ğ, ı, ö, ş, ü, Ç, Ğ, İ, Ö, Ş, Ü) render cleanly in standard PDF text
 */
export function sanitizeTurkishChars(text?: string | number | null): string {
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
 * Native jsPDF + autoTable generator for Official Account Statement (Cari Hesap Ekstresi / Muavin Defteri)
 * Generates 100% vector-sharp, perfectly paginated multi-page PDFs with headers, summaries, repeating tables, and signature blocks.
 */
export function generateAccountStatementAutoTablePDF({
  companySettings,
  contact,
  entries,
  summary,
  title = "RESMİ CARİ HESAP EKSTRESİ VE MUAVİN DEFTERİ",
  dateRange,
  fileName,
}: AccountStatementPDFOptions): { pdf: jsPDF; blob: Blob; fileName: string } {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

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
  doc.setFont("helvetica", "bold");
  doc.text(sanitizeTurkishChars(companyTitle.toUpperCase()), margin + 5, cursorY + 7);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(199, 210, 254); // Light Indigo
  const subText = [companyTaxInfo, companyContactInfo].filter(Boolean).join(" • ") || "Resmi Cari Hesap & Muavin Defter Sistemi";
  doc.text(sanitizeTurkishChars(subText), margin + 5, cursorY + 12);
  doc.text(
    sanitizeTurkishChars(`Belge: ${title} • Tarih: ${formattedToday} • Para Birimi: ${currencyStr} (${currencySym})`),
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
  doc.setFont("helvetica", "bold");
  doc.text("CARİ HESAP & MÜŞTERİ BİLGİLERİ", margin + 3, cursorY + 5);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);

  let cY = cursorY + 11.5;
  const lineSpacing = 4.2;

  doc.text(sanitizeTurkishChars(`Cari Ünvanı: ${contact.name}`), margin + 3, cY);
  cY += lineSpacing;
  doc.text(sanitizeTurkishChars(`Hesap Kodu: ${contactCode}  |  VKN/TCKN: ${contact.taxNumber || "-"}`), margin + 3, cY);
  cY += lineSpacing;
  doc.text(sanitizeTurkishChars(`Vergi Dairesi: ${contact.taxOffice || "-"}  |  Tel: ${contact.phone || "-"}`), margin + 3, cY);
  cY += lineSpacing;
  const addrStr = [contact.address, contact.city].filter(Boolean).join(", ") || "-";
  doc.text(sanitizeTurkishChars(`Adres / Şehir: ${addrStr.length > 48 ? addrStr.slice(0, 48) + "..." : addrStr}`), margin + 3, cY);
  cY += lineSpacing;
  doc.text(sanitizeTurkishChars(`E-Posta: ${contact.email || "-"}`), margin + 3, cY);

  // Right Box: Financial Balance Status
  const rightX = margin + colWidth + 4;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightX, cursorY, colWidth, boxHeight, 2, 2, "FD");

  doc.setFillColor(238, 242, 255);
  doc.roundedRect(rightX, cursorY, colWidth, 7, 2, 2, "F");
  doc.setTextColor(49, 46, 129);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text("FİNANSAL DURUM VE GÜNCEL BAKİYE", rightX + 3, cursorY + 5);

  let rY = cursorY + 12;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Toplam Borçlandırılan:", rightX + 3, rY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(formatCurrency(summary.totalDebit, currencyStr), rightX + colWidth - 3, rY, { align: "right" });

  rY += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Toplam Alacaklandırılan:", rightX + 3, rY);
  doc.setFont("helvetica", "bold");
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
  doc.setFont("helvetica", "bold");
  doc.setTextColor(isReceivable ? 6 : isPayable ? 159 : 51, isReceivable ? 95 : isPayable ? 18 : 65, isReceivable ? 70 : isPayable ? 57 : 85);
  doc.text(
    `NET BAKİYE (${isReceivable ? "ALACAKLIYIZ" : isPayable ? "BORÇLUYUZ" : "SIFIR"})`,
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
    doc.setFont("helvetica", "normal");
    doc.setTextColor(p.text[0], p.text[1], p.text[2]);
    doc.text(sanitizeTurkishChars(p.title), px + pillWidth / 2, cursorY + 3.8, { align: "center" });

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
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
    sanitizeTurkishChars(entry.documentType || "İşlem"),
    sanitizeTurkishChars(entry.documentNo || "-"),
    sanitizeTurkishChars(entry.description || "-"),
    entry.debit > 0 ? entry.debit.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-",
    entry.credit > 0 ? entry.credit.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-",
    Math.abs(entry.runningBalance).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
      (entry.runningBalance > 0 ? " (A)" : entry.runningBalance < 0 ? " (B)" : ""),
  ]);

  // Total row at bottom of table
  const tableFoot = [
    [
      "GENEL TOPLAM",
      "",
      "",
      `${entries.length} Adet Hareket`,
      summary.totalDebit.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      summary.totalCredit.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      Math.abs(summary.netBalance).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
        (summary.netBalance > 0 ? " (A)" : summary.netBalance < 0 ? " (B)" : ""),
    ],
  ];

  autoTable(doc, {
    startY: cursorY,
    head: [tableHeaders],
    body: tableBody,
    foot: tableFoot,
    theme: "grid",
    margin: { left: margin, right: margin, bottom: 20 },
    styles: {
      font: "helvetica",
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [15, 23, 42], // slate-900
      lineColor: [226, 232, 240], // slate-200
      lineWidth: 0.2,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [30, 27, 75], // #1e1b4b Dark Indigo
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "left",
    },
    footStyles: {
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
        doc.setFont("helvetica", "bold");
        doc.text(
          sanitizeTurkishChars(`${companyTitle} - ${contact.name} CARİ HESAP EKSTRESİ`),
          margin + 3,
          10.2
        );
        doc.setFont("helvetica", "normal");
        doc.text(
          `Tarih: ${formattedToday}  |  Sayfa ${pageNum}`,
          pageWidth - margin - 3,
          10.2,
          { align: "right" }
        );
      }

      // Page footer
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(
        sanitizeTurkishChars(
          "Bu ekstre elektronik ortamda üretilmiş olup resmi kayıt niteliğindedir. Muavin Ön Muhasebe & ERP Sistemi"
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
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(
    "YASAL HÜKÜMLER, TEVSİK VE İTİRAZ ŞARTLARI:",
    margin + 3,
    footerY + 4
  );

  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(
    sanitizeTurkishChars(
      "TTK 94. ve VUK ilgili maddeleri uyarınca işbu hesap özetine tebliğ tarihinden itibaren 8 gün içinde itiraz edilmediği takdirde mutabık kalınmış sayılır."
    ),
    margin + 3,
    footerY + 8
  );

  footerY += 16;

  // Signatures Section (2 Columns)
  const sigColWidth = (contentWidth - 20) / 2;

  // Left: Düzenleyen
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 27, 75);
  doc.text("DÜZENLEYEN / MALİ İŞLER & MUHASEBE", margin + sigColWidth / 2, footerY, { align: "center" });

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Yetkili İmza / Firma Kaşesi", margin + sigColWidth / 2, footerY + 3.5, { align: "center" });

  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin + 10, footerY + 16, margin + sigColWidth - 10, footerY + 16);

  // Right: Cari Hesap Sahibi Onayı
  const sigRightX = margin + sigColWidth + 20;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 27, 75);
  doc.text("CARİ HESAP SAHİBİ / YETKİLİ ONAYI", sigRightX + sigColWidth / 2, footerY, { align: "center" });

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Mutabakat İmzası / Mühür", sigRightX + sigColWidth / 2, footerY + 3.5, { align: "center" });

  doc.line(sigRightX + 10, footerY + 16, sigRightX + sigColWidth - 10, footerY + 16);
  doc.setLineDashPattern([], 0); // reset dash pattern

  // Safe Filename
  const safeName = (contact.name || "Cari").replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ_-]/g, "_");
  const finalFileName = fileName || `Cari_Ekstre_${safeName}_${new Date().toISOString().split("T")[0]}.pdf`;
  const blob = doc.output("blob");

  return { pdf: doc, blob, fileName: finalFileName };
}

/**
 * Universal autoTable PDF table generator from ExportData interface
 * Replaces unreliable DOM scraping with pure vector rendering
 */
export function generateAutoTableFromExportData({
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
}): { pdf: jsPDF; blob: Blob; fileName: string } {
  const doc = new jsPDF({
    orientation: headers.length > 5 ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });

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
  doc.setFont("helvetica", "bold");
  doc.text(sanitizeTurkishChars(title), margin + 4, cursorY + 6);

  if (subtitle) {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(199, 210, 254);
    doc.text(sanitizeTurkishChars(subtitle), margin + 4, cursorY + 11.5);
  }

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(224, 231, 255);
  doc.text(
    `Rapor Tarihi: ${formattedToday}  |  Toplam: ${rows.length} Kayıt`,
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
    r.map((c) => (c === null || c === undefined ? "" : sanitizeTurkishChars(String(c))))
  );

  const columnStylesConfig: Record<number, any> = {};
  headers.forEach((_, idx) => {
    columnStylesConfig[idx] = { halign: columnAlignments[idx] || "left" };
  });

  autoTable(doc, {
    startY: cursorY,
    head: [headers.map((h) => sanitizeTurkishChars(h))],
    body: formattedRows,
    theme: "grid",
    margin: { left: margin, right: margin, bottom: 16 },
    styles: {
      font: "helvetica",
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      overflow: "linebreak",
    },
    headStyles: {
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
        doc.setFont("helvetica", "bold");
        doc.text(sanitizeTurkishChars(title), margin + 2, 8.5);
        doc.text(`Sayfa ${pageNum}`, pageWidth - margin - 2, 8.5, { align: "right" });
      }

      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text("Ön Muhasebe & ERP Yönetim Sistemi", margin, pageHeight - 5);
      doc.text(`Sayfa ${pageNum}`, pageWidth - margin, pageHeight - 5, { align: "right" });
    },
  });

  const cleanFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  const blob = doc.output("blob");

  return { pdf: doc, blob, fileName: cleanFilename };
}

/**
 * Enhanced DOM-to-PDF export service using html2canvas with print-specific styling and element-aware page breaks
 */
export async function exportElementToPDFWithPrintStyling(
  elementId: string,
  filename: string = "belge.pdf",
  options: { orientation?: "p" | "l"; margin?: number; scale?: number } = {}
): Promise<{ pdf: jsPDF; blob: Blob; fileName: string } | null> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`exportElementToPDFWithPrintStyling: Element #${elementId} bulunamadı.`);
    alert("Yazdırılacak belge içeriği bulunamadı.");
    return null;
  }

  const { orientation = "p", margin = 8, scale = 2 } = options;

  try {
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      scrollX: 0,
      scrollY: 0,
      windowWidth: Math.max(element.scrollWidth, 1280),
      windowHeight: Math.max(element.scrollHeight + 600, 2600),
      onclone: (clonedDoc) => {
        sanitizeOklchForHtml2Canvas(clonedDoc);
        const clonedTarget = clonedDoc.getElementById(elementId);
        if (clonedTarget) {
          // Unconstrain target element and all parent nodes
          let curr: HTMLElement | null = clonedTarget;
          while (curr && curr !== clonedDoc.body) {
            curr.style.overflow = "visible";
            curr.style.maxHeight = "none";
            curr.style.height = "auto";
            curr.style.maxWidth = "none";
            curr.style.position = "static";
            curr.style.transform = "none";
            curr = curr.parentElement;
          }
          clonedDoc.body.style.overflow = "visible";
          clonedDoc.body.style.height = "auto";
          clonedDoc.body.style.maxHeight = "none";

          clonedTarget.style.width = `${element.scrollWidth || 920}px`;
          clonedTarget.style.maxWidth = `${element.scrollWidth || 920}px`;
          clonedTarget.style.margin = "0 auto";
          clonedTarget.style.boxShadow = "none";
          clonedTarget.style.border = "none";
        }
      },
    });

    const pdf = new jsPDF(orientation, "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth - margin * 2;
    const pageUsableHeight = pdfHeight - margin * 2;
    const totalImgHeightMm = (canvas.height * imgWidth) / canvas.width;

    if (totalImgHeightMm <= pageUsableHeight) {
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", margin, margin, imgWidth, totalImgHeightMm);
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

        const subImgData = subCanvas.toDataURL("image/png");
        const subImgHeightMm = (chunkHeightPx * imgWidth) / canvas.width;

        if (pageIndex > 0) {
          pdf.addPage();
        }

        pdf.addImage(subImgData, "PNG", margin, margin, imgWidth, subImgHeightMm);

        yStart = yNextCut;
        pageIndex++;
      }
    }

    const cleanFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
    const blob = pdf.output("blob");

    return { pdf, blob, fileName: cleanFilename };
  } catch (err) {
    console.error("DOM PDF Export hatası:", err);
    alert("PDF hazırlanırken bir hata oluştu. Lütfen tekrar deneyin.");
    return null;
  }
}
