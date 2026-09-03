import React, { useState, useEffect } from "react";
import { CompanySettings, WorkplaceSgkCredential, Branch, Warehouse } from "../types";
import {
  X,
  ExternalLink,
  ShieldCheck,
  Building,
  Warehouse as WarehouseIcon,
  Check,
  Copy,
  CheckCheck,
  Eye,
  EyeOff,
  User,
  Key,
  Lock,
  Hash,
  Layers,
  FileSpreadsheet,
  Users,
  Printer,
  Shield,
  Sparkles,
  ArrowRight,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import { DetailPageLayout } from "./common/DetailPageLayout";

interface SgkPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  companySettings: CompanySettings;
  targetPortal?: "isveren" | "ebildirgev2";
  branches?: Branch[];
  warehouses?: Warehouse[];
}

export const SgkPortalModal: React.FC<SgkPortalModalProps> = ({
  isOpen,
  onClose,
  companySettings,
  targetPortal: initialTarget = "isveren",
  branches = [],
  warehouses = [],
}) => {
  const [targetPortal, setTargetPortal] = useState<"isveren" | "ebildirgev2">(initialTarget);
  const [selectedWorkplaceId, setSelectedWorkplaceId] = useState<string>("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSimulatedLogin, setIsSimulatedLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"credentials" | "declarations" | "employees" | "clearance">("credentials");

  // Normalized workplace list
  const getWorkplaces = (): WorkplaceSgkCredential[] => {
    const raw = companySettings.sgkCredentials?.workplaces;
    if (raw && Array.isArray(raw) && raw.length > 0) {
      return raw;
    }
    // Fallback to legacy single
    return [
      {
        id: "main_default",
        name: "Merkez",
        type: "main",
        workplaceRegistrationNo: companySettings.sgkCredentials?.workplaceRegistrationNo || "",
        userCode: companySettings.sgkCredentials?.userCode || "",
        workplaceCode: companySettings.sgkCredentials?.workplaceCode || "000",
        systemPassword: companySettings.sgkCredentials?.systemPassword || "",
        workplacePassword: companySettings.sgkCredentials?.workplacePassword || "",
      },
    ];
  };

  const workplaces = getWorkplaces();

  useEffect(() => {
    if (isOpen) {
      setTargetPortal(initialTarget);
      setIsSimulatedLogin(false);
      setIsLoading(false);
      setShowPasswords(false);
      setCopiedField(null);
      if (workplaces.length > 0 && (!selectedWorkplaceId || !workplaces.some(w => w.id === selectedWorkplaceId))) {
        setSelectedWorkplaceId(workplaces[0].id);
      }
    }
  }, [isOpen, initialTarget, companySettings]);

  if (!isOpen) return null;

  const currentWp = workplaces.find((w) => w.id === selectedWorkplaceId) || workplaces[0] || {
    id: "empty",
    name: "Merkez",
    type: "main" as const,
    workplaceRegistrationNo: "",
    userCode: "",
    workplaceCode: "000",
    systemPassword: "",
    workplacePassword: "",
  };

  const portalUrls = {
    isveren: {
      name: "SGK İşveren Portalı (İşveren Sistemi)",
      shortName: "İşveren Portalı",
      url: "https://uyg.sgk.gov.tr/IsverenSistemi/",
      host: "uyg.sgk.gov.tr",
      description: "Sosyal Güvenlik Kurumu İşveren Sistemi • Teşvikler, İşyeri Bilgileri ve İşe Giriş/Çıkış Bildirimleri",
      badgeColor: "bg-emerald-600 text-white",
      themeColor: "from-emerald-700 via-teal-800 to-slate-900",
    },
    ebildirgev2: {
      name: "SGK e-Bildirge v2 Portalı",
      shortName: "e-Bildirge v2",
      url: "https://ebildirge.sgk.gov.tr/EBildirgeV2",
      host: "ebildirge.sgk.gov.tr",
      description: "Aylık Prim ve Hizmet Belgesi • MUHSGK e-Bildirge v2 Gönderim ve Tahakkuk İşlemleri",
      badgeColor: "bg-teal-600 text-white",
      themeColor: "from-teal-700 via-emerald-800 to-slate-900",
    },
  };

  const portalInfo = portalUrls[targetPortal];

  const copyToClipboard = (text: string | undefined, label: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyAllCredentials = () => {
    const text = `SGK İŞYERİ GİRİŞ BİLGİLERİ (${currentWp.name}):
İşyeri Adı: ${currentWp.name}
SGK İşyeri Sicil No: ${currentWp.workplaceRegistrationNo || "-"}
Kullanıcı Kodu: ${currentWp.userCode || "-"}
İşyeri Kodu: ${currentWp.workplaceCode || "000"}
Sistem Şifresi: ${currentWp.systemPassword || "-"}
İşyeri Şifresi: ${currentWp.workplacePassword || "-"}`;
    copyToClipboard(text, "all");
  };

  const handleSimulatedConnect = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSimulatedLogin(true);
    }, 900);
  };

  return (
    <DetailPageLayout
      title={`SGK ${portalInfo.name}`}
      subtitle={portalInfo.description}
      breadcrumbs={[
        { label: "İnsan Kaynakları", onClick: onClose },
        { label: "SGK Resmi Portalı", active: true },
      ]}
      onBack={onClose}
      statusBadge={
        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-xl uppercase">
          SGK RESMİ ENTEGRE
        </span>
      }
      headerIcon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
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
      <div className="bg-white w-full max-w-4xl mx-auto rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">

        {/* Portal Switcher & Selection Bar */}
        <div className="bg-slate-100/90 border-b border-slate-200 p-3 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          {/* Target Portal Toggle */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setTargetPortal("isveren");
                setIsSimulatedLogin(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                targetPortal === "isveren"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>İşveren Portalı</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTargetPortal("ebildirgev2");
                setIsSimulatedLogin(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                targetPortal === "ebildirgev2"
                  ? "bg-teal-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>SGK v2 Bildirge</span>
            </button>
          </div>

          {/* Quick Direct Link to Portal */}
          <a
            href={portalInfo.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl transition-all cursor-pointer ml-auto"
          >
            <span>Doğrudan {portalInfo.shortName}&apos;na Git</span>
            <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
          </a>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {/* WORKPLACE SELECTION TABS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                <Layers className="w-4 h-4 text-emerald-600" />
                Giriş Yapılacak Merkez, Şube veya Depoyu Seçiniz:
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                Kayıtlı {workplaces.length} SGK İşyeri
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {workplaces.map((wp) => {
                const isSelected = wp.id === selectedWorkplaceId;
                const isMain = wp.type === "main" || wp.name.toLowerCase().includes("merkez");
                const isWh = wp.type === "warehouse" || wp.name.toLowerCase().includes("depo");

                return (
                  <button
                    key={wp.id}
                    type="button"
                    onClick={() => {
                      setSelectedWorkplaceId(wp.id);
                      setIsSimulatedLogin(false);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? "bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                        : "bg-slate-50 hover:bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                            isSelected
                              ? "bg-emerald-600 text-white"
                              : isMain
                              ? "bg-purple-100 text-purple-700"
                              : isWh
                              ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {isMain ? (
                            <Building className="w-3.5 h-3.5" />
                          ) : isWh ? (
                            <WarehouseIcon className="w-3.5 h-3.5" />
                          ) : (
                            <Building className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-xs">
                            {wp.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {isMain ? "Şirket Merkezi" : isWh ? "Depo Birimi" : "Şube"}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 font-mono text-[10px] text-slate-600 flex items-center justify-between">
                      <span>Sicil: {wp.workplaceRegistrationNo ? `${wp.workplaceRegistrationNo.substring(0, 12)}...` : "(Sicil no yok)"}</span>
                      <span className="font-bold text-slate-800">Kod: {wp.workplaceCode || "000"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {!isSimulatedLogin ? (
            /* CREDENTIALS & ONE-CLICK ACCESS CARD */
            <div className="space-y-4">
              <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      Seçilen İşyeri: <span className="text-emerald-800 font-black">{currentWp.name}</span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      {showPasswords ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-rose-600" /> Şifreleri Gizle
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 text-emerald-600" /> Şifreleri Göster
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={copyAllCredentials}
                      className="text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      {copiedField === "all" ? (
                        <>
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> Kopyalandı
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-emerald-700" /> Tümünü Kopyala
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 5-Field Grid with 1-Click Copy */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* SGK İşyeri Sicil No */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                        <Hash className="w-3 h-3 text-emerald-600" /> SGK İşyeri Sicil No
                      </span>
                      {currentWp.workplaceRegistrationNo && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(currentWp.workplaceRegistrationNo, "sicil")}
                          className="text-[10px] text-slate-400 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {copiedField === "sicil" ? (
                            <span className="text-emerald-600 flex items-center gap-0.5 font-bold">
                              <CheckCheck className="w-3 h-3" /> Kopyalandı
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5">
                              <Copy className="w-3 h-3" /> Kopyala
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-900 select-all break-all">
                      {currentWp.workplaceRegistrationNo || (
                        <span className="text-slate-400 font-normal italic">Tanımlanmamış</span>
                      )}
                    </div>
                  </div>

                  {/* Kullanıcı Kodu */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                        <User className="w-3 h-3 text-emerald-600" /> Kullanıcı Kodu
                      </span>
                      {currentWp.userCode && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(currentWp.userCode, "userCode")}
                          className="text-[10px] text-slate-400 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {copiedField === "userCode" ? (
                            <span className="text-emerald-600 flex items-center gap-0.5 font-bold">
                              <CheckCheck className="w-3 h-3" /> Kopyalandı
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5">
                              <Copy className="w-3 h-3" /> Kopyala
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-900 select-all">
                      {currentWp.userCode || (
                        <span className="text-slate-400 font-normal italic">Tanımlanmamış</span>
                      )}
                    </div>
                  </div>

                  {/* İşyeri Kodu */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                        <Building className="w-3 h-3 text-emerald-600" /> İşyeri Kodu
                      </span>
                      {currentWp.workplaceCode && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(currentWp.workplaceCode, "workplaceCode")}
                          className="text-[10px] text-slate-400 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {copiedField === "workplaceCode" ? (
                            <span className="text-emerald-600 flex items-center gap-0.5 font-bold">
                              <CheckCheck className="w-3 h-3" /> Kopyalandı
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5">
                              <Copy className="w-3 h-3" /> Kopyala
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-900 select-all">
                      {currentWp.workplaceCode || "000"}
                    </div>
                  </div>

                  {/* Sistem Şifresi */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                        <Key className="w-3 h-3 text-emerald-600" /> Sistem Şifresi
                      </span>
                      {currentWp.systemPassword && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(currentWp.systemPassword, "sysPass")}
                          className="text-[10px] text-slate-400 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {copiedField === "sysPass" ? (
                            <span className="text-emerald-600 flex items-center gap-0.5 font-bold">
                              <CheckCheck className="w-3 h-3" /> Kopyalandı
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5">
                              <Copy className="w-3 h-3" /> Kopyala
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-900 select-all">
                      {currentWp.systemPassword ? (
                        showPasswords ? currentWp.systemPassword : "••••••••••••"
                      ) : (
                        <span className="text-slate-400 font-normal italic">Tanımlanmamış</span>
                      )}
                    </div>
                  </div>

                  {/* İşyeri Şifresi */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs sm:col-span-2 lg:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-emerald-600" /> İşyeri Şifresi
                      </span>
                      {currentWp.workplacePassword && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(currentWp.workplacePassword, "wpPass")}
                          className="text-[10px] text-slate-400 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {copiedField === "wpPass" ? (
                            <span className="text-emerald-600 flex items-center gap-0.5 font-bold">
                              <CheckCheck className="w-3 h-3" /> Kopyalandı
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5">
                              <Copy className="w-3 h-3" /> Kopyala
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-900 select-all">
                      {currentWp.workplacePassword ? (
                        showPasswords ? currentWp.workplacePassword : "••••••••••••"
                      ) : (
                        <span className="text-slate-400 font-normal italic">Tanımlanmamış</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Şifreleri kopyalayabilir veya resmi sisteme tek tıkla bağlanabilirsiniz.</span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleSimulatedConnect}
                      disabled={isLoading}
                      className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Bağlanılıyor...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Sistemde Test Et & Sorgula</span>
                        </>
                      )}
                    </button>

                    <a
                      href={portalInfo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>{currentWp.name} ile Portala Git</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* SIMULATED SGK SESSION VIEW */
            <div className="space-y-4">
              {/* Account Header Badge */}
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                    SGK
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {currentWp.name} • {companySettings.companyTitle || companySettings.companyName}
                      </span>
                      <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Check className="w-3 h-3" /> Oturum Doğrulandı
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium mt-0.5 font-mono">
                      İşyeri Sicil: <strong className="text-slate-900">{currentWp.workplaceRegistrationNo || "23489020293482093000"}</strong> • Kod: <strong className="text-slate-900">{currentWp.workplaceCode || "000"}</strong> • Portal: <strong className="text-emerald-800">{portalInfo.shortName}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={portalInfo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Resmi Ekrana Geç
                  </a>
                  <button
                    onClick={() => setIsSimulatedLogin(false)}
                    className="bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 font-bold text-xs px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                  >
                    Kapat
                  </button>
                </div>
              </div>

              {/* Sub-tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                  onClick={() => setActiveTab("credentials")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "credentials"
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Genel Durum & Prim Özeti
                </button>
                <button
                  onClick={() => setActiveTab("declarations")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "declarations"
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Aylık Prim ve Hizmet Bildirgeleri (e-Bildirge v2)
                </button>
                <button
                  onClick={() => setActiveTab("employees")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "employees"
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Kayıtlı Sigortalı Listesi (4/a)
                </button>
                <button
                  onClick={() => setActiveTab("clearance")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "clearance"
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  SGK Borcu Yoktur Belgesi
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === "credentials" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <h4 className="font-extrabold text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                      <span>{currentWp.name} İşyeri Künyesi</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Faal İşyeri</span>
                    </h4>
                    <div className="space-y-2 text-slate-700 font-medium">
                      <p><strong>İşkolu Kodu (NACE):</strong> 6201 - Bilgisayar Programlama Faaliyetleri</p>
                      <p><strong>Tehlike Derecesi:</strong> Az Tehlikeli (1)</p>
                      <p><strong>Aktif Sigortalı Sayısı:</strong> {currentWp.type === "main" ? "14 Çalışan" : "4 Çalışan"}</p>
                      <p><strong>Uygulanan Teşvikler:</strong> 5510 Sayılı Kanun %5 Hazine Desteği (Aktif)</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <h4 className="font-extrabold text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                      <span>Son Tahakkuk & Ödeme Durumu</span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">Ödendi</span>
                    </h4>
                    <div className="space-y-2 text-slate-700 font-medium">
                      <p><strong>Son Dönem:</strong> 2026/06</p>
                      <p><strong>Toplam PEK Tutarı:</strong> ₺480.000,00</p>
                      <p><strong>Tahakkuk Eden Prim:</strong> ₺180.000,00</p>
                      <p><strong>Kalan Borç:</strong> ₺0,00</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "declarations" && (
                <div className="space-y-3">
                  <h4 className="font-extrabold text-slate-900">Son Gönderilen e-Bildirge v2 Belgeleri</h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5">Dönem</th>
                          <th className="p-2.5">Belge Türü</th>
                          <th className="p-2.5">Kişi Sayısı</th>
                          <th className="p-2.5 text-right">Tahakkuk Tutarı</th>
                          <th className="p-2.5 text-center">Durum</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        <tr>
                          <td className="p-2.5 font-bold">2026/06</td>
                          <td className="p-2.5">01 - Tüm Sigorta Kolları</td>
                          <td className="p-2.5">14 Kişi</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">₺180.250,00</td>
                          <td className="p-2.5 text-center">
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">Onaylandı</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold">2026/05</td>
                          <td className="p-2.5">01 - Tüm Sigorta Kolları</td>
                          <td className="p-2.5">13 Kişi</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">₺165.800,00</td>
                          <td className="p-2.5 text-center">
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">Onaylandı</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "employees" && (
                <div className="space-y-3">
                  <h4 className="font-extrabold text-slate-900">{currentWp.name} Aktif Sigortalı Personel</h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5">T.C. Kimlik No</th>
                          <th className="p-2.5">Adı Soyadı</th>
                          <th className="p-2.5">İşe Giriş Tarihi</th>
                          <th className="p-2.5">Meslek Kodu</th>
                          <th className="p-2.5 text-center">Durum</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        <tr>
                          <td className="p-2.5 font-mono">382910****</td>
                          <td className="p-2.5 font-bold">Ahmet Yılmaz</td>
                          <td className="p-2.5">15.01.2023</td>
                          <td className="p-2.5 font-mono">2512.01 (Yazılım Geliştirici)</td>
                          <td className="p-2.5 text-center">
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">Aktif</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-mono">194820****</td>
                          <td className="p-2.5 font-bold">Ayşe Kaya</td>
                          <td className="p-2.5">01.06.2024</td>
                          <td className="p-2.5 font-mono">2411.02 (Mali Müşavir / Muhasebe)</td>
                          <td className="p-2.5 text-center">
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">Aktif</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "clearance" && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
                      <div>
                        <h4 className="font-extrabold text-emerald-950 text-sm">{currentWp.name} - SGK İlişiksizlik / Borcu Yoktur Durumu</h4>
                        <p className="text-slate-600 font-medium">Bu işyeri sicil numarasına ait vadesi geçmiş herhangi bir prim veya ceza borcu bulunmamaktadır.</p>
                      </div>
                    </div>

                    <button className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shrink-0">
                      <Printer className="w-3.5 h-3.5" /> Yazdır / PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-500 font-medium flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Güvenli SGK Bağlantısı • T.C. Sosyal Güvenlik Kurumu İşveren & e-Bildirge v2 Entegrasyonu</span>
          </div>

          <button
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
          >
            Geri Dön
          </button>
        </div>
      </div>
    </DetailPageLayout>
  );
};
