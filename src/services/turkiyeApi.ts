/**
 * Türkiye Location & Address Data Provider
 * Primary API: TrAdres API (https://api.tradres.com.tr/public/v1/catalog/providers/localsqlite/nodes)
 */
import {
  fetchTrAdresProvinces,
  fetchTrAdresDistricts,
  fetchTrAdresNeighborhoods,
  normalizeTurkish,
  toTurkishTitleCase,
  TrAdresProvince,
  TrAdresDistrict,
  TrAdresNeighborhood,
} from "./tradresApi";

export interface TurkiyeApiNeighborhood {
  id: number | string;
  name: string;
  population?: number;
  streets?: string[];
}

export interface TurkiyeApiDistrict {
  id: number | string;
  name: string;
  population?: number;
  neighborhoods?: TurkiyeApiNeighborhood[];
}

export interface TurkiyeApiProvince {
  id: number | string;
  name: string;
  area?: number;
  population?: number;
  altitude?: number;
  districts: TurkiyeApiDistrict[];
}

// Turkish string normalizer
export function normalizeTr(str: string): string {
  return normalizeTurkish(str);
}

export {
  fetchTrAdresProvinces,
  fetchTrAdresDistricts,
  fetchTrAdresNeighborhoods,
  toTurkishTitleCase,
  normalizeTurkish,
};

let provincesCache: TurkiyeApiProvince[] | null = null;
let activeSource: "tradres" | "melihozkara" | "fallback" = "tradres";

export function getActiveLocationSource(): "tradres" | "melihozkara" | "fallback" {
  return activeSource;
}

/**
 * Fetches all provinces (81 İl) from TrAdres API with fallback
 */
export async function fetchProvinces(): Promise<TurkiyeApiProvince[]> {
  if (provincesCache && provincesCache.length > 0) {
    return provincesCache;
  }

  try {
    const tradresList = await fetchTrAdresProvinces();
    if (tradresList && tradresList.length > 0) {
      const formatted: TurkiyeApiProvince[] = tradresList.map((p) => ({
        id: p.id,
        name: p.name,
        districts: [],
      }));
      provincesCache = formatted;
      activeSource = "tradres";
      return formatted;
    }
  } catch (e) {
    console.warn("TrAdres provinces fetch error:", e);
  }

  activeSource = "fallback";
  return [];
}

/**
 * Fetches specific province details
 */
export async function fetchProvinceDetails(idOrName: string | number): Promise<TurkiyeApiProvince | null> {
  const provinces = await fetchProvinces();
  const queryNorm = normalizeTurkish(String(idOrName));
  return (
    provinces.find(
      (p) =>
        String(p.id) === String(idOrName) ||
        normalizeTurkish(p.name) === queryNorm
    ) || null
  );
}
