import React, { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  Terminal,
  ShieldAlert,
  Copy,
  Check,
  Trash2,
  Play,
  ChevronDown,
  ChevronUp,
  Info,
  Building2,
  FileText,
  ShieldCheck,
  Users,
  Store,
  Layers,
  Sparkles,
  Download,
  Filter,
  UserCheck,
  Clock,
  Zap,
} from "lucide-react";
import {
  MYSOFT_ERROR_SOLUTION_CATALOG,
  resolveMysoftLogSolution,
  validateMysoftInvoiceOutboxPayload,
  recordMysoftDiagnosticLog,
  clearMysoftDiagnosticLogs,
  resetSampleMysoftDiagnosticLogs,
  type MysoftDiagnosticLogEntry,
  type MysoftErrorSolutionGuide,
} from "../services/mysoftInvoicePayload";
import { fetchMysoftDiagnosticLogs } from "../services/mysoftEDocumentService";
import {
  getSystemAuditLogs,
  clearSystemAuditLogs,
  logSystemAction,
  type SystemAuditLogItem,
} from "../services/systemSyncService";

interface AdminMysoftLogMonitorPanelProps {
  companyName?: string;
  companyTaxNumber?: string;
}

type MainLogTab =
  | "all_events"
  | "user_auth"
  | "company_system"
  | "ecommerce_invoices"
  | "mysoft_api"
  | "solution_catalog";

type RoleFilter = "all" | "admin_sysadmin" | "regular_users";
type StatusFilter = "all" | "success" | "warning" | "error";

