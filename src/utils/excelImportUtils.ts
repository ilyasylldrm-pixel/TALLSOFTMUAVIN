import * as XLSX from "xlsx";
import { Contact, Product, ContactType, getContactAccountCode } from "../types";

export interface ImportColumnDef {
  key: string;
  label: string;
  required?: boolean;
  description?: string;
  synonyms: string[];
}

export const CONTACT_IMPORT_COLUMNS: ImportColumnDef[] = [
  {
    key: "name",
    label: "Cari Adı / Firma Ünvanı",
    required: true,
    description: "Müşteri, tedarikçi veya firma resmi/ticari unvanı",
    synonyms: ["unvan", "ünvan", "ad", "adi", "adı", "firma", "firma adi", "firma adı", "cari adi", "cari adı", "musteri", "müşteri", "tedarikci", "tedarikçi", "name", "company", "title", "cari unvan", "cari ünvan"]
  },
  {
    key: "contactType",
    label: "Cari Tipi",
    description: "Müşteri, Tedarikçi veya Hem Müşteri Hem Tedarikçi",
    synonyms: ["tur", "tür", "tip", "tipi", "cari turu", "cari türü", "type", "contact type", "rol", "cari tipi"]
  },
  {
    key: "taxNumber",
    label: "Vergi / TC Kimlik No",
    description: "10 haneli VKN veya 11 haneli TCKN",
    synonyms: ["vergi no", "vergi no / tc", "vkn", "tckn", "tc no", "tc kimlik", "vergi numarasi", "vergi numarası", "tax number", "tax no", "vkn/tckn"]
  },
  {
    key: "taxOffice",
    label: "Vergi Dairesi",
    description: "Bağlı olunan vergi dairesi",
    synonyms: ["vergi dairesi", "vd", "tax office", "v.d.", "vergi dairesi adı"]
  },
  {
    key: "accountCode",
    label: "Cari Hesap Kodu",
    description: "Örn: 120.34.001 veya 320.06.002 (Boş bırakılırsa sistem otomatik üretir)",
    synonyms: ["hesap kodu", "cari kodu", "cari kod", "hesap kod", "muhasebe kodu", "account code", "code", "kod"]
  },
  {
    key: "phone",
    label: "Telefon / GSM",
    description: "İletişim telefon numarası",
    synonyms: ["telefon", "tel", "gsm", "cep", "cep tel", "phone", "mobile", "telefon no"]
  },
  {
    key: "email",
    label: "E-Posta",
    description: "E-Fatura veya iletişim e-posta adresi",
    synonyms: ["eposta", "e-posta", "email", "e-mail", "mail", "e posta"]
  },
  {
    key: "city",
    label: "İl / Şehir",
    description: "Firma adresi şehri",
    synonyms: ["il", "sehir", "şehir", "city", "province"]
  },
  {
    key: "district",
    label: "İlçe",
    description: "Firma adresi ilçesi",
    synonyms: ["ilce", "ilçe", "district", "town"]
  },
  {
    key: "address",
    label: "Açık Adres",
    description: "Sokak, bina, mahalle detaylı açık adres",
    synonyms: ["adres", "acik adres", "açık adres", "address", "street", "fatura adresi"]
  },
  {
    key: "contactPerson",
    label: "İlgili Kişi / Yetkili",
    description: "Firma yetkilisi veya irtibat sorumlusu",
    synonyms: ["yetkili", "yetkili kisi", "yetkili kişi", "ilgili kisi", "ilgili kişi", "contact person", "contact", "irtibat"]
  },
  {
    key: "balance",
    label: "Açılış Bakiyesi (₺)",
    description: "Pozitif: Alacaklıyız, Negatif: Borçluyuz",
    synonyms: ["bakiye", "acilis bakiyesi", "açılış bakiyesi", "balance", "tutar", "alacak", "borc", "borç"]
  },
  {
    key: "notes",
    label: "Özel Notlar / Açıklama",
    description: "Cari karta dair ek notlar",
    synonyms: ["not", "notlar", "aciklama", "açıklama", "notes", "description"]
  }
];

