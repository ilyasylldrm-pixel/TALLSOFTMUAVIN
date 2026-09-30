import React, { useState, useMemo } from "react";
import {
  CookingPot,
  X,
  Sparkles,
  Layers,
  Scale,
  Calendar,
  Clock,
  User,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Plus,
  Trash2,
  Search,
  PackageCheck,
  TrendingDown,
  Warehouse,
  ChevronDown,
  FileSpreadsheet,
} from "lucide-react";
import {
  FoodRecipe,
  FoodMenuPlan,
  Product,
  FoodProductionOrder,
  MealType,
  FoodCustomerPortion,
} from "../../../types";
import { formatCurrency } from "../../../utils/exportUtils";
import {
  calculateRequiredIngredients,
  executeKitchenOrderTrigger,
  AggregatedIngredientRequirement,
} from "../../../utils/foodKitchenOrderHelper";

interface KitchenWorkOrderTriggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: FoodRecipe[];
  menus: FoodMenuPlan[];
  products: Product[];
  currentOrders: FoodProductionOrder[];
  initialMenu?: FoodMenuPlan | null;
  initialSelectedRecipes?: FoodRecipe[];
  onOrderCreated: (
    newOrder: FoodProductionOrder,
    updatedOrders: FoodProductionOrder[],
    updatedProducts: Product[],
    summaryMessage: string
  ) => void;
}

