// GİB ve Mysoft Uyumlu Fatura Vergi, Tevkifat, Özel Matrah ve Dip Toplam Hesaplama Servisi

import { InvoiceItem, InvoiceTaxItem } from "../types";
import {
  getWithholdingCodeInfo,
} from "../data/gibTaxCodes";

export interface ComputedInvoiceItem extends InvoiceItem {
  effectiveTaxableAmount: number; // KDV'ye tabi asıl matrah (Özel matrah varsa kâr marjı)
  calculatedVatAmount: number; // Hesaplanan KDV tutarı
  withholdingAmount: number; // Tevkif edilen KDV tutarı
  payableVatAmount: number; // Satıcıya ödenecek net KDV tutarı (Hesaplanan KDV - Tevkif Edilen KDV)
  lineGrandTotal: number; // Satır Mal Bedeli + Satıcıya Ödenecek KDV
}

export interface ComputedInvoiceTotals {
  subtotal: number; // Toplam Mal/Hizmet Bedeli (KDV Hariç)
  effectiveTaxableAmount: number; // Toplam KDV Matrahı (Özel matrah kâr marjı toplamı)
  totalVat: number; // Toplam Hesaplanan KDV
  totalWithholding: number; // (-) Toplam Tevkif Edilen KDV (Alıcının KDV2 ile ödeyeceği)
  payableVat: number; // Toplam Tahsil Edilecek KDV
  totalOtv: number; // Toplam ÖTV
  totalOiv: number; // Toplam ÖİV
  totalAccommodationTax: number; // Toplam Konaklama Vergisi
  totalStopaj: number; // Toplam Stopaj
  totalStampTax: number; // Toplam Damga Vergisi
  grandTotal: number; // Fatura Toplamı (Mal Bedeli + Toplam KDV + Ek Vergiler)
  payableAmount: number; // 🎯 Ödenecek / Tahsil Edilecek Net Tutar (grandTotal - totalWithholding - totalStopaj)
  taxItems: InvoiceTaxItem[]; // Fatura vergi dökümü
  computedItems: ComputedInvoiceItem[];
}

/**
 * Tek bir fatura kalemi için vergi ve matrah hesaplaması
 */
export function computeInvoiceItem(item: InvoiceItem): ComputedInvoiceItem {
  const qty = Number(item.quantity) || 0;
  const unitPrice = Number(item.unitPrice) || 0;
  const rawLineTotal = Number(item.totalWithoutVat) || qty * unitPrice;
  const vatRate = Number(item.vatRate) || 0;

  // 1. Özel Matrah Kontrolü
  // Eğer özel matrah varsa (örn: 2. el araçta 100.000 TL kâr marjı), KDV sadece bu kâr marjı üzerinden hesaplanır.
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
  const lineGrandTotal = rawLineTotal + calculatedVatAmount;

  return {
    ...item,
    quantity: qty,
    unitPrice,
    totalWithoutVat: rawLineTotal,
    vatRate,
    vatAmount: calculatedVatAmount,
    totalWithVat: lineGrandTotal,
    effectiveTaxableAmount,
    calculatedVatAmount,
    withholdingAmount,
    payableVatAmount,
    lineGrandTotal,
  };
}

/**
 * Faturanın tüm kalemleri ve dip toplamlarının eksiksiz hesaplanması
 */
export function computeInvoiceTotals(items: InvoiceItem[] = []): ComputedInvoiceTotals {
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

  const vatBreakdownMap = new Map<number, { taxable: number; vat: number; withholding: number }>();

  const computedItems: ComputedInvoiceItem[] = items.map((rawItem) => {
    const comp = computeInvoiceItem(rawItem);

    subtotal += comp.totalWithoutVat;
    effectiveTaxableAmount += comp.effectiveTaxableAmount;
    totalVat += comp.calculatedVatAmount;
    totalWithholding += comp.withholdingAmount;
    payableVat += comp.payableVatAmount;

    // Ek vergiler
    if (comp.otvAmount) totalOtv += Number(comp.otvAmount);
    if (comp.oivAmount) totalOiv += Number(comp.oivAmount);
    if (comp.accommodationTaxAmount) totalAccommodationTax += Number(comp.accommodationTaxAmount);
    if (comp.stopajAmount) totalStopaj += Number(comp.stopajAmount);

    // KDV oran kırılımı
    const rate = comp.vatRate;
    const existing = vatBreakdownMap.get(rate) || { taxable: 0, vat: 0, withholding: 0 };
    existing.taxable += comp.effectiveTaxableAmount;
    existing.vat += comp.calculatedVatAmount;
    existing.withholding += comp.withholdingAmount;
    vatBreakdownMap.set(rate, existing);

    return comp;
  });

  // Genel Toplam: Mal Bedeli + Toplam KDV + Ek Vergiler
  const grandTotal = subtotal + totalVat + totalOtv + totalOiv + totalAccommodationTax + totalStampTax;

  // Ödenecek / Tahsil Edilecek Tutar: grandTotal - Tevkif Edilen KDV - Stopaj
  const payableAmount = Math.max(0, grandTotal - totalWithholding - totalStopaj);

  // Vergi Dökümü Kalemleri Listesi
  const taxItems: InvoiceTaxItem[] = [];

  // KDV Kalemleri
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
      });
    }
  });

  // Tevkifat Kalemi
  if (totalWithholding > 0) {
    taxItems.push({
      taxType: "KDV Tevkifatı",
      taxTypeCode: "9015",
      taxName: "KDV Tevkifatı",
      taxAmount: totalWithholding,
      taxableAmount: effectiveTaxableAmount,
    });
  }

  // ÖTV Kalemi
  if (totalOtv > 0) {
    taxItems.push({
      taxType: "ÖTV",
      taxTypeCode: "0076",
      taxName: "Özel Tüketim Vergisi",
      taxAmount: totalOtv,
      taxableAmount: subtotal,
    });
  }

  // Konaklama Vergisi
  if (totalAccommodationTax > 0) {
    taxItems.push({
      taxType: "Konaklama Vergisi",
      taxTypeCode: "0059",
      taxName: "Konaklama Vergisi (%2)",
      rate: 2,
      taxAmount: totalAccommodationTax,
      taxableAmount: subtotal,
    });
  }

  // Stopaj
  if (totalStopaj > 0) {
    taxItems.push({
      taxType: "Stopaj",
      taxTypeCode: "0003",
      taxName: "Gelir Stopajı",
      taxAmount: totalStopaj,
      taxableAmount: subtotal,
    });
  }

  return {
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
