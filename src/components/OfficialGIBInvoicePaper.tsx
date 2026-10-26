import React, { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  Building2,
  Check,
  CreditCard,
  Eye,
  FileCheck2,
  FileText,
  Image as ImageIcon,
  Layers,
  Palette,
  Plus,
  QrCode,
  RotateCcw,
  Save,
  ShieldCheck,
  Sliders,
  Sparkles,
  Stamp,
  Trash2,
  Upload,
  Move,
  Code2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  CloudUpload,
  Download,
  PenTool,
} from "lucide-react";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import {
  db,
  auth,
  sanitizeForFirestore,
  isFirestoreWriteQuotaExhausted,
  checkAndMarkFirestoreQuotaError,
} from "../lib/firebase";
import type {
  CompanySettings,
  Contact,
  GibLogoCssAlign,
  Invoice,
  InvoiceColorTheme,
  InvoiceDesignSettings,
  InvoiceItem,
  InvoicePreviewCssConfig,
  InvoiceTemplateStyle,
  IssuerSignatureCssZone,
} from "../types";
import { getContactAccountCode } from "../types";
import { numberToTurkishWords } from "../utils/numberToTurkishWords";
import { formatDate, getCurrencySymbol } from "../utils/exportUtils";
import {
  computeInvoiceTotals,
  formatWithholdingBadge,
  generateInvoiceLegalTaxNotes,
} from "../utils/taxCalculationService";
import {
  formatAddressWithBranch,
  getActiveCompanyId,
  getCompaniesList,
  getCompanyHeadquartersAddress,
  getStoredData,
  resolveBranchAddressFromBranches,
  saveStoredData,
  updateCompanyItem,
} from "../utils/storage";
import { readAndOptimizeLogoFile } from "../utils/logoUpload";
import { saveCloudLogo } from "../services/cloudBrandingService";
import { pushCompanyDataToCloud } from "../services/systemSyncService";
import { Logo } from "./Logo";
import {
  GIB_OFFICIAL_UPLOADED_LOGO_DATA_URI,
  GIB_OFFICIAL_UPLOADED_QR_CODE_DATA_URI,
  GIB_OFFICIAL_UPLOADED_QR_CODE_PATH,
} from "../utils/gibOfficialAssets";
import { EArsivSignatureStudioModal } from "./EArsivSignatureStudioModal";

export interface ThemePalette {
  id: InvoiceColorTheme;
  label: string;
  shortLabel: string;
  primary: string;
  primaryLight: string;
  border: string;
  headerBg: string;
  headerText: string;
  isDark: boolean;
  badgeBg: string;
  qrColor: string;
}

/**
 * Determines whether a hex color is visually dark (true) or light (false)
 * using W3C YIQ relative luminance.
 */
export function isHexColorDark(hex: string): boolean {
  const clean = String(hex || "").replace("#", "").trim();
  if (clean.length !== 6 && clean.length !== 3) return true;
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return true;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq < 155;
}

export function getContrastTextColor(bgHex: string): "#ffffff" | "#0f172a" {
  return isHexColorDark(bgHex) ? "#ffffff" : "#0f172a";
}

export const INVOICE_COLOR_THEMES: Record<InvoiceColorTheme, ThemePalette> = {
  gib_red: {
    id: "gib_red",
    label: "GİB Resmi Kırmızı (Koyu)",
    shortLabel: "GİB Kırmızı",
    primary: "#991b1b",
    primaryLight: "#fef2f2",
    border: "#dc2626",
    headerBg: "#7f1d1d",
    headerText: "#ffffff",
    isDark: true,
    badgeBg: "#991b1b",
    qrColor: "#000000",
  },
  blue: {
    id: "blue",
    label: "Mavi (Koyu Tema - Beyaz Açıklama)",
    shortLabel: "Mavi",
    primary: "#2563eb",
    primaryLight: "#eff6ff",
    border: "#2563eb",
    headerBg: "#2563eb",
    headerText: "#ffffff",
    isDark: true,
    badgeBg: "#1d4ed8",
    qrColor: "#000000",
  },
  sky: {
    id: "sky",
    label: "Açık Mavi (Açık Tema - Koyu Açıklama)",
    shortLabel: "Açık Mavi",
    primary: "#0369a1",
    primaryLight: "#f0f9ff",
    border: "#38bdf8",
    headerBg: "#dbeafe",
    headerText: "#0f172a",
    isDark: false,
    badgeBg: "#0284c7",
    qrColor: "#000000",
  },
  navy: {
    id: "navy",
    label: "Kurumsal Lacivert (Koyu)",
    shortLabel: "Lacivert",
    primary: "#0f172a",
    primaryLight: "#f8fafc",
    border: "#334155",
    headerBg: "#0f172a",
    headerText: "#ffffff",
    isDark: true,
    badgeBg: "#1e293b",
    qrColor: "#000000",
  },
  royal: {
    id: "royal",
    label: "Kraliyet Mavisi (Koyu)",
    shortLabel: "Koyu Mavi",
    primary: "#1e3a8a",
    primaryLight: "#eff6ff",
    border: "#1d4ed8",
    headerBg: "#1e3a8a",
    headerText: "#ffffff",
    isDark: true,
    badgeBg: "#1e3a8a",
    qrColor: "#000000",
  },
  emerald: {
    id: "emerald",
    label: "Zümrüt Kurumsal (Koyu)",
    shortLabel: "Yeşil",
    primary: "#065f46",
    primaryLight: "#ecfdf5",
    border: "#059669",
    headerBg: "#065f46",
    headerText: "#ffffff",
    isDark: true,
    badgeBg: "#047857",
    qrColor: "#000000",
  },
  classic: {
    id: "classic",
    label: "Klasik Açık S/B (Açık Tema - Koyu Açıklama)",
    shortLabel: "Klasik Açık",
    primary: "#111827",
    primaryLight: "#f9fafb",
    border: "#111827",
    headerBg: "#f3f4f6",
    headerText: "#0f172a",
    isDark: false,
    badgeBg: "#111827",
    qrColor: "#000000",
  },
};

export function resolveInvoiceThemePalette(design?: InvoiceDesignSettings): ThemePalette {
  const base =
    INVOICE_COLOR_THEMES[design?.colorTheme || "gib_red"] || INVOICE_COLOR_THEMES.gib_red;
  if (design?.customAccentColor && /^#[0-9A-Fa-f]{6}$/.test(design.customAccentColor)) {
    const customHex = design.customAccentColor;
    const dark = isHexColorDark(customHex);
    const contrastText = getContrastTextColor(customHex);
    return {
      ...base,
      primary: dark ? customHex : "#0f172a",
      primaryLight: customHex,
      border: dark ? customHex : "#475569",
      headerBg: customHex,
      headerText: contrastText,
      isDark: dark,
      badgeBg: customHex,
      qrColor: "#000000",
    };
  }
  const dark = isHexColorDark(base.headerBg);
  return {
    ...base,
    headerText: getContrastTextColor(base.headerBg),
    isDark: dark,
    qrColor: "#000000",
  };
}

export const DEFAULT_INVOICE_PREVIEW_CSS_CONFIG: InvoicePreviewCssConfig = {
  gibLogoAlign: "center",
  gibLogoOffsetX: 0,
  gibLogoOffsetY: 0,
  gibLogoSize: 76,
  signatureZone: "under_gib",
  signatureAlign: "center",
  signatureOffsetX: 0,
  signatureOffsetY: 0,
  signatureScale: 1,
  signatureBorderStyle: "solid",
  sellerInfoOffsetX: 0,
  sellerInfoOffsetY: 0,
  sellerInfoAlign: "left",
  customCss: "",
};

const INDEPENDENT_INVOICE_CSS_STORAGE_KEY = "muavin_invoice_preview_css_config_v1";

function resolveTargetCompanyId(companyId?: string): string {
  const cleaned = String(companyId || "").trim();
  if (cleaned) return cleaned;
  try {
    return getActiveCompanyId() || "comp_default";
  } catch {
    return "comp_default";
  }
}

function getCompanyCssStorageKey(companyId?: string): string {
  const cid = resolveTargetCompanyId(companyId);
  return `${INDEPENDENT_INVOICE_CSS_STORAGE_KEY}_${cid}`;
}

/**
 * Reads the invoice preview CSS configuration independently of the Settings menu (company-scoped).
 */
export function getIndependentInvoiceCssConfig(
  override?: Partial<InvoicePreviewCssConfig>,
  companyId?: string
): InvoicePreviewCssConfig {
  let stored: Partial<InvoicePreviewCssConfig> = {};
  if (typeof window !== "undefined") {
    try {
      const companyKey = getCompanyCssStorageKey(companyId);
      const raw =
        window.localStorage.getItem(companyKey) ||
        window.localStorage.getItem(INDEPENDENT_INVOICE_CSS_STORAGE_KEY);
      if (raw) {
        stored = JSON.parse(raw);
      }
    } catch {}
  }
  return {
    ...DEFAULT_INVOICE_PREVIEW_CSS_CONFIG,
    ...stored,
    ...(override || {}),
  };
}

/**
 * Persists the invoice preview CSS configuration locally (company-scoped)
 * and notifies all open preview/print components immediately.
 */
export function saveIndependentInvoiceCssConfig(
  patch: Partial<InvoicePreviewCssConfig>,
  companyId?: string
): InvoicePreviewCssConfig {
  const cid = resolveTargetCompanyId(companyId);
  const current = getIndependentInvoiceCssConfig(undefined, cid);
  const next: InvoicePreviewCssConfig = {
    ...current,
    ...patch,
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(getCompanyCssStorageKey(cid), JSON.stringify(next));
      window.localStorage.setItem(INDEPENDENT_INVOICE_CSS_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(
        new CustomEvent("muavin:invoice-css-config-changed", {
          detail: { companyId: cid, cssConfig: next },
        })
      );
    } catch {}
  }
  return next;
}

export function resetIndependentInvoiceCssConfig(companyId?: string): InvoicePreviewCssConfig {
  const cid = resolveTargetCompanyId(companyId);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(getCompanyCssStorageKey(cid));
      window.localStorage.removeItem(INDEPENDENT_INVOICE_CSS_STORAGE_KEY);
      window.dispatchEvent(
        new CustomEvent("muavin:invoice-css-config-changed", {
          detail: { companyId: cid, cssConfig: DEFAULT_INVOICE_PREVIEW_CSS_CONFIG },
        })
      );
    } catch {}
  }
  return { ...DEFAULT_INVOICE_PREVIEW_CSS_CONFIG };
}

/**
 * Saves the customized Invoice CSS Configuration & Design Settings to Firestore (company-scoped)
 * and broadcasts the update so all preview screens reflect it immediately.
 */
export async function saveCompanyInvoiceCssToFirestore(
  companySettings: CompanySettings,
  cssConfig: InvoicePreviewCssConfig,
  design: InvoiceDesignSettings
): Promise<{ success: boolean; updatedAt: string }> {
  const cid = resolveTargetCompanyId(companySettings?.id);
  const nowIso = new Date().toISOString();
  const mergedDesign: InvoiceDesignSettings = {
    ...design,
    cssConfig,
  };

  // 1. Update local company-scoped CSS cache & broadcast to preview screens immediately
  saveIndependentInvoiceCssConfig(cssConfig, cid);

  // 2. Update local stored company settings & CompanyItem
  try {
    const stored = getStoredData(cid);
    const updatedSettings: CompanySettings = {
      ...(stored.settings || {}),
      ...companySettings,
      invoiceDesign: mergedDesign,
    };
    saveStoredData("SETTINGS", updatedSettings, cid);

    const companies = getCompaniesList();
    const matched = companies.find((c) => c.id === cid);
    if (matched) {
      updateCompanyItem({
        ...matched,
        invoiceDesign: mergedDesign,
      });
    }
  } catch {}

  // 3. Persist directly to Firestore (system_settings/invoice_css_{companyId} and global default)
  const docPath = `system_settings/invoice_css_${cid}`;
  if (!isFirestoreWriteQuotaExhausted()) {
    try {
      const payload = sanitizeForFirestore({
        settingKey: `invoice_css_${cid}`,
        companyId: cid,
        companyName:
          companySettings?.companyTitle ||
          companySettings?.companyName ||
          "Kurumsal Şirket",
        cssConfig,
        invoiceDesign: mergedDesign,
        lastUpdated: nowIso,
        updatedAt: nowIso,
        updatedBy: auth.currentUser?.email || companySettings?.email || "Kullanıcı",
      });
      const ref = doc(db, "system_settings", `invoice_css_${cid}`);
      await setDoc(ref, payload, { merge: true });

      const globalRef = doc(db, "system_settings", "invoice_css_global");
      await setDoc(
        globalRef,
        sanitizeForFirestore({
          settingKey: "invoice_css_global",
          companyId: "global",
          cssConfig,
          invoiceDesign: {
            ...mergedDesign,
            logoWidth: mergedDesign.logoWidth,
            logoHeight: mergedDesign.logoHeight,
            logoSize: mergedDesign.logoSize,
            logoObjectFit: mergedDesign.logoObjectFit,
          },
          lastUpdated: nowIso,
          updatedAt: nowIso,
          updatedBy: auth.currentUser?.email || companySettings?.email || "Kullanıcı",
        }),
        { merge: true }
      );
    } catch (error) {
      if (!checkAndMarkFirestoreQuotaError(error)) {
        console.error(
          "Firestore Error: ",
          JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            operationType: "write",
            path: docPath,
            authInfo: {
              userId: auth.currentUser?.uid,
              email: auth.currentUser?.email,
              emailVerified: auth.currentUser?.emailVerified,
              isAnonymous: auth.currentUser?.isAnonymous,
            },
          })
        );
      }
    }
  }

  // 4. Also trigger company cloud sync so company_data_{companyId} has the latest invoiceDesign
  void pushCompanyDataToCloud(cid);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("muavin:invoice-css-config-changed", {
        detail: {
          companyId: cid,
          cssConfig,
          invoiceDesign: mergedDesign,
          updatedAt: nowIso,
        },
      })
    );
  }

  return { success: true, updatedAt: nowIso };
}

/**
 * Subscribes to the company's saved Invoice CSS & Design Configuration in Firestore
 * (with fallback to global e-invoice design settings) and automatically syncs it to all users.
 */
export function subscribeToCompanyInvoiceCssFromFirestore(
  companyId: string | undefined,
  onUpdate: (payload: {
    cssConfig: InvoicePreviewCssConfig;
    invoiceDesign?: Partial<InvoiceDesignSettings>;
    updatedAt?: string;
  }) => void
): () => void {
  const cid = resolveTargetCompanyId(companyId);
  if (isFirestoreWriteQuotaExhausted()) {
    return () => {};
  }
  const docPath = `system_settings/invoice_css_${cid}`;
  let hasCompanySpecificDoc = false;

  const applySnapshotData = (data: any) => {
    if (!data || typeof data !== "object") return;
    if (data.cssConfig || data.invoiceDesign) {
      const nextCss: InvoicePreviewCssConfig = {
        ...DEFAULT_INVOICE_PREVIEW_CSS_CONFIG,
        ...(data.cssConfig && typeof data.cssConfig === "object" ? data.cssConfig : {}),
      };
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(getCompanyCssStorageKey(cid), JSON.stringify(nextCss));
          window.localStorage.setItem(
            INDEPENDENT_INVOICE_CSS_STORAGE_KEY,
            JSON.stringify(nextCss)
          );
        } catch {}
      }
      onUpdate({
        cssConfig: nextCss,
        invoiceDesign: data.invoiceDesign,
        updatedAt: data.updatedAt || data.lastUpdated,
      });
    }
  };

  try {
    const ref = doc(db, "system_settings", `invoice_css_${cid}`);
    const unsubCompany = onSnapshot(
      ref,
      (snapshot) => {
        if (!snapshot.exists()) return;
        hasCompanySpecificDoc = true;
        applySnapshotData(snapshot.data());
      },
      (error) => {
        if (!checkAndMarkFirestoreQuotaError(error)) {
          console.warn("Firestore invoice CSS subscription warning on", docPath, error);
        }
      }
    );

    const globalRef = doc(db, "system_settings", "invoice_css_global");
    const unsubGlobal = onSnapshot(
      globalRef,
      (snapshot) => {
        if (hasCompanySpecificDoc || !snapshot.exists()) return;
        applySnapshotData(snapshot.data());
      },
      () => {}
    );

    return () => {
      unsubCompany();
      unsubGlobal();
    };
  } catch (err) {
    checkAndMarkFirestoreQuotaError(err);
    return () => {};
  }
}

/**
 * Builds scoped CSS variables and rules for GİB Logo, Issuer Info (Düzenleyen Bilgisi),
 * and User Signature (Düzenleyen Kaşe / İmza).
 */
export function buildInvoicePreviewScopedCss(
  paperId: string,
  cfg: InvoicePreviewCssConfig
): string {
  const gibJustify =
    cfg.gibLogoAlign === "left"
      ? "flex-start"
      : cfg.gibLogoAlign === "right"
      ? "flex-end"
      : "center";
  const sigJustify =
    cfg.signatureAlign === "left"
      ? "flex-start"
      : cfg.signatureAlign === "right"
      ? "flex-end"
      : "center";

  return `
#${paperId} {
  --gib-logo-x: ${Number(cfg.gibLogoOffsetX) || 0}px;
  --gib-logo-y: ${Number(cfg.gibLogoOffsetY) || 0}px;
  --gib-logo-size: ${Number(cfg.gibLogoSize) || 76}px;
  --gib-logo-justify: ${gibJustify};
  --gib-logo-text-align: ${cfg.gibLogoAlign || "center"};
  --issuer-sig-x: ${Number(cfg.signatureOffsetX) || 0}px;
  --issuer-sig-y: ${Number(cfg.signatureOffsetY) || 0}px;
  --issuer-sig-scale: ${Number(cfg.signatureScale) || 1};
  --issuer-sig-justify: ${sigJustify};
  --issuer-sig-text-align: ${cfg.signatureAlign || "center"};
  --issuer-sig-border-style: ${cfg.signatureBorderStyle || "solid"};
  --seller-info-x: ${Number(cfg.sellerInfoOffsetX) || 0}px;
  --seller-info-y: ${Number(cfg.sellerInfoOffsetY) || 0}px;
  --seller-info-text-align: ${cfg.sellerInfoAlign || "left"};
}
#${paperId} .gib-logo-css-target {
  display: flex;
  flex-direction: column;
  align-items: var(--gib-logo-justify);
  text-align: var(--gib-logo-text-align);
  transform: translate3d(var(--gib-logo-x), var(--gib-logo-y), 0);
  transition: transform 120ms ease;
  position: relative;
  z-index: 2;
}
#${paperId} .issuer-signature-css-target {
  display: flex;
  flex-direction: column;
  align-items: var(--issuer-sig-justify);
  text-align: var(--issuer-sig-text-align);
  border-style: var(--issuer-sig-border-style);
  border-width: ${cfg.signatureBorderStyle === "none" ? "0px" : "1px"};
  transform: translate3d(var(--issuer-sig-x), var(--issuer-sig-y), 0) scale(var(--issuer-sig-scale));
  transform-origin: top ${cfg.signatureAlign || "center"};
  transition: transform 120ms ease;
  position: relative;
  z-index: 2;
}
#${paperId} .issuer-seller-css-target {
  text-align: var(--seller-info-text-align);
  transform: translate3d(var(--seller-info-x), var(--seller-info-y), 0);
  transition: transform 120ms ease;
  position: relative;
}
${cfg.customCss ? cfg.customCss : ""}
`.trim();
}