export const PRODUCT_IMPORT_COLUMNS: ImportColumnDef[] = [
  {
    key: "name",
    label: "Ürün / Hizmet Adı",
    required: true,
    description: "Stok veya hizmetin açık adı",
    synonyms: ["urun adi", "ürün adı", "stok adi", "stok adı", "malzeme adi", "malzeme adı", "aciklama", "açıklama", "name", "title", "product name", "item name", "description"]
  },
  {
    key: "code",
    label: "Ürün / Stok Kodu",
    description: "Tekil SKU veya stok kodu (Boş bırakılırsa STK-XXXX üretilir)",
    synonyms: ["urun kodu", "ürün kodu", "stok kodu", "stok kod", "kod", "sku", "item code", "product code", "code"]
  },
  {
    key: "unit",
    label: "Ölçü Birimi",
    description: "Adet, Kg, Lt, Metre, Koli vb. (Varsayılan: Adet)",
    synonyms: ["birim", "olcu birimi", "ölçü birimi", "unit", "uom"]
  },
  {
    key: "buyPrice",
    label: "Alış Fiyatı / Maliyet (₺)",
    description: "KDV hariç birim alış fiyatı",
    synonyms: ["alis fiyati", "alış fiyatı", "alis", "alış", "maliyet", "birim maliyet", "buy price", "cost", "purchase price", "cost price"]
  },
  {
    key: "sellPrice",
    label: "Satış Fiyatı (₺)",
    description: "KDV hariç birim satış fiyatı",
    synonyms: ["satis fiyati", "satış fiyatı", "satis", "satış", "fiyat", "birim satis", "birim satış", "sell price", "sale price", "price"]
  },
  {
    key: "vatRate",
    label: "KDV Oranı (%)",
    description: "0, 1, 10, 20 (Varsayılan: 20)",
    synonyms: ["kdv", "kdv orani", "kdv oranı", "kdv %", "vat", "vat rate", "tax rate"]
  },
  {
    key: "stockQuantity",
    label: "Mevcut Stok Miktarı",
    description: "Açılış stok adedi / miktarı",
    synonyms: ["stok miktari", "stok miktarı", "mevcut stok", "stok", "miktar", "bakiye", "quantity", "stock", "qty", "amount"]
  },
  {
    key: "minStockAlert",
    label: "Kritik / Min Stok Seviyesi",
    description: "Stok altına düşünce uyarı veren eşik",
    synonyms: ["kritik stok", "minimum stok", "min stok", "uyari seviyesi", "uyarı seviyesi", "min stock", "alert", "kritik seviye"]
  },
  {
    key: "barcode",
    label: "Barkod Numarası",
    description: "EAN-13, EAN-8 veya özel barkod",
    synonyms: ["barkod", "barkod no", "barkod numarasi", "barcode", "ean", "upc"]
  },
  {
    key: "category",
    label: "Ürün Kategorisi / Grubu",
    description: "Örn: Elektronik, Sarf Malzeme, Hizmetler",
    synonyms: ["kategori", "grup", "urun grubu", "ürün grubu", "category", "group"]
  },
  {
    key: "stockType",
    label: "Stok Türü",
    description: "Ticari Mal, Hizmet, Ham Madde, Yarı Mamul, İlk Madde Malzeme",
    synonyms: ["stok turu", "stok türü", "tur", "tür", "tip", "stock type", "type"]
  }
];

/**
 * Normalizes text for header matching: removes diacritics, lowercase, removes punctuation
 */
export function normalizeHeaderString(str: any): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Auto-detects matching column index for each field
 */
