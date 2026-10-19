// Google Cloud Console & Firestore Marka / Logo Senkronizasyon Servisi
// Cloud Console'daki Firestore veritabanı (system_settings/branding) ile logo ve kurumsal kimliği canlı senkronize eder.

import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";
import {
  db,
  sanitizeForFirestore,
  isFirestoreWriteQuotaExhausted,
  checkAndMarkFirestoreQuotaError,
} from "../lib/firebase";
import { safeSetStorageItem } from "../utils/storage";
import firebaseConfig from "../../firebase-applet-config.json";

export interface CompanyCloudLogoEntry {
  logoUrl: string;
  logoScale?: number;
  brandName?: string;
  updatedAt?: string;
}

export interface CloudBrandingConfig {
  brandName: string;
  logoUrl: string;
  logoScale?: number;
  logoLightUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  source?: string;
  databaseId?: string;
  projectId?: string;
  updatedAt?: string;
  updatedBy?: string;
  description?: string;
  companyLogos?: Record<string, CompanyCloudLogoEntry>;
}

export const DEFAULT_CLOUD_BRANDING: CloudBrandingConfig = {
  brandName: "E-MUAVİN",
  logoUrl: "/logo.svg",
  logoScale: 1,
  logoLightUrl: "/logo-light.svg",
  faviconUrl: "/favicon.svg",
  primaryColor: "#0A192F",
  accentColor: "#EAA728",
  source: "Google Cloud Console",
  databaseId: (firebaseConfig as any).firestoreDatabaseId || "ai-studio-muavinnmuhasebep-7117d5a6-2ef7-49fe-b6a7-4c0cdc615038",
  projectId: firebaseConfig.projectId || "yachty-courier-bt3g1",
  updatedAt: new Date().toISOString(),
  description: "E-MUAVİN Kurumsal Logo & Marka Kimliği (Cloud Console Senkronize)",
  companyLogos: {}
};

const BRANDING_DOC_PATH = {
  collection: "system_settings",
  id: "branding"
};

/**
 * Storage QuotaExceededError korumalı güvenli yerel önbelleğe alma
 */
function safeSaveBrandingToStorage(config: CloudBrandingConfig) {
  if (typeof window === "undefined") return;

  // Aşırı büyük data URL/base64 logolar varsa önbellek için hafifletilmiş kopya üret
  let configToCache: CloudBrandingConfig = { ...config };
  if (configToCache.logoUrl && configToCache.logoUrl.startsWith("data:") && configToCache.logoUrl.length > 350000) {
    configToCache.logoUrl = "/logo.svg";
  }

  const serialized = JSON.stringify(configToCache);
  safeSetStorageItem("muavin_cloud_logo_url", configToCache.logoUrl);
  safeSetStorageItem("muavin_cloud_branding", serialized);
}

/**
 * Cloud Console (Firestore) üzerinden en güncel kurumsal logoyu ve marka ayarlarını çeker.
 */
export async function fetchCloudLogo(): Promise<CloudBrandingConfig> {
  try {
    const brandingRef = doc(db, BRANDING_DOC_PATH.collection, BRANDING_DOC_PATH.id);
    const snap = await getDoc(brandingRef);

    if (snap.exists()) {
      const data = snap.data() as Partial<CloudBrandingConfig>;
      const merged: CloudBrandingConfig = {
        ...DEFAULT_CLOUD_BRANDING,
        ...data,
        companyLogos: {
          ...(DEFAULT_CLOUD_BRANDING.companyLogos || {}),
          ...(data.companyLogos || {})
        },
        updatedAt: data.updatedAt || new Date().toISOString()
      };
      safeSaveBrandingToStorage(merged);
      return merged;
    } else {
      safeSaveBrandingToStorage(DEFAULT_CLOUD_BRANDING);
      return DEFAULT_CLOUD_BRANDING;
    }
  } catch (error) {
    checkAndMarkFirestoreQuotaError(error);
    console.warn("Cloud Console logo çekme uyarısı (yerel önbellek kullanılacak):", error);
    if (typeof window !== "undefined") {
      const cached = window.localStorage?.getItem("muavin_cloud_branding") || window.sessionStorage?.getItem("muavin_cloud_branding");
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {}
      }
    }
    return DEFAULT_CLOUD_BRANDING;
  }
}

