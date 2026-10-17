import React, { useState } from "react";
import { CompanySettings, isAdminOrSysAdmin } from "../types";
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
} from "lucide-react";
import { GitHubSyncPanel } from "./GitHubSyncPanel";
import { Logo } from "./Logo";
import { readAndOptimizeLogoFile, clampLogoScale } from "../utils/logoUpload";
import { saveCloudLogo } from "../services/cloudBrandingService";
import { getActiveCompanyId } from "../utils/storage";

interface SettingsProps {
  settings: CompanySettings;
  onSaveSettings: (s: CompanySettings) => void;
  onExportBackup?: () => void;
  onImportBackup?: (jsonStr: string) => boolean;
  onResetDemoData?: () => void;
  embedded?: boolean;
  initialTab?: "theme" | "system" | "backup" | "cloud" | "github";
  companiesCount?: number;
  onOpenSubModule?: (sub: "companies" | "mysoft") => void;
  currentUser?: UserProfile | null;
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
}) => {
  const isAdmin = isAdminOrSysAdmin(currentUser);
  const [activeTab, setActiveTab] = useState<"theme" | "system" | "backup" | "cloud" | "github">(
    initialTab === "github" && !isAdmin ? (embedded ? "system" : "theme") : initialTab || (embedded ? "system" : "theme")
  );
  const [formData, setFormData] = useState<CompanySettings>(settings);

  React.useEffect(() => {
    setFormData(settings);
  }, [settings]);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
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
            <button
              type="button"
              onClick={() => onOpenSubModule("companies")}
              className="flex items-center gap-2 px-4 py-2.5 rounded text-xs font-semibold transition-all cursor-pointer bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
            >
              <Building2 className="w-4 h-4 text-[#0f6bae]" />
              <span>Şirketler & Çoklu Şirket{companiesCount !== undefined ? ` (${companiesCount})` : ""}</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenSubModule("mysoft")}
              className="flex items-center gap-2 px-4 py-2.5 rounded text-xs font-semibold transition-all cursor-pointer bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
            >
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>Mysoft VKN/TCKN Eşleştirme</span>
            </button>
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

          {/* 1. FATURA & BELGE FORMAT PARAMETRELERİ */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                Fatura & Belge Format Parametreleri
              </span>
              <span className="text-[10px] text-slate-500 font-normal">Varsayılan ticari parametreler</span>
            </h3>

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
                  E-Fatura Seri Öneki
                </label>
                <input
                  type="text"
                  placeholder="ör: MUV2026"
                  value={formData.defaultInvoicePrefix || "MUV2026"}
                  onChange={(e) => setFormData({ ...formData, defaultInvoicePrefix: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-2.5 font-mono font-bold"
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
                  <option value="10">%10 (Gıda & Hizmet)</option>
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
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-center shrink-0 min-w-[156px] min-h-[52px]">
                    <Logo
                      size="sm"
                      src={formData.logoUrl || "/logo.svg"}
                      scale={formData.logoScale ?? 1}
                    />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">
                      Şirkete Özel Fatura & Sistem Logosu ({formData.companyName || "Aktif Şirket"})
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

      {/* ─── TAB 3: BACKUP & DATA ─── */}
      {activeTab === "backup" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-600" />
              Veri Tabanı Yedekleme, Aktarma ve Sıfırlama
            </span>
            <span className="text-[10px] text-slate-500 font-normal">Yerel Güvenli Depolama</span>
          </h3>

          <p className="text-slate-600 leading-relaxed">
            Uygulama verileriniz (firmalar, şubeler, depolar, faturalar, cari hesaplar, stoklar) tarayıcınızda ve yerel bellekte güvenle saklanmaktadır. İstediğiniz an tam sistem yedeğini (JSON formatında) indirebilir veya dışarıdan yükleyebilirsiniz.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {onExportBackup && (
              <button
                type="button"
                onClick={onExportBackup}
                className="bg-slate-900 hover:bg-slate-950 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
              >
                <Download className="w-4 h-4 text-purple-400" />
                <span>Tüm Sistem Verilerini İndir (JSON Yedeği)</span>
              </button>
            )}

            {onImportBackup && (
              <label className="bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-colors border border-purple-200">
                <Upload className="w-4 h-4 text-purple-700" />
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
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-colors border border-rose-200 sm:ml-auto"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Örnek Demo Verileri Yeniden Yükle</span>
              </button>
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
