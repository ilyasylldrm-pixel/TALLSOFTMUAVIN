import React, { useState } from "react";
import { Routing, RoutingStep, Workstation, Contact } from "../../types";
import {
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
  Cpu,
  Truck,
  CheckCircle2,
  Trash2,
  Edit2,
  ChevronRight,
  ShieldCheck,
  Zap,
  Search,
  X,
} from "lucide-react";

interface RoutingManagementProps {
  routings: Routing[];
  workstations: Workstation[];
  contacts: Contact[];
  onSaveRouting: (routing: Routing) => void;
  onDeleteRouting: (routingId: string) => void;
}

export const RoutingManagement: React.FC<RoutingManagementProps> = ({
  routings,
  workstations,
  contacts,
  onSaveRouting,
  onDeleteRouting,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRouting, setSelectedRouting] = useState<Routing | null>(routings[0] || null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRouting, setEditingRouting] = useState<Partial<Routing>>({
    routingCode: "",
    name: "",
    productName: "",
    totalSetupMinutes: 30,
    totalRunMinutesPerUnit: 40,
    isActive: true,
    steps: [],
  });

  const suppliers = contacts.filter((c) => c.type === "supplier" || c.type === "both");

  const filteredRoutings = routings.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.routingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCreateModal = () => {
    const code = `ROUT-${new Date().getFullYear()}-${String(routings.length + 1).padStart(3, "0")}`;
    setEditingRouting({
      id: "rout_" + Date.now(),
      routingCode: code,
      name: "",
      productName: "",
      totalSetupMinutes: 0,
      totalRunMinutesPerUnit: 0,
      isActive: true,
      createdAt: new Date().toISOString().split("T")[0],
      steps: [
        {
          id: "step_" + Date.now(),
          sequence: 10,
          operationName: "İlk Operasyon / Kesim",
          workstationId: workstations[0]?.id || "",
          workstationName: workstations[0]?.name || "",
          workstationType: "internal",
          setupTimeMinutes: 15,
          runTimePerUnitMinutes: 10,
          requiresQualityInspection: false,
        },
      ],
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (r: Routing) => {
    setEditingRouting(JSON.parse(JSON.stringify(r)));
    setIsModalOpen(true);
  };

  const handleAddStep = () => {
    const currentSteps = editingRouting.steps || [];
    const nextSeq = currentSteps.length > 0 ? Math.max(...currentSteps.map((s) => s.sequence)) + 10 : 10;
    const newStep: RoutingStep = {
      id: "step_" + Date.now(),
      sequence: nextSeq,
      operationName: `Operasyon Adımı #${currentSteps.length + 1}`,
      workstationId: workstations[0]?.id || "",
      workstationName: workstations[0]?.name || "",
      workstationType: "internal",
      setupTimeMinutes: 10,
      runTimePerUnitMinutes: 15,
      requiresQualityInspection: false,
    };
    setEditingRouting((prev) => ({
      ...prev,
      steps: [...(prev.steps || []), newStep],
    }));
  };

  const handleRemoveStep = (index: number) => {
    setEditingRouting((prev) => ({
      ...prev,
      steps: (prev.steps || []).filter((_, i) => i !== index),
    }));
  };

  const handleStepChange = (index: number, field: keyof RoutingStep, val: any) => {
    setEditingRouting((prev) => {
      const updated = [...(prev.steps || [])];
      updated[index] = { ...updated[index], [field]: val };

      if (field === "workstationId") {
        const ws = workstations.find((w) => w.id === val);
        if (ws) {
          updated[index].workstationName = ws.name;
        }
      }
      if (field === "subcontractorContactId") {
        const contact = contacts.find((c) => c.id === val);
        if (contact) {
          updated[index].subcontractorContactName = contact.name;
        }
      }
      return { ...prev, steps: updated };
    });
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRouting.name || !editingRouting.routingCode) return;

    // Recalculate totals
    const steps = editingRouting.steps || [];
    const totalSetup = steps.reduce((sum, s) => sum + (s.setupTimeMinutes || 0), 0);
    const totalRun = steps.reduce((sum, s) => sum + (s.runTimePerUnitMinutes || 0), 0);

    const finalRouting: Routing = {
      ...(editingRouting as Routing),
      totalSetupMinutes: totalSetup,
      totalRunMinutesPerUnit: totalRun,
    };

    onSaveRouting(finalRouting);
    setSelectedRouting(finalRouting);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rota kodu, adı veya mamul ara..."
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
          <span>Yeni Rota Tanımla</span>
        </button>
      </div>

      {/* Grid: Routing List on Left, Interactive Step Flow on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Side: Routing List (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-50/60 rounded-2xl border border-purple-200/60 p-1.5 sm:p-3 shadow-2xs flex flex-col">
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-900">Tanımlı Rotalar ({filteredRoutings.length})</span>
            <span className="text-[10px] text-purple-900/70 font-semibold">İş Akışları</span>
          </div>

          <div className="space-y-2 p-1 overflow-y-auto max-h-[600px] custom-scrollbar">
            {filteredRoutings.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-purple-100 text-xs">
                Rota bulunamadı.
              </div>
            ) : (
              filteredRoutings.map((r) => {
                const isSelected = selectedRouting?.id === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRouting(r)}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? "bg-white border-purple-400 shadow-md ring-2 ring-purple-500/20"
                        : "bg-white hover:bg-purple-50/40 border-purple-100/80 shadow-2xs hover:border-purple-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-purple-100/80 text-purple-950 border border-purple-300/60 shadow-2xs">
                        {r.routingCode}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                        {r.steps.length} İstasyon / Adım
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1.5 line-clamp-1">{r.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{r.productName}</p>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-purple-100/60">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-purple-400" />
                        Hazırlık: {r.totalSetupMinutes} dk
                      </span>
                      <span className="font-extrabold text-purple-950 text-[11px]">
                        Çevrim: {r.totalRunMinutesPerUnit} dk/adet
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Step Flow Visualizer (8 Cols) */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-6">
          {selectedRouting ? (
            <div className="bg-white rounded-2xl border border-purple-200/60 shadow-2xs p-4 sm:p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-purple-100 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-purple-100/80 text-purple-950 border border-purple-300/60 shadow-2xs">
                      {selectedRouting.routingCode}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">Üretim Rota Akışı</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1.5">{selectedRouting.name}</h3>
                  <p className="text-xs text-slate-500">Hedef Ürün: {selectedRouting.productName}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(selectedRouting)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Düzenle</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`"${selectedRouting.name}" rotasını silmek istediğinize emin misiniz?`)) {
                        onDeleteRouting(selectedRouting.id);
                        setSelectedRouting(routings.find((r) => r.id !== selectedRouting.id) || null);
                      }
                    }}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Sil</span>
                  </button>
                </div>
              </div>

              {/* Total Time Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div className="p-3 bg-purple-50/40 rounded-xl border border-purple-100">
                  <span className="text-[10px] text-purple-950/70 font-extrabold uppercase block">Toplam Hazırlık Süresi</span>
                  <span className="text-sm sm:text-base font-black text-purple-950">
                    {selectedRouting.totalSetupMinutes} Dakika
                  </span>
                </div>
                <div className="p-3 bg-purple-50/40 rounded-xl border border-purple-100">
                  <span className="text-[10px] text-purple-950/70 font-extrabold uppercase block">Birim İşleme Süresi</span>
                  <span className="text-sm sm:text-base font-black text-purple-950">
                    {selectedRouting.totalRunMinutesPerUnit} Dakika / Adet
                  </span>
                </div>
                <div className="p-3 bg-purple-50/40 rounded-xl border border-purple-100">
                  <span className="text-[10px] text-purple-950/70 font-extrabold uppercase block">Operasyon Adımı</span>
                  <span className="text-sm sm:text-base font-black text-purple-950">
                    {selectedRouting.steps.length} İstasyon
                  </span>
                </div>
              </div>

              {/* Visual Flow Steps (Vertical Process Timeline) */}
              <div className="space-y-4 pt-1">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Üretim Sıralı İş Akışı (Process Flowchart)
                </h4>

                <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-purple-200">
                  {selectedRouting.steps.map((step, idx) => {
                    const isSubcontract = step.workstationType === "subcontractor";

                    return (
                      <div key={step.id || idx} className="relative group">
                        {/* Dot on timeline */}
                        <div
                          className={`absolute -left-6 top-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shadow-xs ring-4 ring-white ${
                            isSubcontract ? "bg-amber-500" : "bg-[#8252F6]"
                          }`}
                        >
                          {idx + 1}
                        </div>

                        <div className="p-3.5 sm:p-4 bg-slate-50/70 hover:bg-white rounded-xl border border-purple-100/90 hover:border-purple-300 transition-all shadow-2xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-bold text-slate-500">
                                  #{step.sequence}
                                </span>
                                <h5 className="font-extrabold text-xs sm:text-sm text-slate-900">{step.operationName}</h5>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                                    isSubcontract
                                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                                      : "bg-purple-50 text-purple-800 border border-purple-200"
                                  }`}
                                >
                                  {isSubcontract ? "Fason / Dış Tedarik" : "İç İstasyon"}
                                </span>
                              </div>

                              <div className="text-xs text-slate-600 mt-1 flex items-center gap-3">
                                <span className="flex items-center gap-1 text-[11px]">
                                  {isSubcontract ? (
                                    <Truck className="w-3.5 h-3.5 text-amber-600" />
                                  ) : (
                                    <Cpu className="w-3.5 h-3.5 text-purple-600" />
                                  )}
                                  <strong>İstasyon/Tedarikçi:</strong>{" "}
                                  {isSubcontract
                                    ? step.subcontractorContactName || "Dış Fasoncu"
                                    : step.workstationName}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-600 bg-white p-2 rounded-lg border border-purple-100 shadow-2xs">
                              {!isSubcontract && (
                                <>
                                  <div>
                                    <span className="text-[9px] text-slate-400 block font-semibold">Hazırlık</span>
                                    <span className="font-bold text-slate-900">{step.setupTimeMinutes || 0} dk</span>
                                  </div>
                                  <div className="h-5 w-px bg-purple-100" />
                                  <div>
                                    <span className="text-[9px] text-slate-400 block font-semibold">Çevrim</span>
                                    <span className="font-bold text-slate-900">{step.runTimePerUnitMinutes || 0} dk/ad</span>
                                  </div>
                                </>
                              )}
                              {isSubcontract && (
                                <div>
                                  <span className="text-[9px] text-slate-400 block font-semibold">Fason Maliyet</span>
                                  <span className="font-bold text-amber-700">{step.subcontractorUnitCost || 0} ₺/ad</span>
                                </div>
                              )}

                              {step.requiresQualityInspection && (
                                <div className="pl-2 border-l border-purple-100 flex items-center gap-1 text-emerald-600 font-bold">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span className="text-[9px]">Kalite Onayı Şart</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-purple-200/60 p-12 text-center text-slate-400 text-xs font-semibold">
              Detayları görüntülemek için bir rota seçin.
            </div>
          )}
        </div>
      </div>

      {/* Rota Ekleme / Düzenleme Modalı */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-purple-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-purple-50 via-fuchsia-50/40 to-slate-50 p-4 sm:p-5 border-b border-purple-200/60 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Operasyon Rotası Tanımla / Düzenle
                </h3>
                <p className="text-xs text-purple-950/80 mt-0.5">
                  Ürünün istasyon sırası, hazırlık ve operasyon süreleri.
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Rota Kodu *</label>
                  <input
                    type="text"
                    required
                    value={editingRouting.routingCode || ""}
                    onChange={(e) => setEditingRouting({ ...editingRouting, routingCode: e.target.value })}
                    className="w-full bg-white border border-purple-200/70 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Rota Başlığı / Adı *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Standart Montaj ve Boya Rotası"
                    value={editingRouting.name || ""}
                    onChange={(e) => setEditingRouting({ ...editingRouting, name: e.target.value })}
                    className="w-full bg-white border border-purple-200/70 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                  />
                </div>
              </div>

              {/* Steps List */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-extrabold text-slate-900">Operasyon Basamakları (Adım Sırası)</label>
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-purple-700" />
                    <span>Adım Ekle</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto p-2 bg-slate-50/70 rounded-xl border border-purple-200/60 custom-scrollbar">
                  {editingRouting.steps?.map((step, idx) => (
                    <div
                      key={step.id || idx}
                      className="bg-white p-2.5 sm:p-3 rounded-xl border border-purple-100 grid grid-cols-12 gap-2 items-center text-xs shadow-2xs"
                    >
                      <div className="col-span-1">
                        <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Sıra</label>
                        <input
                          type="number"
                          value={step.sequence}
                          onChange={(e) => handleStepChange(idx, "sequence", parseInt(e.target.value) || 10)}
                          className="w-full text-xs p-1.5 rounded-lg border border-purple-200 text-center font-bold"
                        />
                      </div>

                      <div className="col-span-3">
                        <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Operasyon Adı</label>
                        <input
                          type="text"
                          required
                          value={step.operationName}
                          onChange={(e) => handleStepChange(idx, "operationName", e.target.value)}
                          className="w-full text-xs p-1.5 rounded-lg border border-purple-200 font-semibold"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Tür</label>
                        <select
                          value={step.workstationType}
                          onChange={(e) => handleStepChange(idx, "workstationType", e.target.value)}
                          className="w-full text-xs p-1.5 rounded-lg border border-purple-200 bg-white"
                        >
                          <option value="internal">İç İstasyon</option>
                          <option value="subcontractor">Fason / Tedarikçi</option>
                        </select>
                      </div>

                      <div className="col-span-3">
                        <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                          {step.workstationType === "internal" ? "İş İstasyonu" : "Fason Tedarikçi"}
                        </label>
                        {step.workstationType === "internal" ? (
                          <select
                            value={step.workstationId}
                            onChange={(e) => handleStepChange(idx, "workstationId", e.target.value)}
                            className="w-full text-xs p-1.5 rounded-lg border border-purple-200 bg-white"
                          >
                            {workstations.map((w) => (
                              <option key={w.id} value={w.id}>
                                {w.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <select
                            value={step.subcontractorContactId || ""}
                            onChange={(e) => handleStepChange(idx, "subcontractorContactId", e.target.value)}
                            className="w-full text-xs p-1.5 rounded-lg border border-purple-200 bg-white"
                          >
                            <option value="">Tedarikçi Seçin...</option>
                            {suppliers.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                          {step.workstationType === "internal" ? "Çevrim (dk/ad)" : "Birim Ücret (₺)"}
                        </label>
                        <input
                          type="number"
                          value={
                            step.workstationType === "internal"
                              ? step.runTimePerUnitMinutes
                              : step.subcontractorUnitCost || 0
                          }
                          onChange={(e) =>
                            handleStepChange(
                              idx,
                              step.workstationType === "internal" ? "runTimePerUnitMinutes" : "subcontractorUnitCost",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full text-xs p-1.5 rounded-lg border border-purple-200 font-bold"
                        />
                      </div>

                      <div className="col-span-1 text-center pt-3">
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(idx)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs inline-flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
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
                  Rotayı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
