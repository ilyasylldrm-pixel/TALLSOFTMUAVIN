// GİB e-Fatura / e-Arşiv Resmi Vergi, Tevkifat, Özel Matrah ve İstisna Kodları Veritabanı

export interface GibWithholdingCode {
  code: string;
  name: string;
  numerator: number;
  denominator: number;
  rateLabel: string;
  description?: string;
  category?: string;
}

export interface GibSpecialTaxBaseCode {
  code: string;
  name: string;
  lawArticle: string;
  description: string;
  defaultVatRate?: number;
}

export interface GibExemptionCode {
  code: string;
  name: string;
  lawArticle: string;
  category: "ihracat" | "istisna" | "diger";
}

export interface GibAdditionalTaxCode {
  code: string;
  name: string;
  type: "percent" | "fixed";
  defaultRate?: number;
}

/**
 * GİB KDV Tevkifat Kodları (601 - 627)
 * 117 Seri No.lu KDV Genel Tebliği ve güncel KDV Uygulama Genel Tebliği uyarınca
 */
export const GIB_WITHHOLDING_CODES: GibWithholdingCode[] = [
  {
    code: "601",
    name: "Yapım İşleri ile Bu İşlerle Birlikte İfa Edilen Mühendislik-Mimarlık ve Etüt-Proje Hizmetleri",
    numerator: 5,
    denominator: 10,
    rateLabel: "5/10",
    description: "Bina, karayolu, demiryolu, köprü, tünel, baraj, tesisat vb. yapım işleri",
    category: "İnşaat / Taahhüt",
  },
  {
    code: "602",
    name: "Temizlik, Çevre ve Bahçe Bakım Hizmetleri",
    numerator: 9,
    denominator: 10,
    rateLabel: "9/10",
    description: "Bina ve tesis temizliği, halı yıkama, park-bahçe bakımı ve ilaçlama",
    category: "Hizmet",
  },
  {
    code: "603",
    name: "Özel Güvenlik Hizmetleri",
    numerator: 9,
    denominator: 10,
    rateLabel: "9/10",
    description: "Silahlı veya silahsız özel güvenlik ve gözetim hizmetleri",
    category: "Hizmet",
  },
  {
    code: "604",
    name: "Makine, Teçhizat, Demirbaş ve Taşıtlara Ait Tadilat, Bakım ve Onarım Hizmetleri",
    numerator: 7,
    denominator: 10,
    rateLabel: "7/10",
    description: "İş makineleri, cihazlar, otomotiv ve demirbaşların bakım-onarım işçilik bedeli",
    category: "Teknik / Bakım",
  },
  {
    code: "605",
    name: "Yemek Servis ve Organizasyon Hizmetleri",
    numerator: 5,
    denominator: 10,
    rateLabel: "5/10",
    description: "Tabldot yemek servisi, catering, kongre ve organizasyon hizmetleri",
    category: "Gıda / Hizmet",
  },
  {
    code: "606",
    name: "İşgücü Temin Hizmetleri",
    numerator: 9,
    denominator: 10,
    rateLabel: "9/10",
    description: "Personel ve eleman temin/bordrolama hizmetleri",
    category: "Hizmet",
  },
  {
    code: "608",
    name: "Yapı Denetim Hizmetleri",
    numerator: 9,
    denominator: 10,
    rateLabel: "9/10",
    description: "Yapı denetim kuruluşları tarafından verilen denetim hizmetleri",
    category: "Denetim",
  },
  {
    code: "610",
    name: "Fason Olarak Yaptırılan Tekstil ve Konfeksiyon İşleri, Çanta ve Ayakkabı Dikim İşleri",
    numerator: 7,
    denominator: 10,
    rateLabel: "7/10",
    description: "Fason kesim, dikim, ütüleme, yıkama, paketleme ve apre işleri",
    category: "Tekstil / Üretim",
  },
  {
    code: "611",
    name: "Turistik Mağazalara Verilen Müşteri Bulma / Götürme Hizmetleri",
    numerator: 9,
    denominator: 10,
    rateLabel: "9/10",
    description: "Turist kafilelerini alışveriş mağazalarına yönlendirme/komisyon",
    category: "Turizm",
  },
  {
    code: "615",
    name: "Spor Kulüplerinin Yayın, Reklam ve İsim Hakkı Gelirlerine Konu İşlemleri",
    numerator: 9,
    denominator: 10,
    rateLabel: "9/10",
    description: "Spor kulüplerine ait reklam, sponsorluk ve yayın hakkı faturaları",
    category: "Medya / Spor",
  },
  {
    code: "618",
    name: "Servis Taşımacılığı Hizmeti",
    numerator: 5,
    denominator: 10,
    rateLabel: "5/10",
    description: "Personel, öğrenci ve yolcu servis taşımacılığı hizmetleri",
    category: "Ulaşım / Taşımacılık",
  },
  {
    code: "620",
    name: "Baskı ve Basım Hizmetleri",
    numerator: 7,
    denominator: 10,
    rateLabel: "7/10",
    description: "Matbaa, kitap, dergi, broşür, fatura ve afiş baskı hizmetleri",
    category: "Matbaa / Medya",
  },
  {
    code: "622",
    name: "Hurda ve Atık Teslimi",
    numerator: 7,
    denominator: 10,
    rateLabel: "7/10",
    description: "Metal, plastik, kağıt, cam hurda ve atıklarının teslimi",
    category: "Geri Dönüşüm",
  },
  {
    code: "624",
    name: "Demir-Çelik Ürünlerinin Teslimi",
    numerator: 5,
    denominator: 10,
    rateLabel: "5/10",
    description: "Kütük, profil, sac, nervürlü inşaat demiri vb. demir-çelik mamul teslimleri",
    category: "Sanayi / Metal",
  },
  {
    code: "625",
    name: "Ticari Reklam Hizmetleri",
    numerator: 3,
    denominator: 10,
    rateLabel: "3/10",
    description: "Dijital, açık hava, TV, radyo ve basılı reklam yayın ve danışmanlık hizmetleri",
    category: "Reklam / Pazarlama",
  },
  {
    code: "626",
    name: "Diğer Hizmetler",
    numerator: 5,
    denominator: 10,
    rateLabel: "5/10",
    description: "Belirlenmiş alıcılar için tebliğde sayılan diğer hizmet ifaları",
    category: "Genel Hizmet",
  },
  {
    code: "627",
    name: "Diğer Teslimler (Pamuk, Tiftik, Yün, Yapağı, Ham Post ve Deri)",
    numerator: 2,
    denominator: 10,
    rateLabel: "2/10",
    description: "Ağaç ve orman ürünleri, ham post, deri vb. ürün teslimleri",
    category: "Hammadde",
  },
  {
    code: "699",
    name: "Tam Tevkifat (10/10)",
    numerator: 10,
    denominator: 10,
    rateLabel: "10/10",
    description: "KDV'nin tamamının alıcı tarafından tevkif edildiği özel işlemler",
    category: "Tam Tevkifat",
  },
];

