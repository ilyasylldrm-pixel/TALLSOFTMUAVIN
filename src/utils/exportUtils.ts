import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface ExportData {
  filename: string;
  sheetName?: string;
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
}

/**
 * Returns currency symbol for a currency code (TRY -> ₺, USD -> $, EUR -> €, GBP -> £)
 */
export function getCurrencySymbol(currency?: string): string {
  if (!currency) return "₺";
  const c = currency.trim().toUpperCase();
  if (c === "TRY" || c === "TL" || c === "₺") return "₺";
  if (c === "USD" || c === "$") return "$";
  if (c === "EUR" || c === "€") return "€";
  if (c === "GBP" || c === "£") return "£";
  return currency;
}

/**
 * Formats a numeric amount with the given currency code/symbol
 * e.g., 12500.5 -> "₺12.500,50" or "$1.250,50" or "12.500,50 CHF"
 */
export function formatCurrency(amount: number | null | undefined, currency?: string): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return "0,00 ₺";
  const symbol = getCurrencySymbol(currency);
  const formattedNum = Number(amount).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (["₺", "$", "€", "£"].includes(symbol)) {
    return `${symbol}${formattedNum}`;
  }
  return `${formattedNum} ${symbol}`;
}

/**
 * Helper to replace oklch(...) color functions in CSS string with fallback hex color to prevent html2canvas errors
 */
export function replaceOklchInString(cssText: string, fallbackColor: string = "#4f46e5"): string {
  if (!cssText || !cssText.includes("oklch")) return cssText;

  let result = "";
  let i = 0;
  while (i < cssText.length) {
    const oklchIndex = cssText.indexOf("oklch(", i);
    if (oklchIndex === -1) {
      result += cssText.slice(i);
      break;
    }

    result += cssText.slice(i, oklchIndex);
    let depth = 1;
    let j = oklchIndex + 6;
    while (j < cssText.length && depth > 0) {
      if (cssText[j] === "(") depth++;
      else if (cssText[j] === ")") depth--;
      j++;
    }

    result += fallbackColor;
    i = j;
  }
  return result;
}

/**
 * Sanitizes all <style> elements and inline styles in cloned DOM document for html2canvas
 */
export function sanitizeOklchForHtml2Canvas(clonedDoc: Document): void {
  try {
    const styleTags = clonedDoc.querySelectorAll("style");
    styleTags.forEach((styleEl) => {
      if (styleEl.textContent && styleEl.textContent.includes("oklch")) {
        styleEl.textContent = replaceOklchInString(styleEl.textContent, "#6366f1");
      }
    });

    const elementsWithStyle = clonedDoc.querySelectorAll("[style]");
    elementsWithStyle.forEach((el) => {
      const styleAttr = el.getAttribute("style");
      if (styleAttr && styleAttr.includes("oklch")) {
        el.setAttribute("style", replaceOklchInString(styleAttr, "#6366f1"));
      }
    });

    try {
      const styleSheets = Array.from(clonedDoc.styleSheets);
      styleSheets.forEach((sheet) => {
        try {
          const rules = Array.from(sheet.cssRules || []);
          rules.forEach((rule, idx) => {
            if (rule.cssText && rule.cssText.includes("oklch")) {
              const sanitizedRule = replaceOklchInString(rule.cssText, "#6366f1");
              try {
                sheet.deleteRule(idx);
                sheet.insertRule(sanitizedRule, idx);
              } catch {
                // Ignore rule insertion error
              }
            }
          });
        } catch {
          // Ignore cross-origin stylesheet error
        }
      });
    } catch {
      // Ignore stylesheet iteration error
    }
  } catch (err) {
    console.warn("oklch sanitization warning:", err);
  }
}

/**
 * Formats any date input (YYYY-MM-DD, ISO string, Date object) to DD.MM.YYYY format
 */
export function formatDate(dateInput?: string | Date | null): string {
  if (!dateInput) return "-";
  
  if (typeof dateInput === "string") {
    const trimmed = dateInput.trim();
    if (!trimmed) return "-";
    // If it's already in DD.MM.YYYY format
    if (/^\d{2}\.\d{2}\.\d{4}/.test(trimmed)) {
      return trimmed;
    }
    // Handle YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      return `${d}.${m}.${y}`;
    }
    
    // Fallback to standard Date parsing
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const day = String(parsed.getDate()).padStart(2, "0");
      const month = String(parsed.getMonth() + 1).padStart(2, "0");
      const year = parsed.getFullYear();
      return `${day}.${month}.${year}`;
    }
    return trimmed;
  }

  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    const day = String(dateInput.getDate()).padStart(2, "0");
    const month = String(dateInput.getMonth() + 1).padStart(2, "0");
    const year = dateInput.getFullYear();
    return `${day}.${month}.${year}`;
  }

  return "-";
}

/**
 * Excel (.xlsx) Export with Turkish character and auto column width support
 */
export function exportToExcel({
  filename,
  sheetName = "Rapor",
  title,
  subtitle,
  headers,
  rows,
}: ExportData) {
  const reportData: (string | number | boolean)[][] = [];

  // Title section
  if (title) {
    reportData.push([title]);
  }
  if (subtitle) {
    reportData.push([subtitle]);
  }
  if (title || subtitle) {
    reportData.push(["Rapor Tarihi: " + new Date().toLocaleDateString("tr-TR") + " " + new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })]);
    reportData.push([]); // empty row
  }

  // Headers
  reportData.push(headers);

  // Rows
  rows.forEach((row) => {
    const formattedRow = row.map((cell) => {
      if (cell === null || cell === undefined) return "";
      return cell;
    });
    reportData.push(formattedRow);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(reportData);

  // Auto calculate column widths
  const colWidths = headers.map((header, colIdx) => {
    let maxLen = header ? header.toString().length : 10;
    rows.forEach((row) => {
      const cellVal = row[colIdx];
      if (cellVal !== null && cellVal !== undefined) {
        const len = cellVal.toString().length;
        if (len > maxLen) maxLen = len;
      }
    });
    return { wch: Math.min(Math.max(maxLen + 4, 12), 60) };
  });

  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const cleanFilename = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, cleanFilename);
}

