import React, { useState, useEffect } from "react";
import {
  Factory,
  UtensilsCrossed,
  Calendar,
  CookingPot,
  Scale,
  Truck,
  ShieldCheck,
  LayoutDashboard,
  Layers,
  ChevronDown,
  Building2,
  Plus,
  BarChart3,
  Cpu,
  Gauge,
  Sparkles,
  PackageCheck,
  CheckCircle2,
  X,
  Calculator,
} from "lucide-react";
import {
  IndustrySector,
  FoodRecipe,
  FoodMenuPlan,
  FoodProductionOrder,
  FoodDispatchDelivery,
  FoodWitnessSample,
  Product,
  CompanySettings,
  Contact,
  FoodOrderStatus,
} from "../../types";
import { saveStoredData } from "../../utils/storage";
import { FoodDashboard } from "./FoodFactory/FoodDashboard";
import { useTheme } from "../../context/ThemeContext";
import { ModuleEntranceHeader } from "../common/ModuleEntranceHeader";
import { FoodRecipesView } from "./FoodFactory/FoodRecipesView";
import { FoodRecipeCostAnalysisView } from "./FoodFactory/FoodRecipeCostAnalysisView";
import { ProductCostAndMrpControlView } from "./FoodFactory/ProductCostAndMrpControlView";
import { FoodMenuView } from "./FoodFactory/FoodMenuView";
import { FoodOrdersView } from "./FoodFactory/FoodOrdersView";
import { FoodMrpView } from "./FoodFactory/FoodMrpView";
import { FoodDispatchView } from "./FoodFactory/FoodDispatchView";
import { FoodSamplesView } from "./FoodFactory/FoodSamplesView";
import { ProductionCapacityView } from "./FoodFactory/ProductionCapacityView";
import { KitchenWorkOrderTriggerModal } from "./FoodFactory/KitchenWorkOrderTriggerModal";
import { deductStockForExistingOrder } from "../../utils/foodKitchenOrderHelper";
import {
  NewRecipeModal,
  NewMenuModal,
  NewOrderModal,
  NewSampleModal,
} from "./FoodFactory/FoodModals";
import { GenericIndustryView } from "./GenericIndustryView";
import { triggerFormErrorNotification } from "../../context/FormErrorContext";

interface ProductionModuleProps {
  sectors: IndustrySector[];
  activeSectorId: string;
  foodRecipes: FoodRecipe[];
  foodMenus: FoodMenuPlan[];
  foodProductionOrders: FoodProductionOrder[];
  foodDispatches: FoodDispatchDelivery[];
  foodWitnessSamples: FoodWitnessSample[];
  products: Product[];
  contacts: Contact[];
  settings: CompanySettings;
  onNavigateToSectors?: () => void;
  onUpdateSectors?: (sectors: IndustrySector[], activeId: string) => void;
  onUpdateProducts?: (products: Product[]) => void;
  onUpdateOrders?: (orders: FoodProductionOrder[]) => void;
}

type FoodTab = "dashboard" | "recipes" | "analysis" | "product_mrp" | "menus" | "orders" | "capacity" | "mrp" | "dispatches" | "samples";

