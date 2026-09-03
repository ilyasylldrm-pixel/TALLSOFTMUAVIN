import { getProvincePlateCode } from "./data/locationAndTaxData";

export type ContactType = "customer" | "vendor" | "supplier" | "both";

export interface Contact {
  id: string;
  accountCode?: string; // Cari Hesap Kodu (Alıcılar: 120.İL_KODU.VKN/TCKN, Satıcılar: 320.İL_KODU.VKN/TCKN)
  name: string; // Kısa Unvan / İsim veya Şahıs/Şirket Adı
  companyTitle?: string; // Resmi Ticari Şirket Unvanı
  companyName?: string; // Alias for companyTitle
  contactType: ContactType;
  type?: ContactType; // Alias for contactType
  taxOffice?: string; // Vergi Dairesi
  taxNumber?: string; // VKN / TCKN
  contactPerson?: string; // İlgili Kişi (Yetkili / İrtibat Kişisi)
  phone?: string;
  mobile?: string; // Alias for phone
  email?: string;
  address?: string;
  shippingAddress?: string; // Sevkiyat / Depo / Teslimat Adresi
  city?: string;
  district?: string; // İlçe
  neighborhood?: string; // Mahalle
  street?: string; // Cadde / Sokak
  buildingNo?: string;
  postalCode?: string;
  addressDetails?: AddressDetails;
  balance: number; // Pozitif: Alacaklıyız (Müşteri bize borçlu), Negatif: Borçluyuz (Tedarikçiye borcumuz var)
  balanceType: "receivable" | "payable" | "balanced";
  notes?: string;
  createdAt: string;
}

export function getContactAccountCode(contact: Partial<Contact>): string {
  if (contact.accountCode && contact.accountCode.trim()) {
    return contact.accountCode.trim();
  }
  const prefix = contact.contactType === "vendor" || contact.contactType === "supplier" ? "320" : "120";
  const city = contact.city || (contact.addressDetails && contact.addressDetails.city) || "İstanbul";
  const plateCode = getProvincePlateCode(city);
  const taxNum = contact.taxNumber && contact.taxNumber.trim() ? contact.taxNumber.trim() : "0000000000";
  return `${prefix}.${plateCode}.${taxNum}`;
}

