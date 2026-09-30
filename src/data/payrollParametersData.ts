// Resmi Güncel Bordro ve Yasal Kesinti Parametreleri Veritabanı (2025 - 2026)
import { safeGetStorageItem, safeSetStorageItem } from "../utils/storage";

export interface CottGroupSocialSecurity {
  employeeSgkRate: number; // %14
  employerSgkRate: number; // %20.5 Standart İşveren Payı
  employeeUnemploymentRate: number; // %1
  employerUnemploymentRate: number; // %2
  employerDiscountRate: number; // %5 (5510 Sayılı Kanun %5 Hazine İndirimi)
  employerMfgDiscountRate?: number; // Opsiyonel İmalat Sektörü İndirimi
  dailySgkFloor: number; // 1.101,00 TL
  dailySgkCeiling: number; // 9.909,00 TL
  monthlySgkFloor: number; // 33.030,00 TL
  monthlySgkCeiling: number; // 297.270,00 TL
}

export interface CottGroupTaxBracket {
  bracketId: number;
  label: string;
  fromLimit: number;
  toLimit: number; // Infinity if top bracket
  rate: number; // 0.15, 0.20, 0.27, 0.35, 0.40
  rateLabel: string;
  baseTaxAmount: number;
  formulaDescription: string;
}

export interface CottGroupMonthlyExemption {
  month: string;
  grossMinWage?: number; // 33.030,00 TL
  sgkEmployeeDeduction?: number; // 4.954,50 TL
  incomeTaxBase?: number; // 28.075,50 TL
  cumulativeTaxBase?: number; // Kümülatif Matrah
  incomeTaxExemption: number;
  stampTaxExemption: number;
}

export interface PayrollYearlyParameters {
  year: number;
  periodLabel: string;
  effectiveDate: string;
  referenceUrl?: string;
  
  // Asgari Ücret Parametreleri
  grossMinWage: number; // Brüt Asgari Ücret (2026: 33.030,00 ₺)
  netMinWage: number; // Net Asgari Ücret (Bekar: 28.075,50 ₺)
  minWageTaxExemption: number; // Aylık Asgari Ücret Gelir Vergisi İstisnası (4.211,33 ₺)
  minWageStampTaxExemption: number; // Aylık Asgari Ücret Damga Vergisi İstisnası (250,70 ₺)
  
  // SGK Tavan ve Tabanı
  sgkBaseFloor: number; // SGK Tabanı (33.030,00 ₺)
  sgkBaseCeiling: number; // SGK Tavanı (297.270,00 ₺)
  dailyMinWage: number; // Günlük brüt asgari ücret (1.101,00 ₺)
  
  // Prim Oranları
  sgkEmployeeRate: number; // SGK İşçi Payı (%14)
  unemploymentEmployeeRate: number; // İşsizlik İşçi Payı (%1)
  sgkEmployerStandardRate: number; // SGK İşveren Standart Payı (%20.5)
  sgkEmployerDiscountedRate: number; // SGK İşveren 5 Puan İndirimli Payı (%15.5)
  unemploymentEmployerRate: number; // İşsizlik İşveren Payı (%2)
  shortTermRiskRate: number; // Kısa Vadeli Sigorta Kolları Primi (%2.25)
  
  // Emekli Çalışan Kesinti Oranları (SGDP - Sosyal Güvenlik Destek Primi)
  sgdpEmployeeRate?: number; // Emekli SGDP İşçi Payı (%7.5)
  sgdpEmployerRate?: number; // Emekli SGDP İşveren Payı (%24.5 - Kısa vadeli sigorta kolları dahil)
  sgdpUnemploymentRate?: number; // Emekli İşsizlik Sigortası Payı (%0 - Emekliler işsizlik sigortasına tabi değildir)
  
  // Vergi ve Fon Kesintileri
  stampTaxRate: number; // Damga Vergisi Binde Oranı (0.00759 -> %0.759)
  besAutoEnrollmentRate: number; // BES Otomatik Katılım Payı (%3)
  
