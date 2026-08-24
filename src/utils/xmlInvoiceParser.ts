import { ExtractedDocumentData } from "../lib/firebase";
import { InvoiceTaxItem, TaxType } from "../types";

export interface ParsedXmlInvoiceResult {
  success: boolean;
  data: ExtractedDocumentData;
  rawItems?: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
    vatRate: number;
  }>;
  error?: string;
}

/**
 * Intelligent helper to extract text content from XML nodes by tag name,
 * matching local names regardless of namespace prefix (e.g. cbc:ID, ID, invoice:ID).
 */
function getTagText(parent: Element | Document, tagName: string): string | null {
  // Try direct tag name
  const direct = parent.getElementsByTagName(tagName);
  if (direct.length > 0 && direct[0].textContent) {
    return direct[0].textContent.trim();
  }

  // Try searching all elements matching localName
  const all = parent.getElementsByTagName("*");
  for (let i = 0; i < all.length; i++) {
    const el = all[i];
    const local = el.localName || el.nodeName.split(":").pop() || "";
    if (local.toLowerCase() === tagName.toLowerCase() && el.textContent) {
      return el.textContent.trim();
    }
  }
  return null;
}

/**
 * Get all matching elements by local name
 */
function getElements(parent: Element | Document, tagName: string): Element[] {
  const matches: Element[] = [];
  const all = parent.getElementsByTagName("*");
  for (let i = 0; i < all.length; i++) {
    const el = all[i];
    const local = el.localName || el.nodeName.split(":").pop() || "";
    if (local.toLowerCase() === tagName.toLowerCase()) {
      matches.push(el);
    }
  }
  return matches;
}

/**
 * Categorize expense based on vendor name or item descriptions
 */
function detectExpenseCategory(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("mal alım") || lower.includes("ticari mal") || lower.includes("stok") || lower.includes("hammadde") || lower.includes("malzeme") || lower.includes("yedek parça") || lower.includes("ürün alım") || lower.includes("toptan") || lower.includes("koli") || lower.includes("palet") || lower.includes("tedarik")) {
    return "Mal Alımı";
  }
  if (lower.includes("petrol") || lower.includes("akaryakıt") || lower.includes("benzin") || lower.includes("motorin") || lower.includes("shell") || lower.includes("opet") || lower.includes("bp ") || lower.includes("total")) {
    return "Yakıt harcamaları";
  }
  if (lower.includes("yemek") || lower.includes("restoran") || lower.includes("kebap") || lower.includes("lokanta") || lower.includes("cafe") || lower.includes("kahve") || lower.includes("gıda") || lower.includes("market") || lower.includes("migros") || lower.includes("carrefour") || lower.includes("ulaşım") || lower.includes("taksi") || lower.includes("bilet") || lower.includes("uber") || lower.includes("metro")) {
    return "Yemek ve ulaşım";
  }
  if (lower.includes("elektrik") || lower.includes("enerji") || lower.includes("tedaş") || lower.includes("enerjisa") || lower.includes("gediz") || lower.includes("ck boğaziçi")) {
    return "Elektrik Faturası";
  }
  if (lower.includes("su ") || lower.includes("iski") || lower.includes("aski") || lower.includes("izsu") || lower.includes("su faturası")) {
    return "Su Faturası";
  }
  if (lower.includes("doğalgaz") || lower.includes("gaz") || lower.includes("igdaş") || lower.includes("başkentgaz") || lower.includes("izmirgaz")) {
    return "Doğalgaz faturası";
  }
  if (lower.includes("kırtasiye") || lower.includes("ofis") || lower.includes("kağıt") || lower.includes("toner") || lower.includes("kartuş")) {
    return "Kırtasiye harcamaları";
  }
  if (lower.includes("kargo") || lower.includes("posta") || lower.includes("yurtiçi") || lower.includes("aras") || lower.includes("mng") || lower.includes("ptt") || lower.includes("surat")) {
    return "Kargo ve posta";
  }
  if (lower.includes("kira") || lower.includes("gayrimenkul") || lower.includes("emlak") || lower.includes("aidat")) {
    return "Kira ödemeleri";
  }
  if (lower.includes("yazılım") || lower.includes("hosting") || lower.includes("domain") || lower.includes("cloud") || lower.includes("sunucu") || lower.includes("lisans") || lower.includes("bilgisayar") || lower.includes("bilişim")) {
    return "Yazılım lisansları";
  }
  if (lower.includes("danışmanlık") || lower.includes("müşavirlik") || lower.includes("avukat") || lower.includes("hukuk") || lower.includes("muhasebe")) {
    return "Danışmanlık ücretleri";
  }
  if (lower.includes("demirbaş") || lower.includes("makine") || lower.includes("cihaz") || lower.includes("ekipman") || lower.includes("mobilya") || lower.includes("teçhizat")) {
    return "Demirbaş alımları";
  }
  if (lower.includes("otel") || lower.includes("konaklama") || lower.includes("seyahat") || lower.includes("turizm") || lower.includes("havayolu") || lower.includes("thy") || lower.includes("pegasus")) {
    return "Seyahat harcamaları";
  }
  if (lower.includes("temizlik") || lower.includes("deterjan") || lower.includes("mutfak") || lower.includes("çay")) {
    return "Temizlik ve mutfak";
  }
  return "Mal Alımı";
}