/**
 * GİB Özel Matrah Kodları (801 - 811)
 * 3065 Sayılı KDV Kanunu 23. Maddesi Kapsamında
 */
export const GIB_SPECIAL_TAX_BASE_CODES: GibSpecialTaxBaseCode[] = [
  {
    code: "809",
    name: "İkinci El Motorlu Kara Taşıtı Ticareti (Kâr Marjı)",
    lawArticle: "3065 S.K. Md. 23/f",
    description: "Yetki belgesine sahip oto galerilerde 2. el araç alım-satımında KDV yalnızca kâr marjı üzerinden hesaplanır.",
    defaultVatRate: 20,
  },
  {
    code: "810",
    name: "İkinci El Taşınmaz / Gayrimenkul Ticareti (Kâr Marjı)",
    lawArticle: "3065 S.K. Md. 23/f",
    description: "Yetki belgesine sahip emlak işletmelerinde 2. el taşınmaz alım-satımında KDV yalnızca kâr marjı üzerinden hesaplanır.",
    defaultVatRate: 20,
  },
  {
    code: "805",
    name: "Külçe Altın, Külçe Gümüş ve Kıymetli Madenler / Ziynet İşçiliği",
    lawArticle: "3065 S.K. Md. 23/e",
    description: "Külçe maden bedeli KDV'den istisnadır; KDV yalnızca işçilik bedeli üzerinden hesaplanır.",
    defaultVatRate: 20,
  },
  {
    code: "801",
    name: "Milli Piyango, Sayısal Loto, Spor Toto ve Benzeri Şans Oyunları",
    lawArticle: "3065 S.K. Md. 23/a",
    description: "Şans oyunlarında bilet bedeli içindeki bayilik/komisyon kârı üzerinden KDV.",
    defaultVatRate: 20,
  },
  {
    code: "802",
    name: "At Yarışları ve Diğer Müşterek Bahis Oyunları",
    lawArticle: "3065 S.K. Md. 23/b",
    description: "Bahis ve yarış işletmelerinde komisyon hasılatı üzerinden KDV.",
    defaultVatRate: 20,
  },
  {
    code: "804",
    name: "Gazete, Dergi ve Benzeri Süreli Yayınlar",
    lawArticle: "3065 S.K. Md. 23/d",
    description: "Periyodik yayınların perakende satış fiyatı üzerinden komisyon matrahı.",
    defaultVatRate: 20,
  },
  {
    code: "806",
    name: "Tütün Mamulleri Perakende Satışı",
    lawArticle: "3065 S.K. Md. 23/d",
    description: "ÖTV dahil perakende satış fiyatı üzerinden belirlenen bayi kâr matrahı.",
    defaultVatRate: 20,
  },
  {
    code: "808",
    name: "Gümrük Makbuzunda Gösterilmeyen Vergi ve Masraflar",
    lawArticle: "3065 S.K. Md. 23/c",
    description: "İthalat işlemlerindeki gümrükleme masrafları ve ardiye ücretleri.",
    defaultVatRate: 20,
  },
  {
    code: "811",
    name: "Seyahat Acenteleri ve Tur Operatörleri",
    lawArticle: "3065 S.K. Md. 23",
    description: "Yurtdışı/yurtiçi paket turlarda acente kâr marjı üzerinden KDV.",
    defaultVatRate: 20,
  },
];

