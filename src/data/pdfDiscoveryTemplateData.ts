import { ConstructionCategory, ConstructionCostItem } from "../types";

export interface PdfDiscoveryItemDef {
  sNo: number;
  code: string;
  name: string;
  parentGroup?: string;
  category: ConstructionCategory;
  unit: string;
  isSummaryHeader?: boolean;
  defaultQuantity?: number;
  defaultUnitPrice?: number;
  notes: string;
}

export const PDF_TEMPLATE_METADATA = {
  author: "Erkan Turan",
  revNo: "01",
  revDate: "2026-09-21",
  title: "İCMAL / KEŞİF KALEMLERİ VE METRAJ BAZLI MALİYET TABLOSU",
  totalItems: 44,
};

/**
 * Kullanıcının yüklediği PDF dosyasında yer alan 44 adet standart keşif kalemi ve açıklamaları.
 * S.NO, KOD, AÇIKLAMA, KATEGORİ, BİRİM ve TEKNİK AÇIKLAMALARI içermektedir.
 */
export const PDF_DISCOVERY_TEMPLATE_ITEMS: PdfDiscoveryItemDef[] = [
  {
    sNo: 1,
    code: "1.0",
    name: "GENEL İMALAT VE YATIRIM GİDERLERİ",
    parentGroup: "1.0 Genel",
    category: "rough",
    unit: "paket",
    isSummaryHeader: true,
    notes: "Tüm şantiye imalat ve yatırım kalemlerinin ana başlığı",
  },
  {
    sNo: 2,
    code: "1.1",
    name: "İMALAT GİDERLERİ TOPLAMI",
    parentGroup: "1.1 İmalat",
    category: "rough",
    unit: "paket",
    isSummaryHeader: true,
    notes: "İnşaat, Mekanik ve Elektrik İmalatları Toplamı",
  },
  {
    sNo: 3,
    code: "1.1.1",
    name: "İNŞAAT",
    parentGroup: "1.1 İmalat",
    category: "rough",
    unit: "m²",
    isSummaryHeader: true,
    notes: "Kaba ve İnce Yapı İnşaat İmalatları",
  },
  {
    sNo: 4,
    code: "1.1.1.1",
    name: "KONUT BLOKLAR",
    parentGroup: "1.1.1 İnşaat",
    category: "rough",
    unit: "m²",
    notes: "Konut blokları kaba yapı (beton, demir, kalıp, duvar) ve ince inşaat işleri",
  },
  {
    sNo: 5,
    code: "1.1.1.2",
    name: "SOSYAL TESİS",
    parentGroup: "1.1.1 İnşaat",
    category: "fine",
    unit: "m²",
    notes: "Sosyal tesis binası, fitness, sauna, kapalı havuz inşaat ve mimari kaplama işleri",
  },
  {
    sNo: 6,
    code: "1.1.1.3",
    name: "KAPALI OTOPARKLAR ( SIĞINAK VE TEKNİK ALANLAR DAHİL )",
    parentGroup: "1.1.1 İnşaat",
    category: "rough",
    unit: "m²",
    notes: "Kapalı otoparklar, sığınak, su depoları, jeneratör ve teknik hacim inşaatları",
  },
  {
    sNo: 7,
    code: "1.1.1.4",
    name: "ÇEVRE ALTYAPI VE PEYZAJ İŞLERİ",
    parentGroup: "1.1.1 İnşaat",
    category: "fine",
    unit: "m²",
    notes: "Saha sert zemin kaplamaları, istinat duvarları, yeşil alan peyzaj ve çevre çitleri",
  },
  {
    sNo: 8,
    code: "1.1.2",
    name: "MEKANİK",
    parentGroup: "1.1 İmalat",
    category: "mechanical_electrical",
    unit: "m²",
    isSummaryHeader: true,
    notes: "Sıhhi tesisat, HVAC, yangın ve havalandırma mekanik işleri toplamı",
  },
  {
    sNo: 9,
    code: "1.1.2.1",
    name: "KONUT BLOKLAR",
    parentGroup: "1.1.2 Mekanik",
    category: "mechanical_electrical",
    unit: "m²",
    notes: "Konut blokları temiz/pis su tesisatı, yerden ısıtma/kombi hatları, klima altyapısı",
  },
  {
    sNo: 10,
    code: "1.1.2.2",
    name: "SOSYAL TESİS",
    parentGroup: "1.1.2 Mekanik",
    category: "mechanical_electrical",
    unit: "m²",
    notes: "Sosyal tesis klima santrali, havuz mekanik tesisatı ve taze hava sistemleri",
  },
  {
    sNo: 11,
    code: "1.1.2.3",
    name: "KAPALI OTOPARKLAR ( SIĞINAK VE TEKNİK ALANLAR DAHİL )",
    parentGroup: "1.1.2 Mekanik",
    category: "mechanical_electrical",
    unit: "m²",
    notes: "Otopark duman tahliye jet fanları, yangın sprinkler ve drenaj pompaları",
  },
  {
    sNo: 12,
    code: "1.1.2.4",
    name: "ÇEVRE ALTYAPI VE PEYZAJ İŞLERİ",
    parentGroup: "1.1.2 Mekanik",
    category: "mechanical_electrical",
    unit: "m²",
    notes: "Otomatik bahçe sulama tesisatı, yağmur suyu drenaj hatları ve foseptik/kanal bağlantısı",
  },
  {
    sNo: 13,
    code: "1.1.3",
    name: "ELEKTRİK",
    parentGroup: "1.1 İmalat",
    category: "mechanical_electrical",
    unit: "m²",
    isSummaryHeader: true,
    notes: "Kuvvetli akım, zayıf akım, trafo ve otomasyon elektrik işleri toplamı",
  },
  {
    sNo: 14,
    code: "1.1.3.1",
    name: "KONUT BLOKLAR",
    parentGroup: "1.1.3 Elektrik",
    category: "mechanical_electrical",
    unit: "m²",
    notes: "Daire içi ve ortak alan elektrik tesisatı, anahtar/priz, aydınlatma ve interkom",
  },
  {
    sNo: 15,
    code: "1.1.3.2",
    name: "SOSYAL TESİS",
    parentGroup: "1.1.3 Elektrik",
    category: "mechanical_electrical",
    unit: "m²",
    notes: "Sosyal tesis özel dekoratif aydınlatma, seslendirme ve acil yönlendirme sistemleri",
  },
  {
    sNo: 16,
    code: "1.1.3.3",
    name: "KAPALI OTOPARKLAR ( SIĞINAK VE TEKNİK ALANLAR DAHİL )",
    parentGroup: "1.1.3 Elektrik",
    category: "mechanical_electrical",
    unit: "m²",
    notes: "Otopark LED aydınlatma, hareket sensörleri, jeneratör transfer panoları ve kablo tavaları",
  },
  {
    sNo: 17,
    code: "1.1.3.4",
    name: "ÇEVRE ALTYAPI VE PEYZAJ İŞLERİ",
    parentGroup: "1.1.3 Elektrik",
    category: "mechanical_electrical",
    unit: "m²",
    notes: "Bahçe ve çevre aydınlatma direkleri, güvenlik kamera altyapısı ve paratoner tesisatı",
  },
  {
    sNo: 18,
    code: "1.2",
    name: "PROJE GİDERLERİ TOPLAMI",
    parentGroup: "1.2 Proje Giderleri",
    category: "permit_project",
    unit: "paket",
    isSummaryHeader: true,
    notes: "Tüm mimari, mühendislik, resmi harç ve şantiye yönetim giderleri toplamı",
  },
  {
    sNo: 19,
    code: "1.2.1",
    name: "ETÜD VE PROJE ÇİZİM GİDERLERİ",
    parentGroup: "1.2 Proje Giderleri",
    category: "permit_project",
    unit: "adet",
    notes: "Mimari, statik, mekanik, elektrik uygulama projeleri, zemin etüdü ve 3D renderlar",
  },
  {
    sNo: 20,
    code: "1.2.2",
    name: "RUHSAT HARÇLARI *",
    parentGroup: "1.2 Proje Giderleri",
    category: "permit_project",
    unit: "paket",
    notes: "Belediye yeni yapı ruhsat harçları, otopark bedelleri ve teknik inceleme ücretleri",
  },
  {
    sNo: 21,
    code: "1.2.3",
    name: "VERGİ GİDERLERİ *",
    parentGroup: "1.2 Proje Giderleri",
    category: "permit_project",
    unit: "paket",
    notes: "Sözleşme damga vergileri, noter masrafları ve ilgili yasal harçlar",
  },
  {
    sNo: 22,
    code: "1.2.4",
    name: "PERSONEL GİDERLERİ *",
    parentGroup: "1.2 Proje Giderleri",
    category: "site_overhead",
    unit: "ay",
    notes: "Proje müdürü, şantiye şefi, saha mühendisleri ve mimar maaş/SGK giderleri",
  },
  {
    sNo: 23,
    code: "1.2.5",
    name: "PERYODİK KULLANIM GİDERLERİ",
    parentGroup: "1.2 Proje Giderleri",
    category: "site_overhead",
    unit: "ay",
    notes: "Şantiye geçici elektrik, şantiye suyu, internet, araç yakıt ve mobilizasyon giderleri",
  },
  {
    sNo: 24,
    code: "1.2.6",
    name: "MOBİLİZASYON VE DEMOBİLİZASYON *",
    parentGroup: "1.2 Proje Giderleri",
    category: "site_overhead",
    unit: "paket",
    notes: "Şantiye konteyner ofis/yatakhane kurulumu, saha çevreleme ve proje bitimi söküm",
  },
  {
    sNo: 25,
    code: "1.2.7",
    name: "MAKİNA EKİPMAN GİDERLERİ *",
    parentGroup: "1.2 Proje Giderleri",
    category: "site_overhead",
    unit: "ay",
    notes: "Kule vinç kiralama/kurulumu, dış cephe asansörü, jeneratör ve kompaktör masrafları",
  },
  {
    sNo: 26,
    code: "1.2.8",
    name: "ALLRİSK GİDERLERİ *",
    parentGroup: "1.2 Proje Giderleri",
    category: "permit_project",
    unit: "paket",
    notes: "İnşaat All-Risk (Bütün Riskler) ve 3. Şahıs Mali Mesuliyet Sigorta poliçeleri",
  },
  {
    sNo: 27,
    code: "1.2.9",
    name: "YAPI DENETİM GİDERLERİ",
    parentGroup: "1.2 Proje Giderleri",
    category: "permit_project",
    unit: "m²",
    notes: "Çevre Şehircilik Bakanlığı havuzundan atanan yapı denetim firması hak edişleri",
  },
  {
    sNo: 28,
    code: "1.2.10",
    name: "DANIŞMANLIK GİDERLERİ",
    parentGroup: "1.2 Proje Giderleri",
    category: "permit_project",
    unit: "ay",
    notes: "Hukuk danışmanlığı, mali müşavirlik, jeoteknik ve yangın danışmanlık hizmetleri",
  },
  {
    sNo: 29,
    code: "2.0",
    name: "PAZARLAMA GİDERLERİ TOPLAMI",
    parentGroup: "2.0 Pazarlama",
    category: "site_overhead",
    unit: "paket",
    isSummaryHeader: true,
    notes: "Satış ofisi, reklam ve satış personeli bütçesi toplamı",
  },
  {
    sNo: 30,
    code: "2.1",
    name: "SATIŞ OFİSİ HAZIRLIĞI",
    parentGroup: "2.0 Pazarlama",
    category: "fine",
    unit: "paket",
    notes: "Örnek daire tefrişatı, satış ofisi mimari uygulaması ve mimari maket imalatı",
  },
  {
    sNo: 31,
    code: "2.2",
    name: "REKLAM VE TANITIM GİDERLERİ",
    parentGroup: "2.0 Pazarlama",
    category: "site_overhead",
    unit: "paket",
    notes: "Dijital reklamlar (Google/Meta), açık hava billboard, katalog ve basın lansmanı",
  },
  {
    sNo: 32,
    code: "2.3",
    name: "PERSONEL GİDERLERİ *",
    parentGroup: "2.0 Pazarlama",
    category: "site_overhead",
    unit: "ay",
    notes: "Satış ofisi müdürü, gayrimenkul danışmanları ve hostes maaş ve primleri",
  },
  {
    sNo: 33,
    code: "2.4",
    name: "PERYODİK KULLANIM GİDERLERİ",
    parentGroup: "2.0 Pazarlama",
    category: "site_overhead",
    unit: "ay",
    notes: "Satış ofisi ikram, temizlik, güvenlik, iletişim ve ofis kırtasiye sarfları",
  },
  {
    sNo: 34,
    code: "3.0",
    name: "FİYAT ARTIŞLARI*",
    parentGroup: "3.0 Fiyat Artışları",
    category: "site_overhead",
    unit: "paket",
    notes: "Öngörülemeyen maliyet artışları, kur/enflasyon eskalasyon payı ve beklenmedik giderler",
  },
  {
    sNo: 35,
    code: "4.0",
    name: "TESLİM SONRASI HİZMETLER",
    parentGroup: "4.0 Teslim Sonrası",
    category: "fine",
    unit: "paket",
    notes: "Daire teslim tutanakları, geçici kabul eksikleri giderme ve 1 yıllık garanti desteği",
  },
  {
    sNo: 36,
    code: "5.0",
    name: "İM. PRJ. PZ. GİD. - KDV'SİZ TOPLAMI",
    parentGroup: "5.0 KDV'siz Toplam",
    category: "site_overhead",
    unit: "paket",
    isSummaryHeader: true,
    notes: "1.1 İmalat + 1.2 Proje + 2.0 Pazarlama Giderlerinin KDV Hariç Ara Toplamı",
  },
  {
    sNo: 37,
    code: "6.0",
    name: "ARSA MALİYETİ",
    parentGroup: "6.0 Arsa Maliyeti",
    category: "permit_project",
    unit: "m²",
    notes: "Arsa satın alma bedeli veya hasılat paylaşımlı arsa sahibi maliyet karşılığı",
  },
  {
    sNo: 38,
    code: "7.0",
    name: "İM. PRJ. PZ. GİD. ARSA MALİYETİ - KDV'SİZ TOPLAMI",
    parentGroup: "7.0 Arsa Dahil KDV'siz",
    category: "site_overhead",
    unit: "paket",
    isSummaryHeader: true,
    notes: "Tüm imalat, proje, pazarlama ve arsa maliyetinin KDV hariç toplamı",
  },
  {
    sNo: 39,
    code: "8.0",
    name: "KDV ( %20 )",
    parentGroup: "8.0 KDV",
    category: "permit_project",
    unit: "paket",
    notes: "Yürürlükteki genel inşaat ve malzeme KDV tutarı (%20)",
  },
  {
    sNo: 40,
    code: "9.0",
    name: "İM. PRJ. PZ. GİD. ARSA MALİYETİ - KDV'Lİ TOPLAMI",
    parentGroup: "9.0 Genel KDV'li Toplam",
    category: "site_overhead",
    unit: "paket",
    isSummaryHeader: true,
    notes: "Arsa ve tüm maliyetler dahil KDV dahil nihai proje yatırım bütçesi",
  },
  {
    sNo: 41,
    code: "10.0",
    name: "MÜŞTERİYE YANSITILABİLECEK GİDERLER",
    parentGroup: "10.0 Yansıtılabilir",
    category: "site_overhead",
    unit: "paket",
    notes: "Altyapı katılım payları, elektrik/su sayaç bedelleri, tapu harcı ve döner sermaye",
  },
  {
    sNo: 42,
    code: "11.0",
    name: "%1 KDV GİDERİ",
    parentGroup: "11.0 %1 KDV",
    category: "permit_project",
    unit: "paket",
    notes: "Konut satış faturası kesiminde doğan %1 KDV yükü / finansman maliyeti",
  },
  {
    sNo: 43,
    code: "12.0",
    name: "MERKEZ YÖNETİM GİDERLERİ ( 5.madde x %3)",
    parentGroup: "12.0 Merkez Yönetim",
    category: "site_overhead",
    unit: "paket",
    notes: "Genel Merkez kurumsal yönetim, muhasebe ve koordinasyon payı (5. Madde x %3)",
  },
  {
    sNo: 44,
    code: "13.0",
    name: "BEYAZ EŞYA İLAVE MALİYET FARKI",
    parentGroup: "13.0 Beyaz Eşya",
    category: "fine",
    unit: "adet",
    notes: "Dairelere takılacak ankastre set (ocak, fırın, davlumbaz), bulaşık makinesi ve klima farkı",
  },
];

