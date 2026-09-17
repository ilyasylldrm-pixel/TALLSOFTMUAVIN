import React, { useState } from "react";
import {
  X,
  Download,
  CheckCircle2,
  ExternalLink,
  Puzzle,
  Zap,
  FolderArchive,
  Layers,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Copy,
  Check,
  Bookmark,
  MousePointer,
  Globe,
  Key,
  Lock,
  ArrowRight,
  Info,
} from "lucide-react";
import { DetailPageLayout } from "./common/DetailPageLayout";
import { CompanySettings } from "../types";
import { generatePortalBookmarklet } from "../utils/portalBookmarklet";

export interface ExtensionInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isExtensionDetected: boolean;
  companySettings?: CompanySettings;
  onNavigateToEmbedded?: () => void;
}

export const ExtensionInstallModal: React.FC<ExtensionInstallModalProps> = ({
  isOpen,
  onClose,
  isExtensionDetected,
  companySettings,
  onNavigateToEmbedded,
}) => {
  const [activeTab, setActiveTab] = useState<"bookmarklet" | "embedded" | "credentials" | "zip">("bookmarklet");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const effectiveSettings: CompanySettings = companySettings || {
    companyName: "Şirketim",
    taxNumber: "",
  };

  const { bookmarkletHref, rawScript } = generatePortalBookmarklet(effectiveSettings);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadZip = () => {
    window.location.href = "/api/extension/download-zip";
  };

  const taxCreds = effectiveSettings.taxCredentials || {};
  const activeWp = effectiveSettings.sgkCredentials?.workplaces?.[0] || effectiveSettings.sgkCredentials || {};
  const edevletCreds = effectiveSettings.eDevletCredentials || {};

  return (
    <DetailPageLayout
      title="Muavin Entegre E-İşlem & Giriş Asistanı"
      subtitle="GİB, SGK, e-Arşiv ve e-Devlet sitelerine sıfır kurulumla, tek tıkla otomatik giriş yapın"
      breadcrumbs={[
        { label: "Sistem & Entegrasyon", onClick: onClose },
        { label: "E-İşlem Asistanı", active: true },
      ]}
      onBack={onClose}
      statusBadge={
        <span className="text-xs font-bold px-3 py-1 rounded-xl border bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          SIFIR KURULUM AKTİF
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
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 w-full max-w-4xl mx-auto flex flex-col overflow-hidden">
        {/* TAB SWITCHER */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 pt-3 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("bookmarklet")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-extrabold transition cursor-pointer border-b-2 ${
              activeTab === "bookmarklet"
                ? "bg-white text-emerald-700 border-emerald-600 shadow-2xs"
                : "text-slate-600 border-transparent hover:text-slate-900"
            }`}
          >
            <Bookmark className="w-4 h-4 text-emerald-600" />
            <span>⚡ Yer İmi Asistanı (Sıfır Kurulum)</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.2 rounded-full">
              Önerilen
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("embedded")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-extrabold transition cursor-pointer border-b-2 ${
              activeTab === "embedded"
                ? "bg-white text-emerald-700 border-emerald-600 shadow-2xs"
                : "text-slate-600 border-transparent hover:text-slate-900"
            }`}
          >
            <Globe className="w-4 h-4 text-blue-600" />
            <span>🖥️ Gömülü Portallar Konsolu</span>
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
            <span>📋 Hızlı Şifre Panosu</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("zip")}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-t-xl text-xs font-medium transition cursor-pointer border-b-2 ml-auto ${
              activeTab === "zip"
                ? "bg-white text-slate-800 border-slate-700 shadow-2xs"
                : "text-slate-400 border-transparent hover:text-slate-700"
            }`}
          >
            <Puzzle className="w-3.5 h-3.5 text-slate-400" />
            <span>Gelişmiş (.ZIP Eklenti)</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* TAB 1: BOOKMARKLET (ZERO INSTALL) */}
          {activeTab === "bookmarklet" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Highlight Hero Card */}
              <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                        ⚡ Sıfır Kurulum Teknolojisi
                      </span>
                      <span className="text-[10px] text-slate-300">ZIP dosyası veya eklenti indirmeniz gerekmez!</span>
                    </div>
                    <h3 className="text-base font-black text-white">
                      Tarayıcınızın Favoriler Çubuğuna Tek Sürüklemeyle Kurun
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Aşağıdaki yeşil butonu farenizle basılı tutup tarayıcınızın Yer İmleri (Favoriler) çubuğuna bırakın. GİB, SGK veya e-Devlet sayfasına gittiğinizde butona tıklamanız yeterlidir.
                    </p>
                  </div>

                  {/* The Draggable Link */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <a
                      href={bookmarkletHref}
                      onClick={(e) => {
                        e.preventDefault();
                        alert("💡 Bu butona doğrudan tıklamak yerine, farenizle basılı tutup tarayıcınızın yukarıdaki Yer İmleri / Favoriler çubuğuna sürükleyip bırakınız. Eğer yer imleri çubuğunuz görünmüyorsa klavyeden Ctrl + Shift + B (Mac'te Cmd + Shift + B) tuşlarına basınız.");
                      }}
                      draggable="true"
                      className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs rounded-2xl shadow-xl shadow-emerald-500/30 cursor-grab active:cursor-grabbing border-2 border-white/40 flex items-center gap-2.5 select-none transform hover:-translate-y-0.5 transition"
                      title="Bu butonu tarayıcınızın Yer İmleri (Favoriler) çubuğuna sürükleyip bırakın"
                    >
                      <MousePointer className="w-4 h-4 animate-bounce" />
                      <span>⚡ Muavin Şifre Doldurucu</span>
                    </a>
                    <span className="text-[10px] text-emerald-300/80 font-semibold">
                      👆 Basılı tutup Yer İmleri Çubuğuna Sürükleyin
                    </span>
                  </div>
                </div>
              </div>

              {/* 3 Step Visual Guide */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="w-7 h-7 rounded-xl bg-slate-900 text-emerald-400 font-black text-xs flex items-center justify-center">
                    1
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Yer İmleri Çubuğunu Açın</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Klavyenizden <kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-mono font-bold">Ctrl + Shift + B</kbd> (Mac: <kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-mono font-bold">Cmd + Shift + B</kbd>) tuşlarına basarak tarayıcınızın favoriler çubuğunu görünür yapın.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="w-7 h-7 rounded-xl bg-slate-900 text-emerald-400 font-black text-xs flex items-center justify-center">
                    2
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Yeşil Butonu Yukarı Sürükleyin</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Yukarıdaki <strong>"⚡ Muavin Şifre Doldurucu"</strong> butonunu farenizle tutup tarayıcının üstündeki yer imleri çubuğuna bırakın.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="w-7 h-7 rounded-xl bg-slate-900 text-emerald-400 font-black text-xs flex items-center justify-center">
                    3
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Portallarda Tek Tıkla Doldurun</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    GİB, SGK veya e-Devlet giriş sayfasına gittiğinizde favorilerinizdeki o butona tıklayın; tüm şifreleriniz anında formlara aktarılacaktır!
                  </p>
                </div>
              </div>

              {/* Alternative: Copy Raw Bookmarklet URL */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    Manuel Yer İmi Eklemek İsterseniz:
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Sürükleme yapamıyorsanız yer imi kodunu kopyalayıp tarayıcınızda yeni yer imi oluşturarak URL alanına yapıştırabilirsiniz.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(bookmarkletHref, "bookmarklet_code")}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl font-bold text-xs shrink-0 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  {copiedKey === "bookmarklet_code" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Kod Kopyalandı!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Yer İmi Kodunu Kopyala</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: EMBEDDED CONSOLE */}
          {activeTab === "embedded" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-extrabold text-xs">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>Site İçi Gömülü Resmi Portallar Konsolu</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Muavin uygulamasının içinde yer alan <strong>"Gömülü Resmi Portallar Konsolu"</strong> sayesinde tarayıcıdan harici sekme açmadan GİB Dijital Vergi Dairesi, SGK İşveren Sistemi, e-Arşiv ve e-Devlet portallarını doğrudan görüntüleyebilir ve <strong>"⚡ Otomatik Doldur"</strong> butonu ile giriş yapabilirsiniz.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="font-extrabold text-slate-900 text-xs">🏛️ GİB Dijital Vergi Dairesi</h4>
                  <p className="text-[11px] text-slate-500">
                    Beyannameler, tahakkuk fişleri, vergi levhası ve borç dökümlerini site içi webview konsolunda açın.
                  </p>
                  <a
                    href="https://dijital.gib.gov.tr"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700"
                  >
                    <span>Portala Git</span> <ArrowRight className="w-3 h-3" />
                  </a>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="font-extrabold text-slate-900 text-xs">🏢 SGK İşveren Portalı & e-Bildirge</h4>
                  <p className="text-[11px] text-slate-500">
                    İşyeri sicil numarası ve sistem şifrelerinizle tüm şube ve merkez işyerleriniz için bildirge verin.
                  </p>
                  <a
                    href="https://uyg.sgk.gov.tr/IsverenSistemi"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    <span>Portala Git</span> <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {onNavigateToEmbedded && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToEmbedded();
                    }}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span>Gömülü Konsolu Şimdi Aç</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CREDENTIALS SUMMARY & 1-CLICK COPY */}
          {activeTab === "credentials" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-xs font-bold text-slate-700">
                Kayıtlı Resmi Kurum Şifreleriniz (Tek Tıkla Kopyalayabilirsiniz):
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* GİB Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="font-extrabold text-slate-900 text-xs flex items-center justify-between">
                    <span>🏛️ Gelir İdaresi (GİB / İVD)</span>
                    <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.2 rounded">GİB</span>
                  </div>
                  <div className="space-y-1 text-[11px] font-mono">
                    <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 font-sans">Kullanıcı Kodu:</span>
                      <span className="font-bold">{taxCreds.userCode || effectiveSettings.taxNumber || "—"}</span>
                      <button
                        onClick={() => handleCopy(taxCreds.userCode || effectiveSettings.taxNumber || "", "c_tax_user")}
                        className="text-slate-400 hover:text-emerald-600 cursor-pointer"
                      >
                        {copiedKey === "c_tax_user" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 font-sans">Parola:</span>
                      <span className="font-bold">{taxCreds.password ? "••••••••" : "—"}</span>
                      <button
                        onClick={() => handleCopy(taxCreds.password || "", "c_tax_pass")}
                        className="text-slate-400 hover:text-emerald-600 cursor-pointer"
                      >
                        {copiedKey === "c_tax_pass" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* SGK Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="font-extrabold text-slate-900 text-xs flex items-center justify-between">
                    <span>🏢 SGK İşveren Sistemi</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.2 rounded">SGK</span>
                  </div>
                  <div className="space-y-1 text-[11px] font-mono">
                    <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 font-sans">Kullanıcı Kodu:</span>
                      <span className="font-bold">{activeWp.userCode || "—"}</span>
                      <button
                        onClick={() => handleCopy(activeWp.userCode || "", "c_sgk_user")}
                        className="text-slate-400 hover:text-emerald-600 cursor-pointer"
                      >
                        {copiedKey === "c_sgk_user" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 font-sans">İşyeri Kodu:</span>
                      <span className="font-bold">{activeWp.workplaceCode || "000"}</span>
                      <button
                        onClick={() => handleCopy(activeWp.workplaceCode || "000", "c_sgk_wp")}
                        className="text-slate-400 hover:text-emerald-600 cursor-pointer"
                      >
                        {copiedKey === "c_sgk_wp" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ADVANCED ZIP (OPTIONAL) */}
          {activeTab === "zip" && (
            <div className="space-y-4 animate-fadeIn bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">Gelişmiş: Klasik Tarayıcı Eklentisi Paketi (.ZIP)</h4>
                  <p className="text-[11px] text-slate-500">
                    Özel olarak Chrome / Edge eklentisini tarayıcınıza kurmak isterseniz paketi indirebilirsiniz.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadZip}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ZIP İndir</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Not: Yer İmi Asistanı yukarıdaki 1. sekmede yer almakta olup, dosya indirme gerektirmediği için genellikle çok daha pratik ve tercih edilen yöntemdir.
              </p>
            </div>
          )}

          {/* Security Guarantee Banner */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center gap-2.5 text-emerald-950 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>%100 Güvenli & Yerel:</strong> Şifreleriniz yalnızca sizin bilgisayarınızda ve tarayıcınızda çalışır, hiçbir üçüncü tarafa veya harici sunucuya iletilmez.
            </span>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
          >
            Kapat
          </button>

          <a
            href={bookmarkletHref}
            onClick={(e) => {
              e.preventDefault();
              alert("💡 Bu butonu farenizle basılı tutup yukarıdaki Tarayıcı Yer İmleri (Favoriler) çubuğunuza sürükleyip bırakınız. Ardından GİB veya SGK sayfasına girdiğinizde o butona tıklayarak şifrelerinizi anında doldurabilirsiniz!");
            }}
            draggable="true"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs shadow-xs active:scale-95 transition cursor-grab select-none"
          >
            <Bookmark className="w-4 h-4" />
            <span>⚡ Muavin Şifre Doldurucu (Favorilere Sürükleyin)</span>
          </a>
        </div>
      </div>
    </DetailPageLayout>
  );
};
