import { FoodRecipe, FoodProductionOrder, Product, MealType, FoodCustomerPortion } from "../types";

export interface AggregatedIngredientRequirement {
  id: string;
  name: string;
  unit: string;
  totalNeeded: number;
  matchingProductId?: string;
  matchingProductCode?: string;
  currentStock: number;
  remainingStockAfter: number;
  isStockSufficient: boolean;
  unitCost: number;
  totalCost: number;
  recipeBreakdown: {
    recipeName: string;
    amount: number;
    unit: string;
  }[];
}

/**
 * Normalizes an ingredient name for flexible matching against warehouse products
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Finds matching product in inventory by comparing names and codes
 */
export function findMatchingProduct(ingredientName: string, products: Product[]): Product | undefined {
  const normIng = normalizeName(ingredientName);
  
  // 1. Direct exact match
  let found = products.find((p) => normalizeName(p.name) === normIng);
  if (found) return found;

  // 2. Substring match (either product name contains ingredient or vice versa)
  found = products.find((p) => {
    const normP = normalizeName(p.name);
    return normP.includes(normIng) || normIng.includes(normP);
  });
  if (found) return found;

  // 3. Keyword token match (e.g., "kuşbaşı", "kıyma", "pirinç", "mercimek", "yağ", "soğan", "un")
  const keyTokens = normIng.split(" ").filter((t) => t.length >= 3);
  if (keyTokens.length > 0) {
    found = products.find((p) => {
      const normP = normalizeName(p.name);
      return keyTokens.some((tok) => normP.includes(tok));
    });
  }

  return found;
}

/**
 * Calculates and aggregates all ingredients across selected recipes based on portion count
 */
export function calculateRequiredIngredients(
  recipeSelections: { recipe: FoodRecipe; portionCount: number }[],
  products: Product[]
): AggregatedIngredientRequirement[] {
  const map: Record<string, AggregatedIngredientRequirement> = {};

  recipeSelections.forEach(({ recipe, portionCount }) => {
    if (!recipe || !recipe.ingredients || portionCount <= 0) return;

    const baseServings = recipe.servingsCount && recipe.servingsCount > 0 ? recipe.servingsCount : 1;
    const ratio = portionCount / baseServings;

    recipe.ingredients.forEach((ing) => {
      const normKey = normalizeName(ing.name);

      // Gramaj / miktar dönüşümü: g -> kg, ml -> lt
      let rawAmountInStandardUnit = 0;
      if (ing.portionGrams !== undefined && ing.portionGrams > 0) {
        if (ing.unit === "g" || ing.unit === "ml") {
          rawAmountInStandardUnit = ing.portionGrams / 1000;
        } else {
          rawAmountInStandardUnit = ing.portionGrams;
        }
      } else if (ing.amount !== undefined && ing.amount > 0) {
        rawAmountInStandardUnit = ing.amount;
      } else {
        rawAmountInStandardUnit = 0.05;
      }

      const unit = ing.unit === "g" ? "kg" : ing.unit === "ml" ? "lt" : ing.unit || "kg";
      const neededAmount = Math.round(rawAmountInStandardUnit * ratio * 100) / 100;
      const unitCost = ing.unitCost ?? (rawAmountInStandardUnit > 0 && ing.portionCost > 0 ? Math.round((ing.portionCost / rawAmountInStandardUnit) * 100) / 100 : 25);

      if (!map[normKey]) {
        const matchedProd = findMatchingProduct(ing.name, products);
        const currentStock = matchedProd ? (matchedProd.stockQuantity ?? matchedProd.stock ?? 0) : 0;
        const actualUnitCost = matchedProd && matchedProd.buyPrice > 0 ? matchedProd.buyPrice : unitCost;

        map[normKey] = {
          id: `ing_req_${normKey.replace(/[^a-z0-9]/g, "_")}`,
          name: ing.name,
          unit,
          totalNeeded: 0,
          matchingProductId: matchedProd?.id,
          matchingProductCode: matchedProd?.code,
          currentStock,
          remainingStockAfter: currentStock,
          isStockSufficient: false,
          unitCost: actualUnitCost,
          totalCost: 0,
          recipeBreakdown: [],
        };
      }

      map[normKey].totalNeeded = Math.round((map[normKey].totalNeeded + neededAmount) * 100) / 100;
      map[normKey].recipeBreakdown.push({
        recipeName: recipe.name,
        amount: neededAmount,
        unit,
      });
    });
  });

  // Calculate sufficiency and total costs
  const results = Object.values(map);
  results.forEach((item) => {
    item.remainingStockAfter = Math.round((item.currentStock - item.totalNeeded) * 100) / 100;
    item.isStockSufficient = item.currentStock >= item.totalNeeded;
    item.totalCost = Math.round((item.totalNeeded * item.unitCost) * 100) / 100;
  });

  return results.sort((a, b) => b.totalCost - a.totalCost);
}

