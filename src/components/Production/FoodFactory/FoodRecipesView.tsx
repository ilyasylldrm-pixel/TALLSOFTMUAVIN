import React, { useState } from "react";
import {
  UtensilsCrossed,
  Search,
  Filter,
  Plus,
  Calculator,
  Flame,
  Clock,
  Printer,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  ChevronDown,
  X,
  Scale,
  BarChart3,
} from "lucide-react";
import { FoodRecipe, FoodCategory } from "../../../types";
import { formatCurrency } from "../../../utils/exportUtils";

interface FoodRecipesViewProps {
  recipes: FoodRecipe[];
  onOpenNewRecipeModal: () => void;
  onEditRecipe: (recipe: FoodRecipe) => void;
  onDeleteRecipe: (recipeId: string) => void;
  onNavigateToAnalysis?: (recipeId?: string) => void;
}

export const FoodRecipesView: React.FC<FoodRecipesViewProps> = ({
  recipes,
  onOpenNewRecipeModal,
  onEditRecipe,
  onDeleteRecipe,
  onNavigateToAnalysis,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedRecipeForCalc, setSelectedRecipeForCalc] = useState<FoodRecipe | null>(null);
  const [calcPortionCount, setCalcPortionCount] = useState<number>(500);

  const categories = [
    { id: "all", label: "Tüm Reçeteler" },
    { id: "soup", label: "Çorbalar" },
    { id: "main_meat", label: "Et / Tavuk Yemekleri" },
    { id: "side_dish", label: "Pilav & Makarna" },
    { id: "salad_appetizer", label: "Salata & Meze" },
    { id: "dessert_fruit", label: "Tatlı & Meyve" },
    { id: "beverage", label: "İçecekler" },
    { id: "main_veg", label: "Sebze & Bakliyat" },
  ];

  const filteredRecipes = recipes.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.recipeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.ingredients.some((ing) => ing.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === "all" ||
      r.category === selectedCategory ||
      (selectedCategory === "main_meat" && (r.category === "main_meat" || r.category === "main_veg"));

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Başlık ve Eylemler */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-amber-600" />
            <span>Yemek Reçeteleri & Ürün Ağacı (BOM)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Porsiyon başı hammadde gramajları, fire/çekme payları, birim maliyet hesapları ve besin değerleri.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onNavigateToAnalysis && (
            <button
              type="button"
              onClick={() => onNavigateToAnalysis()}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-3.5 py-2.5 rounded-xl text-xs sm:text-sm shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>Maliyet & Gramaj Analizi</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenNewRecipeModal}
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Yemek Reçetesi Ekle</span>
          </button>
        </div>
      </div>

      {/* Arama ve Kategori Filtreleri */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Yemek adı, reçete kodu veya hammadde (örn: kıyma, pirinç, mercimek) ara..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reçeteler Listesi / Tablosu */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredRecipes.map((recipe) => {
          const margin = recipe.suggestedSalePrice > 0
            ? Math.round(((recipe.suggestedSalePrice - recipe.totalCostPerPortion) / recipe.suggestedSalePrice) * 100)
            : 0;

          return (
            <div
              key={recipe.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-amber-300 hover:shadow-sm transition-all space-y-4"
            >
              {/* Üst Satır */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {recipe.recipeCode}
                    </span>
                    <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      {recipe.categoryLabel}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mt-1.5">{recipe.name}</h3>
                </div>

                <div className="flex items-center gap-1">
                  {onNavigateToAnalysis && (
                    <button
                      type="button"
                      onClick={() => onNavigateToAnalysis(recipe.id)}
                      className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      title="Detaylı Maliyet ve Gramaj Analizini Aç"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRecipeForCalc(recipe);
                      setCalcPortionCount(500);
                    }}
                    className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                    title="Toplu Porsiyon Hesaplama Aracı"
                  >
                    <Calculator className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditRecipe(recipe)}
                    className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Reçeteyi Düzenle"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`"${recipe.name}" reçetesini silmek istediğinize emin misiniz?`)) {
                        onDeleteRecipe(recipe.id);
                      }
                    }}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Reçeteyi Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Maliyet ve Gider Kırılım Şeridi */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="grid grid-cols-4 gap-1.5 text-center text-2xs">
                  <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block">Hammadde</span>
                    <span className="font-bold text-slate-800">{formatCurrency(recipe.portionCost)}</span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                    <span className="text-blue-600 block font-medium">İşçilik</span>
                    <span className="font-bold text-blue-800">
                      {formatCurrency(recipe.laborCostPerPortion ?? (recipe.laborAndOverheadPerPortion ? recipe.laborAndOverheadPerPortion * 0.6 : 3.5))}
                    </span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                    <span className="text-amber-600 block font-medium">Gaz & Enerji</span>
                    <span className="font-bold text-amber-800">
                      {formatCurrency(recipe.gasEnergyCostPerPortion ?? (recipe.laborAndOverheadPerPortion ? recipe.laborAndOverheadPerPortion * 0.3 : 2.0))}
                    </span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                    <span className="text-purple-600 block font-medium">Genel Gider</span>
                    <span className="font-bold text-purple-800">
                      {formatCurrency(recipe.overheadCostPerPortion ?? (recipe.laborAndOverheadPerPortion ? recipe.laborAndOverheadPerPortion * 0.1 : 0.8))}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
                  <div>
                    <span className="text-2xs text-slate-500 mr-1.5">Toplam Maliyet:</span>
                    <span className="font-extrabold text-slate-900">{formatCurrency(recipe.totalCostPerPortion)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xs text-slate-500">
                      Satış: <strong className="text-emerald-700">{formatCurrency(recipe.suggestedSalePrice)}</strong>
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
                      margin >= 40 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      %{margin} Kâr
                    </span>
                  </div>
                </div>
              </div>

              {/* Hammadde Gramaj Listesi (Özet) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-2xs font-semibold text-slate-400 uppercase tracking-wider">
                  <span>Reçete Hammadde İçeriği ({recipe.ingredients.length} Kalem)</span>
                  <span>Porsiyon: {recipe.standardPortionGrams} gr</span>
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {recipe.ingredients.map((ing) => (
                    <div
                      key={ing.id}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50/70 border border-slate-100"
                    >
                      <span className="text-slate-700 font-medium truncate">{ing.name}</span>
                      <div className="flex items-center gap-3 shrink-0 text-slate-500 text-2xs">
                        <span>
                          {ing.portionGrams} {ing.unit}
                        </span>
                        {ing.wastagePercent > 0 && (
                          <span className="text-orange-600 font-medium">Fire: %{ing.wastagePercent}</span>
                        )}
                        <span className="font-semibold text-slate-700">{formatCurrency(ing.portionCost)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alt Bilgiler: Kalori, Pişirme ve Alerjen */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-2xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-medium text-amber-800">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    {recipe.caloriePerPortion} kcal
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {recipe.cookingTimeMinutes} dk pişirme
                  </span>
                </div>

                {recipe.allergens && recipe.allergens.length > 0 && (
                  <div className="flex items-center gap-1 text-rose-600 font-medium">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Alerjen: {recipe.allergens.join(", ")}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Toplu Porsiyon ve Sarfiyat Hesaplama Modalı */}
      {selectedRecipeForCalc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedRecipeForCalc.name}</h3>
                  <p className="text-xs text-slate-500">Toplu Mutfak Sarfiyat & Hammadde İhtiyaç Hesaplayıcısı</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecipeForCalc(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Porsiyon Girdi Alanı */}
            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                  Üretilecek Toplam Porsiyon
                </label>
                <span className="text-xs text-amber-700">Mutfakta kaç kişilik yemek pişirilecek?</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  step="10"
                  value={calcPortionCount}
                  onChange={(e) => setCalcPortionCount(Math.max(1, Number(e.target.value) || 1))}
                  className="w-32 px-3 py-2 bg-white border border-amber-300 rounded-xl text-center font-bold text-slate-900 text-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-xs font-bold text-amber-900">Porsiyon</span>
              </div>
            </div>

            {/* Hesaplanan Malzeme Listesi */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wider px-2">
                <span>Gereken Hammadde</span>
                <span>Toplam Miktar</span>
                <span>Toplam Tutar (TL)</span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {selectedRecipeForCalc.ingredients.map((ing) => {
                  const totalRawUnit = (ing.portionGrams * calcPortionCount) / (ing.unit === "g" || ing.unit === "ml" ? 1000 : 1);
                  const displayUnit = ing.unit === "g" ? "Kg" : ing.unit === "ml" ? "Lt" : ing.unit;
                  const totalLineCost = ing.portionCost * calcPortionCount;

                  return (
                    <div
                      key={ing.id}
                      className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="font-semibold text-slate-800">{ing.name}</div>
                      <div className="font-bold text-amber-700">
                        {totalRawUnit.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} {displayUnit}
                      </div>
                      <div className="font-semibold text-slate-700">{formatCurrency(totalLineCost)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* İşçilik, Gaz ve Enerji Ek Giderleri Özeti */}
            <div className="grid grid-cols-3 gap-2 bg-slate-100/70 p-3 rounded-xl text-center text-xs">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-2xs text-slate-400 block">Top. Hammadde Bedeli</span>
                <span className="font-bold text-slate-900 text-xs sm:text-sm">
                  {formatCurrency(selectedRecipeForCalc.portionCost * calcPortionCount)}
                </span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-2xs text-blue-600 block font-medium">Top. Mutfak İşçiliği</span>
                <span className="font-bold text-blue-800 text-xs sm:text-sm">
                  {formatCurrency(
                    (selectedRecipeForCalc.laborCostPerPortion ??
                      (selectedRecipeForCalc.laborAndOverheadPerPortion ? selectedRecipeForCalc.laborAndOverheadPerPortion * 0.6 : 3.5)) *
                      calcPortionCount
                  )}
                </span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-2xs text-amber-600 block font-medium">Top. Gaz & Fırın Enerjisi</span>
                <span className="font-bold text-amber-800 text-xs sm:text-sm">
                  {formatCurrency(
                    (selectedRecipeForCalc.gasEnergyCostPerPortion ??
                      (selectedRecipeForCalc.laborAndOverheadPerPortion ? selectedRecipeForCalc.laborAndOverheadPerPortion * 0.3 : 2.0)) *
                      calcPortionCount
                  )}
                </span>
              </div>
            </div>

            {/* Toplam Özet */}
            <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs sm:text-sm">
              <div>
                <span className="text-slate-400 block text-2xs">Toplam İmalat (Hammadde + İşçilik + Gaz):</span>
                <span className="text-lg font-black text-amber-400">
                  {formatCurrency(selectedRecipeForCalc.totalCostPerPortion * calcPortionCount)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-2xs">
                  Önerilen Satış Ciro & Brüt Kâr:
                </span>
                <span className="text-lg font-black text-emerald-400">
                  {formatCurrency(selectedRecipeForCalc.suggestedSalePrice * calcPortionCount)}
                </span>
                <span className="block text-2xs text-emerald-300">
                  Net Brüt Kâr: +{formatCurrency((selectedRecipeForCalc.suggestedSalePrice - selectedRecipeForCalc.totalCostPerPortion) * calcPortionCount)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedRecipeForCalc(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