export const EXPENSE_CATEGORIES = [
  "Mal Alımı",
  "Yemek ve ulaşım",
  "İş yeri eğitimleri",
  "Kira ödemeleri",
  "Elektrik Faturası",
  "Su Faturası",
  "Doğalgaz faturası",
  "Aidat giderleri",
  "Kargo ve posta",
  "Araç kiralama",
  "Yakıt harcamaları",
  "Bakım ve onarım",
  "Seyahat harcamaları",
  "Dijital reklamlar",
  "Tasarım ve baskı",
  "Web sitesi ve SEO",
  "Demirbaş alımları",
  "Kırtasiye harcamaları",
  "Temizlik ve mutfak",
  "Danışmanlık ücretleri",
  "Yazılım lisansları",
  "Nakliye",
  "Hammaliye",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type TaxType =
  | "KDV"
  | "KDV Tevkifatı"
  | "ÖTV"
  | "ÖİV"
  | "Konaklama Vergisi"
  | "Damga Vergisi"
  | "Stopaj"
  | "BSMV"
  | "Borsa Tescil / Fon"
  | "Diğer Vergi";

export interface InvoiceTaxItem {
  id?: string;
  taxType: TaxType | string; // "KDV", "KDV Tevkifatı", "ÖTV", "ÖİV", "Konaklama Vergisi", "Damga Vergisi", "Stopaj", "BSMV", "Diğer Vergi"
  taxTypeCode?: string; // "0015", "9015", "0071", "4080", "0059", "0040", "0003", "0021", "8001" vb.
  taxName?: string; // Açıklama / Adı (Örn: "Katma Değer Vergisi (%20)", "Özel İletişim Vergisi (%10)", "KDV Tevkifatı (5/10)")
  rate?: number; // Vergi Oranı (%)
  taxRate?: number; // Alias for rate
  taxableAmount?: number; // Matrah (Vergiye esas tutar)
  taxAmount: number; // Hesaplanan vergi tutarı
  exemptionCode?: string; // İstisna Kodu (örn: 351, 301)
  exemptionReason?: string; // İstisna Sebebi
  isDeduction?: boolean; // True ise stopaj/kesinti gibi ödenecek tutardan düşülür, false ise eklenir
}

export interface ItemAdditionalTax {
  id?: string;
  code: string; // GİB Ek Vergi Kodu (örn: "0003", "0071", "4080", "1047", "SGK_PRIM")
  name: string; // GİB Ek Vergi Adı (örn: "GV STOPAJI", "ÖTV 1.LİSTE", "DAMGA V")
  calculationType: "percent" | "fixed"; // "percent" (Oran %) veya "fixed" (Sabit Tutar TL)
  rate?: number; // Oran (%)
  amount: number; // Tutar (TL)
  isDeduction?: boolean; // Kesinti/Stopaj mı (true: ödenecek tutardan düşülür, false: genel toplama eklenir)
}

export interface InvoiceItem {
  id: string;
  productId?: string;
  expenseCategory?: string; // Masraf / Gider Kalemi (Yemek ve ulaşım, Kira ödemeleri, vb.)
  description: string;
  quantity: number;
  unit: string; // Adet, Saat, Ay, Kg, vb.
  unitPrice: number;
  discountAmount?: number; // İskonto Tutarı (TL)
  discountRate?: number; // İskonto Oranı (%)
  vatRate: number; // 0, 1, 10, 20
  withholdingRate?: number; // Tevkifat Oranı (ör: 0, 0.2, 0.5 - 5/10, 0.7 - 7/10, 1)
  withholdingCode?: string; // GİB Tevkifat Kodu (örn: "601", "602", "618", "624", "625")
  withholdingRateNumerator?: number; // Tevkifat Payı (örn: 5)
  withholdingRateDenominator?: number; // Tevkifat Paydası (örn: 10)
  withholdingAmount?: number; // Tevkif edilen KDV tutarı
  specialTaxBase?: number; // Özel Matrah Tutarı (Kâr marjı / KDV'ye tabi asıl matrah)
  specialTaxBaseCode?: string; // GİB Özel Matrah Kodu (örn: "809", "810", "805")
  specialTaxBaseReason?: string; // Özel Matrah Açıklaması
  costPrice?: number; // Alış Maliyet Fiyatı (Özel matrah kâr marjı hesabı için)
  exemptionCode?: string; // GİB İstisna Kodu (örn: "301", "302", "351", "250")
  exemptionReason?: string; // İstisna Sebebi Açıklaması
  otvRate?: number; // ÖTV Oranı (%)
  otvAmount?: number; // ÖTV Tutarı
  oivRate?: number; // ÖİV Oranı (%)
  oivAmount?: number; // ÖİV Tutarı
  accommodationTaxRate?: number; // Konaklama Vergisi Oranı (%2)
  accommodationTaxAmount?: number; // Konaklama Vergisi Tutarı
  stopajRate?: number; // Gelir Vergisi Stopaj Oranı (%20)
  stopajAmount?: number; // Stopaj Tutarı
  additionalTaxes?: ItemAdditionalTax[]; // Kaleme eklenen ek vergiler listesi (GİB Listesi)
  totalWithoutVat: number;
  vatAmount: number;
  totalWithVat: number;
}

export type InvoiceProfileType =
  | "SATIS"
  | "TEVKIFAT"
  | "OZELMATRAH"
  | "ISTISNA"
  | "IADE"
  | "IHRACKAYITLI"
  | "SGK"
  | "KOMISYONCU";

export type InvoiceScenario =
  | "TICARIFATURA"
  | "TEMELFATURA"
  | "EARSIVFATURA"
  | "IHRACAT"
  | "KAMU"
  | "HAL";

export type InvoiceType = "sales" | "purchase" | "expense" | "purchase_invoice"; // Satış Faturası / Alış Faturası / Gider / Alış İrsaliye Faturası
export type InvoiceStatus = "draft" | "sent" | "paid" | "partial" | "overdue" | "cancelled";

export type EDocumentType = "e_fatura" | "e_arsiv" | "paper";

export type CanonicalEDocumentDirection = "incoming" | "outgoing";
export type EDocumentDirection = CanonicalEDocumentDirection | "inbox" | "outbox";
export type EDocumentStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "accepted"
  | "rejected"
  | "draft"
  | "cancelled"
  | "waiting_response"
  | "responded"
  | "processed"
  | "error"
  | "unknown"
  | string;

export type MysoftDocumentFamily = "invoice" | "despatch";

export interface MysoftEDocument {
  id: string;
  companyId?: string;
  family?: MysoftDocumentFamily;
  direction: EDocumentDirection;
  canonicalDirection?: CanonicalEDocumentDirection;
  documentType: EDocumentType | string;
  ettn?: string;
  documentNo?: string;
  number?: string;
  documentNumber?: string;
  issueDate?: string;
  date?: string;
  dueDate?: string;
  status: EDocumentStatus;
  statusText?: string;
  statusLabel?: string;
  envelopeStatusText?: string;
  envelopeStatusCode?: string;
  senderName?: string;
  senderTaxNumber?: string;
  receiverName?: string;
  receiverTaxNumber?: string;
  accountName?: string;
  taxNumber?: string;
  subtotal?: number;
  vatTotal?: number;
  grandTotal?: number;
  amount?: number;
  currency?: string;
  currencyRate?: number;
  archived?: boolean;
  profile?: string;
  source?: "mysoft" | "local";
  syncedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  downloadUrl?: string;
  items?: unknown[];
  lines?: unknown[];
  partyName?: string;
  partyTaxNumber?: string;
  raw?: Record<string, unknown>;
}

export interface ManagedCompany {
  id: string;
  name?: string;
  taxNumber?: string;
  tenantIdentifierNumber?: string;
  isPassive?: boolean;
}

export interface MysoftCredentials {
  tenantIdentifierNumber?: string;
}

export type DocumentKind = "invoice" | "receipt"; // invoice = Fatura, receipt = Fiş (Gelir/Gider Fişi)

export interface Invoice {
  id: string;
  invoiceNumber: string; // ör: GIB20260000001
  type: InvoiceType;
  invoiceScenario?: InvoiceScenario; // "TICARIFATURA" | "TEMELFATURA" | "EARSIVFATURA" | "IHRACAT" | "KAMU" | "HAL"
  invoiceProfileType?: InvoiceProfileType; // "SATIS" | "TEVKIFAT" | "OZELMATRAH" | "ISTISNA" | "IADE" | "IHRACKAYITLI" | "SGK" | "KOMISYONCU"
  docKind?: DocumentKind; // "invoice" = Gelir/Gider Faturası, "receipt" = Gelir/Gider Fişi
  expenseCategory?: string; // Ana Masraf / Gider Kalemi
  contactId: string;
  contactName: string;
  taxNumber?: string;
  issueDate: string; // Fatura Tarihi
  dueDate: string; // Son Ödeme Tarihi
  items: InvoiceItem[];
  grossTotal?: number; // İskonto Öncesi Brüt Toplam
  totalDiscount?: number; // Toplam İskonto Tutarı
  subtotal: number; // KDV Hariç Ara Toplam
  effectiveTaxableAmount?: number; // Özel Matrah / Net KDV Matrahı Toplamı
  totalVat: number; // Toplam KDV
  totalWithholding?: number; // Toplam Tevkifat
  payableVat?: number; // Net Tahsil Edilecek KDV (totalVat - totalWithholding)
  totalOtv?: number; // Toplam ÖTV (Özel Tüketim Vergisi)
  totalOiv?: number; // Toplam ÖİV (Özel İletişim Vergisi)
  totalAccommodationTax?: number; // Toplam Konaklama Vergisi (%2)
  totalStampTax?: number; // Toplam Damga Vergisi
  totalStopaj?: number; // Toplam Stopaj / Gelir Vergisi Kesintisi
  taxItems?: InvoiceTaxItem[]; // Faturadaki tüm vergi kalemleri ve dökümü (KDV, ÖTV, ÖİV, Tevkifat, Konaklama vb.)
  grandTotal: number; // Genel Toplam
  payableAmount?: number; // 🎯 Ödenecek / Tahsil Edilecek Net Tutar (grandTotal - totalWithholding - totalStopaj)
  paidAmount: number; // Ödenen Miktar
  remainingAmount: number; // Kalan
  status: InvoiceStatus;
  currency: string; // TRY, USD, EUR
  notes?: string;
  terms?: string;
  createdAt: string;
  eDocumentType?: EDocumentType;
  eDocumentEttn?: string;
}

export type ChequeType = "received" | "issued"; // received = Müşteri Çeki, issued = Borç / Firma Çeki
export type ChequeStatus = "portfolio" | "collected" | "endorsed" | "paid" | "bounced" | "cancelled";

export interface Cheque {
  id: string;
  type: ChequeType;
  chequeNumber: string;
  bankName: string;
  branchName?: string;
  drawerName?: string;
  drawer?: string; // Alias for drawerName
  contactId?: string;
  contactName: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  currency: string;
  status: ChequeStatus;
  notes?: string;
  endorsedToContactId?: string;
  endorsedToContactName?: string;
  endorsedDate?: string;
}

export type PromissoryNoteType = "received" | "issued"; // received = Müşteri Seneti, issued = Borç Seneti
export type PromissoryNoteStatus = "portfolio" | "collected" | "endorsed" | "paid" | "protested" | "cancelled";

export interface PromissoryNote {
  id: string;
  type: PromissoryNoteType;
  noteNumber: string;
  debtorName: string;
  contactId?: string;
  contactName: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  currency: string;
  status: PromissoryNoteStatus;
  notes?: string;
  endorsedToContactId?: string;
  endorsedToContactName?: string;
  endorsedDate?: string;
}

export type AccountType = "cash" | "bank" | "credit_card" | "pos" | string;

export interface Account {
  id: string;
  name: string; // ör: Merkez TL Kasası, Garanti Ticari TL, Ziraat USD
  type: AccountType;
  currency: string; // TRY, USD, EUR
  balance: number;
  accountNumber?: string;
  iban?: string;
  bankName?: string;
  branchName?: string;
  isDefault?: boolean;
}

export type TransactionType = "income" | "expense" | "transfer" | "collection" | "payment";

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  amount: number;
  currency: string;
  accountId: string;
  accountName: string;
  contactId?: string;
  contactName?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  category: string; // ör: Danışmanlık Geliri, Ofis Kirası, Yazılım Lisansı, Maaş, Vergi/SGK
  description: string;
  documentNo?: string;
  receiptImage?: string; // Bakiye/Fiş görseli simülasyonu
  items?: InvoiceItem[];
  subtotal?: number;
  totalVat?: number;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  unit: string;
  buyPrice: number;
  sellPrice: number;
  purchasePrice?: number; // Alias for buyPrice
  sellingPrice?: number; // Alias for sellPrice
  vatRate: number; // 1, 10, 20
  stockQuantity: number;
  stock?: number; // Alias for stockQuantity
  minStockAlert?: number;
  minStock?: number; // Alias for minStockAlert
  currency?: string;
  isService?: boolean;
  serials?: string[];
  category?: string;
  stockType?: string; // "İlk Madde Malzeme", "Yarı Mamul", "Ticari Mal", "Ham Madde", "Hizmet"
  barcode?: string; // Barkod numarası
  imeiOrSerialNo?: string; // IMEI veya Seri Numarası
  warehouseId?: string; // Primary Warehouse ID
  warehouseName?: string; // Primary Warehouse Name
  warehouseQuantities?: Record<string, number>; // Depo bazlı stok miktarları { wh_id: qty }
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  date: string;
  productId: string;
  productName: string;
  productCode: string;
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  quantity: number;
  unit: string;
  notes?: string;
  createdAt: string;
}

export type QuoteStatus = "draft" | "sent" | "approved" | "rejected" | "converted" | "invoiced";

export interface Quote {
  id: string;
  quoteNumber: string;
  number?: string; // Alias for quoteNumber
  contactId: string;
  contactName: string;
  issueDate: string;
  validUntil: string;
  items: InvoiceItem[];
  subtotal?: number;
  taxTotal?: number;
  grandTotal: number;
  currency?: string;
  status: QuoteStatus;
  notes?: string;
}

export type OrderType = "sales" | "purchase"; // Satış Siparişi (Müşteriden Alınan) / Alış Siparişi (Tedarikçiye Verilen)
export type OrderStatus = "pending" | "approved" | "processing" | "shipped" | "delivered" | "cancelled" | "converted";

export interface OrderItem {
  id: string;
  productId?: string;
  productCode?: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
  discountRate?: number;
  totalWithoutVat: number;
  vatAmount: number;
  totalWithVat: number;
}

export interface Order {
  id: string;
  orderNumber: string; // ör: SIP-2026-00001
  type: OrderType;
  contactId: string;
  contactName: string;
  contactPhone?: string;
  contactEmail?: string;
  taxNumber?: string;
  orderDate: string; // Sipariş Tarihi
  date?: string; // Alias for orderDate
  deliveryDate?: string; // Teslimat / Termin Tarihi
  items: OrderItem[];
  subtotal: number;
  totalVat: number;
  grandTotal: number;
  currency: string; // TRY, USD, EUR
  status: OrderStatus;
  warehouseId?: string;
  warehouseName?: string;
  notes?: string;
  convertedToInvoiceId?: string;
  convertedToInvoiceNumber?: string;
  createdAt: string;
}

