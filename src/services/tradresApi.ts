/**
 * TrAdres API Service
 * Endpoint: https://api.tradres.com.tr/public/v1/catalog/providers/localsqlite/nodes
 * Levels supported:
 *  - level=province&take=200 (81 İl)
 *  - level=town&parentId={provinceId}&take=300 (İlçeler)
 *  - level=quarter&parentId={townId}&take=500 (Mahalleler)
 */

export interface TrAdresNode {
  id: number;
  name: string;
  level: "province" | "town" | "quarter";
  parentId: number | null;
  updatedAtUtc?: string;
  isChildrenSynced?: boolean;
  childCount?: number;
}

export interface TrAdresProvince {
  id: number;
  code: string; // "01" - "81"
  name: string; // "İstanbul"
  rawName: string; // "İSTANBUL"
}

export interface TrAdresDistrict {
  id: number;
  name: string; // "Kadıköy"
  rawName: string; // "KADIKÖY"
  provinceId: number;
}

export interface TrAdresNeighborhood {
  id: number;
  name: string; // "Caferağa Mahallesi"
  rawName: string; // "CAFERAĞA MAHALLESİ"
  townId: number;
}

const TRADRES_BASE_URL = "https://api.tradres.com.tr/public/v1/catalog/providers/localsqlite/nodes";

// In-Memory Caches
let cachedProvinces: TrAdresProvince[] | null = null;
const cachedDistrictsByProvince: Map<number, TrAdresDistrict[]> = new Map();
const cachedNeighborhoodsByTown: Map<number, TrAdresNeighborhood[]> = new Map();

/**
 * Turkish Proper Case Formatter
 * Handles special Turkish characters (İ, I, Ş, Ğ, Ü, Ö, Ç)
 */
export function toTurkishTitleCase(text: string): string {
  if (!text) return "";
  const words = text.trim().split(/\s+/);
  return words
    .map((word) => {
      if (!word) return "";
      // Handle numbers or roman numerals like 19, 1., II.
      if (/^\d+/.test(word)) return word;
      const firstChar = word.charAt(0);
      const rest = word.slice(1);
      const upperFirst = firstChar
        .replace(/i/g, "İ")
        .replace(/ı/g, "I")
        .toLocaleUpperCase("tr-TR");
      const lowerRest = rest
        .replace(/İ/g, "i")
        .replace(/I/g, "ı")
        .toLocaleLowerCase("tr-TR");
      return upperFirst + lowerRest;
    })
    .join(" ");
}

/**
 * Normalize Turkish String for relaxed search/matching
 */
export function normalizeTurkish(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .toLowerCase()
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/\s+/g, "")
    .replace(/mahallesi$/i, "")
    .replace(/mah\.?$/i, "")
    .trim();
}

/**
 * Fetch all 81 provinces from TrAdres API
 */
export async function fetchTrAdresProvinces(): Promise<TrAdresProvince[]> {
  if (cachedProvinces && cachedProvinces.length > 0) {
    return cachedProvinces;
  }

  // Try local storage cache
  try {
    const saved = localStorage.getItem("muavinn_tradres_provinces");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length >= 80) {
        cachedProvinces = parsed;
        return parsed;
      }
    }
  } catch (e) {
    // Ignore localStorage parse errors
  }

  try {
    const response = await fetch(`${TRADRES_BASE_URL}?level=province&take=200`);
    if (!response.ok) {
      throw new Error(`TrAdres API responded with status ${response.status}`);
    }
    const nodes: TrAdresNode[] = await response.json();
    if (Array.isArray(nodes) && nodes.length > 0) {
      const list: TrAdresProvince[] = nodes.map((node) => {
        const id = node.id;
        const code = id < 10 ? `0${id}` : String(id);
        const name = toTurkishTitleCase(node.name);
        return {
          id,
          code,
          name,
          rawName: node.name,
        };
      });

      // Sort by plate code / ID
      list.sort((a, b) => a.id - b.id);

      cachedProvinces = list;
      try {
        localStorage.setItem("muavinn_tradres_provinces", JSON.stringify(list));
      } catch (e) {}
      return list;
    }
  } catch (error) {
    console.warn("Could not fetch provinces from TrAdres API, will use fallback:", error);
  }

  return [];
}

/**
 * Fetch all districts (towns) for a given province from TrAdres API
 */
