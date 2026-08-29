import {
  Invoice,
  Quote,
  Order,
  Waybill,
  PayrollRecord,
  Employee,
  AssetCustody,
  Transaction,
  ETebligatItem,
  CompanySettings,
  Contact,
  Product,
} from "../types";
import { formatCurrency, formatDate } from "./exportUtils";

export function formatInvoiceWhatsAppMessage(
  invoice: Partial<Invoice>,
  companySettings?: CompanySettings | null,
  contact?: Contact | null
): string {
  const companyName = companySettings?.companyTitle || companySettings?.companyName || "Şirketimiz";
  const contactName = contact?.name || invoice.contactName || "Sayın Müşterimiz";
  const invNumber = invoice.invoiceNumber || "Fatura";
  const invDate = formatDate(invoice.issueDate || new Date());
  const invDueDate = invoice.dueDate ? formatDate(invoice.dueDate) : "Peşin / Vadesiz";
  const grandTotal = formatCurrency(invoice.grandTotal || 0, invoice.currency || "TRY");
  const remaining = formatCurrency(invoice.remainingAmount ?? invoice.grandTotal ?? 0, invoice.currency || "TRY");

  return `Sayın *${contactName}*,\n\n*${companyName}* tarafından düzenlenen *${invNumber}* numaralı e-Belgeniz / Faturanız ekte bilgilerinize sunulmuştur.\n\n💰 *Genel Toplam:* ${grandTotal}\n📅 *Fatura Tarihi:* ${invDate}\n⏳ *Son Ödeme / Vade:* ${invDueDate}\n💵 *Kalan Açık Bakiye:* ${remaining}\n\n📄 Fatura belgesi bu mesaj ile birlikte PDF olarak iletilmiştir.\nİyi çalışmalar dileriz.`;
}

export function formatQuoteWhatsAppMessage(
  quote: Quote,
  companySettings?: CompanySettings | null,
  contact?: Contact | null
): string {
  const companyName = companySettings?.companyTitle || companySettings?.companyName || "Şirketimiz";
  const contactName = contact?.name || quote.contactName || "Sayın Müşterimiz";
  const quoteNo = quote.quoteNumber || "TEK-2026";
  const quoteDate = formatDate(quote.issueDate);
  const validUntil = quote.validUntil ? formatDate(quote.validUntil) : "15 Gün";
  const grandTotal = formatCurrency(quote.grandTotal, quote.currency || "TRY");

  return `Sayın *${contactName}*,\n\n*${companyName}* tarafından firmanıza özel hazırlanan *${quoteNo}* numaralı Fiyat Teklifi / Proforma Faturamız ekte yer almaktadır.\n\n💼 *Teklif Tutarı:* ${grandTotal}\n📅 *Düzenlenme Tarihi:* ${quoteDate}\n⏳ *Geçerlilik Tarihi:* ${validUntil}\n\nTeklifi onaylamak veya siparişe dönüştürmek için lütfen bu mesaja *ONAY* yazarak yanıtlayınız.\nİyi çalışmalar dileriz.`;
}

export function formatOrderWhatsAppMessage(
  order: Order,
  companySettings?: CompanySettings | null,
  contact?: Contact | null
): string {
  const companyName = companySettings?.companyTitle || companySettings?.companyName || "Şirketimiz";
  const contactName = contact?.name || order.contactName || "Sayın İlgili";
  const orderNo = order.orderNumber || "SIP-2026";
  const orderType = order.type === "sales" ? "Satış Siparişi" : "Satın Alma Siparişi";
  const orderDate = formatDate(order.orderDate);
  const deliveryDate = order.deliveryDate ? formatDate(order.deliveryDate) : "En Kısa Sürede";
  const grandTotal = formatCurrency(order.grandTotal, order.currency || "TRY");
  const warehouse = order.warehouseName ? ` (${order.warehouseName})` : "";

  return `Sayın *${contactName}*,\n\n*${companyName}* bünyesinde oluşturulan *${orderNo}* numaralı *${orderType}* kaydınız alınmıştır.\n\n📦 *Sipariş Tutarı:* ${grandTotal}\n📅 *Sipariş Tarihi:* ${orderDate}\n🚚 *Tahmini Teslimat:* ${deliveryDate}${warehouse}\n\nSipariş formunuz ekte PDF olarak iletilmiştir.\nİyi çalışmalar dileriz.`;
}

export function formatWaybillWhatsAppMessage(
  waybill: Waybill,
  companySettings?: CompanySettings | null,
  contact?: Contact | null
): string {
  const companyName = companySettings?.companyTitle || companySettings?.companyName || "Şirketimiz";
  const contactName = contact?.name || waybill.contactName || "Sayın Müşterimiz";
  const waybillNo = waybill.waybillNumber || "IRS-2026";
  const shipDate = formatDate(waybill.dispatchDate || waybill.waybillDate);
  const driver = waybill.driverName ? `*${waybill.driverName}*` : "Şirket Sevkiyat Aracı";
  const plate = waybill.vehiclePlate ? ` (${waybill.vehiclePlate})` : "";

  return `Sayın *${contactName}*,\n\n*${companyName}* tarafından hazırlanan *${waybillNo}* numaralı Sevk İrsaliyesi düzenlenmiş ve ürünleriniz yola çıkmıştır.\n\n🚚 *Taşıyıcı / Şoför:* ${driver}${plate}\n📅 *Sevk Tarihi:* ${shipDate}\n📦 *Kalem Sayısı:* ${waybill.items?.length || 1} Kalem\n\nResmi Sevk İrsaliyesi belgeniz ekte PDF olarak yer almaktadır.\nİyi çalışmalar dileriz.`;
}

