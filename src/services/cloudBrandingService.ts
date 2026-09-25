// Google Cloud Console & Firestore Marka / Logo Senkronizasyon Servisi
// Cloud Console'daki Firestore veritabanı (system_settings/branding) ile logo ve kurumsal kimliği canlı senkronize eder.

import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";
import { db, sanitizeForFirestore } from "../lib/firebase";
import { safeSetStorageItem } from "../utils/storage";
import firebaseConfig from "../../firebase-applet-config.json";

export interface CloudBrandingConfig {
  brandName: string;
  logoUrl: string;
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
}

export const DEFAULT_CLOUD_BRANDING: CloudBrandingConfig = {
  brandName: "E-MUAVİN",
  logoUrl: "/logo.svg",
  logoLightUrl: "/logo-light.svg",
  faviconUrl: "/favicon.svg",
  primaryColor: "#0A192F",
  accentColor: "#EAA728",
  source: "Google Cloud Console",
  databaseId: (firebaseConfig as any).firestoreDatabaseId || "ai-studio-muavinnmuhasebep-7117d5a6-2ef7-49fe-b6a7-4c0cdc615038",
  projectId: firebaseConfig.projectId || "yachty-courier-bt3g1",
  updatedAt: new Date().toISOString(),
  description: "E-MUAVİN Kurumsal Logo & Marka Kimliği (Cloud Console Senkronize)"
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
  let configToCache: CloudBrandingConfig = config;
  if (config.logoUrl && config.logoUrl.startsWith("data:") && config.logoUrl.length > 50000) {
    configToCache = {
      ...config,
      logoUrl: config.logoUrl.length > 100000 ? "/logo.svg" : config.logoUrl
    };
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
        updatedAt: data.updatedAt || new Date().toISOString()
      };
      safeSaveBrandingToStorage(merged);
      return merged;
    } else {
      // Eğer Cloud Console'da henüz kayıt yoksa varsayılan kurumsal logoyu Cloud Console'a kaydet ve döndür
      await saveCloudLogo(DEFAULT_CLOUD_BRANDING.logoUrl, DEFAULT_CLOUD_BRANDING);
      return DEFAULT_CLOUD_BRANDING;
    }
  } catch (error) {
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
            ...data
          };
          safeSaveBrandingToStorage(config);
          onUpdate(config);
        } else {
          onUpdate(DEFAULT_CLOUD_BRANDING);
        }
      },
      (error) => {
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
 * Logoyu ve kurumsal kimlik ayarlarını Google Cloud Console (Firestore) üzerine kaydeder.
 */
export async function saveCloudLogo(
  logoUrl: string,
  extraConfig?: Partial<CloudBrandingConfig>
): Promise<CloudBrandingConfig> {
  const brandingRef = doc(db, BRANDING_DOC_PATH.collection, BRANDING_DOC_PATH.id);
  const now = new Date().toISOString();

  const payload: CloudBrandingConfig = {
    ...DEFAULT_CLOUD_BRANDING,
    ...extraConfig,
    logoUrl,
    updatedAt: now,
    source: "Google Cloud Console"
  };

  try {
    await setDoc(brandingRef, sanitizeForFirestore(payload), { merge: true });
  } catch (err) {
    console.warn("Cloud Console logo Firestore'a kaydedilemedi (yerel mod devrede):", err);
  }
  safeSaveBrandingToStorage(payload);

  return payload;
}
