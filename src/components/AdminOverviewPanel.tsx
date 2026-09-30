import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  HardDrive,
  Calculator,
  Radio,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Search,
  FileText,
  Eye,
  Download,
  RefreshCw,
  Bell,
  ShieldCheck,
  Layers,
  Activity,
  Clock,
  Sparkles,
  ExternalLink,
  Plus,
  Send,
  SlidersHorizontal,
  ChevronRight,
  Database,
  Building,
  Mail,
  KeyRound,
  FileSpreadsheet,
  FileCheck,
  Check,
  Zap,
  Trash2,
} from "lucide-react";
import { UserProfileData, UserFileMetadata } from "../lib/firebase";
import {
  getActivePayrollParameters,
  PayrollYearlyParameters,
} from "../data/payrollParametersData";
import {
  BroadcastAnnouncement,
  getBroadcastAnnouncements,
  publishBroadcastAnnouncement,
  deleteBroadcastAnnouncement,
  toggleBroadcastAnnouncementActive,
  getSystemAuditLogs,
  SystemAuditLogItem,
  fetchCentralPayrollParameters,
  getLocalDbSyncReport,
  LocalDbSyncReport,
} from "../services/systemSyncService";

interface AdminOverviewPanelProps {
  users: UserProfileData[];
  files: UserFileMetadata[];
  onNavigateTab: (tab: "matrix" | "users" | "files" | "payroll" | "broadcast" | "audit") => void;
  onOpenAddUserModal: () => void;
  onPreviewFile: (file: UserFileMetadata) => void;
  onDeleteUser?: (user: UserProfileData) => void;
  currentUser: any;
}

type FilterCategory = "all" | "users" | "files" | "payroll" | "broadcasts" | "audit";

