import React, { useState, useMemo } from "react";
import {
  Scale,
  DollarSign,
  TrendingUp,
  PieChart,
  BarChart3,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Printer,
  ChevronRight,
  Calculator,
  Flame,
  Clock,
  Layers,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  UtensilsCrossed,
  Sparkles,
  Info,
  ChevronDown,
  ArrowUpRight,
  TrendingDown,
  ShieldAlert,
  Percent,
} from "lucide-react";
import { FoodRecipe, FoodIngredientItem, FoodCategory, Product } from "../../../types";
import { formatCurrency, exportToExcel } from "../../../utils/exportUtils";

interface FoodRecipeCostAnalysisViewProps {
  recipes: FoodRecipe[];
  products?: Product[];
  initialSelectedRecipeId?: string;
  onNavigateToRecipeEdit?: (recipe: FoodRecipe) => void;
  onNavigateToMrp?: () => void;
}

type AnalysisTab = "matrix" | "drilldown" | "where_used" | "category_comparison";

export const FoodRecipeCostAnalysisView: React.FC<FoodRecipeCostAnalysisViewProps> = ({
  recipes,
  products = [],
  initialSelectedRecipeId,
  onNavigateToRecipeEdit,
  onNavigateToMrp,
}) => {
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<AnalysisTab>("matrix");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"cost_desc" | "cost_asc" | "margin_desc" | "weight_desc" | "name_asc">("cost_desc");

  // Drilldown state
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(
    initialSelectedRecipeId || (recipes.length > 0 ? recipes[0].id : "")
  );
  const [batchPortionCount, setBatchPortionCount] = useState<number>(500);

  // Where-used ingredient state
  const [selectedIngredientName, setSelectedIngredientName] = useState<string>("");
  const [priceInflationPercent, setPriceInflationPercent] = useState<number>(20);

  const selectedRecipe = useMemo(() => {
    return recipes.find((r) => r.id === selectedRecipeId) || recipes[0] || null;
  }, [recipes, selectedRecipeId]);

  // Categories list
  const categories: { id: string; label: string }[] = [
    { id: "all", label: "Tüm Kategoriler" },
    { id: "soup", label: "Çorbalar" },
    { id: "main_meat", label: "Et / Tavuk Yemekleri" },
    { id: "side_dish", label: "Pilav & Makarna" },
    { id: "salad_appetizer", label: "Salata & Meze" },
    { id: "dessert_fruit", label: "Tatlı & Meyve" },
    { id: "beverage", label: "İçecekler" },
    { id: "main_veg", label: "Sebzeli & Bakliyat" },
    { id: "bakery", label: "Unlu Mamul & Ekmek" },
  ];

  // Key KPI Calculations across all recipes
  const metrics = useMemo(() => {
    if (recipes.length === 0) {
      return {
        count: 0,
        avgRawCost: 0,
        avgTotalCost: 0,
        avgPortionGrams: 0,
        avgMargin: 0,
        avgCalories: 0,
        highestCostRecipe: null as FoodRecipe | null,
        lowestCostRecipe: null as FoodRecipe | null,
        highestMarginRecipe: null as FoodRecipe | null,
      };
    }

    const totalRawCost = recipes.reduce((sum, r) => sum + r.portionCost, 0);
    const totalCost = recipes.reduce((sum, r) => sum + r.totalCostPerPortion, 0);
    const totalGrams = recipes.reduce((sum, r) => sum + r.standardPortionGrams, 0);
    const totalCalories = recipes.reduce((sum, r) => sum + (r.caloriePerPortion || 0), 0);

    const validMargins = recipes.map((r) => {
      if (r.suggestedSalePrice <= 0) return 0;
      return ((r.suggestedSalePrice - r.totalCostPerPortion) / r.suggestedSalePrice) * 100;
    });
    const avgMargin = validMargins.reduce((sum, m) => sum + m, 0) / recipes.length;

    const sortedByCost = [...recipes].sort((a, b) => b.totalCostPerPortion - a.totalCostPerPortion);
    const sortedByMargin = [...recipes].sort((a, b) => {
      const marginA = a.suggestedSalePrice > 0 ? ((a.suggestedSalePrice - a.totalCostPerPortion) / a.suggestedSalePrice) * 100 : 0;
      const marginB = b.suggestedSalePrice > 0 ? ((b.suggestedSalePrice - b.totalCostPerPortion) / b.suggestedSalePrice) * 100 : 0;
      return marginB - marginA;
    });

    return {
      count: recipes.length,
      avgRawCost: totalRawCost / recipes.length,
      avgTotalCost: totalCost / recipes.length,
      avgPortionGrams: Math.round(totalGrams / recipes.length),
      avgMargin: Math.round(avgMargin * 10) / 10,
      avgCalories: Math.round(totalCalories / recipes.length),
      highestCostRecipe: sortedByCost[0] || null,
      lowestCostRecipe: sortedByCost[sortedByCost.length - 1] || null,
      highestMarginRecipe: sortedByMargin[0] || null,
    };
  }, [recipes]);

  // Filtered and Sorted Recipes for Matrix
  const filteredAndSortedRecipes = useMemo(() => {
    return recipes
      .filter((r) => {
        const matchesSearch =
          r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.recipeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.ingredients.some((ing) => ing.name.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCategory = selectedCategory === "all" || r.category === selectedCategory;

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === "cost_desc") return b.totalCostPerPortion - a.totalCostPerPortion;
        if (sortBy === "cost_asc") return a.totalCostPerPortion - b.totalCostPerPortion;
        if (sortBy === "weight_desc") return b.standardPortionGrams - a.standardPortionGrams;
        if (sortBy === "name_asc") return a.name.localeCompare(b.name, "tr");
        if (sortBy === "margin_desc") {
          const marginA = a.suggestedSalePrice > 0 ? ((a.suggestedSalePrice - a.totalCostPerPortion) / a.suggestedSalePrice) * 100 : 0;
          const marginB = b.suggestedSalePrice > 0 ? ((b.suggestedSalePrice - b.totalCostPerPortion) / b.suggestedSalePrice) * 100 : 0;
          return marginB - marginA;
        }
        return 0;
      });
  }, [recipes, searchTerm, selectedCategory, sortBy]);

  // Extract all distinct ingredients across recipes for Where-Used analysis
  const allDistinctIngredients = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        recipeCount: number;
        recipesUsing: {
          recipe: FoodRecipe;
          portionGrams: number;
          unit: string;
          portionCost: number;
          costSharePercent: number;
          wastagePercent: number;
        }[];
        avgUnitCost: number;
        unit: string;
        totalGramsPerMealRound: number;
      }
    >();

    recipes.forEach((rec) => {
      rec.ingredients.forEach((ing) => {
        const normalizedName = ing.name.trim();
        const existing = map.get(normalizedName);
        const costShare = rec.portionCost > 0 ? (ing.portionCost / rec.portionCost) * 100 : 0;

        if (existing) {
          existing.recipeCount += 1;
          existing.recipesUsing.push({
            recipe: rec,
            portionGrams: ing.portionGrams,
            unit: ing.unit,
            portionCost: ing.portionCost,
            costSharePercent: Math.round(costShare * 10) / 10,
            wastagePercent: ing.wastagePercent,
          });
          existing.totalGramsPerMealRound += ing.portionGrams;
          existing.avgUnitCost = (existing.avgUnitCost + ing.unitCost) / 2;
        } else {
          map.set(normalizedName, {
            name: normalizedName,
            recipeCount: 1,
            recipesUsing: [
              {
                recipe: rec,
                portionGrams: ing.portionGrams,
                unit: ing.unit,
                portionCost: ing.portionCost,
                costSharePercent: Math.round(costShare * 10) / 10,
                wastagePercent: ing.wastagePercent,
              },
            ],
            avgUnitCost: ing.unitCost,
            unit: ing.unit,
            totalGramsPerMealRound: ing.portionGrams,
          });
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => b.recipeCount - a.recipeCount);
  }, [recipes]);

  // Set default selected ingredient if not set
  useMemo(() => {
    if (!selectedIngredientName && allDistinctIngredients.length > 0) {
      setSelectedIngredientName(allDistinctIngredients[0].name);
    }
  }, [allDistinctIngredients, selectedIngredientName]);

  const activeIngredientData = useMemo(() => {
    return allDistinctIngredients.find((i) => i.name === selectedIngredientName) || allDistinctIngredients[0] || null;
  }, [allDistinctIngredients, selectedIngredientName]);

  // Category Summary Aggregates
  const categoryAggregates = useMemo(() => {
    const map = new Map<
      string,
      {
        category: FoodCategory;
        label: string;
        count: number;
        totalRawCost: number;
        totalCost: number;
        totalSalePrice: number;
        totalGrams: number;
        totalCalories: number;
      }
    >();

    recipes.forEach((rec) => {
      const cat = rec.category;
      const existing = map.get(cat);
      if (existing) {
        existing.count += 1;
        existing.totalRawCost += rec.portionCost;
        existing.totalCost += rec.totalCostPerPortion;
        existing.totalSalePrice += rec.suggestedSalePrice;
        existing.totalGrams += rec.standardPortionGrams;
        existing.totalCalories += rec.caloriePerPortion || 0;
      } else {
        map.set(cat, {
          category: cat,
          label: rec.categoryLabel || cat,
          count: 1,
          totalRawCost: rec.portionCost,
          totalCost: rec.totalCostPerPortion,
          totalSalePrice: rec.suggestedSalePrice,
          totalGrams: rec.standardPortionGrams,
          totalCalories: rec.caloriePerPortion || 0,
        });
      }
    });

    return Array.from(map.values()).map((c) => {
      const avgRawCost = c.totalRawCost / c.count;
      const avgTotalCost = c.totalCost / c.count;
      const avgSalePrice = c.totalSalePrice / c.count;
      const avgGrams = Math.round(c.totalGrams / c.count);
      const avgCalories = Math.round(c.totalCalories / c.count);
      const avgMargin = avgSalePrice > 0 ? Math.round(((avgSalePrice - avgTotalCost) / avgSalePrice) * 1000) / 10 : 0;
      const costPerGram = avgGrams > 0 ? (avgTotalCost / avgGrams) * 100 : 0; // 100 gr başı maliyet

      return {
        ...c,
        avgRawCost,
        avgTotalCost,
        avgSalePrice,
        avgGrams,
        avgCalories,
        avgMargin,
        costPerHundredGrams: costPerGram,
      };
    });
  }, [recipes]);

  // Export to Excel handler
  const handleExportExcel = () => {
    const headers = [
      "Reçete Kodu",
      "Yemek Adı",
      "Kategori",
      "Porsiyon Gramajı (g)",
      "Bileşen Sayısı",
      "Hammadde Maliyeti (₺)",
      "İşçilik Gideri (₺)",
      "Gaz & Enerji Gideri (₺)",
      "Genel Gider (₺)",
      "Toplam Maliyet (₺)",
      "Tavsiye Satış (₺)",
      "Kâr Tutarı (₺)",
      "Kâr Marjı (%)",
      "Kalori (kcal)",
      "En Yüksek Maliyetli Hammadde",
    ];

    const rows = filteredAndSortedRecipes.map((r) => {
      const margin = r.suggestedSalePrice > 0 ? (((r.suggestedSalePrice - r.totalCostPerPortion) / r.suggestedSalePrice) * 100).toFixed(1) : "0";
      const profit = (r.suggestedSalePrice - r.totalCostPerPortion).toFixed(2);
      const topIng = [...r.ingredients].sort((a, b) => b.portionCost - a.portionCost)[0];
      const labor = r.laborCostPerPortion ?? (r.laborAndOverheadPerPortion ? r.laborAndOverheadPerPortion * 0.6 : 3.5);
      const gas = r.gasEnergyCostPerPortion ?? (r.laborAndOverheadPerPortion ? r.laborAndOverheadPerPortion * 0.3 : 2.0);
      const overhead = r.overheadCostPerPortion ?? (r.laborAndOverheadPerPortion ? r.laborAndOverheadPerPortion * 0.1 : 0.8);

      return [
        r.recipeCode,
        r.name,
        r.categoryLabel,
        r.standardPortionGrams,
        r.ingredients.length,
        r.portionCost.toFixed(2),
        labor.toFixed(2),
        gas.toFixed(2),
        overhead.toFixed(2),
        r.totalCostPerPortion.toFixed(2),
        r.suggestedSalePrice.toFixed(2),
        profit,
        `%${margin}`,
        r.caloriePerPortion,
        topIng ? `${topIng.name} (${formatCurrency(topIng.portionCost)})` : "-",
      ];
    });

    exportToExcel({
      filename: `Yemek_Fabrikasi_Recete_Maliyet_Gramaj_Analizi_${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: "Reçete Maliyet Analizi",
      title: "Yemek Fabrikası & Catering - Reçete Bazlı Hammadde Maliyet ve Gramaj Analiz Raporu",
      subtitle: `Toplam ${filteredAndSortedRecipes.length} reçete analiz edildi. Rapor Oluşturma: ${new Date().toLocaleDateString("tr-TR")}`,
      headers,
      rows,
    });
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 🍲 ÜST BAŞLIK VE EYLEMLER */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 font-bold shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>Reçete Bazlı Hammadde Maliyet & Gramaj Analizi</span>
                <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  BOM Maliyet Motoru
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Porsiyon gramajları, çiğ/pişmiş katsayıları, hammadde birim maliyetleri, zayiat (fire) oranları ve kârlılık kırılımları.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Excel (.xlsx) İndir</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Yazdır / PDF</span>
          </button>
        </div>
      </div>

      {/* 📊 ÜST KPI ÖZET KARTLARI */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Toplam Reçete */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400 block">Kayıtlı Reçete</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{metrics.count}</span>
            <UtensilsCrossed className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xs text-slate-500 mt-1 block">Tüm mutfak kategorileri</span>
        </div>

        {/* Ortalama Hammadde Maliyeti */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400 block">Ort. Hammadde</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-black text-amber-700">{formatCurrency(metrics.avgRawCost)}</span>
            <Scale className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xs text-slate-500 mt-1 block">Porsiyon başı net gıda</span>
        </div>

        {/* Ortalama Toplam Porsiyon Maliyeti */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400 block">Ort. Toplam Maliyet</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-black text-slate-900">{formatCurrency(metrics.avgTotalCost)}</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-2xs text-slate-500 mt-1 block">İşçilik & enerji dahil</span>
        </div>

        {/* Ortalama Gramaj */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400 block">Ortalama Gramaj</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-700">{metrics.avgPortionGrams} gr</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-2xs text-slate-500 mt-1 block">Porsiyon servis ağırlığı</span>
        </div>

        {/* Ortalama Kâr Marjı */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400 block">Ort. Brüt Kâr</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-700">%{metrics.avgMargin}</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xs text-slate-500 mt-1 block">Satış fiyatı üzerinden</span>
        </div>

        {/* Ortalama Besin Değeri */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400 block">Ort. Kalori</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-orange-700">{metrics.avgCalories} kcal</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <span className="text-2xs text-slate-500 mt-1 block">Diyetisyen tabldot dengesi</span>
        </div>
      </div>

      {/* 🧭 ANALİZ ALT GÖRÜNÜM SEKMELERİ (TABS) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveAnalysisTab("matrix")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeAnalysisTab === "matrix"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Reçete & Gramaj Karşılaştırma Matrisi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAnalysisTab("drilldown")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeAnalysisTab === "drilldown"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Tek Reçete Derinlemesine Ayrıştırma (BOM)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAnalysisTab("where_used")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeAnalysisTab === "where_used"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <ArrowUpDown className="w-4 h-4" />
          <span>Hammadde Nerede Kullanılıyor & Enflasyon Simülatörü</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAnalysisTab("category_comparison")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeAnalysisTab === "category_comparison"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Kategori Kıyaslama</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 📌 GÖRÜNÜM 1: REÇETE & GRAMAJ KARŞILAŞTIRMA MATRİSİ (MATRIX)              */}
      {/* ========================================================================= */}
      {activeAnalysisTab === "matrix" && (
        <div className="space-y-4">
          {/* Arama, Kategori ve Sıralama Filtreleri */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Reçete adı, kodu veya hammadde (örn: kıyma, pirinç, un) ara..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <div className="relative flex-1 md:w-48">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative flex-1 md:w-56">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="cost_desc">Maliyet: En Yüksekten Düşüğe</option>
                  <option value="cost_asc">Maliyet: En Düşükten Yükseğe</option>
                  <option value="margin_desc">Kâr Marjı: En Yüksek</option>
                  <option value="weight_desc">Gramaj: En Ağır Porsiyon</option>
                  <option value="name_asc">Yemek Adı (A-Z)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Matris Tablosu */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-2xs uppercase tracking-wider font-bold text-slate-500">
                    <th className="py-3 px-4">Reçete / Yemek Adı</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3 text-center">Porsiyon Gramajı</th>
                    <th className="py-3 px-3 text-center">Bileşen / Fire</th>
                    <th className="py-3 px-3 text-right">Hammadde (₺)</th>
                    <th className="py-3 px-3 text-right text-blue-700">İşçilik (₺)</th>
                    <th className="py-3 px-3 text-right text-amber-700">Gaz & Enerji (₺)</th>
                    <th className="py-3 px-3 text-right font-black text-slate-800">Toplam Maliyet</th>
                    <th className="py-3 px-3 text-right">Tavsiye Satış</th>
                    <th className="py-3 px-3 text-center">Brüt Kâr Marjı</th>
                    <th className="py-3 px-3">En Pahalı Hammadde</th>
                    <th className="py-3 px-3 text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredAndSortedRecipes.map((recipe) => {
                    const margin =
                      recipe.suggestedSalePrice > 0
                        ? Math.round(((recipe.suggestedSalePrice - recipe.totalCostPerPortion) / recipe.suggestedSalePrice) * 1000) / 10
                        : 0;

                    // Top cost driver ingredient
                    const topIngredient = [...recipe.ingredients].sort((a, b) => b.portionCost - a.portionCost)[0];
                    const topIngredientShare =
                      recipe.portionCost > 0 && topIngredient ? Math.round((topIngredient.portionCost / recipe.portionCost) * 100) : 0;

                    // Raw ingredients total weight
                    const totalRawWeight = recipe.ingredients.reduce((sum, i) => sum + (i.portionGrams || 0), 0);
                    const avgWastage =
                      recipe.ingredients.length > 0
                        ? Math.round(recipe.ingredients.reduce((sum, i) => sum + (i.wastagePercent || 0), 0) / recipe.ingredients.length)
                        : 0;

                    return (
                      <tr key={recipe.id} className="hover:bg-amber-50/30 transition-colors group">
                        {/* Yemek Adı & Kod */}
                        <td className="py-3.5 px-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                                {recipe.name}
                              </span>
                              {recipe.isApproved && (
                                <span title="Onaylı Reçete" className="text-emerald-600">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-2xs text-slate-400 mt-0.5">
                              <span className="font-mono">{recipe.recipeCode}</span>
                              <span>•</span>
                              <span>{recipe.caloriePerPortion} kcal</span>
                              <span>•</span>
                              <span>{recipe.cookingTimeMinutes} dk pişme</span>
                            </div>
                          </div>
                        </td>

                        {/* Kategori */}
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md text-2xs font-semibold bg-slate-100 text-slate-700 whitespace-nowrap">
                            {recipe.categoryLabel || recipe.category}
                          </span>
                        </td>

                        {/* Porsiyon Gramajı */}
                        <td className="py-3 px-3 text-center">
                          <span className="font-bold text-slate-900 block text-xs">
                            {recipe.standardPortionGrams} gr
                          </span>
                          <span className="text-2xs text-slate-400 block">
                            (Çiğ: {totalRawWeight} gr)
                          </span>
                        </td>

                        {/* Bileşen & Fire */}
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-2xs font-medium text-slate-700">
                            {recipe.ingredients.length} hammadde
                          </span>
                          {avgWastage > 0 && (
                            <span className="block text-2xs text-orange-600 font-medium mt-0.5">
                              Ort. Fire: %{avgWastage}
                            </span>
                          )}
                        </td>

                        {/* Saf Hammadde Maliyeti */}
                        <td className="py-3 px-3 text-right">
                          <span className="font-semibold text-amber-900">
                            {formatCurrency(recipe.portionCost)}
                          </span>
                        </td>

                        {/* Mutfak İşçilik Gideri */}
                        <td className="py-3 px-3 text-right font-medium text-blue-800">
                          {formatCurrency(
                            recipe.laborCostPerPortion ??
                              (recipe.laborAndOverheadPerPortion ? recipe.laborAndOverheadPerPortion * 0.6 : 3.5)
                          )}
                        </td>

                        {/* Gaz & Enerji Gideri */}
                        <td className="py-3 px-3 text-right font-medium text-amber-700">
                          {formatCurrency(
                            recipe.gasEnergyCostPerPortion ??
                              (recipe.laborAndOverheadPerPortion ? recipe.laborAndOverheadPerPortion * 0.3 : 2.0)
                          )}
                        </td>

                        {/* Toplam Maliyet */}
                        <td className="py-3 px-3 text-right">
                          <span className="font-black text-slate-900 text-sm">
                            {formatCurrency(recipe.totalCostPerPortion)}
                          </span>
                        </td>

                        {/* Tavsiye Satış */}
                        <td className="py-3 px-3 text-right font-semibold text-emerald-700">
                          {formatCurrency(recipe.suggestedSalePrice)}
                        </td>

                        {/* Kâr Marjı */}
                        <td className="py-3 px-3">
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className={`px-2 py-0.5 rounded-full text-2xs font-black ${
                                margin >= 50
                                  ? "bg-emerald-100 text-emerald-800"
                                  : margin >= 30
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-orange-100 text-orange-800"
                              }`}
                            >
                              %{margin}
                            </span>
                            <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  margin >= 50 ? "bg-emerald-500" : margin >= 30 ? "bg-blue-500" : "bg-orange-500"
                                }`}
                                style={{ width: `${Math.min(100, Math.max(5, margin))}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* En Pahalı Hammadde */}
                        <td className="py-3 px-3">
                          {topIngredient ? (
                            <div className="max-w-[140px]">
                              <span className="font-medium text-slate-800 truncate block text-xs">
                                {topIngredient.name}
                              </span>
                              <div className="flex items-center gap-1 text-2xs text-slate-500">
                                <span>{formatCurrency(topIngredient.portionCost)}</span>
                                <span className="text-amber-700 font-bold">({topIngredientShare}%)</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* İşlem */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRecipeId(recipe.id);
                              setActiveAnalysisTab("drilldown");
                            }}
                            className="px-2.5 py-1 rounded-lg text-2xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="Bileşen ayrıştırma ve parti hesaplaması"
                          >
                            <span>Detay</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredAndSortedRecipes.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-sm">
                Arama kriterlerinize uygun yemek reçetesi bulunamadı.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📌 GÖRÜNÜM 2: TEK REÇETE DERİNLEMESİNE AYRIŞTIRMA (DRILLDOWN / BOM)      */}
      {/* ========================================================================= */}
      {activeAnalysisTab === "drilldown" && selectedRecipe && (
        <div className="space-y-6">
          {/* Reçete Seçici Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider shrink-0">
                İncelenen Reçete:
              </span>
              <div className="relative w-full sm:w-80">
                <select
                  value={selectedRecipe.id}
                  onChange={(e) => setSelectedRecipeId(e.target.value)}
                  className="w-full appearance-none pl-3.5 pr-8 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  {recipes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.recipeCode}) - {formatCurrency(r.totalCostPerPortion)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {onNavigateToRecipeEdit && (
              <button
                type="button"
                onClick={() => onNavigateToRecipeEdit(selectedRecipe)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
              >
                Reçeteyi Düzenle
              </button>
            )}
          </div>

          {/* Seçili Yemek Ana Başlık Kartı */}
          <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-50 rounded-2xl border border-amber-200/80 p-5 sm:p-6 shadow-2xs">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-0.5 rounded-md text-2xs font-mono font-bold bg-amber-200 text-amber-900">
                    {selectedRecipe.recipeCode}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-2xs font-semibold bg-white text-slate-700 border border-slate-200">
                    {selectedRecipe.categoryLabel}
                  </span>
                  {selectedRecipe.isApproved && (
                    <span className="inline-flex items-center gap-1 text-2xs font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{selectedRecipe.approvedBy || "Aşçıbaşı Onaylı"}</span>
                    </span>
                  )}
                </div>

                <h2 className="text-2xl font-black text-slate-900">{selectedRecipe.name}</h2>

                {selectedRecipe.cookingInstructions && (
                  <p className="text-xs text-slate-600 max-w-2xl leading-relaxed italic bg-white/70 p-2.5 rounded-xl border border-amber-100">
                    "{selectedRecipe.cookingInstructions}"
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                  <span className="flex items-center gap-1">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="font-bold text-slate-800">{selectedRecipe.caloriePerPortion} kcal</span>
                    <span className="text-slate-400 text-2xs">
                      (P: {selectedRecipe.proteinGrams || 0}g / K: {selectedRecipe.carbGrams || 0}g / Y: {selectedRecipe.fatGrams || 0}g)
                    </span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Hazırlık: {selectedRecipe.prepTimeMinutes} dk | Pişme: {selectedRecipe.cookingTimeMinutes} dk</span>
                  </span>
                  <span>•</span>
                  <span className="font-medium text-amber-900">
                    Servis Sıcaklığı: {selectedRecipe.storageTemp || "+65°C Sıcak"}
                  </span>
                </div>
              </div>

              {/* Sağ Maliyet Rozetleri */}
              {(() => {
                const laborVal = selectedRecipe.laborCostPerPortion ?? (selectedRecipe.laborAndOverheadPerPortion ? selectedRecipe.laborAndOverheadPerPortion * 0.6 : 3.5);
                const gasVal = selectedRecipe.gasEnergyCostPerPortion ?? (selectedRecipe.laborAndOverheadPerPortion ? selectedRecipe.laborAndOverheadPerPortion * 0.3 : 2.0);
                const overheadVal = selectedRecipe.overheadCostPerPortion ?? (selectedRecipe.laborAndOverheadPerPortion ? selectedRecipe.laborAndOverheadPerPortion * 0.1 : 0.8);
                const marginPercent = selectedRecipe.suggestedSalePrice > 0
                  ? Math.round(((selectedRecipe.suggestedSalePrice - selectedRecipe.totalCostPerPortion) / selectedRecipe.suggestedSalePrice) * 1000) / 10
                  : 0;

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-white p-3 rounded-xl border border-amber-200/60 shadow-sm shrink-0 text-center">
                    <div className="p-1.5">
                      <span className="text-2xs text-slate-400 uppercase font-semibold block">Hammadde</span>
                      <span className="text-sm font-black text-amber-800">
                        {formatCurrency(selectedRecipe.portionCost)}
                      </span>
                    </div>
                    <div className="p-1.5 border-l border-slate-100">
                      <span className="text-2xs text-blue-600 uppercase font-semibold block">İşçilik</span>
                      <span className="text-sm font-black text-blue-800">
                        {formatCurrency(laborVal)}
                      </span>
                    </div>
                    <div className="p-1.5 border-l border-slate-100">
                      <span className="text-2xs text-amber-600 uppercase font-semibold block">Gaz & Enerji</span>
                      <span className="text-sm font-black text-amber-700">
                        {formatCurrency(gasVal)}
                      </span>
                    </div>
                    <div className="p-1.5 border-l border-slate-100">
                      <span className="text-2xs text-slate-500 uppercase font-semibold block">Toplam Maliyet</span>
                      <span className="text-sm font-black text-slate-900">
                        {formatCurrency(selectedRecipe.totalCostPerPortion)}
                      </span>
                    </div>
                    <div className="p-1.5 border-l border-slate-100 col-span-2 sm:col-span-1">
                      <span className="text-2xs text-emerald-600 uppercase font-semibold block">Önerilen Satış</span>
                      <span className="text-sm font-black text-emerald-700">
                        {formatCurrency(selectedRecipe.suggestedSalePrice)}
                      </span>
                      <span className="text-2xs text-emerald-600 font-bold block">%{marginPercent} Kâr</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Maliyet ve Fiyat Bileşeni İlerleme Çubuğu */}
            {(() => {
              const laborVal = selectedRecipe.laborCostPerPortion ?? (selectedRecipe.laborAndOverheadPerPortion ? selectedRecipe.laborAndOverheadPerPortion * 0.6 : 3.5);
              const gasVal = selectedRecipe.gasEnergyCostPerPortion ?? (selectedRecipe.laborAndOverheadPerPortion ? selectedRecipe.laborAndOverheadPerPortion * 0.3 : 2.0);
              const overheadVal = selectedRecipe.overheadCostPerPortion ?? (selectedRecipe.laborAndOverheadPerPortion ? selectedRecipe.laborAndOverheadPerPortion * 0.1 : 0.8);
              const profitVal = Math.max(0, selectedRecipe.suggestedSalePrice - selectedRecipe.totalCostPerPortion);

              return (
                <div className="mt-5 pt-4 border-t border-amber-200/60">
                  <div className="flex items-center justify-between text-2xs font-semibold mb-1.5">
                    <span className="text-slate-500">
                      Porsiyon Başı Gelir & Maliyet Dağılımı (Satış Fiyatı: {formatCurrency(selectedRecipe.suggestedSalePrice)})
                    </span>
                    <span className="text-emerald-700 font-bold">
                      Brüt Kâr: {formatCurrency(profitVal)} (%
                      {selectedRecipe.suggestedSalePrice > 0
                        ? Math.round((profitVal / selectedRecipe.suggestedSalePrice) * 1000) / 10
                        : 0}
                      )
                    </span>
                  </div>

                  {selectedRecipe.suggestedSalePrice > 0 && (
                    <div className="h-3.5 w-full bg-slate-200 rounded-full overflow-hidden flex text-2xs text-white font-bold">
                      {/* Hammadde Payı */}
                      <div
                        style={{
                          width: `${(selectedRecipe.portionCost / selectedRecipe.suggestedSalePrice) * 100}%`,
                        }}
                        className="bg-amber-600 flex items-center justify-center truncate px-1"
                        title={`Saf Hammadde: ${formatCurrency(selectedRecipe.portionCost)}`}
                      >
                        Gıda
                      </div>
                      {/* İşçilik Payı */}
                      <div
                        style={{
                          width: `${(laborVal / selectedRecipe.suggestedSalePrice) * 100}%`,
                        }}
                        className="bg-blue-600 flex items-center justify-center truncate px-1"
                        title={`Mutfak İşçilik: ${formatCurrency(laborVal)}`}
                      >
                        İşçilik
                      </div>
                      {/* Gaz/Enerji Payı */}
                      <div
                        style={{
                          width: `${(gasVal / selectedRecipe.suggestedSalePrice) * 100}%`,
                        }}
                        className="bg-amber-500 flex items-center justify-center truncate px-1"
                        title={`Doğalgaz & Enerji: ${formatCurrency(gasVal)}`}
                      >
                        Gaz
                      </div>
                      {/* Genel Gider Payı */}
                      <div
                        style={{
                          width: `${(overheadVal / selectedRecipe.suggestedSalePrice) * 100}%`,
                        }}
                        className="bg-purple-600 flex items-center justify-center truncate px-1"
                        title={`Genel Gider: ${formatCurrency(overheadVal)}`}
                      >
                        Gider
                      </div>
                      {/* Kâr Payı */}
                      <div
                        style={{
                          width: `${(profitVal / selectedRecipe.suggestedSalePrice) * 100}%`,
                        }}
                        className="bg-emerald-500 flex items-center justify-center truncate px-1"
                        title={`Brüt Kâr: ${formatCurrency(profitVal)}`}
                      >
                        Kâr
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Reçete Hammadde Bileşen Tablosu */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-600" />
                  <span>Reçete Hammadde Ağacı (BOM) & Gramaj Kırılımı</span>
                </h3>
                <p className="text-2xs text-slate-500">
                  Toplam {selectedRecipe.ingredients.length} bileşen, Standart Pişmiş Porsiyon: {selectedRecipe.standardPortionGrams} gr
                </p>
              </div>

              <div className="text-2xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                Toplam Çiğ Gramaj:{" "}
                <strong className="text-slate-800">
                  {selectedRecipe.ingredients.reduce((sum, i) => sum + i.portionGrams, 0)} gr
                </strong>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-2xs uppercase tracking-wider font-bold text-slate-500">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Hammadde / Malzeme Adı</th>
                    <th className="py-3 px-3 text-right">Porsiyon Miktarı</th>
                    <th className="py-3 px-3">Gramaj Payı (%)</th>
                    <th className="py-3 px-3 text-right">Alış Birim Fiyatı</th>
                    <th className="py-3 px-3 text-center">Zayiat / Fire Oranı</th>
                    <th className="py-3 px-3 text-right font-black text-slate-800">Porsiyon Maliyeti</th>
                    <th className="py-3 px-3">Maliyet Payı (%)</th>
                    <th className="py-3 px-3">Alerjen Bilgisi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {selectedRecipe.ingredients.map((ing, idx) => {
                    const totalGrams = selectedRecipe.ingredients.reduce((sum, i) => sum + i.portionGrams, 0);
                    const gramPercent = totalGrams > 0 ? Math.round((ing.portionGrams / totalGrams) * 1000) / 10 : 0;
                    const costPercent =
                      selectedRecipe.portionCost > 0 ? Math.round((ing.portionCost / selectedRecipe.portionCost) * 1000) / 10 : 0;

                    return (
                      <tr key={ing.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-3 px-4 text-2xs font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900">{ing.name}</span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="font-bold text-slate-800">
                            {ing.portionGrams} {ing.unit}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-blue-500 h-full rounded-full" style={{ width: `${gramPercent}%` }} />
                            </div>
                            <span className="text-2xs font-semibold text-slate-600">%{gramPercent}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">
                          {formatCurrency(ing.unitCost)} / {ing.unit === "g" ? "kg" : ing.unit === "ml" ? "lt" : ing.unit}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {ing.wastagePercent > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-orange-100 text-orange-800">
                              %{ing.wastagePercent} Fire
                            </span>
                          ) : (
                            <span className="text-2xs text-slate-400">%0</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="font-black text-amber-900 text-sm">{formatCurrency(ing.portionCost)}</span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  costPercent >= 50
                                    ? "bg-rose-500"
                                    : costPercent >= 20
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                                }`}
                                style={{ width: `${costPercent}%` }}
                              />
                            </div>
                            <span
                              className={`text-2xs font-bold ${
                                costPercent >= 50 ? "text-rose-700" : "text-slate-700"
                              }`}
                            >
                              %{costPercent}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {ing.allergen ? (
                            <span className="inline-flex items-center gap-1 text-2xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{ing.allergen}</span>
                            </span>
                          ) : (
                            <span className="text-2xs text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold text-xs border-t-2 border-slate-200">
                    <td colSpan={2} className="py-3 px-4 text-slate-800">
                      TOPLAM (1 Porsiyon Saf Gıda)
                    </td>
                    <td className="py-3 px-3 text-right text-slate-900">
                      {selectedRecipe.ingredients.reduce((sum, i) => sum + i.portionGrams, 0)} gr
                    </td>
                    <td className="py-3 px-3 text-slate-500">%100</td>
                    <td className="py-3 px-3 text-right text-slate-400">-</td>
                    <td className="py-3 px-3 text-center text-slate-400">-</td>
                    <td className="py-3 px-3 text-right text-amber-900 text-sm font-black">
                      {formatCurrency(selectedRecipe.portionCost)}
                    </td>
                    <td className="py-3 px-3 text-slate-500">%100</td>
                    <td className="py-3 px-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ⚡ KAZAN / PARTİ ÜRETİM SİMÜLATÖRÜ (BATCH SCALING CALCULATOR) */}
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Kazan / Toplu Üretim Simülatörü ({selectedRecipe.name})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Parti büyüklüğüne göre toplam hammadde ihtiyacı, satın alma bütçesi ve kâr projeksiyonu.
                  </p>
                </div>
              </div>

              {/* Hızlı Porsiyon Seçicileri */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[100, 250, 500, 1000, 2500, 5000].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setBatchPortionCount(count)}
                    className={`px-2.5 py-1 rounded-lg text-2xs font-bold transition-colors cursor-pointer ${
                      batchPortionCount === count
                        ? "bg-amber-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {count} Pors.
                  </button>
                ))}
              </div>
            </div>

            {/* Porsiyon Girdi Kutusu ve Projeksiyon Özeti */}
            {(() => {
              const laborBatch =
                (selectedRecipe.laborCostPerPortion ??
                  (selectedRecipe.laborAndOverheadPerPortion ? selectedRecipe.laborAndOverheadPerPortion * 0.6 : 3.5)) *
                batchPortionCount;
              const gasBatch =
                (selectedRecipe.gasEnergyCostPerPortion ??
                  (selectedRecipe.laborAndOverheadPerPortion ? selectedRecipe.laborAndOverheadPerPortion * 0.3 : 2.0)) *
                batchPortionCount;
              const rawBatch = selectedRecipe.portionCost * batchPortionCount;
              const totalBatch = selectedRecipe.totalCostPerPortion * batchPortionCount;
              const ciroBatch = selectedRecipe.suggestedSalePrice * batchPortionCount;
              const profitBatch = (selectedRecipe.suggestedSalePrice - selectedRecipe.totalCostPerPortion) * batchPortionCount;

              return (
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 bg-amber-50/60 p-4 rounded-xl border border-amber-200">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-2xs font-bold uppercase tracking-wider text-amber-900 mb-1">
                      Parti Adedi
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        step="50"
                        value={batchPortionCount}
                        onChange={(e) => setBatchPortionCount(Math.max(1, Number(e.target.value) || 1))}
                        className="w-full px-2 py-1.5 bg-white border border-amber-300 rounded-xl text-center font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="text-2xs font-bold text-amber-900 shrink-0">Pors.</span>
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-amber-200 text-center">
                    <span className="text-2xs text-slate-500 block">Top. Hammadde</span>
                    <span className="text-sm font-black text-amber-900 mt-0.5 block">
                      {formatCurrency(rawBatch)}
                    </span>
                    <span className="text-2xs text-slate-400">Gıda faturası</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-amber-200 text-center">
                    <span className="text-2xs text-blue-600 block font-medium">Top. Mutfak İşçilik</span>
                    <span className="text-sm font-black text-blue-800 mt-0.5 block">
                      {formatCurrency(laborBatch)}
                    </span>
                    <span className="text-2xs text-slate-400">Aşçı & personel</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-amber-200 text-center">
                    <span className="text-2xs text-amber-600 block font-medium">Top. Gaz & Fırın</span>
                    <span className="text-sm font-black text-amber-700 mt-0.5 block">
                      {formatCurrency(gasBatch)}
                    </span>
                    <span className="text-2xs text-slate-400">Doğalgaz & elektrik</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-amber-200 text-center">
                    <span className="text-2xs text-slate-500 block">Toplam İmalat</span>
                    <span className="text-sm font-black text-slate-900 mt-0.5 block">
                      {formatCurrency(totalBatch)}
                    </span>
                    <span className="text-2xs text-slate-400">Tüm giderler dahil</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-amber-200 text-center col-span-2 md:col-span-1">
                    <span className="text-2xs text-emerald-700 font-bold block">Tahmini Brüt Kâr</span>
                    <span className="text-sm font-black text-emerald-700 mt-0.5 block">
                      +{formatCurrency(profitBatch)}
                    </span>
                    <span className="text-2xs text-emerald-600 font-medium">
                      Ciro: {formatCurrency(ciroBatch)}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Simüle Edilen Hammadde İhtiyaç Tablosu */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-2xs uppercase tracking-wider font-bold text-slate-500">
                    <th className="py-2.5 px-3">Hammadde</th>
                    <th className="py-2.5 px-3 text-right">1 Pors. Gramajı</th>
                    <th className="py-2.5 px-3 text-right font-bold text-amber-900">
                      {batchPortionCount} Pors. Net İhtiyaç
                    </th>
                    <th className="py-2.5 px-3 text-right">Zayiat (Fire) Payı</th>
                    <th className="py-2.5 px-3 text-right font-black text-slate-800">
                      Satın Alınacak Brüt Miktar
                    </th>
                    <th className="py-2.5 px-3 text-right">Birim Fiyat</th>
                    <th className="py-2.5 px-3 text-right font-black text-emerald-800">Toplam Satın Alma Tutarı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedRecipe.ingredients.map((ing) => {
                    const netRequiredKg = (ing.portionGrams * batchPortionCount) / 1000;
                    const grossFactor = 1 / (1 - (ing.wastagePercent || 0) / 100);
                    const grossRequiredKg = netRequiredKg * grossFactor;
                    const ingredientCost = ing.portionCost * batchPortionCount;

                    return (
                      <tr key={ing.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-slate-900">{ing.name}</td>
                        <td className="py-2 px-3 text-right text-slate-500 font-mono">
                          {ing.portionGrams} {ing.unit}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-amber-900 font-mono">
                          {netRequiredKg >= 1 ? `${netRequiredKg.toFixed(1)} kg` : `${(netRequiredKg * 1000).toFixed(0)} gr`}
                        </td>
                        <td className="py-2 px-3 text-right text-orange-600 font-medium">
                          {ing.wastagePercent > 0 ? `%${ing.wastagePercent}` : "-"}
                        </td>
                        <td className="py-2 px-3 text-right font-black text-slate-900 font-mono">
                          {grossRequiredKg >= 1
                            ? `${grossRequiredKg.toFixed(1)} kg`
                            : `${(grossRequiredKg * 1000).toFixed(0)} gr`}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-500">
                          {formatCurrency(ing.unitCost)} / kg
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-800 font-mono">
                          {formatCurrency(ingredientCost)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📌 GÖRÜNÜM 3: HAMMADDE NEREDE KULLANILIYOR & ENFLASYON SİMÜLATÖRÜ        */}
      {/* ========================================================================= */}
      {activeAnalysisTab === "where_used" && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ArrowUpDown className="w-5 h-5 text-amber-600" />
                  <span>Hammadde Kullanım Ağacı & Maliyet Hassasiyet Simülatörü</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Herhangi bir hammaddenin (et, yağ, pirinç vb.) hangi yemeklerde kaç gram kullanıldığını görün ve fiyat artışının kârlılığa etkisini simüle edin.
                </p>
              </div>

              {/* Hammadde Seçici */}
              <div className="relative w-full sm:w-72">
                <select
                  value={selectedIngredientName}
                  onChange={(e) => setSelectedIngredientName(e.target.value)}
                  className="w-full appearance-none pl-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  {allDistinctIngredients.map((ing) => (
                    <option key={ing.name} value={ing.name}>
                      {ing.name} ({ing.recipeCount} Yemekte Kullanılıyor)
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Enflasyon / Fiyat Zammı Simülasyon Sürgüsü */}
            {activeIngredientData && (
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                      Fiyat Zammı / Enflasyon Senaryosu
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-2xs font-black bg-amber-200 text-amber-900">
                      +%{priceInflationPercent} Artış
                    </span>
                  </div>
                  <p className="text-xs text-amber-800">
                    <strong>"{activeIngredientData.name}"</strong> için mevcut birim maliyeti{" "}
                    <strong>{formatCurrency(activeIngredientData.avgUnitCost)}</strong> iken yeni simüle edilen maliyet:{" "}
                    <strong className="text-rose-700">
                      {formatCurrency(activeIngredientData.avgUnitCost * (1 + priceInflationPercent / 100))}
                    </strong>
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-72">
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={priceInflationPercent}
                    onChange={(e) => setPriceInflationPercent(Number(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                  <span className="text-xs font-black text-amber-950 min-w-[50px] text-right">
                    +%{priceInflationPercent}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Bu Hammaddenin Kullanıldığı Reçeteler Tablosu */}
          {activeIngredientData && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    "{activeIngredientData.name}" İçeren Yemekler ({activeIngredientData.recipesUsing.length} Reçete)
                  </h3>
                  <p className="text-2xs text-slate-500">
                    Ortalama Alış: {formatCurrency(activeIngredientData.avgUnitCost)} / {activeIngredientData.unit === "g" ? "kg" : activeIngredientData.unit}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-2xs uppercase tracking-wider font-bold text-slate-500">
                      <th className="py-3 px-4">Yemek Adı</th>
                      <th className="py-3 px-3">Kategori</th>
                      <th className="py-3 px-3 text-right">Porsiyon Gramajı</th>
                      <th className="py-3 px-3 text-right">Mevcut Hammadde Payı</th>
                      <th className="py-3 px-3 text-right">Mevcut Porsiyon Maliyeti</th>
                      <th className="py-3 px-3 text-right font-bold text-rose-700">
                        Yeni Porsiyon Maliyeti (+%{priceInflationPercent})
                      </th>
                      <th className="py-3 px-3 text-right font-black text-rose-800">Porsiyon Başı Fark</th>
                      <th className="py-3 px-3 text-center">Eski Marj → Yeni Marj</th>
                      <th className="py-3 px-3 text-center">İncele</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {activeIngredientData.recipesUsing.map(({ recipe, portionGrams, portionCost, costSharePercent }) => {
                      const additionalCost = portionCost * (priceInflationPercent / 100);
                      const newTotalCost = recipe.totalCostPerPortion + additionalCost;

                      const oldMargin =
                        recipe.suggestedSalePrice > 0
                          ? Math.round(((recipe.suggestedSalePrice - recipe.totalCostPerPortion) / recipe.suggestedSalePrice) * 100)
                          : 0;

                      const newMargin =
                        recipe.suggestedSalePrice > 0
                          ? Math.round(((recipe.suggestedSalePrice - newTotalCost) / recipe.suggestedSalePrice) * 100)
                          : 0;

                      return (
                        <tr key={recipe.id} className="hover:bg-amber-50/20 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{recipe.name}</span>
                            <span className="text-2xs text-slate-400 font-mono">{recipe.recipeCode}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-slate-100 text-slate-700">
                              {recipe.categoryLabel}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                            {portionGrams} {activeIngredientData.unit}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className="font-semibold text-slate-800">{formatCurrency(portionCost)}</span>
                            <span className="text-2xs text-amber-700 font-bold block">(%{costSharePercent} pay)</span>
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-slate-800">
                            {formatCurrency(recipe.totalCostPerPortion)}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-rose-700">
                            {formatCurrency(newTotalCost)}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-rose-800">
                            +{formatCurrency(additionalCost)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="text-2xs font-bold text-slate-600">%{oldMargin}</span>
                              <span className="text-slate-300">→</span>
                              <span
                                className={`text-2xs font-black ${
                                  newMargin < 30 ? "text-rose-700" : "text-amber-800"
                                }`}
                              >
                                %{newMargin}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRecipeId(recipe.id);
                                setActiveAnalysisTab("drilldown");
                              }}
                              className="px-2 py-1 rounded-lg text-2xs font-semibold text-amber-700 hover:bg-amber-50 cursor-pointer"
                            >
                              Detay
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📌 GÖRÜNÜM 4: KATEGORİ BAZLI MALİYET & GRAMAJ KIYASLAMA                     */}
      {/* ========================================================================= */}
      {activeAnalysisTab === "category_comparison" && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-600" />
              <span>Kategori Bazlı Ortalama Maliyet, Gramaj ve Kârlılık Kıyaslaması</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Tabldot menü planlarken 1. kap (çorba), 2. kap (ana yemek), 3. kap (pilav/makarna) ve 4. kap (tatlı/salata) bütçe dengelerini optimize edin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryAggregates.map((cat) => (
              <div key={cat.category} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold">
                      <UtensilsCrossed className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{cat.label}</h3>
                      <span className="text-2xs text-slate-400">{cat.count} Reçete</span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                    %{cat.avgMargin} Kâr
                  </span>
                </div>

                {/* Metrikler */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <span className="text-2xs text-slate-400 block font-semibold">Ort. Hammadde</span>
                    <span className="text-sm font-bold text-amber-900 mt-0.5 block">
                      {formatCurrency(cat.avgRawCost)}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <span className="text-2xs text-slate-400 block font-semibold">Ort. Toplam Maliyet</span>
                    <span className="text-sm font-black text-slate-900 mt-0.5 block">
                      {formatCurrency(cat.avgTotalCost)}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <span className="text-2xs text-slate-400 block font-semibold">Ortalama Porsiyon</span>
                    <span className="text-sm font-bold text-blue-700 mt-0.5 block">
                      {cat.avgGrams} gr
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <span className="text-2xs text-slate-400 block font-semibold">100 gr Maliyeti</span>
                    <span className="text-sm font-bold text-slate-700 mt-0.5 block">
                      {formatCurrency(cat.costPerHundredGrams)}
                    </span>
                  </div>
                </div>

                {/* Alt Kategori Filtre Butonu */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.category);
                    setActiveAnalysisTab("matrix");
                  }}
                  className="w-full py-2 bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-800 text-xs font-semibold rounded-xl transition-colors border border-slate-200 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Bu Kategorideki Reçeteleri Listele</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
