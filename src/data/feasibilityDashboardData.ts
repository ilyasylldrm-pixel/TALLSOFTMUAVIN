/**
 * 10.000 m² Arsa Ticari & Konut 16 Sayfalık Tam Veri Seti
 * 
 * Sayfa Listesi:
 * 00_Genel_İcmal_Dashboard
 * 01_Hafriyat_Zemin_İksa
 * 02_Kaba_Yapı
 * 03_Çatı_ve_Dış_Cephe
 * 04_İnce_Yapı
 * 05_Mekanik_ve_Yangın
 * 06_Elektrik_ve_Zayıf_Akım
 * 07_Asansör_ve_Giriş
 * 08_Altyapı_ve_Peyzaj
 * 09_Şantiye_ve_Personel
 * 10_Resmi_Harçlar_Mühendislik
 * 11_SGK_Asgari_İşçilik
 * 12_Mimari_Metraj_Parametreleri
 * 13_Arsa_Değerleme_Kıyas
 * 14_KDV_Rejimi_ve_Fatura_Sim
 * 15_20_Aylık_Nakit_Akışı
 * 16_Hassasiyet_ve_Risk_Analizi
 */

export interface CostGroupSummary {
  groupNo: string;
  name: string;
  subTitle: string;
  totalAmount: number;
  sharePct?: number;
  unitCostM2?: number;
  subItems?: {
    title: string;
    amount: number;
  }[];
}

export interface DetailedCostItem {
  pozNo: string;
  name: string;
  spec: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  subGroup?: string;
  isParameter?: boolean;
}

export interface ProjectCostMultipliers {
  contractorProfitPct: number; // Yüklenici Kârı (%15)
  unforeseenRiskPct: number;    // Şantiye Risk & Beklenmeyen Payı (%8)
  financingInflationPct: number; // Finansman & Enflasyon Taşıma Maliyeti (%5)
  vatRatePct: number;           // Girdi / Alış KDV Oranı (%20)
}

export const DEFAULT_COST_MULTIPLIERS: ProjectCostMultipliers = {
  contractorProfitPct: 15,
  unforeseenRiskPct: 8,
  financingInflationPct: 5,
  vatRatePct: 20,
};

export function calculateDynamicTotals(
  directCost: number = 419244900,
  multipliers: ProjectCostMultipliers = DEFAULT_COST_MULTIPLIERS,
  totalCoveredAreaM2: number = 25080,
  sellableAreaM2: number = 11109,
  salesRevenue: number = 504000000
) {
  const contractorProfitAmount = Math.round(directCost * (multipliers.contractorProfitPct / 100));
  const unforeseenRiskAmount = Math.round(directCost * (multipliers.unforeseenRiskPct / 100));
  const financingInflationAmount = Math.round(directCost * (multipliers.financingInflationPct / 100));

  const totalAdditionsPct =
    multipliers.contractorProfitPct +
    multipliers.unforeseenRiskPct +
    multipliers.financingInflationPct;
  const totalAdditionsAmount =
    contractorProfitAmount + unforeseenRiskAmount + financingInflationAmount;
  const generalBudgetExclVat = directCost + totalAdditionsAmount;

  const vatAmount = Math.round(generalBudgetExclVat * (multipliers.vatRatePct / 100));
  const totalInvestmentWithVat = generalBudgetExclVat + vatAmount;

  const directCostPerM2 = Math.round(directCost / totalCoveredAreaM2);
  const generalBudgetPerM2 = Math.round(generalBudgetExclVat / totalCoveredAreaM2);
  const totalInvestmentPerM2 = Math.round(totalInvestmentWithVat / totalCoveredAreaM2);
  const effectiveCostPerSellableM2 = Math.round(directCost / sellableAreaM2);

  const netProfit = salesRevenue - directCost;
  const profitMarginPct =
    directCost > 0 ? Number(((netProfit / directCost) * 100).toFixed(1)) : 0;

  return {
    directCost,
    totalCoveredAreaM2,
    sellableAreaM2,
    contractorProfitAmount,
    unforeseenRiskAmount,
    financingInflationAmount,
    totalAdditionsPct,
    totalAdditionsAmount,
    generalBudgetExclVat,
    vatAmount,
    totalInvestmentWithVat,
    directCostPerM2,
    generalBudgetPerM2,
    totalInvestmentPerM2,
    effectiveCostPerSellableM2,
    salesRevenue,
    netProfit,
    profitMarginPct,
    multiplierFactor: Number((1 + totalAdditionsPct / 100).toFixed(2)),
  };
}

export interface CashFlowRow {
  groupNo: string;
  title: string;
  totalBudget: number;
  monthly: number[];
}

export const generalDashboardData = {
  projectTitle: "10.000 m² ARSA | TİCARİ & KONUT (2+1, 3+1) İNŞAAT MALİYETİ, İCMAL & FİZİBİLİTE DASHBOARD",
  projectSubtitle: "25.080 m² Kapalı Alan | 16 Dükkan | 64 Lüks Daire | 11 İmalat ve Ayrıştırılmış Gider Paketi Dökümü",
  kpiCards: {
    totalCoveredAreaM2: 25080,
    directConstructionCost: 419244900,
    generalBudgetExcludingVat: 536633472,
    contractorSalesRevenue: 504000000,
    totalInvestmentWithVat: 643960166,
  },
  costGroups: [
    {
      groupNo: "02",
      name: "HAFRİYAT, ZEMİN İYİLEŞTİRME VE İKSA SİSTEMLERİ",
      subTitle: "2 Alt Başlık - Saha Hazırlığı, Kazı, Fore Kazık & İksa",
      totalAmount: 35385500,
      subItems: [
        { title: "1. 10.000 m² Saha Hazırlığı ve Derin Bodrum Kazısı", amount: 15839000 },
        { title: "2. Zemin İyileştirme, İksa Sistemleri ve Drenaj", amount: 19546500 },
      ],
    },
    {
      groupNo: "03",
      name: "KABA YAPI VE TAŞIYICI SİSTEMLER (BETON SINIFLARI & DONATI)",
      subTitle: "4 Alt Başlık - Radye Temel, C35/45 Düşey, C30/37 Yatay, Gazbeton",
      totalAmount: 123735500,
      subItems: [
        { title: "1. Temel Taşıyıcı Sistemi (Beton Sınıfı: C35/45)", amount: 23982000 },
        { title: "2. Düşey Taşıyıcılar: Perde ve Kolonlar (Beton Sınıfı: C35/45)", amount: 47426000 },
        { title: "3. Yatay Taşıyıcılar: Kiriş, Döşeme ve Merdivenler (Beton Sınıfı: C30/37)", amount: 38357000 },
        { title: "4. Duvar Örme İmalatları (Ticari Dükkan + 64 Daire)", amount: 13970500 },
      ],
    },
    {
      groupNo: "04",
      name: "ÇATI KONSTRÜKSİYONU VE DIŞ CEPHE KAPLAMALARI",
      subTitle: "2 Alt Başlık - Çelik Çatı, Kenet Alüminyum, Taşyünü Mantolama, Mekanik Cephe",
      totalAmount: 41945500,
      subItems: [
        { title: "1. 4 Blok Çatı Konstrüksiyonu ve Su Yalıtımı", amount: 13141500 },
        { title: "2. Dış Cephe Mantolama ve Ticari Giydirme Cephe", amount: 28804000 },
      ],
    },
    {
      groupNo: "05",
      name: "İNCE YAPI, MİMARİ KAPLAMALAR VE MOBİLYA",
      subTitle: "4 Alt Başlık - İzolasyon, Şap, Parke, Seramik, Boya, Doğrama, Mutfak/Banyo",
      totalAmount: 101238400,
      subItems: [
        { title: "1. Yalıtım, Sıva ve Şap İmalatları", amount: 19401500 },
        { title: "2. Zemin ve Duvar İnce Kaplamaları", amount: 27695000 },
        { title: "3. Boya, Asma Tavan ve Doğramalar", amount: 40191500 },
        { title: "4. Kapı, Sabit Mobilya ve Mutfak/Banyo Donanımları", amount: 13950400 },
      ],
    },
    {
      groupNo: "06",
      name: "MEKANİK, HAVALANDIRMA VE YANGIN TESİSATI (MARKALI)",
      subTitle: "3 Alt Başlık - Sıhhi Tesisat, Rehau Yerden Isıtma, Kaskad Kazan, Jet Fan, Sprinkler",
      totalAmount: 30366000,
      subItems: [
        { title: "1. Sıhhi Tesisat ve Su Şartlandırma Sistemleri", amount: 7480000 },
        { title: "2. Isıtma, Doğalgaz ve İklimlendirme Tesisatı", amount: 13528000 },
        { title: "3. Havalandırma ve Yangın Mekanik Söndürme Sistemleri", amount: 9358000 },
      ],
    },
    {
      groupNo: "07",
      name: "ELEKTRİK DAĞITIM, AYDINLATMA VE ZAYIF AKIM (MARKALI)",
      subTitle: "3 Alt Başlık - AG Panolar, Halogen-Free Kablo, IP İnterkom, Jeneratör, EV Şarj",
      totalAmount: 23634000,
      subItems: [
        { title: "1. Kuvvetli Akım Dağıtım ve Kablolama Sistemleri", amount: 13560000 },
        { title: "2. Zayıf Akım, Güvenlik ve İletişim Altyapısı", amount: 7440000 },
        { title: "3. Yedek Güç, Araç Şarj ve Koruma Sistemleri", amount: 2634000 },
      ],
    },
    {
      groupNo: "08",
      name: "ASANSÖR VE BİNA GİRİŞ / ATIK SİSTEMLERİ",
      subTitle: "2 Alt Başlık - KONE/Otis 8 Adet Hızlı Asansör, Seksiyonel Otopark Kapısı, Çöp Şutu",
      totalAmount: 11760000,
      subItems: [
        { title: "1. Blok Başına Çift Hızlı Asansörler (Toplam 8 Asansör)", amount: 9880000 },
        { title: "2. Ticari Dükkan ve Otopark Giriş Sistemleri", amount: 1880000 },
      ],
    },
    {
      groupNo: "09",
      name: "ALTYAPI, ÇEVRE GÜVENLİĞİ VE PEYZAJ TANZİMİ (10 DÖNÜM)",
      subTitle: "2 Alt Başlık - 10 Dönüm Çevre İstinat Duvarı, 7.000 m² Rulo Çim, Otomatik Sulama",
      totalAmount: 9530000,
      subItems: [
        { title: "1. 10.000 m² Çevre Güvenliği ve İstinat Yapıları", amount: 2364000 },
        { title: "2. 7.000 m² Sert ve Yumuşak Peyzaj Tanzimi", amount: 7166000 },
      ],
    },
    {
      groupNo: "10",
      name: "ŞANTİYE YÖNETİMİ, TEKNİK PERSONEL VE AĞIR EKİPMAN",
      subTitle: "2 Alt Başlık - 20 Aylık Teknik Kadro Bordrosu, 2 Kule Vinç, Mobilizasyon, İSG & CAR Sigortası",
      totalAmount: 20200000,
      subItems: [
        { title: "1. Şantiye Teknik Personel Bordro Giderleri (20 Ay)", amount: 10820000 },
        { title: "2. Şantiye Ağır Ekipman, Mobilizasyon ve İSG", amount: 9380000 },
      ],
    },
    {
      groupNo: "11",
      name: "RESMİ HARÇLAR, PROJE MÜHENDİSLİK VE DENETİM",
      subTitle: "2 Alt Başlık - Mimari/Statik/Tesisat Projeleri, Belediye Ruhsat/Otopark Harcı, Yapı Denetim",
      totalAmount: 18590000,
      subItems: [
        { title: "1. Proje Mühendislik ve Müşavirlik Hizmetleri (24.000 m²)", amount: 2620000 },
        { title: "2. Belediye Harçları, Altyapı Katılım ve Yapı Denetim Hizmeti", amount: 15970000 },
      ],
    },
    {
      groupNo: "12",
      name: "SGK ASGARİ İŞÇİLİK VE İLİŞİKSİZLİK PRİM MALİYETİ",
      subTitle: "5510 Sayılı Kanun Kapsamında ÇŞB IV-A Grubu ve Toplam Ruhsat Alanına Göre Yasal Maliyet",
      totalAmount: 2860000,
      subItems: [
        { title: "Bordro İşçilik SGK Prim Yükü", amount: 2775000 },
        { title: "Damga Vergisi ve SGK İdari Masraflar (20 Ay)", amount: 85000 },
      ],
    },
  ],
  budgetAdditions: [
    { label: "Müteahhitlik / Yüklenici Kârı (%15)", pct: 15, calcOver: "İnşaat Maliyeti Üzerinden" },
    { label: "Beklenmeyen Giderler & Şantiye Risk Payı (%8)", pct: 8, calcOver: "İnşaat Maliyeti Üzerinden" },
    { label: "Finansman & Enflasyon Taşıma Maliyeti (Opsiyonel %5)", pct: 5, calcOver: "İnşaat Maliyeti Üzerinden" },
    { label: "Girdi / Alış KDV Tahmini Ortalama (%20)", pct: 20, calcOver: "KDV İndirimi / Tevkifatı Öncesi" },
  ],
  feasibilityAnalysis: [
    { no: 1, title: "Müteahhidin Katlandığı Toplam İnşaat Maliyeti (KDV Hariç)", unit: "TL", desc: "Tüm projenin anahtar teslim inşaat maliyeti (11 İmalat Paketi)", value: 419244900 },
    { no: 2, title: "Müteahhidin Payına Kalan Satılabilir Brüt İnşaat Alanı", unit: "m²", desc: "18 Adet 2+1 + 18 Adet 3+1 + 9 Ticari Dükkan (45 Bağımsız Bölüm)", value: 11109 },
    { no: 3, title: "Müteahhidin Tahmini Toplam Satış Hasılatı (Brüt Gelir)", unit: "TL", desc: "36 Lüks Daire ve 9 Ticari Mağaza Satış Geliri", value: 504000000 },
    { no: 4, title: "Müteahhit Net Proje Kârı (Hasılat - Toplam İnşaat Maliyeti)", unit: "TL", desc: "Arsa Bedeli İnşaat Olarak Ödenmiştir (504.000.000 - 419.244.900)", value: 84755100 },
    { no: 5, title: "Müteahhit Net Kârlılık Oranı (%)", unit: "%", desc: "Yatırılan İnşaat Maliyeti Üzerinden Kârlılık (%84.755.100 / 419.244.900)", value: 20.2 },
    { no: 6, title: "Arsa Sahibine Verilen İnşaat Bedeli (Arsa Takas Maliyeti)", unit: "TL", desc: "Arsa Sahibine Yapılan 28 Daire + 7 Dükkan İmalatı (%43.75)", value: 183419644 },
    { no: 7, title: "Müteahhite Kalan m² Başına Efektif Gerçek Maliyet", unit: "TL / m²", desc: "Arsa Payı Dahil Gerçek Satılabilir m² Maliyeti (419.244.900 / 11.109 m²)", value: 37738 },
  ],
};

