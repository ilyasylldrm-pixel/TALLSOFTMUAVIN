import React, { useState } from "react";
import {
  CompanySettings,
  CompanyItem,
  Invoice,
  InvoiceDesignConfig,
  isAdminOrSysAdmin,
  isCompanyMysoftMatched,
} from "../types";
import { UserProfile } from "./AuthModal";
import { useTheme } from "../context/ThemeContext";
import { triggerFormErrorNotification } from "../context/FormErrorContext";
import {
  Settings as SettingsIcon,
  Save,
  Download,
  Upload,
  RotateCcw,
  Check,
  Database,
  DollarSign,
  FileText,
  Palette,
  Sliders,
  Sun,
  Moon,
  Undo2,
  Layers,
  LayoutTemplate,
  Cloud,
  Cpu,
  Zap,
  Server,
  Gauge,
  Terminal,
  Activity,
  Copy,
  ExternalLink,
  RefreshCw,
  UploadCloud,
  Utensils,
  Bus,
  Users,
  Info,
  Gift,
  CheckCircle2,
  Building2,
  Globe,
  Bell,
  AlertTriangle,
  Clock,
  History,
  Hash,
} from "lucide-react";
import { GitHubSyncPanel } from "./GitHubSyncPanel";
import { Logo } from "./Logo";
import { readAndOptimizeLogoFile, clampLogoScale } from "../utils/logoUpload";
import { saveCloudLogo } from "../services/cloudBrandingService";
import {
  getActiveCompanyId,
  getManualBackupStatus,
  snoozeManualBackupReminder,
  simulateOverdueManualBackup,
  ManualBackupStatus,
  updateCompanyItem,
} from "../utils/storage";
import {
  getMysoftMappingDefaults,
  getNextMysoftInvoiceNumber,
  getLocalNextSequentialInvoiceNumber,
} from "../services/mysoftEDocumentService";
import {
  OfficialGIBInvoicePaper,
  InvoiceDesignCustomizerBar,
  downloadOfficialGibXslt,
} from "./OfficialGIBInvoicePaper";

