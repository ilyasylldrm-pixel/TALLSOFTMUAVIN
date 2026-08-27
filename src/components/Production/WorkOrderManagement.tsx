import React, { useState } from "react";
import {
  WorkOrder,
  BillOfMaterials,
  Routing,
  Product,
  Warehouse,
  Workstation,
} from "../../types";
import {
  Layers,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Play,
  Printer,
  ChevronRight,
  Sparkles,
  Boxes,
  Cpu,
  ArrowRight,
  ShieldCheck,
  PackageCheck,
  TrendingUp,
  Barcode,
  Calendar,
  DollarSign,
  Share2,
  X,
} from "lucide-react";

interface WorkOrderManagementProps {
  workOrders: WorkOrder[];
  boms: BillOfMaterials[];
  routings: Routing[];
  products: Product[];
  warehouses: Warehouse[];
  workstations: Workstation[];
  onSaveWorkOrder: (wo: WorkOrder) => void;
  onDeleteWorkOrder: (woId: string) => void;
  onOpenMesTerminal: (workOrderId: string) => void;
  onIssueMaterials: (woId: string) => void;
  onReceiveFinishedGoods: (woId: string) => void;
}

export const WorkOrderManagement: React.FC<WorkOrderManagementProps> = ({
  workOrders,
  boms,
  routings,
  products,
  warehouses,
  workstations,
  onSaveWorkOrder,
  onDeleteWorkOrder,
  onOpenMesTerminal,
  onIssueMaterials,
  onReceiveFinishedGoods,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(
    workOrders[0] || null
  );

  // Modal for New / Edit Work Order
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const [editingWo, setEditingWo] = useState<Partial<WorkOrder>>({
    orderNumber: "",
    originType: "manual_stock",
    productId: "",
    productName: "",
    productCode: "",
    bomId: "",
    bomCode: "",
    routingId: "",
    lotNumber: "",
    plannedQuantity: 10,
    producedQuantity: 0,
    scrappedQuantity: 0,
    unit: "Adet",
    status: "planned",
    priority: "medium",
    plannedStartDate: new Date().toISOString().split("T")[0],
    plannedDueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    isMaterialIssued: false,
    isFinishedGoodReceived: false,
    notes: "",
  });

  const filteredWorkOrders = workOrders.filter((w) => {
    const matchesSearch =
      w.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.lotNumber && w.lotNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (w.customerName && w.customerName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "all" || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCreateModal = () => {
    const year = new Date().getFullYear();
    const orderNumber = `WO-${year}-${String(workOrders.length + 101).padStart(5, "0")}`;
    const defaultBom = boms[0];
    const defaultLot = `LOT${year % 100}${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(
      workOrders.length + 1
    ).padStart(3, "0")}`;

    setEditingWo({
      id: "wo_" + Date.now(),
      orderNumber,
      originType: "manual_stock",
      productId: defaultBom?.productId || products[0]?.id || "",
      productName: defaultBom?.productName || products[0]?.name || "",
      productCode: defaultBom?.productCode || products[0]?.code || "",
      bomId: defaultBom?.id || "",
      bomCode: defaultBom?.bomCode || "",
      routingId: defaultBom?.routingId || routings[0]?.id || "",
      lotNumber: defaultLot,
      barcode: orderNumber.replace(/-/g, ""),
      plannedQuantity: 20,
      producedQuantity: 0,
      scrappedQuantity: 0,
      unit: defaultBom?.outputUnit || "Adet",
      sourceWarehouseId: warehouses[0]?.id || "wh_1",
      sourceWarehouseName: warehouses[0]?.name || "Ana Depo",
      targetWarehouseId: warehouses[0]?.id || "wh_1",
      targetWarehouseName: warehouses[0]?.name || "Ana Depo",
      status: "planned",
      priority: "medium",
      plannedStartDate: new Date().toISOString().split("T")[0],
      plannedDueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      isMaterialIssued: false,
      isFinishedGoodReceived: false,
      createdAt: new Date().toISOString().split("T")[0],
      notes: "",
      operations: [],
      allocatedMaterials: [],
    });
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWo.orderNumber || !editingWo.productId) return;

    // Attach operations from selected routing if not existing
    const chosenRouting = routings.find((r) => r.id === editingWo.routingId);
    const chosenBom = boms.find((b) => b.id === editingWo.bomId);

    const ops =
      (editingWo.operations && editingWo.operations.length > 0)
        ? editingWo.operations
        : chosenRouting
        ? chosenRouting.steps.map((s, idx) => ({
            id: `wo_op_${Date.now()}_${idx}`,
            sequence: s.sequence,
            operationName: s.operationName,
            workstationId: s.workstationId,
            workstationName: s.workstationName,
            operatorName: "",
            status: "pending" as const,
            plannedDurationMinutes: (s.runTimePerUnitMinutes || 10) * (editingWo.plannedQuantity || 1),
            actualDurationMinutes: 0,
          }))
        : [];

    const materials =
      (editingWo.allocatedMaterials && editingWo.allocatedMaterials.length > 0)
        ? editingWo.allocatedMaterials
        : chosenBom
        ? chosenBom.items.map((it, idx) => ({
            id: `wo_mat_${Date.now()}_${idx}`,
            productId: it.productId,
            productCode: it.productCode,
            productName: it.productName,
            plannedQuantity: it.quantityPerUnit * (editingWo.plannedQuantity || 1) * (1 + (it.wasteRate || 0)),
            consumedQuantity: 0,
            unit: it.unit,
            unitCost: it.unitCost,
          }))
        : [];

    const finalWo: WorkOrder = {
      ...(editingWo as WorkOrder),
      operations: ops,
      allocatedMaterials: materials,
    };

    onSaveWorkOrder(finalWo);
    setSelectedWorkOrder(finalWo);
    setIsModalOpen(false);
  };

  const getStatusBadge = (status: WorkOrder["status"]) => {
    switch (status) {
      case "in_progress":
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md text-[10px] font-bold">Üretimde</span>;
      case "completed":
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-bold">Tamamlandı</span>;
      case "quality_control":
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md text-[10px] font-bold">Kalite Kontrol</span>;
      case "material_issued":
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-bold">Hammadde Çıktı</span>;
      case "paused":
        return <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-md text-[10px] font-bold">Durduruldu</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md text-[10px] font-bold">Planlandı</span>;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="İş emri no, ürün, lot no veya müşteri ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white text-slate-900 placeholder-slate-400 text-xs rounded-xl pl-9 pr-3 py-2 border border-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          {[
            { id: "all", label: "Tümü" },
            { id: "planned", label: "Planlandı" },
            { id: "in_progress", label: "Üretimde" },
            { id: "quality_control", label: "Kalite Kontrol" },
            { id: "completed", label: "Tamamlanan" },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === st.id
                  ? "bg-purple-100 text-purple-950 border border-purple-300 shadow-2xs"
                  : "bg-white text-slate-600 hover:bg-purple-50/50 border border-purple-200/60"
              }`}
            >
              {st.label}
            </button>
          ))}

          <button
            onClick={handleOpenCreateModal}
            className="bg-[#8252F6] hover:bg-[#7140e8] text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all shrink-0 ml-1"
          >
            <Plus className="w-4 h-4 text-white font-bold" />
            <span>Yeni İş Emri Aç</span>
          </button>
        </div>
      </div>

      {/* Grid: Master List on Left, Selected Work Order Detail / Traveler Card on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left: Work Orders List (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-50/60 rounded-2xl border border-purple-200/60 p-1.5 sm:p-3 shadow-2xs flex flex-col">
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-900">
              İş Emirleri ({filteredWorkOrders.length})
            </span>
            <span className="text-[10px] text-purple-900/70 font-semibold">Aktif Sıralama</span>
          </div>

          <div className="space-y-2 p-1 overflow-y-auto max-h-[640px] custom-scrollbar">
            {filteredWorkOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-purple-100 text-xs">
                İş emri bulunamadı.
              </div>
            ) : (
              filteredWorkOrders.map((wo) => {
                const isSelected = selectedWorkOrder?.id === wo.id;
                const percent =
                  wo.plannedQuantity > 0 ? Math.round((wo.producedQuantity / wo.plannedQuantity) * 100) : 0;

                return (
                  <div
                    key={wo.id}
                    onClick={() => setSelectedWorkOrder(wo)}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? "bg-white border-purple-400 shadow-md ring-2 ring-purple-500/20"
                        : "bg-white hover:bg-purple-50/40 border-purple-100/80 shadow-2xs hover:border-purple-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-purple-100/80 text-purple-950 border border-purple-300/60 shadow-2xs">
                            {wo.orderNumber}
                          </span>
                          {getStatusBadge(wo.status)}
                          {wo.priority === "urgent" && (
                            <span className="text-[9px] bg-rose-100 text-rose-800 border border-rose-200 px-1.5 py-0.2 rounded font-bold uppercase tracking-wide">
                              Acil
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1.5 line-clamp-1">
                          {wo.productName}
                        </h4>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                          <span className="font-mono text-purple-900 font-semibold">Lot: {wo.lotNumber}</span>
                          {wo.customerName && <span>• {wo.customerName}</span>}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-extrabold text-slate-900">
                          {wo.producedQuantity} / {wo.plannedQuantity} {wo.unit}
                        </div>
                        <div className="text-[10px] text-purple-900/80 font-bold mt-0.5">%{percent}</div>
                      </div>
                    </div>

                    <div className="mt-2.5 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          percent >= 100 ? "bg-emerald-500" : percent > 50 ? "bg-purple-600" : "bg-indigo-500"
                        }`}
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span>Başlangıç: {wo.plannedStartDate}</span>
                      <span>Termin: {wo.plannedDueDate}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Detailed Work Order Traveler & Control Station (7 Cols) */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-6">
          {selectedWorkOrder ? (
            <div className="bg-white rounded-2xl border border-purple-200/60 shadow-2xs p-4 sm:p-5 space-y-5">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-purple-100 gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-purple-100/80 text-purple-950 border border-purple-300/60 shadow-2xs">
                      {selectedWorkOrder.orderNumber}
                    </span>
                    {getStatusBadge(selectedWorkOrder.status)}
                    <span className="text-xs font-mono text-purple-900/80 bg-purple-50 px-2 py-0.5 rounded-md font-bold border border-purple-200/50">
                      Lot: {selectedWorkOrder.lotNumber}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1.5">
                    {selectedWorkOrder.productName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Reçete: {selectedWorkOrder.bomCode} • Depo: {selectedWorkOrder.targetWarehouseName}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenMesTerminal(selectedWorkOrder.id)}
                    className="bg-[#8252F6] hover:bg-[#7140e8] text-white font-bold text-xs py-2 px-3.5 rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>MES Terminali</span>
                  </button>
                  <button
                    onClick={() => setIsPrintModalOpen(true)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0"
                    title="Refakat Kartı Yazdır"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Yazdır</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons: Hammadde Çıkışı & Mamul Kabulü */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 sm:p-4 bg-purple-50/40 rounded-xl border border-purple-200/60">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 block">1. Hammadde Çıkışı</span>
                    <span className="text-[11px] text-slate-500">Depodan imalata transfer</span>
                  </div>
                  {selectedWorkOrder.isMaterialIssued ? (
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-lg flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Çıkış Yapıldı
                    </span>
                  ) : (
                    <button
                      onClick={() => onIssueMaterials(selectedWorkOrder.id)}
                      className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      Hammaddeyi Çıkar
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between sm:border-l sm:border-purple-200 sm:pl-4">
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 block">2. Mamul Depo Kabulü</span>
                    <span className="text-[11px] text-slate-500">Üretilen mamulün depoya girişi</span>
                  </div>
                  {selectedWorkOrder.isFinishedGoodReceived ? (
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-lg flex items-center gap-1">
                      <PackageCheck className="w-3.5 h-3.5 text-emerald-600" /> Depoya Alındı
                    </span>
                  ) : (
                    <button
                      onClick={() => onReceiveFinishedGoods(selectedWorkOrder.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      Mamulü Kabul Et
                    </button>
                  )}
                </div>
              </div>

              {/* Quantities & Dates Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 bg-purple-50/40 rounded-xl border border-purple-100">
                  <span className="text-[10px] text-purple-950/70 font-extrabold uppercase block">Planlanan</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900">
                    {selectedWorkOrder.plannedQuantity} {selectedWorkOrder.unit}
                  </span>
                </div>
                <div className="p-3 bg-purple-50/40 rounded-xl border border-purple-100">
                  <span className="text-[10px] text-purple-950/70 font-extrabold uppercase block">Üretilen</span>
                  <span className="text-xs sm:text-sm font-black text-emerald-700">
                    {selectedWorkOrder.producedQuantity} {selectedWorkOrder.unit}
                  </span>
                </div>
                <div className="p-3 bg-purple-50/40 rounded-xl border border-purple-100">
                  <span className="text-[10px] text-purple-950/70 font-extrabold uppercase block">Fire / Hurda</span>
                  <span className="text-xs sm:text-sm font-black text-rose-600">
                    {selectedWorkOrder.scrappedQuantity || 0} {selectedWorkOrder.unit}
                  </span>
                </div>
                <div className="p-3 bg-purple-50/40 rounded-xl border border-purple-100">
                  <span className="text-[10px] text-purple-950/70 font-extrabold uppercase block">Hedef Termin</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900">
                    {selectedWorkOrder.plannedDueDate}
                  </span>
                </div>
              </div>

              {/* Operations Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Üretim Operasyon Durumu & İstasyon Kayıtları
                </h4>

                <div className="space-y-2">
                  {(selectedWorkOrder.operations || []).length === 0 ? (
                    <div className="p-4 bg-purple-50/30 rounded-xl border border-purple-100 text-center text-xs text-slate-400 font-medium">
                      Operasyon tanımlanmadı.
                    </div>
                  ) : (
                    selectedWorkOrder.operations?.map((op, idx) => (
                      <div
                        key={op.id || idx}
                        className="p-3 rounded-xl border border-purple-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-2xs ${
                              op.status === "completed"
                                ? "bg-emerald-500"
                                : op.status === "in_progress"
                                ? "bg-purple-600 animate-pulse"
                                : "bg-slate-300 text-slate-700"
                            }`}
                          >
                            {op.status === "completed" ? "✓" : idx + 1}
                          </span>
                          <div>
                            <div className="font-extrabold text-slate-900">{op.operationName}</div>
                            <div className="text-[11px] text-slate-500">
                              {op.workstationName} • Operatör: {op.operatorName || "Atanmadı"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-[9px] text-slate-400 block font-semibold">Süre</span>
                            <span className="font-bold text-slate-900">
                              {op.actualDurationMinutes || 0} / {op.plannedDurationMinutes} dk
                            </span>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              op.status === "completed"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : op.status === "in_progress"
                                ? "bg-purple-50 text-purple-800 border border-purple-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {op.status === "completed"
                              ? "Tamamlandı"
                              : op.status === "in_progress"
                              ? "İşleniyor"
                              : "Bekliyor"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Allocated Raw Materials */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Rezerve & Tüketilen Hammaddeler
                </h4>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-xs border-separate border-spacing-y-1.5">
                    <thead>
                      <tr className="text-purple-950 font-extrabold uppercase tracking-wider text-[10px]">
                        <th className="pb-1 px-3">Hammadde Adı</th>
                        <th className="pb-1 px-3 text-right">Planlanan</th>
                        <th className="pb-1 px-3 text-right">Harcanan</th>
                        <th className="pb-1 px-3 text-right">Birim Fiyat</th>
                        <th className="pb-1 px-3 text-right">Tutar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedWorkOrder.allocatedMaterials?.map((mat, idx) => (
                        <tr key={mat.id || idx} className="bg-purple-50/30 rounded-xl">
                          <td className="py-2 px-3 rounded-l-xl border-y border-l border-purple-100">
                            <span className="font-extrabold text-slate-900">{mat.productName}</span>
                            <span className="text-[10px] text-purple-900/70 block font-mono font-bold">{mat.productCode}</span>
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-slate-700 border-y border-purple-100">
                            {mat.plannedQuantity} {mat.unit}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900 border-y border-purple-100">
                            {mat.consumedQuantity} {mat.unit}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-600 border-y border-purple-100">{mat.unitCost} ₺</td>
                          <td className="py-2 px-3 text-right font-black text-purple-950 font-mono rounded-r-xl border-y border-r border-purple-100">
                            {(mat.consumedQuantity > 0 ? mat.consumedQuantity : mat.plannedQuantity) *
                              mat.unitCost}{" "}
                            ₺
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-purple-200/60 p-12 text-center text-slate-400 text-xs font-semibold">
              Detayları görüntülemek için bir iş emri seçin.
            </div>
          )}
        </div>
      </div>

      {/* New Work Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-purple-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-purple-50 via-fuchsia-50/40 to-slate-50 p-4 sm:p-5 border-b border-purple-200/60 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">Yeni İş Emri Başlat</h3>
                <p className="text-xs text-purple-950/80 mt-0.5">
                  Üretim emri açma, lot numaralandırma ve rota bağlama sihirbazı.
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
                  <label className="text-xs font-bold text-slate-700 block mb-1">İş Emri No *</label>
                  <input
                    type="text"
                    required
                    value={editingWo.orderNumber || ""}
                    onChange={(e) => setEditingWo({ ...editingWo, orderNumber: e.target.value })}
                    className="w-full bg-white border border-purple-200/70 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Parti / Lot No</label>
                  <input
                    type="text"
                    required
                    value={editingWo.lotNumber || ""}
                    onChange={(e) => setEditingWo({ ...editingWo, lotNumber: e.target.value })}
                    className="w-full bg-white border border-purple-200/70 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Öncelik</label>
                  <select
                    value={editingWo.priority}
                    onChange={(e) => setEditingWo({ ...editingWo, priority: e.target.value as any })}
                    className="w-full bg-white border border-purple-200/70 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                  >
                    <option value="low">Düşük</option>
                    <option value="medium">Normal</option>
                    <option value="high">Yüksek</option>
                    <option value="urgent">Acil</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Üretilecek Reçete (BOM) *</label>
                  <select
                    value={editingWo.bomId}
                    onChange={(e) => {
                      const selectedB = boms.find((b) => b.id === e.target.value);
                      if (selectedB) {
                        setEditingWo({
                          ...editingWo,
                          bomId: selectedB.id,
                          bomCode: selectedB.bomCode,
                          productId: selectedB.productId,
                          productName: selectedB.productName,
                          productCode: selectedB.productCode,
                          routingId: selectedB.routingId || routings[0]?.id || "",
                          unit: selectedB.outputUnit || "Adet",
                        });
                      }
                    }}
                    className="w-full bg-white border border-purple-200/70 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                  >
                    {boms.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bomCode} - {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Üretim Rotası</label>
                  <select
                    value={editingWo.routingId}
                    onChange={(e) => setEditingWo({ ...editingWo, routingId: e.target.value })}
                    className="w-full bg-white border border-purple-200/70 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                  >
                    {routings.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.routingCode} - {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Planlanan Miktar *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editingWo.plannedQuantity || 1}
                    onChange={(e) => setEditingWo({ ...editingWo, plannedQuantity: parseInt(e.target.value) || 1 })}
                    className="w-full bg-white border border-purple-200/70 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Başlama Tarihi</label>
                  <input
                    type="date"
                    value={editingWo.plannedStartDate || ""}
                    onChange={(e) => setEditingWo({ ...editingWo, plannedStartDate: e.target.value })}
                    className="w-full bg-white border border-purple-200/70 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Teslim / Termin Tarihi</label>
                  <input
                    type="date"
                    value={editingWo.plannedDueDate || ""}
                    onChange={(e) => setEditingWo({ ...editingWo, plannedDueDate: e.target.value })}
                    className="w-full bg-white border border-purple-200/70 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Müşteri / Proje Adı (Opsiyonel)</label>
                <input
                  type="text"
                  placeholder="Örn: Anadolu Holding Genel Merkez Projesi"
                  value={editingWo.customerName || ""}
                  onChange={(e) => setEditingWo({ ...editingWo, customerName: e.target.value })}
                  className="w-full bg-white border border-purple-200/70 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Üretim Notları</label>
                <textarea
                  rows={2}
                  placeholder="Operatör ve hat liderlerine talimatlar..."
                  value={editingWo.notes || ""}
                  onChange={(e) => setEditingWo({ ...editingWo, notes: e.target.value })}
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
                  İş Emrini Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refakat Kartı Print / Preview Modal */}
      {isPrintModalOpen && selectedWorkOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-purple-200 text-slate-900 print:p-0">
            <div className="flex items-center justify-between pb-4 border-b border-purple-100">
              <div className="flex items-center gap-3">
                <Barcode className="w-8 h-8 text-purple-700" />
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900">ÜRETİM REFAKAT & İŞ EMRİ KARTI</h2>
                  <p className="text-xs text-purple-900/70 font-semibold">ERP MES / MRP II Üretim Belgesi</p>
                </div>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-purple-50/40 rounded-xl border border-purple-100">
                <div>
                  <span className="text-[10px] text-purple-950/70 font-extrabold uppercase block">İş Emri No</span>
                  <span className="font-mono text-sm sm:text-base font-black text-slate-900">
                    {selectedWorkOrder.orderNumber}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-purple-950/70 font-extrabold uppercase block">Parti / Lot Numarası</span>
                  <span className="font-mono text-sm sm:text-base font-black text-purple-950">
                    {selectedWorkOrder.lotNumber}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-purple-950/70 font-extrabold uppercase block">Mamul Ürün</span>
                  <span className="font-bold text-slate-900">{selectedWorkOrder.productName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-purple-950/70 font-extrabold uppercase block">Miktar & Birim</span>
                  <span className="font-black text-slate-900">
                    {selectedWorkOrder.plannedQuantity} {selectedWorkOrder.unit}
                  </span>
                </div>
              </div>

              {/* Barcode representation */}
              <div className="text-center py-3 bg-purple-50/30 rounded-xl border border-dashed border-purple-300">
                <div className="font-mono text-2xl tracking-[0.3em] font-black text-slate-900">
                  ||||| | |||| || |||||| | |||||
                </div>
                <div className="font-mono text-xs text-purple-950 mt-1 font-bold">
                  *{selectedWorkOrder.barcode || selectedWorkOrder.orderNumber}*
                </div>
              </div>

              {/* Operations Checklist */}
              <div>
                <h4 className="font-extrabold text-slate-900 mb-2 uppercase text-[11px]">
                  İstasyon Sırası & Kalite İmza Tablosu
                </h4>
                <table className="w-full border border-purple-200 rounded-xl overflow-hidden text-left text-[11px]">
                  <thead>
                    <tr className="bg-purple-50/70 font-extrabold text-purple-950 border-b border-purple-200">
                      <th className="p-2">Sıra</th>
                      <th className="p-2">Operasyon</th>
                      <th className="p-2">İş İstasyonu</th>
                      <th className="p-2">Operatör</th>
                      <th className="p-2">Kalite Onay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100">
                    {selectedWorkOrder.operations?.map((op, i) => (
                      <tr key={i}>
                        <td className="p-2 font-mono font-bold text-purple-950">#{op.sequence}</td>
                        <td className="p-2 font-bold text-slate-900">{op.operationName}</td>
                        <td className="p-2 text-slate-600">{op.workstationName}</td>
                        <td className="p-2 text-slate-500">{op.operatorName || "_______________"}</td>
                        <td className="p-2 text-slate-500 font-semibold">[ &nbsp; ] İMZA / KAŞE</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-4 border-t border-purple-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">Tarih: {new Date().toLocaleDateString("tr-TR")}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#8252F6] hover:bg-[#7140e8] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <Printer className="w-4 h-4" /> Yazdır (Print)
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