/**
 * 44 Kalemlik PDF Şablonundan Proje için Standart ConstructionCostItem listesi üretir.
 */
export function generatePdfTemplateCostItems(
  totalAreaM2: number = 6800,
  sellableAreaM2: number = 5200
): ConstructionCostItem[] {
  const area = totalAreaM2 > 0 ? totalAreaM2 : 6800;

  return PDF_DISCOVERY_TEMPLATE_ITEMS.map((item, index) => {
    let quantity = 1;
    let unitPrice = 0;
    let totalPrice = 0;

    // Gerçekçi referans keşif değerleri:
    switch (item.code) {
      case "1.1.1.1": // Konut Bloklar İnşaat
        quantity = Math.round(area * 0.70);
        unitPrice = 14500;
        totalPrice = quantity * unitPrice;
        break;
      case "1.1.1.2": // Sosyal Tesis İnşaat
        quantity = Math.round(area * 0.08);
        unitPrice = 16000;
        totalPrice = quantity * unitPrice;
        break;
      case "1.1.1.3": // Kapalı Otopark İnşaat
        quantity = Math.round(area * 0.22);
        unitPrice = 9800;
        totalPrice = quantity * unitPrice;
        break;
      case "1.1.1.4": // Çevre Altyapı & Peyzaj
        quantity = Math.round(area * 0.35);
        unitPrice = 2800;
        totalPrice = quantity * unitPrice;
        break;
      case "1.1.2.1": // Mekanik Konut
        quantity = Math.round(area * 0.70);
        unitPrice = 2200;
        totalPrice = quantity * unitPrice;
        break;
      case "1.1.2.2": // Mekanik Sosyal Tesis
        quantity = Math.round(area * 0.08);
        unitPrice = 3100;
        totalPrice = quantity * unitPrice;
        break;
      case "1.1.2.3": // Mekanik Otopark
        quantity = Math.round(area * 0.22);
        unitPrice = 1400;
        totalPrice = quantity * unitPrice;
        break;
      case "1.1.2.4": // Mekanik Çevre Altyapı
        quantity = 1;
        unitPrice = 1850000;
        totalPrice = 1850000;
        break;
      case "1.1.3.1": // Elektrik Konut
        quantity = Math.round(area * 0.70);
        unitPrice = 1950;
        totalPrice = quantity * unitPrice;
        break;
      case "1.1.3.2": // Elektrik Sosyal Tesis
        quantity = Math.round(area * 0.08);
        unitPrice = 2600;
        totalPrice = quantity * unitPrice;
        break;
      case "1.1.3.3": // Elektrik Otopark
        quantity = Math.round(area * 0.22);
        unitPrice = 1200;
        totalPrice = quantity * unitPrice;
        break;
      case "1.1.3.4": // Elektrik Çevre Altyapı
        quantity = 1;
        unitPrice = 1450000;
        totalPrice = 1450000;
        break;
      case "1.2.1": // Etüd ve Proje Çizim
        quantity = 1;
        unitPrice = 3200000;
        totalPrice = 3200000;
        break;
      case "1.2.2": // Ruhsat Harçları
        quantity = 1;
        unitPrice = 2400000;
        totalPrice = 2400000;
        break;
      case "1.2.3": // Vergi Giderleri
        quantity = 1;
        unitPrice = 850000;
        totalPrice = 850000;
        break;
      case "1.2.4": // Personel Giderleri
        quantity = 18; // 18 ay
        unitPrice = 220000;
        totalPrice = 3960000;
        break;
      case "1.2.5": // Peryodik Kullanım
        quantity = 18;
        unitPrice = 65000;
        totalPrice = 1170000;
        break;
      case "1.2.6": // Mobilizasyon
        quantity = 1;
        unitPrice = 1250000;
        totalPrice = 1250000;
        break;
      case "1.2.7": // Makina Ekipman
        quantity = 18;
        unitPrice = 110000;
        totalPrice = 1980000;
        break;
      case "1.2.8": // AllRisk
        quantity = 1;
        unitPrice = 950000;
        totalPrice = 950000;
        break;
      case "1.2.9": // Yapı Denetim
        quantity = area;
        unitPrice = 380;
        totalPrice = quantity * unitPrice;
        break;
      case "1.2.10": // Danışmanlık
        quantity = 18;
        unitPrice = 45000;
        totalPrice = 810000;
        break;
      case "2.1": // Satış Ofisi Hazırlığı
        quantity = 1;
        unitPrice = 1600000;
        totalPrice = 1600000;
        break;
      case "2.2": // Reklam ve Tanıtım
        quantity = 1;
        unitPrice = 2500000;
        totalPrice = 2500000;
        break;
      case "2.3": // Pazarlama Personeli
        quantity = 18;
        unitPrice = 120000;
        totalPrice = 2160000;
        break;
      case "2.4": // Pazarlama Peryodik
        quantity = 18;
        unitPrice = 35000;
        totalPrice = 630000;
        break;
      case "3.0": // Fiyat Artışları
        quantity = 1;
        unitPrice = 4500000;
        totalPrice = 4500000;
        break;
      case "4.0": // Teslim Sonrası
        quantity = 1;
        unitPrice = 1200000;
        totalPrice = 1200000;
        break;
      case "6.0": // Arsa Maliyeti
        quantity = Math.round(area * 0.40);
        unitPrice = 35000;
        totalPrice = quantity * unitPrice;
        break;
      case "10.0": // Müşteriye Yansıtılabilir
        quantity = 1;
        unitPrice = 1800000;
        totalPrice = 1800000;
        break;
      case "11.0": // %1 KDV Gideri
        quantity = 1;
        unitPrice = 1150000;
        totalPrice = 1150000;
        break;
      case "12.0": // Merkez Yönetim Gideri
        quantity = 1;
        unitPrice = 2800000;
        totalPrice = 2800000;
        break;
      case "13.0": // Beyaz Eşya
        quantity = 52;
        unitPrice = 65000;
        totalPrice = 52 * 65000;
        break;
      default:
        quantity = 1;
        unitPrice = 0;
        totalPrice = 0;
    }

    return {
      id: `ci_pdf_${String(item.sNo).padStart(2, "0")}_${Date.now() + index}`,
      code: item.code,
      name: item.name,
      category: item.category,
      unit: item.unit,
      quantity,
      unitPrice,
      totalPrice,
      status: "estimated",
      notes: `${item.notes}${item.isSummaryHeader ? " (Grup Başlığı)" : ""}`,
    };
  });
}
