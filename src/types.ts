export type ContactType = "customer" | "vendor" | "both";

export interface Contact {
  id: string;
  accountCode?: string; // Cari Hesap Kodu (Alıcılar: 120.VKN, Satıcılar: 320.VKN)
  name: string; // Şahıs veya Şirket Ünvanı
  companyTitle?: string;
  contactType: ContactType;
  taxOffice?: string; // Vergi Dairesi
  taxNumber?: string; // VKN / TCKN
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  district?: string; // İlçe
  neighborhood?: string; // Mahalle
  street?: string; // Cadde / Sokak
  balance: number; // Pozitif: Alacaklıyız (Müşteri bize borçlu), Negatif: Borçluyuz (Tedarikçiye borcumuz var)
  balanceType: "receivable" | "payable" | "balanced";
  notes?: string;
  createdAt: string;
}

export function getContactAccountCode(contact: Partial<Contact>): string {
  if (contact.accountCode && contact.accountCode.trim()) {
    return contact.accountCode.trim();
  }
  const prefix = contact.contactType === "vendor" ? "320" : "120";
  const taxNum = contact.taxNumber && contact.taxNumber.trim() ? contact.taxNumber.trim() : "0000000000";
  return `${prefix}.${taxNum}`;
}

export const EXPENSE_CATEGORIES = [
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

export interface InvoiceItem {
  id: string;
  productId?: string;
  expenseCategory?: string; // Masraf / Gider Kalemi (Yemek ve ulaşım, Kira ödemeleri, vb.)
  description: string;
  quantity: number;
  unit: string; // Adet, Saat, Ay, Kg, vb.
  unitPrice: number;
  vatRate: number; // 0, 1, 10, 20
  withholdingRate?: number; // Tevkifat Oranı (ör: 0, 0.2, 0.5 - 5/10, 0.7 - 7/10, 1)
  totalWithoutVat: number;
  vatAmount: number;
  totalWithVat: number;
}

export type InvoiceType = "sales" | "purchase"; // Satış Faturası / Alış Faturası
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
  | "unknown"
  | string;

export interface MysoftEDocument {
  id: string;
  companyId?: string;
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
}

export interface MysoftCredentials {
  tenantIdentifierNumber?: string;
}

export type DocumentKind = "invoice" | "receipt"; // invoice = Fatura, receipt = Fiş (Gelir/Gider Fişi)

export interface Invoice {
  id: string;
  invoiceNumber: string; // ör: GIB20260000001
  type: InvoiceType;
  docKind?: DocumentKind; // "invoice" = Gelir/Gider Faturası, "receipt" = Gelir/Gider Fişi
  expenseCategory?: string; // Ana Masraf / Gider Kalemi
  contactId: string;
  contactName: string;
  taxNumber?: string;
  issueDate: string; // Fatura Tarihi
  dueDate: string; // Son Ödeme Tarihi
  items: InvoiceItem[];
  subtotal: number; // KDV Hariç Ara Toplam
  totalVat: number; // Toplam KDV
  totalWithholding?: number; // Toplam Tevkifat
  grandTotal: number; // Genel Toplam
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

export type AccountType = "cash" | "bank" | "credit_card";

export interface Account {
  id: string;
  name: string; // ör: Merkez TL Kasası, Garanti Ticari TL, Ziraat USD
  type: AccountType;
  currency: string; // TRY, USD, EUR
  balance: number;
  accountNumber?: string;
  iban?: string;
  bankName?: string;
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
  vatRate: number; // 1, 10, 20
  stockQuantity: number;
  minStockAlert?: number;
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

export type QuoteStatus = "draft" | "sent" | "approved" | "rejected" | "converted";

export interface Quote {
  id: string;
  quoteNumber: string;
  contactId: string;
  contactName: string;
  issueDate: string;
  validUntil: string;
  items: InvoiceItem[];
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
  eDevletPassword?: string;      // e-Devlet Şifresi
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
  companyTitle: string;
  taxOffice: string;
  taxNumber: string;
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
  documentType: "Fatura" | "Tahsilat" | "Tediye" | "Dekont" | "Devir";
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
  fullName: string;
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
  foodAllowance?: number;
  roadAllowance?: number;
  hasBes?: boolean; // BES Katılımı (%3)
  sgkOccupationCode?: string; // SGK Meslek Kodu
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
  startDate: string;
  endDate: string;
  daysCount: number;
  status: "approved" | "pending" | "rejected";
  reason?: string;
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
  monthlyDeduction?: number;
  monthlyAmount?: number;
  paidAmount: number;
  remainingAmount?: number;
  creditorTitle?: string;
  creditorName?: string;
  fileNumber?: string;
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
  vehiclePlate?: string; // Araç Plakası (ör: 34 ABC 123)
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


