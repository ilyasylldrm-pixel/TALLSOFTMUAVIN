// GİB ve Mysoft Uyumlu Fatura Vergi, Tevkifat, Özel Matrah ve Dip Toplam Hesaplama Servisi

import { InvoiceItem, InvoiceTaxItem, ItemAdditionalTax, InvoiceProfileType } from "../types";
import {
  getWithholdingCodeInfo,
  getAdditionalTaxCodeInfo,
  getSpecialTaxBaseCodeInfo,
  getExemptionCodeInfo,
} from "../data/gibTaxCodes";

export interface ComputedInvoiceItem extends InvoiceItem {
  grossAmount: number; // İskonto öncesi brüt mal/hizmet tutarı (quantity * unitPrice)
  discountAmount: number; // İskonto tutarı (TL)
  discountRate: number; // İskonto oranı (%)
  effectiveTaxableAmount: number; // KDV'ye tabi asıl matrah (Özel matrah varsa kâr marjı)
  calculatedVatAmount: number; // Hesaplanan KDV tutarı
  withholdingAmount: number; // Tevkif edilen KDV tutarı
  payableVatAmount: number; // Satıcıya ödenecek net KDV tutarı (Hesaplanan KDV - Tevkif Edilen KDV)
  lineGrandTotal: number; // Satır Mal Bedeli + Toplam KDV + İlave Vergiler
  additionalTaxesAdditions: number; // İlave ek vergiler toplamı (ÖTV, ÖİV, Damga vb.)
  additionalTaxesDeductions: number; // Kesinti/Stopaj ek vergiler toplamı (GV/KV Stopaj, SGK Prim vb.)
}

export interface ComputedInvoiceTotals {
  grossTotal: number; // Toplam Mal/Hizmet Bedeli (İskonto Öncesi Brüt)
  totalDiscount: number; // Toplam İskonto Tutarı
  subtotal: number; // Toplam Mal/Hizmet Bedeli (KDV Hariç Net Ara Toplam)
  effectiveTaxableAmount: number; // Toplam KDV Matrahı (Özel matrah kâr marjı toplamı)
  totalVat: number; // Toplam Hesaplanan KDV
  totalWithholding: number; // (-) Toplam Tevkif Edilen KDV (Alıcının KDV2 ile ödeyeceği)
  payableVat: number; // Toplam Tahsil Edilecek KDV
  totalOtv: number; // Toplam ÖTV
  totalOiv: number; // Toplam ÖİV
  totalAccommodationTax: number; // Toplam Konaklama Vergisi
  totalStopaj: number; // Toplam Stopaj
  totalStampTax: number; // Toplam Damga Vergisi
  totalAdditionalTaxesAdditions: number; // Diğer İlave Ek Vergiler Toplamı
  totalAdditionalTaxesDeductions: number; // Diğer Kesinti/Stopaj Ek Vergiler Toplamı
  totalExtraTaxes: number; // Toplam İlave Ek Vergiler (ÖTV + ÖİV + Damga + İlave ek vergiler)
  grandTotal: number; // Fatura Toplamı (Mal Bedeli + Toplam KDV + İlave Ek Vergiler)
  payableAmount: number; // 🎯 Ödenecek / Tahsil Edilecek Net Tutar (grandTotal - totalWithholding - totalStopaj - totalAdditionalTaxesDeductions)
  taxItems: InvoiceTaxItem[]; // Fatura vergi dökümü (GİB Listesine göre)
  computedItems: ComputedInvoiceItem[];
}

/**
 * Tek bir fatura kalemi için vergi, ek vergi ve matrah hesaplaması
 */
