import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { triggerFormErrorNotification } from "../context/FormErrorContext";

export interface ExportData {
  filename: string;
  sheetName?: string;
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
}

export * from "./pdfCommon";

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
    triggerFormErrorNotification("PDF oluşturulurken bir hata oluştu.", "PDF Hatası");
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