export interface AddressDetails {
  country?: string; // ör: "Türkiye"
  city: string; // İl (ör: "İstanbul")
  district: string; // İlçe (ör: "Şişli")
  neighborhood?: string; // Mahalle (ör: "Mecidiyeköy")
  street?: string; // Cadde / Sokak (ör: "Büyükdere Cad.")
  buildingNo?: string; // Bina No (ör: "195")
  doorNo?: string; // Daire / Dükkan No (ör: "Kat:8")
  postalCode?: string; // Posta Kodu (ör: "34394")
  fullAddress?: string; // Açık Adres
}

export interface Branch {
  id: string;
  code: string; // ör: "SUB-001"
  name: string; // ör: "Merkez Genel Müdürlük", "Kadıköy Şubesi"
  managerName?: string; // Şube Sorumlusu / Müdürü
  phone?: string;
  email?: string;
  isMain?: boolean; // Ana Şube mi?
  status: "active" | "passive";
  address: AddressDetails;
  createdAt: string;
}

export interface Warehouse {
  id: string;
  code: string; // ör: "DEP-001"
  name: string; // ör: "Gebze Lojistik Merkez Depo"
  type?: "main" | "regional" | "transit" | "cold_storage" | "customs"; // Depo Tipi
  capacityM2?: number; // Kapasite m²
  managerName?: string; // Depo Sorumlusu
  phone?: string;
  branchId?: string; // Bağlı Olduğu Şube ID
  branchName?: string; // Bağlı Olduğu Şube Adı
  status: "active" | "passive";
  address: AddressDetails;
  isDefault?: boolean;
  createdAt: string;
}

export const TAXPAYER_TYPES = [
  "Gerçek Şahıs",
  "Anonim Şirket",
  "Limited Şirket",
  "Adi Ortaklık",
  "Kollektif Şirket",
  "Dernek",
  "Vakıf",
  "Kooperatif",
  "Siyasi Parti",
  "Site Yönetimi",
  "Spor Kulübü",
] as const;

export type TaxpayerType = (typeof TAXPAYER_TYPES)[number];

export interface TaxOfficeCredentials {
  userCode?: string;      // Vergi Dairesi / GİB Kullanıcı Kodu
  password?: string;      // Parola
  codeSecret?: string;    // Şifre
}

export interface WorkplaceSgkCredential {
  id: string;
  name: string;                     // Şube / Depo / Birim Adı (ör: "Merkez", "Ankara Şubesi", "Gebze Depo")
  type?: "main" | "branch" | "warehouse" | "other"; // Birim Türü
  referenceId?: string;             // İlgili Şube veya Depo ID'si
  workplaceRegistrationNo: string;  // SGK İşyeri Sicil No (Noktasız)
  userCode: string;                 // SGK e-Bildirge Kullanıcı Kodu
  workplaceCode: string;            // SGK İşyeri Kodu (Şube/Sıra No ör: 000, 001)
  systemPassword?: string;          // Sistem Şifresi
  workplacePassword?: string;       // İşyeri Şifresi
}

export interface SgkCredentials {
  userCode?: string;               // SGK e-Bildirge Kullanıcı Kodu
  workplaceCode?: string;          // SGK İşyeri Kodu (Şube/İşyeri Sıra No)
  systemPassword?: string;         // Sistem Şifresi
  workplacePassword?: string;      // İşyeri Şifresi
  workplaceRegistrationNo?: string; // SGK İşyeri Sicil / Tescil No
  workplaces?: WorkplaceSgkCredential[]; // Şube, depo ve diğer birimlerin SGK şifreleri
}

export interface EDevletCredentials {
  managerName?: string;          // Şirket Müdürü / Yetkili Adı Soyadı
  tcKimlikNo?: string;           // T.C. Kimlik Numarası
  tckn?: string;                 // Alias for tcKimlikNo
  eDevletPassword?: string;      // e-Devlet Şifresi
  password?: string;             // Alias for eDevletPassword
  mobileSignaturePhone?: string; // Kayıtlı Telefon / Mobil İmza Numarası
  validUntil?: string;           // İmza Yetkisi Geçerlilik Tarihi
  notes?: string;                // Yetki Kapsamı / Notlar
}

export type ETebligatAuthority = "GIB" | "SGK";
export type ETebligatStatus = "unread" | "read" | "in_process" | "appealed" | "paid" | "archived";

export interface ETebligatItem {
  id: string;
  authority: ETebligatAuthority; // "GIB" (Vergi Dairesi) | "SGK" (Sosyal Güvenlik Kurumu)
  senderUnit: string; // ör: "Kadıköy Vergi Dairesi Müdürlüğü" veya "İstanbul SGK İl Müdürlüğü"
  documentTitle: string; // ör: "Ödeme Emri (6183 S.K. 55. Md.)", "Vergi / Ceza İhbarnamesi", "İzahata Davet Yazısı", "SGK Prim Farkı ve İPC Bildirimi"
  documentType?: string; // İhbarname, Ödeme Emri, İzahata Davet, Bilgi İsteme vb.
  barcodeNumber: string; // ör: "GIB-2026-ETEB-8492019"
  envelopeId?: string; // ör: "e-ZRF-2026-948204"
  sentDate: string; // Gönderim Tarihi (ör: "2026-08-14")
  deliveryDate: string; // Tebellüğ Tarihi (Sisteme ulaştıktan 5 gün sonra yasal tebellüğ edilmiş sayılır)
  legalDeadlineDate?: string; // Yasal Süre Bitiş Tarihi (İtiraz / Dava / Ödeme Son Günü)
  amount?: number; // Varsa Tebliğ Edilen Tutar / Borç (₺)
  status: ETebligatStatus; // unread, read, in_process, appealed, paid, archived
  contentSummary?: string; // Tebligat Konusu & İçerik Özeti
  workplaceId?: string; // İlgili SGK İşyeri veya Şube
  workplaceName?: string;
  notes?: string;
  pdfUrl?: string;
  receiptNumber?: string; // Mazbata No
}

export interface CompanySettings {
  companyName: string;
  name?: string; // Alias for companyName
  companyTitle: string;
  title?: string; // Alias for companyTitle
  taxOffice: string;
  taxNumber: string;
  vknTckn?: string; // Alias for taxNumber
  taxpayerType?: TaxpayerType | string;
  tradeRegisterNo?: string;
  mersisNo?: string;
  address: string;
  city: string;
  district?: string;
  neighborhood?: string;
  street?: string;
  buildingNo?: string;
  doorNo?: string;
  postalCode?: string;
  country?: string;
  addressDetails?: AddressDetails;
  phone: string;
  email: string;
  website: string;
  logoUrl?: string;
  defaultBankIban?: string;
  iban?: string; // Alias for defaultBankIban
  defaultBankName?: string;
  currency: string;
  taxCredentials?: TaxOfficeCredentials;
  sgkCredentials?: SgkCredentials;
  eDevletCredentials?: EDevletCredentials;
  eTebligatlar?: ETebligatItem[];
  /** Firma VKN/TCKN; Mysoft e-belge çağrılarında tenantIdentifierNumber olarak kullanılır. */
  tenantIdentifierNumber?: string;
  mysoftCredentials?: MysoftCredentials;
}

export interface LedgerEntry {
  id: string;
  date: string;
  documentType: "Fatura" | "Tahsilat" | "Tediye" | "Dekont" | "Devir" | "Ödeme" | string;
  documentNo: string;
  description: string;
  debit: number; // Borç (Cari hesabın borcu - Bize borçlandı veya ödeme yaptı)
  credit: number; // Alacak (Cari hesabın alacağı - Fatura kesti veya tahsilat yaptık)
  runningBalance: number; // Bakiye
}

export type DepartmentType =
  | "Yönetim"
  | "Yazılım & IT"
  | "Muhasebe & Finans"
  | "Satış & Pazarlama"
  | "Operasyon & Lojistik"
  | "İnsan Kaynakları"
  | "Müşteri Hizmetleri";