export const detailedCostGroupsData: Record<string, { title: string; subtitle: string; items: DetailedCostItem[] }> = {
  "02": {
    title: "GRUP 02: HAFRİYAT, ZEMİN İYİLEŞTİRME VE İKSA SİSTEMLERİ",
    subtitle: "10.000 m² Parsel Saha Hazırlığı, 2 Bodrum Kat Derin Kazısı, Fore Kazık & İksa İmalatları",
    items: [
      { pozNo: "02.01", name: "10.000 m² Parsel Çevre Güvenliği, Panel Tel Çit ve Şantiye Sahası Temizliği", spec: "Saha Hazırlığı & Panel Tel Çit", unit: "m²", quantity: 10000, unitPrice: 45, totalAmount: 450000, subGroup: "1. 10.000 m² Saha Hazırlığı ve Derin Bodrum Kazısı" },
      { pozNo: "02.02", name: "GPS ile Aks Aplikasyonu, Nirengi Sabitleme ve Plankote Harita Ölçümleri", spec: "GPS Nirengi & Plankote Harita", unit: "Set", quantity: 1, unitPrice: 85000, totalAmount: 85000, subGroup: "1. 10.000 m² Saha Hazırlığı ve Derin Bodrum Kazısı" },
      { pozNo: "02.03", name: "2 Bodrum Kat Derin Kazısı (h=7.0m, 4 Blok + Ortak Otopark Çukuru)", spec: "Ekskavatör Derin Kazı (h=7.0m)", unit: "m³", quantity: 48000, unitPrice: 165, totalAmount: 7920000, subGroup: "1. 10.000 m² Saha Hazırlığı ve Derin Bodrum Kazısı" },
      { pozNo: "02.04", name: "Kazı Malzemesinin Belediyenin İzinli Döküm Sahasına Nakli ve Serilmesi", spec: "Hafriyat Nakliyesi & Döküm Bedeli", unit: "m³", quantity: 48000, unitPrice: 130, totalAmount: 6240000, subGroup: "1. 10.000 m² Saha Hazırlığı ve Derin Bodrum Kazısı" },
      { pozNo: "02.05", name: "Temel Altı ve Çevre Dolgularının Titreşimli Silindir ile Kademeli Sıkıştırılması", spec: "Titreşimli Silindir Kademeli Sıkıştırma", unit: "m³", quantity: 5200, unitPrice: 220, totalAmount: 1144000, subGroup: "1. 10.000 m² Saha Hazırlığı ve Derin Bodrum Kazısı" },
      { pozNo: "02.06", name: "Yol ve Komşu Parseller İçin Ø80cm Kesişen/Aralıklı Fore Kazık (L=14-16m)", spec: "Ø80cm Fore Kazık (L=14-16m)", unit: "mt", quantity: 3200, unitPrice: 2600, totalAmount: 8320000, subGroup: "2. Zemin İyileştirme, İksa Sistemleri ve Drenaj" },
      { pozNo: "02.07", name: "İksa Yüzeyi Çelik Hasır Montajı ve 10 cm Kalınlıkta Püskürtme Beton (Shotcrete - C25/30)", spec: "Shotcrete C25/30 & Çelik Hasır (10cm)", unit: "m²", quantity: 4200, unitPrice: 850, totalAmount: 3570000, subGroup: "2. Zemin İyileştirme, İksa Sistemleri ve Drenaj" },
      { pozNo: "02.08", name: "Öngermeli Zemin Ankrajı Delgisi, Çok Telli Çelik Halat ve Çimento Enjeksiyonu", spec: "Öngermeli Çelik Ankraj & Enjeksiyon", unit: "mt", quantity: 4600, unitPrice: 1250, totalAmount: 5750000, subGroup: "2. Zemin İyileştirme, İksa Sistemleri ve Drenaj" },
      { pozNo: "02.09", name: "Temel Altı Yeraltı Suyu Drenaj Drenfleks Boruları ve Çakıl Filtre Yatağı", spec: "Drenfleks Boru & Çakıl Filtre Yatağı", unit: "mt", quantity: 1200, unitPrice: 420, totalAmount: 504000, subGroup: "2. Zemin İyileştirme, İksa Sistemleri ve Drenaj" },
      { pozNo: "02.10", name: "Temel Altı C16/20 Grobeton Dökümü (10 cm Kalınlık, Tesviyeli)", spec: "C16/20 Hazır Grobeton (10cm)", unit: "m³", quantity: 550, unitPrice: 2550, totalAmount: 1402500, subGroup: "2. Zemin İyileştirme, İksa Sistemleri ve Drenaj" },
    ],
  },
  "03": {
    title: "GRUP 03: KABA YAPI VE TAŞIYICI SİSTEMLER (BETON SINIFLARI & DONATI)",
    subtitle: "Radye Temel, C35/45 Düşey & C30/37 Yatay Taşıyıcılar, Endüstriyel Kalıp ve Gazbeton Duvarlar",
    items: [
      { pozNo: "03.01", name: "Temel Altı Tesviye ve Yalıtım Koruma Grobetonu", spec: "C16/20 Hazır Beton (Katkısız Tesviye)", unit: "m³", quantity: 550, unitPrice: 2550, totalAmount: 1402500, subGroup: "1. Temel Taşıyıcı Sistemi (Beton Sınıfı: C35/45)" },
      { pozNo: "03.02", name: "4 Blok Radye Jeneral Temel Betonu Dökümü (Sülfata Dayanıklı)", spec: "C35/45 Hazır Beton (Slump S4, Pompalı)", unit: "m³", quantity: 2650, unitPrice: 3250, totalAmount: 8612500, subGroup: "1. Temel Taşıyıcı Sistemi (Beton Sınıfı: C35/45)" },
      { pozNo: "03.03", name: "Radye Temel Donatı Çeliği (B420C Nervürlü Çelik)", spec: "İÇDAŞ / KARDEMİR (TSE Belgeli B420C)", unit: "Ton", quantity: 380, unitPrice: 34000, totalAmount: 12920000, subGroup: "1. Temel Taşıyıcı Sistemi (Beton Sınıfı: C35/45)" },
      { pozNo: "03.04", name: "Temel Yan Kalıbı ve Pano Kurulumu", spec: "Doka / Peri Tipi Endüstriyel Ahşap Pano", unit: "m²", quantity: 1850, unitPrice: 450, totalAmount: 832500, subGroup: "1. Temel Taşıyıcı Sistemi (Beton Sınıfı: C35/45)" },
      { pozNo: "03.05", name: "Temel Soğuk Derz Su Tutucu Şişen Bant İmalatı", spec: "SikaSwell / BASF MasterSeal 910", unit: "mt", quantity: 1100, unitPrice: 195, totalAmount: 214500, subGroup: "1. Temel Taşıyıcı Sistemi (Beton Sınıfı: C35/45)" },
      { pozNo: "03.06", name: "Bodrum Kat Çevre İstinat Perdeleri Betonu (Su Geçirimsiz)", spec: "C35/45 (W8 Su Geçirimsizlik Katkılı)", unit: "m³", quantity: 1650, unitPrice: 3350, totalAmount: 5527500, subGroup: "2. Düşey Taşıyıcılar: Perde ve Kolonlar" },
      { pozNo: "03.07", name: "Zemin Ticari Kat Yüksek Kolonları (h=4.5m) ve Çekirdek Perdeleri", spec: "C35/45 Yüksek Dayanımlı Hazır Beton", unit: "m³", quantity: 1200, unitPrice: 3300, totalAmount: 3960000, subGroup: "2. Düşey Taşıyıcılar: Perde ve Kolonlar" },
      { pozNo: "03.08", name: "Normal Kat Kolon ve Deprem Perdeleri Betonu (4 Blok x 4 Kat)", spec: "C35/45 Hazır Beton (Deprem Dayanımlı)", unit: "m³", quantity: 2450, unitPrice: 3250, totalAmount: 7962500, subGroup: "2. Düşey Taşıyıcılar: Perde ve Kolonlar" },
      { pozNo: "03.09", name: "Perde ve Kolon Donatı Çeliği Temin, Büküm ve Bağlama", spec: "B420C Nervürlü İnşaat Demiri (TSE 708)", unit: "Ton", quantity: 580, unitPrice: 34200, totalAmount: 19836000, subGroup: "2. Düşey Taşıyıcılar: Perde ve Kolonlar" },
      { pozNo: "03.10", name: "Endüstriyel Çelik Çerçeveli Düşey Perde/Kolon Kalıbı", spec: "PERI Trio / DOKA Framax Tipi Çelik Kalıp", unit: "m²", quantity: 19500, unitPrice: 520, totalAmount: 10140000, subGroup: "2. Düşey Taşıyıcılar: Perde ve Kolonlar" },
      { pozNo: "03.11", name: "Kat Kirişleri ve Asmolen/Kaset Döşemeler Hazır Betonu", spec: "C30/37 Hazır Beton (Titreşimli Mastarlı)", unit: "m³", quantity: 3850, unitPrice: 3100, totalAmount: 11935000, subGroup: "3. Yatay Taşıyıcılar: Kiriş, Döşeme ve Merdivenler" },
      { pozNo: "03.12", name: "Döşeme Donatı Çeliği (B420C) Temin ve Yerleştirme", spec: "B420C Nervürlü Çelik + Q Hasır", unit: "Ton", quantity: 440, unitPrice: 34200, totalAmount: 15048000, subGroup: "3. Yatay Taşıyıcılar: Kiriş, Döşeme ve Merdivenler" },
      { pozNo: "03.13", name: "Döşeme Kalıbı ve Yüksek Taşıyıcı Masa İskele Sistemi", spec: "Doka H20 Ahşap Kirişli Masa Kalıp", unit: "m²", quantity: 26000, unitPrice: 410, totalAmount: 10660000, subGroup: "3. Yatay Taşıyıcılar: Kiriş, Döşeme ve Merdivenler" },
      { pozNo: "03.14", name: "Monolitik Betonarme Merdiven İmalatları (4 Blok x 7 Kat)", spec: "C30/37 Hazır Beton ve B420C Donatı", unit: "Basamak", quantity: 840, unitPrice: 850, totalAmount: 714000, subGroup: "3. Yatay Taşıyıcılar: Kiriş, Döşeme ve Merdivenler" },
      { pozNo: "03.15", name: "Dış Çevre Duvarları (25 cm Gazbeton Blok Örülmesi)", spec: "YTONG / AKG Gazbeton (G2/0.40)", unit: "m²", quantity: 11500, unitPrice: 540, totalAmount: 6210000, subGroup: "4. Duvar Örme İmalatları (Ticari Dükkan + 64 Daire)" },
      { pozNo: "03.16", name: "Daire İçi ve Dükkan Bölme Duvarları (10-15 cm Gazbeton)", spec: "YTONG Gazbeton / Bims (Ses Yalıtımlı)", unit: "m²", quantity: 16800, unitPrice: 430, totalAmount: 7224000, subGroup: "4. Duvar Örme İmalatları (Ticari Dükkan + 64 Daire)" },
      { pozNo: "03.17", name: "Pencere ve Kapı Üstü Donatılı Gazbeton Lento Montajı", spec: "YTONG Taşıyıcı Hazır Prefabrik Lento", unit: "mt", quantity: 1850, unitPrice: 290, totalAmount: 536500, subGroup: "4. Duvar Örme İmalatları (Ticari Dükkan + 64 Daire)" },
    ],
  },
  "04": {
    title: "GRUP 04: ÇATI KONSTRÜKSİYONU VE DIŞ CEPHE KAPLAMALARI",
    subtitle: "4 Blok Çelik Konstrüksiyon Çatı, Kenet Sac, Taşyünü Mantolama, Mekanik Porselen Seramik & Kompozit",
    items: [
      { pozNo: "04.01", name: "Çatı Taşıyıcı Çelik Karkas Konstrüksiyonu ve Epoksi Astarı", spec: "St-37 Çelik Profil + Antipas Epoksi Boya", unit: "Ton", quantity: 68, unitPrice: 68000, totalAmount: 4624000, subGroup: "1. 4 Blok Çatı Konstrüksiyonu ve Su Yalıtımı" },
      { pozNo: "04.02", name: "Çatı OSB Kaplaması ve Nefes Alan Su Yalıtım Örtüsü", spec: "Egger / Kronospan 18mm OSB-3 Levha", unit: "m²", quantity: 3400, unitPrice: 480, totalAmount: 1632000, subGroup: "1. 4 Blok Çatı Konstrüksiyonu ve Su Yalıtımı" },
      { pozNo: "04.03", name: "Poliüretan İzolasyonlu Alüminyum Kenet Çatı Kaplaması", spec: "Assan Alüminyum 0.70mm Kenet Sac Sistem", unit: "m²", quantity: 3400, unitPrice: 1650, totalAmount: 5610000, subGroup: "1. 4 Blok Çatı Konstrüksiyonu ve Su Yalıtımı" },
      { pozNo: "04.04", name: "Parapet ve Gizli Dere Yalıtımı (Çift Kat Bitümlü Membran)", spec: "Onduline / BTM 4mm SBS Katkılı Membran", unit: "m²", quantity: 1100, unitPrice: 580, totalAmount: 638000, subGroup: "1. 4 Blok Çatı Konstrüksiyonu ve Su Yalıtımı" },
      { pozNo: "04.05", name: "Elektrik Isıtmalı Çatı Yağmur İniş Boruları ve Süzgeçleri", spec: "Fırat Dublex PVC Boru + Kendinden Regüleli Isıtıcı", unit: "mt", quantity: 750, unitPrice: 850, totalAmount: 637500, subGroup: "1. 4 Blok Çatı Konstrüksiyonu ve Su Yalıtımı" },
      { pozNo: "04.06", name: "Konut Katları Taşyünü Mantolama (150 kg/m³, 8 cm)", spec: "Knauf / İzocam Taşyünü Yalıtım Sistemi", unit: "m²", quantity: 13200, unitPrice: 840, totalAmount: 11088000, subGroup: "2. Dış Cephe Mantolama ve Ticari Giydirme Cephe" },
      { pozNo: "04.07", name: "Dekoratif Sıva ve Silikonlu Dış Cephe Boyası", spec: "Jotun / Filli Boya Silikonlu Dış Cephe", unit: "m²", quantity: 9800, unitPrice: 320, totalAmount: 3136000, subGroup: "2. Dış Cephe Mantolama ve Ticari Giydirme Cephe" },
      { pozNo: "04.08", name: "Zemin Kat Ticari Dükkanlar Mekanik Porselen Seramik Cephe", spec: "Kütahya / NG Porselen 60x120 Mekanik", unit: "m²", quantity: 3400, unitPrice: 2400, totalAmount: 8160000, subGroup: "2. Dış Cephe Mantolama ve Ticari Giydirme Cephe" },
      { pozNo: "04.09", name: "Mimari Alüminyum Kompozit Panel ve Kompakt Laminat", spec: "ASAŞ / Saray 4mm FR Yanmaz Panel", unit: "m²", quantity: 2200, unitPrice: 2100, totalAmount: 4620000, subGroup: "2. Dış Cephe Mantolama ve Ticari Giydirme Cephe" },
      { pozNo: "04.10", name: "Pencere Denizlikleri ve Küpeşteler (3 cm Doğal Mermer)", spec: "Afyon / Muğla Beyazı 3cm Doğal Mermer", unit: "mt", quantity: 2400, unitPrice: 750, totalAmount: 1800000, subGroup: "2. Dış Cephe Mantolama ve Ticari Giydirme Cephe" },
    ],
  },
  "05": {
    title: "GRUP 05: İNCE YAPI, MİMARİ KAPLAMALAR VE MOBİLYA",
    subtitle: "Yalıtım, Sıva, Şap, Parke, Granit, Boya, Alçıpan Asma Tavan, Doğramalar ve Sabit Mobilyalar",
    items: [
      { pozNo: "05.01", name: "Bodrum Perde Duvarları Çift Kat SBS Bitümlü Membran", spec: "BASF MasterSeal / Sika 2 Kat Membran", unit: "m²", quantity: 6200, unitPrice: 420, totalAmount: 2604000, subGroup: "1. Yalıtım, Sıva ve Şap İmalatları" },
      { pozNo: "05.02", name: "Drenaj Levhası ve Geotekstil Koruma Keçesi", spec: "Dörken Delta-MS Drenaj Levhası + Keçe", unit: "m²", quantity: 6200, unitPrice: 160, totalAmount: 992000, subGroup: "1. Yalıtım, Sıva ve Şap İmalatları" },
      { pozNo: "05.03", name: "Islak Hacim ve Balkon Tam Elastik Sürme İzolasyon", spec: "Sika TopSeal 107 / Weber Dry SS-10", unit: "m²", quantity: 4800, unitPrice: 360, totalAmount: 1728000, subGroup: "1. Yalıtım, Sıva ve Şap İmalatları" },
      { pozNo: "05.04", name: "İç Cephe Alçı Sıva (Perlitli Sıva + Saten Perdahlama)", spec: "Knauf / Dalsan Alçı Sıva Sistemi", unit: "m²", quantity: 48000, unitPrice: 210, totalAmount: 10080000, subGroup: "1. Yalıtım, Sıva ve Şap İmalatları" },
      { pozNo: "05.05", name: "Akustik Şilte Üzeri Tesviye Şapı (Katkılı ve Telli)", spec: "C20/25 Çimento Esaslı Helikopterli Şap", unit: "m²", quantity: 20500, unitPrice: 195, totalAmount: 3997500, subGroup: "1. Yalıtım, Sıva ve Şap İmalatları" },
      { pozNo: "05.06", name: "2+1 ve 3+1 Daire İçi Salon ve Odalar Laminat Parke", spec: "Çamsan Avangard / AGT 32. Sınıf 10mm", unit: "m²", quantity: 12400, unitPrice: 680, totalAmount: 8432000, subGroup: "2. Zemin ve Duvar İnce Kaplamaları" },
      { pozNo: "05.07", name: "Daire Antre, Hol ve Mutfak Zemin Granit Kaplama", spec: "VitrA / Çanakkale Seramik 60x120", unit: "m²", quantity: 5200, unitPrice: 920, totalAmount: 4784000, subGroup: "2. Zemin ve Duvar İnce Kaplamaları" },
      { pozNo: "05.08", name: "Banyo ve WC Zemin / Duvar Porselen Seramik Kaplama", spec: "Bien / VitrA 1. Sınıf Porselen Seramik", unit: "m²", quantity: 9500, unitPrice: 890, totalAmount: 8455000, subGroup: "2. Zemin ve Duvar İnce Kaplamaları" },
      { pozNo: "05.09", name: "Bina Girişleri, Merdivenler ve Sahanlıklar Mermer Kaplama", spec: "Toros Siyahı / Muğla Beyazı 3cm Mermer", unit: "mt", quantity: 2400, unitPrice: 1350, totalAmount: 3240000, subGroup: "2. Zemin ve Duvar İnce Kaplamaları" },
      { pozNo: "05.10", name: "Kapalı Otopark Zeminleri Tozumaz Epoksi Kaplama", spec: "BASF MasterTop / Jotun Epoksi Kaplama", unit: "m²", quantity: 5800, unitPrice: 480, totalAmount: 2784000, subGroup: "2. Zemin ve Duvar İnce Kaplamaları" },
      { pozNo: "05.11", name: "İç Mekanlar Su Bazlı Silinebilir Antibakteriyel Boya", spec: "Jotun Fenomastic / DYO Dinamik Silinebilir", unit: "m²", quantity: 48000, unitPrice: 155, totalAmount: 7440000, subGroup: "3. Boya, Asma Tavan ve Doğramalar" },
      { pozNo: "05.12", name: "Daire İçi Gizli Işıklı Alçıpan Asma Tavan ve Kartonpiyer", spec: "Knauf Alçıpan Levha + Galvaniz Karkas", unit: "m²", quantity: 11200, unitPrice: 520, totalAmount: 5824000, subGroup: "3. Boya, Asma Tavan ve Doğramalar" },
      { pozNo: "05.13", name: "Daireler Isı Yalıtımlı PVC / Alüminyum Doğrama (Konfor Cam)", spec: "Rehau / Winsa 76mm + Şişecam Konfor Isıcam", unit: "m²", quantity: 3600, unitPrice: 3650, totalAmount: 13140000, subGroup: "3. Boya, Asma Tavan ve Doğramalar" },
      { pozNo: "05.14", name: "Zemin Kat Ticari Dükkanlar Isı Yalıtımlı Alüminyum Vitrin", spec: "ASAŞ / Çuhadaroğlu Isı Yalıtımlı Vitrin", unit: "m²", quantity: 1400, unitPrice: 4200, totalAmount: 5880000, subGroup: "3. Boya, Asma Tavan ve Doğramalar" },
      { pozNo: "05.15", name: "Motorlu Alüminyum Gizli Panjur Sistemi (Konutlar)", spec: "Somfy Motorlu / Mosel Alüminyum Lamel", unit: "m²", quantity: 2100, unitPrice: 2400, totalAmount: 5040000, subGroup: "3. Boya, Asma Tavan ve Doğramalar" },
      { pozNo: "05.16", name: "Lamine Camlı Alüminyum Balkon Korkulukları", spec: "4+4 Lamine Temperli Cam + Füme Eloksal", unit: "mt", quantity: 1850, unitPrice: 1550, totalAmount: 2867500, subGroup: "3. Boya, Asma Tavan ve Doğramalar" },
      { pozNo: "05.17", name: "Daire Giriş Çelik Kapıları (Biyometrik / Parmak İzli)", spec: "Kale Çelik Kapı (Monoblok + Elektronik)", unit: "Adet", quantity: 64, unitPrice: 16500, totalAmount: 1056000, subGroup: "4. Kapı, Sabit Mobilya ve Mutfak/Banyo Donanımları" },
      { pozNo: "05.18", name: "Daire İçi Lake Ahşap Panel Kapılar (Manyetik Kilitli)", spec: "Dortek / AGT Lake Boyalı Manyetik Kilitli", unit: "Adet", quantity: 420, unitPrice: 6800, totalAmount: 2856000, subGroup: "4. Kapı, Sabit Mobilya ve Mutfak/Banyo Donanımları" },
      { pozNo: "05.19", name: "64 Daire Lüks Mutfak Dolabı İmalatı (Akrilik/Lake)", spec: "Kastamonu Akrilik + Blum Ray/Menteşe", unit: "mt-tül", quantity: 580, unitPrice: 9200, totalAmount: 5336000, subGroup: "4. Kapı, Sabit Mobilya ve Mutfak/Banyo Donanımları" },
      { pozNo: "05.20", name: "Mutfak Tezgahı (Kuvars / Porselen Plaka)", spec: "Çimstone / Belenco Kuvars Taşı Plaka", unit: "mt-tül", quantity: 450, unitPrice: 4800, totalAmount: 2160000, subGroup: "4. Kapı, Sabit Mobilya ve Mutfak/Banyo Donanımları" },
      { pozNo: "05.21", name: "Giriş Holü Portmanto / Vestiyer İmalatı", spec: "MDF Lam Gövde + Lake Kapak Özel İmalat", unit: "Adet", quantity: 64, unitPrice: 14000, totalAmount: 896000, subGroup: "4. Kapı, Sabit Mobilya ve Mutfak/Banyo Donanımları" },
      { pozNo: "05.22", name: "Banyo Hilton Lavabo Dolabı, Boy Dolabı ve LED Ayna", spec: "VitrA / Creavit Asma Banyo Mobilyası", unit: "Adet", quantity: 112, unitPrice: 9500, totalAmount: 1064000, subGroup: "4. Kapı, Sabit Mobilya ve Mutfak/Banyo Donanımları" },
      { pozNo: "05.23", name: "Temperli Cam Duşakabin Sistemi (Siyah Profil)", spec: "Hüppe / Artline 6mm Şeffaf Temperli Cam", unit: "Adet", quantity: 112, unitPrice: 5200, totalAmount: 582400, subGroup: "4. Kapı, Sabit Mobilya ve Mutfak/Banyo Donanımları" },
    ],
  },
  "06": {
    title: "GRUP 06: MEKANİK, HAVALANDIRMA VE YANGIN TESİSATI (MARKALI)",
    subtitle: "Sıhhi Tesisat, Rehau Yerden Isıtma, Viessmann Kaskad Kazan, Jet Fan & Sprinkler Sistemleri",
    items: [
      { pozNo: "06.01", name: "Daire İçi Temiz Su Borulama Tesisatı", spec: "Fırat Plastik / Dizayn PPRC Kompozit Boru", unit: "Daire", quantity: 80, unitPrice: 21000, totalAmount: 1680000, subGroup: "1. Sıhhi Tesisat ve Su Şartlandırma Sistemleri" },
      { pozNo: "06.02", name: "Bina İçi Kolon ve Daire Pis Su Tesisatı", spec: "Wavin SiTech / Kalde Sessiz Boru Hattı", unit: "Daire", quantity: 80, unitPrice: 18500, totalAmount: 1480000, subGroup: "1. Sıhhi Tesisat ve Su Şartlandırma Sistemleri" },
      { pozNo: "06.03", name: "Merkezi Paslanmaz Modüler Su Deposu (2 x 50 Ton)", spec: "Termodinamik AISI 304 Paslanmaz Modüler", unit: "Set", quantity: 2, unitPrice: 480000, totalAmount: 960000, subGroup: "1. Sıhhi Tesisat ve Su Şartlandırma Sistemleri" },
      { pozNo: "06.04", name: "Frekans Kontrollü Kullanım Suyu Hidrofor Grubu", spec: "Wilo Isar BOOST5 / Grundfos Multi-E", unit: "Set", quantity: 4, unitPrice: 280000, totalAmount: 1120000, subGroup: "1. Sıhhi Tesisat ve Su Şartlandırma Sistemleri" },
      { pozNo: "06.05", name: "Gömme Rezervuar, Asma Klozet ve Batarya Grupları", spec: "Geberit Sigma / Grohe Eurosmart & VitrA", unit: "Daire", quantity: 80, unitPrice: 28000, totalAmount: 2240000, subGroup: "1. Sıhhi Tesisat ve Su Şartlandırma Sistemleri" },
      { pozNo: "06.06", name: "2+1 ve 3+1 Daireler Yerden Isıtma Tesisat Sistemi", spec: "Rehau Rautitan / Danfoss Pe-RT Oksijen Bariyerli", unit: "m²", quantity: 12500, unitPrice: 560, totalAmount: 7000000, subGroup: "2. Isıtma, Doğalgaz ve İklimlendirme Tesisatı" },
      { pozNo: "06.07", name: "Merkezi Kaskad Yoğuşmalı Kazan Sistemi (4 Blok x 2 x 200 kW)", spec: "Viessmann Vitodens 200-W / Buderus GB162", unit: "Set", quantity: 4, unitPrice: 850000, totalAmount: 3400000, subGroup: "2. Isıtma, Doğalgaz ve İklimlendirme Tesisatı" },
      { pozNo: "06.08", name: "Daire Giriş İstasyonu / Isı Pay Ölçer (M-Bus) Sistemi", spec: "Danfoss / Siemens Ultrasonik M-Bus Kalorimetre", unit: "Adet", quantity: 80, unitPrice: 9500, totalAmount: 760000, subGroup: "2. Isıtma, Doğalgaz ve İklimlendirme Tesisatı" },
      { pozNo: "06.09", name: "Multi-Split Klima Bakır Boru ve Drenaj Altyapısı", spec: "Daikin / Mitsubishi Heavy Bakır Borulama", unit: "Daire", quantity: 64, unitPrice: 14500, totalAmount: 928000, subGroup: "2. Isıtma, Doğalgaz ve İklimlendirme Tesisatı" },
      { pozNo: "06.10", name: "Zemin Ticari Dükkanlar VRF / Havalandırma Altyapısı", spec: "Daikin / VRV Tipi Bakır Boru & Taze Hava", unit: "Dükkan", quantity: 16, unitPrice: 45000, totalAmount: 720000, subGroup: "2. Isıtma, Doğalgaz ve İklimlendirme Tesisatı" },
      { pozNo: "06.11", name: "Bina Ana Doğalgaz Kolon Tesisatı ve Sayaç Grubu", spec: "Duyar / Trakya Gaz Çelik Boru & Gaz Alarm", unit: "Blok", quantity: 4, unitPrice: 180000, totalAmount: 720000, subGroup: "2. Isıtma, Doğalgaz ve İklimlendirme Tesisatı" },
      { pozNo: "06.12", name: "Kapalı Otopark Jet Fanlı Duman Tahliye Sistemi", spec: "Systemair / Trox İki Hızlı Jet Fanlar", unit: "Set", quantity: 1, unitPrice: 980000, totalAmount: 980000, subGroup: "3. Havalandırma ve Yangın Mekanik Söndürme Sistemleri" },
      { pozNo: "06.13", name: "Yangın Sprinkler Tesisatı (Otopark, Ticari ve Ortak Alanlar)", spec: "Duyar Vana / Tyco K80 Hızlı Tepkili Islak", unit: "m²", quantity: 24000, unitPrice: 260, totalAmount: 6240000, subGroup: "3. Havalandırma ve Yangın Mekanik Söndürme Sistemleri" },
      { pozNo: "06.14", name: "Yangın Dolapları ve İtfaiye Su Alma Ağızları", spec: "Zeytursan / Duyar Sıva Üstü Cam Kapaklı", unit: "Set", quantity: 48, unitPrice: 18500, totalAmount: 888000, subGroup: "3. Havalandırma ve Yangın Mekanik Söndürme Sistemleri" },
      { pozNo: "06.15", name: "Dizel + Elektrikli Yangın Pompa Grubu (NFPA 20 Uyumlu)", spec: "Standart Pompa / Wilo UL-FM Onaylı Çift", unit: "Set", quantity: 1, unitPrice: 750000, totalAmount: 750000, subGroup: "3. Havalandırma ve Yangın Mekanik Söndürme Sistemleri" },
      { pozNo: "06.16", name: "Sığınak ve Isı Merkezleri Taze Hava Santralleri", spec: "Systemair / Aironn Hücreli Vantilatör Grubu", unit: "Set", quantity: 4, unitPrice: 125000, totalAmount: 500000, subGroup: "3. Havalandırma ve Yangın Mekanik Söndürme Sistemleri" },
    ],
  },
  "07": {
    title: "GRUP 07: ELEKTRİK DAĞITIM, AYDINLATMA VE ZAYIF AKIM (MARKALI)",
    subtitle: "AG Dağıtım Panoları (Schneider/Siemens), Halojen-Free Kablolama, IP İnterkom, Jeneratör & EV Şarj İstasyonları",
    items: [
      { pozNo: "07.01", name: "Bina Ana AG Dağıtım ve Sayaç Otomasyon Panoları (4 Blok)", spec: "Schneider Prisma / ABB System Pro E Şalt", unit: "Set", quantity: 4, unitPrice: 380000, totalAmount: 1520000, subGroup: "1. Kuvvetli Akım Dağıtım ve Kablolama" },
      { pozNo: "07.02", name: "Halogen-Free Alev İletmeyen Kablo Dağıtımı (N2XH)", spec: "Prysmian Group / HES Kablo Halogen Free", unit: "m²", quantity: 24000, unitPrice: 340, totalAmount: 8160000, subGroup: "1. Kuvvetli Akım Dağıtım ve Kablolama" },
      { pozNo: "07.03", name: "Galvanizli Sac Kablo Taşıma Tava Sistemleri", spec: "EAE Elektrik / Gersan 100x50 Delikli Tava", unit: "mt", quantity: 3400, unitPrice: 480, totalAmount: 1632000, subGroup: "1. Kuvvetli Akım Dağıtım ve Kablolama" },
      { pozNo: "07.04", name: "Daire ve Dükkan İçi Şalt Panosu ve Kaçak Akım Röleleri", spec: "Siemens Sentron / Schneider Acti9 Sigorta", unit: "Adet", quantity: 80, unitPrice: 8500, totalAmount: 680000, subGroup: "1. Kuvvetli Akım Dağıtım ve Kablolama" },
      { pozNo: "07.05", name: "Daire İçi Modüler Anahtar, Priz ve Termostatlar", spec: "Legrand Valena / Schneider Sedna Antrasit", unit: "Daire", quantity: 64, unitPrice: 9500, totalAmount: 608000, subGroup: "1. Kuvvetli Akım Dağıtım ve Kablolama" },
      { pozNo: "07.06", name: "Bina İçi, Otopark ve Ticari Ortak Alan LED Aydınlatma", spec: "Philips / Osram IP65 LED Lineer Armatür", unit: "Set", quantity: 4, unitPrice: 240000, totalAmount: 960000, subGroup: "1. Kuvvetli Akım Dağıtım ve Kablolama" },
      { pozNo: "07.07", name: "IP Tabanlı Görüntülü İnterkom Sistemi (7'' Dokunmatik)", spec: "Audio / Legrand Bticino IP Dokunmatik Ekran", unit: "Daire", quantity: 64, unitPrice: 16500, totalAmount: 1056000, subGroup: "2. Zayıf Akım, Güvenlik ve İletişim Altyapısı" },
      { pozNo: "07.08", name: "10 Dönüm Çevre, Ticari Önü ve Otopark CCTV Kamera Sistemi", spec: "Hikvision / Dahua 4MP H.265+ DarkFighter", unit: "Set", quantity: 1, unitPrice: 780000, totalAmount: 780000, subGroup: "2. Zayıf Akım, Güvenlik ve İletişim Altyapısı" },
      { pozNo: "07.09", name: "Adresli Otomatik Yangın Algılama ve İhbar Sistemi", spec: "Honeywell Notifier / Mavili Maxlogic Adresli", unit: "m²", quantity: 24000, unitPrice: 160, totalAmount: 3840000, subGroup: "2. Zayıf Akım, Güvenlik ve İletişim Altyapısı" },
      { pozNo: "07.10", name: "Acil Anons ve Seslendirme Sistemi (EN 54-16)", spec: "Bosch / ITC Escort Acil Durum Seslendirme", unit: "Set", quantity: 1, unitPrice: 420000, totalAmount: 420000, subGroup: "2. Zayıf Akım, Güvenlik ve İletişim Altyapısı" },
      { pozNo: "07.11", name: "Eve Kadar Fiber (FTTH) ve Zayıf Akım Dağıtım Kabinleri", spec: "HES Fiber Optik + Canovate 19'' Rack Kabin", unit: "Daire", quantity: 80, unitPrice: 9800, totalAmount: 784000, subGroup: "2. Zayıf Akım, Güvenlik ve İletişim Altyapısı" },
      { pozNo: "07.12", name: "Merkezi Dijital Uydu Dağıtım Sistemi (SMATV - 4 Blok)", spec: "Next & NextStar / Hirschmann Multiswitch", unit: "Set", quantity: 4, unitPrice: 140000, totalAmount: 560000, subGroup: "2. Zayıf Akım, Güvenlik ve İletişim Altyapısı" },
      { pozNo: "07.13", name: "Otomatik Kabinli Dizel Jeneratör Grubu (630 kVA - Tüm Site)", spec: "Aksa / TEKSAN Perkins/Cummins + Transfer", unit: "Set", quantity: 1, unitPrice: 1450000, totalAmount: 1450000, subGroup: "3. Yedek Güç, Araç Şarj ve Koruma Sistemleri" },
      { pozNo: "07.14", name: "Temel Altı Bakır Hasır Topraklama ve Eşpotansiyel Baralama", spec: "Obo Bettermann / Çavdar Topraklama Şeridi", unit: "Set", quantity: 4, unitPrice: 95000, totalAmount: 380000, subGroup: "3. Yedek Güç, Araç Şarj ve Koruma Sistemleri" },
      { pozNo: "07.15", name: "Erken Akış Uyarımlı Aktif Paratoner Sistemi (4 Blok)", spec: "Forend / Liva Aktif Paratoner Başlığı", unit: "Set", quantity: 4, unitPrice: 75000, totalAmount: 300000, subGroup: "3. Yedek Güç, Araç Şarj ve Koruma Sistemleri" },
      { pozNo: "07.16", name: "Kapalı Otopark Elektrikli Araç Şarj İstasyonları (AC 22 kW)", spec: "Vestel EVC04 / Schneider EVlink 22kW Tip 2", unit: "Adet", quantity: 12, unitPrice: 42000, totalAmount: 504000, subGroup: "3. Yedek Güç, Araç Şarj ve Koruma Sistemleri" },
    ],
  },
  "08": {
    title: "GRUP 08: ASANSÖR VE BİNA GİRİŞ / ATIK SİSTEMLERİ",
    subtitle: "KONE / Otis 10 Kişilik Yolcu & 13 Kişilik Sedye Asansörleri, Endüstriyel Seksiyonel Kapılar & Çöp Şutu",
    items: [
      { pozNo: "08.01", name: "10 Kişilik (800 kg) 1.6 m/sn Frekans Kontrollü Lüks Yolcu Asansörü", spec: "KONE MonoSpace / Otis Gen2 / Schindler 3300", unit: "Adet", quantity: 4, unitPrice: 950000, totalAmount: 3800000, subGroup: "1. Blok Başına Çift Hızlı Asansörler (Toplam 8 Asansör)" },
      { pozNo: "08.02", name: "13 Kişilik (1000 kg) Sedye ve Yük Asansörü (Otomatik Kurtarmalı)", spec: "KONE TranSys / Otis Gen2 Bed Lüks Sedye", unit: "Adet", quantity: 4, unitPrice: 1250000, totalAmount: 5000000, subGroup: "1. Blok Başına Çift Hızlı Asansörler (Toplam 8 Asansör)" },
      { pozNo: "08.03", name: "Asansör Kuyu İçi Çelik Ray, Halat, Ağırlık ve Buton Grupları", spec: "KONE / Otis Orijinal Kuyu İçi Donanım", unit: "Kuyu", quantity: 8, unitPrice: 135000, totalAmount: 1080000, subGroup: "1. Blok Başına Çift Hızlı Asansörler (Toplam 8 Asansör)" },
      { pozNo: "08.04", name: "Kapalı Otopark Giriş ve Çıkış Hızlı Sarmal Endüstriyel Seksiyonel Kapı", spec: "Hörmann / Novoferm Yalıtımlı Motorlu", unit: "Adet", quantity: 4, unitPrice: 185000, totalAmount: 740000, subGroup: "2. Ticari Dükkan ve Otopark Giriş Sistemleri" },
      { pozNo: "08.05", name: "Bina Ana Giriş Kapıları Radar Kontrollü Teleskopik Cam Kapı", spec: "Dorma Kaba / Geze Slimdrive Teleskopik", unit: "Adet", quantity: 4, unitPrice: 120000, totalAmount: 480000, subGroup: "2. Ticari Dükkan ve Otopark Giriş Sistemleri" },
      { pozNo: "08.06", name: "Paslanmaz Çelik Merkezi Çöp Şutu ve Pnömatik Yıkama Sistemi", spec: "AISI 304 Paslanmaz Çelik Şut + Ozonlama", unit: "Set", quantity: 4, unitPrice: 165000, totalAmount: 660000, subGroup: "2. Ticari Dükkan ve Otopark Giriş Sistemleri" },
    ],
  },
  "09": {
    title: "GRUP 09: ALTYAPI, ÇEVRE GÜVENLİĞİ VE PEYZAJ TANZİMİ (10 DÖNÜM)",
    subtitle: "Parsel Çevre İstinat Duvarı, Çit, Güvenlik Kulübesi, 7.000 m² Yeşil Alan, Canlı Rulo Çim & Çocuk Oyun Parkı",
    items: [
      { pozNo: "09.01", name: "10 Dönüm Parsel Çevre Betonarme İstinat Duvarı ve Harpuşta", spec: "C25/30 Hazır Beton ve B420C Donatılı Duvar", unit: "mt", quantity: 480, unitPrice: 2400, totalAmount: 1152000, subGroup: "1. 10.000 m² Çevre Güvenliği ve İstinat Yapıları" },
      { pozNo: "09.02", name: "Dekoratif Elektrostatik Boyalı Panel Çit ve Güvenlik Jiletli Teli", spec: "Kazan Çit / Bekaert 2.0m + Jiletli Tel", unit: "mt", quantity: 480, unitPrice: 1150, totalAmount: 552000, subGroup: "1. 10.000 m² Çevre Güvenliği ve İstinat Yapıları" },
      { pozNo: "09.03", name: "Site Ana Giriş Güvenlik Nizamiyesi ve Bariyer Kontrol Kabini", spec: "Karmod / Hebo Sandviç Panel Hazır Kabin", unit: "Adet", quantity: 1, unitPrice: 280000, totalAmount: 280000, subGroup: "1. 10.000 m² Çevre Güvenliği ve İstinat Yapıları" },
      { pozNo: "09.04", name: "Plaka Tanıma Kameralı Hızlı Kollu Otopark Giriş-Çıkış Bariyeri", spec: "Nice / BFT Motorlu Hızlı Akıllı Bariyer", unit: "Set", quantity: 4, unitPrice: 95000, totalAmount: 380000, subGroup: "1. 10.000 m² Çevre Güvenliği ve İstinat Yapıları" },
      { pozNo: "09.05", name: "Sert Zemin Yürüyüş Yolları, Kilit Taş ve Granit Bordür Kaplama", spec: "Konya Büyükşehir Standart Mineral Taş", unit: "m²", quantity: 2800, unitPrice: 620, totalAmount: 1736000, subGroup: "2. 7.000 m² Sert ve Yumuşak Peyzaj Tanzimi" },
      { pozNo: "09.06", name: "Bitkisel Toprak Serimi, Tesviye ve Doğal Canlı Rulo Çim Serimi", spec: "Ege Rulo Çim / 4 Mevsim Canlı Çim", unit: "m²", quantity: 4200, unitPrice: 480, totalAmount: 2016000, subGroup: "2. 7.000 m² Sert ve Yumuşak Peyzaj Tanzimi" },
      { pozNo: "09.07", name: "Yetişkin Peyzaj Ağaçları (Mavi Ladin, Ihlamur, Akçaağaç, Çınar)", spec: "10-12 Yaş Tüplü Formlu İthal/Yerli Ağaç", unit: "Grup", quantity: 1, unitPrice: 850000, totalAmount: 850000, subGroup: "2. 7.000 m² Sert ve Yumuşak Peyzaj Tanzimi" },
      { pozNo: "09.08", name: "Toprak Altı Otomatik Damlama ve Pop-up Yağmurlama Sulama", spec: "Rain Bird / Hunter Otomatik Sulama Panosu", unit: "m²", quantity: 4200, unitPrice: 220, totalAmount: 924000, subGroup: "2. 7.000 m² Sert ve Yumuşak Peyzaj Tanzimi" },
      { pozNo: "09.09", name: "Çocuk Oyun Parkları (2 Adet, EPDM Zeminli) ve Açık Fitness Alanı", spec: "Cemer Kent Ekipmanları EPDM Zeminli Park", unit: "Set", quantity: 2, unitPrice: 450000, totalAmount: 900000, subGroup: "2. 7.000 m² Sert ve Yumuşak Peyzaj Tanzimi" },
      { pozNo: "09.10", name: "Site İçi Ahşap Kamelyalar, Pergoleler ve Dinlenme Bankları", spec: "Emprenyeli Çam Ağacı Ahşap Kamelya/Bank", unit: "Set", quantity: 8, unitPrice: 45000, totalAmount: 360000, subGroup: "2. 7.000 m² Sert ve Yumuşak Peyzaj Tanzimi" },
      { pozNo: "09.11", name: "Dekoratif Süs Havuzu ve Fıskiye / Sirkülasyon Sistemi", spec: "Betonarme İzolasyonlu Havuz + Filtre Grubu", unit: "Set", quantity: 1, unitPrice: 380000, totalAmount: 380000, subGroup: "2. 7.000 m² Sert ve Yumuşak Peyzaj Tanzimi" },
    ],
  },
  "10": {
    title: "GRUP 10: ŞANTİYE YÖNETİMİ, TEKNİK PERSONEL VE AĞIR EKİPMAN",
    subtitle: "20 Aylık Şantiye Teknik Kadro Bordroları, 2 Kule Vinç, Mobilizasyon Tesisleri & CAR Sigortası",
    items: [
      { pozNo: "10.01", name: "Proje Müdürü (Kıdemli İnşaat Mühendisi) Bordro Gideri (20 Ay)", spec: "20 Aylık Şantiye Yönetimi", unit: "Ay", quantity: 20, unitPrice: 140000, totalAmount: 2800000, subGroup: "1. Şantiye Teknik Personel Bordro Giderleri (20 Ay)" },
      { pozNo: "10.02", name: "Şantiye Şefi (İnşaat Mühendisi) Bordro Gideri (20 Ay)", spec: "20 Aylık Saha Yönetimi", unit: "Ay", quantity: 20, unitPrice: 95000, totalAmount: 1900000, subGroup: "1. Şantiye Teknik Personel Bordro Giderleri (20 Ay)" },
      { pozNo: "10.03", name: "Saha Mimarı (İnce Yapı ve Ticari Alan Sorumlusu - 16 Ay)", spec: "16 Aylık İnce Yapı Koordinasyonu", unit: "Ay", quantity: 16, unitPrice: 85000, totalAmount: 1360000, subGroup: "1. Şantiye Teknik Personel Bordro Giderleri (20 Ay)" },
      { pozNo: "10.04", name: "Elektrik & Mekanik Saha Mühendisleri Gideri (16 Ay)", spec: "16 Aylık Tesisat Süpervizyonu", unit: "Ay", quantity: 16, unitPrice: 85000, totalAmount: 1360000, subGroup: "1. Şantiye Teknik Personel Bordro Giderleri (20 Ay)" },
      { pozNo: "10.05", name: "Harita Teknikeri ve Saha Formenleri (20 Ay)", spec: "20 Aylık Ölçüm ve Postabaşı Kadrosu", unit: "Ay", quantity: 20, unitPrice: 75000, totalAmount: 1500000, subGroup: "1. Şantiye Teknik Personel Bordro Giderleri (20 Ay)" },
      { pozNo: "10.06", name: "Şantiye 7/24 Güvenlik Ekibi (3 Vardiya) ve İdari Destek (20 Ay)", spec: "20 Aylık 3 Vardiya Güvenlik Kadrosu", unit: "Ay", quantity: 20, unitPrice: 95000, totalAmount: 1900000, subGroup: "1. Şantiye Teknik Personel Bordro Giderleri (20 Ay)" },
      { pozNo: "10.07", name: "10.000 m² Sahaya Prefabrik İdari Ofis, Yemekhane ve Yatakhane Kurulumu", spec: "Şantiye Prefabrik Mobilizasyonu", unit: "Set", quantity: 1, unitPrice: 650000, totalAmount: 650000, subGroup: "2. Şantiye Ağır Ekipman, Mobilizasyon ve İSG" },
      { pozNo: "10.08", name: "Kule Vinç Kurulumu, Deplase, Kira ve Operatör Gideri (2 Kule Vinç x 14 Ay)", spec: "2 Adet Potain/Liebherr Kule Vinç", unit: "Ay", quantity: 14, unitPrice: 280000, totalAmount: 3920000, subGroup: "2. Şantiye Ağır Ekipman, Mobilizasyon ve İSG" },
      { pozNo: "10.09", name: "Dış Cephe Personel ve Malzeme Asansörleri Kiralama (4 Blok x 10 Ay)", spec: "Geda / Alimak Cephe Asansörü", unit: "Ay", quantity: 10, unitPrice: 180000, totalAmount: 1800000, subGroup: "2. Şantiye Ağır Ekipman, Mobilizasyon ve İSG" },
      { pozNo: "10.10", name: "Geçici Şantiye Trafo, Elektrik, Şebeke Suyu ve Jeneratör Yakıtı (20 Ay)", spec: "Geçici Enerji, Su ve Yakıt Gideri", unit: "Ay", quantity: 20, unitPrice: 75000, totalAmount: 1500000, subGroup: "2. Şantiye Ağır Ekipman, Mobilizasyon ve İSG" },
      { pozNo: "10.11", name: "İş Sağlığı ve Güvenliği (İSG) Hizmeti, Koruyucu Donanım ve Sağlık Taramaları", spec: "A Sınıfı İSG Uzmanı & İşyeri Hekimi", unit: "Ay", quantity: 20, unitPrice: 48000, totalAmount: 960000, subGroup: "2. Şantiye Ağır Ekipman, Mobilizasyon ve İSG" },
      { pozNo: "10.12", name: "İnşaat Bütün Riskler (CAR / All-Risk) ve Mali Mesuliyet Sigortası Poliçesi", spec: "Proje All-Risk ve 3. Şahıs Mali Mesuliyet", unit: "Poliçe", quantity: 1, unitPrice: 550000, totalAmount: 550000, subGroup: "2. Şantiye Ağır Ekipman, Mobilizasyon ve İSG" },
    ],
  },
  "11": {
    title: "GRUP 11: RESMİ HARÇLAR, PROJE MÜHENDİSLİK VE DENETİM",
    subtitle: "Mimari, Statik, Mekanik & Elektrik Uygulama Projeleri, Belediye Ruhsat/Otopark Harçları & Yapı Denetim",
    items: [
      { pozNo: "11.01", name: "Mimari Uygulama Projesi, Ticari Konsept ve 3D Render / Tanıtım Kataloğu", spec: "Mimari Tasarım ve Ruhsat Projeleri", unit: "Set", quantity: 1, unitPrice: 850000, totalAmount: 850000, subGroup: "1. Proje Mühendislik ve Müşavirlik Hizmetleri (24.000 m²)" },
      { pozNo: "11.02", name: "Statik ve Betonarme Proje Hesap Raporları ve Onay Harçları", spec: "TBDY-2018 Statik Proje ve Raporları", unit: "Set", quantity: 1, unitPrice: 650000, totalAmount: 650000, subGroup: "1. Proje Mühendislik ve Müşavirlik Hizmetleri (24.000 m²)" },
      { pozNo: "11.03", name: "Mekanik, Havalandırma ve Yangın Tesisatı Uygulama Projeleri", spec: "Mekanik Tesisat ve Yangın Projeleri", unit: "Set", quantity: 1, unitPrice: 380000, totalAmount: 380000, subGroup: "1. Proje Mühendislik ve Müşavirlik Hizmetleri (24.000 m²)" },
      { pozNo: "11.04", name: "Elektrik, Zayıf Akım ve Otomasyon Projeleri Çizim ve Onayı", spec: "Elektrik ve Yangın Algılama Projeleri", unit: "Set", quantity: 1, unitPrice: 360000, totalAmount: 360000, subGroup: "1. Proje Mühendislik ve Müşavirlik Hizmetleri (24.000 m²)" },
      { pozNo: "11.05", name: "10.000 m² Arsa Zemin Etüdü, Jeofizik Ölçümler ve Geoteknik Rapor", spec: "Geoteknik ve Sismik Zemin Raporu", unit: "Set", quantity: 1, unitPrice: 240000, totalAmount: 240000, subGroup: "1. Proje Mühendislik ve Müşavirlik Hizmetleri (24.000 m²)" },
      { pozNo: "11.06", name: "Bina Akustik Raporu ve Enerji Kimlik Belgesi (EKB) Düzenleme", spec: "BEP Uyumlu Akustik ve EKB Belgesi", unit: "Set", quantity: 1, unitPrice: 140000, totalAmount: 140000, subGroup: "1. Proje Mühendislik ve Müşavirlik Hizmetleri (24.000 m²)" },
      { pozNo: "11.07", name: "Belediye Yapı Ruhsatı Tasdik Harçları ve İmar Katılım Bedelleri", spec: "İlçe Belediyesi Ruhsat Tasdik Harcı", unit: "m²", quantity: 24000, unitPrice: 190, totalAmount: 4560000, subGroup: "2. Belediye Harçları, Altyapı Katılım ve Yapı Denetim Hizmeti" },
      { pozNo: "11.08", name: "Otopark Harcı ve Bölge Yol/Altyapı İmar Payı", spec: "Büyükşehir Belediyesi Ulaşım & Altyapı", unit: "m²", quantity: 24000, unitPrice: 85, totalAmount: 2040000, subGroup: "2. Belediye Harçları, Altyapı Katılım ve Yapı Denetim Hizmeti" },
      { pozNo: "11.09", name: "Bakanlıkça Belirlenen Yapı Denetim Hizmet Bedeli (20 Aylık Hak Edişler)", spec: "4708 Sayılı Kanun Yapı Denetim Payı", unit: "m²", quantity: 24000, unitPrice: 245, totalAmount: 5880000, subGroup: "2. Belediye Harçları, Altyapı Katılım ve Yapı Denetim Hizmeti" },
      { pozNo: "11.10", name: "Elektrik (MEDAŞ), Su (KOSKİ) ve Doğalgaz (ENERYA) Ana Bağlantı Harçları", spec: "MEDAŞ, KOSKİ, ENERYA Şebeke Bağlantı", unit: "Set", quantity: 1, unitPrice: 850000, totalAmount: 850000, subGroup: "2. Belediye Harçları, Altyapı Katılım ve Yapı Denetim Hizmeti" },
      { pozNo: "11.11", name: "İskan Harçları ve Belediye Yapı Kullanma İzin Tasdik Bedelleri", spec: "Yapı Kullanma İzni ve İskan Harçları", unit: "m²", quantity: 24000, unitPrice: 110, totalAmount: 2640000, subGroup: "2. Belediye Harçları, Altyapı Katılım ve Yapı Denetim Hizmeti" },
    ],
  },
  "12": {
    title: "GRUP 12: SGK ASGARİ İŞÇİLİK VE İLİŞİKSİZLİK HESAP TABLOSU",
    subtitle: "5510 Sayılı Kanun Kapsamında ÇŞB IV-A Grubu ve Toplam Ruhsat Alanına Göre Yasal Maliyet",
    items: [
      { pozNo: "12.01", name: "Toplam Ruhsata Esas Kapalı İnşaat Alanı", spec: "Konut, Ticari ve Ortak Alanlar Dahil Brüt Alan", unit: "m²", quantity: 25080, unitPrice: 0, totalAmount: 0, subGroup: "1. Yasal Parametreler & Çarpanlar", isParameter: true },
      { pozNo: "12.02", name: "ÇŞB Yapı Yaklaşık Birim Maliyeti (IV. Sınıf A Grubu Yapı)", spec: "Resmi Gazete 2026 Yılı İnşaat Birim Maliyeti", unit: "TL / m²", quantity: 1, unitPrice: 13800, totalAmount: 0, subGroup: "1. Yasal Parametreler & Çarpanlar", isParameter: true },
      { pozNo: "12.03", name: "SGK'ya Esas Toplam Yaklaşık İnşaat Maliyeti", spec: "İşçilik Matrahına Esas Yasal İnşaat Maliyeti (25.080 m² x 13.800 TL)", unit: "TL", quantity: 1, unitPrice: 346104000, totalAmount: 0, subGroup: "1. Yasal Parametreler & Çarpanlar", isParameter: true },
      { pozNo: "12.04", name: "SGK Asgari İşçilik Tebliğ Oranı Çarpanı (IV-A Sınıfı)", spec: "%9.00 (Tebliğde Belirlenen Asgari İşçilik Oranı)", unit: "Oran", quantity: 1, unitPrice: 0.09, totalAmount: 0, subGroup: "1. Yasal Parametreler & Çarpanlar", isParameter: true },
      { pozNo: "12.05", name: "Yasal Olarak Bildirilmesi Gereken Net Asgari İşçilik Matrahı (%9)", spec: "SGK'ya Bildirilmesi Zorunlu Brüt İşçilik Matrahı (346.104.000 TL x %9)", unit: "TL", quantity: 1, unitPrice: 31149360, totalAmount: 0, subGroup: "1. Yasal Parametreler & Çarpanlar", isParameter: true },
      { pozNo: "12.06", name: "Müteahhidin Kendi SGK Bordrosundan Bildireceği Net İşçilik Payı (%25)", spec: "Müteahhit Bordrolu İşçilik Matrahı (%25 Çarpanı)", unit: "TL", quantity: 1, unitPrice: 7787340, totalAmount: 0, subGroup: "1. Yasal Parametreler & Çarpanlar", isParameter: true },
      { pozNo: "12.07", name: "Net Uygulanan Teşvikli SGK Prim Oranı Çarpanı (%32.50)", spec: "5510 SK 81/ı Düzenli Ödeme Teşviki Dahil Prim Oranı", unit: "Oran", quantity: 1, unitPrice: 0.325, totalAmount: 0, subGroup: "1. Yasal Parametreler & Çarpanlar", isParameter: true },
      { pozNo: "12.08", name: "Müteahhit Bordro SGK Prim Maliyeti Toplamı", spec: "7.787.340 TL matrah üzerinden net SGK prim tahakkuku", unit: "TL", quantity: 1, unitPrice: 2530885.5, totalAmount: 2530885.5, subGroup: "2. Prim & Yasal Harç Nakit Yükü" },
      { pozNo: "12.09", name: "Damga Vergisi ve SGK İdari İşlem Masrafları (20 Ay)", spec: "Aylık SGK Prim Bildirgeleri ve Damga Vergileri (20 Ay x 4.250 TL)", unit: "TL", quantity: 20, unitPrice: 4250, totalAmount: 85000, subGroup: "2. Prim & Yasal Harç Nakit Yükü" },
      { pozNo: "12.10", name: "Taşeron Faturaları Kalan İlişiksizlik SGK Teminat Payı", spec: "Fatura ve istihkak bildirimlerinden mahsup edilecek bakiye ilişiksizlik payı", unit: "TL", quantity: 1, unitPrice: 244114.5, totalAmount: 244114.5, subGroup: "2. Prim & Yasal Harç Nakit Yükü" },
    ],
  },
};

