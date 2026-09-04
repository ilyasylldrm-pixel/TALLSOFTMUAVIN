import React, { useState } from "react";
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
import { FoodRecipesView } from "./FoodFactory/FoodRecipesView";
import { FoodRecipeCostAnalysisView } from "./FoodFactory/FoodRecipeCostAnalysisView";
import { FoodMenuView } from "./FoodFactory/FoodMenuView";
import { FoodOrdersView } from "./FoodFactory/FoodOrdersView";
import { FoodMrpView } from "./FoodFactory/FoodMrpView";
import { FoodDispatchView } from "./FoodFactory/FoodDispatchView";
import { FoodSamplesView } from "./FoodFactory/FoodSamplesView";
import {
  NewRecipeModal,
  NewMenuModal,
  NewOrderModal,
  NewSampleModal,
} from "./FoodFactory/FoodModals";
import { GenericIndustryView } from "./GenericIndustryView";

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
}

type FoodTab = "dashboard" | "recipes" | "analysis" | "menus" | "orders" | "mrp" | "dispatches" | "samples";

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
}) => {
  const [activeSectorId, setActiveSectorId] = useState<string>(initialActiveSectorId || "catering");
  const [activeTab, setActiveTab] = useState<FoodTab>("dashboard");
  const [selectedAnalysisRecipeId, setSelectedAnalysisRecipeId] = useState<string>("");

  // Data States
  const [recipes, setRecipes] = useState<FoodRecipe[]>(initialFoodRecipes);
  const [menus, setMenus] = useState<FoodMenuPlan[]>(initialFoodMenus);
  const [orders, setOrders] = useState<FoodProductionOrder[]>(initialFoodOrders);
  const [dispatches, setDispatches] = useState<FoodDispatchDelivery[]>(initialFoodDispatches);
  const [samples, setSamples] = useState<FoodWitnessSample[]>(initialFoodSamples);

  // Modal States
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<FoodRecipe | null>(null);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);

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
    <div className="space-y-6">
      {/* 🏭 ÜST SEKTÖR SEÇİCİ BARI */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold shrink-0">
            {activeSector.id === "catering" ? <UtensilsCrossed className="w-5 h-5" /> : <Factory className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
                Aktif Üretim Sektörü:
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                {activeSector.name}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              İşletmenizin üretim operasyonunu sektörünüze göre özelleştirin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <select
              value={activeSectorId}
              onChange={(e) => handleSwitchSector(e.target.value)}
              className="appearance-none pl-3.5 pr-8 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.shortCode})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {onNavigateToSectors && (
            <button
              type="button"
              onClick={onNavigateToSectors}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Tüm Sektörler ({sectors.length})
            </button>
          )}
        </div>
      </div>

      {/* Sektör Kontrolü: Eğer Catering ise Endüstriyel Mutfak Modülü */}
      {activeSectorId === "catering" ? (
        <div className="space-y-6">
          {/* Yemek Fabrikası Alt Sekmeleri (Tab Bar) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab("dashboard")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Genel Bakış</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("recipes")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "recipes"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Yemek Reçeteleri (BOM)</span>
              <span className="px-1.5 py-0.2 rounded-full text-2xs bg-white/20 text-current">
                {recipes.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("analysis")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "analysis"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Maliyet & Gramaj Analizi</span>
              <span className={`px-1.5 py-0.2 rounded-full text-2xs font-bold ${
                activeTab === "analysis" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
              }`}>
                Analiz
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("menus")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "menus"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>4 Kap Tabldot Menü</span>
              <span className="px-1.5 py-0.2 rounded-full text-2xs bg-white/20 text-current">
                {menus.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "orders"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <CookingPot className="w-4 h-4" />
              <span>Mutfak İş Emirleri</span>
              <span className="px-1.5 py-0.2 rounded-full text-2xs bg-white/20 text-current">
                {orders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("mrp")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "mrp"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Hammadde MRP & Sarfiyat</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("dispatches")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "dispatches"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Termobox & Sevkiyat</span>
              <span className="px-1.5 py-0.2 rounded-full text-2xs bg-white/20 text-current">
                {dispatches.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("samples")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "samples"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>72 Saat Şahit Numune</span>
              <span className="px-1.5 py-0.2 rounded-full text-2xs bg-white/20 text-current">
                {samples.filter((s) => s.status === "retained").length}
              </span>
            </button>
          </div>

          {/* Sekme İçerikleri */}
          {activeTab === "dashboard" && (
            <FoodDashboard
              recipes={recipes}
              menus={menus}
              productionOrders={orders}
              dispatches={dispatches}
              samples={samples}
              products={products}
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

          {activeTab === "menus" && (
            <FoodMenuView
              menus={menus}
              recipes={recipes}
              onOpenNewMenuModal={() => setIsMenuModalOpen(true)}
              onEditMenu={(menu) => setIsMenuModalOpen(true)}
              onDeleteMenu={handleDeleteMenu}
              onToggleMenuLock={handleToggleMenuLock}
            />
          )}

          {activeTab === "orders" && (
            <FoodOrdersView
              orders={orders}
              onOpenNewOrderModal={() => setIsOrderModalOpen(true)}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onPrintOrderSheet={handlePrintOrderSheet}
            />
          )}

          {activeTab === "mrp" && (
            <FoodMrpView
              orders={orders}
              products={products}
            />
          )}

          {activeTab === "dispatches" && (
            <FoodDispatchView
              dispatches={dispatches}
              onOpenNewDispatchModal={() => alert("Yeni sevkiyat aracı kaydı açılıyor.")}
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