export interface Employee {
  id: string;
  tckn: string;
  tcNo?: string; // Alias for tckn
  fullName: string;
  firstName?: string;
  lastName?: string;
  gender?: "Erkek" | "Kadın" | string;
  title: string;
  department: DepartmentType | string;
  startDate: string;
  endDate?: string; // İşten Çıkış Tarihi
  terminationCode?: string; // SGK İşten Çıkış Kodu
  terminationReason?: string; // SGK İşten Çıkış Nedeni Açıklaması
  birthDate?: string; // Doğum Tarihi
  homeAddress?: string; // Ev Adresi
  photoUrl?: string; // Profil / Vesikalık Fotoğraf
  phone: string;
  email: string;
  salaryType: "net" | "gross";
  salaryAmount: number; // Tutar (₺)
  salary?: number; // Alias for salaryAmount
  grossSalary?: number;
  foodAllowance?: number;
  roadAllowance?: number;
  hasBes?: boolean; // BES Katılımı (%3)
  sgkOccupationCode?: string; // SGK Meslek Kodu
  sgkNo?: string;
  iban?: string;
  bankName?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  status: "active" | "on_leave" | "terminated";
  annualLeaveAllowance: number; // Kullanılabilir Hak Edilen İzin
  usedAnnualLeave: number; // Kullanılan İzin
  notes?: string;
  createdAt: string;
  branchId?: string; // Bağlı Olduğu Şube ID
  branchName?: string; // Bağlı Olduğu Şube Adı
  warehouseId?: string; // Görev Yaptığı Depo ID
  warehouseName?: string; // Görev Yaptığı Depo Adı
  projectId?: string; // Görev Yaptığı Proje ID
  projectName?: string; // Görev Yaptığı Proje Adı
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  monthYear: string; // ör: "2026-07"
  baseSalary: number;
  salaryType: "net" | "gross";
  bonusAmount?: number;
  overtimePay?: number;
  overtimeNormalHours?: number; // Hafta içi %50 zamlı mesai saati
  overtimeWeekendHours?: number; // Hafta tatili %100 zamlı mesai saati
  overtimeHolidayDays?: number; // Resmi tatil 1 günlük ek ücretli mesai günü
  overtimeHolidayHours?: number; // Resmi tatil saatlik mesai saati
  foodAllowance?: number;
  roadAllowance?: number;
  advanceDeduction?: number;
  unpaidLeaveDays?: number;
  unpaidLeaveDeduction?: number;
  besDeduction?: number;
  executionDeduction?: number;
  alimonyDeduction?: number;
  otherDeductions?: number;
  grossSalary: number;
  sgkEmployeeShare: number; // %14
  unemploymentEmployeeShare: number; // %1
  incomeTaxBase: number;
  incomeTax: number;
  stampTax: number; // %0.759
  minWageTaxExemption: number; // Asgari Ücret Vergi İstisnası
  netSalary: number;
  payableNetSalary: number; // Net ele geçen (avans, kesintiler, bonus ve ek ödemeler sonrası)
  sgkEmployerShare: number; // %15.5 veya %20.5
  unemploymentEmployerShare: number; // %2
  totalEmployerCost: number;
  paymentStatus: "paid" | "pending";
  paymentDate?: string;
  isCustomized?: boolean;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: "Yıllık İzin" | "Ücretli İzin" | "Ücretsiz İzin" | "Mazeretsiz İzin" | "Sıhhi İzin" | "Mazeret İzni" | "Hastalık/Rapor" | "Babalar/Annelik İzni" | string;
  leaveType?: string; // Alias for type
  startDate: string;
  endDate: string;
  daysCount: number;
  status: "approved" | "pending" | "rejected";
  reason?: string;
  description?: string; // Alias for reason
  createdAt: string;
}

export interface AdvanceRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: "Avans" | "Masraf" | "Masraf Avansı" | "Prim" | string;
  amount: number;
  requestDate: string;
  description: string;
  reason?: string; // Alias for description
  status: "paid" | "approved" | "pending" | "rejected";
  createdAt: string;
}

export interface LegalDeduction {
  id: string;
  employeeId: string;
  employeeName: string;
  type: string;
  totalDebt?: number;
  totalDebtAmount?: number;
  totalAmount?: number; // Alias for totalDebt
  monthlyDeduction?: number;
  monthlyAmount?: number;
  paidAmount: number;
  remainingAmount?: number;
  creditorTitle?: string;
  creditorName?: string;
  fileNumber?: string;
  fileNo?: string; // Alias for fileNumber
  iban?: string;
  calculationType?: string;
  priorityOrder?: number;
  notes?: string;
  status: "active" | "completed" | "paused" | "queued" | string;
  createdAt: string;
}


export type WaybillType = "dispatch" | "receipt"; // Sevk İrsaliyesi (Giden) / Alış İrsaliyesi (Gelen)
export type WaybillStatus = "pending" | "shipped" | "delivered" | "invoiced" | "cancelled";

export interface WaybillItem {
  id: string;
  productId?: string;
  productCode?: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
  discountRate?: number;
  totalWithoutVat: number;
  vatAmount: number;
  totalWithVat: number;
}

export interface Waybill {
  id: string;
  waybillNumber: string; // ör: IRS-2026-00102
  type: WaybillType;
  contactId: string;
  contactName: string;
  contactPhone?: string;
  contactEmail?: string;
  taxNumber?: string;
  waybillDate: string; // İrsaliye Düzenlenme Tarihi
  dispatchDate?: string; // Fiili Sevk Tarihi / Saati
  dispatchTime?: string; // Fiili Sevk Saati
  vehiclePlate?: string; // Araç Plakası (ör: 34 ABC 123)
  plateNumber?: string; // Alias for vehiclePlate
  driverName?: string; // Sürücü Adı Soyadı & TCKN
  driverTckn?: string;
  deliveryAddress?: string; // Teslimat Adresi
  items: WaybillItem[];
  subtotal: number;
  totalVat: number;
  grandTotal: number;
  currency: string;
  status: WaybillStatus;
  warehouseId?: string;
  warehouseName?: string;
  notes?: string;
  invoicedInvoiceId?: string;
  invoicedInvoiceNumber?: string;
  createdAt: string;
}

export type CostProjectStatus = "planning" | "active" | "completed" | "paused" | "cancelled";

export type ProjectCostType = "material" | "labor" | "subcontractor" | "overhead" | "other";

export interface ProjectCostItem {
  id: string;
  type: ProjectCostType; // Malzeme, İşçilik, Taşeron, Genel Gider, Diğer
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  date?: string;
  productId?: string;
  sourceType?: "manual" | "invoice" | "expense" | "hr";
  sourceId?: string;
  employeeId?: string;
  employeeName?: string;
  notes?: string;
}

export interface CostProject {
  id: string;
  code: string; // ör: PRJ-2026-001
  name: string; // Proje Adı
  category?: string; // İnşaat / Taahhüt, Yazılım / Ar-Ge, Üretim, Danışmanlık, Servis vb.
  contactId?: string;
  contactName?: string; // Müşteri / Cari Adı
  startDate: string;
  endDate?: string;
  budget: number; // Hedef Bütçe (₺)
  contractPrice?: number; // Sözleşme Bedeli / Hedef Ciro (₺)
  status: CostProjectStatus;
  description?: string;
  costItems: ProjectCostItem[];
  createdAt: string;
}

export interface ExtractedDocumentData {
  taxNumber?: string; // Vergi Numarası / TCKN
  companyTitle?: string; // Ünvan (Satıcı/Düzenleyen Firma)
  invoiceNumber?: string; // Fiş veya Fatura Numarası
  issueDate?: string; // Belge Düzenleme Tarihi (YYYY-MM-DD)
  docType?: "Fatura" | "Fiş" | "Diğer";
  subtotal?: number; // Matrah (KDV Hariç Tutar)
  vatRate?: number; // KDV Oranı (%)
  vatAmount?: number; // KDV Tutarı
  grandTotal?: number; // Genel Toplam
  paymentMethod?: "Nakit" | "Kredi Kartı" | "Banka Transferi / EFT" | "Çek" | "Senet" | "Açık Hesap / Vadeli";
  expenseCategory?: string; // Masraf Kalemi
  notes?: string;
  isTransferredToAccounting?: boolean; // Ön muhasebeye aktarıldı mı?
}

// Modül Yetkilendirme ve İzin Tanımları
export type AppModuleKey =
  | "dashboard"
  | "company"
  | "auto_service"
  | "it_service"
  | "appliance_service"
  | "e_services"
  | "invoices"
  | "orders_module"
  | "contacts"
  | "accounts"
  | "products"
  | "products_costs"
  | "hr"
  | "files"
  | "reports"
  | "ai"
  | "settings";

export interface AppModuleDefinition {
  key: AppModuleKey;
  label: string;
  description: string;
  category: "Genel" | "Ticari" | "Finans" | "Yönetim";
}

export type AssetCategory =
  | "vehicle"
  | "computer"
  | "phone"
  | "tablet"
  | "peripheral"
  | "office"
  | "tool"
  | "other";

export type AssetStatus = "active" | "returned" | "maintenance" | "damaged" | "scrapped";

export type AssetCondition = "new" | "excellent" | "good" | "fair" | "damaged";

export interface VehicleDetails {
  plateNumber: string; // Plaka ör: 34 ABC 789
  chassisNumber?: string; // Şasi No
  engineNumber?: string; // Motor No
  fuelType?: "Benzin" | "Dizel" | "Hibrit" | "Elektrik" | "LPG" | string;
  currentKm: number; // Teslim KM
  returnKm?: number; // İade KM
  insuranceExpiryDate?: string; // Zorunlu Trafik Sigortası Bitiş Tarihi
  kaskoExpiryDate?: string; // Kasko Poliçe Bitiş Tarihi
  inspectionExpiryDate?: string; // TÜVTÜRK Muayene Bitiş Tarihi
  fuelCardNumber?: string; // Taşıt Tanıma / Yakıt Kartı No
  hgsNumber?: string; // HGS / OGS Etiket No
  hasSpareKey?: boolean; // Yedek Anahtar Var mı?
  hasLicenseCard?: boolean; // Ruhsat / Tescil Belgesi Teslim Edildi mi?
  hasTrafficSet?: boolean; // Yangın Tüpü / Trafik Seti / Stepne Var mı?
}