/**
 * Cloud Console Firestore'u gerçek zamanlı dinler (onSnapshot).
 * Google Cloud Console'dan logo veya marka değiştirildiğinde uygulama anında güncellenir.
 */
export function subscribeToCloudLogo(
  onUpdate: (config: CloudBrandingConfig) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const brandingRef = doc(db, BRANDING_DOC_PATH.collection, BRANDING_DOC_PATH.id);
    return onSnapshot(
      brandingRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Partial<CloudBrandingConfig>;
          const config: CloudBrandingConfig = {
            ...DEFAULT_CLOUD_BRANDING,
            ...data,
            companyLogos: {
              ...(DEFAULT_CLOUD_BRANDING.companyLogos || {}),
              ...(data.companyLogos || {})
            }
          };
          safeSaveBrandingToStorage(config);
          onUpdate(config);
        } else {
          onUpdate(DEFAULT_CLOUD_BRANDING);
        }
      },
      (error) => {
        checkAndMarkFirestoreQuotaError(error);
        console.warn("Cloud Console logo canlı dinleme bağlantı uyarısı:", error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.error("Cloud Console logo dinleyici başlatılamadı:", err);
    return () => {};
  }
}

/**
 * Logoyu ve kurumsal kimlik ayarlarını Google Cloud Console (Firestore) üzerine şirket bazlı kaydeder.
 */
export async function saveCloudLogo(
  logoUrl: string,
  extraConfig?: Partial<CloudBrandingConfig> | string,
  companyId?: string
): Promise<CloudBrandingConfig> {
  const brandingRef = doc(db, BRANDING_DOC_PATH.collection, BRANDING_DOC_PATH.id);
  const now = new Date().toISOString();

  const normalizedExtra: Partial<CloudBrandingConfig> =
    typeof extraConfig === "string" ? { brandName: extraConfig } : extraConfig || {};

  let existingCompanyLogos: Record<string, CompanyCloudLogoEntry> = {};
  if (typeof window !== "undefined") {
    try {
      const cached = window.localStorage?.getItem("muavin_cloud_branding");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed.companyLogos === "object") {
          existingCompanyLogos = { ...parsed.companyLogos };
        }
      }
    } catch {}
  }

  const targetCompanyId = companyId || "comp_default";
  const updatedCompanyLogos: Record<string, CompanyCloudLogoEntry> = {
    ...existingCompanyLogos,
    ...(normalizedExtra.companyLogos || {}),
    [targetCompanyId]: {
      logoUrl: logoUrl || "/logo.svg",
      logoScale: normalizedExtra.logoScale ?? existingCompanyLogos[targetCompanyId]?.logoScale ?? 1,
      brandName: normalizedExtra.brandName || existingCompanyLogos[targetCompanyId]?.brandName || "E-MUAVİN",
      updatedAt: now
    }
  };

  const payload: CloudBrandingConfig = {
    ...DEFAULT_CLOUD_BRANDING,
    ...normalizedExtra,
    logoUrl: targetCompanyId === "comp_default" ? logoUrl : normalizedExtra.logoUrl || DEFAULT_CLOUD_BRANDING.logoUrl,
    companyLogos: updatedCompanyLogos,
    updatedAt: now,
    source: "Google Cloud Console"
  };

  if (!isFirestoreWriteQuotaExhausted()) {
    try {
      await setDoc(brandingRef, sanitizeForFirestore(payload), { merge: true });
    } catch (err) {
      checkAndMarkFirestoreQuotaError(err);
      console.warn("Cloud Console logo Firestore'a kaydedilemedi (yerel mod devrede):", err);
    }
  }
  safeSaveBrandingToStorage(payload);

  return payload;
}