  // Gelir Vergisi Dilimleri (Ücret Gelirleri İçin)
  taxBrackets: {
    bracket: string;
    limit: number; // Dilim tavanı
    rate: number; // Vergi oranı (örn: 0.15, 0.20, 0.27, 0.35, 0.40)
    rateLabel: string;
  }[];

  // 1) CottGroup Sosyal Güvenlik Yükümlülüğü Detayları
  cottGroupSocialSecurity?: CottGroupSocialSecurity;

  // 2) CottGroup Ücretliler Gelir Vergisi Tarifesi (2026)
  cottGroupWageTaxTariff?: CottGroupTaxBracket[];

  // 3) CottGroup Ücret Dışındaki Gelirler Gelir Vergisi Tarifesi (2026)
  cottGroupNonWageTaxTariff?: CottGroupTaxBracket[];

  // 4) CottGroup 2026 Asgari Ücret Aylık Vergi İstisnaları (12 Ay)
  cottGroupMonthlyExemptions?: CottGroupMonthlyExemption[];

  // İstisna ve Muafiyet Hadleri (Günlük / Aylık)
  dailyFoodExemptionLimit: number; // Nakit yemek bedeli günlük SGK/Vergi istisna tutarı (300,00 TL)
  dailyRoadExemptionLimit: number; // Toplu taşıma / yol parası günlük vergi istisna tutarı (158,00 TL)
  childAllowanceExemption: number; // Çocuk zammı SGK istisna tutarı (660,60 TL)
  familyAllowanceExemption: number; // Aile zammı SGK istisna tutarı (3.303,00 TL)
  
  // Engellilik İndirimleri
  disabilityFirstDegree?: number; // 12.000,00 TL
  disabilitySecondDegree?: number; // 7.000,00 TL
  disabilityThirdDegree?: number; // 3.000,00 TL

  // Kıdem Tazminatı Tavanı
  severanceCeilingH1: number; // Yılın ilk 6 ayı kıdem tazminatı tavanı (64.948,77 TL)
  severanceCeilingH2: number; // Yılın ikinci 6 ayı kıdem tazminatı tavanı (73.729,87 TL)
  
  // Resmi Açıklamalar ve Yasal Dayanaklar
  legalNotice: string;

  // Zaman Damgası ve Denetim Bilgisi
  lastUpdated?: string;
  updatedBy?: string;
  parameterAudit?: Record<string, {
    updatedAt: string;
    updatedBy: string;
    previousValue?: string | number;
    newValue?: string | number;
  }>;
}

export const COTTGROUP_WAGE_TAX_TARIFF_2026: CottGroupTaxBracket[] = [
  {
    bracketId: 1,
    label: "1. Dilim (0 - 158.000,00 TL)",
    fromLimit: 0,
    toLimit: 158000,
    rate: 0.15,
    rateLabel: "%15",
    baseTaxAmount: 0,
    formulaDescription: "158.000,00 TL'ye kadar %15",
  },
  {
    bracketId: 2,
    label: "2. Dilim (158.001,00 – 330.000,00 TL)",
    fromLimit: 158000,
    toLimit: 330000,
    rate: 0.20,
    rateLabel: "%20",
    baseTaxAmount: 23700,
    formulaDescription: "158.000,00 TL için 23.700,00 TL, fazlası %20",
  },
  {
    bracketId: 3,
    label: "3. Dilim (330.001,00 – 800.000,00 TL)",
    fromLimit: 330000,
    toLimit: 800000,
    rate: 0.27,
    rateLabel: "%27",
    baseTaxAmount: 58100,
    formulaDescription: "330.000,00 TL için 58.100,00 TL, fazlası %27",
  },
  {
    bracketId: 4,
    label: "4. Dilim (800.001,00 – 4.300.000,00 TL)",
    fromLimit: 800000,
    toLimit: 4300000,
    rate: 0.35,
    rateLabel: "%35",
    baseTaxAmount: 185000,
    formulaDescription: "800.000,00 TL için 185.000,00 TL, fazlası %35",
  },
  {
    bracketId: 5,
    label: "5. Dilim (4.300.001,00 TL ve üzeri)",
    fromLimit: 4300000,
    toLimit: Infinity,
    rate: 0.40,
    rateLabel: "%40",
    baseTaxAmount: 1410000,
    formulaDescription: "4.300.000,00 TL için 1.410.000,00 TL, fazlası %40",
  },
];