export function computeInvoiceItem(item: InvoiceItem): ComputedInvoiceItem {
  const qty = Number(item.quantity) || 0;
  const unitPrice = Number(item.unitPrice) || 0;
  const grossAmount = qty * unitPrice;

  let discountRate = Number(item.discountRate) || 0;
  let discountAmount = Number(item.discountAmount) || 0;

  if (discountAmount > 0 && (!item.discountRate || item.discountRate === 0) && grossAmount > 0) {
    discountRate = (discountAmount / grossAmount) * 100;
  } else if (discountRate > 0 && (!item.discountAmount || item.discountAmount === 0)) {
    discountAmount = (grossAmount * discountRate) / 100;
  }

  discountAmount = Math.min(grossAmount, Math.max(0, discountAmount));
  discountRate = Math.min(100, Math.max(0, discountRate));

  const rawLineTotal = Math.max(0, grossAmount - discountAmount);
  const vatRate = Number(item.vatRate) || 0;

  // 1. Özel Matrah Kontrolü
  let effectiveTaxableAmount = rawLineTotal;
  if (item.specialTaxBase !== undefined && item.specialTaxBase !== null && item.specialTaxBase >= 0) {
    effectiveTaxableAmount = Number(item.specialTaxBase);
  }

  // 2. KDV Hesaplaması
  const calculatedVatAmount = (effectiveTaxableAmount * vatRate) / 100;

  // 3. Tevkifat Hesaplaması
  let withholdingAmount = 0;
  let withholdingPercentage = 0;

  if (item.withholdingRateNumerator && item.withholdingRateDenominator && item.withholdingRateDenominator > 0) {
    withholdingPercentage = item.withholdingRateNumerator / item.withholdingRateDenominator;
    withholdingAmount = calculatedVatAmount * withholdingPercentage;
  } else if (item.withholdingRate && item.withholdingRate > 0) {
    withholdingPercentage = item.withholdingRate;
    withholdingAmount = calculatedVatAmount * withholdingPercentage;
  } else if (item.withholdingCode) {
    const info = getWithholdingCodeInfo(item.withholdingCode);
    if (info) {
      withholdingPercentage = info.numerator / info.denominator;
      withholdingAmount = calculatedVatAmount * withholdingPercentage;
    }
  }

  const payableVatAmount = Math.max(0, calculatedVatAmount - withholdingAmount);

  // 4. Ek Vergiler Hesaplaması (GİB Kod Listesine Göre)
  let additionalTaxesAdditions = 0;
  let additionalTaxesDeductions = 0;

  let computedAdditionalTaxes: ItemAdditionalTax[] | undefined = undefined;
  if (item.additionalTaxes && Array.isArray(item.additionalTaxes)) {
    computedAdditionalTaxes = item.additionalTaxes.map((tax) => {
      const info = getAdditionalTaxCodeInfo(tax.code);
      const isDeduction =
        tax.isDeduction !== undefined
          ? tax.isDeduction
          : info?.isDeduction ?? false;

      let calcAmount = 0;
      if (tax.calculationType === "fixed") {
        calcAmount = Number(tax.amount) || 0;
      } else {
        const rate = Number(tax.rate) || 0;
        calcAmount = (effectiveTaxableAmount * rate) / 100;
      }

      if (isDeduction) {
        additionalTaxesDeductions += calcAmount;
      } else {
        additionalTaxesAdditions += calcAmount;
      }

      return {
        ...tax,
        amount: calcAmount,
        isDeduction,
      };
    });
  }

  // Geriye dönük uyumluluk: Eğer ek vergiler dizisi yoksa veya eski alanlar varsa
  let otvAmount = item.otvAmount || 0;
  if (item.otvRate && item.otvRate > 0 && !otvAmount) {
    otvAmount = (effectiveTaxableAmount * item.otvRate) / 100;
  }

  let oivAmount = item.oivAmount || 0;
  if (item.oivRate && item.oivRate > 0 && !oivAmount) {
    oivAmount = (effectiveTaxableAmount * item.oivRate) / 100;
  }

  let accommodationTaxAmount = item.accommodationTaxAmount || 0;
  if (item.accommodationTaxRate && item.accommodationTaxRate > 0 && !accommodationTaxAmount) {
    accommodationTaxAmount = (effectiveTaxableAmount * item.accommodationTaxRate) / 100;
  }

  let stopajAmount = item.stopajAmount || 0;
  if (item.stopajRate && item.stopajRate > 0 && !stopajAmount) {
    stopajAmount = (effectiveTaxableAmount * item.stopajRate) / 100;
  }

  // Eğer ek vergiler dizisinden hesaplanmamışsa legacy alanları da ilave/kesintiye kat
  if (!computedAdditionalTaxes || computedAdditionalTaxes.length === 0) {
    additionalTaxesAdditions += otvAmount + oivAmount + accommodationTaxAmount;
    additionalTaxesDeductions += stopajAmount;
  }

  const lineGrandTotal = rawLineTotal + calculatedVatAmount + additionalTaxesAdditions;

  return {
    ...item,
    quantity: qty,
    unitPrice,
    grossAmount,
    discountAmount,
    discountRate,
    totalWithoutVat: rawLineTotal,
    vatRate,
    vatAmount: calculatedVatAmount,
    totalWithVat: lineGrandTotal,
    effectiveTaxableAmount,
    calculatedVatAmount,
    withholdingAmount,
    payableVatAmount,
    lineGrandTotal,
    otvAmount,
    oivAmount,
    accommodationTaxAmount,
    stopajAmount,
    additionalTaxes: computedAdditionalTaxes || item.additionalTaxes,
    additionalTaxesAdditions,
    additionalTaxesDeductions,
  };
}