export const ProductionModule: React.FC<ProductionModuleProps> = ({
  sectors,
  activeSectorId: initialActiveSectorId,
  foodRecipes: initialFoodRecipes,
  foodMenus: initialFoodMenus,
  foodProductionOrders: initialFoodOrders,
  foodDispatches: initialFoodDispatches,
  foodWitnessSamples: initialFoodSamples,
  products,
  contacts,
  settings,
  onNavigateToSectors,
  onUpdateSectors,
  onUpdateProducts,
  onUpdateOrders,
}) => {
  const [activeSectorId, setActiveSectorId] = useState<string>(initialActiveSectorId || "catering");
  const [activeTab, setActiveTab] = useState<FoodTab>("dashboard");
  const [selectedAnalysisRecipeId, setSelectedAnalysisRecipeId] = useState<string>("");
  const [selectedProductMrpRecipeId, setSelectedProductMrpRecipeId] = useState<string>("");
  const { theme } = useTheme();

  // Data States
  const [recipes, setRecipes] = useState<FoodRecipe[]>(initialFoodRecipes);
  const [menus, setMenus] = useState<FoodMenuPlan[]>(initialFoodMenus);
  const [orders, setOrders] = useState<FoodProductionOrder[]>(initialFoodOrders);
  const [dispatches, setDispatches] = useState<FoodDispatchDelivery[]>(initialFoodDispatches);
  const [samples, setSamples] = useState<FoodWitnessSample[]>(initialFoodSamples);
  const [productList, setProductList] = useState<Product[]>(products);

  useEffect(() => {
    setProductList(products);
  }, [products]);

  // Modal States
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<FoodRecipe | null>(null);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);

  // Trigger Modal States (Otomatik Mutfak İş Emri & Stok Düşüşü)
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);
  const [triggerInitialMenu, setTriggerInitialMenu] = useState<FoodMenuPlan | undefined>(undefined);
  const [triggerInitialRecipes, setTriggerInitialRecipes] = useState<FoodRecipe[] | undefined>(undefined);
  const [triggerDefaultPortion, setTriggerDefaultPortion] = useState<number | undefined>(undefined);
  const [triggerNotification, setTriggerNotification] = useState<{ message: string; type: "success" | "info" } | null>(null);

  const handleOpenTriggerForMenu = (menu?: FoodMenuPlan) => {
    setTriggerInitialMenu(menu);
    setTriggerInitialRecipes(undefined);
    setTriggerDefaultPortion(menu?.totalPlannedPortions || 500);
    setIsTriggerModalOpen(true);
  };

  const handleOpenTriggerForRecipes = (recipeList?: FoodRecipe[], portionCount?: number) => {
    setTriggerInitialMenu(undefined);
    setTriggerInitialRecipes(recipeList);
    setTriggerDefaultPortion(portionCount || 500);
    setIsTriggerModalOpen(true);
  };

  const handleOpenTriggerDefault = () => {
    setTriggerInitialMenu(undefined);
    setTriggerInitialRecipes(undefined);
    setTriggerDefaultPortion(500);
    setIsTriggerModalOpen(true);
  };

  const handleOrderCreatedFromTrigger = (
    newOrder: FoodProductionOrder,
    updatedOrders: FoodProductionOrder[],
    updatedProducts: Product[],
    summary: string
  ) => {
    setOrders(updatedOrders);
    setProductList(updatedProducts);
    saveStoredData("FOOD_PRODUCTION_ORDERS", updatedOrders);
    saveStoredData("PRODUCTS", updatedProducts);
    if (onUpdateProducts) onUpdateProducts(updatedProducts);
    if (onUpdateOrders) onUpdateOrders(updatedOrders);

    setTriggerNotification({
      message: `${newOrder.orderNo} nolu iş emri oluşturuldu! ${summary}`,
      type: "success",
    });
    setTimeout(() => {
      setTriggerNotification(null);
    }, 7000);

    setActiveTab("orders");
  };

  const handleDeductExistingOrderStock = (order: FoodProductionOrder) => {
    const { updatedProducts, updatedOrder, summary } = deductStockForExistingOrder(
      order,
      productList,
      recipes
    );
    const updatedOrders = orders.map((o) => (o.id === order.id ? updatedOrder : o));

    setOrders(updatedOrders);
    setProductList(updatedProducts);
    saveStoredData("FOOD_PRODUCTION_ORDERS", updatedOrders);
    saveStoredData("PRODUCTS", updatedProducts);
    if (onUpdateProducts) onUpdateProducts(updatedProducts);
    if (onUpdateOrders) onUpdateOrders(updatedOrders);

    setTriggerNotification({
      message: `${order.orderNo} için hammadde stok düşüşü tamamlandı! ${summary}`,
      type: "success",
    });
    setTimeout(() => {
      setTriggerNotification(null);
    }, 7000);
  };

  const activeSector = sectors.find((s) => s.id === activeSectorId) || sectors[0];

  const handleSwitchSector = (sectorId: string) => {
    setActiveSectorId(sectorId);
    saveStoredData("ACTIVE_SECTOR", sectorId);
    if (onUpdateSectors) {
      onUpdateSectors(sectors, sectorId);
    }
  };

  // Recipe Handlers
  const handleSaveRecipe = (recipe: FoodRecipe) => {
    let updated: FoodRecipe[];
    if (recipes.some((r) => r.id === recipe.id)) {
      updated = recipes.map((r) => (r.id === recipe.id ? recipe : r));
    } else {
      updated = [recipe, ...recipes];
    }
    setRecipes(updated);
    saveStoredData("FOOD_RECIPES", updated);
  };

  const handleDeleteRecipe = (recipeId: string) => {
    const updated = recipes.filter((r) => r.id !== recipeId);
    setRecipes(updated);
    saveStoredData("FOOD_RECIPES", updated);
  };

  // Menu Handlers
  const handleSaveMenu = (menu: FoodMenuPlan) => {
    let updated: FoodMenuPlan[];
    if (menus.some((m) => m.id === menu.id)) {
      updated = menus.map((m) => (m.id === menu.id ? menu : m));
    } else {
      updated = [menu, ...menus];
    }
    setMenus(updated);
    saveStoredData("FOOD_MENUS", updated);
  };

  const handleDeleteMenu = (menuId: string) => {
    const updated = menus.filter((m) => m.id !== menuId);
    setMenus(updated);
    saveStoredData("FOOD_MENUS", updated);
  };

  const handleToggleMenuLock = (menuId: string) => {
    const updated = menus.map((m) => (m.id === menuId ? { ...m, isLocked: !m.isLocked } : m));
    setMenus(updated);
    saveStoredData("FOOD_MENUS", updated);
  };

  // Order Handlers
  const handleSaveOrder = (order: FoodProductionOrder) => {
    const updated = [order, ...orders];
    setOrders(updated);
    saveStoredData("FOOD_PRODUCTION_ORDERS", updated);
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: FoodOrderStatus) => {
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o));
    setOrders(updated);
    saveStoredData("FOOD_PRODUCTION_ORDERS", updated);
  };

  const handlePrintOrderSheet = (order: FoodProductionOrder) => {
    window.print();
  };

  // Dispatch Handlers
  const handleUpdateDeliveryStatus = (dispatchId: string, deliveryIndex: number, newStatus: "delivered" | "on_the_way") => {
    const updated = dispatches.map((d) => {
      if (d.id !== dispatchId) return d;
      const updatedDeliveries = [...(d.deliveries || [])];
      if (updatedDeliveries[deliveryIndex]) {
        updatedDeliveries[deliveryIndex] = {
          ...updatedDeliveries[deliveryIndex],
          status: newStatus,
          actualDeliveryTime: newStatus === "delivered" ? "11:15" : undefined,
        };
      }
      return { ...d, deliveries: updatedDeliveries };
    });
    setDispatches(updated);
    saveStoredData("FOOD_DISPATCHES", updated);
  };

  const handlePrintDispatchSlip = (dispatch: FoodDispatchDelivery) => {
    window.print();
  };

  // Sample Handlers
  const handleSaveSample = (sample: FoodWitnessSample) => {
    const updated = [sample, ...samples];
    setSamples(updated);
    saveStoredData("FOOD_SAMPLES", updated);
  };

  const handleDisposeSample = (sampleId: string) => {
    const updated = samples.map((s) => (s.id === sampleId ? { ...s, status: "disposed" as const } : s));
    setSamples(updated);
    saveStoredData("FOOD_SAMPLES", updated);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* 1. TOP TITLE & ACTION HEADER */}
      <ModuleEntranceHeader
        badge="Üretim & Sanayi"
        badgeIcon={<Factory className="w-2.5 h-2.5 text-[#0f6bae]" />}
        title="Endüstriyel Üretim & Fabrika Yönetimi"
        description="Reçete (BOM) yönetimi, hammadde ihtiyaç planlama (MRP), 4 kap tabldot menü planı, mutfak iş emirleri ve sevkiyat operasyonları."
        actions={
          <>
            {/* Sektör Değiştirici */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-2xs bg-white"
              style={{ borderColor: theme.cardBorder }}
            >
              <Factory className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="text-slate-400 text-2xs hidden sm:inline">Sektör:</span>
              <select
                value={activeSectorId}
                onChange={(e) => handleSwitchSector(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
              >
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.shortCode})
                  </option>
                ))}
              </select>
            </div>

            {onNavigateToSectors && (
              <button
                type="button"
                onClick={onNavigateToSectors}
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:bg-slate-50 shrink-0 bg-white"
                style={{ borderColor: theme.cardBorder, color: theme.pageText }}
              >
                <span>Tüm Sektörler ({sectors.length})</span>
              </button>
            )}

            {activeSectorId === "catering" && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditingRecipe(null);
                    setIsRecipeModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shrink-0"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Yeni Reçete (BOM)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsTriggerModalOpen(true)}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:bg-slate-50 shrink-0 bg-white"
                  style={{ borderColor: theme.cardBorder, color: theme.pageText }}
                >
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>İş Emri & Stok Düş</span>
                </button>
              </>
            )}
          </>
        }
      />

      {/* Sektör Kontrolü: Eğer Catering ise Endüstriyel Mutfak Modülü */}
      {activeSectorId === "catering" ? (
        <div className="space-y-4 sm:space-y-6">
          {/* Yemek Fabrikası Alt Sekmeleri (Tab Bar) */}
          <div
            className="flex items-center gap-1.5 p-1.5 rounded-2xl border shadow-2xs overflow-x-auto"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("dashboard")}
              style={activeTab === "dashboard" ? { backgroundColor: theme.primaryColor, color: "#ffffff" } : {}}
              className={`font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
                activeTab === "dashboard"
                  ? "shadow-xs"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Genel Bakış</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("recipes")}
              style={activeTab === "recipes" ? { backgroundColor: theme.primaryColor, color: "#ffffff" } : {}}
              className={`font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
                activeTab === "recipes"
                  ? "shadow-xs"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Yemek Reçeteleri (BOM)</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-2xs font-bold ${
                  activeTab === "recipes" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {recipes.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("analysis")}
              style={activeTab === "analysis" ? { backgroundColor: theme.primaryColor, color: "#ffffff" } : {}}
              className={`font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
                activeTab === "analysis"
                  ? "shadow-xs"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Maliyet & Gramaj Analizi</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-2xs font-bold ${
                  activeTab === "analysis" ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800"
                }`}
              >
                Analiz
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("product_mrp")}
              style={activeTab === "product_mrp" ? { backgroundColor: theme.primaryColor, color: "#ffffff" } : {}}
              className={`font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
                activeTab === "product_mrp"
                  ? "shadow-xs"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Maliyet Analizi & MRP Kontrolü</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-2xs font-bold ${
                  activeTab === "product_mrp" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
                }`}
              >
                Özel
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("menus")}
              style={activeTab === "menus" ? { backgroundColor: theme.primaryColor, color: "#ffffff" } : {}}
              className={`font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
                activeTab === "menus"
                  ? "shadow-xs"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>4 Kap Tabldot Menü</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-2xs font-bold ${
                  activeTab === "menus" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {menus.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              style={activeTab === "orders" ? { backgroundColor: theme.primaryColor, color: "#ffffff" } : {}}
              className={`font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
                activeTab === "orders"
                  ? "shadow-xs"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <CookingPot className="w-4 h-4" />
              <span>Mutfak İş Emirleri</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-2xs font-bold ${
                  activeTab === "orders" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {orders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("capacity")}
              style={activeTab === "capacity" ? { backgroundColor: theme.primaryColor, color: "#ffffff" } : {}}
              className={`font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
                activeTab === "capacity"
                  ? "shadow-xs"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Üretim Kapasitesi</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-2xs font-bold ${
                  activeTab === "capacity" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
                }`}
              >
                %88
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("mrp")}
              style={activeTab === "mrp" ? { backgroundColor: theme.primaryColor, color: "#ffffff" } : {}}
              className={`font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
                activeTab === "mrp"
                  ? "shadow-xs"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Hammadde MRP & Sarfiyat</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("dispatches")}
              style={activeTab === "dispatches" ? { backgroundColor: theme.primaryColor, color: "#ffffff" } : {}}
              className={`font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
                activeTab === "dispatches"
                  ? "shadow-xs"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Termobox & Sevkiyat</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-2xs font-bold ${
                  activeTab === "dispatches" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {dispatches.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("samples")}
              style={activeTab === "samples" ? { backgroundColor: theme.primaryColor, color: "#ffffff" } : {}}
              className={`font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
                activeTab === "samples"
                  ? "shadow-xs"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>72 Saat Şahit Numune</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-2xs font-bold ${
                  activeTab === "samples" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {samples.filter((s) => s.status === "retained").length}
              </span>
            </button>
          </div>

          {/* Otomatik Tetikleme Bildirim Bandı */}
          {triggerNotification && (
            <div className="p-4 rounded-2xl bg-emerald-500 text-slate-950 font-medium flex items-center justify-between shadow-lg shadow-emerald-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-950 text-emerald-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-slate-950 font-bold text-xs sm:text-sm">
                    Mutfak İş Emri ve Stok Tetikleme Başarılı!
                  </strong>
                  <span className="text-2xs sm:text-xs text-slate-900 font-normal">
                    {triggerNotification.message}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTriggerNotification(null)}
                className="p-1.5 rounded-lg hover:bg-emerald-600/30 text-slate-950 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Sekme İçerikleri */}
          {activeTab === "dashboard" && (
            <FoodDashboard
              recipes={recipes}
              menus={menus}
              productionOrders={orders}
              dispatches={dispatches}
              samples={samples}
              products={productList}
              settings={settings}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenNewOrderModal={() => setIsOrderModalOpen(true)}
              onOpenNewRecipeModal={() => {
                setEditingRecipe(null);
                setIsRecipeModalOpen(true);
              }}
              onOpenNewMenuModal={() => setIsMenuModalOpen(true)}
              onOpenNewSampleModal={() => setIsSampleModalOpen(true)}
              onOpenNewDispatchModal={() => setActiveTab("dispatches")}
            />
          )}

          {activeTab === "recipes" && (
            <FoodRecipesView
              recipes={recipes}
              onOpenNewRecipeModal={() => {
                setEditingRecipe(null);
                setIsRecipeModalOpen(true);
              }}
              onEditRecipe={(recipe) => {
                setEditingRecipe(recipe);
                setIsRecipeModalOpen(true);
              }}
              onDeleteRecipe={handleDeleteRecipe}
              onNavigateToAnalysis={(recipeId) => {
                if (recipeId) setSelectedAnalysisRecipeId(recipeId);
                setActiveTab("analysis");
              }}
              onNavigateToProductMrp={(recipeId) => {
                if (recipeId) setSelectedProductMrpRecipeId(recipeId);
                setActiveTab("product_mrp");
              }}
              onTriggerWorkOrder={handleOpenTriggerForRecipes}
            />
          )}

          {activeTab === "analysis" && (
            <FoodRecipeCostAnalysisView
              recipes={recipes}
              initialRecipeId={selectedAnalysisRecipeId}
              onNavigateToRecipe={(recipeId) => {
                const rec = recipes.find((r) => r.id === recipeId);
                if (rec) {
                  setEditingRecipe(rec);
                  setIsRecipeModalOpen(true);
                }
              }}
            />
          )}

          {activeTab === "product_mrp" && (
            <ProductCostAndMrpControlView
              recipes={recipes}
              products={productList}
              initialSelectedRecipeId={selectedProductMrpRecipeId}
              onNavigateToRecipe={(recipeId) => {
                const rec = recipes.find((r) => r.id === recipeId);
                if (rec) {
                  setEditingRecipe(rec);
                  setIsRecipeModalOpen(true);
                }
              }}
              onTriggerWorkOrder={(recipe, portionCount) => {
                handleOpenTriggerForRecipes([recipe], portionCount);
              }}
            />
          )}

          {activeTab === "menus" && (
            <FoodMenuView
              menus={menus}
              recipes={recipes}
              onOpenNewMenuModal={() => setIsMenuModalOpen(true)}
              onEditMenu={(menu) => setIsMenuModalOpen(true)}
              onDeleteMenu={handleDeleteMenu}
              onToggleMenuLock={handleToggleMenuLock}
              onTriggerWorkOrder={handleOpenTriggerForMenu}
            />
          )}

          {activeTab === "orders" && (
            <FoodOrdersView
              orders={orders}
              onOpenNewOrderModal={() => setIsOrderModalOpen(true)}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onPrintOrderSheet={handlePrintOrderSheet}
              onOpenTriggerModal={handleOpenTriggerDefault}
              onDeductOrderStock={handleDeductExistingOrderStock}
            />
          )}

          {activeTab === "capacity" && (
            <ProductionCapacityView
              productionOrders={orders}
              recipes={recipes}
              menus={menus}
              onNavigateToOrders={() => setActiveTab("orders")}
            />
          )}

          {activeTab === "mrp" && (
            <FoodMrpView
              orders={orders}
              products={productList}
              onNavigateToProductCostMrp={() => setActiveTab("product_mrp")}
            />
          )}

          {activeTab === "dispatches" && (
            <FoodDispatchView
              dispatches={dispatches}
              onOpenNewDispatchModal={() => triggerFormErrorNotification("Yeni sevkiyat aracı kaydı hazırlanıyor.", "Sevkiyat Modülü")}
              onUpdateDeliveryStatus={handleUpdateDeliveryStatus}
              onPrintDispatchSlip={handlePrintDispatchSlip}
            />
          )}

          {activeTab === "samples" && (
            <FoodSamplesView
              samples={samples}
              onOpenNewSampleModal={() => setIsSampleModalOpen(true)}
              onDisposeSample={handleDisposeSample}
            />
          )}

          {/* Modallar */}
          <NewRecipeModal
            isOpen={isRecipeModalOpen}
            onClose={() => {
              setIsRecipeModalOpen(false);
              setEditingRecipe(null);
            }}
            onSave={handleSaveRecipe}
            initialData={editingRecipe}
          />

          <NewMenuModal
            isOpen={isMenuModalOpen}
            onClose={() => setIsMenuModalOpen(false)}
            onSave={handleSaveMenu}
            recipes={recipes}
          />

          <NewOrderModal
            isOpen={isOrderModalOpen}
            onClose={() => setIsOrderModalOpen(false)}
            onSave={handleSaveOrder}
            menus={menus}
            contacts={contacts}
          />

          <NewSampleModal
            isOpen={isSampleModalOpen}
            onClose={() => setIsSampleModalOpen(false)}
            onSave={handleSaveSample}
          />

          {/* Otomatik Mutfak İş Emri Tetikleme & Stok Düşüş Modalı */}
          <KitchenWorkOrderTriggerModal
            isOpen={isTriggerModalOpen}
            onClose={() => {
              setIsTriggerModalOpen(false);
              setTriggerInitialMenu(undefined);
              setTriggerInitialRecipes(undefined);
            }}
            menus={menus}
            recipes={recipes}
            products={productList}
            existingOrders={orders}
            contacts={contacts}
            initialMenu={triggerInitialMenu}
            initialRecipes={triggerInitialRecipes}
            defaultPortionCount={triggerDefaultPortion}
            onOrderCreated={handleOrderCreatedFromTrigger}
          />
        </div>
      ) : (
        <GenericIndustryView
          sector={activeSector}
          onSwitchToCatering={() => handleSwitchSector("catering")}
          onNavigateToSectors={() => onNavigateToSectors && onNavigateToSectors()}
        />
      )}
    </div>
  );
};

export default ProductionModule;
