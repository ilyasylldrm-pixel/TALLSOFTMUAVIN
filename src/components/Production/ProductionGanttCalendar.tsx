import React, { useState, useMemo } from "react";
import {
  WorkOrder,
  Workstation,
  Routing,
  BillOfMaterials,
  WorkOrderOperation,
  WorkOrderStatus,
  WorkOrderPriority,
} from "../../types";
import {
  Calendar,
  CalendarDays,
  Clock,
  Cpu,
  Layers,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Play,
  User,
  SlidersHorizontal,
  ArrowRight,
  TrendingUp,
  Boxes,
  Zap,
  Info,
  X,
  Maximize2,
  BarChart3,
  Factory,
} from "lucide-react";

export type GanttViewMode = "workstation_gantt" | "work_order_gantt" | "month_calendar" | "week_calendar";

interface ProductionGanttCalendarProps {
  workOrders: WorkOrder[];
  workstations: Workstation[];
  boms: BillOfMaterials[];
  routings: Routing[];
  onOpenMesTerminal: (workOrderId?: string) => void;
  onOpenWorkOrderDetails?: (wo: WorkOrder) => void;
  onUpdateWorkOrder?: (wo: WorkOrder) => void;
}

export const ProductionGanttCalendar: React.FC<ProductionGanttCalendarProps> = ({
  workOrders,
  workstations,
  boms,
  routings,
  onOpenMesTerminal,
  onOpenWorkOrderDetails,
  onUpdateWorkOrder,
}) => {
  const [viewMode, setViewMode] = useState<GanttViewMode>("workstation_gantt");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [horizonDays, setHorizonDays] = useState<number>(14); // 7, 14, 30, 60
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedWorkstationId, setSelectedWorkstationId] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>("all");

  // Selected Work Order for Quick Detail Modal
  const [inspectingWo, setInspectingWo] = useState<WorkOrder | null>(null);
  const [inspectingOp, setInspectingOp] = useState<WorkOrderOperation | null>(null);

  // Helper date generators
  const baseStartDate = useMemo(() => {
    const d = new Date(selectedDate);
    if (viewMode === "month_calendar") {
      // Start from 1st day of month
      return new Date(d.getFullYear(), d.getMonth(), 1);
    } else if (viewMode === "week_calendar") {
      // Start from Monday of current week
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(d.setDate(diff));
    }
    // For Gantt, start from 2 days before today or selectedDate
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - 1);
    return start;
  }, [selectedDate, viewMode]);

  // Generate Timeline Days Array for Gantt
  const timelineDays = useMemo(() => {
    const count = viewMode === "week_calendar" ? 7 : horizonDays;
    const days: Date[] = [];
    const curr = new Date(baseStartDate);

    for (let i = 0; i < count; i++) {
      days.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }
    return days;
  }, [baseStartDate, horizonDays, viewMode]);

  // Generate Days for Month Calendar
  const monthCalendarGrid = useMemo(() => {
    if (viewMode !== "month_calendar") return [];

    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // 0 is Monday
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const calendarCells: { date: Date; isCurrentMonth: boolean; dateString: string }[] = [];

    // Prev month trailing days
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDate - i);
      calendarCells.push({
        date: d,
        isCurrentMonth: false,
        dateString: d.toISOString().split("T")[0],
      });
    }

    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const d = new Date(year, month, i);
      calendarCells.push({
        date: d,
        isCurrentMonth: true,
        dateString: d.toISOString().split("T")[0],
      });
    }

    // Next month leading days to complete 35 or 42 grid
    const remaining = (7 - (calendarCells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      calendarCells.push({
        date: d,
        isCurrentMonth: false,
        dateString: d.toISOString().split("T")[0],
      });
    }

    return calendarCells;
  }, [selectedDate, viewMode]);

  // Filtered Work Orders
  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      const matchSearch =
        wo.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wo.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (wo.customerName && wo.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (wo.lotNumber && wo.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus =
        selectedStatusFilter === "all" || wo.status === selectedStatusFilter;

      const matchPriority =
        selectedPriorityFilter === "all" || wo.priority === selectedPriorityFilter;

      const matchWorkstation =
        selectedWorkstationId === "all" ||
        wo.operations?.some((op) => op.workstationId === selectedWorkstationId);

      return matchSearch && matchStatus && matchPriority && matchWorkstation;
    });
  }, [workOrders, searchTerm, selectedStatusFilter, selectedPriorityFilter, selectedWorkstationId]);

  // Calculate machine capacity loads per day
  const workstationDailyLoads = useMemo(() => {
    const loads: Record<string, Record<string, { totalMinutes: number; operations: { wo: WorkOrder; op: WorkOrderOperation }[] }>> = {};

    workstations.forEach((ws) => {
      loads[ws.id] = {};
    });

    filteredWorkOrders.forEach((wo) => {
      const startDate = new Date(wo.plannedStartDate);
      const dueDate = new Date(wo.plannedDueDate);
      const dayCount = Math.max(
        1,
        Math.round((dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      );

      wo.operations?.forEach((op) => {
        if (!loads[op.workstationId]) {
          loads[op.workstationId] = {};
        }

        // Distribute operation duration across the planned dates
        const minutesPerDay = (op.plannedDurationMinutes || 120) / dayCount;

        const curr = new Date(startDate);
        for (let i = 0; i < dayCount; i++) {
          const dateStr = curr.toISOString().split("T")[0];
          if (!loads[op.workstationId][dateStr]) {
            loads[op.workstationId][dateStr] = { totalMinutes: 0, operations: [] };
          }
          loads[op.workstationId][dateStr].totalMinutes += minutesPerDay;
          loads[op.workstationId][dateStr].operations.push({ wo, op });
          curr.setDate(curr.getDate() + 1);
        }
      });
    });

    return loads;
  }, [workstations, filteredWorkOrders]);

  // Overall Statistics for Gantt
  const stats = useMemo(() => {
    const activeWos = filteredWorkOrders.filter((w) => w.status !== "completed" && w.status !== "cancelled");
    const inProgressCount = activeWos.filter((w) => w.status === "in_progress").length;
    const plannedCount = activeWos.filter((w) => w.status === "planned" || w.status === "material_issued").length;
    const qcCount = activeWos.filter((w) => w.status === "quality_control").length;

    // Detect Bottlenecks / Overloads
    let overloadCount = 0;
    Object.entries(workstationDailyLoads).forEach(([wsId, daysMap]) => {
      const ws = workstations.find((w) => w.id === wsId);
      const capacityHours = ws?.standardCapacityHoursPerDay || 8;
      const capacityMinutes = capacityHours * 60;

      Object.values(daysMap).forEach((dayData) => {
        if (dayData.totalMinutes > capacityMinutes) {
          overloadCount++;
        }
      });
    });

    return {
      totalActive: activeWos.length,
      inProgressCount,
      plannedCount,
      qcCount,
      overloadCount,
    };
  }, [filteredWorkOrders, workstationDailyLoads, workstations]);

  // Date Navigation Handlers
  const handlePrevDate = () => {
    const newD = new Date(selectedDate);
    if (viewMode === "month_calendar") {
      newD.setMonth(newD.getMonth() - 1);
    } else if (viewMode === "week_calendar") {
      newD.setDate(newD.getDate() - 7);
    } else {
      newD.setDate(newD.getDate() - horizonDays);
    }
    setSelectedDate(newD);
  };

  const handleNextDate = () => {
    const newD = new Date(selectedDate);
    if (viewMode === "month_calendar") {
      newD.setMonth(newD.getMonth() + 1);
    } else if (viewMode === "week_calendar") {
      newD.setDate(newD.getDate() + 7);
    } else {
      newD.setDate(newD.getDate() + horizonDays);
    }
    setSelectedDate(newD);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const formatDateHeader = (d: Date) => {
    const dayName = d.toLocaleDateString("tr-TR", { weekday: "short" });
    const dayNum = d.getDate();
    const monthName = d.toLocaleDateString("tr-TR", { month: "short" });
    return { dayName, dayNum, monthName };
  };

  const isToday = (d: Date) => {
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const isWeekend = (d: Date) => {
    const day = d.getDay();
    return day === 0 || day === 6;
  };

  const getStatusColorClass = (status: WorkOrderStatus) => {
    switch (status) {
      case "in_progress":
        return "bg-purple-600 border-purple-400 text-white shadow-purple-500/30";
      case "planned":
        return "bg-indigo-600 border-indigo-400 text-white shadow-indigo-500/30";
      case "material_issued":
        return "bg-blue-600 border-blue-400 text-white shadow-blue-500/30";
      case "quality_control":
        return "bg-amber-600 border-amber-400 text-white shadow-amber-500/30";
      case "completed":
        return "bg-emerald-600 border-emerald-400 text-white shadow-emerald-500/30";
      case "paused":
        return "bg-rose-600 border-rose-400 text-white shadow-rose-500/30";
      default:
        return "bg-slate-700 border-slate-500 text-white";
    }
  };

  const getPriorityBadge = (p: WorkOrderPriority) => {
    switch (p) {
      case "urgent":
        return { label: "Acil", bg: "bg-rose-100 text-rose-800 border-rose-200" };
      case "high":
        return { label: "Yüksek", bg: "bg-amber-100 text-amber-900 border-amber-200" };
      case "medium":
        return { label: "Normal", bg: "bg-purple-100 text-purple-900 border-purple-200" };
      default:
        return { label: "Düşük", bg: "bg-slate-100 text-slate-700 border-slate-200" };
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner KPI / Bottleneck Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-purple-200/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-purple-950/70">
              Aktif Çizelgelenen İşler
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200/60">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900">{stats.totalActive}</span>
            <span className="text-xs text-purple-700 font-bold">İş Emri</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-purple-200/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-purple-950/70">
              Tezgâhta / Üretimde
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60">
              <Play className="w-3.5 h-3.5 fill-emerald-700" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-800">{stats.inProgressCount}</span>
            <span className="text-xs text-emerald-700 font-bold">Anlık İmalatta</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-purple-200/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-purple-950/70">
              Planlanan & Sıradaki
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200/60">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-indigo-900">{stats.plannedCount}</span>
            <span className="text-xs text-indigo-700 font-bold">Hazır / Rezerve</span>
          </div>
        </div>

        <div className={`p-3.5 sm:p-4 rounded-2xl border shadow-2xs transition-all ${
          stats.overloadCount > 0 ? "bg-amber-50/60 border-amber-300" : "bg-white border-purple-200/60"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-amber-950/80">
              Kapasite Darboğaz Uyarısı
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
              stats.overloadCount > 0
                ? "bg-amber-100 text-amber-800 border-amber-300"
                : "bg-purple-50 text-purple-700 border-purple-200/60"
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-xl sm:text-2xl font-black ${stats.overloadCount > 0 ? "text-amber-900" : "text-slate-900"}`}>
              {stats.overloadCount}
            </span>
            <span className="text-xs text-amber-800 font-bold">
              {stats.overloadCount > 0 ? "Günlük Aşım Var" : "Tüm Tezgâhlar Dengeli"}
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar: View Switcher, Date Nav, Filters */}
      <div className="bg-white rounded-2xl p-4 border border-purple-200/60 shadow-2xs space-y-3">
        {/* Row 1: View Modes & Date Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Mode Switcher Buttons */}
          <div className="flex items-center gap-1 bg-purple-50/60 p-1 rounded-xl border border-purple-200/50 text-xs font-bold overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setViewMode("workstation_gantt")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                viewMode === "workstation_gantt"
                  ? "bg-[#8252F6] text-white shadow-xs"
                  : "text-purple-900/80 hover:bg-purple-100/60"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Tezgâh Gantt Planı</span>
            </button>

            <button
              onClick={() => setViewMode("work_order_gantt")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                viewMode === "work_order_gantt"
                  ? "bg-[#8252F6] text-white shadow-xs"
                  : "text-purple-900/80 hover:bg-purple-100/60"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>İş Emri Gantt Planı</span>
            </button>

            <button
              onClick={() => setViewMode("month_calendar")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                viewMode === "month_calendar"
                  ? "bg-[#8252F6] text-white shadow-xs"
                  : "text-purple-900/80 hover:bg-purple-100/60"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Aylık Takvim</span>
            </button>

            <button
              onClick={() => setViewMode("week_calendar")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                viewMode === "week_calendar"
                  ? "bg-[#8252F6] text-white shadow-xs"
                  : "text-purple-900/80 hover:bg-purple-100/60"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Haftalık Matris</span>
            </button>
          </div>

          {/* Date Navigator */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevDate}
              className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200/60 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleToday}
              className="px-3 py-1.5 rounded-xl bg-purple-100/80 hover:bg-purple-200/80 text-purple-950 font-extrabold text-xs border border-purple-300/60 transition-colors cursor-pointer"
            >
              Bugün
            </button>

            <div className="font-extrabold text-xs sm:text-sm text-slate-900 min-w-[160px] text-center">
              {viewMode === "month_calendar"
                ? selectedDate.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })
                : `${timelineDays[0]?.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} - ${timelineDays[timelineDays.length - 1]?.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}`}
            </div>

            <button
              onClick={handleNextDate}
              className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200/60 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Horizon Picker for Gantt */}
            {(viewMode === "workstation_gantt" || viewMode === "work_order_gantt") && (
              <div className="hidden sm:flex items-center gap-1 ml-2 pl-2 border-l border-purple-200">
                {[7, 14, 30].map((days) => (
                  <button
                    key={days}
                    onClick={() => setHorizonDays(days)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      horizonDays === days
                        ? "bg-purple-900 text-white shadow-2xs"
                        : "bg-purple-50/60 text-purple-900 hover:bg-purple-100"
                    }`}
                  >
                    {days}G
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Search and Specific Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-purple-100">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="İş emri no, ürün veya lot ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-purple-50/30 text-slate-900 placeholder-slate-400 text-xs rounded-xl pl-8 pr-3 py-1.5 border border-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
            />
          </div>

          <div>
            <select
              value={selectedWorkstationId}
              onChange={(e) => setSelectedWorkstationId(e.target.value)}
              className="w-full bg-purple-50/30 text-slate-800 text-xs rounded-xl px-3 py-1.5 border border-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
            >
              <option value="all">Tüm İş İstasyonları / Tezgâhlar</option>
              {workstations.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.code} - {ws.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full bg-purple-50/30 text-slate-800 text-xs rounded-xl px-3 py-1.5 border border-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
            >
              <option value="all">Tüm İş Emri Durumları</option>
              <option value="planned">Planlandı</option>
              <option value="material_issued">Hammadde Rezerve</option>
              <option value="in_progress">Üretimde (Tezgâhta)</option>
              <option value="quality_control">Kalite Kontrol</option>
              <option value="completed">Tamamlandı</option>
            </select>
          </div>

          <div>
            <select
              value={selectedPriorityFilter}
              onChange={(e) => setSelectedPriorityFilter(e.target.value)}
              className="w-full bg-purple-50/30 text-slate-800 text-xs rounded-xl px-3 py-1.5 border border-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
            >
              <option value="all">Tüm Öncelikler</option>
              <option value="urgent">Acil Öncelikli</option>
              <option value="high">Yüksek Öncelikli</option>
              <option value="medium">Normal Öncelikli</option>
              <option value="low">Düşük Öncelikli</option>
            </select>
          </div>
        </div>
      </div>

      {/* VIEW 1: WORKSTATION-CENTRIC GANTT TIMELINE */}
      {viewMode === "workstation_gantt" && (
        <div className="bg-white rounded-2xl border border-purple-200/60 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <div className="min-w-[900px]">
              {/* Gantt Timeline Header */}
              <div className="grid grid-cols-12 bg-purple-50/70 border-b border-purple-200/80 sticky top-0 z-20">
                {/* Left Title: Workstation Info */}
                <div className="col-span-3 p-3 font-extrabold text-[11px] text-purple-950 uppercase tracking-wider border-r border-purple-200/80 flex items-center justify-between">
                  <span>İş İstasyonu / Tezgâh</span>
                  <span className="text-[10px] text-purple-700 font-normal">OEE & Kapasite</span>
                </div>

                {/* Right Date Columns */}
                <div className="col-span-9 grid" style={{ gridTemplateColumns: `repeat(${timelineDays.length}, minmax(0, 1fr))` }}>
                  {timelineDays.map((d, idx) => {
                    const { dayName, dayNum, monthName } = formatDateHeader(d);
                    const today = isToday(d);
                    const weekend = isWeekend(d);

                    return (
                      <div
                        key={idx}
                        className={`p-2 text-center border-r border-purple-200/50 flex flex-col items-center justify-center transition-colors ${
                          today
                            ? "bg-purple-200/60 font-black text-purple-950"
                            : weekend
                            ? "bg-slate-100/50 text-slate-500"
                            : "text-slate-700"
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold">{dayName}</span>
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold my-0.5 ${
                            today ? "bg-[#8252F6] text-white shadow-2xs" : ""
                          }`}
                        >
                          {dayNum}
                        </div>
                        <span className="text-[9px] text-slate-400 font-medium">{monthName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Workstations Rows */}
              <div className="divide-y divide-purple-100">
                {workstations
                  .filter((ws) => selectedWorkstationId === "all" || ws.id === selectedWorkstationId)
                  .map((ws) => {
                    const wsLoads = workstationDailyLoads[ws.id] || {};
                    const capacityHours = ws.standardCapacityHoursPerDay || 8;
                    const capacityMinutes = capacityHours * 60;

                    return (
                      <div key={ws.id} className="grid grid-cols-12 hover:bg-purple-50/20 transition-colors group">
                        {/* Left: Workstation Info Box */}
                        <div className="col-span-3 p-3 border-r border-purple-200/60 bg-white group-hover:bg-purple-50/30 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-200">
                                {ws.code}
                              </span>
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  ws.status === "running"
                                    ? "bg-emerald-500 animate-pulse"
                                    : ws.status === "maintenance"
                                    ? "bg-amber-500"
                                    : "bg-slate-300"
                                }`}
                              />
                            </div>
                            <h4 className="font-extrabold text-xs text-slate-900 mt-1">{ws.name}</h4>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                              <span>OEE: %{Math.round((ws.efficiencyRate || 0.85) * 100)}</span>
                              <span>•</span>
                              <span>Kapasite: {capacityHours} sa/gün</span>
                            </div>
                          </div>

                          {ws.assignedOperatorName && (
                            <div className="text-[10px] text-purple-900/80 mt-2 flex items-center gap-1 font-medium bg-purple-50/60 px-2 py-0.5 rounded-md">
                              <User className="w-3 h-3 text-purple-600" />
                              <span>{ws.assignedOperatorName}</span>
                            </div>
                          )}
                        </div>

                        {/* Right: Gantt Days Timeline Grid */}
                        <div
                          className="col-span-9 grid relative py-2.5 px-1 bg-slate-50/20"
                          style={{ gridTemplateColumns: `repeat(${timelineDays.length}, minmax(0, 1fr))` }}
                        >
                          {timelineDays.map((d, idx) => {
                            const dateStr = d.toISOString().split("T")[0];
                            const dayData = wsLoads[dateStr];
                            const totalMins = dayData?.totalMinutes || 0;
                            const loadPercent = Math.round((totalMins / capacityMinutes) * 100);
                            const isOverloaded = totalMins > capacityMinutes;
                            const today = isToday(d);
                            const weekend = isWeekend(d);

                            return (
                              <div
                                key={idx}
                                className={`border-r border-dashed border-purple-200/40 min-h-[74px] p-1 flex flex-col justify-between relative ${
                                  today ? "bg-purple-100/20" : weekend ? "bg-slate-100/30" : ""
                                }`}
                              >
                                {/* Scheduled operations for this day on this machine */}
                                <div className="space-y-1 z-10">
                                  {dayData?.operations?.map(({ wo, op }, opIdx) => {
                                    const statusClass = getStatusColorClass(wo.status);

                                    return (
                                      <div
                                        key={`${wo.id}_${op.id}_${opIdx}`}
                                        onClick={() => {
                                          setInspectingWo(wo);
                                          setInspectingOp(op);
                                        }}
                                        className={`p-1 rounded-md text-[9px] font-bold border truncate cursor-pointer transition-all hover:scale-[1.03] shadow-xs ${statusClass}`}
                                        title={`${wo.orderNumber} - ${wo.productName} (${op.operationName})`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="truncate">{wo.orderNumber}</span>
                                          <span className="text-[8px] opacity-90">{wo.plannedQuantity} ad</span>
                                        </div>
                                        <div className="text-[8px] opacity-90 truncate">{op.operationName}</div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Load Meter at Bottom of Day Cell */}
                                {totalMins > 0 && (
                                  <div className="mt-1 pt-1 border-t border-slate-200/60 z-0">
                                    <div className="flex items-center justify-between text-[8px] font-mono">
                                      <span className={isOverloaded ? "text-rose-600 font-bold flex items-center gap-0.5" : "text-slate-500 font-medium"}>
                                        {isOverloaded && <AlertTriangle className="w-2.5 h-2.5" />}
                                        {Math.round(totalMins / 60)}s
                                      </span>
                                      <span className={isOverloaded ? "text-rose-700 font-bold" : "text-purple-950 font-bold"}>
                                        %{loadPercent}
                                      </span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-1 mt-0.5 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all ${
                                          isOverloaded ? "bg-rose-500" : loadPercent > 80 ? "bg-purple-600" : "bg-emerald-500"
                                        }`}
                                        style={{ width: `${Math.min(100, loadPercent)}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: WORK ORDER-CENTRIC GANTT TIMELINE */}
      {viewMode === "work_order_gantt" && (
        <div className="bg-white rounded-2xl border border-purple-200/60 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <div className="min-w-[900px]">
              {/* Header */}
              <div className="grid grid-cols-12 bg-purple-50/70 border-b border-purple-200/80 sticky top-0 z-20">
                <div className="col-span-4 p-3 font-extrabold text-[11px] text-purple-950 uppercase tracking-wider border-r border-purple-200/80">
                  İş Emri & Mamul Bilgisi
                </div>
                <div className="col-span-8 grid" style={{ gridTemplateColumns: `repeat(${timelineDays.length}, minmax(0, 1fr))` }}>
                  {timelineDays.map((d, idx) => {
                    const { dayName, dayNum } = formatDateHeader(d);
                    const today = isToday(d);
                    return (
                      <div
                        key={idx}
                        className={`p-2 text-center border-r border-purple-200/50 flex flex-col items-center justify-center ${
                          today ? "bg-purple-200/60 font-black text-purple-950" : "text-slate-700"
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold">{dayName}</span>
                        <span className="text-xs font-bold">{dayNum}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Work Orders List */}
              <div className="divide-y divide-purple-100">
                {filteredWorkOrders.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 font-semibold text-xs">
                    Filtrelere uygun iş emri bulunamadı.
                  </div>
                ) : (
                  filteredWorkOrders.map((wo) => {
                    const priorityObj = getPriorityBadge(wo.priority);
                    const progressPercent = Math.round(
                      ((wo.producedQuantity || 0) / (wo.plannedQuantity || 1)) * 100
                    );

                    const startDate = new Date(wo.plannedStartDate);
                    const dueDate = new Date(wo.plannedDueDate);

                    return (
                      <div key={wo.id} className="grid grid-cols-12 hover:bg-purple-50/20 transition-colors group">
                        {/* Left: Work Order Info */}
                        <div className="col-span-4 p-3 border-r border-purple-200/60 bg-white group-hover:bg-purple-50/30">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono text-xs font-bold text-purple-950 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
                              {wo.orderNumber}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${priorityObj.bg}`}>
                              {priorityObj.label}
                            </span>
                          </div>

                          <h5 className="font-extrabold text-xs text-slate-900 mt-1 truncate">{wo.productName}</h5>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                            <span>Hedef: {wo.plannedQuantity} {wo.unit}</span>
                            <span className="font-bold text-purple-900">%{progressPercent} Tamam</span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                            <div
                              className="bg-[#8252F6] h-full rounded-full transition-all"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>

                          {wo.lotNumber && (
                            <div className="text-[10px] font-mono text-slate-400 mt-1">
                              Lot: {wo.lotNumber}
                            </div>
                          )}
                        </div>

                        {/* Right: Gantt Range Timeline Bar */}
                        <div
                          className="col-span-8 grid relative py-3 px-1 bg-slate-50/20 items-center"
                          style={{ gridTemplateColumns: `repeat(${timelineDays.length}, minmax(0, 1fr))` }}
                        >
                          {timelineDays.map((d, idx) => {
                            const dateStr = d.toISOString().split("T")[0];
                            const isWithinRange = d >= startDate && d <= dueDate;
                            const isStartDay = d.toDateString() === startDate.toDateString();
                            const isDueDay = d.toDateString() === dueDate.toDateString();

                            return (
                              <div
                                key={idx}
                                className={`h-12 border-r border-dashed border-purple-200/40 relative flex items-center ${
                                  isToday(d) ? "bg-purple-100/20" : ""
                                }`}
                              >
                                {isWithinRange && (
                                  <div
                                    onClick={() => {
                                      setInspectingWo(wo);
                                      setInspectingOp(null);
                                    }}
                                    className={`w-full h-8 flex items-center justify-between px-2 text-[10px] font-bold text-white shadow-xs cursor-pointer transition-all hover:brightness-110 ${
                                      getStatusColorClass(wo.status)
                                    } ${isStartDay ? "rounded-l-lg" : ""} ${isDueDay ? "rounded-r-lg" : ""}`}
                                  >
                                    {isStartDay && <span className="truncate">{wo.orderNumber}</span>}
                                    {isDueDay && <span className="text-[9px] font-mono">Bitiş</span>}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: MONTHLY CALENDAR GRID */}
      {viewMode === "month_calendar" && (
        <div className="bg-white rounded-2xl border border-purple-200/60 shadow-2xs overflow-hidden">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 bg-purple-50/80 border-b border-purple-200/80 text-center font-extrabold text-[11px] text-purple-950 uppercase tracking-wider py-2.5">
            <div>Pazartesi</div>
            <div>Salı</div>
            <div>Çarşamba</div>
            <div>Perşembe</div>
            <div>Cuma</div>
            <div className="text-purple-700">Cumartesi</div>
            <div className="text-purple-700">Pazar</div>
          </div>

          {/* Month Cells Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-purple-100">
            {monthCalendarGrid.map((cell, idx) => {
              const today = isToday(cell.date);
              const dayWos = filteredWorkOrders.filter((wo) => {
                const s = new Date(wo.plannedStartDate).toISOString().split("T")[0];
                const e = new Date(wo.plannedDueDate).toISOString().split("T")[0];
                return cell.dateString >= s && cell.dateString <= e;
              });

              return (
                <div
                  key={idx}
                  className={`min-h-[120px] p-2 flex flex-col justify-between transition-colors ${
                    today
                      ? "bg-purple-100/40 ring-1 ring-purple-400 inset-0"
                      : cell.isCurrentMonth
                      ? "bg-white hover:bg-purple-50/20"
                      : "bg-slate-50/60 text-slate-400 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        today
                          ? "bg-[#8252F6] text-white shadow-2xs"
                          : cell.isCurrentMonth
                          ? "text-slate-800"
                          : "text-slate-400"
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>

                    {dayWos.length > 0 && (
                      <span className="text-[10px] font-bold text-purple-900 bg-purple-100 px-1.5 py-0.2 rounded-md">
                        {dayWos.length} İş
                      </span>
                    )}
                  </div>

                  {/* Work orders pills on this day */}
                  <div className="space-y-1 my-1 overflow-y-auto max-h-[85px] custom-scrollbar">
                    {dayWos.map((wo) => {
                      const statusClass = getStatusColorClass(wo.status);

                      return (
                        <div
                          key={wo.id}
                          onClick={() => {
                            setInspectingWo(wo);
                            setInspectingOp(null);
                          }}
                          className={`p-1 rounded text-[9px] font-bold truncate cursor-pointer transition-all hover:scale-[1.02] shadow-2xs ${statusClass}`}
                          title={`${wo.orderNumber} - ${wo.productName}`}
                        >
                          <div className="truncate">{wo.orderNumber} • {wo.productName}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-[9px] text-slate-400 text-right">
                    {dayWos.reduce((sum, w) => sum + w.plannedQuantity, 0) > 0 && (
                      <span>{dayWos.reduce((sum, w) => sum + w.plannedQuantity, 0)} ad.</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 4: WEEKLY CAPACITY MATRIX */}
      {viewMode === "week_calendar" && (
        <div className="bg-white rounded-2xl border border-purple-200/60 shadow-2xs overflow-hidden">
          <div className="p-4 bg-purple-50/50 border-b border-purple-200/60 flex items-center justify-between">
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
              <Factory className="w-4 h-4 text-purple-700" />
              <span>Haftalık Tezgâh Yük & Kapasite Matrisi</span>
            </h4>
            <span className="text-xs text-purple-900 font-bold">
              Standart Çift Vardiya (16 Saat) & Tek Vardiya (8 Saat) Analizi
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-purple-100/60 text-purple-950 font-extrabold text-[10px] uppercase border-b border-purple-200">
                  <th className="p-3">Tezgâh Adı</th>
                  <th className="p-3 text-center">Günlük Kapasite</th>
                  {timelineDays.map((d, idx) => (
                    <th key={idx} className="p-3 text-center">
                      {formatDateHeader(d).dayName} {d.getDate()}
                    </th>
                  ))}
                  <th className="p-3 text-right">Haftalık Doluluk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100">
                {workstations.map((ws) => {
                  const wsLoads = workstationDailyLoads[ws.id] || {};
                  const dailyCapHours = ws.standardCapacityHoursPerDay || 8;
                  const totalWeekCapHours = dailyCapHours * 7;
                  let totalWeekScheduledHours = 0;

                  return (
                    <tr key={ws.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="p-3 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] bg-purple-50 text-purple-900 px-1.5 py-0.5 rounded border border-purple-200">
                            {ws.code}
                          </span>
                          <span>{ws.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center text-slate-600 font-medium">
                        {dailyCapHours} Saat
                      </td>

                      {timelineDays.map((d, idx) => {
                        const dateStr = d.toISOString().split("T")[0];
                        const dayMins = wsLoads[dateStr]?.totalMinutes || 0;
                        const dayHours = Math.round((dayMins / 60) * 10) / 10;
                        totalWeekScheduledHours += dayHours;
                        const isOver = dayHours > dailyCapHours;

                        return (
                          <td key={idx} className="p-3 text-center">
                            {dayHours > 0 ? (
                              <div
                                className={`inline-block px-2 py-1 rounded-lg font-mono font-bold text-xs ${
                                  isOver
                                    ? "bg-rose-100 text-rose-800 border border-rose-300 animate-pulse"
                                    : dayHours / dailyCapHours > 0.8
                                    ? "bg-purple-100 text-purple-950 border border-purple-300"
                                    : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                }`}
                              >
                                {dayHours}s
                              </div>
                            ) : (
                              <span className="text-slate-300 font-mono">-</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="p-3 text-right font-black font-mono text-purple-950">
                        %{Math.round((totalWeekScheduledHours / totalWeekCapHours) * 100)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QUICK INSPECTION MODAL FOR WORK ORDER / OPERATION */}
      {inspectingWo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-purple-200 overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-50 via-fuchsia-50/40 to-slate-50 p-4 sm:p-5 border-b border-purple-200/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#8252F6] text-white flex items-center justify-center shadow-xs">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-purple-950 bg-purple-100 px-2 py-0.5 rounded border border-purple-300/60">
                      {inspectingWo.orderNumber}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        inspectingWo.status === "in_progress"
                          ? "bg-purple-100 text-purple-900 border border-purple-300"
                          : inspectingWo.status === "completed"
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          : "bg-indigo-100 text-indigo-900 border border-indigo-300"
                      }`}
                    >
                      {inspectingWo.status}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mt-1">
                    {inspectingWo.productName}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => {
                  setInspectingWo(null);
                  setInspectingOp(null);
                }}
                className="w-8 h-8 rounded-lg bg-white/80 hover:bg-white text-slate-500 hover:text-slate-700 flex items-center justify-center border border-purple-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              {/* Summary details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-purple-50/40 p-3.5 rounded-xl border border-purple-200/60 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Planlanan Miktar</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {inspectingWo.plannedQuantity} {inspectingWo.unit}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Sağlam Üretilen</span>
                  <span className="font-extrabold text-emerald-700 text-sm">
                    {inspectingWo.producedQuantity || 0} {inspectingWo.unit}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Parti / Lot No</span>
                  <span className="font-mono font-bold text-purple-950">{inspectingWo.lotNumber}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Müşteri / Sipariş</span>
                  <span className="font-bold text-slate-800 truncate block">
                    {inspectingWo.customerName || "Stok Üretimi"}
                  </span>
                </div>
              </div>

              {/* Schedule Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <div>
                    <span className="text-slate-400 text-[10px] block">Planlanan Başlangıç:</span>
                    <span className="font-bold text-slate-800">{inspectingWo.plannedStartDate}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <div>
                    <span className="text-slate-400 text-[10px] block">Termin / Bitiş Tarihi:</span>
                    <span className="font-bold text-slate-800">{inspectingWo.plannedDueDate}</span>
                  </div>
                </div>
              </div>

              {/* Work Order Operations List */}
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2">
                  İş Emri Operasyon & Tezgâh Rota Adımları
                </h4>

                <div className="space-y-2">
                  {inspectingWo.operations?.map((op) => {
                    const isSelectedOp = inspectingOp?.id === op.id;

                    return (
                      <div
                        key={op.id}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between text-xs ${
                          isSelectedOp
                            ? "bg-purple-100/70 border-purple-400 shadow-2xs font-bold"
                            : "bg-white border-purple-200/60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            #{op.sequence}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900">{op.operationName}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2">
                              <span>Tezgâh: {op.workstationName}</span>
                              <span>•</span>
                              <span>Planlanan: {op.plannedDurationMinutes} dk</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                              op.status === "completed"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : op.status === "in_progress"
                                ? "bg-purple-100 text-purple-800 border border-purple-200 animate-pulse"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {op.status === "completed"
                              ? "Tamamlandı"
                              : op.status === "in_progress"
                              ? "İşleniyor"
                              : "Sırada"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-purple-100 bg-slate-50/60 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  setInspectingWo(null);
                  setInspectingOp(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200"
              >
                Kapat
              </button>

              <button
                onClick={() => {
                  const woId = inspectingWo.id;
                  setInspectingWo(null);
                  setInspectingOp(null);
                  onOpenMesTerminal(woId);
                }}
                className="px-5 py-2 bg-[#8252F6] hover:bg-[#7140e8] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>MES Operatör Terminalinde Aç</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
