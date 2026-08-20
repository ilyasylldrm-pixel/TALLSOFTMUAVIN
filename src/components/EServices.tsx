import React, { useState } from "react";
import { CompanySettings, Branch, Warehouse, WorkplaceSgkCredential, ETebligatItem, ETebligatStatus } from "../types";
import { GibPortalModal } from "./GibPortalModal";
import { SgkPortalModal } from "./SgkPortalModal";
import { ETebligatModal } from "./ETebligatModal";
import {
  ShieldCheck,
  Lock,
  Key,
  Eye,
  EyeOff,
  User,
  FileText,
  ExternalLink,
  Globe,
  Copy,
  Calendar,
  Smartphone,
  Info,
  Shield,
  Fingerprint,
  CheckCheck,
  Save,
  Check,
  Sparkles,
  Building2,
  FileCheck2,
  Warehouse as WarehouseIcon,
  Plus,
  Trash2,
  Building,
  Store,
  X,
  Layers,
  FileSpreadsheet,
  Landmark,
  Mail,
  MailOpen,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  ChevronRight,
  Inbox,
  Clock,
  Send,
  Download,
} from "lucide-react";

interface EServicesProps {
  settings: CompanySettings;
  branches?: Branch[];
  warehouses?: Warehouse[];
  onSaveSettings: (settings: CompanySettings) => void;
}