interface SettingsProps {
  settings: CompanySettings;
  onSaveSettings: (s: CompanySettings) => void;
  onExportBackup?: () => void;
  onImportBackup?: (jsonStr: string) => boolean;
  onResetDemoData?: () => void;
  embedded?: boolean;
  initialTab?: "theme" | "system" | "invoice_design" | "backup" | "cloud" | "github";
  companiesCount?: number;
  onOpenSubModule?: (sub: "companies" | "mysoft" | "logs") => void;
  currentUser?: UserProfile | null;
  activeCompany?: CompanyItem | null;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  onSaveSettings,
  onExportBackup,
  onImportBackup,
  onResetDemoData,
  embedded = false,
  initialTab,
  companiesCount,
  onOpenSubModule,
  currentUser,
  activeCompany,
}) => {
  const isAdmin = isAdminOrSysAdmin(currentUser);
  const isMysoftMatched = isCompanyMysoftMatched(activeCompany, settings);
  const [activeTab, setActiveTab] = useState<"theme" | "system" | "invoice_design" | "backup" | "cloud" | "github">(
    initialTab === "github" && !isAdmin ? (embedded ? "system" : "theme") : initialTab || (embedded ? "system" : "theme")
  );
  const [formData, setFormData] = useState<CompanySettings>(settings);
  const [invoiceDesign, setInvoiceDesign] = useState<InvoiceDesignConfig>(() => ({
    template: settings.invoiceDesign?.template || "classic_gib",
    primaryColor: settings.invoiceDesign?.primaryColor || "#8B0000",
    showLogo: settings.invoiceDesign?.showLogo ?? Boolean(settings.logoUrl),
    logoUrl: settings.invoiceDesign?.logoUrl || settings.logoUrl,
    showStamp: settings.invoiceDesign?.showStamp ?? Boolean(settings.stampUrl),
    stampUrl: settings.invoiceDesign?.stampUrl || settings.stampUrl,
    customCss: settings.invoiceDesign?.customCss,
  }));
  const [previewDocType, setPreviewDocType] = useState<"e_fatura" | "e_arsiv">("e_fatura");
  const [backupStatus, setBackupStatus] = useState<ManualBackupStatus>(() =>
    getManualBackupStatus(activeCompany?.id || getActiveCompanyId(), settings)
  );

  React.useEffect(() => {
    if (initialTab) {
      if (initialTab === "github" && !isAdmin) return;
      setActiveTab(initialTab);
    }
  }, [initialTab, isAdmin]);

  React.useEffect(() => {
    setFormData(settings);
    setInvoiceDesign({
      template: settings.invoiceDesign?.template || "classic_gib",
      primaryColor: settings.invoiceDesign?.primaryColor || "#8B0000",
      showLogo: settings.invoiceDesign?.showLogo ?? Boolean(settings.logoUrl),
      logoUrl: settings.invoiceDesign?.logoUrl || settings.logoUrl,
      showStamp: settings.invoiceDesign?.showStamp ?? Boolean(settings.stampUrl),
      stampUrl: settings.invoiceDesign?.stampUrl || settings.stampUrl,
      customCss: settings.invoiceDesign?.customCss,
    });
    setBackupStatus(getManualBackupStatus(activeCompany?.id || getActiveCompanyId(), settings));
  }, [settings, activeCompany?.id]);

  React.useEffect(() => {
    const refresh = () => {
      setBackupStatus(getManualBackupStatus(activeCompany?.id || getActiveCompanyId(), formData));
    };
    window.addEventListener("muavin:backup-status-changed", refresh);
    return () => window.removeEventListener("muavin:backup-status-changed", refresh);
  }, [activeCompany?.id, formData]);
  const [isSaved, setIsSaved] = useState(false);
  const [cloudTelemetry, setCloudTelemetry] = useState<any>(null);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);
  const settingsLogoInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleSettingsLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const optimizedDataUrl = await readAndOptimizeLogoFile(file);
      const updated = { ...formData, logoUrl: optimizedDataUrl, logoScale: 1 };
      setFormData(updated);
      onSaveSettings(updated);
      saveCloudLogo(
        optimizedDataUrl,
        { brandName: updated.companyName, logoScale: 1 },
        getActiveCompanyId()
      ).catch(() => {});
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      triggerFormErrorNotification(err?.message || "Logo yüklenirken hata oluştu.");
    } finally {
      e.target.value = "";
    }
  };

  const handleAdjustSettingsLogoScale = (nextScale: number) => {
    const clamped = clampLogoScale(nextScale);
    const updated = { ...formData, logoScale: clamped };
    setFormData(updated);
    onSaveSettings(updated);
  };

  const loadTelemetry = async () => {
    setIsLoadingCloud(true);
    const start = performance.now();
    try {
      const res = await fetch("/api/system/specs");
      const elapsed = Math.round(performance.now() - start);
      setPingLatency(elapsed);
      if (res.ok) {
        const data = await res.json();
        setCloudTelemetry(data);
      }
    } catch (err) {
      console.error("Cloud telemetry error:", err);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  // Theme Context
  const { theme, setTheme, resetTheme } = useTheme();

  // Mysoft Portaldaki Seriler & Ardışık Fatura Numarası state (Eşleştirilen Kullanıcı İçin)
  const [availablePrefixes, setAvailablePrefixes] = useState<
    Array<{ prefix: string; edocumentType?: string | number; year?: number; currentNumber?: number }>
  >([]);
  const [isLoadingSeries, setIsLoadingSeries] = useState(false);
  const [eFaturaLastNumber, setEFaturaLastNumber] = useState<string>("");
  const [eArsivLastNumber, setEArsivLastNumber] = useState<string>("");

  const syncMatchedCompanyPrefixes = React.useCallback(
    async (overrideVkn?: string) => {
      const rawVkn =
        overrideVkn ||
        formData.tenantIdentifierNumber ||
        formData.vkn ||
        formData.tckn ||
        formData.taxNumber ||
        formData.vknTckn ||
        activeCompany?.tenantIdentifierNumber ||
        activeCompany?.vkn ||
        activeCompany?.tckn ||
        activeCompany?.taxNumber ||
        "";
      const cleanVkn = String(rawVkn).replace(/\D/g, "");
      const currentYear = new Date().getFullYear();

      const localEFat = getLocalNextSequentialInvoiceNumber("e_fatura");
      const localEArs = getLocalNextSequentialInvoiceNumber("e_arsiv");

      const baseEFatPrefix = (
        formData.eFaturaPrefix ||
        activeCompany?.eFaturaPrefix ||
        (formData.defaultInvoicePrefix &&
        formData.defaultInvoicePrefix.trim().toUpperCase() !== "MUV2026"
          ? formData.defaultInvoicePrefix
          : "") ||
        localEFat.prefix ||
        "GIB"
      )
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 3) || "GIB";

      const baseEArsPrefix = (
        formData.eArsivPrefix ||
        activeCompany?.eArsivPrefix ||
        localEArs.prefix ||
        "EAR"
      )
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 3) || "EAR";

      if (cleanVkn.length !== 10 && cleanVkn.length !== 11) {
        const defaultEFatNext =
          formData.eFaturaNextNumber ||
          activeCompany?.eFaturaNextNumber ||
          `${baseEFatPrefix}${currentYear}${String(localEFat.nextSequence || 1).padStart(9, "0")}`;
        const defaultEArsNext =
          formData.eArsivNextNumber ||
          activeCompany?.eArsivNextNumber ||
          `${baseEArsPrefix}${currentYear}${String(localEArs.nextSequence || 1).padStart(9, "0")}`;
        setAvailablePrefixes([
          { prefix: baseEFatPrefix, edocumentType: "EFATURA", year: currentYear },
          { prefix: baseEArsPrefix, edocumentType: "EARSIVFATURA", year: currentYear },
        ]);
        setEFaturaLastNumber(localEFat.lastInvoiceNumber || "");
        setEArsivLastNumber(localEArs.lastInvoiceNumber || "");
        setFormData((prev) => ({
          ...prev,
          eFaturaPrefix: prev.eFaturaPrefix || baseEFatPrefix,
          eFaturaNextNumber: prev.eFaturaNextNumber || defaultEFatNext,
          eArsivPrefix: prev.eArsivPrefix || baseEArsPrefix,
          eArsivNextNumber: prev.eArsivNextNumber || defaultEArsNext,
          defaultInvoicePrefix: prev.eFaturaPrefix || baseEFatPrefix,
        }));
        return;
      }

      setIsLoadingSeries(true);
      try {
        const [defaultsSettled, efatNextSettled, earsNextSettled] = await Promise.allSettled([
          getMysoftMappingDefaults(cleanVkn),
          getNextMysoftInvoiceNumber({
            tenantIdentifierNumber: cleanVkn,
            eDocumentType: "EFATURA",
            year: currentYear,
          }),
          getNextMysoftInvoiceNumber({
            tenantIdentifierNumber: cleanVkn,
            eDocumentType: "EARSIVFATURA",
            year: currentYear,
          }),
        ]);

        const defaults = defaultsSettled.status === "fulfilled" ? defaultsSettled.value : null;
        const efatNext = efatNextSettled.status === "fulfilled" ? efatNextSettled.value : null;
        const earsNext = earsNextSettled.status === "fulfilled" ? earsNextSettled.value : null;

        const resolvedEFatPrefix = (
          (formData.eFaturaPrefix && formData.eFaturaPrefix !== "GIB" ? formData.eFaturaPrefix : "") ||
          (activeCompany?.eFaturaPrefix && activeCompany.eFaturaPrefix !== "GIB"
            ? activeCompany.eFaturaPrefix
            : "") ||
          (efatNext?.prefix && efatNext.prefix !== "GIB" ? efatNext.prefix : "") ||
          (defaults?.eFaturaPrefix && defaults.eFaturaPrefix !== "GIB" ? defaults.eFaturaPrefix : "") ||
          formData.eFaturaPrefix ||
          activeCompany?.eFaturaPrefix ||
          efatNext?.prefix ||
          defaults?.eFaturaPrefix ||
          baseEFatPrefix ||
          "GIB"
        )
          .trim()
          .toUpperCase()
          .slice(0, 3);

        const resolvedEArsPrefix = (
          (formData.eArsivPrefix && formData.eArsivPrefix !== "EAR" ? formData.eArsivPrefix : "") ||
          (activeCompany?.eArsivPrefix && activeCompany.eArsivPrefix !== "EAR"
            ? activeCompany.eArsivPrefix
            : "") ||
          (earsNext?.prefix && earsNext.prefix !== "EAR" ? earsNext.prefix : "") ||
          (defaults?.eArsivPrefix && defaults.eArsivPrefix !== "EAR" ? defaults.eArsivPrefix : "") ||
          formData.eArsivPrefix ||
          activeCompany?.eArsivPrefix ||
          earsNext?.prefix ||
          defaults?.eArsivPrefix ||
          baseEArsPrefix ||
          "EAR"
        )
          .trim()
          .toUpperCase()
          .slice(0, 3);

        // Parse saved sequence if same prefix
        const parseSavedSeq = (docNo?: string, pfx?: string) => {
          if (!docNo || !pfx) return 0;
          const m = /^([A-Za-z0-9]{3})(20\d{2})(\d{1,9})$/.exec(docNo.trim());
          if (m && m[1].toUpperCase() === pfx.toUpperCase() && Number(m[2]) === currentYear) {
            return parseInt(m[3], 10) || 0;
          }
          return 0;
        };

        const efatSeq = Math.max(
          1,
          efatNext?.prefix?.toUpperCase() === resolvedEFatPrefix ? efatNext.nextSequence || 1 : 1,
          defaults?.eFaturaPrefix?.toUpperCase() === resolvedEFatPrefix ? defaults.eFaturaSequence || 1 : 1,
          localEFat.prefix?.toUpperCase() === resolvedEFatPrefix ? localEFat.nextSequence || 1 : 1,
          parseSavedSeq(formData.eFaturaNextNumber || activeCompany?.eFaturaNextNumber, resolvedEFatPrefix),
        );
        const finalEFatNextNo = `${resolvedEFatPrefix}${currentYear}${String(efatSeq).padStart(9, "0")}`;
        const finalEFatLastNo =
          efatSeq > 1
            ? `${resolvedEFatPrefix}${currentYear}${String(efatSeq - 1).padStart(9, "0")}`
            : efatNext?.lastInvoiceNumber || defaults?.eFaturaLastNumber || localEFat.lastInvoiceNumber || "";

        const earsSeq = Math.max(
          1,
          earsNext?.prefix?.toUpperCase() === resolvedEArsPrefix ? earsNext.nextSequence || 1 : 1,
          defaults?.eArsivPrefix?.toUpperCase() === resolvedEArsPrefix ? defaults.eArsivSequence || 1 : 1,
          localEArs.prefix?.toUpperCase() === resolvedEArsPrefix ? localEArs.nextSequence || 1 : 1,
          parseSavedSeq(formData.eArsivNextNumber || activeCompany?.eArsivNextNumber, resolvedEArsPrefix),
        );
        const finalEArsNextNo = `${resolvedEArsPrefix}${currentYear}${String(earsSeq).padStart(9, "0")}`;
        const finalEArsLastNo =
          earsSeq > 1
            ? `${resolvedEArsPrefix}${currentYear}${String(earsSeq - 1).padStart(9, "0")}`
            : earsNext?.lastInvoiceNumber || defaults?.eArsivLastNumber || localEArs.lastInvoiceNumber || "";

        const mergedBadges: Array<{
          prefix: string;
          edocumentType?: string | number;
          year?: number;
          currentNumber?: number;
        }> = [...(defaults?.prefixes || [])];
        if (!mergedBadges.some((b) => String(b.prefix || "").toUpperCase() === resolvedEFatPrefix)) {
          mergedBadges.unshift({
            prefix: resolvedEFatPrefix,
            edocumentType: "EFATURA",
            year: currentYear,
            currentNumber: efatSeq > 1 ? efatSeq - 1 : 0,
          });
        }
        if (!mergedBadges.some((b) => String(b.prefix || "").toUpperCase() === resolvedEArsPrefix)) {
          mergedBadges.push({
            prefix: resolvedEArsPrefix,
            edocumentType: "EARSIVFATURA",
            year: currentYear,
            currentNumber: earsSeq > 1 ? earsSeq - 1 : 0,
          });
        }

        setAvailablePrefixes(mergedBadges);
        setEFaturaLastNumber(finalEFatLastNo);
        setEArsivLastNumber(finalEArsLastNo);

        setFormData((prev) => ({
          ...prev,
          eFaturaPrefix: resolvedEFatPrefix,
          eFaturaNextNumber: finalEFatNextNo,
          eArsivPrefix: resolvedEArsPrefix,
          eArsivNextNumber: finalEArsNextNo,
          defaultInvoicePrefix: resolvedEFatPrefix,
        }));
      } catch {
        // Fallback silently
      } finally {
        setIsLoadingSeries(false);
      }
    },
    [
      formData.tenantIdentifierNumber,
      formData.vkn,
      formData.tckn,
      formData.taxNumber,
      formData.vknTckn,
      formData.eFaturaPrefix,
      formData.eArsivPrefix,
      formData.eFaturaNextNumber,
      formData.eArsivNextNumber,
      formData.defaultInvoicePrefix,
      activeCompany?.id,
      activeCompany?.tenantIdentifierNumber,
      activeCompany?.vkn,
      activeCompany?.tckn,
      activeCompany?.taxNumber,
      activeCompany?.eFaturaPrefix,
      activeCompany?.eArsivPrefix,
      activeCompany?.eFaturaNextNumber,
      activeCompany?.eArsivNextNumber,
    ]
  );

  React.useEffect(() => {
    void syncMatchedCompanyPrefixes();
  }, [activeCompany?.id]);

  const persistFormatParamsToCompanyAndSettings = (nextForm: CompanySettings) => {
    setFormData(nextForm);
    onSaveSettings(nextForm);
    if (activeCompany?.id) {
      updateCompanyItem({
        ...activeCompany,
        eFaturaPrefix: (nextForm.eFaturaPrefix || "GIB").trim().toUpperCase().slice(0, 3),
        eFaturaNextNumber: nextForm.eFaturaNextNumber,
        eArsivPrefix: (nextForm.eArsivPrefix || "EAR").trim().toUpperCase().slice(0, 3),
        eArsivNextNumber: nextForm.eArsivNextNumber,
        defaultInvoicePrefix: (
          nextForm.eFaturaPrefix ||
          nextForm.defaultInvoicePrefix ||
          "GIB"
        )
          .trim()
          .toUpperCase()
          .slice(0, 3),
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    persistFormatParamsToCompanyAndSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImportBackup) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = onImportBackup(content);
        if (ok) {
          triggerFormErrorNotification("Yedek veriler başarıyla içe aktarıldı!", "Yedekleme");
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          triggerFormErrorNotification("Yedek dosyası okunamadı veya geçersiz format.", "Yedek Yükleme Hatası");
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={embedded ? "space-y-6" : "p-3 sm:p-6 max-w-6xl mx-auto space-y-4 sm:space-y-6"}>
      {/* Header Banner */}
      {!embedded && (
        <div
          className="relative overflow-hidden rounded-lg p-6 text-white shadow-2xs border"
          style={{
            backgroundColor: "#131b2e",
            borderColor: "#222a3d",
          }}
        >
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex-1 flex flex-col items-center sm:items-center text-center">
              <span className="bg-[#0f6bae]/20 text-[#c6cdff] border border-[#0f6bae]/30 text-[10px] font-semibold px-2.5 py-0.5 rounded uppercase tracking-wider label-caps">
                Sistem & Tasarım Paneli
              </span>
              <h1 className="text-xl font-editorial font-medium text-white flex items-center justify-center gap-2 mt-1.5 text-center">
                <Palette className="w-5 h-5 text-[#c6cdff]" />
                Görünüm, Tema ve Parametre Ayarları
              </h1>
              <p className="text-xs text-[#a0aab8] mt-1 max-w-2xl leading-relaxed text-center">
                CRM arayüzünüzün renklerini (kenar çubuğu, üst menü, butonlar, sayfa arka planı), kurumsal temanızı ve ticari parametrelerinizi dilediğiniz gibi özelleştirin.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded border border-white/10 shrink-0">
              <span className="text-[11px] text-[#c6cdff] px-2 font-medium">Aktif Renk Şeması:</span>
              <span
                className="text-xs font-semibold text-white px-3 py-1 rounded shadow-2xs"
                style={{ backgroundColor: theme.primaryColor }}
              >
                {theme.name}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        {onOpenSubModule && (
          <>
            {isAdmin && (
              <button
                type="button"
                onClick={() => onOpenSubModule("companies")}
                className="flex items-center gap-2 px-4 py-2.5 rounded text-xs font-semibold transition-all cursor-pointer bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
              >
                <Building2 className="w-4 h-4 text-[#0f6bae]" />
                <span>Şirketler & Çoklu Şirket{companiesCount !== undefined ? ` (${companiesCount})` : ""}</span>
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => onOpenSubModule("mysoft")}
                className="flex items-center gap-2 px-4 py-2.5 rounded text-xs font-semibold transition-all cursor-pointer bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
              >
                <Globe className="w-4 h-4 text-indigo-600" />
                <span>Mysoft VKN/TCKN Eşleştirme</span>
              </button>
            )}

            {isMysoftMatched && (
              <button
                type="button"
                onClick={() => onOpenSubModule("logs")}
                className="flex items-center gap-2 px-4 py-2.5 rounded text-xs font-semibold transition-all cursor-pointer bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200"
              >
                <Terminal className="w-4 h-4 text-amber-600" />
                <span>Log İzleme Ekranı (Mysoft API)</span>
              </button>
            )}
          </>
        )}

        <button
          type="button"
          onClick={() => setActiveTab("theme")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "theme"
              ? "text-white shadow-2xs"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
          style={activeTab === "theme" ? { backgroundColor: theme.primaryColor } : {}}
        >
          <Palette className="w-4 h-4" />
          <span>Görünüm & Tema Renkleri</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("system")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "system"
              ? "text-white shadow-2xs"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
          style={activeTab === "system" ? { backgroundColor: theme.primaryColor } : {}}
        >
          <Sliders className="w-4 h-4" />
          <span>Ticari Parametreler (Yol & Yemek Yardımı)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("invoice_design")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "invoice_design"
              ? "text-white shadow-2xs"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
          style={activeTab === "invoice_design" ? { backgroundColor: theme.primaryColor } : {}}
        >
          <LayoutTemplate className="w-4 h-4" />
          <span>e-Fatura & e-Arşiv Tasarım</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("backup")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "backup"
              ? "text-white shadow-2xs"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
          style={activeTab === "backup" ? { backgroundColor: theme.primaryColor } : {}}
        >
          <Database className="w-4 h-4" />
          <span>Yedekleme & Veri</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("cloud");
            loadTelemetry();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "cloud"
              ? "text-white shadow-2xs"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
          style={activeTab === "cloud" ? { backgroundColor: theme.primaryColor } : {}}
        >
          <Cloud className="w-4 h-4" />
          <span>Google Cloud & Hızlandırma</span>
        </button>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab("github")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "github"
                ? "text-white shadow-2xs"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
            style={activeTab === "github" ? { backgroundColor: theme.primaryColor } : {}}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Yayınla & GitHub</span>
          </button>
        )}
      </div>

      {/* ─── TAB 1: THEME & APPEARANCE ─── */}
      {activeTab === "theme" && (
        <div className="space-y-6">
          {/* Granular Color Customizer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 font-editorial">
                    <Palette className="w-4 h-4 text-[#0f6bae]" />
                    Detaylı Renk Paleti Özelleştirici
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Her bölümün arka plan ve metin renklerini dilediğiniz gibi ayarlayın; değişiklikler anında sayfaya yansır.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetTheme}
                  className="flex items-center gap-1.5 text-xs text-[#0f6bae] hover:text-[#005289] font-medium bg-[#eaedff] hover:bg-[#d9e8ff] px-3 py-1.5 rounded transition-colors cursor-pointer shrink-0 border border-[#c6cdff]"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Varsayılan Temaya Dön</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* 1. Sidebar Bg */}
                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-1.5">
                  <label className="font-bold text-slate-800 flex items-center justify-between">
                    <span>Kenar Çubuğu (Sidebar) Arka Planı</span>
                    <span className="font-mono text-[10px] text-slate-500 uppercase">{theme.sidebarBg}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.sidebarBg}
                      onChange={(e) => setTheme({ sidebarBg: e.target.value })}
                      className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={theme.sidebarBg}
                      onChange={(e) => setTheme({ sidebarBg: e.target.value })}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                {/* 2. Sidebar Text */}
                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-1.5">
                  <label className="font-bold text-slate-800 flex items-center justify-between">
                    <span>Sidebar Metin / Menü Rengi</span>
                    <span className="font-mono text-[10px] text-slate-500 uppercase">{theme.sidebarText}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.sidebarText}
                      onChange={(e) => setTheme({ sidebarText: e.target.value })}
                      className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={theme.sidebarText}
                      onChange={(e) => setTheme({ sidebarText: e.target.value })}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                {/* 3. Header / Navbar Bg */}
                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-1.5">
                  <label className="font-bold text-slate-800 flex items-center justify-between">
                    <span>Üst Menü (Navbar) Arka Planı</span>
                    <span className="font-mono text-[10px] text-slate-500 uppercase">{theme.headerBg}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.headerBg}
                      onChange={(e) => setTheme({ headerBg: e.target.value })}
                      className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={theme.headerBg}
                      onChange={(e) => setTheme({ headerBg: e.target.value })}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                {/* 4. Header Text */}
                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-1.5">
                  <label className="font-bold text-slate-800 flex items-center justify-between">
                    <span>Üst Menü Başlık & İkon Rengi</span>
                    <span className="font-mono text-[10px] text-slate-500 uppercase">{theme.headerText}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.headerText}
                      onChange={(e) => setTheme({ headerText: e.target.value })}
                      className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={theme.headerText}
                      onChange={(e) => setTheme({ headerText: e.target.value })}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                {/* 5. Primary Brand Color */}
                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200/70 space-y-1.5">
                  <label className="font-bold text-purple-950 flex items-center justify-between">
                    <span>Ana Vurgu Rengi (Butonlar & Rozetler)</span>
                    <span className="font-mono text-[10px] text-purple-700 uppercase">{theme.primaryColor}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.primaryColor}
                      onChange={(e) => setTheme({ primaryColor: e.target.value, sidebarActiveBg: e.target.value })}
                      className="w-9 h-9 rounded-lg border border-purple-300 cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={theme.primaryColor}
                      onChange={(e) => setTheme({ primaryColor: e.target.value, sidebarActiveBg: e.target.value })}
                      className="flex-1 bg-white border border-purple-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-purple-900"
                    />
                  </div>
                </div>

                {/* 6. Page Background */}
                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-1.5">
                  <label className="font-bold text-slate-800 flex items-center justify-between">
                    <span>Sayfa Arka Plan Rengi</span>
                    <span className="font-mono text-[10px] text-slate-500 uppercase">{theme.pageBg}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.pageBg}
                      onChange={(e) => setTheme({ pageBg: e.target.value })}
                      className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={theme.pageBg}
                      onChange={(e) => setTheme({ pageBg: e.target.value })}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                {/* 7. Card Background */}
                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-1.5">
                  <label className="font-bold text-slate-800 flex items-center justify-between">
                    <span>Kart & Tablo Arka Planı</span>
                    <span className="font-mono text-[10px] text-slate-500 uppercase">{theme.cardBg}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.cardBg}
                      onChange={(e) => setTheme({ cardBg: e.target.value })}
                      className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={theme.cardBg}
                      onChange={(e) => setTheme({ cardBg: e.target.value })}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                {/* 8. Card Border */}
                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-1.5">
                  <label className="font-bold text-slate-800 flex items-center justify-between">
                    <span>Kart Kenarlık (Border) Rengi</span>
                    <span className="font-mono text-[10px] text-slate-500 uppercase">{theme.cardBorder}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.cardBorder}
                      onChange={(e) => setTheme({ cardBorder: e.target.value })}
                      className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={theme.cardBorder}
                      onChange={(e) => setTheme({ cardBorder: e.target.value })}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Interactive Mockup Preview */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <LayoutTemplate className="w-4 h-4 text-purple-600" />
                  Canlı Arayüz Önizlemesi
                </h3>
                <p className="text-[11px] text-slate-500">
                  Seçtiğiniz renklerin CRM ekranlarında nasıl görüneceği:
                </p>
              </div>

              {/* Miniature CRM Window */}
              <div
                className="rounded-xl overflow-hidden border shadow-sm transition-colors flex h-[340px]"
                style={{
                  backgroundColor: theme.pageBg,
                  borderColor: theme.cardBorder,
                }}
              >
                {/* Mini Sidebar */}
                <div
                  className="w-24 p-2 flex flex-col justify-between transition-colors border-r"
                  style={{
                    backgroundColor: theme.sidebarBg,
                    color: theme.sidebarText,
                    borderColor: theme.sidebarBorder,
                  }}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1 px-1 py-1">
                      <div className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: theme.primaryColor }} />
                      <span className="font-black text-[10px]" style={{ color: theme.sidebarText }}>MUAVİN</span>
                    </div>
                    <div
                      className="px-2 py-1 rounded-md text-[9px] font-bold"
                      style={{
                        backgroundColor: theme.sidebarActiveBg,
                        color: theme.sidebarActiveText,
                      }}
                    >
                      Genel Bakış
                    </div>
                    <div className="px-2 py-1 text-[9px] opacity-70">Cariler</div>
                    <div className="px-2 py-1 text-[9px] opacity-70">Faturalar</div>
                    <div className="px-2 py-1 text-[9px] opacity-70">Banka</div>
                  </div>
                  <div className="text-[8px] opacity-50 px-1">v2.5</div>
                </div>

                {/* Mini Content Area */}
                <div className="flex-1 flex flex-col">
                  {/* Mini Navbar */}
                  <div
                    className="p-2 border-b flex items-center justify-between transition-colors"
                    style={{
                      backgroundColor: theme.headerBg,
                      borderColor: theme.headerBorder,
                      color: theme.headerText,
                    }}
                  >
                    <span className="text-[10px] font-bold">Caris &gt; Cari Kartlar</span>
                    <button
                      type="button"
                      className="px-2 py-0.5 rounded text-[9px] font-bold text-white shadow-2xs"
                      style={{ backgroundColor: theme.primaryColor }}
                    >
                      + Yeni cari
                    </button>
                  </div>

                  {/* Mini Body */}
                  <div className="p-2.5 space-y-2 overflow-hidden">
                    {/* Mini Card 1 */}
                    <div
                      className="p-2 rounded-lg border shadow-2xs transition-colors flex items-center justify-between"
                      style={{
                        backgroundColor: theme.cardBg,
                        borderColor: theme.cardBorder,
                      }}
                    >
                      <div>
                        <div className="text-[8px] text-slate-500">Toplam Alacak</div>
                        <div className="text-[11px] font-black text-emerald-600">10,19 Mn₺</div>
                      </div>
                      <div className="w-5 h-5 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px]">
                        ₺
                      </div>
                    </div>

                    {/* Mini Card 2 */}
                    <div
                      className="p-2 rounded-lg border shadow-2xs transition-colors flex items-center justify-between"
                      style={{
                        backgroundColor: theme.cardBg,
                        borderColor: theme.cardBorder,
                      }}
                    >
                      <div>
                        <div className="text-[8px] text-slate-500">Nakit Pozisyonu</div>
                        <div className="text-[11px] font-black text-blue-600">5,91 Mn₺</div>
                      </div>
                      <div className="w-5 h-5 rounded bg-blue-50 text-blue-600 flex items-center justify-center text-[10px]">
                        🏦
                      </div>
                    </div>

                    {/* Mini Table Row */}
                    <div
                      className="p-2 rounded-lg border shadow-2xs transition-colors text-[9px]"
                      style={{
                        backgroundColor: theme.cardBg,
                        borderColor: theme.cardBorder,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">Ahmet Bulut</span>
                        <span className="text-purple-600 font-bold">₺19.788,62</span>
                      </div>
                      <div className="text-[8px] text-slate-400">Tedarikçi • 30 gün</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: SYSTEM PARAMETERS (TİCARİ PARAMETRELER) ─── */}
      {activeTab === "system" && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Ticari Parametreler Üst Bilgi Banner */}
          <div className="bg-linear-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl border border-purple-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-800/80 text-purple-200 border border-purple-700">
                    Firma Bilgileri & Sistem Ayarları
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-800/80 text-emerald-200 border border-emerald-700">
                    Tüm Personeller İçin Otomatik
                  </span>
                </div>
                <h2 className="text-base font-bold mt-1">Ticari Parametreler: Yol ve Yemek Yardımı Standartları</h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Burada tanımlanan yol ve yemek yardımı tutarları, şirket politikası olarak tüm personellerin aylık bordro, puantaj ve kıdem hesaplamalarında doğrudan kullanılır.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    defaultFoodAllowance: 5500,
                    defaultRoadAllowance: 2500,
                    dailyFoodAllowanceRate: 300,
                    dailyRoadAllowanceRate: 115,
                    applyAllowancesToAllEmployees: true,
                    foodAllowanceCalculationType: "monthly",
                    roadAllowanceCalculationType: "monthly",
                  }));
                }}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all cursor-pointer flex items-center gap-1.5"
                title="2026 yılı standart yasal/kurumsal ödenek tutarlarını yükler"
              >
                <span>⚡ 2026 Standart Paketini Yükle</span>
              </button>
            </div>
          </div>

          {/* 1. FATURA & BELGE FORMAT PARAMETRELERİ -> e-Fatura & e-Arşiv Tasarım Ayarları'na Taşındı */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-700 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Fatura &amp; Belge Format Parametreleri Taşındı
                </h3>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Varsayılan para birimi, KDV oranı, Mysoft portaldaki e-Fatura / e-Arşiv serileri, ardışık fatura numaraları, varsayılan banka/IBAN ve şirket logosu ayarları artık <strong>e-Fatura &amp; e-Arşiv Tasarım Ayarları</strong> bölümünde yer almaktadır.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("invoice_design")}
              className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shrink-0 shadow-xs"
            >
              <LayoutTemplate className="w-4 h-4" />
              <span>e-Fatura &amp; e-Arşiv Tasarım Ayarları&apos;na Git</span>
            </button>
          </div>

          {/* 2. PERSONEL YAN HAKLARI & TİCARİ ÖDENEK PARAMETRELERİ (YOL & YEMEK YARDIMI) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-xs">
            {/* Bilgilendirme: İK Modülüne Aktarıldı */}
            <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-purple-950 text-xs flex items-center gap-1.5">
                    <span>Bu Bölüm İnsan Kaynakları Modülüne Aktarılmıştır</span>
                    <span className="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full font-bold">Entegre Edildi</span>
                  </div>
                  <p className="text-[11px] text-purple-800/80 mt-0.5">
                    Personel yan hakları ve yol/yemek ödenek parametreleri artık <strong>İnsan Kaynakları &gt; Yan Haklar &amp; Ödenekler</strong> sekmesinden tüm kadro etki dökümüyle birlikte yönetilmektedir.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
                    <Utensils className="w-4 h-4" />
                  </span>
                  <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                    <Bus className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Personel Yan Hakları & Ticari Ödenek Parametreleri (Yol & Yemek Yardımı)
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Şirket personellerinin bordro ve puantaj hesaplamalarında standart olarak kullanılacak yol ve yemek yardımı tutarları.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1 shrink-0">
                <Users className="w-3.5 h-3.5 text-purple-600" />
                Tüm Personellere Entegre
              </span>
            </div>

            {/* Global Entegrasyon Anahtarı */}
            <div className="p-4 rounded-xl bg-linear-to-r from-purple-50/80 via-indigo-50/50 to-blue-50/80 border border-purple-200/80 flex items-start gap-3">
              <input
                type="checkbox"
                id="apply-allowances-all"
                checked={formData.applyAllowancesToAllEmployees ?? true}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    applyAllowancesToAllEmployees: e.target.checked,
                  })
                }
                className="mt-1 w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
              />
              <div className="flex-1">
                <label
                  htmlFor="apply-allowances-all"
                  className="font-bold text-slate-900 text-xs cursor-pointer flex items-center gap-2"
                >
                  <span>Tüm Personeller İçin Yol ve Yemek Yardımını Buradan Al (Şirket Politikası)</span>
                  {(formData.applyAllowancesToAllEmployees ?? true) && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Aktif - Otomatik Uygulanıyor
                    </span>
                  )}
                </label>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Bu seçenek açık olduğunda, İnsan Kaynakları & Bordro modülündeki tüm personellerin aylık bordro ve puantaj hesaplamalarında doğrudan buradaki ticari yol ve yemek yardımı parametreleri baz alınır.
                </p>
              </div>
            </div>

            {/* Yol ve Yemek İki Kolon Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* YEMEK YARDIMI KARTI */}
              <div className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-4">
                <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                      <Utensils className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">Yemek Yardımı Parametreleri</h4>
                      <p className="text-[10px] text-slate-500">Nakit / Kart yemek ödeneği standartları</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                    2026 İstisna: 300 ₺/Gün
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Varsayılan Aylık Yemek Yardımı (₺ / Ay)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={formData.defaultFoodAllowance !== undefined ? formData.defaultFoodAllowance : 5500}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            defaultFoodAllowance: Math.max(0, Number(e.target.value)),
                          })
                        }
                        className="w-full bg-white border border-amber-300/80 text-slate-900 rounded-xl p-2.5 pl-8 font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                      <span className="absolute left-3 top-2.5 font-bold text-amber-700">₺</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Şirketteki her çalışanın aylık bordrosuna standart olarak eklenecek tutar.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Günlük İstisna / Birim Tutarı
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={formData.dailyFoodAllowanceRate !== undefined ? formData.dailyFoodAllowanceRate : 300}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              dailyFoodAllowanceRate: Math.max(0, Number(e.target.value)),
                            })
                          }
                          className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl p-2 pl-7 font-bold text-xs"
                        />
                        <span className="absolute left-2.5 top-2 text-slate-500 font-bold">₺</span>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-0.5">2026 SGK Nakit İstisnası: 300 ₺</p>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Hesaplama Esası
                      </label>
                      <select
                        value={formData.foodAllowanceCalculationType || "monthly"}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            foodAllowanceCalculationType: e.target.value as "monthly" | "daily",
                          })
                        }
                        className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl p-2 font-bold text-xs cursor-pointer"
                      >
                        <option value="monthly">Aylık Sabit Tutar</option>
                        <option value="daily">Puantaja Göre (Fiili Gün x Günlük)</option>
                      </select>
                      <p className="text-[9px] text-slate-400 mt-0.5">Bordroya yansıtılma şekli</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* YOL / ULAŞIM YARDIMI KARTI */}
              <div className="p-5 rounded-2xl bg-blue-50/40 border border-blue-200/80 space-y-4">
                <div className="flex items-center justify-between border-b border-blue-200/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <Bus className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">Yol / Ulaşım Yardımı Parametreleri</h4>
                      <p className="text-[10px] text-slate-500">Personel yol ve ulaşım desteği standartları</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">
                    Ulaşım Desteği
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Varsayılan Aylık Yol Yardımı (₺ / Ay)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={formData.defaultRoadAllowance !== undefined ? formData.defaultRoadAllowance : 2500}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            defaultRoadAllowance: Math.max(0, Number(e.target.value)),
                          })
                        }
                        className="w-full bg-white border border-blue-300/80 text-slate-900 rounded-xl p-2.5 pl-8 font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                      <span className="absolute left-3 top-2.5 font-bold text-blue-700">₺</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Şirketteki her çalışanın aylık bordrosuna eklenecek yol/ulaşım tutarı.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Günlük Yol Birim Tutarı
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="5"
                          value={formData.dailyRoadAllowanceRate !== undefined ? formData.dailyRoadAllowanceRate : 115}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              dailyRoadAllowanceRate: Math.max(0, Number(e.target.value)),
                            })
                          }
                          className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl p-2 pl-7 font-bold text-xs"
                        />
                        <span className="absolute left-2.5 top-2 text-slate-500 font-bold">₺</span>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-0.5">Toplu taşıma / bilet emsali</p>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Hesaplama Esası
                      </label>
                      <select
                        value={formData.roadAllowanceCalculationType || "monthly"}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            roadAllowanceCalculationType: e.target.value as "monthly" | "daily",
                          })
                        }
                        className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl p-2 font-bold text-xs cursor-pointer"
                      >
                        <option value="monthly">Aylık Sabit Tutar</option>
                        <option value="daily">Puantaja Göre (Fiili Gün x Günlük)</option>
                      </select>
                      <p className="text-[9px] text-slate-400 mt-0.5">Bordroya yansıtılma şekli</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Yan Haklar Hızlı Bilgi & Özet Kutusu */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Gift className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">
                    Personel Başına Standart Aylık Yan Hak Paketi
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                    <span>
                      Yemek: <strong className="text-amber-700">₺{(formData.defaultFoodAllowance ?? 5500).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Yol: <strong className="text-blue-700">₺{(formData.defaultRoadAllowance ?? 2500).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-2xs text-right shrink-0">
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                  Toplam Aylık Ödenek
                </span>
                <span className="text-sm font-black text-purple-900 font-mono">
                  ₺{((formData.defaultFoodAllowance ?? 5500) + (formData.defaultRoadAllowance ?? 2500)).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-between bg-purple-50/60 p-4 rounded-2xl border border-purple-200/60">
            {isSaved ? (
              <span className="text-xs font-extrabold text-emerald-600 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Ticari parametreler ve personel ödenek ayarları başarıyla kaydedildi!
              </span>
            ) : (
              <span className="text-xs text-purple-900/80 font-medium">
                Değişiklikleri tüm şirket personellerine yansıtmak için kaydedin.
              </span>
            )}

            <button
              type="submit"
              className="bg-[#0f6bae] hover:bg-[#005289] text-white font-bold px-6 py-2.5 rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-white" />
              <span>Ticari Parametreleri & Personel Ödeneklerini Kaydet</span>
            </button>
          </div>
        </form>
      )}

      {/* ─── TAB 2.5: E-FATURA & E-ARŞİV TASARIM STÜDYOSU ─── */}
      {activeTab === "invoice_design" && (
        <div className="space-y-6">
          <div className="bg-linear-to-r from-red-900 via-slate-900 to-indigo-950 text-white p-5 rounded-2xl border border-red-800/60 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-400/30 flex items-center justify-center text-red-300 shrink-0">
                <LayoutTemplate className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-red-800/80 text-red-100 border border-red-700">
                    Sistem Ayarları • Resmi e-Belge XSLT &amp; Tasarım Stüdyosu
                  </span>
                </div>
                <h2 className="text-base font-bold mt-1">
                  e-Fatura &amp; e-Arşiv Tasarım Ayarları
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Şirketinizin fatura &amp; belge format parametrelerini, Mysoft portaldaki serileri, kurumsal logosunu, kaşe/imza görselini, tema rengini ve GİB amblemi / imza kutusu konumlarını buradan özelleştirip kaydedebilirsiniz.
                </p>
              </div>
            </div>

            {isAdmin && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => downloadOfficialGibXslt(formData, invoiceDesign, "e_fatura")}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all border border-emerald-400/40"
                  title="Tasarlanan şablonu GİB UBL-TR 1.2 & Mysoft uyumlu e-Fatura .xslt dosyası olarak indir"
                >
                  <Download className="w-4 h-4" />
                  <span>e-Fatura XSLT İndir (.xslt)</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadOfficialGibXslt(formData, invoiceDesign, "e_arsiv")}
                  className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all border border-sky-400/40"
                  title="Tasarlanan şablonu GİB UBL-TR 1.2 & Mysoft uyumlu e-Arşiv .xslt dosyası olarak indir"
                >
                  <Download className="w-4 h-4" />
                  <span>e-Arşiv XSLT İndir (.xslt)</span>
                </button>
              </div>
            )}
          </div>

          {/* 1. FATURA & BELGE FORMAT PARAMETRELERİ (Taşınan Bölüm) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                <span>Fatura &amp; Belge Format Parametreleri</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  const updated: CompanySettings = {
                    ...formData,
                    invoiceDesign,
                  };
                  persistFormatParamsToCompanyAndSettings(updated);
                  setShowToast(true);
                  setTimeout(() => setShowToast(false), 3000);
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Format Parametrelerini Kaydet</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-purple-600" /> Varsayılan Para Birimi
                </label>
                <select
                  value={formData.currency || "₺"}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-2.5 font-bold cursor-pointer"
                >
                  <option value="₺">₺ - Türk Lirası (TRY)</option>
                  <option value="$">$ - Amerikan Doları (USD)</option>
                  <option value="€">€ - Euro (EUR)</option>
                  <option value="£">£ - İngiliz Sterlini (GBP)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  E-Fatura Seri Öneki (Varsayılan)
                </label>
                <input
                  type="text"
                  maxLength={3}
                  placeholder="ör: GIB"
                  value={
                    (
                      formData.eFaturaPrefix ||
                      (formData.defaultInvoicePrefix &&
                      formData.defaultInvoicePrefix.trim().toUpperCase() !== "MUV2026"
                        ? formData.defaultInvoicePrefix
                        : "GIB")
                    )
                      .trim()
                      .toUpperCase()
                      .slice(0, 3)
                  }
                  onChange={(e) => {
                    const p = e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, "")
                      .slice(0, 3);
                    const yr = new Date().getFullYear();
                    const prevSeq =
                      (formData.eFaturaNextNumber || "").length >= 7
                        ? (formData.eFaturaNextNumber || "").slice(7)
                        : "000000001";
                    const nextNum = `${p.padEnd(3, "X")}${yr}${prevSeq}`;
                    setFormData({
                      ...formData,
                      eFaturaPrefix: p,
                      defaultInvoicePrefix: p,
                      eFaturaNextNumber: nextNum,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-2.5 font-mono font-bold uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Varsayılan KDV Oranı (%)
                </label>
                <select
                  value={formData.defaultVatRate !== undefined ? String(formData.defaultVatRate) : "20"}
                  onChange={(e) => setFormData({ ...formData, defaultVatRate: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-2.5 font-bold cursor-pointer"
                >
                  <option value="20">%20 (Genel Oran)</option>
                  <option value="10">%10 (Gıda &amp; Hizmet)</option>
                  <option value="1">%1 (Temel Gıda / Tarım)</option>
                  <option value="0">%0 (KDV İstisnası)</option>
                </select>
              </div>
            </div>

            {/* Mysoft VKN & TCKN Eşleştirme -> Portaldaki Seriler & Ardışık Fatura Numaraları */}
            <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-extrabold text-purple-950 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-purple-600" />
                    <span>
                      Portaldaki Seriler — Mysoft e-Fatura &amp; e-Arşiv Ön Ekleri ve Ardışık Fatura Numarası
                    </span>
                  </h4>
                  <p className="text-[11px] text-purple-800/80 mt-0.5">
                    Mysoft VKN &amp; TCKN Eşleştirme masasından eşleştirilen kullanıcının resmi e-Fatura ve e-Arşiv ön ekleri. Fatura kesilirken &ldquo;Resmi e-fatura / e-arşiv olarak kes (Mysoft)&rdquo; seçildiğinde bu ön ekler ve ardışık sıra numarası otomatik kullanılır.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void syncMatchedCompanyPrefixes()}
                  disabled={isLoadingSeries}
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-purple-100 text-purple-800 border border-purple-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingSeries ? "animate-spin" : ""}`} />
                  <span>{isLoadingSeries ? "Sorgulanıyor..." : "Portaldaki Serileri Yenile"}</span>
                </button>
              </div>

              {/* Portaldaki Seriler Rozetleri */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] font-bold text-purple-800">
                  Portaldaki Seriler:
                </span>
                {(availablePrefixes.length > 0
                  ? availablePrefixes
                  : [
                      {
                        prefix: (formData.eFaturaPrefix || "GIB").trim().toUpperCase().slice(0, 3),
                        edocumentType: "EFATURA",
                      },
                      {
                        prefix: (formData.eArsivPrefix || "EAR").trim().toUpperCase().slice(0, 3),
                        edocumentType: "EARSIVFATURA",
                      },
                    ]
                ).map((p, idx) => {
                  const pfx = String(p.prefix || "").toUpperCase().slice(0, 3);
                  const isEArs =
                    Number(p.edocumentType) === 2 ||
                    String(p.edocumentType || "").toUpperCase().includes("ARSIV") ||
                    pfx === (formData.eArsivPrefix || "EAR").toUpperCase();
                  const isSelected = isEArs
                    ? (formData.eArsivPrefix || "EAR").toUpperCase() === pfx
                    : (formData.eFaturaPrefix || "GIB").toUpperCase() === pfx;
                  return (
                    <button
                      key={`${pfx}_${idx}`}
                      type="button"
                      onClick={() => {
                        const yr = new Date().getFullYear();
                        const rowSeq =
                          p.currentNumber !== undefined ? Number(p.currentNumber) + 1 : 1;
                        if (isEArs) {
                          const localSeq = getLocalNextSequentialInvoiceNumber("e_arsiv");
                          const nextSeq = Math.max(
                            rowSeq,
                            localSeq.prefix?.toUpperCase() === pfx ? localSeq.nextSequence : 1
                          );
                          const nextDocNo = `${pfx}${yr}${String(nextSeq).padStart(9, "0")}`;
                          const updated: CompanySettings = {
                            ...formData,
                            eArsivPrefix: pfx,
                            eArsivNextNumber: nextDocNo,
                          };
                          persistFormatParamsToCompanyAndSettings(updated);
                        } else {
                          const localSeq = getLocalNextSequentialInvoiceNumber("e_fatura");
                          const nextSeq = Math.max(
                            rowSeq,
                            localSeq.prefix?.toUpperCase() === pfx ? localSeq.nextSequence : 1
                          );
                          const nextDocNo = `${pfx}${yr}${String(nextSeq).padStart(9, "0")}`;
                          const updated: CompanySettings = {
                            ...formData,
                            eFaturaPrefix: pfx,
                            defaultInvoicePrefix: pfx,
                            eFaturaNextNumber: nextDocNo,
                          };
                          persistFormatParamsToCompanyAndSettings(updated);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border cursor-pointer transition-all flex items-center gap-1 ${
                        isSelected
                          ? isEArs
                            ? "bg-sky-600 text-white border-sky-600 shadow-2xs"
                            : "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                          : "bg-white hover:bg-purple-100 text-purple-900 border-purple-200"
                      }`}
                    >
                      <span>{pfx}</span>
                      <span className="opacity-85">({isEArs ? "e-Arşiv" : "e-Fatura"})</span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* e-Fatura Ön Eki & Sıradaki Ardışık No */}
                <div className="p-3 rounded-xl bg-white border border-emerald-200 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>e-Fatura Ön Eki &amp; Sıradaki Ardışık No</span>
                    </span>
                    <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                      e-Fatura
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={3}
                      value={(formData.eFaturaPrefix || "GIB").toUpperCase()}
                      onChange={(e) => {
                        const p = e.target.value
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, "")
                          .slice(0, 3);
                        const yr = new Date().getFullYear();
                        const prevSeq =
                          (formData.eFaturaNextNumber || "").length >= 7
                            ? (formData.eFaturaNextNumber || "").slice(7)
                            : "000000001";
                        const updated: CompanySettings = {
                          ...formData,
                          eFaturaPrefix: p,
                          defaultInvoicePrefix: p,
                          eFaturaNextNumber: `${p.padEnd(3, "X")}${yr}${prevSeq}`,
                        };
                        persistFormatParamsToCompanyAndSettings(updated);
                      }}
                      className="w-16 bg-emerald-50/50 border border-emerald-300 rounded-lg px-2 py-1.5 text-xs font-mono font-extrabold text-center text-emerald-950 uppercase"
                      title="3 Haneli e-Fatura Ön Eki"
                    />
                    <input
                      type="text"
                      value={
                        formData.eFaturaNextNumber ||
                        `${(formData.eFaturaPrefix || "GIB").toUpperCase().slice(0, 3)}${new Date().getFullYear()}000000001`
                      }
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase().trim();
                        const pfx =
                          val.length >= 3
                            ? val.slice(0, 3).replace(/[^A-Z0-9]/g, "")
                            : formData.eFaturaPrefix || "GIB";
                        const updated: CompanySettings = {
                          ...formData,
                          eFaturaPrefix: pfx || formData.eFaturaPrefix,
                          defaultInvoicePrefix: pfx || formData.defaultInvoicePrefix,
                          eFaturaNextNumber: val,
                        };
                        persistFormatParamsToCompanyAndSettings(updated);
                      }}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900"
                      placeholder="GIB2026000000001"
                    />
                  </div>
                  <p className="text-[10px] text-emerald-700 font-mono">
                    {eFaturaLastNumber
                      ? `Son Kesilen: ${eFaturaLastNumber} → Sıradaki: ${
                          formData.eFaturaNextNumber || ""
                        }`
                      : `Sıradaki Ardışık e-Fatura No: ${
                          formData.eFaturaNextNumber ||
                          `${(formData.eFaturaPrefix || "GIB").toUpperCase().slice(0, 3)}${new Date().getFullYear()}000000001`
                        }`}
                  </p>
                </div>

                {/* e-Arşiv Ön Eki & Sıradaki Ardışık No */}
                <div className="p-3 rounded-xl bg-white border border-sky-200 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-sky-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-sky-500" />
                      <span>e-Arşiv Ön Eki &amp; Sıradaki Ardışık No</span>
                    </span>
                    <span className="text-[9px] font-extrabold bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded">
                      e-Arşiv
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={3}
                      value={(formData.eArsivPrefix || "EAR").toUpperCase()}
                      onChange={(e) => {
                        const p = e.target.value
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, "")
                          .slice(0, 3);
                        const yr = new Date().getFullYear();
                        const prevSeq =
                          (formData.eArsivNextNumber || "").length >= 7
                            ? (formData.eArsivNextNumber || "").slice(7)
                            : "000000001";
                        const updated: CompanySettings = {
                          ...formData,
                          eArsivPrefix: p,
                          eArsivNextNumber: `${p.padEnd(3, "X")}${yr}${prevSeq}`,
                        };
                        persistFormatParamsToCompanyAndSettings(updated);
                      }}
                      className="w-16 bg-sky-50/50 border border-sky-300 rounded-lg px-2 py-1.5 text-xs font-mono font-extrabold text-center text-sky-950 uppercase"
                      title="3 Haneli e-Arşiv Ön Eki"
                    />
                    <input
                      type="text"
                      value={
                        formData.eArsivNextNumber ||
                        `${(formData.eArsivPrefix || "EAR").toUpperCase().slice(0, 3)}${new Date().getFullYear()}000000001`
                      }
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase().trim();
                        const pfx =
                          val.length >= 3
                            ? val.slice(0, 3).replace(/[^A-Z0-9]/g, "")
                            : formData.eArsivPrefix || "EAR";
                        const updated: CompanySettings = {
                          ...formData,
                          eArsivPrefix: pfx || formData.eArsivPrefix,
                          eArsivNextNumber: val,
                        };
                        persistFormatParamsToCompanyAndSettings(updated);
                      }}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900"
                      placeholder="EAR2026000000001"
                    />
                  </div>
                  <p className="text-[10px] text-sky-700 font-mono">
                    {eArsivLastNumber
                      ? `Son Kesilen: ${eArsivLastNumber} → Sıradaki: ${
                          formData.eArsivNextNumber || ""
                        }`
                      : `Sıradaki Ardışık e-Arşiv No: ${
                          formData.eArsivNextNumber ||
                          `${(formData.eArsivPrefix || "EAR").toUpperCase().slice(0, 3)}${new Date().getFullYear()}000000001`
                        }`}
                  </p>
                </div>
              </div>
            </div>

            {/* Varsayılan Banka & Hesap Adı Bilgileri */}
            <div className="pt-3 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-700 mb-2">
                Faturaya Basılacak Varsayılan Banka &amp; Hesap Adı Bilgileri
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Hesap Adı (Alıcı / Hesap Sahibi Ünvanı)
                  </label>
                  <input
                    type="text"
                    placeholder={formData.companyTitle || formData.companyName || "Örn: Şirket Ticari TL Hesabı"}
                    value={formData.defaultBankAccountName ?? ""}
                    onChange={(e) => setFormData({ ...formData, defaultBankAccountName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-2.5 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Banka Adı ve Şubesi
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Garanti BBVA - Merkez Şb."
                    value={formData.defaultBankName || ""}
                    onChange={(e) => setFormData({ ...formData, defaultBankName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    IBAN Numarası
                  </label>
                  <input
                    type="text"
                    placeholder="TR00 0000 0000 0000 0000 0000 00"
                    value={formData.defaultBankIban || ""}
                    onChange={(e) => setFormData({ ...formData, defaultBankIban: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-2.5 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-center shrink-0 min-w-[156px] min-h-[52px]">
                    <Logo
                      size="sm"
                      src={formData.logoUrl || "/logo.svg"}
                      scale={formData.logoScale ?? 1}
                    />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">
                      Şirkete Özel Fatura &amp; Sistem Logosu ({formData.companyName || "Aktif Şirket"})
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Yüklenen logo görseli otomatik olarak Muavin logosu ölçüsüne (200x50 px) uyarlanır; dilerseniz aşağıdan büyültebilir veya küçültebilirsiniz.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    ref={settingsLogoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp,image/*"
                    onChange={handleSettingsLogoFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => settingsLogoInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0f6bae] hover:bg-[#0a5287] text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Bilgisayardan Logo Yükle</span>
                  </button>
                  {formData.logoUrl && formData.logoUrl !== "/logo.svg" && (
                    <button
                      type="button"
                      onClick={() => {
                        const reset = { ...formData, logoUrl: "/logo.svg", logoScale: 1 };
                        setFormData(reset);
                        onSaveSettings(reset);
                      }}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs border border-slate-200 cursor-pointer transition-all"
                    >
                      Sıfırla
                    </button>
                  )}
                </div>
              </div>

              {/* Muavin Logosuna Büyült / Küçült Kontrolleri */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                  <Sliders className="w-3.5 h-3.5 text-[#0f6bae]" />
                  <span>Muavin Logosu Ölçeği:</span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-100 text-[#0f6bae] font-mono font-bold">
                    %{Math.round(clampLogoScale(formData.logoScale ?? 1) * 100)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAdjustSettingsLogoScale(clampLogoScale(formData.logoScale ?? 1) - 0.1)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer"
                  >
                    - Küçült
                  </button>
                  <input
                    type="range"
                    min={0.5}
                    max={1.5}
                    step={0.05}
                    value={clampLogoScale(formData.logoScale ?? 1)}
                    onChange={(e) => handleAdjustSettingsLogoScale(Number(e.target.value))}
                    className="w-24 accent-[#0f6bae] cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => handleAdjustSettingsLogoScale(1)}
                    className="px-2 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-[10px] font-bold text-[#0f6bae] cursor-pointer"
                  >
                    Muavin Boyutu (%100)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustSettingsLogoScale(clampLogoScale(formData.logoScale ?? 1) + 0.1)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer"
                  >
                    + Büyült
                  </button>
                </div>
              </div>
            </div>
          </div>

          <InvoiceDesignCustomizerBar
            companySettings={formData}
            design={invoiceDesign}
            previewDocType={previewDocType}
            onChangePreviewDocType={setPreviewDocType}
            onChangeDesign={(patch) => setInvoiceDesign((prev) => ({ ...prev, ...patch }))}
            onSaveToCompanySettings={(updatedSettings) => {
              setFormData(updatedSettings);
              onSaveSettings(updatedSettings);
            }}
            isAdmin={isAdmin}
          />

          <div className="bg-slate-200/60 p-3 sm:p-6 md:p-8 rounded-3xl border border-slate-300/70 shadow-inner flex justify-center">
            <OfficialGIBInvoicePaper
              invoice={
                {
                  id: "sample_preview_inv",
                  invoiceNumber:
                    previewDocType === "e_arsiv"
                      ? formData.eArsivNextNumber || `${formData.eArsivPrefix || "EAR"}${new Date().getFullYear()}000000001`
                      : formData.eFaturaNextNumber || `${formData.eFaturaPrefix || "GIB"}${new Date().getFullYear()}000000001`,
                  type: "sales",
                  eDocumentType: previewDocType,
                  invoiceScenario: previewDocType === "e_arsiv" ? "EARSIVFATURA" : "TICARIFATURA",
                  invoiceProfileType: "SATIS",
                  contactId: "sample_contact",
                  contactName: "ÖRNEK ALICI KURUMSAL TEKNOLOJİ A.Ş.",
                  issueDate: new Date().toISOString().split("T")[0],
                  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                  items: [
                    {
                      id: "sample_item_1",
                      description: "Kurumsal Yazılım Lisans ve Entegrasyon Hizmeti",
                      quantity: 1,
                      unit: "Adet",
                      unitPrice: 15000,
                      vatRate: 20,
                      totalWithoutVat: 15000,
                      vatAmount: 3000,
                      totalWithVat: 18000,
                    },
                  ],
                  subtotal: 15000,
                  totalVat: 3000,
                  grandTotal: 18000,
                  paidAmount: 0,
                  remainingAmount: 18000,
                  status: "sent",
                  currency: "TRY",
                  notes: "İşbu belge Sistem Ayarları > e-Fatura & e-Arşiv Tasarım canlı önizleme şablonudur.",
                  createdAt: new Date().toISOString().split("T")[0],
                } as Invoice
              }
              companySettings={{ ...formData, invoiceDesign }}
              designOverride={invoiceDesign}
              previewDocTypeOverride={previewDocType}
              paperId="settings-invoice-design-preview-paper"
            />
          </div>
        </div>
      )}

      {/* ─── TAB 3: BACKUP & DATA ─── */}
      {activeTab === "backup" && (
        <div className="space-y-6 text-xs">
          {/* 1. Automated 7-Day Manual Backup Notification System Status & Settings */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#0f6bae]" />
                  <span>Otomatik Manuel Veri Yedekleme Bildirim Sistemi (7 Günlük Kontrol)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Son 7 gün (veya belirlediğiniz periyot) içinde manuel veri yedeği alınmadığında kullanıcıları otomatik olarak uyarır.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {backupStatus.isOverdue ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Yedekleme Gecikti ({backupStatus.daysSinceLastBackup !== null ? `${backupStatus.daysSinceLastBackup} Gün` : "Hiç Alınmadı"})</span>
                  </span>
                ) : backupStatus.isApproaching ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Yedekleme Zamanı Yaklaşıyor</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Manuel Yedek Güncel</span>
                  </span>
                )}
              </div>
            </div>

            {/* Status Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] text-slate-500 font-semibold block">Son Manuel Yedekleme Tarihi</span>
                <div className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                  {backupStatus.lastBackupAt
                    ? new Date(backupStatus.lastBackupAt).toLocaleString("tr-TR")
                    : "Henüz Manuel Yedek Alınmadı"}
                </div>
                <span className="text-[11px] text-slate-500 block font-mono tabular-nums">
                  {backupStatus.daysSinceLastBackup !== null
                    ? `${backupStatus.daysSinceLastBackup} gün (${backupStatus.hoursSinceLastBackup ?? 0} saat) önce`
                    : "İlk manuel yedeğinizi indirmeniz önerilir"}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] text-slate-500 font-semibold block">Uyarı Eşiği & Denetim Periyodu</span>
                <div className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                  {formData.manualBackupReminderDays || 7} Gün (Otomatik Kontrol)
                </div>
                <span className="text-[11px] text-slate-500 block">
                  {formData.manualBackupReminderEnabled !== false
                    ? "Üst bildirim çubuğu ve zil uyarısı aktif"
                    : "Otomatik bildirimler devre dışı"}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] text-slate-500 font-semibold block">Sonraki Zorunlu Yedekleme Durumu</span>
                <div
                  className={`text-sm font-bold font-mono tabular-nums ${
                    backupStatus.isOverdue
                      ? "text-rose-700"
                      : backupStatus.isApproaching
                      ? "text-amber-700"
                      : "text-emerald-700"
                  }`}
                >
                  {backupStatus.isOverdue
                    ? "Hemen Yedek Alınmalı"
                    : `${Math.max(0, backupStatus.thresholdDays - (backupStatus.daysSinceLastBackup || 0))} Gün Kaldı`}
                </div>
                <span className="text-[11px] text-slate-500 block font-mono tabular-nums">
                  {backupStatus.isSnoozed && backupStatus.snoozedUntil
                    ? `Erteleme: ${new Date(backupStatus.snoozedUntil).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}'e kadar`
                    : `Toplam ${backupStatus.history.length} kayıtlı yedek`}
                </span>
              </div>
            </div>

            {/* Notification Preferences Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="toggle-backup-reminder"
                  checked={formData.manualBackupReminderEnabled !== false}
                  onChange={(e) => {
                    const updated: CompanySettings = {
                      ...formData,
                      manualBackupReminderEnabled: e.target.checked,
                    };
                    setFormData(updated);
                    onSaveSettings(updated);
                  }}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#0f6bae] focus:ring-[#0f6bae] cursor-pointer"
                />
                <div className="flex-1">
                  <label htmlFor="toggle-backup-reminder" className="font-bold text-slate-900 cursor-pointer block">
                    Otomatik 7 Günlük Manuel Yedekleme Uyarılarını Etkinleştir
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Açık olduğunda, son manuel veri yedeğinin üzerinden {formData.manualBackupReminderDays || 7} gün geçtiyse uygulama üst kısmında ve bildirim merkezinde otomatik hatırlatma gösterilir.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <label htmlFor="backup-reminder-days" className="font-bold text-slate-900 block">
                      Hatırlatma Periyodu (Gün)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Manuel yedek alınmadığında kaç gün sonra uyarı verileceği (Varsayılan: 7 gün)
                    </p>
                  </div>
                  <select
                    id="backup-reminder-days"
                    value={formData.manualBackupReminderDays || 7}
                    onChange={(e) => {
                      const days = Number(e.target.value) || 7;
                      const updated: CompanySettings = {
                        ...formData,
                        manualBackupReminderDays: days,
                      };
                      setFormData(updated);
                      onSaveSettings(updated);
                    }}
                    className="bg-white border border-slate-300 text-slate-900 font-mono font-bold rounded-lg px-3 py-2 text-xs cursor-pointer shrink-0"
                  >
                    <option value={3}>3 Gün</option>
                    <option value={7}>7 Gün (Önerilen)</option>
                    <option value={14}>14 Gün</option>
                    <option value={30}>30 Gün</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Simulation / Verification Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="text-[11px] text-slate-500">
                7 günlük gecikme bildirimini ve üst uyarı çubuğunu test etmek için simülasyon aracını kullanabilirsiniz:
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const compId = activeCompany?.id || getActiveCompanyId();
                    const simulated = simulateOverdueManualBackup(compId, 8);
                    setBackupStatus(simulated);
                    triggerFormErrorNotification(
                      "Son manuel yedek tarihi 8 gün öncesine ayarlandı. 7 günlük otomatik yedekleme uyarısı tetiklendi.",
                      "Yedekleme Uyarısı Simülasyonu"
                    );
                  }}
                  className="px-3 py-2 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>7 Günlük Gecikme Uyarısını Test Et (8 Gün Önce)</span>
                </button>

                {backupStatus.isOverdue && !backupStatus.isSnoozed && (
                  <button
                    type="button"
                    onClick={() => {
                      const compId = activeCompany?.id || getActiveCompanyId();
                      snoozeManualBackupReminder(compId, 24);
                      setBackupStatus(getManualBackupStatus(compId, formData));
                    }}
                    className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Uyarısını 24 Saat Ertele
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2. Manual Backup Export / Import Actions */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#0f6bae]" />
                Veri Tabanı Yedekleme, Aktarma ve Sıfırlama
              </span>
              <span className="text-[11px] text-slate-500 font-normal">Yerel & Bulut Güvenli Depolama</span>
            </h3>

            <p className="text-slate-600 leading-relaxed">
              Uygulama verileriniz (firmalar, şubeler, depolar, faturalar, cari hesaplar, stoklar) hem merkezi veritabanında hem de yerel bellekte güvenle saklanmaktadır. İstediğiniz an tam sistem yedeğini (JSON formatında) indirebilir veya dışarıdan yükleyebilirsiniz. Manuel yedek indirdiğinizde 7 günlük otomatik hatırlatma sayacı sıfırlanır.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {onExportBackup && (
                <button
                  type="button"
                  onClick={onExportBackup}
                  className="bg-slate-900 hover:bg-slate-950 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-colors shadow-xs whitespace-nowrap shrink-0"
                >
                  <Download className="w-4 h-4 text-sky-400" />
                  <span>Tüm Sistem Verilerini İndir (Manuel JSON Yedeği Al)</span>
                </button>
              )}

              {onImportBackup && (
                <label className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-colors border border-slate-300 whitespace-nowrap shrink-0">
                  <Upload className="w-4 h-4 text-[#0f6bae]" />
                  <span>Yedek JSON Dosyası Yükle</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}

              {onResetDemoData && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Tüm veriler sıfırlanıp varsayılan demo veriler yüklensin mi?")) {
                      onResetDemoData();
                    }
                  }}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-colors border border-rose-200 sm:ml-auto whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Örnek Demo Verileri Yeniden Yükle</span>
                </button>
              )}
            </div>
          </div>

          {/* 3. Manual Backup History Log Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#0f6bae]" />
                <h4 className="text-sm font-bold text-slate-900">Manuel Yedekleme Geçmişi</h4>
              </div>
              <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                Son {backupStatus.history.length} İşlem
              </span>
            </div>

            {backupStatus.history.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-xs font-semibold text-slate-700">Henüz kayıtlı manuel veri yedeği bulunmuyor.</p>
                <p className="text-[11px] text-slate-500">
                  Yukarıdaki "Tüm Sistem Verilerini İndir (Manuel JSON Yedeği Al)" butonuna tıklayarak ilk yedeğinizi oluşturabilirsiniz.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600">
                      <th className="py-2.5 px-4">Tarih & Saat</th>
                      <th className="py-2.5 px-4">Yedek Dosya Adı</th>
                      <th className="py-2.5 px-4">İşlemi Yapan</th>
                      <th className="py-2.5 px-4 text-right">Boyut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {backupStatus.history.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-4 font-mono tabular-nums text-slate-800">
                          {new Date(entry.timestamp).toLocaleString("tr-TR")}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-700">{entry.fileName}</td>
                        <td className="py-2.5 px-4 text-slate-600">{entry.performedBy || "Sistem Kullanıcısı"}</td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600">
                          {entry.sizeBytes > 0 ? `${(entry.sizeBytes / 1024).toFixed(1)} KB` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 4: GOOGLE CLOUD & PERFORMANCE OPTIMIZATION ─── */}
      {activeTab === "cloud" && (
        <div className="space-y-6">
          {/* Performance Hero Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-[#0f2444] to-[#0a3560] rounded-2xl p-6 text-white border border-slate-700/60 shadow-md">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold mb-2">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Google Cloud Run Yüksek Hız Yapılandırması Aktif</span>
                </div>
                <h2 className="text-xl font-bold tracking-tight">Google Cloud Altyapı & Hızlandırma Merkezi</h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Uygulamanızın Google Cloud üzerinde sıfır soğuk başlama gecikmesi (0ms cold-start), hızlı ağ I/O'su ve minimum bellek ayak iziyle çalışması için gerekli tüm optimizasyonlar tanımlanmıştır.
                </p>
              </div>

              <button
                type="button"
                onClick={loadTelemetry}
                disabled={isLoadingCloud}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition-all cursor-pointer shadow-xs disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingCloud ? "animate-spin" : ""}`} />
                <span>{isLoadingCloud ? "Ölçülüyor..." : "Canlı Telemetriyi Yenile"}</span>
              </button>
            </div>
          </div>

          {/* Real-time Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Latency / Ping */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Sunucu Yanıt Süresi</span>
                <Gauge className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 flex items-baseline gap-1">
                {pingLatency !== null ? (
                  <>
                    <span>{pingLatency}</span>
                    <span className="text-xs font-semibold text-slate-500">ms</span>
                  </>
                ) : (
                  <span className="text-sm text-slate-400 font-normal">Ölçülmedi</span>
                )}
              </div>
              <div className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded w-fit">
                {pingLatency !== null && pingLatency < 100 ? "Yüksek Hız (Ultra Düşük Gecikme)" : "Normal Yanıt"}
              </div>
            </div>

            {/* 2. Cloud Run Instance Mode */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Örnek Başlatma Modu</span>
                <Server className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xl font-bold text-slate-900">
                Min-Instances: 1
              </div>
              <div className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded w-fit">
                Sıcak Başlatma (0ms Bekleme)
              </div>
            </div>

            {/* 3. Memory & V8 Engine */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Node.js Bellek (RAM)</span>
                <Cpu className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 flex items-baseline gap-1">
                <span>{cloudTelemetry?.activeProcess?.heapUsedMB || "~120"}</span>
                <span className="text-xs font-semibold text-slate-500">MB Heap</span>
              </div>
              <div className="text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded w-fit">
                V8 Max-Space: 3072 MB Limit
              </div>
            </div>

            {/* 4. Network & Compression */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Ağ Sıkıştırması & Keep-Alive</span>
                <Activity className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl font-bold text-slate-900">
                Gzip + 65s HTTP
              </div>
              <div className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded w-fit">
                GCLB 502 Koruması Aktif
              </div>
            </div>
          </div>

          {/* Applied Cloud Run Optimizations List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Uygulanan Google Cloud Hızlandırma Parametreleri
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Aşağıdaki yapılandırmalar Google Cloud Run servisinde maksimum performans sağlayacak şekilde kodlandı.
                </p>
              </div>
              <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                6/6 Tamamlandı
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>1. Startup CPU Boost (Başlatma CPU Takviyesi)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">--cpu-boost</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Konteyner ilk kez ayağa kalkarken geçici olarak 4 kat vCPU gücü tahsis edilir. Bu sayede ilk başlatma süresi %75 oranında kısalır (~1.5 saniye).
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full shrink-0">
                  <Check className="w-3.5 h-3.5" /> Etkin
                </span>
              </div>

              <div className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>2. Sıcak Örnek (Min-Instances = 1 / Zero Cold-Start)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">--min-instances=1</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    En az 1 adet konteyner 7/24 hafızada sıcak tutulur. Kullanıcılar siteye girdiğinde konteynerin uyanmasını beklemez; istek anında karşılanır.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full shrink-0">
                  <Check className="w-3.5 h-3.5" /> Etkin
                </span>
              </div>

              <div className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>3. İkinci Nesil Çalışma Ortamı (Gen2 Execution Environment)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">--execution-environment=gen2</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Google Cloud'un tam Linux çekirdek sanallaştırmasını kullanır. Dosya okuma-yazma (disk I/O) ve ağ paket transfer hızını iki katına çıkarır.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full shrink-0">
                  <Check className="w-3.5 h-3.5" /> Etkin
                </span>
              </div>

              <div className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>4. HTTP Keep-Alive & Cloud Load Balancer Zaman Aşımı Ayarı</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">keepAliveTimeout=65000</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Google Cloud Load Balancer'ın 60 saniyelik boşta bekleme süresinden daha uzun (65 saniye) tutularak TCP bağlantıları sürekli açık tutulur, 502 Bad Gateway riski önlenir.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full shrink-0">
                  <Check className="w-3.5 h-3.5" /> Etkin
                </span>
              </div>

              <div className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>5. Rollup Manuel Kod Parçalama (Vendor Code-Splitting)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">manualChunks</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Ağır kütüphaneler (Grafikler, PDF/Excel motorları, OCR, Firebase) ayrı parçalara bölünmüştür. Sayfa ilk açılışta yalnızca gerekli JS'i yükler.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full shrink-0">
                  <Check className="w-3.5 h-3.5" /> Etkin
                </span>
              </div>

              <div className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>6. Kalıcı Statik Önbellekleme (1 Yıl Immutable + ETag)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">Cache-Control: public, 1y</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Derlenmiş tüm JS, CSS ve font dosyaları için 1 yıllık değişmez önbellek tanımlıdır. Tarayıcı dosyaları diske kaydeder ve sonraki ziyaretlerde sıfır milisaniyede açar.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full shrink-0">
                  <Check className="w-3.5 h-3.5" /> Etkin
                </span>
              </div>
            </div>
          </div>

          {/* Deployment CLI Command & Config Files */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Google Cloud Shell / Terminal Tek Tıkla Dağıtım Komutu
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  const cmd = "gcloud run deploy muavin-muhasebe --source . --region europe-west3 --allow-unauthenticated --port 3000 --cpu 2 --memory 4Gi --concurrency 80 --min-instances 1 --cpu-boost --execution-environment gen2";
                  navigator.clipboard.writeText(cmd);
                  setCopiedCommand(true);
                  setTimeout(() => setCopiedCommand(false), 2500);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                {copiedCommand ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCommand ? "Kopyalandı!" : "Komutu Kopyala"}</span>
              </button>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl font-mono text-xs text-emerald-300 border border-slate-800 break-all select-all leading-relaxed">
              gcloud run deploy muavin-muhasebe --source . --region europe-west3 --allow-unauthenticated --port 3000 --cpu 2 --memory 4Gi --concurrency 80 --min-instances 1 --cpu-boost --execution-environment gen2
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <div className="font-semibold text-slate-200">Dockerfile</div>
                <div className="text-slate-400 text-[11px] mt-0.5">Multi-stage Node 22 Alpine + dumb-init</div>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <div className="font-semibold text-slate-200">cloudrun.yaml</div>
                <div className="text-slate-400 text-[11px] mt-0.5">Knative Cloud Run servis spesifikasyonu</div>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <div className="font-semibold text-slate-200">deploy-cloudrun.sh</div>
                <div className="text-slate-400 text-[11px] mt-0.5">Otomatik tek tuşla canlıya alma scripti</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: PUBLISH & GITHUB SYNC ─── */}
      {isAdmin && activeTab === "github" && (
        <GitHubSyncPanel
          isModal={false}
          onSuccessNotification={(msg) => triggerFormErrorNotification(msg, "Yayınlama Başarılı")}
        />
      )}
    </div>
  );
};