export async function fetchTrAdresDistricts(
  provinceIdOrName: number | string
): Promise<TrAdresDistrict[]> {
  let provinceId: number | null = null;

  if (typeof provinceIdOrName === "number") {
    provinceId = provinceIdOrName;
  } else {
    // Lookup province ID from name or plate code
    const provinces = await fetchTrAdresProvinces();
    const queryNorm = normalizeTurkish(provinceIdOrName);
    const found = provinces.find(
      (p) =>
        p.code === provinceIdOrName ||
        p.id === Number(provinceIdOrName) ||
        normalizeTurkish(p.name) === queryNorm ||
        normalizeTurkish(p.rawName) === queryNorm
    );
    if (found) {
      provinceId = found.id;
    } else {
      const num = parseInt(provinceIdOrName, 10);
      if (!isNaN(num) && num >= 1 && num <= 81) {
        provinceId = num;
      }
    }
  }

  if (!provinceId) return [];

  if (cachedDistrictsByProvince.has(provinceId)) {
    return cachedDistrictsByProvince.get(provinceId)!;
  }

  // Try localStorage cache
  const cacheKey = `muavinn_tradres_districts_${provinceId}`;
  try {
    const saved = localStorage.getItem(cacheKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedDistrictsByProvince.set(provinceId, parsed);
        return parsed;
      }
    }
  } catch (e) {}

  try {
    const response = await fetch(
      `${TRADRES_BASE_URL}?level=town&parentId=${provinceId}&take=300`
    );
    if (!response.ok) {
      throw new Error(`TrAdres API town status ${response.status}`);
    }
    const nodes: TrAdresNode[] = await response.json();
    if (Array.isArray(nodes) && nodes.length > 0) {
      const list: TrAdresDistrict[] = nodes.map((node) => ({
        id: node.id,
        name: toTurkishTitleCase(node.name),
        rawName: node.name,
        provinceId: provinceId!,
      }));

      // Sort alphabetically in Turkish
      list.sort((a, b) => a.name.localeCompare(b.name, "tr-TR"));

      cachedDistrictsByProvince.set(provinceId, list);
      try {
        localStorage.setItem(cacheKey, JSON.stringify(list));
      } catch (e) {}
      return list;
    }
  } catch (error) {
    console.warn(`Could not fetch districts for province ${provinceId} from TrAdres:`, error);
  }

  return [];
}

/**
 * Fetch all neighborhoods (quarters) for a given district (town) from TrAdres API
 */
export async function fetchTrAdresNeighborhoods(
  townIdOrName: number | string,
  provinceIdOrName?: number | string
): Promise<TrAdresNeighborhood[]> {
  let townId: number | null = null;

  if (typeof townIdOrName === "number") {
    townId = townIdOrName;
  } else if (provinceIdOrName) {
    // Find townId by district name
    const districts = await fetchTrAdresDistricts(provinceIdOrName);
    const queryNorm = normalizeTurkish(townIdOrName);
    const found = districts.find(
      (d) =>
        d.id === Number(townIdOrName) ||
        normalizeTurkish(d.name) === queryNorm ||
        normalizeTurkish(d.rawName) === queryNorm
    );
    if (found) {
      townId = found.id;
    }
  }

  if (!townId) {
    const num = parseInt(String(townIdOrName), 10);
    if (!isNaN(num) && num > 100) {
      townId = num;
    }
  }

  if (!townId) return [];

  if (cachedNeighborhoodsByTown.has(townId)) {
    return cachedNeighborhoodsByTown.get(townId)!;
  }

  const cacheKey = `muavinn_tradres_quarters_${townId}`;
  try {
    const saved = localStorage.getItem(cacheKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedNeighborhoodsByTown.set(townId, parsed);
        return parsed;
      }
    }
  } catch (e) {}

  try {
    const response = await fetch(
      `${TRADRES_BASE_URL}?level=quarter&parentId=${townId}&take=500`
    );
    if (!response.ok) {
      throw new Error(`TrAdres API quarter status ${response.status}`);
    }
    const nodes: TrAdresNode[] = await response.json();
    if (Array.isArray(nodes) && nodes.length > 0) {
      const list: TrAdresNeighborhood[] = nodes.map((node) => ({
        id: node.id,
        name: toTurkishTitleCase(node.name),
        rawName: node.name,
        townId: townId!,
      }));

      list.sort((a, b) => a.name.localeCompare(b.name, "tr-TR"));

      cachedNeighborhoodsByTown.set(townId, list);
      try {
        localStorage.setItem(cacheKey, JSON.stringify(list));
      } catch (e) {}
      return list;
    }
  } catch (error) {
    console.warn(`Could not fetch neighborhoods for town ${townId} from TrAdres:`, error);
  }

  return [];
}
