import React, { useState } from "react";
import {
  BillOfMaterials,
  Routing,
  Workstation,
  WorkOrder,
  SubcontractOrder,
  Product,
  Warehouse,
  Branch,
  Contact,
  Order,
  MrpRecommendation,
} from "../../types";
import { ProductionOverview } from "./ProductionOverview";
import { BomManagement } from "./BomManagement";
import { RoutingManagement } from "./RoutingManagement";
import { WorkstationManagement } from "./WorkstationManagement";
import { WorkOrderManagement } from "./WorkOrderManagement";
import { SubcontractManagement } from "./SubcontractManagement";
import { MrpEngineModal } from "./MrpEngineModal";
import { MesOperatorTerminal } from "./MesOperatorTerminal";
import { ProductionGanttCalendar } from "./ProductionGanttCalendar";
import { MachineCapacityD3Analytics } from "./MachineCapacityD3Analytics";
import {
  LayoutDashboard,
  Boxes,
  TrendingUp,
  Cpu,
  Layers,
  Truck,
  Sparkles,
  Play,
  Factory,
  CalendarRange,
  BarChart3,
} from "lucide-react";

export type ProductionSubTab =
  | "overview"
  | "capacity_d3"
  | "calendar"
  | "boms"
  | "routings"
  | "workstations"
  | "work_orders"
  | "subcontract";

interface ProductionModuleProps {
  boms: BillOfMaterials[];
  routings: Routing[];
  workstations: Workstation[];
  workOrders: WorkOrder[];
  subcontractOrders: SubcontractOrder[];
  products: Product[];
  warehouses: Warehouse[];
  branches: Branch[];
  contacts: Contact[];
  orders: Order[];
  initialSubTab?: ProductionSubTab;
  onSaveBom: (bom: BillOfMaterials) => void;
  onDeleteBom: (bomId: string) => void;
  onSaveRouting: (routing: Routing) => void;
  onDeleteRouting: (routingId: string) => void;
  onSaveWorkstation: (ws: Workstation) => void;
  onDeleteWorkstation: (wsId: string) => void;
  onSaveWorkOrder: (wo: WorkOrder) => void;
  onDeleteWorkOrder: (woId: string) => void;
  onSaveSubcontractOrder: (order: SubcontractOrder) => void;
  onReceiveSubcontract: (orderId: string, receivedQty: number, scrapQty: number) => void;
  onIssueMaterials: (woId: string) => void;
  onReceiveFinishedGoods: (woId: string) => void;
  onCreateWorkOrderFromMrp: (rec: MrpRecommendation) => void;
  onCreatePurchaseOrderFromMrp: (rec: MrpRecommendation) => void;
}