// 12_Mimari_Metraj_Parametreleri Verileri
export const architecturalMetrajData = {
  zoningParameters: [
    { code: "IM-01", name: "Toplam Arsa Parsel Alanı", value: "10.000", unit: "m²", desc: "10 Dönüm Parsel Alanı" },
    { code: "IM-02", name: "Taban Alanı Katsayısı (TAKS Oranı)", value: "%30 (0.30)", unit: "Oran", desc: "%30 Maksimum Taban Oturumu" },
    { code: "IM-03", name: "Bina Taban Oturma Alanı (TAKS)", value: "3.000", unit: "m²", desc: "4 Blok Toplam Oturumu (Yeşil Alan: 7.000 m²)" },
    { code: "IM-04", name: "Blok Sayısı", value: "4", unit: "Adet", desc: "Ayrık Nizam Bağımsız Bloklar" },
    { code: "IM-05", name: "Blok Başına Taban Oturumu", value: "750", unit: "m² / Blok", desc: "4 x 750 m² Blok Tabanı" },
    { code: "IM-06", name: "Üst Yapı Kat Sayısı (Zemin + Normal)", value: "5", unit: "Kat", desc: "1 Zemin Ticari + 4 Normal Kat" },
    { code: "IM-07", name: "Bodrum Kat Sayısı (Otopark & Ortak)", value: "2", unit: "Kat", desc: "Kapalı Otopark, Sığınak, Tesisat" },
    { code: "IM-08", name: "Toplam Kat Sayısı (Bodrumlar Dahil)", value: "7", unit: "Kat / Blok", desc: "Her Blok Toplam 7 Kat" },
    { code: "IM-09", name: "Hedeflenen İnşaat Süresi", value: "20", unit: "Ay", desc: "Anahtar Teslim İnşaat Takvimi" },
  ],
  apartments: [
    { type: "2+1 Lüks Konut Dairesi", count: 32, netM2: 132, balconyM2: 18, wallM2: 30, commonShareM2: 50, unitGrossM2: 230, grossMultiplier: 1.74, totalGrossM2: 7360 },
    { type: "3+1 Lüks Konut Dairesi", count: 32, netM2: 168, balconyM2: 22, wallM2: 40, commonShareM2: 50, unitGrossM2: 280, grossMultiplier: 1.67, totalGrossM2: 8960 },
  ],
  commercials: [
    { type: "A Tipi Cadde Cepheli Büyük Mağaza", count: 4, groundNetM2: 180, mezzanineM2: 90, basementStorageM2: 80, unitGrossM2: 400, grossMultiplier: 1.14, totalGrossM2: 1600 },
    { type: "B Tipi Cadde & Köşe Ticari Dükkan", count: 6, groundNetM2: 110, mezzanineM2: 55, basementStorageM2: 0, unitGrossM2: 200, grossMultiplier: 1.21, totalGrossM2: 1200 },
    { type: "C Tipi Standart Cadde Dükkanı", count: 6, groundNetM2: 85, mezzanineM2: 0, basementStorageM2: 0, unitGrossM2: 105, grossMultiplier: 1.24, totalGrossM2: 630 },
  ],
  commonAreas: [
    { function: "Kapalı Otopark Alanı (110 Araçlık)", location: "Bodrum Katlar (-1 ve -2)", count: 2, unitM2: 1600, totalGrossM2: 3200, desc: "Sakinler ve ticari kapalı otoparkı", status: "Emsal Dışı" },
    { function: "Kat Holleri, Merdivenler ve Yangın Kaçış Şaftları", location: "Tüm Bloklar (4 Blok x 5 Kat)", count: 20, unitM2: 50, totalGrossM2: 1000, desc: "Bina içi düşey ve yatay sirkülasyon", status: "Kısmen Emsal" },
    { function: "Merkezi Sığınak Alanları (Yasal Zorunlu)", location: "1. Bodrum Kat", count: 4, unitM2: 112.5, totalGrossM2: 450, desc: "Afet ve acil durum sığınakları", status: "Emsal Dışı" },
    { function: "Mekanik / Elektrik Tesisat Odaları & Su Deposu", location: "2. Bodrum Kat", count: 4, unitM2: 87.5, totalGrossM2: 350, desc: "Kazan dairesi, hidrofor, trafo, pano", status: "Emsal Dışı" },
    { function: "Site Yönetim Odası, Güvenlik Kulübesi & Kapıcı", location: "Zemin Kat / Giriş", count: 2, unitM2: 45, totalGrossM2: 90, desc: "Site işletmesi ve 7/24 güvenlik", status: "Emsal İçi" },
    { function: "Çatı Arası Hacimleri ve Asansör Makine Dairesi", location: "Çatı Katı (4 Blok)", count: 4, unitM2: 60, totalGrossM2: 240, desc: "MRL asansör üstü ve çatı çıkışı", status: "Emsal Dışı" },
  ],
  areaSummary: [
    { no: 1, category: "Konut (Daire) Brüt Alanları", units: 64, totalGrossM2: 16320, sharePct: 65.1, emsal: "Emsale Dahil", note: "32 Adet 2+1 + 32 Adet 3+1 Daire" },
    { no: 2, category: "Ticari İşyeri & Dükkan Brüt Alanları", units: 16, totalGrossM2: 3430, sharePct: 13.7, emsal: "Emsale Dahil", note: "16 Adet Cadde Cepheli Mağaza/Dükkan" },
    { no: 3, category: "Bina, Otopark & Tesisat Ortak Alanları", units: "-", totalGrossM2: 5330, sharePct: 21.2, emsal: "Kısmen Emsal Harici", note: "110 Araç Otopark, Sığınak, Tesisat (25.080 m² Tamamlayıcı)" },
  ],
};