export interface ComputerDetails {
  computerType: "laptop" | "desktop" | "workstation" | "all_in_one" | "server";
  processor: string; // İşlemci (ör: Apple M3 Pro, Intel Core i7 14700, AMD Ryzen 7)
  ram: string; // Bellek (ör: 16 GB, 32 GB, 64 GB)
  storage: string; // Disk/SSD (ör: 512 GB NVMe SSD, 1 TB SSD)
  operatingSystem: string; // İşletim Sistemi (ör: macOS Sonoma, Windows 11 Pro, Ubuntu Linux)
  macAddress?: string;
  screenSize?: string; // ör: 14", 16", 27"
  includesCharger?: boolean; // Orijinal Şarj Cihazı / Adaptör
  includesBag?: boolean; // Taşıma Çantası
  includesMouse?: boolean; // Mouse / Klavye
  includesLock?: boolean; // Güvenlik Kilidi
}

export interface PhoneDetails {
  imei1: string; // 15 haneli IMEI 1
  imei2?: string; // IMEI 2
  phoneNumber?: string; // Tahsis Edilen Kurumsal Hat No (ör: 0532 123 45 67)
  simCardNumber?: string; // SIM Kart Seri No
  storageCapacity?: string; // Depolama (ör: 128 GB, 256 GB, 512 GB)
  color?: string; // Cihaz Rengi
  includesCharger?: boolean; // Şarj Başlığı ve Kablo
  includesHeadphones?: boolean; // Kulaklık
  includesCaseScreenProtector?: boolean; // Kılıf ve Ekran Koruyucu
}

export interface TabletDetails {
  tabletType?: string; // ör: iPad Pro, iPad Air, Galaxy Tab S9, Surface Pro
  screenSize?: string; // ör: 11", 12.9", 10.9"
  imei?: string; // Varsa Hücresel IMEI
  hasCellular?: boolean; // Wi-Fi + SIM (Hücresel) mi?
  storageCapacity?: string; // 128 GB, 256 GB vb.
  includesStylus?: boolean; // Apple Pencil / Stylus Kalem
  includesKeyboardCase?: boolean; // Magic Keyboard / Klavyeli Kılıf
  includesCharger?: boolean; // Şarj Aleti
}

export interface AssetCustody {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeDepartment?: string;
  employeeTitle?: string;
  category: AssetCategory;
  assetName: string; // ör: "2024 Renault Megane Touch", "MacBook Pro 16\" M3 Max", "iPhone 15 Pro 256GB"
  assetCode?: string; // Alias for barcodeNumber
  brand: string; // Marka (Renault, Apple, Dell, Lenovo, Samsung, HP)
  model: string; // Model (Megane 1.3 TCe, MacBook Pro, ThinkPad T14, Galaxy S24)
  serialNumber?: string;
  barcodeNumber?: string; // Demirbaş Zimmet No (ör: ZIM-2026-0042)
  inventoryNumber?: string;
  assignedDate: string; // Zimmet Teslim Tarihi
  returnDate?: string; // İade / Teslim Alma Tarihi
  returnNotes?: string; // İade Açıklaması / Teslim Alma Notu
  returnReceivedBy?: string; // İadeyi Teslim Alan Yetkili
  returnedAccessoriesList?: string[]; // İade Edilen Aksesuarlar
  status: AssetStatus; // "active" | "returned" | "maintenance" | "damaged" | "scrapped"
  conditionOnDelivery: AssetCondition; // "new" | "excellent" | "good" | "fair" | "damaged"
  conditionOnReturn?: string;
  approximateValue?: number; // Piyasa / Rayiç Değeri (₺)
  currency?: string;
  notes?: string;
  vehicleDetails?: VehicleDetails;
  computerDetails?: ComputerDetails;
  phoneDetails?: PhoneDetails;
  tabletDetails?: TabletDetails;
  accessoriesList?: string[];
  createdAt: string;
  branchId?: string;
  branchName?: string;
  warehouseId?: string;
  warehouseName?: string;
}

// ==========================================
// 🏭 ÜRETİM & MRP II & MES MODÜLÜ TİPLERİ
// ==========================================

export type BomItemType = "raw_material" | "semi_finished" | "packaging" | "consumable";

export interface BomItem {
  id: string;
  type: BomItemType;
  productId: string; // Stok Kartı ID
  productCode: string;
  productName: string;
  quantityPerUnit: number; // 1 birim nihai ürün için gereken miktar
  unit: string; // 'Adet', 'Kg', 'Metre', 'Litre', vb.
  wasteRate: number; // Fire Oranı % (Örn: 0.05 -> %5)
  unitCost: number; // Referans Alış Maliyeti
  isOptional?: boolean; // İsteğe bağlı bileşen
  isAlternativeAllowed?: boolean; // Alternatif ikame malzeme izinli mi?
  alternativeProductIds?: string[]; // Alternatif ürün ID'leri
  notes?: string;
}

export type BillOfMaterialItem = BomItem;

export interface BillOfMaterials {
  id: string;
  bomCode: string; // Örn: "BOM-KLT-001"
  revision: number; // 1, 2, 3
  name: string; // Reçete Adı
  productId: string; // Üretilecek Mamul / Yarı Mamul ID
  productCode: string;
  productName: string;
  category?: string;
  outputQuantity: number; // Temel çıktı miktarı (Varsayılan: 1)
  outputUnit: string;
  yieldRate: number; // Çıktı Verimi (Varsayılan: 1.00 -> %100)
  items: BomItem[];
  routingId?: string; // Bağlı Operasyon Rotası
  routingName?: string;
  laborHoursPerUnit?: number; // Birim Başı Standart İşçilik Süresi (Saat)
  laborHourlyRate?: number; // Standart İşçilik Saat Ücreti (TL)
  overheadCostPerUnit?: number; // Birim Başı Genel İmalat Gideri (TL)
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type WorkstationCategory = "machine" | "assembly_line" | "paint_booth" | "manual_bench" | "cnc" | "quality_station";
export type WorkstationStatus = "idle" | "running" | "maintenance" | "breakdown" | "offline";

export interface Workstation {
  id: string;
  code: string; // Örn: "CNC-01", "MONTAJ-HAT-A"
  name: string;
  category: WorkstationCategory;
  hourlyOperatingCost: number; // Saatlik Makine Çalışma Maliyeti (Elektrik + Bakım TL)
  hourlyDepreciationCost: number; // Saatlik Amortisman Payı (TL)
  standardCapacityHoursPerDay: number; // Günlük Standart Çalışma Kapasitesi (Saat, örn: 8, 16, 24)
  efficiencyRate: number; // OEE Verimlilik Çarpanı (0.85 -> %85)
  status: WorkstationStatus;
  currentWorkOrderId?: string;
  currentWorkOrderNumber?: string;
  assignedOperatorName?: string;
  branchId?: string;
  branchName?: string;
  warehouseId?: string;
  warehouseName?: string;
  maintenanceSchedule?: {
    lastMaintenanceDate?: string;
    nextMaintenanceDate?: string;
  };
  notes?: string;
}

export interface RoutingStep {
  id: string;
  sequence: number; // 10, 20, 30...
  operationName: string; // 'Lazer Kesim', 'Büküm', 'Kaynak', 'Fason Boya', 'Montaj', 'Kalite Kontrol'
  workstationId: string;
  workstationName: string;
  workstationType: "internal" | "subcontractor";
  subcontractorContactId?: string;
  subcontractorContactName?: string;
  subcontractorUnitCost?: number; // Fason Birim Maliyeti (TL)
  setupTimeMinutes: number; // Hazırlık / Kalıp Ayar Süresi (Sabit dk)
  runTimePerUnitMinutes: number; // 1 Adet İçin İşlem Süresi (dk)
  queueTimeMinutes?: number; // Dinlenme / Kuruma / Bekleme Süresi (dk)
  requiresQualityInspection?: boolean; // Kalite Kontrol Zorunlu mu?
  laborSkillLevelRequired?: string;
  description?: string;
}

export interface Routing {
  id: string;
  routingCode: string; // Örn: "ROUT-KLT-01"
  name: string;
  productId?: string;
  productName?: string;
  steps: RoutingStep[];
  totalSetupMinutes: number;
  totalRunMinutesPerUnit: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

export type WorkOrderStatus =
  | "draft"
  | "planned"
  | "material_issued"
  | "in_progress"
  | "quality_control"
  | "paused"
  | "completed"
  | "cancelled";
export type WorkOrderPriority = "low" | "medium" | "high" | "urgent";

export interface WorkOrderOperation {
  id: string;
  sequence: number;
  operationName: string;
  workstationId: string;
  workstationName: string;
  workstationType?: "internal" | "subcontractor";
  subcontractorContactId?: string;
  subcontractorContactName?: string;
  status: "pending" | "ready" | "in_progress" | "completed";
  plannedDurationMinutes: number;
  actualDurationMinutes: number;
  actualStartTime?: string;
  actualEndTime?: string;
  operatorEmployeeId?: string;
  operatorName?: string;
  producedQuantity?: number;
  scrappedQuantity?: number;
  notes?: string;
  qualityApproval?: {
    approvedBy: string;
    approvedAt: string;
    status: "approved" | "conditional" | "rejected";
    notes?: string;
  };
}

export interface WorkOrderMaterial {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  type?: BomItemType;
  plannedQuantity: number; // Planlanan
  allocatedQuantity?: number; // Rezerve Edilen
  consumedQuantity: number; // Fiilen Sarf Edilen
  unit: string;
  unitCost: number;
  totalCost?: number;
  warehouseId?: string;
  warehouseName?: string;
  isSubcontractDispatched?: boolean; // Fasona Sevk Edildi mi?
  dispatchWaybillNo?: string;
}

export interface WorkOrderCostBreakdown {
  rawMaterialCost: number; // Hammadde & Yarı Mamul Sarfiyatı
  laborCost: number; // Direkt İşçilik
  machineDepreciationCost: number; // Makine Amortismanı & Enerji
  subcontractorCost: number; // Fason Hizmet Bedeli
  overheadCost: number; // Genel Üretim Gideri
  totalCost: number; // Toplam Fiili Maliyet
  unitCost: number; // Birim Fiili Mamul Maliyeti
}

export interface WorkOrder {
  id: string;
  orderNumber: string; // Örn: "WO-2026-00101"
  originType: "sales_order" | "mrp_auto" | "manual_stock";
  sourceSalesOrderId?: string;
  sourceSalesOrderNumber?: string;
  customerName?: string;
  