export const ProductionModule: React.FC<ProductionModuleProps> = ({
  boms,
  routings,
  workstations,
  workOrders,
  subcontractOrders,
  products,
  warehouses,
  branches,
  contacts,
  orders,
  initialSubTab = "overview",
  onSaveBom,
  onDeleteBom,
  onSaveRouting,
  onDeleteRouting,
  onSaveWorkstation,
  onDeleteWorkstation,
  onSaveWorkOrder,
  onDeleteWorkOrder,
  onSaveSubcontractOrder,
  onReceiveSubcontract,
  onIssueMaterials,
  onReceiveFinishedGoods,
  onCreateWorkOrderFromMrp,
  onCreatePurchaseOrderFromMrp,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<ProductionSubTab>(initialSubTab);
  const [isMrpOpen, setIsMrpOpen] = useState(false);
  const [isMesTerminalOpen, setIsMesTerminalOpen] = useState(false);
  const [mesInitialWoId, setMesInitialWoId] = useState<string | undefined>(undefined);

  const subTabs = [
    { id: "overview" as const, label: "Üretim Özeti & KPI", icon: LayoutDashboard },
    {
      id: "capacity_d3" as const,
      label: "Kapasite & OEE Grafikleri (D3)",
      icon: BarChart3,
    },
    {
      id: "calendar" as const,
      label: "Planlama & Gantt Takvimi",
      icon: CalendarRange,
      count: workOrders.filter((w) => w.status !== "completed").length,
    },
    { id: "boms" as const, label: "Ürün Reçeteleri (BOM)", icon: Boxes, count: boms.length },
    { id: "routings" as const, label: "Operasyon & Rota", icon: TrendingUp, count: routings.length },
    { id: "workstations" as const, label: "İş İstasyonları & Tezgah", icon: Cpu, count: workstations.length },
    {
      id: "work_orders" as const,
      label: "İş Emirleri",
      icon: Layers,
      count: workOrders.filter((w) => w.status !== "completed").length,
    },
    {
      id: "subcontract" as const,
      label: "Fason Takibi",
      icon: Truck,
      count: subcontractOrders.filter((s) => s.status !== "completed").length,
    },
  ];

  const handleOpenMesTerminal = (woId?: string) => {
    setMesInitialWoId(woId);
    setIsMesTerminalOpen(true);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Top Header Controls (Lila Bal Peteği & Geometrik Desen) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-50 via-fuchsia-50/40 to-slate-50/80 rounded-2xl p-5 border border-purple-200/60 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Lila Bal Peteği ve Geometrik Desen Kaplaması */}
        <div
          className="absolute inset-0 pointer-events-none opacity-15 mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='42' viewBox='0 0 24 42'%3E%3Cg fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 0l12 7v14l-12 7L0 21V7z M12 21l12 7v14l-12 7L0 42V28z' stroke='%239333ea' stroke-width='1' stroke-opacity='0.4'/%3E%3Cpath d='M0 7l12 7 12-7 M0 28l12 7 12-7 M12 0v14 M12 21v14' stroke='%23a855f7' stroke-width='0.7' stroke-opacity='0.3' stroke-dasharray='2,2'/%3E%3Cpath d='M0 0l24 42 M24 0L0 42' stroke='%23c084fc' stroke-width='0.4' stroke-opacity='0.2'/%3E%3Ccircle cx='12' cy='14' r='1.2' fill='%237e22ce' fill-opacity='0.5' stroke='none'/%3E%3Ccircle cx='0' cy='21' r='1' fill='%23a855f7' fill-opacity='0.5' stroke='none'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "20px 35px",
          }}
        />

        {/* Dekoratif Geometrik Vektör Şekiller */}
        <svg
          className="absolute -right-6 -bottom-10 w-48 h-48 pointer-events-none text-purple-400/10"
          viewBox="0 0 200 200"
          fill="none"
        >
          <polygon points="100,10 180,55 180,145 100,190 20,145 20,55" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
          <polygon points="100,35 155,67 155,133 100,165 45,133 45,67" stroke="currentColor" strokeWidth="1" />
          <line x1="100" y1="10" x2="100" y2="190" stroke="currentColor" strokeWidth="0.8" />
          <line x1="20" y1="55" x2="180" y2="145" stroke="currentColor" strokeWidth="0.8" />
          <line x1="20" y1="145" x2="180" y2="55" stroke="currentColor" strokeWidth="0.8" />
          <circle cx="100" cy="100" r="25" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
        </svg>

        <svg
          className="absolute -left-10 -top-12 w-40 h-40 pointer-events-none text-fuchsia-500/20"
          viewBox="0 0 160 160"
          fill="none"
        >
          <polygon points="80,10 150,80 80,150 10,80" stroke="currentColor" strokeWidth="1.2" />
          <polygon points="80,30 130,80 80,130 30,80" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" />
          <line x1="80" y1="10" x2="80" y2="150" stroke="currentColor" strokeWidth="0.6" />
          <line x1="10" y1="80" x2="150" y2="80" stroke="currentColor" strokeWidth="0.6" />
        </svg>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold tracking-widest text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-md border border-purple-300/60 uppercase">
              MES & MRP II ÜRETİM SİSTEMİ
            </span>
          </div>
          <h2 className="text-lg font-extrabold text-slate-950">
            Üretim & İmalat Yönetimi (BOM, Rota & İş Emirleri)
          </h2>
          <p className="text-xs font-semibold text-purple-950/90 mt-1 leading-relaxed">
            Çok katmanlı ürün reçeteleri (BOM), rota & istasyon planlama, parti/lot takibi, fason irsaliyesi ve MRP II planlama.
          </p>
        </div>

        {/* Global Action Modals Trigger */}
        <div className="relative z-10 flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            onClick={() => setIsMrpOpen(true)}
            className="bg-purple-700/15 hover:bg-purple-700/25 text-purple-950 border border-purple-400/50 backdrop-blur-md font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-all shrink-0"
          >
            <Sparkles className="w-4 h-4 text-purple-800 font-bold" />
            <span>MRP II Hesapla & Öner</span>
          </button>

          <button
            onClick={() => handleOpenMesTerminal()}
            className="bg-[#8252F6] hover:bg-[#7140e8] text-white font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>MES Operatör Terminali</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs (Cari Hesaplar Filter Tab Style) */}
      <div className="flex items-center gap-1.5 bg-purple-50/50 p-1.5 rounded-xl border border-purple-200/50 text-xs font-semibold shadow-2xs overflow-x-auto custom-scrollbar w-full whitespace-nowrap">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? "bg-white text-purple-950 font-bold shadow-2xs border border-purple-200/60"
                  : "text-purple-900/70 hover:text-purple-950"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-purple-700" : "text-purple-400"}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${
                    isActive
                      ? "bg-purple-100 text-purple-950 border border-purple-300/60"
                      : "bg-white/80 text-purple-900/80 border border-purple-200/40"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeSubTab === "overview" && (
        <ProductionOverview
          boms={boms}
          routings={routings}
          workstations={workstations}
          workOrders={workOrders}
          subcontractOrders={subcontractOrders}
          onOpenBomTab={() => setActiveSubTab("boms")}
          onOpenWorkOrderTab={() => setActiveSubTab("work_orders")}
          onOpenWorkstationTab={() => setActiveSubTab("workstations")}
          onOpenSubcontractTab={() => setActiveSubTab("subcontract")}
          onOpenCalendarTab={() => setActiveSubTab("calendar")}
          onOpenCapacityD3Tab={() => setActiveSubTab("capacity_d3")}
          onOpenMesTerminal={handleOpenMesTerminal}
          onOpenMrpModal={() => setIsMrpOpen(true)}
        />
      )}

      {activeSubTab === "capacity_d3" && (
        <MachineCapacityD3Analytics
          workOrders={workOrders}
          workstations={workstations}
          boms={boms}
          routings={routings}
          onOpenWorkOrderTab={() => setActiveSubTab("work_orders")}
          onOpenWorkstationTab={() => setActiveSubTab("workstations")}
          onOpenMesTerminal={handleOpenMesTerminal}
        />
      )}

      {activeSubTab === "calendar" && (
        <ProductionGanttCalendar
          workOrders={workOrders}
          workstations={workstations}
          boms={boms}
          routings={routings}
          onOpenMesTerminal={handleOpenMesTerminal}
          onUpdateWorkOrder={onSaveWorkOrder}
        />
      )}

      {activeSubTab === "boms" && (
        <BomManagement
          boms={boms}
          products={products}
          routings={routings}
          onSaveBom={onSaveBom}
          onDeleteBom={onDeleteBom}
        />
      )}

      {activeSubTab === "routings" && (
        <RoutingManagement
          routings={routings}
          workstations={workstations}
          contacts={contacts}
          onSaveRouting={onSaveRouting}
          onDeleteRouting={onDeleteRouting}
        />
      )}

      {activeSubTab === "workstations" && (
        <WorkstationManagement
          workstations={workstations}
          branches={branches}
          warehouses={warehouses}
          onSaveWorkstation={onSaveWorkstation}
          onDeleteWorkstation={onDeleteWorkstation}
        />
      )}

      {activeSubTab === "work_orders" && (
        <WorkOrderManagement
          workOrders={workOrders}
          boms={boms}
          routings={routings}
          products={products}
          warehouses={warehouses}
          workstations={workstations}
          onSaveWorkOrder={onSaveWorkOrder}
          onDeleteWorkOrder={onDeleteWorkOrder}
          onOpenMesTerminal={handleOpenMesTerminal}
          onIssueMaterials={onIssueMaterials}
          onReceiveFinishedGoods={onReceiveFinishedGoods}
        />
      )}

      {activeSubTab === "subcontract" && (
        <SubcontractManagement
          subcontractOrders={subcontractOrders}
          contacts={contacts}
          workOrders={workOrders}
          products={products}
          onSaveSubcontractOrder={onSaveSubcontractOrder}
          onReceiveSubcontract={onReceiveSubcontract}
        />
      )}

      {/* MRP Engine Modal */}
      <MrpEngineModal
        isOpen={isMrpOpen}
        onClose={() => setIsMrpOpen(false)}
        boms={boms}
        products={products}
        orders={orders}
        workOrders={workOrders}
        onCreateWorkOrderFromMrp={onCreateWorkOrderFromMrp}
        onCreatePurchaseOrderFromMrp={onCreatePurchaseOrderFromMrp}
      />

      {/* MES Operator Terminal Modal */}
      <MesOperatorTerminal
        isOpen={isMesTerminalOpen}
        onClose={() => setIsMesTerminalOpen(false)}
        workOrders={workOrders}
        workstations={workstations}
        initialWorkOrderId={mesInitialWoId}
        onUpdateWorkOrder={onSaveWorkOrder}
        onUpdateWorkstation={onSaveWorkstation}
      />
    </div>
  );
};