/**
 * GİB KDV İstisna Kodları (200 - 351)
 * KDV Oranı %0 olduğunda GİB tarafından zorunlu tutulan kanun maddeleri
 */
export const GIB_EXEMPTION_CODES: GibExemptionCode[] = [
  {
    code: "301",
    name: "Mal İhracatı",
    lawArticle: "3065 S.K. Md. 11/1-a",
    category: "ihracat",
  },
  {
    code: "302",
    name: "Hizmet İhracatı",
    lawArticle: "3065 S.K. Md. 11/1-a",
    category: "ihracat",
  },
  {
    code: "303",
    name: "Ro-Ro ve Konteyner Taşımacılığı",
    lawArticle: "3065 S.K. Md. 11/1-a",
    category: "ihracat",
  },
  {
    code: "351",
    name: "Külçe Altın, Külçe Gümüş, Kıymetli Taş ve Maden Teslimleri",
    lawArticle: "3065 S.K. Md. 17/4-g",
    category: "istisna",
  },
  {
    code: "250",
    name: "Serbest Bölgelerde İfa Edilen Hizmetler ve Mal Teslimleri",
    lawArticle: "3065 S.K. Md. 17/4-ı",
    category: "istisna",
  },
  {
    code: "311",
    name: "Deniz, Hava ve Demiryolu Taşıma Araçlarının İmal, İnşa ve Tadilatı",
    lawArticle: "3065 S.K. Md. 13/a",
    category: "istisna",
  },
  {
    code: "313",
    name: "Yatırım Teşvik Belgesi Kapsamında Makine ve Teçhizat Teslimi",
    lawArticle: "3065 S.K. Md. 13/d",
    category: "istisna",
  },
  {
    code: "316",
    name: "Liman ve Hava Meydanlarında Yapılan Hizmetler",
    lawArticle: "3065 S.K. Md. 13/b",
    category: "istisna",
  },
  {
    code: "318",
    name: "Yurtdışındaki Müşterilere Yapılan Yazılım ve Bilişim Hizmetleri",
    lawArticle: "3065 S.K. Md. 11/1-a ve 12",
    category: "ihracat",
  },
  {
    code: "350",
    name: "Diğer İstisnalar (Kanunun İlgili Maddesi)",
    lawArticle: "3065 S.K. Çeşitli Md.",
    category: "diger",
  },
];

/**
 * Ek Vergiler (ÖTV, ÖİV, Konaklama, Stopaj, Damga Vergisi)
 */
export const GIB_ADDITIONAL_TAX_CODES: GibAdditionalTaxCode[] = [
  { code: "0015", name: "KDV (Katma Değer Vergisi)", type: "percent", defaultRate: 20 },
  { code: "9015", name: "KDV Tevkifatı", type: "percent", defaultRate: 50 },
  { code: "0071", name: "ÖTV 1. Liste (Petrol / Doğalgaz)", type: "fixed" },
  { code: "0073", name: "ÖTV 2. Liste (Motorlu Taşıtlar)", type: "percent", defaultRate: 80 },
  { code: "0074", name: "ÖTV 3. Liste (Tütün / Alkollü İçecek)", type: "percent" },
  { code: "0076", name: "ÖTV 4. Liste (Dayanıklı Tüketim / Elektronik)", type: "percent", defaultRate: 20 },
  { code: "4080", name: "Özel İletişim Vergisi (ÖİV)", type: "percent", defaultRate: 10 },
  { code: "0059", name: "Konaklama Vergisi", type: "percent", defaultRate: 2 },
  { code: "0003", name: "Gelir Stopajı (Gelir Vergisi Tevkifatı)", type: "percent", defaultRate: 20 },
  { code: "0040", name: "Damga Vergisi", type: "fixed" },
  { code: "0021", name: "BSMV (Banka ve Sigorta Muameleleri Vergisi)", type: "percent", defaultRate: 5 },
];

/** Helper: Find withholding code info */
export function getWithholdingCodeInfo(code?: string): GibWithholdingCode | undefined {
  if (!code) return undefined;
  return GIB_WITHHOLDING_CODES.find((w) => w.code === String(code).trim());
}

/** Helper: Find special tax base code info */
export function getSpecialTaxBaseCodeInfo(code?: string): GibSpecialTaxBaseCode | undefined {
  if (!code) return undefined;
  return GIB_SPECIAL_TAX_BASE_CODES.find((s) => s.code === String(code).trim());
}

/** Helper: Find exemption code info */
export function getExemptionCodeInfo(code?: string): GibExemptionCode | undefined {
  if (!code) return undefined;
  return GIB_EXEMPTION_CODES.find((e) => e.code === String(code).trim());
}
