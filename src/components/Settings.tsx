import React, { useState } from "react";
import {
  CompanySettings,
  CompanyItem,
  Invoice,
  InvoiceDesignSettings,
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
  validateSequentialInvoiceNumber,
} from "../services/mysoftEDocumentService";
import {
  OfficialGIBInvoicePaper,
  InvoiceDesignCustomizerBar,
  downloadOfficialGibXslt,
  resolveInvoiceDesignSettings,
  resolveInvoiceLogoDimensions,
  saveCompanyInvoiceCssToFirestore,
  getIndependentInvoiceCssConfig,
} from "./OfficialGIBInvoicePaper";
import {
  GIB_OFFICIAL_UPLOADED_QR_CODE_DATA_URI,
  GIB_OFFICIAL_UPLOADED_QR_CODE_PATH,
} from "../utils/gibOfficialAssets";

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
  const [invoiceDesign, setInvoiceDesign] = useState<InvoiceDesignSettings>(() => ({
    ...resolveInvoiceDesignSettings(settings),
  }));
  const [previewDocType, setPreviewDocType] = useState<"auto" | "e_fatura" | "e_arsiv">("e_fatura");
  const [backupStatus, setBackupStatus] = useState<ManualBackupStatus>(() =>
    getManualBackupStatus(activeCompany?.id || getActiveCompanyId(), settings)
  );

  React.useEffect(() => {
    if (initialTab) {
      if (initialTab === "github" && !isAdmin) return;
      setActiveTab(initialTab);
    }
  }, [initialTab, isAdmin]);

  const lastSettingsRef = React.useRef<string>("");
  React.useEffect(() => {
    const sStr = JSON.stringify(settings || {});
    if (lastSettingsRef.current !== sStr) {
      lastSettingsRef.current = sStr;
      setFormData(settings);
      setInvoiceDesign(resolveInvoiceDesignSettings(settings));
      setBackupStatus((prev) => {
        const next = getManualBackupStatus(activeCompany?.id || getActiveCompanyId(), settings);
        return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
      });
    }
  }, [settings, activeCompany?.id]);

  React.useEffect(() => {
    const refresh = () => {
      setBackupStatus((prev) => {
        const next = getManualBackupStatus(activeCompany?.id || getActiveCompanyId(), formData);
        return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
      });
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
    Array<{
      prefix: string;
      edocumentType?: string | number;
      year?: number;
      currentNumber?: number;
      lastNumber?: string;
      nextNumber?: string;
    }>
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

      if (cleanVkn.length !== 10 && cleanVkn.length !== 11) {
        setAvailablePrefixes([]);
        setEFaturaLastNumber("");
        setEArsivLastNumber("");
        return;
      }

      setIsLoadingSeries(true);
      try {
        const defaults = await getMysoftMappingDefaults(cleanVkn);
        const mysoftPrefixes = (defaults?.prefixes || [])
          .filter((b) => typeof b.prefix === "string" && b.prefix.trim().length > 0)
          .map((b) => {
            const pfx = String(b.prefix || "").trim().toUpperCase().slice(0, 3);
            const curNum = Number(b.currentNumber ?? 0) || 0;
            const lastNo =
              (b as any).lastNumber ||
              (curNum > 0 ? `${pfx}${currentYear}${String(curNum).padStart(9, "0")}` : undefined);
            const nextNo =
              (b as any).nextNumber ||
              `${pfx}${currentYear}${String(curNum + 1).padStart(9, "0")}`;
            return {
              prefix: pfx,
              edocumentType: b.edocumentType,
              year: (b as any).year || currentYear,
              currentNumber: curNum,
              lastNumber: lastNo,
              nextNumber: nextNo,
            };
          });

        setAvailablePrefixes(mysoftPrefixes);

        const efatRow =
          mysoftPrefixes.find(
            (p) =>
              Number(p.edocumentType) !== 2 &&
              !String(p.edocumentType || "").toUpperCase().includes("ARSIV"),
          ) || mysoftPrefixes[0];
        const earsRow = mysoftPrefixes.find(
          (p) =>
            Number(p.edocumentType) === 2 ||
            String(p.edocumentType || "").toUpperCase().includes("ARSIV"),
        );

        const resolvedEFatPrefix = efatRow?.prefix || defaults?.eFaturaPrefix || "";
        const finalEFatNextNo = efatRow?.nextNumber || defaults?.eFaturaNextNumber || "";
        const finalEFatLastNo = efatRow?.lastNumber || defaults?.eFaturaLastNumber || "";

        const resolvedEArsPrefix = earsRow?.prefix || defaults?.eArsivPrefix || "";
        const finalEArsNextNo = earsRow?.nextNumber || defaults?.eArsivNextNumber || "";
        const finalEArsLastNo = earsRow?.lastNumber || defaults?.eArsivLastNumber || "";

        setEFaturaLastNumber(finalEFatLastNo);
        setEArsivLastNumber(finalEArsLastNo);

        if (resolvedEFatPrefix || resolvedEArsPrefix) {
          setFormData((prev) => ({
            ...prev,
            ...(resolvedEFatPrefix
              ? {
                  eFaturaPrefix: resolvedEFatPrefix,
                  eFaturaNextNumber: finalEFatNextNo,
                  defaultInvoicePrefix: resolvedEFatPrefix,
                }
              : {}),
            ...(resolvedEArsPrefix
              ? {
                  eArsivPrefix: resolvedEArsPrefix,
                  eArsivNextNumber: finalEArsNextNo,
                }
              : {}),
          }));
        }
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
      activeCompany?.id,
      activeCompany?.tenantIdentifierNumber,
      activeCompany?.vkn,
      activeCompany?.tckn,
      activeCompany?.taxNumber,
    ]
  );

  React.useEffect(() => {
    void syncMatchedCompanyPrefixes();
  }, [activeCompany?.id]);

  const samplePreviewInvoice = React.useMemo<Invoice>(() => {
    const currentYear = new Date().getFullYear();
    const invNo =
      previewDocType === "e_arsiv"
        ? formData.eArsivNextNumber || `${formData.eArsivPrefix || "EAR"}${currentYear}000000001`
        : formData.eFaturaNextNumber || `${formData.eFaturaPrefix || "GIB"}${currentYear}000000001`;
    return {
      id: "sample_preview_inv",
      invoiceNumber: invNo,
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
      notes: "",
      createdAt: new Date().toISOString().split("T")[0],
    };
  }, [
    previewDocType,
    formData.eArsivNextNumber,
    formData.eArsivPrefix,
    formData.eFaturaNextNumber,
    formData.eFaturaPrefix,
  ]);

  const previewCompanySettings = React.useMemo(
    () => ({ ...formData, invoiceDesign }),
    [formData, invoiceDesign]
  );

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
                  setIsSaved(true);
                  setTimeout(() => setIsSaved(false), 3000);
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
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="block font-bold text-slate-700">
                    E-Fatura Seri Öneki (Varsayılan)
                  </label>
                  <button
                    type="button"
                    onClick={() => void syncMatchedCompanyPrefixes()}
                    disabled={isLoadingSeries}
                    className="px-2 py-0.5 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                    title="Mysoft'tan Serileri ve Numaraları Yenile"
                  >
                    <RefreshCw className={`w-2.5 h-2.5 ${isLoadingSeries ? "animate-spin" : ""}`} />
                    <span>{isLoadingSeries ? "Çekiliyor..." : "Mysoft'tan Çek"}</span>
                  </button>
                </div>

                {availablePrefixes.length > 0 ? (
                  (() => {
                    const currentYear = new Date().getFullYear();
                    const activeDefaultPfx = String(
                      formData.defaultInvoicePrefix || formData.eFaturaPrefix || "",
                    )
                      .trim()
                      .toUpperCase()
                      .slice(0, 3);
                    const selectedPfx = availablePrefixes.some(
                      (p) =>
                        String(p.prefix || "").toUpperCase() ===
                        String(formData.eFaturaPrefix || "").toUpperCase(),
                    )
                      ? String(formData.eFaturaPrefix || "").toUpperCase()
                      : String(availablePrefixes[0]?.prefix || "").toUpperCase();

                    const activeSeriesRow =
                      availablePrefixes.find(
                        (p) => String(p.prefix || "").toUpperCase() === selectedPfx,
                      ) || availablePrefixes[0];

                    const activeIsEArs =
                      Number(activeSeriesRow?.edocumentType) === 2 ||
                      String(activeSeriesRow?.edocumentType || "")
                        .toUpperCase()
                        .includes("ARSIV");
                    const activeCurNum =
                      activeSeriesRow?.currentNumber !== undefined
                        ? Number(activeSeriesRow.currentNumber)
                        : 0;
                    const activeYr = activeSeriesRow?.year || currentYear;
                    const activeLastNo =
                      activeSeriesRow?.lastNumber ||
                      (activeCurNum > 0
                        ? `${selectedPfx}${activeYr}${String(activeCurNum).padStart(9, "0")}`
                        : activeIsEArs
                          ? eArsivLastNumber
                          : eFaturaLastNumber);
                    const activeExpectedNextNo =
                      activeSeriesRow?.nextNumber ||
                      `${selectedPfx}${activeYr}${String(activeCurNum + 1).padStart(9, "0")}`;
                    const currentEnteredNextNo = activeIsEArs
                      ? formData.eArsivNextNumber || activeExpectedNextNo
                      : formData.eFaturaNextNumber || activeExpectedNextNo;

                    const seqCheck = validateSequentialInvoiceNumber({
                      enteredNumber: currentEnteredNextNo,
                      expectedPrefix: selectedPfx,
                      lastUsedNumber: activeLastNo,
                      lastUsedSequence: activeCurNum,
                      year: activeYr,
                    });

                    const isMarkedDefault =
                      activeDefaultPfx === selectedPfx &&
                      String(formData.eFaturaPrefix || "").toUpperCase() === selectedPfx;

                    const applySeriesSelection = (
                      p: (typeof availablePrefixes)[number],
                      markAsDefault = true,
                    ) => {
                      const pfx = String(p.prefix || "").toUpperCase().slice(0, 3);
                      const yr = p.year || currentYear;
                      const rowCur = p.currentNumber !== undefined ? Number(p.currentNumber) : 0;
                      const nextDocNo =
                        p.nextNumber || `${pfx}${yr}${String(rowCur + 1).padStart(9, "0")}`;
                      const lastDocNo =
                        p.lastNumber ||
                        (rowCur > 0 ? `${pfx}${yr}${String(rowCur).padStart(9, "0")}` : "");
                      const isEArs =
                        Number(p.edocumentType) === 2 ||
                        String(p.edocumentType || "").toUpperCase().includes("ARSIV");

                      if (isEArs) {
                        setEArsivLastNumber(lastDocNo);
                        const updated: CompanySettings = {
                          ...formData,
                          eArsivPrefix: pfx,
                          eArsivNextNumber: nextDocNo,
                          ...(markAsDefault
                            ? {
                                eFaturaPrefix: pfx,
                                defaultInvoicePrefix: pfx,
                                eFaturaNextNumber: nextDocNo,
                              }
                            : {}),
                        };
                        persistFormatParamsToCompanyAndSettings(updated);
                      } else {
                        setEFaturaLastNumber(lastDocNo);
                        const updated: CompanySettings = {
                          ...formData,
                          eFaturaPrefix: pfx,
                          ...(markAsDefault ? { defaultInvoicePrefix: pfx } : {}),
                          eFaturaNextNumber: nextDocNo,
                        };
                        persistFormatParamsToCompanyAndSettings(updated);
                      }
                    };

                    return (
                      <div className="space-y-2.5">
                        {/* Seri Seçim Kutusu + Aktif Seriyi Varsayılan Olarak İşaretle */}
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedPfx}
                            onChange={(e) => {
                              const pfx = e.target.value.toUpperCase().slice(0, 3);
                              const chosen = availablePrefixes.find(
                                (p) => String(p.prefix || "").toUpperCase() === pfx,
                              );
                              if (chosen) applySeriesSelection(chosen, true);
                            }}
                            className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-2.5 font-mono font-bold cursor-pointer"
                          >
                            {availablePrefixes.map((p, idx) => {
                              const pfx = String(p.prefix || "").toUpperCase().slice(0, 3);
                              const yr = p.year || currentYear;
                              const curNum =
                                p.currentNumber !== undefined ? Number(p.currentNumber) : 0;
                              const nextNo =
                                p.nextNumber || `${pfx}${yr}${String(curNum + 1).padStart(9, "0")}`;
                              const lastNo =
                                p.lastNumber ||
                                (curNum > 0 ? `${pfx}${yr}${String(curNum).padStart(9, "0")}` : "");
                              const isEArs =
                                Number(p.edocumentType) === 2 ||
                                String(p.edocumentType || "").toUpperCase().includes("ARSIV");
                              const isDef = activeDefaultPfx === pfx;
                              return (
                                <option key={`${pfx}_${idx}`} value={pfx}>
                                  {pfx} ({isEArs ? "e-Arşiv" : "e-Fatura"})
                                  {isDef ? " [VARSAYILAN]" : ""} — Sıradaki: {nextNo}
                                  {lastNo ? ` | Son: ${lastNo}` : ""}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {/* Aktif Seriyi 'Varsayılan' Olarak İşaretleme Seçim Alanı */}
                        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-purple-50/70 border border-purple-200">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isMarkedDefault}
                              onChange={() => {
                                if (activeSeriesRow) {
                                  applySeriesSelection(activeSeriesRow, true);
                                }
                              }}
                              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                            />
                            <span className="text-[11px] font-bold text-purple-950">
                              Aktif Seriyi ({selectedPfx}) &lsquo;Varsayılan&rsquo; Olarak İşaretle
                            </span>
                          </label>
                          {isMarkedDefault ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold flex items-center gap-1 shrink-0">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Varsayılan Seri
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (activeSeriesRow) {
                                  applySeriesSelection(activeSeriesRow, true);
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold cursor-pointer transition-all shrink-0"
                            >
                              Varsayılan Yap
                            </button>
                          )}
                        </div>

                        {/* Mevcut Mysoft Serileri ve Numaraları Listesi + Varsayılan Seçimi */}
                        <div className="space-y-1">
                          {availablePrefixes.map((p, idx) => {
                            const pfx = String(p.prefix || "").toUpperCase().slice(0, 3);
                            const yr = p.year || currentYear;
                            const curNum =
                              p.currentNumber !== undefined ? Number(p.currentNumber) : 0;
                            const nextNo =
                              p.nextNumber || `${pfx}${yr}${String(curNum + 1).padStart(9, "0")}`;
                            const lastNo =
                              p.lastNumber ||
                              (curNum > 0 ? `${pfx}${yr}${String(curNum).padStart(9, "0")}` : "");
                            const isEArs =
                              Number(p.edocumentType) === 2 ||
                              String(p.edocumentType || "").toUpperCase().includes("ARSIV");
                            const isDefaultRow = activeDefaultPfx === pfx;
                            return (
                              <div
                                key={`row_${pfx}_${idx}`}
                                onClick={() => applySeriesSelection(p, true)}
                                className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-mono flex items-center justify-between gap-2 cursor-pointer transition-all ${
                                  isDefaultRow
                                    ? "bg-purple-50 border-purple-400 text-purple-950 font-bold shadow-2xs"
                                    : "bg-slate-50 hover:bg-purple-50/50 border-slate-200 text-slate-700"
                                }`}
                              >
                                <div className="flex items-center gap-1.5 min-w-0 truncate">
                                  <input
                                    type="radio"
                                    name="default_mysoft_invoice_series"
                                    checked={isDefaultRow}
                                    onChange={() => applySeriesSelection(p, true)}
                                    className="w-3.5 h-3.5 text-purple-600 focus:ring-purple-500 cursor-pointer shrink-0"
                                  />
                                  <span className="px-1.5 py-0.5 rounded bg-purple-600 text-white font-extrabold">
                                    {pfx}
                                  </span>
                                  <span className="text-slate-500 font-sans font-semibold">
                                    ({isEArs ? "e-Arşiv" : "e-Fatura"})
                                  </span>
                                  <span className="truncate">
                                    Son: <strong>{lastNo || "Yok"}</strong> → Sıradaki:{" "}
                                    <strong className="text-purple-700">{nextNo}</strong>
                                  </span>
                                </div>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-sans font-extrabold shrink-0 ${
                                    isDefaultRow
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                      : "bg-white text-slate-600 border border-slate-200"
                                  }`}
                                >
                                  {isDefaultRow ? "Varsayılan ✓" : "Varsayılan Seç"}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* E-Fatura Seri Numarası Girişi & Sıralı Numara Kontrolü Uyarısı */}
                        <div className="pt-1 space-y-1.5">
                          <div className="flex items-center justify-between gap-1">
                            <label className="text-[11px] font-bold text-slate-700">
                              Sıradaki E-Fatura Seri Numarası ({selectedPfx})
                            </label>
                            <span className="text-[10px] font-mono text-slate-500">
                              Mysoft Son No: <strong>{activeLastNo || "Henüz kesilmedi (0)"}</strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              maxLength={16}
                              value={currentEnteredNextNo}
                              onChange={(e) => {
                                const val = e.target.value.toUpperCase().trim();
                                const updated: CompanySettings = activeIsEArs
                                  ? {
                                      ...formData,
                                      eArsivNextNumber: val,
                                      ...(isMarkedDefault ? { eFaturaNextNumber: val } : {}),
                                    }
                                  : {
                                      ...formData,
                                      eFaturaNextNumber: val,
                                    };
                                persistFormatParamsToCompanyAndSettings(updated);
                              }}
                              placeholder={activeExpectedNextNo}
                              className={`flex-1 rounded-xl px-2.5 py-2 font-mono text-xs font-bold border transition-all ${
                                seqCheck.status === "collision" ||
                                seqCheck.status === "invalid_format" ||
                                seqCheck.status === "prefix_mismatch"
                                  ? "bg-red-50/70 border-red-400 text-red-950 focus:ring-red-500"
                                  : seqCheck.status === "gap"
                                    ? "bg-amber-50/70 border-amber-400 text-amber-950 focus:ring-amber-500"
                                    : "bg-slate-50 border-slate-200 text-slate-900"
                              }`}
                            />
                            {seqCheck.hasWarning && seqCheck.expectedNextNumber && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated: CompanySettings = activeIsEArs
                                    ? {
                                        ...formData,
                                        eArsivNextNumber: seqCheck.expectedNextNumber,
                                        ...(isMarkedDefault
                                          ? { eFaturaNextNumber: seqCheck.expectedNextNumber }
                                          : {}),
                                      }
                                    : {
                                        ...formData,
                                        eFaturaNextNumber: seqCheck.expectedNextNumber,
                                      };
                                  persistFormatParamsToCompanyAndSettings(updated);
                                }}
                                className="px-2.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold cursor-pointer shrink-0 transition-all"
                                title="Mysoft en son kullanılan numaraya göre çakışmayan ardışık numarayı ata"
                              >
                                Sıradaki No Ata
                              </button>
                            )}
                          </div>

                          {/* Sıralı Numara Kontrolü Uyarısı / Durumu */}
                          <div
                            className={`p-2.5 rounded-xl border text-[10px] flex items-start gap-2 ${
                              seqCheck.status === "collision" ||
                              seqCheck.status === "invalid_format" ||
                              seqCheck.status === "prefix_mismatch"
                                ? "bg-red-50 border-red-200 text-red-900"
                                : seqCheck.status === "gap"
                                  ? "bg-amber-50 border-amber-200 text-amber-900"
                                  : "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                            }`}
                          >
                            {seqCheck.hasWarning ? (
                              <AlertTriangle
                                className={`w-4 h-4 shrink-0 mt-0.5 ${
                                  seqCheck.status === "gap" ? "text-amber-600" : "text-red-600"
                                }`}
                              />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            )}
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <div className="font-extrabold">{seqCheck.title}</div>
                              <p className="leading-relaxed">{seqCheck.message}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="w-full bg-slate-50 border border-slate-200 text-slate-500 rounded-xl p-2.5 text-[11px] font-medium">
                    {isLoadingSeries
                      ? "Mysoft'tan seriler ve numaralar çekiliyor..."
                      : "Mysoft'tan tanımlı seri bulunamadı."}
                  </div>
                )}
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
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 flex flex-col items-center justify-center gap-2 shrink-0 min-w-[130px]">
                    <div
                      className="border border-slate-300 p-1 bg-white rounded shadow-2xs flex flex-col items-center"
                      style={{ width: "108px", height: "108px", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <img
                        src={GIB_OFFICIAL_UPLOADED_QR_CODE_PATH}
                        onError={(e) => {
                          if (e.currentTarget.src !== GIB_OFFICIAL_UPLOADED_QR_CODE_DATA_URI) {
                            e.currentTarget.src = GIB_OFFICIAL_UPLOADED_QR_CODE_DATA_URI;
                          }
                        }}
                        alt="GİB Karekod Şablonu"
                        style={{ width: "100px", height: "100px" }}
                        className="w-[100px] h-[100px] object-contain block shrink-0"
                      />
                    </div>
                    {formData.logoUrl && formData.logoUrl !== "/logo.svg" ? (
                      <img
                        src={formData.logoUrl}
                        alt={formData.companyName || "Firma Logosu"}
                        style={{
                          width: `${Math.min(180, resolveInvoiceLogoDimensions(invoiceDesign).widthPx)}px`,
                          height: `${Math.min(90, resolveInvoiceLogoDimensions(invoiceDesign).heightPx)}px`,
                          objectFit: resolveInvoiceLogoDimensions(invoiceDesign).objectFit,
                        }}
                        className="max-w-full"
                      />
                    ) : (
                      <Logo
                        size="sm"
                        src={formData.logoUrl || "/logo.svg"}
                        scale={formData.logoScale ?? 1}
                      />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">
                      QR Kod Altında Şirket Logosu &amp; Karekod Şablonu ({formData.companyName || "Aktif Şirket"})
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      e-Fatura ve e-Arşiv belgelerinde sağ üst köşede yüklediğiniz QR kod şablonu yer alır, şirket logosu doğrudan QR kodun altında gösterilir.
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

              {/* Fatura Logosu Özel Boyutlandırma (Genişlik px × Yükseklik px) */}
              {(() => {
                const currentDims = resolveInvoiceLogoDimensions(invoiceDesign);
                const applyInvoiceLogoDims = (patch: Partial<InvoiceDesignSettings>) => {
                  const nextDesign: InvoiceDesignSettings = {
                    ...invoiceDesign,
                    ...patch,
                    showCompanyLogo: true,
                  };
                  setInvoiceDesign(nextDesign);
                  const nextSettings: CompanySettings = {
                    ...formData,
                    invoiceDesign: nextDesign,
                  };
                  setFormData(nextSettings);
                  onSaveSettings(nextSettings);
                  void saveCompanyInvoiceCssToFirestore(
                    nextSettings,
                    getIndependentInvoiceCssConfig(nextDesign.cssConfig, nextSettings.id),
                    nextDesign
                  );
                };

                return (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-800">
                        <Sliders className="w-3.5 h-3.5 text-[#0f6bae]" />
                        <span>Fatura Logosu Boyutu (Genişlik × Yükseklik):</span>
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-[#0f6bae] font-mono font-extrabold">
                          {currentDims.widthPx} px × {currentDims.heightPx} px
                        </span>
                      </div>

                      {/* Hazır Boyut Şablonları */}
                      <div className="flex flex-wrap items-center gap-1">
                        {(
                          [
                            { label: "Küçük (80×60)", w: 80, h: 60, sz: "sm" as const },
                            { label: "Kare / QR Boyu (100×100)", w: 100, h: 100, sz: "md" as const },
                            { label: "Kaşe Genişliği (170×80)", w: 170, h: 80, sz: "lg" as const },
                            { label: "Yatay (200×65)", w: 200, h: 65, sz: "lg" as const },
                            { label: "Büyük (220×100)", w: 220, h: 100, sz: "lg" as const },
                          ] as const
                        ).map((preset) => {
                          const isActive =
                            currentDims.widthPx === preset.w && currentDims.heightPx === preset.h;
                          return (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() =>
                                applyInvoiceLogoDims({
                                  logoSize: preset.sz,
                                  logoWidth: preset.w,
                                  logoHeight: preset.h,
                                })
                              }
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition-all ${
                                isActive
                                  ? "bg-[#0f6bae] text-white border-[#0f6bae] shadow-2xs"
                                  : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      {/* 1. Genişlik (Width px) */}
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-700">Logo Genişliği (Width):</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                applyInvoiceLogoDims({
                                  logoWidth: Math.max(24, currentDims.widthPx - 5),
                                })
                              }
                              className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={24}
                              max={340}
                              value={currentDims.widthPx}
                              onChange={(e) =>
                                applyInvoiceLogoDims({
                                  logoWidth: Math.min(340, Math.max(24, Number(e.target.value) || 100)),
                                })
                              }
                              className="w-16 bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-right font-mono font-bold text-xs text-slate-900"
                            />
                            <span className="text-[10px] font-mono text-slate-500">px</span>
                            <button
                              type="button"
                              onClick={() =>
                                applyInvoiceLogoDims({
                                  logoWidth: Math.min(340, currentDims.widthPx + 5),
                                })
                              }
                              className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={24}
                          max={340}
                          step={2}
                          value={currentDims.widthPx}
                          onChange={(e) =>
                            applyInvoiceLogoDims({ logoWidth: Number(e.target.value) || 100 })
                          }
                          className="w-full accent-[#0f6bae] cursor-pointer"
                        />
                      </div>

                      {/* 2. Yükseklik (Height px) */}
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-700">Logo Yüksekliği (Height):</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                applyInvoiceLogoDims({
                                  logoHeight: Math.max(20, currentDims.heightPx - 5),
                                })
                              }
                              className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={20}
                              max={240}
                              value={currentDims.heightPx}
                              onChange={(e) =>
                                applyInvoiceLogoDims({
                                  logoHeight: Math.min(240, Math.max(20, Number(e.target.value) || 100)),
                                })
                              }
                              className="w-16 bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-right font-mono font-bold text-xs text-slate-900"
                            />
                            <span className="text-[10px] font-mono text-slate-500">px</span>
                            <button
                              type="button"
                              onClick={() =>
                                applyInvoiceLogoDims({
                                  logoHeight: Math.min(240, currentDims.heightPx + 5),
                                })
                              }
                              className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={20}
                          max={240}
                          step={2}
                          value={currentDims.heightPx}
                          onChange={(e) =>
                            applyInvoiceLogoDims({ logoHeight: Number(e.target.value) || 100 })
                          }
                          className="w-full accent-[#0f6bae] cursor-pointer"
                        />
                      </div>

                      {/* 3. Görsel Sığdırma & Sistem Menü Ölçeği */}
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex flex-col justify-between space-y-2">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-bold text-slate-700">Sığdırma:</span>
                          <div className="inline-flex bg-slate-100 rounded-lg border border-slate-200 p-0.5">
                            {(
                              [
                                { id: "contain", label: "Oranı Koru" },
                                { id: "fill", label: "Tam Doldur" },
                                { id: "cover", label: "Kırp" },
                              ] as const
                            ).map((fit) => (
                              <button
                                key={fit.id}
                                type="button"
                                onClick={() => applyInvoiceLogoDims({ logoObjectFit: fit.id })}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                  currentDims.objectFit === fit.id
                                    ? "bg-[#0f6bae] text-white"
                                    : "text-slate-600 hover:text-slate-900"
                                }`}
                              >
                                {fit.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                          <span className="text-[10.5px] font-semibold text-slate-600">
                            Üst Menü Ölçeği (%{Math.round(clampLogoScale(formData.logoScale ?? 1) * 100)}):
                          </span>
                          <input
                            type="range"
                            min={0.5}
                            max={1.8}
                            step={0.05}
                            value={clampLogoScale(formData.logoScale ?? 1)}
                            onChange={(e) => handleAdjustSettingsLogoScale(Number(e.target.value))}
                            className="w-24 accent-[#0f6bae] cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          <InvoiceDesignCustomizerBar
            companySettings={formData}
            design={invoiceDesign}
            previewDocType={previewDocType}
            onChangePreviewDocType={setPreviewDocType}
            onChangeDesign={(patch) => {
              const nextDesign = { ...invoiceDesign, ...patch };
              if (JSON.stringify(invoiceDesign) === JSON.stringify(nextDesign)) return;
              setInvoiceDesign(nextDesign);
              const nextSettings = { ...formData, invoiceDesign: nextDesign };
              setFormData(nextSettings);
              onSaveSettings(nextSettings);
              void saveCompanyInvoiceCssToFirestore(
                nextSettings,
                nextDesign.cssConfig || getIndependentInvoiceCssConfig(undefined, nextSettings.id),
                nextDesign
              );
            }}
            onSaveToCompanySettings={(updatedSettings) => {
              if (JSON.stringify(formData) === JSON.stringify(updatedSettings)) return;
              setFormData(updatedSettings);
              onSaveSettings(updatedSettings);
            }}
            isAdmin={isAdmin}
          />

          <div className="bg-slate-200/60 p-3 sm:p-6 md:p-8 rounded-3xl border border-slate-300/70 shadow-inner flex justify-center">
            <OfficialGIBInvoicePaper
              invoice={samplePreviewInvoice}
              companySettings={previewCompanySettings}
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