export function autoDetectColumnMapping(
  headers: string[],
  targetColumns: ImportColumnDef[]
): Record<string, number> {
  const mapping: Record<string, number> = {};
  const normalizedHeaders = headers.map((h) => normalizeHeaderString(h));

  targetColumns.forEach((col) => {
    let matchedIdx = -1;

    // 1. Check exact match with normalized synonyms
    for (const syn of col.synonyms) {
      const normSyn = normalizeHeaderString(syn);
      const idx = normalizedHeaders.findIndex((nh) => nh === normSyn);
      if (idx !== -1) {
        matchedIdx = idx;
        break;
      }
    }

    // 2. Check contains match if exact not found
    if (matchedIdx === -1) {
      for (const syn of col.synonyms) {
        const normSyn = normalizeHeaderString(syn);
        const idx = normalizedHeaders.findIndex((nh) => nh.includes(normSyn) || normSyn.includes(nh));
        if (idx !== -1) {
          matchedIdx = idx;
          break;
        }
      }
    }

    mapping[col.key] = matchedIdx;
  });

  return mapping;
}

/**
 * Parses flexible Turkish / European / International formatted numbers
 */
export function parseFlexibleNumber(val: any, defaultVal = 0): number {
  if (val === null || val === undefined || val === "") return defaultVal;
  if (typeof val === "number") {
    return isNaN(val) ? defaultVal : val;
  }

  let str = String(val)
    .trim()
    .replace(/[₺$€TLtl\s]/g, "");

  if (!str) return defaultVal;

  // If contains both '.' and ',' (e.g. "1.250,50" or "1,250.50")
  if (str.includes(".") && str.includes(",")) {
    if (str.lastIndexOf(",") > str.lastIndexOf(".")) {
      // European format: 1.250,50 -> 1250.50
      str = str.replace(/\./g, "").replace(",", ".");
    } else {
      // US format: 1,250.50 -> 1250.50
      str = str.replace(/,/g, "");
    }
  } else if (str.includes(",")) {
    // Only comma: 1250,50 -> 1250.50
    str = str.replace(",", ".");
  }

  const num = parseFloat(str);
  return isNaN(num) ? defaultVal : num;
}

/**
 * Parses VAT rate percentage (20, %20, 0.20, 10, 1, 0)
 */
export function parseVatRate(val: any, defaultVat = 20): number {
  if (val === null || val === undefined || val === "") return defaultVat;
  if (typeof val === "number") {
    if (val === 0.2 || val === 0.20) return 20;
    if (val === 0.1 || val === 0.10) return 10;
    if (val === 0.01) return 1;
    return val;
  }

  const clean = String(val).replace(/%/g, "").trim();
  const num = parseFlexibleNumber(clean, defaultVat);
  if (num === 0.2 || num === 0.20) return 20;
  if (num === 0.1 || num === 0.10) return 10;
  if (num === 0.01) return 1;
  return num;
}

/**
 * Parses contact type string to ContactType enum
 */
export function parseContactType(val: any, defaultType: ContactType = "customer"): ContactType {
  if (!val) return defaultType;
  const norm = normalizeHeaderString(val);
  if (norm.includes("hem") || norm.includes("both") || (norm.includes("musteri") && norm.includes("tedarikci"))) {
    return "both";
  }
  if (norm.includes("tedarikci") || norm.includes("satici") || norm.includes("supplier") || norm.includes("vendor")) {
    return "supplier";
  }
  if (norm.includes("musteri") || norm.includes("alici") || norm.includes("customer")) {
    return "customer";
  }
  return defaultType;
}

/**
 * Generates and downloads sample Excel template for bulk import
 */
