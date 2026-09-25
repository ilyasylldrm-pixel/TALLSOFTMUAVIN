import React, { useState } from "react";
import {
  Wrench,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building,
  DollarSign,
  FileText,
  Search,
  Filter,
} from "lucide-react";
import { FixedAsset, AssetMaintenanceRecord } from "../../types";
import { formatTRY } from "../../data/fixedAssetsData";

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
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-100 rounded-xl text-amber-700">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Demirbaş Bakım, Onarım ve Kalibrasyon Yönetimi
            </h3>
            <p className="text-xs text-slate-500">
              Periyodik bakımlar, garanti takibi, servis faturaları ve önleyici kontrol planlaması
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-400 block font-medium">Toplam Bakım Masrafı</span>
            <span className="text-base font-bold text-slate-800">{formatTRY(totalCost)}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Bakım / Servis Kaydı</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Demirbaş adı, kod veya servis firması ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">İşlem Türü:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg text-xs py-1.5 px-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">Tümü ({maintenances.length})</option>
            <option value="periodic">Periyodik Bakım</option>
            <option value="repair">Arıza & Onarım</option>
            <option value="calibration">Kalibrasyon & Test</option>
            <option value="inspection">TÜVTÜRK / Muayene</option>
            <option value="insurance">Kasko / Sigorta</option>
          </select>
        </div>
      </div>

      {/* Maintenances List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Wrench className="w-12 h-12 mx-auto stroke-[1.2] mb-3 text-slate-300" />
            <p className="font-semibold text-slate-600">Bakım kaydı bulunamadı</p>
            <p className="text-xs text-slate-400 mt-1">
              Yukarıdaki butonu kullanarak yeni bir bakım veya onarım işlemi ekleyebilirsiniz.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${
                      item.maintenanceType === "periodic"
                        ? "bg-blue-100 text-blue-700"
                        : item.maintenanceType === "repair"
                        ? "bg-red-100 text-red-700"
                        : item.maintenanceType === "calibration"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    <Wrench className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {item.assetCode}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
                        {item.maintenanceType === "periodic"
                          ? "Periyodik Bakım"
                          : item.maintenanceType === "repair"
                          ? "Onarım & Tamir"
                          : item.maintenanceType === "calibration"
                          ? "Kalibrasyon"
                          : "Muayene"}
                      </span>
                      {item.isCapitalized && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">
                          Maliyete Eklendi
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 font-medium">{item.assetName}</p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 flex-wrap pt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {item.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5" />
                        {item.serviceProvider}
                      </span>
                      {item.performedBy && <span>Yetkili: {item.performedBy}</span>}
                      {item.invoiceNo && <span>Fatura: {item.invoiceNo}</span>}
                    </div>

                    {item.notes && (
                      <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg mt-2 italic">
                        "{item.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-2 md:pt-0 shrink-0">
                  <span className="text-sm font-bold text-slate-800">
                    {formatTRY(item.cost)}
                  </span>
                  {item.nextScheduledDate && (
                    <span className="text-[11px] text-amber-600 font-medium flex items-center gap-1 mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      Sonraki: {item.nextScheduledDate}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Maintenance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-base text-slate-800">Yeni Bakım / Servis Kaydı</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Demirbaş Seçimi *
                </label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bakım Türü *
                  </label>
                  <select
                    value={maintenanceType}
                    onChange={(e) => setMaintenanceType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="periodic">Periyodik Bakım</option>
                    <option value="repair">Arıza & Onarım</option>
                    <option value="calibration">Kalibrasyon & Test</option>
                    <option value="inspection">TÜVTÜRK / Muayene</option>
                    <option value="insurance">Kasko / Sigorta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tarih *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  İşlem Başlığı / Özeti *
                </label>
                <input
                  type="text"
                  placeholder="Örn: 20.000 KM Bakımı veya Ekran Değişimi"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Masraf Tutarı (₺)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={cost || ""}
                    onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Servis Firması / Sağlayıcı
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Mais Yetkili Servisi"
                    value={serviceProvider}
                    onChange={(e) => setServiceProvider(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fatura / Makbuz No
                  </label>
                  <input
                    type="text"
                    placeholder="GIB2024000..."
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sonraki Planlanan Bakım
                  </label>
                  <input
                    type="date"
                    value={nextScheduledDate}
                    onChange={(e) => setNextScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isCapitalized"
                  checked={isCapitalized}
                  onChange={(e) => setIsCapitalized(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <label htmlFor="isCapitalized" className="text-xs text-slate-700 cursor-pointer">
                  Maliyete Ekle (Doğrudan gidere yazmak yerine aktif değerini artır)
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notlar</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Yapılan işlemler ve değiştirilen parçalar..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm cursor-pointer"
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
