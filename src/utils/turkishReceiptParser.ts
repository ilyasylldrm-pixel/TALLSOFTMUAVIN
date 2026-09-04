/**
 * Turkish Accounting Document Parser (Fiş, Fatura, e-Arşiv, ÖKC)
 * 
 * Rules-based & heuristic extraction engine specifically engineered for Turkish
 * accounting documents:
 * - ÖKC & Yeni Nesil Yazar Kasa / Akaryakıt Pompa Satış Fişleri
 * - e-Arşiv / e-Fatura / e-İrsaliye A4 Kağıt / PDF / Görselleri
 * - Matrah, KDV, Toplam çapraz matematiksel denetimi
 */

export interface ParsedLineItem {
  name: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  vatRate?: number;
  total?: number;
}

export interface ParsedAccountingData {
  taxNumber: string;
  companyTitle: string;
  invoiceNumber: string;
  issueDate: string; // YYYY-MM-DD
  docType: "Fatura" | "Fiş";
  subtotal: number; // Matrah (KDV Hariç Tutar)
  vatRate: number; // % (20, 10, 1, vb.)
  vatAmount: number; // KDV Tutarı
  grandTotal: number; // Ödenecek / Genel Toplam Tutar
  paymentMethod: "Nakit" | "Kredi Kartı" | "Banka Transferi / EFT" | "Çek" | "Senet" | "Açık Hesap / Vadeli";
  expenseCategory: string;
  items: ParsedLineItem[];
  notes: string;
  confidence: {
    taxNumber: boolean;
    companyTitle: boolean;
    invoiceNumber: boolean;
    date: boolean;
    totalsMatch: boolean; // subtotal + vat == grandTotal
  };
  rawText: string;
}

/**
 * Parses Turkish formatted numbers like:
 * "2.984,00", "*497,33", "450.000,00 TL", "375.000,00", "64,63", "2,984.00"
 */
