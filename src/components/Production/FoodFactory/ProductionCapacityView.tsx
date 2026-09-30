import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from "recharts";
import {
  Cpu,
  Gauge,
  Layers,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  Printer,
  Sliders,
  Sparkles,
  Info,
  RefreshCw,
  Zap,
  Flame,
  ArrowUpRight,
  ShieldAlert,
  CookingPot,
  Activity,
  Plus,
  BarChart3,
  Server,
} from "lucide-react";
import { FoodProductionOrder, FoodRecipe, FoodMenuPlan } from "../../../types";
import { formatCurrency, exportToExcel } from "../../../utils/exportUtils";

export interface MachineWorkstation {
  id: string;
  code: string;
  name: string;
  category: "kettle" | "oven" | "fryer_cooktop" | "prep" | "chiller" | "packaging" | "bakery";
  categoryLabel: string;
  nominalCapacityPerHour: number;
  capacityUnit: string; // "Porsiyon/saat" | "Litre/saat" | "Kg/saat"
  maxDailyCapacityUnits: number; // 8 saatlik nominal günlük kapasite
  actualDailyOutputUnits: number;
  plannedDailyOutputUnits: number;
  utilizationRate: number; // % (actual / max)
  plannedUtilizationRate: number; // % (planned / max)
  activeRunHours: number;
  idleHours: number;
  maintenanceHours: number;
  oeeScore: number; // % OEE (Overall Equipment Effectiveness)
  status: "running" | "idle_ready" | "overloaded" | "maintenance" | "cleaning";
  operatorName: string;
  temperatureOrPressure?: string;
  nextMaintenanceDate: string;
  energyKwhPerHour: number;
}

export interface DailyProductionVolumeData {
  date: string; // YYYY-MM-DD
  formattedDate: string; // "01 Eyl Pzt"
  dayName: string;
  plannedVolume: number; // porsiyon
  actualVolume: number; // porsiyon
  variance: number; // actual - planned
  achievementRate: number; // % (actual / planned * 100)
  defectWastePortions: number;
  totalActiveMachines: number;
  avgMachineUtilization: number; // %
  topDishes: string;
}

interface ProductionCapacityViewProps {
  productionOrders: FoodProductionOrder[];
  recipes?: FoodRecipe[];
  menus?: FoodMenuPlan[];
  onNavigateToOrders?: () => void;
}