/**
 * PDF (.pdf) Export with full Turkish character support via html2canvas
 */
export async function exportToPDF({
  filename,
  title,
  subtitle,
  headers,
  rows,
}: ExportData) {
  // Create a temporary container in DOM to render a clean printable HTML table (Landscape format width ~1150px)
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "-9999px";
  container.style.width = "1150px";
  container.style.backgroundColor = "#ffffff";
  container.style.color = "#0f172a";
  container.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  container.style.padding = "32px";
  container.style.boxSizing = "border-box";

  const currentDate = new Date().toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Build HTML table content
  let rowsHtml = rows
    .map((row, rIdx) => {
      const bg = rIdx % 2 === 0 ? "#ffffff" : "#f8fafc";
      const cells = row
        .map((cell) => {
          const val = cell === null || cell === undefined ? "" : String(cell);
          const isNumericOrCurrency =
            typeof cell === "number" ||
            (!isNaN(Number(val)) && val.trim() !== "" && !val.includes(":")) ||
            /^[\₺\$\€\£\d\s\.\,\-\%\+]+$/.test(val.trim());
          const align = isNumericOrCurrency ? "right" : "left";
          return `<td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: ${align}; word-break: break-word;">${val}</td>`;
        })
        .join("");
      return `<tr style="background-color: ${bg};">${cells}</tr>`;
    })
    .join("");

  const headersHtml = headers
    .map((h, hIdx) => {
      const sampleCell = rows[0]?.[hIdx];
      const sampleVal = sampleCell === null || sampleCell === undefined ? "" : String(sampleCell);
      const isNumericOrCurrency =
        typeof sampleCell === "number" ||
        /^[\₺\$\€\£\d\s\.\,\-\%\+]+$/.test(sampleVal.trim()) ||
        /tutar|bakiye|toplam|fiyat|miktar|alacak|borç|maaş|maas|gelir|gider|kdv/i.test(h);
      const align = isNumericOrCurrency ? "right" : "left";
      return `<th style="padding: 10px; background-color: #4f46e5; color: #ffffff; font-size: 11px; font-weight: 700; text-align: ${align}; border-bottom: 2px solid #4338ca;">${h}</th>`;
    })
    .join("");

  container.innerHTML = `
    <div style="margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-end;">
      <div>
        <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #1e1b4b; letter-spacing: -0.02em;">${title}</h1>
        ${subtitle ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b; font-weight: 500;">${subtitle}</p>` : ""}
      </div>
      <div style="text-align: right; font-size: 10px; color: #94a3b8; font-weight: 600;">
        <div>Rapor Tarihi</div>
        <div style="color: #475569; font-weight: 700; margin-top: 2px;">${currentDate}</div>
        <div style="color: #6366f1; font-weight: 700; margin-top: 2px;">Toplam ${rows.length} Kayıt</div>
      </div>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
      <thead>
        <tr>${headersHtml}</tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
    <div style="margin-top: 20px; text-align: right; font-size: 9px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
      Bu belge Ön Muhasebe & ERP Sistemi tarafından otomatik olarak üretilmiştir.
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      onclone: (clonedDoc) => {
        sanitizeOklchForHtml2Canvas(clonedDoc);
      },
    });

    const pdf = new jsPDF("l", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const imgWidth = pdfWidth - margin * 2;
    const pageUsableHeightMm = pdfHeight - margin * 2;

    const pxPerMm = canvas.width / imgWidth;
    const targetPagePx = pageUsableHeightMm * pxPerMm;

    const containerRect = container.getBoundingClientRect();
    const scaleY = canvas.height / (containerRect.height || 1);

    const rawElements = Array.from(
      container.querySelectorAll("tr, div")
    ) as HTMLElement[];

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
          (bp) => bp.top > yStart + 10 && bp.top < yNextCut && bp.bottom > yNextCut
        );

        if (straddlingElements.length > 0) {
          const minTop = Math.min(...straddlingElements.map((e) => e.top));
          if (minTop > yStart + 20) {
            yNextCut = minTop;
          }
        }
      } else {
        yNextCut = canvas.height;
      }

      const chunkHeight = yNextCut - yStart;
      if (chunkHeight <= 0) break;

      const subCanvas = document.createElement("canvas");
      subCanvas.width = canvas.width;
      subCanvas.height = chunkHeight;

      const ctx = subCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, subCanvas.width, subCanvas.height);
        ctx.drawImage(
          canvas,
          0,
          yStart,
          canvas.width,
          chunkHeight,
          0,
          0,
          canvas.width,
          chunkHeight
        );
      }

      const subImgData = subCanvas.toDataURL("image/png");
      const subImgHeightMm = (chunkHeight * imgWidth) / canvas.width;

      if (pageIndex > 0) {
        pdf.addPage();
      }

      pdf.addImage(subImgData, "PNG", margin, margin, imgWidth, subImgHeightMm);

      yStart = yNextCut;
      pageIndex++;
    }

    const cleanFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
    pdf.save(cleanFilename);
  } catch (err) {
    console.error("PDF oluşturma hatası:", err);
    alert("PDF indirilirken bir hata oluştu. Lütfen tekrar deneyiniz.");
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
