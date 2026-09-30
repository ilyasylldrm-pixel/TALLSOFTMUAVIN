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
  defaultAmount?: number;
  category?: string;
  description?: string;
  isDeduction?: boolean; // Kesinti/Stopaj mı (true: net tutardan düşülür, false: faturaya eklenir)
}

/**
 * GİB KDV Tevkifat Kodları (601 - 625) ve Tam Tevkifat (699)
 * Güncel KDV Genel Uygulama Tebliği uyarınca
 */
export const GIB_WITHHOLDING_CODES: GibWithholdingCode[] = [
  {
    code: "601",
    name: "Yapım işleri ile bu işlerle birlikte ifa edilen mühendislik-mimarlık ve etüt-proje hizmetleri",
    numerator: 4,
    denominator: 10,
    rateLabel: "4/10",
    description: "Bina, karayolu, demiryolu, köprü, tünel, baraj, tesisat vb. yapım işleri ile mimarlık-mühendislik hizmetleri",
    category: "Yapım / İnşaat",
  },
  {
    code: "602",
    name: "Etüt, plan-proje, danışmanlık, denetim ve benzeri hizmetler",
    numerator: 9,
    denominator: 10,
    rateLabel: "9/10",
    description: "Teknik, mali, hukuki etüt, fizibilite, plan-proje, danışmanlık ve denetim hizmetleri",
    category: "Danışmanlık / Denetim",
  },
  {
    code: "603",
    name: "Makine, teçhizat, demirbaş ve taşıtlara ait tadil, bakım ve onarım hizmetleri",
    numerator: 7,
    denominator: 10,
    rateLabel: "7/10",
    description: "İş makineleri, cihazlar, otomotiv ve demirbaşların tadil, bakım ve onarım işçilik bedelleri",
    category: "Bakım / Onarım",
  },
  {
    code: "604",
    name: "Yemek servis hizmeti",
    numerator: 5,
    denominator: 10,
    rateLabel: "5/10",
    description: "Tabldot yemek servisi, catering, yemek dağıtım ve servis hizmetleri",
    category: "Yemek / Gıda",
  },
  {
    code: "605",
    name: "Organizasyon hizmeti",
    numerator: 5,
    denominator: 10,
    rateLabel: "5/10",
    description: "Konser, fuar, festival, kongre, seminer, düğün vb. etkinlik organizasyon hizmetleri",
    category: "Organizasyon",
  },
  {
    code: "606",
    name: "İşgücü temin hizmetleri",
    numerator: 9,
    denominator: 10,
    rateLabel: "9/10",
    description: "Personel, eleman temin ve bordrolama hizmetleri",
    category: "İşgücü",
  },
  {
    code: "607",
    name: "Özel güvenlik hizmeti",
    numerator: 9,
    denominator: 10,
    rateLabel: "9/10",
    description: "Silahlı ve silahsız özel güvenlik, koruma ve güvenlik gözetim hizmetleri",
    category: "Güvenlik",
  },
  {
    code: "608",
    name: "Yapı denetim hizmetleri",
    numerator: 9,
    denominator: 10,
    rateLabel: "9/10",
    description: "4708 sayılı Yapı Denetimi Hakkında Kanun kapsamında yapı denetim kuruluşlarının hizmetleri",
    category: "Yapı Denetim",
  },
  {
    code: "609",
    name: "Fason olarak yaptırılan tekstil ve konfeksiyon işleri, çanta ve ayakkabı dikim işleri ve bu işlere aracılık hizmetleri",
    numerator: 7,
    denominator: 10,
    rateLabel: "7/10",
    description: "Fason kumaş kesim, dikim, ütüleme, yıkama, paketleme, çanta ve ayakkabı dikimi ile aracılık hizmetleri",
    category: "Tekstil / Fason",
  },
  {
    code: "610",
    name: "Turistik mağazalara verilen müşteri bulma / götürme hizmetleri",
    numerator: 9,
    denominator: 10,
    rateLabel: "9/10",
    description: "Turist kafilelerini alışveriş mağazalarına yönlendirme, müşteri bulma/götürme ve komisyon hizmetleri",
    category: "Turizm / Komisyon",
  },
  {
    code: "611",
    name: "Spor kulüplerinin yayın, reklâm ve isim hakkı gelirlerine konu işlemleri",
    numerator: 9,
    denominator: 10,
    rateLabel: "9/10",
    description: "Spor kulüplerine ait reklam, sponsorluk, yayın ve isim hakkı gelirlerine konu işlemler",
    category: "Spor / Reklam",
  },
  {
    code: "612",
    name: "Temizlik hizmeti",
    numerator: 9,
    denominator: 10,
    rateLabel: "9/10",
    description: "Bina, ofis, tesis, cadde temizliği ile cam ve halı yıkama hizmetleri",
    category: "Temizlik",
  },
  {
    code: "613",
    name: "Çevre ve bahçe bakım hizmetleri",
    numerator: 9,
    denominator: 10,
    rateLabel: "9/10",
    description: "Park, bahçe, peyzaj düzenlemesi, ağaç budama, ilaçlama ve çevre bakım hizmetleri",
    category: "Çevre / Bahçe",
  },
  {
    code: "614",
    name: "Servis taşımacılığı hizmeti",
    numerator: 5,
    denominator: 10,
    rateLabel: "5/10",
    description: "Personel, memur, işçi ve öğrenci servis taşımacılığı hizmetleri",
    category: "Taşımacılık / Servis",
  },
  {
    code: "615",
    name: "Her türlü baskı ve basım hizmetleri",
    numerator: 7,
    denominator: 10,
    rateLabel: "7/10",
    description: "Kitap, dergi, gazete, broşür, afiş, etiket, kutu vb. matbaa basım hizmetleri",
    category: "Basım / Matbaa",
  },
  {
    code: "616",
    name: "5018 sayılı kanuna ekli cetvellerdeki idare, kurum ve kuruşlara yapılan diğer hizmetler",
    numerator: 5,
    denominator: 10,
    rateLabel: "5/10",
    description: "5018 sayılı Kamu Malî Yönetimi ve Kontrol Kanununa ekli cetvellerde yer alan idare, kurum ve kuruluşlara yapılan diğer hizmetler",
    category: "Kamu Hizmetleri",
  },
  {
    code: "617",
    name: "Hurda metalden elde edilen külçe teslimleri",
    numerator: 7,
    denominator: 10,
    rateLabel: "7/10",
    description: "Hurda metallerden eritilerek üretilen külçe teslimleri",
    category: "Metal / Külçe",
  },
  {
    code: "618",
    name: "Hurda metalden elde edilenler dışındaki bakır, çinko ve alüminyum külçe teslimleri",
    numerator: 7,
    denominator: 10,
    rateLabel: "7/10",
    description: "Cevherden veya birincil kaynaklardan elde edilen bakır, çinko ve alüminyum külçe teslimleri",
    category: "Metal / Külçe",
  },
  {
    code: "619",
    name: "Bakır, çinko ve alüminyum ürünlerinin teslimi",
    numerator: 7,
    denominator: 10,
    rateLabel: "7/10",
    description: "Bakır, çinko ve alüminyumdan mamul profil, boru, levha, tel vb. ürün teslimleri",
    category: "Metal / Mamul",
  },
  {
    code: "620",
    name: "İstisnadan vazgeçenlerin hurda ve atık teslimi",
    numerator: 7,
    denominator: 10,
    rateLabel: "7/10",
    description: "KDV Kanununun 17/4-g maddesindeki istisnadan vazgeçen mükelleflerce yapılan hurda ve atık teslimleri",
    category: "Hurda / Atık",
  },
  {
    code: "621",
    name: "Metal, plastik, lastik, kauçuk, kâğıt ve cam hurda ve atıklardan elde edilen hammadde teslimi",
    numerator: 9,
    denominator: 10,
    rateLabel: "9/10",
    description: "Hurda ve atıkların geri dönüşümünden elde edilen çapak, granül vb. ikincil hammadde teslimleri",
    category: "Geri Dönüşüm / Hammadde",
  },
  {
    code: "622",
    name: "Pamuk, tiftik, yün ve yapağı ile ham post ve deri teslimleri",
    numerator: 9,
    denominator: 10,
    rateLabel: "9/10",
    description: "Kütlü ve çırçırlanmış pamuk, tiftik, yün, yapağı, ham post ve deri teslimleri",
    category: "Tarım / Hammadde",
  },
  {
    code: "623",
    name: "Ağaç ve orman ürünleri teslimi",
    numerator: 5,
    denominator: 10,
    rateLabel: "5/10",
    description: "Kereste, tomruk, odun, talaş vb. ağaç ve orman ürünleri teslimleri",
    category: "Orman Ürünleri",
  },
  {
    code: "624",
    name: "Yük taşımacılığı hizmeti",
    numerator: 2,
    denominator: 10,
    rateLabel: "2/10",
    description: "Karayolu, denizyolu, demiryolu ve havayolu ile yapılan yük ve eşya taşımacılığı hizmetleri",
    category: "Taşımacılık / Lojistik",
  },
  {
    code: "625",
    name: "Ticari reklam hizmetleri",
    numerator: 3,
    denominator: 10,
    rateLabel: "3/10",
    description: "Açık hava, internet, TV, radyo ve basılı mecralarda ticari reklam tasarımı, yayını ve danışmanlık hizmetleri",
    category: "Reklam / Pazarlama",
  },
  {
    code: "626",
    name: "Demir-çelik ve alaşımlarından mamul ürünlerin teslimi",
    numerator: 5,
    denominator: 10,
    rateLabel: "5/10",
    description: "Demir-çelik ve alaşımlarından mamul ürünlerin (cevher, kütük, profil vb.) tesliminde KDV tevkifatı",
    category: "Demir / Çelik",
  },
  {
    code: "627",
    name: "Diğer hizmetler",
    numerator: 5,
    denominator: 10,
    rateLabel: "5/10",
    description: "KDV Genel Uygulama Tebliği uyarınca belirlenmiş alıcılara yapılan ve diğer kodlarda sayılmayan hizmet ifaları",
    category: "Diğer Hizmetler",
  },
  {
    code: "699",
    name: "Tam Tevkifat (10/10)",
    numerator: 10,
    denominator: 10,
    rateLabel: "10/10",
    description: "KDV'nin tamamının (%100) alıcı tarafından sorumlu sıfatıyla tevkif edildiği işlemler",
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
 * Ek Vergiler (GİB Resmi Ek Vergi Kodları Listesi)
 * Kullanıcı tarafından belirtilen tam liste
 */
export const GIB_ADDITIONAL_TAX_CODES: GibAdditionalTaxCode[] = [
  {
    code: "0003",
    name: "GV STOPAJI",
    type: "percent",
    defaultRate: 20,
    category: "Stopaj / Kesinti",
    description: "Gelir Vergisi Stopajı",
    isDeduction: true,
  },
  {
    code: "0011",
    name: "KV STOPAJI",
    type: "percent",
    defaultRate: 20,
    category: "Stopaj / Kesinti",
    description: "Kurumlar Vergisi Stopajı",
    isDeduction: true,
  },
  {
    code: "0021",
    name: "BMV",
    type: "percent",
    defaultRate: 5,
    category: "Banka / Sigorta",
    description: "Banka Muameleleri Vergisi (BSMV)",
    isDeduction: false,
  },
  {
    code: "0022",
    name: "SMV",
    type: "percent",
    defaultRate: 5,
    category: "Banka / Sigorta",
    description: "Sigorta Muameleleri Vergisi",
    isDeduction: false,
  },
  {
    code: "0061",
    name: "KKDF KESİNTİ",
    type: "percent",
    defaultRate: 6,
    category: "Fon / Kesinti",
    description: "Kaynak Kullanımını Destekleme Fonu Kesintisi",
    isDeduction: true,
  },
  {
    code: "0071",
    name: "ÖTV 1.LİSTE",
    type: "fixed",
    defaultRate: 0,
    category: "Özel Tüketim Vergisi",
    description: "ÖTV 1. Liste (Petrol, Akaryakıt, Doğalgaz vb.)",
    isDeduction: false,
  },
  {
    code: "0073",
    name: "ÖTV 3.LİSTE",
    type: "percent",
    defaultRate: 20,
    category: "Özel Tüketim Vergisi",
    description: "ÖTV 3. Liste (Tütün ve Alkollü İçecekler)",
    isDeduction: false,
  },
  {
    code: "0074",
    name: "ÖTV 4.LİSTE",
    type: "percent",
    defaultRate: 20,
    category: "Özel Tüketim Vergisi",
    description: "ÖTV 4. Liste (Dayanıklı Tüketim Malları, Elektronik)",
    isDeduction: false,
  },
  {
    code: "0075",
    name: "ÖTV 3A LİSTE",
    type: "percent",
    defaultRate: 20,
    category: "Özel Tüketim Vergisi",
    description: "ÖTV 3A Liste",
    isDeduction: false,
  },
  {
    code: "0076",
    name: "ÖTV 3B LİSTE",
    type: "percent",
    defaultRate: 20,
    category: "Özel Tüketim Vergisi",
    description: "ÖTV 3B Liste",
    isDeduction: false,
  },
  {
    code: "0077",
    name: "ÖTV 3C LİSTE",
    type: "percent",
    defaultRate: 20,
    category: "Özel Tüketim Vergisi",
    description: "ÖTV 3C Liste",
    isDeduction: false,
  },
  {
    code: "1047",
    name: "DAMGA V",
    type: "percent",
    defaultRate: 0.948,
    category: "Damga Vergisi",
    description: "Damga Vergisi",
    isDeduction: false,
  },
  {
    code: "1048",
    name: "5035SKDAMGAV",
    type: "fixed",
    defaultRate: 0,
    category: "Damga Vergisi",
    description: "5035 Sayılı Kanun Damga Vergisi",
    isDeduction: false,
  },
  {
    code: "4071",
    name: "ELK.HAVAGAZ.TÜK.VER.",
    type: "percent",
    defaultRate: 5,
    category: "Tüketim Vergisi",
    description: "Elektrik ve Havagazı Tüketim Vergisi",
    isDeduction: false,
  },
  {
    code: "4080",
    name: "Ö.İLETİŞİM V",
    type: "percent",
    defaultRate: 10,
    category: "Özel İletişim Vergisi",
    description: "Özel İletişim Vergisi (ÖİV)",
    isDeduction: false,
  },
  {
    code: "4081",
    name: "5035ÖZİLETV.",
    type: "percent",
    defaultRate: 10,
    category: "Özel İletişim Vergisi",
    description: "5035 Sayılı Kanun Özel İletişim Vergisi",
    isDeduction: false,
  },
  {
    code: "4171",
    name: "PTR-DGZ ÖTV TEVKİFAT",
    type: "percent",
    defaultRate: 50,
    category: "ÖTV Tevkifatı",
    description: "Petrol ve Doğalgaz ÖTV Tevkifatı",
    isDeduction: true,
  },
  {
    code: "8001",
    name: "BORSA TES.ÜC.",
    type: "percent",
    defaultRate: 0.1,
    category: "Harç / Fon",
    description: "Borsa Tescil Ücreti",
    isDeduction: false,
  },
  {
    code: "8002",
    name: "ENERJİ FONU",
    type: "percent",
    defaultRate: 1,
    category: "Harç / Fon",
    description: "Enerji Fonu",
    isDeduction: false,
  },
  {
    code: "8004",
    name: "TRT PAYI",
    type: "percent",
    defaultRate: 2,
    category: "Harç / Fon",
    description: "TRT Payı",
    isDeduction: false,
  },
  {
    code: "8005",
    name: "ELK.TÜK.VER.",
    type: "percent",
    defaultRate: 5,
    category: "Tüketim Vergisi",
    description: "Elektrik Tüketim Vergisi",
    isDeduction: false,
  },
  {
    code: "8006",
    name: "TK KULLANIM",
    type: "fixed",
    defaultRate: 0,
    category: "Telsiz / İletişim",
    description: "Telsiz Kullanım Ücreti",
    isDeduction: false,
  },
  {
    code: "8007",
    name: "TK RUHSAT",
    type: "fixed",
    defaultRate: 0,
    category: "Telsiz / İletişim",
    description: "Telsiz Ruhsat Ücreti",
    isDeduction: false,
  },
  {
    code: "8008",
    name: "ÇEV. TEM .VER.",
    type: "fixed",
    defaultRate: 0,
    category: "Çevre / Belediye",
    description: "Çevre Temizlik Vergisi",
    isDeduction: false,
  },
  {
    code: "9021",
    name: "4961BANKASMV",
    type: "percent",
    defaultRate: 5,
    category: "Banka / Sigorta",
    description: "4961 Sayılı Kanun Banka Sigorta Muameleleri Vergisi",
    isDeduction: false,
  },
  {
    code: "9040",
    name: "MERA FONU",
    type: "percent",
    defaultRate: 2,
    category: "Harç / Fon",
    description: "Mera Fonu",
    isDeduction: false,
  },
  {
    code: "9077",
    name: "ÖTV 2.LİSTE",
    type: "percent",
    defaultRate: 80,
    category: "Özel Tüketim Vergisi",
    description: "ÖTV 2. Liste (Motorlu Taşıtlar)",
    isDeduction: false,
  },
  {
    code: "9944",
    name: "BEL.ÖD.HAL RÜSUM",
    type: "percent",
    defaultRate: 1,
    category: "Hal / Rüsum",
    description: "Belediyelere Ödenen Hal Rüsumu",
    isDeduction: false,
  },
  {
    code: "SGK_PRIM",
    name: "SGK PRİM KESİNTİSİ",
    type: "percent",
    defaultRate: 2,
    category: "SGK / Kesinti",
    description: "SGK Prim Kesintisi",
    isDeduction: true,
  },
  {
    code: "0059",
    name: "KONAKLAMA VERGİSİ",
    type: "percent",
    defaultRate: 2,
    category: "Konaklama Vergisi",
    description: "Konaklama Vergisi",
    isDeduction: false,
  },
  {
    code: "9015",
    name: "KATMA DEĞER VERGİSİ TEVKİFATI",
    type: "percent",
    defaultRate: 50,
    category: "KDV Tevkifatı",
    description: "Katma Değer Vergisi Tevkifatı",
    isDeduction: true,
  },
];

/** Helper: Find additional tax code info */
export function getAdditionalTaxCodeInfo(code?: string): GibAdditionalTaxCode | undefined {
  if (!code) return undefined;
  return GIB_ADDITIONAL_TAX_CODES.find((t) => t.code === String(code).trim());
}

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

/** Helper: Resolve e-Fatura / e-Arşiv scenario or profile code */
export function resolveScenarioProfileCode(scenarioOrProfile?: string): string {
  const norm = String(scenarioOrProfile || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (norm.includes("EARSIV")) return "EARSIVFATURA";
  if (norm.includes("TICARI")) return "TICARIFATURA";
  if (norm.includes("IHRACAT")) return "IHRACAT";
  if (norm.includes("YOLCU")) return "YOLCUBERABERFATURA";
  if (norm.includes("KAMU")) return "KAMU";
  if (norm.includes("HAL")) return "HILFATURA";
  return "TEMELFATURA";
}