export const COTTGROUP_NON_WAGE_TAX_TARIFF_2026: CottGroupTaxBracket[] = [
  {
    bracketId: 1,
    label: "1. Dilim (0 - 158.000,00 TL)",
    fromLimit: 0,
    toLimit: 158000,
    rate: 0.15,
    rateLabel: "%15",
    baseTaxAmount: 0,
    formulaDescription: "158.000,00 TL'ye kadar %15",
  },
  {
    bracketId: 2,
    label: "2. Dilim (158.001,00 – 380.000,00 TL)",
    fromLimit: 158000,
    toLimit: 380000,
    rate: 0.20,
    rateLabel: "%20",
    baseTaxAmount: 23700,
    formulaDescription: "158.000,00 TL için 23.700,00 TL, fazlası %20",
  },
  {
    bracketId: 3,
    label: "3. Dilim (380.001,00 – 1.300.000,00 TL)",
    fromLimit: 380000,
    toLimit: 1300000,
    rate: 0.27,
    rateLabel: "%27",
    baseTaxAmount: 68100,
    formulaDescription: "380.000,00 TL için 68.100,00 TL, fazlası %27",
  },
  {
    bracketId: 4,
    label: "4. Dilim (1.300.001,00 – 4.300.000,00 TL)",
    fromLimit: 1300000,
    toLimit: 4300000,
    rate: 0.35,
    rateLabel: "%35",
    baseTaxAmount: 316500,
    formulaDescription: "1.300.000,00 TL için 316.500,00 TL, fazlası %35",
  },
  {
    bracketId: 5,
    label: "5. Dilim (4.300.001,00 TL ve üzeri)",
    fromLimit: 4300000,
    toLimit: Infinity,
    rate: 0.40,
    rateLabel: "%40",
    baseTaxAmount: 1366500,
    formulaDescription: "4.300.000,00 TL için 1.366.500,00 TL, fazlası %40",
  },
];

