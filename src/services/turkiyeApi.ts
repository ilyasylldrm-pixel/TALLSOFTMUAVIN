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

// Turkish string normalizer for robust city/district/neighborhood comparisons
export function normalizeTr(str: string): string {
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
    .trim();
}

const MELIHOZKARA_URLS = [
  "https://cdn.jsdelivr.net/gh/melihozkara/il-ilce-mahalle-sokak-veritabani@master/data.json",
  "https://cdn.jsdelivr.net/gh/melihozkara/il-ilce-mahalle-sokak-veritabani@master/data/data.json",
  "https://cdn.jsdelivr.net/gh/melihozkara/il-ilce-mahalle-sokak-veritabani@master/json/data.json",
  "https://raw.githubusercontent.com/melihozkara/il-ilce-mahalle-sokak-veritabani/master/data.json",
  "https://raw.githubusercontent.com/melihozkara/il-ilce-mahalle-sokak-veritabani/master/data/data.json",
  "https://cdn.jsdelivr.net/gh/melihozkara/il-ilce-mahalle-sokak-veritabani@main/data.json",
  "https://raw.githubusercontent.com/melihozkara/il-ilce-mahalle-sokak-veritabani/main/data.json",
];

const MBURAK_URLS = [
  "https://cdn.jsdelivr.net/gh/mburakkalkan/turkiye-il-ilce-semt-mahalle-veritabani@master/data/data.json",
  "https://raw.githubusercontent.com/mburakkalkan/turkiye-il-ilce-semt-mahalle-veritabani/master/data/data.json",
  "https://cdn.jsdelivr.net/gh/mburakkalkan/turkiye-il-ilce-semt-mahalle-veritabani@main/data/data.json",
  "https://raw.githubusercontent.com/mburakkalkan/turkiye-il-ilce-semt-mahalle-veritabani/main/data/data.json",
];

const TURKIYE_API_DEV_URL = "https://turkiyeapi.dev/api/v1/provinces";

let provincesCache: TurkiyeApiProvince[] | null = null;
let activeSource: "melihozkara" | "mburakkalkan" | "turkiyeapi" | "fallback" = "fallback";

export function getActiveLocationSource(): "melihozkara" | "mburakkalkan" | "turkiyeapi" | "fallback" {
  return activeSource;
}

/**
 * Normalizes raw object data from melihozkara, mburakkalkan, or turkiyeapi into standard TurkiyeApiProvince[] format
 */
export function formatRawLocationData(rawData: any[]): TurkiyeApiProvince[] {
  if (!Array.isArray(rawData)) return [];

  return rawData.map((prov: any, index: number) => {
    const provName =
      prov.name ||
      prov.il_adi ||
      prov.il ||
      prov.cityName ||
      prov.label ||
      String(prov);

    const rawDistricts =
      prov.districts || prov.ilceler || prov.ilce || prov.districtsList || [];

    const districts: TurkiyeApiDistrict[] = Array.isArray(rawDistricts)
      ? rawDistricts.map((dist: any, dIdx: number) => {
          const distName =
            typeof dist === "string"
              ? dist
              : dist.name ||
                dist.ilce_adi ||
                dist.ilce ||
                dist.districtName ||
                String(dist);

          const rawNh =
            typeof dist === "object" && dist !== null
              ? dist.neighborhoods ||
                dist.mahalleler ||
                dist.mahalle ||
                dist.semtler ||
                []
              : [];

          let neighborhoods: TurkiyeApiNeighborhood[] = [];
          if (Array.isArray(rawNh)) {
            neighborhoods = rawNh.map((nh: any, nIdx: number) => {
              const nhName =
                typeof nh === "string"
                  ? nh
                  : nh.name ||
                    nh.mahalle_adi ||
                    nh.mahalle ||
                    nh.neighborhoodName ||
                    String(nh);

              const rawSokak =
                typeof nh === "object" && nh !== null
                  ? nh.streets || nh.sokak || nh.sokaklar || nh.caddeler || []
                  : [];

              const streets = Array.isArray(rawSokak)
                ? rawSokak.map((s: any) => (typeof s === "string" ? s : s.name || s.sokak_adi || String(s)))
                : [];

              return {
                id: nh.id || `${dIdx + 1}-${nIdx + 1}`,
                name: nhName,
                streets,
              };
            });
          }

          return {
            id: dist.id || dIdx + 1,
            name: distName,
            neighborhoods,
          };
        })
      : [];

    return {
      id: prov.id || prov.code || index + 1,
      name: provName,
      districts,
    };
  });
}

/**
 * Fetches provinces, districts, neighborhoods, and streets.
 * Priority 1: melihozkara/il-ilce-mahalle-sokak-veritabani
 * Priority 2: mburakkalkan/turkiye-il-ilce-semt-mahalle-veritabani
 * Priority 3: turkiyeapi.dev API
 */
export async function fetchProvinces(): Promise<TurkiyeApiProvince[]> {
  if (provincesCache && provincesCache.length > 0) {
    return provincesCache;
  }

  // 1. Try melihozkara URLs
  for (const url of MELIHOZKARA_URLS) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const json = await response.json();
        const dataArr = Array.isArray(json) ? json : json.data || json.provinces || [];
        if (Array.isArray(dataArr) && dataArr.length > 0) {
          const formatted = formatRawLocationData(dataArr);
          if (formatted.length > 0) {
            provincesCache = formatted;
            activeSource = "melihozkara";
            console.log("Loaded location database from melihozkara repository.");
            return formatted;
          }
        }
      }
    } catch (err) {
      // Continue next endpoint
    }
  }

  // 2. Try mburakkalkan URLs as backup
  for (const url of MBURAK_URLS) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const json = await response.json();
        const dataArr = Array.isArray(json) ? json : json.data || json.provinces || [];
        if (Array.isArray(dataArr) && dataArr.length > 0) {
          const formatted = formatRawLocationData(dataArr);
          if (formatted.length > 0) {
            provincesCache = formatted;
            activeSource = "mburakkalkan";
            console.log("Loaded location dataset from mburakkalkan repository.");
            return formatted;
          }
        }
      }
    } catch (err) {
      // Continue next endpoint
    }
  }

  // 3. Try turkiyeapi.dev
  try {
    const response = await fetch(TURKIYE_API_DEV_URL);
    if (response.ok) {
      const result = await response.json();
      const dataArr = result.data || result;
      if (Array.isArray(dataArr) && dataArr.length > 0) {
        const formatted = formatRawLocationData(dataArr);
        if (formatted.length > 0) {
          provincesCache = formatted;
          activeSource = "turkiyeapi";
          console.log("Loaded location dataset from turkiyeapi.dev.");
          return formatted;
        }
      }
    }
  } catch (err) {
    console.warn("turkiyeapi.dev fetch failed:", err);
  }

  activeSource = "fallback";
  return [];
}

/**
 * Fetches specific province details
 */
export async function fetchProvinceDetails(idOrName: string | number): Promise<TurkiyeApiProvince | null> {
  const provinces = await fetchProvinces();
  const queryNorm = normalizeTr(String(idOrName));
  return (
    provinces.find(
      (p) =>
        String(p.id) === String(idOrName) ||
        normalizeTr(p.name) === queryNorm
    ) || null
  );
}