/**
 * Detect payment method from XML codes or text
 */
function detectPaymentMethod(codeOrText: string): ExtractedDocumentData["paymentMethod"] {
  const val = codeOrText.trim().toLowerCase();
  if (val === "10" || val.includes("nakit") || val.includes("cash") || val.includes("peşin")) {
    return "Nakit";
  }
  if (val === "48" || val === "49" || val.includes("kredi") || val.includes("kart") || val.includes("pos") || val.includes("card") || val.includes("kredi kartı")) {
    return "Kredi Kartı";
  }
  if (val === "30" || val === "31" || val.includes("havale") || val.includes("eft") || val.includes("banka") || val.includes("transfer") || val.includes("iban")) {
    return "Banka Transferi / EFT";
  }
  if (val === "20" || val.includes("çek") || val.includes("cheque") || val.includes("check")) {
    return "Çek";
  }
  if (val.includes("senet") || val.includes("bono")) {
    return "Senet";
  }
  if (val.includes("açık") || val.includes("vadeli") || val.includes("cari") || val.includes("veresiye")) {
    return "Açık Hesap / Vadeli";
  }
  return "Nakit";
}

/**
 * Parse all tax subtotal entries from document or lines into a normalized InvoiceTaxItem array
 */
function extractAllXmlTaxItems(doc: Document): {
  taxItems: InvoiceTaxItem[];
  vatAmount: number;
  vatRate: number;
  withholdingAmount: number;
  otvAmount: number;
  oivAmount: number;
  accommodationTaxAmount: number;
  stampTaxAmount: number;
  withholdingTaxAmount: number;
} {
  const itemMap = new Map<string, InvoiceTaxItem>();

  // 1. Gather all TaxTotal and WithholdingTaxTotal elements
  const allTaxTotals = getElements(doc, "TaxTotal").concat(getElements(doc, "WithholdingTaxTotal"));

  for (const tt of allTaxTotals) {
    const isWithholdingTag = (tt.localName || tt.nodeName).toLowerCase().includes("withholding");
    const subtotals = getElements(tt, "TaxSubtotal");

    if (subtotals.length > 0) {
      for (const st of subtotals) {
        const amtStr = getTagText(st, "TaxAmount");
        const taxableStr = getTagText(st, "TaxableAmount");
        const percentStr = getTagText(st, "Percent");

        const taxAmount = amtStr ? parseFloat(amtStr.replace(",", ".")) || 0 : 0;
        const taxableAmount = taxableStr ? parseFloat(taxableStr.replace(",", ".")) || 0 : 0;
        const rate = percentStr ? parseFloat(percentStr.replace(",", ".")) || 0 : 0;

        const taxCategory = getElements(st, "TaxCategory")[0];
        const taxScheme = taxCategory ? getElements(taxCategory, "TaxScheme")[0] : null;

        const taxTypeCode = (taxScheme ? getTagText(taxScheme, "TaxTypeCode") : "") || (taxCategory ? getTagText(taxCategory, "TaxTypeCode") : "") || "";
        const rawName = (taxScheme ? getTagText(taxScheme, "Name") : "") || (taxCategory ? getTagText(taxCategory, "Name") : "") || "";
        const exemptionCode = taxCategory ? getTagText(taxCategory, "TaxExemptionReasonCode") || "" : "";
        const exemptionReason = taxCategory ? getTagText(taxCategory, "TaxExemptionReason") || "" : "";

        // Determine Normalized TaxType
        let taxType: TaxType = "KDV";
        const upperName = rawName.toUpperCase();
        const code = taxTypeCode.trim();

        if (isWithholdingTag || code === "9015" || code === "4171" || upperName.includes("TEVKİFAT") || upperName.includes("TEVKIFAT")) {
          taxType = "KDV Tevkifatı";
        } else if (code.startsWith("007") || upperName.includes("ÖTV") || upperName.includes("ÖZEL TÜKETİM")) {
          taxType = "ÖTV";
        } else if (code === "4080" || upperName.includes("ÖİV") || upperName.includes("ÖZEL İLETİŞİM")) {
          taxType = "ÖİV";
        } else if (code === "0059" || upperName.includes("KONAKLAMA")) {
          taxType = "Konaklama Vergisi";
        } else if (code === "0040" || code === "0041" || code === "1047" || upperName.includes("DAMGA")) {
          taxType = "Damga Vergisi";
        } else if (code === "0003" || upperName.includes("STOPAJ") || upperName.includes("GELİR VERGİSİ")) {
          taxType = "Stopaj";
        } else if (code === "0021" || upperName.includes("BSMV")) {
          taxType = "BSMV";
        } else if (code === "8001" || code === "8002" || upperName.includes("BORSA") || upperName.includes("MERA")) {
          taxType = "Borsa Tescil / Fon";
        } else if (code === "0015" || upperName.includes("KDV") || upperName.includes("KATMA DEĞER")) {
          taxType = "KDV";
        } else if (rawName) {
          taxType = rawName as any;
        }

        // Build human-friendly label
        let taxName = rawName;
        if (!taxName) {
          if (taxType === "KDV") {
            taxName = `Katma Değer Vergisi (%${rate})`;
          } else if (taxType === "KDV Tevkifatı") {
            taxName = `KDV Tevkifatı${rate > 0 ? ` (%${rate})` : ""}`;
          } else if (taxType === "ÖTV") {
            taxName = `Özel Tüketim Vergisi${rate > 0 ? ` (%${rate})` : ""}`;
          } else if (taxType === "ÖİV") {
            taxName = `Özel İletişim Vergisi (%${rate || 10})`;
          } else if (taxType === "Konaklama Vergisi") {
            taxName = `Konaklama Vergisi (%${rate || 2})`;
          } else if (taxType === "Damga Vergisi") {
            taxName = "Damga Vergisi";
          } else if (taxType === "Stopaj") {
            taxName = `Stopaj / Gelir Vergisi Kesintisi${rate > 0 ? ` (%${rate})` : ""}`;
          } else {
            taxName = `${taxType}${rate > 0 ? ` (%${rate})` : ""}`;
          }
        }

        const mapKey = `${taxType}_${rate}_${taxTypeCode}_${exemptionCode}`;
        const existing = itemMap.get(mapKey);
        if (existing) {
          existing.taxAmount = Number((existing.taxAmount + taxAmount).toFixed(2));
          if (taxableAmount > 0) {
            existing.taxableAmount = Number(((existing.taxableAmount || 0) + taxableAmount).toFixed(2));
          }
        } else {
          itemMap.set(mapKey, {
            id: `tax_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            taxType,
            taxTypeCode: taxTypeCode || undefined,
            taxName,
            rate,
            taxableAmount: taxableAmount > 0 ? Number(taxableAmount.toFixed(2)) : undefined,
            taxAmount: Number(taxAmount.toFixed(2)),
            exemptionCode: exemptionCode || undefined,
            exemptionReason: exemptionReason || undefined,
          });
        }
      }
    } else {
      // Direct TaxAmount under TaxTotal without subtotal breakdown
      const amtStr = getTagText(tt, "TaxAmount");
      if (amtStr) {
        const taxAmount = parseFloat(amtStr.replace(",", ".")) || 0;
        if (taxAmount > 0) {
          const taxType: TaxType = isWithholdingTag ? "KDV Tevkifatı" : "KDV";
          const mapKey = `${taxType}_direct`;
          if (!itemMap.has(mapKey)) {
            itemMap.set(mapKey, {
              id: `tax_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              taxType,
              taxName: isWithholdingTag ? "KDV Tevkifatı" : "Katma Değer Vergisi",
              rate: isWithholdingTag ? undefined : 20,
              taxAmount: Number(taxAmount.toFixed(2)),
            });
          }
        }
      }
    }
  }

  const taxItems = Array.from(itemMap.values());

  // Calculate totals per category
  let vatAmount = 0;
  let vatRate = 20;
  let withholdingAmount = 0;
  let otvAmount = 0;
  let oivAmount = 0;
  let accommodationTaxAmount = 0;
  let stampTaxAmount = 0;
  let withholdingTaxAmount = 0;

  for (const item of taxItems) {
    if (item.taxType === "KDV") {
      vatAmount += item.taxAmount;
      if (item.rate && item.rate > 0) {
        vatRate = item.rate;
      }
    } else if (item.taxType === "KDV Tevkifatı") {
      withholdingAmount += item.taxAmount;
    } else if (item.taxType === "ÖTV") {
      otvAmount += item.taxAmount;
    } else if (item.taxType === "ÖİV") {
      oivAmount += item.taxAmount;
    } else if (item.taxType === "Konaklama Vergisi") {
      accommodationTaxAmount += item.taxAmount;
    } else if (item.taxType === "Damga Vergisi") {
      stampTaxAmount += item.taxAmount;
    } else if (item.taxType === "Stopaj") {
      withholdingTaxAmount += item.taxAmount;
    }
  }

  return {
    taxItems,
    vatAmount: Number(vatAmount.toFixed(2)),
    vatRate,
    withholdingAmount: Number(withholdingAmount.toFixed(2)),
    otvAmount: Number(otvAmount.toFixed(2)),
    oivAmount: Number(oivAmount.toFixed(2)),
    accommodationTaxAmount: Number(accommodationTaxAmount.toFixed(2)),
    stampTaxAmount: Number(stampTaxAmount.toFixed(2)),
    withholdingTaxAmount: Number(withholdingTaxAmount.toFixed(2)),
  };
}

