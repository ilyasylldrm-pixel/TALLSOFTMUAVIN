import React, { useState, useEffect } from "react";
import {
  Radio,
  Send,
  Bell,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  User,
  Power,
  RefreshCw,
  Eye,
  Megaphone,
} from "lucide-react";
import {
  BroadcastAnnouncement,
  getBroadcastAnnouncements,
  publishBroadcastAnnouncement,
  deleteBroadcastAnnouncement,
  toggleBroadcastAnnouncementActive,
  subscribeToBroadcastAnnouncements,
} from "../services/systemSyncService";

interface AdminBroadcastPanelProps {
  currentUser: any;
}

export const AdminBroadcastPanel: React.FC<AdminBroadcastPanelProps> = ({ currentUser }) => {
  const [announcements, setAnnouncements] = useState<BroadcastAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<"info" | "warning" | "critical">("info");
  const [categoryTag, setCategoryTag] = useState("Bordro ve SGK");
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  useEffect(() => {
    // Real-time listener
    const unsubscribe = subscribeToBroadcastAnnouncements((list) => {
      setAnnouncements(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      await publishBroadcastAnnouncement(
        {
          title: title.trim(),
          content: content.trim(),
          priority,
          active: true,
          tags: [categoryTag, "Sistem Dağıtımı"],
        },
        currentUser?.name || currentUser?.email || "Sistem Yöneticisi"
      );

      setTitle("");
      setContent("");
      setSuccessBanner("Sistem güncellemesi başarıyla yayınlandı. Tüm aktif kullanıcılar güncellemeyi anında aldı.");
      setTimeout(() => setSuccessBanner(null), 5000);
    } catch (err: any) {
      console.error("Yayınlama hatası:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bu duyuruyu silmek istediğinizden emin misiniz?")) return;
    try {
      await deleteBroadcastAnnouncement(id);
    } catch (err) {
      console.error("Silme hatası:", err);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await toggleBroadcastAnnouncementActive(id, !currentActive);
    } catch (err) {
      console.error("Durum değiştirme hatası:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 📡 Başlık & Açıklama */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-2xl p-6 text-white border border-blue-800 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Canlı Bildirim & Senkronizasyon Dağıtımı</span>
            </div>
            <h2 className="text-xl font-bold">Sistem Güncellemeleri ve Duyuru Merkezi</h2>
            <p className="text-xs text-blue-200/90 max-w-xl">
              Yöneticiler tarafından yapılan mevzuat, SGK oranları ve sistem değişiklikleri bu merkezden
              tüm kullanıcılara canlı bildirim olarak dağıtılır.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono text-blue-300">Aktif Yayınlar:</span>
            <div className="text-2xl font-black font-mono text-emerald-400">
              {announcements.filter((a) => a.active).length}
            </div>
          </div>
        </div>
      </div>

      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-medium flex items-center gap-3 animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* ✍️ Duyuru Oluşturma ve Dağıtım Formu */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <Megaphone className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">Yeni Güncelleme / Duyuru Yayınla</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Duyuru Başlığı <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: 2026 Gelir Vergisi Dilimleri ve SGK Tavanı Revize Edildi"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Öncelik Derecesi
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="info">🔵 Bilgi (Standart Duyuru)</option>
                <option value="warning">🟡 Uyarı (Önemli Değişiklik)</option>
                <option value="critical">🔴 Kritik (Acil Mevzuat Güncellemesi)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Duyuru & Güncelleme Açıklaması <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Kullanıcıların görmesini istediğiniz güncelleme notunu yazın..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kategori Etiketi
                </label>
                <select
                  value={categoryTag}
                  onChange={(e) => setCategoryTag(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="Bordro ve SGK">⚖️ Bordro ve SGK</option>
                  <option value="Vergilendirme">📊 Vergilendirme</option>
                  <option value="Mevzuat Değişikliği">📜 Mevzuat Değişikliği</option>
                  <option value="Sistem Bakımı">🛠️ Sistem Bakımı</option>
                  <option value="Genel Duyuru">📢 Genel Duyuru</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{submitting ? "Yayınlanıyor..." : "Tüm Kullanıcılara Dağıt"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 📜 Yayındaki Duyurular Listesi */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-600" />
            <span className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              Yayınlanmış Sistem Güncellemeleri ({announcements.length})
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Gerçek Zamanlı Bulut Senkronizasyonu</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Duyurular yükleniyor...</span>
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Henüz yayınlanmış bir duyuru veya güncelleme kaydı yok.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {announcements.map((item, idx) => (
              <div
                key={item.id || `bc-${idx}`}
                className={`p-4 transition-colors flex items-start justify-between gap-4 ${
                  !item.active ? "bg-slate-50/60 opacity-60" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      item.priority === "critical"
                        ? "bg-rose-100 text-rose-700"
                        : item.priority === "warning"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {item.priority === "critical" ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : item.priority === "warning" ? (
                      <Bell className="w-4 h-4" />
                    ) : (
                      <Info className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-xs text-slate-900">{item.title}</h4>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.priority === "critical"
                            ? "bg-rose-100 text-rose-800"
                            : item.priority === "warning"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {item.priority === "critical" ? "Kritik" : item.priority === "warning" ? "Uyarı" : "Bilgi"}
                      </span>
                      {item.tags?.map((t, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{item.content}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                      <span>Yayınlayan: {item.createdBy}</span>
                      <span>•</span>
                      <span>{new Date(item.createdAt).toLocaleString("tr-TR")}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => item.id && handleToggleActive(item.id, item.active)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      item.active
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    }`}
                    title={item.active ? "Pasife Al" : "Aktife Al"}
                  >
                    {item.active ? "Aktif" : "Pasif"}
                  </button>
                  {item.id && (
                    <button
                      onClick={() => handleDelete(item.id!)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs transition-colors cursor-pointer"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