  productId: string;
  productCode: string;
  productName: string;
  bomId: string;
  bomCode: string;
  routingId?: string;
  
  lotNumber: string; // Lot / Parti Numarası (Örn: "LOT260827-01")
  barcode?: string; // Barkod / QR (Örn: "WO2608270101")
  
  plannedQuantity: number; // Planlanan Miktar
  producedQuantity: number; // Sağlam Üretilen Miktar
  scrappedQuantity: number; // Hurda / Fire Miktar
  unit: string;
  
  sourceWarehouseId: string; // Hammaddelerin Çıkacağı Depo
  sourceWarehouseName: string;
  targetWarehouseId: string; // Üretilen Mamulün Gireceği Depo
  targetWarehouseName: string;
  
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  
  plannedStartDate: string;
  plannedDueDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  
  operations: WorkOrderOperation[];
  allocatedMaterials: WorkOrderMaterial[];
  costBreakdown?: WorkOrderCostBreakdown;
  
  isMaterialIssued: boolean; // Sarfiyat fişi kesilip stoktan düşüldü mü?
  isFinishedGoodReceived: boolean; // Mamul deposuna giriş yapıldı mı?
  
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SubcontractOrder {
  id: string;
  dispatchNo: string; // Fason İrsaliye No
  workOrderId: string;
  workOrderNumber: string;
  operationId: string;
  operationName: string;
  subcontractorContactId: string;
  subcontractorContactName: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  dispatchDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  status: "dispatched" | "in_process" | "received_partial" | "partially_received" | "completed" | "cancelled" | "pending" | string;
  receivedQuantity: number;
  scrapQuantity: number;
  serviceInvoiceNo?: string;
  notes?: string;
  createdAt: string;
}

export interface MrpDeficitItem {
  productId: string;
  productCode: string;
  productName: string;
  category: string;
  unit: string;
  type: BomItemType;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  requiredQuantity: number;
  deficitQuantity: number; // Açık / İhtiyaç Miktarı
  estimatedUnitCost: number;
  estimatedTotalCost: number;
  suggestedAction: "purchase_order" | "sub_work_order";
  parentWorkOrderNumbers: string[];
}

export interface MrpRequirement {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  grossRequirement: number;
  currentStock: number;
  scheduledReceipts: number;
  netRequirement: number;
  suggestedOrderDate: string;
  requiredDate: string;
  leadTimeDays: number;
  unit: string;
}

export interface MrpRecommendation {
  id: string;
  actionType: "create_work_order" | "create_purchase_order";
  productId: string;
  productCode: string;
  productName: string;
  suggestedQuantity: number;
  unit: string;
  suggestedDate: string;
  reason: string;
  estimatedCost: number;
  bomId?: string;
}

export interface MesTerminalLog {
  id: string;
  timestamp: string;
  workOrderId: string;
  workOrderNumber: string;
  operationId: string;
  operationName: string;
  workstationId: string;
  workstationName: string;
  operatorEmployeeId?: string;
  operatorName?: string;
  action: "START" | "PAUSE" | "RESUME" | "FINISH" | "SCRAP_ENTRY";
  producedQty?: number;
  scrappedQty?: number;
  scrapReason?: string;
  durationMinutes?: number;
  notes?: string;
}

export const ALL_APP_MODULES: AppModuleDefinition[] = [
  { key: "dashboard", label: "Ana Sayfa / Özet", description: "Genel finansal durum ve grafikler", category: "Genel" },
  { key: "auto_service", label: "Oto Servis & Araç Bakım", description: "Araç kabul, iş emri, arıza teşhisi ve AI asistanları", category: "Ticari" },
  { key: "it_service", label: "Bilişim & BT Teknik Servis", description: "Cihaz kabul, parça/yazılım onarım ve AI destek rehberleri", category: "Ticari" },
  { key: "appliance_service", label: "Ev Aletleri ve Klima", description: "Beyaz eşya, iklimlendirme ve küçük ev aletleri teknik servisi", category: "Ticari" },
  { key: "company", label: "Firma Bilgileri & Şubeler", description: "Şube, depo ve kurumsal unvan yönetimi", category: "Yönetim" },
  { key: "e_services", label: "E-İşlemler (GİB / E-Devlet)", description: "Vergi dairesi, SGK ve e-Tebligat sorgulama", category: "Yönetim" },
  { key: "invoices", label: "E-Belgeler & Faturalar", description: "Satış/Alış faturaları, e-Arşiv ve irsaliyeler", category: "Ticari" },
  { key: "orders_module", label: "Sipariş & Proforma", description: "Müşteri siparişleri ve proforma teklifler", category: "Ticari" },
  { key: "contacts", label: "Cari Hesaplar", description: "Müşteri ve tedarikçi cari kartları, ekstreler", category: "Ticari" },
  { key: "accounts", label: "Finans Yönetimi", description: "Kasa, banka, çek, senet ve virman işlemleri", category: "Finans" },
  { key: "products", label: "Stok & Ürünler", description: "Ürün kartları, barkod ve stok hareketleri", category: "Ticari" },
  { key: "products_costs", label: "Maliyet Analizi", description: "Proje ve hammadde maliyet hesaplama", category: "Finans" },
  { key: "hr", label: "İnsan Kaynakları & Zimmet", description: "Personel kartları, bordro, izin, avans ve araç/cihaz zimmet takibi", category: "Yönetim" },
  { key: "files", label: "Bulut Dosya Deposu", description: "Kullanıcı ve firma evrak arşivi", category: "Genel" },
  { key: "reports", label: "Vergilendirme & Raporlar", description: "KDV, Muhtasar, Geçici Vergi ve mizan raporları", category: "Finans" },
  { key: "ai", label: "AI Muavin Asistanı", description: "Yapay zeka akıllı muhasebe asistanı", category: "Genel" },
  { key: "settings", label: "Sistem Ayarları", description: "Uygulama ayarları, yedekleme ve genel tercihler", category: "Yönetim" },
];

// ==========================================
// 🚗 OTOMOTİV & ARAÇ BAKIM SERVİS MODÜLÜ TİPLERİ
// ==========================================

export type AutoServiceStatus =
  | "reception" // Servis Kabul / Giriş
  | "diagnosis" // Teşhis & Ekspertiz
  | "quote_pending" // Müşteri Onayı Bekliyor
  | "parts_pending" // Parça Temininde
  | "in_progress" // Onarımda / Liftte
  | "testing" // Test Sürüşü & Kalite / Yıkama
  | "ready" // Teslimata Hazır
  | "completed" // Teslim Edildi & Faturalandı
  | "cancelled"; // İptal Edildi

export interface AutoPartItem {
  id: string;
  partCode?: string;
  partName: string;
  partType: "original" | "oem" | "aftermarket" | "refurbished"; // Orijinal, OEM, Muadil, Revizyonlu
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number; // 0, 10, 20
  total: number;
  warrantyMonths?: number;
}

export interface AutoLaborItem {
  id: string;
  operationName: string; // ör: "Ön Fren Balata Değişimi", "Periyodik Bakım İşçiliği", "Rot Ayarı"
  technicianName?: string;
  hours: number;
  hourlyRate: number;
  vatRate: number;
  total: number;
}

export interface AutoAiOutputs {
  // 1. Müşteri Şikayetini Profesyonel İş Emrine Dönüştürme
  workOrderSummary?: {
    rawComplaint: string;
    mainSummary: string; // Ana Şikayet Özeti
    possibleSource: string; // Olası Kaynak / Sistem (Motor, Süspansiyon, Fren vb.)
    safetyRisk: "Düşük" | "Orta" | "Kritik" | string; // Sürüş Güvenliği Riski
    technicianFirstCheck: string; // Teknisyen İçin İlk Kontrol Önerisi
    generatedAt?: string;
  };
  // 2. Teknik Arıza Raporunu Müşteri Diline Çevirme (Güven Oluşturma)
  customerExplanation?: {
    rawTechReport: string;
    explanation: string;
    whyChange: string;
    risksIfNotChanged: string;
    generatedAt?: string;
  };
  // 3. Fiyat Teklifi ve Onay Mesajı (WhatsApp/SMS)
  quoteMessage?: {
    messageText: string;
    channel: "whatsapp" | "sms";
    generatedAt?: string;
  };
  // 4. Periyodik Bakım Sonrası Ekstra İhtiyaç Hatırlatma Asistanı
  extraReminder?: {
    extraIssues: string;
    callScript: string;
    messageDraft: string;
    generatedAt?: string;
  };
}

export interface AutoServiceRecord {
  id: string;
  serviceNo: string; // ör: "SRV-2026-0084"
  plateNumber: string; // Plaka ör: "34 ABC 789"
  brand: string; // Marka: Renault, BMW, Ford, Volkswagen vb.
  model: string; // Model: Megane, 320i, Focus, Passat
  modelYear: number; // Yıl: 2021
  fuelType?: "Benzin" | "Dizel" | "Hibrit" | "Elektrik" | "LPG" | string;
  engineCapacity?: string; // ör: "1.5 dCi", "2.0 TDI"
  chassisNumber?: string; // Şasi No / VIN (17 hane)
  currentKm: number; // Araç KM
  contactId?: string; // İlgili Müşteri / Cari Kart ID
  contactName: string; // Araç Sahibi / Firma
  contactPhone: string;
  contactEmail?: string;
  serviceType: "periodic_maintenance" | "mechanical_repair" | "body_paint" | "electrical" | "heavy_maintenance" | "tire_brake" | "diagnostic";
  entryDate: string; // Kabul Tarihi (YYYY-MM-DD)
  entryTime?: string; // Kabul Saati (HH:mm)
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  status: AutoServiceStatus;
  
