import React, { useState } from "react";
import { Workstation, Branch, Warehouse } from "../../types";
import {
  Cpu,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wrench,
  Gauge,
  User,
  DollarSign,
  Calendar,
  Activity,
  Layers,
  Search,
  X,
} from "lucide-react";

interface WorkstationManagementProps {
  workstations: Workstation[];
  branches: Branch[];
  warehouses: Warehouse[];
  onSaveWorkstation: (ws: Workstation) => void;
  onDeleteWorkstation: (wsId: string) => void;
}

export const WorkstationManagement: React.FC<WorkstationManagementProps> = ({
  workstations,
  branches,
  warehouses,
  onSaveWorkstation,
  onDeleteWorkstation,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWs, setEditingWs] = useState<Partial<Workstation>>({
    code: "",
    name: "",
    category: "machine",
    hourlyOperatingCost: 300,
    hourlyDepreciationCost: 150,
    standardCapacityHoursPerDay: 8,
    efficiencyRate: 0.9,
    status: "idle",
    assignedOperatorName: "",
    notes: "",
  });

  const filteredWorkstations = workstations.filter(
    (ws) =>
      ws.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ws.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ws.assignedOperatorName && ws.assignedOperatorName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenCreateModal = () => {
    const code = `WS-${String(workstations.length + 1).padStart(2, "0")}`;
    setEditingWs({
      id: "ws_" + Date.now(),
      code,
      name: "",
      category: "machine",
      hourlyOperatingCost: 300,
      hourlyDepreciationCost: 150,
      standardCapacityHoursPerDay: 8,
      efficiencyRate: 0.9,
      status: "idle",
      assignedOperatorName: "",
      branchId: branches[0]?.id || "br_1",
      branchName: branches[0]?.name || "Merkez Fabrika",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ws: Workstation) => {
    setEditingWs(JSON.parse(JSON.stringify(ws)));
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWs.name || !editingWs.code) return;

    onSaveWorkstation(editingWs as Workstation);
    setIsModalOpen(false);
  };

  const toggleStatus = (ws: Workstation) => {
    const nextStatus: Record<string, "running" | "idle" | "maintenance" | "offline"> = {
      running: "idle",
      idle: "running",
      maintenance: "idle",
      offline: "idle",
    };
    onSaveWorkstation({
      ...ws,
      status: nextStatus[ws.status] || "idle",
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="İstasyon kodu, adı veya operatör ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white text-slate-900 placeholder-slate-400 text-xs rounded-xl pl-9 pr-3 py-2 border border-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs transition-all"
          />
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="bg-[#8252F6] hover:bg-[#7140e8] text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 text-white font-bold" />
          <span>Yeni İstasyon / Tezgah Ekle</span>
        </button>
      </div>

      {/* Grid of Workstations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredWorkstations.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-purple-200/60 p-12 text-center text-slate-400 text-xs font-semibold">
            Kayıtlı iş istasyonu bulunamadı.
          </div>
        ) : (
          filteredWorkstations.map((ws) => {
            const totalHourlyCost = (ws.hourlyOperatingCost || 0) + (ws.hourlyDepreciationCost || 0);

            return (
              <div
                key={ws.id}
                className="bg-white rounded-2xl border border-purple-200/60 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all overflow-hidden flex flex-col justify-between group"
              >
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Header info */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-purple-100/80 text-purple-950 border border-purple-300/60 shadow-2xs">
                          {ws.code}
                        </span>
                        <span className="text-[10px] text-purple-900/70 uppercase font-bold tracking-wider">
                          {ws.category === "cnc"
                            ? "CNC / Lazer"
                            : ws.category === "assembly_line"
                            ? "Montaj Hattı"
                            : ws.category === "paint_booth"
                            ? "Boya / Fırın"
                            : ws.category === "quality_station"
                            ? "Kalite / Test"
                            : "Makine"}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1.5 group-hover:text-purple-950 transition-colors">
                        {ws.name}
                      </h4>
                    </div>

                    <button
                      onClick={() => toggleStatus(ws)}
                      className={`text-[10px] px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                        ws.status === "running"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                          : ws.status === "idle"
                          ? "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                          : "bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          ws.status === "running"
                            ? "bg-emerald-500 animate-pulse"
                            : ws.status === "idle"
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                      />
                      {ws.status === "running" ? "Çalışıyor" : ws.status === "idle" ? "Boşta" : "Bakımda"}
                    </button>
                  </div>

                  {/* Active Work Order if running */}
                  {ws.currentWorkOrderNumber && (
                    <div className="p-2.5 rounded-xl bg-purple-50/80 border border-purple-200/60 text-xs text-purple-950 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-purple-900/80 block font-semibold">İşlenen Sipariş:</span>
                        <span className="font-mono font-bold">{ws.currentWorkOrderNumber}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-purple-900/80 block font-semibold">Operatör:</span>
                        <span className="font-bold">{ws.assignedOperatorName || "Atanmadı"}</span>
                      </div>
                    </div>
                  )}

                  {/* Cost & Capacity Matrix */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-100 text-xs">
                    <div className="p-2 bg-purple-50/40 rounded-xl border border-purple-100">
                      <span className="text-[9px] text-purple-950/70 font-extrabold uppercase block">Saatlik İşletme</span>
                      <span className="font-black text-slate-900 text-xs">{ws.hourlyOperatingCost} ₺/saat</span>
                    </div>
                    <div className="p-2 bg-purple-50/40 rounded-xl border border-purple-100">
                      <span className="text-[9px] text-purple-950/70 font-extrabold uppercase block">Saatlik Amortisman</span>
                      <span className="font-black text-slate-900 text-xs">{ws.hourlyDepreciationCost} ₺/saat</span>
                    </div>
                    <div className="p-2 bg-purple-50/40 rounded-xl border border-purple-100">
                      <span className="text-[9px] text-purple-950/70 font-extrabold uppercase block">Günlük Kapasite</span>
                      <span className="font-black text-slate-900 text-xs">{ws.standardCapacityHoursPerDay} Saat/Gün</span>
                    </div>
                    <div className="p-2 bg-purple-50/40 rounded-xl border border-purple-100">
                      <span className="text-[9px] text-purple-950/70 font-extrabold uppercase block">OEE Verimlilik</span>
                      <span className="font-black text-emerald-700 text-xs">
                        %{Math.round((ws.efficiencyRate || 0.9) * 100)}
                      </span>
                    </div>
                  </div>

                  {ws.notes && <p className="text-[11px] text-slate-500 italic">{ws.notes}</p>}
                </div>

                {/* Bottom footer actions */}
                <div className="px-4 sm:px-5 py-3 bg-purple-50/30 border-t border-purple-100 flex items-center justify-between">
                  <span className="text-[11px] text-purple-950 font-bold">
                    Toplam: {totalHourlyCost} ₺/saat
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(ws)}
                      className="p-1.5 text-slate-600 hover:text-purple-700 hover:bg-purple-100/60 rounded-lg transition-colors cursor-pointer"
                      title="Düzenle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`"${ws.name}" istasyonunu silmek istediğinize emin misiniz?`)) {
                          onDeleteWorkstation(ws.id);
                        }
                      }}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-purple-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-purple-50 via-fuchsia-50/40 to-slate-50 p-4 sm:p-5 border-b border-purple-200/60 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  İş İstasyonu / Tezgah Tanımla
                </h3>
                <p className="text-xs text-purple-950/80 mt-0.5">
                  Makinelerin çalışma maliyeti, amortisman ve kapasite tanımlamaları.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/80 hover:bg-white text-slate-500 hover:text-slate-700 flex items-center justify-center border border-purple-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">İstasyon / Tezgah Kodu *</label>
                  <input
                    type="text"
                    required
                    value={editingWs.code || ""}
                    onChange={(e) => setEditingWs({ ...editingWs, code: e.target.value })}
                    className="w-full bg-white border border-purple-200/70 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kategori</label>
                  <select
                    value={editingWs.category}
                    onChange={(e) => setEditingWs({ ...editingWs, category: e.target.value as any })}
                    className="w-full bg-white border border-purple-200/70 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                  >
                    <option value="machine">Genel Makine</option>
                    <option value="cnc">CNC / Lazer Kesim</option>
                    <option value="assembly_line">Montaj Hattı</option>
                    <option value="paint_booth">Boya & Fırın</option>
                    <option value="quality_station">Kalite Kontrol / Test</option>
                    <option value="manual">Manuel İşçilik Tezgahı</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">İstasyon Adı / Modeli *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Fiber Lazer Kesim & Punch CNC 4kW"
                  value={editingWs.name || ""}
                  onChange={(e) => setEditingWs({ ...editingWs, name: e.target.value })}
                  className="w-full bg-white border border-purple-200/70 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Saatlik İşletme / Elektrik (₺)</label>
                  <input
                    type="number"
                    value={editingWs.hourlyOperatingCost || 0}
                    onChange={(e) => setEditingWs({ ...editingWs, hourlyOperatingCost: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-purple-200/70 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Saatlik Amortisman Maliyeti (₺)</label>
                  <input
                    type="number"
                    value={editingWs.hourlyDepreciationCost || 0}
                    onChange={(e) => setEditingWs({ ...editingWs, hourlyDepreciationCost: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-purple-200/70 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Günlük Kapasite (Saat)</label>
                  <input
                    type="number"
                    value={editingWs.standardCapacityHoursPerDay || 8}
                    onChange={(e) => setEditingWs({ ...editingWs, standardCapacityHoursPerDay: parseFloat(e.target.value) || 8 })}
                    className="w-full bg-white border border-purple-200/70 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Hedef OEE Verimi (%)</label>
                  <input
                    type="number"
                    value={Math.round((editingWs.efficiencyRate || 0.9) * 100)}
                    onChange={(e) => setEditingWs({ ...editingWs, efficiencyRate: (parseFloat(e.target.value) || 90) / 100 })}
                    className="w-full bg-white border border-purple-200/70 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Varsayılan Operatör</label>
                  <input
                    type="text"
                    placeholder="Ahmet Usta"
                    value={editingWs.assignedOperatorName || ""}
                    onChange={(e) => setEditingWs({ ...editingWs, assignedOperatorName: e.target.value })}
                    className="w-full bg-white border border-purple-200/70 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Teknik Açıklama & Notlar</label>
                <textarea
                  rows={2}
                  value={editingWs.notes || ""}
                  onChange={(e) => setEditingWs({ ...editingWs, notes: e.target.value })}
                  className="w-full bg-white border border-purple-200/70 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                />
              </div>

              <div className="pt-4 border-t border-purple-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="bg-[#8252F6] hover:bg-[#7140e8] text-white font-bold text-xs py-2 px-5 rounded-xl shadow-xs cursor-pointer transition-all"
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
