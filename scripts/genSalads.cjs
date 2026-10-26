const fs = require('fs');
const path = require('path');
const { createRecipe } = require('./recipeHelper.cjs');

const salads = [
  createRecipe({
    id: "rec_sal_01", code: "REC-SAL-001",
    name: "Çoban Salatası",
    category: "salad_appetizer", categoryLabel: "Salata & Meze",
    portionGrams: 200, prepTime: 15, cookTime: 0,
    calorie: 120, protein: 2.5, carb: 9.0, fat: 8.5,
    temp: "+4°C (Soğuk)",
    instructions: "Tarla domatesi, salatalık, sivri biber, kuru soğan ve maydanoz eşit küpler halinde doğranır. Üzerine sızma zeytinyağı, nar ekşisi ve taze limon suyu gezdirilir.",
    labor: 3.0, gas: 0.0, overhead: 0.5,
    ingredients: [
      { id: "ing_sal_01_1", name: "Tarla Domatesi & Çengelköy Salatalık", portionGrams: 120, unit: "g", unitCost: 35, portionCost: 4.2, wastagePercent: 8 },
      { id: "ing_sal_01_2", name: "Sivri Biber, Kırmızı Soğan & Maydanoz", portionGrams: 50, unit: "g", unitCost: 35, portionCost: 1.75, wastagePercent: 8 },
      { id: "ing_sal_01_3", name: "Erken Hasat Sızma Zeytinyağı & Limon", portionGrams: 20, unit: "ml", unitCost: 240, portionCost: 4.8, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_sal_02", code: "REC-SAL-002",
    name: "Mevsim Salatası",
    category: "salad_appetizer", categoryLabel: "Salata & Meze",
    portionGrams: 190, prepTime: 12, cookTime: 0,
    calorie: 110, protein: 2.2, carb: 8.0, fat: 8.0,
    temp: "+4°C (Soğuk)",
    instructions: "İnce kıyılmış mor lahana, göbek marul, rendelenmiş havuç ve mısır zeytinyağlı limonlu sosla harmanlanır.",
    labor: 2.8, gas: 0.0, overhead: 0.5,
    ingredients: [
      { id: "ing_sal_02_1", name: "Göbek Marul & Mor Lahana", portionGrams: 100, unit: "g", unitCost: 30, portionCost: 3.0, wastagePercent: 10 },
      { id: "ing_sal_02_2", name: "Rende Havuç & Tane Mısır", portionGrams: 50, unit: "g", unitCost: 35, portionCost: 1.75, wastagePercent: 5 },
      { id: "ing_sal_02_3", name: "Sızma Zeytinyağı & Limon Sosu", portionGrams: 18, unit: "ml", unitCost: 220, portionCost: 3.96, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_sal_03", code: "REC-SAL-003",
    name: "Gavurdağı Salatası",
    category: "salad_appetizer", categoryLabel: "Salata & Meze",
    portionGrams: 210, prepTime: 20, cookTime: 0,
    calorie: 220, protein: 4.5, carb: 12.0, fat: 18.0,
    allergens: ["Ceviz"],
    temp: "+4°C (Soğuk)",
    instructions: "Kabuğu soyulup tavla zarı büyüklüğünde doğranan domates, salatalık, taze soğan ve maydanoz; bol kırık ceviz, sumak, hakiki nar ekşisi ve zeytinyağı ile buluşur.",
    labor: 4.0, gas: 0.0, overhead: 0.6,
    ingredients: [
      { id: "ing_sal_03_1", name: "Soyulmuş Tarla Domatesi & Salatalık", portionGrams: 120, unit: "g", unitCost: 35, portionCost: 4.2, wastagePercent: 10 },
      { id: "ing_sal_03_2", name: "İri Kırılmış Yerli Ceviz İçi", portionGrams: 35, unit: "g", unitCost: 400, portionCost: 14.0, wastagePercent: 0, allergen: "Ceviz" },
      { id: "ing_sal_03_3", name: "Yeşillikler (Taze Soğan, Maydanoz)", portionGrams: 25, unit: "g", unitCost: 40, portionCost: 1.0, wastagePercent: 5 },
      { id: "ing_sal_03_4", name: "Doğal Nar Ekşisi, Sumak & Sızma Zeytinyağı", portionGrams: 20, unit: "ml", unitCost: 250, portionCost: 5.0, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_sal_04", code: "REC-SAL-004",
    name: "Piyaz (Antalya Usulü - Tahinli)",
    category: "salad_appetizer", categoryLabel: "Salata & Meze",
    portionGrams: 220, prepTime: 20, cookTime: 10,
    calorie: 340, protein: 14.0, carb: 32.0, fat: 18.0,
    allergens: ["Susam (Tahin)", "Yumurta"],
    temp: "+15°C (Ilık/Soğuk)",
    instructions: "Çandır kuru fasulyesi haşlanır. Tahin, sarımsak, sirke ve limonla hazırlanan özel tarator sos fasulyeyle harmanlanır; haşlanmış yumurta ve domatesle süslenir.",
    labor: 4.5, gas: 1.0, overhead: 0.6,
    ingredients: [
      { id: "ing_sal_04_1", name: "Haşlanmış Küçük Kuru Fasulye (Çandır)", portionGrams: 90, unit: "g", unitCost: 95, portionCost: 8.55, wastagePercent: 0 },
      { id: "ing_sal_04_2", name: "Özel Antalya Tahin Sosu (Tahin, Sirke, Limon, Sarımsak)", portionGrams: 55, unit: "g", unitCost: 160, portionCost: 8.8, wastagePercent: 0, allergen: "Susam" },
      { id: "ing_sal_04_3", name: "Köy Yumurtası (Haşlanmış Dilim)", portionGrams: 40, unit: "g", unitCost: 70, portionCost: 2.8, wastagePercent: 0, allergen: "Yumurta" },
      { id: "ing_sal_04_4", name: "Domates, Maydanoz & Zeytinyağı", portionGrams: 25, unit: "g", unitCost: 60, portionCost: 1.5, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_sal_05", code: "REC-SAL-005",
    name: "Piyaz (Klasik Fasulye)",
    category: "salad_appetizer", categoryLabel: "Salata & Meze",
    portionGrams: 200, prepTime: 15, cookTime: 0,
    calorie: 230, protein: 11.0, carb: 28.0, fat: 8.0,
    allergens: ["Yumurta"],
    temp: "+15°C (Ilık/Soğuk)",
    instructions: "Haşlanmış kuru fasulye sumaklı ince piyaz soğan, maydanoz, domates, sızma zeytinyağı ve sirke ile harmanlanır.",
    labor: 3.5, gas: 0.5, overhead: 0.5,
    ingredients: [
      { id: "ing_sal_05_1", name: "Haşlanmış Kuru Fasulye (Dermason)", portionGrams: 110, unit: "g", unitCost: 75, portionCost: 8.25, wastagePercent: 0 },
      { id: "ing_sal_05_2", name: "Piyazlık Kırmızı Soğan & Maydanoz", portionGrams: 45, unit: "g", unitCost: 35, portionCost: 1.58, wastagePercent: 5 },
      { id: "ing_sal_05_3", name: "Haşlanmış Yumurta Dilimleri", portionGrams: 35, unit: "g", unitCost: 70, portionCost: 2.45, wastagePercent: 0, allergen: "Yumurta" },
      { id: "ing_sal_05_4", name: "Sızma Zeytinyağı, Elma Sirkesi & Sumak", portionGrams: 18, unit: "ml", unitCost: 200, portionCost: 3.6, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_sal_06", code: "REC-SAL-006",
    name: "Haydari",
    category: "salad_appetizer", categoryLabel: "Salata & Meze",
    portionGrams: 180, prepTime: 15, cookTime: 0,
    calorie: 240, protein: 9.0, carb: 8.0, fat: 19.0,
    allergens: ["Laktoz (Süzme Yoğurt, Peynir, Tereyağı)"],
    temp: "+4°C (Soğuk)",
    instructions: "Koyu süzme yoğurt, ezilmiş yağlı beyaz peynir, dövülmüş sarımsak, taze nane ve tereyağında hafif çevrilmiş kuru nane ile homojen karıştırılır.",
    labor: 3.5, gas: 0.5, overhead: 0.5,
    ingredients: [
      { id: "ing_sal_06_1", name: "Koyu Süzme Köy Yoğurdu", portionGrams: 110, unit: "g", unitCost: 75, portionCost: 8.25, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_sal_06_2", name: "Ezine Yağlı Beyaz Peynir", portionGrams: 35, unit: "g", unitCost: 210, portionCost: 7.35, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_sal_06_3", name: "Köy Tereyağı & Kuru Nane", portionGrams: 15, unit: "g", unitCost: 320, portionCost: 4.8, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_sal_06_4", name: "Ezilmiş Sarımsak & Sızma Zeytinyağı", portionGrams: 12, unit: "g", unitCost: 200, portionCost: 2.4, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_sal_07", code: "REC-SAL-007",
    name: "Humus (Sıcak Pastırmalı / Soğuk)",
    category: "salad_appetizer", categoryLabel: "Salata & Meze",
    portionGrams: 200, prepTime: 20, cookTime: 10,
    calorie: 360, protein: 14.0, carb: 30.0, fat: 22.0,
    allergens: ["Susam (Tahin)"],
    temp: "+50°C (Sıcak)",
    instructions: "Kabukları tek tek soyulmuş haşlanmış nohut tahin, sarımsak, kimyon ve limonla ipeksi püre yapılır; üzerine tereyağında çıtırdatılmış pastırma dilimleri serilir.",
    labor: 4.5, gas: 1.5, overhead: 0.6,
    ingredients: [
      { id: "ing_sal_07_1", name: "Soyulmuş İpeksi Nohut Püresi", portionGrams: 90, unit: "g", unitCost: 65, portionCost: 5.85, wastagePercent: 0 },
      { id: "ing_sal_07_2", name: "Çifte Kavrulmuş Tahin & Limon Suyu", portionGrams: 45, unit: "g", unitCost: 150, portionCost: 6.75, wastagePercent: 0, allergen: "Susam" },
      { id: "ing_sal_07_3", name: "Kayseri Pastırması (Çemenli)", portionGrams: 25, unit: "g", unitCost: 680, portionCost: 17.0, wastagePercent: 0 },
      { id: "ing_sal_07_4", name: "Köy Tereyağı & Kimyon", portionGrams: 18, unit: "g", unitCost: 320, portionCost: 5.76, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_sal_08", code: "REC-SAL-008",
    name: "Şakşuka (Soğuk Meze)",
    category: "salad_appetizer", categoryLabel: "Salata & Meze",
    portionGrams: 190, prepTime: 20, cookTime: 20,
    calorie: 210, protein: 3.5, carb: 18.0, fat: 14.0,
    temp: "+4°C (Soğuk)",
    instructions: "Küp kızartılmış kemer patlıcan ve köy biberi yoğun sarımsaklı domates sosuyla dinlendirilir; soğuk meze olarak servis edilir.",
    labor: 3.5, gas: 1.5, overhead: 0.5,
    ingredients: [
      { id: "ing_sal_08_1", name: "Kızarmış Patlıcan & Biber Küpleri", portionGrams: 120, unit: "g", unitCost: 45, portionCost: 5.4, wastagePercent: 10 },
      { id: "ing_sal_08_2", name: "Sarımsaklı Yoğun Domates Sosu", portionGrams: 55, unit: "g", unitCost: 40, portionCost: 2.2, wastagePercent: 0 },
      { id: "ing_sal_08_3", name: "Sızma Zeytinyağı", portionGrams: 12, unit: "ml", unitCost: 240, portionCost: 2.88, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_sal_09", code: "REC-SAL-009",
    name: "Babagannuş (Abugannuş)",
    category: "salad_appetizer", categoryLabel: "Salata & Meze",
    portionGrams: 190, prepTime: 20, cookTime: 15,
    calorie: 190, protein: 4.0, carb: 14.0, fat: 14.0,
    allergens: ["Susam (Tahin)"],
    temp: "+4°C (Soğuk)",
    instructions: "Meşe kömüründe közlenmiş patlıcan, kapya biber ve sarımsak bıçakla incecik kıyılır; tahin, nar ekşisi ve sızma zeytinyağı ile harmanlanır.",
    labor: 4.0, gas: 1.0, overhead: 0.5,
    ingredients: [
      { id: "ing_sal_09_1", name: "Közlenmiş Patlıcan & Kapya Biber", portionGrams: 130, unit: "g", unitCost: 55, portionCost: 7.15, wastagePercent: 15 },
      { id: "ing_sal_09_2", name: "Tahin & Hakiki Nar Ekşisi", portionGrams: 30, unit: "g", unitCost: 160, portionCost: 4.8, wastagePercent: 0, allergen: "Susam" },
      { id: "ing_sal_09_3", name: "Sarımsak & Erken Hasat Zeytinyağı", portionGrams: 15, unit: "ml", unitCost: 260, portionCost: 3.9, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_sal_10", code: "REC-SAL-010",
    name: "Muhammara / Acuka",
    category: "salad_appetizer", categoryLabel: "Salata & Meze",
    portionGrams: 170, prepTime: 20, cookTime: 0,
    calorie: 330, protein: 7.0, carb: 20.0, fat: 26.0,
    allergens: ["Ceviz", "Gluten (Galeta)"],
    temp: "+4°C (Soğuk)",
    instructions: "Gaziantep acı biber salçası, domates salçası, bol çekilmiş ceviz, sarımsak, kimyon, galeta unu, nar ekşisi ve zeytinyağı taş havanda dövülerek hazırlanır.",
    labor: 3.5, gas: 0.0, overhead: 0.5,
    ingredients: [
      { id: "ing_sal_10_1", name: "Antep Biber & Domates Salçası", portionGrams: 50, unit: "g", unitCost: 95, portionCost: 4.75, wastagePercent: 0 },
      { id: "ing_sal_10_2", name: "Çekilmiş Yerli Ceviz İçi", portionGrams: 50, unit: "g", unitCost: 400, portionCost: 20.0, wastagePercent: 0, allergen: "Ceviz" },
      { id: "ing_sal_10_3", name: "Galeta Unu & Kimyon", portionGrams: 20, unit: "g", unitCost: 45, portionCost: 0.9, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_sal_10_4", name: "Sızma Zeytinyağı & Nar Ekşisi", portionGrams: 25, unit: "ml", unitCost: 240, portionCost: 6.0, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_sal_11", code: "REC-SAL-011",
    name: "Ezme (Acılı Ezme)",
    category: "salad_appetizer", categoryLabel: "Salata & Meze",
    portionGrams: 180, prepTime: 20, cookTime: 0,
    calorie: 130, protein: 2.5, carb: 14.0, fat: 8.0,
    temp: "+4°C (Soğuk)",
    instructions: "Kabuksuz domates, kapya biber, sivri biber, sarımsak ve maydanoz zırhtan geçirilip suyu süzülür; nar ekşisi, isot ve zeytinyağı ile karıştırılır.",
    labor: 3.5, gas: 0.0, overhead: 0.5,
    ingredients: [
      { id: "ing_sal_11_1", name: "Zırhtan Geçmiş Domates & Biber", portionGrams: 125, unit: "g", unitCost: 35, portionCost: 4.38, wastagePercent: 12 },
      { id: "ing_sal_11_2", name: "Urfa İsotu, Sarımsak & Biber Salçası", portionGrams: 25, unit: "g", unitCost: 110, portionCost: 2.75, wastagePercent: 0 },
      { id: "ing_sal_11_3", name: "Nar Ekşisi & Sızma Zeytinyağı", portionGrams: 18, unit: "ml", unitCost: 240, portionCost: 4.32, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_sal_12", code: "REC-SAL-012",
    name: "Tarator (Havuçlu / Cevizli)",
    category: "salad_appetizer", categoryLabel: "Salata & Meze",
    portionGrams: 180, prepTime: 15, cookTime: 8,
    calorie: 220, protein: 6.5, carb: 12.0, fat: 16.5,
    allergens: ["Laktoz (Yoğurt)", "Ceviz"],
    temp: "+4°C (Soğuk)",
    instructions: "Rendelenmiş havuç zeytinyağında yumuşayana dek sotelenir. Soğuyunca sarımsaklı süzme yoğurt ve kırık cevizle harmanlanır.",
    labor: 3.2, gas: 0.8, overhead: 0.5,
    ingredients: [
      { id: "ing_sal_12_1", name: "Rende Havuç (Sotelenmiş)", portionGrams: 90, unit: "g", unitCost: 30, portionCost: 2.7, wastagePercent: 8 },
      { id: "ing_sal_12_2", name: "Süzme Köy Yoğurdu & Sarımsak", portionGrams: 65, unit: "g", unitCost: 75, portionCost: 4.88, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_sal_12_3", name: "Kırık Ceviz İçi & Zeytinyağı", portionGrams: 20, unit: "g", unitCost: 300, portionCost: 6.0, wastagePercent: 0, allergen: "Ceviz" }
    ]
  }),
  createRecipe({
    id: "rec_sal_13", code: "REC-SAL-013",
    name: "Yoğurtlu Semizotu Salatası",
    category: "salad_appetizer", categoryLabel: "Salata & Meze",
    portionGrams: 190, prepTime: 12, cookTime: 0,
    calorie: 150, protein: 6.0, carb: 8.0, fat: 11.0,
    allergens: ["Laktoz (Yoğurt)"],
    temp: "+4°C (Soğuk)",
    instructions: "Taze körpe semizotu yaprakları sarımsaklı süzme yoğurt, zeytinyağı ve pul biber ile harmanlanır.",
    labor: 2.5, gas: 0.0, overhead: 0.4,
    ingredients: [
      { id: "ing_sal_13_1", name: "Körpe Semizotu Yaprakları", portionGrams: 110, unit: "g", unitCost: 35, portionCost: 3.85, wastagePercent: 10 },
      { id: "ing_sal_13_2", name: "Süzme Tava Yoğurdu & Sarımsak", portionGrams: 65, unit: "g", unitCost: 75, portionCost: 4.88, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_sal_13_3", name: "Sızma Zeytinyağı & Çörekotu", portionGrams: 12, unit: "ml", unitCost: 240, portionCost: 2.88, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_sal_14", code: "REC-SAL-014",
    name: "Kısır",
    category: "salad_appetizer", categoryLabel: "Salata & Meze",
    portionGrams: 200, prepTime: 20, cookTime: 0,
    calorie: 290, protein: 7.0, carb: 48.0, fat: 9.0,
    allergens: ["Gluten (Bulgur)"],
    temp: "+15°C (Ilık/Soğuk)",
    instructions: "İnce esmer bulgur sıcak su ve salçayla demlenir. İnce kıyılmış taze soğan, maydanoz, nane, nar ekşisi, limon ve zeytinyağı ile yoğrulur.",
    labor: 3.5, gas: 0.0, overhead: 0.5,
    ingredients: [
      { id: "ing_sal_14_1", name: "Köftelik İnce Esmer Bulgur", portionGrams: 75, unit: "g", unitCost: 45, portionCost: 3.38, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_sal_14_2", name: "Biber Salçası & Domates Salçası", portionGrams: 30, unit: "g", unitCost: 80, portionCost: 2.4, wastagePercent: 0 },
      { id: "ing_sal_14_3", name: "Taze Yeşillikler (Taze Soğan, Maydanoz, Nane)", portionGrams: 50, unit: "g", unitCost: 40, portionCost: 2.0, wastagePercent: 5 },
      { id: "ing_sal_14_4", name: "Hakiki Nar Ekşisi & Sızma Zeytinyağı", portionGrams: 25, unit: "ml", unitCost: 220, portionCost: 5.5, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_sal_15", code: "REC-SAL-015",
    name: "Mercimek Köftesi",
    category: "salad_appetizer", categoryLabel: "Salata & Meze",
    portionGrams: 220, prepTime: 25, cookTime: 20,
    calorie: 310, protein: 12.0, carb: 50.0, fat: 8.0,
    allergens: ["Gluten (Bulgur)"],
    temp: "+15°C (Ilık/Soğuk)",
    instructions: "Kırmızı mercimek haşlanır, ince bulgur eklenip şişirilir. Zeytinyağında kavrulmuş soğan ve salça eklenerek yoğrulur, maydanoz ve taze soğan katılıp elle sıkılır.",
    labor: 4.0, gas: 1.5, overhead: 0.6,
    ingredients: [
      { id: "ing_sal_15_1", name: "Kırmızı Mercimek", portionGrams: 65, unit: "g", unitCost: 48, portionCost: 3.12, wastagePercent: 0 },
      { id: "ing_sal_15_2", name: "Köftelik İnce Bulgur", portionGrams: 50, unit: "g", unitCost: 45, portionCost: 2.25, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_sal_15_3", name: "Karamelize Soğan & Salça Harcı", portionGrams: 45, unit: "g", unitCost: 65, portionCost: 2.93, wastagePercent: 0 },
      { id: "ing_sal_15_4", name: "Yeşillikler (Maydanoz, Taze Soğan) & Limon", portionGrams: 40, unit: "g", unitCost: 35, portionCost: 1.4, wastagePercent: 5 }
    ]
  }),
  createRecipe({
    id: "rec_sal_16", code: "REC-SAL-016",
    name: "Patlıcan Salatası (Közlenmiş)",
    category: "salad_appetizer", categoryLabel: "Salata & Meze",
    portionGrams: 190, prepTime: 20, cookTime: 15,
    calorie: 160, protein: 3.0, carb: 11.0, fat: 12.0,
    temp: "+4°C (Soğuk)",
    instructions: "Odun ateşinde közlenmiş patlıcanlar soyulup bıçakla dövülür; sarımsak, taze limon suyu ve erken hasat zeytinyağı ile çırpılır.",
    labor: 3.5, gas: 1.0, overhead: 0.5,
    ingredients: [
      { id: "ing_sal_16_1", name: "Közlenmiş Kemer Patlıcan", portionGrams: 150, unit: "g", unitCost: 65, portionCost: 9.75, wastagePercent: 20 },
      { id: "ing_sal_16_2", name: "Taşköprü Sarımsağı & Limon Suyu", portionGrams: 15, unit: "g", unitCost: 50, portionCost: 0.75, wastagePercent: 0 },
      { id: "ing_sal_16_3", name: "Erken Hasat Sızma Zeytinyağı", portionGrams: 18, unit: "ml", unitCost: 260, portionCost: 4.68, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_sal_17", code: "REC-SAL-017",
    name: "Pembe Sultan (Pancar Salatası)",
    category: "salad_appetizer", categoryLabel: "Salata & Meze",
    portionGrams: 190, prepTime: 15, cookTime: 25,
    calorie: 175, protein: 5.5, carb: 14.0, fat: 11.0,
    allergens: ["Laktoz (Yoğurt)"],
    temp: "+4°C (Soğuk)",
    instructions: "Fırınlanmış kırmızı pancar rendelenir, sarımsaklı süzme yoğurt ve zeytinyağı ile harmanlanarak göz alıcı pembe renge kavuşur.",
    labor: 3.2, gas: 1.2, overhead: 0.5,
    ingredients: [
      { id: "ing_sal_17_1", name: "Fırınlanmış Kırmızı Pancar", portionGrams: 110, unit: "g", unitCost: 35, portionCost: 3.85, wastagePercent: 12 },
      { id: "ing_sal_17_2", name: "Süzme Yoğurt & Ezilmiş Sarımsak", portionGrams: 65, unit: "g", unitCost: 75, portionCost: 4.88, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_sal_17_3", name: "Sızma Zeytinyağı & Dereotu", portionGrams: 12, unit: "g", unitCost: 200, portionCost: 2.4, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_sal_18", code: "REC-SAL-018",
    name: "Fava (Kuru Bakla Ezmesi)",
    category: "salad_appetizer", categoryLabel: "Salata & Meze",
    portionGrams: 190, prepTime: 20, cookTime: 40,
    calorie: 260, protein: 11.0, carb: 32.0, fat: 10.0,
    temp: "+4°C (Soğuk)",
    instructions: "Ege klasiği kuru iç bakla soğan, havuç, zeytinyağı ve dereotu ile pişirilip pürüzsüz ezilir; dondurulup dilimlenir, üzerine kırmızı soğan ve zeytinyağı konur.",
    labor: 4.0, gas: 2.0, overhead: 0.6,
    ingredients: [
      { id: "ing_sal_18_1", name: "Kuru Sarı İç Bakla", portionGrams: 85, unit: "g", unitCost: 85, portionCost: 7.23, wastagePercent: 0 },
      { id: "ing_sal_18_2", name: "Erken Hasat Sızma Zeytinyağı", portionGrams: 25, unit: "ml", unitCost: 260, portionCost: 6.5, wastagePercent: 0 },
      { id: "ing_sal_18_3", name: "Kırmızı Soğan, Taze Dereotu & Limon", portionGrams: 35, unit: "g", unitCost: 40, portionCost: 1.4, wastagePercent: 5 }
    ]
  }),
  createRecipe({
    id: "rec_sal_19", code: "REC-SAL-019",
    name: "Atom",
    category: "salad_appetizer", categoryLabel: "Salata & Meze",
    portionGrams: 170, prepTime: 12, cookTime: 8,
    calorie: 260, protein: 7.0, carb: 8.0, fat: 22.0,
    allergens: ["Laktoz (Süzme Yoğurt, Tereyağı)"],
    temp: "+4°C (Soğuk)",
    instructions: "Sarımsaklı yoğun süzme yoğurt tabağa yayılır. Üzerine kızgın tereyağında çevrilmiş çıtır kurutulmuş arnavut acı biberleri yağıyla birlikte cızırdayarak dökülür.",
    labor: 3.2, gas: 0.8, overhead: 0.5,
    ingredients: [
      { id: "ing_sal_19_1", name: "Koyu Süzme Köy Yoğurdu", portionGrams: 120, unit: "g", unitCost: 75, portionCost: 9.0, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_sal_19_2", name: "Kurutulmuş Acı Arnavut Biberi", portionGrams: 15, unit: "g", unitCost: 220, portionCost: 3.3, wastagePercent: 0 },
      { id: "ing_sal_19_3", name: "Köy Tereyağı & Sarımsak", portionGrams: 25, unit: "g", unitCost: 320, portionCost: 8.0, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_sal_20", code: "REC-SAL-020",
    name: "Çerkez Tavuğu (Soğuk Meze)",
    category: "salad_appetizer", categoryLabel: "Salata & Meze",
    portionGrams: 190, prepTime: 25, cookTime: 25,
    calorie: 350, protein: 24.0, carb: 12.0, fat: 24.0,
    allergens: ["Ceviz", "Gluten"],
    temp: "+4°C (Soğuk)",
    instructions: "İnce didiklenmiş tavuk göğsü sarımsak, ceviz püresi ve tavuk suyuyla kıvama getirilir; pul biberli ceviz yağı gezdirilir.",
    labor: 4.5, gas: 1.5, overhead: 0.6,
    ingredients: [
      { id: "ing_sal_20_1", name: "Tavuk Göğüs Eti (Tiftik)", portionGrams: 90, unit: "g", unitCost: 190, portionCost: 17.1, wastagePercent: 10 },
      { id: "ing_sal_20_2", name: "Çekilmiş Ceviz İçi & Baharat", portionGrams: 45, unit: "g", unitCost: 400, portionCost: 18.0, wastagePercent: 0, allergen: "Ceviz" },
      { id: "ing_sal_20_3", name: "Tavuk Suyu, Ekmek İçi & Ceviz Yağı", portionGrams: 30, unit: "g", unitCost: 90, portionCost: 2.7, wastagePercent: 0, allergen: "Gluten" }
    ]
  }),
  createRecipe({
    id: "rec_sal_21", code: "REC-SAL-021",
    name: "Haydari (Peynirli)",
    category: "salad_appetizer", categoryLabel: "Salata & Meze",
    portionGrams: 180, prepTime: 15, cookTime: 0,
    calorie: 250, protein: 10.0, carb: 7.0, fat: 21.0,
    allergens: ["Laktoz"],
    temp: "+4°C (Soğuk)",
    instructions: "Ezine olgunlaştırılmış beyaz peynir ezilip süzme yoğurt, dereotu, taze nane ve sarımsakla harmanlanır.",
    labor: 3.2, gas: 0.0, overhead: 0.5,
    ingredients: [
      { id: "ing_sal_21_1", name: "Süzme Yoğurt & Ezine Peyniri Karışımı", portionGrams: 150, unit: "g", unitCost: 110, portionCost: 16.5, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_sal_21_2", name: "Taze Nane, Dereotu & Zeytinyağı", portionGrams: 20, unit: "g", unitCost: 180, portionCost: 3.6, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_sal_22", code: "REC-SAL-022",
    name: "Zeytin Salatası (Antakya)",
    category: "salad_appetizer", categoryLabel: "Salata & Meze",
    portionGrams: 170, prepTime: 15, cookTime: 0,
    calorie: 240, protein: 3.0, carb: 10.0, fat: 22.0,
    allergens: ["Ceviz"],
    temp: "+4°C (Soğuk)",
    instructions: "Antakya kırma yeşil zeytini çekirdeksiz doğranır; taze zahter, ceviz, taze soğan, maydanoz, nar ekşisi ve sızma zeytinyağı ile karıştırılır.",
    labor: 3.5, gas: 0.0, overhead: 0.5,
    ingredients: [
      { id: "ing_sal_22_1", name: "Kırma Yeşil Halhalı Zeytin", portionGrams: 85, unit: "g", unitCost: 130, portionCost: 11.05, wastagePercent: 10 },
      { id: "ing_sal_22_2", name: "Kırık Ceviz & Taze Zahter", portionGrams: 30, unit: "g", unitCost: 350, portionCost: 10.5, wastagePercent: 0, allergen: "Ceviz" },
      { id: "ing_sal_22_3", name: "Taze Soğan, Nar Ekşisi & Sızma Zeytinyağı", portionGrams: 25, unit: "ml", unitCost: 220, portionCost: 5.5, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_sal_23", code: "REC-SAL-023",
    name: "Zahter Salatası",
    category: "salad_appetizer", categoryLabel: "Salata & Meze",
    portionGrams: 160, prepTime: 15, cookTime: 0,
    calorie: 180, protein: 3.0, carb: 9.0, fat: 16.0,
    temp: "+4°C (Soğuk)",
    instructions: "Taze yabani dağ kekiği (zahter), taze soğan, maydanoz, domates, bol nar ekşisi ve sızma zeytinyağı ile ferahlatıcı lezzet oluşturulur.",
    labor: 3.2, gas: 0.0, overhead: 0.5,
    ingredients: [
      { id: "ing_sal_23_1", name: "Taze Dağ Zahteri (Yabani Kekik)", portionGrams: 60, unit: "g", unitCost: 150, portionCost: 9.0, wastagePercent: 10 },
      { id: "ing_sal_23_2", name: "Küp Domates, Taze Soğan & Maydanoz", portionGrams: 65, unit: "g", unitCost: 35, portionCost: 2.28, wastagePercent: 5 },
      { id: "ing_sal_23_3", name: "Antakya Nar Ekşisi & Sızma Zeytinyağı", portionGrams: 22, unit: "ml", unitCost: 240, portionCost: 5.28, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_sal_24", code: "REC-SAL-024",
    name: "Nuraniye",
    category: "salad_appetizer", categoryLabel: "Salata & Meze",
    portionGrams: 190, prepTime: 20, cookTime: 12,
    calorie: 210, protein: 6.0, carb: 22.0, fat: 12.0,
    allergens: ["Laktoz (Yoğurt)"],
    temp: "+4°C (Soğuk)",
    instructions: "Rende kabak zeytinyağında pirinçle birlikte sotelenip pişirilir; dereotu, taze nane ve sarımsaklı yoğurtla birleştirilir.",
    labor: 3.5, gas: 1.0, overhead: 0.5,
    ingredients: [
      { id: "ing_sal_24_1", name: "Rende Sakız Kabağı & Pirinç", portionGrams: 100, unit: "g", unitCost: 40, portionCost: 4.0, wastagePercent: 5 },
      { id: "ing_sal_24_2", name: "Süzme Yoğurt & Sarımsak", portionGrams: 60, unit: "g", unitCost: 75, portionCost: 4.5, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_sal_24_3", name: "Taze Dereotu, Taze Nane & Zeytinyağı", portionGrams: 15, unit: "g", unitCost: 150, portionCost: 2.25, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_sal_25", code: "REC-SAL-025",
    name: "Girit Ezmesi",
    category: "salad_appetizer", categoryLabel: "Salata & Meze",
    portionGrams: 170, prepTime: 15, cookTime: 0,
    calorie: 290, protein: 11.0, carb: 6.0, fat: 26.0,
    allergens: ["Laktoz (Ezine, Lor)", "Fıstık (Antep Fıstığı)", "Ceviz"],
    temp: "+4°C (Soğuk)",
    instructions: "Ezine beyaz peynir, lor peyniri, çekilmiş Antep fıstığı, ceviz, sarımsak, taze fesleğen ve sızma zeytinyağı ile krema kıvamında yoğrulur.",
    labor: 3.5, gas: 0.0, overhead: 0.5,
    ingredients: [
      { id: "ing_sal_25_1", name: "Ezine Peyniri & Yağlı Lor", portionGrams: 100, unit: "g", unitCost: 180, portionCost: 18.0, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_sal_25_2", name: "Antep Fıstığı & Ceviz İçi (Çekilmiş)", portionGrams: 30, unit: "g", unitCost: 480, portionCost: 14.4, wastagePercent: 0, allergen: "Fıstık, Ceviz" },
      { id: "ing_sal_25_3", name: "Taze Fesleğen & Sızma Zeytinyağı", portionGrams: 20, unit: "ml", unitCost: 260, portionCost: 5.2, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_sal_26", code: "REC-SAL-026",
    name: "Mamzana",
    category: "salad_appetizer", categoryLabel: "Salata & Meze",
    portionGrams: 190, prepTime: 20, cookTime: 15,
    calorie: 160, protein: 3.5, carb: 12.0, fat: 11.0,
    temp: "+4°C (Soğuk)",
    instructions: "Közlenmiş patlıcan, köz kırmızı ve yeşil biber, domates ve sarımsak küp küp doğranıp maydanoz ve zeytinyağlı nar ekşisiyle harmanlanır.",
    labor: 3.5, gas: 1.0, overhead: 0.5,
    ingredients: [
      { id: "ing_sal_26_1", name: "Köz Patlıcan & Közlenmiş Biberler", portionGrams: 120, unit: "g", unitCost: 60, portionCost: 7.2, wastagePercent: 15 },
      { id: "ing_sal_26_2", name: "Küp Domates & Maydanoz", portionGrams: 45, unit: "g", unitCost: 35, portionCost: 1.58, wastagePercent: 5 },
      { id: "ing_sal_26_3", name: "Sarımsak, Nar Ekşisi & Zeytinyağı", portionGrams: 18, unit: "ml", unitCost: 220, portionCost: 3.96, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_sal_27", code: "REC-SAL-027",
    name: "Borani",
    category: "salad_appetizer", categoryLabel: "Salata & Meze",
    portionGrams: 190, prepTime: 15, cookTime: 10,
    calorie: 180, protein: 6.0, carb: 11.0, fat: 13.0,
    allergens: ["Laktoz"],
    temp: "+4°C (Soğuk)",
    instructions: "Kavrulmuş taze ıspanak yaprakları sarımsaklı yoğurtla karıştırılır; üstüne kızgın tereyağlı pul biber gezdirilir.",
    labor: 3.0, gas: 1.0, overhead: 0.5,
    ingredients: [
      { id: "ing_sal_27_1", name: "Sotelenmiş Taze Ispanak", portionGrams: 100, unit: "g", unitCost: 35, portionCost: 3.5, wastagePercent: 15 },
      { id: "ing_sal_27_2", name: "Süzme Yoğurt & Sarımsak", portionGrams: 65, unit: "g", unitCost: 75, portionCost: 4.88, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_sal_27_3", name: "Tereyağlı Kırmızı Biber Sosu", portionGrams: 15, unit: "g", unitCost: 280, portionCost: 4.2, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_sal_28", code: "REC-SAL-028",
    name: "Şalgamlı Kuskus Salatası",
    category: "salad_appetizer", categoryLabel: "Salata & Meze",
    portionGrams: 200, prepTime: 15, cookTime: 15,
    calorie: 240, protein: 6.0, carb: 42.0, fat: 6.5,
    allergens: ["Gluten"],
    temp: "+4°C (Soğuk)",
    instructions: "Kuskus makarna doğal acısız şalgam suyunda haşlanarak yakut kırmızısı renk alır; mısır, kornişon turşu, dereotu ve zeytinyağı ile harmanlanır.",
    labor: 3.2, gas: 1.0, overhead: 0.5,
    ingredients: [
      { id: "ing_sal_28_1", name: "Şalgam Suyunda Pişmiş Kuskus", portionGrams: 110, unit: "g", unitCost: 45, portionCost: 4.95, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_sal_28_2", name: "Kornişon Turşu & Tane Mısır", portionGrams: 50, unit: "g", unitCost: 45, portionCost: 2.25, wastagePercent: 5 },
      { id: "ing_sal_28_3", name: "Taze Dereotu & Sızma Zeytinyağı", portionGrams: 20, unit: "g", unitCost: 180, portionCost: 3.6, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_sal_29", code: "REC-SAL-029",
    name: "Yoğurtlu Kırmızı Biber Salatası",
    category: "salad_appetizer", categoryLabel: "Salata & Meze",
    portionGrams: 190, prepTime: 15, cookTime: 15,
    calorie: 190, protein: 6.0, carb: 12.0, fat: 13.0,
    allergens: ["Laktoz"],
    temp: "+4°C (Soğuk)",
    instructions: "Közlenmiş etli kırmızı kapya biberler jülyen dilimlenir; sarımsaklı süzme yoğurt, ceviz ve zeytinyağı ile servis edilir.",
    labor: 3.2, gas: 1.0, overhead: 0.5,
    ingredients: [
      { id: "ing_sal_29_1", name: "Közlenmiş Kırmızı Kapya Biber", portionGrams: 110, unit: "g", unitCost: 55, portionCost: 6.05, wastagePercent: 15 },
      { id: "ing_sal_29_2", name: "Sarımsaklı Süzme Yoğurt", portionGrams: 65, unit: "g", unitCost: 75, portionCost: 4.88, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_sal_29_3", name: "Sızma Zeytinyağı & Çörekotu", portionGrams: 12, unit: "ml", unitCost: 240, portionCost: 2.88, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_sal_30", code: "REC-SAL-030",
    name: "Semizotu Mezesi (Cevizli)",
    category: "salad_appetizer", categoryLabel: "Salata & Meze",
    portionGrams: 180, prepTime: 15, cookTime: 0,
    calorie: 200, protein: 6.0, carb: 9.0, fat: 16.0,
    allergens: ["Laktoz", "Ceviz"],
    temp: "+4°C (Soğuk)",
    instructions: "Körpe semizotu sarımsaklı süzme yoğurt, iri dövülmüş ceviz ve zeytinyağıyla karıştırılır.",
    labor: 3.0, gas: 0.0, overhead: 0.5,
    ingredients: [
      { id: "ing_sal_30_1", name: "Taze Semizotu", portionGrams: 100, unit: "g", unitCost: 35, portionCost: 3.5, wastagePercent: 10 },
      { id: "ing_sal_30_2", name: "Süzme Yoğurt & Sarımsak", portionGrams: 60, unit: "g", unitCost: 75, portionCost: 4.5, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_sal_30_3", name: "Kırık Ceviz İçi & Zeytinyağı", portionGrams: 20, unit: "g", unitCost: 360, portionCost: 7.2, wastagePercent: 0, allergen: "Ceviz" }
    ]
  }),
  createRecipe({
    id: "rec_sal_31", code: "REC-SAL-031",
    name: "Havuç Tarator",
    category: "salad_appetizer", categoryLabel: "Salata & Meze",
    portionGrams: 180, prepTime: 15, cookTime: 10,
    calorie: 210, protein: 5.5, carb: 13.0, fat: 15.5,
    allergens: ["Laktoz"],
    temp: "+4°C (Soğuk)",
    instructions: "Rendelenmiş havuçlar az zeytinyağında rengini bırakana kadar sotelenir; soğuyunca sarımsaklı süzme yoğurtla birleştirilir.",
    labor: 3.0, gas: 0.8, overhead: 0.5,
    ingredients: [
      { id: "ing_sal_31_1", name: "Taze Havuç (Sotelenmiş)", portionGrams: 100, unit: "g", unitCost: 30, portionCost: 3.0, wastagePercent: 8 },
      { id: "ing_sal_31_2", name: "Süzme Köy Yoğurdu & Sarımsak", portionGrams: 65, unit: "g", unitCost: 75, portionCost: 4.88, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_sal_31_3", name: "Sızma Zeytinyağı & Maydanoz", portionGrams: 12, unit: "ml", unitCost: 220, portionCost: 2.64, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_sal_32", code: "REC-SAL-032",
    name: "Kabak Tarator",
    category: "salad_appetizer", categoryLabel: "Salata & Meze",
    portionGrams: 180, prepTime: 15, cookTime: 10,
    calorie: 185, protein: 5.5, carb: 10.0, fat: 14.0,
    allergens: ["Laktoz", "Ceviz"],
    temp: "+4°C (Soğuk)",
    instructions: "Rende sakız kabağının suyu sıkılıp zeytinyağında sotelenir; sarımsaklı süzme yoğurt, dövülmüş ceviz ve taze dereotu ile lezzetlendirilir.",
    labor: 3.0, gas: 0.8, overhead: 0.5,
    ingredients: [
      { id: "ing_sal_32_1", name: "Sıkılmış Sakız Kabağı (Sotelenmiş)", portionGrams: 95, unit: "g", unitCost: 35, portionCost: 3.33, wastagePercent: 15 },
      { id: "ing_sal_32_2", name: "Süzme Yoğurt, Dereotu & Sarımsak", portionGrams: 65, unit: "g", unitCost: 80, portionCost: 5.2, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_sal_32_3", name: "Ceviz İçi & Zeytinyağı", portionGrams: 18, unit: "g", unitCost: 320, portionCost: 5.76, wastagePercent: 0, allergen: "Ceviz" }
    ]
  })
];

const fileContent = `import { FoodRecipe } from "../../types";

export const saladRecipes: FoodRecipe[] = ${JSON.stringify(salads, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '../src/data/recipes/saladRecipes.ts'), fileContent, 'utf8');
console.log(`Generated ${salads.length} salad recipes successfully.`);
