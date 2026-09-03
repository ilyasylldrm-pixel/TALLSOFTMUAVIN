import React, { useState, useMemo } from "react";
import { Product, Invoice, Contact, CostProject, ProjectCostItem, CostProjectStatus, ProjectCostType, Employee, Transaction } from "../types";
import { formatCurrency } from "../utils/exportUtils";
import {
  BarChart3,
  Wallet,
  DollarSign,
  TrendingUp,
  Sparkles,
  Calculator,
  Search,
  FileText,
  FolderKanban,
  Building2,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Layers,
  Calendar,
  User,
  Tag,
  Package,
  ChevronRight,
  Check,
  Percent,
  Receipt,
  PieChart,
  Users,
  UserCheck,
  FileSpreadsheet,
  ArrowDownRight,
  CheckSquare,
  Square,
  Download
} from "lucide-react";
import { DetailPageLayout } from "./common/DetailPageLayout";

interface ProductCostsViewProps {
  products: Product[];
  invoices?: Invoice[];
  contacts?: Contact[];
  costProjects?: CostProject[];
  employees?: Employee[];
  transactions?: Transaction[];
  globalSearchTerm?: string;
  analyticsMap: Map<string, any>;
  onAddCostProject?: (project: CostProject) => void;
  onUpdateCostProject?: (project: CostProject) => void;
  onDeleteCostProject?: (id: string) => void;
}