  // Şikayet & Teşhis
  customerComplaint: string; // Müşteri Açıklaması / Beyanı
  workshopDiagnosis?: string; // Teknisyen / Usta Arıza Teşhis Raporu
  assignedTechnician?: string; // Atanan Baş Teknisyen
  fuelLevel?: "E" | "1/4" | "1/2" | "3/4" | "F"; // Depo Yakıt Seviyesi
  valuableItemsInCar?: string; // Araçta Bırakılan Değerli Eşya
  accessoriesReceived?: string; // Beraberinde Teslim Alınanlar (Ruhsat, Yedek Anahtar, Şarj Kablosu, Kriko, Stepne, Yangın Tüpü vb.)
  damagePhysicalCondition?: string; // Araç Kaporta Çizik, Göçük, Deformasyon & Fiziksel Kusur Durumu
  
  // Maliyet & Kalemler
  parts: AutoPartItem[];
  labors: AutoLaborItem[];
  partsTotal: number;
  laborTotal: number;
  totalVat: number;
  grandTotal: number;
  discountAmount?: number;
  isApprovedByCustomer: boolean;
  approvalMethod?: "whatsapp" | "sms" | "phone_call" | "in_person" | "email";
  approvalDate?: string;
  
  // AI Yardımcı Çıktıları
  aiOutputs?: AutoAiOutputs;
  
  invoiceId?: string; // Bağlı Fatura ID (Faturalandırıldıysa)
  invoiceNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// ==========================================
// 💻 BİLİŞİM & BİLGİSAYAR / BT TEKNİK SERVİS MODÜLÜ TİPLERİ
// ==========================================

export type ItDeviceType =
  | "laptop"
  | "desktop"
  | "macbook"
  | "imac"
  | "server"
  | "workstation"
  | "tablet"
  | "smartphone"
  | "printer"
  | "network_device"
  | "storage_nas"
  | "other";

export type ItServiceStatus =
  | "reception" // Cihaz Kabul
  | "diagnosing" // Arıza Teşhisi / Ön Değerlendirme
  | "quote_pending" // Maliyet Onayı Bekliyor
  | "parts_ordered" // Parça / Donanım Bekleniyor
  | "repairing" // Onarımda / Kurulumda / Montajda
  | "testing" // Kararlılık & Donanım Testinde (Stres Testi, MemTest vb.)
  | "ready" // Hazır / Teslime Hazır
  | "delivered" // Teslim Edildi & Garantilendi
  | "cancelled"; // İptal / İade

export interface ItPartItem {
  id: string;
  partCode?: string;
  partName: string; // ör: "Kingston 1TB NVMe M.2 SSD", "Corsair 16GB DDR5 5600MHz", "MacBook Pro Retina Ekran Paneli"
  category: "ssd_hdd" | "ram" | "motherboard" | "screen" | "battery" | "cooling_fan" | "gpu" | "power_supply" | "software_license" | "other";
  quantity: number;
  unitPrice: number;
  vatRate: number;
  total: number;
  warrantyMonths?: number;
}

export interface ItLaborItem {
  id: string;
  operationName: string; // ör: "İşletim Sistemi Kurulumu & Sürücü Yapılandırması", "Termal Macun Yenileme & Fan Bakımı", "BGA Çip Onarımı / Reballing", "Veri Kurtarma"
  technicianName?: string;
  hours: number;
  hourlyRate: number;
  vatRate: number;
  total: number;
}

export interface ItAiOutputs {
  // 1. BT / Donanım Arıza Ön Değerlendirme Raporu
  preEvaluation?: {
    customerNotice: string;
    faultSummary: string; // Arıza Özeti
    possibleCauses: string; // Olası Nedenler (Donanımsal / Yazılımsal)
    dataSecurityRisk: "Düşük" | "Orta" | "Kritik" | string; // Veri Güvenliği Riski
    estimatedStepsAndDuration: string; // Tahmini Çözüm Adımları ve Süresi
    generatedAt?: string;
  };
  // 2. Adım Adım Sorun Giderme (Troubleshooting) Rehberi
  troubleshootingGuide?: {
    deviceInfo: string;
    issue: string;
    guideText: string;
    generatedAt?: string;
  };
  // 3. Donanım/Yazılım Onarım Maliyet Onay Metni
  costApprovalMessage?: {
    messageText: string;
    dataBackupNoteIncluded: boolean;
    generatedAt?: string;
  };
  // 4. Teknik Terimleri İçermeyen Müşteri Bilgilendirme E-postası
  customerEmail?: {
    rawTechReport: string;
    subject: string;
    emailBody: string;
    twoTips: string[];
    generatedAt?: string;
  };
}

export interface ItServiceRecord {
  id: string;
  serviceNo: string; // ör: "IT-2026-0042"
  deviceType: ItDeviceType;
  brand: string; // Asus, Dell, Lenovo, Apple, HP, MSI, Acer, Cisco vb.
  model: string; // ZenBook 14, MacBook Pro M2, ThinkPad T14, PowerEdge R740
  serialNumber?: string; // Cihaz Seri No / Service Tag
  devicePasswordPin?: string; // Windows / BIOS / Kullanıcı Şifresi (Varsa)
  hasChargerIncluded: boolean; // Adaptör / Şarj Cihazı Alındı mı?
  accessoriesIncluded?: string; // Çanta, Fare, Harici Disk vb.
  accessoriesReceived?: string; // Beraberinde Teslim Alınan Aksesuarlar (Şarj adaptörü, kablo, çanta, dongle vb.)
  damagePhysicalCondition?: string; // Cihaz Kasa/Ekran Çizik, Kırık, Deformasyon & Fiziksel Durumu
  
  dataBackupStatus: "backup_taken" | "not_needed" | "critical_risk_approved" | "recovery_requested"; // Veri Durumu
  dataBackupNotes?: string;
  
  contactId?: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  
  entryDate: string;
  entryTime?: string;
  estimatedCompletionDate?: string;
  actualCompletionDate?: string;
  status: ItServiceStatus;
  
  // Şikayet & Teşhis
  customerProblemDescription: string; // Müşteri Bildirimi
  technicianReport?: string; // Teknisyen Arıza Tespiti & Analizi
  assignedTechnician?: string;
  