export interface KitchenOrderCreationParams {
  orderNo?: string;
  date: string;
  mealType: MealType;
  menuPlanId?: string;
  menuTitle: string;
  headChefName: string;
  kitchenSection: string;
  scheduledStartTime: string;
  scheduledDispatchTime: string;
  recipeSelections: { recipe: FoodRecipe; portionCount: number }[];
  customerPortions?: FoodCustomerPortion[];
  deductStock: boolean;
  notes?: string;
  products: Product[];
  currentOrders: FoodProductionOrder[];
}

export interface KitchenOrderCreationResult {
  newOrder: FoodProductionOrder;
  updatedOrders: FoodProductionOrder[];
  updatedProducts: Product[];
  deductedIngredientsSummary: {
    totalItemsDeducted: number;
    totalKgDeducted: number;
    insufficientStockItems: string[];
    deductedDetails: { name: string; amount: number; unit: string; prevStock: number; newStock: number }[];
  };
}

/**
 * Executes creation of a Kitchen Work Order and automatically deducts stock if requested
 */
export function executeKitchenOrderTrigger({
  orderNo,
  date,
  mealType,
  menuPlanId,
  menuTitle,
  headChefName,
  kitchenSection,
  scheduledStartTime,
  scheduledDispatchTime,
  recipeSelections,
  customerPortions,
  deductStock,
  notes,
  products,
  currentOrders,
}: KitchenOrderCreationParams): KitchenOrderCreationResult {
  const generatedOrderNo = orderNo || `URT-${new Date().getFullYear()}-YMK-${Math.floor(1000 + Math.random() * 9000)}`;
  const totalPortions = recipeSelections.reduce((max, r) => Math.max(max, r.portionCount), 0);

  // 1. Calculate required ingredients
  const aggregatedIngredients = calculateRequiredIngredients(recipeSelections, products);

  // 2. Track stock deduction
  const updatedProducts = [...products];
  const deductedDetails: { name: string; amount: number; unit: string; prevStock: number; newStock: number }[] = [];
  const insufficientStockItems: string[] = [];
  let totalKgDeducted = 0;

  if (deductStock) {
    aggregatedIngredients.forEach((req) => {
      let matchedIndex = -1;

      if (req.matchingProductId) {
        matchedIndex = updatedProducts.findIndex((p) => p.id === req.matchingProductId);
      }
      if (matchedIndex === -1) {
        matchedIndex = updatedProducts.findIndex((p) => {
          const normP = normalizeName(p.name);
          const normIng = normalizeName(req.name);
          return normP === normIng || normP.includes(normIng) || normIng.includes(normP);
        });
      }

      if (matchedIndex !== -1) {
        const prod = updatedProducts[matchedIndex];
        const prevStock = prod.stockQuantity ?? prod.stock ?? 0;
        const newStock = Math.round(Math.max(0, prevStock - req.totalNeeded) * 100) / 100;

        if (prevStock < req.totalNeeded) {
          insufficientStockItems.push(`${req.name} (Gereken: ${req.totalNeeded} ${req.unit}, Mevcut: ${prevStock})`);
        }

        updatedProducts[matchedIndex] = {
          ...prod,
          stockQuantity: newStock,
          stock: newStock,
        };

        deductedDetails.push({
          name: prod.name,
          amount: req.totalNeeded,
          unit: req.unit,
          prevStock,
          newStock,
        });

        totalKgDeducted += req.totalNeeded;
      } else {
        // Automatically create this raw material product so it appears in inventory tracking
        const newRawMaterial: Product = {
          id: `prd_raw_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          code: `HAM-${req.name.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
          name: req.name,
          unit: req.unit,
          buyPrice: req.unitCost,
          sellPrice: Math.round(req.unitCost * 1.3),
          vatRate: 1,
          stockQuantity: 0,
          stock: 0,
          minStockAlert: 50,
          category: "Gıda & Hammadde",
          stockType: "İlk Madde Malzeme",
        };

        updatedProducts.push(newRawMaterial);
        insufficientStockItems.push(`${req.name} (Stokta yoktu, 0 bakiye ile hammadde kartı açıldı)`);

        deductedDetails.push({
          name: req.name,
          amount: req.totalNeeded,
          unit: req.unit,
          prevStock: 0,
          newStock: 0,
        });
      }
    });
  }

  // 3. Construct total production cost
  const totalProductionCost = aggregatedIngredients.reduce((sum, ing) => sum + ing.totalCost, 0);

  // 4. Default customer portions if not passed
  const finalCustomerPortions: FoodCustomerPortion[] =
    customerPortions && customerPortions.length > 0
      ? customerPortions
      : [
          {
            contactId: "cnt_default_genel",
            contactName: "Genel Üretim ve Kurumsal Şantiyeler Dağıtımı",
            portionCount: totalPortions,
            termoboxCount: Math.ceil(totalPortions / 50),
            deliveryAddress: "Merkez Mutfak Çıkış & Sevk Alanı",
            breadCount: totalPortions,
            ayranWaterCount: totalPortions,
            isDelivered: false,
          },
        ];

  // 5. Create new FoodProductionOrder
  const newOrder: FoodProductionOrder = {
    id: `ord_${Date.now()}`,
    orderNo: generatedOrderNo,
    date,
    mealType,
    menuPlanId,
    menuTitle,
    recipes: recipeSelections.map((r) => ({
      recipeId: r.recipe.id,
      recipeName: r.recipe.name,
      portionCount: r.portionCount,
    })),
    customerPortions: finalCustomerPortions,
    totalPortions,
    status: deductStock ? "ingredients_issued" : "planned",
    headChefName,
    kitchenSection,
    scheduledStartTime,
    scheduledDispatchTime,
    actualStartTime: deductStock ? new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : undefined,
    ingredientsRequired: aggregatedIngredients.map((ing) => ({
      productId: ing.matchingProductId,
      productName: ing.name,
      totalAmount: ing.totalNeeded,
      unit: ing.unit,
      currentStock: ing.currentStock,
      isStockSufficient: ing.isStockSufficient,
      unitCost: ing.unitCost,
      totalCost: ing.totalCost,
      deductedAmount: deductStock ? ing.totalNeeded : 0,
      isDeducted: deductStock,
      remainingStockAfter: deductStock ? ing.remainingStockAfter : ing.currentStock,
    })),
    totalProductionCost,
    isStockDeducted: deductStock,
    stockDeductionDate: deductStock ? new Date().toISOString() : undefined,
    stockDeductionSummary: deductStock
      ? `${deductedDetails.length} kalem hammadde (${Math.round(totalKgDeducted * 10) / 10} birim) depodan çıkış yapıldı.`
      : "Stok çıkışı henüz yapılmadı (beklemede).",
    notes: notes || "Otomatik mutfak iş emri tetikleyicisi ile oluşturuldu.",
    createdAt: new Date().toISOString(),
  };

  const updatedOrders = [newOrder, ...currentOrders];

  return {
    newOrder,
    updatedOrders,
    updatedProducts,
    deductedIngredientsSummary: {
      totalItemsDeducted: deductedDetails.length,
      totalKgDeducted: Math.round(totalKgDeducted * 10) / 10,
      insufficientStockItems,
      deductedDetails,
    },
  };
}

/**
 * Deducts stock for an existing planned order
 */
export function deductStockForExistingOrder(
  order: FoodProductionOrder,
  products: Product[],
  recipes: FoodRecipe[]
): {
  updatedOrder: FoodProductionOrder;
  updatedProducts: Product[];
  deductedCount: number;
  summary: string;
} {
  if (order.isStockDeducted) {
    return {
      updatedOrder: order,
      updatedProducts: products,
      deductedCount: 0,
      summary: "Bu iş emrinin hammadde sarfiyatı daha önce yapılmıştır.",
    };
  }

  const updatedProducts = [...products];
  let deductedCount = 0;

  // Find recipes for this order
  const recipeSelections: { recipe: FoodRecipe; portionCount: number }[] = order.recipes.map((r) => {
    const matched = recipes.find((rec) => rec.id === r.recipeId || rec.name.toLowerCase() === r.recipeName.toLowerCase());
    const fallbackRecipe: FoodRecipe = {
      id: r.recipeId || `rec_${r.recipeName}`,
      recipeCode: "REC-AUTO",
      name: r.recipeName,
      category: "main_meat",
      categoryLabel: "Yemek",
      servingsCount: 1,
      portionCost: 0,
      ingredients: [],
      allergens: [],
      isApproved: true,
      createdAt: "",
      updatedAt: "",
    };
    return {
      recipe: matched || fallbackRecipe,
      portionCount: r.portionCount || order.totalPortions,
    };
  });

  const reqs = calculateRequiredIngredients(recipeSelections, products);

  reqs.forEach((req) => {
    const idx = updatedProducts.findIndex((p) => {
      const normP = normalizeName(p.name);
      const normIng = normalizeName(req.name);
      return p.id === req.matchingProductId || normP === normIng || normP.includes(normIng) || normIng.includes(normP);
    });

    if (idx !== -1) {
      const prod = updatedProducts[idx];
      const prevStock = prod.stockQuantity ?? prod.stock ?? 0;
      const newStock = Math.round(Math.max(0, prevStock - req.totalNeeded) * 100) / 100;

      updatedProducts[idx] = {
        ...prod,
        stockQuantity: newStock,
        stock: newStock,
      };
      deductedCount++;
    }
  });

  const updatedOrder: FoodProductionOrder = {
    ...order,
    status: order.status === "planned" ? "ingredients_issued" : order.status,
    isStockDeducted: true,
    stockDeductionDate: new Date().toISOString(),
    stockDeductionSummary: `${deductedCount} kalem hammadde stoktan çıkış yapılarak sarfiyat fişi kesildi.`,
    ingredientsRequired: reqs.map((req) => ({
      productId: req.matchingProductId,
      productName: req.name,
      totalAmount: req.totalNeeded,
      unit: req.unit,
      currentStock: req.currentStock,
      isStockSufficient: req.isStockSufficient,
      unitCost: req.unitCost,
      totalCost: req.totalCost,
      deductedAmount: req.totalNeeded,
      isDeducted: true,
      remainingStockAfter: req.remainingStockAfter,
    })),
  };

  return {
    updatedOrder,
    updatedProducts,
    deductedCount,
    summary: `${deductedCount} kalem hammadde stoktan düşüldü.`,
  };
}