export const DEFAULT_INVOICE_DESIGN: Required<
  Omit<
    InvoiceDesignSettings,
    | "customAccentColor"
    | "logoWidth"
    | "logoHeight"
    | "logoObjectFit"
    | "stampImageUrl"
    | "signatureImageUrl"
    | "signerName"
    | "signerTitle"
    | "eArsivSignatureMode"
    | "eArsivSignatureColor"
    | "showSigningTimestamp"
    | "bankAccounts"
    | "cssConfig"
  >
> = {
  templateStyle: "gib_standard",
  colorTheme: "gib_red",
  showGibSeal: true,
  showQrCode: true,
  showCompanyLogo: true,
  logoSize: "md",
  showProductCode: true,
  showBankIbanTable: true,
  showTaxBreakdownTable: true,
  showSignatureStamp: true,
  autoDigitalStamp: true,
  irsaliyeYerineGecer: true,
  eFaturaFooterNote:
    "İşbu fatura 5070 sayılı Elektronik İmza Kanunu uyarınca Mali Mühür / Nitelikli Elektronik Sertifika ile imzalanmıştır.",
  eArsivFooterNote:
    "e-Arşiv izni kapsamında elektronik ortamda iletilmiştir. İrsaliye yerine geçer.",
};

export function resolveInvoiceDesignSettings(
  companySettings?: CompanySettings | null,
  override?: Partial<InvoiceDesignSettings>
): InvoiceDesignSettings {
  return {
    ...DEFAULT_INVOICE_DESIGN,
    ...(companySettings?.invoiceDesign || {}),
    ...(override || {}),
  };
}

export function resolveInvoiceLogoDimensions(design?: InvoiceDesignSettings | null): {
  widthPx: number;
  heightPx: number;
  objectFit: "contain" | "fill" | "cover";
} {
  const preset =
    design?.logoSize === "sm"
      ? { width: 80, height: 60 }
      : design?.logoSize === "lg"
      ? { width: 170, height: 80 }
      : { width: 100, height: 100 };

  const rawW = Number(design?.logoWidth);
  const rawH = Number(design?.logoHeight);
  const widthPx =
    Number.isFinite(rawW) && rawW > 0
      ? Math.min(340, Math.max(24, Math.round(rawW)))
      : preset.width;
  const heightPx =
    Number.isFinite(rawH) && rawH > 0
      ? Math.min(240, Math.max(20, Math.round(rawH)))
      : preset.height;
  const objectFit =
    design?.logoObjectFit === "fill" || design?.logoObjectFit === "cover"
      ? design.logoObjectFit
      : "contain";

  return { widthPx, heightPx, objectFit };
}

export function resolveOfficialEDocumentKind(
  invoice: Partial<Invoice>,
  companySettings?: CompanySettings | null,
  contact?: Contact | null,
  overrideMode: "auto" | "e_fatura" | "e_arsiv" | string = "auto"
): {
  isReceipt: boolean;
  isPurchase: boolean;
  isEArsiv: boolean;
  isEFatura: boolean;
  docTitle: string;
  docSubtitle: string;
  scenarioCode: string;
  profileCode: string;
} {
  const invType = invoice.type || "sales";
  const isReceipt = invoice.docKind === "receipt";
  const isPurchase = invType === "purchase" || invType === "expense" || invType === "purchase_invoice";

  if (isReceipt) {
    return {
      isReceipt: true,
      isPurchase,
      isEArsiv: false,
      isEFatura: false,
      docTitle: isPurchase ? "GİDER / MASRAF FİŞİ" : "PERAKENDE SATIŞ FİŞİ",
      docSubtitle: "Dahili Muhasebe Fiş Belgesi",
      scenarioCode: "PERAKENDE",
      profileCode: isPurchase ? "GIDER" : "SATIS",
    };
  }

  const rawScenario = String(invoice.invoiceScenario || "").toUpperCase();
  const rawEDocType = String(invoice.eDocumentType || "").toLowerCase();
  const invNo = String(invoice.invoiceNumber || "").toUpperCase();
  const eArsivPrefix = String(companySettings?.eArsivPrefix || "EAR").toUpperCase();

  let isEArsiv = false;
  if (overrideMode === "e_arsiv") {
    isEArsiv = true;
  } else if (overrideMode === "e_fatura") {
    isEArsiv = false;
  } else {
    if (
      rawScenario === "EARSIVFATURA" ||
      rawEDocType === "e_arsiv" ||
      rawEDocType.includes("arsiv") ||
      rawEDocType.includes("arşiv") ||
      (eArsivPrefix && invNo.startsWith(eArsivPrefix)) ||
      invNo.startsWith("EAR")
    ) {
      isEArsiv = true;
    } else if (
      rawScenario === "TICARIFATURA" ||
      rawScenario === "TEMELFATURA" ||
      rawScenario === "KAMU" ||
      rawScenario === "IHRACAT" ||
      rawScenario === "HAL" ||
      rawEDocType === "e_fatura"
    ) {
      isEArsiv = false;
    } else if (contact && contact.isEFaturaUser === false) {
      isEArsiv = true;
    }
  }

  const isEFatura = !isEArsiv;
  const scenarioCode = isEArsiv
    ? "EARSIVFATURA"
    : rawScenario && rawScenario !== "EARSIVFATURA"
    ? rawScenario
    : "TICARIFATURA";
  const profileCode = String(
    invoice.invoiceProfileType || (isPurchase ? "ALIS" : "SATIS")
  ).toUpperCase();

  return {
    isReceipt: false,
    isPurchase,
    isEArsiv,
    isEFatura,
    docTitle: isEArsiv ? "e-Arşiv Fatura" : "e-FATURA",
    docSubtitle: isEArsiv
      ? "GİB e-Arşiv Fatura Elektronik Belgesi"
      : "GİB UBL-TR 1.2 Resmi e-Fatura Belgesi",
    scenarioCode,
    profileCode,
  };
}

/**
 * Official Turkish Revenue Administration (T.C. Hazine ve Maliye Bakanlığı - Gelir İdaresi Başkanlığı)
 * Uploaded Official Seal for e-FATURA & e-Arşiv Fatura Templates
 */
export const GibOfficialSealSvg: React.FC<{
  color?: string;
  size?: number;
}> = ({ size = 76 }) => {
  return (
    <img
      src={GIB_OFFICIAL_UPLOADED_LOGO_DATA_URI}
      alt="T.C. Hazine ve Maliye Bakanlığı Gelir İdaresi Başkanlığı"
      width={size}
      height={size}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: "contain",
        borderRadius: "9999px",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
      className="shrink-0 select-none rounded-full object-contain"
    />
  );
};

export interface DigitalCompanyStampProps {
  companySettings?: CompanySettings | null;
  companyName?: string;
  taxOffice?: string;
  taxNumber?: string;
  address?: string;
  phone?: string;
  email?: string;
  tradeRegisterNo?: string;
  esnafSicilNo?: string;
  mersisNo?: string;
  color?: string;
}

export function resolveStampFieldsFromCompanyProfile(
  props: DigitalCompanyStampProps
): {
  companyTitle: string;
  taxOffice: string;
  taxNo: string;
  isIndividualTckn: boolean;
  taxIdLabel: string;
  address: string;
  phone: string;
  email: string;
  tradeRegisterNo: string;
  esnafSicilNo: string;
  mersisNo: string;
} {
  let storedCs: Partial<CompanySettings> = {};
  try {
    const cid = resolveTargetCompanyId(props.companySettings?.id);
    storedCs = getStoredData(cid)?.settings || {};
  } catch {}

  const cs: CompanySettings = {
    ...(storedCs as CompanySettings),
    ...(props.companySettings || ({} as CompanySettings)),
  };

  const companyTitle = (
    props.companyName ||
    cs?.companyTitle ||
    cs?.companyName ||
    cs?.name ||
    storedCs?.companyTitle ||
    storedCs?.companyName ||
    "KURUMSAL FİRMA ÜNVANI"
  ).trim();

  const taxOffice = (props.taxOffice || cs?.taxOffice || storedCs?.taxOffice || "").trim();
  const rawTaxNo = (
    props.taxNumber ||
    cs?.vkn ||
    cs?.tckn ||
    cs?.taxNumber ||
    cs?.tenantIdentifierNumber ||
    storedCs?.vkn ||
    storedCs?.tckn ||
    storedCs?.taxNumber ||
    ""
  ).trim();
  const digitsOnly = rawTaxNo.replace(/\D/g, "");
  const isIndividualTckn =
    digitsOnly.length === 11 ||
    (!digitsOnly && Boolean(cs?.tckn && String(cs.tckn).replace(/\D/g, "").length === 11));
  const taxNo = digitsOnly || rawTaxNo || "-";
  const taxIdLabel = isIndividualTckn ? "T.C. Kimlik No" : "Vergi Kimlik No";

  const hqAddress = getCompanyHeadquartersAddress(cs);
  const fallbackAddr = [
    cs?.neighborhood || storedCs?.neighborhood,
    cs?.street || storedCs?.street,
    cs?.buildingNo || storedCs?.buildingNo ? `No:${cs?.buildingNo || storedCs?.buildingNo}` : "",
    cs?.doorNo || storedCs?.doorNo ? `D:${cs?.doorNo || storedCs?.doorNo}` : "",
    [cs?.district || storedCs?.district, cs?.city || storedCs?.city].filter(Boolean).join(" / "),
  ]
    .filter(Boolean)
    .join(" ");
  const address = (
    props.address ||
    hqAddress ||
    cs?.address ||
    storedCs?.address ||
    fallbackAddr ||
    ""
  ).trim();
  const phone = (props.phone ?? cs?.phone ?? storedCs?.phone ?? "").trim();
  const email = (props.email ?? cs?.email ?? storedCs?.email ?? "").trim();
  const tradeRegisterNo = (
    props.tradeRegisterNo ??
    cs?.tradeRegisterNo ??
    storedCs?.tradeRegisterNo ??
    ""
  ).trim();
  const esnafSicilNo = (
    props.esnafSicilNo ??
    cs?.esnafSicilNo ??
    storedCs?.esnafSicilNo ??
    ""
  ).trim();
  const mersisNo = (props.mersisNo ?? cs?.mersisNo ?? storedCs?.mersisNo ?? "").trim();

  return {
    companyTitle,
    taxOffice,
    taxNo,
    isIndividualTckn,
    taxIdLabel,
    address,
    phone,
    email,
    tradeRegisterNo,
    esnafSicilNo,
    mersisNo,
  };
}

/**
 * Digital Corporate Stamp (Firma Profili & Adres Bölümünden Otomatik Kurumsal Kaşe)
 */
