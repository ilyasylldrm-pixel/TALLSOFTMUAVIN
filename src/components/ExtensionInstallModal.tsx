import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  ExternalLink,
  Zap,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Copy,
  Check,
  Globe,
  Key,
  Lock,
  Building,
  User,
  Hash,
  Layers,
  FileSpreadsheet,
  FileText,
  CreditCard,
  Eye,
  EyeOff,
  Download,
} from "lucide-react";
import { DetailPageLayout } from "./common/DetailPageLayout";
import { CompanySettings, WorkplaceSgkCredential } from "../types";

export interface ExtensionInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isExtensionDetected?: boolean;
  companySettings?: CompanySettings;
  onNavigateToEmbedded?: () => void;
  onOpenGibModal?: () => void;
  onOpenSgkModal?: (portal: "isveren" | "ebildirgev2") => void;
}

export const ExtensionInstallModal: React.FC<ExtensionInstallModalProps> = ({
  isOpen,
  onClose,
  companySettings,
  onNavigateToEmbedded,
  onOpenGibModal,
  onOpenSgkModal,
}) => {
  const [activeTab, setActiveTab] = useState<"extension" | "portals" | "credentials" | "workplaces">("extension");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [selectedWpId, setSelectedWpId] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const effectiveSettings: CompanySettings = companySettings || {
    companyName: "Şirketim",
    taxNumber: "",
  };

  const workplaces: WorkplaceSgkCredential[] =
    effectiveSettings.sgkCredentials?.workplaces &&
    Array.isArray(effectiveSettings.sgkCredentials.workplaces) &&
    effectiveSettings.sgkCredentials.workplaces.length > 0
      ? effectiveSettings.sgkCredentials.workplaces
      : [
          {
            id: "main_default",
            name: "Merkez Ofis",
            type: "main",
            workplaceRegistrationNo: effectiveSettings.sgkCredentials?.workplaceRegistrationNo || "",
            userCode: effectiveSettings.sgkCredentials?.userCode || "",
            workplaceCode: effectiveSettings.sgkCredentials?.workplaceCode || "000",
            systemPassword: effectiveSettings.sgkCredentials?.systemPassword || "",
            workplacePassword: effectiveSettings.sgkCredentials?.workplacePassword || "",
          },
        ];

  const activeWp = workplaces.find((w) => w.id === selectedWpId) || workplaces[0];
  const taxCreds = effectiveSettings.taxCredentials || {};
  const edevletCreds = effectiveSettings.eDevletCredentials || {};

  const handleCopy = (text: string, key: string, label?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    if (label) {
      setToastMessage(`⚡ ${label} panoya kopyalandı!`);
      setTimeout(() => setToastMessage(null), 3000);
    }
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleLaunchWithCopy = (url: string, portalName: string, primaryCode: string) => {
    if (primaryCode) {
      navigator.clipboard.writeText(primaryCode);
      setToastMessage(`⚡ ${portalName} için Kullanıcı Kodu (${primaryCode}) panoya kopyalandı.`);
      setTimeout(() => setToastMessage(null), 4000);
    }
    window.open(url, "_blank");
  };

  return (
    <DetailPageLayout
      title="Muavin Entegre E-İşlem & Giriş Asistanı"
      subtitle="GİB Dijital, e-Arşiv, SGK ve e-Devlet portallarına doğrudan gömülü hızlı erişim ve otomatik şifre köprüsü"
      breadcrumbs={[
        { label: "E-İşlemler", onClick: onClose },
        { label: "Giriş Asistanı Konsolu", active: true },
      ]}
      onBack={onClose}
      statusBadge={
        <span className="text-xs font-bold px-3 py-1 rounded-xl border bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          SİSTEME ENTEGRE & CANLI
        </span>
      }
      headerIcon={<Zap className="w-5 h-5 text-emerald-600" />}
      actions={
        <div className="flex items-center gap-2">
          {onNavigateToEmbedded && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToEmbedded();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer shadow-xs"
            >
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Gömülü Konsolu Aç</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      }
    >
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 w-full max-w-5xl mx-auto flex flex-col overflow-hidden">
        {/* ACTIVE COMPANY BANNER */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-900 px-6 py-4 border-b border-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-base shrink-0">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">
                  {effectiveSettings.companyTitle || effectiveSettings.companyName}
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  VKN: {effectiveSettings.taxNumber || "—"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Vergi Dairesi: <strong className="text-slate-200">{effectiveSettings.taxOffice || "—"}</strong> • Kayıtlı SGK İşyeri: <strong className="text-emerald-400">{workplaces.length} Adet</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 border border-slate-700"
            >
              {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPasswords ? "Şifreleri Gizle" : "Şifreleri Göster"}</span>
            </button>
          </div>
        </div>

        {/* TOAST FEEDBACK */}
        {toastMessage && (
          <div className="bg-emerald-950 text-emerald-200 px-6 py-2.5 text-xs font-bold flex items-center justify-between border-b border-emerald-800 animate-fadeIn">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-emerald-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* TAB SWITCHER */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 pt-3 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("extension")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-extrabold transition cursor-pointer border-b-2 ${
              activeTab === "extension"
                ? "bg-white text-purple-700 border-purple-600 shadow-2xs"
                : "text-slate-600 border-transparent hover:text-slate-900"
            }`}
          >
            <Download className="w-4 h-4 text-purple-600" />
            <span>📦 Chrome Eklentisi (.ZIP)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("portals")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-extrabold transition cursor-pointer border-b-2 ${
              activeTab === "portals"
                ? "bg-white text-emerald-700 border-emerald-600 shadow-2xs"
                : "text-slate-600 border-transparent hover:text-slate-900"
            }`}
          >
            <Zap className="w-4 h-4 text-emerald-600" />
            <span>🚀 Resmi Portallar & Hızlı Giriş</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("credentials")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-extrabold transition cursor-pointer border-b-2 ${
              activeTab === "credentials"
                ? "bg-white text-emerald-700 border-emerald-600 shadow-2xs"
                : "text-slate-600 border-transparent hover:text-slate-900"
            }`}
          >
            <Key className="w-4 h-4 text-purple-600" />
            <span>📋 Hızlı Şifre & Kimlik Panosu</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("workplaces")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-extrabold transition cursor-pointer border-b-2 ${
              activeTab === "workplaces"
                ? "bg-white text-emerald-700 border-emerald-600 shadow-2xs"
                : "text-slate-600 border-transparent hover:text-slate-900"
            }`}
          >
            <Building className="w-4 h-4 text-teal-600" />
            <span>🏢 SGK İşyerleri & Şubeler ({workplaces.length})</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* TAB 0: CHROME EXTENSION DOWNLOAD & SETUP */}
          {activeTab === "extension" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Top Banner */}
              <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-purple-500/30 shadow-md">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/30 text-purple-200 border border-purple-400/40">
                      v1.2 Manifest V3
                    </span>
                    <h3 className="text-base font-extrabold text-white tracking-tight">
                      Muavin - Resmi Portallar ve E-İşlem Asistanı Eklentisi
                    </h3>
                  </div>
                  <p className="text-xs text-purple-200 max-w-2xl leading-relaxed">
                    Eklentiyi Chrome tarayıcınıza yükleyin ve Tallsoft kullanıcı adı ve şifrenizle giriş yapın. Kayıtlı şirket şifreleriniz Tallsoft API'sinden anında çekilir ve GİB, SGK, e-Arşiv, e-Devlet portallarında otomatik doldurulur.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full md:w-auto">
                  <a
                    href="/api/extension/download-zip"
                    download="muavin-eklenti.zip"
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 fill-slate-950" />
                    <span>📥 Eklentiyi İndir (.ZIP)</span>
                  </a>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/extension/sync", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(effectiveSettings),
                        });
                        const data = await res.json();
                        if (data.success) {
                          setToastMessage("✅ Şirket şifreleri Tallsoft API'sine senkronize edildi!");
                        } else {
                          setToastMessage("⚠️ Senkronizasyon uyarısı: " + (data.error || ""));
                        }
                      } catch (err: any) {
                        setToastMessage("⚠️ API bağlantı hatası: " + err?.message);
                      }
                      setTimeout(() => setToastMessage(null), 4000);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>🔄 Şifreleri API'ye Gönder</span>
                  </button>
                </div>
              </div>

              {/* 4-Step Installation Visual Cards */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  4 Adımda Hızlı Kurulum & Kullanım Rehberi
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* Step 1 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-2xs">
                    <div>
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-black flex items-center justify-center text-xs mb-2">
                        1
                      </div>
                      <h5 className="font-extrabold text-slate-900 text-xs mb-1">ZIP İndir ve Çıkart</h5>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Yukarıdaki <strong>"📥 Eklentiyi İndir"</strong> butonuna basıp inen <code>muavin-eklenti.zip</code> dosyasını masaüstüne veya bir klasöre ayıklayın.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg border border-purple-100">
                      📦 Klasöre Ayıkla
                    </span>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-2xs">
                    <div>
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-black flex items-center justify-center text-xs mb-2">
                        2
                      </div>
                      <h5 className="font-extrabold text-slate-900 text-xs mb-1">Chrome Uzantılar Sayfası</h5>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Chrome adres çubuğuna <code>chrome://extensions</code> yazıp açın veya sağ üstteki üç nokta menüsünden Uzantılar &gt; Uzantıları Yönet yolunu izleyin.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy("chrome://extensions", "ext_url", "Uzantılar adresi")}
                      className="text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg border border-blue-100 flex items-center justify-between cursor-pointer"
                    >
                      <span>chrome://extensions</span>
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-2xs">
                    <div>
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 font-black flex items-center justify-center text-xs mb-2">
                        3
                      </div>
                      <h5 className="font-extrabold text-slate-900 text-xs mb-1">Geliştirici Modu & Yükle</h5>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Sağ üst köşedeki <strong>"Geliştirici Modu"</strong> anahtarını açın. Sol üstte çıkan <strong>"Paketlenmemiş öğe yükle"</strong> butonuna basıp klasörü seçin.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                      ⚡ Paketlenmemiş Yükle
                    </span>
                  </div>

                  {/* Step 4 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-2xs">
                    <div>
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 font-black flex items-center justify-center text-xs mb-2">
                        4
                      </div>
                      <h5 className="font-extrabold text-slate-900 text-xs mb-1">Giriş Yap & Doldur</h5>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Eklenti simgesine tıklayıp Tallsoft kullanıcı adı ve şifrenizle oturum açın. Şifreler otomatik çekilir ve tüm resmi sitelerde formlar doldurulur!
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                      🚀 Otomatik Doldurma Hazır
                    </span>
                  </div>
                </div>
              </div>

              {/* Status and Diagnostics */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-white flex items-center gap-2">
                      <span>Eklenti API Servisi:</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        🟢 Canlı & Dinlemede
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Sunucu Uç Noktası: <code className="text-emerald-400">/api/extension/login</code> • Şifre Deposu: <code className="text-emerald-400">data/company_settings.json</code>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-300">
                    Kayıtlı Şirket: <strong className="text-white">{effectiveSettings.companyName}</strong> ({effectiveSettings.taxNumber})
                  </span>
                </div>
              </div>
            </div>
          )}
          {/* TAB 1: QUICK PORTAL LAUNCHERS */}
          {activeTab === "portals" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-xs font-extrabold text-slate-800 flex items-center justify-between">
                <span>Tek Tıkla Doğrudan Giriş Yapın veya Gömülü Konsolu Kullanın:</span>
                <span className="text-[11px] text-slate-400 font-normal">Kullanıcı kodları otomatik aktarılır</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {/* GİB Dijital Vergi Dairesi Card */}
                <div className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-red-300 rounded-2xl p-4 transition-all shadow-2xs flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-black text-sm">
                          🏛️
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-xs">Dijital Vergi Dairesi</h4>
                          <span className="text-[10px] text-slate-400">GİB & İnteraktif VD</span>
                        </div>
                      </div>
                      <span className="text-[9px] bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded border border-red-200">
                        Vergi
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      Beyannameler, vergi levhası sorgulama, borç durumu ve tahakkuk belgeleri.
                    </p>
                    <div className="mt-2 text-[10px] font-mono text-slate-600 bg-white p-1.5 rounded-lg border border-slate-200">
                      K.Kodu: <strong>{taxCreds.userCode || effectiveSettings.taxNumber || "—"}</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                    {onOpenGibModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenGibModal();
                        }}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Yerel Modül</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        handleLaunchWithCopy(
                          "https://dijital.gib.gov.tr",
                          "Dijital Vergi Dairesi",
                          taxCreds.userCode || effectiveSettings.taxNumber || ""
                        )
                      }
                      className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                      title="Resmi siteyi aç"
                    >
                      <span>Resmi Site</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* GİB e-Arşiv Fatura Portalı */}
                <div className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-amber-300 rounded-2xl p-4 transition-all shadow-2xs flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-sm">
                          📄
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-xs">GİB e-Arşiv Fatura</h4>
                          <span className="text-[10px] text-slate-400">5.000 / 30.000 Portal</span>
                        </div>
                      </div>
                      <span className="text-[9px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded border border-amber-200">
                        Fatura
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      GİB resmi 5.000 TL ve 30.000 TL üzeri zorunlu e-Arşiv fatura oluşturma portalı.
                    </p>
                    <div className="mt-2 text-[10px] font-mono text-slate-600 bg-white p-1.5 rounded-lg border border-slate-200">
                      K.Kodu: <strong>{taxCreds.userCode || effectiveSettings.taxNumber || "—"}</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                    {onNavigateToEmbedded && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToEmbedded();
                        }}
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Gömülü Konsol</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        handleLaunchWithCopy(
                          "https://earsivportal.efatura.gov.tr/intragiris.html",
                          "GİB e-Arşiv Fatura",
                          taxCreds.userCode || effectiveSettings.taxNumber || ""
                        )
                      }
                      className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                      title="Resmi siteyi aç"
                    >
                      <span>Resmi Site</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* SGK İşveren Sistemi Card */}
                <div className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-4 transition-all shadow-2xs flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm">
                          🏢
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-xs">SGK İşveren Sistemi</h4>
                          <span className="text-[10px] text-slate-400">İşveren / Teşvik</span>
                        </div>
                      </div>
                      <span className="text-[9px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                        SGK
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      İşyeri tescil, istihdam teşvikleri, personel işe giriş ve çıkış bildirgeleri.
                    </p>
                    <div className="mt-2 text-[10px] font-mono text-slate-600 bg-white p-1.5 rounded-lg border border-slate-200">
                      Aktif: <strong>{activeWp.name}</strong> ({activeWp.workplaceCode || "000"})
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                    {onOpenSgkModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenSgkModal("isveren");
                        }}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Yerel Modül</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        handleLaunchWithCopy(
                          "https://uyg.sgk.gov.tr/IsverenSistemi",
                          "SGK İşveren Sistemi",
                          activeWp.userCode || ""
                        )
                      }
                      className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                      title="Resmi siteyi aç"
                    >
                      <span>Resmi Site</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* SGK e-Bildirge v2 Card */}
                <div className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-teal-300 rounded-2xl p-4 transition-all shadow-2xs flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-black text-sm">
                          📋
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-xs">SGK e-Bildirge v2</h4>
                          <span className="text-[10px] text-slate-400">MUHSGK & Aylık Prim</span>
                        </div>
                      </div>
                      <span className="text-[9px] bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded border border-teal-200">
                        Bildirge
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      Aylık prim ve hizmet belgesi, MUHSGK tahakkuk onay ve takip işlemleri.
                    </p>
                    <div className="mt-2 text-[10px] font-mono text-slate-600 bg-white p-1.5 rounded-lg border border-slate-200">
                      Sicil: <strong>{activeWp.workplaceRegistrationNo ? `${activeWp.workplaceRegistrationNo.substring(0, 14)}...` : "—"}</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                    {onOpenSgkModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenSgkModal("ebildirgev2");
                        }}
                        className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-extrabold py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Yerel Modül</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        handleLaunchWithCopy(
                          "https://ebildirge.sgk.gov.tr/EBildirgeV2",
                          "SGK e-Bildirge v2",
                          activeWp.userCode || ""
                        )
                      }
                      className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                      title="Resmi siteyi aç"
                    >
                      <span>Resmi Site</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* e-Devlet Kapısı Kurumsal */}
                <div className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-4 transition-all shadow-2xs flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm">
                          🇹🇷
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-xs">e-Devlet Kapısı</h4>
                          <span className="text-[10px] text-slate-400">turkiye.gov.tr Kurumsal</span>
                        </div>
                      </div>
                      <span className="text-[9px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded border border-blue-200">
                        e-Devlet
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      Şirket yetkilisi ve tüzel kişilik resmi kurum başvuruları ve sorgulamalar.
                    </p>
                    <div className="mt-2 text-[10px] font-mono text-slate-600 bg-white p-1.5 rounded-lg border border-slate-200">
                      TCKN: <strong>{edevletCreds.tckn || effectiveSettings.taxNumber || "—"}</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleLaunchWithCopy(
                          "https://giris.turkiye.gov.tr/Giris/",
                          "e-Devlet Kapısı",
                          edevletCreds.tckn || effectiveSettings.taxNumber || ""
                        )
                      }
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>e-Devlet Girişine Git</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Ticaret Bakanlığı MERSİS */}
                <div className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-purple-300 rounded-2xl p-4 transition-all shadow-2xs flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-sm">
                          🏛️
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-xs">Ticaret MERSİS</h4>
                          <span className="text-[10px] text-slate-400">Merkezi Sicil Kayıt</span>
                        </div>
                      </div>
                      <span className="text-[9px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded border border-purple-200">
                        MERSİS
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      Ticaret Sicil işlemleri, şirket ana sözleşme değişiklikleri ve yetkili atamaları.
                    </p>
                    <div className="mt-2 text-[10px] font-mono text-slate-600 bg-white p-1.5 rounded-lg border border-slate-200">
                      Mersis No: <strong>{effectiveSettings.mersisNo || "—"}</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleLaunchWithCopy(
                          "https://mersis.gtb.gov.tr/",
                          "Ticaret MERSİS",
                          taxCreds.userCode || effectiveSettings.taxNumber || ""
                        )
                      }
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>MERSİS Girişine Git</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CREDENTIALS BOARD */}
          {activeTab === "credentials" && (
            <div className="space-y-6 animate-fadeIn">
              {/* GİB Dijital Vergi Dairesi Şifreleri */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
                      🏛️
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-xs">GİB Dijital Vergi Dairesi Giriş Bilgileri</h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">İnteraktif VD / e-Beyanname</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                      <span>KULLANICI KODU</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(taxCreds.userCode || effectiveSettings.taxNumber || "", "gib_user", "GİB Kullanıcı Kodu")}
                        className="text-slate-400 hover:text-emerald-600 cursor-pointer"
                      >
                        {copiedKey === "gib_user" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-900 select-all">
                      {taxCreds.userCode || effectiveSettings.taxNumber || "—"}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                      <span>PAROLA</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(taxCreds.password || "", "gib_pass", "GİB Parolası")}
                        className="text-slate-400 hover:text-emerald-600 cursor-pointer"
                      >
                        {copiedKey === "gib_pass" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-900 select-all">
                      {taxCreds.password ? (showPasswords ? taxCreds.password : "••••••••") : "—"}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                      <span>ÖZEL ŞİFRE (GİB KOD)</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(taxCreds.codeSecret || "", "gib_sec", "GİB Özel Şifre")}
                        className="text-slate-400 hover:text-emerald-600 cursor-pointer"
                      >
                        {copiedKey === "gib_sec" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-900 select-all">
                      {taxCreds.codeSecret ? (showPasswords ? taxCreds.codeSecret : "••••••••") : "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* SGK İşveren ve e-Bildirge Şifreleri */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      🏢
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-xs">
                      SGK İşveren & e-Bildirge v2 ({activeWp.name})
                    </h4>
                  </div>

                  {workplaces.length > 1 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">İşyeri Değiştir:</span>
                      <select
                        value={activeWp.id}
                        onChange={(e) => setSelectedWpId(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg text-xs font-bold p-1 text-slate-800 outline-none"
                      >
                        {workplaces.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name} ({w.workplaceCode || "000"})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                      <span>SGK SİCİL NO</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(activeWp.workplaceRegistrationNo || "", "sgk_sicil", "SGK Sicil No")}
                        className="text-slate-400 hover:text-emerald-600 cursor-pointer"
                      >
                        {copiedKey === "sgk_sicil" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-900 select-all truncate">
                      {activeWp.workplaceRegistrationNo || "—"}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                      <span>KULLANICI KODU</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(activeWp.userCode || "", "sgk_user", "SGK Kullanıcı Kodu")}
                        className="text-slate-400 hover:text-emerald-600 cursor-pointer"
                      >
                        {copiedKey === "sgk_user" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-900 select-all">
                      {activeWp.userCode || "—"}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                      <span>İŞYERİ KODU</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(activeWp.workplaceCode || "000", "sgk_wpcode", "İşyeri Kodu")}
                        className="text-slate-400 hover:text-emerald-600 cursor-pointer"
                      >
                        {copiedKey === "sgk_wpcode" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-900 select-all">
                      {activeWp.workplaceCode || "000"}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                      <span>SİSTEM ŞİFRESİ</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(activeWp.systemPassword || "", "sgk_sys", "Sistem Şifresi")}
                        className="text-slate-400 hover:text-emerald-600 cursor-pointer"
                      >
                        {copiedKey === "sgk_sys" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-900 select-all">
                      {activeWp.systemPassword ? (showPasswords ? activeWp.systemPassword : "••••••••") : "—"}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                      <span>İŞYERİ ŞİFRESİ</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(activeWp.workplacePassword || "", "sgk_wp", "İşyeri Şifresi")}
                        className="text-slate-400 hover:text-emerald-600 cursor-pointer"
                      >
                        {copiedKey === "sgk_wp" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-900 select-all">
                      {activeWp.workplacePassword ? (showPasswords ? activeWp.workplacePassword : "••••••••") : "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* e-Devlet Kapısı Bilgileri */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      🇹🇷
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-xs">e-Devlet Kapısı Yetkili Giriş Bilgileri</h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">turkiye.gov.tr</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                      <span>T.C. KİMLİK NO</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(edevletCreds.tckn || effectiveSettings.taxNumber || "", "edev_tckn", "e-Devlet TCKN")}
                        className="text-slate-400 hover:text-emerald-600 cursor-pointer"
                      >
                        {copiedKey === "edev_tckn" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-900 select-all">
                      {edevletCreds.tckn || effectiveSettings.taxNumber || "—"}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                      <span>E-DEVLET ŞİFRESİ</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(edevletCreds.password || "", "edev_pass", "e-Devlet Şifresi")}
                        className="text-slate-400 hover:text-emerald-600 cursor-pointer"
                      >
                        {copiedKey === "edev_pass" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-900 select-all">
                      {edevletCreds.password ? (showPasswords ? edevletCreds.password : "••••••••") : "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WORKPLACES LIST */}
          {activeTab === "workplaces" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-slate-900 text-xs">
                  Kayıtlı SGK İşyerleri ({workplaces.length} Birim)
                </h4>
                <span className="text-[11px] text-slate-500">
                  Giriş yapmak istediğiniz işyerini seçip resmi sistemlere doğrudan bağlanabilirsiniz.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {workplaces.map((wp) => (
                  <div
                    key={wp.id}
                    className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-4 transition-all shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs">
                          {wp.type === "main" ? "M" : wp.type === "warehouse" ? "D" : "Ş"}
                        </div>
                        <div>
                          <h5 className="font-extrabold text-slate-900 text-xs">{wp.name}</h5>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Kod: {wp.workplaceCode || "000"} • {wp.type === "main" ? "Merkez" : wp.type === "warehouse" ? "Depo" : "Şube"}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedWpId(wp.id);
                          setActiveTab("credentials");
                        }}
                        className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 cursor-pointer"
                      >
                        Şifreleri Gör →
                      </button>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-600 space-y-1">
                      <p>Sicil: <strong className="text-slate-900">{wp.workplaceRegistrationNo || "—"}</strong></p>
                      <p>Kullanıcı: <strong className="text-slate-900">{wp.userCode || "—"}</strong></p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                      {onOpenSgkModal && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedWpId(wp.id);
                            onClose();
                            onOpenSgkModal("isveren");
                          }}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-1.5 px-3 rounded-xl transition cursor-pointer text-center text-xs"
                        >
                          İşveren Portalı
                        </button>
                      )}
                      {onOpenSgkModal && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedWpId(wp.id);
                            onClose();
                            onOpenSgkModal("ebildirgev2");
                          }}
                          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-extrabold py-1.5 px-3 rounded-xl transition cursor-pointer text-center text-xs"
                        >
                          e-Bildirge v2
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-500 font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>256-Bit SSL • Muavin Entegre E-İşlem ve Resmi Kurum Köprüsü</span>
          </div>

          <button
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2 rounded-xl transition cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </DetailPageLayout>
  );
};