export const COTTGROUP_MONTHLY_EXEMPTIONS_2026: CottGroupMonthlyExemption[] = [
  { month: "Ocak", grossMinWage: 33030.00, sgkEmployeeDeduction: 4954.50, incomeTaxBase: 28075.50, cumulativeTaxBase: 28075.50, incomeTaxExemption: 4211.33, stampTaxExemption: 250.70 },
  { month: "Şubat", grossMinWage: 33030.00, sgkEmployeeDeduction: 4954.50, incomeTaxBase: 28075.50, cumulativeTaxBase: 56151.00, incomeTaxExemption: 4211.33, stampTaxExemption: 250.70 },
  { month: "Mart", grossMinWage: 33030.00, sgkEmployeeDeduction: 4954.50, incomeTaxBase: 28075.50, cumulativeTaxBase: 84226.50, incomeTaxExemption: 4211.33, stampTaxExemption: 250.70 },
  { month: "Nisan", grossMinWage: 33030.00, sgkEmployeeDeduction: 4954.50, incomeTaxBase: 28075.50, cumulativeTaxBase: 112302.00, incomeTaxExemption: 4211.33, stampTaxExemption: 250.70 },
  { month: "Mayıs", grossMinWage: 33030.00, sgkEmployeeDeduction: 4954.50, incomeTaxBase: 28075.50, cumulativeTaxBase: 140377.50, incomeTaxExemption: 4211.33, stampTaxExemption: 250.70 },
  { month: "Haziran", grossMinWage: 33030.00, sgkEmployeeDeduction: 4954.50, incomeTaxBase: 28075.50, cumulativeTaxBase: 168453.00, incomeTaxExemption: 4606.53, stampTaxExemption: 250.70 },
  { month: "Temmuz", grossMinWage: 33030.00, sgkEmployeeDeduction: 4954.50, incomeTaxBase: 28075.50, cumulativeTaxBase: 196528.50, incomeTaxExemption: 5615.10, stampTaxExemption: 250.70 },
  { month: "Ağustos", grossMinWage: 33030.00, sgkEmployeeDeduction: 4954.50, incomeTaxBase: 28075.50, cumulativeTaxBase: 224604.00, incomeTaxExemption: 5615.10, stampTaxExemption: 250.70 },
  { month: "Eylül", grossMinWage: 33030.00, sgkEmployeeDeduction: 4954.50, incomeTaxBase: 28075.50, cumulativeTaxBase: 252679.50, incomeTaxExemption: 5615.10, stampTaxExemption: 250.70 },
  { month: "Ekim", grossMinWage: 33030.00, sgkEmployeeDeduction: 4954.50, incomeTaxBase: 28075.50, cumulativeTaxBase: 280755.00, incomeTaxExemption: 5615.10, stampTaxExemption: 250.70 },
  { month: "Kasım", grossMinWage: 33030.00, sgkEmployeeDeduction: 4954.50, incomeTaxBase: 28075.50, cumulativeTaxBase: 308830.50, incomeTaxExemption: 5615.10, stampTaxExemption: 250.70 },
  { month: "Aralık", grossMinWage: 33030.00, sgkEmployeeDeduction: 4954.50, incomeTaxBase: 28075.50, cumulativeTaxBase: 336906.00, incomeTaxExemption: 5864.28, stampTaxExemption: 250.70 },
];

