function createRecipe(data) {
  const portionCost = Math.round(data.ingredients.reduce((sum, ing) => sum + (ing.portionCost || 0), 0) * 10) / 10;
  const laborCostPerPortion = data.labor || 4.5;
  const gasEnergyCostPerPortion = data.gas || 2.2;
  const overheadCostPerPortion = data.overhead || 0.8;
  const laborAndOverheadPerPortion = Math.round((laborCostPerPortion + gasEnergyCostPerPortion + overheadCostPerPortion) * 10) / 10;
  const totalCostPerPortion = Math.round((portionCost + laborAndOverheadPerPortion) * 10) / 10;
  const suggestedSalePrice = Math.round((totalCostPerPortion * 1.55) / 5) * 5;
  const grossMarginPercent = Math.round(((suggestedSalePrice - totalCostPerPortion) / suggestedSalePrice) * 100);

  return {
    id: data.id,
    recipeCode: data.code || data.recipeCode,
    code: data.code || data.recipeCode,
    name: data.name,
    category: data.category,
    categoryLabel: data.categoryLabel,
    status: "approved",
    isApproved: true,
    approvedBy: "Aşçıbaşı & Gıda Mühendisi",
    standardPortionGrams: data.portionGrams || 250,
    servingsCount: 1,
    prepTimeMinutes: data.prepTime || 20,
    cookingTimeMinutes: data.cookTime || 30,
    storageTemp: data.temp || "+65°C (Sıcak)",
    servingTemp: data.temp || "+65°C (Sıcak)",
    caloriePerPortion: data.calorie || 300,
    proteinGrams: data.protein || 10,
    carbGrams: data.carb || 25,
    fatGrams: data.fat || 12,
    nutritionalValues: {
      calories: data.calorie || 300,
      protein: data.protein || 10,
      carbs: data.carb || 25,
      fat: data.fat || 12
    },
    allergens: data.allergens || [],
    equipment: ["Kazan", "Kepçe", "Fırın/Kuzine", "Gastronom Küvet"],
    instructions: data.instructions || "Standart hijyen kurallarına uygun olarak hazırlanıp pişirilir.",
    cookingInstructions: data.instructions || "Standart hijyen kurallarına uygun olarak hazırlanıp pişirilir.",
    portionCost,
    laborCostPerPortion,
    gasEnergyCostPerPortion,
    overheadCostPerPortion,
    laborAndOverheadPerPortion,
    totalCostPerPortion,
    targetGrossMarginPercent: 35,
    suggestedSalePrice,
    actualGrossMarginPercent: grossMarginPercent,
    ingredients: data.ingredients,
    notes: "Standart fabrika reçetesi",
    createdAt: "2026-09-01",
    updatedAt: "2026-09-18"
  };
}

module.exports = { createRecipe };
