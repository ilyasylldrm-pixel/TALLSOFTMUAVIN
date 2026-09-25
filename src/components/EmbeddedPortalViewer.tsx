import React, { useState, useRef, useEffect } from "react";
import {
  CompanySettings,
  WorkplaceSgkCredential,
  Branch,
  Warehouse,
} from "../types";
import {
  Globe,
  RefreshCw,
  Maximize2,
  Minimize2,
  ExternalLink,
  Zap,
  Check,
  Copy,
  ShieldCheck,
  Building,
  Key,
  Lock,
  User,
  Info,
  Sparkles,
  Search,
  Eye,
  EyeOff,
  Layers,
  FileSpreadsheet,
  FileText,
  CreditCard,
  ChevronDown,
} from "lucide-react";

export interface EmbeddedPortalViewerProps {
  companySettings: CompanySettings;
  branches?: Branch[];
  warehouses?: Warehouse[];
  onOpenGibModal?: () => void;
  onOpenSgkModal?: (portal: "isveren" | "ebildirgev2") => void;
  onOpenTebligatModal?: () => void;
}

export interface PortalTabItem {
  id: string;
  name: string;
  category: "gib" | "sgk" | "edevlet" | "mersis";
  badge: string;
  icon: string;
  proxyUrl: string;
  directUrl: string;
  description: string;
}

const PORTAL_TABS: PortalTabItem[] = [
  {
    id: "gib_dijital",
    name: "GİB Dijital Vergi Dairesi",
    category: "gib",
    badge: "Vergi / İVD",
    icon: "🏛️",
    proxyUrl: "/api/portal-proxy/view/gib_dijital",
    directUrl: "https://dijital.gib.gov.tr",
    description: "Beyannameler, vergi levhası, borç durumu ve İnteraktif Vergi Dairesi",
  },
  {
    id: "gib_earsiv",
    name: "GİB e-Arşiv Portalı",
    category: "gib",
    badge: "5.000/30.000",
    icon: "📄",
    proxyUrl: "/api/portal-proxy/view/gib_earsiv",
    directUrl: "https://earsivportal.efatura.gov.tr/intragiris.html",
    description: "5.000 TL / 30.000 TL GİB resmi e-Arşiv fatura oluşturma ve sorgulama",
  },
  {
    id: "sgk_isveren",
    name: "SGK İşveren Sistemi",
    category: "sgk",
    badge: "İşveren / Teşvik",
    icon: "🏢",
    proxyUrl: "/api/portal-proxy/view/sgk_isveren",
    directUrl: "https://uyg.sgk.gov.tr/IsverenSistemi",
    description: "İşyeri tescil, istihdam teşvikleri, borç sorgulama ve işveren işlemleri",
  },
  {
    id: "sgk_ebildirge",
    name: "SGK e-Bildirge v2",
    category: "sgk",
    badge: "Bildirge / Prim",
    icon: "📋",
    proxyUrl: "/api/portal-proxy/view/sgk_ebildirge",
    directUrl: "https://ebildirge.sgk.gov.tr/EBildirgeV2",
    description: "Aylık prim ve hizmet belgeleri, MUHSGK ve sigortalı bildirimleri",
  },
  {
    id: "edevlet",
    name: "e-Devlet Kapısı Kurumsal",
    category: "edevlet",
    badge: "e-Devlet",
    icon: "🇹🇷",
    proxyUrl: "/api/portal-proxy/view/edevlet",
    directUrl: "https://giris.turkiye.gov.tr/Giris/",
    description: "T.C. e-Devlet Kapısı resmi kurum ve şirket yetkili işlem girişi",
  },
  {
    id: "mersis",
    name: "Ticaret Bakanlığı MERSİS",
    category: "mersis",
    badge: "MERSİS",
    icon: "🏛️",
    proxyUrl: "/api/portal-proxy/view/mersis",
    directUrl: "https://mersis.gtb.gov.tr/",
    description: "Merkezi Sicil Kayıt Sistemi, Ticaret Sicil ve şirket işlemleri",
  },
  {
    id: "etebligat_sgk",
    name: "SGK e-Tebligat Portalı",
    category: "sgk",
    badge: "SGK Tebligat",
    icon: "📬",
    proxyUrl: "/api/portal-proxy/view/etebligat_sgk",
    directUrl: "https://etebligat.sgk.gov.tr/",
    description: "Sosyal Güvenlik Kurumu resmi elektronik tebligat ve evrak kontrolü",
  },
];

