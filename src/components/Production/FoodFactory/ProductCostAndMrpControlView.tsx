import React, { useState, useMemo } from "react";
import {
  Scale,
  Calculator,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Package,
  Layers,
  TrendingUp,
  Download,
  Printer,
  Copy,
  Sliders,
  DollarSign,
  UtensilsCrossed,
  Flame,
  Zap,
  Building2,
  Sparkles,
  RefreshCw,
  Clock,
  ShieldCheck,
  Check,
  FileSpreadsheet,
} from "lucide-react";
import { FoodRecipe, Product, FoodCategory } from "../../../types";
import { formatCurrency, exportToExcel } from "../../../utils/exportUtils";
import { findMatchingProduct, normalizeName } from "../../../utils/foodKitchenOrderHelper";

interface ProductCostAndMrpControlViewProps {
  recipes: FoodRecipe[];
  products: Product[];
  initialSelectedRecipeId?: string;
  onNavigateToRecipe?: (recipeId: string) => void;
  onTriggerWorkOrder?: (recipe: FoodRecipe, portionCount: number) => void;
}

export const ProductCostAndMrpControlView: React.FC<ProductCostAndMrpControlViewProps> = ({
  recipes,
  products,
  initialSelectedRecipeId,
  onNavigateToRecipe,
  onTriggerWorkOrder,
}) => {
  // State
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(
    initialSelectedRecipeId || (recipes.length > 0 ? recipes[0].id : "")
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [portionCount, setPortionCount] = useState<number>(100);
  const [activeSubTab, setActiveSubTab] = useState<"all" | "costs" | "mrp_shortage">("all");
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  // Categories list
  const categories = [
    { id: "all", label: "Tüm Reçeteler" },
    { id: "breakfast_ration", label: "Kahvaltı Menüleri" },
    { id: "soup", label: "Çorbalar" },
    { id: "main_meat", label: "Et / Tavuk Yemekleri" },
    { id: "side_dish", label: "Pilav & Makarna" },
    { id: "main_veg", label: "Sebze & Bakliyat" },
    { id: "salad_appetizer", label: "Salata & Meze" },
    { id: "dessert_fruit", label: "Tatlı & Meyve" },
    { id: "beverage", label: "İçecekler" },
  ];

  // Filter recipes for dropdown/selection
  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.recipeCode && r.recipeCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.code && r.code.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCat =
        selectedCategory === "all" ||
        r.category === selectedCategory ||
        (selectedCategory === "salad_appetizer" && (r.category === "salad_appetizer" || (r as any).category === "salad_meze")) ||
        (selectedCategory === "breakfast_ration" && (r.category === "breakfast_ration" || (r as any).category === "breakfast"));

      return matchesSearch && matchesCat;
    });
  }, [recipes, searchTerm, selectedCategory]);

  // Active selected recipe
  const activeRecipe = useMemo(() => {
    return recipes.find((r) => r.id === selectedRecipeId) || recipes[0] || null;
  }, [recipes, selectedRecipeId]);

  // Calculate detailed ingredient requirements & stock comparison for the active recipe and portion count
  const mrpAnalysisData = useMemo(() => {
    if (!activeRecipe || !activeRecipe.ingredients) {
      return {
        ingredients: [],
        totalRawCost: 0,
        totalLaborCost: 0,
        totalGasCost: 0,
        totalOverheadCost: 0,
        totalBatchCost: 0,
        unitCost: 0,
        suggestedSalePrice: 0,
        totalRevenue: 0,
        grossProfit: 0,
        grossMarginPercent: 0,
        totalWeightKg: 0,
        shortageCount: 0,
        totalShortageCost: 0,
        maxPossiblePortionsByStock: 0,
        bottleneckIngredient: null as any,
        isFullyInStock: true,
      };
    }

    const baseServings = activeRecipe.servingsCount && activeRecipe.servingsCount > 0 ? activeRecipe.servingsCount : 1;
    const ratio = portionCount / baseServings;

    let bottleneckLimit = Number.MAX_SAFE_INTEGER;
    let bottleneckItem: any = null;

    let totalRawCost = 0;
    let shortageCount = 0;
    let totalShortageCost = 0;
    let totalNetWeightKg = 0;

    const list = activeRecipe.ingredients.map((ing, idx) => {
      // Determine standard unit amount (grams -> kg, ml -> lt)
      let portionAmountStd = 0;
      if (ing.portionGrams !== undefined && ing.portionGrams > 0) {
        if (ing.unit === "g" || ing.unit === "ml") {
          portionAmountStd = ing.portionGrams / 1000;
        } else {
          portionAmountStd = ing.portionGrams;
        }
      } else if (ing.amount !== undefined && ing.amount > 0) {
        portionAmountStd = ing.amount;
      } else {
        portionAmountStd = 0.05;
      }

      const displayUnit = ing.unit === "g" ? "kg" : ing.unit === "ml" ? "lt" : ing.unit || "kg";
      const totalNeeded = Math.round(portionAmountStd * ratio * 100) / 100;
      totalNetWeightKg += displayUnit === "kg" || displayUnit === "lt" ? totalNeeded : 0;

      // Find matching inventory product
      const matchedProduct = findMatchingProduct(ing.name, products);
      const currentStock = matchedProduct
        ? (matchedProduct.stockQuantity ?? matchedProduct.stock ?? 0)
        : 0;

      // Unit cost
      const unitCost =
        matchedProduct && matchedProduct.buyPrice > 0
          ? matchedProduct.buyPrice
          : ing.unitCost ??
            (portionAmountStd > 0 && ing.portionCost > 0
              ? Math.round((ing.portionCost / portionAmountStd) * 100) / 100
              : 50);

      // Portion cost
      const portionCost = ing.portionCost && ing.portionCost > 0 ? ing.portionCost : portionAmountStd * unitCost;
      const totalItemCost = Math.round(totalNeeded * unitCost * 100) / 100;
      totalRawCost += totalItemCost;

      // Stock remaining & shortage
      const remainingAfter = Math.round((currentStock - totalNeeded) * 100) / 100;
      const isShortage = currentStock < totalNeeded;
      const shortageAmount = isShortage ? Math.round((totalNeeded - currentStock) * 100) / 100 : 0;
      const shortageCost = Math.round(shortageAmount * unitCost * 100) / 100;

      if (isShortage) {
        shortageCount += 1;
        totalShortageCost += shortageCost;
      }

      // Check bottleneck
      if (portionAmountStd > 0) {
        const canProduce = Math.floor((currentStock / portionAmountStd) * baseServings);
        if (canProduce < bottleneckLimit) {
          bottleneckLimit = canProduce;
          bottleneckItem = {
            name: ing.name,
            currentStock,
            unit: displayUnit,
            portionAmountStd,
            canProduce,
          };
        }
      }

      const coveragePercent = totalNeeded > 0 ? Math.min(100, Math.round((currentStock / totalNeeded) * 100)) : 100;

      return {
        id: ing.id || `ing_${idx}`,
        name: ing.name,
        portionGrams: ing.portionGrams || (ing.amount ? ing.amount * 1000 : 50),
        unit: displayUnit,
        originalUnit: ing.unit,
        portionAmountStd,
        totalNeeded,
        unitCost,
        portionCost,
        totalItemCost,
        currentStock,
        remainingAfter,
        isShortage,
        shortageAmount,
        shortageCost,
        coveragePercent,
        matchedProductCode: matchedProduct?.code,
        matchedProductName: matchedProduct?.name,
        wastagePercent: ing.wastagePercent || 0,
        allergen: ing.allergen,
      };
    });

    // Cost additions
    const laborPerPortion = activeRecipe.laborCostPerPortion ?? 4.5;
    const gasPerPortion = activeRecipe.gasEnergyCostPerPortion ?? 1.8;
    const overheadPerPortion = activeRecipe.overheadCostPerPortion ?? 1.2;

    const totalLaborCost = Math.round(laborPerPortion * portionCount * 100) / 100;
    const totalGasCost = Math.round(gasPerPortion * portionCount * 100) / 100;
    const totalOverheadCost = Math.round(overheadPerPortion * portionCount * 100) / 100;

    const totalBatchCost = Math.round((totalRawCost + totalLaborCost + totalGasCost + totalOverheadCost) * 100) / 100;
    const unitCost = portionCount > 0 ? Math.round((totalBatchCost / portionCount) * 100) / 100 : 0;

    const suggestedSalePrice = activeRecipe.suggestedSalePrice || Math.round(unitCost * 1.6);
    const totalRevenue = Math.round(suggestedSalePrice * portionCount * 100) / 100;
    const grossProfit = Math.round((totalRevenue - totalBatchCost) * 100) / 100;
    const grossMarginPercent = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 1000) / 10 : 0;

    return {
      ingredients: list,
      totalRawCost: Math.round(totalRawCost * 100) / 100,
      totalLaborCost,
      totalGasCost,
      totalOverheadCost,
      totalBatchCost,
      unitCost,
      suggestedSalePrice,
      totalRevenue,
      grossProfit,
      grossMarginPercent,
      totalWeightKg: Math.round(totalNetWeightKg * 100) / 100,
      shortageCount,
      totalShortageCost: Math.round(totalShortageCost * 100) / 100,
      maxPossiblePortionsByStock: bottleneckLimit === Number.MAX_SAFE_INTEGER ? 0 : bottleneckLimit,
      bottleneckIngredient: bottleneckItem,
      isFullyInStock: shortageCount === 0,
    };
  }, [activeRecipe, portionCount, products]);

  // Missing items list
  const missingItems = useMemo(() => {
    return mrpAnalysisData.ingredients.filter((i) => i.isShortage);
  }, [mrpAnalysisData.ingredients]);

  // Copy purchase order list to clipboard
  const handleCopyPurchaseList = () => {
    if (!activeRecipe) return;

    if (missingItems.length === 0) {
      navigator.clipboard.writeText(
        `TÜM STOKLAR MEVCUT: ${activeRecipe.name} (${portionCount} Porsiyon) üretimi için gereken tüm hammaddeler depoda eksiksiz mevcuttur.`
      );
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
      return;
    }

    const lines = [
      `📋 SATIN ALMA / TEDARİK İHTİYAÇ LİSTESİ (MRP)`,
      `Ürün / Reçete: ${activeRecipe.name} (${activeRecipe.recipeCode || activeRecipe.code})`,
      `Üretim Parti Hedefi: ${portionCount} Porsiyon`,
      `Tarih: ${new Date().toLocaleDateString("tr-TR")}`,
      `----------------------------------------------------`,
      ...missingItems.map(
        (m, idx) =>
          `${idx + 1}. ${m.name}: Eksik Miktar: ${m.shortageAmount} ${m.unit} (Depoda: ${m.currentStock} ${m.unit} / Gereken: ${m.totalNeeded} ${m.unit}) - Tahmini Tutar: ${formatCurrency(m.shortageCost)}`
      ),
      `----------------------------------------------------`,
      `TOPLAM SATIN ALMA TAHMİNİ MALİYETİ: ${formatCurrency(mrpAnalysisData.totalShortageCost)}`,
    ];

    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (!activeRecipe) return;

    const rows = mrpAnalysisData.ingredients.map((item, idx) => [
      idx + 1,
      item.name,
      item.matchedProductCode || "-",
      `${item.portionGrams} ${item.originalUnit || "g"}`,
      `${item.totalNeeded} ${item.unit}`,
      `${item.currentStock} ${item.unit}`,
      item.isShortage ? `Eksik: ${item.shortageAmount} ${item.unit}` : `Yeterli (Kalan: ${item.remainingAfter} ${item.unit})`,
      item.unitCost,
      item.portionCost,
      item.totalItemCost,
      item.shortageCost,
    ]);

    exportToExcel({
      filename: `MRP_Maliyet_${activeRecipe.name.replace(/\s+/g, "_")}_${portionCount}porsiyon`,
      title: `Hammadde Maliyet Analizi & MRP Kontrol Raporu`,
      subtitle: `${activeRecipe.name} (${activeRecipe.recipeCode || ""}) - ${portionCount} Porsiyon Üretim Partisi`,
      headers: [
        "Sıra",
        "Hammadde Adı",
        "Stok Kodu",
        "Porsiyon Gramajı",
        "Gereken Miktar",
        "Mevcut Depo Stoğu",
        "Stok Durumu",
        "Birim Maliyet (TL)",
        "Porsiyon Maliyeti (TL)",
        "Toplam Parti Maliyeti (TL)",
        "Eksik Satın Alma Tutarı (TL)",
      ],
      rows,
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. ÜST BAŞLIK & KONTROL PANELİ */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-editorial font-medium text-slate-900 flex items-center gap-2">
                  <span>Maliyet Analizi ve MRP Kontrolü</span>
                  <span className="text-2xs font-sans font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    Ürün & Reçete Bazlı
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Seçilen ürün için parti bazlı hammadde maliyetleri, genel gider payları ve anlık depo stok açığı (MRP) kontrolü.
                </p>
              </div>
            </div>
          </div>

          {/* Dışa Aktar & Hızlı Aksiyonlar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyPurchaseList}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                copiedSuccess
                  ? "bg-emerald-600 text-white"
                  : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
              }`}
            >
              {copiedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Satın Alma Listesi Kopyalandı!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-amber-600" />
                  <span>Satın Alma Listesini Kopyala</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Excel Raporu</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Yazdır</span>
            </button>

            {onTriggerWorkOrder && activeRecipe && (
              <button
                type="button"
                onClick={() => onTriggerWorkOrder(activeRecipe, portionCount)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>İş Emri Başlat</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. ÜRÜN / REÇETE SEÇİCİ & PARTİ BOYUTU GİRİŞİ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-3 border-t border-slate-100">
          {/* Ürün & Kategori Seçimi */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-xs font-bold text-slate-700 whitespace-nowrap flex items-center gap-1.5">
                <Package className="w-4 h-4 text-amber-600" />
                <span>Analiz Edilecek Ürün / Reçete:</span>
              </label>

              {/* Kategori Filtresi */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>

              {/* Arama Inputu */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Reçete adı veya kod ara..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {/* Ürün Seçim Dropdown'ı */}
            <div className="relative">
              <select
                value={selectedRecipeId}
                onChange={(e) => setSelectedRecipeId(e.target.value)}
                className="w-full px-4 py-2.5 bg-amber-50/50 hover:bg-amber-50/80 border border-amber-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer transition-colors"
              >
                {filteredRecipes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.recipeCode || r.code ? `[${r.recipeCode || r.code}] ` : ""}
                    {r.name} - ({r.categoryLabel || r.category}) - 1 Porsiyon: {formatCurrency(r.portionCost || 0)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Parti Büyüklüğü (Porsiyon Sayısı) */}
          <div className="lg:col-span-4 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-600" />
                <span>Üretim Parti Miktarı:</span>
              </label>
              <span className="text-2xs font-semibold text-slate-500">
                Toplam ~{((mrpAnalysisData.totalWeightKg)).toFixed(1)} kg mamul
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="1"
                  max="100000"
                  step="10"
                  value={portionCount}
                  onChange={(e) => setPortionCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-2xs font-bold text-slate-400">
                  Porsiyon
                </span>
              </div>

              {/* Hızlı Parti Butonları */}
              <div className="flex items-center gap-1">
                {[50, 100, 250, 500, 1000].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPortionCount(num)}
                    className={`px-2 py-1 rounded-md text-2xs font-bold transition-all cursor-pointer ${
                      portionCount === num
                        ? "bg-amber-600 text-white shadow-2xs"
                        : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3. SEÇİLEN REÇETE ÖZET KARTI & DARBOĞAZ (BOTTLENECK) BİLGİSİ */}
        {activeRecipe && (
          <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">{activeRecipe.name}</span>
              <span className="px-2 py-0.5 rounded font-mono text-2xs bg-slate-100 text-slate-600 border border-slate-200">
                {activeRecipe.recipeCode || activeRecipe.code}
              </span>
              <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                {activeRecipe.categoryLabel || activeRecipe.category}
              </span>
              <span className="text-slate-500">
                Standart Porsiyon: <strong>{activeRecipe.standardPortionGrams || 300} gr</strong>
              </span>
              {activeRecipe.caloriePerPortion && (
                <span className="text-slate-500">
                  Kalori: <strong>{activeRecipe.caloriePerPortion} kcal</strong>
                </span>
              )}
            </div>

            {/* Darboğaz & Maksimum Üretilebilir Kapasite */}
            {mrpAnalysisData.bottleneckIngredient && (
              <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 text-2xs">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="text-amber-900">
                  Mevcut stokla en fazla{" "}
                  <strong className="text-amber-950 font-bold underline">
                    {mrpAnalysisData.maxPossiblePortionsByStock} Porsiyon
                  </strong>{" "}
                  üretilebilir (Kritik: {mrpAnalysisData.bottleneckIngredient.name}).
                </span>
                {mrpAnalysisData.maxPossiblePortionsByStock > 0 &&
                  mrpAnalysisData.maxPossiblePortionsByStock !== portionCount && (
                    <button
                      type="button"
                      onClick={() => setPortionCount(mrpAnalysisData.maxPossiblePortionsByStock)}
                      className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Buna Eşitle
                    </button>
                  )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. MALİYET & KÂRLILIK KPI KARTLARI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hammadde Maliyeti */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Toplam Hammadde (BOM)</span>
            <span className="p-1 rounded-lg bg-amber-50 text-amber-700">
              <Scale className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {formatCurrency(mrpAnalysisData.totalRawCost)}
          </div>
          <div className="text-2xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Porsiyon Başı:</span>
            <span className="font-mono font-bold text-slate-700">
              {formatCurrency(portionCount > 0 ? mrpAnalysisData.totalRawCost / portionCount : 0)}
            </span>
          </div>
        </div>

        {/* İşçilik, Enerji & Genel Gider */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">İşçilik & Enerji & Genel</span>
            <span className="p-1 rounded-lg bg-blue-50 text-blue-700">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {formatCurrency(
              mrpAnalysisData.totalLaborCost + mrpAnalysisData.totalGasCost + mrpAnalysisData.totalOverheadCost
            )}
          </div>
          <div className="text-2xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>İşçilik + Gaz + Amortisman:</span>
            <span className="font-mono font-bold text-slate-700">
              {formatCurrency(
                portionCount > 0
                  ? (mrpAnalysisData.totalLaborCost + mrpAnalysisData.totalGasCost + mrpAnalysisData.totalOverheadCost) /
                      portionCount
                  : 0
              )}
              /pors.
            </span>
          </div>
        </div>

        {/* Toplam Parti Fabrika Maliyeti */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">Toplam Parti Fabrika Maliyeti</span>
            <span className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {formatCurrency(mrpAnalysisData.totalBatchCost)}
          </div>
          <div className="text-2xs text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
            <span>Birim Porsiyon Maliyeti:</span>
            <span className="font-mono font-bold text-white text-xs">
              {formatCurrency(mrpAnalysisData.unitCost)}
            </span>
          </div>
        </div>

        {/* Satış Geliri & Kâr Marjı */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Önerilen Satış & Kâr</span>
            <span className="p-1 rounded-lg bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700">
            {formatCurrency(mrpAnalysisData.totalRevenue)}
          </div>
          <div className="text-2xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Brüt Kâr Marjı:</span>
            <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              %{mrpAnalysisData.grossMarginPercent} ({formatCurrency(mrpAnalysisData.grossProfit)})
            </span>
          </div>
        </div>
      </div>

      {/* 5. MRP DURUM BANDI: STOK YETERLİ Mİ, EKSİK VAR MI? */}
      {mrpAnalysisData.isFullyInStock ? (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-emerald-950">
                Depo Stoğu Tamamen Yeterli - Üretime Hazır!
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                {portionCount} porsiyon {activeRecipe?.name} üretimi için gereken tüm hammaddeler depoda mevcuttur. Ek satın alma yapılmasına gerek yoktur.
              </p>
            </div>
          </div>
          {onTriggerWorkOrder && activeRecipe && (
            <button
              type="button"
              onClick={() => onTriggerWorkOrder(activeRecipe, portionCount)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              Mutfak İş Emri Başlat
            </button>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-rose-950 flex items-center gap-2">
                <span>Stok Yetersiz: {mrpAnalysisData.shortageCount} Kalem Hammadde Eksik!</span>
                <span className="text-2xs font-mono font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-900">
                  Tedarik Bütçesi: {formatCurrency(mrpAnalysisData.totalShortageCost)}
                </span>
              </h4>
              <p className="text-xs text-rose-800 mt-0.5">
                Üretim partisinin eksiksiz tamamlanabilmesi için aşağıdaki eksik kalemlerin satın alınması gerekmektedir.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyPurchaseList}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Eksik Listesini Kopyala</span>
          </button>
        </div>
      )}

      {/* 6. TABLO SEKMELERİ (Tümü, Maliyet Detayları, Eksik MRP Kalemleri) */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab("all")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "all"
              ? "bg-amber-600 text-white shadow-2xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <span>Tüm Hammaddeler & Stok Kontrolü ({mrpAnalysisData.ingredients.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("mrp_shortage")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === "mrp_shortage"
              ? "bg-rose-600 text-white shadow-2xs"
              : "bg-white text-rose-700 hover:bg-rose-50 border border-rose-200"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Sadece Eksik Stok Kalemleri ({mrpAnalysisData.shortageCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("costs")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "costs"
              ? "bg-slate-900 text-white shadow-2xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <span>BOM Maliyet Ağacı & Pay Dağılımı</span>
        </button>
      </div>

      {/* 7. HAMMADDE VE MRP ANALİZ TABLOSU */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-2xs uppercase tracking-wider font-bold">
                <th className="py-3 px-4">Hammadde / Malzeme Adı</th>
                <th className="py-3 px-3 text-center">Birim</th>
                <th className="py-3 px-3 text-right">Porsiyon Miktarı</th>
                <th className="py-3 px-3 text-right">Parti İhtiyacı ({portionCount} Pors.)</th>
                <th className="py-3 px-3 text-right">Depo Mevcut Stok</th>
                <th className="py-3 px-3 text-center">Stok Durumu / Açık</th>
                <th className="py-3 px-3 text-right">Birim Alış (TL)</th>
                <th className="py-3 px-3 text-right">Pors. Maliyet</th>
                <th className="py-3 px-4 text-right">Toplam Tutar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mrpAnalysisData.ingredients
                .filter((item) => (activeSubTab === "mrp_shortage" ? item.isShortage : true))
                .map((item, idx) => {
                  const costShare =
                    mrpAnalysisData.totalRawCost > 0
                      ? Math.round((item.totalItemCost / mrpAnalysisData.totalRawCost) * 100)
                      : 0;

                  return (
                    <tr
                      key={item.id || idx}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        item.isShortage ? "bg-rose-50/30" : ""
                      }`}
                    >
                      {/* Hammadde Adı & Varsa Eşleşen Ürün Kodu */}
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              item.isShortage ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                            }`}
                          />
                          <div>
                            <span className="font-bold text-slate-900">{item.name}</span>
                            {item.matchedProductCode ? (
                              <span className="ml-1.5 text-2xs font-mono text-slate-400">
                                ({item.matchedProductCode})
                              </span>
                            ) : (
                              <span className="ml-1.5 text-2xs text-amber-600 font-normal">
                                (Stok Kartı Eşleşmedi)
                              </span>
                            )}
                            {item.allergen && (
                              <span className="ml-1.5 text-2xs px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                {item.allergen}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Birim */}
                      <td className="py-3 px-3 text-center font-mono text-xs uppercase text-slate-500">
                        {item.unit}
                      </td>

                      {/* 1 Porsiyon Miktarı */}
                      <td className="py-3 px-3 text-right font-medium text-slate-600">
                        {item.portionGrams} {item.originalUnit || "g"}
                      </td>

                      {/* Parti Gereken Miktar */}
                      <td className="py-3 px-3 text-right font-bold text-amber-900 font-mono text-sm">
                        {item.totalNeeded.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} {item.unit}
                      </td>

                      {/* Depo Mevcut */}
                      <td className="py-3 px-3 text-right font-semibold text-slate-700 font-mono">
                        {item.currentStock.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} {item.unit}
                      </td>

                      {/* Stok Durumu & Eksik Miktar */}
                      <td className="py-3 px-3 text-center">
                        {item.isShortage ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>Eksik: -{item.shortageAmount} {item.unit}</span>
                            </span>
                            <span className="text-2xs font-bold text-rose-600 mt-0.5 font-mono">
                              ({formatCurrency(item.shortageCost)})
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Yeterli (+{item.remainingAfter})</span>
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Birim Fiyat */}
                      <td className="py-3 px-3 text-right text-slate-600 font-mono text-xs">
                        {formatCurrency(item.unitCost)}
                      </td>

                      {/* Porsiyon Maliyeti */}
                      <td className="py-3 px-3 text-right text-slate-700 font-mono text-xs">
                        {formatCurrency(item.portionCost)}
                      </td>

                      {/* Toplam Parti Maliyeti ve Payı */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-bold text-slate-900 font-mono text-sm">
                          {formatCurrency(item.totalItemCost)}
                        </div>
                        <div className="text-2xs text-slate-400 font-mono">
                          BOM Payı: %{costShare}
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {mrpAnalysisData.ingredients.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400 text-xs">
                    Seçilen ürün için kayıtlı hammadde reçetesi bulunamadı.
                  </td>
                </tr>
              )}

              {activeSubTab === "mrp_shortage" && missingItems.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-emerald-700 font-medium text-xs bg-emerald-50/50">
                    🎉 Tebrikler! Bu parti büyüklüğü ({portionCount} porsiyon) için depoda eksik hammadde bulunmamaktadır.
                  </td>
                </tr>
              )}
            </tbody>

            {/* TABLO ALTI TOPLAMLAR */}
            <tfoot>
              <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-xs sm:text-sm text-slate-900">
                <td colSpan={5} className="py-3.5 px-4 text-left">
                  <span>Hammadde Maliyet Toplamı:</span>
                  <span className="ml-2 font-normal text-slate-500 text-xs">
                    ({mrpAnalysisData.ingredients.length} kalem hammadde)
                  </span>
                </td>
                <td className="py-3.5 px-3 text-center">
                  {mrpAnalysisData.shortageCount > 0 ? (
                    <span className="text-2xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                      Toplam Açık: {formatCurrency(mrpAnalysisData.totalShortageCost)}
                    </span>
                  ) : (
                    <span className="text-2xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Tüm Stoklar Tam
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-3 text-right"></td>
                <td className="py-3.5 px-3 text-right font-mono text-slate-800">
                  {formatCurrency(
                    portionCount > 0 ? mrpAnalysisData.totalRawCost / portionCount : 0
                  )}
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-base font-bold text-amber-800">
                  {formatCurrency(mrpAnalysisData.totalRawCost)}
                </td>
              </tr>

              <tr className="bg-slate-900 text-white font-bold text-xs sm:text-sm">
                <td colSpan={6} className="py-3.5 px-4 text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-amber-400 font-bold">GENEL TOPLAM FABRİKA MALİYETİ:</span>
                    <span className="text-2xs font-normal text-slate-400">
                      (Hammadde + {formatCurrency(mrpAnalysisData.totalLaborCost)} İşçilik +{" "}
                      {formatCurrency(mrpAnalysisData.totalGasCost)} Enerji +{" "}
                      {formatCurrency(mrpAnalysisData.totalOverheadCost)} Genel Gider)
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-right"></td>
                <td className="py-3.5 px-3 text-right font-mono text-slate-300">
                  {formatCurrency(mrpAnalysisData.unitCost)} /pors.
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-lg font-bold text-amber-400">
                  {formatCurrency(mrpAnalysisData.totalBatchCost)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
