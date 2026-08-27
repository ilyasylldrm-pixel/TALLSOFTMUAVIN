import React from "react";
import {
  BillOfMaterials,
  Workstation,
  Routing,
  WorkOrder,
  SubcontractOrder,
} from "../../types";
import {
  Factory,
  Layers,
  Cpu,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Boxes,
  Truck,
  Play,
  ArrowRight,
  Sparkles,
  Gauge,
  Plus,
  CalendarRange,
  BarChart3,
} from "lucide-react";

interface ProductionOverviewProps {
  boms: BillOfMaterials[];
  routings: Routing[];
  workstations: Workstation[];
  workOrders: WorkOrder[];
  subcontractOrders: SubcontractOrder[];
  onOpenBomTab: () => void;
  onOpenWorkOrderTab: () => void;
  onOpenWorkstationTab: () => void;
  onOpenSubcontractTab: () => void;
  onOpenCalendarTab?: () => void;
  onOpenCapacityD3Tab?: () => void;
  onOpenMesTerminal: (workOrderId?: string) => void;
  onOpenMrpModal: () => void;
}

export const ProductionOverview: React.FC<ProductionOverviewProps> = ({
  boms,
  routings,
  workstations,
  workOrders,
  subcontractOrders,
  onOpenBomTab,
  onOpenWorkOrderTab,
  onOpenWorkstationTab,
  onOpenSubcontractTab,
  onOpenCalendarTab,
  onOpenCapacityD3Tab,
  onOpenMesTerminal,
  onOpenMrpModal,
}) => {
  const activeWorkOrders = workOrders.filter(
    (w) => w.status === "in_progress" || w.status === "planned" || w.status === "material_issued"
  );
  const inProgressWorkOrders = workOrders.filter((w) => w.status === "in_progress");
  const completedWorkOrders = workOrders.filter((w) => w.status === "completed");

  const runningWorkstations = workstations.filter((w) => w.status === "running").length;
  const idleWorkstations = workstations.filter((w) => w.status === "idle").length;
  const maintenanceWorkstations = workstations.filter((w) => w.status === "maintenance").length;

  const totalPlannedUnits = workOrders.reduce((sum, w) => sum + w.plannedQuantity, 0);
  const totalProducedUnits = workOrders.reduce((sum, w) => sum + w.producedQuantity, 0);
  const totalScrappedUnits = workOrders.reduce((sum, w) => sum + w.scrappedQuantity, 0);

  const overallOEE =
    workstations.length > 0
      ? Math.round(
          (workstations.reduce((sum, w) => sum + (w.efficiencyRate || 0.85), 0) /
            workstations.length) *
            100
        )
      : 88;

  const activeSubcontracts = subcontractOrders.filter(
    (s) => s.status === "dispatched" || s.status === "pending"
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Active Work Orders */}
        <div
          onClick={onOpenWorkOrderTab}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-purple-200/60 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-950/70">
              Aktif İş Emirleri
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200/60 group-hover:scale-105 transition-all">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{activeWorkOrders.length}</span>
            <span className="text-xs text-purple-700 font-bold">
              ({inProgressWorkOrders.length} tezgahta)
            </span>
          </div>
          <div className="mt-2.5 flex items-center text-[11px] font-semibold text-slate-500 gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{completedWorkOrders.length} tamamlanan iş</span>
          </div>
        </div>

        {/* Workstations Status */}
        <div
          onClick={onOpenWorkstationTab}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-purple-200/60 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-950/70">
              İş İstasyonları (CNC / Hat)
            </span>
            <div className="w-9 h-9 rounded-xl bg-fuchsia-50 text-fuchsia-700 flex items-center justify-center border border-fuchsia-200/60 group-hover:scale-105 transition-all">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{workstations.length}</span>
            <span className="text-xs text-emerald-600 font-bold">
              {runningWorkstations} Çalışıyor
            </span>
          </div>
          <div className="mt-2.5 flex items-center text-[11px] font-semibold text-slate-500 gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>{idleWorkstations} Boşta</span>
            {maintenanceWorkstations > 0 && (
              <>
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 ml-1.5" />
                <span>{maintenanceWorkstations} Bakımda</span>
              </>
            )}
          </div>
        </div>

        {/* OEE Efficiency Rate */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-purple-200/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-950/70">
              Ekipman Verimliliği (OEE)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700">%{overallOEE}</span>
            <span className="text-xs text-emerald-600 font-bold">+2.4% bu hafta</span>
          </div>
          <div className="mt-2.5 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${overallOEE}%` }}
            />
          </div>
        </div>

        {/* Subcontracting */}
        <div
          onClick={onOpenSubcontractTab}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-purple-200/60 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-950/70">
              Fason Operasyonlar
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60 group-hover:scale-105 transition-all">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{activeSubcontracts.length}</span>
            <span className="text-xs text-amber-700 font-bold">dış tedarikçide</span>
          </div>
          <div className="mt-2.5 flex items-center text-[11px] font-semibold text-slate-500 gap-1.5">
            <Boxes className="w-3.5 h-3.5 text-slate-400" />
            <span>Toplam {subcontractOrders.length} fason kaydı</span>
          </div>
        </div>
      </div>

      {/* Production Planning & D3 Capacity Analytics Quick Action Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Production Planning & Gantt Calendar Banner */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col justify-between gap-4 border border-purple-800/60">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#8252F6] text-white flex items-center justify-center shadow-lg shadow-purple-600/30 shrink-0">
              <CalendarRange className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                  CANLI ÇİZELGE
                </span>
                <span className="text-xs text-purple-300 font-medium">Gantt & Makine Yük Planı</span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white mt-1">
                İş Emirleri & Tezgâh Takvimi
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Aktif iş emirlerini tezgah kullanım süreleri ve darboğaz uyarılarıyla zaman çizelgesinde inceleyin.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              onClick={onOpenCalendarTab || onOpenWorkOrderTab}
              className="bg-[#8252F6] hover:bg-[#7140e8] text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-purple-600/30 cursor-pointer transition-all active:scale-95 w-full sm:w-auto"
            >
              <span>Planlama Takvimini Aç</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* D3 Capacity & OEE Visual Analytics Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col justify-between gap-4 border border-purple-800/60">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-fuchsia-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-fuchsia-600/30 shrink-0">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-fuchsia-500/30 text-fuchsia-200 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                  D3.JS ANALİTİK
                </span>
                <span className="text-xs text-fuchsia-300 font-medium">Günlük / Haftalık Verimlilik</span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white mt-1">
                Makine Kapasite & OEE Grafikleri
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Tezgâh doluluk oranları, OEE verimlilik çemberleri, ısı haritası ve yük trendlerini D3 görselleştirmesiyle analiz edin.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              onClick={onOpenCapacityD3Tab || onOpenWorkstationTab}
              className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-fuchsia-600/30 cursor-pointer transition-all active:scale-95 w-full sm:w-auto"
            >
              <span>D3 Grafikleri & OEE Analizini Aç</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Work Orders Live Stream & Workstation Real-time Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Active Work Orders Live Stream (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-50/60 rounded-2xl border border-purple-200/60 p-1.5 sm:p-3 shadow-2xs flex flex-col">
          <div className="px-3 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                Devam Eden ve Planlanan İş Emirleri
              </h3>
            </div>
            <button
              onClick={onOpenWorkOrderTab}
              className="text-xs font-bold text-purple-800 hover:text-purple-950 flex items-center gap-1 cursor-pointer transition-colors"
            >
              Tümünü Gör ({workOrders.length}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 p-1 max-h-[520px] overflow-y-auto custom-scrollbar">
            {workOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-purple-100 text-xs font-medium">
                Henüz kayıtlı bir iş emri bulunmuyor.
              </div>
            ) : (
              workOrders.slice(0, 6).map((wo) => {
                const percent =
                  wo.plannedQuantity > 0
                    ? Math.round((wo.producedQuantity / wo.plannedQuantity) * 100)
                    : 0;

                return (
                  <div
                    key={wo.id}
                    className="bg-white p-3.5 sm:p-4 rounded-xl border border-purple-100 hover:border-purple-300 hover:shadow-xs transition-all group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-purple-100/80 text-purple-950 border border-purple-300/60 shadow-2xs">
                            {wo.orderNumber}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                              wo.status === "in_progress"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : wo.status === "completed"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : wo.status === "quality_control"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : wo.status === "material_issued"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {wo.status === "in_progress"
                              ? "Üretimde"
                              : wo.status === "completed"
                              ? "Tamamlandı"
                              : wo.status === "quality_control"
                              ? "Kalite Kontrol"
                              : wo.status === "material_issued"
                              ? "Hammadde Çıktı"
                              : "Planlandı"}
                          </span>
                          {wo.priority === "urgent" && (
                            <span className="text-[9px] bg-rose-100 text-rose-800 border border-rose-200 px-1.5 py-0.2 rounded font-bold uppercase tracking-wide">
                              Acil
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-purple-950 transition-colors">
                          {wo.productName}
                        </h4>
                        <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3">
                          {wo.lotNumber && (
                            <span className="font-mono text-purple-900 font-semibold">Lot: {wo.lotNumber}</span>
                          )}
                          {wo.customerName && <span>Müşteri: {wo.customerName}</span>}
                          <span>Termin: {wo.plannedDueDate}</span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                        <div className="text-right">
                          <div className="text-xs sm:text-sm font-extrabold text-slate-900">
                            {wo.producedQuantity} / {wo.plannedQuantity} {wo.unit}
                          </div>
                          <div className="text-[10px] text-purple-900/80 font-bold">%{percent} İlerleme</div>
                        </div>

                        <button
                          onClick={() => onOpenMesTerminal(wo.id)}
                          className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0"
                        >
                          <Play className="w-3 h-3 fill-purple-700" />
                          <span>MES Terminali</span>
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          percent >= 100
                            ? "bg-emerald-500"
                            : percent > 50
                            ? "bg-purple-600"
                            : "bg-indigo-500"
                        }`}
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Workstations / Machines Live Status (1 Col) */}
        <div className="bg-slate-50/60 rounded-2xl border border-purple-200/60 p-1.5 sm:p-3 shadow-2xs flex flex-col">
          <div className="px-3 py-2.5 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-700" />
              Tezgah & İstasyonlar
            </h3>
            <button
              onClick={onOpenWorkstationTab}
              className="text-xs font-bold text-purple-800 hover:text-purple-950 cursor-pointer transition-colors"
            >
              Yönet
            </button>
          </div>

          <div className="space-y-2 p-1 max-h-[520px] overflow-y-auto custom-scrollbar">
            {workstations.map((ws) => (
              <div
                key={ws.id}
                className="p-3 bg-white rounded-xl border border-purple-100 hover:border-purple-300 hover:shadow-xs transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          ws.status === "running"
                            ? "bg-emerald-500 animate-pulse"
                            : ws.status === "idle"
                            ? "bg-amber-400"
                            : "bg-rose-500"
                        }`}
                      />
                      <span className="font-extrabold text-xs text-slate-900">{ws.name}</span>
                    </div>
                    <span className="text-[10px] text-purple-900/70 font-mono pl-4.5 block mt-0.5 font-bold">
                      {ws.code}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                      ws.status === "running"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : ws.status === "idle"
                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                        : "bg-rose-50 text-rose-800 border border-rose-200"
                    }`}
                  >
                    {ws.status === "running"
                      ? "Çalışıyor"
                      : ws.status === "idle"
                      ? "Boşta"
                      : "Bakımda"}
                  </span>
                </div>

                {ws.currentWorkOrderNumber && (
                  <div className="mt-2 text-xs bg-purple-50/80 p-2 rounded-lg text-purple-950 border border-purple-200/60 flex items-center justify-between">
                    <span className="font-mono font-bold">{ws.currentWorkOrderNumber}</span>
                    <span className="text-[10px] text-purple-900/80">
                      Operatör: {ws.assignedOperatorName || "Atanmadı"}
                    </span>
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-slate-500">
                  <span>Saatlik: {ws.hourlyOperatingCost} ₺/saat</span>
                  <span className="font-bold text-purple-950">
                    OEE: %{Math.round((ws.efficiencyRate || 0.9) * 100)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reçete & Rota Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Reçeteler (BOM) Özeti */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-purple-200/60 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200/60">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">Ürün Reçeteleri (BOM)</h4>
              <p className="text-xs text-purple-950/80 font-medium mt-0.5">
                {boms.length} tanımlı ürün reçetesi ve fire analizi
              </p>
            </div>
          </div>
          <button
            onClick={onOpenBomTab}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          >
            Reçeteleri İncele
          </button>
        </div>

        {/* Operasyon Rotaları Özeti */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-purple-200/60 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-fuchsia-50 text-fuchsia-700 flex items-center justify-center border border-fuchsia-200/60">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">Operasyon Rotaları (Routing)</h4>
              <p className="text-xs text-purple-950/80 font-medium mt-0.5">
                {routings.length} standart üretim iş akışı & istasyon sırası
              </p>
            </div>
          </div>
          <button
            onClick={onOpenWorkOrderTab}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          >
            İş Emirlerini İncele
          </button>
        </div>
      </div>
    </div>
  );
};