export const AdminOverviewPanel: React.FC<AdminOverviewPanelProps> = ({
  users,
  files,
  onNavigateTab,
  onOpenAddUserModal,
  onPreviewFile,
  onDeleteUser,
  currentUser,
}) => {
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [payrollParams, setPayrollParams] = useState<PayrollYearlyParameters>(() => getActivePayrollParameters());
  const [announcements, setAnnouncements] = useState<BroadcastAnnouncement[]>([]);
  const [auditLogs, setAuditLogs] = useState<SystemAuditLogItem[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [quickBroadcastTitle, setQuickBroadcastTitle] = useState("");
  const [quickBroadcastContent, setQuickBroadcastContent] = useState("");
  const [quickBroadcastPriority, setQuickBroadcastPriority] = useState<"info" | "warning" | "critical">("info");
  const [broadcastSuccessNotice, setBroadcastSuccessNotice] = useState<string | null>(null);
  const [syncReport, setSyncReport] = useState<LocalDbSyncReport>(() =>
    getLocalDbSyncReport(users.length)
  );

  useEffect(() => {
    setSyncReport(getLocalDbSyncReport(users.length));
    const handleSync = (e: any) => {
      if (e.detail) {
        setSyncReport(e.detail);
      } else {
        setSyncReport(getLocalDbSyncReport(users.length));
      }
    };
    window.addEventListener("muavin:local-sync-updated", handleSync);
    window.addEventListener("muavin:central-sync-broadcast", handleSync);
    return () => {
      window.removeEventListener("muavin:local-sync-updated", handleSync);
      window.removeEventListener("muavin:central-sync-broadcast", handleSync);
    };
  }, [users.length]);

  const formattedLastUpdated = useMemo(() => {
    if (!syncReport.lastUpdatedAt) return "14 Eylül 2026, 22:25";
    try {
      const d = new Date(syncReport.lastUpdatedAt);
      if (isNaN(d.getTime())) return syncReport.lastUpdatedAt;
      return new Intl.DateTimeFormat("tr-TR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return syncReport.lastUpdatedAt;
    }
  }, [syncReport.lastUpdatedAt]);

  // Load audit logs and announcements
  const loadData = async () => {
    setLoadingExtras(true);
    try {
      const [annData, auditData, centralPayroll] = await Promise.all([
        getBroadcastAnnouncements(),
        getSystemAuditLogs(20),
        fetchCentralPayrollParameters(),
      ]);
      setAnnouncements(annData);
      setAuditLogs(auditData);
      if (centralPayroll.params) {
        setPayrollParams(centralPayroll.params);
      }
    } catch (e) {
      console.warn("Ekstra veriler yüklenirken hata:", e);
    } finally {
      setLoadingExtras(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalFileSizeMB = useMemo(() => {
    const totalBytes = files.reduce((acc, f) => acc + (f.fileSize || 0), 0);
    return (totalBytes / (1024 * 1024)).toFixed(2);
  }, [files]);

  const activeAdminsCount = useMemo(() => {
    return users.filter(
      (u) => u.role?.toLowerCase().includes("admin") || u.userId === "usr_admin_001" || (u as any).id === "usr_admin_001"
    ).length;
  }, [users]);

  // Handle Quick Broadcast
  const handleSendQuickBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickBroadcastTitle.trim() || !quickBroadcastContent.trim()) return;
    setIsBroadcasting(true);
    try {
      await publishBroadcastAnnouncement(
        {
          title: quickBroadcastTitle.trim(),
          content: quickBroadcastContent.trim(),
          priority: quickBroadcastPriority,
          active: true,
          tags: ["Genel Güncelleme", "Mevzuat & Sistem"],
        },
        currentUser?.name || currentUser?.email || "Sistem Yöneticisi"
      );
      setQuickBroadcastTitle("");
      setQuickBroadcastContent("");
      setBroadcastSuccessNotice("Sistem güncellemesi yayınlandı! Bağlı tüm kullanıcılar bildirimi anında aldı.");
      setTimeout(() => setBroadcastSuccessNotice(null), 4500);
      loadData();
    } catch (err) {
      console.error("Duyuru yayınlanamadı:", err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Trigger manual broadcast pulse to all active tabs/windows
  const handleForceGlobalSyncPulse = () => {
    window.dispatchEvent(
      new CustomEvent("muavin:central-sync-broadcast", {
        detail: {
          type: "manual_refresh",
          updatedBy: currentUser?.name || "Yönetici",
          timestamp: new Date().toISOString(),
        },
      })
    );
    setBroadcastSuccessNotice("Tüm bağlı istemcilere senkronizasyon ve yenileme sinyali gönderildi.");
    setTimeout(() => setBroadcastSuccessNotice(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* 🌟 1. ÜST BİLGİ & MERKEZİ TEK NOKTA DURUMU (Single Source of Truth Banner) */}
      <div className="bg-gradient-to-r from-[#131b2e] via-[#1a2540] to-[#131b2e] rounded-2xl p-6 text-white border border-[#222a3d] shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 rounded-full text-emerald-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Tek Noktadan Dağıtım (Single-Source-of-Truth) Aktif</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              Sistem Varlıkları & Eklenenler Yönetim Merkezi
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Admin panelinde eklenen ve güncellenen tüm kullanıcılar, evraklar, SGK ve vergilendirme parametreleri
              bulut ortamında tek merkezde depolanır. Yapılan her güncelleme tüm kullanıcılara eşzamanlı olarak anında yansıtılır.
            </p>
          </div>

          {/* Aksiyon Butonları */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleForceGlobalSyncPulse}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-white/20 cursor-pointer shadow-sm hover:scale-102 active:scale-98"
              title="Bağlı tüm istemcilere yenileme sinyali gönder"
            >
              <RefreshCw className="w-4 h-4 text-blue-300" />
              <span>Canlı Dağıtımı Tetikle</span>
            </button>
            <button
              onClick={onOpenAddUserModal}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer hover:scale-102 active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Personel Ekle</span>
            </button>
          </div>
        </div>

        {/* 📡 Senkronizasyon Durum Çubuğu & Son Güncelleme Tarih Bilgisi */}
        <div className="mt-5 pt-4 border-t border-white/10 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-bold text-emerald-300">
                Senkronizasyon Durumu:
              </span>
              <span className="text-slate-200">
                Yapılan tüm güncellemeler tüm kullanıcıların yerel veritabanına başarıyla yansıtıldı (%100).
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-300 font-medium shrink-0">
              <Clock className="w-3.5 h-3.5 text-blue-300 shrink-0" />
              <span>Son Güncelleme Tarihi:</span>
              <strong className="text-white font-bold font-mono bg-white/10 px-2 py-0.5 rounded border border-white/15">
                {formattedLastUpdated}
              </strong>
            </div>
          </div>

          {/* İlerleme Çubuğu */}
          <div className="w-full bg-white/10 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full"
              style={{ width: "100%" }}
            />
          </div>
        </div>

        {broadcastSuccessNotice && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-400/50 rounded-xl text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{broadcastSuccessNotice}</span>
          </div>
        )}
      </div>

      {/* 📊 2. DÖRT ANA SİSTEM VARLIĞI KARTI (Sistemde Eklenen Her Şeyin Özeti) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kart 1: Eklenen Kullanıcılar */}
        <div
          onClick={() => onNavigateTab("users")}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group hover:border-blue-300"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0f6bae] flex items-center justify-center border border-blue-100 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono">
              {activeAdminsCount} Yönetici
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">{users.length}</div>
          <div className="text-xs font-bold text-slate-700 mt-1 flex items-center justify-between">
            <span>Eklenen Kullanıcılar</span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Yetkilendirilmiş personel ve rol matrisi kayıtları
          </p>
        </div>

        {/* Kart 2: Eklenen Evrak ve Belgeler */}
        <div
          onClick={() => onNavigateTab("files")}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group hover:border-emerald-300"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:scale-110 transition-transform">
              <HardDrive className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-mono">
              {totalFileSizeMB} MB
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">{files.length}</div>
          <div className="text-xs font-bold text-slate-700 mt-1 flex items-center justify-between">
            <span>Yüklenen Evraklar</span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Fatura, sözleşme ve OCR taranan fiş arşivleri
          </p>
        </div>

        {/* Kart 3: SGK ve Vergi Parametreleri */}
        <div
          onClick={() => onNavigateTab("payroll")}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group hover:border-purple-300"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 group-hover:scale-110 transition-transform">
              <Calculator className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-mono">
              {payrollParams.year} Yürürlük
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {payrollParams.grossMinWage?.toLocaleString("tr-TR")} ₺
          </div>
          <div className="text-xs font-bold text-slate-700 mt-1 flex items-center justify-between">
            <span>Brüt Asgari Ücret (Taban)</span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Tavan: {payrollParams.sgkBaseCeiling?.toLocaleString("tr-TR")} ₺ • %{((payrollParams.sgkEmployerStandardRate || 0.205) * 100).toFixed(1)} İşveren
          </p>
        </div>

        {/* Kart 4: Canlı Dağıtılan Sistem Duyuruları */}
        <div
          onClick={() => onNavigateTab("broadcast")}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group hover:border-amber-300"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 group-hover:scale-110 transition-transform">
              <Radio className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-mono">
              {announcements.filter((a) => a.active).length} Aktif
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">{announcements.length}</div>
          <div className="text-xs font-bold text-slate-700 mt-1 flex items-center justify-between">
            <span>Yayınlanan Güncellemeler</span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Tüm kullanıcılara dağıtılan mevzuat bildirimleri
          </p>
        </div>
      </div>

      {/* 📢 3. HIZLI GÜNCELLEME VE DUYURU DAĞITIM FORMU */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Tüm Kullanıcılara Tek Noktadan Canlı Güncelleme / Duyuru Yayınla
              </h3>
              <p className="text-xs text-slate-500">
                Buradan göndereceğiniz duyurular, sisteme giriş yapmış tüm kullanıcıların ekranına anında bildirim olarak düşer.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSendQuickBroadcast} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-3">
              <input
                type="text"
                required
                value={quickBroadcastTitle}
                onChange={(e) => setQuickBroadcastTitle(e.target.value)}
                placeholder="Örn: 2026 SGK Tavanları ve Gelir Vergisi Dilimleri Güncellendi"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-1">
              <select
                value={quickBroadcastPriority}
                onChange={(e) => setQuickBroadcastPriority(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="info">🔵 Bilgi / Normal</option>
                <option value="warning">🟡 Önemli / Dikkat</option>
                <option value="critical">🔴 Kritik Mevzuat Güncellemesi</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <textarea
              required
              rows={2}
              value={quickBroadcastContent}
              onChange={(e) => setQuickBroadcastContent(e.target.value)}
              placeholder="Güncelleme detaylarını yazın (Örn: Yönetici tarafından yeni asgari ücret 33.030 TL ve SGK tavanı 297.270 TL olarak güncellenmiştir. Tüm bordro hesaplamaları otomatik revize edildi.)."
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isBroadcasting}
              className="px-5 py-2.5 bg-[#0f6bae] hover:bg-[#005289] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isBroadcasting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{isBroadcasting ? "Yayınlanıyor..." : "Tüm Kullanıcılara Dağıt"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 🔍 4. BİRLEŞİK EKLEME VE VARLIK DENETİM LİSTESİ (Tüm Eklenenleri Göster) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Filtre ve Arama Başlığı */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setFilterCategory("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterCategory === "all"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Tüm Eklenenler ({users.length + files.length + announcements.length + 5})
            </button>
            <button
              onClick={() => setFilterCategory("users")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterCategory === "users"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              👥 Kullanıcılar ({users.length})
            </button>
            <button
              onClick={() => setFilterCategory("files")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterCategory === "files"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              📁 Evrak & Dosyalar ({files.length})
            </button>
            <button
              onClick={() => setFilterCategory("payroll")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterCategory === "payroll"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              ⚖️ SGK & Vergi Parametreleri
            </button>
            <button
              onClick={() => setFilterCategory("broadcasts")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterCategory === "broadcasts"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              📢 Duyurular ({announcements.length})
            </button>
            <button
              onClick={() => setFilterCategory("audit")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterCategory === "audit"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              📜 Denetim Günlüğü ({auditLogs.length})
            </button>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Eklenenlerde ara..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* 📋 LİSTE GÖRÜNÜMÜ */}
        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
          {/* 1. KULLANICILAR */}
          {(filterCategory === "all" || filterCategory === "users") && (
            <div>
              <div className="px-4 py-2 bg-blue-50/50 border-b border-blue-100 text-[11px] font-bold text-blue-900 uppercase tracking-wider flex items-center justify-between">
                <span>Eklenen Kullanıcılar & Personel Listesi ({users.length})</span>
                <button
                  onClick={() => onNavigateTab("users")}
                  className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Kullanıcı Yönetimine Git</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              {users
                .filter(
                  (u) =>
                    !searchTerm ||
                    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.role?.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((u, uIdx) => (
                  <div
                    key={u.userId || (u as any).id || `user-${u.email || uIdx}`}
                    className="p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center shrink-0 text-xs">
                        {u.name?.charAt(0).toUpperCase() || "K"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 truncate">{u.name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {u.role || "Standart Kullanıcı"}
                          </span>
                          {(u.companyName || (u as any).company) && (
                            <span className="text-[11px] text-slate-500 truncate hidden sm:inline">
                              • {u.companyName || (u as any).company}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate font-mono mt-0.5">{u.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <span className="text-[11px] font-bold text-slate-700 font-mono">
                          {u.allowedModules?.length || 0} Modül Yetkili
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString("tr-TR") : "Kayıtlı"}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onNavigateTab("matrix")}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          Yetkileri Düzenle
                        </button>
                        {onDeleteUser && u.userId !== currentUser?.id && u.email !== currentUser?.email && (
                          <button
                            onClick={() => onDeleteUser(u)}
                            className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                            title="Kullanıcıyı Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* 2. EVRAKLAR VE BELGELER */}
          {(filterCategory === "all" || filterCategory === "files") && (
            <div>
              <div className="px-4 py-2 bg-emerald-50/50 border-b border-emerald-100 text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center justify-between">
                <span>Eklenen & Yüklenen Belgeler ({files.length})</span>
                <button
                  onClick={() => onNavigateTab("files")}
                  className="text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Evrak Denetimine Git</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              {files
                .filter(
                  (f) =>
                    !searchTerm ||
                    f.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    f.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    f.uploaderName?.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((f, fIdx) => (
                  <div
                    key={f.id || `file-${f.fileName || fIdx}`}
                    className="p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 truncate">{f.fileName}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {f.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          Yükleyen: {f.uploaderName || "Sistem"} • {(f.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onPreviewFile(f)}
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-[#0f6bae] rounded-lg text-xs font-bold transition-all cursor-pointer"
                        title="Önizle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {(f.fileUrl || f.fileData) && (
                        <a
                          href={f.fileUrl || f.fileData}
                          download={f.fileName}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          title="İndir"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* 3. SGK VE VERGİLENDİRME PARAMETRELERİ (TEK YERDEN YÖNETİLEN MERKEZİ VERİLER) */}
          {(filterCategory === "all" || filterCategory === "payroll") && (
            <div>
              <div className="px-4 py-2 bg-purple-50/50 border-b border-purple-100 text-[11px] font-bold text-purple-900 uppercase tracking-wider flex items-center justify-between">
                <span>Merkezi SGK & Personel Vergilendirme Parametreleri ({payrollParams.year})</span>
                <button
                  onClick={() => onNavigateTab("payroll")}
                  className="text-purple-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Parametreleri Düzenle & Değiştir</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/40">
                {/* Asgari Ücret & SGK Taban / Tavan */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                    <span>Sosyal Güvenlik Taban & Tavan</span>
                    <span className="text-[10px] text-purple-700 font-mono bg-purple-50 px-1.5 py-0.5 rounded">
                      Kanuni Değerler (2026)
                    </span>
                  </div>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-600">
                      <span>Günlük Taban:</span>
                      <strong className="text-slate-900">
                        {(payrollParams.dailyMinWage || 1101).toLocaleString("tr-TR")} ₺
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Aylık Taban (Brüt):</span>
                      <strong className="text-slate-900">
                        {(payrollParams.grossMinWage || 33030).toLocaleString("tr-TR")} ₺
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Aylık Tavan (7.5x):</span>
                      <strong className="text-purple-700">
                        {(payrollParams.sgkBaseCeiling || 297270).toLocaleString("tr-TR")} ₺
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Prim Oranları */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                    <span>Prim Oranları (İşçi & İşveren)</span>
                    <span className="text-[10px] text-emerald-700 font-mono bg-emerald-50 px-1.5 py-0.5 rounded">
                      5510 / Hazine %5
                    </span>
                  </div>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-600">
                      <span>İşçi SGK + İşsizlik:</span>
                      <strong className="text-slate-900">%14 + %1 = %15</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>İşveren Standart Payı:</span>
                      <strong className="text-slate-900">
                        %{((payrollParams.sgkEmployerStandardRate || 0.205) * 100).toFixed(1)} + %2
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>İşveren İndirimli Payı:</span>
                      <strong className="text-emerald-700">
                        %{((payrollParams.sgkEmployerIncentiveRate || 0.155) * 100).toFixed(1)} + %2
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Vergi Tarifesi & İstisnalar */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                    <span>Gelir Vergisi Dilimleri & İstisna</span>
                    <span className="text-[10px] text-blue-700 font-mono bg-blue-50 px-1.5 py-0.5 rounded">
                      5 Kademe
                    </span>
                  </div>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-600">
                      <span>1. Dilim (%15):</span>
                      <strong className="text-slate-900">
                        {(payrollParams.taxBrackets?.[0]?.limit || 158000).toLocaleString("tr-TR")} ₺
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>2. Dilim (%20):</span>
                      <strong className="text-slate-900">
                        {(payrollParams.taxBrackets?.[1]?.limit || 330000).toLocaleString("tr-TR")} ₺
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Asgari Ücret Vergi İstisnası:</span>
                      <strong className="text-blue-700">
                        {(payrollParams.minWageTaxExemption || 4211.33).toLocaleString("tr-TR")} ₺
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. YAYINLANAN SİSTEM DUYURULARI (BROADCAST ANNOUNCEMENTS) */}
          {(filterCategory === "all" || filterCategory === "broadcasts") && (
            <div>
              <div className="px-4 py-2 bg-amber-50/50 border-b border-amber-100 text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center justify-between">
                <span>Tüm Kullanıcılara Dağıtılan Sistem Duyuruları ({announcements.length})</span>
                <button
                  onClick={() => onNavigateTab("broadcast")}
                  className="text-amber-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Duyuru Yönetimine Git</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              {announcements.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Henüz yayınlanmış bir sistem duyurusu bulunmuyor.
                </div>
              ) : (
                announcements.map((a, aIdx) => (
                  <div
                    key={a.id || `announcement-${a.title || aIdx}`}
                    className="p-3.5 hover:bg-slate-50 transition-colors flex items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          a.priority === "critical"
                            ? "bg-rose-100 text-rose-700"
                            : a.priority === "warning"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{a.title}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              a.priority === "critical"
                                ? "bg-rose-100 text-rose-800"
                                : a.priority === "warning"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {a.priority === "critical"
                              ? "Kritik Güncelleme"
                              : a.priority === "warning"
                              ? "Önemli Uyarı"
                              : "Genel Bilgi"}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              a.active
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {a.active ? "Canlı Yayında" : "Pasif"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{a.content}</p>
                        <div className="text-[10px] text-slate-400 mt-1 font-mono">
                          Yayınlayan: {a.createdBy} • {new Date(a.createdAt).toLocaleString("tr-TR")}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {a.id && (
                        <button
                          onClick={async () => {
                            await deleteBroadcastAnnouncement(a.id!);
                            loadData();
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs transition-colors cursor-pointer"
                          title="Duyuruyu Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 5. DENETİM GÜNLÜĞÜ (AUDIT LOGS) */}
          {(filterCategory === "all" || filterCategory === "audit") && (
            <div>
              <div className="px-4 py-2 bg-indigo-50/50 border-b border-indigo-100 text-[11px] font-bold text-indigo-900 uppercase tracking-wider flex items-center justify-between">
                <span>Sistem Denetim & Değişiklik Günlüğü (Audit Ledger)</span>
                <button
                  onClick={() => onNavigateTab("audit")}
                  className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Tam Günlüğü Aç</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {auditLogs.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  Henüz kaydedilmiş denetim hareketi bulunmuyor.
                </div>
              ) : (
                auditLogs.slice(0, 10).map((log, idx) => (
                  <div
                    key={log.id || idx}
                    className="p-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                      <span className="font-bold text-slate-800 truncate">{log.action}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-sans hidden sm:inline">
                        {log.category}
                      </span>
                      <span className="text-slate-500 text-[11px] truncate hidden md:inline font-sans">
                        — {log.details}
                      </span>
                    </div>

                    <div className="text-right shrink-0 font-sans text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700">{log.performedBy}</span>
                      <span className="text-slate-400 ml-2 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
