import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  PlugZap,
  RefreshCw,
  ShieldCheck,
  Store,
  Trash2,
  Zap,
} from "lucide-react";
import { auth } from "../../lib/firebase";
import type { CompanySettings } from "../../types";
import { ModuleEntranceHeader } from "../common/ModuleEntranceHeader";

/**
 * Trendyol entegrasyon ekranı: firma kendi Trendyol API bilgilerini girer,
 * siparişleri görür, tek tıkla veya otomatik olarak e-Fatura / e-Arşiv keser.
 * API Secret sunucuda şifreli saklanır; tarayıcıya geri dönmez.
 */

interface ConnectionView {
  connected: boolean;
  secretReadable?: boolean;
  hasSecretKey?: boolean;
  secretKeyMasked?: string;
  sellerId?: string;
  apiKeyMasked?: string;
  environment?: "prod" | "stage";
  autoInvoice?: boolean;
  invoiceStatuses?: string[];
  startFrom?: number;
  uploadInvoiceToTrendyol?: boolean;
  markPackageInvoiced?: boolean;
  fallbackVatRate?: number | null;
  tenantIdentifierNumber?: string;
  lastSyncAt?: string | null;
  lastSyncSummary?: string;
  lastError?: string;
  mysoftMockMode?: boolean;
}

interface LedgerEntry {
  state: "sending" | "invoiced" | "delivered" | "needs_review" | "error";
  docNo?: string;
  message?: string;
  eDocumentType?: "EFATURA" | "EARSIVFATURA";
}

interface PackageRow {
  packageId: string;
  orderNumber: string;
  status: string;
  orderDate?: number;
  buyerName: string;
  buyerKind: "individual" | "corporate";
  amount: number | null;
  hasTrendyolInvoice: boolean;
  blockingIssues: string[];
  warnings: string[];
  ledger: LedgerEntry | null;
}

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "Created", label: "Yeni (Created)" },
  { value: "Picking", label: "Hazırlanıyor" },
  { value: "Invoiced", label: "Faturalandı" },
  { value: "Shipped", label: "Kargoda" },
  { value: "Delivered", label: "Teslim Edildi" },
];

const STATUS_TR: Record<string, string> = {
  Created: "Yeni",
  Picking: "Hazırlanıyor",
  Invoiced: "Faturalandı",
  Shipped: "Kargoda",
  Delivered: "Teslim edildi",
  Cancelled: "İptal",
  UnDelivered: "Teslim edilemedi",
  Returned: "İade",
  AtCollectionPoint: "Teslim noktasında",
};

async function apiHeaders(companyId: string): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json", "x-company-id": companyId };
  try {
    let user = auth.currentUser;
    if (!user && typeof auth.authStateReady === "function") {
      await auth.authStateReady();
      user = auth.currentUser;
    }
    if (user) {
      headers.Authorization = `Bearer ${await user.getIdToken()}`;
      return headers;
    }
  } catch {
    /* yerel oturuma düş */
  }
  try {
    const raw = window.localStorage.getItem("muavin_active_user") || window.sessionStorage.getItem("muavin_active_user");
    const parsed = raw ? JSON.parse(raw) : null;
    const uid = String(parsed?.id || parsed?.userId || parsed?.companyId || companyId).trim();
    headers.Authorization = `Bearer ${uid}`;
    headers["x-user-id"] = uid;
    if (parsed?.email) headers["x-user-email"] = String(parsed.email);
  } catch {
    headers["x-user-id"] = companyId;
  }
  return headers;
}

