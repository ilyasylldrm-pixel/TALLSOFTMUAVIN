export type ContactType = "customer" | "vendor" | "both";

export interface Contact {
  id: string;
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

export interface InvoiceItem {
  id: string;
  productId?: string;
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

export interface Invoice {
  id: string;
  invoiceNumber: string; // ör: GIB20260000001
  type: InvoiceType;
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

export interface SgkCredentials {
  userCode?: string;               // SGK e-Bildirge Kullanıcı Kodu
  systemPassword?: string;         // Sistem Şifresi
  workplacePassword?: string;      // İşyeri Şifresi
  workplaceRegistrationNo?: string; // SGK İşyeri Sicil / Tescil No
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
  type: "Avans" | "Masraf" | "Prim";
  amount: number;
  requestDate: string;
  description: string;
  status: "paid" | "approved" | "pending" | "rejected";
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