export const CURRENT_PAYROLL_PARAMS_2026: PayrollYearlyParameters = {
  year: 2026,
  periodLabel: "2026 Yılı Güncel Bordro Parametreleri (Kanuni Değerler)",
  effectiveDate: "01.01.2026 - 31.12.2026",
  referenceUrl: "https://www.mevzuat.gov.tr",
  
  grossMinWage: 33030.00, // 2026 Brüt Asgari Ücret
  netMinWage: 28075.50, // Net Ele Geçen Asgari Ücret
  minWageTaxExemption: 4211.33, // 2026 Asgari Ücret Gelir Vergisi İstisna Tutarı (Ocak-Mayıs)
  minWageStampTaxExemption: 250.70, // Damga Vergisi İstisnası (33.030,00 * 0,00759 = 250,70 ₺)
  
  sgkBaseFloor: 33030.00,
  sgkBaseCeiling: 297270.00, // 2026 SGK Tavanı (Aylık)
  dailyMinWage: 1101.00, // Günlük SGK Tabanı (33.030 / 30)
  
  sgkEmployeeRate: 0.14, // %14
  unemploymentEmployeeRate: 0.01, // %1
  sgkEmployerStandardRate: 0.205, // İşveren Standart SGK Katkı Payı (%20,5)
  sgkEmployerDiscountedRate: 0.155, // 5510 Sayılı Kanun %5 Hazine İndirimli Payı (%15,5)
  unemploymentEmployerRate: 0.02, // %2
  shortTermRiskRate: 0.0225,
  
  // Emekli Çalışan Kesinti Oranları (SGDP)
  sgdpEmployeeRate: 0.075, // Emekli SGDP İşçi Payı (%7.5)
  sgdpEmployerRate: 0.245, // Emekli SGDP İşveren Payı (%24.5 - %22.25 SGDP + %2.25 KVSK)
  sgdpUnemploymentRate: 0.0, // Emekli İşsizlik Sigortası Payı (%0)
  
  stampTaxRate: 0.00759,
  besAutoEnrollmentRate: 0.03,
  
  taxBrackets: [
    { bracket: "1. Dilim (0 - 158.000 ₺)", limit: 158000, rate: 0.15, rateLabel: "%15" },
    { bracket: "2. Dilim (158.001 ₺ - 330.000 ₺)", limit: 330000, rate: 0.20, rateLabel: "%20" },
    { bracket: "3. Dilim (330.001 ₺ - 800.000 ₺)", limit: 800000, rate: 0.27, rateLabel: "%27" },
    { bracket: "4. Dilim (800.001 ₺ - 4.300.000 ₺)", limit: 4300000, rate: 0.35, rateLabel: "%35" },
    { bracket: "5. Dilim (4.300.001 ₺ üzeri)", limit: Infinity, rate: 0.40, rateLabel: "%40" },
  ],

  // 1) CottGroup Sosyal Güvenlik Yükümlülüğü (Standart %20,5 / 5510 S.K. %5 Hazine İndirimli %15,5)
  cottGroupSocialSecurity: {
    employeeSgkRate: 0.14,
    employerSgkRate: 0.205,
    employeeUnemploymentRate: 0.01,
    employerUnemploymentRate: 0.02,
    employerDiscountRate: 0.05, // 5510 Sayılı Kanun %5 Hazine İndirimi
    employerMfgDiscountRate: 0.05,
    monthlySgkFloor: 33030.00,
    monthlySgkCeiling: 297270.00,
    dailySgkFloor: 1101.00,
    dailySgkCeiling: 9909.00,
  },

  // 2) Ücretliler İçin Uygulanacak 2026 Yılı Gelir Vergisi Tarifesi
  cottGroupWageTaxTariff: COTTGROUP_WAGE_TAX_TARIFF_2026,

  // 3) Ücret Dışındaki Gelirler İçin Uygulanacak 2026 Yılı Gelir Vergisi Tarifesi
  cottGroupNonWageTaxTariff: COTTGROUP_NON_WAGE_TAX_TARIFF_2026,

  // 4) 2026 Asgari Ücret Vergi İstisnaları (12 Ay)
  cottGroupMonthlyExemptions: COTTGROUP_MONTHLY_EXEMPTIONS_2026,
  
  dailyFoodExemptionLimit: 300.00, // Günlük nakit yemek bedeli istisnası (KDV hariç)
  dailyRoadExemptionLimit: 158.00, // Günlük ulaşım istisnası
  childAllowanceExemption: 660.60, // Brüt asgari ücretin %2'si (çocuk başına)
  familyAllowanceExemption: 3303.00, // Brüt asgari ücretin %10'u
  
  disabilityFirstDegree: 12000.00,
  disabilitySecondDegree: 7000.00,
  disabilityThirdDegree: 3000.00,

  severanceCeilingH1: 64948.77,
  severanceCeilingH2: 73729.87,
  
  legalNotice: "Resmi Mevzuat Portalı (2026 Yılı İçin Bordrodaki Yasal Kesintiler), 4857 Sayılı İş Kanunu, 5510 Sayılı SSGSSK ve 193 Sayılı GVK 332 Sıra No'lu Genel Tebliği hükümlerine göre hazırlanmıştır.",
  lastUpdated: "2026-01-02T09:00:00.000Z",
  updatedBy: "Sistem Yöneticisi (Resmi Gazete & Mevzuat)",
  parameterAudit: {
    grossMinWage: {
      updatedAt: "2026-01-02T09:00:00.000Z",
      updatedBy: "Sistem Yöneticisi (Resmi Mevzuat)",
      previousValue: "26.005,50 ₺",
      newValue: "33.030,00 ₺",
    },
    sgkBaseCeiling: {
      updatedAt: "2026-01-02T09:00:00.000Z",
      updatedBy: "Sistem Yöneticisi (Resmi Mevzuat)",
      previousValue: "195.041,25 ₺",
      newValue: "297.270,00 ₺",
    },
    dailyFoodExemptionLimit: {
      updatedAt: "2026-01-02T09:00:00.000Z",
      updatedBy: "Sistem Yöneticisi (Resmi Mevzuat)",
      previousValue: "220,00 ₺",
      newValue: "300,00 ₺",
    },
  },
};