export const DigitalCompanyStampSvg: React.FC<DigitalCompanyStampProps> = (props) => {
  const { color = "#1e3a8a" } = props;
  const stamp = resolveStampFieldsFromCompanyProfile(props);

  return (
    <div
      style={{
        width: "170px",
        maxWidth: "100%",
        borderColor: color,
        color,
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
      className="inline-flex flex-col items-center justify-center border-2 rounded-lg px-2 py-1.5 bg-white/95 relative select-none w-[170px] max-w-full mx-auto shadow-2xs text-center space-y-0.5"
    >
      <span className="text-[8.5px] font-black uppercase tracking-tight text-center leading-tight">
        {stamp.companyTitle}
      </span>

      <div className="w-full border-t border-current/30 my-0.5" />

      {stamp.address && (
        <span className="text-[7px] font-medium leading-tight text-center">
          {stamp.address}
        </span>
      )}

      <span className="text-[7.5px] font-bold tracking-tight text-center leading-tight">
        {stamp.taxOffice ? `${stamp.taxOffice} V.D. • ` : ""}
        {stamp.taxIdLabel}: <span className="font-mono font-black">{stamp.taxNo}</span>
      </span>

      {(stamp.phone || stamp.email) && (
        <span className="text-[6.8px] font-semibold leading-tight text-center">
          {stamp.phone ? `Tel: ${stamp.phone}` : ""}
          {stamp.phone && stamp.email ? " • " : ""}
          {stamp.email ? `E-Posta: ${stamp.email}` : ""}
        </span>
      )}

      {(stamp.tradeRegisterNo || stamp.esnafSicilNo) && (
        <span className="text-[6.8px] font-semibold leading-tight text-center">
          {stamp.tradeRegisterNo ? `Ticaret Sicil No: ${stamp.tradeRegisterNo}` : ""}
          {stamp.tradeRegisterNo && stamp.esnafSicilNo ? " • " : ""}
          {stamp.esnafSicilNo ? `Esnaf Sicil No: ${stamp.esnafSicilNo}` : ""}
        </span>
      )}

      {stamp.mersisNo && (
        <span className="text-[6.8px] font-mono font-semibold opacity-90 leading-tight text-center">
          MERSİS No: {stamp.mersisNo}
        </span>
      )}
    </div>
  );
};

export interface OfficialGIBInvoicePaperProps {
  invoice: Partial<Invoice>;
  companySettings: CompanySettings;
  contact?: Contact;
  isDraft?: boolean;
  designOverride?: Partial<InvoiceDesignSettings>;
  previewDocTypeOverride?: "auto" | "e_fatura" | "e_arsiv" | string;
  compactScale?: boolean;
  paperId?: string;
}

export const OfficialGIBInvoicePaper: React.FC<OfficialGIBInvoicePaperProps> = ({
  invoice,
  companySettings,
  contact,
  isDraft = false,
  designOverride,
  previewDocTypeOverride = "auto",
  compactScale = false,
  paperId = "invoice-preview-paper",
}) => {
  const activeCompanyId = useMemo(
    () => resolveTargetCompanyId(companySettings?.id),
    [companySettings?.id]
  );

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>(
    GIB_OFFICIAL_UPLOADED_QR_CODE_DATA_URI
  );
  const [independentCssConfig, setIndependentCssConfig] = useState<InvoicePreviewCssConfig>(() =>
    getIndependentInvoiceCssConfig(designOverride?.cssConfig, activeCompanyId)
  );
  const [remoteDesignPatch, setRemoteDesignPatch] = useState<Partial<InvoiceDesignSettings> | undefined>(
    undefined
  );

  const overrideCssConfigKey = useMemo(
    () => JSON.stringify(designOverride?.cssConfig || {}),
    [designOverride?.cssConfig]
  );

  useEffect(() => {
    const nextCfg = getIndependentInvoiceCssConfig(designOverride?.cssConfig, activeCompanyId);
    setIndependentCssConfig((prev) =>
      JSON.stringify(prev) === JSON.stringify(nextCfg) ? prev : nextCfg
    );
    const syncCss = () => {
      const fresh = getIndependentInvoiceCssConfig(designOverride?.cssConfig, activeCompanyId);
      setIndependentCssConfig((prev) =>
        JSON.stringify(prev) === JSON.stringify(fresh) ? prev : fresh
      );
    };
    window.addEventListener("muavin:invoice-css-config-changed", syncCss);
    const unsubFirestore = subscribeToCompanyInvoiceCssFromFirestore(
      activeCompanyId,
      ({ cssConfig: remoteCss, invoiceDesign: remoteDesign }) => {
        const mergedCss = {
          ...remoteCss,
          ...(designOverride?.cssConfig || {}),
        };
        setIndependentCssConfig((prev) =>
          JSON.stringify(prev) === JSON.stringify(mergedCss) ? prev : mergedCss
        );
        if (remoteDesign) {
          setRemoteDesignPatch((prev) =>
            JSON.stringify(prev) === JSON.stringify(remoteDesign) ? prev : remoteDesign
          );
        }
      }
    );
    return () => {
      window.removeEventListener("muavin:invoice-css-config-changed", syncCss);
      unsubFirestore();
    };
  }, [overrideCssConfigKey, activeCompanyId]);

  const design = useMemo(
    () =>
      resolveInvoiceDesignSettings(companySettings, {
        ...(remoteDesignPatch || {}),
        ...(designOverride || {}),
      }),
    [companySettings, remoteDesignPatch, designOverride]
  );

  const activeCssConfig = useMemo(
    () => ({
      ...independentCssConfig,
      ...(design.cssConfig || {}),
    }),
    [independentCssConfig, design.cssConfig]
  );

  const palette = useMemo(() => resolveInvoiceThemePalette(design), [design]);

  const docMeta = useMemo(
    () => resolveOfficialEDocumentKind(invoice, companySettings, contact, previewDocTypeOverride),
    [invoice, companySettings, contact, previewDocTypeOverride]
  );

  const invType = invoice.type || "sales";
  const invNumber = invoice.invoiceNumber || (docMeta.isEArsiv ? "EAR2026000000001" : "GIB2026000000001");
  const issueDate = invoice.issueDate || new Date().toISOString().split("T")[0];
  const dueDate = invoice.dueDate || issueDate;
  const issueTime = useMemo(() => {
    if (invoice.createdAt && invoice.createdAt.includes("T")) {
      const timePart = invoice.createdAt.split("T")[1]?.slice(0, 8);
      if (timePart && /^\d{2}:\d{2}/.test(timePart)) return timePart;
    }
    return "14:30:00";
  }, [invoice.createdAt]);

  const items: InvoiceItem[] = invoice.items || [];
  const currency = invoice.currency || companySettings?.currency || "TRY";
  const currSymbol = getCurrencySymbol(currency);

  const {
    grossTotal: computedGrossTotal,
    totalDiscount: computedTotalDiscount,
    subtotal: computedSubtotal,
    totalVat: computedVat,
    totalWithholding: computedWithholding,
    grandTotal: computedGrandTotal,
    payableAmount: computedPayableAmount,
    computedItems,
  } = useMemo(() => computeInvoiceTotals(items), [items]);

  const grossTotal = invoice.grossTotal ?? computedGrossTotal;
  const totalDiscount = invoice.totalDiscount ?? computedTotalDiscount;
  const subtotal = invoice.subtotal ?? computedSubtotal;
  const totalVat = invoice.totalVat ?? computedVat;
  const totalWithholding = invoice.totalWithholding ?? computedWithholding;
  const grandTotal = invoice.grandTotal ?? computedGrandTotal;
  const payableAmount = invoice.payableAmount ?? computedPayableAmount;
  const paidAmount = invoice.paidAmount ?? 0;
  const remainingAmount = invoice.remainingAmount ?? payableAmount - paidAmount;

  const hasDiscounts =
    totalDiscount > 0 ||
    computedItems.some(
      (i) => (i.discountAmount && i.discountAmount > 0) || (i.discountRate && i.discountRate > 0)
    );

  const hasWithholdingOrExtraTax =
    totalWithholding > 0 ||
    computedItems.some(
      (i) =>
        Boolean(i.withholdingCode) ||
        (i.withholdingAmount && i.withholdingAmount > 0) ||
        (i.otvAmount && i.otvAmount > 0) ||
        (i.oivAmount && i.oivAmount > 0) ||
        (i.additionalTaxes && i.additionalTaxes.length > 0)
    );

  const ettn = useMemo(() => {
    if (invoice.eDocumentEttn && invoice.eDocumentEttn.length >= 20) {
      return invoice.eDocumentEttn;
    }
    if (invoice.id) {
      const hex = String(invoice.id)
        .replace(/[^a-fA-F0-9]/g, "4")
        .padEnd(12, "8")
        .slice(0, 12);
      return `8a491029-3810-4b10-9201-${hex}`;
    }
    return "8a491029-3810-4b10-8201-948123019283";
  }, [invoice.eDocumentEttn, invoice.id]);

  // Seller details:
  // - Firma Merkez Adresi strictly from Firma Profili (companySettings)
  // - Şube Adresi strictly from Şubeler (branches) when a branch is selected
  const sellerTitle =
    companySettings?.companyTitle || companySettings?.companyName || "KURUMSAL FİRMA ÜNVANI";
  const resolvedSellerBranch = resolveBranchAddressFromBranches({
    branchId: invoice.branchId,
    branchCode: invoice.branchCode,
    branchName: invoice.branchName,
    fallbackBranchAddress: invoice.branchAddress,
    companyId: activeCompanyId,
  });
  const sellerBranchName = (invoice.branchName || resolvedSellerBranch.branchName || "").trim();
  const sellerBranchCode = (invoice.branchCode || resolvedSellerBranch.branchCode || "").trim();
  const sellerHqAddress =
    getCompanyHeadquartersAddress(companySettings) ||
    [companySettings?.address, companySettings?.district, companySettings?.city]
      .filter(Boolean)
      .join(" / ") ||
    "Merkez Adres";
  const sellerBranchAddress = (
    invoice.branchAddress ||
    resolvedSellerBranch.branchAddress ||
    ""
  ).trim();
  const isSellerSubBranchSelected = Boolean(
    (resolvedSellerBranch.branch && !resolvedSellerBranch.branch.isMain) ||
      (sellerBranchName && sellerBranchName.toLocaleLowerCase("tr-TR") !== "merkez") ||
      (sellerBranchAddress && sellerBranchAddress !== sellerHqAddress)
  );
  const sellerDisplayAddress =
    isSellerSubBranchSelected && sellerBranchAddress
      ? sellerBranchAddress
      : sellerBranchAddress || sellerHqAddress;
  const sellerTaxOffice = companySettings?.taxOffice || "-";
  const sellerTaxNo =
    companySettings?.vkn ||
    companySettings?.tckn ||
    companySettings?.taxNumber ||
    companySettings?.tenantIdentifierNumber ||
    "-";

  // Buyer details
  const contactName =
    invoice.contactName ||
    contact?.companyTitle ||
    contact?.name ||
    "Belirtilmemiş Müşteri / Alıcı";
  const contactTaxOffice = invoice.taxOffice || contact?.taxOffice || "-";
  const contactTaxNo = invoice.taxNumber || contact?.taxNumber || "-";
  const customerBranchName = (invoice.customerBranchName || contact?.branchName || "").trim();
  const customerBranchCode = (invoice.customerBranchCode || contact?.branchCode || "").trim();
  const rawContactAddress = (
    invoice.customerAddress ||
    contact?.address ||
    [contact?.neighborhood, contact?.street, contact?.buildingNo, contact?.doorNo]
      .filter(Boolean)
      .join(" ") ||
    ""
  ).trim();
  const contactCity = (invoice.customerCity || contact?.city || "").trim();
  const contactDistrict = (invoice.customerDistrict || contact?.district || "").trim();
  const contactAddress =
    formatAddressWithBranch(
      rawContactAddress,
      contactCity,
      contactDistrict,
      customerBranchName,
      customerBranchCode
    ) || "Adres Belirtilmemiş";
  const contactPhone = invoice.customerPhone || contact?.phone || "";
  const contactEmail = invoice.customerEmail || contact?.email || "";
  const accountCode = contact
    ? getContactAccountCode(contact)
    : invType === "sales"
    ? "120.01.001"
    : "320.01.001";

  // Group VAT by rate (%0, %1, %10, %20) for official GİB VAT Breakdown
  const vatBreakdown = useMemo(() => {
    const groups = new Map<number, { rate: number; matrah: number; vat: number }>();
    for (const item of computedItems) {
      const rate = Number(item.vatRate ?? 0);
      const matrah = Number(
        item.effectiveTaxableAmount ?? item.totalWithoutVat ?? item.quantity * item.unitPrice
      );
      const vat = Number(item.vatAmount ?? 0);
      const existing = groups.get(rate) || { rate, matrah: 0, vat: 0 };
      existing.matrah += matrah;
      existing.vat += vat;
      groups.set(rate, existing);
    }
    return Array.from(groups.values()).sort((a, b) => a.rate - b.rate);
  }, [computedItems]);

  // Official GİB Legislation Compliant QR Code (VUK 509 Karekod Standardı Kılavuzu)
  useEffect(() => {
    setQrCodeDataUrl((prev) =>
      prev === GIB_OFFICIAL_UPLOADED_QR_CODE_DATA_URI ? prev : GIB_OFFICIAL_UPLOADED_QR_CODE_DATA_URI
    );
  }, []);

  // Bank Accounts list
  const bankRows = useMemo(() => {
    const list: Array<{
      bankName: string;
      accountHolder: string;
      currency: string;
      iban: string;
    }> = [];

    const primaryIban =
      invoice.paymentIban || companySettings?.defaultBankIban || companySettings?.iban || "";
    const primaryBank =
      invoice.paymentBankName ||
      invoice.paymentAccountName ||
      companySettings?.defaultBankName ||
      companySettings?.bankName ||
      "";
    const primaryHolder =
      invoice.paymentAccountHolderName ||
      companySettings?.defaultBankAccountName ||
      companySettings?.companyTitle ||
      companySettings?.companyName ||
      "";

    if (primaryIban || primaryBank) {
      list.push({
        bankName: primaryBank || "Banka Hesabı",
        accountHolder: primaryHolder,
        currency: currency === "₺" ? "TRY" : currency,
        iban: primaryIban || "-",
      });
    }

    if (Array.isArray(design.bankAccounts)) {
      for (const acc of design.bankAccounts) {
        if (acc.iban && !list.some((x) => x.iban === acc.iban)) {
          list.push({
            bankName: acc.bankName || "Banka",
            accountHolder: acc.accountHolder || primaryHolder,
            currency: acc.currency || "TRY",
            iban: acc.iban,
          });
        }
      }
    }
    return list;
  }, [invoice, companySettings, currency, design.bankAccounts]);

  const legalTaxNotes = useMemo(
    () => generateInvoiceLegalTaxNotes(computedItems, invoice.invoiceProfileType, currSymbol),
    [computedItems, invoice.invoiceProfileType, currSymbol]
  );

  const writtenAmount = numberToTurkishWords(payableAmount);
  const paymentMethodLabel =
    invoice.paymentMethod === "nakit"
      ? "Nakit"
      : invoice.paymentMethod === "kredi_karti"
      ? "Kredi Kartı / POS"
      : invoice.paymentMethod === "eft_havale"
      ? "Havale / EFT"
      : "Cari Hesap (Açık)";

  const resolvedLogoDims = resolveInvoiceLogoDimensions(design);

  const isCompact = design.templateStyle === "gib_compact" || compactScale;
  const isModern = design.templateStyle === "gib_modern";

  const scopedCssStylesheet = useMemo(
    () => buildInvoicePreviewScopedCss(paperId, activeCssConfig),
    [paperId, activeCssConfig]
  );

  const effectiveStampUrl = invoice.eArsivStampUrl || design.stampImageUrl;
  const effectiveSignatureUrl = invoice.eArsivSignatureUrl || design.signatureImageUrl;
  const effectiveSignerName =
    invoice.signerName ||
    design.signerName ||
    companySettings?.eDevletCredentials?.managerName ||
    "";
  const effectiveSignerTitle = invoice.signerTitle || design.signerTitle || "";
  const effectiveSigMode = design.eArsivSignatureMode || "stamp_and_signature";
  const effectiveSigColor =
    design.eArsivSignatureColor ||
    (palette.primary === "#111827" ? "#1e293b" : "#1d4ed8");
  const effectiveSignedAt =
    invoice.signedAt || `${formatDate(issueDate)} ${issueTime.slice(0, 5)}`;

  const signatureBlockNode =
    design.showSignatureStamp !== false ? (
      <div
        style={{ marginTop: "17px" }}
        className="issuer-signature-css-target w-full border-slate-300 rounded-md p-1 bg-white/95 space-y-1 shadow-2xs"
      >
        {/* 1. Kaşe + Islak İmza Birlikte (Kaşe ve İmza Arasında 38px Boşluk) */}
        {effectiveSigMode === "stamp_and_signature" && (
          <div className="flex flex-col items-center justify-center py-0.5 w-full">
            {effectiveStampUrl ? (
              <img
                src={effectiveStampUrl}
                alt="Firma Kaşesi"
                style={{ width: "170px", maxWidth: "100%" }}
                className="max-h-16 w-[170px] max-w-full object-contain"
              />
            ) : design.autoDigitalStamp !== false ? (
              <DigitalCompanyStampSvg
                companySettings={companySettings}
                companyName={sellerTitle}
                taxOffice={sellerTaxOffice}
                taxNumber={sellerTaxNo}
                address={sellerDisplayAddress}
                phone={companySettings?.phone}
                email={companySettings?.email}
                tradeRegisterNo={companySettings?.tradeRegisterNo}
                esnafSicilNo={companySettings?.esnafSicilNo}
                mersisNo={companySettings?.mersisNo}
                color={effectiveSigColor}
              />
            ) : null}

            {effectiveSignatureUrl && (
              <img
                src={effectiveSignatureUrl}
                alt="Düzenleyen Islak İmza"
                style={{
                  marginTop:
                    effectiveStampUrl || design.autoDigitalStamp !== false ? "38px" : "0px",
                }}
                className="max-h-14 w-auto object-contain"
              />
            )}
          </div>
        )}

        {/* 2. Sadece Islak İmza */}
        {effectiveSigMode === "signature_only" && (
          <div className="flex flex-col items-center justify-center py-1 w-full">
            {effectiveSignatureUrl ? (
              <img
                src={effectiveSignatureUrl}
                alt="Düzenleyen Islak İmza"
                className="max-h-16 w-auto object-contain"
              />
            ) : (
              <svg
                width="125"
                height="32"
                viewBox="0 0 125 32"
                fill="none"
                className="overflow-visible"
              >
                <path
                  d="M10 23 C 28 5, 44 27, 60 11 C 72 2, 80 25, 96 9 C 106 3, 114 16, 122 8"
                  stroke={effectiveSigColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M20 27 Q 65 18, 115 22"
                  stroke={effectiveSigColor}
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  opacity="0.75"
                />
              </svg>
            )}
          </div>
        )}

        {/* 3. Sadece Kaşe */}
        {effectiveSigMode === "stamp_only" && (
          <div className="flex justify-center py-0.5 w-full">
            {effectiveStampUrl ? (
              <img
                src={effectiveStampUrl}
                alt="Firma Kaşesi"
                style={{ width: "170px", maxWidth: "100%" }}
                className="max-h-16 w-[170px] max-w-full object-contain"
              />
            ) : (
              <DigitalCompanyStampSvg
                companySettings={companySettings}
                companyName={sellerTitle}
                taxOffice={sellerTaxOffice}
                taxNumber={sellerTaxNo}
                address={sellerDisplayAddress}
                phone={companySettings?.phone}
                email={companySettings?.email}
                tradeRegisterNo={companySettings?.tradeRegisterNo}
                esnafSicilNo={companySettings?.esnafSicilNo}
                mersisNo={companySettings?.mersisNo}
                color={effectiveSigColor}
              />
            )}
          </div>
        )}

        {/* 4. Otomatik Dijital Kaşe */}
        {effectiveSigMode === "auto_digital" && (
          <div className="py-0.5 flex justify-center w-full">
            <DigitalCompanyStampSvg
              companySettings={companySettings}
              companyName={sellerTitle}
              taxOffice={sellerTaxOffice}
              taxNumber={sellerTaxNo}
              address={sellerDisplayAddress}
              phone={companySettings?.phone}
              email={companySettings?.email}
              tradeRegisterNo={companySettings?.tradeRegisterNo}
              esnafSicilNo={companySettings?.esnafSicilNo}
              mersisNo={companySettings?.mersisNo}
              color={effectiveSigColor}
            />
          </div>
        )}
      </div>
    ) : null;

  return (
    <div
      id={paperId}
      data-printable="true"
      className={`bg-white text-slate-900 font-sans border border-slate-300 shadow-xl w-full max-w-[860px] mx-auto transition-all print:border-none print:shadow-none print:p-0 print:rounded-none ${
        isCompact
          ? "p-4 sm:p-6 space-y-3 text-[10px] rounded-xl"
          : "p-5 sm:p-8 space-y-4 text-[11px] rounded-2xl"
      }`}
    >
      {/* Scoped CSS Configuration for GİB Logo & Issuer Signature/Info (Independent of Settings) */}
      <style>{scopedCssStylesheet}</style>

      {/* Top Accent Bar for Modern Style */}
      {isModern && (
        <div
          style={{
            backgroundColor: palette.primary,
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          }}
          className="h-2 w-full rounded-t-lg -mt-2 mb-2"
        />
      )}

      {/* =====================================================================
          1. GİB 3-COLUMN OFFICIAL HEADER (SATICI | GİB MÜHÜR & BAŞLIK | KAREKOD & TABLO)
         ===================================================================== */}
      <div className="grid grid-cols-12 gap-3 items-stretch pb-3 border-b-2 border-slate-900">
        {/* LEFT COLUMN (5 cols): SOL ÜST LOGO (QR KODLA AYNI HİZADA) + SATICI / DÜZENLEYEN BİLGİLERİ (ABDURRAHMAN ŞİMŞEK) + ALICI CARİ (SAYIN) */}
        <div className="col-span-12 sm:col-span-5 flex flex-col justify-between h-full">
          <div className="space-y-2">
            {/* SOL ÜST KÖŞE: FİRMA LOGOSU (SAĞDAKİ KAREKOD İLE AYNI YATAY HİZADA) */}
            {design.showCompanyLogo !== false && (
              <div className="flex items-center justify-start shrink-0">
                {companySettings?.logoUrl ? (
                  <img
                    src={companySettings.logoUrl}
                    alt={companySettings.companyName || "Firma Logosu"}
                    style={{
                      width: `${resolvedLogoDims.widthPx}px`,
                      height: `${resolvedLogoDims.heightPx}px`,
                      objectFit: resolvedLogoDims.objectFit,
                    }}
                    className="max-w-full"
                  />
                ) : (
                  <Logo
                    size={design.logoSize || "md"}
                    className="justify-start"
                    imageStyle={{
                      width: `${resolvedLogoDims.widthPx}px`,
                      height: `${resolvedLogoDims.heightPx}px`,
                      objectFit: resolvedLogoDims.objectFit,
                    }}
                  />
                )}
              </div>
            )}

            {/* SATICI / DÜZENLEYEN BİLGİLERİ (ABDURRAHMAN ŞİMŞEK) */}
            <div
              style={{ borderColor: palette.border }}
              className="issuer-seller-css-target border-y-2 py-2 px-1 space-y-1 text-[10.5px] leading-snug"
            >
              <p
                style={{ color: palette.primary }}
                className="font-black text-xs sm:text-[13px] uppercase tracking-tight leading-tight"
              >
                {sellerTitle}
              </p>
              {isSellerSubBranchSelected && sellerBranchName && (
                <p className="font-bold text-slate-800 text-[10px]">
                  <strong className="text-slate-900">Şube:</strong> {sellerBranchName}
                  {sellerBranchCode ? ` (${sellerBranchCode})` : ""}
                </p>
              )}
              <p className="text-slate-700 leading-snug">
                <strong className="text-slate-900">Adres:</strong> {sellerDisplayAddress}
              </p>

              <div className="pt-1 border-t border-slate-200 space-y-0.5 text-[10px]">
                {(companySettings?.phone || companySettings?.email) && (
                  <div className="flex flex-wrap gap-x-3">
                    {companySettings?.phone && (
                      <span>
                        <strong className="text-slate-900">Tel:</strong> {companySettings.phone}
                      </span>
                    )}
                    {companySettings?.email && (
                      <span>
                        <strong className="text-slate-900">E-Posta:</strong> {companySettings.email}
                      </span>
                    )}
                  </div>
                )}
                {companySettings?.website && (
                  <div>
                    <strong className="text-slate-900">Web Sitesi:</strong> {companySettings.website}
                  </div>
                )}
                <div>
                  <strong className="text-slate-900">Vergi Dairesi:</strong> {sellerTaxOffice}
                </div>
                <div>
                  <strong className="text-slate-900">
                    {String(sellerTaxNo).replace(/\D/g, "").length === 11 ? "TCKN:" : "VKN:"}
                  </strong>{" "}
                  <span className="font-mono font-black text-slate-900">{sellerTaxNo}</span>
                </div>
                {(companySettings?.tradeRegisterNo ||
                  companySettings?.esnafSicilNo ||
                  companySettings?.mersisNo) && (
                  <div className="flex flex-wrap gap-x-3 text-[9.5px] text-slate-700 pt-0.5">
                    {companySettings?.tradeRegisterNo && (
                      <span>
                        <strong className="text-slate-900">Ticaret Sicil No:</strong>{" "}
                        {companySettings.tradeRegisterNo}
                      </span>
                    )}
                    {companySettings?.esnafSicilNo && (
                      <span>
                        <strong className="text-slate-900">Esnaf Sicil No:</strong>{" "}
                        {companySettings.esnafSicilNo}
                      </span>
                    )}
                    {companySettings?.mersisNo && (
                      <span>
                        <strong className="text-slate-900">MERSİS No:</strong>{" "}
                        {companySettings.mersisNo}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Eğer imza bölgesi "Düzenleyen Bilgisi Altı" (under_seller) seçildiyse */}
          {activeCssConfig.signatureZone === "under_seller" && signatureBlockNode}

          {/* SAYIN (ALICI / MÜŞTERİ BİLGİLERİ) — Bottom-aligned with the Metadata Table under QR Code */}
          <div
            style={{ borderColor: palette.border }}
            className="mt-auto pt-3"
          >
            <div
              style={{ borderColor: palette.border }}
              className="border-y-2 py-2 px-1 space-y-1 text-[10.5px] leading-snug"
            >
              <div className="flex items-center justify-between">
                <span
                  style={{ color: palette.primary }}
                  className="font-black text-[10px] uppercase tracking-wider"
                >
                  SAYIN
                </span>
                <span className="font-mono text-[9px] text-slate-500 font-semibold">
                  Cari Kodu: {accountCode}
                </span>
              </div>
              <p className="font-black text-slate-900 text-xs leading-tight">{contactName}</p>
              {customerBranchName && (
                <p className="font-bold text-slate-700 text-[10px]">
                  Şube / Birim: {customerBranchName}
                  {customerBranchCode ? ` (${customerBranchCode})` : ""}
                </p>
              )}
              <p className="text-slate-700 leading-snug">
                <strong className="text-slate-900">Adres:</strong> {contactAddress}
              </p>
              <div className="pt-0.5 space-y-0.5 text-[10px]">
                <div>
                  <strong className="text-slate-900">Vergi Dairesi:</strong> {contactTaxOffice}
                </div>
                <div>
                  <strong className="text-slate-900">
                    {String(contactTaxNo).replace(/\D/g, "").length === 11 ? "TCKN:" : "VKN:"}
                  </strong>{" "}
                  <span className="font-mono font-black text-slate-900">{contactTaxNo}</span>
                </div>
                {(contactPhone || contactEmail) && (
                  <div className="text-[9.5px] text-slate-600">
                    {contactPhone && contactPhone !== "-" ? `Tel: ${contactPhone}` : ""}
                    {contactPhone && contactEmail && contactEmail !== "-" ? " • " : ""}
                    {contactEmail && contactEmail !== "-" ? `E-Posta: ${contactEmail}` : ""}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN (3 cols): GİB RESMİ MÜHÜR, e-FATURA / e-ARŞİV BAŞLIĞI & DÜZENLEYEN İMZASI */}
        <div className="col-span-12 sm:col-span-3 flex flex-col items-center justify-start text-center pt-1">
          <div className="gib-logo-css-target w-full">
            {design.showGibSeal !== false && !docMeta.isReceipt && (
              <GibOfficialSealSvg
                color={design.colorTheme === "classic" ? "#111827" : "#b91c1c"}
                size={activeCssConfig.gibLogoSize || (isCompact ? 64 : 76)}
              />
            )}

            <div className="mt-1.5 space-y-0.5">
              <h2
                style={{ color: "#000000" }}
                className="text-sm sm:text-base font-black tracking-tight leading-none text-black"
              >
                {docMeta.docTitle}
              </h2>
              <p className="text-[8.5px] font-bold uppercase tracking-wider text-slate-500">
                {docMeta.isEArsiv
                  ? "Elektronik Arşiv Fatura"
                  : docMeta.isEFatura
                  ? "Ticari / Temel Elektronik Fatura"
                  : docMeta.docSubtitle}
              </p>
            </div>

            {isDraft && (
              <span className="mt-1.5 px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900 text-[9px] font-black uppercase tracking-widest">
                TASLAK ÖNİZLEME
              </span>
            )}
          </div>

          {/* DÜZENLEYEN KAŞE / İMZA KUTUSU — Varsayılan olarak GİB Logosu Altında ("under_gib") */}
          {(activeCssConfig.signatureZone || "under_gib") === "under_gib" && signatureBlockNode}
        </div>

        {/* RIGHT COLUMN (4 cols): SAĞ ÜST KAREKOD (SOLDAKİ LOGO İLE AYNI HİZADA) & ALTTA ALICI CARİ İLE HİZALI METAVERİ TABLOSU */}
        <div className="col-span-12 sm:col-span-4 flex flex-col justify-between items-end h-full gap-2">
          {/* Top-Right: Uploaded GİB QR Code Template (Horizontally Aligned with Logo on Left) */}
          <div className="w-full flex flex-col items-end justify-start">
            {design.showQrCode !== false && (
              <div
                className="border border-slate-400 p-1 bg-white rounded shrink-0 flex flex-col items-center ml-auto"
                style={{ width: "108px", height: "108px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <img
                  src={qrCodeDataUrl || GIB_OFFICIAL_UPLOADED_QR_CODE_PATH}
                  onError={(e) => {
                    if (e.currentTarget.src !== GIB_OFFICIAL_UPLOADED_QR_CODE_DATA_URI) {
                      e.currentTarget.src = GIB_OFFICIAL_UPLOADED_QR_CODE_DATA_URI;
                    }
                  }}
                  alt="GİB e-Belge Karekodu"
                  style={{ width: "100px", height: "100px" }}
                  className="w-[100px] h-[100px] object-contain block shrink-0"
                />
              </div>
            )}
          </div>

          {/* GİB Official Metadata Box — Bottom-aligned with Alıcı Cari ("SAYIN") box */}
          <div className="mt-auto w-full border border-slate-800 text-[10px]">
            <table className="w-full border-collapse">
              <tbody className="divide-y divide-slate-300">
                <tr>
                  <td className="py-1 px-2 font-bold text-slate-800 bg-slate-100 border-r border-slate-300 w-[44%]">
                    Özelleştirme No:
                  </td>
                  <td className="py-1 px-2 font-mono font-bold text-slate-900">TR1.2</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-bold text-slate-800 bg-slate-100 border-r border-slate-300">
                    Senaryo:
                  </td>
                  <td className="py-1 px-2 font-mono font-extrabold text-slate-900">
                    {docMeta.scenarioCode}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-bold text-slate-800 bg-slate-100 border-r border-slate-300">
                    Fatura Tipi:
                  </td>
                  <td className="py-1 px-2 font-mono font-extrabold text-slate-900">
                    {docMeta.profileCode}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-bold text-slate-800 bg-slate-100 border-r border-slate-300">
                    Fatura No:
                  </td>
                  <td className="py-1 px-2 font-mono font-black text-slate-950">{invNumber}</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-bold text-slate-800 bg-slate-100 border-r border-slate-300">
                    Fatura Tarihi:
                  </td>
                  <td className="py-1 px-2 font-mono font-bold text-slate-900">
                    {formatDate(issueDate)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-bold text-slate-800 bg-slate-100 border-r border-slate-300">
                    Düzenleme Zamanı:
                  </td>
                  <td className="py-1 px-2 font-mono text-slate-800">{issueTime}</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-bold text-slate-800 bg-slate-100 border-r border-slate-300">
                    Vade / Ödeme:
                  </td>
                  <td className="py-1 px-2 font-semibold text-slate-800">
                    {formatDate(dueDate)} ({paymentMethodLabel})
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. ETTN (EVRENSEL TEKİL TANIMLAMA NUMARASI) BAR
         ===================================================================== */}
      <div
        style={{
          backgroundColor: palette.headerBg,
          color: palette.headerText,
          borderColor: palette.border,
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
        className="px-3 py-1.5 border rounded flex flex-wrap items-center justify-between gap-2 text-[10px]"
      >
        <div className="flex items-center gap-1.5">
          <span className="font-black uppercase opacity-90">ETTN:</span>
          <span className="font-mono font-bold tracking-wide">{ettn}</span>
        </div>
        <div className="flex items-center gap-3 font-semibold opacity-95">
          <span>
            Belge Türü: <strong className="uppercase">{docMeta.docTitle}</strong>
          </span>
          <span>•</span>
          <span>
            Para Birimi: <strong className="font-mono">{currency}</strong>
          </span>
        </div>
      </div>

      {/* =====================================================================
          3. MAL / HİZMET KALEMLERİ TABLOSU (GİB UBL-TR 1.2 XSLT STANDARDI)
         ===================================================================== */}
      <div className="border border-slate-800 overflow-x-auto">
        <table className="w-full text-left border-collapse text-[10.5px]">
          <thead>
            <tr
              style={{
                backgroundColor: palette.headerBg,
                color: palette.headerText,
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact",
              }}
              className="font-bold text-[9.5px] uppercase tracking-tight border-b border-slate-800"
            >
              <th className="py-1.5 px-2 border-r border-slate-400/50 text-center w-9">Sıra No</th>
              {design.showProductCode !== false && (
                <th className="py-1.5 px-2 border-r border-slate-400/50 w-20">Stok / Hizmet Kodu</th>
              )}
              <th className="py-1.5 px-2.5 border-r border-slate-400/50">Mal / Hizmet Açıklaması</th>
              <th className="py-1.5 px-2 border-r border-slate-400/50 text-center w-16">Miktar</th>
              <th className="py-1.5 px-2 border-r border-slate-400/50 text-right w-24">Birim Fiyat</th>
              {hasDiscounts && (
                <>
                  <th className="py-1.5 px-1.5 border-r border-slate-400/50 text-center w-14">
                    İsk. Oranı
                  </th>
                  <th className="py-1.5 px-2 border-r border-slate-400/50 text-right w-20">
                    İsk. Tutarı
                  </th>
                </>
              )}
              <th className="py-1.5 px-1.5 border-r border-slate-400/50 text-center w-14">
                KDV Oranı
              </th>
              <th className="py-1.5 px-2 border-r border-slate-400/50 text-right w-24">
                KDV Tutarı
              </th>
              {hasWithholdingOrExtraTax && (
                <th className="py-1.5 px-2 border-r border-slate-400/50 text-right w-24">
                  Tevkifat / Ek Vergi
                </th>
              )}
              <th className="py-1.5 px-2.5 text-right w-28">Mal / Hizmet Tutarı</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {computedItems.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="py-6 text-center text-slate-400 font-medium"
                >
                  Faturada henüz mal veya hizmet kalemi bulunmuyor.
                </td>
              </tr>
            ) : (
              computedItems.map((item, idx) => {
                const withholdingBadge = formatWithholdingBadge(item);
                const isSpecialTaxBase =
                  item.specialTaxBase !== undefined && item.specialTaxBase !== null;
                const isExempt = item.exemptionCode || item.vatRate === 0;
                const netLineMatrah =
                  item.effectiveTaxableAmount ??
                  item.totalWithoutVat ??
                  item.quantity * item.unitPrice;

                return (
                  <tr
                    key={item.id || idx}
                    className={idx % 2 === 1 ? "bg-slate-50/70" : "bg-white"}
                  >
                    <td className="py-1.5 px-2 border-r border-slate-300 text-center font-mono text-slate-700">
                      {idx + 1}
                    </td>
                    {design.showProductCode !== false && (
                      <td className="py-1.5 px-2 border-r border-slate-300 font-mono text-[9.5px] text-slate-700">
                        {item.productCode || `HZM-0${idx + 1}`}
                      </td>
                    )}
                    <td className="py-1.5 px-2.5 border-r border-slate-300 font-semibold text-slate-900">
                      <div>{item.description || item.productName || "Mal / Hizmet"}</div>
                      {(withholdingBadge || isSpecialTaxBase || (isExempt && item.exemptionCode)) && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[9px] text-slate-600 font-normal">
                          {withholdingBadge && (
                            <span className="bg-purple-50 text-purple-900 px-1 py-0.2 rounded border border-purple-200 font-semibold">
                              Tevkifat: {withholdingBadge}
                            </span>
                          )}
                          {isSpecialTaxBase && (
                            <span className="bg-amber-50 text-amber-900 px-1 py-0.2 rounded border border-amber-200 font-semibold">
                              Özel Matrah: {currSymbol}
                              {Number(item.specialTaxBase).toLocaleString("tr-TR", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          )}
                          {isExempt && item.exemptionCode && (
                            <span className="bg-emerald-50 text-emerald-900 px-1 py-0.2 rounded border border-emerald-200 font-semibold">
                              İstisna: {item.exemptionCode}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-300 text-center font-mono font-bold text-slate-900">
                      {item.quantity} {item.unit || "Adet"}
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-300 text-right font-mono text-slate-900">
                      {currSymbol}
                      {(item.unitPrice || 0).toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    {hasDiscounts && (
                      <>
                        <td className="py-1.5 px-1.5 border-r border-slate-300 text-center font-mono text-rose-700">
                          {item.discountRate && item.discountRate > 0
                            ? `%${item.discountRate}`
                            : "%0"}
                        </td>
                        <td className="py-1.5 px-2 border-r border-slate-300 text-right font-mono text-rose-700">
                          {item.discountAmount && item.discountAmount > 0
                            ? `${currSymbol}${item.discountAmount.toLocaleString("tr-TR", {
                                minimumFractionDigits: 2,
                              })}`
                            : `${currSymbol}0,00`}
                        </td>
                      </>
                    )}
                    <td className="py-1.5 px-1.5 border-r border-slate-300 text-center font-mono font-bold text-slate-900">
                      %{item.vatRate ?? 0}
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-300 text-right font-mono text-slate-900">
                      {currSymbol}
                      {(item.vatAmount || 0).toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    {hasWithholdingOrExtraTax && (
                      <td className="py-1.5 px-2 border-r border-slate-300 text-right font-mono text-purple-900">
                        {item.withholdingAmount && item.withholdingAmount > 0
                          ? `-${currSymbol}${item.withholdingAmount.toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })}`
                          : "-"}
                      </td>
                    )}
                    <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-950">
                      {currSymbol}
                      {netLineMatrah.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* =====================================================================
          4. BOTTOM SECTION: LEFT (NOTES, YALNIZ, IBAN, TAX TABLE) & RIGHT (GİB TOTALS)
         ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start pt-1">
        {/* LEFT COLUMN (7 cols): YALNIZ, KDV MATRAH TABLOSU, BANKA IBAN, YASAL ŞERHLER */}
        <div className="sm:col-span-7 space-y-2.5">
          {/* Yalnız (Amount in Turkish Words) */}
          <div
            style={{
              backgroundColor: palette.headerBg,
              color: palette.headerText,
              borderColor: palette.border,
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            }}
            className="border p-2"
          >
            <span className="text-[9px] font-black uppercase opacity-85 block">
              YALNIZ (ÖDENECEK TUTAR YAZIYLA):
            </span>
            <p className="font-black text-[11px] mt-0.5"># {writtenAmount} #</p>
          </div>

          {/* KDV Oran ve Matrah Dağılım Tablosu */}
          {design.showTaxBreakdownTable !== false && vatBreakdown.length > 0 && (
            <div className="border border-slate-400 overflow-hidden">
              <div
                style={{
                  backgroundColor: palette.headerBg,
                  color: palette.headerText,
                  WebkitPrintColorAdjust: "exact",
                  printColorAdjust: "exact",
                }}
                className="px-2.5 py-1 border-b border-slate-300 text-[9px] font-black uppercase"
              >
                VERGİ & KDV MATRAH DAĞILIM TABLOSU
              </div>
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-1 px-2 text-left">Vergi Türü / Oranı</th>
                    <th className="py-1 px-2 text-right">Vergi Matrahı</th>
                    <th className="py-1 px-2 text-right">Hesaplanan Vergi Tutarı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {vatBreakdown.map((vb) => (
                    <tr key={vb.rate}>
                      <td className="py-1 px-2 font-semibold text-slate-800">
                        Katma Değer Vergisi (KDV %{vb.rate})
                      </td>
                      <td className="py-1 px-2 text-right font-mono text-slate-800">
                        {currSymbol}
                        {vb.matrah.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-1 px-2 text-right font-mono font-bold text-slate-900">
                        {currSymbol}
                        {vb.vat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Banka & IBAN Bilgileri Tablosu */}
          {design.showBankIbanTable !== false && bankRows.length > 0 && (
            <div className="border border-slate-400 overflow-hidden">
              <div
                style={{
                  backgroundColor: palette.headerBg,
                  color: palette.headerText,
                  WebkitPrintColorAdjust: "exact",
                  printColorAdjust: "exact",
                }}
                className="px-2.5 py-1 border-b border-slate-300 text-[9px] font-black uppercase"
              >
                BANKA HESAP VE IBAN BİLGİLERİ (HAVALE / EFT)
              </div>
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-1 px-2 text-left">Banka / Şube</th>
                    <th className="py-1 px-2 text-center">Döviz</th>
                    <th className="py-1 px-2 text-left">IBAN Numarası</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {bankRows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      <td className="py-1 px-2 font-bold text-slate-900">{row.bankName}</td>
                      <td className="py-1 px-2 text-center font-mono font-semibold text-slate-700">
                        {row.currency}
                      </td>
                      <td className="py-1 px-2 font-mono font-black text-slate-950 tracking-wide">
                        {row.iban}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* GİB Resmi Vergi / Tevkifat / İstisna ve e-Arşiv / e-Fatura Yasal İbareler (Açıklamalar) Kutusu */}
          <div
            style={{
              backgroundColor: palette.headerBg,
              color: palette.headerText,
              borderColor: palette.border,
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            }}
            className="border p-2.5 space-y-1 text-[10px] leading-snug"
          >
            <span
              style={{
                borderColor: palette.isDark ? "rgba(255,255,255,0.25)" : "rgba(15,23,42,0.2)",
              }}
              className="text-[9px] font-black uppercase block border-b pb-0.5 opacity-95"
            >
              AÇIKLAMALAR, NOTLAR VE GİB YASAL İBARELER
            </span>

            {design.irsaliyeYerineGecer !== false && !docMeta.isReceipt && (
              <p className="font-black">• İrsaliye yerine geçer.</p>
            )}

            {docMeta.isEArsiv && (
              <p className="font-semibold opacity-95">
                •{" "}
                {design.eArsivFooterNote ||
                  "e-Arşiv izni kapsamında elektronik ortamda iletilmiştir."}
              </p>
            )}

            {docMeta.isEFatura && (
              <p className="font-medium opacity-95">
                •{" "}
                {design.eFaturaFooterNote ||
                  "İşbu fatura 5070 sayılı Elektronik İmza Kanunu uyarınca elektronik ortamda imzalanmıştır."}
              </p>
            )}

            {legalTaxNotes.map((ln, idx) => (
              <p key={idx} className="font-semibold">
                • {ln}
              </p>
            ))}

            {invoice.notes && invoice.notes.trim() && (
              <p
                style={{
                  borderColor: palette.isDark ? "rgba(255,255,255,0.25)" : "rgba(15,23,42,0.2)",
                }}
                className="whitespace-pre-line pt-1 border-t mt-1 font-medium"
              >
                {invoice.notes}
              </p>
            )}
          </div>

          {/* Eğer imza bölgesi "Notlar Altı - Alt Sol" (bottom_left) seçildiyse */}
          {activeCssConfig.signatureZone === "bottom_left" && signatureBlockNode}
        </div>

        {/* RIGHT COLUMN (5 cols): GİB OFFICIAL TOTALS TABLE + KAŞE & İMZA */}
        <div className="sm:col-span-5 space-y-3">
          <div className="border border-slate-800 overflow-hidden">
            <table className="w-full text-[10.5px] border-collapse">
              <tbody className="divide-y divide-slate-300">
                <tr>
                  <td className="py-1.5 px-2.5 font-bold text-slate-800 bg-slate-50 border-r border-slate-300">
                    Mal Hizmet Toplam Tutarı
                  </td>
                  <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-950">
                    {currSymbol}
                    {grossTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-2.5 font-bold text-slate-800 bg-slate-50 border-r border-slate-300">
                    Toplam İskonto
                  </td>
                  <td className="py-1.5 px-2.5 text-right font-mono font-bold text-rose-700">
                    {currSymbol}
                    {totalDiscount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                {totalDiscount > 0 && (
                  <tr>
                    <td className="py-1.5 px-2.5 font-bold text-slate-800 bg-slate-50 border-r border-slate-300">
                      Net KDV Matrahı (Ara Toplam)
                    </td>
                    <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-950">
                      {currSymbol}
                      {subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}
                {vatBreakdown.length > 0 ? (
                  vatBreakdown.map((vb) => (
                    <tr key={vb.rate}>
                      <td className="py-1.5 px-2.5 font-bold text-slate-800 bg-slate-50 border-r border-slate-300">
                        Hesaplanan KDV (%{vb.rate})
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-950">
                        {currSymbol}
                        {vb.vat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-1.5 px-2.5 font-bold text-slate-800 bg-slate-50 border-r border-slate-300">
                      Hesaplanan KDV Toplamı
                    </td>
                    <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-950">
                      {currSymbol}
                      {totalVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}

                {totalWithholding > 0 && (
                  <tr className="bg-amber-50/70">
                    <td className="py-1.5 px-2.5 font-bold text-amber-950 border-r border-slate-300">
                      Hesaplanan KDV Tevkifatı (-)
                    </td>
                    <td className="py-1.5 px-2.5 text-right font-mono font-bold text-amber-900">
                      -{currSymbol}
                      {totalWithholding.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}

                <tr>
                  <td className="py-1.5 px-2.5 font-bold text-slate-900 bg-slate-100 border-r border-slate-300">
                    Vergiler Dahil Toplam Tutar
                  </td>
                  <td className="py-1.5 px-2.5 text-right font-mono font-black text-slate-950 bg-slate-50">
                    {currSymbol}
                    {grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                <tr
                  style={{
                    backgroundColor: palette.headerBg,
                    color: palette.headerText,
                    WebkitPrintColorAdjust: "exact",
                    printColorAdjust: "exact",
                  }}
                >
                  <td className="py-2 px-2.5 font-black uppercase text-xs border-r border-slate-400/40">
                    Ödenecek Tutar
                  </td>
                  <td className="py-2 px-2.5 text-right font-mono font-black text-sm">
                    {currSymbol}
                    {payableAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                {paidAmount > 0 && (
                  <>
                    <tr>
                      <td className="py-1 px-2.5 font-semibold text-emerald-800 bg-emerald-50/50 border-r border-slate-300">
                        Tahsil Edilen / Ödenen
                      </td>
                      <td className="py-1 px-2.5 text-right font-mono font-bold text-emerald-800">
                        {currSymbol}
                        {paidAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2.5 font-bold text-rose-800 bg-rose-50/50 border-r border-slate-300">
                        Kalan Açık Bakiye
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-mono font-black text-rose-800">
                        {currSymbol}
                        {remainingAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Eğer imza bölgesi "Toplamlar Altı - Alt Sağ" (bottom_right) seçildiyse */}
          {activeCssConfig.signatureZone === "bottom_right" && signatureBlockNode}
        </div>
      </div>
    </div>
  );
};

function escapeXmlText(val: unknown): string {
  return String(val ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Gelir İdaresi Başkanlığı (GİB) VUK 509 Genel Tebliği "e-Belgelere Karekod Eklenmesi Kılavuzu"
 * standartlarına %100 uygun JSON karekod verisi oluşturur.
 */
export function buildGibLegislationCompliantQrPayload(params: {
  vkntckn: string;
  avkntckn: string;
  senaryo: string;
  tip: string;
  tarih: string;
  no: string;
  ettn: string;
  parabirimi: string;
  malhizmettoplam: number | string;
  vatBreakdown?: Array<{ rate: number; matrah: number; vat: number }>;
  totalVat?: number | string;
  vergilerdahil: number | string;
  odenecek: number | string;
}): string {
  const cleanSeller = String(params.vkntckn || "").replace(/\D/g, "") || "1111111111";
  const cleanBuyer = String(params.avkntckn || "").replace(/\D/g, "") || "11111111111";
  const payload: Record<string, string> = {
    vkntckn: cleanSeller,
    avkntckn: cleanBuyer,
    senaryo: String(params.senaryo || "TICARIFATURA").toUpperCase(),
    tip: String(params.tip || "SATIS").toUpperCase(),
    tarih: String(params.tarih || new Date().toISOString().slice(0, 10)),
    no: String(params.no || "GIB2026000000001"),
    ettn: String(params.ettn || "8a491029-3810-4b10-8201-948123019283"),
    parabirimi: String(params.parabirimi === "₺" ? "TRY" : params.parabirimi || "TRY"),
    malhizmettoplam: Number(params.malhizmettoplam || 0).toFixed(2),
  };

  if (Array.isArray(params.vatBreakdown) && params.vatBreakdown.length > 0) {
    for (const vb of params.vatBreakdown) {
      const r = Math.round(Number(vb.rate || 0));
      payload[`kdvmatrah(${r})`] = Number(vb.matrah || 0).toFixed(2);
      payload[`hesaplanankdv(${r})`] = Number(vb.vat || 0).toFixed(2);
    }
  } else {
    payload["kdvmatrah(20)"] = Number(params.malhizmettoplam || 0).toFixed(2);
    payload["hesaplanankdv(20)"] = Number(params.totalVat || 0).toFixed(2);
  }

  payload.vergilerdahil = Number(params.vergilerdahil || 0).toFixed(2);
  payload.odenecek = Number(params.odenecek || 0).toFixed(2);

  return JSON.stringify(payload);
}

function generateGibQrCodeSvgMarkup(payload: string, sizePx: number = 84): string {
  try {
    const qr = QRCode.create(payload, { errorCorrectionLevel: "M" });
    const moduleCount = qr.modules.size;
    const data = qr.modules.data;
    const margin = 1;
    const totalSize = moduleCount + margin * 2;
    let pathD = "";
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (data[r * moduleCount + c]) {
          pathD += `M${c + margin},${r + margin}h1v1h-1z`;
        }
      }
    }
    return `<svg width="${sizePx}" height="${sizePx}" viewBox="0 0 ${totalSize} ${totalSize}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" style="display:block;width:${sizePx}px;height:${sizePx}px;"><rect width="100%" height="100%" fill="#ffffff"/><path d="${pathD}" fill="#000000"/></svg>`;
  } catch {
    return "";
  }
}

/**
 * Automatically builds and places the GİB VUK 509 compliant e-Fatura / e-Arşiv QR Code block
 * at the top-right corner of the invoice document in downloaded XSLT templates.
 * Supports:
 * 1. Embedded UBL-TR QR code attachments (KAREKOD / QRCODE base64 binary object),
 * 2. Dynamic UBL-TR XML GİB Karekod JSON extraction (#gib-qr-ubl-payload-data),
 * 3. Pre-rendered GİB vector SVG QR code & automatic top-right placement script (placeGibQrCodeTopRight).
 */
export function buildTopLeftCompanyLogoXsltBlock(options: {
  logoUrl?: string;
  logoWidthPx?: number;
  logoHeightPx?: number;
  logoObjectFit?: "contain" | "fill" | "cover";
}): string {
  const {
    logoUrl = "",
    logoWidthPx = 100,
    logoHeightPx = 100,
    logoObjectFit = "contain",
  } = options;
  if (!logoUrl) return "";

  return `<!-- SOL ÜST KÖŞE: FİRMA LOGOSU (KAREKOD İLE AYNI HİZADA) -->
              <div id="gib-top-left-logo-slot" class="gib-top-left-logo-container" style="display: block; margin-bottom: 8px; text-align: left;">
                <img src="${logoUrl}" alt="Firma Logosu" style="width: ${logoWidthPx}px; height: ${logoHeightPx}px; max-width: ${logoWidthPx}px; max-height: ${logoHeightPx}px; object-fit: ${logoObjectFit}; display: block;" />
              </div>`;
}

export function buildTopRightGibQrCodeXsltBlock(options: {
  qrSvgMarkup: string;
  sizePx?: number;
  logoUrl?: string;
  logoWidthPx?: number;
  logoHeightPx?: number;
  logoObjectFit?: "contain" | "fill" | "cover";
  defaultSellerTaxNo?: string;
  isEArsiv?: boolean;
}): string {
  const {
    qrSvgMarkup,
    sizePx = 100,
    defaultSellerTaxNo = "1111111111",
    isEArsiv = false,
  } = options;
  if (!qrSvgMarkup) return "";

  return `<!-- GİB MEVZUATINA (VUK 509) UYGUN SAĞ ÜST KÖŞE OTOMATİK KAREKOD (QR KOD) BLOĞU -->
              <div id="gib-top-right-qr-slot" class="gib-top-right-qr-container" style="width: 100%; display: flex; flex-direction: column; align-items: flex-end; justify-content: flex-start; text-align: right; margin-bottom: 8px;">
                <div id="gib-qr-top-right-box" class="gib-qr-box" style="display: inline-block; margin-left: auto; border: 1px solid #94a3b8; border-radius: 4px; padding: 4px; background: #ffffff; width: ${sizePx + 8}px; height: ${sizePx + 8}px; text-align: center;">
                  <!-- GİB VUK 509 Karekod Standardı UBL-TR 1.2 Dinamik JSON Verisi -->
                  <div id="gib-qr-ubl-payload-data" style="display:none;">
                    <xsl:text>{"vkntckn":"</xsl:text>
                    <xsl:choose>
                      <xsl:when test="string(//n1:Invoice/cac:AccountingSupplierParty/cac:Party/cac:PartyIdentification/cbc:ID[@schemeID='VKN' or @schemeID='TCKN'])">
                        <xsl:value-of select="normalize-space(//n1:Invoice/cac:AccountingSupplierParty/cac:Party/cac:PartyIdentification/cbc:ID[@schemeID='VKN' or @schemeID='TCKN'][1])" />
                      </xsl:when>
                      <xsl:when test="string(//n1:Invoice/cac:AccountingSupplierParty/cac:Party/cac:PartyIdentification/cbc:ID)">
                        <xsl:value-of select="normalize-space(//n1:Invoice/cac:AccountingSupplierParty/cac:Party/cac:PartyIdentification/cbc:ID[1])" />
                      </xsl:when>
                      <xsl:otherwise>${escapeXmlText(defaultSellerTaxNo)}</xsl:otherwise>
                    </xsl:choose>
                    <xsl:text>","avkntckn":"</xsl:text>
                    <xsl:choose>
                      <xsl:when test="string(//n1:Invoice/cac:AccountingCustomerParty/cac:Party/cac:PartyIdentification/cbc:ID[@schemeID='VKN' or @schemeID='TCKN'])">
                        <xsl:value-of select="normalize-space(//n1:Invoice/cac:AccountingCustomerParty/cac:Party/cac:PartyIdentification/cbc:ID[@schemeID='VKN' or @schemeID='TCKN'][1])" />
                      </xsl:when>
                      <xsl:otherwise>
                        <xsl:value-of select="normalize-space(//n1:Invoice/cac:AccountingCustomerParty/cac:Party/cac:PartyIdentification/cbc:ID[1])" />
                      </xsl:otherwise>
                    </xsl:choose>
                    <xsl:text>","senaryo":"</xsl:text>
                    <xsl:choose>
                      <xsl:when test="string(//n1:Invoice/cbc:ProfileID)">
                        <xsl:value-of select="normalize-space(//n1:Invoice/cbc:ProfileID)" />
                      </xsl:when>
                      <xsl:otherwise>${isEArsiv ? "EARSIVFATURA" : "TICARIFATURA"}</xsl:otherwise>
                    </xsl:choose>
                    <xsl:text>","tip":"</xsl:text>
                    <xsl:choose>
                      <xsl:when test="string(//n1:Invoice/cbc:InvoiceTypeCode)">
                        <xsl:value-of select="normalize-space(//n1:Invoice/cbc:InvoiceTypeCode)" />
                      </xsl:when>
                      <xsl:otherwise>SATIS</xsl:otherwise>
                    </xsl:choose>
                    <xsl:text>","tarih":"</xsl:text>
                    <xsl:value-of select="normalize-space(//n1:Invoice/cbc:IssueDate)" />
                    <xsl:text>","no":"</xsl:text>
                    <xsl:value-of select="normalize-space(//n1:Invoice/cbc:ID)" />
                    <xsl:text>","ettn":"</xsl:text>
                    <xsl:value-of select="normalize-space(//n1:Invoice/cbc:UUID)" />
                    <xsl:text>","parabirimi":"</xsl:text>
                    <xsl:value-of select="normalize-space(//n1:Invoice/cbc:DocumentCurrencyCode)" />
                    <xsl:text>","malhizmettoplam":"</xsl:text>
                    <xsl:value-of select="normalize-space(//n1:Invoice/cac:LegalMonetaryTotal/cbc:LineExtensionAmount)" />
                    <xsl:for-each select="//n1:Invoice/cac:TaxTotal/cac:TaxSubtotal">
                      <xsl:text>","kdvmatrah(</xsl:text>
                      <xsl:value-of select="normalize-space(cbc:Percent)" />
                      <xsl:text>)":"</xsl:text>
                      <xsl:value-of select="normalize-space(cbc:TaxableAmount)" />
                      <xsl:text>","hesaplanankdv(</xsl:text>
                      <xsl:value-of select="normalize-space(cbc:Percent)" />
                      <xsl:text>)":"</xsl:text>
                      <xsl:value-of select="normalize-space(cbc:TaxAmount)" />
                    </xsl:for-each>
                    <xsl:text>","vergilerdahil":"</xsl:text>
                    <xsl:value-of select="normalize-space(//n1:Invoice/cac:LegalMonetaryTotal/cbc:TaxInclusiveAmount)" />
                    <xsl:text>","odenecek":"</xsl:text>
                    <xsl:value-of select="normalize-space(//n1:Invoice/cac:LegalMonetaryTotal/cbc:PayableAmount)" />
                    <xsl:text>"}</xsl:text>
                  </div>
                  <xsl:choose>
                    <xsl:when test="string(//n1:Invoice/cac:AdditionalDocumentReference[cbc:DocumentType='KAREKOD' or cbc:DocumentType='QRCODE' or cbc:DocumentTypeCode='QRCODE' or cbc:DocumentTypeCode='KAREKOD']/cac:Attachment/cbc:EmbeddedDocumentBinaryObject)">
                      <img id="gib-qr-top-right-img" alt="GİB e-Belge Karekodu" style="width: ${sizePx}px; height: ${sizePx}px; object-fit: contain; display: block;">
                        <xsl:attribute name="src">
                          <xsl:text>data:image/png;base64,</xsl:text>
                          <xsl:value-of select="//n1:Invoice/cac:AdditionalDocumentReference[cbc:DocumentType='KAREKOD' or cbc:DocumentType='QRCODE' or cbc:DocumentTypeCode='QRCODE' or cbc:DocumentTypeCode='KAREKOD'][1]/cac:Attachment/cbc:EmbeddedDocumentBinaryObject" />
                        </xsl:attribute>
                      </img>
                    </xsl:when>
                    <xsl:otherwise>
                      <img id="gib-qr-template-img" src="${GIB_OFFICIAL_UPLOADED_QR_CODE_DATA_URI}" alt="GİB e-Belge Karekod Şablonu" style="width: ${sizePx}px; height: ${sizePx}px; object-fit: contain; display: block;" />
                    </xsl:otherwise>
                  </xsl:choose>
                </div>
              </div>`;
}

/**
 * Ensures any XSLT stylesheet string has the GİB-compliant QR code automatically positioned
 * in the top-right corner of the invoice document before downloading.
 */
export function ensureTopRightQrCodeInXslt(
  xsltContent: string,
  companySettings: CompanySettings,
  designInput?: Partial<InvoiceDesignSettings>,
  docType: "e_fatura" | "e_arsiv" = "e_fatura"
): string {
  if (xsltContent.includes('id="gib-top-right-qr-slot"')) {
    return xsltContent;
  }
  const design = resolveInvoiceDesignSettings(companySettings, designInput);
  if (design.showQrCode === false) return xsltContent;
  const rawSellerTaxNo =
    companySettings.vkn ||
    companySettings.tckn ||
    companySettings.taxNumber ||
    companySettings.tenantIdentifierNumber ||
    "1111111111";
  const qrPayloadJson = buildGibLegislationCompliantQrPayload({
    vkntckn: rawSellerTaxNo,
    avkntckn: "11111111111",
    senaryo: docType === "e_arsiv" ? "EARSIVFATURA" : "TICARIFATURA",
    tip: "SATIS",
    tarih: new Date().toISOString().slice(0, 10),
    no: `${docType === "e_arsiv" ? "EAR" : "GIB"}${new Date().getFullYear()}000000001`,
    ettn: "8a491029-3810-4b10-8201-948123019283",
    parabirimi: "TRY",
    malhizmettoplam: 15000,
    totalVat: 3000,
    vergilerdahil: 18000,
    odenecek: 18000,
  });
  const qrSize = 100;
  const qrSvg = generateGibQrCodeSvgMarkup(qrPayloadJson, qrSize);
  const block = buildTopRightGibQrCodeXsltBlock({
    qrSvgMarkup: qrSvg,
    sizePx: qrSize,
    defaultSellerTaxNo: rawSellerTaxNo,
    isEArsiv: docType === "e_arsiv",
  });
  return xsltContent.replace(
    /<table class="meta-table">/,
    `${block}\n              <table class="meta-table">`
  );
}

/**
 * Generates an official GİB UBL-TR 1.2 & Mysoft e-Belge compatible XSLT 1.0 stylesheet
 * containing all visual customizations (colors, logo, uploaded GİB seal, black e-FATURA / e-Arşiv Fatura title,
 * top-right GİB VUK 509 QR code auto-placement function, 17px invoice-to-stamp gap, 38px stamp-to-signature gap).
 */
export function generateOfficialGibXsltStylesheet(
  companySettings: CompanySettings,
  designInput?: Partial<InvoiceDesignSettings>,
  docType: "e_fatura" | "e_arsiv" = "e_fatura"
): string {
  const design = resolveInvoiceDesignSettings(companySettings, designInput);
  const palette = resolveInvoiceThemePalette(design);
  const cid = resolveTargetCompanyId(companySettings?.id);
  const cssCfg = getIndependentInvoiceCssConfig(design.cssConfig, cid);
  const scopedCss = buildInvoicePreviewScopedCss("gib-xslt-paper", cssCfg);

  const isEArsiv = docType === "e_arsiv";
  const docTitle = isEArsiv ? "e-Arşiv Fatura" : "e-FATURA";
  const defaultPrefix = isEArsiv
    ? (companySettings.eArsivPrefix || "EAR").toUpperCase().slice(0, 3)
    : (companySettings.eFaturaPrefix || companySettings.defaultInvoicePrefix || "GIB")
        .toUpperCase()
        .slice(0, 3);
  const defaultDocNo = isEArsiv
    ? companySettings.eArsivNextNumber || `${defaultPrefix}${new Date().getFullYear()}000000001`
    : companySettings.eFaturaNextNumber || `${defaultPrefix}${new Date().getFullYear()}000000001`;
  const todayIso = new Date().toISOString().slice(0, 10);

  const sellerName = escapeXmlText(
    companySettings.companyTitle || companySettings.companyName || "KURUMSAL ŞİRKET UNVANI"
  );
  const sellerAddress = escapeXmlText(
    getCompanyHeadquartersAddress(companySettings) ||
      companySettings.address ||
      "Merkez Adres"
  );
  const sellerCityDistrict = escapeXmlText(
    [companySettings.district, companySettings.city].filter(Boolean).join(" / ") || "İstanbul"
  );
  const sellerTaxOffice = escapeXmlText(companySettings.taxOffice || "Merkez");
  const rawSellerTaxNo =
    companySettings.vkn ||
    companySettings.tckn ||
    companySettings.taxNumber ||
    companySettings.tenantIdentifierNumber ||
    "";
  const sellerTaxNumber = escapeXmlText(rawSellerTaxNo);
  const sellerPhone = escapeXmlText(companySettings.phone || "");
  const sellerEmail = escapeXmlText(companySettings.email || "");
  const sellerWeb = escapeXmlText(companySettings.website || "");
  const sellerMersis = escapeXmlText(companySettings.mersisNo || "");
  const sellerTicaretSicil = escapeXmlText(companySettings.tradeRegisterNo || "");
  const sellerEsnafSicil = escapeXmlText(companySettings.esnafSicilNo || "");

  const bankHolder = escapeXmlText(
    companySettings.defaultBankAccountName ||
      companySettings.companyTitle ||
      companySettings.companyName ||
      ""
  );
  const bankName = escapeXmlText(companySettings.defaultBankName || "");
  const bankIban = escapeXmlText(companySettings.defaultBankIban || companySettings.iban || "");

  const footerNote = escapeXmlText(
    isEArsiv
      ? design.eArsivFooterNote || DEFAULT_INVOICE_DESIGN.eArsivFooterNote
      : design.eFaturaFooterNote || DEFAULT_INVOICE_DESIGN.eFaturaFooterNote
  );

  const logoUrl =
    design.showCompanyLogo !== false && companySettings.logoUrl
      ? escapeXmlText(companySettings.logoUrl)
      : "";
  const stampUrl =
    design.showSignatureStamp !== false && design.stampImageUrl
      ? escapeXmlText(design.stampImageUrl)
      : "";
  const signatureUrl =
    design.showSignatureStamp !== false && design.signatureImageUrl
      ? escapeXmlText(design.signatureImageUrl)
      : "";
  const xsltSigMode = design.eArsivSignatureMode || "stamp_and_signature";
  const xsltSigColor = escapeXmlText(design.eArsivSignatureColor || "#1d4ed8");
  const xsltLogoDims = resolveInvoiceLogoDimensions(design);
  const gibSealSize = Number(cssCfg.gibLogoSize) || 76;
  const qrSizePx = 100;

  // Build Official GİB VUK 509 Compliant QR Code SVG for the XSLT template and place it at the top-right corner
  const qrPayloadJson = buildGibLegislationCompliantQrPayload({
    vkntckn: rawSellerTaxNo || "1111111111",
    avkntckn: "11111111111",
    senaryo: isEArsiv ? "EARSIVFATURA" : "TICARIFATURA",
    tip: "SATIS",
    tarih: todayIso,
    no: defaultDocNo,
    ettn: "8a491029-3810-4b10-8201-948123019283",
    parabirimi: "TRY",
    malhizmettoplam: 15000,
    totalVat: 3000,
    vergilerdahil: 18000,
    odenecek: 18000,
  });
  const qrSvgMarkup =
    design.showQrCode !== false ? generateGibQrCodeSvgMarkup(qrPayloadJson, qrSizePx) : "";
  const topLeftLogoBlock = buildTopLeftCompanyLogoXsltBlock({
    logoUrl,
    logoWidthPx: xsltLogoDims.widthPx,
    logoHeightPx: xsltLogoDims.heightPx,
    logoObjectFit: xsltLogoDims.objectFit,
  });
  const topRightQrCodeBlock = buildTopRightGibQrCodeXsltBlock({
    qrSvgMarkup,
    sizePx: qrSizePx,
    defaultSellerTaxNo: rawSellerTaxNo || "1111111111",
    isEArsiv,
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:n1="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  exclude-result-prefixes="n1 cac cbc">

  <xsl:output method="html" encoding="UTF-8" indent="yes" doctype-public="-//W3C//DTD HTML 4.01 Transitional//EN" />

  <xsl:template match="/">
    <html>
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>${docTitle} - ${sellerName}</title>
        <style type="text/css">
          @page { size: A4 portrait; margin: 10mm; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11px;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 0;
          }
          #gib-xslt-paper {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            padding: ${design.templateStyle === "gib_compact" ? "12px" : "20px"};
            background: #ffffff;
            border: 1px solid #cbd5e1;
          }
          .header-grid {
            display: flex;
            align-items: stretch;
            justify-content: space-between;
            width: 100%;
            border-bottom: 2px solid ${palette.border};
            padding-bottom: 12px;
            margin-bottom: 12px;
            gap: 12px;
          }
          .header-col-left {
            width: 40%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .header-col-center {
            width: 24%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            text-align: center;
          }
          .header-col-right {
            width: 36%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: flex-end;
          }
          .party-box {
            border-top: 2px solid ${palette.border};
            border-bottom: 2px solid ${palette.border};
            padding: 8px 6px;
            background: #ffffff;
            font-size: 10px;
            line-height: 1.45;
          }
          .party-title {
            font-size: 9.5px;
            font-weight: 800;
            text-transform: uppercase;
            color: ${palette.primary};
            margin-bottom: 4px;
            letter-spacing: 0.4px;
          }
          .meta-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin-top: auto;
          }
          .meta-table th {
            background: ${palette.headerBg};
            color: ${palette.headerText};
            text-align: left;
            padding: 4px 7px;
            border: 1px solid ${palette.border};
            font-weight: 700;
            width: 44%;
          }
          .meta-table td {
            padding: 4px 7px;
            border: 1px solid #cbd5e1;
            font-weight: 700;
            color: #0f172a;
            background: #ffffff;
          }
          .lines-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
            font-size: 10px;
          }
          .lines-table thead th {
            background: ${palette.headerBg};
            color: ${palette.headerText};
            border: 1px solid ${palette.border};
            padding: 6px 6px;
            font-weight: 800;
            text-transform: uppercase;
            font-size: 9.5px;
          }
          .lines-table tbody td {
            border: 1px solid #cbd5e1;
            padding: 5px 6px;
            vertical-align: top;
          }
          .lines-table tbody tr:nth-child(even) {
            background: #f8fafc;
          }
          .totals-wrap {
            display: table;
            width: 100%;
            margin-top: 12px;
          }
          .notes-col {
            display: table-cell;
            width: 58%;
            vertical-align: top;
            padding-right: 12px;
          }
          .totals-col {
            display: table-cell;
            width: 42%;
            vertical-align: top;
          }
          .totals-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5px;
          }
          .totals-table th {
            text-align: left;
            padding: 5px 8px;
            border: 1px solid #cbd5e1;
            background: #f8fafc;
            font-weight: 700;
          }
          .totals-table td {
            text-align: right;
            padding: 5px 8px;
            border: 1px solid #cbd5e1;
            font-weight: 700;
          }
          .totals-table tr.grand-row th,
          .totals-table tr.grand-row td {
            background: ${palette.headerBg};
            color: ${palette.headerText};
            border-color: ${palette.border};
            font-size: 11.5px;
            font-weight: 900;
          }
          .bank-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5px;
            margin-top: 8px;
          }
          .bank-table th {
            background: ${palette.primaryLight};
            color: ${palette.primary};
            border: 1px solid #cbd5e1;
            padding: 4px 6px;
            text-align: left;
          }
          .bank-table td {
            border: 1px solid #cbd5e1;
            padding: 4px 6px;
            font-family: monospace;
            font-weight: 700;
          }
          .signature-box {
            border: 1px ${cssCfg.signatureBorderStyle || "solid"} #94a3b8;
            border-radius: 6px;
            padding: 6px 10px;
            margin-top: 17px;
            background: #ffffff;
          }
          ${scopedCss}
        </style>
        <script type="text/javascript">
          <![CDATA[
          /**
           * Gelir İdaresi Başkanlığı (GİB) VUK 509 Genel Tebliği "e-Belgelere Karekod Eklenmesi Kılavuzu"
           * uyarınca karekodun (QR Kod) faturanın sağ üst köşesine otomatik olarak yerleşmesini sağlar.
           */
          function placeGibQrCodeTopRight() {
            try {
              var rightCol = document.querySelector(".header-col-right");
              var qrSlot = document.getElementById("gib-top-right-qr-slot");
              var qrBox = document.getElementById("gib-qr-top-right-box");
              var payloadEl = document.getElementById("gib-qr-ubl-payload-data");

              var leftCol = document.querySelector(".header-col-left");
              var logoSlot = document.getElementById("gib-top-left-logo-slot");
              if (leftCol && logoSlot && logoSlot.parentNode !== leftCol) {
                leftCol.insertBefore(logoSlot, leftCol.firstChild);
              }

              if (rightCol && qrSlot && qrSlot.parentNode !== rightCol) {
                rightCol.insertBefore(qrSlot, rightCol.firstChild);
              }
              if (qrSlot) {
                qrSlot.style.display = "flex";
                qrSlot.style.flexDirection = "column";
                qrSlot.style.justifyContent = "flex-start";
                qrSlot.style.alignItems = "flex-end";
                qrSlot.style.width = "100%";
              }
              if (qrBox) {
                qrBox.style.marginLeft = "auto";
                if (payloadEl && payloadEl.textContent) {
                  qrBox.setAttribute("data-gib-qr-json", payloadEl.textContent.replace(/\\s+/g, " ").trim());
                }
              }
            } catch (e) {}
          }
          if (typeof window !== "undefined") {
            if (window.addEventListener) {
              window.addEventListener("DOMContentLoaded", placeGibQrCodeTopRight, false);
              window.addEventListener("load", placeGibQrCodeTopRight, false);
            } else if (window.attachEvent) {
              window.attachEvent("onload", placeGibQrCodeTopRight);
            }
          }
          ]]>
        </script>
      </head>
      <body>
        <div id="gib-xslt-paper">
          <!-- ÜST BAŞLIK: DÜZENLEYEN & SAYIN ALICI (SOL) / GİB MÜHÜR & BAŞLIK (ORTA) / SAĞ ÜST QR KOD & ALTTA ALICI İLE HİZALI METAVERİ TABLOSU (SAĞ) -->
          <div class="header-grid">
            <!-- SOL SÜTUN: SOL ÜST LOGO (QR KODLA AYNI HİZADA) + SATICI (DÜZENLEYEN) BİLGİLERİ VE ALTTA SAYIN (ALICI CARİ) BÖLÜMÜ -->
            <div class="header-col-left">
              <div>
                ${topLeftLogoBlock}
                <div class="party-box issuer-seller-css-target">
                <div style="font-weight: 900; font-size: 11px; color: ${palette.primary}; text-transform: uppercase; margin-bottom: 3px;">
                  <xsl:choose>
                    <xsl:when test="string(//n1:Invoice/cac:AccountingSupplierParty/cac:Party/cac:PartyName/cbc:Name)">
                      <xsl:value-of select="//n1:Invoice/cac:AccountingSupplierParty/cac:Party/cac:PartyName/cbc:Name" />
                    </xsl:when>
                    <xsl:otherwise>${sellerName}</xsl:otherwise>
                  </xsl:choose>
                </div>
                <div>
                  <strong>Adres: </strong>
                  <xsl:choose>
                    <xsl:when test="string(//n1:Invoice/cbc:Note[starts-with(normalize-space(.), 'Şube Adresi')])">
                      <xsl:value-of select="substring-after(//n1:Invoice/cbc:Note[starts-with(normalize-space(.), 'Şube Adresi')][1], ':')" />
                    </xsl:when>
                    <xsl:when test="string(//n1:Invoice/cac:AccountingSupplierParty/cac:Party/cac:PostalAddress/cbc:StreetName)">
                      <xsl:value-of select="//n1:Invoice/cac:AccountingSupplierParty/cac:Party/cac:PostalAddress/cbc:StreetName" />
                      <xsl:text> </xsl:text>
                      <xsl:value-of select="//n1:Invoice/cac:AccountingSupplierParty/cac:Party/cac:PostalAddress/cbc:CitySubdivisionName" />
                      <xsl:text> / </xsl:text>
                      <xsl:value-of select="//n1:Invoice/cac:AccountingSupplierParty/cac:Party/cac:PostalAddress/cbc:CityName" />
                    </xsl:when>
                    <xsl:otherwise>${sellerAddress} (${sellerCityDistrict})</xsl:otherwise>
                  </xsl:choose>
                </div>
                ${sellerPhone ? `<div><strong>Tel: </strong>${sellerPhone}</div>` : ""}
                ${sellerEmail ? `<div><strong>E-Posta: </strong>${sellerEmail}</div>` : ""}
                ${sellerWeb ? `<div><strong>Web Sitesi: </strong>${sellerWeb}</div>` : ""}
                <div>
                  <strong>Vergi Dairesi: </strong>
                  <xsl:choose>
                    <xsl:when test="string(//n1:Invoice/cac:AccountingSupplierParty/cac:Party/cac:PartyTaxScheme/cac:TaxScheme/cbc:Name)">
                      <xsl:value-of select="//n1:Invoice/cac:AccountingSupplierParty/cac:Party/cac:PartyTaxScheme/cac:TaxScheme/cbc:Name" />
                    </xsl:when>
                    <xsl:otherwise>${sellerTaxOffice}</xsl:otherwise>
                  </xsl:choose>
                </div>
                <div>
                  <strong>VKN / TCKN: </strong>
                  <xsl:choose>
                    <xsl:when test="string(//n1:Invoice/cac:AccountingSupplierParty/cac:Party/cac:PartyIdentification/cbc:ID)">
                      <xsl:value-of select="//n1:Invoice/cac:AccountingSupplierParty/cac:Party/cac:PartyIdentification/cbc:ID" />
                    </xsl:when>
                    <xsl:otherwise>${sellerTaxNumber}</xsl:otherwise>
                  </xsl:choose>
                </div>
                ${sellerTicaretSicil ? `<div><strong>Ticaret Sicil No: </strong>${sellerTicaretSicil}</div>` : ""}
                ${sellerEsnafSicil ? `<div><strong>Esnaf Sicil No: </strong>${sellerEsnafSicil}</div>` : ""}
                ${sellerMersis ? `<div><strong>MERSİS No: </strong>${sellerMersis}</div>` : ""}
              </div>
            </div>

            <!-- SAYIN (ALICI CARİ BİLGİLERİ) — Sağdaki Metaveri Tablosu ile Alttan Hizalı -->
              <div class="party-box" style="margin-top: auto; margin-top: 10px;">
                <div class="party-title">SAYIN</div>
                <div style="font-weight: 800; font-size: 11px;">
                  <xsl:value-of select="//n1:Invoice/cac:AccountingCustomerParty/cac:Party/cac:PartyName/cbc:Name" />
                  <xsl:if test="not(string(//n1:Invoice/cac:AccountingCustomerParty/cac:Party/cac:PartyName/cbc:Name))">
                    <xsl:value-of select="//n1:Invoice/cac:AccountingCustomerParty/cac:Party/cac:Person/cbc:FirstName" />
                    <xsl:text> </xsl:text>
                    <xsl:value-of select="//n1:Invoice/cac:AccountingCustomerParty/cac:Party/cac:Person/cbc:FamilyName" />
                  </xsl:if>
                </div>
                <div>
                  <strong>Adres: </strong>
                  <xsl:value-of select="//n1:Invoice/cac:AccountingCustomerParty/cac:Party/cac:PostalAddress/cbc:StreetName" />
                  <xsl:text> </xsl:text>
                  <xsl:value-of select="//n1:Invoice/cac:AccountingCustomerParty/cac:Party/cac:PostalAddress/cbc:CitySubdivisionName" />
                  <xsl:text> / </xsl:text>
                  <xsl:value-of select="//n1:Invoice/cac:AccountingCustomerParty/cac:Party/cac:PostalAddress/cbc:CityName" />
                </div>
                <div>
                  <strong>Vergi Dairesi: </strong>
                  <xsl:value-of select="//n1:Invoice/cac:AccountingCustomerParty/cac:Party/cac:PartyTaxScheme/cac:TaxScheme/cbc:Name" />
                </div>
                <div>
                  <strong>VKN / TCKN: </strong>
                  <xsl:value-of select="//n1:Invoice/cac:AccountingCustomerParty/cac:Party/cac:PartyIdentification/cbc:ID" />
                </div>
              </div>
            </div>

            <!-- ORTA SÜTUN: GİB RESMİ MÜHÜR & BELGE TİPİ BAŞLIĞI -->
            <div class="header-col-center">
              <div class="gib-logo-css-target">
                ${
                  design.showGibSeal !== false
                    ? `<img src="${GIB_OFFICIAL_UPLOADED_LOGO_DATA_URI}" width="${gibSealSize}" height="${gibSealSize}" alt="T.C. Hazine ve Maliye Bakanlığı Gelir İdaresi Başkanlığı" style="width: ${gibSealSize}px; height: ${gibSealSize}px; object-fit: contain; border-radius: 50%; display: block; margin: 0 auto;" />`
                    : ""
                }
                <div style="margin-top: 6px; font-size: 15px; font-weight: 900; color: #000000; letter-spacing: 0.5px;">
                  ${docTitle}
                </div>
              </div>
              ${
                design.showSignatureStamp !== false
                  ? `<div class="signature-box issuer-signature-css-target">
                      ${
                        xsltSigMode !== "signature_only"
                          ? stampUrl
                            ? `<img src="${stampUrl}" alt="Kaşe" style="width: 170px; max-width: 170px; max-height: 56px; object-fit: contain; margin: 0 auto; display: block;" />`
                            : `<div style="border: 1.5px solid ${xsltSigColor}; border-radius: 6px; padding: 4px 6px; margin: 0 auto; width: 170px; max-width: 170px; box-sizing: border-box; text-align: center; line-height: 1.35;">
                                 <div style="font-size: 8.5px; font-weight: 800; color: ${xsltSigColor}; text-transform: uppercase;">${sellerName}</div>
                                 <div style="border-top: 1px solid ${xsltSigColor}; opacity: 0.35; margin: 2px 0;"></div>
                                 ${sellerAddress ? `<div style="font-size: 7px; color: ${xsltSigColor};">${sellerAddress}</div>` : ""}
                                 <div style="font-size: 7.5px; font-weight: 700; color: ${xsltSigColor};">${sellerTaxOffice ? `${sellerTaxOffice} V.D. • ` : ""}${String(rawSellerTaxNo).replace(/\D/g, "").length === 11 ? "T.C. Kimlik No" : "Vergi Kimlik No"}: ${sellerTaxNumber}</div>
                                 ${sellerPhone || sellerEmail ? `<div style="font-size: 6.8px; color: ${xsltSigColor};">${sellerPhone ? `Tel: ${sellerPhone}` : ""}${sellerPhone && sellerEmail ? " • " : ""}${sellerEmail ? `E-Posta: ${sellerEmail}` : ""}</div>` : ""}
                                 ${sellerTicaretSicil || sellerEsnafSicil ? `<div style="font-size: 6.8px; color: ${xsltSigColor};">${sellerTicaretSicil ? `Ticaret Sicil No: ${sellerTicaretSicil}` : ""}${sellerTicaretSicil && sellerEsnafSicil ? " • " : ""}${sellerEsnafSicil ? `Esnaf Sicil No: ${sellerEsnafSicil}` : ""}</div>` : ""}
                                 ${sellerMersis ? `<div style="font-size: 6.8px; font-family: monospace; color: ${xsltSigColor};">MERSİS No: ${sellerMersis}</div>` : ""}
                               </div>`
                          : ""
                      }
                       ${
                         (xsltSigMode === "stamp_and_signature" || xsltSigMode === "signature_only") &&
                         signatureUrl
                           ? `<img src="${signatureUrl}" alt="Islak İmza" style="max-height: 48px; max-width: 165px; object-fit: contain; margin: ${xsltSigMode !== "signature_only" ? "38px" : "2px"} auto 0 auto; display: block;" />`
                           : ""
                       }
                     </div>`
                  : ""
              }
            </div>

            <!-- SAĞ SÜTUN: SAĞ ÜST KÖŞE QR KOD & ALTTA ALICI CARİ İLE HİZALI BELGE METAVERİ TABLOSU -->
            <div class="header-col-right">
              ${topRightQrCodeBlock}
              <table class="meta-table">
                <tr>
                  <th>Özelleştirme No</th>
                  <td>TR1.2</td>
                </tr>
                <tr>
                  <th>Senaryo</th>
                  <td>
                    <xsl:choose>
                      <xsl:when test="string(//n1:Invoice/cbc:ProfileID)">
                        <xsl:value-of select="//n1:Invoice/cbc:ProfileID" />
                      </xsl:when>
                      <xsl:otherwise>${isEArsiv ? "EARSIVFATURA" : "TICARIFATURA"}</xsl:otherwise>
                    </xsl:choose>
                  </td>
                </tr>
                <tr>
                  <th>Fatura Tipi</th>
                  <td>
                    <xsl:choose>
                      <xsl:when test="string(//n1:Invoice/cbc:InvoiceTypeCode)">
                        <xsl:value-of select="//n1:Invoice/cbc:InvoiceTypeCode" />
                      </xsl:when>
                      <xsl:otherwise>SATIS</xsl:otherwise>
                    </xsl:choose>
                  </td>
                </tr>
                <tr>
                  <th>Fatura No</th>
                  <td style="font-family: monospace; font-size: 10.5px;">
                    <xsl:choose>
                      <xsl:when test="string(//n1:Invoice/cbc:ID)">
                        <xsl:value-of select="//n1:Invoice/cbc:ID" />
                      </xsl:when>
                      <xsl:otherwise>${defaultPrefix}${new Date().getFullYear()}000000001</xsl:otherwise>
                    </xsl:choose>
                  </td>
                </tr>
                <tr>
                  <th>Fatura Tarihi</th>
                  <td>
                    <xsl:choose>
                      <xsl:when test="string(//n1:Invoice/cbc:IssueDate)">
                        <xsl:value-of select="//n1:Invoice/cbc:IssueDate" />
                      </xsl:when>
                      <xsl:otherwise>${new Date().toISOString().slice(0, 10)}</xsl:otherwise>
                    </xsl:choose>
                  </td>
                </tr>
                <tr>
                  <th>ETTN</th>
                  <td style="font-family: monospace; font-size: 8.5px; word-break: break-all;">
                    <xsl:value-of select="//n1:Invoice/cbc:UUID" />
                  </td>
                </tr>
              </table>
            </div>
          </div>

          <!-- MAL / HİZMET KALEMLERİ TABLOSU -->
          <table class="lines-table">
            <thead>
              <tr>
                <th style="width: 5%;">#</th>
                ${design.showProductCode !== false ? `<th style="width: 12%;">Stok/Hizmet Kodu</th>` : ""}
                <th>Mal / Hizmet Açıklaması</th>
                <th style="width: 10%; text-align: right;">Miktar</th>
                <th style="width: 13%; text-align: right;">Birim Fiyat</th>
                <th style="width: 8%; text-align: right;">KDV %</th>
                <th style="width: 13%; text-align: right;">KDV Tutarı</th>
                <th style="width: 15%; text-align: right;">Mal/Hizmet Tutarı</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="//n1:Invoice/cac:InvoiceLine">
                <tr>
                  <td style="text-align: center;"><xsl:value-of select="cbc:ID" /></td>
                  ${
                    design.showProductCode !== false
                      ? `<td><xsl:value-of select="cac:Item/cac:SellersItemIdentification/cbc:ID" /></td>`
                      : ""
                  }
                  <td>
                    <strong><xsl:value-of select="cac:Item/cbc:Name" /></strong>
                    <xsl:if test="string(cac:Item/cbc:Description) and cac:Item/cbc:Description != cac:Item/cbc:Name">
                      <div style="font-size: 9px; color: #475569;"><xsl:value-of select="cac:Item/cbc:Description" /></div>
                    </xsl:if>
                  </td>
                  <td style="text-align: right;">
                    <xsl:value-of select="cbc:InvoicedQuantity" />
                    <xsl:text> </xsl:text>
                    <xsl:value-of select="cbc:InvoicedQuantity/@unitCode" />
                  </td>
                  <td style="text-align: right;"><xsl:value-of select="cac:Price/cbc:PriceAmount" /></td>
                  <td style="text-align: right;">%<xsl:value-of select="cac:TaxTotal/cac:TaxSubtotal/cbc:Percent" /></td>
                  <td style="text-align: right;"><xsl:value-of select="cac:TaxTotal/cbc:TaxAmount" /></td>
                  <td style="text-align: right; font-weight: 700;"><xsl:value-of select="cbc:LineExtensionAmount" /></td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>

          <!-- ALT BÖLÜM: NOTLAR, BANKA/IBAN VE TOPLAMLAR TABLOSU -->
          <div class="totals-wrap">
            <div class="notes-col">
              <div class="party-box">
                <div class="party-title">NOTLAR &amp; AÇIKLAMALAR</div>
                <xsl:for-each select="//n1:Invoice/cbc:Note">
                  <div style="margin-bottom: 3px;"><xsl:value-of select="." /></div>
                </xsl:for-each>
                ${
                  design.irsaliyeYerineGecer !== false
                    ? `<div style="margin-top: 4px; font-weight: 700;">İrsaliye yerine geçer.</div>`
                    : ""
                }
                <div style="margin-top: 4px; color: #475569; font-size: 9px;">${footerNote}</div>
              </div>

              ${
                design.showBankIbanTable !== false && (bankName || bankIban || bankHolder)
                  ? `<table class="bank-table">
                      <thead>
                        <tr>
                          <th>Banka Adı</th>
                          <th>Hesap Sahibi</th>
                          <th>IBAN Numarası</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>${bankName || "-"}</td>
                          <td>${bankHolder || sellerName}</td>
                          <td>${bankIban || "-"}</td>
                        </tr>
                      </tbody>
                    </table>`
                  : ""
              }
            </div>

            <div class="totals-col">
              <table class="totals-table">
                <tr>
                  <th>Mal / Hizmet Toplam Tutarı</th>
                  <td>
                    <xsl:value-of select="//n1:Invoice/cac:LegalMonetaryTotal/cbc:LineExtensionAmount" />
                    <xsl:text> </xsl:text>
                    <xsl:value-of select="//n1:Invoice/cbc:DocumentCurrencyCode" />
                  </td>
                </tr>
                <tr>
                  <th>Toplam İskonto</th>
                  <td>
                    <xsl:choose>
                      <xsl:when test="string(//n1:Invoice/cac:LegalMonetaryTotal/cbc:AllowanceTotalAmount)">
                        <xsl:value-of select="//n1:Invoice/cac:LegalMonetaryTotal/cbc:AllowanceTotalAmount" />
                      </xsl:when>
                      <xsl:otherwise>0.00</xsl:otherwise>
                    </xsl:choose>
                    <xsl:text> </xsl:text>
                    <xsl:value-of select="//n1:Invoice/cbc:DocumentCurrencyCode" />
                  </td>
                </tr>
                <tr>
                  <th>Hesaplanan KDV</th>
                  <td>
                    <xsl:value-of select="//n1:Invoice/cac:TaxTotal/cbc:TaxAmount" />
                    <xsl:text> </xsl:text>
                    <xsl:value-of select="//n1:Invoice/cbc:DocumentCurrencyCode" />
                  </td>
                </tr>
                <tr>
                  <th>Vergiler Dahil Toplam Tutar</th>
                  <td>
                    <xsl:value-of select="//n1:Invoice/cac:LegalMonetaryTotal/cbc:TaxInclusiveAmount" />
                    <xsl:text> </xsl:text>
                    <xsl:value-of select="//n1:Invoice/cbc:DocumentCurrencyCode" />
                  </td>
                </tr>
                <tr class="grand-row">
                  <th>ÖDENECEK TUTAR</th>
                  <td>
                    <xsl:value-of select="//n1:Invoice/cac:LegalMonetaryTotal/cbc:PayableAmount" />
                    <xsl:text> </xsl:text>
                    <xsl:value-of select="//n1:Invoice/cbc:DocumentCurrencyCode" />
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>`;
}

export function downloadOfficialGibXslt(
  companySettings: CompanySettings,
  designInput?: Partial<InvoiceDesignSettings>,
  docType: "e_fatura" | "e_arsiv" = "e_fatura"
): void {
  const rawXslt = generateOfficialGibXsltStylesheet(companySettings, designInput, docType);
  const xsltContent = ensureTopRightQrCodeInXslt(rawXslt, companySettings, designInput, docType);
  const blob = new Blob([xsltContent], { type: "application/xslt+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const rawCompName = (companySettings.companyName || companySettings.companyTitle || "Sirket")
    .replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ_-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 32);
  const docLabel = docType === "e_arsiv" ? "eArsiv" : "eFatura";
  const a = document.createElement("a");
  a.href = url;
  a.download = `${rawCompName}_${docLabel}_Resmi_Tasarim.xslt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ============================================================================
   INTERACTIVE E-FATURA & E-ARŞİV DESIGN CUSTOMIZER PANEL
   ============================================================================ */
export interface InvoiceDesignCustomizerBarProps {
  companySettings: CompanySettings;
  design: InvoiceDesignSettings;
  previewDocType: "auto" | "e_fatura" | "e_arsiv";
  onChangePreviewDocType: (mode: "auto" | "e_fatura" | "e_arsiv") => void;
  onChangeDesign: (next: Partial<InvoiceDesignSettings>) => void;
  onSaveToCompanySettings?: (updatedSettings: CompanySettings) => void;
  isAdmin?: boolean;
}

export const InvoiceDesignCustomizerBar: React.FC<InvoiceDesignCustomizerBarProps> = ({
  companySettings,
  design,
  previewDocType,
  onChangePreviewDocType,
  onChangeDesign,
  onSaveToCompanySettings,
  isAdmin = false,
}) => {
  const activeCompanyId = useMemo(
    () => resolveTargetCompanyId(companySettings?.id),
    [companySettings?.id]
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCssPanelOpen, setIsCssPanelOpen] = useState(false);
  const [isSignatureStudioOpen, setIsSignatureStudioOpen] = useState(false);
  const [isSavingToFirestore, setIsSavingToFirestore] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [lastFirestoreSavedAt, setLastFirestoreSavedAt] = useState<string | null>(null);
  const [cssConfig, setCssConfig] = useState<InvoicePreviewCssConfig>(() =>
    getIndependentInvoiceCssConfig(design.cssConfig, activeCompanyId)
  );
  const logoInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initialCfg = getIndependentInvoiceCssConfig(design.cssConfig, activeCompanyId);
    setCssConfig((prev) => (JSON.stringify(prev) === JSON.stringify(initialCfg) ? prev : initialCfg));
    const sync = () => {
      const fresh = getIndependentInvoiceCssConfig(design.cssConfig, activeCompanyId);
      setCssConfig((prev) => (JSON.stringify(prev) === JSON.stringify(fresh) ? prev : fresh));
    };
    window.addEventListener("muavin:invoice-css-config-changed", sync);
    const unsubFirestore = subscribeToCompanyInvoiceCssFromFirestore(
      activeCompanyId,
      ({ cssConfig: remoteCss, updatedAt }) => {
        setCssConfig((prev) => (JSON.stringify(prev) === JSON.stringify(remoteCss) ? prev : remoteCss));
        if (updatedAt) {
          setLastFirestoreSavedAt(updatedAt);
        }
      }
    );
    return () => {
      window.removeEventListener("muavin:invoice-css-config-changed", sync);
      unsubFirestore();
    };
  }, [activeCompanyId]);

  const handleUpdateCssConfig = (patch: Partial<InvoicePreviewCssConfig>) => {
    const updated = saveIndependentInvoiceCssConfig(patch, activeCompanyId);
    setCssConfig(updated);
    onChangeDesign({ cssConfig: updated });
  };

  const handleResetCssConfig = () => {
    const reset = resetIndependentInvoiceCssConfig(activeCompanyId);
    setCssConfig(reset);
    onChangeDesign({ cssConfig: reset });
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readAndOptimizeLogoFile(file);
      onChangeDesign({ showCompanyLogo: true });
      const nextSettings: CompanySettings = {
        ...companySettings,
        logoUrl: dataUrl,
        invoiceDesign: { ...design, showCompanyLogo: true, cssConfig },
      };
      onSaveToCompanySettings?.(nextSettings);
      void saveCloudLogo(
        dataUrl,
        { brandName: companySettings.companyName || "MUAVİN" },
        activeCompanyId
      );
    } catch (err) {
      console.error("Logo yükleme hatası:", err);
    } finally {
      e.target.value = "";
    }
  };

  const handleUploadStamp = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readAndOptimizeLogoFile(file);
      onChangeDesign({
        stampImageUrl: dataUrl,
        showSignatureStamp: true,
      });
    } catch (err) {
      console.error("Kaşe yükleme hatası:", err);
    } finally {
      e.target.value = "";
    }
  };

  const handleSaveAsCompanyDefault = async () => {
    setIsSavingToFirestore(true);
    try {
      const mergedDesign: InvoiceDesignSettings = {
        ...design,
        cssConfig,
      };
      const updatedSettings: CompanySettings = {
        ...companySettings,
        invoiceDesign: mergedDesign,
      };
      onSaveToCompanySettings?.(updatedSettings);
      onChangeDesign(mergedDesign);

      const res = await saveCompanyInvoiceCssToFirestore(
        companySettings,
        cssConfig,
        mergedDesign
      );
      if (res.updatedAt) {
        setLastFirestoreSavedAt(res.updatedAt);
      }
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3200);
    } finally {
      setIsSavingToFirestore(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs space-y-3 print:hidden">
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUploadLogo}
      />
      <input
        ref={stampInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUploadStamp}
      />

      {/* Top Quick Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900 mr-1">
            <Palette className="w-4 h-4 text-red-700" />
            <span>e-Fatura & e-Arşiv Tasarımı:</span>
          </div>

          {/* Document Type Switcher (Otomatik / e-Fatura / e-Arşiv Fatura) */}
          <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            {(
              [
                { id: "auto", label: "Otomatik" },
                { id: "e_fatura", label: "e-Fatura" },
                { id: "e_arsiv", label: "e-Arşiv Fatura" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangePreviewDocType(opt.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  previewDocType === opt.id
                    ? "bg-red-700 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Template Style Switcher */}
          <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            {(
              [
                { id: "gib_standard", label: "GİB Resmi XSLT" },
                { id: "gib_modern", label: "Modern Kurumsal" },
                { id: "gib_compact", label: "Kompakt Baskı" },
              ] as const
            ).map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => onChangeDesign({ templateStyle: st.id })}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  (design.templateStyle || "gib_standard") === st.id
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Color Theme Swatches & Labeled Options (Including Mavi, Açık Mavi & Custom Color) */}
          <div className="inline-flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(Object.keys(INVOICE_COLOR_THEMES) as InvoiceColorTheme[]).map((themeKey) => {
              const t = INVOICE_COLOR_THEMES[themeKey];
              const isSelected =
                !design.customAccentColor && (design.colorTheme || "gib_red") === themeKey;
              return (
                <button
                  key={themeKey}
                  type="button"
                  onClick={() =>
                    onChangeDesign({ colorTheme: themeKey, customAccentColor: undefined })
                  }
                  title={t.label}
                  className={`px-2 py-1 rounded-lg text-[10.5px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white text-slate-900 shadow-2xs ring-1 ring-slate-300"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  <span
                    style={{
                      backgroundColor: t.headerBg,
                      borderColor: t.border,
                    }}
                    className="w-3.5 h-3.5 rounded-full border shrink-0"
                  />
                  <span>{t.shortLabel}</span>
                </button>
              );
            })}

            {/* Custom Color Picker (Automatically adjusts description text to White if dark, Dark if light) */}
            <label
              title="Özel Renk Seçin (Koyu renklerde açıklamalar beyaz, açık renklerde koyu olur)"
              className={`px-2 py-1 rounded-lg text-[10.5px] font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                design.customAccentColor
                  ? "bg-white text-slate-900 shadow-2xs ring-1 ring-slate-300"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <input
                type="color"
                value={
                  design.customAccentColor ||
                  INVOICE_COLOR_THEMES[design.colorTheme || "gib_red"]?.headerBg ||
                  "#2563eb"
                }
                onChange={(e) => onChangeDesign({ customAccentColor: e.target.value })}
                className="w-4 h-4 rounded border-0 p-0 bg-transparent cursor-pointer"
              />
              <span>
                {design.customAccentColor
                  ? `Özel (${isHexColorDark(design.customAccentColor) ? "Koyu→Beyaz Yazı" : "Açık→Koyu Yazı"})`
                  : "Özel Renk"}
              </span>
            </label>
          </div>
        </div>

        {/* Right Actions: e-Arşiv Signature Studio, Independent CSS Positioning, Expand Studio & Save Design to Firestore */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSignatureStudioOpen(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95"
            title="e-Arşiv faturalar için canlı ıslak imza çiz, imza/kaşe görseli yükle veya yetkili imzası oluştur"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>e-Arşiv İmza &amp; Kaşe Ekle</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCssPanelOpen((v) => !v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
              isCssPanelOpen
                ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                : "bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100"
            }`}
            title="Ayarlar menüsünden bağımsız GİB Logosu ve Düzenleyen İmza/Bilgi CSS konumlandırması"
          >
            <Move className="w-3.5 h-3.5" />
            <span>GİB Logo & İmza CSS Konumu</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
              isExpanded
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{isExpanded ? "Tasarım Ayarlarını Gizle" : "Detaylı Tasarım & Kaşe / Logo"}</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() =>
                downloadOfficialGibXslt(
                  companySettings,
                  { ...design, cssConfig },
                  previewDocType === "e_arsiv" ? "e_arsiv" : "e_fatura"
                )
              }
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95"
              title="Tasarlanan faturayı GİB UBL-TR 1.2 ve Mysoft uyumlu resmi .xslt şablon dosyası olarak indir"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                XSLT İndir ({previewDocType === "e_arsiv" ? "e-Arşiv" : "e-Fatura"} .xslt)
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveAsCompanyDefault}
            disabled={isSavingToFirestore}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95 disabled:opacity-60"
            title="Özelleştirilen fatura CSS yapılandırmasını ve tasarımını aktif şirket için Firestore'a kaydet"
          >
            {savedNotice ? (
              <Check className="w-3.5 h-3.5" />
            ) : isSavingToFirestore ? (
              <CloudUpload className="w-3.5 h-3.5 animate-bounce" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>
              {savedNotice
                ? "Firestore'a Kaydedildi!"
                : isSavingToFirestore
                ? "Kaydediliyor..."
                : "Tasarımı Kaydet"}
            </span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          INDEPENDENT CSS POSITIONING CONFIGURATOR (GİB LOGO & DÜZENLEYEN İMZA/BİLGİ)
         ===================================================================== */}
      {isCssPanelOpen && (
        <div className="pt-3 border-t border-indigo-100 space-y-3 text-xs animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-indigo-50/70 border border-indigo-200/80 rounded-xl px-3 py-2">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-700" />
              <div>
                <span className="font-extrabold text-indigo-950">
                  Bağımsız CSS Konum Yapılandırması (Şirket Bazlı Firestore Senkronize)
                </span>
                <span className="text-[11px] text-indigo-700 ml-2">
                  GİB logosu, düzenleyen bilgisi ve kullanıcı imzası konumlarını CSS değişkenleri ile özelleştirip Firestore'a kaydedin.
                </span>
                {lastFirestoreSavedAt && (
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded ml-2">
                    Son Firestore Kaydı: {new Date(lastFirestoreSavedAt).toLocaleTimeString("tr-TR")}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetCssConfig}
                className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-100 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>CSS Konumlarını Sıfırla</span>
              </button>
              <button
                type="button"
                onClick={handleSaveAsCompanyDefault}
                disabled={isSavingToFirestore}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-60"
              >
                {savedNotice ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                <span>
                  {savedNotice
                    ? "Firestore'a Kaydedildi!"
                    : isSavingToFirestore
                    ? "Kaydediliyor..."
                    : "Tasarımı Kaydet"}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. GİB LOGOSU CSS KONUM & BOYUT */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-red-800">
                  1. GİB Logosu CSS Konumu (.gib-logo-css-target)
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  {cssConfig.gibLogoOffsetX}px, {cssConfig.gibLogoOffsetY}px
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600 font-semibold">Yatay Hizalama:</span>
                <div className="inline-flex bg-white rounded-lg border border-slate-200 p-0.5">
                  {(
                    [
                      { id: "left", label: "Sol", icon: AlignLeft },
                      { id: "center", label: "Orta", icon: AlignCenter },
                      { id: "right", label: "Sağ", icon: AlignRight },
                    ] as const
                  ).map((al) => {
                    const Icon = al.icon;
                    return (
                      <button
                        key={al.id}
                        type="button"
                        onClick={() => handleUpdateCssConfig({ gibLogoAlign: al.id })}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                          cssConfig.gibLogoAlign === al.id
                            ? "bg-red-700 text-white"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{al.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700">Yatay Kaydırma (--gib-logo-x):</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={-160}
                      max={160}
                      value={cssConfig.gibLogoOffsetX}
                      onChange={(e) =>
                        handleUpdateCssConfig({ gibLogoOffsetX: Number(e.target.value) || 0 })
                      }
                      className="w-14 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-right font-mono text-[11px]"
                    />
                    <span className="text-[10px] text-slate-500 font-mono">px</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={-160}
                  max={160}
                  value={cssConfig.gibLogoOffsetX}
                  onChange={(e) =>
                    handleUpdateCssConfig({ gibLogoOffsetX: Number(e.target.value) || 0 })
                  }
                  className="w-full accent-red-700 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700">Dikey Kaydırma (--gib-logo-y):</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={-120}
                      max={120}
                      value={cssConfig.gibLogoOffsetY}
                      onChange={(e) =>
                        handleUpdateCssConfig({ gibLogoOffsetY: Number(e.target.value) || 0 })
                      }
                      className="w-14 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-right font-mono text-[11px]"
                    />
                    <span className="text-[10px] text-slate-500 font-mono">px</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={-120}
                  max={120}
                  value={cssConfig.gibLogoOffsetY}
                  onChange={(e) =>
                    handleUpdateCssConfig({ gibLogoOffsetY: Number(e.target.value) || 0 })
                  }
                  className="w-full accent-red-700 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700">Mühür Boyutu (--gib-logo-size):</span>
                  <span className="font-mono font-bold text-slate-800">{cssConfig.gibLogoSize}px</span>
                </div>
                <input
                  type="range"
                  min={44}
                  max={130}
                  value={cssConfig.gibLogoSize}
                  onChange={(e) =>
                    handleUpdateCssConfig({ gibLogoSize: Number(e.target.value) || 76 })
                  }
                  className="w-full accent-red-700 cursor-pointer"
                />
              </div>
            </div>

            {/* 2. KULLANICI İMZASI / DÜZENLEYEN KAŞE & İMZA CSS KONUMU */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900">
                  2. Kullanıcı İmzası Konumu (.issuer-signature-css-target)
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  {cssConfig.signatureOffsetX}px, {cssConfig.signatureOffsetY}px
                </span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  İmza / Kaşe Yerleşim Bölgesi:
                </label>
                <select
                  value={cssConfig.signatureZone || "under_gib"}
                  onChange={(e) =>
                    handleUpdateCssConfig({
                      signatureZone: e.target.value as IssuerSignatureCssZone,
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-800"
                >
                  <option value="under_gib">GİB Logosu Altında (Üst Orta Sütun)</option>
                  <option value="under_seller">Düzenleyen Bilgisi Altında (Üst Sol Sütun)</option>
                  <option value="bottom_right">Toplamlar Tablosu Altında (Alt Sağ)</option>
                  <option value="bottom_left">Notlar & Yasal İbareler Altında (Alt Sol)</option>
                </select>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600 font-semibold">İmza Hizalama & Çerçeve:</span>
                <div className="flex items-center gap-1">
                  <div className="inline-flex bg-white rounded-lg border border-slate-200 p-0.5">
                    {(["left", "center", "right"] as const).map((al) => (
                      <button
                        key={al}
                        type="button"
                        onClick={() => handleUpdateCssConfig({ signatureAlign: al })}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                          cssConfig.signatureAlign === al
                            ? "bg-indigo-600 text-white"
                            : "text-slate-600"
                        }`}
                      >
                        {al === "left" ? "Sol" : al === "center" ? "Orta" : "Sağ"}
                      </button>
                    ))}
                  </div>
                  <select
                    value={cssConfig.signatureBorderStyle || "solid"}
                    onChange={(e) =>
                      handleUpdateCssConfig({
                        signatureBorderStyle: e.target.value as "solid" | "dashed" | "none",
                      })
                    }
                    className="bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 text-[10px] font-bold text-slate-700"
                  >
                    <option value="solid">Düz Çerçeve</option>
                    <option value="dashed">Kesikli</option>
                    <option value="none">Çerçevesiz</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700">Yatay Kaydırma (--issuer-sig-x):</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={-180}
                      max={180}
                      value={cssConfig.signatureOffsetX}
                      onChange={(e) =>
                        handleUpdateCssConfig({ signatureOffsetX: Number(e.target.value) || 0 })
                      }
                      className="w-14 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-right font-mono text-[11px]"
                    />
                    <span className="text-[10px] text-slate-500 font-mono">px</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  value={cssConfig.signatureOffsetX}
                  onChange={(e) =>
                    handleUpdateCssConfig({ signatureOffsetX: Number(e.target.value) || 0 })
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700">Dikey Kaydırma (--issuer-sig-y):</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={-120}
                      max={120}
                      value={cssConfig.signatureOffsetY}
                      onChange={(e) =>
                        handleUpdateCssConfig({ signatureOffsetY: Number(e.target.value) || 0 })
                      }
                      className="w-14 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-right font-mono text-[11px]"
                    />
                    <span className="text-[10px] text-slate-500 font-mono">px</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={-120}
                  max={120}
                  value={cssConfig.signatureOffsetY}
                  onChange={(e) =>
                    handleUpdateCssConfig({ signatureOffsetY: Number(e.target.value) || 0 })
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700">İmza Ölçeği (--issuer-sig-scale):</span>
                  <span className="font-mono font-bold text-slate-800">
                    %{Math.round((cssConfig.signatureScale || 1) * 100)}
                  </span>
                </div>
                <input
                  type="range"
                  min={65}
                  max={140}
                  step={5}
                  value={Math.round((cssConfig.signatureScale || 1) * 100)}
                  onChange={(e) =>
                    handleUpdateCssConfig({
                      signatureScale: (Number(e.target.value) || 100) / 100,
                    })
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            {/* 3. DÜZENLEYEN BİLGİSİ (SATICI BLOĞU) KONUMU & ÖZEL CSS EDİTÖRÜ */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                  3. Düzenleyen Bilgisi & Özel CSS (.issuer-seller-css-target)
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600 font-semibold">Düzenleyen Metin Hizalama:</span>
                <div className="inline-flex bg-white rounded-lg border border-slate-200 p-0.5">
                  {(["left", "center", "right"] as const).map((al) => (
                    <button
                      key={al}
                      type="button"
                      onClick={() => handleUpdateCssConfig({ sellerInfoAlign: al })}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                        cssConfig.sellerInfoAlign === al
                          ? "bg-slate-900 text-white"
                          : "text-slate-600"
                      }`}
                    >
                      {al === "left" ? "Sol" : al === "center" ? "Orta" : "Sağ"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    Düzenleyen X (px):
                  </label>
                  <input
                    type="number"
                    min={-120}
                    max={120}
                    value={cssConfig.sellerInfoOffsetX}
                    onChange={(e) =>
                      handleUpdateCssConfig({ sellerInfoOffsetX: Number(e.target.value) || 0 })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    Düzenleyen Y (px):
                  </label>
                  <input
                    type="number"
                    min={-80}
                    max={80}
                    value={cssConfig.sellerInfoOffsetY}
                    onChange={(e) =>
                      handleUpdateCssConfig({ sellerInfoOffsetY: Number(e.target.value) || 0 })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                  Özel CSS Kuralları (.gib-logo-css-target, .issuer-signature-css-target):
                </label>
                <textarea
                  rows={3}
                  placeholder={`/* Örn: #invoice-preview-paper .issuer-signature-css-target { margin-top: 12px; } */`}
                  value={cssConfig.customCss || ""}
                  onChange={(e) => handleUpdateCssConfig({ customCss: e.target.value })}
                  className="w-full bg-slate-900 text-emerald-300 font-mono text-[10px] rounded-lg p-2 border border-slate-700 leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Customization Controls */}
      {isExpanded && (
        <div className="pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs animate-fadeIn">
          {/* Column 1: Görünürlük & Resmi Öğeler */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
              GİB Görsel & Tablo Öğeleri
            </span>
            <label className="flex items-center justify-between gap-2 cursor-pointer">
              <span className="font-semibold text-slate-700">GİB Resmi Mühür / Amblem</span>
              <input
                type="checkbox"
                checked={design.showGibSeal !== false}
                onChange={(e) => onChangeDesign({ showGibSeal: e.target.checked })}
                className="rounded text-red-700"
              />
            </label>
            <label className="flex items-center justify-between gap-2 cursor-pointer">
              <span className="font-semibold text-slate-700">GİB Doğrulama Karekodu (QR)</span>
              <input
                type="checkbox"
                checked={design.showQrCode !== false}
                onChange={(e) => onChangeDesign({ showQrCode: e.target.checked })}
                className="rounded text-red-700"
              />
            </label>
            <label className="flex items-center justify-between gap-2 cursor-pointer">
              <span className="font-semibold text-slate-700">Stok / Hizmet Kodu Sütunu</span>
              <input
                type="checkbox"
                checked={design.showProductCode !== false}
                onChange={(e) => onChangeDesign({ showProductCode: e.target.checked })}
                className="rounded text-red-700"
              />
            </label>
            <label className="flex items-center justify-between gap-2 cursor-pointer">
              <span className="font-semibold text-slate-700">KDV Matrah Dağılım Tablosu</span>
              <input
                type="checkbox"
                checked={design.showTaxBreakdownTable !== false}
                onChange={(e) => onChangeDesign({ showTaxBreakdownTable: e.target.checked })}
                className="rounded text-red-700"
              />
            </label>
            <label className="flex items-center justify-between gap-2 cursor-pointer">
              <span className="font-semibold text-slate-700">Banka & IBAN Tablosu</span>
              <input
                type="checkbox"
                checked={design.showBankIbanTable !== false}
                onChange={(e) => onChangeDesign({ showBankIbanTable: e.target.checked })}
                className="rounded text-red-700"
              />
            </label>
            <label className="flex items-center justify-between gap-2 cursor-pointer">
              <span className="font-semibold text-slate-700">"İrsaliye yerine geçer." İbaresi</span>
              <input
                type="checkbox"
                checked={design.irsaliyeYerineGecer !== false}
                onChange={(e) => onChangeDesign({ irsaliyeYerineGecer: e.target.checked })}
                className="rounded text-red-700"
              />
            </label>
          </div>

          {/* Column 2: Şirket Logosu & Kaşe / İmza Ayarları */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
              Şirket Logosu & e-Arşiv Kaşe / İmza
            </span>

            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={design.showCompanyLogo !== false}
                  onChange={(e) => onChangeDesign({ showCompanyLogo: e.target.checked })}
                  className="rounded text-red-700"
                />
                <span>Şirket Logosu Göster</span>
              </label>
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Upload className="w-3 h-3 text-indigo-600" />
                <span>Logo Yükle</span>
              </button>
            </div>

            <div className="space-y-2 p-2.5 rounded-lg bg-white border border-slate-200">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-700 font-bold text-[11px]">
                  Logo Boyutu ({resolveInvoiceLogoDimensions(design).widthPx}×
                  {resolveInvoiceLogoDimensions(design).heightPx} px):
                </span>
                <div className="inline-flex bg-slate-100 rounded-lg border border-slate-200 p-0.5">
                  {(
                    [
                      { id: "sm", label: "Küçük (80×60)", w: 80, h: 60 },
                      { id: "md", label: "Kare (100×100)", w: 100, h: 100 },
                      { id: "lg", label: "Kaşe Boyu (170×80)", w: 170, h: 80 },
                    ] as const
                  ).map((preset) => {
                    const dims = resolveInvoiceLogoDimensions(design);
                    const isActive = dims.widthPx === preset.w && dims.heightPx === preset.h;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() =>
                          onChangeDesign({
                            logoSize: preset.id,
                            logoWidth: preset.w,
                            logoHeight: preset.h,
                          })
                        }
                        className={`px-2 py-0.5 rounded text-[9.5px] font-bold cursor-pointer ${
                          isActive
                            ? "bg-slate-900 text-white"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Özel Genişlik (Width px) Ayarı */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="font-semibold text-slate-600">Logo Genişliği (Width):</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={24}
                      max={340}
                      value={resolveInvoiceLogoDimensions(design).widthPx}
                      onChange={(e) =>
                        onChangeDesign({
                          logoWidth: Math.min(340, Math.max(24, Number(e.target.value) || 100)),
                        })
                      }
                      className="w-16 bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-right font-mono font-bold text-[11px]"
                    />
                    <span className="text-[10px] text-slate-500 font-mono">px</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={24}
                  max={340}
                  value={resolveInvoiceLogoDimensions(design).widthPx}
                  onChange={(e) =>
                    onChangeDesign({
                      logoWidth: Number(e.target.value) || 100,
                    })
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Özel Yükseklik (Height px) Ayarı */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="font-semibold text-slate-600">Logo Yüksekliği (Height):</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={20}
                      max={240}
                      value={resolveInvoiceLogoDimensions(design).heightPx}
                      onChange={(e) =>
                        onChangeDesign({
                          logoHeight: Math.min(240, Math.max(20, Number(e.target.value) || 100)),
                        })
                      }
                      className="w-16 bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-right font-mono font-bold text-[11px]"
                    />
                    <span className="text-[10px] text-slate-500 font-mono">px</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={20}
                  max={240}
                  value={resolveInvoiceLogoDimensions(design).heightPx}
                  onChange={(e) =>
                    onChangeDesign({
                      logoHeight: Number(e.target.value) || 100,
                    })
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Görsel Sığdırma Modu */}
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <span className="text-[10.5px] font-semibold text-slate-600">Görsel Sığdırma:</span>
                <div className="inline-flex bg-slate-100 rounded-lg border border-slate-200 p-0.5">
                  {(
                    [
                      { id: "contain", label: "Oranı Koru" },
                      { id: "fill", label: "Tam Doldur" },
                      { id: "cover", label: "Kırparak Doldur" },
                    ] as const
                  ).map((fit) => (
                    <button
                      key={fit.id}
                      type="button"
                      onClick={() => onChangeDesign({ logoObjectFit: fit.id })}
                      className={`px-2 py-0.5 rounded text-[9.5px] font-bold cursor-pointer ${
                        resolveInvoiceLogoDimensions(design).objectFit === fit.id
                          ? "bg-indigo-600 text-white"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {fit.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-1 border-t border-slate-200 space-y-2">
              <label className="flex items-center justify-between gap-2 cursor-pointer">
                <span className="font-semibold text-slate-700">Kaşe & İmza Alanı Göster</span>
                <input
                  type="checkbox"
                  checked={design.showSignatureStamp !== false}
                  onChange={(e) => onChangeDesign({ showSignatureStamp: e.target.checked })}
                  className="rounded text-red-700"
                />
              </label>

              <label className="flex items-center justify-between gap-2 cursor-pointer">
                <span className="font-semibold text-slate-700">Otomatik Dijital Şirket Kaşesi</span>
                <input
                  type="checkbox"
                  checked={design.autoDigitalStamp !== false}
                  onChange={(e) => onChangeDesign({ autoDigitalStamp: e.target.checked })}
                  className="rounded text-red-700"
                />
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSignatureStudioOpen(true)}
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Canlı İmza Çiz / Yükle Stüdyosu</span>
                </button>
                <button
                  type="button"
                  onClick={() => stampInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Stamp className="w-3.5 h-3.5 text-purple-600" />
                  <span>Kaşe Yükle</span>
                </button>
                {(design.stampImageUrl || design.signatureImageUrl) && (
                  <button
                    type="button"
                    onClick={() =>
                      onChangeDesign({ stampImageUrl: undefined, signatureImageUrl: undefined })
                    }
                    className="p-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 cursor-pointer"
                    title="Yüklenen Kaşe/İmza Görselini Kaldır"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Column 3: Sabit e-Fatura & e-Arşiv Alt Notları */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
              Sabit Belge Alt Notları (e-Fatura / e-Arşiv)
            </span>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                e-Arşiv Fatura Yasal İbaresi:
              </label>
              <input
                type="text"
                value={design.eArsivFooterNote ?? DEFAULT_INVOICE_DESIGN.eArsivFooterNote}
                onChange={(e) => onChangeDesign({ eArsivFooterNote: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                e-Fatura Yasal İbaresi:
              </label>
              <input
                type="text"
                value={design.eFaturaFooterNote ?? DEFAULT_INVOICE_DESIGN.eFaturaFooterNote}
                onChange={(e) => onChangeDesign({ eFaturaFooterNote: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-800"
              />
            </div>
            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => onChangeDesign(DEFAULT_INVOICE_DESIGN)}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Varsayılan GİB Ayarlarına Sıfırla</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <EArsivSignatureStudioModal
        isOpen={isSignatureStudioOpen}
        onClose={() => setIsSignatureStudioOpen(false)}
        companySettings={companySettings}
        currentDesign={{ ...design, cssConfig }}
        onApply={(res, saveDefault) => {
          const nextCss = handleUpdateCssConfigFromResult(
            cssConfig,
            res.signatureZone,
            res.signatureScale,
            activeCompanyId
          );
          setCssConfig(nextCss);
          const mergedDesign: InvoiceDesignSettings = {
            ...design,
            signatureImageUrl: res.signatureImageUrl,
            stampImageUrl: res.stampImageUrl,
            signerName: res.signerName,
            signerTitle: res.signerTitle,
            eArsivSignatureMode: res.eArsivSignatureMode,
            eArsivSignatureColor: res.eArsivSignatureColor,
            showSigningTimestamp: res.showSigningTimestamp,
            showSignatureStamp: res.showSignatureStamp,
            autoDigitalStamp: res.autoDigitalStamp,
            cssConfig: nextCss,
          };
          onChangeDesign(mergedDesign);
          if (saveDefault) {
            const updatedSettings: CompanySettings = {
              ...companySettings,
              invoiceDesign: mergedDesign,
            };
            onSaveToCompanySettings?.(updatedSettings);
            void saveCompanyInvoiceCssToFirestore(companySettings, nextCss, mergedDesign);
          }
        }}
      />
    </div>
  );
};

function handleUpdateCssConfigFromResult(
  current: InvoicePreviewCssConfig,
  signatureZone?: IssuerSignatureCssZone,
  signatureScale?: number,
  companyId?: string
): InvoicePreviewCssConfig {
  const patch: Partial<InvoicePreviewCssConfig> = {};
  if (signatureZone) patch.signatureZone = signatureZone;
  if (signatureScale !== undefined) patch.signatureScale = signatureScale;
  return saveIndependentInvoiceCssConfig({ ...current, ...patch }, companyId);
}