// 13_Arsa_Değerleme_Kıyas Verileri
export const landValuationData = {
  comparables: [
    { no: "Emsal 1", location: "Ana Cadde Cepheli Ticari+Konut Parseli", areaM2: 8500, emsal: 1.8, price: 245000000, unitPrice: 28824, adjPrice: 28824 },
    { no: "Emsal 2", location: "Merkez Bulvar Yakını Konut Parseli", areaM2: 12000, emsal: 1.6, price: 310000000, unitPrice: 25833, adjPrice: 27125 },
    { no: "Emsal 3", location: "Köşe Başı Ticari Lejantlı Arsa", areaM2: 6500, emsal: 2.0, price: 205000000, unitPrice: 31538, adjPrice: 29962 },
    { no: "Emsal 4", location: "Gelişme Bölgesi 10 Dönüm Parsel", areaM2: 10000, emsal: 1.75, price: 275000000, unitPrice: 27500, adjPrice: 28050 },
  ],
  averageValuation: {
    avgAreaM2: 9250,
    avgEmsal: 1.78,
    avgPrice: 258750000,
    unitPriceM2: 28490,
  },
  landCostParameters: [
    { no: 1, title: "Toplam Parsel Alanı", value: "10.000", unit: "m²", desc: "10 Dönüm Parsel" },
    { no: 2, title: "Piyasa m² Rayiç Fiyatı (Emsal Analiz Sonucu)", value: "28.490 TL", unit: "TL / m²", desc: "Bölge Emsal Ortalama Değeri" },
    { no: 3, title: "TOPLAM NAKİT PİYASA ARSA BEDELİ", value: "284.900.000 TL", unit: "TL", desc: "Arsanın Peşin Satın Alma Değeri" },
    { no: 4, title: "Belediye Emlak Vergisi Birim m² Asgari Rayiç Değeri", value: "4.250 TL", unit: "TL / m²", desc: "Tapu Harcı ve Vergiye Esas Değer" },
    { no: 5, title: "Emlak Vergisine Esas Toplam Arsa Değeri", value: "42.500.000 TL", unit: "TL", desc: "Asgari Beyan Değeri" },
    { no: 6, title: "Tapu Devir Harcı (%4 Toplam - %2 Alıcı + %2 Satıcı)", value: "11.396.000 TL", unit: "TL", desc: "Nakit Satın Almada Ödenecek Tapu Harcı" },
    { no: 7, title: "Döner Sermaye ve Kadastro Harçları", value: "65.000 TL", unit: "TL", desc: "Tapu Müdürlüğü İşlem Masrafları" },
    { no: 8, title: "Toplam Peşin Satın Alma Maliyeti (Harçlar Dahil)", value: "296.361.000 TL", unit: "TL", desc: "Nakit Yatırımla Arsa Temini" },
  ],
  landownerGivenUnits: [
    { section: "2+1 Lüks Daireler (150 m² Net)", count: 14, netM2: 150, unitRate: 8500000, totalMarketValue: 119000000, constructionShare: 91448000 },
    { section: "3+1 Lüks Daireler (190 m² Net)", count: 14, netM2: 190, unitRate: 11500000, totalMarketValue: 161000000, constructionShare: 111160000 },
    { section: "Cadde Cepheli Ticari Dükkanlar", count: 7, netM2: 235, unitRate: 16000000, totalMarketValue: 112000000, constructionShare: 45672000 },
  ],
};