  // Maliyet & Kalemler
  parts: ItPartItem[];
  labors: ItLaborItem[];
  partsTotal: number;
  laborTotal: number;
  totalVat: number;
  grandTotal: number;
  discountAmount?: number;
  isApprovedByCustomer: boolean;
  approvalDate?: string;
  
  // AI Destek Çıktıları
  aiOutputs?: ItAiOutputs;
  
  invoiceId?: string;
  invoiceNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// ==========================================
// 🧺 BEYAZ EŞYA, KÜÇÜK EV ALETLERİ & İKLİMLENDİRME (KLİMA / KOMBİ) SERVİS TİPLERİ
// ==========================================

export type ApplianceCategory =
  | "major_appliance" // Beyaz Eşya (Buzdolabı, Çamaşır, Bulaşık, Fırın vb.)
  | "hvac_climate" // İklimlendirme & Isıtma (Klima, Kombi, Şofben, Termosifon vb.)
  | "small_appliance" // Küçük Ev / El Aletleri (Kahve Makinesi, Süpürge, Blender, Robot vb.)
  | "other_appliance"; // Diğer

export type ApplianceDeviceType =
  // Beyaz Eşya
  | "refrigerator" // Buzdolabı
  | "freezer" // Derin Dondurucu
  | "washing_machine" // Çamaşır Makinesi
  | "dryer" // Kurutma Makinesi
  | "dishwasher" // Bulaşık Makinesi
  | "oven" // Fırın
  | "cooktop_hob" // Ocak
  | "range_hood" // Davlumbaz / Aspiratör
  // İklimlendirme
  | "air_conditioner_split" // Split Duvar Tipi Klima
  | "air_conditioner_vrf" // VRF / Kaset / Kanal Tipi Klima
  | "boiler_combi" // Kombi (Yoğuşmalı / Konvansiyonel)
  | "water_heater" // Şofben / Termosifon
  | "heat_pump" // Isı Pompası
  // Küçük Ev & Mutfak Aletleri
  | "coffee_machine" // Kahve / Espresso Makinesi
  | "vacuum_cleaner" // Elektrikli / Dikey Süpürge
  | "robot_vacuum" // Robot Süpürge
  | "blender_food_processor" // Blender / Mutfak Robotu
  | "toaster_grill" // Tost Makinesi / Elektrikli Izgara
  | "microwave_oven" // Mikrodalga Fırın
  | "steam_iron" // Ütü / Buhar Kazanlı Ütü
  | "airfryer_fryer" // Airfryer / Sıcak Hava Fritözü
  | "kettle_tea_maker" // Çay Makinesi / Su Isıtıcı
  | "other";

export type ApplianceServiceLocation = "on_site" | "workshop"; // Sahada / Müşteri Adresinde veya Atölyede

export type ApplianceServiceStatus =
  | "reception" // Servis Kaydı Alındı / Randevu Oluşturuldu
  | "assigned" // Teknisyene / Saha Ekibine Atandı
  | "on_the_way" // Sahada / Yolda
  | "diagnosing" // Arıza Teşhisi & Ölçüm
  | "quote_pending" // Teklif / Müşteri Onayı Bekliyor
  | "parts_ordered" // Yedek Parça Bekleniyor
  | "repairing" // Onarım / Montaj / Parça Değişimi
  | "testing_qc" // Test, Gaz/Sızdırmazlık & Hijyen Kontrolü
  | "ready_delivered" // Tamamlandı & Teslim Edildi
  | "cancelled"; // İptal / İade

export interface AppliancePartItem {
  id: string;
  partCode?: string;
  partName: string; // ör: "NTC Sıcaklık Sensörü", "İnverter Kompresör", "Drenaj Pompası", "Kazan Rulman & Keçe Takımı", "DeLonghi 15 Bar Titreşim Pompası", "Defrost Rezistansı"
  category:
    | "thermostat_sensor" // Termostat & Sensör
    | "resistance_heating" // Rezistans & Isıtıcı
    | "pump_motor" // Pompa & Motor
    | "gasket_seal" // Conta, Keçe & Körük
    | "compressor_gas" // Kompresör, Gaz & Valf
    | "electronic_board" // Elektronik Kart & Ekran
    | "filter_boiler" // Filtre, Eşanjör & Kazan
    | "gear_mechanical" // Dişli, Bıçak & Mekanik
    | "other";
  quantity: number;
  unitPrice: number;
  vatRate: number;
  total: number;
  warrantyMonths?: number; // Parça Garanti Süresi (Ay)
}

export interface ApplianceLaborItem {
  id: string;
  operationName: string; // ör: "Kombi Yıllık Periyodik Bakımı & Yanma Odası Temizliği", "Klima Gaz Dolumu (R32 / R410A) & Vakum", "Kazan Rulman Değişimi", "Espresso Makinesi Kireç Temizliği & Pompa Revizyonu"
  technicianName?: string;
  hours: number;
  hourlyRate: number;
  vatRate: number;
  total: number;
}

export interface ApplianceAiOutputs {
  // 1. Kapsamlı Saha ve Servis Operasyon Kontrol Listesi
  fieldChecklist?: {
    faultAnalysis: string; // Arıza Analizi ve Olası Nedenler
    requiredPartsAndSupplies: string; // Yanında Bulundurulması Gereken Yedek Parça ve Sarf Malzemeleri
    requiredToolsAndEquipment: string; // Gerekli El Aletleri ve Test Ekipmanları
    safetyAndHygieneRules: string; // Güvenlik ve Hijyen Kuralları
    formattedText?: string;
    generatedAt?: string;
  };
  // 2. Müşteri Fiyat ve İşlem Onay Mesajı
  costApprovalMessage?: {
    messageText: string;
    generatedAt?: string;
  };
  // 3. Bakım & Teslimat Bilgilendirme Raporu
  completionReport?: {
    subject: string;
    summary: string;
    maintenanceTips: string[];
    generatedAt?: string;
  };
}

export interface ApplianceServiceRecord {
  id: string;
  serviceNo: string; // ör: "SRV-2026-0105"
  category: ApplianceCategory;
  deviceType: ApplianceDeviceType;
  brand: string; // Bosch, Arçelik, Beko, Daikin, DemirDöküm, Vaillant, De'Longhi, Philips, Dyson, Roborock vb.
  model: string; // Serie 6 EcoSilence, Sensira 12000 BTU, Nitromix P28, Magnifica S, V15 Detect
  serialNumber?: string; // Seri No / Barkod
  serviceLocation: ApplianceServiceLocation; // "on_site" (Saha) | "workshop" (Atölye)
  
  // Saha / Müşteri Adres ve İletişim Bilgileri
  contactId?: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  serviceAddress: string; // Müşteri Montaj / Servis Adresi
  city?: string;
  district?: string;
  
  appointmentDate?: string; // Randevu Tarihi
  appointmentTimeSlot?: string; // ör: "10:00 - 12:00"
  entryDate: string;
  entryTime?: string;
  completionDate?: string;
  status: ApplianceServiceStatus;
  
  // Şikayet & Teknik Bulgular
  customerProblemDescription: string; // Müşterinin Bildirdiği Sorun
  technicianReport?: string; // Teknisyen Arıza Analizi & Uygulanan İşlem
  assignedTechnician?: string; // Görevli Saha / Atölye Teknisyeni
  accessoriesReceived?: string; // Beraberinde Teslim Alınanlar (Uzaktan Kumanda, Şarj İstasyonu/Adaptörü, Güç Kablosu, Filtre, Boru, Aparatlar vb.)
  damagePhysicalCondition?: string; // Ürün Gövde Çizik, Kırık, Sararma, Deformasyon & Fiziksel Kusur Durumu
  
  // Cihaz Teknik Detayları (Opsiyonel / İklimlendirme - Gaz)
  gasType?: "R32" | "R410A" | "R134a" | "R600a" | "R290" | "none"; // Gaz Türü
  pressureBar?: number; // Basınç Değeri (Bar)
  voltageTested?: number; // Voltaj Ölçümü (Volt)
  isWarrantyActive?: boolean; // Garanti Kapsamında mı?
  
  // Maliyet & Kalemler
  parts: AppliancePartItem[];
  labors: ApplianceLaborItem[];
  partsTotal: number;
  laborTotal: number;
  totalVat: number;
  grandTotal: number;
  discountAmount?: number;
  isApprovedByCustomer: boolean;
  approvalDate?: string;
  
  // AI Destek Çıktıları
  aiOutputs?: ApplianceAiOutputs;
  
  invoiceId?: string;
  invoiceNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface WhatsAppTemplate {
  id: string;
  title: string;
  category: "invoice" | "quote" | "order" | "waybill" | "collection" | "hr" | "service" | "stock" | "custom" | string;
  text: string;
  shortcut?: string;
  description?: string;
  isFavorite?: boolean;
  isCustom?: boolean;
  variables?: string[];
  usageCount?: number;
  lastUsedAt?: string;
  createdAt?: string;
}




