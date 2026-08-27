import React, { useState, useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";
import {
  WorkOrder,
  Workstation,
  Routing,
  BillOfMaterials,
  WorkOrderOperation,
} from "../../types";
import {
  BarChart3,
  TrendingUp,
  Cpu,
  Gauge,
  Calendar,
  Layers,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  Factory,
} from "lucide-react";

export type AnalyticsPeriod = "daily" | "weekly" | "biweekly" | "monthly";
export type CapacityMetricType = "hours" | "percentage" | "oee";
export type ChartTab = "all_dashboard" | "bar_comparison" | "heatmap" | "oee_breakdown" | "trend_line";

export interface DailyBreakdownItem {
  dateStr: string;
  date: Date;
  hours: number;
  utilization: number;
  workOrders: string[];
}

export interface MachineMetricItem {
  id: string;
  code: string;
  name: string;
  category: string;
  status: string;
  operatorName: string;
  hourlyCost: number;
  standardCapacityHours: number;
  totalPeriodCapacityHours: number;
  totalScheduledHours: number;
  avgDailyHours: number;
  overallUtilization: number;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  isOverloaded: boolean;
  dailyBreakdown: DailyBreakdownItem[];
}

interface MachineCapacityD3AnalyticsProps {
  workOrders: WorkOrder[];
  workstations: Workstation[];
  boms?: BillOfMaterials[];
  routings?: Routing[];
  onOpenWorkOrderTab?: () => void;
  onOpenWorkstationTab?: () => void;
  onOpenMesTerminal?: (workOrderId?: string) => void;
}

export const MachineCapacityD3Analytics: React.FC<MachineCapacityD3AnalyticsProps> = ({
  workOrders,
  workstations,
  boms = [],
  routings = [],
  onOpenWorkOrderTab,
  onOpenWorkstationTab,
  onOpenMesTerminal,
}) => {
  const [period, setPeriod] = useState<AnalyticsPeriod>("weekly");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMachineId, setSelectedMachineId] = useState<string>("all");
  const [shiftHours, setShiftHours] = useState<number>(8); // 8, 16, 24 saat
  const [activeTab, setActiveTab] = useState<ChartTab>("all_dashboard");
  const [selectedHoverData, setSelectedHoverData] = useState<{
    title: string;
    machineName: string;
    plannedHours: number;
    capacityHours: number;
    utilizationRate: number;
    oee: number;
    activeWorkOrders: string[];
    dateStr?: string;
  } | null>(null);

  // SVG Refs for D3 Rendering
  const barChartRef = useRef<SVGSVGElement | null>(null);
  const heatmapRef = useRef<SVGSVGElement | null>(null);
  const oeeGaugeRef = useRef<SVGSVGElement | null>(null);
  const trendLineRef = useRef<SVGSVGElement | null>(null);
  const loadPieRef = useRef<SVGSVGElement | null>(null);

  // Date Range Calculation
  const daysArray = useMemo<Date[]>(() => {
    const count = period === "daily" ? 1 : period === "weekly" ? 7 : period === "biweekly" ? 14 : 30;
    const days: Date[] = [];
    const start = new Date(selectedDate);
    if (period === "weekly") {
      // Start from Monday of current week
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
    } else if (period === "daily") {
      // Just selected day
    } else {
      start.setDate(start.getDate() - Math.floor(count / 2));
    }

    const curr = new Date(start);
    for (let i = 0; i < count; i++) {
      days.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }
    return days;
  }, [period, selectedDate]);

  // Compute Daily Load (in hours) for each machine
  const machineDailyLoadData = useMemo(() => {
    const result: Record<string, Record<string, { totalHours: number; operations: { wo: WorkOrder; op: WorkOrderOperation }[] }>> = {};

    workstations.forEach((ws) => {
      result[ws.id] = {};
    });

    const activeWos = workOrders.filter((w) => w.status !== "cancelled");

    activeWos.forEach((wo) => {
      const sDate = new Date(wo.plannedStartDate);
      const eDate = new Date(wo.plannedDueDate);
      const spanDays = Math.max(1, Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

      wo.operations?.forEach((op) => {
        if (!result[op.workstationId]) {
          result[op.workstationId] = {};
        }

        const durationMinutes = op.plannedDurationMinutes || (op.actualDurationMinutes > 0 ? op.actualDurationMinutes : 120);
        const hoursPerDay = durationMinutes / 60 / spanDays;

        const curr = new Date(sDate);
        for (let i = 0; i < spanDays; i++) {
          const dateStr = curr.toISOString().split("T")[0];
          if (!result[op.workstationId][dateStr]) {
            result[op.workstationId][dateStr] = { totalHours: 0, operations: [] };
          }
          result[op.workstationId][dateStr].totalHours += hoursPerDay;
          result[op.workstationId][dateStr].operations.push({ wo, op });
          curr.setDate(curr.getDate() + 1);
        }
      });
    });

    return result;
  }, [workstations, workOrders]);

  // Aggregated Machine Stats
  const machineMetrics = useMemo<MachineMetricItem[]>(() => {
    return workstations.map((ws) => {
      const capacityPerDay = shiftHours;
      const totalPeriodDays = daysArray.length;
      const totalPeriodCapacityHours = capacityPerDay * totalPeriodDays;

      let totalScheduledHours = 0;
      const dailyBreakdown: DailyBreakdownItem[] = [];

      daysArray.forEach((d) => {
        const dateStr = d.toISOString().split("T")[0];
        const dayData = machineDailyLoadData[ws.id]?.[dateStr];
        const hours = dayData ? dayData.totalHours : 0;
        totalScheduledHours += hours;
        const utilization = capacityPerDay > 0 ? Math.round((hours / capacityPerDay) * 100) : 0;
        const woSet = new Set<string>();
        dayData?.operations.forEach((o) => woSet.add(`${o.wo.orderNumber} (${o.wo.productName})`));

        dailyBreakdown.push({
          dateStr,
          date: d,
          hours: Math.round(hours * 10) / 10,
          utilization,
          workOrders: Array.from(woSet),
        });
      });

      const avgDailyHours = totalScheduledHours / totalPeriodDays;
      const overallUtilization = totalPeriodCapacityHours > 0 ? Math.round((totalScheduledHours / totalPeriodCapacityHours) * 100) : 0;
      const oee = Math.round((ws.efficiencyRate || 0.85) * 100);

      // Realistic OEE factors derived from workstation efficiency
      const baseEff = ws.efficiencyRate || 0.85;
      const availability = Math.min(98, Math.max(70, Math.round(baseEff * 105)));
      const performance = Math.min(99, Math.max(75, Math.round(baseEff * 98)));
      const quality = Math.min(100, Math.max(88, Math.round(baseEff * 102)));

      const isOverloaded = overallUtilization > 100 || dailyBreakdown.some((d) => d.utilization > 100);

      return {
        id: ws.id,
        code: ws.code,
        name: ws.name,
        category: ws.category,
        status: ws.status,
        operatorName: ws.assignedOperatorName || "Atanmadı",
        hourlyCost: ws.hourlyOperatingCost || 250,
        standardCapacityHours: capacityPerDay,
        totalPeriodCapacityHours,
        totalScheduledHours: Math.round(totalScheduledHours * 10) / 10,
        avgDailyHours: Math.round(avgDailyHours * 10) / 10,
        overallUtilization,
        oee,
        availability,
        performance,
        quality,
        isOverloaded,
        dailyBreakdown,
      };
    });
  }, [workstations, daysArray, shiftHours, machineDailyLoadData]);

  // Overall Factory Summary KPIs
  const overallKPIs = useMemo(() => {
    const totalCap = machineMetrics.reduce((s, m) => s + m.totalPeriodCapacityHours, 0);
    const totalScheduled = machineMetrics.reduce((s, m) => s + m.totalScheduledHours, 0);
    const avgUtil = totalCap > 0 ? Math.round((totalScheduled / totalCap) * 100) : 0;
    const avgOee = machineMetrics.length > 0 ? Math.round(machineMetrics.reduce((s, m) => s + m.oee, 0) / machineMetrics.length) : 85;
    const overloadedCount = machineMetrics.filter((m) => m.isOverloaded).length;
    const idleCount = machineMetrics.filter((m) => m.status === "idle" || m.overallUtilization === 0).length;

    return {
      totalCapacityHours: totalCap,
      totalScheduledHours: Math.round(totalScheduled * 10) / 10,
      avgUtilization: avgUtil,
      avgOee,
      overloadedCount,
      idleCount,
    };
  }, [machineMetrics]);

  // Filtered Machines for Charts
  const displayedMachines = useMemo<MachineMetricItem[]>(() => {
    if (selectedMachineId === "all") return machineMetrics;
    return machineMetrics.filter((m) => m.id === selectedMachineId);
  }, [machineMetrics, selectedMachineId]);

  // ==========================================
  // D3 CHART 1: GROUPED BAR CHART (KAPASİTE & YÜK SAATLERİ)
  // ==========================================
  useEffect(() => {
    if (!barChartRef.current || displayedMachines.length === 0) return;

    const svg = d3.select(barChartRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 30, right: 30, bottom: 65, left: 60 };
    const width = barChartRef.current.clientWidth || 650;
    const height = 340;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Gradients Definition
    const defs = svg.append("defs");

    // Capacity Bar Gradient (Soft Slate/Purple)
    const capGrad = defs
      .append("linearGradient")
      .attr("id", "capBarGrad")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    capGrad.append("stop").attr("offset", "0%").attr("stop-color", "#E2E8F0");
    capGrad.append("stop").attr("offset", "100%").attr("stop-color", "#CBD5E1");

    // Normal Load Gradient (Purple-Violet)
    const loadGrad = defs
      .append("linearGradient")
      .attr("id", "loadBarGrad")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    loadGrad.append("stop").attr("offset", "0%").attr("stop-color", "#A855F7");
    loadGrad.append("stop").attr("offset", "100%").attr("stop-color", "#8252F6");

    // Overload Gradient (Rose-Crimson)
    const overGrad = defs
      .append("linearGradient")
      .attr("id", "overBarGrad")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    overGrad.append("stop").attr("offset", "0%").attr("stop-color", "#FB7185");
    overGrad.append("stop").attr("offset", "100%").attr("stop-color", "#E11D48");

    // Scales
    const x0 = d3
      .scaleBand()
      .domain(displayedMachines.map((d) => d.name))
      .rangeRound([0, innerWidth])
      .paddingInner(0.25);

    const x1 = d3
      .scaleBand()
      .domain(["Kapasite", "Planlanan"])
      .rangeRound([0, x0.bandwidth()])
      .padding(0.08);

    const maxVal = d3.max(displayedMachines, (d: MachineMetricItem) => Math.max(d.totalPeriodCapacityHours, d.totalScheduledHours)) || 60;
    const y = d3
      .scaleLinear()
      .domain([0, maxVal * 1.15])
      .nice()
      .rangeRound([innerHeight, 0]);

    // Gridlines
    g.append("g")
      .attr("class", "grid")
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickSize(-innerWidth)
          .tickFormat(() => "")
      )
      .selectAll("line")
      .attr("stroke", "#F1F5F9")
      .attr("stroke-dasharray", "3,3");

    // Axes
    const xAxis = g
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x0));

    xAxis
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-25)")
      .attr("font-size", "11px")
      .attr("font-weight", "600")
      .attr("fill", "#334155");

    xAxis.select(".domain").attr("stroke", "#E2E8F0");

    const yAxis = g.append("g").call(d3.axisLeft(y).ticks(5).tickFormat((d) => `${d} sa`));
    yAxis.selectAll("text").attr("font-size", "11px").attr("fill", "#64748B");
    yAxis.select(".domain").attr("stroke", "#E2E8F0");

    // Bar Groups
    const machineGroup = g
      .selectAll(".machineGroup")
      .data(displayedMachines)
      .enter()
      .append("g")
      .attr("class", "machineGroup")
      .attr("transform", (d: MachineMetricItem) => `translate(${x0(d.name) || 0},0)`);

    // 1. Capacity Bar
    machineGroup
      .append("rect")
      .attr("x", x1("Kapasite") || 0)
      .attr("width", x1.bandwidth())
      .attr("y", innerHeight)
      .attr("height", 0)
      .attr("fill", "url(#capBarGrad)")
      .attr("rx", 5)
      .attr("ry", 5)
      .transition()
      .duration(700)
      .attr("y", (d: MachineMetricItem) => y(d.totalPeriodCapacityHours))
      .attr("height", (d: MachineMetricItem) => innerHeight - y(d.totalPeriodCapacityHours));

    // 2. Scheduled Load Bar
    const loadBars = machineGroup
      .append("rect")
      .attr("x", x1("Planlanan") || 0)
      .attr("width", x1.bandwidth())
      .attr("y", innerHeight)
      .attr("height", 0)
      .attr("fill", (d: MachineMetricItem) => (d.isOverloaded ? "url(#overBarGrad)" : "url(#loadBarGrad)"))
      .attr("rx", 5)
      .attr("ry", 5)
      .attr("cursor", "pointer")
      .on("mouseover", (event: any, d: MachineMetricItem) => {
        d3.select(event.currentTarget).attr("opacity", 0.85);
        setSelectedHoverData({
          title: "Kapasite & Yük Karşılaştırması",
          machineName: `${d.code} - ${d.name}`,
          plannedHours: d.totalScheduledHours,
          capacityHours: d.totalPeriodCapacityHours,
          utilizationRate: d.overallUtilization,
          oee: d.oee,
          activeWorkOrders: d.dailyBreakdown.flatMap((b) => b.workOrders),
        });
      })
      .on("mouseout", (event: any) => {
        d3.select(event.currentTarget).attr("opacity", 1);
      });

    loadBars
      .transition()
      .duration(800)
      .delay(150)
      .attr("y", (d: MachineMetricItem) => y(d.totalScheduledHours))
      .attr("height", (d: MachineMetricItem) => innerHeight - y(d.totalScheduledHours));

    // Value Labels on top of Load Bars
    machineGroup
      .append("text")
      .attr("x", (x1("Planlanan") || 0) + x1.bandwidth() / 2)
      .attr("y", (d: MachineMetricItem) => y(d.totalScheduledHours) - 6)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("font-weight", "800")
      .attr("fill", (d: MachineMetricItem) => (d.isOverloaded ? "#E11D48" : "#8252F6"))
      .text((d: MachineMetricItem) => `%${d.overallUtilization}`)
      .attr("opacity", 0)
      .transition()
      .duration(600)
      .delay(700)
      .attr("opacity", 1);
  }, [displayedMachines, shiftHours]);

  // ==========================================
  // D3 CHART 2: HEATMAP (GÜNLÜK / HAFTALIK MAKİNE DOLULUK MATRİSİ)
  // ==========================================
  useEffect(() => {
    if (!heatmapRef.current || displayedMachines.length === 0) return;

    const svg = d3.select(heatmapRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 25, right: 30, bottom: 45, left: 140 };
    const width = heatmapRef.current.clientWidth || 650;
    const height = Math.max(260, displayedMachines.length * 36 + margin.top + margin.bottom);
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Format Date Labels
    const dateLabels = daysArray.map((d) => {
      const dayName = d.toLocaleDateString("tr-TR", { weekday: "short" });
      const dayNum = d.getDate();
      return `${dayName} ${dayNum}`;
    });

    const x = d3.scaleBand().domain(dateLabels).range([0, innerWidth]).padding(0.08);

    const y = d3
      .scaleBand()
      .domain(displayedMachines.map((d) => d.name))
      .range([0, innerHeight])
      .padding(0.12);

    // Color Scale: Light Purple -> Deep Violet -> Crimson for Overload
    const colorScale = d3
      .scaleLinear<string>()
      .domain([0, 30, 75, 100, 140])
      .range(["#F8FAFC", "#E9D5FF", "#A855F7", "#8252F6", "#E11D48"]);

    // Axes
    const xAxis = g.append("g").attr("transform", `translate(0,${innerHeight})`).call(d3.axisBottom(x));

    xAxis
      .selectAll("text")
      .attr("font-size", "10.5px")
      .attr("font-weight", "700")
      .attr("fill", "#475569")
      .attr("dy", "0.8em");

    xAxis.select(".domain").attr("stroke", "#E2E8F0");

    const yAxis = g.append("g").call(d3.axisLeft(y));
    yAxis
      .selectAll("text")
      .attr("font-size", "11px")
      .attr("font-weight", "600")
      .attr("fill", "#1E293B");
    yAxis.select(".domain").attr("stroke", "transparent");

    // Draw Heatmap Cells
    displayedMachines.forEach((machine: MachineMetricItem) => {
      machine.dailyBreakdown.forEach((dayItem, idx) => {
        const xPos = x(dateLabels[idx]) || 0;
        const yPos = y(machine.name) || 0;
        const util = dayItem.utilization;
        const hours = dayItem.hours;

        const cell = g
          .append("rect")
          .attr("x", xPos)
          .attr("y", yPos)
          .attr("width", x.bandwidth())
          .attr("height", y.bandwidth())
          .attr("rx", 6)
          .attr("ry", 6)
          .attr("fill", "#F8FAFC")
          .attr("stroke", util > 100 ? "#FCA5A5" : "#E2E8F0")
          .attr("stroke-width", util > 100 ? 1.5 : 1)
          .attr("cursor", "pointer")
          .on("mouseover", (event: any) => {
            d3.select(event.currentTarget).attr("stroke", "#8252F6").attr("stroke-width", 2);
            setSelectedHoverData({
              title: "Günlük Makine Doluluğu",
              machineName: `${machine.code} - ${machine.name}`,
              plannedHours: hours,
              capacityHours: shiftHours,
              utilizationRate: util,
              oee: machine.oee,
              activeWorkOrders: dayItem.workOrders,
              dateStr: dateLabels[idx],
            });
          })
          .on("mouseout", (event: any) => {
            d3.select(event.currentTarget)
              .attr("stroke", util > 100 ? "#FCA5A5" : "#E2E8F0")
              .attr("stroke-width", util > 100 ? 1.5 : 1);
          });

        cell
          .transition()
          .duration(500)
          .delay(idx * 40)
          .attr("fill", colorScale(util));

        // Text inside cell
        if (x.bandwidth() > 32) {
          g.append("text")
            .attr("x", xPos + x.bandwidth() / 2)
            .attr("y", yPos + y.bandwidth() / 2 + 3.5)
            .attr("text-anchor", "middle")
            .attr("font-size", "9.5px")
            .attr("font-weight", "800")
            .attr("fill", util > 70 ? "#FFFFFF" : util > 0 ? "#4C1D95" : "#94A3B8")
            .text(util > 0 ? `%${util}` : "-")
            .attr("pointer-events", "none");
        }
      });
    });
  }, [displayedMachines, daysArray, shiftHours]);

  // ==========================================
  // D3 CHART 3: MULTI-GAUGE / OEE RADIAL ARCS (VERİMLİLİK & OEE)
  // ==========================================
  useEffect(() => {
    if (!oeeGaugeRef.current || displayedMachines.length === 0) return;

    const svg = d3.select(oeeGaugeRef.current);
    svg.selectAll("*").remove();

    const width = oeeGaugeRef.current.clientWidth || 450;
    const height = 280;
    const centerX = width / 2;
    const centerY = height / 2 + 10;
    const radius = Math.min(centerX, centerY) - 25;

    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${centerX},${centerY})`);

    // Target Machine for OEE gauge (selected or primary machine)
    const targetMachine = displayedMachines[0] || machineMetrics[0];
    if (!targetMachine) return;

    const oeeMetrics = [
      { name: "OEE Toplam", value: targetMachine.oee, color: "#8252F6", trackColor: "#F3E8FF", radiusOffset: 0 },
      { name: "Kullanılabilirlik (A)", value: targetMachine.availability, color: "#06B6D4", trackColor: "#ECFEFF", radiusOffset: 22 },
      { name: "Performans (P)", value: targetMachine.performance, color: "#10B981", trackColor: "#ECFDF5", radiusOffset: 44 },
      { name: "Kalite Oranı (Q)", value: targetMachine.quality, color: "#F59E0B", trackColor: "#FFFBEB", radiusOffset: 66 },
    ];

    const arcGenerator = d3
      .arc<any>()
      .innerRadius((d) => radius - d.radiusOffset - 16)
      .outerRadius((d) => radius - d.radiusOffset)
      .startAngle(-Math.PI * 0.75)
      .cornerRadius(8);

    // Background Tracks
    g.selectAll(".track")
      .data(oeeMetrics)
      .enter()
      .append("path")
      .attr("class", "track")
      .attr("d", (d) =>
        arcGenerator({
          radiusOffset: d.radiusOffset,
          endAngle: Math.PI * 0.75,
        })
      )
      .attr("fill", (d) => d.trackColor);

    // Progress Arcs
    const progressArcs = g
      .selectAll(".progress")
      .data(oeeMetrics)
      .enter()
      .append("path")
      .attr("class", "progress")
      .attr("fill", (d) => d.color);

    progressArcs
      .transition()
      .duration(900)
      .ease(d3.easeCubicOut)
      .attrTween("d", function (d) {
        const totalAngle = Math.PI * 1.5;
        const targetEnd = -Math.PI * 0.75 + (d.value / 100) * totalAngle;
        const interpolate = d3.interpolate(-Math.PI * 0.75, targetEnd);
        return function (t) {
          return arcGenerator({
            radiusOffset: d.radiusOffset,
            endAngle: interpolate(t),
          })!;
        };
      });

    // Center Big OEE Text
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.2em")
      .attr("font-size", "28px")
      .attr("font-weight", "900")
      .attr("fill", "#1E1B4B")
      .text(`%${targetMachine.oee}`);

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.4em")
      .attr("font-size", "11px")
      .attr("font-weight", "700")
      .attr("fill", "#64748B")
      .text(targetMachine.code);

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "2.8em")
      .attr("font-size", "10px")
      .attr("font-weight", "600")
      .attr("fill", "#8252F6")
      .text("Ekipman Verimliliği");
  }, [displayedMachines, machineMetrics]);

  // ==========================================
  // D3 CHART 4: MULTI-LINE / AREA TREND CHART (ZAMAN İÇİ DOLULUK TRENDİ)
  // ==========================================
  useEffect(() => {
    if (!trendLineRef.current || displayedMachines.length === 0) return;

    const svg = d3.select(trendLineRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 30, right: 30, bottom: 45, left: 55 };
    const width = trendLineRef.current.clientWidth || 650;
    const height = 300;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Date X Scale
    const x = d3
      .scaleTime()
      .domain(d3.extent(daysArray) as [Date, Date])
      .range([0, innerWidth]);

    const maxUtil =
      d3.max(displayedMachines, (m: MachineMetricItem) => d3.max(m.dailyBreakdown, (d: DailyBreakdownItem) => d.utilization)) || 100;
    const y = d3
      .scaleLinear()
      .domain([0, Math.max(120, Number(maxUtil) * 1.15)])
      .nice()
      .range([innerHeight, 0]);

    // Reference Overload Line (100%)
    g.append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", y(100))
      .attr("y2", y(100))
      .attr("stroke", "#FB7185")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4,4");

    g.append("text")
      .attr("x", innerWidth - 5)
      .attr("y", y(100) - 5)
      .attr("text-anchor", "end")
      .attr("font-size", "10px")
      .attr("font-weight", "700")
      .attr("fill", "#E11D48")
      .text("%100 Kapasite Eşiği");

    // Gridlines
    g.append("g")
      .attr("class", "grid")
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickSize(-innerWidth)
          .tickFormat(() => "")
      )
      .selectAll("line")
      .attr("stroke", "#F1F5F9")
      .attr("stroke-dasharray", "3,3");

    // Axes
    const xAxis = g
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(daysArray.length > 10 ? 6 : daysArray.length).tickFormat((d) => d3.timeFormat("%d %b")(d as Date)));

    xAxis.selectAll("text").attr("font-size", "10.5px").attr("fill", "#64748B");
    xAxis.select(".domain").attr("stroke", "#E2E8F0");

    const yAxis = g.append("g").call(d3.axisLeft(y).ticks(5).tickFormat((d) => `%${d}`));
    yAxis.selectAll("text").attr("font-size", "10.5px").attr("fill", "#64748B");
    yAxis.select(".domain").attr("stroke", "#E2E8F0");

    // Color Scale for Multiple Machines
    const colorPalette = ["#8252F6", "#06B6D4", "#10B981", "#F59E0B", "#EC4899", "#6366F1", "#14B8A6"];

    // Line & Area Generators
    const lineGenerator = d3
      .line<{ date: Date; utilization: number }>()
      .x((d) => x(d.date))
      .y((d) => y(d.utilization))
      .curve(d3.curveMonotoneX);

    displayedMachines.forEach((machine: MachineMetricItem, mIdx: number) => {
      const color = colorPalette[mIdx % colorPalette.length];
      const dataPoints = machine.dailyBreakdown.map((b) => ({
        date: b.date,
        utilization: b.utilization,
        hours: b.hours,
        workOrders: b.workOrders,
      }));

      // Gradient Area for Primary or First Machine
      if (mIdx === 0) {
        const areaGenerator = d3
          .area<{ date: Date; utilization: number }>()
          .x((d) => x(d.date))
          .y0(innerHeight)
          .y1((d) => y(d.utilization))
          .curve(d3.curveMonotoneX);

        const defs = svg.select("defs").empty() ? svg.append("defs") : svg.select("defs");
        const areaGrad = defs
          .append("linearGradient")
          .attr("id", `areaGrad_${machine.id}`)
          .attr("x1", "0%")
          .attr("y1", "0%")
          .attr("x2", "0%")
          .attr("y2", "100%");
        areaGrad.append("stop").attr("offset", "0%").attr("stop-color", color).attr("stop-opacity", 0.25);
        areaGrad.append("stop").attr("offset", "100%").attr("stop-color", color).attr("stop-opacity", 0.0);

        g.append("path")
          .datum(dataPoints)
          .attr("fill", `url(#areaGrad_${machine.id})`)
          .attr("d", areaGenerator);
      }

      // Main Line Path
      const path = g
        .append("path")
        .datum(dataPoints)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 2.5)
        .attr("d", lineGenerator);

      // Animation
      const totalLength = path.node()?.getTotalLength() || 0;
      path
        .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(1000)
        .ease(d3.easeCubicOut)
        .attr("stroke-dashoffset", 0);

      // Interactive Dots
      g.selectAll(`.dot_${machine.id}`)
        .data(dataPoints)
        .enter()
        .append("circle")
        .attr("class", `dot_${machine.id}`)
        .attr("cx", (d: any) => x(d.date))
        .attr("cy", (d: any) => y(d.utilization))
        .attr("r", 4)
        .attr("fill", color)
        .attr("stroke", "#FFFFFF")
        .attr("stroke-width", 2)
        .attr("cursor", "pointer")
        .on("mouseover", (event: any, d: any) => {
          d3.select(event.currentTarget).attr("r", 6);
          setSelectedHoverData({
            title: "Trend Noktası",
            machineName: `${machine.code} - ${machine.name}`,
            plannedHours: d.hours,
            capacityHours: shiftHours,
            utilizationRate: d.utilization,
            oee: machine.oee,
            activeWorkOrders: d.workOrders,
            dateStr: d.date.toLocaleDateString("tr-TR", { day: "numeric", month: "long" }),
          });
        })
        .on("mouseout", (event: any) => {
          d3.select(event.currentTarget).attr("r", 4);
        });
    });
  }, [displayedMachines, daysArray, shiftHours]);

  // Handlers for Date Navigation
  const handlePrevDate = () => {
    const d = new Date(selectedDate);
    if (period === "daily") d.setDate(d.getDate() - 1);
    else if (period === "weekly") d.setDate(d.getDate() - 7);
    else if (period === "biweekly") d.setDate(d.getDate() - 14);
    else d.setMonth(d.getMonth() - 1);
    setSelectedDate(d);
  };

  const handleNextDate = () => {
    const d = new Date(selectedDate);
    if (period === "daily") d.setDate(d.getDate() + 1);
    else if (period === "weekly") d.setDate(d.getDate() + 7);
    else if (period === "biweekly") d.setDate(d.getDate() + 14);
    else d.setMonth(d.getMonth() + 1);
    setSelectedDate(d);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner & KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Factory Capacity */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-purple-200/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-purple-950/70">
              Kurulu Tezgâh Kapasitesi
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200/60">
              <Factory className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {overallKPIs.totalCapacityHours}
            </span>
            <span className="text-xs text-purple-700 font-bold">Saat ({period === "daily" ? "Günlük" : "Dönemlik"})</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">
            {workstations.length} makine • {shiftHours} saat vardiya
          </div>
        </div>

        {/* Scheduled Hours & Utilization */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-purple-200/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-purple-950/70">
              Planlanan Yük & Doluluk
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200/60">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-indigo-900">
              %{overallKPIs.avgUtilization}
            </span>
            <span className="text-xs text-indigo-700 font-bold">
              ({overallKPIs.totalScheduledHours} saat)
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                overallKPIs.avgUtilization > 100
                  ? "bg-rose-500"
                  : overallKPIs.avgUtilization > 75
                  ? "bg-purple-600"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, overallKPIs.avgUtilization)}%` }}
            />
          </div>
        </div>

        {/* Factory Average OEE */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-purple-200/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-purple-950/70">
              Ortalama OEE Verimliliği
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-800">
              %{overallKPIs.avgOee}
            </span>
            <span className="text-xs text-emerald-700 font-bold">Dünya Standartı %85</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Kullanılabilirlik + Hız + Kalite</span>
          </div>
        </div>

        {/* Bottleneck / Overload Warnings */}
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border shadow-2xs transition-all ${
            overallKPIs.overloadedCount > 0
              ? "bg-rose-50/70 border-rose-300"
              : "bg-white border-purple-200/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-rose-950/80">
              Darboğaz / Aşırı Yük
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                overallKPIs.overloadedCount > 0
                  ? "bg-rose-100 text-rose-800 border-rose-300"
                  : "bg-purple-50 text-purple-700 border-purple-200/60"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-xl sm:text-2xl font-black ${
                overallKPIs.overloadedCount > 0 ? "text-rose-900" : "text-slate-900"
              }`}
            >
              {overallKPIs.overloadedCount}
            </span>
            <span className="text-xs text-rose-800 font-bold">
              {overallKPIs.overloadedCount > 0 ? "Tezgâhta Kapasite Aşımı" : "Tüm Tezgâhlar Dengeli"}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {overallKPIs.idleCount} tezgâh müsait / serbest
          </div>
        </div>
      </div>

      {/* Control Bar: Horizon Switcher, Machine Filter, Shift Selector */}
      <div className="bg-white rounded-2xl p-4 border border-purple-200/60 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Chart View Modes */}
          <div className="flex items-center gap-1 bg-purple-50/70 p-1 rounded-xl border border-purple-200/60 text-xs font-bold overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setActiveTab("all_dashboard")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === "all_dashboard"
                  ? "bg-[#8252F6] text-white shadow-xs"
                  : "text-purple-900/80 hover:bg-purple-100/60"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Tüm D3 Grafikleri</span>
            </button>

            <button
              onClick={() => setActiveTab("bar_comparison")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === "bar_comparison"
                  ? "bg-[#8252F6] text-white shadow-xs"
                  : "text-purple-900/80 hover:bg-purple-100/60"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Kapasite Çubukları</span>
            </button>

            <button
              onClick={() => setActiveTab("heatmap")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === "heatmap"
                  ? "bg-[#8252F6] text-white shadow-xs"
                  : "text-purple-900/80 hover:bg-purple-100/60"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Doluluk Isı Haritası</span>
            </button>

            <button
              onClick={() => setActiveTab("oee_breakdown")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === "oee_breakdown"
                  ? "bg-[#8252F6] text-white shadow-xs"
                  : "text-purple-900/80 hover:bg-purple-100/60"
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>OEE Verimlilik Arcları</span>
            </button>

            <button
              onClick={() => setActiveTab("trend_line")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === "trend_line"
                  ? "bg-[#8252F6] text-white shadow-xs"
                  : "text-purple-900/80 hover:bg-purple-100/60"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Zaman Trend Eğrisi</span>
            </button>
          </div>

          {/* Date Range Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevDate}
              className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200/60 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-1.5 rounded-xl bg-purple-100/80 hover:bg-purple-200/80 text-purple-950 font-extrabold text-xs border border-purple-300/60 transition-colors cursor-pointer"
            >
              Bugün
            </button>

            <div className="font-extrabold text-xs sm:text-sm text-slate-900 min-w-[150px] text-center">
              {daysArray[0]?.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} -{" "}
              {daysArray[daysArray.length - 1]?.toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>

            <button
              onClick={handleNextDate}
              className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200/60 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Period Selector */}
            <div className="hidden sm:flex items-center gap-1 ml-2 pl-2 border-l border-purple-200">
              {(["daily", "weekly", "biweekly", "monthly"] as AnalyticsPeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    period === p
                      ? "bg-purple-900 text-white shadow-2xs"
                      : "bg-purple-50/60 text-purple-900 hover:bg-purple-100"
                  }`}
                >
                  {p === "daily" ? "Günlük" : p === "weekly" ? "Haftalık" : p === "biweekly" ? "14 Gün" : "Aylık"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-purple-100">
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-purple-900 mb-1">
              Filtrelenecek Tezgâh / İstasyon
            </label>
            <select
              value={selectedMachineId}
              onChange={(e) => setSelectedMachineId(e.target.value)}
              className="w-full bg-purple-50/30 text-slate-800 text-xs rounded-xl px-3 py-1.5 border border-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-2xs"
            >
              <option value="all">Tüm Makineler ({workstations.length} İstasyon)</option>
              {workstations.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.code} - {ws.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-purple-900 mb-1">
              Çalışma Vardiya Düzeni (Günlük Kapasite)
            </label>
            <select
              value={shiftHours}
              onChange={(e) => setShiftHours(Number(e.target.value))}
              className="w-full bg-purple-50/30 text-slate-800 text-xs rounded-xl px-3 py-1.5 border border-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-2xs"
            >
              <option value={8}>Tek Vardiya (8 Saat / Gün)</option>
              <option value={16}>Çift Vardiya (16 Saat / Gün)</option>
              <option value={24}>Üç Vardiya (24 Saat Kesintisiz)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-purple-900 mb-1">
              Özet Bilgi & Tezgâh Durumu
            </label>
            <div className="flex items-center gap-2 pt-1 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {workstations.filter((w) => w.status === "running").length} Aktif
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {workstations.filter((w) => w.status === "idle").length} Boşta
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FLOATING / HOVER DETAIL INSPECTOR PANEL */}
      {selectedHoverData && (
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 shadow-xl border border-purple-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-purple-500/40 text-purple-200 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                {selectedHoverData.title}
              </span>
              {selectedHoverData.dateStr && (
                <span className="text-xs text-purple-300 font-bold">{selectedHoverData.dateStr}</span>
              )}
            </div>
            <h4 className="text-sm sm:text-base font-extrabold text-white">
              {selectedHoverData.machineName}
            </h4>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <span>Planlanan Yük: <b className="text-white">{selectedHoverData.plannedHours} Saat</b></span>
              <span>Kapasite: <b className="text-white">{selectedHoverData.capacityHours} Saat</b></span>
              <span>Doluluk: <b className={selectedHoverData.utilizationRate > 100 ? "text-rose-400 font-black" : "text-emerald-400 font-black"}>%{selectedHoverData.utilizationRate}</b></span>
              <span>OEE: <b className="text-purple-300 font-black">%{selectedHoverData.oee}</b></span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {selectedHoverData.activeWorkOrders.length > 0 ? (
              <div className="text-xs bg-purple-950/60 border border-purple-700/60 p-2 rounded-xl max-w-xs">
                <span className="text-[10px] text-purple-300 font-bold block mb-0.5">Atanan İş Emirleri:</span>
                <span className="text-white font-medium truncate block">
                  {selectedHoverData.activeWorkOrders.slice(0, 2).join(", ")}
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-400 italic">Bu aralıkta atanmış iş emri yok</span>
            )}
            <button
              onClick={() => setSelectedHoverData(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* D3 MAIN DASHBOARD / CHARTS GRID */}
      {(activeTab === "all_dashboard" || activeTab === "bar_comparison") && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-200/60 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-700" />
                <span>D3.js Tezgâh Bazlı Kapasite & Planlanan Yük Karşılaştırması</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mevcut vardiya kapasitesi ile planlanan operasyon sürelerinin makine bazında saatlik karşılaştırması
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-slate-300" />
                <span className="text-slate-600">Kurulu Kapasite</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-[#8252F6]" />
                <span className="text-purple-900">Planlanan Yük (Normal)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-rose-600" />
                <span className="text-rose-700">Aşırı Yük (&gt;%100)</span>
              </div>
            </div>
          </div>

          <div className="w-full overflow-x-auto custom-scrollbar">
            <svg ref={barChartRef} className="w-full h-auto min-h-[320px]" />
          </div>
        </div>
      )}

      {/* D3 HEATMAP MATRIX */}
      {(activeTab === "all_dashboard" || activeTab === "heatmap") && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-200/60 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-700" />
                <span>D3.js Günlük Makine Doluluk & Darboğaz Isı Haritası (Heatmap)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Hücre renk yoğunluğu tezgâhın o gündeki kapasite doluluk oranını gösterir; üzerine gelerek iş emirlerini inceleyin.
              </p>
            </div>

            {/* Color Scale Legend */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span className="text-[10px] font-bold text-slate-400">%0 (Boş)</span>
              <div className="flex h-3 w-28 rounded-md overflow-hidden border border-slate-200">
                <div className="flex-1 bg-slate-100" />
                <div className="flex-1 bg-purple-200" />
                <div className="flex-1 bg-purple-400" />
                <div className="flex-1 bg-[#8252F6]" />
                <div className="flex-1 bg-rose-600" />
              </div>
              <span className="text-[10px] font-bold text-rose-600">%100+ (Darboğaz)</span>
            </div>
          </div>

          <div className="w-full overflow-x-auto custom-scrollbar">
            <svg ref={heatmapRef} className="w-full h-auto min-h-[260px]" />
          </div>
        </div>
      )}

      {/* BOTTOM D3 DUAL GRID: OEE ARCS & TREND AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* D3 Multi-Gauge OEE Radial Chart */}
        {(activeTab === "all_dashboard" || activeTab === "oee_breakdown") && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-200/60 shadow-2xs flex flex-col justify-between">
            <div className="border-b border-purple-100 pb-2">
              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                <Gauge className="w-4 h-4 text-purple-700" />
                <span>D3.js OEE & Verimlilik Çemberi</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {displayedMachines[0]?.name || "Tüm Makineler"} için alt bileşenler
              </p>
            </div>

            <div className="flex items-center justify-center my-2">
              <svg ref={oeeGaugeRef} className="w-full max-w-[260px] h-[240px]" />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-purple-100 text-center">
              <div className="bg-cyan-50/70 p-2 rounded-xl border border-cyan-200/60">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-cyan-900 block">Kullanılabilirlik</span>
                <span className="text-xs font-black text-cyan-800">%{displayedMachines[0]?.availability || 88}</span>
              </div>
              <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-200/60">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-900 block">Performans</span>
                <span className="text-xs font-black text-emerald-800">%{displayedMachines[0]?.performance || 92}</span>
              </div>
              <div className="bg-amber-50/70 p-2 rounded-xl border border-amber-200/60">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-900 block">Kalite Oranı</span>
                <span className="text-xs font-black text-amber-800">%{displayedMachines[0]?.quality || 98}</span>
              </div>
            </div>
          </div>
        )}

        {/* D3 Capacity Trend Curve (2 Cols) */}
        {(activeTab === "all_dashboard" || activeTab === "trend_line") && (
          <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-5 border border-purple-200/60 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-purple-100 pb-2">
              <div>
                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-700" />
                  <span>D3.js Zaman Bazlı Kapasite Doluluk Eğrisi</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Dönem içerisindeki günlük tezgâh yük dalgalanmaları ve tepe noktaları
                </p>
              </div>

              <span className="text-xs text-purple-900 font-bold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                MonotoneX Eğri Enterpolasyonu
              </span>
            </div>

            <div className="w-full overflow-x-auto custom-scrollbar my-2">
              <svg ref={trendLineRef} className="w-full h-auto min-h-[250px]" />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-purple-100 text-xs text-slate-500">
              <div className="flex items-center gap-3">
                {displayedMachines.slice(0, 4).map((m, idx) => (
                  <div key={m.id} className="flex items-center gap-1 font-semibold">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor: ["#8252F6", "#06B6D4", "#10B981", "#F59E0B"][idx % 4],
                      }}
                    />
                    <span className="text-slate-800">{m.code}</span>
                  </div>
                ))}
              </div>
              <span className="text-[10px] text-slate-400">Noktaların üzerine gelerek detayları görüntüleyebilirsiniz.</span>
            </div>
          </div>
        )}
      </div>

      {/* TABULAR MACHINE CAPACITY BREAKDOWN & OEE TABLE */}
      <div className="bg-white rounded-2xl border border-purple-200/60 shadow-2xs overflow-hidden">
        <div className="p-4 bg-purple-50/50 border-b border-purple-200/60 flex items-center justify-between">
          <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-700" />
            <span>Tezgâh Kapasite ve Verimlilik Detay Tablosu</span>
          </h4>
          <span className="text-xs text-purple-900 font-bold">
            {machineMetrics.length} İş İstasyonu Listelendi
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-purple-100/60 text-purple-950 font-extrabold text-[10px] uppercase border-b border-purple-200">
                <th className="p-3">Tezgâh Kodu & Adı</th>
                <th className="p-3">Durum</th>
                <th className="p-3">Operatör</th>
                <th className="p-3 text-center">Günlük Kapasite</th>
                <th className="p-3 text-center">Planlanan Yük</th>
                <th className="p-3 text-center">Dönem Doluluğu</th>
                <th className="p-3 text-center">OEE Puanı</th>
                <th className="p-3 text-right">Saatlik Maliyet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100">
              {machineMetrics.map((m) => (
                <tr key={m.id} className="hover:bg-purple-50/30 transition-colors">
                  <td className="p-3 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] bg-purple-50 text-purple-900 px-1.5 py-0.5 rounded border border-purple-200">
                        {m.code}
                      </span>
                      <span>{m.name}</span>
                    </div>
                  </td>

                  <td className="p-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                        m.status === "running"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : m.status === "idle"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-rose-50 text-rose-800 border border-rose-200"
                      }`}
                    >
                      {m.status === "running" ? "Çalışıyor" : m.status === "idle" ? "Boşta" : "Bakımda"}
                    </span>
                  </td>

                  <td className="p-3 text-slate-700 font-medium">{m.operatorName}</td>

                  <td className="p-3 text-center font-mono text-slate-700 font-medium">
                    {m.standardCapacityHours} sa/gün
                  </td>

                  <td className="p-3 text-center font-mono font-bold text-purple-950">
                    {m.totalScheduledHours} saat
                  </td>

                  <td className="p-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md font-mono font-bold text-xs ${
                        m.overallUtilization > 100
                          ? "bg-rose-100 text-rose-800 border border-rose-300"
                          : m.overallUtilization > 80
                          ? "bg-purple-100 text-purple-950 border border-purple-300"
                          : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      %{m.overallUtilization}
                    </span>
                  </td>

                  <td className="p-3 text-center">
                    <span className="font-mono font-black text-emerald-800">%{m.oee}</span>
                  </td>

                  <td className="p-3 text-right font-mono font-bold text-slate-800">
                    {m.hourlyCost} ₺/saat
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