export const OFFICIAL_PAYROLL_PARAMS_2025: PayrollYearlyParameters = {
  year: 2025,
  periodLabel: "2025 Yılı Resmi Bordro Parametreleri",
  effectiveDate: "01.01.2025 - 31.12.2025",
  lastUpdated: "2025-01-01T08:30:00.000Z",
  updatedBy: "Mevzuat ve Bordro Uzmanı",
  parameterAudit: {},
  
  grossMinWage: 26005.50, // 2025 Resmi Brüt Asgari Ücret
  netMinWage: 22104.67, // Net Ele Geçen Asgari Ücret
  minWageTaxExemption: 3315.70, // Asgari Ücret Gelir Vergisi İstisnası
  minWageStampTaxExemption: 197.38, // Damga Vergisi İstisnası (26.005,50 * 0,00759)
  
  sgkBaseFloor: 26005.50,
  sgkBaseCeiling: 195041.25, // 26.005,50 x 7.5
  dailyMinWage: 866.85,
  
  sgkEmployeeRate: 0.14,
  unemploymentEmployeeRate: 0.01,
  sgkEmployerStandardRate: 0.205,
  sgkEmployerDiscountedRate: 0.155, // 5510 S.K. 81/ı maddesi 5 puan indirim
  unemploymentEmployerRate: 0.02,
  shortTermRiskRate: 0.0225,
  sgdpEmployeeRate: 0.075,
  sgdpEmployerRate: 0.245,
  sgdpUnemploymentRate: 0.0,
  
  stampTaxRate: 0.00759,
  besAutoEnrollmentRate: 0.03,
  
  taxBrackets: [
    { bracket: "1. Dilim (İlk 158.000 ₺)", limit: 158000, rate: 0.15, rateLabel: "%15" },
    { bracket: "2. Dilim (158.000 ₺ - 330.000 ₺)", limit: 330000, rate: 0.20, rateLabel: "%20" },
    { bracket: "3. Dilim (330.000 ₺ - 800.000 ₺)", limit: 800000, rate: 0.27, rateLabel: "%27" },
    { bracket: "4. Dilim (800.000 ₺ - 3.000.000 ₺)", limit: 3000000, rate: 0.35, rateLabel: "%35" },
    { bracket: "5. Dilim (3.000.000 ₺ üzeri)", limit: Infinity, rate: 0.40, rateLabel: "%40" },
  ],
  
  dailyFoodExemptionLimit: 220.00,
  dailyRoadExemptionLimit: 110.00,
  childAllowanceExemption: 520.11, // Brüt asgari ücretin %2'si
  familyAllowanceExemption: 2600.55, // Brüt asgari ücretin %10'u
  
  severanceCeilingH1: 41828.42,
  severanceCeilingH2: 46340.50,
  
  legalNotice: "T.C. Çalışma ve Sosyal Güvenlik Bakanlığı Asgari Ücret Tespit Komisyonu Kararı ve GİB Gelir Vergisi Tebliğleri esas alınmıştır.",
};

