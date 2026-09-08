import React, { useState } from "react";
import { CompanySettings } from "../types";
import { useTheme, THEME_PRESETS, ThemeConfig } from "../context/ThemeContext";
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
  Sparkles,
  Sliders,
  Sun,
  Moon,
  CheckCircle2,
  Undo2,
  Layers,
  LayoutTemplate,
} from "lucide-react";

interface SettingsProps {
  settings: CompanySettings;
  onSaveSettings: (s: CompanySettings) => void;
  onExportBackup?: () => void;
  onImportBackup?: (jsonStr: string) => boolean;
  onResetDemoData?: () => void;
  embedded?: boolean;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  onSaveSettings,
  onExportBackup,
  onImportBackup,
  onResetDemoData,
  embedded = false,
}) => {
  const [activeTab, setActiveTab] = useState<"theme" | "system" | "backup">("theme");
  const [formData, setFormData] = useState<CompanySettings>(settings);
  const [isSaved, setIsSaved] = useState(false);

  // Theme Context
  const { theme, setTheme, setPreset, resetTheme, presets } = useTheme();

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
          alert("Yedek veriler başarıyla içe aktarıldı!");
          window.location.reload();
        } else {
          alert("Yedek dosyası okunamadı veya geçersiz format.");
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={embedded ? "space-y-6" : "p-3 sm:p-6 max-w-6xl mx-auto space-y-4 sm:space-y-6"}>
      {/* Header Banner */}
      {!embedded && (
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 rounded-2xl p-6 text-white shadow-md border border-slate-800">
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="bg-purple-500/20 text-purple-200 border border-purple-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Sistem & Tasarım Paneli
              </span>
              <h1 className="text-xl font-black text-white flex items-center gap-2 mt-1">
                <Palette className="w-6 h-6 text-purple-300" />
                Görünüm, Tema ve Parametre Ayarları
              </h1>
              <p className="text-xs text-purple-200/90 mt-1 max-w-2xl leading-relaxed">
                CRM arayüzünüzün renklerini (kenar çubuğu, üst menü, butonlar, sayfa arka planı), kurumsal temanızı ve ticari parametrelerinizi dilediğiniz gibi özelleştirin.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-xl border border-white/10">
              <span className="text-[11px] text-purple-200 px-2 font-semibold">Aktif Tema:</span>
              <span className="text-xs font-black text-white bg-purple-600 px-3 py-1 rounded-lg shadow-xs">
                {theme.name}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("theme")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "theme"
              ? "bg-[#8252f6] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Görünüm & Tema Renkleri</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("system")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "system"
              ? "bg-[#8252f6] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Ticari Parametreler</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("backup")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "backup"
              ? "bg-[#8252f6] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Yedekleme & Veri</span>
        </button>
      </div>

      {/* ─── TAB 1: THEME & APPEARANCE ─── */}
      {activeTab === "theme" && (
        <div className="space-y-6">
          {/* Preset Theme Cards */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Hazır Tema Şablonları
                </h3>
                <p className="text-[11px] text-slate-500">
                  Tek tıkla tüm sistemi referans tasarıma veya kurumsal tarzınıza uyarlayın.
                </p>
              </div>
              <button
                type="button"
                onClick={resetTheme}
                className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 font-bold bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Referans Temaya Dön</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {presets.map((p) => {
                const isSelected = theme.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPreset(p.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 relative ${
                      isSelected
                        ? "border-purple-600 bg-purple-50/40 ring-2 ring-purple-600/30 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 text-purple-600">
                        <CheckCircle2 className="w-4 h-4 fill-purple-600 text-white" />
                      </div>
                    )}

                    <div>
                      <div className="text-xs font-extrabold text-slate-900 leading-tight">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {p.id === "modern-purple" && "Referans ekranlar"}
                        {p.id === "classic-corporate" && "Klasik mavi & lacivert"}
                        {p.id === "minimal-light" && "Açık kenar çubuğu"}
                        {p.id === "dark-mode" && "Gece & OLED siyah"}
                        {p.id === "emerald-business" && "Zümrüt yeşili finans"}
                      </div>
                    </div>

                    {/* Color Swatches */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <div
                        className="w-5 h-5 rounded-md border border-slate-300 shadow-2xs"
                        style={{ backgroundColor: p.sidebarBg }}
                        title={`Sidebar: ${p.sidebarBg}`}
                      />
                      <div
                        className="w-5 h-5 rounded-md border border-slate-300 shadow-2xs"
                        style={{ backgroundColor: p.headerBg }}
                        title={`Navbar: ${p.headerBg}`}
                      />
                      <div
                        className="w-5 h-5 rounded-md border border-slate-300 shadow-2xs"
                        style={{ backgroundColor: p.primaryColor }}
                        title={`Vurgu: ${p.primaryColor}`}
                      />
                      <div
                        className="w-5 h-5 rounded-md border border-slate-300 shadow-2xs"
                        style={{ backgroundColor: p.pageBg }}
                        title={`Sayfa: ${p.pageBg}`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Granular Color Customizer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-purple-600" />
                  Detaylı Renk Paleti Özelleştirici
                </h3>
                <p className="text-[11px] text-slate-500">
                  Her bölümün arka plan ve metin renklerini dilediğiniz gibi ayarlayın; değişiklikler anında sayfaya yansır.
                </p>
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

      {/* ─── TAB 2: SYSTEM PARAMETERS ─── */}
      {activeTab === "system" && (
        <form onSubmit={handleSubmit} className="space-y-6">
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
                  defaultValue="MUV2026"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-2.5 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Varsayılan KDV Oranı (%)
                </label>
                <select
                  defaultValue="20"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-2.5 font-bold cursor-pointer"
                >
                  <option value="20">%20 (Genel Oran)</option>
                  <option value="10">%10 (Gıda & Hizmet)</option>
                  <option value="1">%1 (Temel Gıda / Tarım)</option>
                  <option value="0">%0 (KDV İstisnası)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-between bg-purple-50/60 p-4 rounded-2xl border border-purple-200/60">
            {isSaved ? (
              <span className="text-xs font-extrabold text-emerald-600 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Sistem ayarları başarıyla kaydedildi!
              </span>
            ) : (
              <span className="text-xs text-purple-900/80 font-medium">
                Sistem parametrelerini güncellemek için kaydedin.
              </span>
            )}

            <button
              type="submit"
              className="bg-[#8252F6] hover:bg-[#703EE5] text-white font-bold px-6 py-2.5 rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-white" />
              <span>Sistem Ayarlarını Kaydet</span>
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
    </div>
  );
};