export const EServices: React.FC<EServicesProps> = ({
  settings,
  branches = [],
  warehouses = [],
  onSaveSettings,
}) => {
  const [form, setForm] = useState<CompanySettings>(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Password visibility states
  const [showTaxPasswords, setShowTaxPasswords] = useState(false);
  const [showSgkPasswords, setShowSgkPasswords] = useState(false);
  const [showEDevletPasswords, setShowEDevletPasswords] = useState(false);
  const [isGibModalOpen, setIsGibModalOpen] = useState(false);
  const [isSgkModalOpen, setIsSgkModalOpen] = useState(false);
  const [sgkTargetPortal, setSgkTargetPortal] = useState<"isveren" | "ebildirgev2">("isveren");
  const [isAddWpModalOpen, setIsAddWpModalOpen] = useState(false);

  // e-Tebligat state
  const [selectedTebligat, setSelectedTebligat] = useState<ETebligatItem | null>(null);
  const [isTebligatModalOpen, setIsTebligatModalOpen] = useState(false);
  const [tebligatSearch, setTebligatSearch] = useState("");
  const [tebligatFilter, setTebligatFilter] = useState<"all" | "GIB" | "SGK" | "unread" | "urgent">("all");
  const [isAddTebligatModalOpen, setIsAddTebligatModalOpen] = useState(false);
  const [newTebligat, setNewTebligat] = useState<Partial<ETebligatItem>>({
    authority: "GIB",
    senderUnit: "",
    documentTitle: "",
    documentType: "İhbarname",
    barcodeNumber: "",
    envelopeId: "",
    sentDate: new Date().toISOString().split("T")[0],
    deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    legalDeadlineDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    status: "unread",
    amount: 0,
    contentSummary: "",
    notes: "",
  });

  const openSgkModal = (portal: "isveren" | "ebildirgev2") => {
    setSgkTargetPortal(portal);
    setIsSgkModalOpen(true);
  };

  const getTebligatlar = (): ETebligatItem[] => {
    return form.eTebligatlar || [];
  };

  const handleTebligatStatusChange = (id: string, newStatus: ETebligatStatus) => {
    const currentList = getTebligatlar();
    const updated = currentList.map((t) => (t.id === id ? { ...t, status: newStatus } : t));
    setForm((prev) => ({
      ...prev,
      eTebligatlar: updated,
    }));
    if (selectedTebligat && selectedTebligat.id === id) {
      setSelectedTebligat((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleDeleteTebligat = (id: string) => {
    const currentList = getTebligatlar();
    const updated = currentList.filter((t) => t.id !== id);
    setForm((prev) => ({
      ...prev,
      eTebligatlar: updated,
    }));
  };

  const handleSaveNewTebligat = () => {
    if (!newTebligat.documentTitle?.trim() || !newTebligat.senderUnit?.trim()) return;
    const currentList = getTebligatlar();
    const created: ETebligatItem = {
      id: `eteb_${Date.now()}`,
      authority: newTebligat.authority || "GIB",
      senderUnit: newTebligat.senderUnit.trim(),
      documentTitle: newTebligat.documentTitle.trim(),
      documentType: newTebligat.documentType || "İhbarname",
      barcodeNumber: newTebligat.barcodeNumber?.trim() || `${newTebligat.authority || "GIB"}-${Date.now().toString().slice(-7)}`,
      envelopeId: newTebligat.envelopeId?.trim() || `e-ZRF-${Date.now().toString().slice(-6)}`,
      sentDate: newTebligat.sentDate || new Date().toISOString().split("T")[0],
      deliveryDate: newTebligat.deliveryDate || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      legalDeadlineDate: newTebligat.legalDeadlineDate,
      status: newTebligat.status || "unread",
      amount: Number(newTebligat.amount) || 0,
      contentSummary: newTebligat.contentSummary || "",
      workplaceId: newTebligat.workplaceId,
      workplaceName: newTebligat.workplaceName,
      notes: newTebligat.notes || "",
      receiptNumber: `MZB-${Date.now().toString().slice(-6)}`,
    };

    setForm((prev) => ({
      ...prev,
      eTebligatlar: [created, ...currentList],
    }));
    setIsAddTebligatModalOpen(false);
    setNewTebligat({
      authority: "GIB",
      senderUnit: "",
      documentTitle: "",
      documentType: "İhbarname",
      barcodeNumber: "",
      envelopeId: "",
      sentDate: new Date().toISOString().split("T")[0],
      deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      legalDeadlineDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "unread",
      amount: 0,
      contentSummary: "",
      notes: "",
    });
  };

  // Quick add custom workplace state
  const [customWpName, setCustomWpName] = useState("");
  const [customWpType, setCustomWpType] = useState<"branch" | "warehouse" | "other">("branch");

  const handleTaxCredChange = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      taxCredentials: {
        ...prev.taxCredentials,
        [field]: value,
      },
    }));
  };

  // Helper to ensure workplaces array is always available
  const getWorkplaces = (): WorkplaceSgkCredential[] => {
    if (form.sgkCredentials?.workplaces && form.sgkCredentials.workplaces.length > 0) {
      return form.sgkCredentials.workplaces;
    }
    return [
      {
        id: "sgk_wp_main",
        name: "Merkez (Genel Müdürlük)",
        type: "main",
        workplaceRegistrationNo: (form.sgkCredentials?.workplaceRegistrationNo || "").replace(/\./g, ""),
        userCode: form.sgkCredentials?.userCode || "",
        workplaceCode: form.sgkCredentials?.workplaceCode || "000",
        systemPassword: form.sgkCredentials?.systemPassword || "",
        workplacePassword: form.sgkCredentials?.workplacePassword || "",
      },
    ];
  };

  const handleWorkplaceFieldChange = (
    id: string,
    field: keyof WorkplaceSgkCredential,
    value: string
  ) => {
    const currentList = getWorkplaces();
    const cleanVal = field === "workplaceRegistrationNo" ? value.replace(/\./g, "") : value;
    const updatedList = currentList.map((wp) => {
      if (wp.id === id) {
        return { ...wp, [field]: cleanVal };
      }
      return wp;
    });

    const isFirstOrMain = currentList[0]?.id === id || currentList.find((w) => w.id === id)?.type === "main";

    setForm((prev) => ({
      ...prev,
      sgkCredentials: {
        ...prev.sgkCredentials,
        workplaces: updatedList,
        ...(isFirstOrMain
          ? {
              [field === "workplaceRegistrationNo"
                ? "workplaceRegistrationNo"
                : field === "userCode"
                ? "userCode"
                : field === "workplaceCode"
                ? "workplaceCode"
                : field === "systemPassword"
                ? "systemPassword"
                : field === "workplacePassword"
                ? "workplacePassword"
                : ""]: cleanVal,
            }
          : {}),
      },
    }));
  };

  const handleAddWorkplace = (
    name: string,
    type: "main" | "branch" | "warehouse" | "other" = "branch",
    referenceId?: string
  ) => {
    const currentList = getWorkplaces();
    const newId = `sgk_wp_${Date.now()}`;
    const nextIndex = currentList.length.toString().padStart(3, "0");
    const newWorkplace: WorkplaceSgkCredential = {
      id: newId,
      name: name.trim() || `Yeni İşyeri / Şube ${currentList.length + 1}`,
      type,
      referenceId,
      workplaceRegistrationNo: "",
      userCode: "",
      workplaceCode: nextIndex,
      systemPassword: "",
      workplacePassword: "",
    };

    const updatedList = [...currentList, newWorkplace];
    setForm((prev) => ({
      ...prev,
      sgkCredentials: {
        ...prev.sgkCredentials,
        workplaces: updatedList,
      },
    }));
    setIsAddWpModalOpen(false);
    setCustomWpName("");
  };

  const handleDeleteWorkplace = (id: string) => {
    const currentList = getWorkplaces();
    if (currentList.length <= 1) return; // Keep at least one
    const updatedList = currentList.filter((wp) => wp.id !== id);
    setForm((prev) => ({
      ...prev,
      sgkCredentials: {
        ...prev.sgkCredentials,
        workplaces: updatedList,
      },
    }));
  };

  const handleEDevletCredChange = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      eDevletCredentials: {
        ...prev.eDevletCredentials,
        [field]: value,
      },
    }));
  };

  const copyToClipboard = (text: string | undefined, keyId: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(form);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const workplacesList = getWorkplaces();

  // Find branches and warehouses not yet added to SGK workplaces
  const unlinkedBranches = branches.filter(
    (br) => !workplacesList.some((wp) => wp.referenceId === br.id || wp.name.toLowerCase().includes(br.name.toLowerCase()))
  );
  const unlinkedWarehouses = warehouses.filter(
    (wh) => !workplacesList.some((wp) => wp.referenceId === wh.id || wp.name.toLowerCase().includes(wh.name.toLowerCase()))
  );

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-white rounded-2xl p-6 text-slate-900 shadow-xs border border-slate-200">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Resmi Entegrasyon Modülü
              </span>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                GİB • SGK • e-Devlet
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-purple-600" />
              E-İşlemler ve Resmi Kurum Şifreleri
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Vergi dairesi, SGK işveren portalı ve şirket müdürünün e-Devlet giriş şifrelerini güvenli bir şekilde yönetin, resmi portallara tek tıkla bağlanın.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsGibModalOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Dijital Vergi Dairesine Bağlan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quick Portal Launchers Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-600" />
              Sık Kullanılan Resmi Kurum ve E-Devlet Portalları
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              Portallara gitmek için tıklayınız
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <a
              href="https://dijital.gib.gov.tr"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-red-50/70 border border-slate-200/80 hover:border-red-200 text-slate-700 hover:text-red-700 transition-all group"
            >
              <div className="truncate">
                <div className="text-xs font-extrabold truncate">Dijital Vergi Dairesi</div>
                <div className="text-[10px] text-slate-400 group-hover:text-red-500 truncate">dijital.gib.gov.tr</div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-600 shrink-0 ml-1" />
            </a>

            <a
              href="https://giris.turkiye.gov.tr/Giris/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-200 text-slate-700 hover:text-blue-700 transition-all group"
            >
              <div className="truncate">
                <div className="text-xs font-extrabold truncate">e-Devlet Kapısı</div>
                <div className="text-[10px] text-slate-400 group-hover:text-blue-500 truncate">turkiye.gov.tr</div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 ml-1" />
            </a>

            <button
              type="button"
              onClick={() => openSgkModal("isveren")}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 transition-all group text-left cursor-pointer"
            >
              <div className="truncate">
                <div className="text-xs font-extrabold truncate flex items-center gap-1">
                  <span>SGK İşveren Portalı</span>
                </div>
                <div className="text-[10px] text-emerald-600 font-medium group-hover:text-emerald-700 truncate">
                  Merkez, Şube & Depo Seçimli
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0 ml-1" />
            </button>

            <button
              type="button"
              onClick={() => openSgkModal("ebildirgev2")}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-teal-50/70 border border-slate-200/80 hover:border-teal-300 text-slate-700 hover:text-teal-700 transition-all group text-left cursor-pointer"
            >
              <div className="truncate">
                <div className="text-xs font-extrabold truncate flex items-center gap-1">
                  <span>SGK v2 Bildirge</span>
                </div>
                <div className="text-[10px] text-teal-600 font-medium group-hover:text-teal-700 truncate">
                  Merkez, Şube & Depo Seçimli
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 shrink-0 ml-1" />
            </button>

            <a
              href="https://earsivportal.efatura.gov.tr/intragiris.html"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-amber-50/70 border border-slate-200/80 hover:border-amber-200 text-slate-700 hover:text-amber-700 transition-all group"
            >
              <div className="truncate">
                <div className="text-xs font-extrabold truncate">GİB e-Arşiv Portal</div>
                <div className="text-[10px] text-slate-400 group-hover:text-amber-500 truncate">earsivportal.gov.tr</div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 shrink-0 ml-1" />
            </a>

            <a
              href="https://mersis.gtb.gov.tr/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-purple-50/70 border border-slate-200/80 hover:border-purple-200 text-slate-700 hover:text-purple-700 transition-all group"
            >
              <div className="truncate">
                <div className="text-xs font-extrabold truncate">MERSİS Portalı</div>
                <div className="text-[10px] text-slate-400 group-hover:text-purple-500 truncate">mersis.gtb.gov.tr</div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 shrink-0 ml-1" />
            </a>
          </div>
        </div>

        {/* 1. BÖLÜM: VERGİ DAİRESİ & GİB PORTAL ŞİFRELERİ */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-600" />
                1. Vergi Dairesi & GİB Portal Şifreleri
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                İnteraktif Vergi Dairesi, e-Beyanname ve Dijital Vergi Dairesi giriş bilgileriniz.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsGibModalOpen(true)}
                className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Dijital VD Bağlan
              </button>

              <button
                type="button"
                onClick={() => setShowTaxPasswords(!showTaxPasswords)}
                className="text-xs font-bold text-slate-700 hover:text-red-700 bg-slate-100 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {showTaxPasswords ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-rose-600" /> Şifreleri Gizle
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-red-600" /> Şifreleri Göster
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-red-600" /> Kullanıcı Kodu
                </span>
                {form.taxCredentials?.userCode && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(form.taxCredentials?.userCode, "tax_userCode")}
                    className="text-[10px] text-slate-400 hover:text-red-600 flex items-center gap-0.5 cursor-pointer font-normal"
                  >
                    {copiedKey === "tax_userCode" ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                        <CheckCheck className="w-3 h-3" /> Kopyalandı
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5">
                        <Copy className="w-3 h-3" /> Kopyala
                      </span>
                    )}
                  </button>
                )}
              </label>
              <input
                type="text"
                placeholder="GİB / İnteraktif VD Kullanıcı Kodu"
                value={form.taxCredentials?.userCode || ""}
                onChange={(e) => handleTaxCredChange("userCode", e.target.value)}
                className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 font-mono text-xs transition-colors"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-red-600" /> Parola
                </span>
                {form.taxCredentials?.password && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(form.taxCredentials?.password, "tax_password")}
                    className="text-[10px] text-slate-400 hover:text-red-600 flex items-center gap-0.5 cursor-pointer font-normal"
                  >
                    {copiedKey === "tax_password" ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                        <CheckCheck className="w-3 h-3" /> Kopyalandı
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5">
                        <Copy className="w-3 h-3" /> Kopyala
                      </span>
                    )}
                  </button>
                )}
              </label>
              <input
                type={showTaxPasswords ? "text" : "password"}
                placeholder="GİB Parola"
                value={form.taxCredentials?.password || ""}
                onChange={(e) => handleTaxCredChange("password", e.target.value)}
                className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 font-mono text-xs transition-colors"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-red-600" /> Şifre
                </span>
                {form.taxCredentials?.codeSecret && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(form.taxCredentials?.codeSecret, "tax_codeSecret")}
                    className="text-[10px] text-slate-400 hover:text-red-600 flex items-center gap-0.5 cursor-pointer font-normal"
                  >
                    {copiedKey === "tax_codeSecret" ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                        <CheckCheck className="w-3 h-3" /> Kopyalandı
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5">
                        <Copy className="w-3 h-3" /> Kopyala
                      </span>
                    )}
                  </button>
                )}
              </label>
              <input
                type={showTaxPasswords ? "text" : "password"}
                placeholder="GİB Şifre"
                value={form.taxCredentials?.codeSecret || ""}
                onChange={(e) => handleTaxCredChange("codeSecret", e.target.value)}
                className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 font-mono text-xs transition-colors"
              />
            </div>
          </div>
        </div>

        {/* 2. BÖLÜM: SGK (SOSYAL GÜVENLİK KURUMU) ŞİFRELERİ */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Merkez, Şube & Depo Sicilleri
                </span>
                <span className="text-[11px] text-slate-400 font-bold">
                  ({workplacesList.length} İşyeri Tanımlı)
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 mt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                2. SGK (Sosyal Güvenlik Kurumu) Şifreleri
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Merkez, şube ve depolarınıza ait SGK İşyeri Sicil No, Kullanıcı Kodu, İşyeri Kodu ve sistem/işyeri şifrelerini ayrı ayrı yönetin.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddWpModalOpen(true)}
                className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Şube / Depo SGK Şifresi Ekle
              </button>

              <button
                type="button"
                onClick={() => openSgkModal("ebildirgev2")}
                className="text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" /> SGK v2 Bildirge
              </button>

              <button
                type="button"
                onClick={() => openSgkModal("isveren")}
                className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" /> e-SGK İşveren Portalı
              </button>

              <button
                type="button"
                onClick={() => setShowSgkPasswords(!showSgkPasswords)}
                className="text-xs font-bold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {showSgkPasswords ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-rose-600" /> Şifreleri Gizle
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-emerald-600" /> Şifreleri Göster
                  </>
                )}
              </button>
            </div>
          </div>

          {/* List of Workplace SGK Credentials */}
          <div className="space-y-4">
            {workplacesList.map((wp, index) => {
              const isMain = wp.type === "main" || index === 0;
              const isBranch = wp.type === "branch";
              const isWarehouse = wp.type === "warehouse";

              return (
                <div
                  key={wp.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isMain
                      ? "bg-slate-50/70 border-emerald-200/80 shadow-2xs"
                      : "bg-white border-slate-200 hover:border-emerald-300"
                  }`}
                >
                  {/* Workplace Row Header */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                          isMain
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : isBranch
                            ? "bg-blue-100 text-blue-800 border border-blue-300"
                            : isWarehouse
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : "bg-slate-100 text-slate-800 border border-slate-300"
                        }`}
                      >
                        {isMain ? (
                          <>
                            <ShieldCheck className="w-3 h-3 text-emerald-700" /> Merkez
                          </>
                        ) : isBranch ? (
                          <>
                            <Building className="w-3 h-3 text-blue-700" /> Şube
                          </>
                        ) : isWarehouse ? (
                          <>
                            <WarehouseIcon className="w-3 h-3 text-amber-700" /> Depo
                          </>
                        ) : (
                          <>
                            <Store className="w-3 h-3 text-slate-700" /> Birim
                          </>
                        )}
                      </span>
                      <span className="font-extrabold text-slate-800 text-xs">
                        {wp.name || `İşyeri ${index + 1}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const fullCopy = `SGK İŞYERİ BİLGİLERİ (${wp.name}):\nSicil No: ${wp.workplaceRegistrationNo}\nKullanıcı Kodu: ${wp.userCode}\nİşyeri Kodu: ${wp.workplaceCode}\nSistem Şifresi: ${wp.systemPassword}\nİşyeri Şifresi: ${wp.workplacePassword}`;
                          copyToClipboard(fullCopy, `full_sgk_${wp.id}`);
                        }}
                        className="text-[10px] text-slate-400 hover:text-emerald-700 flex items-center gap-1 font-semibold px-2 py-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Bu işyerinin tüm şifrelerini kopyala"
                      >
                        {copiedKey === `full_sgk_${wp.id}` ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                            <CheckCheck className="w-3 h-3" /> Tüm Bilgiler Kopyalandı
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Copy className="w-3 h-3" /> Tümünü Kopyala
                          </span>
                        )}
                      </button>

                      {!isMain && workplacesList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteWorkplace(wp.id)}
                          className="text-[10px] text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer font-bold"
                          title="Bu şube/depo SGK kaydını sil"
                        >
                          <Trash2 className="w-3 h-3" /> Kaldır
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 6 Columns: 1. Şube/Depo Adı | 2. SGK İşyeri Sicil No | 3. Kullanıcı Kodu | 4. İşyeri Kodu | 5. Sistem Şifresi | 6. İşyeri Şifresi */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                    {/* 1. ŞUBE / DEPO ADI (SGK İŞYERİ SİCİL NO SOLUNDA) */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                        {isWarehouse ? (
                          <WarehouseIcon className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                          <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        <span>Depo ve Şube Adı</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: Ankara Şubesi / Gebze Depo"
                        value={wp.name || ""}
                        onChange={(e) => handleWorkplaceFieldChange(wp.id, "name", e.target.value)}
                        className="w-full bg-white hover:bg-slate-50/50 focus:bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 font-medium text-xs transition-colors"
                      />
                    </div>

                    {/* 2. SGK İŞYERİ SİCİL NO (NOKTASIZ) */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1 truncate">
                          <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">SGK İşyeri Sicil No</span>
                        </span>
                        {wp.workplaceRegistrationNo && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(wp.workplaceRegistrationNo, `sgk_reg_${wp.id}`)}
                            className="text-[10px] text-slate-400 hover:text-emerald-600 flex items-center gap-0.5 cursor-pointer font-normal shrink-0 ml-1"
                          >
                            {copiedKey === `sgk_reg_${wp.id}` ? (
                              <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                                <CheckCheck className="w-3 h-3" /> Kopyalandı
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5">
                                <Copy className="w-3 h-3" /> Kopyala
                              </span>
                            )}
                          </button>
                        )}
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: 28470010110293840340112"
                        value={(wp.workplaceRegistrationNo || "").replace(/\./g, "")}
                        onChange={(e) => handleWorkplaceFieldChange(wp.id, "workplaceRegistrationNo", e.target.value)}
                        className="w-full bg-white hover:bg-slate-50/50 focus:bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 font-mono text-xs transition-colors"
                      />
                    </div>

                    {/* 3. KULLANICI KODU */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1 truncate">
                          <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">Kullanıcı Kodu</span>
                        </span>
                        {wp.userCode && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(wp.userCode, `sgk_usr_${wp.id}`)}
                            className="text-[10px] text-slate-400 hover:text-emerald-600 flex items-center gap-0.5 cursor-pointer font-normal shrink-0 ml-1"
                          >
                            {copiedKey === `sgk_usr_${wp.id}` ? (
                              <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                                <CheckCheck className="w-3 h-3" /> Kopyalandı
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5">
                                <Copy className="w-3 h-3" /> Kopyala
                              </span>
                            )}
                          </button>
                        )}
                      </label>
                      <input
                        type="text"
                        placeholder="SGK Kullanıcı Kodu"
                        value={wp.userCode || ""}
                        onChange={(e) => handleWorkplaceFieldChange(wp.id, "userCode", e.target.value)}
                        className="w-full bg-white hover:bg-slate-50/50 focus:bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 font-mono text-xs transition-colors"
                      />
                    </div>

                    {/* 4. İŞYERİ KODU */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1 truncate">
                          <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">İşyeri Kodu</span>
                        </span>
                        {wp.workplaceCode && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(wp.workplaceCode, `sgk_wp_${wp.id}`)}
                            className="text-[10px] text-slate-400 hover:text-emerald-600 flex items-center gap-0.5 cursor-pointer font-normal shrink-0 ml-1"
                          >
                            {copiedKey === `sgk_wp_${wp.id}` ? (
                              <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                                <CheckCheck className="w-3 h-3" /> Kopyalandı
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5">
                                <Copy className="w-3 h-3" /> Kopyala
                              </span>
                            )}
                          </button>
                        )}
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: 000 veya 01"
                        value={wp.workplaceCode || ""}
                        onChange={(e) => handleWorkplaceFieldChange(wp.id, "workplaceCode", e.target.value)}
                        className="w-full bg-white hover:bg-slate-50/50 focus:bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 font-mono text-xs transition-colors"
                      />
                    </div>

                    {/* 5. SİSTEM ŞİFRESİ */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1 truncate">
                          <Key className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">Sistem Şifresi</span>
                        </span>
                        {wp.systemPassword && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(wp.systemPassword, `sgk_sys_${wp.id}`)}
                            className="text-[10px] text-slate-400 hover:text-emerald-600 flex items-center gap-0.5 cursor-pointer font-normal shrink-0 ml-1"
                          >
                            {copiedKey === `sgk_sys_${wp.id}` ? (
                              <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                                <CheckCheck className="w-3 h-3" /> Kopyalandı
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5">
                                <Copy className="w-3 h-3" /> Kopyala
                              </span>
                            )}
                          </button>
                        )}
                      </label>
                      <input
                        type={showSgkPasswords ? "text" : "password"}
                        placeholder="e-SGK Sistem Şifresi"
                        value={wp.systemPassword || ""}
                        onChange={(e) => handleWorkplaceFieldChange(wp.id, "systemPassword", e.target.value)}
                        className="w-full bg-white hover:bg-slate-50/50 focus:bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 font-mono text-xs transition-colors"
                      />
                    </div>

                    {/* 6. İŞYERİ ŞİFRESİ */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1 truncate">
                          <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">İşyeri Şifresi</span>
                        </span>
                        {wp.workplacePassword && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(wp.workplacePassword, `sgk_wppass_${wp.id}`)}
                            className="text-[10px] text-slate-400 hover:text-emerald-600 flex items-center gap-0.5 cursor-pointer font-normal shrink-0 ml-1"
                          >
                            {copiedKey === `sgk_wppass_${wp.id}` ? (
                              <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                                <CheckCheck className="w-3 h-3" /> Kopyalandı
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5">
                                <Copy className="w-3 h-3" /> Kopyala
                              </span>
                            )}
                          </button>
                        )}
                      </label>
                      <input
                        type={showSgkPasswords ? "text" : "password"}
                        placeholder="e-SGK İşyeri Şifresi"
                        value={wp.workplacePassword || ""}
                        onChange={(e) => handleWorkplaceFieldChange(wp.id, "workplacePassword", e.target.value)}
                        className="w-full bg-white hover:bg-slate-50/50 focus:bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 font-mono text-xs transition-colors"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Add Button Bar */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                Tanımlı tüm şube ve depolarınız için ayrı SGK işyeri sicil numaraları ve e-Bildirge kullanıcı şifreleri ekleyebilirsiniz.
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsAddWpModalOpen(true)}
              className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Yeni Şube / Depo SGK Şifresi Ekle
            </button>
          </div>
        </div>

        {/* 3. BÖLÜM: ŞİRKET MÜDÜRÜ / YETKİLİSİ E-DEVLET ŞİFRELERİ */}
        <div className="bg-white p-6 rounded-2xl border border-blue-200/80 shadow-xs space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Yönetici & İmza Yetkilisi
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 mt-1">
                <Fingerprint className="w-4 h-4 text-blue-600" />
                3. Şirket Müdürü / İmza Yetkilisi E-Devlet Şifreleri
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Ticaret Sicil, MERSİS, e-İmza, Noter ve e-Devlet kurumsal yetkili işlemlerinde kullanılan şifre ve yetki bilgileri.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://giris.turkiye.gov.tr/Giris/"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" /> e-Devlet Kapısına Git
              </a>

              <button
                type="button"
                onClick={() => setShowEDevletPasswords(!showEDevletPasswords)}
                className="text-xs font-bold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {showEDevletPasswords ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-rose-600" /> Şifreleri Gizle
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-blue-600" /> Şifreleri Göster
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-blue-600" /> Müdür / Yetkili Adı Soyadı
                </span>
              </label>
              <input
                type="text"
                placeholder="Örn: Ahmet Yılmaz"
                value={form.eDevletCredentials?.managerName || ""}
                onChange={(e) => handleEDevletCredChange("managerName", e.target.value)}
                className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 text-xs transition-colors"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Fingerprint className="w-3.5 h-3.5 text-blue-600" /> T.C. Kimlik Numarası
                </span>
                {form.eDevletCredentials?.tcKimlikNo && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(form.eDevletCredentials?.tcKimlikNo, "edevlet_tckn")}
                    className="text-[10px] text-slate-400 hover:text-blue-600 flex items-center gap-0.5 cursor-pointer font-normal"
                  >
                    {copiedKey === "edevlet_tckn" ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                        <CheckCheck className="w-3 h-3" /> Kopyalandı
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5">
                        <Copy className="w-3 h-3" /> Kopyala
                      </span>
                    )}
                  </button>
                )}
              </label>
              <input
                type="text"
                maxLength={11}
                placeholder="11 Haneli TCKN"
                value={form.eDevletCredentials?.tcKimlikNo || ""}
                onChange={(e) => handleEDevletCredChange("tcKimlikNo", e.target.value.replace(/\D/g, ""))}
                className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 font-mono text-xs transition-colors"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-blue-600" /> e-Devlet Şifresi
                </span>
                {form.eDevletCredentials?.eDevletPassword && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(form.eDevletCredentials?.eDevletPassword, "edevlet_pass")}
                    className="text-[10px] text-slate-400 hover:text-blue-600 flex items-center gap-0.5 cursor-pointer font-normal"
                  >
                    {copiedKey === "edevlet_pass" ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                        <CheckCheck className="w-3 h-3" /> Kopyalandı
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5">
                        <Copy className="w-3 h-3" /> Kopyala
                      </span>
                    )}
                  </button>
                )}
              </label>
              <input
                type={showEDevletPasswords ? "text" : "password"}
                placeholder="e-Devlet Giriş Şifresi"
                value={form.eDevletCredentials?.eDevletPassword || ""}
                onChange={(e) => handleEDevletCredChange("eDevletPassword", e.target.value)}
                className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 font-mono text-xs transition-colors"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-blue-600" /> Mobil İmza / Telefon
                </span>
                {form.eDevletCredentials?.mobileSignaturePhone && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(form.eDevletCredentials?.mobileSignaturePhone, "edevlet_phone")}
                    className="text-[10px] text-slate-400 hover:text-blue-600 flex items-center gap-0.5 cursor-pointer font-normal"
                  >
                    {copiedKey === "edevlet_phone" ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                        <CheckCheck className="w-3 h-3" /> Kopyalandı
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5">
                        <Copy className="w-3 h-3" /> Kopyala
                      </span>
                    )}
                  </button>
                )}
              </label>
              <input
                type="text"
                placeholder="+90 (5xx) xxx xx xx"
                value={form.eDevletCredentials?.mobileSignaturePhone || ""}
                onChange={(e) => handleEDevletCredChange("mobileSignaturePhone", e.target.value)}
                className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 font-mono text-xs transition-colors"
              />
            </div>
          </div>

          {/* Güvenlik Notu */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 flex items-start gap-2.5 text-slate-700">
            <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold text-blue-900">Güvenlik & Gizlilik Bilgilendirmesi:</span> Kurumsal e-işlemler, vergi dairesi ve e-Devlet şifreleri şirketinizin muhasebe ve resmi işlemlerini kolaylaştırmak amacıyla güvenli veritabanınızda saklanır. Yetkisiz kişilerle paylaşılmamalıdır.
            </div>
          </div>
        </div>

        {/* 4. BÖLÜM: SGK VE VERGİ DAİRESİ GELEN TEBLİGATLAR */}
        {(() => {
          const tebligatList = getTebligatlar();
          const unreadCount = tebligatList.filter((t) => t.status === "unread").length;
          const totalAmount = tebligatList.reduce((sum, t) => sum + (t.amount || 0), 0);
          const urgentCount = tebligatList.filter((t) => {
            if (!t.legalDeadlineDate) return false;
            const diff = new Date(t.legalDeadlineDate).getTime() - new Date().getTime();
            return diff > 0 && diff < 15 * 24 * 60 * 60 * 1000;
          }).length;

          const filteredList = tebligatList.filter((t) => {
            const matchesSearch =
              tebligatSearch.trim() === "" ||
              t.documentTitle.toLowerCase().includes(tebligatSearch.toLowerCase()) ||
              t.senderUnit.toLowerCase().includes(tebligatSearch.toLowerCase()) ||
              t.barcodeNumber.toLowerCase().includes(tebligatSearch.toLowerCase()) ||
              (t.contentSummary && t.contentSummary.toLowerCase().includes(tebligatSearch.toLowerCase())) ||
              (t.workplaceName && t.workplaceName.toLowerCase().includes(tebligatSearch.toLowerCase()));

            if (!matchesSearch) return false;

            if (tebligatFilter === "GIB") return t.authority === "GIB";
            if (tebligatFilter === "SGK") return t.authority === "SGK";
            if (tebligatFilter === "unread") return t.status === "unread";
            if (tebligatFilter === "urgent") {
              if (!t.legalDeadlineDate) return false;
              const diff = new Date(t.legalDeadlineDate).getTime() - new Date().getTime();
              return diff > 0 && diff < 15 * 24 * 60 * 60 * 1000;
            }
            return true;
          });

          return (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs">
              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-purple-100 text-purple-700 font-bold text-xs shadow-2xs">
                      4
                    </span>
                    <span className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-purple-600" />
                      SGK ve Vergi Dairesi Gelen Tebligatlar (e-Tebligat Paneli)
                    </span>
                    {unreadCount > 0 && (
                      <span className="bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                        {unreadCount} Yeni / Okunmamış
                      </span>
                    )}
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-1">
                    GİB ve SGK elektronik tebligatları, tebellüğ tarihleri (5 günlük yasal tebellüğ süresi), yasal itiraz/ödeme süreleri ve resmi evrak takibi.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href="https://dijital.gib.gov.tr"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> GİB e-Tebligat
                  </a>

                  <a
                    href="https://etebligat.sgk.gov.tr/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> SGK e-Tebligat
                  </a>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <div className="text-[11px] text-slate-500 font-bold uppercase flex items-center gap-1">
                    <Inbox className="w-3.5 h-3.5 text-slate-400" />
                    Toplam Tebligat
                  </div>
                  <div className="text-lg font-black text-slate-800 mt-1 font-mono">
                    {tebligatList.length} <span className="text-xs font-normal text-slate-500">Adet</span>
                  </div>
                </div>

                <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200/80">
                  <div className="text-[11px] text-rose-700 font-bold uppercase flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-rose-600" />
                    Okunmamış Tebligat
                  </div>
                  <div className="text-lg font-black text-rose-700 mt-1 font-mono">
                    {unreadCount} <span className="text-xs font-normal text-rose-500">Adet</span>
                  </div>
                </div>

                <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80">
                  <div className="text-[11px] text-amber-700 font-bold uppercase flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Süresi Yaklaşanlar
                  </div>
                  <div className="text-lg font-black text-amber-700 mt-1 font-mono">
                    {urgentCount} <span className="text-xs font-normal text-amber-600">Yasal Süre</span>
                  </div>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTebligatFilter("all")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      tebligatFilter === "all"
                        ? "bg-purple-600 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Tümü ({tebligatList.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setTebligatFilter("GIB")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      tebligatFilter === "GIB"
                        ? "bg-red-600 text-white shadow-2xs"
                        : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                    }`}
                  >
                    <span>🏛️ Vergi Dairesi (GİB)</span>
                    <span className="text-[10px] font-mono">({tebligatList.filter((t) => t.authority === "GIB").length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTebligatFilter("SGK")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      tebligatFilter === "SGK"
                        ? "bg-emerald-600 text-white shadow-2xs"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                    }`}
                  >
                    <span>🛡️ SGK Tebligatları</span>
                    <span className="text-[10px] font-mono">({tebligatList.filter((t) => t.authority === "SGK").length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTebligatFilter("unread")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      tebligatFilter === "unread"
                        ? "bg-rose-600 text-white shadow-2xs"
                        : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                    }`}
                  >
                    <Mail className="w-3 h-3" />
                    <span>Okunmamış ({unreadCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTebligatFilter("urgent")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      tebligatFilter === "urgent"
                        ? "bg-amber-600 text-white shadow-2xs"
                        : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>Süresi Yaklaşan ({urgentCount})</span>
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tebligat başlığı, barkod, birim ara..."
                    value={tebligatSearch}
                    onChange={(e) => setTebligatSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 transition-colors"
                  />
                </div>
              </div>

              {/* Tebligat Items List */}
              {filteredList.length === 0 ? (
                <div className="text-center py-10 bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-slate-700 text-xs">Aranan kriterlere uygun tebligat kaydı bulunamadı.</div>
                  <p className="text-[11px] text-slate-400">Yeni bir e-tebligat kaydetmek için yukarıdaki butonu kullanabilirsiniz.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredList.map((item) => {
                    const isGib = item.authority === "GIB";
                    const isUnread = item.status === "unread";

                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isUnread
                            ? "bg-white border-rose-200/90 shadow-sm ring-1 ring-rose-100"
                            : "bg-slate-50/60 hover:bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                          {/* Left: Authority Badge & Document Title */}
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                  isGib
                                    ? "bg-red-100 text-red-800 border border-red-200"
                                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                }`}
                              >
                                <Landmark className="w-3 h-3" />
                                {isGib ? "GİB • Vergi Dairesi" : "SGK • Sosyal Güvenlik"}
                              </span>

                              {item.documentType && (
                                <span className="bg-slate-200/80 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  {item.documentType}
                                </span>
                              )}

                              {isUnread && (
                                <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                  Okunmamış Evrak
                                </span>
                              )}

                              {item.status === "in_process" && (
                                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  İşlemde / İncelemede
                                </span>
                              )}

                              {item.status === "paid" && (
                                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  Mahsup / Ödendi
                                </span>
                              )}
                            </div>

                            <h3 className="text-xs font-black text-slate-900 leading-snug">
                              {item.documentTitle}
                            </h3>

                            <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-y-1 gap-x-3">
                              <span>
                                🏛️ <strong>Gönderen:</strong> {item.senderUnit}
                              </span>
                              {item.workplaceName && (
                                <span className="text-emerald-700 font-medium">
                                  🏢 <strong>İlgili Birim:</strong> {item.workplaceName}
                                </span>
                              )}
                            </div>

                            {item.contentSummary && (
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                {item.contentSummary}
                              </p>
                            )}
                          </div>

                          {/* Middle: Barkod & Tarih Bilgisi */}
                          <div className="flex flex-wrap lg:flex-col items-start lg:items-end justify-between gap-1 text-[11px] font-mono text-slate-600 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200 pt-2 lg:pt-0 lg:pl-4">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400">Barkod:</span>
                              <span className="font-bold text-slate-800">{item.barcodeNumber}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(item.barcodeNumber, `barkod_${item.id}`)}
                                className="text-slate-400 hover:text-purple-600 cursor-pointer"
                                title="Barkod Kopyala"
                              >
                                {copiedKey === `barkod_${item.id}` ? (
                                  <CheckCheck className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>

                            <div className="text-[10px] text-slate-500">
                              Gönderim: <strong>{item.sentDate}</strong> • Tebellüğ:{" "}
                              <strong className="text-rose-700">{item.deliveryDate}</strong>
                            </div>

                            {item.legalDeadlineDate && (
                              <div className="text-[10px] bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-200 font-sans font-bold flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-600" />
                                Yasal Süre: {item.legalDeadlineDate}
                              </div>
                            )}

                            {item.amount !== undefined && item.amount > 0 && (
                              <div className="font-bold text-xs text-rose-700 font-mono mt-0.5">
                                ₺{item.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                              </div>
                            )}
                          </div>

                          {/* Right: Actions */}
                          <div className="flex items-center gap-1.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTebligat(item);
                                setIsTebligatModalOpen(true);
                                if (item.status === "unread") {
                                  handleTebligatStatusChange(item.id, "read");
                                }
                              }}
                              className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold px-3 py-1.5 rounded-xl border border-purple-200 transition-all flex items-center gap-1 cursor-pointer shadow-2xs text-xs"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Evrakı İncele</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleTebligatStatusChange(item.id, isUnread ? "read" : "unread")}
                              className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                                isUnread
                                  ? "bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border-slate-200 hover:border-emerald-300"
                                  : "bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border-slate-200 hover:border-rose-300"
                              }`}
                              title={isUnread ? "Okundu olarak işaretle" : "Okunmadı olarak işaretle"}
                            >
                              {isUnread ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Mail className="w-4 h-4 text-slate-400" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteTebligat(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                              title="Tebligat Kaydını Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* Submit Action */}
        <div className="flex items-center justify-between bg-purple-50/60 p-4 rounded-2xl border border-purple-200/60 shadow-xs">
          {isSaved ? (
            <span className="text-xs font-extrabold text-emerald-600 flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              E-İşlemler, GİB, SGK ve e-Devlet şifreleri başarıyla kaydedildi!
            </span>
          ) : (
            <span className="text-xs text-purple-900/80 font-medium">
              Yapılan tüm kurum ve şifre değişikliklerini kaydetmek için butona basınız.
            </span>
          )}

          <button
            type="submit"
            className="bg-[#8252F6] hover:bg-[#703EE5] text-white font-bold px-6 py-2.5 rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4 text-[#EF7D2C]" />
            <span>E-İşlem ve Kurum Şifrelerini Kaydet</span>
          </button>
        </div>
      </form>

      {/* GİB Dijital Vergi Dairesi Modal */}
      <GibPortalModal
        isOpen={isGibModalOpen}
        onClose={() => setIsGibModalOpen(false)}
        companySettings={form}
      />

      {/* SGK Portalı & e-Bildirge v2 Şube/Depo Şifre Seçimli Modal */}
      <SgkPortalModal
        isOpen={isSgkModalOpen}
        onClose={() => setIsSgkModalOpen(false)}
        companySettings={form}
        targetPortal={sgkTargetPortal}
        branches={branches}
        warehouses={warehouses}
      />

      {/* e-Tebligat Evrak Görüntüleme Modalı */}
      <ETebligatModal
        isOpen={isTebligatModalOpen}
        onClose={() => {
          setIsTebligatModalOpen(false);
          setSelectedTebligat(null);
        }}
        tebligat={selectedTebligat}
        companySettings={form}
        onStatusChange={handleTebligatStatusChange}
      />

      {/* Yeni e-Tebligat Kaydetme Modalı */}
      {isAddTebligatModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150 max-h-[92vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Yeni Gelen e-Tebligat Kaydı
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    GİB veya SGK üzerinden gelen resmi tebligatı sisteme işleyin.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddTebligatModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Kurum Seçimi */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Resmi Kurum (Tebliğ Eden)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTebligat((prev) => ({ ...prev, authority: "GIB" }))}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      newTebligat.authority === "GIB"
                        ? "bg-red-50 border-red-300 text-red-700 ring-2 ring-red-200"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Landmark className="w-4 h-4 text-red-600" />
                    <span>Gelir İdaresi (GİB / Vergi Dairesi)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewTebligat((prev) => ({ ...prev, authority: "SGK" }))}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      newTebligat.authority === "SGK"
                        ? "bg-emerald-50 border-emerald-300 text-emerald-700 ring-2 ring-emerald-200"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Sosyal Güvenlik Kurumu (SGK)</span>
                  </button>
                </div>
              </div>

              {/* Belge Başlığı & Türü */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Tebligat / Belge Başlığı <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: İzahata Davet Yazısı / Ödeme Emri"
                    value={newTebligat.documentTitle || ""}
                    onChange={(e) => setNewTebligat((prev) => ({ ...prev, documentTitle: e.target.value }))}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Evrak Türü</label>
                  <select
                    value={newTebligat.documentType || "İhbarname"}
                    onChange={(e) => setNewTebligat((prev) => ({ ...prev, documentType: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 font-medium"
                  >
                    <option value="İhbarname">Vergi / Ceza İhbarnamesi</option>
                    <option value="Ödeme Emri">Ödeme Emri (6183 S.K.)</option>
                    <option value="İzahata Davet">İzahata Davet (VUK 370)</option>
                    <option value="Teşvik Bildirimi">SGK Teşvik / Mahsup</option>
                    <option value="İdari Para Cezası">SGK İdari Para Cezası</option>
                    <option value="Denetim & Yoklama">Denetim / Yoklama Fişi</option>
                    <option value="Diğer">Diğer Resmi Tebligat</option>
                  </select>
                </div>
              </div>

              {/* Gönderen Birim & İlgili Şube */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Gönderen Birim / Daire <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Mecidiyeköy Vergi Dairesi Müdürlüğü"
                    value={newTebligat.senderUnit || ""}
                    onChange={(e) => setNewTebligat((prev) => ({ ...prev, senderUnit: e.target.value }))}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">İlgili İşyeri / Şube (Opsiyonel)</label>
                  <select
                    value={newTebligat.workplaceName || ""}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      const found = getWorkplaces().find((w) => w.name === selectedVal);
                      setNewTebligat((prev) => ({
                        ...prev,
                        workplaceName: selectedVal,
                        workplaceId: found?.id,
                      }));
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                  >
                    <option value="">Merkez / Genel</option>
                    {getWorkplaces().map((wp) => (
                      <option key={wp.id} value={wp.name}>
                        {wp.name} ({wp.workplaceRegistrationNo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Barkod, Zarf No & Tutar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Barkod No</label>
                  <input
                    type="text"
                    placeholder="Örn: GIB-2026-ETEB-123456"
                    value={newTebligat.barcodeNumber || ""}
                    onChange={(e) => setNewTebligat((prev) => ({ ...prev, barcodeNumber: e.target.value }))}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-300 rounded-xl p-2.5 font-mono text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Zarf No</label>
                  <input
                    type="text"
                    placeholder="Örn: e-ZRF-2026-987654"
                    value={newTebligat.envelopeId || ""}
                    onChange={(e) => setNewTebligat((prev) => ({ ...prev, envelopeId: e.target.value }))}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-300 rounded-xl p-2.5 font-mono text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tebliğ Edilen Tutar (₺)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={newTebligat.amount || ""}
                    onChange={(e) => setNewTebligat((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-300 rounded-xl p-2.5 font-mono text-xs text-slate-900 font-bold"
                  />
                </div>
              </div>

              {/* Tarihler: Gönderim, Tebellüğ, Yasal Süre */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gönderim Tarihi</label>
                  <input
                    type="date"
                    value={newTebligat.sentDate || ""}
                    onChange={(e) => {
                      const sent = e.target.value;
                      const delDate = new Date(new Date(sent).getTime() + 5 * 24 * 60 * 60 * 1000)
                        .toISOString()
                        .split("T")[0];
                      const legalDate = new Date(new Date(sent).getTime() + 35 * 24 * 60 * 60 * 1000)
                        .toISOString()
                        .split("T")[0];
                      setNewTebligat((prev) => ({
                        ...prev,
                        sentDate: sent,
                        deliveryDate: delDate,
                        legalDeadlineDate: legalDate,
                      }));
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-rose-700">
                    Tebellüğ Tarihi (5. Gün)
                  </label>
                  <input
                    type="date"
                    value={newTebligat.deliveryDate || ""}
                    onChange={(e) => setNewTebligat((prev) => ({ ...prev, deliveryDate: e.target.value }))}
                    className="w-full bg-white border border-rose-300 rounded-xl p-2 font-mono text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-amber-700">
                    Yasal Süre Bitiş Tarihi
                  </label>
                  <input
                    type="date"
                    value={newTebligat.legalDeadlineDate || ""}
                    onChange={(e) => setNewTebligat((prev) => ({ ...prev, legalDeadlineDate: e.target.value }))}
                    className="w-full bg-white border border-amber-300 rounded-xl p-2 font-mono text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* İçerik Özeti & Notlar */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tebligat Konusu & İçerik Özeti</label>
                <textarea
                  rows={2}
                  placeholder="Tebligatın içeriği, istenen bilgi/belgeler veya vergi/ceza konusu..."
                  value={newTebligat.contentSummary || ""}
                  onChange={(e) => setNewTebligat((prev) => ({ ...prev, contentSummary: e.target.value }))}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Şirket / Müşavir Notu (Opsiyonel)</label>
                <input
                  type="text"
                  placeholder="Örn: Muhasebeye iletildi, itiraz dilekçesi hazırlanıyor."
                  value={newTebligat.notes || ""}
                  onChange={(e) => setNewTebligat((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddTebligatModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={!newTebligat.documentTitle?.trim() || !newTebligat.senderUnit?.trim()}
                onClick={handleSaveNewTebligat}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Tebligatı Kaydet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Şube / Depo SGK Şifresi Ekleme Modalı */}
      {isAddWpModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Yeni SGK İşyeri / Şube / Depo Ekle
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Mevcut şube ve depolardan seçin veya yeni bir işyeri adı girin.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddWpModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mevcut Şubelerden Hızlı Ekle */}
            {unlinkedBranches.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-600" />
                  <span>Kayıtlı Şubelerden Ekle:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {unlinkedBranches.map((br) => (
                    <button
                      key={br.id}
                      type="button"
                      onClick={() => handleAddWorkplace(br.name, "branch", br.id)}
                      className="text-left p-2.5 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-100/70 text-blue-900 text-xs font-bold flex items-center justify-between transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Building className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">{br.name}</span>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mevcut Depolardan Hızlı Ekle */}
            {unlinkedWarehouses.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <WarehouseIcon className="w-3.5 h-3.5 text-amber-600" />
                  <span>Kayıtlı Depolardan Ekle:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {unlinkedWarehouses.map((wh) => (
                    <button
                      key={wh.id}
                      type="button"
                      onClick={() => handleAddWorkplace(wh.name, "warehouse", wh.id)}
                      className="text-left p-2.5 rounded-xl border border-amber-100 bg-amber-50/50 hover:bg-amber-100/70 text-amber-900 text-xs font-bold flex items-center justify-between transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <WarehouseIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">{wh.name}</span>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Manuel Özel İşyeri / Şube Adı */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>Özel Birim / Şube / Depo Adı ile Ekle:</span>
              </div>
              <div className="space-y-2.5">
                <div className="flex gap-2">
                  <select
                    value={customWpType}
                    onChange={(e) => setCustomWpType(e.target.value as any)}
                    className="bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 font-bold"
                  >
                    <option value="branch">🏬 Şube</option>
                    <option value="warehouse">🏭 Depo</option>
                    <option value="other">📌 Diğer / Birim</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Örn: İzmir Bölge Şubesi veya Lojistik Depo 2"
                    value={customWpName}
                    onChange={(e) => setCustomWpName(e.target.value)}
                    className="flex-1 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (customWpName.trim()) {
                          handleAddWorkplace(customWpName, customWpType);
                        }
                      }
                    }}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddWpModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    disabled={!customWpName.trim()}
                    onClick={() => handleAddWorkplace(customWpName, customWpType)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> SGK İşyeri Ekle
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