/**
 * Faturanın tüm kalemleri ve dip toplamlarının eksiksiz hesaplanması
 */
export function computeInvoiceTotals(items: InvoiceItem[] = []): ComputedInvoiceTotals {
  let grossTotal = 0;
  let totalDiscount = 0;
  let subtotal = 0;
  let effectiveTaxableAmount = 0;
  let totalVat = 0;
  let totalWithholding = 0;
  let payableVat = 0;
  let totalOtv = 0;
  let totalOiv = 0;
  let totalAccommodationTax = 0;
  let totalStopaj = 0;
  let totalStampTax = 0;
  let totalAdditionalTaxesAdditions = 0;
  let totalAdditionalTaxesDeductions = 0;

  const vatBreakdownMap = new Map<number, { taxable: number; vat: number; withholding: number }>();
  // Ek vergileri koda ve isme göre toplamak için harita
  const additionalTaxMap = new Map<
    string,
    {
      code: string;
      name: string;
      rate?: number;
      taxableAmount: number;
      taxAmount: number;
      isDeduction?: boolean;
    }
  >();

  const computedItems: ComputedInvoiceItem[] = items.map((rawItem) => {
    const comp = computeInvoiceItem(rawItem);

    grossTotal += comp.grossAmount;
    totalDiscount += comp.discountAmount;
    subtotal += comp.totalWithoutVat;
    effectiveTaxableAmount += comp.effectiveTaxableAmount;
    totalVat += comp.calculatedVatAmount;
    totalWithholding += comp.withholdingAmount;
    payableVat += comp.payableVatAmount;

    totalAdditionalTaxesAdditions += comp.additionalTaxesAdditions;
    totalAdditionalTaxesDeductions += comp.additionalTaxesDeductions;

    // Ek vergileri haritaya ekle
    if (comp.additionalTaxes && comp.additionalTaxes.length > 0) {
      comp.additionalTaxes.forEach((tax) => {
        const key = `${tax.code}_${tax.rate || 0}_${tax.isDeduction ? "deduct" : "add"}`;
        const existing = additionalTaxMap.get(key) || {
          code: tax.code,
          name: tax.name,
          rate: tax.rate,
          taxableAmount: 0,
          taxAmount: 0,
          isDeduction: tax.isDeduction,
        };
        existing.taxableAmount += comp.effectiveTaxableAmount;
        existing.taxAmount += tax.amount;
        additionalTaxMap.set(key, existing);

        // Kategori toplamlarına da yansıt
        if (tax.code.startsWith("007") || tax.code === "9077") {
          totalOtv += tax.amount;
        } else if (tax.code === "4080" || tax.code === "4081") {
          totalOiv += tax.amount;
        } else if (tax.code === "0059") {
          totalAccommodationTax += tax.amount;
        } else if (tax.code === "0003" || tax.code === "0011") {
          totalStopaj += tax.amount;
        } else if (tax.code === "1047" || tax.code === "1048") {
          totalStampTax += tax.amount;
        }
      });
    } else {
      // Legacy alanlar
      if (comp.otvAmount) totalOtv += Number(comp.otvAmount);
      if (comp.oivAmount) totalOiv += Number(comp.oivAmount);
      if (comp.accommodationTaxAmount) totalAccommodationTax += Number(comp.accommodationTaxAmount);
      if (comp.stopajAmount) totalStopaj += Number(comp.stopajAmount);
    }

    // KDV oran kırılımı
    const rate = comp.vatRate;
    const existing = vatBreakdownMap.get(rate) || { taxable: 0, vat: 0, withholding: 0 };
    existing.taxable += comp.effectiveTaxableAmount;
    existing.vat += comp.calculatedVatAmount;
    existing.withholding += comp.withholdingAmount;
    vatBreakdownMap.set(rate, existing);

    return comp;
  });

  // Genel Toplam: Mal Bedeli + Toplam KDV + İlave Ek Vergiler
  const grandTotal = subtotal + totalVat + totalAdditionalTaxesAdditions;

  // Ödenecek / Tahsil Edilecek Tutar: grandTotal - Tevkif Edilen KDV - Stopajlar ve Kesintiler
  const payableAmount = Math.max(
    0,
    grandTotal - totalWithholding - totalAdditionalTaxesDeductions
  );

  // Vergi Dökümü Kalemleri Listesi
  const taxItems: InvoiceTaxItem[] = [];

  // 1. KDV Kalemleri
  Array.from(vatBreakdownMap.entries()).forEach(([rate, data]) => {
    if (data.taxable > 0 || data.vat > 0) {
      taxItems.push({
        taxType: "KDV",
        taxTypeCode: "0015",
        taxName: "KDV (%" + rate + ")",
        rate,
        taxRate: rate,
        taxableAmount: data.taxable,
        taxAmount: data.vat,
        isDeduction: false,
      });
    }
  });

  // 2. Tevkifat Kalemi
  if (totalWithholding > 0) {
    taxItems.push({
      taxType: "KDV Tevkifatı",
      taxTypeCode: "9015",
      taxName: "KDV Tevkifatı",
      taxAmount: totalWithholding,
      taxableAmount: effectiveTaxableAmount,
      isDeduction: true,
    });
  }

  // 3. Ek Vergiler (GİB Listesinden Toplananlar)
  if (additionalTaxMap.size > 0) {
    Array.from(additionalTaxMap.values()).forEach((at) => {
      if (at.taxAmount > 0) {
        taxItems.push({
          taxType: at.name,
          taxTypeCode: at.code,
          taxName: at.rate ? `${at.name} (%${at.rate})` : at.name,
          rate: at.rate,
          taxRate: at.rate,
          taxableAmount: at.taxableAmount,
          taxAmount: at.taxAmount,
          isDeduction: at.isDeduction,
        });
      }
    });
  } else {
    // Legacy fallback
    if (totalOtv > 0) {
      taxItems.push({
        taxType: "ÖTV",
        taxTypeCode: "0074",
        taxName: "Özel Tüketim Vergisi",
        taxAmount: totalOtv,
        taxableAmount: subtotal,
        isDeduction: false,
      });
    }
    if (totalOiv > 0) {
      taxItems.push({
        taxType: "ÖİV",
        taxTypeCode: "4080",
        taxName: "Özel İletişim Vergisi",
        taxAmount: totalOiv,
        taxableAmount: subtotal,
        isDeduction: false,
      });
    }
    if (totalAccommodationTax > 0) {
      taxItems.push({
        taxType: "Konaklama Vergisi",
        taxTypeCode: "0059",
        taxName: "Konaklama Vergisi (%2)",
        rate: 2,
        taxAmount: totalAccommodationTax,
        taxableAmount: subtotal,
        isDeduction: false,
      });
    }
    if (totalStopaj > 0) {
      taxItems.push({
        taxType: "Stopaj",
        taxTypeCode: "0003",
        taxName: "Gelir Stopajı",
        taxAmount: totalStopaj,
        taxableAmount: subtotal,
        isDeduction: true,
      });
    }
  }

  return {
    grossTotal,
    totalDiscount,
    subtotal,
    effectiveTaxableAmount,
    totalVat,
    totalWithholding,
    payableVat,
    totalOtv,
    totalOiv,
    totalAccommodationTax,
    totalStopaj,
    totalStampTax,
    totalAdditionalTaxesAdditions,
    totalAdditionalTaxesDeductions,
    totalExtraTaxes: totalAdditionalTaxesAdditions,
    grandTotal,
    payableAmount,
    taxItems,
    computedItems,
  };
}