export const AdminMysoftLogMonitorPanel: React.FC<AdminMysoftLogMonitorPanelProps> = ({
  companyName,
  companyTaxNumber,
}) => {
  // State
  const [systemLogs, setSystemLogs] = useState<SystemAuditLogItem[]>([]);
  const [apiLogs, setApiLogs] = useState<MysoftDiagnosticLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<MainLogTab>("all_events");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedLogIds, setExpandedLogIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Mysoft API specific sub-filters
  const [apiStageFilter, setApiStageFilter] = useState<
    "ALL" | "UPSTREAM_API_ERROR" | "PRE_SEND_VALIDATION" | "AUTO_RECOVERY_RETRY" | "SEND_SUCCESS"
  >("ALL");
  const [selectedErrorCodeFilter, setSelectedErrorCodeFilter] = useState<string>("ALL");

  // Load both system audit logs and Mysoft diagnostic logs
  const loadAllLogs = useCallback(async () => {
    setLoading(true);
    try {
      const [sysLogsData, apiLogsData] = await Promise.all([
        getSystemAuditLogs(120),
        fetchMysoftDiagnosticLogs(60),
      ]);
      setSystemLogs(sysLogsData);
      setApiLogs(apiLogsData);
      if (apiLogsData.length > 0 && !expandedLogIds[apiLogsData[0].id]) {
        setExpandedLogIds((prev) => ({
          ...prev,
          [apiLogsData[0].id]: true,
        }));
      }
    } catch (e) {
      console.warn("Log yükleme hatası:", e);
    } finally {
      setLoading(false);
    }
  }, [expandedLogIds]);

  useEffect(() => {
    void loadAllLogs();
  }, [loadAllLogs]);

  // Listen for real-time audit logs added across the app
  useEffect(() => {
    const handleNewAudit = (event: any) => {
      if (event?.detail) {
        setSystemLogs((prev) => [
          event.detail,
          ...prev.filter((item) => item.id !== event.detail.id),
        ]);
      }
    };

    const handleSyncBroadcast = () => {
      void loadAllLogs();
    };

    window.addEventListener("muavin:audit-log-added", handleNewAudit);
    window.addEventListener("muavin:central-sync-broadcast", handleSyncBroadcast);
    return () => {
      window.removeEventListener("muavin:audit-log-added", handleNewAudit);
      window.removeEventListener("muavin:central-sync-broadcast", handleSyncBroadcast);
    };
  }, [loadAllLogs]);

  const toggleExpand = (id: string) => {
    setExpandedLogIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyApiLogJson = (
    log: MysoftDiagnosticLogEntry,
    solution: MysoftErrorSolutionGuide
  ) => {
    const exportObj = {
      ...log,
      diagnosticAnalysis: {
        errorCode: solution.errorCode,
        title: solution.title,
        category: solution.category,
        rootCause: solution.rootCause,
        solutionSteps: solution.solutionSteps,
        autoRemediation: solution.autoRemediation,
      },
    };
    handleCopy(log.id, JSON.stringify(exportObj, null, 2));
  };

  // Simulation test tools
  const handleSimulateNullReferenceTest = () => {
    const rawBrokenPayload = {
      tenantIdentifierNumber: "37756832708",
      eDocumentType: "EFATURA",
      profile: "TICARIFATURA",
      invoiceType: "SATIS",
      docNo: "GIB2026000000042",
      pkAlias: "urn:mail:defaultpk@7600924362.com.tr",
      invoiceAccount: {
        vknTckn: "7600924362",
        accountName: "SEMİH YAPI OTOMOTİV LİMİTED ŞİRKETİ",
      },
      invoiceDetail: [
        {
          productName: "Yazılım Geliştirme & Entegrasyon Hizmeti",
          qty: 1,
          unitPriceTra: 15000,
          vatRate: 20,
          currencyCode: "TRY",
        },
      ],
    };

    const validation = validateMysoftInvoiceOutboxPayload(rawBrokenPayload, {
      requireTenantIdentifier: true,
      autoRepair: true,
    });

    const newEntry = recordMysoftDiagnosticLog({
      stage: "UPSTREAM_API_ERROR",
      operation: "Simülasyon: POST /api/InvoiceOutbox/invoiceOutbox (Null-Guard Analizi)",
      tenantIdentifierNumber: "37756832708",
      buyerVknTckn: "7600924362",
      buyerName: "SEMİH YAPI OTOMOTİV LİMİTED ŞİRKETİ",
      eDocumentType: "EFATURA",
      profile: "TICARIFATURA",
      invoiceType: "SATIS",
      docNo: "ABD2026000000101",
      prefix: "ABD",
      lineCount: 1,
      payableAmount: 18000,
      nullGuard: validation.nullGuard,
      validationWarnings: validation.warnings,
      upstreamStatus: 400,
      upstreamErrorCode: "SYS_NULL_REF_001",
      errorMessage:
        "Object reference not set to an instance of an object. -> Null-Guard: Eksik 'invoiceCalculation' dip toplamı ve kurgusal 'pkAlias' otomatik onarıldı.",
    });

    setApiLogs((prev) => [newEntry, ...prev.filter((item) => item.id !== newEntry.id)]);
    setExpandedLogIds((prev) => ({ ...prev, [newEntry.id]: true }));
    setNotice("Null-Guard ve nesne referans testi başarıyla çalıştırıldı ve loglandı.");
    setTimeout(() => setNotice(null), 4000);
  };

  const handleSimulateMissingVknTest = () => {
    const invalidPayload = {
      tenantIdentifierNumber: "",
      eDocumentType: "EFATURA",
      profile: "TEMELFATURA",
      invoiceType: "SATIS",
      invoiceAccount: {
        vknTckn: "12345",
        accountName: "",
      },
      invoiceDetail: [],
    };

    validateMysoftInvoiceOutboxPayload(invalidPayload, {
      requireTenantIdentifier: true,
      autoRepair: true,
    });

    void loadAllLogs();
    setNotice("Zorunlu alan doğrulama testi çalıştırıldı (Eksik VKN ve boş kalem gönderim öncesi yakalandı).");
    setTimeout(() => setNotice(null), 4000);
  };

  // Add sample audit log for testing
  const handleAddSampleAuditAction = () => {
    void logSystemAction({
      action: "Modül Yetki Matrisi Düzenlendi",
      category: "Kullanıcı & Yetki",
      details: "Semih kullanıcısına E-Fatura, Pazaryeri ve Raporlar ana modülleri için tam erişim yetkisi tanımlandı.",
      performedBy: "İlyas Yıldırım (Sistem Yöneticisi)",
      userRole: "Sistem Yöneticisi",
      targetUser: "Semih",
      timestamp: new Date().toISOString(),
    });
    setNotice("Örnek sistem denetim ve kullanıcı yetki hareketi eklendi.");
    setTimeout(() => setNotice(null), 4000);
  };

  const handleClearAllLogs = () => {
    if (!window.confirm("Tüm log kayıtlarını (sistem denetim ve API logları) temizlemek istediğinizden emin misiniz?")) {
      return;
    }
    clearSystemAuditLogs();
    clearMysoftDiagnosticLogs();
    setSystemLogs([]);
    setApiLogs([]);
    setNotice("Tüm yerel sistem ve tanılama logları temizlendi.");
    setTimeout(() => setNotice(null), 3000);
  };

  const handleResetSampleLogs = () => {
    const seeded = resetSampleMysoftDiagnosticLogs();
    setApiLogs(seeded);
    if (seeded[0]) {
      setExpandedLogIds({ [seeded[0].id]: true });
    }
    setNotice("Örnek teknik hata ve çözüm kayıtları yeniden yüklendi.");
    setTimeout(() => setNotice(null), 3000);
  };

  const handleExportJson = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      companyName,
      companyTaxNumber,
      systemAuditLogs: systemLogs,
      apiDiagnosticLogs: apiLogs,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `muavin_sistem_loglari_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice("Tüm sistem logları JSON dosyası olarak indirildi.");
    setTimeout(() => setNotice(null), 3000);
  };

  // Helper to determine if a log is performed by Admin/SysAdmin
  const isLogFromAdminOrSysAdmin = (log: SystemAuditLogItem) => {
    const p = (log.performedBy || "").toLowerCase();
    const r = (log.userRole || "").toLowerCase();
    return (
      p.includes("admin") ||
      p.includes("yönetici") ||
      p.includes("sistem") ||
      r.includes("admin") ||
      r.includes("yönetici") ||
      r.includes("sistem yöneticisi")
    );
  };

  // Filter System Audit Logs
  const filteredSystemLogs = systemLogs.filter((log) => {
    // 1. Tab category filter
    if (activeTab === "user_auth" && log.category !== "Kullanıcı & Yetki") return false;
    if (
      activeTab === "company_system" &&
      log.category !== "Şirket & Yapılandırma" &&
      log.category !== "Sistem & Ayarlar" &&
      log.category !== "Bordro & SGK" &&
      log.category !== "Duyuru"
    ) {
      return false;
    }
    if (
      activeTab === "ecommerce_invoices" &&
      log.category !== "Pazaryeri & Entegrasyon" &&
      log.category !== "Fatura & Muhasebe" &&
      log.category !== "Evrak & Dosya"
    ) {
      return false;
    }

    // 2. Role filter
    if (roleFilter === "admin_sysadmin" && !isLogFromAdminOrSysAdmin(log)) return false;
    if (roleFilter === "regular_users" && isLogFromAdminOrSysAdmin(log)) return false;

    // 3. Status filter
    if (statusFilter !== "all" && (log.status || "success") !== statusFilter) return false;

    // 4. Search filter
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.performedBy.toLowerCase().includes(q) ||
      (log.targetUser && log.targetUser.toLowerCase().includes(q)) ||
      (log.targetCompany && log.targetCompany.toLowerCase().includes(q)) ||
      log.category.toLowerCase().includes(q)
    );
  });

  // Filter API Diagnostic Logs
  const filteredApiLogs = apiLogs.filter((entry) => {
    if (apiStageFilter !== "ALL" && entry.stage !== apiStageFilter) return false;
    const solution = resolveMysoftLogSolution(entry);
    if (selectedErrorCodeFilter !== "ALL" && solution.errorCode !== selectedErrorCodeFilter) {
      return false;
    }
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (entry.errorMessage && entry.errorMessage.toLowerCase().includes(q)) ||
      (entry.buyerName && entry.buyerName.toLowerCase().includes(q)) ||
      (entry.buyerVknTckn && entry.buyerVknTckn.toLowerCase().includes(q)) ||
      (entry.tenantIdentifierNumber && entry.tenantIdentifierNumber.toLowerCase().includes(q)) ||
      (entry.docNo && entry.docNo.toLowerCase().includes(q)) ||
      solution.errorCode.toLowerCase().includes(q) ||
      solution.title.toLowerCase().includes(q) ||
      solution.category.toLowerCase().includes(q)
    );
  });

  // KPI Metrics
  const totalAuditLogsCount = systemLogs.length;
  const userAuthLogsCount = systemLogs.filter((l) => l.category === "Kullanıcı & Yetki").length;
  const companySystemLogsCount = systemLogs.filter(
    (l) =>
      l.category === "Şirket & Yapılandırma" ||
      l.category === "Sistem & Ayarlar" ||
      l.category === "Bordro & SGK"
  ).length;
  const totalApiErrors = apiLogs.filter((l) => l.stage === "UPSTREAM_API_ERROR").length;
  const totalApiSuccess = apiLogs.filter((l) => l.stage === "SEND_SUCCESS").length;

  // Format date nicely
  const formatTimeAgo = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 60) return "Az önce";
      if (diffMin < 60) return `${diffMin} dk önce`;
      if (diffHour < 24) return `${diffHour} sa önce`;
      if (diffDay < 7) return `${diffDay} gün önce`;
      return date.toLocaleDateString("tr-TR");
    } catch {
      return "";
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "Kullanıcı & Yetki":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Şirket & Yapılandırma":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Pazaryeri & Entegrasyon":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Fatura & Muhasebe":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Bordro & SGK":
        return "bg-pink-100 text-pink-800 border-pink-200";
      case "Evrak & Dosya":
        return "bg-teal-100 text-teal-800 border-teal-200";
      case "Oturum & Güvenlik":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getStageLabel = (stage: MysoftDiagnosticLogEntry["stage"]) => {
    switch (stage) {
      case "UPSTREAM_API_ERROR":
        return {
          text: "Mysoft API Teknik Hata",
          tone: "text-rose-700 bg-rose-50 border-rose-200",
        };
      case "PRE_SEND_VALIDATION":
        return {
          text: "Gönderim Öncesi Engellendi",
          tone: "text-amber-800 bg-amber-50 border-amber-200",
        };
      case "AUTO_RECOVERY_RETRY":
        return {
          text: "Otomatik Onarım & Yeniden Deneme",
          tone: "text-sky-800 bg-sky-50 border-sky-200",
        };
      case "SEND_SUCCESS":
        return {
          text: "Doğrulandı & Gönderildi",
          tone: "text-emerald-800 bg-emerald-50 border-emerald-200",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* 🌟 Üst Başlık ve Konsol Çubuğu */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-amber-300 font-semibold">
              <Terminal className="w-4 h-4" />
              <span>Merkezi Sistem Denetimi, Kullanıcı Hareketleri & API Teşhis Konsolu</span>
              {companyName && (
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20 text-[11px] font-bold inline-flex items-center gap-1.5">
                  <Building2 className="w-3 h-3 text-sky-300" />
                  <span>{companyName}</span>
                  {companyTaxNumber && (
                    <span className="font-mono text-amber-300">({companyTaxNumber})</span>
                  )}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Log İzleme Ekranı</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono font-medium">
                Canlı İzleme Aktif
              </span>
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Admin, sistem yöneticisi ve yetkilendirilmiş personellerin yaptığı tüm değişiklikler
              (modül yetkilendirme matrisi, şirket ayarları, kullanıcı oluşturma/şifreleme, entegrasyonlar)
              ve Mysoft E-Belge API teknik hata/çözüm kayıtları burada eşzamanlı olarak listelenir.
            </p>
          </div>

          {/* Hızlı Aksiyon Butonları */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportJson}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-white/15 cursor-pointer shadow-xs"
              title="Tüm sistem loglarını JSON olarak indir"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Dışa Aktar</span>
            </button>
            <button
              type="button"
              onClick={handleAddSampleAuditAction}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Test amaçlı yetki denetim logu üret"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Yetki Logu Simüle Et</span>
            </button>
            <button
              type="button"
              onClick={handleSimulateNullReferenceTest}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Mysoft Null-Guard API analizini simüle et"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>API Hata Testi</span>
            </button>
            <button
              type="button"
              onClick={() => void loadAllLogs()}
              disabled={loading}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-white/15 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Yenile</span>
            </button>
            <button
              type="button"
              onClick={handleClearAllLogs}
              className="p-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl transition-all border border-rose-500/30 cursor-pointer"
              title="Tüm log kayıtlarını temizle"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 📊 KPI Metrik Kartları */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800">
          <div className="bg-slate-800/70 rounded-xl p-3.5 border border-slate-700/70">
            <div className="text-[11px] text-slate-400 font-medium">Toplam Sistem Hareketi</div>
            <div className="text-xl font-bold text-white font-mono mt-1">
              {totalAuditLogsCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Admin & Kullanıcı İşlemleri</div>
          </div>

          <div className="bg-slate-800/70 rounded-xl p-3.5 border border-slate-700/70">
            <div className="text-[11px] text-slate-400 font-medium">Yetki & Modül Değişikliği</div>
            <div className="text-xl font-bold text-sky-400 font-mono mt-1">
              {userAuthLogsCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Matris & Rol Güncellemeleri</div>
          </div>

          <div className="bg-slate-800/70 rounded-xl p-3.5 border border-slate-700/70">
            <div className="text-[11px] text-slate-400 font-medium">Şirket & Sistem Güncellemeleri</div>
            <div className="text-xl font-bold text-purple-400 font-mono mt-1">
              {companySystemLogsCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Firma, Şube ve Parametreler</div>
          </div>

          <div className="bg-slate-800/70 rounded-xl p-3.5 border border-slate-700/70">
            <div className="text-[11px] text-slate-400 font-medium">Mysoft API & Hata Tanılama</div>
            <div className="text-xl font-bold text-amber-300 font-mono mt-1">
              {totalApiErrors} Hata / {totalApiSuccess} Başarılı
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Null-Guard & Schematron</div>
          </div>
        </div>
      </div>

      {/* Bildirim Çubuğu */}
      {notice && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notice}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-white/80 hover:text-white text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 🧭 Ana Navigasyon Sekmeleri */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-xs flex flex-wrap items-center gap-1.5">
        {[
          {
            id: "all_events",
            label: "Tüm Sistem Hareketleri",
            badge: systemLogs.length,
            icon: Zap,
            color: "text-amber-600",
          },
          {
            id: "user_auth",
            label: "Kullanıcı & Yetki Değişiklikleri",
            badge: userAuthLogsCount,
            icon: ShieldCheck,
            color: "text-blue-600",
          },
          {
            id: "company_system",
            label: "Şirket & Sistem Yapılandırması",
            badge: companySystemLogsCount,
            icon: Building2,
            color: "text-purple-600",
          },
          {
            id: "ecommerce_invoices",
            label: "Pazaryeri & E-Belge İşlemleri",
            badge: systemLogs.filter(
              (l) => l.category === "Pazaryeri & Entegrasyon" || l.category === "Fatura & Muhasebe"
            ).length,
            icon: Store,
            color: "text-orange-600",
          },
          {
            id: "mysoft_api",
            label: "Mysoft API Tanılama & Null-Guard",
            badge: apiLogs.length,
            icon: Terminal,
            color: "text-indigo-600",
          },
          {
            id: "solution_catalog",
            label: "Hata Çözüm Kataloğu",
            badge: MYSOFT_ERROR_SOLUTION_CATALOG.length,
            icon: Info,
            color: "text-emerald-600",
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as MainLogTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-400" : tab.color}`} />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                  isActive ? "bg-white/20 text-white" : "bg-white text-slate-800 border border-slate-200"
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* 🔍 Filtre & Arama Araç Çubuğu */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Arama Kutusu */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                activeTab === "mysoft_api" || activeTab === "solution_catalog"
                  ? "Hata kodu, VKN, unvan veya çözüm ara..."
                  : "Personel adı, e-posta, yapılan işlem, şirket veya modül ara..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0f6bae] focus:bg-white transition-colors"
            />
          </div>

          {/* Rol ve Durum Filtreleri (Sistem logları için) */}
          {activeTab !== "mysoft_api" && activeTab !== "solution_catalog" && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Rol Filtresi */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {[
                  { id: "all", label: "Tüm Roller" },
                  { id: "admin_sysadmin", label: "Admin & Sistem Yöneticisi" },
                  { id: "regular_users", label: "Personel & Kullanıcılar" },
                ].map((rf) => (
                  <button
                    key={rf.id}
                    type="button"
                    onClick={() => setRoleFilter(rf.id as RoleFilter)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      roleFilter === rf.id
                        ? "bg-white text-[#0f6bae] shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {rf.label}
                  </button>
                ))}
              </div>

              {/* Durum Filtresi */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {[
                  { id: "all", label: "Tüm Durumlar" },
                  { id: "success", label: "Başarılı" },
                  { id: "warning", label: "Uyarı" },
                  { id: "error", label: "Hata" },
                ].map((sf) => (
                  <button
                    key={sf.id}
                    type="button"
                    onClick={() => setStatusFilter(sf.id as StatusFilter)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      statusFilter === sf.id
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {sf.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* API Aşaması Filtresi (Mysoft API için) */}
          {activeTab === "mysoft_api" && (
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={apiStageFilter}
                onChange={(e) => setApiStageFilter(e.target.value as any)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold cursor-pointer focus:outline-none focus:border-[#0f6bae]"
              >
                <option value="ALL">Tüm Aşama Tipleri</option>
                <option value="UPSTREAM_API_ERROR">Mysoft API Teknik Hataları</option>
                <option value="PRE_SEND_VALIDATION">Gönderim Öncesi Engellenenler</option>
                <option value="AUTO_RECOVERY_RETRY">Otomatik Onarılanlar</option>
                <option value="SEND_SUCCESS">Başarılı Gönderimler</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 📄 İÇERİK BÖLÜMÜ */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-[#0f6bae]" />
          <span className="font-semibold text-slate-700">Log kayıtları yükleniyor...</span>
        </div>
      ) : activeTab === "solution_catalog" ? (
        /* 📖 GÖRÜNÜM: HATA ÇÖZÜM KATALOĞU */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MYSOFT_ERROR_SOLUTION_CATALOG.filter((item) => {
            if (!searchTerm.trim()) return true;
            const q = searchTerm.toLowerCase();
            return (
              item.errorCode.toLowerCase().includes(q) ||
              item.title.toLowerCase().includes(q) ||
              item.category.toLowerCase().includes(q) ||
              item.rootCause.toLowerCase().includes(q)
            );
          }).map((guide) => (
            <div
              key={guide.errorCode}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-950 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                    {guide.errorCode}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">{guide.category}</span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{guide.title}</h3>

                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed">
                  <strong className="text-slate-900">Kök Neden: </strong>
                  {guide.rootCause}
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="text-xs font-bold text-slate-900">Çözüm Önerileri:</div>
                  <ul className="space-y-1 text-xs text-slate-700">
                    {guide.solutionSteps.map((st, idx) => (
                      <li key={idx} className="leading-relaxed">
                        • {st}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs text-emerald-800 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/60">
                <strong className="font-bold">Sistem Koruması: </strong>
                {guide.autoRemediation}
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === "mysoft_api" ? (
        /* 🔍 GÖRÜNÜM: MYSOFT API TEKNİK LOGLARI */
        <div className="space-y-3">
          {filteredApiLogs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <div className="text-sm font-bold text-slate-800">
                Filtreye uygun Mysoft API hata kaydı bulunamadı
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Üstteki &ldquo;API Hata Testi&rdquo; butonuna tıklayarak simülasyon kaydı oluşturabilirsiniz.
              </p>
            </div>
          ) : (
            filteredApiLogs.map((log) => {
              const solution = resolveMysoftLogSolution(log);
              const stageMeta = getStageLabel(log.stage);
              const isExpanded = Boolean(expandedLogIds[log.id]);

              return (
                <div
                  key={log.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all"
                >
                  <div
                    onClick={() => toggleExpand(log.id)}
                    className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {solution.errorCode}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${stageMeta.tone}`}
                        >
                          {stageMeta.text}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-600 font-medium">{solution.category}</span>
                        <span className="text-slate-400">·</span>
                        <span className="font-mono text-[11px] text-slate-500">
                          {new Date(log.timestamp).toLocaleString("tr-TR")}
                        </span>
                      </div>

                      <div className="text-sm font-bold text-slate-900">{solution.title}</div>

                      {log.errorMessage && (
                        <div className="text-xs font-mono text-rose-700 bg-rose-50/70 border border-rose-200/70 rounded-lg px-3 py-1.5 break-words">
                          {log.errorMessage}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-0.5">
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>Mükellef VKN:</span>
                          <strong className="font-mono text-slate-900">
                            {log.tenantIdentifierNumber || "Eksik"}
                          </strong>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>Alıcı:</span>
                          <strong className="text-slate-900">{log.buyerName || "Ünvan Yok"}</strong>
                          <span className="font-mono text-slate-600">
                            ({log.buyerVknTckn || "VKN Eksik"})
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyApiLogJson(log, solution);
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copiedId === log.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Kopyalandı</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>JSON</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 bg-slate-50/50 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                        <div className="bg-white rounded-xl p-3.5 border border-slate-200 space-y-2">
                          <div className="text-xs font-bold text-slate-900">Teknik Çözüm Önerisi</div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {solution.rootCause}
                          </p>
                          <ul className="text-xs text-slate-700 space-y-1 pt-1">
                            {solution.solutionSteps.map((st, i) => (
                              <li key={i}>• {st}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-white rounded-xl p-3.5 border border-slate-200 space-y-2">
                          <div className="text-xs font-bold text-slate-900">Null-Guard Analizi</div>
                          <div className="text-xs font-mono text-slate-700 space-y-1">
                            <div>İşlem: {log.operation}</div>
                            <div>Belge No: {log.docNo || "Yok"}</div>
                            <div>Ön Ek: {log.prefix || "Yok"}</div>
                            <div>Tutar: {log.payableAmount ? `${log.payableAmount.toLocaleString("tr-TR")} ₺` : "Yok"}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* 🛡️ GÖRÜNÜM: MERKEZİ SİSTEM DENETİM VE KULLANICI HAREKET LOGLARI */
        <div className="space-y-3">
          {filteredSystemLogs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <div className="text-sm font-bold text-slate-800">
                Seçili filtreye uygun sistem hareketi veya kullanıcı işlem kaydı bulunamadı
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Admin veya kullanıcılar şirket ayarları, yetki matrisi veya personel tanımlarında değişiklik yaptığında kayıtlar anında bu konsola düşer.
              </p>
            </div>
          ) : (
            filteredSystemLogs.map((log) => {
              const isAdmin = isLogFromAdminOrSysAdmin(log);
              const isExpanded = Boolean(expandedLogIds[log.id || ""]);
              const logId = log.id || `log_${log.timestamp}`;

              return (
                <div
                  key={logId}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300"
                >
                  <div
                    onClick={() => toggleExpand(logId)}
                    className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Sol Bilgi Sütunu */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Avatar / İkon */}
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          isAdmin
                            ? "bg-[#131b2e] text-[#c6cdff] border-[#222a3d]"
                            : "bg-blue-50 text-[#0f6bae] border-blue-200"
                        }`}
                      >
                        {isAdmin ? (
                          <ShieldCheck className="w-5 h-5 text-indigo-300" />
                        ) : (
                          <Users className="w-5 h-5 text-[#0f6bae]" />
                        )}
                      </div>

                      {/* Ana Bilgi */}
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {/* Kategori Etiketi */}
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getCategoryBadge(
                              log.category
                            )}`}
                          >
                            {log.category}
                          </span>

                          {/* Rol Rozeti */}
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isAdmin
                                ? "bg-slate-900 text-amber-300 border border-slate-700"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {log.userRole || (isAdmin ? "Sistem Yöneticisi" : "Kullanıcı")}
                          </span>

                          {/* Hedef Bilgisi */}
                          {log.targetUser && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Hedef Kullanıcı: {log.targetUser}
                            </span>
                          )}

                          {log.targetCompany && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              Şirket: {log.targetCompany}
                            </span>
                          )}

                          <span className="text-slate-300">·</span>

                          {/* Zaman */}
                          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{formatTimeAgo(log.timestamp)}</span>
                            <span className="text-slate-400">
                              ({new Date(log.timestamp).toLocaleString("tr-TR")})
                            </span>
                          </span>
                        </div>

                        {/* İşlem Başlığı */}
                        <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span>{log.action}</span>
                        </div>

                        {/* Detay Açıklaması */}
                        <div className="text-xs text-slate-600 leading-relaxed font-normal">
                          {log.details}
                        </div>
                      </div>
                    </div>

                    {/* Sağ Taraf: İşlemi Yapan & Aksiyonlar */}
                    <div className="flex items-center gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs font-bold text-slate-900 truncate max-w-[180px]">
                          {log.performedBy}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          İşlemi Gerçekleştiren
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(logId, JSON.stringify(log, null, 2));
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Log detaylarını JSON olarak kopyala"
                      >
                        {copiedId === logId ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Kopyalandı</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Kopyala</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Genişletilmiş Detaylar */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 bg-slate-50/60 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                        <div className="bg-white rounded-xl p-3 border border-slate-200 text-xs">
                          <span className="text-slate-400 block font-medium">İşlemi Yapan</span>
                          <strong className="text-slate-900 block mt-0.5">{log.performedBy}</strong>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Rol: {log.userRole || "Belirtilmedi"}
                          </span>
                        </div>

                        <div className="bg-white rounded-xl p-3 border border-slate-200 text-xs">
                          <span className="text-slate-400 block font-medium">Kayıt Türü & Durum</span>
                          <strong className="text-slate-900 block mt-0.5">{log.category}</strong>
                          <span className="text-[10px] text-emerald-600 font-semibold font-mono">
                            Durum: {log.status || "Başarılı"}
                          </span>
                        </div>

                        <div className="bg-white rounded-xl p-3 border border-slate-200 text-xs">
                          <span className="text-slate-400 block font-medium">Merkezi Zaman Damgası</span>
                          <strong className="text-slate-900 block mt-0.5 font-mono text-[11px]">
                            {new Date(log.timestamp).toLocaleString("tr-TR")}
                          </strong>
                          <span className="text-[10px] text-slate-500 font-mono">
                            ID: {log.id || "Yerel Kayıt"}
                          </span>
                        </div>
                      </div>

                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="bg-white rounded-xl p-3 border border-slate-200 text-xs font-mono">
                          <span className="text-slate-400 block font-sans font-medium mb-1">
                            Ek Meta Bilgileri
                          </span>
                          <pre className="text-[11px] text-slate-700 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