async function api<T>(companyId: string, path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const url = `/api/marketplace/trendyol${path}${path.includes("?") ? "&" : "?"}companyId=${encodeURIComponent(companyId)}`;
  const response = await fetch(url, {
    method: init.method || "GET",
    headers: await apiHeaders(companyId),
    body: init.body === undefined ? undefined : JSON.stringify({ companyId, ...(init.body as object) }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((data as { error?: string }).error || `İstek başarısız (${response.status})`);
  return data as T;
}

const money = (value: number | null) =>
  value === null ? "—" : value.toLocaleString("tr-TR", { style: "currency", currency: "TRY" });

const inputCls =
  "w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0f6bae]/30 focus:border-[#0f6bae]";

export const TrendyolIntegration: React.FC<{ companyId: string; companySettings: CompanySettings }> = ({
  companyId,
  companySettings,
}) => {
  const [conn, setConn] = useState<ConnectionView | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const [sellerId, setSellerId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [trendyolSecretKey, setTrendyolSecretKey] = useState("");
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [environment, setEnvironment] = useState<"prod" | "stage">("prod");
  const [autoInvoice, setAutoInvoice] = useState(false);
  const [statuses, setStatuses] = useState<string[]>(["Picking", "Invoiced", "Shipped", "Delivered"]);
  const [uploadToTrendyol, setUploadToTrendyol] = useState(true);
  const [markInvoiced, setMarkInvoiced] = useState(false);
  const [fallbackVat, setFallbackVat] = useState<string>("");
  const [tenantVkn, setTenantVkn] = useState("");

  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [days, setDays] = useState(7);
  const [listLoading, setListLoading] = useState(false);
  const [busyPackage, setBusyPackage] = useState<string | null>(null);
  const [confirmPackage, setConfirmPackage] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const generateTrendyolSecretKey = () => {
    const bytes = new Uint8Array(24);
    window.crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    setTrendyolSecretKey(hex);
    setShowSecretKey(true);
  };

  const applyView = (view: ConnectionView) => {
    setConn(view);
    if (view.connected) {
      setSellerId(view.sellerId || "");
      setEnvironment(view.environment || "prod");
      setAutoInvoice(Boolean(view.autoInvoice));
      setStatuses(view.invoiceStatuses?.length ? view.invoiceStatuses : statuses);
      setUploadToTrendyol(view.uploadInvoiceToTrendyol !== false);
      setMarkInvoiced(Boolean(view.markPackageInvoiced));
      setFallbackVat(view.fallbackVatRate === null || view.fallbackVatRate === undefined ? "" : String(view.fallbackVatRate));
      setTenantVkn(view.tenantIdentifierNumber || "");
    }
  };

  const loadConnection = useCallback(async () => {
    setLoading(true);
    try {
      applyView(await api<ConnectionView>(companyId, "/connection"));
    } catch (error) {
      setNotice({ tone: "err", text: (error as Error).message });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const loadPackages = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await api<{ packages: PackageRow[] }>(companyId, `/packages?days=${days}`);
      setPackages(res.packages.sort((a, b) => (b.orderDate || 0) - (a.orderDate || 0)));
    } catch (error) {
      setNotice({ tone: "err", text: (error as Error).message });
    } finally {
      setListLoading(false);
    }
  }, [companyId, days]);

  useEffect(() => {
    loadConnection();
  }, [loadConnection]);

  useEffect(() => {
    if (conn?.connected) loadPackages();
  }, [conn?.connected, loadPackages]);

  const save = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const view = await api<ConnectionView>(companyId, "/connection", {
        method: "PUT",
        body: {
          sellerId,
          apiKey: apiKey || undefined,
          apiSecret: apiSecret || undefined,
          trendyolSecretKey: trendyolSecretKey.trim() || undefined,
          environment,
          autoInvoice,
          invoiceStatuses: statuses,
          uploadInvoiceToTrendyol: uploadToTrendyol,
          markPackageInvoiced: markInvoiced,
          fallbackVatRate: fallbackVat === "" ? null : Number(fallbackVat),
          tenantIdentifierNumber: tenantVkn,
          companySettings,
        },
      });
      applyView(view);
      setApiKey("");
      setApiSecret("");
      setTrendyolSecretKey("");
      setNotice({ tone: "ok", text: "Trendyol bağlantısı doğrulandı ve kaydedildi." });
    } catch (error) {
      setNotice({ tone: "err", text: (error as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setConfirmRemove(false);
    try {
      await api(companyId, "/connection", { method: "DELETE" });
      setConn({ connected: false });
      setPackages([]);
      setSellerId("");
      setTrendyolSecretKey("");
      setNotice({ tone: "ok", text: "Bağlantı silindi." });
    } catch (error) {
      setNotice({ tone: "err", text: (error as Error).message });
    }
  };

  const invoice = async (row: PackageRow, force = false) => {
    setBusyPackage(row.packageId);
    setConfirmPackage(null);
    try {
      const res = await api<{ state: string; message: string }>(companyId, `/packages/${row.packageId}/invoice`, {
        method: "POST",
        body: { force },
      });
      setNotice({ tone: res.state === "delivered" || res.state === "invoiced" ? "ok" : "err", text: `${row.orderNumber}: ${res.message}` });
      await loadPackages();
    } catch (error) {
      setNotice({ tone: "err", text: `${row.orderNumber}: ${(error as Error).message}` });
    } finally {
      setBusyPackage(null);
    }
  };

  const runSync = async () => {
    setSyncing(true);
    try {
      const res = await api<{ summary: string }>(companyId, "/sync", { method: "POST", body: { days } });
      setNotice({ tone: "ok", text: res.summary });
      await Promise.all([loadPackages(), loadConnection()]);
    } catch (error) {
      setNotice({ tone: "err", text: (error as Error).message });
    } finally {
      setSyncing(false);
    }
  };

  const stats = useMemo(() => {
    const done = packages.filter((p) => p.ledger?.state === "delivered" || p.hasTrendyolInvoice).length;
    const review = packages.filter((p) => p.ledger?.state === "needs_review" || p.blockingIssues.length > 0).length;
    return [
      { label: "Bağlantı", value: conn?.connected ? "Aktif" : "Yok", tone: conn?.connected ? ("success" as const) : ("warning" as const) },
      { label: "Otomatik fatura", value: conn?.autoInvoice ? "Açık" : "Kapalı", tone: conn?.autoInvoice ? ("success" as const) : ("default" as const) },
      { label: "Faturalı paket", value: done },
      { label: "İnceleme", value: review, tone: review ? ("warning" as const) : ("default" as const) },
    ];
  }, [packages, conn]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-xs text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" /> Trendyol bağlantısı yükleniyor…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ModuleEntranceHeader
        badge="Pazaryeri"
        badgeIcon={<Store className="w-2.5 h-2.5 text-[#0f6bae]" />}
        title="Trendyol Entegrasyonu"
        description="Trendyol siparişlerini çekin; e-Fatura / e-Arşiv faturayı Mysoft üzerinden otomatik kesip Trendyol paketine yükleyin."
        stats={stats}
      />

      {notice && (
        <div
          className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-xs ${
            notice.tone === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {notice.tone === "ok" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{notice.text}</span>
        </div>
      )}

      {conn?.mysoftMockMode && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            Sunucuda Mysoft erişim anahtarı tanımlı değil (demo mod). Siparişleri görebilirsiniz ama gerçek fatura kesilmez.
          </span>
        </div>
      )}
      {conn?.connected && conn.secretReadable === false && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Kayıtlı API bilgileri çözülemedi (sunucu şifreleme anahtarı değişmiş). API Key ve Secret'ı yeniden girin.</span>
        </div>
      )}

      {/* ---- Bağlantı ayarları ---- */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#0f6bae]" /> API Bilgileri
          </h3>
          <span className="text-[11px] text-slate-500">
            Trendyol Satıcı Paneli → Hesap Bilgilerim → Entegrasyon Bilgileri (yalnız ana kullanıcı görür)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-600">Satıcı ID (Cari ID)</span>
            <input className={inputCls} value={sellerId} onChange={(e) => setSellerId(e.target.value.replace(/\D/g, ""))} inputMode="numeric" />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-600">API Key</span>
            <input
              className={inputCls}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={conn?.connected ? `Kayıtlı: ${conn.apiKeyMasked}` : ""}
              autoComplete="off"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-600">API Secret</span>
            <input
              className={inputCls}
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder={conn?.connected ? "Değiştirmek için yeni değeri girin" : ""}
              autoComplete="new-password"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-600">Ortam</span>
            <select className={inputCls} value={environment} onChange={(e) => setEnvironment(e.target.value as "prod" | "stage")}>
              <option value="prod">Canlı (prod)</option>
              <option value="stage">Test (stage — IP izni gerekir)</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-600">Faturayı kesen firma VKN/TCKN (Mysoft)</span>
            <input
              className={inputCls}
              value={tenantVkn}
              onChange={(e) => setTenantVkn(e.target.value.replace(/\D/g, ""))}
              placeholder={companySettings?.taxNumber || "Firma ayarlarındaki VKN kullanılır"}
              inputMode="numeric"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-600">KDV oranı gelmezse</span>
            <select className={inputCls} value={fallbackVat} onChange={(e) => setFallbackVat(e.target.value)}>
              <option value="">Kesme, incelemeye al</option>
              <option value="20">%20</option>
              <option value="10">%10</option>
              <option value="1">%1</option>
              <option value="0">%0</option>
            </select>
          </label>
          <div className="space-y-1 md:col-span-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0f6bae]" />
                TRENDYOL_SECRET_KEY (AES-256 Şifreleme Anahtarı)
              </span>
              <button
                type="button"
                onClick={generateTrendyolSecretKey}
                className="text-[11px] font-bold text-[#0f6bae] hover:underline"
              >
                Otomatik Üret (48 Karakter)
              </button>
            </div>
            <div className="relative">
              <input
                className={`${inputCls} pr-9 font-mono`}
                type={showSecretKey ? "text" : "password"}
                value={trendyolSecretKey}
                onChange={(e) => setTrendyolSecretKey(e.target.value)}
                placeholder={
                  conn?.secretKeyMasked
                    ? `Kayıtlı: ${conn.secretKeyMasked} (Değiştirmek için yeni değer girin)`
                    : "Yeni Mağaza & API Bağlantısı Ekle bölümünden veya buradan girin (en az 32 karakter önerilir)"
                }
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowSecretKey((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showSecretKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-slate-600">Hangi durumdaki siparişler faturalansın?</span>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => {
              const active = statuses.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setStatuses((prev) => (active ? prev.filter((s) => s !== opt.value) : [...prev, opt.value]))
                  }
                  className={`px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-colors ${
                    active ? "bg-[#0f6bae] border-[#0f6bae] text-white" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          {statuses.includes("Created") && (
            <p className="text-[11px] text-amber-700">
              "Yeni" siparişleri faturalamak, müşteri iptal ederse fatura iptali gerektirebilir.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 text-xs text-slate-700">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={autoInvoice} onChange={(e) => setAutoInvoice(e.target.checked)} />
            Otomatik fatura kes (sunucu belirli aralıklarla yeni siparişleri faturalar)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={uploadToTrendyol} onChange={(e) => setUploadToTrendyol(e.target.checked)} />
            Fatura PDF'ini Trendyol siparişine yükle (müşteri faturasını Trendyol'da görür)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={markInvoiced} onChange={(e) => setMarkInvoiced(e.target.checked)} />
            "Hazırlanıyor" paketlerin durumunu fatura numarasıyla "Faturalandı" yap
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={save}
            disabled={saving || !sellerId || (!conn?.connected && (!apiKey || !apiSecret))}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0f6bae] text-white flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlugZap className="w-4 h-4" />}
            {conn?.connected ? "Kaydet" : "Bağlan ve Test Et"}
          </button>
          {conn?.connected && (
            confirmRemove ? (
              <span className="inline-flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={remove}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700"
                >
                  Silmeyi Onayla
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRemove(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 bg-white"
                >
                  Vazgeç
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmRemove(true)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-rose-200 text-rose-700 bg-white flex items-center gap-2 hover:bg-rose-50"
              >
                <Trash2 className="w-4 h-4" /> Bağlantıyı Sil
              </button>
            )
          )}
          {conn?.lastSyncAt && (
            <span className="text-[11px] text-slate-500">
              Son tur: {new Date(conn.lastSyncAt).toLocaleString("tr-TR")} — {conn.lastError || conn.lastSyncSummary}
            </span>
          )}
        </div>
      </section>

      {/* ---- Paketler ---- */}
      {conn?.connected && (
        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Trendyol Siparişleri</h3>
            <div className="flex flex-wrap items-center gap-2">
              <select className={`${inputCls} w-auto`} value={days} onChange={(e) => setDays(Number(e.target.value))}>
                <option value={3}>Son 3 gün</option>
                <option value={7}>Son 7 gün</option>
                <option value={14}>Son 14 gün</option>
                <option value={30}>Son 30 gün</option>
              </select>
              <button
                type="button"
                onClick={loadPackages}
                disabled={listLoading}
                className="px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 bg-white flex items-center gap-1.5 hover:bg-slate-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${listLoading ? "animate-spin" : ""}`} /> Yenile
              </button>
              <button
                type="button"
                onClick={runSync}
                disabled={syncing || conn.mysoftMockMode}
                className="px-3 py-2 rounded-lg text-xs font-bold bg-orange-500 text-white flex items-center gap-1.5 disabled:opacity-50"
                title="Seçili durumdaki faturasız siparişlerin hepsini şimdi faturala"
              >
                {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />} Bekleyenleri Faturala
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase">
                <tr>
                  <th className="text-left px-4 py-2">Sipariş</th>
                  <th className="text-left px-4 py-2">Tarih</th>
                  <th className="text-left px-4 py-2">Alıcı</th>
                  <th className="text-right px-4 py-2">Tutar</th>
                  <th className="text-left px-4 py-2">Trendyol</th>
                  <th className="text-left px-4 py-2">Fatura</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {packages.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      {listLoading ? "Yükleniyor…" : "Bu aralıkta sipariş yok."}
                    </td>
                  </tr>
                )}
                {packages.map((row) => {
                  const state = row.ledger?.state;
                  const done = state === "delivered" || row.hasTrendyolInvoice;
                  const blocked = row.blockingIssues.length > 0;
                  return (
                    <tr key={row.packageId} className="border-t border-slate-100 align-top">
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-slate-800">{row.orderNumber}</div>
                        <div className="text-[10px] text-slate-400">Paket {row.packageId}</div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {row.orderDate ? new Date(row.orderDate).toLocaleDateString("tr-TR") : "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="text-slate-800">{row.buyerName || "—"}</div>
                        <div className="text-[10px] text-slate-400">{row.buyerKind === "corporate" ? "Kurumsal" : "Bireysel"}</div>
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{money(row.amount)}</td>
                      <td className="px-4 py-2.5 text-slate-600">{STATUS_TR[row.status] || row.status}</td>
                      <td className="px-4 py-2.5 max-w-[280px]">
                        {done ? (
                          <span className="text-emerald-700 font-semibold">
                            ✓ {row.ledger?.docNo || "Faturalı"}
                            {row.ledger?.eDocumentType && (
                              <span className="ml-1 text-[10px] text-slate-500">
                                {row.ledger.eDocumentType === "EFATURA" ? "e-Fatura" : "e-Arşiv"}
                              </span>
                            )}
                          </span>
                        ) : state === "invoiced" ? (
                          <span className="text-sky-700">{row.ledger?.docNo} — Trendyol'a yükleme bekliyor</span>
                        ) : state === "needs_review" || blocked ? (
                          <span className="text-amber-700">{row.ledger?.message || row.blockingIssues.join(" ")}</span>
                        ) : state === "error" ? (
                          <span className="text-rose-700">{row.ledger?.message}</span>
                        ) : (
                          <span className="text-slate-400">Kesilmedi</span>
                        )}
                        {row.warnings.length > 0 && !done && (
                          <div className="text-[10px] text-slate-400 mt-0.5">{row.warnings.join(" ")}</div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        {!done && (
                          busyPackage === row.packageId ? (
                            <Loader2 className="w-4 h-4 animate-spin inline text-[#0f6bae]" />
                          ) : confirmPackage === row.packageId ? (
                            <span className="inline-flex gap-1">
                              <button
                                type="button"
                                onClick={() => invoice(row, state === "needs_review")}
                                className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-[#0f6bae] text-white"
                              >
                                Onayla, kes
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmPackage(null)}
                                className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-slate-200"
                              >
                                Vazgeç
                              </button>
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={(blocked && state !== "needs_review") || conn.mysoftMockMode}
                              onClick={() => setConfirmPackage(row.packageId)}
                              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-[#0f6bae] text-[#0f6bae] hover:bg-sky-50 disabled:opacity-40"
                            >
                              {state === "needs_review" ? "Tekrar Dene" : state === "invoiced" ? "Yüklemeyi Dene" : "Fatura Kes"}
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default TrendyolIntegration;
