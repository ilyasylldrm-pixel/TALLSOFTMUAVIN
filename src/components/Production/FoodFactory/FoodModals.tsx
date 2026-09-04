import React, { useState } from "react";
import { X, Plus, Trash2, UtensilsCrossed, Calendar, CookingPot, Truck, ShieldCheck } from "lucide-react";
import {
  FoodRecipe,
  FoodMenuPlan,
  FoodProductionOrder,
  FoodDispatchDelivery,
  FoodWitnessSample,
  FoodCategory,
  Contact,
} from "../../../types";

// ==========================================
// 1. YENİ REÇETE MODALI
// ==========================================

interface NewRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recipe: FoodRecipe) => void;
  initialData?: FoodRecipe | null;
}

export const NewRecipeModal: React.FC<NewRecipeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState(initialData?.name || "");
  const [recipeCode, setRecipeCode] = useState(initialData?.recipeCode || `REC-${Math.floor(100 + Math.random() * 900)}`);
  const [category, setCategory] = useState<FoodCategory>(initialData?.category || "main_meat");
  const [standardPortionGrams, setStandardPortionGrams] = useState(initialData?.standardPortionGrams || 200);
  const [calorie, setCalorie] = useState(initialData?.caloriePerPortion || 300);
  const [cookingTime, setCookingTime] = useState(initialData?.cookingTimeMinutes || 45);
  const [suggestedSalePrice, setSuggestedSalePrice] = useState(initialData?.suggestedSalePrice || 80);
  const [allergens, setAllergens] = useState(initialData?.allergens?.join(", ") || "");
  const [instructions, setInstructions] = useState(initialData?.cookingInstructions || "");

  // Ek İşçilik, Gaz ve Genel Gider Alanları
  const [laborCostPerPortion, setLaborCostPerPortion] = useState<number>(initialData?.laborCostPerPortion ?? 3.5);
  const [gasEnergyCostPerPortion, setGasEnergyCostPerPortion] = useState<number>(initialData?.gasEnergyCostPerPortion ?? 2.0);
  const [overheadCostPerPortion, setOverheadCostPerPortion] = useState<number>(initialData?.overheadCostPerPortion ?? 0.8);

  const [ingredients, setIngredients] = useState<
    { id: string; name: string; portionGrams: number; unit: string; unitCost: number; portionCost: number; wastagePercent: number }[]
  >(
    initialData?.ingredients || [
      { id: "1", name: "Ana Hammadde", portionGrams: 100, unit: "g", unitCost: 150, portionCost: 15, wastagePercent: 10 },
      { id: "2", name: "Sıvı Yağ / Tereyağı", portionGrams: 15, unit: "ml", unitCost: 80, portionCost: 1.2, wastagePercent: 0 },
      { id: "3", name: "Tuz ve Baharatlar", portionGrams: 5, unit: "g", unitCost: 40, portionCost: 0.2, wastagePercent: 0 },
    ]
  );

  if (!isOpen) return null;

  const handleAddIngredient = () => {
    setIngredients([
      ...ingredients,
      {
        id: Date.now().toString(),
        name: "",
        portionGrams: 50,
        unit: "g",
        unitCost: 50,
        portionCost: 2.5,
        wastagePercent: 0,
      },
    ]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, field: string, value: any) => {
    const updated = [...ingredients];
    (updated[index] as any)[field] = value;
    // Auto calculate portion cost
    if (field === "portionGrams" || field === "unitCost") {
      const grams = field === "portionGrams" ? Number(value) : updated[index].portionGrams;
      const cost = field === "unitCost" ? Number(value) : updated[index].unitCost;
      updated[index].portionCost = Number(((grams / 1000) * cost).toFixed(2));
    }
    setIngredients(updated);
  };

  const totalPortionCost = ingredients.reduce((sum, ing) => sum + (ing.portionCost || 0), 0);
  const totalIndirectCost = Number((laborCostPerPortion + gasEnergyCostPerPortion + overheadCostPerPortion).toFixed(2));
  const finalTotalCostPerPortion = Number((totalPortionCost + totalIndirectCost).toFixed(2));
  const profitMarginPercent = suggestedSalePrice > 0 
    ? Number((((suggestedSalePrice - finalTotalCostPerPortion) / suggestedSalePrice) * 100).toFixed(1))
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const categoryLabels: Record<FoodCategory, string> = {
      soup: "Çorbalar",
      main_meat: "Et / Tavuk Yemekleri",
      main_veg: "Sebze & Bakliyat",
      side_dish: "Pilav & Makarna",
      salad_appetizer: "Salata & Meze",
      dessert_fruit: "Tatlı & Meyveler",
      beverage: "İçecekler",
      breakfast_ration: "Kahvaltı & Kumanya",
      bakery: "Ekmek & Hamurişi",
    };

    const newRecipe: FoodRecipe = {
      id: initialData?.id || `rec_${Date.now()}`,
      recipeCode,
      name,
      category,
      categoryLabel: categoryLabels[category] || "Diğer",
      standardPortionGrams,
      servingsCount: 1,
      portionCost: Number(totalPortionCost.toFixed(2)),
      laborCostPerPortion: Number(laborCostPerPortion.toFixed(2)),
      gasEnergyCostPerPortion: Number(gasEnergyCostPerPortion.toFixed(2)),
      overheadCostPerPortion: Number(overheadCostPerPortion.toFixed(2)),
      laborAndOverheadPerPortion: totalIndirectCost,
      totalCostPerPortion: finalTotalCostPerPortion,
      suggestedSalePrice,
      cookingTimeMinutes: cookingTime,
      prepTimeMinutes: 20,
      caloriePerPortion: calorie,
      allergens: allergens ? allergens.split(",").map((a) => a.trim()) : [],
      cookingInstructions: instructions,
      isApproved: true,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ingredients,
    };

    onSave(newRecipe);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-base">
              {initialData ? "Yemek Reçetesini Düzenle" : "Yeni Yemek Reçetesi (BOM) Ekle"}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reçete Kodu</label>
              <input
                type="text"
                value={recipeCode}
                onChange={(e) => setRecipeCode(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Yemek Adı</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Orman Kebabı, Fırın Tavuk..."
                className="w-full px-3 py-2 border rounded-xl font-semibold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FoodCategory)}
                className="w-full px-3 py-2 border rounded-xl"
              >
                <option value="soup">Çorba</option>
                <option value="main_meat">Et / Tavuk Yemekleri</option>
                <option value="side_dish">Pilav & Makarna</option>
                <option value="salad_appetizer">Salata & Meze</option>
                <option value="dessert_fruit">Tatlı & Meyve</option>
                <option value="beverage">İçecekler</option>
                <option value="main_veg">Sebze & Bakliyat</option>
                <option value="breakfast_ration">Kahvaltı & Kumanya</option>
                <option value="bakery">Ekmek & Hamurişi</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Porsiyon (Gr/Ml)</label>
              <input
                type="number"
                value={standardPortionGrams}
                onChange={(e) => setStandardPortionGrams(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kalori (kcal)</label>
              <input
                type="number"
                value={calorie}
                onChange={(e) => setCalorie(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Önerilen Satış (TL)</label>
              <input
                type="number"
                value={suggestedSalePrice}
                onChange={(e) => setSuggestedSalePrice(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl font-bold text-emerald-700"
              />
            </div>
          </div>

          {/* İşçilik, Gaz ve Genel Giderler (Porsiyon Başı) */}
          <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-950 text-2xs uppercase tracking-wider flex items-center gap-1.5">
                <span>🔥</span>
                <span>Porsiyon Başına İşçilik, Gaz & Enerji Giderleri</span>
              </span>
              <span className="text-2xs text-amber-800 font-medium">
                Reçete maliyetine otomatik dahil edilir
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1 text-2xs">
                  Mutfak İşçilik Gideri (₺/Porsiyon)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={laborCostPerPortion}
                  onChange={(e) => setLaborCostPerPortion(Number(e.target.value))}
                  placeholder="3.50"
                  className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1 text-2xs">
                  Gaz & Enerji Gideri (₺/Porsiyon)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={gasEnergyCostPerPortion}
                  onChange={(e) => setGasEnergyCostPerPortion(Number(e.target.value))}
                  placeholder="2.00"
                  className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1 text-2xs">
                  Genel İmalat & Amortisman (₺/Porsiyon)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={overheadCostPerPortion}
                  onChange={(e) => setOverheadCostPerPortion(Number(e.target.value))}
                  placeholder="0.80"
                  className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Malzeme Listesi */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-2xs">
                Porsiyon Hammadde Kalemleri (BOM)
              </span>
              <button
                type="button"
                onClick={handleAddIngredient}
                className="text-amber-700 font-semibold text-xs flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Hammadde Ekle</span>
              </button>
            </div>

            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {ingredients.map((ing, idx) => (
                <div key={ing.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border">
                  <input
                    type="text"
                    placeholder="Hammadde adı"
                    value={ing.name}
                    onChange={(e) => handleIngredientChange(idx, "name", e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-white border rounded-lg text-xs"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Gramaj"
                    value={ing.portionGrams}
                    onChange={(e) => handleIngredientChange(idx, "portionGrams", Number(e.target.value))}
                    className="w-20 px-2 py-1.5 bg-white border rounded-lg text-xs text-center"
                    title="Porsiyondaki gramaj"
                  />
                  <span className="text-slate-500 text-2xs font-mono">{ing.unit}</span>
                  <input
                    type="number"
                    placeholder="Kg Fiyatı"
                    value={ing.unitCost}
                    onChange={(e) => handleIngredientChange(idx, "unitCost", Number(e.target.value))}
                    className="w-20 px-2 py-1.5 bg-white border rounded-lg text-xs text-center"
                    title="Hammadde Kg/Lt birim alış maliyeti"
                  />
                  <span className="text-2xs font-bold text-slate-800 w-16 text-right">
                    {ing.portionCost} ₺
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(idx)}
                    className="text-rose-500 hover:bg-rose-100 p-1 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Maliyet ve Fiyat Özeti Kartı */}
            <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 text-xs space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700">
                <div className="bg-white/80 p-2 rounded-lg border border-amber-100">
                  <div className="text-2xs text-slate-500">Hammadde Maliyeti</div>
                  <div className="font-bold text-slate-800">{totalPortionCost.toFixed(2)} ₺</div>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-amber-100">
                  <div className="text-2xs text-slate-500">İşçilik Gideri</div>
                  <div className="font-bold text-blue-700">{laborCostPerPortion.toFixed(2)} ₺</div>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-amber-100">
                  <div className="text-2xs text-slate-500">Gaz & Enerji</div>
                  <div className="font-bold text-amber-700">{gasEnergyCostPerPortion.toFixed(2)} ₺</div>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-amber-100">
                  <div className="text-2xs text-slate-500">Genel Gider</div>
                  <div className="font-bold text-purple-700">{overheadCostPerPortion.toFixed(2)} ₺</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-amber-200/60">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-950">Toplam Porsiyon Maliyeti:</span>
                  <span className="text-sm font-extrabold text-amber-900 bg-amber-200/60 px-2.5 py-0.5 rounded-lg">
                    {finalTotalCostPerPortion.toFixed(2)} TL
                  </span>
                </div>
                <div className="flex items-center gap-3 text-2xs">
                  <span className="text-slate-600">
                    Önerilen Satış: <strong className="text-emerald-700 text-xs">{suggestedSalePrice.toFixed(2)} ₺</strong>
                  </span>
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    profitMarginPercent >= 35 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    Brüt Marj: %{profitMarginPercent}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Alerjenler (Virgülle ayırın)</label>
            <input
              type="text"
              value={allergens}
              onChange={(e) => setAllergens(e.target.value)}
              placeholder="Örn: Gluten, Laktoz, Yumurta, Ceviz"
              className="w-full px-3 py-2 border rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pişirme & Hazırlık Talimatı</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={2}
              placeholder="Aşçı ve mutfak ekibi için hazırlık adımları..."
              className="w-full px-3 py-2 border rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl cursor-pointer"
            >
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 2. YENİ TABLDOT MENÜ MODALI
// ==========================================

interface NewMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (menu: FoodMenuPlan) => void;
  recipes: FoodRecipe[];
}

export const NewMenuModal: React.FC<NewMenuModalProps> = ({
  isOpen,
  onClose,
  onSave,
  recipes,
}) => {
  const [date, setDate] = useState("2026-09-10");
  const [dayOfWeek, setDayOfWeek] = useState("Perşembe");
  const [mealType, setMealType] = useState<"lunch" | "dinner">("lunch");
  const [title, setTitle] = useState("4 Kap Standart Tabldot Menüsü");

  // Filter recipes
  const soupRecipes = recipes.filter((r) => r.category === "soup");
  const mainRecipes = recipes.filter((r) => r.category === "main_meat" || r.category === "main_veg");
  const sideRecipes = recipes.filter((r) => r.category === "side_dish");
  const dessertRecipes = recipes.filter((r) => r.category === "dessert_fruit" || r.category === "salad_appetizer");

  const [soupId, setSoupId] = useState(soupRecipes[0]?.id || "");
  const [mainId, setMainId] = useState(mainRecipes[0]?.id || "");
  const [sideId, setSideId] = useState(sideRecipes[0]?.id || "");
  const [dessertId, setDessertId] = useState(dessertRecipes[0]?.id || "");

  const [sellingPrice, setSellingPrice] = useState(250);
  const [targetPortions, setTargetPortions] = useState(700);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const soup = recipes.find((r) => r.id === soupId) || recipes[0];
    const main = recipes.find((r) => r.id === mainId) || recipes[1];
    const side = recipes.find((r) => r.id === sideId) || recipes[2];
    const dessert = recipes.find((r) => r.id === dessertId) || recipes[3];

    const totalCost = (soup?.totalCostPerPortion || 15) + (main?.totalCostPerPortion || 80) + (side?.totalCostPerPortion || 15) + (dessert?.totalCostPerPortion || 15);
    const totalCalorie = (soup?.caloriePerPortion || 160) + (main?.caloriePerPortion || 420) + (side?.caloriePerPortion || 280) + (dessert?.caloriePerPortion || 250);

    const newMenu: FoodMenuPlan = {
      id: `mnu_${Date.now()}`,
      menuCode: `MNU-${Date.now().toString().slice(-4)}`,
      date,
      dayOfWeek,
      mealType,
      menuTier: "standard_4_course",
      title,
      items: {
        soupRecipeId: soup?.id || "",
        soupRecipeName: soup?.name || "Çorba",
        mainRecipeId: main?.id || "",
        mainRecipeName: main?.name || "Ana Yemek",
        sideRecipeId: side?.id || "",
        sideRecipeName: side?.name || "Pilav / Makarna",
        dessertOrSaladRecipeId: dessert?.id || "",
        dessertOrSaladRecipeName: dessert?.name || "Tatlı / Salata",
        additionalItemNames: ["Somun Ekmek", "Kapalı Su"],
      },
      totalCalorie,
      totalCostPerPortion: totalCost,
      sellingPricePerPortion: sellingPrice,
      targetPortionsTotal: targetPortions,
      allergensList: ["Gluten (Buğday)", "Süt & Laktoz"],
      isLocked: false,
    };

    onSave(newMenu);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-base">Yeni 4 Kap Tabldot Menü Planla</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tarih</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gün Adı</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              >
                <option value="Pazartesi">Pazartesi</option>
                <option value="Salı">Salı</option>
                <option value="Çarşamba">Çarşamba</option>
                <option value="Perşembe">Perşembe</option>
                <option value="Cuma">Cuma</option>
                <option value="Cumartesi">Cumartesi</option>
                <option value="Pazar">Pazar</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Menü Başlığı</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl font-semibold"
              required
            />
          </div>

          <div className="space-y-2.5 pt-2 border-t">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">1. Kap: Çorba</label>
              <select
                value={soupId}
                onChange={(e) => setSoupId(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              >
                {recipes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.caloriePerPortion} kcal)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">2. Kap: Ana Yemek (Et/Tavuk)</label>
              <select
                value={mainId}
                onChange={(e) => setMainId(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl font-semibold"
              >
                {recipes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.caloriePerPortion} kcal)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">3. Kap: Yardımcı Yemek (Pilav/Makarna)</label>
              <select
                value={sideId}
                onChange={(e) => setSideId(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              >
                {recipes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.caloriePerPortion} kcal)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">4. Kap: Tatlı / Meyve / Salata</label>
              <select
                value={dessertId}
                onChange={(e) => setDessertId(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              >
                {recipes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.caloriePerPortion} kcal)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Satış Fiyatı (TL/Por.)</label>
              <input
                type="number"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl font-bold text-emerald-700"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hedef Porsiyon Sayısı</label>
              <input
                type="number"
                value={targetPortions}
                onChange={(e) => setTargetPortions(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl font-bold text-amber-900"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl cursor-pointer"
            >
              Menüyü Yayınla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 3. YENİ MUTFAK İŞ EMRİ MODALI
// ==========================================

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: FoodProductionOrder) => void;
  menus: FoodMenuPlan[];
  contacts: Contact[];
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  menus,
  contacts,
}) => {
  const [orderNo, setOrderNo] = useState(`URT-2026-YMK-${Math.floor(100 + Math.random() * 900)}`);
  const [date, setDate] = useState("2026-09-08");
  const [mealType, setMealType] = useState<"lunch" | "dinner" | "night">("lunch");
  const [selectedMenuId, setSelectedMenuId] = useState(menus[0]?.id || "");
  const [headChefName, setHeadChefName] = useState("Salih Usta (Aşçıbaşı)");
  const [dispatchTime, setDispatchTime] = useState("11:00");
  const [startTime, setStartTime] = useState("06:30");

  const [customerPortions, setCustomerPortions] = useState<
    { contactName: string; portionCount: number; termoboxCount: number; deliveryAddress: string }[]
  >([
    { contactName: "Yıldırım İnşaat Şantiye", portionCount: 300, termoboxCount: 6, deliveryAddress: "Kavacık Mah. Şantiye Sahası" },
    { contactName: "Atlas Lojistik Depo", portionCount: 200, termoboxCount: 4, deliveryAddress: "Hadımköy Lojistik Üssü" },
  ]);

  if (!isOpen) return null;

  const totalPortions = customerPortions.reduce((sum, c) => sum + (c.portionCount || 0), 0);

  const handleAddCustomer = () => {
    setCustomerPortions([
      ...customerPortions,
      { contactName: "Yeni Firma / Şantiye", portionCount: 100, termoboxCount: 2, deliveryAddress: "" },
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedMenu = menus.find((m) => m.id === selectedMenuId) || menus[0];

    const newOrder: FoodProductionOrder = {
      id: `ord_${Date.now()}`,
      orderNo,
      date,
      mealType,
      menuPlanId: selectedMenu?.id,
      menuTitle: selectedMenu?.title || "Tabldot Menüsü",
      totalPortions,
      status: "planned",
      headChefName,
      kitchenSection: "Sıcak Mutfak & Tabldot Hattı",
      scheduledStartTime: startTime,
      scheduledDispatchTime: dispatchTime,
      recipes: [
        { recipeId: "1", recipeName: selectedMenu?.items.soupRecipeName || "Çorba", portionCount: totalPortions },
        { recipeId: "2", recipeName: selectedMenu?.items.mainRecipeName || "Ana Yemek", portionCount: totalPortions },
        { recipeId: "3", recipeName: selectedMenu?.items.sideRecipeName || "Pilav/Makarna", portionCount: totalPortions },
        { recipeId: "4", recipeName: selectedMenu?.items.dessertOrSaladRecipeName || "Tatlı/Salata", portionCount: totalPortions },
      ],
      customerPortions: customerPortions.map((cp, idx) => ({
        contactId: `cnt_${idx}`,
        contactName: cp.contactName,
        deliveryAddress: cp.deliveryAddress,
        portionCount: cp.portionCount,
        termoboxCount: cp.termoboxCount,
        isDelivered: false,
      })),
      ingredientsRequired: [
        {
          productName: "Dana Kuşbaşı / Kıyma",
          totalAmount: Math.round(totalPortions * 0.12),
          unit: "kg",
          currentStock: 450,
          isStockSufficient: true,
          unitCost: 480,
          totalCost: Math.round(totalPortions * 0.12 * 480),
        },
        {
          productName: "Pilavlık Baldo Pirinç",
          totalAmount: Math.round(totalPortions * 0.08),
          unit: "kg",
          currentStock: 300,
          isStockSufficient: true,
          unitCost: 85,
          totalCost: Math.round(totalPortions * 0.08 * 85),
        },
      ],
      totalProductionCost: totalPortions * 85,
      createdAt: new Date().toISOString(),
    };

    onSave(newOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center gap-2">
            <CookingPot className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-base">Yeni Mutfak Üretim Emri Aç</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">İş Emri No</label>
              <input
                type="text"
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tarih</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Öğün</label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-xl"
              >
                <option value="lunch">Öğle Yemeği</option>
                <option value="dinner">Akşam Yemeği</option>
                <option value="night">Gece Vardiyası</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kazan Başlama</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Araç Sevk Saati</label>
              <input
                type="time"
                value={dispatchTime}
                onChange={(e) => setDispatchTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl font-bold text-amber-700"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pişirilecek Tabldot Menü</label>
            <select
              value={selectedMenuId}
              onChange={(e) => setSelectedMenuId(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl font-semibold"
            >
              {menus.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.dayOfWeek} - {m.title} ({m.items.mainRecipeName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Aşçıbaşı / Mutfak Sorumlusu</label>
            <input
              type="text"
              value={headChefName}
              onChange={(e) => setHeadChefName(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl"
            />
          </div>

          {/* Şantiye ve Firma Porsiyonları */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-2xs">
                Şantiye / Müşteri Porsiyon Dağılımı ({totalPortions} Toplam Porsiyon)
              </span>
              <button
                type="button"
                onClick={handleAddCustomer}
                className="text-amber-700 font-semibold text-xs flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nokta Ekle</span>
              </button>
            </div>

            <div className="space-y-2 max-h-36 overflow-y-auto">
              {customerPortions.map((cp, idx) => (
                <div key={idx} className="p-2 bg-slate-50 border rounded-xl flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Şantiye / Firma Adı"
                    value={cp.contactName}
                    onChange={(e) => {
                      const updated = [...customerPortions];
                      updated[idx].contactName = e.target.value;
                      setCustomerPortions(updated);
                    }}
                    className="flex-1 px-2.5 py-1.5 bg-white border rounded-lg text-xs"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Porsiyon"
                    value={cp.portionCount}
                    onChange={(e) => {
                      const updated = [...customerPortions];
                      updated[idx].portionCount = Number(e.target.value);
                      setCustomerPortions(updated);
                    }}
                    className="w-20 px-2 py-1.5 bg-white border rounded-lg text-xs text-center font-bold"
                  />
                  <span className="text-2xs text-slate-500">Por.</span>
                  <input
                    type="number"
                    placeholder="Termobox"
                    value={cp.termoboxCount}
                    onChange={(e) => {
                      const updated = [...customerPortions];
                      updated[idx].termoboxCount = Number(e.target.value);
                      setCustomerPortions(updated);
                    }}
                    className="w-16 px-2 py-1.5 bg-white border rounded-lg text-xs text-center"
                    title="Termobox sayısı"
                  />
                  <span className="text-2xs text-slate-500">Kutu</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl cursor-pointer"
            >
              İş Emrini Başlat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 4. YENİ ŞAHİT NUMUNE MODALI
// ==========================================

interface NewSampleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sample: FoodWitnessSample) => void;
}

export const NewSampleModal: React.FC<NewSampleModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [dishName, setDishName] = useState("");
  const [sampleNo, setSampleNo] = useState(`SMP-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [orderNo, setOrderNo] = useState("URT-2026-YMK-001");
  const [sampleTemp, setSampleTemp] = useState(72);
  const [storageTemp, setStorageTemp] = useState(3.8);
  const [takenBy, setTakenBy] = useState("Gıda Mühendisi Ayşe Demir");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim()) return;

    const today = new Date();
    const disposeDate = new Date();
    disposeDate.setDate(today.getDate() + 3); // 72 hours = 3 days

    const newSample: FoodWitnessSample = {
      id: `smp_${Date.now()}`,
      sampleNo,
      date: today.toISOString().split("T")[0],
      mealType: "lunch",
      dishName,
      productionOrderNo: orderNo,
      sampleTempCelsius: sampleTemp,
      storageTempCelsius: storageTemp,
      takenBy,
      takenAtTime: `${String(today.getHours()).padStart(2, "0")}:${String(today.getMinutes()).padStart(2, "0")}`,
      retentionHours: 72,
      disposeDate: disposeDate.toISOString().split("T")[0],
      status: "retained",
    };

    onSave(newSample);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-slate-900 text-base">72 Saatlik Gıda Şahit Numune Kaydı</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Protokol Numune No</label>
            <input
              type="text"
              value={sampleNo}
              onChange={(e) => setSampleNo(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl font-mono font-bold"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Yemek / Ürün Adı (250g Numune)</label>
            <input
              type="text"
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              placeholder="Örn: Dana Tas Kebabı, Mercimek Çorbası..."
              className="w-full px-3 py-2 border rounded-xl font-semibold"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">İlgili Mutfak İş Emri No</label>
            <input
              type="text"
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Yemek Alınış Sıcaklığı (°C)</label>
              <input
                type="number"
                step="0.1"
                value={sampleTemp}
                onChange={(e) => setSampleTemp(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl font-bold text-orange-700"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Dolap Sıcaklığı (+°C)</label>
              <input
                type="number"
                step="0.1"
                value={storageTemp}
                onChange={(e) => setStorageTemp(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl font-bold text-blue-700"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Numuneyi Alan Sorumlu</label>
            <input
              type="text"
              value={takenBy}
              onChange={(e) => setTakenBy(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl"
              required
            />
          </div>

          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 text-2xs space-y-1">
            <p className="font-semibold">Mevzuat Bilgisi:</p>
            <p>
              Şahit numuneler steril cam kavanoz veya mühürlü torbalarda en az 250 gr olarak +4°C derecede 72 saat saklanmalıdır.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl cursor-pointer"
            >
              Numuneyi Deftere Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
