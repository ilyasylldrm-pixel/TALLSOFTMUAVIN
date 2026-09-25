import React, { useState, useMemo } from "react";
import {
  HardHat,
  Building2,
  Ruler,
  Calculator,
  Plus,
  FileSpreadsheet,
  Printer,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Edit2,
  ChevronRight,
  X,
  DollarSign,
  TrendingUp,
  Layers,
  Hammer,
  ShieldCheck,
  FileText,
  Percent,
  Check,
  Building,
  Sparkles,
  LandPlot,
  ArrowUpRight,
  PieChart,
  Home,
} from "lucide-react";
import {
  ConstructionProject,
  ConstructionProgressPayment,
  ConstructionCostItem,
  Contact,
  CompanySettings,
  CommonAreaItem,
  ApartmentUnitConfig,
} from "../../types";
import { formatCurrency } from "../../utils/exportUtils";
import { CONSTRUCTION_COST_BENCHMARKS } from "../../data/constructionCostingData";
import { ConstructionAreaPlanner } from "./ConstructionAreaPlanner";
import {
  generateDefaultCommonAreas,
  generateDefaultApartmentConfigs,
} from "../../utils/constructionAreaStandards";
import { useTheme } from "../../context/ThemeContext";
import { ModuleEntranceHeader } from "../common/ModuleEntranceHeader";
import { FeasibilityCostDashboard } from "./FeasibilityCostDashboard";

interface ConstructionCostingModuleProps {
  projects: ConstructionProject[];
  onUpdateProjects: (projects: ConstructionProject[]) => void;
  contacts: Contact[];
  companySettings?: CompanySettings;
  selectedProjectId?: string;
  onSelectProjectId?: (projectId: string) => void;
}

