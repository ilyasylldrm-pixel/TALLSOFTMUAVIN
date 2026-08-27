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
 * Accurately converts OKLCH color to sRGB [r, g, b] (0-255)
 */
export function oklchToRgb(l: number, c: number, h: number): [number, number, number] {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  const r = +4.0767439362 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const bl = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

  const toSRGB = (x: number) => {
    const clamped = Math.max(0, Math.min(1, x));
    return clamped <= 0.0031308
      ? 12.92 * clamped
      : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  };

  return [
    Math.round(toSRGB(r) * 255),
    Math.round(toSRGB(g) * 255),
    Math.round(toSRGB(bl) * 255),
  ];
}

/**
 * Parses OKLCH color string (e.g. "oklch(0.977 0.014 308.299)" or "oklch(0.977 0.014 308.299 / 0.6)") into rgb/rgba
 */
export function parseOklchString(str: string): string | null {
  const match = str.match(/oklch\(\s*([\d\.]+%?)\s+([\d\.]+%?)\s+([\d\.]+(?:deg|grad|rad|turn)?)\s*(?:\/\s*([\d\.]+%?))?\s*\)/i);
  if (!match) return null;

  let l = parseFloat(match[1]);
  if (match[1].endsWith("%")) l = l / 100;

  let c = parseFloat(match[2]);
  if (match[2].endsWith("%")) c = (c / 100) * 0.4;

  let h = parseFloat(match[3]);
  if (match[3].endsWith("rad")) h = (h * 180) / Math.PI;
  else if (match[3].endsWith("turn")) h = h * 360;

  let alpha = 1;
  if (match[4]) {
    alpha = parseFloat(match[4]);
    if (match[4].endsWith("%")) alpha = alpha / 100;
  }

  const [r, g, b] = oklchToRgb(l, c, h);
  if (alpha >= 0.99) {
    return `rgb(${r}, ${g}, ${b})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${parseFloat(alpha.toFixed(3))})`;
}

let helperCanvas: HTMLCanvasElement | null = null;
let helperCtx: CanvasRenderingContext2D | null = null;

function getHelperCtx(): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null;
  if (!helperCanvas) {
    helperCanvas = document.createElement("canvas");
    helperCanvas.width = 1;
    helperCanvas.height = 1;
    helperCtx = helperCanvas.getContext("2d", { willReadFrequently: true });
  }
  return helperCtx;
}

const colorCache = new Map<string, string>();

/**
 * Universal color resolver converting OKLCH, OKLAB, color-mix, CSS variables, and any CSS color into valid rgb/rgba
 */
export function convertCssColorToRgba(colorStr: string): string {
  if (!colorStr) return "transparent";
  const trimmed = colorStr.trim();
  if (
    !trimmed ||
    trimmed === "transparent" ||
    trimmed === "inherit" ||
    trimmed === "initial" ||
    trimmed === "currentColor"
  ) {
    return trimmed;
  }

  if (/^#([0-9a-fA-F]{3,8})$/.test(trimmed)) return trimmed;
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(\s*,\s*[\d\.]+\s*)?\)$/.test(trimmed)) return trimmed;

  if (colorCache.has(trimmed)) {
    return colorCache.get(trimmed)!;
  }

  // 1. Direct mathematical OKLCH parser
  if (trimmed.startsWith("oklch(")) {
    const direct = parseOklchString(trimmed);
    if (direct) {
      colorCache.set(trimmed, direct);
      return direct;
    }
  }

  // 2. Browser Canvas 2D rasterizer
  const ctx = getHelperCtx();
  if (ctx) {
    try {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "transparent";
      ctx.fillStyle = trimmed;
      ctx.fillRect(0, 0, 1, 1);
      const data = ctx.getImageData(0, 0, 1, 1).data;
      const a = data[3] / 255;
      let result = "";
      if (data[3] === 255) {
        result = `rgb(${data[0]}, ${data[1]}, ${data[2]})`;
      } else if (data[3] === 0) {
        result = "rgba(0, 0, 0, 0)";
      } else {
        result = `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${parseFloat(a.toFixed(3))})`;
      }

      if (result !== "rgba(0, 0, 0, 0)" || trimmed.toLowerCase().includes("transparent")) {
        colorCache.set(trimmed, result);
        return result;
      }
    } catch {
      // Fallback below
    }
  }

  return trimmed;
}

/**
 * Replaces modern color functions (oklch, oklab, color-mix, lch, lab) in CSS string with resolved rgb/rgba
 */
