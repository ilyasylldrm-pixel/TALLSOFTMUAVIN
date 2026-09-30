import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Clock,
  Search,
  RefreshCw,
  Filter,
  User,
  Activity,
  Layers,
  FileText,
  Calculator,
  Key,
} from "lucide-react";
import { getSystemAuditLogs, SystemAuditLogItem } from "../services/systemSyncService";

export const AdminAuditPanel: React.FC = () => {
  const [logs, setLogs] = useState<SystemAuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getSystemAuditLogs(50);
      setLogs(data);
    } catch (e) {
      console.warn("Audit logs error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !searchTerm ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === "all" || log.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "Bordro & SGK":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">Bordro & SGK</span>;
      case "Kullanıcı & Yetki":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">Kullanıcı & Yetki</span>;
      case "Evrak & Dosya":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Evrak & Dosya</span>;
      case "Duyuru":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Duyuru</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">{category}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Başlık Kartı */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 text-white border border-slate-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Merkezi Denetim & İşlem Kayıtları</span>
          </div>
          <h2 className="text-xl font-bold mt-1">Sistem Hareket ve Güncelleme Günlüğü</h2>
          <p className="text-xs text-slate-300">
            Admin panelinde yapılan tüm değişikliklerin kim tarafından, ne zaman ve hangi detaylarla yapıldığını gösteren resmi denetim izi.
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-white/20 cursor-pointer shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Yenile</span>
        </button>
      </div>

      {/* Arama ve Filtre */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Tüm Kayıtlar ({logs.length})
          </button>
          <button
            onClick={() => setSelectedCategory("Bordro & SGK")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === "Bordro & SGK" ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Bordro & SGK
          </button>
          <button
            onClick={() => setSelectedCategory("Kullanıcı & Yetki")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === "Kullanıcı & Yetki" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Kullanıcı & Yetki
          </button>
          <button
            onClick={() => setSelectedCategory("Duyuru")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === "Duyuru" ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Duyurular
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Kayıtlarda ara..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Denetim Tablosu */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Kayıtlar yükleniyor...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Kriterlere uygun herhangi bir denetim kaydı bulunamadı.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[650px] overflow-y-auto">
            {filteredLogs.map((item, idx) => (
              <div key={item.id || idx} className="p-4 hover:bg-slate-50 transition-colors flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{item.action}</span>
                    {getCategoryBadge(item.category)}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-mono">{item.details}</p>
                </div>

                <div className="text-right shrink-0 text-xs font-mono">
                  <div className="font-bold text-slate-800">{item.performedBy}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {new Date(item.timestamp).toLocaleString("tr-TR")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