// 14_KDV_Rejimi_ve_Fatura_Sim Verileri
export const vatSimulationData = {
  matrixRules: [
    { period: "01/01/2013 Öncesi", metro: "Büyükşehir", classType: "Lüks / 1. Sınıf", landVal: "Önemsiz", under150: "%1", over150Old: "%20", under150New: "-", over150New: "-", commercial: "%20" },
    { period: "01/01/2013 - 31/12/2016", metro: "Büyükşehir", classType: "Lüks / 1. Sınıf", landVal: "0 - 499 TL", under150: "%1", over150Old: "%20", under150New: "-", over150New: "-", commercial: "%20" },
    { period: "01/01/2013 - 31/12/2016", metro: "Büyükşehir", classType: "Lüks / 1. Sınıf", landVal: "500 - 999 TL", under150: "%10", over150Old: "%20", under150New: "-", over150New: "-", commercial: "%20" },
    { period: "01/01/2013 - 31/12/2016", metro: "Büyükşehir", classType: "Lüks / 1. Sınıf", landVal: "1.000 TL ve üzeri", under150: "%20", over150Old: "%20", under150New: "-", over150New: "-", commercial: "%20" },
    { period: "01/01/2017 - 31/03/2022", metro: "Büyükşehir", classType: "Lüks / 1. Sınıf", landVal: "0 - 999 TL", under150: "%1", over150Old: "%20", under150New: "-", over150New: "-", commercial: "%20" },
    { period: "01/01/2017 - 31/03/2022", metro: "Büyükşehir", classType: "Lüks / 1. Sınıf", landVal: "1.000 - 2.000 TL", under150: "%10", over150Old: "%20", under150New: "-", over150New: "-", commercial: "%20" },
    { period: "01/01/2017 - 31/03/2022", metro: "Büyükşehir", classType: "Lüks / 1. Sınıf", landVal: "2.000 TL üzeri", under150: "%20", over150Old: "%20", under150New: "-", over150New: "-", commercial: "%20" },
    { period: "01/04/2022 Sonrası (GÜNCEL)", metro: "Fark Etmez", classType: "Genel Uygulama (Standart)", landVal: "Arsa Değeri Önemsiz", under150: "-", over150Old: "-", under150New: "%10", over150New: "%20", commercial: "%20" },
    { period: "01/04/2022 Sonrası (GÜNCEL)", metro: "Fark Etmez", classType: "Kentsel Dönüşüm (6306 SK)", landVal: "Arsa Değeri Önemsiz", under150: "-", over150Old: "-", under150New: "%1", over150New: "%20", commercial: "%20" },
  ],
  allUnitsVatAnalysis: [
    { type: "2+1 Konutlar (Müteahhit Payı - Net 150 m²)", count: 18, netM2: 150, unitExVat: 8500000, totalBaseExVat: 153000000, base10Pct: 153000000, base20Pct: 0, totalVat: 15300000, grossRevenueWithVat: 168300000 },
    { type: "3+1 Konutlar (Müteahhit Payı - Net 190 m²)", count: 18, netM2: 190, unitExVat: 11500000, totalBaseExVat: 207000000, base10Pct: 163421053, base20Pct: 43578947, totalVat: 25057895, grossRevenueWithVat: 232057895 },
    { type: "Ticari Dükkanlar (Müteahhit Payı)", count: 9, netM2: 235, unitExVat: 16000000, totalBaseExVat: 144000000, base10Pct: 0, base20Pct: 144000000, totalVat: 28800000, grossRevenueWithVat: 172800000 },
  ],
  totalVatSummary: {
    unitsCount: 45,
    totalBaseExVat: 504000000,
    base10Pct: 316421053,
    base20Pct: 187578947,
    totalVat: 69157895,
    grossRevenueWithVat: 573157895,
  },
};

