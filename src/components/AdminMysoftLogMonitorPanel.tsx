import React, { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  Terminal,
  Wrench,
  ShieldAlert,
  Copy,
  Check,
  Trash2,
  Play,
  FileCode2,
  ChevronDown,
  ChevronUp,
  Info,
  Building2,
  FileText,
  Layers,
  BookOpen,
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

export const AdminMysoftLogMonitorPanel: React.FC = () => {
  const [logs, setLogs] = useState<MysoftDiagnosticLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [stageFilter, setStageFilter] = useState<
    "ALL" | "UPSTREAM_API_ERROR" | "PRE_SEND_VALIDATION" | "AUTO_RECOVERY_RETRY" | "SEND_SUCCESS"
  >("ALL");
  const [selectedErrorCodeFilter, setSelectedErrorCodeFilter] = useState<string>("ALL");
  const [expandedLogIds, setExpandedLogIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeSubView, setActiveSubView] = useState<"logs" | "catalog">("logs");
  const [testNotice, setTestNotice] = useState<string | null>(null);

  const loadDiagnosticLogs = useCallback(async () => {
    setLoading(true);
    try {
      const merged = await fetchMysoftDiagnosticLogs(60);
      setLogs(merged);
      if (merged.length > 0) {
        setExpandedLogIds((prev) => ({
          ...prev,
          [merged[0].id]: true,
        }));
      }
    } catch {
      // Fallback handled inside fetchMysoftDiagnosticLogs
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDiagnosticLogs();
  }, [loadDiagnosticLogs]);

  const toggleExpand = (id: string) => {
    setExpandedLogIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopyLogJson = (log: MysoftDiagnosticLogEntry, solution: MysoftErrorSolutionGuide) => {
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
    navigator.clipboard.writeText(JSON.stringify(exportObj, null, 2));
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSimulateNullReferenceTest = () => {
    // 1. Simulate a raw payload missing invoiceCalculation and currencyCode conflict
    // and show how validateMysoftInvoiceOutboxPayload repairs it & logs diagnostics
    const rawBrokenPayload = {
      tenantIdentifierNumber: "37756832708",
      eDocumentType: "EFATURA",
      profile: "TICARIFATURA",
      invoiceType: "SATIS",
      docNo: "GIB2026000000042", // forbidden prefix that triggers auto-sanitization
      pkAlias: "urn:mail:defaultpk@7600924362.com.tr", // fabricated alias
      invoiceAccount: {
        vknTckn: "7600924362",
        accountName: "SEMİH YAPI OTOMOTİV LİMİTED ŞİRKETİ",
      },
      // invoiceCalculation intentionally omitted (causes .NET NullReferenceException if not guarded)
      invoiceDetail: [
        {
          productName: "Yazılım Geliştirme & Entegrasyon Hizmeti",
          qty: 1,
          unitPriceTra: 15000,
          vatRate: 20,
          currencyCode: "TRY", // line currencyCode conflict
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
        "Object reference not set to an instance of an object. -> Null-Guard Tarafından Yakalandı: Eksik 'invoiceCalculation' dip toplam nesnesi (18.000,00 TL), kalem içi 'currencyCode' çakışması ve kurgusal 'pkAlias' otomatik onarıldı.",
    });

    setLogs((prev) => [newEntry, ...prev.filter((item) => item.id !== newEntry.id)]);
    setExpandedLogIds((prev) => ({ ...prev, [newEntry.id]: true }));
    setTestNotice(
      "Null-Guard & 'Object reference' teşhis testi çalıştırıldı. Eksik alt nesneler tespit edilip çözüm önerisiyle birlikte log listesinin en üstüne eklendi.",
    );
    setTimeout(() => setTestNotice(null), 5000);
  };

  const handleSimulateMissingVknTest = () => {
    const invalidPayload = {
      tenantIdentifierNumber: "",
      eDocumentType: "EFATURA",
      profile: "TEMELFATURA",
      invoiceType: "SATIS",
      invoiceAccount: {
        vknTckn: "12345", // invalid length
        accountName: "",
      },
      invoiceDetail: [],
    };

    validateMysoftInvoiceOutboxPayload(invalidPayload, {
      requireTenantIdentifier: true,
      autoRepair: true,
    });

    void loadDiagnosticLogs();
    setTestNotice(
      "Zorunlu alan doğrulama testi çalıştırıldı (Eksik Mükellef VKN, Hatalı Alıcı VKN ve Boş Kalem listesi gönderim öncesinde engellendi).",
    );
    setTimeout(() => setTestNotice(null), 5000);
  };

  const handleClearLogs = () => {
    clearMysoftDiagnosticLogs();
    setLogs([]);
    setTestNotice("Tüm yerel Mysoft tanılama logları temizlendi.");
    setTimeout(() => setTestNotice(null), 3500);
  };

  const handleResetSampleLogs = () => {
    const seeded = resetSampleMysoftDiagnosticLogs();
    setLogs(seeded);
    if (seeded[0]) {
      setExpandedLogIds({ [seeded[0].id]: true });
    }
    setTestNotice("Örnek teknik hata ve çözüm kayıtları yeniden yüklendi.");
    setTimeout(() => setTestNotice(null), 3500);
  };

  const filteredLogs = logs.filter((entry) => {
    if (stageFilter !== "ALL" && entry.stage !== stageFilter) return false;
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

  const totalErrors = logs.filter((l) => l.stage === "UPSTREAM_API_ERROR").length;
  const totalPreSendBlocks = logs.filter((l) => l.stage === "PRE_SEND_VALIDATION").length;
  const totalAutoRetries = logs.filter((l) => l.stage === "AUTO_RECOVERY_RETRY").length;
  const totalSuccess = logs.filter((l) => l.stage === "SEND_SUCCESS").length;

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
      {/* Üst Başlık ve Hızlı Test Araçları */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold">
              <Terminal className="w-4 h-4" />
              <span>Mysoft E-Belge API Tanılama & Null-Guard İzleme Merkezi</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              Teknik Hata Dökümü ve Çözüm Önerisi Konsolu
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Mysoft .NET API katmanından dönen{" "}
              <code className="text-amber-300 font-mono">
                Object reference not set to an instance of an object
              </code>{" "}
              gibi nesne referans hatalarını, GİB Schematron/etiket uyarılarını ve gönderim öncesi
              zorunlu alan (Firma VKN, Alıcı VKN/TCKN, Kalem & Dip Toplam) kontrollerini hata koduna
              göre çözüm adımlarıyla birlikte izleyin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSimulateNullReferenceTest}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Object reference not set to an instance of an object senaryosunu simüle et ve çözüm analizini üret"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Object Reference Testi</span>
            </button>
            <button
              type="button"
              onClick={handleSimulateMissingVknTest}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-white/15 cursor-pointer"
              title="Eksik VKN/TCKN ve boş kalem doğrulama kontrolünü test et"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
              <span>Zorunlu Alan Testi</span>
            </button>
            <button
              type="button"
              onClick={() => void loadDiagnosticLogs()}
              disabled={loading}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-white/15 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Yenile</span>
            </button>
          </div>
        </div>

        {/* KPI Metrik Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800">
          <div className="bg-slate-800/70 rounded-xl p-3.5 border border-slate-700/70">
            <div className="text-[11px] text-slate-400 font-medium">
              Yakalanan Teknik API Hatası
            </div>
            <div className="text-xl font-bold text-rose-400 font-mono mt-1">{totalErrors}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              NullReference & Schematron
            </div>
          </div>

          <div className="bg-slate-800/70 rounded-xl p-3.5 border border-slate-700/70">
            <div className="text-[11px] text-slate-400 font-medium">
              Gönderim Öncesi Engellenen
            </div>
            <div className="text-xl font-bold text-amber-300 font-mono mt-1">
              {totalPreSendBlocks}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Eksik VKN / Kalem / Firma Bilgisi
            </div>
          </div>

          <div className="bg-slate-800/70 rounded-xl p-3.5 border border-slate-700/70">
            <div className="text-[11px] text-slate-400 font-medium">
              Otomatik Onarım (Auto-Retry)
            </div>
            <div className="text-xl font-bold text-sky-300 font-mono mt-1">{totalAutoRetries}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              pkAlias & Belge No Ön Ek Onarımı
            </div>
          </div>

          <div className="bg-slate-800/70 rounded-xl p-3.5 border border-slate-700/70">
            <div className="text-[11px] text-slate-400 font-medium">
              Başarılı & Doğrulanmış Gönderim
            </div>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-1">{totalSuccess}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Null-Guard Koruması Aktif
            </div>
          </div>
        </div>
      </div>

      {/* Bildirim Çubuğu */}
      {testNotice && (
        <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between text-xs text-indigo-950">
          <div className="flex items-center gap-2 font-semibold">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{testNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setTestNotice(null)}
            className="text-xs font-bold text-indigo-700 hover:underline cursor-pointer"
          >
            Kapat
          </button>
        </div>
      )}

      {/* Görünüm Seçici ve Filtre Çubuğu */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Sol: Alt Sekmeler */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveSubView("logs")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeSubView === "logs"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-indigo-600" />
              <span>Canlı Hata Logları & Çözüm Analizi ({logs.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubView("catalog")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeSubView === "catalog"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Hata Kodları & Çözüm Kütüphanesi ({MYSOFT_ERROR_SOLUTION_CATALOG.length} Kod)
              </span>
            </button>
          </div>

          {/* Sağ: Arama & Temizle */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[260px] flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Hata kodu, 'Object reference', VKN, cari ara..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <button
              type="button"
              onClick={handleResetSampleLogs}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="Referans hata kayıtlarını geri yükle"
            >
              Örnek Kayıtlar
            </button>

            {logs.length > 0 && (
              <button
                type="button"
                onClick={handleClearLogs}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Temizle</span>
              </button>
            )}
          </div>
        </div>

        {activeSubView === "logs" && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { key: "ALL", label: `Tümü (${logs.length})` },
                  {
                    key: "UPSTREAM_API_ERROR",
                    label: `.NET / API Hataları (${totalErrors})`,
                  },
                  {
                    key: "PRE_SEND_VALIDATION",
                    label: `Zorunlu Alan Engelleri (${totalPreSendBlocks})`,
                  },
                  {
                    key: "AUTO_RECOVERY_RETRY",
                    label: `Otomatik Onarım (${totalAutoRetries})`,
                  },
                  {
                    key: "SEND_SUCCESS",
                    label: `Başarılı (${totalSuccess})`,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStageFilter(tab.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    stageFilter === tab.key
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500">Hata Kodu:</span>
              <select
                value={selectedErrorCodeFilter}
                onChange={(e) => setSelectedErrorCodeFilter(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
              >
                <option value="ALL">Tüm Hata Kodları</option>
                {MYSOFT_ERROR_SOLUTION_CATALOG.map((item) => (
                  <option key={item.errorCode} value={item.errorCode}>
                    {item.errorCode} — {item.category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ALT GÖRÜNÜM 1: CANLI HATA LOGLARI VE ÇÖZÜM ÖNERİLERİ */}
      {activeSubView === "logs" ? (
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Mysoft API log kayıtları yükleniyor...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <div className="text-sm font-bold text-slate-800">
                Seçili filtreye uygun hata veya log kaydı bulunamadı
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Üstteki &ldquo;Object Reference Testi&rdquo; veya &ldquo;Örnek Kayıtlar&rdquo;
                butonuna tıklayarak teknik hata analizi ve çözüm önerisi örneklerini
                inceleyebilirsiniz.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const solution = resolveMysoftLogSolution(log);
              const stageMeta = getStageLabel(log.stage);
              const isExpanded = Boolean(expandedLogIds[log.id]);
              const ng = log.nullGuard || {
                hasInvoiceAccount: false,
                hasBuyerVknTckn: false,
                hasBuyerAccountName: false,
                hasPersonInfoIfTckn: false,
                hasInvoiceDetailArray: false,
                invoiceDetailCount: 0,
                allLinesHaveAllowanceChargeArray: false,
                hasInvoiceCalculationObject: false,
                hasTenantIdentifierNumber: false,
              };

              return (
                <div
                  key={log.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all"
                >
                  {/* Log Üst Satırı */}
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
                        <span className="text-slate-400" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-slate-600 font-medium">{solution.category}</span>
                        <span className="text-slate-400" aria-hidden="true">
                          ·
                        </span>
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
                          <strong className="text-slate-900">
                            {log.buyerName || "Ünvan Yok"}
                          </strong>
                          <span className="font-mono text-slate-600">
                            ({log.buyerVknTckn || "VKN Eksik"})
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          <span>Belge:</span>
                          <strong className="font-mono text-slate-900">
                            {log.eDocumentType || "EFATURA"} / {log.profile || "TEMEL"}
                          </strong>
                          <span>
                            ({log.lineCount} Kalem
                            {log.payableAmount !== undefined
                              ? ` · ₺${Number(log.payableAmount).toLocaleString("tr-TR", {
                                  minimumFractionDigits: 2,
                                })}`
                              : ""}
                            )
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyLogJson(log, solution);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Teknik log ve çözüm raporunu JSON olarak kopyala"
                      >
                        {copiedId === log.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Kopyalandı</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>JSON Kopyala</span>
                          </>
                        )}
                      </button>

                      <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Genişletilmiş Teknik Detay, Null-Guard Matrisi ve Çözüm Önerisi */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 bg-slate-50/60 p-4 sm:p-5 space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        {/* Sol Sütun (7 birim): Kök Neden & Adım Adım Çözüm Önerileri */}
                        <div className="lg:col-span-7 space-y-3">
                          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                              <Wrench className="w-4 h-4 text-indigo-600" />
                              <span>
                                Hata Kodu ({solution.errorCode}) Kök Neden Analizi & Çözüm Önerisi
                              </span>
                            </div>

                            <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                              <span className="font-bold text-slate-900">Teknik Kök Neden: </span>
                              {solution.rootCause}
                            </div>

                            <div className="space-y-1.5">
                              <div className="text-xs font-bold text-slate-900">
                                Uygulanacak Çözüm Adımları:
                              </div>
                              <ul className="space-y-1.5 text-xs text-slate-700">
                                {solution.solutionSteps.map((step, sIdx) => (
                                  <li
                                    key={sIdx}
                                    className="flex items-start gap-2 bg-emerald-50/50 border border-emerald-200/70 rounded-lg p-2.5 text-slate-800"
                                  >
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>{step}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="p-2.5 rounded-lg bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-950 flex items-start gap-2">
                              <FileCode2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Muavin Otomatik Koruma Durumu: </span>
                                <span>{solution.autoRemediation}</span>
                              </div>
                            </div>
                          </div>

                          {/* Varsa Doğrulama Hata / Uyarı Maddeleri */}
                          {((log.validationErrors && log.validationErrors.length > 0) ||
                            (log.validationWarnings && log.validationWarnings.length > 0)) && (
                            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                              <div className="text-xs font-bold text-slate-900">
                                Alan Bazlı Doğrulama Dökümü (Field-Level Audit)
                              </div>
                              <div className="space-y-1.5">
                                {(log.validationErrors || []).map((err, i) => (
                                  <div
                                    key={`err_${i}`}
                                    className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2"
                                  >
                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                                    <div>
                                      <span className="font-mono font-bold">[{err.field}]</span>{" "}
                                      <span>{err.message}</span>
                                    </div>
                                  </div>
                                ))}
                                {(log.validationWarnings || []).map((warn, i) => (
                                  <div
                                    key={`warn_${i}`}
                                    className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2"
                                  >
                                    <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                      <span className="font-mono font-bold">[{warn.field}]</span>{" "}
                                      <span>{warn.message}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Sağ Sütun (5 birim): Null-Guard Nesne Bütünlük Matrisi */}
                        <div className="lg:col-span-5 space-y-3">
                          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">
                                Null-Guard Nesne Kontrol Matrisi
                              </span>
                              <span className="text-[11px] font-mono text-slate-500">
                                InvoiceOutboxModel
                              </span>
                            </div>

                            <div className="divide-y divide-slate-100 text-xs">
                              {[
                                {
                                  label: "Gönderici Mükellef VKN (tenantIdentifierNumber)",
                                  ok: ng.hasTenantIdentifierNumber,
                                  detail: log.tenantIdentifierNumber || "Eksik",
                                },
                                {
                                  label: "Alıcı Cari Nesnesi (invoiceAccount)",
                                  ok: ng.hasInvoiceAccount,
                                  detail: ng.hasInvoiceAccount ? "Mevcut" : "Null / Eksik",
                                },
                                {
                                  label: "Alıcı VKN / TCKN (10 veya 11 Hane)",
                                  ok: ng.hasBuyerVknTckn,
                                  detail: log.buyerVknTckn || "Geçersiz / Boş",
                                },
                                {
                                  label: "Alıcı Unvan / Ad Soyad (accountName)",
                                  ok: ng.hasBuyerAccountName,
                                  detail: log.buyerName || "Boş",
                                },
                                {
                                  label: "TCKN Şahıs Alt Nesnesi (personInfo)",
                                  ok: ng.hasPersonInfoIfTckn,
                                  detail: ng.hasPersonInfoIfTckn ? "Doğrulandı" : "Eksik",
                                },
                                {
                                  label: "Fatura Kalem Dizisi (invoiceDetail)",
                                  ok: ng.hasInvoiceDetailArray,
                                  detail: `${ng.invoiceDetailCount} Kalem`,
                                },
                                {
                                  label: "Kalem İskonto Dizisi (allowanceCharge: [])",
                                  ok: ng.allLinesHaveAllowanceChargeArray,
                                  detail: ng.allLinesHaveAllowanceChargeArray ? "Dizi Hazır" : "Null",
                                },
                                {
                                  label: "Dip Toplam Nesnesi (invoiceCalculation)",
                                  ok: ng.hasInvoiceCalculationObject,
                                  detail: ng.hasInvoiceCalculationObject
                                    ? "Mevcut"
                                    : "Null (Object Ref Riski!)",
                                },
                              ].map((row, rIdx) => (
                                <div
                                  key={rIdx}
                                  className="py-2 flex items-center justify-between gap-2"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {row.ok ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    ) : (
                                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                    )}
                                    <span className="text-slate-700 truncate">{row.label}</span>
                                  </div>
                                  <span
                                    className={`font-mono text-[11px] font-semibold shrink-0 ${
                                      row.ok ? "text-emerald-700" : "text-rose-700"
                                    }`}
                                  >
                                    {row.detail}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
                              <span>Seri Ön Ek: {log.prefix || "Portal Varsayılanı"}</span>
                              <span>Belge No: {log.docNo || "Otomatik Atama"}</span>
                              {log.upstreamStatus && <span>HTTP: {log.upstreamStatus}</span>}
                            </div>
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
        /* ALT GÖRÜNÜM 2: HATA KODLARI & ÇÖZÜM REHBERİ KÜTÜPHANESİ */
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
                        {st}
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
      )}
    </div>
  );
};