export function parseTurkishNumber(input: string | undefined | null): number | null {
  if (!input) return null;

  let cleaned = input
    .replace(/[\*₺TLtlUSD\$\€]/g, "")
    .replace(/\s+/g, "")
    .trim();

  if (!cleaned) return null;

  if (cleaned.includes(".") && cleaned.includes(",")) {
    if (cleaned.indexOf(".") < cleaned.lastIndexOf(",")) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (cleaned.includes(",")) {
    const parts = cleaned.split(",");
    if (parts.length === 2 && parts[1].length <= 2) {
      cleaned = parts[0] + "." + parts[1];
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : Number(num.toFixed(2));
}

/**
 * Standardizes dates to YYYY-MM-DD
 */
export function parseTurkishDate(input: string): string | null {
  if (!input) return null;

  const dmyMatch = input.match(/\b(\d{1,2})[-./](\d{1,2})[-./](\d{4})\b/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  const ymdMatch = input.match(/\b(\d{4})[-./](\d{1,2})[-./](\d{1,2})\b/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, "0");
    const day = ymdMatch[3].padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return null;
}

/**
 * Categorizes expense according to vendor name and line descriptions
 */
export function detectExpenseCategory(text: string): string {
  const lower = text.toLowerCase();

  if (
    lower.includes("petrol") ||
    lower.includes("akaryakıt") ||
    lower.includes("benzin") ||
    lower.includes("motorin") ||
    lower.includes("dizel") ||
    lower.includes("lpg") ||
    lower.includes("otogaz") ||
    lower.includes("shell") ||
    lower.includes("opet") ||
    lower.includes("bp ") ||
    lower.includes("total") ||
    lower.includes("aygaz") ||
    lower.includes("utts") ||
    lower.includes("yakıt")
  ) {
    return "Yakıt harcamaları";
  }

  if (
    lower.includes("mal alım") ||
    lower.includes("ticari mal") ||
    lower.includes("parke") ||
    lower.includes("laminant") ||
    lower.includes("kereste") ||
    lower.includes("hammadde") ||
    lower.includes("stok") ||
    lower.includes("toptan") ||
    lower.includes("palet") ||
    lower.includes("inşaat") ||
    lower.includes("nalbur") ||
    lower.includes("demir") ||
    lower.includes("çimento") ||
    lower.includes("malzeme") ||
    lower.includes("yedek parça")
  ) {
    return "Mal Alımı";
  }

  if (
    lower.includes("yemek") ||
    lower.includes("restoran") ||
    lower.includes("kebap") ||
    lower.includes("lokanta") ||
    lower.includes("cafe") ||
    lower.includes("kahve") ||
    lower.includes("gıda") ||
    lower.includes("market") ||
    lower.includes("döner") ||
    lower.includes("köfte") ||
    lower.includes("pide") ||
    lower.includes("fırın") ||
    lower.includes("pastane") ||
    lower.includes("büfe") ||
    lower.includes("ulaşım") ||
    lower.includes("taksi") ||
    lower.includes("metro") ||
    lower.includes("otobüs")
  ) {
    return "Yemek ve ulaşım";
  }

  if (lower.includes("kırtasiye") || lower.includes("ofis") || lower.includes("kağıt") || lower.includes("toner") || lower.includes("kartuş")) {
    return "Kırtasiye harcamaları";
  }

  if (lower.includes("elektrik") || lower.includes("enerji") || lower.includes("tedaş") || lower.includes("enerjisa") || lower.includes("ck boğaziçi")) {
    return "Elektrik Faturası";
  }

  if (lower.includes("su ") || lower.includes("iski") || lower.includes("aski") || lower.includes("koski") || lower.includes("su faturası")) {
    return "Su Faturası";
  }

  if (lower.includes("doğalgaz") || lower.includes("gaz") || lower.includes("igdaş") || lower.includes("enerya") || lower.includes("başkentgaz")) {
    return "Doğalgaz faturası";
  }

  if (lower.includes("kargo") || lower.includes("posta") || lower.includes("yurtiçi") || lower.includes("aras") || lower.includes("mng") || lower.includes("ptt") || lower.includes("sürat")) {
    return "Kargo ve posta";
  }

  if (lower.includes("yazılım") || lower.includes("hosting") || lower.includes("domain") || lower.includes("cloud") || lower.includes("sunucu") || lower.includes("lisans") || lower.includes("bilişim")) {
    return "Yazılım lisansları";
  }

  if (lower.includes("danışmanlık") || lower.includes("müşavirlik") || lower.includes("avukat") || lower.includes("hukuk") || lower.includes("mali müşavir")) {
    return "Danışmanlık ücretleri";
  }

  if (lower.includes("otel") || lower.includes("konaklama") || lower.includes("seyahat") || lower.includes("turizm") || lower.includes("uçak")) {
    return "Seyahat harcamaları";
  }

  if (lower.includes("kira") || lower.includes("aidat")) {
    return "Kira ödemeleri";
  }

  return "Diğer Giderler";
}

/**
 * Main Turkish Document Parser
 */
export function parseTurkishReceiptText(rawText: string, fileName?: string): ParsedAccountingData {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // 1. Determine Document Type (Fiş vs Fatura)
  const isReceipt =
    /F[İI]Ş\s*NO/i.test(rawText) ||
    /ÖKC/i.test(rawText) ||
    /YAZAR\s*KASA/i.test(rawText) ||
    /TOPKDV/i.test(rawText) ||
    /Z\s*NO/i.test(rawText) ||
    /EKÜ/i.test(rawText) ||
    /POMPA/i.test(rawText) ||
    /AKARYAKIT\s*POMPA/i.test(rawText);

  const docType: "Fatura" | "Fiş" = isReceipt ? "Fiş" : "Fatura";

  // 2. Extract Company Title (Firma Ünvanı)
  let companyTitle = "";
  const companyKeywords = [
    "A.Ş", "A.S", "LTD", "ŞTİ", "STI", "ŞİRKETİ", "SIRKETI",
    "TİCARET", "TICARET", "SANAYİ", "SANAYI", "TİC", "SAN",
    "PETROL", "MARKET", "GIDA", "LOKANTA", "RESTORAN", "OTOMOTİV",
    "İNŞAAT", "INSAAT", "TAAHHÜT", "HİZMETLERİ", "HIZMETLERI"
  ];

  const stopHeaderKeywords = [
    "E-ARŞİV", "EARSIV", "E-FATURA", "EFATURA", "MALİ MÜHÜR",
    "T.C.", "HAZİNE", "GELİR İDARESİ", "ÖKC", "BİLGİ FİŞİ", "FATURA"
  ];

  let vendorSearchLimit = lines.length;
  const sayinIndex = lines.findIndex((l) => /^SAYIN\b/i.test(l) || /^ALICI\b/i.test(l));
  if (sayinIndex > 0) {
    vendorSearchLimit = sayinIndex;
  }

  for (let i = 0; i < Math.min(vendorSearchLimit, 10); i++) {
    const line = lines[i].replace(/[|\_«»]/g, "").trim();
    if (stopHeaderKeywords.some((sw) => line.toUpperCase() === sw)) continue;

    const hasEntityKeyword = companyKeywords.some((k) =>
      new RegExp(`\\b${k}\\b`, "i").test(line)
    );

    if (hasEntityKeyword && line.length >= 5) {
      companyTitle = line;
      break;
    }
  }

  if (!companyTitle && lines.length > 0) {
    for (let i = 0; i < Math.min(vendorSearchLimit, 5); i++) {
      const line = lines[i].replace(/[|\_«»]/g, "").trim();
      if (!stopHeaderKeywords.some((sw) => line.toUpperCase().includes(sw)) && line.length >= 4) {
        companyTitle = line;
        break;
      }
    }
  }

  if (companyTitle) {
    companyTitle = companyTitle
      .replace(/^[|«»\s]+/, "")
      .replace(/[|«»\s]+$/, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  } else if (fileName) {
    companyTitle = fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
  }

  // 3. Extract Tax Number (VKN 10 digits or TCKN 11 digits)
  let taxNumber = "";
  const vknRegexes = [
    /(?:VKN|V\.K\.N|VERG[İI]\s*K[İI]ML[İI]K\s*NO)\s*[:\.]?\s*(\d{10})/i,
    /(?:VD|VERG[İI]\s*D[Aİ]RES[İI]|VERG[İI]\s*DA[İI]RES[İI]).*?[:\.]?\s*(\d{10})/i,
    /(?:VERG[İI]\s*NO)\s*[:\.]?\s*(\d{10})/i,
    /(?:TCKN|T\.C\.?\s*K[İI]ML[İI]K\s*NO)\s*[:\.]?\s*(\d{11})/i,
    /\b(\d{10})\b/
  ];

  const textBeforeSayin = sayinIndex > 0 ? lines.slice(0, sayinIndex).join("\n") : rawText;

  for (const regex of vknRegexes) {
    const match = textBeforeSayin.match(regex);
    if (match && match[1]) {
      const candidate = match[1];
      if (!candidate.startsWith("0850") && !candidate.startsWith("05") && !candidate.startsWith("03") && !candidate.startsWith("02")) {
        taxNumber = candidate;
        break;
      }
    }
  }

  if (!taxNumber) {
    for (const regex of vknRegexes) {
      const match = rawText.match(regex);
      if (match && match[1]) {
        const candidate = match[1];
        if (!candidate.startsWith("0850") && !candidate.startsWith("05") && !candidate.startsWith("03") && !candidate.startsWith("02")) {
          taxNumber = candidate;
          break;
        }
      }
    }
  }

  // 4. Extract Invoice / Receipt Number (Fatura No / Fiş No)
  let invoiceNumber = "";
  const gibFaturaMatch = rawText.match(/\b([A-ZÇĞİÖŞÜ]{3}\d{13})\b/i);
  if (gibFaturaMatch) {
    invoiceNumber = gibFaturaMatch[1].toUpperCase();
  }

  if (!invoiceNumber) {
    const faturaNoLabelMatch = rawText.match(/Fatura\s*No\s*[:\.]?\s*([A-Z0-9_-]{5,20})/i);
    if (faturaNoLabelMatch) {
      invoiceNumber = faturaNoLabelMatch[1].trim();
    }
  }

  if (!invoiceNumber) {
    const fisNoMatch = rawText.match(/F[İI]Ş\s*NO\s*[:\.]?\s*(\d{1,8})/i);
    if (fisNoMatch) {
      invoiceNumber = `FİŞ-${fisNoMatch[1].padStart(4, "0")}`;
    }
  }

  if (!invoiceNumber) {
    const zNoMatch = rawText.match(/Z\s*NO\s*[:\.]?\s*([\d\.]+)/i);
    if (zNoMatch) {
      invoiceNumber = `Z-${zNoMatch[1].replace(/\D/g, "")}`;
    }
  }

  if (!invoiceNumber) {
    invoiceNumber = isReceipt
      ? `FİŞ-${Date.now().toString().slice(-4)}`
      : `FAT-${Date.now().toString().slice(-6)}`;
  }

  // 5. Extract Date
  let issueDate = new Date().toISOString().split("T")[0];
  for (const line of lines) {
    const parsedDate = parseTurkishDate(line);
    if (parsedDate) {
      issueDate = parsedDate;
      break;
    }
  }

  // 6. Extract Grand Total
  let grandTotal = 0;
  const totalRegexes = [
    /(?:ÖDENECEK\s*TUTAR|ODENECEK\s*TUTAR)\s*[:\*]?\s*([0-9\.,]+)/i,
    /(?:VERG[İI]LER\s*DAH[İI]L\s*TOPLAM\s*TUTAR)\s*[:\*]?\s*([0-9\.,]+)/i,
    /(?:GENEL\s*TOPLAM)\s*[:\*]?\s*([0-9\.,]+)/i,
    /(?:\bTOPLAM)\s*[:\*]?\s*([0-9\.,]+)/i,
    /(?:K\.KARTI\/B\.KARTI|KREDI\s*KARTI|K\.KARTI)\s*[:\*]?\s*([0-9\.,]+)/i
  ];

  for (const regex of totalRegexes) {
    const match = rawText.match(regex);
    if (match && match[1]) {
      const parsed = parseTurkishNumber(match[1]);
      if (parsed && parsed > grandTotal) {
        grandTotal = parsed;
        break;
      }
    }
  }

  // 7. Extract KDV Amount & Rate
  let vatAmount = 0;
  let vatRate = 20;

  const vatAmountRegexes = [
    /(?:TOPKDV|TOP\.?\s*KDV)\s*[:\*]?\s*([0-9\.,]+)/i,
    /(?:HESAPLANAN\s*KDV)\s*(?:\(%\s*([0-9\.,]+)\))?\s*[:\*]?\s*([0-9\.,]+)/i,
    /(?:KDV\s*TUTARI|KDV\s*TOPLAMI)\s*[:\*]?\s*([0-9\.,]+)/i
  ];

  for (const regex of vatAmountRegexes) {
    const match = rawText.match(regex);
    if (match) {
      if (match.length >= 3 && match[1] && match[2]) {
        const parsedRate = parseTurkishNumber(match[1]);
        const parsedAmt = parseTurkishNumber(match[2]);
        if (parsedRate) vatRate = parsedRate;
        if (parsedAmt) vatAmount = parsedAmt;
        break;
      } else if (match[1]) {
        const parsedAmt = parseTurkishNumber(match[1]);
        if (parsedAmt) {
          vatAmount = parsedAmt;
          break;
        }
      }
    }
  }

  if (vatRate === 20) {
    const rateMatch = rawText.match(/%\s*(20|10|1|8|18)(?:[,\.]00)?\b/);
    if (rateMatch && rateMatch[1]) {
      vatRate = parseInt(rateMatch[1], 10);
    }
  }

  // 8. Extract Subtotal / Matrah
  let subtotal = 0;
  const subtotalRegexes = [
    /(?:MAL\s*H[İI]ZMET\s*TOPLAM\s*TUTARI|MAL\s*H[İI]ZMET\s*TUTARI)\s*[:\*]?\s*([0-9\.,]+)/i,
    /(?:ARA\s*TOPLAM)\s*[:\*]?\s*([0-9\.,]+)/i,
    /(?:MATRAH)\s*[:\*]?\s*([0-9\.,]+)/i
  ];

  for (const regex of subtotalRegexes) {
    const match = rawText.match(regex);
    if (match && match[1]) {
      const parsed = parseTurkishNumber(match[1]);
      if (parsed) {
        subtotal = parsed;
        break;
      }
    }
  }

  // 9. Mathematical Cross-Validation & Reconciliation: Matrah + KDV = Toplam
  if (grandTotal > 0 && vatAmount > 0 && subtotal === 0) {
    subtotal = Number((grandTotal - vatAmount).toFixed(2));
  } else if (subtotal > 0 && vatAmount > 0 && grandTotal === 0) {
    grandTotal = Number((subtotal + vatAmount).toFixed(2));
  } else if (grandTotal > 0 && subtotal === 0 && vatAmount === 0) {
    subtotal = Number((grandTotal / (1 + vatRate / 100)).toFixed(2));
    vatAmount = Number((grandTotal - subtotal).toFixed(2));
  } else if (subtotal > 0 && grandTotal > 0 && vatAmount === 0) {
    vatAmount = Number((grandTotal - subtotal).toFixed(2));
  }

  // 10. Extract Payment Method
  let paymentMethod: ParsedAccountingData["paymentMethod"] = "Nakit";
  if (
    /K\.KARTI/i.test(rawText) ||
    /B\.KARTI/i.test(rawText) ||
    /KRED[İI]\s*KARTI/i.test(rawText) ||
    /POS\s*SATIŞ/i.test(rawText) ||
    /MASTERCARD/i.test(rawText) ||
    /VISA/i.test(rawText)
  ) {
    paymentMethod = "Kredi Kartı";
  } else if (
    /HAVALE/i.test(rawText) ||
    /EFT/i.test(rawText) ||
    /IBAN/i.test(rawText) ||
    /BANKA/i.test(rawText)
  ) {
    paymentMethod = "Banka Transferi / EFT";
  }

  // 11. Extract Line Items
  const items: ParsedLineItem[] = [];

  const pumpMatch = rawText.match(/([0-9\.,]+)\s*(LT|AD|KG|M2|MT)\s*X\s*([0-9\.,]+)\s+([^\n%*]+)(?:%\s*(\d+))?\s*[:\*]?\s*([0-9\.,]+)/i);
  if (pumpMatch) {
    const qty = parseTurkishNumber(pumpMatch[1]) || 1;
    const unit = pumpMatch[2].toUpperCase();
    const price = parseTurkishNumber(pumpMatch[3]) || 0;
    const itemName = pumpMatch[4].trim();
    const itemVat = pumpMatch[5] ? parseInt(pumpMatch[5], 10) : vatRate;
    const itemTotal = parseTurkishNumber(pumpMatch[6]) || (qty * price);

    items.push({
      name: itemName,
      quantity: qty,
      unit,
      unitPrice: price,
      vatRate: itemVat,
      total: itemTotal
    });
  }

  const invoiceItemMatch = rawText.match(/([A-ZÇĞİÖŞÜ0-9\s\.\-]{3,40})\s+([0-9\.,]+)\s*(M2|ADET|KG|LT|PAKET|KOLİ)\s+([0-9\.,]+)\s*(?:TL)?/i);
  if (invoiceItemMatch && items.length === 0) {
    const itemName = invoiceItemMatch[1].trim();
    const qty = parseTurkishNumber(invoiceItemMatch[2]) || 1;
    const unit = invoiceItemMatch[3].toUpperCase();
    const price = parseTurkishNumber(invoiceItemMatch[4]) || 0;
    items.push({
      name: itemName,
      quantity: qty,
      unit,
      unitPrice: price,
      vatRate,
      total: subtotal || (qty * price)
    });
  }

  // 12. Notes & Extra Details
  const noteParts: string[] = [];
  const plateMatch = rawText.match(/\b(\d{2}\s*[A-Z]{1,3}\s*\d{2,4})\b/);
  if (plateMatch) {
    noteParts.push(`Araç Plakası: ${plateMatch[1].replace(/\s+/g, "")}`);
  }
  if (/UTTS/i.test(rawText)) {
    noteParts.push("UTTS (Ulusal Taşıt Tanıma) Onaylı");
  }
  const ibanMatch = rawText.match(/TR\d{2}\s*(?:\d{4}\s*){5}\d{2}/i);
  if (ibanMatch) {
    noteParts.push(`IBAN: ${ibanMatch[0].replace(/\s+/g, " ")}`);
  }

  const expenseCategory = detectExpenseCategory(rawText);
  const totalsMatch = Math.abs((subtotal + vatAmount) - grandTotal) < 0.05;

  return {
    taxNumber,
    companyTitle,
    invoiceNumber,
    issueDate,
    docType,
    subtotal: Number(subtotal.toFixed(2)),
    vatRate,
    vatAmount: Number(vatAmount.toFixed(2)),
    grandTotal: Number(grandTotal.toFixed(2)),
    paymentMethod,
    expenseCategory,
    items,
    notes: noteParts.join(" • "),
    confidence: {
      taxNumber: taxNumber.length === 10 || taxNumber.length === 11,
      companyTitle: companyTitle.length > 3,
      invoiceNumber: invoiceNumber.length >= 4,
      date: !!issueDate,
      totalsMatch
    },
    rawText
  };
}