export const OFFICIAL_PAYROLL_PARAMS_2024: PayrollYearlyParameters = {
  year: 2024,
  periodLabel: "2024 Yılı Resmi Bordro Parametreleri",
  effectiveDate: "01.01.2024 - 31.12.2024",
  
  grossMinWage: 20002.50,
  netMinWage: 17002.12,
  minWageTaxExemption: 2550.32,
  minWageStampTaxExemption: 151.82,
  
  sgkBaseFloor: 20002.50,
  sgkBaseCeiling: 150018.90,
  dailyMinWage: 666.75,
  
  sgkEmployeeRate: 0.14,
  unemploymentEmployeeRate: 0.01,
  sgkEmployerStandardRate: 0.205,
  sgkEmployerDiscountedRate: 0.155,
  unemploymentEmployerRate: 0.02,
  shortTermRiskRate: 0.02,
  
  stampTaxRate: 0.00759,
  besAutoEnrollmentRate: 0.03,
  
  taxBrackets: [
    { bracket: "1. Dilim (İlk 110.000 ₺)", limit: 110000, rate: 0.15, rateLabel: "%15" },
    { bracket: "2. Dilim (110.000 ₺ - 230.000 ₺)", limit: 230000, rate: 0.20, rateLabel: "%20" },
    { bracket: "3. Dilim (230.000 ₺ - 580.000 ₺)", limit: 580000, rate: 0.27, rateLabel: "%27" },
    { bracket: "4. Dilim (580.000 ₺ - 3.000.000 ₺)", limit: 3000000, rate: 0.35, rateLabel: "%35" },
    { bracket: "5. Dilim (3.000.000 ₺ üzeri)", limit: Infinity, rate: 0.40, rateLabel: "%40" },
  ],
  
  dailyFoodExemptionLimit: 170.00,
  dailyRoadExemptionLimit: 88.00,
  childAllowanceExemption: 400.05,
  familyAllowanceExemption: 2000.25,
  
  severanceCeilingH1: 35058.58,
  severanceCeilingH2: 41828.42,
  
  legalNotice: "2024 Yılı Asgari Ücret ve Vergi Mevzuatı referans verileri.",
};

export const ALL_PAYROLL_PARAMS_ARCHIVE: Record<number, PayrollYearlyParameters> = {
  2026: CURRENT_PAYROLL_PARAMS_2026,
  2025: OFFICIAL_PAYROLL_PARAMS_2025,
  2024: OFFICIAL_PAYROLL_PARAMS_2024,
};

const STORAGE_KEY = "muavin_active_payroll_parameters";

export function getActivePayrollParameters(): PayrollYearlyParameters {
  try {
    const saved = safeGetStorageItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.grossMinWage && parsed.taxBrackets) {
        if (parsed.year === 2026) {
          return {
            ...CURRENT_PAYROLL_PARAMS_2026,
            ...parsed,
            cottGroupSocialSecurity: parsed.cottGroupSocialSecurity || CURRENT_PAYROLL_PARAMS_2026.cottGroupSocialSecurity,
            cottGroupWageTaxTariff: parsed.cottGroupWageTaxTariff || CURRENT_PAYROLL_PARAMS_2026.cottGroupWageTaxTariff,
            cottGroupNonWageTaxTariff: parsed.cottGroupNonWageTaxTariff || CURRENT_PAYROLL_PARAMS_2026.cottGroupNonWageTaxTariff,
            cottGroupMonthlyExemptions: parsed.cottGroupMonthlyExemptions || CURRENT_PAYROLL_PARAMS_2026.cottGroupMonthlyExemptions,
          };
        }
        return parsed;
      }
    }
  } catch (e) {
    // Ignore parse errors
  }
  return CURRENT_PAYROLL_PARAMS_2026;
}

export function saveActivePayrollParameters(params: PayrollYearlyParameters): void {
  try {
    safeSetStorageItem(STORAGE_KEY, JSON.stringify(params));
    window.dispatchEvent(new CustomEvent("muavin:payroll-params-updated", { detail: params }));
  } catch (e) {
    console.warn("Failed to save payroll parameters:", e);
  }
}

export function resetPayrollParametersToDefault(year: number = 2026): PayrollYearlyParameters {
  const fallback = ALL_PAYROLL_PARAMS_ARCHIVE[year] || CURRENT_PAYROLL_PARAMS_2026;
  saveActivePayrollParameters(fallback);
  return fallback;
}