export const cashFlowData: CashFlowRow[] = [
  { groupNo: "02", title: "Hafriyat, Zemin İyileştirme & İksa Sistemleri", totalBudget: 35385500, monthly: [12384925, 15923475, 7077100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { groupNo: "03", title: "Kaba Yapı ve Taşıyıcı Sistemler (Beton & Donatı)", totalBudget: 123735500, monthly: [0, 6186775, 12373550, 18560325, 24747100, 24747100, 18560325, 12373550, 6186775, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { groupNo: "04", title: "Çatı Konstrüksiyonu & Dış Cephe Kaplamaları", totalBudget: 41945500, monthly: [0, 0, 0, 0, 0, 0, 0, 4194550, 6291825, 8389100, 8389100, 6291825, 4194550, 4194550, 0, 0, 0, 0, 0, 0] },
  { groupNo: "05", title: "İnce Yapı, Mimari Kaplamalar ve Mobilya", totalBudget: 101238400, monthly: [0, 0, 0, 0, 0, 0, 0, 0, 0, 5061920, 10123840, 15185760, 15185760, 15185760, 15185760, 10123840, 10123840, 5061920, 0, 0] },
  { groupNo: "06", title: "Mekanik, Havalandırma ve Yangın Tesisatı", totalBudget: 30366000, monthly: [0, 0, 0, 0, 0, 1518300, 1518300, 3036600, 3036600, 3036600, 3036600, 3036600, 3036600, 3036600, 3036600, 1518300, 1518300, 0, 0, 0] },
  { groupNo: "07", title: "Elektrik Dağıtım, Aydınlatma ve Zayıf Akım", totalBudget: 23634000, monthly: [0, 0, 0, 0, 0, 1181700, 1181700, 2363400, 2363400, 2363400, 2363400, 2363400, 2363400, 2363400, 2363400, 1181700, 1181700, 0, 0, 0] },
  { groupNo: "08", title: "Asansör ve Bina Giriş / Atık Sistemleri", totalBudget: 11760000, monthly: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2352000, 2352000, 2352000, 2352000, 1176000, 1176000, 0, 0, 0] },
  { groupNo: "09", title: "Altyapı, Çevre Güvenliği ve Peyzaj Tanzimi", totalBudget: 9530000, monthly: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 953000, 1906000, 2382500, 2382500, 1429500, 476500] },
  { groupNo: "10", title: "Şantiye Yönetimi, Teknik Personel & Ağır Ekipman", totalBudget: 20200000, monthly: [1010000, 1010000, 1010000, 1010000, 1010000, 1010000, 1010000, 1010000, 1010000, 1010000, 1010000, 1010000, 1010000, 1010000, 1010000, 1010000, 1010000, 1010000, 1010000, 1010000] },
  { groupNo: "11", title: "Resmi Harçlar, Proje Mühendislik ve Denetim", totalBudget: 18590000, monthly: [9295000, 4647500, 1859000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 929500, 1859000] },
  { groupNo: "12", title: "SGK Asgari İşçilik ve İlişiksizlik Primi", totalBudget: 2860000, monthly: [143000, 143000, 143000, 143000, 143000, 143000, 143000, 143000, 143000, 143000, 143000, 143000, 143000, 143000, 143000, 143000, 143000, 143000, 143000, 143000] },
];

export const sensitivityData = {
  materials: [
    { name: "Donatı Çeliği (B420C İnşaat Demiri)", sharePct: 18, discount10: 67917674, base: 75464082, plus10: 83010490, shock25: 94330103, crisis40: 105649715 },
    { name: "Hazır Beton (C35/45 & C30/37)", sharePct: 15, discount10: 56598062, base: 62886735, plus10: 69175409, shock25: 78608419, crisis40: 88041429 },
    { name: "Şantiye İşçilik Ücretleri ve Taşeron Ekipleri", sharePct: 22, discount10: 83010490, base: 92233878, plus10: 101457266, shock25: 115292348, crisis40: 129127429 },
    { name: "Mekanik / Elektrik Donanımlar ve Tesisat", sharePct: 14, discount10: 52824857, base: 58694286, plus10: 64563715, shock25: 73367858, crisis40: 82172000 },
    { name: "Dış Cephe Mantolama, Kompozit ve Doğramalar", sharePct: 12, discount10: 45278449, base: 50309388, plus10: 55340327, shock25: 62886735, crisis40: 70433143 },
  ],
  scenarios: [
    { title: "En İyimser Senaryo", desc: "Maliyetler -%5, Gayrimenkul satış fiyatları +%10 artarsa", totalCost: 398282655, salesRevenue: 554400000, netProfit: 156117345, risk: "Düşük Risk" },
    { title: "Hedeflenen Baz Senaryo", desc: "Mevcut keşif maliyeti ve hedeflenen bölge rayiç satışları", totalCost: 419244900, salesRevenue: 504000000, netProfit: 84755100, risk: "Planlanan Durum" },
    { title: "Maliyet Artış Baskısı", desc: "İnşaat maliyetleri +%10 artar, satış fiyatı sabit kalırsa", totalCost: 461169390, salesRevenue: 504000000, netProfit: 42830610, risk: "Orta Risk" },
    { title: "Stagflasyon (Durgunluk)", desc: "Maliyetler +%15 artar, konut & dükkan fiyatları -%5 düşerse", totalCost: 482131635, salesRevenue: 478800000, netProfit: -3331635, risk: "Kritik Eşik" },
    { title: "Şiddetli Kriz Senaryosu", desc: "Maliyetler +%25 artar, satış fiyatları -%10 gerilerse", totalCost: 524056125, salesRevenue: 453600000, netProfit: -70456125, risk: "Yüksek Risk / Zarar" },
  ],
};