export const KitchenWorkOrderTriggerModal: React.FC<KitchenWorkOrderTriggerModalProps> = ({
  isOpen,
  onClose,
  recipes,
  menus,
  products,
  currentOrders,
  initialMenu,
  initialSelectedRecipes,
  onOrderCreated,
}) => {
  // Order Parameters
  const [orderNo, setOrderNo] = useState(
    `URT-${new Date().getFullYear()}-YMK-${Math.floor(100 + Math.random() * 900)}`
  );
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [headChefName, setHeadChefName] = useState("Salih Usta (Aşçıbaşı)");
  const [kitchenSection, setKitchenSection] = useState("Sıcak Mutfak Kazan Hattı & Tabldot");
  const [startTime, setStartTime] = useState("06:30");
  const [dispatchTime, setDispatchTime] = useState("11:00");
  const [portionCount, setPortionCount] = useState<number>(
    initialMenu?.targetPortionsTotal || 500
  );
  const [deductStock, setDeductStock] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"recipes" | "ingredients">("ingredients");
  const [selectedMenuId, setSelectedMenuId] = useState<string>(initialMenu?.id || "");
  const [recipeSearch, setRecipeSearch] = useState("");
  const [notes, setNotes] = useState("");

  // Recipes selected for this work order: array of recipe items
  const [selectedRecipesList, setSelectedRecipesList] = useState<FoodRecipe[]>(() => {
    if (initialSelectedRecipes && initialSelectedRecipes.length > 0) {
      return initialSelectedRecipes;
    }
    if (initialMenu) {
      // Find matching recipes from initialMenu
      const list: FoodRecipe[] = [];
      const findRec = (name?: string) => {
        if (!name) return null;
        return recipes.find(
          (r) => r.name.toLowerCase() === name.toLowerCase() || r.name.includes(name) || name.includes(r.name)
        );
      };
      const s = findRec(initialMenu.items.soupRecipeName);
      if (s) list.push(s);
      const m = findRec(initialMenu.items.mainRecipeName);
      if (m) list.push(m);
      const sd = findRec(initialMenu.items.sideRecipeName);
      if (sd) list.push(sd);
      const ds = findRec(initialMenu.items.dessertOrSaladRecipeName);
      if (ds) list.push(ds);
      return list.length > 0 ? list : recipes.slice(0, 4);
    }
    return recipes.slice(0, 4);
  });

  // When selected menu changes from dropdown
  const handleMenuSelect = (menuId: string) => {
    setSelectedMenuId(menuId);
    if (!menuId) return;
    const menu = menus.find((m) => m.id === menuId);
    if (!menu) return;

    if (menu.targetPortionsTotal) {
      setPortionCount(menu.targetPortionsTotal);
    }
    if (menu.mealType) {
      setMealType(menu.mealType);
    }

    const list: FoodRecipe[] = [];
    const findRec = (name?: string) => {
      if (!name) return null;
      return recipes.find(
        (r) => r.name.toLowerCase() === name.toLowerCase() || r.name.includes(name) || name.includes(r.name)
      );
    };

    const s = findRec(menu.items.soupRecipeName);
    if (s) list.push(s);
    const m = findRec(menu.items.mainRecipeName);
    if (m) list.push(m);
    const sd = findRec(menu.items.sideRecipeName);
    if (sd) list.push(sd);
    const ds = findRec(menu.items.dessertOrSaladRecipeName);
    if (ds) list.push(ds);

    // If some couldn't be matched by name, create fallback representations
    if (list.length < 4) {
      if (!s && menu.items.soupRecipeName) {
        list.push({
          id: `tmp_${menu.items.soupRecipeName}`,
          recipeCode: "REC-CORBA",
          name: menu.items.soupRecipeName,
          category: "soup",
          categoryLabel: "Çorbalar",
          servingsCount: 1,
          portionCost: 12,
          ingredients: [
            { id: "tmp_ing_1", name: "Kırmızı Mercimek", portionGrams: 50, amount: 0.05, unit: "kg", portionCost: 4 },
            { id: "tmp_ing_2", name: "Ayçiçek Yağı", portionGrams: 20, amount: 0.02, unit: "lt", portionCost: 3 },
            { id: "tmp_ing_3", name: "Kuru Soğan", portionGrams: 30, amount: 0.03, unit: "kg", portionCost: 2 },
          ],
          allergens: [],
          isApproved: true,
          createdAt: "",
          updatedAt: "",
        });
      }
      if (!m && menu.items.mainRecipeName) {
        list.push({
          id: `tmp_${menu.items.mainRecipeName}`,
          recipeCode: "REC-ANA",
          name: menu.items.mainRecipeName,
          category: "main_meat",
          categoryLabel: "Et Yemekleri",
          servingsCount: 1,
          portionCost: 55,
          ingredients: [
            { id: "tmp_ing_4", name: "Dana Kuşbaşı", portionGrams: 120, amount: 0.12, unit: "kg", portionCost: 45 },
            { id: "tmp_ing_5", name: "Domates Salçası", portionGrams: 30, amount: 0.03, unit: "kg", portionCost: 4 },
            { id: "tmp_ing_6", name: "Kuru Soğan", portionGrams: 40, amount: 0.04, unit: "kg", portionCost: 3 },
          ],
          allergens: [],
          isApproved: true,
          createdAt: "",
          updatedAt: "",
        });
      }
      if (!sd && menu.items.sideRecipeName) {
        list.push({
          id: `tmp_${menu.items.sideRecipeName}`,
          recipeCode: "REC-YARD",
          name: menu.items.sideRecipeName,
          category: "side_dish",
          categoryLabel: "Pilav & Makarna",
          servingsCount: 1,
          portionCost: 15,
          ingredients: [
            { id: "tmp_ing_7", name: "Pilavlık Baldo Pirinç", portionGrams: 80, amount: 0.08, unit: "kg", portionCost: 8 },
            { id: "tmp_ing_8", name: "Tereyağı", portionGrams: 20, amount: 0.02, unit: "kg", portionCost: 5 },
          ],
          allergens: [],
          isApproved: true,
          createdAt: "",
          updatedAt: "",
        });
      }
      if (!ds && menu.items.dessertOrSaladRecipeName) {
        list.push({
          id: `tmp_${menu.items.dessertOrSaladRecipeName}`,
          recipeCode: "REC-TATLI",
          name: menu.items.dessertOrSaladRecipeName,
          category: "dessert_fruit",
          categoryLabel: "Tatlı & Meyve",
          servingsCount: 1,
          portionCost: 18,
          ingredients: [
            { id: "tmp_ing_9", name: "İrmik / Un", portionGrams: 60, amount: 0.06, unit: "kg", portionCost: 6 },
            { id: "tmp_ing_10", name: "Toz Şeker", portionGrams: 50, amount: 0.05, unit: "kg", portionCost: 5 },
          ],
          allergens: [],
          isApproved: true,
          createdAt: "",
          updatedAt: "",
        });
      }
    }

    setSelectedRecipesList(list);
  };

  const handleAddRecipe = (recipe: FoodRecipe) => {
    if (!selectedRecipesList.some((r) => r.id === recipe.id)) {
      setSelectedRecipesList([...selectedRecipesList, recipe]);
    }
  };

  const handleRemoveRecipe = (recipeId: string) => {
    setSelectedRecipesList(selectedRecipesList.filter((r) => r.id !== recipeId));
  };

  // Recipe selections mapped to portionCount
  const recipeSelections = useMemo(() => {
    return selectedRecipesList.map((rec) => ({
      recipe: rec,
      portionCount,
    }));
  }, [selectedRecipesList, portionCount]);

  // Aggregated Ingredients calculation (Exploded BOM)
  const aggregatedIngredients: AggregatedIngredientRequirement[] = useMemo(() => {
    return calculateRequiredIngredients(recipeSelections, products);
  }, [recipeSelections, products]);

  const totalRawCost = useMemo(() => {
    return aggregatedIngredients.reduce((sum, item) => sum + item.totalCost, 0);
  }, [aggregatedIngredients]);

  const costPerPortion = portionCount > 0 ? totalRawCost / portionCount : 0;
  const insufficientCount = aggregatedIngredients.filter((ing) => !ing.isStockSufficient).length;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedRecipesList.length === 0) {
      alert("Lütfen iş emrine dahil edilecek en az bir yemek seçin.");
      return;
    }

    if (portionCount <= 0) {
      alert("Lütfen geçerli bir porsiyon adedi girin.");
      return;
    }

    const selectedMenu = menus.find((m) => m.id === selectedMenuId);
    const menuTitle = selectedMenu?.title || `${selectedRecipesList.map((r) => r.name).join(" + ")} Menüsü`;

    const result = executeKitchenOrderTrigger({
      orderNo,
      date,
      mealType,
      menuPlanId: selectedMenuId || undefined,
      menuTitle,
      headChefName,
      kitchenSection,
      scheduledStartTime: startTime,
      scheduledDispatchTime: dispatchTime,
      recipeSelections,
      deductStock,
      notes,
      products,
      currentOrders,
    });

    const summary = deductStock
      ? `✅ ${portionCount} porsiyonluk Mutfak İş Emri (${result.newOrder.orderNo}) açıldı. ${result.deductedIngredientsSummary.totalItemsDeducted} kalem hammadde (${result.deductedIngredientsSummary.totalKgDeducted} birim) stoktan otomatik düşüldü!`
      : `📋 ${portionCount} porsiyonluk Mutfak İş Emri (${result.newOrder.orderNo}) planlandı (Hammadde stok düşüşü beklemede).`;

    onOrderCreated(result.newOrder, result.updatedOrders, result.updatedProducts, summary);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 space-y-5 my-6 max-h-[92vh] flex flex-col justify-between">
        {/* Modal Başlık */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <CookingPot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-lg">Mutfak İş Emri ve Otomatik Stok Düşüşü</h3>
                <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  Otomatik BOM & Tetikleyici
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Seçilen tabldot menü veya yemeklere göre reçete gramajlarını hesaplar, iş emrini başlatır ve hammaddeleri stoktan otomatik düşer.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal İçerik (Kaydırılabilir Alan) */}
        <form id="kitchenOrderForm" onSubmit={handleSubmit} className="space-y-5 overflow-y-auto pr-1">
          {/* 1. ÜST BİLGİ VE MENÜ / YEMEK SEÇİMİ */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Hazır Tabldot Menüsünden Yükle (İsteğe Bağlı)
                </label>
                <div className="relative">
                  <select
                    value={selectedMenuId}
                    onChange={(e) => handleMenuSelect(e.target.value)}
                    className="w-full pl-3.5 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                  >
                    <option value="">-- Özel Yemek Seçimi (Manuel) --</option>
                    {menus.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.dayOfWeek} ({m.date}) - {m.title} [{m.targetPortionsTotal} Pors.]
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="w-full sm:w-48">
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Hedef Üretim Porsiyonu
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="10"
                    value={portionCount}
                    onChange={(e) => setPortionCount(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full px-3.5 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-900 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-2xs font-semibold text-slate-400">
                    Porsiyon
                  </span>
                </div>
              </div>
            </div>

            {/* Hızlı Porsiyon Butonları */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-2xs text-slate-400 font-semibold mr-1">Hızlı Adet:</span>
              {[100, 250, 500, 750, 1000, 1500, 2000].map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => setPortionCount(qty)}
                  className={`px-2.5 py-1 rounded-lg text-2xs font-bold transition-all cursor-pointer ${
                    portionCount === qty
                      ? "bg-amber-600 text-white shadow-2xs"
                      : "bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200"
                  }`}
                >
                  {qty} Pors.
                </button>
              ))}
            </div>
          </div>

          {/* 2. TEMEL İŞ EMRİ BİLGİLERİ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">İş Emri No</label>
              <input
                type="text"
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold bg-white text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Üretim Tarihi</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-800 font-medium"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Öğün / Vardiya</label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value as MealType)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-800 font-medium"
              >
                <option value="lunch">Öğle Yemeği</option>
                <option value="dinner">Akşam Yemeği</option>
                <option value="night">Gece Vardiyası</option>
                <option value="breakfast">Kahvaltı / Kumanya</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sorumlu Aşçıbaşı</label>
              <input
                type="text"
                value={headChefName}
                onChange={(e) => setHeadChefName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-800 font-medium"
                required
              />
            </div>
          </div>

          {/* 3. SEÇİLİ YEMEKLER LİSTESİ */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-600" />
                İş Emrine Dahil Edilen Yemekler ({selectedRecipesList.length} Kap)
              </span>
              <span className="text-2xs text-slate-500">
                Porsiyon Başına Reçete Gramajları Otomatik Çarpılır
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              {selectedRecipesList.map((rec, idx) => (
                <div
                  key={rec.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between group hover:border-amber-300 transition-all"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-2xs font-bold text-amber-600 block truncate">
                      {rec.categoryLabel || rec.category}
                    </span>
                    <strong className="text-xs text-slate-900 font-semibold block truncate">
                      {rec.name}
                    </strong>
                    <span className="text-2xs text-slate-400">
                      {rec.ingredients?.length || 0} malzeme • {rec.caloriePerPortion || 250} kcal
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveRecipe(rec.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-80 group-hover:opacity-100 transition-all cursor-pointer"
                    title="Bu yemeği çıkar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Yemek Ekle Arama Barı */}
            <div className="relative pt-1">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Listeden ek yemek ara (örn: Süzme Mercimek, İskender, Tas Kebabı, Fırın Sütlaç)..."
                    value={recipeSearch}
                    onChange={(e) => setRecipeSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {recipeSearch.trim().length > 1 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-xl z-20 max-h-48 overflow-y-auto p-1.5 space-y-1">
                  {recipes
                    .filter(
                      (r) =>
                        !selectedRecipesList.some((s) => s.id === r.id) &&
                        (r.name.toLowerCase().includes(recipeSearch.toLowerCase()) ||
                          r.categoryLabel.toLowerCase().includes(recipeSearch.toLowerCase()))
                    )
                    .slice(0, 8)
                    .map((r) => (
                      <div
                        key={r.id}
                        onClick={() => {
                          handleAddRecipe(r);
                          setRecipeSearch("");
                        }}
                        className="p-2 rounded-lg hover:bg-amber-50 flex items-center justify-between cursor-pointer text-xs"
                      >
                        <div>
                          <strong className="font-semibold text-slate-800">{r.name}</strong>
                          <span className="text-2xs text-slate-400 ml-2">({r.categoryLabel})</span>
                        </div>
                        <Plus className="w-4 h-4 text-amber-600" />
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* 4. HAMMADDE VE STOK DÜŞÜŞÜ DETAY TABLOSU (BOM) */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-slate-800">
                  Otomatik Hammadde İhtiyaç & Stok Düşüş Tablosu ({aggregatedIngredients.length} Kalem)
                </span>
              </div>
              {insufficientCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  {insufficientCount} Kalemde Stok Yetersiz
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Tüm Hammaddeler Stokta Mevcut
                </span>
              )}
            </div>

            <div className="max-h-56 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/70 text-slate-500 text-2xs uppercase tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="py-2 px-3 font-semibold">Hammadde Adı</th>
                    <th className="py-2 px-3 font-semibold text-right">Gereken Miktar</th>
                    <th className="py-2 px-3 font-semibold text-right">Depo Stoğu</th>
                    <th className="py-2 px-3 font-semibold text-right">Düşüş Sonrası</th>
                    <th className="py-2 px-3 font-semibold text-center">Stok Durumu</th>
                    <th className="py-2 px-3 font-semibold text-right">Tahmini Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {aggregatedIngredients.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3">
                        <span className="font-semibold text-slate-900 block">{item.name}</span>
                        <span className="text-2xs text-slate-400 block">
                          {item.recipeBreakdown.map((b) => `${b.recipeName}: ${b.amount} ${b.unit}`).join(" • ")}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {item.totalNeeded} {item.unit}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">
                        {item.currentStock} {item.unit}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-mono font-semibold ${
                          item.remainingStockAfter < 0 ? "text-rose-600" : "text-emerald-700"
                        }`}
                      >
                        {item.remainingStockAfter} {item.unit}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {item.isStockSufficient ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Yeterli
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Stok Az / Yok
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                        {formatCurrency(item.totalCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Özet Maliyetler */}
            <div className="bg-slate-50/90 p-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-2xs text-slate-400 block">Toplam Üretim</span>
                  <span className="font-bold text-slate-800">{portionCount} Porsiyon</span>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div>
                  <span className="text-2xs text-slate-400 block">Porsiyon Başı Hammadde</span>
                  <span className="font-bold text-amber-800">{formatCurrency(costPerPortion)} / pors.</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xs text-slate-400 block">Toplam Hammadde Çıkış Maliyeti</span>
                <span className="font-extrabold text-sm text-slate-900 font-mono">
                  {formatCurrency(totalRawCost)}
                </span>
              </div>
            </div>
          </div>

          {/* 5. OTOMATİK STOK DÜŞÜŞÜ VE TETİKLEME ONAYI */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              deductStock
                ? "bg-amber-50/60 border-amber-300 ring-1 ring-amber-400/20"
                : "bg-slate-50 border-slate-200 text-slate-500"
            }`}
          >
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={deductStock}
                onChange={(e) => setDeductStock(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <strong className="text-xs font-bold text-slate-900">
                    ⚡ Gerekli Hammaddeleri Stoktan Otomatik Düş (Üretim Sarfiyat Fişi Kes)
                  </strong>
                  <span className="px-2 py-0.5 rounded-md text-2xs font-bold bg-amber-600 text-white">
                    Önerilen
                  </span>
                </div>
                <p className="text-2xs text-slate-600">
                  İş emri onaylandığı anda yukarıda listelenen tüm hammadde miktarları merkezi stok deposundan otomatik olarak düşürülecek ve iş emri durumu <strong>"Hammadde Çıktı / Hazırlık"</strong> olarak başlatılacaktır.
                </p>
              </div>
            </label>
          </div>
        </form>

        {/* Modal Alt Bar & Butonlar */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Vazgeç
          </button>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              form="kitchenOrderForm"
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-amber-600/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {deductStock
                  ? `Mutfak İş Emrini Başlat & ${aggregatedIngredients.length} Hammaddeyi Stoktan Düş`
                  : "Mutfak İş Emrini Taslak Olarak Aç"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
