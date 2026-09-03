import React, { useState, useEffect } from "react";
import { CompanySettings } from "../types";
import {
  X,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  Lock,
  User,
  Key,
  FileText,
  Download,
  AlertCircle,
  Building2,
  Search,
  Check,
  CreditCard,
  Printer,
  Sparkles,
} from "lucide-react";
import { DetailPageLayout } from "./common/DetailPageLayout";

interface GibPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  companySettings: CompanySettings;
}

export const GibPortalModal: React.FC<GibPortalModalProps> = ({
  isOpen,
  onClose,
  companySettings,
}) => {
  const taxCreds = companySettings.taxCredentials || {};

  // Form State
  const [userCode, setUserCode] = useState(taxCreds.userCode || "");
  const [password, setPassword] = useState(taxCreds.password || "");
  const [codeSecret, setCodeSecret] = useState(taxCreds.codeSecret || "");
  const [captchaInput, setCaptchaInput] = useState("");
  const [generatedCaptcha, setGeneratedCaptcha] = useState("");

  // UI Flow State
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [activePortalTab, setActivePortalTab] = useState<"summary" | "declarations" | "debts" | "eTebligat">("summary");

  // Generate random CAPTCHA code
  const refreshCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedCaptcha(code);
    setCaptchaInput("");
  };

  useEffect(() => {
    if (isOpen) {
      setUserCode(taxCreds.userCode || "3484702910");
      setPassword(taxCreds.password || "••••••••");
      setCodeSecret(taxCreds.codeSecret || "GIB-84920");
      refreshCaptcha();
      setIsLoggedIn(false);
      setErrorMessage("");
    }
  }, [isOpen, companySettings]);

  if (!isOpen) return null;

  const handleAutoFill = () => {
    setUserCode(taxCreds.userCode || "3484702910");
    setPassword(taxCreds.password || "••••••••");
    setCodeSecret(taxCreds.codeSecret || "GIB-84920");
    setCaptchaInput(generatedCaptcha);
    setErrorMessage("");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!userCode.trim() || !password.trim()) {
      setErrorMessage("Lütfen Kullanıcı Kodu ve Parola alanlarını doldurunuz.");
      return;
    }

    if (captchaInput.toUpperCase() !== generatedCaptcha.toUpperCase()) {
      setErrorMessage("Güvenlik doğrulama kodu (reCAPTCHA) hatalı. Lütfen tekrar deneyiniz.");
      refreshCaptcha();
      return;
    }

    setErrorMessage("");
    setIsLoading(true);

    // Simulate GİB Server Auth Latency
    setTimeout(() => {
      setIsLoading(false);
      setIsLoggedIn(true);
    }, 1200);
  };

  return (
    <DetailPageLayout
      title="GİB Dijital Vergi Dairesi Entegrasyonu"
      subtitle="T.C. Hazine ve Maliye Bakanlığı • Gelir İdaresi Başkanlığı Portal Girişi ve Beyanname/Borç Sorgulama"
      breadcrumbs={[
        { label: "E-Dönüşüm", onClick: onClose },
        { label: "GİB Dijital Vergi Dairesi", active: true },
      ]}
      onBack={onClose}
      statusBadge={
        <span className="bg-red-50 text-red-700 border border-red-200 text-xs font-bold px-3 py-1 rounded-xl uppercase">
          GİB RESMİ ENTEGRE
        </span>
      }
      headerIcon={<ShieldCheck className="w-5 h-5 text-red-600" />}
      actions={
        <div className="flex items-center gap-2">
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
      <div className="bg-white w-full max-w-4xl mx-auto rounded-3xl shadow-sm border border-slate-200 p-6 space-y-6">
          {!isLoggedIn ? (
            /* LOGIN SCREEN */
            <div className="max-w-xl mx-auto space-y-6">
              {/* Info Banner */}
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start justify-between gap-3 text-amber-900 text-xs font-medium">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Sistem Şifreleriniz Aktarıldı:</strong> Firma Ayarlarında kayıtlı olan kullanıcı kodu, parola ve özel şifreniz forma otomatik olarak aktarılmıştır.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAutoFill}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-xl shrink-0 transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Oto-Doldur
                </button>
              </div>

              {errorMessage && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div className="border-b border-slate-200 pb-3 mb-2 flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                    <Lock className="w-4 h-4 text-red-600" />
                    Dijital Vergi Dairesi Giriş Kimlik Bilgileri
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">İnteraktif VD / e-Beyanname</span>
                </div>

                {/* Kullanıcı Kodu */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-red-600" /> Kullanıcı Kodu *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="GİB Kullanıcı Kodu"
                    value={userCode}
                    onChange={(e) => setUserCode(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                {/* Parola */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-red-600" /> Parola *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="GİB Giriş Parolası"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                {/* Şifre / Özel Şifre */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-red-600" /> Özel Şifre (GİB Kod)
                  </label>
                  <input
                    type="password"
                    placeholder="GİB Özel Şifre"
                    value={codeSecret}
                    onChange={(e) => setCodeSecret(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                {/* reCAPTCHA / Güvenlik Kodu Box */}
                <div className="pt-2 border-t border-slate-200 space-y-3">
                  <label className="block text-xs font-bold text-slate-800">
                    Güvenlik Doğrulama Kodu (reCAPTCHA) *
                  </label>

                  <div className="flex items-center gap-3">
                    {/* Visual Captcha Canvas */}
                    <div className="relative bg-slate-900 text-emerald-400 font-mono font-black text-xl tracking-widest px-5 py-2.5 rounded-xl shadow-inner select-none flex items-center justify-center border border-slate-700 min-w-[140px] italic">
                      <span className="line-through decoration-red-500 decoration-2 opacity-90">{generatedCaptcha}</span>
                    </div>

                    <button
                      type="button"
                      onClick={refreshCaptcha}
                      className="p-2.5 text-slate-600 hover:text-red-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                      title="Güvenlik Kodunu Yenile"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      required
                      placeholder="Güvenlik kodunu yazınız"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      className="flex-1 bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-mono uppercase font-bold text-slate-900 focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-red-700 hover:bg-red-800 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Gelir İdaresi Başkanlığı Sunucularına Bağlanılıyor...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      GİB Dijital Vergi Dairesine Güvenli Giriş Yap
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* LOGGED IN PORTAL SCREEN */
            <div className="space-y-6">
              {/* Account Header Badge */}
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
                    GİB
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {companySettings.companyTitle || companySettings.companyName}
                      </span>
                      <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Oturum Açıldı
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      VKN/TCKN: <strong className="font-mono text-slate-900">{companySettings.taxNumber}</strong> • Vergi Dairesi: <strong className="text-slate-900">{companySettings.taxOffice}</strong> • Mükellefiyet: <strong className="text-purple-700">{companySettings.taxpayerType || "Anonim Şirket"}</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsLoggedIn(false)}
                  className="bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all cursor-pointer"
                >
                  Oturumu Kapat
                </button>
              </div>

              {/* Portal Sub-tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                  onClick={() => setActivePortalTab("summary")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activePortalTab === "summary"
                      ? "bg-red-700 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Genel Durum & Vergi Levhası
                </button>
                <button
                  onClick={() => setActivePortalTab("declarations")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activePortalTab === "declarations"
                      ? "bg-red-700 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  e-Beyanname & Alındı Belgeleri
                </button>
                <button
                  onClick={() => setActivePortalTab("debts")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activePortalTab === "debts"
                      ? "bg-red-700 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Borcu Yoktur & Tahakkuklar
                </button>
                <button
                  onClick={() => setActivePortalTab("eTebligat")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activePortalTab === "eTebligat"
                      ? "bg-red-700 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  e-Tebligat Zarf Listesi
                </button>
              </div>

              {/* Portal Content View */}
              {activePortalTab === "summary" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                    <h4 className="font-extrabold text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                      <span>e-Vergi Levhası (Sorgu Sonucu)</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Faal Mükellef</span>
                    </h4>

                    <div className="space-y-2 font-medium text-slate-700">
                      <p><strong>Faaliyet Kodu (NACE):</strong> 620101 - Bilgisayar Programlama Faaliyetleri</p>
                      <p><strong>Beyan Edilen Son Matrah:</strong> ₺1.450.000,00</p>
                      <p><strong>Tahakkuk Eden Vergi:</strong> ₺362.500,00 (%25 KVK)</p>
                      <p><strong>Onay Kodu:</strong> GİB-2026-98402910</p>
                    </div>

                    <button className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold border border-slate-300 py-2 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer">
                      <Download className="w-3.5 h-3.5 text-red-600" /> e-Vergi Levhasını PDF İndir
                    </button>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                    <h4 className="font-extrabold text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                      <span>Mükellefiyet İletişim Bilgileri</span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">GİB Onaylı</span>
                    </h4>

                    <div className="space-y-2 font-medium text-slate-700">
                      <p><strong>Adres:</strong> {companySettings.address || "Mecidiyeköy Mah. Büyükdere Cad. No:142 Şişli / İstanbul"}</p>
                      <p><strong>Mersis No:</strong> {companySettings.mersisNo || "084702910380001"}</p>
                      <p><strong>Ticaret Sicil No:</strong> {companySettings.tradeRegisterNo || "384910-5"}</p>
                      <p><strong>Telefon:</strong> {companySettings.phone || "+90 212 555 0100"}</p>
                    </div>

                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-[11px] font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      GİB e-Fatura / e-Arşiv Aktif Mükellef Statüsündedir.
                    </div>
                  </div>
                </div>
              )}

              {activePortalTab === "declarations" && (
                <div className="space-y-3 text-xs">
                  <h4 className="font-extrabold text-slate-900">Son Verilen e-Beyanname ve Onaylı Alındı Belgeleri</h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5">Dönem</th>
                          <th className="p-2.5">Beyanname Türü</th>
                          <th className="p-2.5">Onay Zamanı</th>
                          <th className="p-2.5 text-right">Tahakkuk Tutarı</th>
                          <th className="p-2.5 text-center">Durum</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        <tr>
                          <td className="p-2.5 font-bold">2026/06</td>
                          <td className="p-2.5">KDV-1 Beyannamesi</td>
                          <td className="p-2.5 text-slate-500">26.07.2026 14:22</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">₺14.820,50</td>
                          <td className="p-2.5 text-center">
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">Onaylandı</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold">2026/06</td>
                          <td className="p-2.5">Muhtasar ve Prim Hizmet Bey.</td>
                          <td className="p-2.5 text-slate-500">24.07.2026 11:05</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">₺8.450,00</td>
                          <td className="p-2.5 text-center">
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">Onaylandı</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold">2026/1.Geçici</td>
                          <td className="p-2.5">Geçici Vergi Beyannamesi</td>
                          <td className="p-2.5 text-slate-500">16.05.2026 16:40</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">₺42.100,00</td>
                          <td className="p-2.5 text-center">
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">Onaylandı</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activePortalTab === "debts" && (
                <div className="space-y-4 text-xs">
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
                      <div>
                        <h4 className="font-extrabold text-emerald-950 text-sm">GİB Borcu Yoktur Belgesi (Sorgu Sonucu)</h4>
                        <p className="text-slate-600 font-medium">Sistemde vadesi geçmiş ödenmemiş vergi borcunuz bulunmamaktadır.</p>
                      </div>
                    </div>

                    <button className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shrink-0">
                      <Printer className="w-3.5 h-3.5" /> Resmi Belgeyi Yazdır
                    </button>
                  </div>
                </div>
              )}

              {activePortalTab === "eTebligat" && (
                <div className="space-y-3 text-xs">
                  <h4 className="font-extrabold text-slate-900">GİB e-Tebligat Zarf ve Bildirim Listesi</h4>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 font-medium text-slate-600 text-center py-8">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <span>Okunmamış yeni e-Tebligat evrakınız bulunmamaktadır. Tüm tebligatlar zamanında tebellüğ edilmiştir.</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-500 font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Güvenli Bağlantı (256-Bit SSL) • T.C. Gelir İdaresi Başkanlığı API Entegrasyonu</span>
          </div>

          <button
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
          >
            Geri Dön
          </button>
        </div>
    </DetailPageLayout>
  );
};