export function formatPayrollWhatsAppMessage(
  payroll: Partial<PayrollRecord> | null | undefined,
  employee: Employee,
  companySettings?: CompanySettings | null
): string {
  const companyName = companySettings?.companyTitle || companySettings?.companyName || "Şirketimiz";
  const donem = payroll?.monthYear || "Cari Ay";
  const netPayable = formatCurrency(payroll?.netSalary || payroll?.grossSalary || employee.salaryAmount || 0, "TRY");
  const gross = formatCurrency(payroll?.grossSalary || employee.salaryAmount || 0, "TRY");

  return `Sayın *${employee.fullName}* (T.C.: ${employee.tckn}),\n\n*${companyName}* bünyesindeki *${donem}* dönemine ait Resmi Maaş Bordronuz (Ücret Hesap Pusulası - 4857 S.K. Md. 37) düzenlenmiştir.\n\n💵 *Net Ele Geçen Maaş:* ${netPayable}\n📊 *Brüt Ücret:* ${gross}\n\nMaaş bordronuz ekte şifresiz PDF olarak iletilmiştir. Lütfen inceleyiniz.\nİyi çalışmalar dileriz.`;
}

export function formatCustodyWhatsAppMessage(
  asset: AssetCustody,
  employee?: Employee | null,
  companySettings?: CompanySettings | null,
  isReturn: boolean = false
): string {
  const companyName = companySettings?.companyTitle || companySettings?.companyName || "Şirketimiz";
  const empName = employee?.fullName || asset.employeeName || "Personelimiz";
  const docType = isReturn ? "Zimmet İade ve İbra Tutanağı" : "Zimmet Teslim ve Tesellüm Tutanağı";
  const code = asset.barcodeNumber || asset.id;
  const name = asset.assetName;
  const serial = asset.serialNumber || asset.vehicleDetails?.plateNumber || asset.barcodeNumber || "Kayıtlı";

  return `Sayın *${empName}*,\n\n*${companyName}* tarafından adınıza tanzim edilen *${code}* numaralı *${docType}* ekte bilgilerinize sunulmuştur.\n\n💻 *Demirbaş:* ${name}\n🏷️ *Seri No / Plaka:* ${serial}\n📅 *Tarih:* ${formatDate(new Date())}\n\nİlgili resmi tutanak PDF eki olarak bu mesaja eklenmiştir.\nİyi çalışmalar dileriz.`;
}

export function formatTransactionWhatsAppMessage(
  tx: Transaction,
  companySettings?: CompanySettings | null,
  contact?: Contact | null
): string {
  const companyName = companySettings?.companyTitle || companySettings?.companyName || "Şirketimiz";
  const contactName = contact?.name || tx.contactName || "Sayın İlgili";
  const docNo = tx.documentNo || "MAKBUZ";
  const typeLabel =
    tx.type === "collection"
      ? "Tahsilat Makbuzu"
      : tx.type === "payment"
      ? "Tediye / Ödeme Makbuzu"
      : tx.type === "income"
      ? "Gelir Fişi"
      : "Gider Fişi";
  const amount = formatCurrency(tx.amount, tx.currency || "TRY");

  return `Sayın *${contactName}*,\n\n*${companyName}* mali kayıtlarında gerçekleştirilen *${docNo}* numaralı *${typeLabel}* düzenlenmiştir.\n\n💵 *İşlem Tutarı:* ${amount}\n📅 *İşlem Tarihi:* ${formatDate(tx.date)}\n🏛️ *Hesap / Kasa:* ${tx.accountName}\n📝 *Açıklama:* ${tx.description}\n\nİşlem dekontunuz ekte yer almaktadır.\nİyi çalışmalar dileriz.`;
}

export function formatETebligatWhatsAppMessage(
  tebligat: ETebligatItem,
  companySettings?: CompanySettings | null
): string {
  const companyName = companySettings?.companyTitle || companySettings?.companyName || "Şirketimiz";
  const daysLeft = tebligat.legalDeadlineDate
    ? Math.max(0, Math.ceil((new Date(tebligat.legalDeadlineDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 30;

  return `⚠️ *ACİL: Resmi Elektronik Tebligat Bildirimi*\n\nSayın Şirket Yetkilisi,\n*${companyName}* tüzel kişiliği adına *${tebligat.authority} (${tebligat.senderUnit})* tarafından yeni bir elektronik tebligat düzenlenmiştir.\n\n📄 *Belge Başlığı:* ${tebligat.documentTitle}\n📌 *Barkod No:* ${tebligat.barcodeNumber}\n📅 *Tebellüğ Tarihi:* ${formatDate(tebligat.deliveryDate || tebligat.sentDate)}\n⏳ *Kalan Yasal İtiraz Süresi:* ${daysLeft} Gün\n\nResmi mazbata ve tebligat ayrıntılarını lütfen yasal hak düşürücü süre geçmeden inceleyiniz.`;
}

export function formatProductWhatsAppMessage(
  product: Product,
  companySettings?: CompanySettings | null
): string {
  const companyName = companySettings?.companyTitle || companySettings?.companyName || "Şirketimiz";
  const price = formatCurrency(product.sellPrice || 0, "TRY");
  const vatPrice = formatCurrency((product.sellPrice || 0) * (1 + (product.vatRate ?? 20) / 100), "TRY");

  return `Sayın Müşterimiz,\n\n*${companyName}* ürün kataloğumuzdaki *${product.name}* (Kod: ${product.code}) hakkında bilgiler aşağıdadır:\n\n📦 *Ürün:* ${product.name}\n💰 *Fiyat:* ${price} + KDV (${vatPrice} KDV Dahil)\n📊 *Mevcut Stok:* ${product.stockQuantity} ${product.unit || "Adet"}\n\nSipariş vermek için lütfen bu mesaja dönüş yapınız.`;
}