export const EmbeddedPortalViewer: React.FC<EmbeddedPortalViewerProps> = ({
  companySettings,
  branches = [],
  warehouses = [],
  onOpenGibModal,
  onOpenSgkModal,
  onOpenTebligatModal,
}) => {
  const [selectedPortalId, setSelectedPortalId] = useState<string>("gib_dijital");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isLoadingIframe, setIsLoadingIframe] = useState(true);
  const [iframeKey, setIframeKey] = useState(1);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showCredentialsBar, setShowCredentialsBar] = useState(true);
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [autoFillSuccessCount, setAutoFillSuccessCount] = useState<number | null>(null);
  const [selectedSgkWorkplaceId, setSelectedSgkWorkplaceId] = useState<string>("");

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const activePortal = PORTAL_TABS.find((p) => p.id === selectedPortalId) || PORTAL_TABS[0];

  // Workplaces normalized
  const workplaces: WorkplaceSgkCredential[] =
    companySettings.sgkCredentials?.workplaces &&
    Array.isArray(companySettings.sgkCredentials.workplaces) &&
    companySettings.sgkCredentials.workplaces.length > 0
      ? companySettings.sgkCredentials.workplaces
      : [
          {
            id: "main_default",
            name: "Merkez İşyeri",
            type: "main",
            workplaceRegistrationNo: companySettings.sgkCredentials?.workplaceRegistrationNo || "",
            userCode: companySettings.sgkCredentials?.userCode || "",
            workplaceCode: companySettings.sgkCredentials?.workplaceCode || "000",
            systemPassword: companySettings.sgkCredentials?.systemPassword || "",
            workplacePassword: companySettings.sgkCredentials?.workplacePassword || "",
          },
        ];

  const activeWorkplace =
    workplaces.find((w) => w.id === selectedSgkWorkplaceId) || workplaces[0];

  // Listen for bridge autofill response from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "MUAVIN_AUTOFILL_SUCCESS") {
        setAutoFillSuccessCount(event.data.filledCount || 3);
        setTimeout(() => setAutoFillSuccessCount(null), 4000);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAutoFill = () => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;

    const payload = {
      taxNumber: companySettings.taxNumber || "",
      userCode:
        activePortal.category === "sgk"
          ? activeWorkplace?.userCode || companySettings.sgkCredentials?.userCode || ""
          : companySettings.taxCredentials?.userCode || companySettings.taxNumber || "",
      password:
        activePortal.category === "sgk"
          ? activeWorkplace?.systemPassword || companySettings.sgkCredentials?.systemPassword || ""
          : companySettings.taxCredentials?.password || "",
      codeSecret: companySettings.taxCredentials?.codeSecret || "",
      workplaceCode: activeWorkplace?.workplaceCode || "000",
      systemPassword: activeWorkplace?.systemPassword || companySettings.sgkCredentials?.systemPassword || "",
      workplacePassword: activeWorkplace?.workplacePassword || companySettings.sgkCredentials?.workplacePassword || "",
      workplaceRegistrationNo: activeWorkplace?.workplaceRegistrationNo || "",
      tckn: companySettings.eDevletCredentials?.tckn || companySettings.taxNumber || "",
      eDevletPassword: companySettings.eDevletCredentials?.password || "",
    };

    try {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "MUAVIN_AUTOFILL",
          payload,
        },
        "*"
      );
    } catch (e) {
      console.warn("AutoFill postMessage hatası:", e);
    }

    // Local trigger feedback
    setAutoFillSuccessCount(3);
    setTimeout(() => setAutoFillSuccessCount(null), 3500);
  };

  const handleReloadIframe = () => {
    setIsLoadingIframe(true);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div
      className={`flex flex-col bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden transition-all duration-300 ${
        isFullScreen ? "fixed inset-0 z-[9999] rounded-none border-none" : "min-h-[850px] w-full"
      }`}
    >
      {/* TOP HEADER: PORTAL TABS & ACTIONS */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 sm:p-4 flex flex-col gap-3 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Title & Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-tight">
                  Gömülü Resmi Portallar Konsolu
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Canlı Webview & Auto-Fill
                </span>
              </div>
              <p className="text-xs text-slate-400">
                GİB, SGK, e-Arşiv ve e-Devlet sitelerini tarayıcıdan çıkmadan kullanın, şifreleri tek tıkla doldurun.
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex flex-wrap items-center gap-2">
            {/* AutoFill Main Button */}
            <button
              onClick={handleAutoFill}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
              title="Kayıtlı kullanıcı kodu ve şifreleri ilgili forma otomatik aktar"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>⚡ Otomatik Doldur & Giriş Yap</span>
            </button>

            {/* SGK Workplace Selector (if SGK tab) */}
            {activePortal.category === "sgk" && workplaces.length > 1 && (
              <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
                <Building className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <select
                  value={selectedSgkWorkplaceId || workplaces[0].id}
                  onChange={(e) => setSelectedSgkWorkplaceId(e.target.value)}
                  className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer"
                >
                  {workplaces.map((w) => (
                    <option key={w.id} value={w.id} className="bg-slate-900 text-white">
                      {w.name} ({w.workplaceCode})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quick credentials peek toggle */}
            <button
              onClick={() => setShowCredentialsBar(!showCredentialsBar)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                showCredentialsBar
                  ? "bg-slate-800 text-emerald-400 border-slate-700"
                  : "bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800"
              }`}
              title="Şifre çubuğunu aç/kapat"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Şifre Paneli</span>
            </button>

            {/* Reload iframe */}
            <button
              onClick={handleReloadIframe}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition cursor-pointer"
              title="Portalı Yeniden Yükle"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingIframe ? "animate-spin text-emerald-400" : ""}`} />
            </button>

            {/* Open direct in new tab */}
            <a
              href={activePortal.directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition cursor-pointer"
              title="Harici Sekmede Aç"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition cursor-pointer"
              title={isFullScreen ? "Tam Ekrandan Çık" : "Tam Ekran Yap"}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* PORTAL SELECTOR TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {PORTAL_TABS.map((tab) => {
            const isActive = selectedPortalId === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedPortalId(tab.id);
                  setIsLoadingIframe(true);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                    : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? "bg-slate-950/20 text-slate-950 font-black" : "bg-slate-700/60 text-slate-400"
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* QUICK CREDENTIALS BAR & ONE-CLICK COPY */}
        {showCredentialsBar && (
          <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-slate-400 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {activePortal.category === "sgk"
                  ? `SGK Giriş (${activeWorkplace.name}):`
                  : activePortal.category === "edevlet"
                  ? "e-Devlet Giriş:"
                  : "GİB Giriş Bilgileri:"}
              </span>

              {/* GİB Credentials Items */}
              {activePortal.category === "gib" && (
                <>
                  <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                    <span className="text-slate-500 font-mono text-[11px]">K.Kodu:</span>
                    <span className="text-slate-200 font-mono font-bold">
                      {companySettings.taxCredentials?.userCode || companySettings.taxNumber || "—"}
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(
                          companySettings.taxCredentials?.userCode || companySettings.taxNumber || "",
                          "gib_user"
                        )
                      }
                      className="text-slate-400 hover:text-emerald-400 ml-1 cursor-pointer"
                      title="Kopyala"
                    >
                      {copiedKey === "gib_user" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                    <span className="text-slate-500 font-mono text-[11px]">Parola:</span>
                    <span className="text-slate-200 font-mono font-bold">
                      {showPasswordText ? companySettings.taxCredentials?.password || "—" : "••••••••"}
                    </span>
                    <button
                      onClick={() => handleCopy(companySettings.taxCredentials?.password || "", "gib_pass")}
                      className="text-slate-400 hover:text-emerald-400 ml-1 cursor-pointer"
                      title="Kopyala"
                    >
                      {copiedKey === "gib_pass" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  {companySettings.taxCredentials?.codeSecret && (
                    <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                      <span className="text-slate-500 font-mono text-[11px]">Şifre:</span>
                      <span className="text-slate-200 font-mono font-bold">
                        {showPasswordText ? companySettings.taxCredentials.codeSecret : "••••••••"}
                      </span>
                      <button
                        onClick={() => handleCopy(companySettings.taxCredentials?.codeSecret || "", "gib_secret")}
                        className="text-slate-400 hover:text-emerald-400 ml-1 cursor-pointer"
                        title="Kopyala"
                      >
                        {copiedKey === "gib_secret" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* SGK Credentials Items */}
              {activePortal.category === "sgk" && (
                <>
                  <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                    <span className="text-slate-500 font-mono text-[11px]">K.Kodu:</span>
                    <span className="text-slate-200 font-mono font-bold">
                      {activeWorkplace.userCode || companySettings.sgkCredentials?.userCode || "—"}
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(
                          activeWorkplace.userCode || companySettings.sgkCredentials?.userCode || "",
                          "sgk_user"
                        )
                      }
                      className="text-slate-400 hover:text-emerald-400 ml-1 cursor-pointer"
                      title="Kopyala"
                    >
                      {copiedKey === "sgk_user" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                    <span className="text-slate-500 font-mono text-[11px]">İşyeri Kodu:</span>
                    <span className="text-slate-200 font-mono font-bold">
                      {activeWorkplace.workplaceCode || "000"}
                    </span>
                    <button
                      onClick={() => handleCopy(activeWorkplace.workplaceCode || "000", "sgk_wp_code")}
                      className="text-slate-400 hover:text-emerald-400 ml-1 cursor-pointer"
                      title="Kopyala"
                    >
                      {copiedKey === "sgk_wp_code" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                    <span className="text-slate-500 font-mono text-[11px]">Sistem Şifresi:</span>
                    <span className="text-slate-200 font-mono font-bold">
                      {showPasswordText ? activeWorkplace.systemPassword || "—" : "••••••••"}
                    </span>
                    <button
                      onClick={() => handleCopy(activeWorkplace.systemPassword || "", "sgk_sys_pass")}
                      className="text-slate-400 hover:text-emerald-400 ml-1 cursor-pointer"
                      title="Kopyala"
                    >
                      {copiedKey === "sgk_sys_pass" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                    <span className="text-slate-500 font-mono text-[11px]">İşyeri Şifresi:</span>
                    <span className="text-slate-200 font-mono font-bold">
                      {showPasswordText ? activeWorkplace.workplacePassword || "—" : "••••••••"}
                    </span>
                    <button
                      onClick={() => handleCopy(activeWorkplace.workplacePassword || "", "sgk_wp_pass")}
                      className="text-slate-400 hover:text-emerald-400 ml-1 cursor-pointer"
                      title="Kopyala"
                    >
                      {copiedKey === "sgk_wp_pass" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </>
              )}

              {/* e-Devlet Items */}
              {activePortal.category === "edevlet" && (
                <>
                  <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                    <span className="text-slate-500 font-mono text-[11px]">TCKN / VKN:</span>
                    <span className="text-slate-200 font-mono font-bold">
                      {companySettings.eDevletCredentials?.tckn || companySettings.taxNumber || "—"}
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(
                          companySettings.eDevletCredentials?.tckn || companySettings.taxNumber || "",
                          "edevlet_tckn"
                        )
                      }
                      className="text-slate-400 hover:text-emerald-400 ml-1 cursor-pointer"
                      title="Kopyala"
                    >
                      {copiedKey === "edevlet_tckn" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                    <span className="text-slate-500 font-mono text-[11px]">e-Devlet Şifresi:</span>
                    <span className="text-slate-200 font-mono font-bold">
                      {showPasswordText ? companySettings.eDevletCredentials?.password || "—" : "••••••••"}
                    </span>
                    <button
                      onClick={() => handleCopy(companySettings.eDevletCredentials?.password || "", "edevlet_pass")}
                      className="text-slate-400 hover:text-emerald-400 ml-1 cursor-pointer"
                      title="Kopyala"
                    >
                      {copiedKey === "edevlet_pass" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Toggle show password */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPasswordText(!showPasswordText)}
                className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 cursor-pointer"
              >
                {showPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPasswordText ? "Gizle" : "Şifreleri Göster"}</span>
              </button>

              {/* Local simulator modal shortcut button */}
              {activePortal.category === "gib" && onOpenGibModal && (
                <button
                  onClick={onOpenGibModal}
                  className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 rounded-lg border border-emerald-800/60 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Yerel Konsol</span>
                </button>
              )}

              {activePortal.category === "sgk" && onOpenSgkModal && (
                <button
                  onClick={() =>
                    onOpenSgkModal(activePortal.id === "sgk_ebildirge" ? "ebildirgev2" : "isveren")
                  }
                  className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 rounded-lg border border-emerald-800/60 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Yerel Konsol</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* FEEDBACK BANNER (WHEN AUTOFILL CLICKED) */}
        {autoFillSuccessCount !== null && (
          <div className="bg-emerald-950/90 border border-emerald-500/50 rounded-xl p-2.5 flex items-center justify-between text-xs text-emerald-200 animate-fadeIn">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="font-bold">
                Kayıtlı giriş bilgileri {activePortal.name} formuna aktarıldı! Güvenlik kodunu (CAPTCHA) girip doğrudan giriş yapabilirsiniz.
              </span>
            </div>
            <span className="text-[10px] font-mono bg-emerald-900/80 px-2 py-0.5 rounded text-emerald-300">
              ⚡ Hazır
            </span>
          </div>
        )}
      </div>

      {/* EMBEDDED IFRAME AREA */}
      <div className="relative flex-1 w-full bg-slate-900 min-h-[650px] flex flex-col">
        {isLoadingIframe && (
          <div className="absolute inset-0 z-10 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-300">
              {activePortal.name} yükleniyor...
            </p>
            <p className="text-[11px] text-slate-500 max-w-xs text-center">
              Sayfa yüklendikten sonra yukarıdaki "⚡ Otomatik Doldur" butonu ile tek tıkla oturum açabilirsiniz.
            </p>
          </div>
        )}

        <iframe
          key={`${activePortal.id}_${iframeKey}`}
          ref={iframeRef}
          src={activePortal.proxyUrl}
          title={activePortal.name}
          onLoad={() => setIsLoadingIframe(false)}
          className="w-full h-full flex-1 border-none bg-white min-h-[650px]"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        />
      </div>
    </div>
  );
};
