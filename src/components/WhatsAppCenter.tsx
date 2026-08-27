import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Send,
  FileText,
  Clock,
  Settings,
  History,
  Copy,
  Check,
  HelpCircle,
  Layers,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import {
  WhatsAppClientStatus,
  WhatsAppLogItem,
  WhatsAppTemplates,
  fetchWhatsAppStatus,
  connectWhatsAppApi,
  logoutWhatsAppApi,
  sendWhatsAppTextApi,
  fetchWhatsAppLogs,
  fetchWhatsAppTemplates,
  saveWhatsAppTemplatesApi,
} from "../services/whatsappClient";
import { CompanySettings } from "../types";

interface WhatsAppCenterProps {
  settings: CompanySettings;
}

export const WhatsAppCenter: React.FC<WhatsAppCenterProps> = ({ settings }) => {
  const [activeTab, setActiveTab] = useState<"connection" | "test" | "templates" | "logs">("connection");
  const [statusData, setStatusData] = useState<WhatsAppClientStatus>({
    status: "disconnected",
    qrCodeDataUrl: null,
    connectedPhone: null,
    connectedName: null,
    connectedAt: null,
    lastError: null,
  });
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Test form state
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Sayın İlgili, Muavin Ön Muhasebe sistemi üzerinden gönderilen test iletisidir.");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  // Templates state
  const [templates, setTemplates] = useState<WhatsAppTemplates>({
    statementTemplate: "",
    invoiceTemplate: "",
    paymentTemplate: "",
  });
  const [isSavingTemplates, setIsSavingTemplates] = useState(false);
  const [templateSaveSuccess, setTemplateSaveSuccess] = useState(false);

  // Logs state
  const [logs, setLogs] = useState<WhatsAppLogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const loadStatus = async (silent = false) => {
    if (!silent) setIsLoadingStatus(true);
    try {
      const data = await fetchWhatsAppStatus();
      setStatusData(data);
    } catch (e) {
      console.warn("Status fetch failed:", e);
    } finally {
      if (!silent) setIsLoadingStatus(false);
    }
  };

  const loadLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const logList = await fetchWhatsAppLogs();
      setLogs(logList);
    } catch (e) {
      console.warn("Logs fetch failed:", e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const t = await fetchWhatsAppTemplates();
      setTemplates(t);
    } catch (e) {
      console.warn("Templates fetch failed:", e);
    }
  };

  useEffect(() => {
    loadStatus();
    loadTemplates();
    loadLogs();
  }, []);

  // Poll status when in connecting or qr_ready state
  useEffect(() => {
    let interval: any = null;
    if (statusData.status === "connecting" || statusData.status === "qr_ready") {
      interval = setInterval(() => {
        loadStatus(true);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [statusData.status]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const data = await connectWhatsAppApi();
      setStatusData(data);
    } catch (err: any) {
      alert("Bağlantı başlatılamadı: " + err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm("WhatsApp oturumunu sonlandırmak istediğinize emin misiniz?")) return;
    setIsLoggingOut(true);
    try {
      const data = await logoutWhatsAppApi();
      setStatusData(data);
      alert("WhatsApp oturumu başarıyla sonlandırıldı.");
    } catch (err: any) {
      alert("Oturum kapatılamadı: " + err.message);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim() || !testMessage.trim()) {
      alert("Lütfen telefon numarası ve mesaj metni girin.");
      return;
    }
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await sendWhatsAppTextApi(testPhone, testMessage, "Test Alıcısı");
      if (res.success) {
        setTestResult({ success: true, msg: "✅ Test mesajı WhatsApp üzerinden başarıyla iletildi!" });
        loadLogs();
      } else {
        setTestResult({ success: false, msg: `❌ Hata: ${res.error || "Bilinmeyen hata"}` });
      }
    } catch (err: any) {
      setTestResult({ success: false, msg: `❌ Hata: ${err.message}` });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSaveTemplates = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTemplates(true);
    setTemplateSaveSuccess(false);
    try {
      const updated = await saveWhatsAppTemplatesApi(templates);
      setTemplates(updated);
      setTemplateSaveSuccess(true);
      setTimeout(() => setTemplateSaveSuccess(false), 3000);
    } catch (err: any) {
      alert("Şablonlar kaydedilemedi: " + err.message);
    } finally {
      setIsSavingTemplates(false);
    }
  };

  const insertVariable = (templateKey: keyof WhatsAppTemplates, variable: string) => {
    setTemplates((prev) => ({
      ...prev,
      [templateKey]: (prev[templateKey] || "") + variable,
    }));
  };

  return (
    <div className="p-3 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-emerald-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Doğrudan İletişim Entegrasyonu
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-emerald-400" />
              WhatsApp İletişim & Entegrasyon Merkezi
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200/80 max-w-2xl leading-relaxed">
              Cari ekstrelerinizi, faturalarınızı ve tediye/tahsilat dekontlarınızı WhatsApp Web sekmesine ihtiyaç duymadan,
              tek tıkla müşterilerinizin telefonuna resmi PDF eki olarak doğrudan gönderin.
            </p>
          </div>

          {/* Quick Status Pill & Refresh */}
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`px-4 py-2 rounded-2xl flex items-center gap-2.5 font-bold text-xs shadow-inner ${
                statusData.status === "connected"
                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                  : statusData.status === "qr_ready"
                  ? "bg-amber-500/20 border border-amber-500/40 text-amber-300 animate-pulse"
                  : statusData.status === "connecting"
                  ? "bg-blue-500/20 border border-blue-500/40 text-blue-300 animate-pulse"
                  : "bg-rose-500/20 border border-rose-500/40 text-rose-300"
              }`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  statusData.status === "connected"
                    ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                    : statusData.status === "qr_ready"
                    ? "bg-amber-400"
                    : statusData.status === "connecting"
                    ? "bg-blue-400"
                    : "bg-rose-400"
                }`}
              />
              <span>
                {statusData.status === "connected"
                  ? `Bağlı (${statusData.connectedPhone || "Aktif"})`
                  : statusData.status === "qr_ready"
                  ? "QR Kod Bekleniyor"
                  : statusData.status === "connecting"
                  ? "Bağlanıyor..."
                  : "Bağlantı Yok"}
              </span>
            </div>

            <button
              onClick={() => loadStatus()}
              disabled={isLoadingStatus}
              title="Durumu Yenile"
              className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingStatus ? "animate-spin text-emerald-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mt-6 border-t border-emerald-800/30 pt-4">
          {[
            { id: "connection", label: "Bağlantı & QR Kod", icon: QrCode },
            { id: "test", label: "Hızlı Test Gönderimi", icon: Send },
            { id: "templates", label: "Mesaj Şablonları", icon: FileText },
            { id: "logs", label: "Gönderim Geçmişi & Loglar", icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === "logs") loadLogs();
                  if (tab.id === "templates") loadTemplates();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                    : "bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: CONNECTION & QR CODE */}
      {activeTab === "connection" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: QR or Active Card */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            {statusData.status === "connected" ? (
              <div className="text-center py-6 space-y-6">
                <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900">WhatsApp Başarıyla Bağlandı</h3>
                  <p className="text-sm font-semibold text-emerald-600">Sistem ile WhatsApp API eşleşmesi aktif</p>
                </div>

                <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Bağlı Telefon Numarası:</span>
                    <span className="font-bold text-slate-900 font-mono text-sm">{statusData.connectedPhone || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">WhatsApp Kullanıcı Adı:</span>
                    <span className="font-bold text-slate-900">{statusData.connectedName || "Muavin Kullanıcısı"}</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500 font-medium">Son Bağlantı Zamanı:</span>
                    <span className="font-bold text-slate-700">
                      {statusData.connectedAt ? new Date(statusData.connectedAt).toLocaleString("tr-TR") : "Şimdi"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab("test")}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer transition"
                  >
                    <Send className="w-4 h-4" />
                    Test Mesajı Gönder
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="px-5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs flex items-center gap-2 cursor-pointer transition"
                  >
                    <LogOut className="w-4 h-4" />
                    {isLoggingOut ? "Çıkış Yapılıyor..." : "Oturumu Kapat / Bağlantıyı Kes"}
                  </button>
                </div>
              </div>
            ) : statusData.status === "qr_ready" && statusData.qrCodeDataUrl ? (
              <div className="text-center space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                  <QrCode className="w-4 h-4 text-amber-600" />
                  QR Kodu Telefonunuzla Taratın
                </div>

                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-3xl border-2 border-emerald-500 shadow-xl inline-block relative group">
                    <img
                      src={statusData.qrCodeDataUrl}
                      alt="WhatsApp QR Code"
                      className="w-64 h-64 sm:w-72 sm:h-72 rounded-2xl mx-auto"
                    />
                    <div className="absolute inset-0 bg-emerald-500/5 rounded-3xl pointer-events-none" />
                  </div>
                </div>

                <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                  💡 QR kod birkaç dakikada bir otomatik yenilenir. Tarattıktan sonra sayfa otomatik olarak bağlı durumuna geçecektir.
                </p>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 cursor-pointer transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? "animate-spin text-emerald-600" : ""}`} />
                    QR Kodu Yenile
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-6">
                <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 border-4 border-slate-200 flex items-center justify-center text-slate-400">
                  <Smartphone className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900">WhatsApp Henüz Bağlı Değil</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Doğrudan PDF cari ekstre ve fatura gönderebilmek için WhatsApp hesabınızı QR kod ile sisteme eşleştirin.
                  </p>
                </div>

                {statusData.lastError && (
                  <div className="max-w-md mx-auto p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{statusData.lastError}</span>
                  </div>
                )}

                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center gap-2.5 mx-auto shadow-lg shadow-emerald-600/25 cursor-pointer transition transform hover:-translate-y-0.5"
                >
                  <QrCode className="w-5 h-5" />
                  {isConnecting ? "QR Kod Hazırlanıyor..." : "WhatsApp'a Bağlan (QR Kod Oluştur)"}
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Step-by-Step Instructions & FAQ */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-sm space-y-5">
              <h3 className="text-sm font-extrabold text-emerald-400 flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Nasıl Bağlanır? (Adım Adım)
              </h3>

              <ol className="space-y-4 text-xs">
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 border border-emerald-500/40">
                    1
                  </span>
                  <div className="space-y-0.5">
                    <p className="font-bold text-white">WhatsApp'ı Açın</p>
                    <p className="text-slate-400">Telefonunuzda WhatsApp veya WhatsApp Business uygulamasını açın.</p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 border border-emerald-500/40">
                    2
                  </span>
                  <div className="space-y-0.5">
                    <p className="font-bold text-white">Bağlı Cihazlar Menüsü</p>
                    <p className="text-slate-400">
                      <strong>Android:</strong> Sağ üstteki 3 noktaya dokunun → <strong>Bağlı Cihazlar</strong><br />
                      <strong>iPhone:</strong> Sağ alttaki <strong>Ayarlar</strong> → <strong>Bağlı Cihazlar</strong>
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 border border-emerald-500/40">
                    3
                  </span>
                  <div className="space-y-0.5">
                    <p className="font-bold text-white">Cihaz Bağla & QR Okutun</p>
                    <p className="text-slate-400">
                      <strong>"Cihaz Bağla"</strong> butonuna dokunun ve ekrandaki QR kodu kameranızla okutun.
                    </p>
                  </div>
                </li>
              </ol>

              <div className="p-3.5 bg-emerald-950/60 border border-emerald-800/60 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  Güvenlik & Gizlilik
                </div>
                <p className="text-[11px] text-emerald-200/70 leading-relaxed">
                  Oturum anahtarları kendi sunucunuzda şifreli olarak saklanır. Mesajlar doğrudan sizin WhatsApp hattınızdan iletilir. Üçüncü şahıs sunuculara veri aktarılmaz.
                </p>
              </div>
            </div>

            {/* Quick Feature Highlights */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3 text-xs">
              <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                Nerelerde Kullanabilirsiniz?
              </h4>
              <ul className="space-y-2 text-slate-600 font-medium">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Cari Ekstre:</strong> Müşteriye anlık PDF ekstre + bakiye özeti</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>e-Fatura / e-Arşiv:</strong> Kesilen faturaları tek tıkla PDF iletme</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Kasa / Banka Dekontu:</strong> Tahsilat ve tediye makbuzları</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Çek & Senet Bildirimi:</strong> Vade hatırlatmaları</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEST SENDER */}
      {activeTab === "test" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 max-w-2xl">
          <div className="space-y-1 border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-600" />
              WhatsApp Hızlı Test Gönderimi
            </h3>
            <p className="text-xs text-slate-500">
              Bağlantınızın çalıştığını doğrulamak için kendi telefon numaranıza veya bir numaraya test mesajı gönderin.
            </p>
          </div>

          <form onSubmit={handleSendTest} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Alıcı Telefon Numarası</label>
              <input
                type="text"
                placeholder="Örn: 0532 123 45 67 veya 905321234567"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Başında 0 veya ülke kodu olmadan da yazabilirsiniz. Sistem otomatik düzeltecektir.
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Test Mesajı</label>
              <textarea
                rows={4}
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>

            {testResult && (
              <div
                className={`p-3.5 rounded-xl text-xs font-bold border ${
                  testResult.success
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}
              >
                {testResult.msg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSendingTest || statusData.status !== "connected"}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer transition shadow-md shadow-emerald-600/20"
            >
              <Send className={`w-4 h-4 ${isSendingTest ? "animate-spin" : ""}`} />
              {isSendingTest ? "Mesaj Gönderiliyor..." : "Test İletisini Gönder"}
            </button>

            {statusData.status !== "connected" && (
              <p className="text-[11px] text-amber-600 text-center font-semibold">
                ⚠️ Mesaj gönderebilmek için önce "Bağlantı & QR Kod" sekmesinden WhatsApp'a bağlanmanız gerekmektedir.
              </p>
            )}
          </form>
        </div>
      )}

      {/* TAB 3: MESSAGE TEMPLATES */}
      {activeTab === "templates" && (
        <form onSubmit={handleSaveTemplates} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Otomatik Mesaj Şablonları
              </h3>
              <p className="text-xs text-slate-500">
                Cari ekstre, fatura ve dekont gönderimlerinde kullanılan standart bildirim metinlerini özelleştirin.
              </p>
            </div>
            {templateSaveSuccess && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Kaydedildi
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Cari Ekstre Şablonu */}
            <div className="space-y-2">
              <label className="block font-bold text-slate-800 flex items-center justify-between">
                <span>1. Cari Ekstre Mesaj Şablonu</span>
              </label>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {[
                  { tag: "{cari_adi}", label: "Cari Ünvanı" },
                  { tag: "{hesap_kodu}", label: "Hesap Kodu" },
                  { tag: "{firma}", label: "Firma Adınız" },
                  { tag: "{bakiye}", label: "Net Bakiye" },
                  { tag: "{bakiye_durumu}", label: "Borç/Alacak Durumu" },
                ].map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => insertVariable("statementTemplate", item.tag)}
                    className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold cursor-pointer"
                  >
                    + {item.label}
                  </button>
                ))}
              </div>
              <textarea
                rows={6}
                value={templates.statementTemplate}
                onChange={(e) => setTemplates({ ...templates, statementTemplate: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Fatura Şablonu */}
            <div className="space-y-2">
              <label className="block font-bold text-slate-800 flex items-center justify-between">
                <span>2. Fatura & e-Belge Mesaj Şablonu</span>
              </label>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {[
                  { tag: "{cari_adi}", label: "Cari Ünvanı" },
                  { tag: "{firma}", label: "Firma Adınız" },
                  { tag: "{fatura_no}", label: "Fatura No" },
                  { tag: "{tutar}", label: "Tutar" },
                  { tag: "{tarih}", label: "Tarih" },
                ].map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => insertVariable("invoiceTemplate", item.tag)}
                    className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold cursor-pointer"
                  >
                    + {item.label}
                  </button>
                ))}
              </div>
              <textarea
                rows={6}
                value={templates.invoiceTemplate}
                onChange={(e) => setTemplates({ ...templates, invoiceTemplate: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Tahsilat Dekontu Şablonu */}
            <div className="space-y-2 md:col-span-2">
              <label className="block font-bold text-slate-800 flex items-center justify-between">
                <span>3. Tahsilat / Tediye Dekont Şablonu</span>
              </label>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {[
                  { tag: "{cari_adi}", label: "Cari Ünvanı" },
                  { tag: "{firma}", label: "Firma Adınız" },
                  { tag: "{tutar}", label: "İşlem Tutarı" },
                  { tag: "{tarih}", label: "Tarih" },
                ].map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => insertVariable("paymentTemplate", item.tag)}
                    className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold cursor-pointer"
                  >
                    + {item.label}
                  </button>
                ))}
              </div>
              <textarea
                rows={4}
                value={templates.paymentTemplate}
                onChange={(e) => setTemplates({ ...templates, paymentTemplate: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSavingTemplates}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 transition"
            >
              <Check className="w-4 h-4" />
              {isSavingTemplates ? "Kaydediliyor..." : "Şablon Değişikliklerini Kaydet"}
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: LOGS & HISTORY */}
      {activeTab === "logs" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" />
                WhatsApp Gönderim Geçmişi
              </h3>
              <p className="text-xs text-slate-500">
                Sistemden carilere ve müşterilere iletilen tüm mesaj ve belgelerin canlı raporu.
              </p>
            </div>
            <button
              onClick={loadLogs}
              disabled={isLoadingLogs}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 cursor-pointer transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? "animate-spin text-emerald-600" : ""}`} />
              Yenile
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <History className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-slate-700">Henüz Gönderilmiş Bir WhatsApp İletisi Bulunmuyor</p>
              <p className="text-xs text-slate-400">Cari ekstre veya test mesajı gönderdiğinizde burada listelenecektir.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/50">
                    <th className="py-3 px-4">Tarih / Saat</th>
                    <th className="py-3 px-4">Alıcı Cari / Numara</th>
                    <th className="py-3 px-4">İleti Türü</th>
                    <th className="py-3 px-4">Dosya / Açıklama</th>
                    <th className="py-3 px-4 text-right">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString("tr-TR")}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{log.contactName || "Belirtilmemiş"}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{log.phone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold ${
                            log.type === "document"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {log.type === "document" ? (
                            <>
                              <FileText className="w-3 h-3" /> PDF Belgesi
                            </>
                          ) : (
                            <>
                              <MessageSquare className="w-3 h-3" /> Metin
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate">
                        {log.fileName ? (
                          <span className="font-semibold text-slate-900">{log.fileName}</span>
                        ) : (
                          <span className="text-slate-600">{log.caption || "-"}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {log.status === "sent" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" /> İletildi
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold"
                            title={log.error}
                          >
                            <AlertCircle className="w-3 h-3" /> Hata
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
