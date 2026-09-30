import React, { useState } from "react";
import {
  Wrench,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building,
  FileText,
  Search,
  Filter,
  X,
  ShieldCheck,
} from "lucide-react";
import { FixedAsset, AssetMaintenanceRecord } from "../../types";
import { formatTRY } from "../../data/fixedAssetsData";
import { useTheme } from "../../context/ThemeContext";

interface AssetMaintenanceTabProps {
  assets: FixedAsset[];
  maintenances: AssetMaintenanceRecord[];
  onAddMaintenance: (record: Omit<AssetMaintenanceRecord, "id" | "createdAt">) => void;
}

export const AssetMaintenanceTab: React.FC<AssetMaintenanceTabProps> = ({
  assets,
  maintenances,
  onAddMaintenance,
}) => {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Maintenance Form State
  const [selectedAssetId, setSelectedAssetId] = useState<string>(assets[0]?.id || "");
  const [maintenanceType, setMaintenanceType] = useState<
    "periodic" | "repair" | "inspection" | "calibration" | "insurance"
  >("periodic");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [cost, setCost] = useState<number>(0);
  const [isCapitalized, setIsCapitalized] = useState(false);
  const [serviceProvider, setServiceProvider] = useState("");
  const [performedBy, setPerformedBy] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [nextScheduledDate, setNextScheduledDate] = useState("");
  const [notes, setNotes] = useState("");

  const filtered = maintenances.filter((m) => {
    const matchesSearch =
      m.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.assetCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.serviceProvider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || m.maintenanceType === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalCost = maintenances.reduce((sum, m) => sum + (m.cost || 0), 0);
  const capitalizedCost = maintenances
    .filter((m) => m.isCapitalized)
    .reduce((sum, m) => sum + (m.cost || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const asset = assets.find((a) => a.id === selectedAssetId);
    if (!asset || !title.trim()) return;

    onAddMaintenance({
      assetId: asset.id,
      assetName: asset.name,
      assetCode: asset.code,
      maintenanceType,
      title: title.trim(),
      date,
      cost: Number(cost) || 0,
      isCapitalized,
      serviceProvider: serviceProvider.trim() || "Yetkili Servis",
      performedBy: performedBy.trim(),
      invoiceNo: invoiceNo.trim(),
      nextScheduledDate: nextScheduledDate || undefined,
      notes: notes.trim(),
    });

    setIsModalOpen(false);
    setTitle("");
    setCost(0);
    setServiceProvider("");
    setPerformedBy("");
    setNotes("");
  };

  return (
    <div className="space-y-4">
      {/* 1. Header & Summary Bar */}
      <div
        className="p-4 rounded-2xl border shadow-2xs flex flex-wrap items-center justify-between gap-3 transition-colors"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
      >
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Demirbaş adı, işlem başlığı veya servis ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition-all font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs py-2 px-3 focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
          >
            <option value="all">Tüm Bakım Türleri ({maintenances.length})</option>
            <option value="periodic">Periyodik Bakım</option>
            <option value="repair">Arıza & Onarım</option>
            <option value="inspection">Muayene & Kontrol</option>
            <option value="calibration">Kalibrasyon</option>
            <option value="insurance">Sigorta & Kasko</option>
          </select>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-[0.98]"
            style={{ backgroundColor: theme.primaryColor }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yeni Bakım Kaydı</span>
          </button>
        </div>
      </div>

      {/* 2. Mini KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div
          className="p-3.5 rounded-xl border shadow-2xs transition-colors"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Toplam Servis Sayısı</span>
          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5 block font-mono">
            {maintenances.length} Kayıt
          </span>
        </div>

        <div
          className="p-3.5 rounded-xl border shadow-2xs transition-colors"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Toplam Servis Harcaması</span>
          <span className="font-bold text-slate-900 dark:text-slate-100 font-mono text-sm mt-0.5 block tabular-nums">
            {formatTRY(totalCost)}
          </span>
        </div>

        <div
          className="p-3.5 rounded-xl border shadow-2xs transition-colors"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Aktifleştirilen Maliyet (VUK)</span>
          <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono text-sm mt-0.5 block tabular-nums">
            {formatTRY(capitalizedCost)}
          </span>
        </div>

        <div
          className="p-3.5 rounded-xl border shadow-2xs transition-colors"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Dönem Gideri Yazılan</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm mt-0.5 block tabular-nums">
            {formatTRY(totalCost - capitalizedCost)}
          </span>
        </div>
      </div>

      {/* 3. Maintenance Records Table */}
      <div
        className="rounded-2xl border shadow-2xs overflow-hidden transition-colors"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
      >
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs data-grid">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10.5px]">
                <th className="py-3 px-4">Tarih</th>
                <th className="py-3 px-4">İlgili Demirbaş</th>
                <th className="py-3 px-4">İşlem / Servis Başlığı</th>
                <th className="py-3 px-3">Tür</th>
                <th className="py-3 px-4">Servis Sağlayıcı</th>
                <th className="py-3 px-4 text-right">Tutar (TL)</th>
                <th className="py-3 px-3 text-center">Maliyet Türü</th>
                <th className="py-3 px-4">Gelecek Bakım</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition-colors text-slate-900 dark:text-slate-100"
                >
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                    {item.date}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-mono text-slate-500 text-[11px]">{item.assetCode}</div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">{item.assetName}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</div>
                    {item.notes && (
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{item.notes}</div>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                      {item.maintenanceType === "periodic"
                        ? "Periyodik Bakım"
                        : item.maintenanceType === "repair"
                        ? "Onarım"
                        : item.maintenanceType === "inspection"
                        ? "Muayene"
                        : item.maintenanceType === "calibration"
                        ? "Kalibrasyon"
                        : "Sigorta"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                    {item.serviceProvider}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                    {formatTRY(item.cost)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {item.isCapitalized ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        Aktifleştirildi
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        Dönem Gideri
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                    {item.nextScheduledDate || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Wrench className="w-12 h-12 mx-auto stroke-[1.2] text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">Kayıt bulunamadı</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Yeni Bakım Kaydı butonuyla servis kaydı oluşturabilirsiniz.
            </p>
          </div>
        )}
      </div>

      {/* 4. Add Maintenance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Yeni Bakım / Servis Kaydı Ekle
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Demirbaş Seçin *
                </label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
                  required
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} - {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bakım Türü *
                  </label>
                  <select
                    value={maintenanceType}
                    onChange={(e) => setMaintenanceType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="periodic">Periyodik Bakım</option>
                    <option value="repair">Arıza & Onarım</option>
                    <option value="inspection">Muayene & Kontrol</option>
                    <option value="calibration">Kalibrasyon</option>
                    <option value="insurance">Sigorta / Kasko</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    İşlem Tarihi *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  İşlem / Servis Açıklaması *
                </label>
                <input
                  type="text"
                  placeholder="Örn: 50.000 km periyodik araç bakımı & filtre değişimi"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Maliyet Tutarı (TL)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={cost || ""}
                    onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Servis Sağlayıcı Firma
                  </label>
                  <input
                    type="text"
                    placeholder="Yetkili Servis A.Ş."
                    value={serviceProvider}
                    onChange={(e) => setServiceProvider(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Maliyeti Demirbaş Değerine Ekle (Aktifleştir)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    VUK uyarınca varlığın ömrünü veya kapasitesini artıran harcamalar maliyete eklenir.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isCapitalized}
                  onChange={(e) => setIsCapitalized(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sonraki Planlanan Bakım Tarihi
                </label>
                <input
                  type="date"
                  value={nextScheduledDate}
                  onChange={(e) => setNextScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white font-semibold rounded-xl cursor-pointer shadow-2xs transition-all active:scale-[0.98]"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