export const ConstructionCostingModule: React.FC<ConstructionCostingModuleProps> = ({
  projects,
  onUpdateProjects,
  contacts,
  companySettings,
  selectedProjectId: externalSelectedProjectId,
  onSelectProjectId,
}) => {
  const { theme } = useTheme();

  // Selected Project (internal fallback or external)
  const [internalSelectedProjectId, setInternalSelectedProjectId] = useState<string>(
    externalSelectedProjectId || projects[0]?.id || ""
  );

  React.useEffect(() => {
    if (externalSelectedProjectId) {
      setInternalSelectedProjectId(externalSelectedProjectId);
    } else if (projects.length > 0 && !internalSelectedProjectId) {
      setInternalSelectedProjectId(projects[0].id);
    }
  }, [externalSelectedProjectId, projects]);

  const selectedProjectId =
    externalSelectedProjectId || internalSelectedProjectId || projects[0]?.id || "";

  const handleSelectProjectId = (id: string) => {
    setInternalSelectedProjectId(id);
    if (onSelectProjectId) {
      onSelectProjectId(id);
    }
  };

  // Active Main Sub-Tab (Alan Planlama, Maliyetler)
  const [activeTab, setActiveTab] = useState<
    "area_planning" | "costs"
  >("area_planning");

  // Yeni Proje Ekleme Modu
  const [isAddingNewProject, setIsAddingNewProject] = useState(false);

  const handleStartNewProject = () => {
    setIsNewProjectModalOpen(true);
  };

  const handleCancelNewProject = () => {
    setIsAddingNewProject(false);
    setActiveTab("area_planning");
  };

  // Modals
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ConstructionProject | null>(null);

  // Active Project Data
  const currentProject = useMemo(() => {
    return (
      projects.find((p) => p.id === selectedProjectId) ||
      projects[0] ||
      null
    );
  }, [projects, selectedProjectId]);

  // Interactive Feasibility Calculator State
  const [calcLandArea, setCalcLandArea] = useState(2000);
  const [calcKaks, setCalcKaks] = useState(2.0); // Emsal
  const [calcBuildingType, setCalcBuildingType] = useState<string>("residential");
  const [calcTargetM2Cost, setCalcTargetM2Cost] = useState(18500);

  const calculatedConstructionArea = useMemo(() => {
    // Emsale dahil alan + emsal harici %30 ortak alan & otopark/bodrum
    const emsalArea = calcLandArea * calcKaks;
    return Math.round(emsalArea * 1.3);
  }, [calcLandArea, calcKaks]);

  const calcBreakdown = useMemo(() => {
    const totalCost = calculatedConstructionArea * calcTargetM2Cost;
    const rough = totalCost * (CONSTRUCTION_COST_BENCHMARKS.roughSharePct / 100);
    const fine = totalCost * (CONSTRUCTION_COST_BENCHMARKS.fineSharePct / 100);
    const mech =
      totalCost * (CONSTRUCTION_COST_BENCHMARKS.mechElecSharePct / 100);
    const overhead =
      totalCost * (CONSTRUCTION_COST_BENCHMARKS.permitOverheadPct / 100);

    return {
      totalCost,
      rough,
      fine,
      mech,
      overhead,
    };
  }, [calculatedConstructionArea, calcTargetM2Cost]);

  // Form State: New Project
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectLocation, setNewProjectLocation] = useState("");
  const [newProjectType, setNewProjectType] = useState<
    "residential" | "commercial" | "villa" | "industrial" | "mixed"
  >("residential");
  const [newLandArea, setNewLandArea] = useState(1500);
  const [newConstructionArea, setNewConstructionArea] = useState(4000);
  const [newSellableArea, setNewSellableArea] = useState(3200);
  const [newUnitCount, setNewUnitCount] = useState(30);
  const [newFloorsCount, setNewFloorsCount] = useState(8);
  const [newEstimatedM2Cost, setNewEstimatedM2Cost] = useState(18000);

  // Handlers
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const totalEstCost = newConstructionArea * newEstimatedM2Cost;
    const projectSeq = String(projects.length + 1).padStart(3, "0");

    const newGross = Number(newConstructionArea) || 0;
    const newUnits = Number(newUnitCount) || 24;
    const newSellable = Number(newSellableArea) || Math.round(newGross * 0.75);

    const newProj: ConstructionProject = {
      id: `proj_ins_${Date.now()}`,
      projectCode: `İNS-2026-${projectSeq}`,
      projectName: newProjectName.trim(),
      location: newProjectLocation.trim() || "İstanbul",
      projectType: newProjectType,
      status: "planning",
      landAreaM2: Number(newLandArea) || 0,
      totalConstructionAreaM2: newGross,
      sellableAreaM2: newSellable,
      unitCount: newUnits,
      floorsCount: Number(newFloorsCount) || 0,
      startDate: new Date().toISOString().split("T")[0],
      estimatedEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      estimatedCostPerM2: Number(newEstimatedM2Cost) || 0,
      totalEstimatedCost: totalEstCost,
      realizedCost: 0,
      estimatedSaleRevenue: totalEstCost * 1.8,
      notes: "Yeni şantiye ve inşaat maliyetlendirme projesi.",
      createdAt: new Date().toISOString().split("T")[0],
      costItems: [],
      progressPayments: [],
      commonAreas: generateDefaultCommonAreas(newGross, newUnits),
      apartmentConfigs: generateDefaultApartmentConfigs(newSellable),
    };

    const updated = [newProj, ...projects];
    onUpdateProjects(updated);
    handleSelectProjectId(newProj.id);
    setIsNewProjectModalOpen(false);
    setIsAddingNewProject(false);
    setActiveTab("area_planning");

    // Reset Form
    setNewProjectName("");
    setNewProjectLocation("");
  };

  const handleUpdateProjectAreaPlanning = (
    projectId: string,
    plannerData: {
      commonAreas: CommonAreaItem[];
      totalCommonAreaM2: number;
      remainingNetM2: number;
      apartmentConfigs: ApartmentUnitConfig[];
      totalUnits: number;
      totalAllocatedNetM2: number;
    }
  ) => {
    const updated = projects.map((p) => {
      if (p.id === projectId) {
        return {
          ...p,
          commonAreas: plannerData.commonAreas,
          apartmentConfigs: plannerData.apartmentConfigs,
          unitCount: plannerData.totalUnits || p.unitCount,
          sellableAreaM2: plannerData.remainingNetM2 || p.sellableAreaM2,
        };
      }
      return p;
    });
    onUpdateProjects(updated);
  };

  const handleUpdateProjectCostItems = (
    projectId: string,
    newCostItems: ConstructionCostItem[]
  ) => {
    const totalEst = newCostItems.reduce((acc, i) => acc + (Number(i.totalPrice) || 0), 0);
    const updated = projects.map((p) => {
      if (p.id === projectId) {
        return {
          ...p,
          costItems: newCostItems,
          totalEstimatedCost: totalEst,
          estimatedCostPerM2:
            p.totalConstructionAreaM2 > 0
              ? Math.round(totalEst / p.totalConstructionAreaM2)
              : p.estimatedCostPerM2,
        };
      }
      return p;
    });
    onUpdateProjects(updated);
  };

  const handleDeleteProject = (projectId: string) => {
    const targetProject = projects.find((p) => p.id === projectId);
    if (!targetProject) return;
    setProjectToDelete(targetProject);
  };

  const confirmDeleteProject = () => {
    if (!projectToDelete) return;
    const projectId = projectToDelete.id;
    const updated = projects.filter((p) => p.id !== projectId);
    onUpdateProjects(updated);

    if (selectedProjectId === projectId) {
      if (updated.length > 0) {
        handleSelectProjectId(updated[0].id);
        setActiveTab("area_planning");
      } else {
        handleSelectProjectId("");
        setIsAddingNewProject(true);
      }
    }
    setProjectToDelete(null);
  };

  // Export CSV (Şantiye Özeti ve Maliyetleri)
  const handleExportCSV = () => {
    if (!currentProject) return;

    let csv =
      "Proje Kodu;Proje Adı;Konum;Durum;Toplam İnşaat Alanı (m²);Arsa Alanı (m²);Bağımsız Bölüm Sayısı;m² Birim Maliyet (TL);Toplam Tahmini Maliyet (TL)\n";

    csv += `"${currentProject.projectCode}";"${currentProject.projectName}";"${currentProject.location}";"${currentProject.status}";${currentProject.totalConstructionAreaM2};${currentProject.landAreaM2};${currentProject.unitCount};${currentProject.estimatedCostPerM2};${currentProject.totalEstimatedCost}\n`;

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${currentProject.projectCode}_Santiye_Ozeti.csv`;
    link.click();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-7 max-w-7xl mx-auto">
      {/* 1. TOP TITLE & ACTION HEADER WITH EDITORIAL BACKGROUND */}
      <ModuleEntranceHeader
        badge="İnşaat & Taahhüt"
        badgeIcon={<HardHat className="w-3.5 h-3.5 text-amber-600" />}
        title="İnşaat Maliyetlendirme & Şantiye Yönetimi"
        description="Şantiye portföyü, 16 paketlik maliyet icmali, m² birim maliyet hesabı ve bağımsız bölüm dağılımı."
        actions={
          <>
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer shadow-2xs hover:bg-slate-50 shrink-0 bg-white"
              style={{ borderColor: theme.cardBorder, color: theme.pageText }}
              title="Şantiye özetini Excel/CSV olarak dışa aktar"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Excel / CSV</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:bg-slate-50 shrink-0 bg-white"
              style={{ borderColor: theme.cardBorder, color: theme.pageText }}
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Yazdır</span>
            </button>

            <button
              type="button"
              id="btn-add-new-project-header"
              onClick={handleStartNewProject}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-2xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shrink-0"
              style={{ backgroundColor: theme.primaryColor }}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Yeni Şantiye Ekle</span>
            </button>
          </>
        }
      />

      {/* Şantiye Alt Modülü Paneli (Şantiyeler bir alt modül gibi görünür) */}
      {currentProject && (
        <div className="space-y-4">
          <div
            className="rounded-2xl border p-4 sm:p-5 shadow-2xs transition-all relative overflow-hidden"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 bg-amber-50 border-amber-200/80 text-amber-700 shadow-2xs"
                >
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="text-3xs font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-md border bg-amber-50 text-amber-900 border-amber-200"
                    >
                      Aktif Şantiye
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md border bg-slate-100 text-slate-700 border-slate-200">
                      {currentProject.projectCode}
                    </span>
                    <span className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      {currentProject.status === "planning"
                        ? "Planlama Aşamasında"
                        : currentProject.status === "in_progress"
                        ? "İnşaat Aşamasında"
                        : "Tamamlandı"}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                      📍 {currentProject.location}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight mt-1" style={{ color: theme.pageText }}>
                    {currentProject.projectName}
                  </h2>
                </div>
              </div>

              {/* Şantiye Değiştirici & Aksiyonlar */}
              <div className="flex flex-wrap items-center gap-2">
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold shadow-2xs bg-white"
                  style={{ borderColor: theme.cardBorder }}
                >
                  <HardHat className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-slate-400 text-2xs hidden sm:inline">Şantiye:</span>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => {
                      handleSelectProjectId(e.target.value);
                      setIsAddingNewProject(false);
                    }}
                    className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
                  >
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.projectCode} - {proj.projectName}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  id="delete-selected-project-top-btn"
                  onClick={() => handleDeleteProject(currentProject.id)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer border border-rose-200 shadow-2xs"
                  title="Aktif Seçili Şantiyeyi ve Tüm Verilerini Sil"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  <span className="hidden sm:inline">Şantiyeyi Sil</span>
                </button>
              </div>
            </div>
          </div>

          {/* Aktif Şantiye Bilgi Göstergeleri - Uygulama Genelindeki 4 KPI Kart Tasarımıyla Uyumlu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Toplam İnşaat Alanı & m² */}
            <div
              className="rounded-2xl p-5 border shadow-2xs hover:shadow-md transition-all flex flex-col justify-between haze-kpi-card-bg relative overflow-hidden"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">Toplam İnşaat Alanı</p>
                  <p className="text-2xl font-bold font-mono tracking-tight text-slate-900 mt-2">
                    {currentProject.totalConstructionAreaM2.toLocaleString("tr-TR")}{" "}
                    <span className="text-sm font-semibold text-slate-400">m²</span>
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center shrink-0 text-indigo-600 shadow-2xs">
                  <Ruler className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-500"></span>
                <span>Arsa Alanı: <strong>{currentProject.landAreaM2.toLocaleString("tr-TR")} m²</strong></span>
              </div>
            </div>

            {/* Card 2: Kat Sayısı & Yapı Türü */}
            <div
              className="rounded-2xl p-5 border shadow-2xs hover:shadow-md transition-all flex flex-col justify-between haze-kpi-card-bg relative overflow-hidden"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">Kat & Yapı Tipi</p>
                  <p className="text-2xl font-bold font-mono tracking-tight text-slate-900 mt-2">
                    {currentProject.floorsCount || 0}{" "}
                    <span className="text-sm font-semibold text-slate-400">Kat</span>
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 text-slate-700 shadow-2xs">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                <span className="inline-block w-2 h-2 rounded-full bg-slate-400"></span>
                <span>
                  Tip:{" "}
                  <strong>
                    {currentProject.projectType === "residential"
                      ? "Konut / Rezidans"
                      : currentProject.projectType === "commercial"
                      ? "Ticari / İş Merkezi"
                      : currentProject.projectType === "villa"
                      ? "Villa"
                      : "Karma Proje"}
                  </strong>
                </span>
              </div>
            </div>

            {/* Card 3: Bağımsız Bölüm Sayısı & Satılabilir Alan */}
            <div
              className="rounded-2xl p-5 border shadow-2xs hover:shadow-md transition-all flex flex-col justify-between haze-kpi-card-bg relative overflow-hidden"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">Bağımsız Bölüm</p>
                  <p className="text-2xl font-bold font-mono tracking-tight text-emerald-600 mt-2">
                    {currentProject.unitCount}{" "}
                    <span className="text-sm font-semibold text-emerald-700/60">Bölüm</span>
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center shrink-0 text-emerald-600 shadow-2xs">
                  <Home className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Satılabilir: <strong>{currentProject.sellableAreaM2?.toLocaleString("tr-TR") || "-"} m²</strong></span>
              </div>
            </div>

            {/* Card 4: Tahmini m² Birim Maliyeti & Toplam Maliyet */}
            <div
              className="rounded-2xl p-5 border shadow-2xs hover:shadow-md transition-all flex flex-col justify-between haze-kpi-card-bg relative overflow-hidden"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">Birim m² Maliyet</p>
                  <p className="text-2xl font-bold font-mono tracking-tight text-amber-600 mt-2">
                    {formatCurrency(currentProject.estimatedCostPerM2 || 0)}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100/80 flex items-center justify-center shrink-0 text-amber-600 shadow-2xs">
                  <Calculator className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Toplam Bütçe: <strong>{formatCurrency(currentProject.totalEstimatedCost || 0)}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Segment Menü Çubuğu (Tabs Bar) - Filter / Segment Bar Stili */}
      <div
        className="rounded-2xl p-2 sm:p-2.5 border shadow-2xs flex flex-wrap items-center justify-between gap-3"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
      >
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("area_planning")}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "area_planning"
                ? "bg-slate-900 text-white font-bold shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Home className="w-4 h-4" />
            <span>İnşaat Alanı & Daire Dağılımı</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("costs")}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "costs"
                ? "bg-slate-900 text-white font-bold shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Calculator className="w-4 h-4 text-amber-500" />
            <span>16 Paketlik Maliyet Tablosu</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsNewProjectModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            style={{ backgroundColor: theme.primaryColor }}
          >
            <Plus className="w-4 h-4" />
            <span>+ Yeni Şantiye Tanımla</span>
          </button>
        </div>
      </div>

    {/* SEKME: İNŞAAT ALANI, ORTAK KULLANIM ALANLARI VE DAİRE DAĞILIMI */}
    {activeTab === "area_planning" && (
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-2xs font-bold text-emerald-700 uppercase tracking-wider">
              Şantiye Mimari Metraj & İmar Analizi
            </span>
            <h3 className="text-base font-bold text-slate-900">
              {currentProject ? currentProject.projectName : "İnşaat Metraj Simülasyonu"}
            </h3>
            <p className="text-xs text-slate-500">
              Proje Brüt Alanı: <strong>{(currentProject?.totalConstructionAreaM2 || calculatedConstructionArea).toLocaleString("tr-TR")} m²</strong> • Konum: {currentProject?.location || "İstanbul"}
            </p>
          </div>
          {currentProject && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl">
                {currentProject.unitCount} Bağımsız Bölüm
              </span>
            </div>
          )}
        </div>

        <ConstructionAreaPlanner
          totalGrossM2={currentProject ? currentProject.totalConstructionAreaM2 : calculatedConstructionArea}
          landAreaM2={currentProject ? currentProject.landAreaM2 : calcLandArea}
          kaks={calcKaks}
          initialCommonAreas={currentProject?.commonAreas}
          initialApartmentConfigs={currentProject?.apartmentConfigs}
          onChange={(data) => {
            if (currentProject) {
              handleUpdateProjectAreaPlanning(currentProject.id, data);
            }
          }}
        />
      </div>
    )}

    {/* SEKME: MALİYETLER */}
    {activeTab === "costs" && (
      <div className="space-y-4">
        <FeasibilityCostDashboard />
      </div>
    )}

      {/* MODAL 1: YENİ İNŞAAT PROJESİ OLUŞTUR */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Yeni İnşaat Projesi & Şantiye Tanımla
                  </h3>
                  <p className="text-2xs text-slate-500 font-medium">
                    Yeni şantiyenizin metraj, kat ve birim maliyet bilgilerini girin
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewProjectModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Proje / Şantiye Adı *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Kadıköy Moda Konakları"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Lokasyon / Şehir - İlçe
                  </label>
                  <input
                    type="text"
                    placeholder="İstanbul / Kadıköy"
                    value={newProjectLocation}
                    onChange={(e) => setNewProjectLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Proje Tipi
                  </label>
                  <select
                    value={newProjectType}
                    onChange={(e) => setNewProjectType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all cursor-pointer"
                  >
                    <option value="residential">Konut / Rezidans</option>
                    <option value="commercial">Ticari / İş Merkezi</option>
                    <option value="villa">Müstakil Villa</option>
                    <option value="industrial">Sanayi / Fabrika</option>
                    <option value="mixed">Karma Proje</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Arsa Alanı (m²)
                  </label>
                  <input
                    type="number"
                    value={newLandArea}
                    onChange={(e) => setNewLandArea(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Toplam İnşaat Alanı (m²) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newConstructionArea}
                    onChange={(e) => setNewConstructionArea(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Satılabilir Alan (m²)
                  </label>
                  <input
                    type="number"
                    value={newSellableArea}
                    onChange={(e) => setNewSellableArea(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Bağımsız Bölüm
                  </label>
                  <input
                    type="number"
                    value={newUnitCount}
                    onChange={(e) => setNewUnitCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kat Sayısı
                  </label>
                  <input
                    type="number"
                    value={newFloorsCount}
                    onChange={(e) => setNewFloorsCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Hedeflenen m² Birim Maliyet (TL / m²)
                </label>
                <input
                  type="number"
                  value={newEstimatedM2Cost}
                  onChange={(e) => setNewEstimatedM2Cost(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono font-bold text-amber-700 bg-amber-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-2xs transition-all active:scale-95"
                >
                  Projeyi Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ŞANTİYE VE TÜM VERİLERİNİ SİLME ONAY MODALI */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-rose-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Şantiyeyi Sil
                  </h3>
                  <p className="text-2xs text-rose-600 font-semibold">
                    Kalıcı silme işlemi (Geri alınamaz)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-rose-50/70 border border-rose-200/80 rounded-2xl space-y-2.5 text-xs">
              <div>
                <span className="text-2xs text-rose-700 font-bold uppercase tracking-wider block">
                  Silinecek Şantiye
                </span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  {projectToDelete.projectName}
                </div>
                <div className="text-slate-600 text-2xs mt-0.5">
                  {projectToDelete.projectCode} • {projectToDelete.location}
                </div>
              </div>

              <div className="pt-2.5 border-t border-rose-200/60 text-slate-700 space-y-1.5">
                <p className="font-bold text-rose-900 text-xs">
                  Bu şantiyeye ait silinecek veriler:
                </p>
                <ul className="list-disc list-inside space-y-1 text-2xs text-rose-800">
                  <li>
                    Şantiye kimlik & metraj bilgileri (
                    <strong>
                      {projectToDelete.totalConstructionAreaM2.toLocaleString("tr-TR")} m²
                    </strong>
                    )
                  </li>
                  <li>
                    Kayıtlı tüm taşeron hakedişleri (
                    <strong>
                      {(projectToDelete.progressPayments || []).length} adet
                    </strong>
                    )
                  </li>
                  <li>m² birim maliyet hesapları, keşif özetleri ve bütçe fizibilitesi</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                id="cancel-delete-project-modal-btn"
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="button"
                id="confirm-delete-project-modal-btn"
                onClick={confirmDeleteProject}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Evet, Şantiyeyi ve Tüm Verileri Sil</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConstructionCostingModule;
