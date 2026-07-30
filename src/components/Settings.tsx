import React, { useState } from "react";
import { CompanySettings } from "../types";
import { ExchangeRatesWidget } from "./ExchangeRatesWidget";
import {
  Settings as SettingsIcon,
  Save,
  Download,
  Upload,
  RotateCcw,
  Check,
  ShieldCheck,
  Database,
  Printer,
  Globe,
  DollarSign,
  FileText,
} from "lucide-react";

interface SettingsProps {
  settings: CompanySettings;
  onSaveSettings: (s: CompanySettings) => void;
  onExportBackup: () => void;
  onImportBackup: (jsonStr: string) => boolean;
  onResetDemoData: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  onSaveSettings,
  onExportBackup,
  onImportBackup,
  onResetDemoData,
}) => {
  const [formData, setFormData] = useState<CompanySettings>(settings);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
    <div className="p-3 sm:p-6 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 rounded-2xl p-6 text-white shadow-md border border-slate-800">
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <span className="bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Sistem Konfigürasyonu
            </span>
            <h1 className="text-xl font-black text-white flex items-center gap-2 mt-1">
              <SettingsIcon className="w-6 h-6 text-indigo-300" />
              Sistem ve Parametre Ayarları
            </h1>
            <p className="text-xs text-indigo-200/90 mt-1 max-w-xl leading-relaxed">
              Fatura seri/sıra numarası formatı, varsayılan para birimi, KDV oranları ve yerel veri yedekleme/içe aktarma tercihlerini yapılandırın.
            </p>
          </div>
        </div>
      </div>

      {/* System Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs">
          <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-600" />
            Fatura & Belge Format Parametreleri
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
            <Save className="w-4 h-4 text-[#EF7D2C]" />
            <span>Sistem Ayarlarını Kaydet</span>
          </button>
        </div>
      </form>

      {/* Central Bank (TCMB) Exchange Rates Section */}
      <ExchangeRatesWidget compact={false} />

      {/* Backup & Data Recovery */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
        <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
          <Database className="w-4 h-4 text-purple-600" />
          Veri Tabanı Yedekleme, Aktarma ve Sıfırlama
        </h3>

        <p className="text-slate-600 leading-relaxed">
          Uygulama verileriniz (firmalar, şubeler, depolar, faturalar, cari hesaplar, stoklar) taranmış olarak tarayıcınızda saklanmaktadır. İstediğiniz an tam veri yedeği (JSON) indirebilir veya dışarıdan yükleyebilirsiniz.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={onExportBackup}
            className="bg-slate-900 hover:bg-slate-950 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-purple-400" />
            <span>Tüm Sistem Verilerini İndir (JSON Yedeği)</span>
          </button>

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

          <button
            onClick={() => {
              if (confirm("Tüm veriler sıfırlanıp varsayılan demo veriler yüklensin mi?")) {
                onResetDemoData();
              }
            }}
            className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-colors border border-rose-200 ml-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Örnek Demo Verileri Yeniden Yükle</span>
          </button>
        </div>
      </div>
    </div>
  );
};