/**
 * Parses UBL-TR 2.1 (e-Fatura / e-Arşiv) or generic XML accounting document
 */
export function parseXmlInvoice(xmlString: string, fileName?: string): ParsedXmlInvoiceResult {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, "application/xml");

    // Check for XML parsing errors
    const parserError = doc.querySelector("parsererror");
    if (parserError) {
      return {
        success: false,
        data: {
          taxNumber: "",
          companyTitle: fileName?.replace(/\.[^/.]+$/, "") || "XML Belgesi",
          invoiceNumber: `XML-${Date.now().toString().slice(-4)}`,
          issueDate: new Date().toISOString().split("T")[0],
          docType: "Fatura",
          subtotal: 0,
          vatRate: 20,
          vatAmount: 0,
          grandTotal: 0,
          paymentMethod: "Nakit",
          expenseCategory: "Yemek ve ulaşım",
          notes: "XML ayrıştırılırken hata oluştu."
        },
        error: parserError.textContent || "Geçersiz XML içeriği."
      };
    }

    // 1. Supplier / Vendor Details (AccountingSupplierParty)
    let companyTitle = "";
    let taxNumber = "";

    const supplierParty = getElements(doc, "AccountingSupplierParty")[0] || getElements(doc, "SupplierParty")[0] || getElements(doc, "Party")[0];
    if (supplierParty) {
      // PartyName -> Name
      const partyNames = getElements(supplierParty, "PartyName");
      if (partyNames.length > 0) {
        const nameEl = getTagText(partyNames[0], "Name");
        if (nameEl) companyTitle = nameEl;
      }

      // Person Name (if individual company)
      if (!companyTitle) {
        const personEl = getElements(supplierParty, "Person")[0];
        if (personEl) {
          const first = getTagText(personEl, "FirstName") || "";
          const family = getTagText(personEl, "FamilyName") || "";
          if (first || family) companyTitle = `${first} ${family}`.trim();
        }
      }

      // PartyIdentification -> ID (VKN or TCKN)
      const partyIds = getElements(supplierParty, "PartyIdentification");
      for (const pid of partyIds) {
        const idVal = getTagText(pid, "ID");
        if (idVal && (idVal.length === 10 || idVal.length === 11) && /^\d+$/.test(idVal)) {
          taxNumber = idVal;
          break;
        }
      }
    }

    // Fallback company name from generic tags
    if (!companyTitle) {
      companyTitle = getTagText(doc, "FirmaAdi") || getTagText(doc, "Unvan") || getTagText(doc, "SupplierName") || "";
    }
    if (!taxNumber) {
      const genericVkn = getTagText(doc, "VKN") || getTagText(doc, "TCKN") || getTagText(doc, "VergiNo");
      if (genericVkn && /^\d+$/.test(genericVkn)) taxNumber = genericVkn;
    }

    // 2. Invoice Number
    let invoiceNumber = getTagText(doc, "ID") || getTagText(doc, "FaturaNo") || getTagText(doc, "InvoiceNumber") || "";

    // 3. Issue Date
    let issueDate = getTagText(doc, "IssueDate") || getTagText(doc, "FaturaTarihi") || getTagText(doc, "Date") || "";
    if (issueDate) {
      const match = issueDate.match(/\d{4}-\d{2}-\d{2}/);
      if (match) {
        issueDate = match[0];
      } else {
        const parts = issueDate.split(/[./-]/);
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            issueDate = `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
          } else if (parts[2].length === 4) {
            issueDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
          }
        }
      }
    }
    if (!issueDate) {
      issueDate = new Date().toISOString().split("T")[0];
    }

    // 4. Document Type
    const invoiceTypeCode = getTagText(doc, "InvoiceTypeCode") || "";
    const profileId = getTagText(doc, "ProfileID") || "";
    let docType: ExtractedDocumentData["docType"] = "Fatura";
    if (invoiceTypeCode.toUpperCase().includes("PERAKENDE") || invoiceTypeCode.toUpperCase().includes("FIS") || profileId.toUpperCase().includes("FIS")) {
      docType = "Fiş";
    }

    // 5. Monetary Amounts & Tax Subtotals Extraction
    let subtotal = 0;
    let grandTotal = 0;

    const monetaryTotal = getElements(doc, "LegalMonetaryTotal")[0] || getElements(doc, "MonetaryTotal")[0] || getElements(doc, "Toplamlar")[0];
    if (monetaryTotal) {
      const payableVal = getTagText(monetaryTotal, "PayableAmount") || getTagText(monetaryTotal, "TaxInclusiveAmount") || getTagText(monetaryTotal, "GrandTotal");
      if (payableVal) grandTotal = parseFloat(payableVal.replace(",", ".")) || 0;

      const taxExclusiveVal = getTagText(monetaryTotal, "TaxExclusiveAmount") || getTagText(monetaryTotal, "LineExtensionAmount") || getTagText(monetaryTotal, "Subtotal");
      if (taxExclusiveVal) subtotal = parseFloat(taxExclusiveVal.replace(",", ".")) || 0;
    }

    // Extract all taxes (KDV, Tevkifat, ÖTV, ÖİV, Konaklama, Stopaj, Damga vb.)
    const taxResults = extractAllXmlTaxItems(doc);
    let vatAmount = taxResults.vatAmount;
    let vatRate = taxResults.vatRate;
    const taxItems = taxResults.taxItems;

    // Fallback totals from generic tags
    if (!grandTotal) {
      const gStr = getTagText(doc, "GenelToplam") || getTagText(doc, "ToplamTutar") || getTagText(doc, "OdenecekTutar") || getTagText(doc, "GrandTotal");
      if (gStr) grandTotal = parseFloat(gStr.replace(",", ".")) || 0;
    }
    if (!subtotal) {
      const sStr = getTagText(doc, "Matrah") || getTagText(doc, "KdvHaricTutar") || getTagText(doc, "NetTutar") || getTagText(doc, "Subtotal");
      if (sStr) subtotal = parseFloat(sStr.replace(",", ".")) || 0;
    }
    if (!vatAmount && taxItems.length === 0) {
      const vStr = getTagText(doc, "KdvTutari") || getTagText(doc, "KDV") || getTagText(doc, "VergiTutari") || getTagText(doc, "VatAmount");
      if (vStr) {
        vatAmount = parseFloat(vStr.replace(",", ".")) || 0;
        taxItems.push({
          id: `tax_${Date.now()}`,
          taxType: "KDV",
          taxName: `Katma Değer Vergisi (%${vatRate})`,
          rate: vatRate,
          taxAmount: vatAmount,
        });
      }
    }

    // Math consistency resolution
    if (grandTotal && !subtotal && vatAmount) {
      subtotal = Number((grandTotal - vatAmount).toFixed(2));
    } else if (subtotal && vatAmount && !grandTotal) {
      grandTotal = Number((subtotal + vatAmount).toFixed(2));
    } else if (grandTotal && !subtotal && !vatAmount) {
      subtotal = Number((grandTotal / (1 + vatRate / 100)).toFixed(2));
      vatAmount = Number((grandTotal - subtotal).toFixed(2));
      if (taxItems.length === 0) {
        taxItems.push({
          id: `tax_${Date.now()}`,
          taxType: "KDV",
          taxName: `Katma Değer Vergisi (%${vatRate})`,
          rate: vatRate,
          taxAmount: vatAmount,
          taxableAmount: subtotal,
        });
      }
    } else if (subtotal && !vatAmount && !grandTotal) {
      vatAmount = Number(((subtotal * vatRate) / 100).toFixed(2));
      grandTotal = Number((subtotal + vatAmount).toFixed(2));
      if (taxItems.length === 0) {
        taxItems.push({
          id: `tax_${Date.now()}`,
          taxType: "KDV",
          taxName: `Katma Değer Vergisi (%${vatRate})`,
          rate: vatRate,
          taxAmount: vatAmount,
          taxableAmount: subtotal,
        });
      }
    }

    // 6. Payment Means
    let paymentMethod: ExtractedDocumentData["paymentMethod"] = "Nakit";
    const paymentMeans = getElements(doc, "PaymentMeans")[0];
    if (paymentMeans) {
      const code = getTagText(paymentMeans, "PaymentMeansCode") || getTagText(paymentMeans, "PaymentChannelCode") || "";
      if (code) {
        paymentMethod = detectPaymentMethod(code);
      }
    }
    if (paymentMethod === "Nakit") {
      const genericPayment = getTagText(doc, "OdemeTipi") || getTagText(doc, "OdemeSekli") || getTagText(doc, "PaymentMethod") || "";
      if (genericPayment) {
        paymentMethod = detectPaymentMethod(genericPayment);
      }
    }

    // 7. Line Items & Expense Categorization
    const rawItems: ParsedXmlInvoiceResult["rawItems"] = [];
    const lineElements = getElements(doc, "InvoiceLine").concat(getElements(doc, "LineItem")).concat(getElements(doc, "Kalem"));
    let combinedItemText = "";

    for (const line of lineElements) {
      const itemName = getTagText(line, "Name") || getTagText(line, "Description") || getTagText(line, "MalHizmet") || "Kalem";
      const qtyStr = getTagText(line, "InvoicedQuantity") || getTagText(line, "Quantity") || getTagText(line, "Miktar") || "1";
      const priceStr = getTagText(line, "PriceAmount") || getTagText(line, "BirimFiyat") || "0";
      const lineAmtStr = getTagText(line, "LineExtensionAmount") || getTagText(line, "Tutar") || "0";
      const lineVatStr = getTagText(line, "Percent") || "20";

      combinedItemText += ` ${itemName}`;
      rawItems.push({
        name: itemName,
        quantity: parseFloat(qtyStr.replace(",", ".")) || 1,
        unitPrice: parseFloat(priceStr.replace(",", ".")) || 0,
        total: parseFloat(lineAmtStr.replace(",", ".")) || 0,
        vatRate: parseInt(lineVatStr, 10) || 20
      });
    }

    // Expense Category Detection
    const expenseCategory = detectExpenseCategory(`${companyTitle} ${combinedItemText}`);

    // Notes
    const notesList: string[] = [];
    const noteElements = getElements(doc, "Note");
    for (const n of noteElements) {
      if (n.textContent) notesList.push(n.textContent.trim());
    }
    let notes = notesList.slice(0, 3).join(" | ");
    if (!notes && rawItems.length > 0) {
      notes = `Kalemler: ${rawItems.map((it) => it.name).slice(0, 3).join(", ")}`;
    }

    if (!companyTitle && fileName) {
      companyTitle = fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
    }
    if (!invoiceNumber) {
      invoiceNumber = `XML-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    return {
      success: true,
      data: {
        taxNumber: taxNumber || "",
        companyTitle: companyTitle || "Satıcı / Düzenleyen",
        invoiceNumber,
        issueDate,
        docType,
        subtotal: Number(subtotal.toFixed(2)),
        vatRate,
        vatAmount: Number(vatAmount.toFixed(2)),
        taxItems: taxItems.length > 0 ? taxItems : undefined,
        withholdingAmount: taxResults.withholdingAmount > 0 ? taxResults.withholdingAmount : undefined,
        otvAmount: taxResults.otvAmount > 0 ? taxResults.otvAmount : undefined,
        oivAmount: taxResults.oivAmount > 0 ? taxResults.oivAmount : undefined,
        accommodationTaxAmount: taxResults.accommodationTaxAmount > 0 ? taxResults.accommodationTaxAmount : undefined,
        stampTaxAmount: taxResults.stampTaxAmount > 0 ? taxResults.stampTaxAmount : undefined,
        withholdingTaxAmount: taxResults.withholdingTaxAmount > 0 ? taxResults.withholdingTaxAmount : undefined,
        grandTotal: Number(grandTotal.toFixed(2)),
        paymentMethod,
        expenseCategory,
        notes: notes || "UBL-TR e-Fatura / e-Arşiv XML dosyasından ayrıştırıldı."
      },
      rawItems: rawItems.length > 0 ? rawItems : undefined
    };
  } catch (err: any) {
    return {
      success: false,
      data: {
        taxNumber: "",
        companyTitle: fileName?.replace(/\.[^/.]+$/, "") || "Hatalı XML",
        invoiceNumber: `ERR-${Date.now().toString().slice(-4)}`,
        issueDate: new Date().toISOString().split("T")[0],
        docType: "Fatura",
        subtotal: 0,
        vatRate: 20,
        vatAmount: 0,
        grandTotal: 0,
        paymentMethod: "Nakit",
        expenseCategory: "Yemek ve ulaşım",
        notes: "XML ayrıştırılırken hata oluştu: " + (err.message || "Bilinmeyen hata")
      },
      error: err?.message || "XML ayrıştırılamadı."
    };
  }
}