/**
 * Tevkifat Oranı Etiketi formatlayıcı (örn: 5/10 (618))
 */
export function formatWithholdingBadge(item: InvoiceItem): string | null {
  if (item.withholdingRateNumerator && item.withholdingRateDenominator) {
    const code = item.withholdingCode ? " (" + item.withholdingCode + ")" : "";
    return item.withholdingRateNumerator + "/" + item.withholdingRateDenominator + code;
  }
  if (item.withholdingRate && item.withholdingRate > 0) {
    const numerator = Math.round(item.withholdingRate * 10);
    return numerator + "/10";
  }
  if (item.withholdingCode) {
    const info = getWithholdingCodeInfo(item.withholdingCode);
    return info ? info.rateLabel + " (" + info.code + ")" : "Kod: " + item.withholdingCode;
  }
  return null;
}

/**
 * Fatura altı resmi yasal notlarını oluşturur:
 * - Tevkifat varsa: Kod, oran ve açıklaması
 * - Özel Matrah varsa: Kod, gerekçe ve matrah açıklaması
 * - İstisna varsa: İstisna kodu, kanun maddesi ve açıklaması
 * - İhraç kayıtlı ise: 3065 SK. 11/1-c resmi tecil/terkin şerh metni
 */
export function generateInvoiceLegalTaxNotes(
  items: InvoiceItem[],
  invoiceProfileType?: InvoiceProfileType,
  currency: string = "₺"
): string[] {
  const notes: string[] = [];

  // 1. Tevkifat Kontrolü
  const withholdingItems = items.filter(
    (i) => i.withholdingCode || (i.withholdingRate && i.withholdingRate > 0)
  );
  if (withholdingItems.length > 0 || invoiceProfileType === "TEVKIFAT") {
    const codeMap = new Map<
      string,
      { numerator: number; denominator: number; withholdingTotal: number; itemsCount: number }
    >();

    withholdingItems.forEach((it) => {
      const comp = computeInvoiceItem(it);
      const code = it.withholdingCode || "699";
      const num =
        it.withholdingRateNumerator ||
        (it.withholdingRate ? Math.round(it.withholdingRate * 10) : 5);
      const den = it.withholdingRateDenominator || 10;
      const cur = codeMap.get(code) || {
        numerator: num,
        denominator: den,
        withholdingTotal: 0,
        itemsCount: 0,
      };
      cur.withholdingTotal += comp.withholdingAmount;
      cur.itemsCount += 1;
      codeMap.set(code, cur);
    });

    if (codeMap.size > 0) {
      codeMap.forEach((val, code) => {
        const info = getWithholdingCodeInfo(code);
        const nameStr = info ? ` [${info.code} - ${info.name}]` : ` [Kod: ${code}]`;
        const amountStr =
          val.withholdingTotal > 0
            ? ` (Tevkif Edilen KDV: ${val.withholdingTotal.toLocaleString("tr-TR", {
                minimumFractionDigits: 2,
              })} ${currency})`
            : "";
        notes.push(
          `KDV Tevkifatı: 3065 sayılı KDV Kanunu uyarınca ${val.numerator}/${val.denominator} oranında KDV Tevkifatı uygulanmıştır.${nameStr}${amountStr}`
        );
      });
    } else {
      notes.push("KDV Tevkifatı: 3065 sayılı KDV Kanunu ve ilgili tebliğler uyarınca KDV Tevkifatı uygulanmıştır.");
    }
  }

  // 2. Özel Matrah Kontrolü
  const specialBaseItems = items.filter(
    (i) => i.specialTaxBaseCode || (i.specialTaxBase !== undefined && i.specialTaxBase !== null)
  );
  if (specialBaseItems.length > 0 || invoiceProfileType === "OZELMATRAH") {
    const codeSet = new Set<string>();
    specialBaseItems.forEach((it) => {
      if (it.specialTaxBaseCode) codeSet.add(it.specialTaxBaseCode);
    });

    if (codeSet.size > 0) {
      codeSet.forEach((code) => {
        const info = getSpecialTaxBaseCodeInfo(code);
        const law = info?.lawArticle ? ` (${info.lawArticle})` : "";
        notes.push(
          `Özel Matrah: 3065 sayılı KDV Kanunu'nun 23. maddesi uyarınca Özel Matrah uygulanmıştır. Kod: ${code} - ${info?.name || "Özel Matrah Şekli"}${law}. KDV yalnızca kâr marjı / matrah farkı üzerinden hesaplanmıştır.`
        );
      });
    } else {
      notes.push(
        "Özel Matrah: 3065 sayılı KDV Kanunu'nun 23. maddesi uyarınca Özel Matrah uygulanmıştır. KDV yalnızca kâr marjı / matrah farkı üzerinden hesaplanmıştır."
      );
    }
  }

  // 3. KDV İstisnası Kontrolü
  const exemptionItems = items.filter(
    (i) => i.exemptionCode || i.vatRate === 0 || i.exemptionReason
  );
  if (exemptionItems.length > 0 || invoiceProfileType === "ISTISNA") {
    const seenCodes = new Set<string>();
    exemptionItems.forEach((it) => {
      const code = it.exemptionCode;
      if (code && !seenCodes.has(code)) {
        seenCodes.add(code);
        const info = getExemptionCodeInfo(code);
        const reason = it.exemptionReason || info?.name || "KDV'den İstisna Teslim";
        const law = info?.lawArticle ? ` (${info.lawArticle})` : "";
        notes.push(
          `KDV İstisnası: 3065 sayılı KDV Kanunu uyarınca %0 KDV uygulanmıştır. İstisna Kodu: ${code} - ${reason}${law}`
        );
      }
    });
    if (seenCodes.size === 0 && invoiceProfileType === "ISTISNA") {
      notes.push("KDV İstisnası: 3065 sayılı KDV Kanunu uyarınca KDV'den istisna (%0 KDV) olarak düzenlenmiştir.");
    }
  }

  // 4. İhraç Kayıtlı Teslim Kontrolü
  if (invoiceProfileType === "IHRACKAYITLI") {
    notes.push(
      "İhraç Kayıtlı Teslim: 3065 sayılı KDV Kanunu'nun 11/1-c maddesi hükümlerine göre ihraç edilmek şartıyla teslim edildiğinden KDV tahsil edilmemiştir. İmalatçı tarafından ihraç kayıtlı teslim edilen mallara ait KDV tecil ve terkin işlemlerine tabidir."
    );
  }

  return notes;
}
