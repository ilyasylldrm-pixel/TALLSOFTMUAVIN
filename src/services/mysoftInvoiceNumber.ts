/**
 * GİB & Mysoft Uyumlu Fatura Numarası Ayrıştırma ve Sıradaki Numara Hesaplama
 * Standard GİB Fatura No Formatı: 3 hane Seri/Ön Ek + 4 hane Yıl + 9 hane Sıra No (Toplam 16 Karakter)
 * Örn: ABC2026000000206 -> Seri: ABC, Yıl: 2026, Sıra: 206 -> Sıradaki: ABC2026000000207
 */

export interface ParsedInvoiceNumber {
  prefix: string;
  year: number;
  sequence: number;
  padLength: number;
  raw: string;
}

export function parseInvoiceDocNo(docNo?: string | null): ParsedInvoiceNumber | null {
  if (!docNo || typeof docNo !== "string") return null;
  const clean = docNo.trim().toUpperCase();

  // 1. Resmi GİB Standardı: 3 alfanümerik ön ek + 4 hane yıl + 9 hane sıra no (16 karakter)
  const gibMatch = clean.match(/^([A-Z0-9]{3})(20\d{2})(\d{9})$/);
  if (gibMatch) {
    return {
      prefix: gibMatch[1],
      year: parseInt(gibMatch[2], 10),
      sequence: parseInt(gibMatch[3], 10),
      padLength: 9,
      raw: clean,
    };
  }

  // 2. Esnek / Toleranslı format: 2-5 hane ön ek + 4 hane yıl + sıra no
  const tolerantMatch = clean.match(/^([A-Z0-9]{2,5})(20\d{2})(\d+)$/);
  if (tolerantMatch) {
    return {
      prefix: tolerantMatch[1],
      year: parseInt(tolerantMatch[2], 10),
      sequence: parseInt(tolerantMatch[3], 10),
      padLength: Math.max(9, tolerantMatch[3].length),
      raw: clean,
    };
  }

  return null;
}

export function formatInvoiceDocNo(
  prefix: string,
  year: number,
  sequence: number,
  padLength = 9,
): string {
  const cleanPrefix = (prefix || "GIB").trim().toUpperCase().slice(0, 3);
  const cleanYear = Number.isInteger(year) && year >= 2000 ? year : new Date().getFullYear();
  const cleanSeq = Math.max(1, Math.trunc(sequence));
  const paddedSeq = String(cleanSeq).padStart(padLength, "0");
  return `${cleanPrefix}${cleanYear}${paddedSeq}`;
}

export interface NextInvoiceNumberCalculationOptions {
  existingDocNos: Array<string | null | undefined>;
  targetPrefix?: string;
  targetYear?: number;
  fallbackPrefix?: string;
}

export interface NextInvoiceNumberCalculationResult {
  prefix: string;
  year: number;
  lastDocNo?: string;
  lastSequence: number;
  nextSequence: number;
  nextDocNo: string;
}

export function calculateNextInvoiceNumber(
  options: NextInvoiceNumberCalculationOptions,
): NextInvoiceNumberCalculationResult {
  const year =
    Number.isInteger(options.targetYear) && options.targetYear! >= 2000
      ? options.targetYear!
      : new Date().getFullYear();

  const parsedList = options.existingDocNos
    .map((doc) => parseInvoiceDocNo(doc))
    .filter((item): item is ParsedInvoiceNumber => item !== null);

  let prefix = (options.targetPrefix || "").trim().toUpperCase();
  if (!prefix && parsedList.length > 0) {
    // Son belgelerin ön ekini al
    prefix = parsedList[0].prefix;
  }
  if (!prefix) {
    prefix = (options.fallbackPrefix || "GIB").trim().toUpperCase();
  }

  // İlgili prefix ve yıl ile eşleşen kayıtları filtrele
  const matching = parsedList.filter(
    (item) => item.prefix === prefix && item.year === year,
  );

  let maxSequence = 0;
  let lastMatchingDocNo: string | undefined = undefined;

  for (const item of matching) {
    if (item.sequence > maxSequence) {
      maxSequence = item.sequence;
      lastMatchingDocNo = item.raw;
    }
  }

  const nextSequence = maxSequence + 1;
  const nextDocNo = formatInvoiceDocNo(prefix, year, nextSequence);

  return {
    prefix,
    year,
    lastDocNo: lastMatchingDocNo,
    lastSequence: maxSequence,
    nextSequence,
    nextDocNo,
  };
}
