// Turkey Location Data (İl, İlçe, Mahalle) and Tax Offices (Vergi Daireleri)
import {
  ALL_81_PROVINCES_AND_DISTRICTS,
  COMPREHENSIVE_STREET_DATABASE,
  ProvinceDistricts
} from "./allTurkeyDistricts";

export interface District {
  name: string;
  neighborhoods: string[];
}

export interface Province {
  code: string; // Plaka kodu ör: "34"
  name: string;
  districts: District[];
  taxOffices: string[];
}

export { ALL_81_PROVINCES_AND_DISTRICTS, COMPREHENSIVE_STREET_DATABASE };

// Build TURKEY_PROVINCES_DATA with all 81 provinces and 973 districts
export const TURKEY_PROVINCES_DATA: Province[] = ALL_81_PROVINCES_AND_DISTRICTS.map((item) => ({
  code: item.code,
  name: item.name,
  taxOffices: item.taxOffices,
  districts: item.districts.map((dName) => ({
    name: dName,
    neighborhoods: item.sampleNeighborhoods || [
      "Merkez Mahallesi",
      "Cumhuriyet Mahallesi",
      "Atatürk Mahallesi",
      "Fatih Mahallesi",
      "Yeni Mahalle",
      "Zafer Mahallesi",
      "İstiklal Mahallesi",
      "Hürriyet Mahallesi",
      "Sanayi Mahallesi",
      "Bahçelievler Mahallesi"
    ]
  }))
}));

// Complete list of 81 Provinces with plate codes
export const ALL_81_PROVINCES: { code: string; name: string }[] = ALL_81_PROVINCES_AND_DISTRICTS.map((p) => ({
  code: p.code,
  name: p.name
}));

/**
 * Get 2-digit plate code for a province / city name
 * Örnek: "İstanbul" -> "34", "Ankara" -> "06", "İzmir" -> "35"
 */
export function getProvincePlateCode(cityName?: string): string {
  if (!cityName) return "34";
  const clean = cityName.trim();
  const found = ALL_81_PROVINCES_AND_DISTRICTS.find(
    (p) =>
      p.name.toLocaleLowerCase("tr-TR") === clean.toLocaleLowerCase("tr-TR") ||
      p.name.toLowerCase() === clean.toLowerCase() ||
      p.code === clean
  );
  if (found) return found.code;
  const match = clean.match(/^\d{2}/);
  if (match) return match[0];
  return "34";
}

// Common Street & Avenue Name Types in Turkey
export const COMMON_STREET_TYPES = COMPREHENSIVE_STREET_DATABASE;

/**
 * Get Districts for a given city/province
 */
export function getDistrictsForProvince(cityName: string): string[] {
  if (!cityName) return [];
  const clean = cityName.trim().toLocaleLowerCase("tr-TR");
  const prov = ALL_81_PROVINCES_AND_DISTRICTS.find(
    (p) =>
      p.name.toLocaleLowerCase("tr-TR") === clean ||
      p.name.toLowerCase() === clean.toLowerCase() ||
      p.code === clean
  );
  if (prov && prov.districts.length > 0) {
    return prov.districts;
  }
  return ["Merkez", "Sanayi", "Organize Sanayi", "Doğu", "Batı", "Kuzey", "Güney", "Yenişehir"];
}

/**
 * Get Neighborhoods for a given city & district
 */
export function getNeighborhoodsForDistrict(cityName: string, districtName: string): string[] {
  if (!cityName) return [];
  const cleanCity = cityName.trim().toLocaleLowerCase("tr-TR");
  const prov = ALL_81_PROVINCES_AND_DISTRICTS.find(
    (p) =>
      p.name.toLocaleLowerCase("tr-TR") === cleanCity ||
      p.name.toLowerCase() === cleanCity.toLowerCase() ||
      p.code === cleanCity
  );
  if (prov) {
    const list = prov.sampleNeighborhoods || [];
    if (list.length > 0) {
      return list;
    }
  }
  return [
    "Merkez Mahallesi",
    "Atatürk Mahallesi",
    "Cumhuriyet Mahallesi",
    "Fatih Mahallesi",
    "Yeni Mahalle",
    "Zafer Mahallesi",
    "İstiklal Mahallesi",
    "Hürriyet Mahallesi",
    "Sanayi Mahallesi",
    "Bahçelievler Mahallesi",
    "Çarşı Mahallesi",
    "Gazi Mahallesi",
    "Mimar Sinan Mahallesi",
    "İnönü Mahallesi"
  ];
}

/**
 * Get Tax Offices (Vergi Daireleri) for a given city
 */
export function getTaxOfficesForProvince(cityName: string): string[] {
  if (!cityName) return [];
  const cleanCity = cityName.trim().toLocaleLowerCase("tr-TR");
  const prov = ALL_81_PROVINCES_AND_DISTRICTS.find(
    (p) =>
      p.name.toLocaleLowerCase("tr-TR") === cleanCity ||
      p.name.toLowerCase() === cleanCity.toLowerCase() ||
      p.code === cleanCity
  );
  if (prov && prov.taxOffices.length > 0) {
    return Array.from(new Set(prov.taxOffices));
  }
  return [
    `${cityName} Vergi Dairesi Mdr.`,
    `${cityName} İhtisas Vergi Dairesi`,
    `${cityName} Kurumlar Vergi Dairesi`,
    `${cityName} Birlik Vergi Dairesi`,
    `${cityName} Çarşı Vergi Dairesi`,
    `${cityName} Sanayi Vergi Dairesi`
  ];
}
