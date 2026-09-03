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
} from "lucide-react";
import { DetailPageLayout } from "./common/DetailPageLayout";

export interface ExtensionInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isExtensionDetected: boolean;
}

export const ExtensionInstallModal: React.FC<ExtensionInstallModalProps> = ({
  isOpen,
  onClose,
  isExtensionDetected,
}) => {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyUrl = (url: string, key: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(key);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleDownloadZip = () => {
    window.location.href = "/api/extension/download-zip";
  };

  return (
    <DetailPageLayout
      title="Muavin Chrome & Edge Eklentisi"
      subtitle="GİB, SGK, e-Arşiv ve e-Devlet sitelerine tek tıkla şifresiz doğrudan giriş yapın"
      breadcrumbs={[
        { label: "Sistem & Entegrasyon", onClick: onClose },
        { label: "Tarayıcı Eklentisi", active: true },
      ]}
      onBack={onClose}
      statusBadge={
        <span
          className={`text-xs font-bold px-3 py-1 rounded-xl border ${
            isExtensionDetected
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-amber-50 text-amber-800 border-amber-200"
          }`}
        >
          {isExtensionDetected ? "EKLENTİ AKTİF" : "KURULUM GEREKİYOR"}
        </span>
      }
      headerIcon={<Zap className="w-5 h-5 text-emerald-600" />}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadZip}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs shadow-xs active:scale-95 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Eklenti Paketini İndir (.ZIP)</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Geri Dön
          </button>
        </div>
      }
    >
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 w-full max-w-3xl mx-auto flex flex-col overflow-hidden">

        {/* MODAL BODY: 3-STEP INSTALLATION GUIDE */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Status Indicator */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
              isExtensionDetected
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-amber-50 border-amber-200 text-amber-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isExtensionDetected ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <Puzzle className="w-5 h-5 text-amber-600 shrink-0" />
              )}
              <div>
                <div className="font-extrabold text-xs">
                  {isExtensionDetected ? "Eklenti Tarayıcınızda Yüklü ve Aktif!" : "Eklenti Henüz Algılanmadı"}
                </div>
                <div className="text-[11px] opacity-80">
                  {isExtensionDetected
                    ? "Resmi devlet portallarına gittiğinizde şifreleriniz otomatik olarak formlara aktarılacaktır."
                    : "Aşağıdaki 3 adımı takip ederek 30 saniyede eklentiyi kurabilirsiniz."}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadZip}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>ZIP İndir</span>
            </button>
          </div>

          {/* 3 STEPS CARDS */}
          <div className="space-y-3">
            <h4 className="font-black text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              3 Adımda Kolay Kurulum Kılavuzu:
            </h4>

            {/* Step 1 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-start gap-3.5 hover:border-slate-300 transition">
              <div className="w-7 h-7 rounded-xl bg-slate-900 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                1
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-slate-900 text-xs">Eklenti Dosyasını İndirin ve Çıkartın</div>
                  <button
                    type="button"
                    onClick={handleDownloadZip}
                    className="text-emerald-700 hover:text-emerald-800 font-bold text-[11px] flex items-center gap-1 underline cursor-pointer"
                  >
                    <FolderArchive className="w-3.5 h-3.5" /> muavin-eklenti.zip İndir
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  İndirdiğiniz <strong>muavin-eklenti.zip</strong> dosyasını bilgisayarınızda bir klasöre çıkartın (örn: <em>Masaüstü / muavin-eklenti</em>).
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-start gap-3.5 hover:border-slate-300 transition">
              <div className="w-7 h-7 rounded-xl bg-slate-900 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                2
              </div>
              <div className="flex-1 space-y-2">
                <div className="font-extrabold text-slate-900 text-xs">
                  Tarayıcınızın Eklentiler Sayfasını Açın
                </div>
                <p className="text-[11px] text-slate-500">
                  Tarayıcınızın adres çubuğuna aşağıdaki adresi kopyalayıp yapıştırın:
                </p>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-[11px] text-slate-800">
                    <span>chrome://extensions</span>
                    <button
                      type="button"
                      onClick={() => handleCopyUrl("chrome://extensions", "chrome_url")}
                      className="text-slate-400 hover:text-emerald-600 cursor-pointer"
                      title="Adresi Kopyala"
                    >
                      {copiedUrl === "chrome_url" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-[11px] text-slate-800">
                    <span>edge://extensions</span>
                    <button
                      type="button"
                      onClick={() => handleCopyUrl("edge://extensions", "edge_url")}
                      className="text-slate-400 hover:text-emerald-600 cursor-pointer"
                      title="Adresi Kopyala"
                    >
                      {copiedUrl === "edge_url" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-start gap-3.5 hover:border-slate-300 transition">
              <div className="w-7 h-7 rounded-xl bg-slate-900 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                3
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="font-extrabold text-slate-900 text-xs">
                  Geliştirici Modunu Açıp Klasörü Seçin
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Açılan sayfanın sağ üst köşesindeki <strong>"Geliştirici Modu" (Developer Mode)</strong> anahtarını aktif edin. Sol üstte beliren <strong>"Paketlenmemiş Öğe Yükle" (Load Unpacked)</strong> butonuna tıklayıp 1. adımda çıkarttığınız klasörü seçin.
                </p>
              </div>
            </div>
          </div>

          {/* Security note */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center gap-2 text-emerald-950 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Tamamen Güvenlidir:</strong> Eklenti yalnızca resmi devlet portallarında (`gib.gov.tr`, `sgk.gov.tr`, `turkiye.gov.tr`) çalışır ve şifrelerinizi hiçbir üçüncü tarafa göndermez.
            </span>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
          >
            Geri Dön
          </button>

          <button
            type="button"
            onClick={handleDownloadZip}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Eklenti Paketini İndir (.ZIP)</span>
          </button>
        </div>
      </div>
    </DetailPageLayout>
  );
};