export const ProductCostsView: React.FC<ProductCostsViewProps> = ({
  products,
  invoices = [],
  contacts = [],
  costProjects = [],
  employees = [],
  transactions = [],
  globalSearchTerm = "",
  analyticsMap,
  onAddCostProject,
  onUpdateCostProject,
  onDeleteCostProject,
}) => {
  // Main sub-tab: "products_analysis" or "projects"
  const [activeViewTab, setActiveViewTab] = useState<"products_analysis" | "projects">("projects");

  // State for Product Costs
  const [costMethod, setCostMethod] = useState<"card" | "weighted_avg">("weighted_avg");
  const [costStockTypeFilter, setCostStockTypeFilter] = useState<string>("all");
  const [costMarginFilter, setCostMarginFilter] = useState<"all" | "low" | "high" | "negative">("all");
  const [costSearch, setCostSearch] = useState("");
  const [simulatedInflation, setSimulatedInflation] = useState<number>(0);

  // State for Project Costs
  const [projectSearch, setProjectSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState<string>("all");
  const [projectCategoryFilter, setProjectCategoryFilter] = useState<string>("all");

  // Quick Import Modal State (Gelen Faturalar, Gider Fişleri, İnsan Kaynakları)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTab, setImportTab] = useState<"invoices" | "expenses" | "hr">("hr");
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  // Helper to calculate total worker cost for an employee (Net/Brüt + SGK İşveren Payı)
  const calculateEmployerCostForEmployee = (emp: Employee): number => {
    const baseSalary = Number(emp.salaryAmount) || 0;
    const food = Number(emp.foodAllowance) || 0;
    const road = Number(emp.roadAllowance) || 0;

    if (emp.salaryType === "gross") {
      const gross = baseSalary + food + road;
      return Math.round(gross * 1.175);
    } else {
      const approxGross = baseSalary * 1.38 + food + road;
      return Math.round(approxGross * 1.175);
    }
  };

  // Modals
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<CostProject | null>(null);

  const [selectedDetailProject, setSelectedDetailProject] = useState<CostProject | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // New Project Form State
  const [projectForm, setProjectForm] = useState<{
    code: string;
    name: string;
    category: string;
    contactId: string;
    contactName: string;
    startDate: string;
    endDate: string;
    budget: number | "";
    contractPrice: number | "";
    status: CostProjectStatus;
    description: string;
  }>({
    code: "",
    name: "",
    category: "İnşaat / Taahhüt",
    contactId: "",
    contactName: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    budget: "",
    contractPrice: "",
    status: "active",
    description: "",
  });

  // New Cost Item Form State inside Project Details
  const [costItemForm, setCostItemForm] = useState<{
    type: ProjectCostType;
    description: string;
    quantity: number | "";
    unit: string;
    unitCost: number | "";
    date: string;
    productId: string;
    notes: string;
  }>({
    type: "material",
    description: "",
    quantity: 1,
    unit: "Adet",
    unitCost: "",
    date: new Date().toISOString().split("T")[0],
    productId: "",
    notes: "",
  });

  // ================= STOK MALİYET ANALİZİ COMPUTATIONS =================
  const costProductsData = useMemo(() => {
    return products.map((p) => {
      const analytics = analyticsMap.get(p.id);
      const cardBuy = p.buyPrice || 0;
      const cardSell = p.sellPrice || 0;
      const avgBuy = analytics?.avgBuyPrice && analytics.avgBuyPrice > 0 ? analytics.avgBuyPrice : cardBuy;
      const avgSell = analytics?.avgSellPrice && analytics.avgSellPrice > 0 ? analytics.avgSellPrice : cardSell;

      const baseBuy = costMethod === "weighted_avg" ? avgBuy : cardBuy;
      const simBuy = baseBuy * (1 + simulatedInflation / 100);
      const effectiveSell = cardSell;

      const unitProfit = effectiveSell - simBuy;
      const marginPercent = simBuy > 0 ? (unitProfit / simBuy) * 100 : 0;

      const qty = p.stockQuantity || 0;
      const totalCost = qty * simBuy;
      const totalRevenue = qty * effectiveSell;
      const totalProfit = totalRevenue - totalCost;

      return {
        product: p,
        qty,
        cardBuy,
        cardSell,
        avgBuy,
        avgSell,
        effectiveBuy: simBuy,
        effectiveSell,
        unitProfit,
        marginPercent,
        totalCost,
        totalRevenue,
        totalProfit,
      };
    });
  }, [products, analyticsMap, costMethod, simulatedInflation]);

  const filteredCostProducts = useMemo(() => {
    return costProductsData.filter((item) => {
      const p = item.product;
      const q = (globalSearchTerm || costSearch).toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (costStockTypeFilter !== "all") {
        if ((p.stockType || "Ticari Mal") !== costStockTypeFilter) return false;
      }

      if (costMarginFilter === "low" && item.marginPercent >= 15) return false;
      if (costMarginFilter === "high" && item.marginPercent < 30) return false;
      if (costMarginFilter === "negative" && item.marginPercent > 0) return false;

      return true;
    });
  }, [costProductsData, globalSearchTerm, costSearch, costStockTypeFilter, costMarginFilter]);

  const costTotals = useMemo(() => {
    let totalValuation = 0;
    let totalPotentialRevenue = 0;
    let totalPotentialProfit = 0;
    let totalItems = 0;

    filteredCostProducts.forEach((item) => {
      totalValuation += item.totalCost;
      totalPotentialRevenue += item.totalRevenue;
      totalPotentialProfit += item.totalProfit;
      totalItems += item.qty;
    });

    const overallMargin = totalValuation > 0 ? (totalPotentialProfit / totalValuation) * 100 : 0;

    return { totalValuation, totalPotentialRevenue, totalPotentialProfit, totalItems, overallMargin };
  }, [filteredCostProducts]);

  // ================= PROJE BAZLI MALİYET COMPUTATIONS =================
  const filteredProjects = useMemo(() => {
    return costProjects.filter((prj) => {
      const q = (globalSearchTerm || projectSearch).toLowerCase().trim();
      const matchesSearch =
        !q ||
        prj.name.toLowerCase().includes(q) ||
        prj.code.toLowerCase().includes(q) ||
        (prj.contactName && prj.contactName.toLowerCase().includes(q)) ||
        (prj.category && prj.category.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (projectStatusFilter !== "all" && prj.status !== projectStatusFilter) {
        return false;
      }

      if (projectCategoryFilter !== "all" && prj.category !== projectCategoryFilter) {
        return false;
      }

      return true;
    });
  }, [costProjects, globalSearchTerm, projectSearch, projectStatusFilter, projectCategoryFilter]);

  // Overall Project Cost Metrics
  const projectSummaryMetrics = useMemo(() => {
    let totalProjects = costProjects.length;
    let activeProjects = costProjects.filter((p) => p.status === "active").length;
    let totalBudget = 0;
    let totalContract = 0;
    let totalActualCosts = 0;

    costProjects.forEach((prj) => {
      totalBudget += prj.budget || 0;
      totalContract += prj.contractPrice || 0;
      const prjActualCost = (prj.costItems || []).reduce((sum, item) => sum + (item.totalCost || 0), 0);
      totalActualCosts += prjActualCost;
    });

    const totalEstimatedProfit = totalContract - totalActualCosts;
    const overallMarginPercent = totalActualCosts > 0 ? (totalEstimatedProfit / totalActualCosts) * 100 : 0;

    return {
      totalProjects,
      activeProjects,
      totalBudget,
      totalContract,
      totalActualCosts,
      totalEstimatedProfit,
      overallMarginPercent,
    };
  }, [costProjects]);

  // Handle Project Form Open
  const handleOpenNewProjectModal = () => {
    const nextSeq = String(costProjects.length + 1).padStart(3, "0");
    setEditingProject(null);
    setProjectForm({
      code: `PRJ-2026-${nextSeq}`,
      name: "",
      category: "İnşaat / Taahhüt",
      contactId: "",
      contactName: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      budget: "",
      contractPrice: "",
      status: "active",
      description: "",
    });
    setIsProjectModalOpen(true);
  };

  const handleOpenEditProjectModal = (project: CostProject) => {
    setEditingProject(project);
    setProjectForm({
      code: project.code,
      name: project.name,
      category: project.category || "İnşaat / Taahhüt",
      contactId: project.contactId || "",
      contactName: project.contactName || "",
      startDate: project.startDate || new Date().toISOString().split("T")[0],
      endDate: project.endDate || "",
      budget: project.budget || "",
      contractPrice: project.contractPrice || "",
      status: project.status,
      description: project.description || "",
    });
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.name.trim()) return;

    const contactObj = contacts.find((c) => c.id === projectForm.contactId);

    if (editingProject) {
      const updated: CostProject = {
        ...editingProject,
        code: projectForm.code.trim() || editingProject.code,
        name: projectForm.name.trim(),
        category: projectForm.category,
        contactId: projectForm.contactId || undefined,
        contactName: contactObj ? contactObj.name : projectForm.contactName || undefined,
        startDate: projectForm.startDate,
        endDate: projectForm.endDate || undefined,
        budget: Number(projectForm.budget) || 0,
        contractPrice: Number(projectForm.contractPrice) || 0,
        status: projectForm.status,
        description: projectForm.description.trim() || undefined,
      };
      if (onUpdateCostProject) onUpdateCostProject(updated);
      if (selectedDetailProject && selectedDetailProject.id === updated.id) {
        setSelectedDetailProject(updated);
      }
    } else {
      const newProj: CostProject = {
        id: "prj_" + Date.now(),
        code: projectForm.code.trim() || `PRJ-${Date.now().toString().slice(-4)}`,
        name: projectForm.name.trim(),
        category: projectForm.category,
        contactId: projectForm.contactId || undefined,
        contactName: contactObj ? contactObj.name : projectForm.contactName || undefined,
        startDate: projectForm.startDate,
        endDate: projectForm.endDate || undefined,
        budget: Number(projectForm.budget) || 0,
        contractPrice: Number(projectForm.contractPrice) || 0,
        status: projectForm.status,
        description: projectForm.description.trim() || undefined,
        costItems: [],
        createdAt: new Date().toISOString().split("T")[0],
      };
      if (onAddCostProject) onAddCostProject(newProj);
    }

    setIsProjectModalOpen(false);
  };

  const handleDeleteProjectClick = (projectId: string) => {
    if (window.confirm("Bu projeyi ve tüm maliyet kayıtlarını silmek istediğinize emin misiniz?")) {
      if (onDeleteCostProject) onDeleteCostProject(projectId);
      if (selectedDetailProject && selectedDetailProject.id === projectId) {
        setIsDetailModalOpen(false);
        setSelectedDetailProject(null);
      }
    }
  };

  // Cost Item Add to Project
  const handleAddCostItemToProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDetailProject || !costItemForm.description.trim()) return;

    const qty = Number(costItemForm.quantity) || 1;
    const unitPrice = Number(costItemForm.unitCost) || 0;
    const total = qty * unitPrice;

    const newItem: ProjectCostItem = {
      id: "pitem_" + Date.now(),
      type: costItemForm.type,
      description: costItemForm.description.trim(),
      quantity: qty,
      unit: costItemForm.unit || "Adet",
      unitCost: unitPrice,
      totalCost: total,
      date: costItemForm.date || new Date().toISOString().split("T")[0],
      productId: costItemForm.productId || undefined,
      notes: costItemForm.notes.trim() || undefined,
    };

    const updatedProject: CostProject = {
      ...selectedDetailProject,
      costItems: [newItem, ...(selectedDetailProject.costItems || [])],
    };

    if (onUpdateCostProject) onUpdateCostProject(updatedProject);
    setSelectedDetailProject(updatedProject);

    // Reset item form
    setCostItemForm({
      type: "material",
      description: "",
      quantity: 1,
      unit: "Adet",
      unitCost: "",
      date: new Date().toISOString().split("T")[0],
      productId: "",
      notes: "",
    });
  };

  const handleDeleteCostItem = (costItemId: string) => {
    if (!selectedDetailProject) return;
    const updatedItems = selectedDetailProject.costItems.filter((i) => i.id !== costItemId);
    const updatedProject: CostProject = {
      ...selectedDetailProject,
      costItems: updatedItems,
    };
    if (onUpdateCostProject) onUpdateCostProject(updatedProject);
    setSelectedDetailProject(updatedProject);
  };

  // Batch import from Invoices, Expenses, and HR
  const handleExecuteBatchImport = () => {
    if (!selectedDetailProject) return;

    const newItems: ProjectCostItem[] = [];

    if (importTab === "hr") {
      selectedEmployeeIds.forEach((empId) => {
        const emp = employees.find((e) => e.id === empId);
        if (!emp) return;
        const totalEmployerCost = calculateEmployerCostForEmployee(emp);
        newItems.push({
          id: "pitem_hr_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
          type: "labor",
          description: `İşçilik masrafı - ${emp.fullName}`,
          quantity: 1,
          unit: "Ay",
          unitCost: totalEmployerCost,
          totalCost: totalEmployerCost,
          date: new Date().toISOString().split("T")[0],
          sourceType: "hr",
          employeeId: emp.id,
          employeeName: emp.fullName,
          notes: `${emp.department || "İnsan Kaynakları"} - ${emp.title || "Personel"} (Aylık Toplam İşçi Maliyeti)`,
        });
      });
    } else if (importTab === "invoices") {
      selectedInvoiceIds.forEach((invId) => {
        const inv = invoices.find((i) => i.id === invId);
        if (!inv) return;
        newItems.push({
          id: "pitem_inv_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
          type: "material",
          description: `Gelen Fatura: ${inv.invoiceNumber} (${inv.contactName})`,
          quantity: 1,
          unit: "Fatura",
          unitCost: inv.grandTotal,
          totalCost: inv.grandTotal,
          date: inv.issueDate || new Date().toISOString().split("T")[0],
          sourceType: "invoice",
          sourceId: inv.id,
          notes: `${inv.items?.length || 0} kalem ürün/hizmet`,
        });
      });
    } else if (importTab === "expenses") {
      selectedExpenseIds.forEach((expId) => {
        const expInv = invoices.find((i) => i.id === expId);
        const expTx = transactions.find((t) => t.id === expId);

        if (expInv) {
          newItems.push({
            id: "pitem_exp_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
            type: "overhead",
            description: `Gider Fişi: ${expInv.invoiceNumber} (${expInv.contactName})`,
            quantity: 1,
            unit: "Fiş",
            unitCost: expInv.grandTotal,
            totalCost: expInv.grandTotal,
            date: expInv.issueDate || new Date().toISOString().split("T")[0],
            sourceType: "expense",
            sourceId: expInv.id,
          });
        } else if (expTx) {
          newItems.push({
            id: "pitem_exp_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
            type: "overhead",
            description: `Gider Fişi / Harcama: ${expTx.description || expTx.category}`,
            quantity: 1,
            unit: "İşlem",
            unitCost: expTx.amount,
            totalCost: expTx.amount,
            date: expTx.date || new Date().toISOString().split("T")[0],
            sourceType: "expense",
            sourceId: expTx.id,
          });
        }
      });
    }

    if (newItems.length > 0) {
      const updatedProject: CostProject = {
        ...selectedDetailProject,
        costItems: [...newItems, ...(selectedDetailProject.costItems || [])],
      };
      if (onUpdateCostProject) onUpdateCostProject(updatedProject);
      setSelectedDetailProject(updatedProject);
    }

    setSelectedEmployeeIds([]);
    setSelectedInvoiceIds([]);
    setSelectedExpenseIds([]);
    setIsImportModalOpen(false);
  };

  // Helper status badge generator
  const renderStatusBadge = (status: CostProjectStatus) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
            Aktif Proje
          </span>
        );
      case "planning":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-3 h-3 text-blue-600" />
            Planlanıyor
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            <CheckCircle2 className="w-3 h-3 text-purple-600" />
            Tamamlandı
          </span>
        );
      case "paused":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Askıda
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <X className="w-3 h-3 text-rose-600" />
            İptal Edildi
          </span>
        );
      default:
        return null;
    }
  };

  // Category Translation Helper
  const getCategoryTypeName = (type: ProjectCostType) => {
    switch (type) {
      case "material":
        return "Malzeme / Sarf";
      case "labor":
        return "İşçilik / Personel";
      case "subcontractor":
        return "Taşeron / Hizmet";
      case "overhead":
        return "Genel Gider / Lisans";
      case "other":
        return "Diğer Maliyetler";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Module Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2 px-2">
          <FolderKanban className="w-5 h-5 text-purple-600" />
          <span className="text-sm font-black text-slate-900">Proje Bazlı Maliyet Yönetimi</span>
          <span className="px-2 py-0.5 text-xs rounded-full font-bold bg-purple-100 text-purple-800">
            {costProjects.length} Proje
          </span>
        </div>

        <button
          onClick={handleOpenNewProjectModal}
          className="bg-[#8252F6] hover:bg-purple-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Proje Aç</span>
        </button>
      </div>

      {/* ================= VIEW TAB 1: PROJE BAZLI MALİYET YÖNETİMİ ================= */}
      {activeViewTab === "projects" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-purple-900 via-fuchsia-900 to-indigo-950 text-white rounded-2xl p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative z-10">
              <h2 className="text-lg font-black flex items-center gap-2 text-white">
                <FolderKanban className="w-5 h-5 text-purple-300" />
                <span>Proje Bazlı Maliyet ve Bütçe Takibi</span>
              </h2>
              <p className="text-xs font-medium text-purple-200/90 mt-1 leading-relaxed">
                Taahhüt, inşaat, yazılım, üretim ve özel projeleriniz için malzeme, işçilik, taşeron ve genel gider bütçelerini yönetin.
              </p>
            </div>

            <div className="relative z-10 flex items-center gap-2 shrink-0">
              <button
                onClick={() => window.print()}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all"
              >
                <FileText className="w-4 h-4 text-purple-200" />
                <span>Rapor Yazdır</span>
              </button>
            </div>
          </div>

          {/* Project Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Proje Sayısı */}
            <div className="bg-white rounded-2xl p-4 border border-purple-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Toplam / Aktif Projeler</span>
                <FolderKanban className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {projectSummaryMetrics.totalProjects} <span className="text-xs text-slate-500 font-sans font-medium">Proje</span>
              </div>
              <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {projectSummaryMetrics.activeProjects} aktif proje devam ediyor
              </div>
            </div>

            {/* 2. Toplam Sözleşme Bedeli (Ciro) */}
            <div className="bg-white rounded-2xl p-4 border border-indigo-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Sözleşme Bedeli (Toplam Ciro)</span>
                <DollarSign className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-xl font-black text-indigo-900 font-mono">
                ₺{projectSummaryMetrics.totalContract.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-500">
                Hedef Bütçe: ₺{projectSummaryMetrics.totalBudget.toLocaleString("tr-TR")}
              </div>
            </div>

            {/* 3. Gerçekleşen Toplam Maliyet */}
            <div className="bg-white rounded-2xl p-4 border border-rose-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Gerçekleşen Harcanan Maliyet</span>
                <Wallet className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-xl font-black text-rose-800 font-mono">
                ₺{projectSummaryMetrics.totalActualCosts.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-500">
                Atanan Malzeme, İşçilik & Taşeron
              </div>
            </div>

            {/* 4. Toplam Proje Karı */}
            <div className="bg-white rounded-2xl p-4 border border-emerald-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Proje Net Kar Potansiyeli</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-black text-emerald-700 font-mono">
                +₺{projectSummaryMetrics.totalEstimatedProfit.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-emerald-800 font-bold">
                Ort. Kar Marjı: %{projectSummaryMetrics.overallMarginPercent.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Project Filters & Search */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Proje adı, kodu, müşteri veya kategori ile ara..."
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
              />
            </div>

            {/* Status Filter */}
            <select
              value={projectStatusFilter}
              onChange={(e) => setProjectStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              <option value="all">Tüm Proje Durumları</option>
              <option value="active">Aktif Projeler</option>
              <option value="planning">Planlananlar</option>
              <option value="completed">Tamamlananlar</option>
              <option value="paused">Askıdakiler</option>
              <option value="cancelled">İptal Edilenler</option>
            </select>

            {/* Category Filter */}
            <select
              value={projectCategoryFilter}
              onChange={(e) => setProjectCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              <option value="all">Tüm Kategoriler</option>
              <option value="İnşaat / Taahhüt">İnşaat / Taahhüt</option>
              <option value="Yazılım / Ar-Ge">Yazılım / Ar-Ge</option>
              <option value="Üretim">Üretim</option>
              <option value="Danışmanlık">Danışmanlık</option>
              <option value="Hizmet / Servis">Hizmet / Servis</option>
            </select>
          </div>

          {/* Project List / Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProjects.map((prj) => {
              const actualCost = (prj.costItems || []).reduce((s, i) => s + (i.totalCost || 0), 0);
              const budget = prj.budget || 0;
              const contractPrice = prj.contractPrice || 0;
              const profit = contractPrice - actualCost;
              const marginPercent = actualCost > 0 ? (profit / actualCost) * 100 : 0;

              const usagePercent = budget > 0 ? (actualCost / budget) * 100 : 0;
              const isOverBudget = usagePercent > 100;

              return (
                <div
                  key={prj.id}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-purple-300 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
                >
                  {/* Top Bar: Code, Category, Status */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                            {prj.code}
                          </span>
                          {prj.category && (
                            <span className="text-[11px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                              {prj.category}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900 mt-1.5 leading-snug">
                          {prj.name}
                        </h3>
                      </div>
                      <div>{renderStatusBadge(prj.status)}</div>
                    </div>

                    {prj.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                        {prj.description}
                      </p>
                    )}

                    {/* Customer & Dates */}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5 truncate">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate font-semibold text-slate-800">
                          {prj.contactName || "Cari Atanmadı"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {prj.startDate} {prj.endDate ? ` → ${prj.endDate}` : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Budget Progress Bar */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600">Bütçe Kullanımı:</span>
                      <span className={isOverBudget ? "text-rose-600 font-black" : "text-slate-900 font-mono"}>
                        %{usagePercent.toFixed(1)} {isOverBudget && "(Bütçe Aşımı!)"}
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOverBudget
                            ? "bg-rose-500"
                            : usagePercent > 85
                            ? "bg-amber-500"
                            : "bg-[#8252F6]"
                        }`}
                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>Maliyet: ₺{actualCost.toLocaleString("tr-TR")}</span>
                      <span>Hedef Bütçe: ₺{budget.toLocaleString("tr-TR")}</span>
                    </div>
                  </div>

                  {/* Financial Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 bg-purple-50/40 p-3 rounded-xl border border-purple-100 text-center">
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Sözleşme Ciro</div>
                      <div className="text-xs font-black text-slate-900 font-mono mt-0.5">
                        ₺{contractPrice.toLocaleString("tr-TR")}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Harcanan Maliyet</div>
                      <div className="text-xs font-black text-rose-700 font-mono mt-0.5">
                        ₺{actualCost.toLocaleString("tr-TR")}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Net Kar (% Marj)</div>
                      <div className={`text-xs font-black font-mono mt-0.5 ${profit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                        ₺{profit.toLocaleString("tr-TR")}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between gap-2 pt-2">
                    <button
                      onClick={() => {
                        setSelectedDetailProject(prj);
                        setIsDetailModalOpen(true);
                      }}
                      className="flex-1 bg-[#8252F6] hover:bg-purple-700 text-white font-extrabold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Detay & Maliyet Kalemleri ({prj.costItems?.length || 0})</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditProjectModal(prj)}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all cursor-pointer"
                      title="Projeyi Düzenle"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteProjectClick(prj.id)}
                      className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200 transition-all cursor-pointer"
                      title="Projeyi Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredProjects.length === 0 && (
              <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <FolderKanban className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="text-sm font-bold text-slate-700">Henüz Tanımlı Proje Bulunmuyor</div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Maliyet takibi yapmak istediğiniz projelerinizi oluşturabilir, malzeme ve işçilik harcamalarınızı proje bazlı analiz edebilirsiniz.
                </p>
                <button
                  onClick={handleOpenNewProjectModal}
                  className="bg-[#8252F6] hover:bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>İlk Projeyi Oluştur</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= VIEW TAB 2: STOK MALİYET ANALİZİ ================= */}
      {activeViewTab === "products_analysis" && (
        <div className="space-y-6">
          {/* Header Card for Maliyetler */}
          <div className="relative overflow-hidden bg-gradient-to-r from-purple-900 via-fuchsia-900 to-indigo-950 text-white rounded-2xl p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative z-10">
              <h2 className="text-lg font-black flex items-center gap-2 text-white">
                <BarChart3 className="w-5 h-5 text-purple-300" />
                <span>Maliyetler ve Stok Kar Marjı Analizi</span>
              </h2>
              <p className="text-xs font-medium text-purple-200/90 mt-1 leading-relaxed">
                Stok alış maliyet yöntemleri (AOF & Kart Maliyeti), potansiyel ciro, kar marjı hedefleri ve envanter değerlemesi.
              </p>
            </div>

            <div className="relative z-10 flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => window.print()}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-2xs"
              >
                <FileText className="w-4 h-4 text-purple-200" />
                <span>Rapor Al / Yazdır</span>
              </button>
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Toplam Envanter Maliyeti */}
            <div className="bg-white rounded-2xl p-4 border border-purple-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Toplam Envanter Maliyeti</span>
                <Wallet className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-xl font-black text-slate-900 font-mono">
                ₺{costTotals.totalValuation.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <span className="font-bold text-purple-700">{costTotals.totalItems} birim</span> mevcut stok
              </div>
            </div>

            {/* 2. Tahmini Satış Cirosu */}
            <div className="bg-white rounded-2xl p-4 border border-indigo-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Tahmini Satış Cirosu</span>
                <DollarSign className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-xl font-black text-slate-900 font-mono">
                ₺{costTotals.totalPotentialRevenue.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-500">
                Tanımlı satış fiyatları üzerinden
              </div>
            </div>

            {/* 3. Potansiyel Brüt Kar */}
            <div className="bg-white rounded-2xl p-4 border border-emerald-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Potansiyel Toplam Kar</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-black text-emerald-700 font-mono">
                +₺{costTotals.totalPotentialProfit.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium">
                Ciro - Maliyet Karı
              </div>
            </div>

            {/* 4. Ortalama Kar Marjı */}
            <div className="bg-white rounded-2xl p-4 border border-teal-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Ortalama Kar Marjı</span>
                <Sparkles className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-xl font-black text-teal-700 font-mono">
                %{costTotals.overallMargin.toFixed(1)}
              </div>
              <div className="text-[11px] text-slate-500">
                {costMethod === "weighted_avg" ? "Ağırlıklı Ortalama Maliyet (AOF)" : "Kart Alış Fiyatı"}
              </div>
            </div>
          </div>

          {/* Controls & Simulators Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 space-y-4 shadow-2xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Cost Method Switcher */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Maliyet Yöntemi:</span>
                <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
                  <button
                    onClick={() => setCostMethod("weighted_avg")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      costMethod === "weighted_avg"
                        ? "bg-[#8252F6] text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    AOF (Alış Faturaları Ağırlıklı Ortalama)
                  </button>
                  <button
                    onClick={() => setCostMethod("card")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      costMethod === "card"
                        ? "bg-[#8252F6] text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Kart Alış Fiyatı (Tanımlı Maliyet)
                  </button>
                </div>
              </div>

              {/* Simulation Inflation Toggle */}
              <div className="flex items-center gap-2 bg-purple-50/60 p-2 rounded-xl border border-purple-200/60">
                <span className="text-xs font-bold text-purple-950 flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5 text-purple-700" />
                  <span>Simüle Enflasyon / Maliyet Artışı (%):</span>
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={simulatedInflation}
                  onChange={(e) => setSimulatedInflation(Number(e.target.value))}
                  className="w-16 px-2.5 py-1 text-xs font-mono font-bold border border-purple-300 rounded-lg text-center bg-white text-purple-900 focus:ring-2 focus:ring-purple-500"
                />
                {simulatedInflation > 0 && (
                  <button
                    onClick={() => setSimulatedInflation(0)}
                    className="text-[11px] text-rose-600 hover:underline font-bold cursor-pointer"
                  >
                    Sıfırla
                  </button>
                )}
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Stok adı, kodu veya kategori ile ara..."
                  value={costSearch}
                  onChange={(e) => setCostSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                />
              </div>

              {/* Stock Type Filter */}
              <select
                value={costStockTypeFilter}
                onChange={(e) => setCostStockTypeFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="all">Tüm Stok Türleri</option>
                <option value="Ticari Mal">Ticari Mal</option>
                <option value="Hizmet">Hizmet</option>
                <option value="Yarı Mamul">Yarı Mamul</option>
                <option value="İlk Madde Malzeme">İlk Madde Malzeme</option>
                <option value="Ham Madde">Ham Madde</option>
              </select>

              {/* Margin Filter */}
              <select
                value={costMarginFilter}
                onChange={(e) => setCostMarginFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="all">Tüm Marj Oranları</option>
                <option value="high">Yüksek Marj (≥ %30)</option>
                <option value="low">Düşük Marj (&lt; %15)</option>
                <option value="negative">Zararına / Negatif (≤ %0)</option>
              </select>
            </div>
          </div>

          {/* Detailed Costs Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4">Stok Kodu / Adı</th>
                    <th className="py-3.5 px-3">Tür / Kategori</th>
                    <th className="py-3.5 px-3 text-center">Mevcut Miktar</th>
                    <th className="py-3.5 px-3 text-right">Birim Alış Maliyeti</th>
                    <th className="py-3.5 px-3 text-right">Birim Satış Fiyatı</th>
                    <th className="py-3.5 px-3 text-right">Birim Kar</th>
                    <th className="py-3.5 px-3 text-center">Kar Marjı (%)</th>
                    <th className="py-3.5 px-3 text-right">Toplam Maliyet</th>
                    <th className="py-3.5 px-3 text-right">Potansiyel Ciro</th>
                    <th className="py-3.5 px-4 text-right">Potansiyel Kar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredCostProducts.map((item) => {
                    const p = item.product;
                    const isLowMargin = item.marginPercent < 15 && item.marginPercent >= 0;
                    const isNegative = item.marginPercent < 0;

                    return (
                      <tr key={p.id} className="hover:bg-purple-50/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <div className="text-[11px] font-mono text-slate-500">{p.code}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-block bg-slate-100 text-slate-700 border border-slate-200 text-[10px] px-2 py-0.5 rounded-full font-medium">
                            {p.stockType || "Ticari Mal"}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">{p.category || "Genel"}</div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold">
                          {item.qty} {p.unit}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          <div className="font-bold text-slate-800">
                            ₺{item.effectiveBuy.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </div>
                          {costMethod === "weighted_avg" && (
                            <div className="text-[10px] text-purple-700 font-semibold">
                              AOF Hesabı
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-indigo-700">
                          ₺{item.effectiveSell.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                          +₺{item.unitProfit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold font-mono border ${
                              isNegative
                                ? "bg-rose-100 text-rose-800 border-rose-300"
                                : isLowMargin
                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                : "bg-emerald-100 text-emerald-800 border-emerald-300"
                            }`}
                          >
                            %{item.marginPercent.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          ₺{item.totalCost.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-indigo-900">
                          ₺{item.totalRevenue.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-emerald-700">
                          +₺{item.totalProfit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredCostProducts.length === 0 && (
                    <tr>
                      <td colSpan={10} className="text-center py-10 text-slate-500">
                        Seçilen filtrelere uygun maliyet verisi bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= DETAIL VIEW 1: YENİ PROJE OLUŞTUR / DÜZENLE ================= */}
      {isProjectModalOpen && (
        <DetailPageLayout
          title={editingProject ? "Projeyi Düzenle" : "Yeni Proje Aç"}
          subtitle="Proje Bazlı Maliyet & Kârlılık Takip Yönetimi"
          breadcrumbs={[
            { label: "Maliyet Analizi", onClick: () => setIsProjectModalOpen(false) },
            { label: editingProject ? "Projeyi Düzenle" : "Yeni Proje", active: true },
          ]}
          onBack={() => setIsProjectModalOpen(false)}
          statusBadge={
            <span className="bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold px-3 py-1 rounded-xl">
              PROJE YÖNETİMİ
            </span>
          }
          headerIcon={<FolderKanban className="w-5 h-5 text-purple-600" />}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsProjectModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
            </div>
          }
        >
          <div className="bg-white rounded-3xl max-w-3xl mx-auto border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
            <form onSubmit={handleSaveProject} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Proje Kodu */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Proje Kodu</label>
                  <input
                    type="text"
                    required
                    value={projectForm.code}
                    onChange={(e) => setProjectForm({ ...projectForm, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="PRJ-2026-001"
                  />
                </div>

                {/* Kategori */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Proje Sektörü / Kategori</label>
                  <select
                    value={projectForm.category}
                    onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer"
                  >
                    <option value="İnşaat / Taahhüt">İnşaat / Taahhüt</option>
                    <option value="Yazılım / Ar-Ge">Yazılım / Ar-Ge</option>
                    <option value="Üretim">Üretim</option>
                    <option value="Danışmanlık">Danışmanlık</option>
                    <option value="Hizmet / Servis">Hizmet / Servis</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>
              </div>

              {/* Proje Adı */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Proje Adı *</label>
                <input
                  type="text"
                  required
                  placeholder="ör: Maslak Plaza İç Mimari Uygulama Projesi"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-bold text-slate-900"
                />
              </div>

              {/* Müşteri / Cari Seçimi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Proje Sahibi / Müşteri Cari</label>
                <select
                  value={projectForm.contactId}
                  onChange={(e) => {
                    const selectedContact = contacts.find((c) => c.id === e.target.value);
                    setProjectForm({
                      ...projectForm,
                      contactId: e.target.value,
                      contactName: selectedContact ? selectedContact.name : "",
                    });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Müşteri Cari Seçiniz (Opsiyonel) --</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.contactType === "customer" ? "Müşteri" : c.contactType === "vendor" ? "Tedarikçi" : "Cari"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tarihler */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    required
                    value={projectForm.startDate}
                    onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tahmini Bitiş Tarihi</label>
                  <input
                    type="date"
                    value={projectForm.endDate}
                    onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Bütçe ve Sözleşme Ciro Bedeli */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hedef Maliyet Bütçesi (₺)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="450000"
                    value={projectForm.budget}
                    onChange={(e) => setProjectForm({ ...projectForm, budget: e.target.value ? Number(e.target.value) : "" })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sözleşme Bedeli / Ciro (₺)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="680000"
                    value={projectForm.contractPrice}
                    onChange={(e) => setProjectForm({ ...projectForm, contractPrice: e.target.value ? Number(e.target.value) : "" })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Durumu */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Proje Durumu</label>
                <select
                  value={projectForm.status}
                  onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value as CostProjectStatus })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer"
                >
                  <option value="active">Aktif Devam Ediyor</option>
                  <option value="planning">Planlanıyor</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="paused">Askıda / Durduruldu</option>
                  <option value="cancelled">İptal Edildi</option>
                </select>
              </div>

              {/* Açıklama */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Proje Detayları / Notlar</label>
                <textarea
                  rows={3}
                  placeholder="Projenin kapsamı, hedefleri ve özel şartları..."
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="bg-[#8252F6] hover:bg-purple-700 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingProject ? "Değişiklikleri Kaydet" : "Projeyi Aç"}</span>
                </button>
              </div>
            </form>
          </div>
        </DetailPageLayout>
      )}

      {/* ================= DETAIL VIEW 2: PROJE DETAYI & MALİYET KALEMLERİ ================= */}
      {isDetailModalOpen && selectedDetailProject && (
        <DetailPageLayout
          title={selectedDetailProject.name}
          subtitle={`Proje Kodu: ${selectedDetailProject.code} • Kategori: ${selectedDetailProject.category || "Genel"} • Başlangıç: ${selectedDetailProject.startDate}`}
          breadcrumbs={[
            { label: "Maliyet Analizi", onClick: () => setIsDetailModalOpen(false) },
            { label: selectedDetailProject.name, active: true },
          ]}
          onBack={() => setIsDetailModalOpen(false)}
          statusBadge={renderStatusBadge(selectedDetailProject.status)}
          headerIcon={<FolderKanban className="w-5 h-5 text-purple-600" />}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Geri Dön
              </button>
            </div>
          }
        >
          <div className="bg-white rounded-3xl max-w-5xl w-full mx-auto border border-slate-200 shadow-sm overflow-hidden">

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Financial Stats Grid */}
              {(() => {
                const totalActual = (selectedDetailProject.costItems || []).reduce((s, i) => s + (i.totalCost || 0), 0);
                const budget = selectedDetailProject.budget || 0;
                const contractPrice = selectedDetailProject.contractPrice || 0;
                const netProfit = contractPrice - totalActual;
                const marginPercent = totalActual > 0 ? (netProfit / totalActual) * 100 : 0;

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Target Budget</div>
                      <div className="text-sm font-black text-slate-900 font-mono mt-0.5">
                        ₺{budget.toLocaleString("tr-TR")}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Gerçekleşen Maliyet</div>
                      <div className="text-sm font-black text-rose-700 font-mono mt-0.5">
                        ₺{totalActual.toLocaleString("tr-TR")}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Sözleşme Ciro</div>
                      <div className="text-sm font-black text-indigo-900 font-mono mt-0.5">
                        ₺{contractPrice.toLocaleString("tr-TR")}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Tahmini Net Kar</div>
                      <div className={`text-sm font-black font-mono mt-0.5 ${netProfit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                        ₺{netProfit.toLocaleString("tr-TR")} <span className="text-[10px]">(%{marginPercent.toFixed(1)})</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Add New Cost Item Form */}
              <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-200/60 pb-2">
                  <h4 className="text-xs font-extrabold text-purple-950 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-purple-700" />
                    <span>Projeye Yeni Maliyet Kalemi Ekle</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      // Pre-select employees assigned to this project
                      const projectEmpIds = employees
                        .filter((e) => e.projectId === selectedDetailProject.id)
                        .map((e) => e.id);
                      setSelectedEmployeeIds(projectEmpIds);
                      setIsImportModalOpen(true);
                    }}
                    className="px-3 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Toplu İçe Aktar (Fatura / Gider / İK)</span>
                  </button>
                </div>

                {/* Quick Auto-Fill Selectors (Gelen Fatura, Gider Fişi, İK Personel) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white/80 p-2.5 rounded-xl border border-purple-100">
                  {/* İK Personel Doldur */}
                  <div>
                    <label className="block text-[10px] font-bold text-purple-900 mb-1 flex items-center gap-1">
                      <Users className="w-3 h-3 text-purple-600" />
                      <span>İnsan Kaynaklarından Seç (İşçilik)</span>
                    </label>
                    <select
                      value=""
                      onChange={(e) => {
                        const emp = employees.find((p) => p.id === e.target.value);
                        if (emp) {
                          const cost = calculateEmployerCostForEmployee(emp);
                          setCostItemForm({
                            type: "labor",
                            description: `İşçilik masrafı - ${emp.fullName}`,
                            quantity: 1,
                            unit: "Ay",
                            unitCost: cost,
                            date: new Date().toISOString().split("T")[0],
                            productId: "",
                            notes: `${emp.department || "İK"} - Toplam İşçi Maliyeti`,
                          });
                        }
                      }}
                      className="w-full px-2 py-1 text-xs border border-purple-200 rounded-lg bg-purple-50/30 text-purple-950 font-medium cursor-pointer"
                    >
                      <option value="">-- Personelden İşçilik Çek --</option>
                      {/* Atanmış Personeller Üstte */}
                      {employees.filter((e) => e.projectId === selectedDetailProject.id).length > 0 && (
                        <optgroup label="⭐ Projeye Atanmış Personeller">
                          {employees
                            .filter((e) => e.projectId === selectedDetailProject.id)
                            .map((e) => (
                              <option key={e.id} value={e.id}>
                                ⭐ {e.fullName} ({e.title}) - ₺{calculateEmployerCostForEmployee(e).toLocaleString("tr-TR")}
                              </option>
                            ))}
                        </optgroup>
                      )}
                      <optgroup label="Tüm HR Personelleri">
                        {employees.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.fullName} ({e.department || "İK"}) - ₺{calculateEmployerCostForEmployee(e).toLocaleString("tr-TR")}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Gelen Fatura Doldur */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-indigo-600" />
                      <span>Gelen Faturalardan Seç</span>
                    </label>
                    <select
                      value=""
                      onChange={(e) => {
                        const inv = invoices.find((i) => i.id === e.target.value);
                        if (inv) {
                          setCostItemForm({
                            type: "material",
                            description: `Gelen Fatura: ${inv.invoiceNumber} (${inv.contactName})`,
                            quantity: 1,
                            unit: "Fatura",
                            unitCost: inv.grandTotal,
                            date: inv.issueDate || new Date().toISOString().split("T")[0],
                            productId: "",
                            notes: `${inv.items?.length || 0} kalem fatura`,
                          });
                        }
                      }}
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50/50 text-slate-900 font-medium cursor-pointer"
                    >
                      <option value="">-- Alış Faturasından Aktar --</option>
                      {invoices
                        .filter((i) => i.type === "purchase" || i.type === "purchase_invoice")
                        .map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.invoiceNumber} - {inv.contactName} (₺{inv.grandTotal?.toLocaleString("tr-TR")})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Gider Fişi Doldur */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Receipt className="w-3 h-3 text-emerald-600" />
                      <span>Gider Fişlerinden Seç</span>
                    </label>
                    <select
                      value=""
                      onChange={(e) => {
                        const expInv = invoices.find((i) => i.id === e.target.value);
                        const expTx = transactions.find((t) => t.id === e.target.value);
                        if (expInv) {
                          setCostItemForm({
                            type: "overhead",
                            description: `Gider Fişi: ${expInv.invoiceNumber} (${expInv.contactName})`,
                            quantity: 1,
                            unit: "Fiş",
                            unitCost: expInv.grandTotal,
                            date: expInv.issueDate || new Date().toISOString().split("T")[0],
                            productId: "",
                            notes: expInv.notes || "",
                          });
                        } else if (expTx) {
                          setCostItemForm({
                            type: "overhead",
                            description: `Gider Fişi / Masraf: ${expTx.description || expTx.category}`,
                            quantity: 1,
                            unit: "İşlem",
                            unitCost: expTx.amount,
                            date: expTx.date || new Date().toISOString().split("T")[0],
                            productId: "",
                            notes: expTx.category || "",
                          });
                        }
                      }}
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50/50 text-slate-900 font-medium cursor-pointer"
                    >
                      <option value="">-- Gider/Masraf Fişinden Aktar --</option>
                      {invoices
                        .filter((i) => i.type === "expense")
                        .map((exp) => (
                          <option key={exp.id} value={exp.id}>
                            {exp.invoiceNumber} - {exp.contactName} (₺{exp.grandTotal?.toLocaleString("tr-TR")})
                          </option>
                        ))}
                      {transactions
                        .filter((t) => t.type === "expense" || (t.category && t.category.toLowerCase().includes("gider")))
                        .map((tx) => (
                          <option key={tx.id} value={tx.id}>
                            Masraf: {tx.description || tx.category} (₺{tx.amount?.toLocaleString("tr-TR")})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <form onSubmit={handleAddCostItemToProject} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Maliyet Türü */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Maliyet Kategori Türü</label>
                      <select
                        value={costItemForm.type}
                        onChange={(e) => setCostItemForm({ ...costItemForm, type: e.target.value as ProjectCostType })}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 font-semibold"
                      >
                        <option value="material">Malzeme / Sarf Gideri</option>
                        <option value="labor">İşçilik / Personel Yevmiye</option>
                        <option value="subcontractor">Taşeron / Dış Hizmet</option>
                        <option value="overhead">Genel Gider / Lisans</option>
                        <option value="other">Diğer Harcama</option>
                      </select>
                    </div>

                    {/* Stok Kartından Doldur (Opsiyonel) */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Stok Kartından Seç (Opsiyonel)
                      </label>
                      <select
                        value={costItemForm.productId}
                        onChange={(e) => {
                          const p = products.find((prod) => prod.id === e.target.value);
                          if (p) {
                            setCostItemForm({
                              ...costItemForm,
                              productId: p.id,
                              description: p.name,
                              unit: p.unit || "Adet",
                              unitCost: p.buyPrice || "",
                            });
                          } else {
                            setCostItemForm({ ...costItemForm, productId: "" });
                          }
                        }}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">-- Stok Listesinden Ürün Seçebilirsiniz --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.code} - {p.name} (Alış: ₺{p.buyPrice})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    {/* Açıklama */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Açıklama / Kalem Adı *</label>
                      <input
                        type="text"
                        required
                        placeholder="ör: Şantiye Tesisat Elektrik Kablosu"
                        value={costItemForm.description}
                        onChange={(e) => setCostItemForm({ ...costItemForm, description: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Miktar */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Miktar</label>
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        required
                        placeholder="1"
                        value={costItemForm.quantity}
                        onChange={(e) => setCostItemForm({ ...costItemForm, quantity: e.target.value ? Number(e.target.value) : "" })}
                        className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Birim */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Birim</label>
                      <input
                        type="text"
                        required
                        placeholder="Adet, m², Adam/Gün"
                        value={costItemForm.unit}
                        onChange={(e) => setCostItemForm({ ...costItemForm, unit: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Birim Maliyet */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Birim Maliyet (₺) *</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        required
                        placeholder="150"
                        value={costItemForm.unitCost}
                        onChange={(e) => setCostItemForm({ ...costItemForm, unitCost: e.target.value ? Number(e.target.value) : "" })}
                        className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Harcama Tarihi */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Tarih</label>
                      <input
                        type="date"
                        value={costItemForm.date}
                        onChange={(e) => setCostItemForm({ ...costItemForm, date: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Toplam Hesaplama Gösterimi & Ekle Butonu */}
                    <div className="flex items-end justify-between gap-2">
                      <div className="text-xs text-purple-950 font-bold mb-1">
                        Toplam: <span className="font-mono text-sm text-purple-900 font-extrabold">
                          ₺{((Number(costItemForm.quantity) || 0) * (Number(costItemForm.unitCost) || 0)).toLocaleString("tr-TR")}
                        </span>
                      </div>

                      <button
                        type="submit"
                        className="bg-[#8252F6] hover:bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Maliyet Ekle</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Cost Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-purple-700" />
                    <span>Proje Harcama Kalemleri ({selectedDetailProject.costItems?.length || 0})</span>
                  </h4>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                          <th className="py-3 px-3">Tarih</th>
                          <th className="py-3 px-3">Maliyet Türü</th>
                          <th className="py-3 px-4">Açıklama</th>
                          <th className="py-3 px-3 text-center">Miktar & Birim</th>
                          <th className="py-3 px-3 text-right">Birim Maliyet</th>
                          <th className="py-3 px-3 text-right">Toplam Tutar</th>
                          <th className="py-3 px-3 text-center">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {(selectedDetailProject.costItems || []).map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                              {item.date || "-"}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="inline-block bg-purple-100 text-purple-900 border border-purple-200 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                                {getCategoryTypeName(item.type)}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 font-bold text-slate-900">
                              {item.description}
                              {item.notes && <div className="text-[10px] font-normal text-slate-400">{item.notes}</div>}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono">
                              ₺{item.unitCost?.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-rose-700">
                              ₺{item.totalCost?.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() => handleDeleteCostItem(item.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Kalemi Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}

                        {(!selectedDetailProject.costItems || selectedDetailProject.costItems.length === 0) && (
                          <tr>
                            <td colSpan={7} className="text-center py-8 text-slate-500">
                              Henüz bu projeye eklenmiş maliyet kalemi bulunmamaktadır.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Proje Kodu: <strong className="text-slate-800">{selectedDetailProject.code}</strong>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all cursor-pointer"
              >
                Geri Dön
              </button>
            </div>
          </div>
        </DetailPageLayout>
      )}

      {/* ================= DETAIL VIEW 3: TOPLU İÇE AKTAR (FATURALAR / GİDER FİŞLERİ / İNSAN KAYNAKLARI) ================= */}
      {isImportModalOpen && selectedDetailProject && (
        <DetailPageLayout
          title="Sistem Modüllerinden Maliyet Kalemi İçe Aktar"
          subtitle={`${selectedDetailProject.name} (${selectedDetailProject.code}) • Gelen faturalar, gider fişleri veya insan kaynaklarından personel işçilik maliyetlerini projeye aktarın.`}
          breadcrumbs={[
            { label: "Maliyet Analizi", onClick: () => setIsImportModalOpen(false) },
            { label: selectedDetailProject.name, onClick: () => setIsImportModalOpen(false) },
            { label: "Maliyet İçe Aktar", active: true },
          ]}
          onBack={() => setIsImportModalOpen(false)}
          statusBadge={
            <span className="bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold px-3 py-1 rounded-xl">
              MALİYET AKTARIMI
            </span>
          }
          headerIcon={<Layers className="w-5 h-5 text-purple-600" />}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleExecuteBatchImport}
                disabled={
                  (importTab === "hr" && selectedEmployeeIds.length === 0) ||
                  (importTab === "invoices" && selectedInvoiceIds.length === 0) ||
                  (importTab === "expenses" && selectedExpenseIds.length === 0)
                }
                className="bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Seçilenleri Projeye Aktar</span>
              </button>
            </div>
          }
        >
          <div className="bg-white rounded-3xl max-w-4xl w-full mx-auto border border-slate-200 shadow-sm overflow-hidden">

            {/* Modal Sub-Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 p-2 gap-2">
              <button
                onClick={() => setImportTab("hr")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  importTab === "hr"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>1. İnsan Kaynakları (İşçilik)</span>
                {employees.filter((e) => e.projectId === selectedDetailProject.id).length > 0 && (
                  <span className="bg-amber-400 text-slate-900 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                    {employees.filter((e) => e.projectId === selectedDetailProject.id).length} Atanmış
                  </span>
                )}
              </button>

              <button
                onClick={() => setImportTab("invoices")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  importTab === "invoices"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>2. Gelen Faturalar</span>
                <span className="bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                  {invoices.filter((i) => i.type === "purchase" || i.type === "purchase_invoice").length}
                </span>
              </button>

              <button
                onClick={() => setImportTab("expenses")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  importTab === "expenses"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>3. Gider Fişleri & Masraflar</span>
                <span className="bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                  {invoices.filter((i) => i.type === "expense").length + transactions.filter((t) => t.type === "expense" || (t.category && t.category.toLowerCase().includes("gider"))).length}
                </span>
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 max-h-[50vh] overflow-y-auto">
              {/* TAB 1: İNSAN KAYNAKLARI (İŞÇİLİK) */}
              {importTab === "hr" && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
                    <UserCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold block text-amber-950">İnsan Kaynakları İşçilik Maliyeti Otomasyonu</span>
                      <p className="mt-0.5 text-amber-800 leading-relaxed">
                        İnsan kaynaklarında bu projeye atanan personeller vurgulanmıştır. Seçilen personellerin <strong>toplam işçi maliyeti (Maaş + SGK İşveren Payı)</strong> projeye açıklama olarak <strong>"İşçilik masrafı"</strong> etiketiyle aktarılacaktır.
                      </p>
                    </div>
                  </div>

                  {employees.filter((e) => e.projectId === selectedDetailProject.id).length > 0 && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          const projectEmpIds = employees
                            .filter((e) => e.projectId === selectedDetailProject.id)
                            .map((e) => e.id);
                          setSelectedEmployeeIds(projectEmpIds);
                        }}
                        className="text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 cursor-pointer flex items-center gap-1"
                      >
                        <CheckSquare className="w-4 h-4 text-purple-600" />
                        <span>Bu Projeye Atanmış Tüm Personelleri Seç ({employees.filter((e) => e.projectId === selectedDetailProject.id).length})</span>
                      </button>
                    </div>
                  )}

                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px]">
                          <th className="py-2.5 px-3 w-10 text-center">Seç</th>
                          <th className="py-2.5 px-3">Personel Adı</th>
                          <th className="py-2.5 px-3">Departman & Unvan</th>
                          <th className="py-2.5 px-3">Atandığı Proje</th>
                          <th className="py-2.5 px-3 text-right">Aylık Toplam İşçi Maliyeti</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {employees.map((emp) => {
                          const isAssignedToThisProject = emp.projectId === selectedDetailProject.id;
                          const isChecked = selectedEmployeeIds.includes(emp.id);
                          const totalEmployerCost = calculateEmployerCostForEmployee(emp);

                          return (
                            <tr
                              key={emp.id}
                              onClick={() => {
                                setSelectedEmployeeIds((prev) =>
                                  prev.includes(emp.id) ? prev.filter((id) => id !== emp.id) : [...prev, emp.id]
                                );
                              }}
                              className={`cursor-pointer transition-colors ${
                                isAssignedToThisProject
                                  ? "bg-purple-50/60 hover:bg-purple-100/60"
                                  : "hover:bg-slate-50"
                              }`}
                            >
                              <td className="py-2.5 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                />
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-2">
                                <Users className="w-4 h-4 text-slate-400" />
                                <span>{emp.fullName}</span>
                                {isAssignedToThisProject && (
                                  <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] px-2 py-0.2 rounded-full font-bold">
                                    Bu Projede
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">
                                {emp.department} · {emp.title}
                              </td>
                              <td className="py-2.5 px-3">
                                {emp.projectName ? (
                                  <span className="text-purple-900 font-semibold">{emp.projectName}</span>
                                ) : (
                                  <span className="text-slate-400 italic">Genel Merkez</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-extrabold text-purple-900">
                                ₺{totalEmployerCost.toLocaleString("tr-TR")}
                              </td>
                            </tr>
                          );
                        })}

                        {employees.length === 0 && (
                          <tr>
                            <td colSpan={5} className="text-center py-8 text-slate-500">
                              İnsan kaynakları modülünde henüz kayıtlı personel bulunmamaktadır.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: GELEN FATURALAR */}
              {importTab === "invoices" && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-600">
                    Sistemde kayıtlı alış (gelen) faturalarından projenin maliyet kalemlerine aktarmak istediklerinizi seçin:
                  </p>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px]">
                          <th className="py-2.5 px-3 w-10 text-center">Seç</th>
                          <th className="py-2.5 px-3">Fatura No</th>
                          <th className="py-2.5 px-3">Düzenleme Tarihi</th>
                          <th className="py-2.5 px-3">Cari Unvanı</th>
                          <th className="py-2.5 px-3 text-right">Fatura Tutar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {invoices
                          .filter((i) => i.type === "purchase" || i.type === "purchase_invoice")
                          .map((inv) => {
                            const isChecked = selectedInvoiceIds.includes(inv.id);
                            return (
                              <tr
                                key={inv.id}
                                onClick={() => {
                                  setSelectedInvoiceIds((prev) =>
                                    prev.includes(inv.id) ? prev.filter((id) => id !== inv.id) : [...prev, inv.id]
                                  );
                                }}
                                className="hover:bg-slate-50 cursor-pointer transition-colors"
                              >
                                <td className="py-2.5 px-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}}
                                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                  />
                                </td>
                                <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                  {inv.invoiceNumber}
                                </td>
                                <td className="py-2.5 px-3 text-slate-500 font-mono">
                                  {inv.issueDate || "-"}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-slate-800">
                                  {inv.contactName}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-900">
                                  ₺{inv.grandTotal?.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            );
                          })}

                        {invoices.filter((i) => i.type === "purchase" || i.type === "purchase_invoice").length === 0 && (
                          <tr>
                            <td colSpan={5} className="text-center py-8 text-slate-500">
                              Henüz sisteme girilmiş gelen (alış) faturası bulunmamaktadır.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: GİDER FİŞLERİ & MASRAFLAR */}
              {importTab === "expenses" && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-600">
                    Sistemde kayıtlı gider fişleri ve masraf hareketlerinden projenize aktarmak istediklerinizi seçin:
                  </p>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px]">
                          <th className="py-2.5 px-3 w-10 text-center">Seç</th>
                          <th className="py-2.5 px-3">Fiş / İşlem</th>
                          <th className="py-2.5 px-3">Tarih</th>
                          <th className="py-2.5 px-3">Açıklama / Kategori</th>
                          <th className="py-2.5 px-3 text-right">Masraf Tutarı</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {invoices
                          .filter((i) => i.type === "expense")
                          .map((exp) => {
                            const isChecked = selectedExpenseIds.includes(exp.id);
                            return (
                              <tr
                                key={exp.id}
                                onClick={() => {
                                  setSelectedExpenseIds((prev) =>
                                    prev.includes(exp.id) ? prev.filter((id) => id !== exp.id) : [...prev, exp.id]
                                  );
                                }}
                                className="hover:bg-slate-50 cursor-pointer transition-colors"
                              >
                                <td className="py-2.5 px-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}}
                                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                  />
                                </td>
                                <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                  {exp.invoiceNumber}
                                </td>
                                <td className="py-2.5 px-3 text-slate-500 font-mono">
                                  {exp.issueDate || "-"}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-slate-800">
                                  {exp.contactName} (Gider Fişi)
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-900">
                                  ₺{exp.grandTotal?.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            );
                          })}

                        {transactions
                          .filter((t) => t.type === "expense" || (t.category && t.category.toLowerCase().includes("gider")))
                          .map((tx) => {
                            const isChecked = selectedExpenseIds.includes(tx.id);
                            return (
                              <tr
                                key={tx.id}
                                onClick={() => {
                                  setSelectedExpenseIds((prev) =>
                                    prev.includes(tx.id) ? prev.filter((id) => id !== tx.id) : [...prev, tx.id]
                                  );
                                }}
                                className="hover:bg-slate-50 cursor-pointer transition-colors"
                              >
                                <td className="py-2.5 px-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}}
                                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                  />
                                </td>
                                <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                  TRS-{tx.id.slice(-4)}
                                </td>
                                <td className="py-2.5 px-3 text-slate-500 font-mono">
                                  {tx.date || "-"}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-slate-800">
                                  {tx.description || tx.category}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-900">
                                  ₺{tx.amount?.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            );
                          })}

                        {invoices.filter((i) => i.type === "expense").length === 0 &&
                          transactions.filter((t) => t.type === "expense" || (t.category && t.category.toLowerCase().includes("gider"))).length === 0 && (
                            <tr>
                              <td colSpan={5} className="text-center py-8 text-slate-500">
                                Henüz kaydedilmiş bir gider fişi veya masraf hareketi bulunmamaktadır.
                              </td>
                            </tr>
                          )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs font-bold text-slate-700">
                Seçilen Kalem Sayısı:{" "}
                <span className="font-mono text-purple-900 bg-purple-100 px-2 py-0.5 rounded-md font-extrabold">
                  {importTab === "hr"
                    ? selectedEmployeeIds.length
                    : importTab === "invoices"
                    ? selectedInvoiceIds.length
                    : selectedExpenseIds.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBatchImport}
                  disabled={
                    (importTab === "hr" && selectedEmployeeIds.length === 0) ||
                    (importTab === "invoices" && selectedInvoiceIds.length === 0) ||
                    (importTab === "expenses" && selectedExpenseIds.length === 0)
                  }
                  className="bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Seçilenleri Projeye Aktar</span>
                </button>
              </div>
            </div>
          </div>
        </DetailPageLayout>
      )}
    </div>
  );
};