export function replaceOklchInString(cssText: string): string {
  if (!cssText) return cssText;

  let text = cssText;
  const colorFuncs = ["color-mix(", "oklch(", "oklab(", "lch(", "lab("];

  let changed = true;
  let iterations = 0;
  while (changed && iterations < 5) {
    changed = false;
    iterations++;

    for (const funcName of colorFuncs) {
      let i = 0;
      while (i < text.length) {
        const funcIndex = text.indexOf(funcName, i);
        if (funcIndex === -1) break;

        let depth = 1;
        let j = funcIndex + funcName.length;
        while (j < text.length && depth > 0) {
          if (text[j] === "(") depth++;
          else if (text[j] === ")") depth--;
          j++;
        }

        if (depth === 0) {
          const fullFunc = text.slice(funcIndex, j);
          const converted = convertCssColorToRgba(fullFunc);
          if (converted && converted !== fullFunc) {
            text = text.slice(0, funcIndex) + converted + text.slice(j);
            i = funcIndex + converted.length;
            changed = true;
          } else {
            i = j;
          }
        } else {
          i = j;
        }
      }
    }
  }

  return text;
}

/**
 * Sanitizes all <style> elements, stylesheets, inline styles, and element computed styles in cloned DOM document for html2canvas
 */
export function sanitizeOklchForHtml2Canvas(clonedDoc: Document): void {
  try {
    const hasUnsupportedColor = (str?: string | null) =>
      Boolean(str && (str.includes("oklch") || str.includes("oklab") || str.includes("color-mix") || str.includes("lch(") || str.includes("lab(")));

    // 1. Sanitize all <style> tags
    const styleTags = clonedDoc.querySelectorAll("style");
    styleTags.forEach((styleEl) => {
      if (styleEl.textContent && hasUnsupportedColor(styleEl.textContent)) {
        styleEl.textContent = replaceOklchInString(styleEl.textContent);
      }
    });

    // 2. Sanitize all style attributes
    const elementsWithStyle = clonedDoc.querySelectorAll("[style]");
    elementsWithStyle.forEach((el) => {
      const styleAttr = el.getAttribute("style");
      if (styleAttr && hasUnsupportedColor(styleAttr)) {
        el.setAttribute("style", replaceOklchInString(styleAttr));
      }
    });

    // 3. Sanitize stylesheets rules
    try {
      const styleSheets = Array.from(clonedDoc.styleSheets);
      styleSheets.forEach((sheet) => {
        try {
          const rules = Array.from(sheet.cssRules || []);
          rules.forEach((rule, idx) => {
            if (rule.cssText && hasUnsupportedColor(rule.cssText)) {
              const sanitizedRule = replaceOklchInString(rule.cssText);
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

    // 4. Traverse all cloned elements and inline computed styles with clean RGB/RGBA
    const allElements = Array.from(clonedDoc.querySelectorAll("*")) as HTMLElement[];
    allElements.forEach((el) => {
      try {
        const computed = clonedDoc.defaultView?.getComputedStyle(el) || (typeof window !== "undefined" ? window.getComputedStyle(el) : null);
        if (!computed) return;

        // Resolve background color
        const bg = computed.backgroundColor;
        if (hasUnsupportedColor(bg)) {
          el.style.backgroundColor = convertCssColorToRgba(bg);
        }

        // Resolve text color
        const color = computed.color;
        if (hasUnsupportedColor(color)) {
          el.style.color = convertCssColorToRgba(color);
        }

        // Resolve border colors
        const borderColor = computed.borderColor;
        if (hasUnsupportedColor(borderColor)) {
          el.style.borderColor = convertCssColorToRgba(borderColor);
        }

        // Resolve background images with gradients
        const bgImg = computed.backgroundImage;
        if (hasUnsupportedColor(bgImg)) {
          el.style.backgroundImage = replaceOklchInString(bgImg);
        }
      } catch {
        // Ignore single element computation error
      }
    });
  } catch (err) {
    console.warn("PDF color sanitization warning:", err);
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
 * Generates jsPDF instance and Blob from ExportData using fast, reliable jspdf-autotable vector generation
 */
export async function generatePDFFromExportData(
  data: ExportData
): Promise<{ pdf: jsPDF; blob: Blob; fileName: string } | null> {
  try {
    const { generateAutoTableFromExportData } = await import("./pdfService");
    return generateAutoTableFromExportData(data);
  } catch (err) {
    console.error("AutoTable PDF Export error:", err);
    alert("PDF oluşturulurken bir hata oluştu.");
    return null;
  }
}

/**
 * PDF (.pdf) Export with full Turkish character support via jspdf-autotable
 */
export async function exportToPDF(data: ExportData) {
  const result = await generatePDFFromExportData(data);
  if (result) {
    result.pdf.save(result.fileName);
  }
}

/**
 * Direct DOM element to PDF exporter with print-specific styling and element-aware page breaks
 */
export async function exportElementToPDF(
  elementId: string,
  filename: string = "belge.pdf",
  options: { orientation?: "p" | "l"; margin?: number; scale?: number } = {}
): Promise<void> {
  const { exportElementToPDFWithPrintStyling } = await import("./pdfService");
  const result = await exportElementToPDFWithPrintStyling(elementId, filename, options);
  if (result) {
    result.pdf.save(result.fileName);
  }
}

export * from "./pdfService";
export { exportAssetCustodyToPDF, generateAssetCustodyHTML } from "./assetCustodyPdf";