export function downloadSampleImportTemplate(mode: "contacts" | "products"): void {
  const wb = XLSX.utils.book_new();

  if (mode === "contacts") {
    const headers = [
      "Firma Ünvanı / Cari Adı *",
      "Cari Tipi",
      "Vergi No / TCKN",
      "Vergi Dairesi",
      "Cari Hesap Kodu",
      "Telefon",
      "E-Posta",
      "İl",
      "İlçe",
      "Açık Adres",
      "Yetkili Kişi",
      "Açılış Bakiyesi (₺)",
      "Özel Notlar"
    ];

    const sampleRows = [
      [
        "Örnek Teknoloji San. ve Tic. A.Ş.",
        "Müşteri",
        "1234567890",
        "Boğaziçi",
        "120.34.1234567890",
        "0212 555 11 22",
        "muhasebe@ornekteknoloji.com",
        "İstanbul",
        "Kadıköy",
        "Caferağa Mah. Moda Cad. No:14/2",
        "Ahmet Yılmaz",
        15500,
        "Yıllık bakım sözleşmeli kurumsal cari"
      ],
      [
        "Anadolu Lojistik ve Taşımacılık Ltd. Şti.",
        "Tedarikçi",
        "9876543210",
        "Ulus",
        "320.06.9876543210",
        "0312 444 33 44",
        "fatura@anadolulojistik.com",
        "Ankara",
        "Çankaya",
        "Kızılay Mah. Atatürk Blv. No:88",
        "Mehmet Kaya",
        -8250,
        "Kargo ve sevkiyat ana tedarikçimiz"
      ],
      [
        "Güneş Endüstriyel Donanım A.Ş.",
        "Hem Müşteri Hem Tedarikçi",
        "4567890123",
        "Konak",
        "120.35.4567890123",
        "0232 333 22 11",
        "siparis@gunesdonanim.com",
        "İzmir",
        "Konak",
        "Alsancak Mah. Cumhuriyet Blv. No:45",
        "Ayşe Demir",
        0,
        "Konsinye ve hammadde takaslı çalışılan cari"
      ]
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

    // Column widths for neat appearance
    ws["!cols"] = [
      { wch: 36 }, // Unvan
      { wch: 18 }, // Tip
      { wch: 16 }, // VKN
      { wch: 18 }, // VD
      { wch: 22 }, // Kod
      { wch: 16 }, // Tel
      { wch: 28 }, // Mail
      { wch: 14 }, // İl
      { wch: 14 }, // İlçe
      { wch: 34 }, // Adres
      { wch: 18 }, // Yetkili
      { wch: 18 }, // Bakiye
      { wch: 32 }  // Notlar
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Cari_Hesaplar_Sablonu");
    XLSX.writeFile(wb, "Muavin_Cari_Ice_Aktarim_Sablonu.xlsx");
  } else {
    const headers = [
      "Ürün / Stok Adı *",
      "Ürün / Stok Kodu",
      "Ölçü Birimi",
      "Alış Fiyatı (₺)",
      "Satış Fiyatı (₺)",
      "KDV Oranı (%)",
      "Mevcut Stok",
      "Kritik Stok Seviyesi",
      "Barkod No",
      "Ürün Kategorisi",
      "Stok Türü"
    ];

    const sampleRows = [
      [
        "Ultra Pro Dizüstü Bilgisayar 15.6\"",
        "STK-LAP-001",
        "Adet",
        24500,
        32900,
        20,
        18,
        5,
        "8680001001234",
        "Bilgisayar & Elektronik",
        "Ticari Mal"
      ],
      [
        "Kablosuz Ergonomik Optik Fare V2",
        "STK-ACC-002",
        "Adet",
        180,
        350,
        20,
        85,
        10,
        "8680001002345",
        "Bilgisayar Aksesuarları",
        "Ticari Mal"
      ],
      [
        "Yıllık ERP & Bulut Yazılım Destek Paketi",
        "HZM-YAZ-003",
        "Adet",
        0,
        15000,
        20,
        1,
        0,
        "",
        "Bilişim Hizmetleri",
        "Hizmet"
      ],
      [
        "A4 Fotokopi Kağıdı 80 gr (5'li Koli)",
        "STK-KRT-004",
        "Koli",
        520,
        750,
        20,
        42,
        8,
        "8680001003456",
        "Kırtasiye & Sarf",
        "Ticari Mal"
      ]
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

    ws["!cols"] = [
      { wch: 38 }, // Adı
      { wch: 18 }, // Kodu
      { wch: 12 }, // Birim
      { wch: 16 }, // Alış
      { wch: 16 }, // Satış
      { wch: 14 }, // KDV
      { wch: 14 }, // Stok
      { wch: 18 }, // Kritik
      { wch: 18 }, // Barkod
      { wch: 24 }, // Kategori
      { wch: 16 }  // Tür
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Stok_Urun_Sablonu");
    XLSX.writeFile(wb, "Muavin_Stok_Ice_Aktarim_Sablonu.xlsx");
  }
}