export const ProductionCapacityView: React.FC<ProductionCapacityViewProps> = ({
  productionOrders,
  recipes = [],
  menus = [],
  onNavigateToOrders,
}) => {
  // Filters & State
  const [dateRange, setDateRange] = useState<"7days" | "14days" | "month">("14days");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeShiftHours, setActiveShiftHours] = useState<number>(8); // 8, 10, 16
  const [simulatedExtraPortions, setSimulatedExtraPortions] = useState<number>(0);
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [showSimulator, setShowSimulator] = useState<boolean>(false);

  // Initial Machine / Workstation List
  const initialMachines: MachineWorkstation[] = useMemo(() => [
    {
      id: "mch_01",
      code: "KZN-500-A",
      name: "Buharlı Devirme Çorba Kazanı (500L)",
      category: "kettle",
      categoryLabel: "Devirme Buhar Kazanları",
      nominalCapacityPerHour: 300,
      capacityUnit: "Porsiyon/saat",
      maxDailyCapacityUnits: 2400,
      actualDailyOutputUnits: 2110,
      plannedDailyOutputUnits: 2200,
      utilizationRate: 87.9,
      plannedUtilizationRate: 91.7,
      activeRunHours: 7.0,
      idleHours: 0.8,
      maintenanceHours: 0.2,
      oeeScore: 86.4,
      status: "running",
      operatorName: "Mehmet Çetin Usta",
      temperatureOrPressure: "102°C / 1.8 Bar Buhar",
      nextMaintenanceDate: "2026-10-15",
      energyKwhPerHour: 14.5,
    },
    {
      id: "mch_02",
      code: "KZN-350-B",
      name: "Devirme Sebze & Bakliyat Kazanı (350L)",
      category: "kettle",
      categoryLabel: "Devirme Buhar Kazanları",
      nominalCapacityPerHour: 220,
      capacityUnit: "Porsiyon/saat",
      maxDailyCapacityUnits: 1760,
      actualDailyOutputUnits: 1460,
      plannedDailyOutputUnits: 1550,
      utilizationRate: 83.0,
      plannedUtilizationRate: 88.1,
      activeRunHours: 6.6,
      idleHours: 1.4,
      maintenanceHours: 0.0,
      oeeScore: 84.1,
      status: "running",
      operatorName: "Hasan Yıldız Usta",
      temperatureOrPressure: "98°C / 1.6 Bar Buhar",
      nextMaintenanceDate: "2026-10-22",
      energyKwhPerHour: 11.2,
    },
    {
      id: "mch_03",
      code: "FRN-KMB-20",
      name: "Kombili Buharlı Konveksiyon Fırın A (20 Tepsi)",
      category: "oven",
      categoryLabel: "Konveksiyonel Fırınlar",
      nominalCapacityPerHour: 260,
      capacityUnit: "Porsiyon/saat",
      maxDailyCapacityUnits: 2080,
      actualDailyOutputUnits: 1890,
      plannedDailyOutputUnits: 1950,
      utilizationRate: 90.9,
      plannedUtilizationRate: 93.8,
      activeRunHours: 7.3,
      idleHours: 0.5,
      maintenanceHours: 0.2,
      oeeScore: 89.2,
      status: "running",
      operatorName: "Selim Kaya (Fırıncı)",
      temperatureOrPressure: "185°C / %40 Buhar Enjeksiyon",
      nextMaintenanceDate: "2026-09-30",
      energyKwhPerHour: 18.0,
    },
    {
      id: "mch_04",
      code: "FRN-KMB-40",
      name: "Kombili Buharlı Konveksiyon Fırın B (40 Tepsi - Et & Köfte)",
      category: "oven",
      categoryLabel: "Konveksiyonel Fırınlar",
      nominalCapacityPerHour: 380,
      capacityUnit: "Porsiyon/saat",
      maxDailyCapacityUnits: 3040,
      actualDailyOutputUnits: 2900,
      plannedDailyOutputUnits: 2950,
      utilizationRate: 95.4,
      plannedUtilizationRate: 97.0,
      activeRunHours: 7.6,
      idleHours: 0.4,
      maintenanceHours: 0.0,
      oeeScore: 92.5,
      status: "overloaded",
      operatorName: "Mustafa Güner Usta",
      temperatureOrPressure: "210°C / %30 Nem",
      nextMaintenanceDate: "2026-09-25",
      energyKwhPerHour: 28.5,
    },
    {
      id: "mch_05",
      code: "TNL-ZG-01",
      name: "Sürekli Konveyör Izgara & Döküm Pişirme Tüneli",
      category: "fryer_cooktop",
      categoryLabel: "Izgara & Kızartma Hatları",
      nominalCapacityPerHour: 280,
      capacityUnit: "Porsiyon/saat",
      maxDailyCapacityUnits: 2240,
      actualDailyOutputUnits: 1540,
      plannedDailyOutputUnits: 1600,
      utilizationRate: 68.8,
      plannedUtilizationRate: 71.4,
      activeRunHours: 5.5,
      idleHours: 2.2,
      maintenanceHours: 0.3,
      oeeScore: 78.5,
      status: "running",
      operatorName: "Murat Demir",
      temperatureOrPressure: "240°C Döküm Yüzey",
      nextMaintenanceDate: "2026-10-10",
      energyKwhPerHour: 16.2,
    },
    {
      id: "mch_06",
      code: "SBZ-PREP-01",
      name: "Otomatik Sebze Yıkama, Soyma & Dilimleme Hattı",
      category: "prep",
      categoryLabel: "Sebze & Hammadde Hazırlık",
      nominalCapacityPerHour: 350,
      capacityUnit: "Kg/saat",
      maxDailyCapacityUnits: 2800,
      actualDailyOutputUnits: 2080,
      plannedDailyOutputUnits: 2150,
      utilizationRate: 74.3,
      plannedUtilizationRate: 76.8,
      activeRunHours: 5.9,
      idleHours: 1.8,
      maintenanceHours: 0.3,
      oeeScore: 81.0,
      status: "running",
      operatorName: "Ayşe Korkmaz",
      temperatureOrPressure: "Ozonlu Yıkama Suyu 12°C",
      nextMaintenanceDate: "2026-10-05",
      energyKwhPerHour: 8.5,
    },
    {
      id: "mch_07",
      code: "BLST-CHL-01",
      name: "Hızlı Şok Soğutma & Dinlendirme Odası (Blast Chiller)",
      category: "chiller",
      categoryLabel: "Soğuk Zincir & Şoklama",
      nominalCapacityPerHour: 400,
      capacityUnit: "Kg/parti",
      maxDailyCapacityUnits: 3200,
      actualDailyOutputUnits: 1980,
      plannedDailyOutputUnits: 2100,
      utilizationRate: 61.9,
      plannedUtilizationRate: 65.6,
      activeRunHours: 5.0,
      idleHours: 2.8,
      maintenanceHours: 0.2,
      oeeScore: 85.0,
      status: "idle_ready",
      operatorName: "Kemal Şahin (Depo/Soğuk)",
      temperatureOrPressure: "-18°C Şok / +3°C Oda",
      nextMaintenanceDate: "2026-11-01",
      energyKwhPerHour: 22.0,
    },
    {
      id: "mch_08",
      code: "TRM-PKT-02",
      name: "Otomatik Termobox Vakum Dolum & Porsiyonlama Hattı",
      category: "packaging",
      categoryLabel: "Paketleme & Sevkiyat Hattı",
      nominalCapacityPerHour: 450,
      capacityUnit: "Porsiyon/saat",
      maxDailyCapacityUnits: 3600,
      actualDailyOutputUnits: 3120,
      plannedDailyOutputUnits: 3250,
      utilizationRate: 86.7,
      plannedUtilizationRate: 90.3,
      activeRunHours: 6.9,
      idleHours: 0.9,
      maintenanceHours: 0.2,
      oeeScore: 88.7,
      status: "running",
      operatorName: "Ebru Erdem (Paketleme Şefi)",
      temperatureOrPressure: "+75°C Termo Yalıtım",
      nextMaintenanceDate: "2026-09-28",
      energyKwhPerHour: 6.5,
    },
    {
      id: "mch_09",
      code: "EKM-TTL-01",
      name: "Spiral Mikser & Taş Tabanlı Ekmek/Tatlı Fırını",
      category: "bakery",
      categoryLabel: "Unlu Mamuller & Tatlıhane",
      nominalCapacityPerHour: 200,
      capacityUnit: "Adet/saat",
      maxDailyCapacityUnits: 1600,
      actualDailyOutputUnits: 940,
      plannedDailyOutputUnits: 1050,
      utilizationRate: 58.8,
      plannedUtilizationRate: 65.6,
      activeRunHours: 4.7,
      idleHours: 3.1,
      maintenanceHours: 0.2,
      oeeScore: 76.2,
      status: "idle_ready",
      operatorName: "Ahmet Usta (Tatlıhane)",
      temperatureOrPressure: "190°C Statik Isı",
      nextMaintenanceDate: "2026-10-18",
      energyKwhPerHour: 15.0,
    },
  ], []);

  // Daily Planned vs. Actual Historical Data (September 2026)
  const fullDailyHistory: DailyProductionVolumeData[] = useMemo(() => [
    {
      date: "2026-09-01",
      formattedDate: "01 Eyl Sal",
      dayName: "Salı",
      plannedVolume: 1850,
      actualVolume: 1820,
      variance: -30,
      achievementRate: 98.4,
      defectWastePortions: 12,
      totalActiveMachines: 9,
      avgMachineUtilization: 81.2,
      topDishes: "İzmir Köfte & Bulgur Pilavı",
    },
    {
      date: "2026-09-02",
      formattedDate: "02 Eyl Çar",
      dayName: "Çarşamba",
      plannedVolume: 2100,
      actualVolume: 2150,
      variance: 50,
      achievementRate: 102.4,
      defectWastePortions: 18,
      totalActiveMachines: 9,
      avgMachineUtilization: 88.5,
      topDishes: "Etli İspir Kuru Fasulye & Pirinç Pilavı",
    },
    {
      date: "2026-09-03",
      formattedDate: "03 Eyl Per",
      dayName: "Perşembe",
      plannedVolume: 1950,
      actualVolume: 1910,
      variance: -40,
      achievementRate: 97.9,
      defectWastePortions: 15,
      totalActiveMachines: 8,
      avgMachineUtilization: 83.4,
      topDishes: "Fırın Tavuk Baget & Fırın Makarna",
    },
    {
      date: "2026-09-04",
      formattedDate: "04 Eyl Cum",
      dayName: "Cuma",
      plannedVolume: 2250,
      actualVolume: 2280,
      variance: 30,
      achievementRate: 101.3,
      defectWastePortions: 22,
      totalActiveMachines: 9,
      avgMachineUtilization: 91.0,
      topDishes: "Dana Tas Kebabı & Şehriyeli Pilav",
    },
    {
      date: "2026-09-05",
      formattedDate: "05 Eyl Cmt",
      dayName: "Cumartesi",
      plannedVolume: 1200,
      actualVolume: 1180,
      variance: -20,
      achievementRate: 98.3,
      defectWastePortions: 8,
      totalActiveMachines: 6,
      avgMachineUtilization: 64.5,
      topDishes: "Şantiye Nöbetçi Menüsü (Nohut & Bulgur)",
    },
    {
      date: "2026-09-06",
      formattedDate: "06 Eyl Paz",
      dayName: "Pazar",
      plannedVolume: 850,
      actualVolume: 840,
      variance: -10,
      achievementRate: 98.8,
      defectWastePortions: 5,
      totalActiveMachines: 5,
      avgMachineUtilization: 48.2,
      topDishes: "Hafta Sonu Şantiye & Sağlık Kumanyası",
    },
    {
      date: "2026-09-07",
      formattedDate: "07 Eyl Pzt",
      dayName: "Pazartesi",
      plannedVolume: 2300,
      actualVolume: 2240,
      variance: -60,
      achievementRate: 97.4,
      defectWastePortions: 25,
      totalActiveMachines: 9,
      avgMachineUtilization: 89.6,
      topDishes: "Mercimek Çorbası + Dana Tas Kebap + Revani",
    },
    {
      date: "2026-09-08",
      formattedDate: "08 Eyl Sal",
      dayName: "Salı",
      plannedVolume: 2050,
      actualVolume: 2020,
      variance: -30,
      achievementRate: 98.5,
      defectWastePortions: 14,
      totalActiveMachines: 9,
      avgMachineUtilization: 84.1,
      topDishes: "Tavuk Sote & Domatesli Burgu Makarna",
    },
    {
      date: "2026-09-09",
      formattedDate: "09 Eyl Çar",
      dayName: "Çarşamba",
      plannedVolume: 2400,
      actualVolume: 2360,
      variance: -40,
      achievementRate: 98.3,
      defectWastePortions: 20,
      totalActiveMachines: 9,
      avgMachineUtilization: 93.2,
      topDishes: "Kuru Fasulye & Pilav & Turşu Günü",
    },
    {
      date: "2026-09-10",
      formattedDate: "10 Eyl Per",
      dayName: "Perşembe",
      plannedVolume: 1980,
      actualVolume: 1960,
      variance: -20,
      achievementRate: 99.0,
      defectWastePortions: 16,
      totalActiveMachines: 9,
      avgMachineUtilization: 82.5,
      topDishes: "Karnıyarık & Şehriyeli Pirinç Pilavı",
    },
    {
      date: "2026-09-11",
      formattedDate: "11 Eyl Cum",
      dayName: "Cuma",
      plannedVolume: 2350,
      actualVolume: 2390,
      variance: 40,
      achievementRate: 101.7,
      defectWastePortions: 24,
      totalActiveMachines: 9,
      avgMachineUtilization: 92.8,
      topDishes: "Hasanpaşa Köfte & Çorba & Şekerpare",
    },
    {
      date: "2026-09-12",
      formattedDate: "12 Eyl Cmt",
      dayName: "Cumartesi",
      plannedVolume: 1250,
      actualVolume: 1220,
      variance: -30,
      achievementRate: 97.6,
      defectWastePortions: 9,
      totalActiveMachines: 6,
      avgMachineUtilization: 66.0,
      topDishes: "Hafta Sonu Şantiye Nöbet Menüsü",
    },
    {
      date: "2026-09-13",
      formattedDate: "13 Eyl Paz",
      dayName: "Pazar",
      plannedVolume: 900,
      actualVolume: 890,
      variance: -10,
      achievementRate: 98.9,
      defectWastePortions: 6,
      totalActiveMachines: 5,
      avgMachineUtilization: 50.4,
      topDishes: "Hafta Sonu Dinlenme & Kumanya",
    },
    {
      date: "2026-09-14",
      formattedDate: "14 Eyl Pzt",
      dayName: "Pazartesi (Bugün)",
      plannedVolume: 2450,
      actualVolume: 2410,
      variance: -40,
      achievementRate: 98.4,
      defectWastePortions: 21,
      totalActiveMachines: 9,
      avgMachineUtilization: 94.6,
      topDishes: "Orman Kebabı & Meyhane Pilavı & Sütlaç",
    },
  ], []);

  // Filtered Daily History
  const filteredDailyHistory = useMemo(() => {
    if (dateRange === "7days") {
      return fullDailyHistory.slice(-7);
    }
    if (dateRange === "14days") {
      return fullDailyHistory.slice(-14);
    }
    return fullDailyHistory;
  }, [fullDailyHistory, dateRange]);

  // Adjust machine calculations based on active shift & simulated extra portions
  const adjustedMachines: MachineWorkstation[] = useMemo(() => {
    const shiftMultiplier = activeShiftHours / 8;
    return initialMachines.map((m) => {
      const adjustedMaxCapacity = Math.round(m.maxDailyCapacityUnits * shiftMultiplier);
      const addedLoad = simulatedExtraPortions > 0 ? Math.round(simulatedExtraPortions * 0.35) : 0;
      const newActualOutput = m.actualDailyOutputUnits + addedLoad;
      const newPlannedOutput = m.plannedDailyOutputUnits + simulatedExtraPortions;
      const newUtilRate = Math.min(125, Number(((newActualOutput / adjustedMaxCapacity) * 100).toFixed(1)));
      const newPlannedUtilRate = Math.min(125, Number(((newPlannedOutput / adjustedMaxCapacity) * 100).toFixed(1)));

      let newStatus: MachineWorkstation["status"] = m.status;
      if (newUtilRate > 92) {
        newStatus = "overloaded";
      } else if (newUtilRate > 70) {
        newStatus = "running";
      } else {
        newStatus = "idle_ready";
      }

      return {
        ...m,
        maxDailyCapacityUnits: adjustedMaxCapacity,
        actualDailyOutputUnits: newActualOutput,
        plannedDailyOutputUnits: newPlannedOutput,
        utilizationRate: newUtilRate,
        plannedUtilizationRate: newPlannedUtilRate,
        status: newStatus,
      };
    });
  }, [initialMachines, activeShiftHours, simulatedExtraPortions]);

  // Filtered Machines by Category
  const filteredMachines = useMemo(() => {
    if (selectedCategory === "all") return adjustedMachines;
    return adjustedMachines.filter((m) => m.category === selectedCategory);
  }, [adjustedMachines, selectedCategory]);

  // Aggregate KPI Metrics
  const aggregateMetrics = useMemo(() => {
    const totalPlanned = filteredDailyHistory.reduce((sum, d) => sum + d.plannedVolume, 0);
    const totalActual = filteredDailyHistory.reduce((sum, d) => sum + d.actualVolume, 0);
    const totalVariance = totalActual - totalPlanned;
    const avgAchievement = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;
    const totalWaste = filteredDailyHistory.reduce((sum, d) => sum + d.defectWastePortions, 0);

    const avgMachineUtil =
      adjustedMachines.length > 0
        ? adjustedMachines.reduce((sum, m) => sum + m.utilizationRate, 0) / adjustedMachines.length
        : 0;

    const overloadedCount = adjustedMachines.filter((m) => m.utilizationRate >= 92).length;
    const optimalCount = adjustedMachines.filter((m) => m.utilizationRate >= 70 && m.utilizationRate < 92).length;
    const idleCount = adjustedMachines.filter((m) => m.utilizationRate < 70).length;

    const highestUtilMachine = [...adjustedMachines].sort((a, b) => b.utilizationRate - a.utilizationRate)[0];

    const totalFacilityCapacity = adjustedMachines.reduce((sum, m) => sum + m.maxDailyCapacityUnits, 0);

    return {
      totalPlanned,
      totalActual,
      totalVariance,
      avgAchievement,
      totalWaste,
      avgMachineUtil,
      overloadedCount,
      optimalCount,
      idleCount,
      highestUtilMachine,
      totalFacilityCapacity,
    };
  }, [filteredDailyHistory, adjustedMachines]);

  // Selected Machine Details
  const selectedMachine = useMemo(() => {
    if (!selectedMachineId) return null;
    return adjustedMachines.find((m) => m.id === selectedMachineId) || null;
  }, [adjustedMachines, selectedMachineId]);

  // Export handler
  const handleExportData = () => {
    const headers = ["Tarih", "Gün", "Planlanan Hacim", "Fiili Hacim", "Fark", "Başarım (%)", "Fire / İade", "Ortalama Makine Doluluk (%)"];
    const rows = filteredDailyHistory.map((d) => [
      d.date,
      d.dayName,
      d.plannedVolume,
      d.actualVolume,
      d.variance,
      `${d.achievementRate}%`,
      d.defectWastePortions,
      `%${d.avgMachineUtilization}`,
    ]);

    exportToExcel({
      filename: "Uretim_Kapasite_ve_Doluluk_Raporu",
      sheetName: "Kapasite ve Doluluk",
      title: "Üretim Kapasitesi & Makine Doluluk Analiz Raporu",
      subtitle: "Günlük makine kullanım oranları ve planlanan vs gerçekleşen hacim dökümü",
      headers,
      rows,
    });
  };

  // Color helper for utilization bar
  const getUtilColor = (rate: number) => {
    if (rate >= 92) return "#e11d48"; // Rose/Red (Overloaded / Bottleneck)
    if (rate >= 85) return "#f59e0b"; // Amber (Near capacity)
    if (rate >= 65) return "#0284c7"; // Blue/Sky (Optimal)
    return "#64748b"; // Slate (Underutilized / Idle)
  };

  return (
    <div className="space-y-6">
      {/* 🏭 ÜST KARŞILAMA VE KONTROL ÇUBUĞU */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-sm relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-indigo-500/10 skew-x-12 transform pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase text-indigo-300">
              <Cpu className="w-3.5 h-3.5" />
              <span>Üretim Kapasitesi & Hat Doluluk Analizi (OEE)</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
              Kapasite, Makine Kullanımı & Hacim İzleme
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Günlük kazan, konveksiyon fırın, hazırlık ve dolum hatlarının doluluk oranlarını gerçek zamanlı takip edin. Planlanan vs. gerçekleşen üretim hacmini Recharts grafikleri ile karşılaştırarak darboğazları önceden tespit edin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowSimulator(!showSimulator)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                showSimulator
                  ? "bg-amber-500 text-slate-950 font-bold shadow-md"
                  : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>{showSimulator ? "Simülatörü Kapat" : "Kapasite Simülasyonu"}</span>
            </button>

            <button
              type="button"
              onClick={handleExportData}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Excel Raporu</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 🎛️ KAPASİTE SİMÜLATÖRÜ PANELİ (Açılır Kapanır) */}
      {showSimulator && (
        <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-5 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Canlı Kapasite & Ek Sipariş Simülasyonu (What-If Analysis)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Ekstra porsiyon taleplerini veya vardiya saatini değiştirerek tesis makinelerindeki yükü ve olası darboğazları test edin.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveShiftHours(8);
                setSimulatedExtraPortions(0);
              }}
              className="text-xs text-amber-800 dark:text-amber-300 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sıfırla</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Vardiya Saati Ayarı */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-amber-200/70 dark:border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>Günlük Aktif Vardiya Süresi:</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-bold">
                  {activeShiftHours} Saat / Gün
                </span>
              </label>
              <div className="flex items-center gap-2 pt-1">
                {[8, 10, 12, 16].map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => setActiveShiftHours(hrs)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeShiftHours === hrs
                        ? "bg-amber-500 text-slate-950 shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    {hrs === 16 ? "Çift Vardiya (16s)" : `${hrs}s`}
                  </button>
                ))}
              </div>
              <p className="text-2xs text-slate-500">
                {activeShiftHours > 8
                  ? "Vardiya uzatmasıyla nominal makine kapasitesi %" + Math.round(((activeShiftHours - 8) / 8) * 100) + " genişletildi."
                  : "Standart tek vardiya (06:00 - 14:00) üretim temposu."}
              </p>
            </div>

            {/* Ek Sipariş Porsiyon Simülasyonu */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-amber-200/70 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Simüle Edilen Ekstra Sipariş:
                </label>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                  +{simulatedExtraPortions} Porsiyon
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                step="50"
                value={simulatedExtraPortions}
                onChange={(e) => setSimulatedExtraPortions(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-2xs text-slate-400">
                <span>0</span>
                <span>+250</span>
                <span>+500</span>
                <span>+750</span>
                <span>+1000</span>
              </div>
            </div>

            {/* Simülasyon Sonucu / Risk Durumu */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-amber-200/70 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Simülasyon Değerlendirmesi</span>
                {aggregateMetrics.overloadedCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {aggregateMetrics.overloadedCount} Darboğaz Riski
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Kapasite Güvenli
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                {aggregateMetrics.overloadedCount > 0
                  ? `Simüle edilen yükte özellikle "${aggregateMetrics.highestUtilMachine?.name}" %${aggregateMetrics.highestUtilMachine?.utilizationRate} seviyesine ulaşarak aşırı yükleniyor!`
                  : "Mevcut makine parkuru ve vardiya düzeni ilave hacmi güvenle kaldıracak seviyede."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 📊 KPI ÖZET KARTLARI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ortalama Makine Doluluk */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Ortalama Makine Doluluk</span>
            <Gauge className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              %{aggregateMetrics.avgMachineUtil.toFixed(1)}
            </span>
            <span className="text-2xs font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Optimal Bant (%75-%88)
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, aggregateMetrics.avgMachineUtil)}%`,
                backgroundColor: getUtilColor(aggregateMetrics.avgMachineUtil),
              }}
            />
          </div>
          <p className="text-2xs text-slate-500 pt-1">
            {aggregateMetrics.optimalCount} makine verimli bantta, {aggregateMetrics.idleCount} yedek kapasitede.
          </p>
        </div>

        {/* Planlanan vs Fiili Toplam Hacim */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Toplam Üretim Hacmi</span>
            <CookingPot className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {aggregateMetrics.totalActual.toLocaleString("tr-TR")}
            </span>
            <span className="text-xs text-slate-500">
              / {aggregateMetrics.totalPlanned.toLocaleString("tr-TR")} Pors.
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-2xs font-semibold text-emerald-600 dark:text-emerald-400 pt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>%{aggregateMetrics.avgAchievement.toFixed(1)} Plan Gerçekleşme Oranı</span>
          </div>
          <p className="text-2xs text-slate-500">
            Net sapma: {aggregateMetrics.totalVariance >= 0 ? `+${aggregateMetrics.totalVariance}` : aggregateMetrics.totalVariance} porsiyon
          </p>
        </div>

        {/* En Kritik / Darboğaz İstasyonu */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>En Yüksek Yük (Pik İstasyon)</span>
            <Flame className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              %{aggregateMetrics.highestUtilMachine?.utilizationRate.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[130px]" title={aggregateMetrics.highestUtilMachine?.name}>
              {aggregateMetrics.highestUtilMachine?.name.split("(")[0]}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-rose-500 transition-all duration-500"
              style={{ width: `${Math.min(100, aggregateMetrics.highestUtilMachine?.utilizationRate || 0)}%` }}
            />
          </div>
          <p className="text-2xs text-slate-500 pt-1">
            {aggregateMetrics.overloadedCount > 0
              ? `${aggregateMetrics.overloadedCount} makine kritik %92 eşiğinin üzerinde!`
              : "Tüm istasyonlar nominal kapasite sınırında."}
          </p>
        </div>

        {/* Toplam Tesis Nominal Kapasitesi */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Günlük Nominal Tavan Kapasite</span>
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {aggregateMetrics.totalFacilityCapacity.toLocaleString("tr-TR")}
            </span>
            <span className="text-xs text-slate-500">Birim/Gün</span>
          </div>
          <div className="flex items-center gap-1 text-2xs font-semibold text-slate-600 dark:text-slate-300 pt-1">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>{activeShiftHours} saat vardiya bazlı maksimum teorik sınır</span>
          </div>
          <p className="text-2xs text-slate-500">
            Boş / Genişleme Rezervi: ~%{(100 - aggregateMetrics.avgMachineUtil).toFixed(1)}
          </p>
        </div>
      </div>

      {/* 📈 GRAFİK BÖLÜMÜ 1: PLANLANAN VS. GERÇEKLEŞEN ÜRETİM HACMİ (RECHARTS) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Planlanan vs. Gerçekleşen Üretim Hacmi (Porsiyon)
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Günlük mutfak iş emirleri kapsamında hedeflenen porsiyon sayısı ile fiili üretim gerçekleşme performansının karşılaştırması.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">Dönem:</span>
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setDateRange("7days")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  dateRange === "7days"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Son 7 Gün
              </button>
              <button
                type="button"
                onClick={() => setDateRange("14days")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  dateRange === "14days"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Son 14 Gün
              </button>
              <button
                type="button"
                onClick={() => setDateRange("month")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  dateRange === "month"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Tüm Ay (Eylül)
              </button>
            </div>
          </div>
        </div>

        {/* Recharts ComposedChart: Planned Bar, Actual Bar, Achievement % Line */}
        <div className="w-full h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={filteredDailyHistory}
              margin={{ top: 10, right: 25, left: 0, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="formattedDate"
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickLine={false}
                axisLine={{ stroke: "#cbd5e1" }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
                domain={[0, "auto"]}
                tickFormatter={(val) => `${val.toLocaleString("tr-TR")}`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[80, 115]}
                tick={{ fontSize: 11, fill: "#10b981" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `%${val}`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as DailyProductionVolumeData;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-800 text-xs space-y-2 min-w-[220px]">
                        <div className="border-b border-slate-700 pb-1.5 flex items-center justify-between">
                          <span className="font-bold text-indigo-300">{data.formattedDate}</span>
                          <span className="px-1.5 py-0.5 rounded text-2xs bg-white/10 font-mono">
                            {data.dayName}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Planlanan Hacim:</span>
                            <span className="font-semibold">{data.plannedVolume.toLocaleString("tr-TR")} porsiyon</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sky-400 font-medium">Fiili Gerçekleşen:</span>
                            <span className="font-bold text-sky-300">{data.actualVolume.toLocaleString("tr-TR")} porsiyon</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Net Sapma:</span>
                            <span className={`font-semibold ${data.variance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                              {data.variance >= 0 ? `+${data.variance}` : data.variance} porsiyon
                            </span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-800">
                            <span className="text-emerald-400 font-medium">Uyum / Başarım:</span>
                            <span className="font-bold text-emerald-300">%{data.achievementRate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Makine Doluluğu:</span>
                            <span className="font-semibold text-slate-200">%{data.avgMachineUtilization}</span>
                          </div>
                        </div>
                        {data.topDishes && (
                          <div className="pt-1.5 border-t border-slate-800 text-2xs text-slate-300">
                            <span className="text-amber-400 font-semibold">Ana Menü: </span>
                            {data.topDishes}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 15, fontSize: 12 }}
              />
              <ReferenceLine
                yAxisId="right"
                y={100}
                stroke="#10b981"
                strokeDasharray="4 4"
                label={{ value: "100% Hedef", position: "insideTopRight", fill: "#10b981", fontSize: 10 }}
              />
              <Bar
                yAxisId="left"
                dataKey="plannedVolume"
                name="Planlanan Hacim (Pors.)"
                fill="#cbd5e1"
                radius={[4, 4, 0, 0]}
                barSize={18}
              />
              <Bar
                yAxisId="left"
                dataKey="actualVolume"
                name="Fiili Gerçekleşen (Pors.)"
                fill="#0284c7"
                radius={[4, 4, 0, 0]}
                barSize={18}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="achievementRate"
                name="Plan Uyum Oranı (%)"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#10b981", strokeWidth: 1, stroke: "#fff" }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Alt Bilgi İpuçları */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>
              Hafta içi ortalama <strong>2,100 - 2,450 porsiyon</strong> aralığında tabldot üretimi yapılırken, hafta sonu şantiye nöbet ekipleri için kumanya üretimi yapılmaktadır.
            </span>
          </div>
          {onNavigateToOrders && (
            <button
              type="button"
              onClick={onNavigateToOrders}
              className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <span>Mutfak İş Emirlerine Git</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ⚙️ GRAFİK BÖLÜMÜ 2: GÜNLÜK MAKİNE VE İSTASYON KULLANIM ORANLARI (RECHARTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol 2 Kolon: Yatay BarChart Makine Doluluk Oranları */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Gauge className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Günlük Makine ve İstasyon Kullanım Oranları (%)
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                8 saatlik nominal çalışma kapasitesine göre istasyon bazlı anlık doluluk ve yük faktörü.
              </p>
            </div>

            {/* Kategori Filtresi */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all">Tüm İstasyonlar ({adjustedMachines.length})</option>
                <option value="kettle">Buhar Kazanları</option>
                <option value="oven">Konveksiyon Fırınlar</option>
                <option value="fryer_cooktop">Izgara Tüneli</option>
                <option value="prep">Hazırlık & Doğrama</option>
                <option value="chiller">Şok Soğutma</option>
                <option value="packaging">Paketleme Hattı</option>
                <option value="bakery">Tatlıhane & Ekmek</option>
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Recharts BarChart: Horizontal layout with threshold reference lines */}
          <div className="w-full h-88 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={filteredMachines}
                margin={{ top: 10, right: 35, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  domain={[0, 110]}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(val) => `%${val}`}
                />
                <YAxis
                  type="category"
                  dataKey="code"
                  tick={{ fontSize: 11, fill: "#334155", fontWeight: 600 }}
                  tickLine={false}
                  axisLine={{ stroke: "#cbd5e1" }}
                  width={90}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const m = payload[0].payload as MachineWorkstation;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-800 text-xs space-y-1.5 min-w-[240px]">
                          <div className="font-bold text-indigo-300 border-b border-slate-700 pb-1">
                            {m.name} ({m.code})
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">İstasyon Grubu:</span>
                            <span className="font-medium">{m.categoryLabel}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Fiili Doluluk:</span>
                            <span className="font-bold text-amber-400">%{m.utilizationRate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Planlanan Doluluk:</span>
                            <span className="font-medium text-slate-300">%{m.plannedUtilizationRate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Çalışma Süresi:</span>
                            <span className="font-medium">{m.activeRunHours} sa / {activeShiftHours} sa</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">OEE Verimlilik:</span>
                            <span className="font-bold text-emerald-400">%{m.oeeScore}</span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-800">
                            <span className="text-slate-400">Operatör:</span>
                            <span className="font-medium text-slate-200">{m.operatorName}</span>
                          </div>
                          {m.temperatureOrPressure && (
                            <div className="text-2xs text-sky-400 pt-0.5">
                              {m.temperatureOrPressure}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  x={85}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  label={{ value: "%85 Optimal Eşik", position: "insideTopRight", fill: "#f59e0b", fontSize: 10 }}
                />
                <ReferenceLine
                  x={100}
                  stroke="#e11d48"
                  strokeDasharray="3 3"
                  label={{ value: "%100 Maksimum Sınır", position: "insideTopRight", fill: "#e11d48", fontSize: 10 }}
                />
                <Bar dataKey="utilizationRate" name="Doluluk Oranı (%)" radius={[0, 6, 6, 0]}>
                  {filteredMachines.map((entry) => (
                    <Cell key={`cell-${entry.id}`} fill={getUtilColor(entry.utilizationRate)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Renk Skalası Açıklaması */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-2xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-sky-600 inline-block" />
                <span>Normal / Optimal (%60 - %85)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
                <span>Yüksek Yük (%85 - %92)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-600 inline-block" />
                <span>Darboğaz Riski (&gt;%92)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-400 inline-block" />
                <span>Atıl / Rezerv (&lt;%60)</span>
              </span>
            </div>
            <span>Toplam {filteredMachines.length} aktif makine</span>
          </div>
        </div>

        {/* Sağ 1 Kolon: Makine Durumu & OEE Göstergeleri */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  İstasyon Durumu & OEE Dağılımı
                </h3>
                <p className="text-2xs text-slate-500">Tesis genel ekipman etkinliği</p>
              </div>
            </div>

            {/* Durum Sayaçları */}
            <div className="grid grid-cols-2 gap-2.5 pt-4">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50">
                <span className="text-2xs font-semibold text-emerald-800 dark:text-emerald-300">Aktif Pişirmede</span>
                <div className="text-lg font-bold text-emerald-900 dark:text-emerald-200 mt-0.5">
                  {adjustedMachines.filter((m) => m.status === "running").length} Makine
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50">
                <span className="text-2xs font-semibold text-rose-800 dark:text-rose-300">Aşırı Yüklü</span>
                <div className="text-lg font-bold text-rose-900 dark:text-rose-200 mt-0.5">
                  {adjustedMachines.filter((m) => m.status === "overloaded").length} İstasyon
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-2xs font-semibold text-slate-600 dark:text-slate-300">Standby / Rezerv</span>
                <div className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {adjustedMachines.filter((m) => m.status === "idle_ready").length} Makine
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50">
                <span className="text-2xs font-semibold text-amber-800 dark:text-amber-300">Ortalama OEE</span>
                <div className="text-lg font-bold text-amber-900 dark:text-amber-200 mt-0.5">
                  %{(adjustedMachines.reduce((s, m) => s + m.oeeScore, 0) / adjustedMachines.length).toFixed(1)}
                </div>
              </div>
            </div>

            {/* Kritik İstasyon Uyarısı */}
            <div className="mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-2">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Darboğaz Uyarısı: Kombili Fırın B</span>
              </div>
              <p className="text-2xs text-rose-700 dark:text-rose-400 leading-relaxed">
                40 tepsilik et & köfte fırını <strong>%95.4 dolulukta</strong> çalışmaktadır. Çarşamba ve Cuma günleri ilave 300+ porsiyon köfte siparişi gelmesi durumunda fırın kapasitesi aşılacaktır.
              </p>
              <div className="text-2xs font-semibold text-rose-900 dark:text-rose-200 pt-1 border-t border-rose-200/60 dark:border-rose-800/60">
                💡 Öneri: Fırın ön pişirme süresini 45 dk erkene çekin veya Fırın A&apos;ya parça transferi yapın.
              </div>
            </div>
          </div>

          {/* Enerji & Operatör Özeti */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 space-y-1.5">
            <div className="flex justify-between">
              <span>Toplam Anlık Enerji Tüketimi:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {adjustedMachines.reduce((s, m) => s + m.energyKwhPerHour, 0).toFixed(1)} kWh/saat
              </span>
            </div>
            <div className="flex justify-between">
              <span>Görevli İstasyon Operatörü:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">9 Personel (Vardiya 1)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 📋 MAKİNE VE İSTASYON DETAYLI LİSTESİ */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-600" />
              <span>Makine Parkuru ve Kapasite Matrisi</span>
            </h3>
            <p className="text-xs text-slate-500">
              Her makinenin nominal kapasitesi, çalışma saati, OEE skoru ve operatör bilgileri.
            </p>
          </div>

          <div className="text-xs text-slate-400">
            Toplam {filteredMachines.length} ekipman listeleniyor
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-4 font-bold">Makine Kodu & Adı</th>
                <th className="py-3 px-4 font-bold">İstasyon Türü</th>
                <th className="py-3 px-4 font-bold text-right">Saatlik Kapasite</th>
                <th className="py-3 px-4 font-bold text-right">Günlük Hacim</th>
                <th className="py-3 px-4 font-bold">Doluluk Oranı</th>
                <th className="py-3 px-4 font-bold text-center">Çalışma / Boşta</th>
                <th className="py-3 px-4 font-bold text-right">OEE Skoru</th>
                <th className="py-3 px-4 font-bold">Durum</th>
                <th className="py-3 px-4 font-bold">Operatör</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredMachines.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => setSelectedMachineId(selectedMachineId === m.id ? null : m.id)}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                    selectedMachineId === m.id ? "bg-indigo-50/50 dark:bg-indigo-950/30" : ""
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{m.name}</div>
                    <div className="text-2xs text-slate-400 font-mono mt-0.5">{m.code}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-slate-700 dark:text-slate-300">{m.categoryLabel}</span>
                    {m.temperatureOrPressure && (
                      <div className="text-2xs text-sky-600 dark:text-sky-400 mt-0.5">{m.temperatureOrPressure}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                    {m.nominalCapacityPerHour} {m.capacityUnit}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {m.actualDailyOutputUnits.toLocaleString("tr-TR")}
                    </span>
                    <span className="text-slate-400 text-2xs block">
                      / {m.maxDailyCapacityUnits.toLocaleString("tr-TR")}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="w-36 space-y-1">
                      <div className="flex justify-between text-2xs font-semibold">
                        <span style={{ color: getUtilColor(m.utilizationRate) }}>
                          %{m.utilizationRate}
                        </span>
                        <span className="text-slate-400">P: %{m.plannedUtilizationRate}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, m.utilizationRate)}%`,
                            backgroundColor: getUtilColor(m.utilizationRate),
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400 font-mono text-2xs">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{m.activeRunHours}s</span> / {m.idleHours}s
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2 py-0.5 rounded-md text-2xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      %{m.oeeScore}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {m.status === "running" && (
                      <span className="px-2.5 py-1 rounded-full text-2xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Çalışıyor
                      </span>
                    )}
                    {m.status === "overloaded" && (
                      <span className="px-2.5 py-1 rounded-full text-2xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Aşırı Yük
                      </span>
                    )}
                    {m.status === "idle_ready" && (
                      <span className="px-2.5 py-1 rounded-full text-2xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 inline-flex items-center gap-1">
                        Standby
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                    {m.operatorName}
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
