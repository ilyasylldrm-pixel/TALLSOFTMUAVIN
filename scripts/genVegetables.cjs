const fs = require('fs');
const path = require('path');
const { createRecipe } = require('./recipeHelper.cjs');

const vegetables = [
  createRecipe({
    id: "rec_seb_01", code: "REC-SEB-001",
    name: "Zeytinyağlı Enginar",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 230, prepTime: 25, cookTime: 35,
    calorie: 210, protein: 5.0, carb: 22.0, fat: 12.0,
    temp: "+15°C (Ilık/Soğuk)",
    instructions: "Çanak enginarlar limonlu suda bekletilir. Havuç, patates ve bezelyeli garnitür limon suyu, sızma zeytinyağı ve dereotu ile kısık ateşte pişirilir.",
    labor: 5.5, gas: 2.2, overhead: 0.8,
    ingredients: [
      { id: "ing_seb_01_1", name: "Çanak Enginar (Urla Sakız)", portionGrams: 120, unit: "g", unitCost: 140, portionCost: 16.8, wastagePercent: 5 },
      { id: "ing_seb_01_2", name: "Havuç, Patates & Taze Bezelye Garnitürü", portionGrams: 60, unit: "g", unitCost: 40, portionCost: 2.4, wastagePercent: 5 },
      { id: "ing_seb_01_3", name: "Ege Erken Hasat Sızma Zeytinyağı", portionGrams: 20, unit: "ml", unitCost: 260, portionCost: 5.2, wastagePercent: 0 },
      { id: "ing_etl_01_4", name: "Taze Limon Suyu & İnce Kıyım Dereotu", portionGrams: 15, unit: "g", unitCost: 50, portionCost: 0.75, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_seb_02", code: "REC-SEB-002",
    name: "Zeytinyağlı Yaprak Sarma",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 220, prepTime: 50, cookTime: 45,
    calorie: 310, protein: 6.0, carb: 42.0, fat: 14.0,
    allergens: ["Fıstık (Dolmalık Fıstık)"],
    temp: "+15°C (Ilık/Soğuk)",
    instructions: "Tokat Erbaa yapraklarına pirinç, dolmalık fıstık, kuş üzümü, nane, tarçın ve bol karamelize soğanlı iç sarılıp zeytinyağı ve limon dilimleriyle pişirilir.",
    labor: 7.5, gas: 2.5, overhead: 1.0,
    ingredients: [
      { id: "ing_seb_02_1", name: "Tokat Asma Yaprağı", portionGrams: 45, unit: "g", unitCost: 130, portionCost: 5.85, wastagePercent: 5 },
      { id: "ing_seb_02_2", name: "Baldo Pirinç & Karamelize Soğan", portionGrams: 85, unit: "g", unitCost: 65, portionCost: 5.53, wastagePercent: 5 },
      { id: "ing_seb_02_3", name: "Dolmalık Fıstık & Kuş Üzümü", portionGrams: 15, unit: "g", unitCost: 450, portionCost: 6.75, wastagePercent: 0, allergen: "Fıstık" },
      { id: "ing_seb_02_4", name: "Sızma Zeytinyağı & Baharatlar", portionGrams: 20, unit: "ml", unitCost: 260, portionCost: 5.2, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_seb_03", code: "REC-SEB-003",
    name: "İmam Bayıldı",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 240, prepTime: 30, cookTime: 40,
    calorie: 260, protein: 4.0, carb: 20.0, fat: 18.0,
    temp: "+15°C (Ilık/Soğuk)",
    instructions: "Kemer patlıcanlar alacalı soyulup zeytinyağında hafifletilir. İçine bol piyazlık soğan, sarımsak ve domates harcı doldurularak fırında demlendirilir.",
    labor: 6.0, gas: 2.5, overhead: 0.8,
    ingredients: [
      { id: "ing_seb_03_1", name: "Kemer Patlıcan", portionGrams: 140, unit: "g", unitCost: 40, portionCost: 5.6, wastagePercent: 10 },
      { id: "ing_seb_03_2", name: "Piyazlık Soğan, Sarımsak & Domates", portionGrams: 90, unit: "g", unitCost: 35, portionCost: 3.15, wastagePercent: 5 },
      { id: "ing_seb_03_3", name: "Sızma Zeytinyağı & Maydanoz", portionGrams: 22, unit: "ml", unitCost: 260, portionCost: 5.72, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_seb_04", code: "REC-SEB-004",
    name: "Zeytinyağlı Taze Fasulye",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 240, prepTime: 25, cookTime: 40,
    calorie: 180, protein: 4.5, carb: 18.0, fat: 10.0,
    temp: "+15°C (Ilık/Soğuk)",
    instructions: "Ayıklanmış taze çalı fasulyesi soğan, bol domates ve sızma zeytinyağı ile kendi suyunda kısık ateşte pişirilir.",
    labor: 5.0, gas: 2.2, overhead: 0.8,
    ingredients: [
      { id: "ing_seb_04_1", name: "Taze Çalı / Ayşekadın Fasulye", portionGrams: 150, unit: "g", unitCost: 55, portionCost: 8.25, wastagePercent: 12 },
      { id: "ing_seb_04_2", name: "Rende Domates & Yemeklik Kuru Soğan", portionGrams: 70, unit: "g", unitCost: 30, portionCost: 2.1, wastagePercent: 5 },
      { id: "ing_seb_04_3", name: "Sızma Zeytinyağı & Kesme Şeker", portionGrams: 18, unit: "ml", unitCost: 260, portionCost: 4.68, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_seb_05", code: "REC-SEB-005",
    name: "Zeytinyağlı Kereviz",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 230, prepTime: 20, cookTime: 35,
    calorie: 195, protein: 3.5, carb: 20.0, fat: 11.0,
    allergens: ["Kereviz"],
    temp: "+15°C (Ilık/Soğuk)",
    instructions: "Küp doğranmış kereviz yumrusu, havuç, patates ve taze sıkılmış portakal suyu ile sızma zeytinyağında yapraklarıyla pişirilir.",
    labor: 5.0, gas: 2.2, overhead: 0.8,
    ingredients: [
      { id: "ing_seb_05_1", name: "Kök Kereviz & Taze Yaprakları", portionGrams: 130, unit: "g", unitCost: 45, portionCost: 5.85, wastagePercent: 18, allergen: "Kereviz" },
      { id: "ing_seb_05_2", name: "Havuç & Patates Küpleri", portionGrams: 50, unit: "g", unitCost: 25, portionCost: 1.25, wastagePercent: 8 },
      { id: "ing_seb_05_3", name: "Taze Sıkma Portakal Suyu & Sızma Zeytinyağı", portionGrams: 30, unit: "ml", unitCost: 150, portionCost: 4.5, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_seb_06", code: "REC-SEB-006",
    name: "Şakşuka",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 230, prepTime: 25, cookTime: 25,
    calorie: 250, protein: 4.0, carb: 22.0, fat: 16.0,
    temp: "+15°C (Ilık/Soğuk)",
    instructions: "Küp küp doğranıp kızartılmış patlıcan, kabak ve biberlerin üzerine sarımsaklı zengin domates sosu gezdirilir.",
    labor: 5.5, gas: 2.5, overhead: 0.8,
    ingredients: [
      { id: "ing_seb_06_1", name: "Kemer Patlıcan & Sakız Kabak", portionGrams: 120, unit: "g", unitCost: 40, portionCost: 4.8, wastagePercent: 12 },
      { id: "ing_etl_06_2", name: "Köy Biberi & Kapya", portionGrams: 35, unit: "g", unitCost: 35, portionCost: 1.23, wastagePercent: 8 },
      { id: "ing_etl_06_3", name: "Sarımsaklı Domates Sosu & Sıvı Yağ", portionGrams: 50, unit: "g", unitCost: 60, portionCost: 3.0, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_seb_07", code: "REC-SEB-07",
    name: "Kabak Çiçeği Dolması",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 210, prepTime: 40, cookTime: 30,
    calorie: 280, protein: 5.0, carb: 36.0, fat: 12.0,
    allergens: ["Fıstık (Dolmalık Fıstık)"],
    temp: "+15°C (Ilık/Soğuk)",
    instructions: "Sabahın ilk ışıklarında toplanan taze kabak çiçekleri nane, dereotu, fıstıklı zeytinyağlı harçla narince doldurulup hafif ateşte demlendirilir.",
    labor: 7.5, gas: 2.0, overhead: 1.0,
    ingredients: [
      { id: "ing_seb_07_1", name: "Taze Kabak Çiçeği (6 adet)", portionGrams: 60, unit: "g", unitCost: 200, portionCost: 12.0, wastagePercent: 5 },
      { id: "ing_seb_07_2", name: "Pirinçli Dolma Harcı & Otlar", portionGrams: 80, unit: "g", unitCost: 65, portionCost: 5.2, wastagePercent: 0 },
      { id: "ing_seb_07_3", name: "Sızma Zeytinyağı & Dolmalık Fıstık", portionGrams: 20, unit: "g", unitCost: 280, portionCost: 5.6, wastagePercent: 0, allergen: "Fıstık" }
    ]
  }),
  createRecipe({
    id: "rec_seb_08", code: "REC-SEB-008",
    name: "Mücver",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 220, prepTime: 25, cookTime: 20,
    calorie: 290, protein: 10.0, carb: 22.0, fat: 18.0,
    allergens: ["Gluten", "Yumurta", "Laktoz (Beyaz Peynir)"],
    instructions: "Rendelenip suyu sıkılan taze kabaklar yumurta, un, beyaz peynir, taze soğan, dereotu ve nane ile harmanlanıp altın sarısı kızartılır.",
    labor: 5.5, gas: 2.2, overhead: 0.8,
    ingredients: [
      { id: "ing_seb_08_1", name: "Taze Sakız Kabağı (Suyu Sıkılmış)", portionGrams: 140, unit: "g", unitCost: 35, portionCost: 4.9, wastagePercent: 15 },
      { id: "ing_seb_08_2", name: "Köy Yumurtası & Buğday Unu", portionGrams: 35, unit: "g", unitCost: 70, portionCost: 2.45, wastagePercent: 0, allergen: "Yumurta, Gluten" },
      { id: "ing_seb_08_3", name: "Ezine Beyaz Peynir & Yeşillikler", portionGrams: 30, unit: "g", unitCost: 180, portionCost: 5.4, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_seb_08_4", name: "Kızartma Sıvı Yağı", portionGrams: 20, unit: "ml", unitCost: 75, portionCost: 1.5, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_seb_09", code: "REC-SEB-009",
    name: "Türlü (Sebze Güveç)",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 260, prepTime: 25, cookTime: 50,
    calorie: 210, protein: 6.0, carb: 26.0, fat: 10.0,
    instructions: "Toprak güveçte patlıcan, kabak, patates, taze fasulye, bamya, sarımsak ve domates sızma zeytinyağı ile kısık ateşte güveçlenir.",
    labor: 5.5, gas: 3.0, overhead: 0.8,
    ingredients: [
      { id: "ing_seb_09_1", name: "Mevsim Sebzeleri Karışımı (Patlıcan, Kabak, Fasulye, Patates)", portionGrams: 180, unit: "g", unitCost: 38, portionCost: 6.84, wastagePercent: 12 },
      { id: "ing_seb_09_2", name: "Domates, Sarımsak & Biber", portionGrams: 50, unit: "g", unitCost: 35, portionCost: 1.75, wastagePercent: 5 },
      { id: "ing_seb_09_3", name: "Zeytinyağı & Domates Salçası", portionGrams: 18, unit: "g", unitCost: 120, portionCost: 2.16, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_seb_10", code: "REC-SEB-010",
    name: "Zeytinyağlı Pırasa",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 240, prepTime: 20, cookTime: 35,
    calorie: 190, protein: 3.5, carb: 26.0, fat: 8.5,
    temp: "+15°C (Ilık/Soğuk)",
    instructions: "Verev doğranmış pırasa, havuç, az pirinç ve taze limon/portakal suyu ile sızma zeytinyağında pişirilir.",
    labor: 5.0, gas: 2.0, overhead: 0.8,
    ingredients: [
      { id: "ing_seb_10_1", name: "Taze Pırasa (Verev Doğranmış)", portionGrams: 150, unit: "g", unitCost: 35, portionCost: 5.25, wastagePercent: 15 },
      { id: "ing_seb_10_2", name: "Havuç Dilimleri & Baldo Pirinç", portionGrams: 45, unit: "g", unitCost: 40, portionCost: 1.8, wastagePercent: 5 },
      { id: "ing_seb_10_3", name: "Sızma Zeytinyağı & Taze Limon Suyu", portionGrams: 18, unit: "ml", unitCost: 240, portionCost: 4.32, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_seb_11", code: "REC-SEB-011",
    name: "Zeytinyağlı Bakla (Dereotlu)",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 230, prepTime: 20, cookTime: 35,
    calorie: 200, protein: 7.0, carb: 24.0, fat: 9.0,
    allergens: ["Laktoz (Yoğurt)"],
    temp: "+15°C (Ilık/Soğuk)",
    instructions: "Taze yeşil baklalar unlu limonlu suda bekletilip zeytinyağında pişirilir; bol taze dereotu ve sarımsaklı yoğurtla servis edilir.",
    labor: 5.0, gas: 2.2, overhead: 0.8,
    ingredients: [
      { id: "ing_seb_11_1", name: "Taze Sakız Baklası", portionGrams: 150, unit: "g", unitCost: 65, portionCost: 9.75, wastagePercent: 12 },
      { id: "ing_seb_11_2", name: "Sızma Zeytinyağı & Bol Dereotu", portionGrams: 25, unit: "g", unitCost: 180, portionCost: 4.5, wastagePercent: 0 },
      { id: "ing_seb_11_3", name: "Süzme Yoğurt Garnitürü", portionGrams: 40, unit: "g", unitCost: 75, portionCost: 3.0, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_seb_12", code: "REC-SEB-012",
    name: "Zeytinyağlı Bamya",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 220, prepTime: 25, cookTime: 35,
    calorie: 175, protein: 4.0, carb: 18.0, fat: 9.5,
    temp: "+15°C (Ilık/Soğuk)",
    instructions: "Konik soyulmuş taze kınalı bamya domates, limon suyu, arpacık soğan ve sızma zeytinyağı ile salyalanmadan pişirilir.",
    labor: 5.5, gas: 2.2, overhead: 0.8,
    ingredients: [
      { id: "ing_seb_12_1", name: "Taze Kınalı Bamya", portionGrams: 130, unit: "g", unitCost: 95, portionCost: 12.35, wastagePercent: 15 },
      { id: "ing_seb_12_2", name: "Rende Domates & Arpacık Soğan", portionGrams: 55, unit: "g", unitCost: 35, portionCost: 1.93, wastagePercent: 5 },
      { id: "ing_seb_12_3", name: "Taze Limon Suyu & Sızma Zeytinyağı", portionGrams: 20, unit: "ml", unitCost: 240, portionCost: 4.8, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_seb_13", code: "REC-SEB-013",
    name: "Ispanak Yemeği (Yoğurtlu / Yumurtalı)",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 250, prepTime: 20, cookTime: 25,
    calorie: 220, protein: 8.0, carb: 18.0, fat: 12.0,
    allergens: ["Laktoz (Yoğurt)"],
    instructions: "Ayıklanıp yıkanmış körpe ıspanaklar soğan, az pirinç ve zeytinyağında sotelenip pişirilir; sarımsaklı süzme yoğurt ile servis edilir.",
    labor: 5.0, gas: 2.0, overhead: 0.8,
    ingredients: [
      { id: "ing_seb_13_1", name: "Körpe Kök Ispanak", portionGrams: 170, unit: "g", unitCost: 35, portionCost: 5.95, wastagePercent: 18 },
      { id: "ing_seb_13_2", name: "Baldo Pirinç & Kuru Soğan", portionGrams: 30, unit: "g", unitCost: 50, portionCost: 1.5, wastagePercent: 5 },
      { id: "ing_seb_13_3", name: "Süzme Tava Yoğurdu", portionGrams: 50, unit: "g", unitCost: 75, portionCost: 3.75, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_seb_13_4", name: "Sızma Zeytinyağı", portionGrams: 15, unit: "ml", unitCost: 240, portionCost: 3.6, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_seb_14", code: "REC-SEB-014",
    name: "Zeytinyağlı Barbunya Pilaki",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 240, prepTime: 20, cookTime: 45,
    calorie: 290, protein: 12.0, carb: 38.0, fat: 10.0,
    temp: "+15°C (Ilık/Soğuk)",
    instructions: "Taze barbunya havuç, patates, sarımsak, soğan ve sızma zeytinyağı ile pilaki kıvamında pişirilip bol maydanoz ve limonla servis edilir.",
    labor: 5.0, gas: 2.5, overhead: 0.8,
    ingredients: [
      { id: "ing_seb_14_1", name: "Taze Ayıklanmış Barbunya", portionGrams: 120, unit: "g", unitCost: 85, portionCost: 10.2, wastagePercent: 0 },
      { id: "ing_seb_14_2", name: "Havuç, Patates & Kuru Soğan Küpleri", portionGrams: 65, unit: "g", unitCost: 30, portionCost: 1.95, wastagePercent: 8 },
      { id: "ing_seb_14_3", name: "Sızma Zeytinyağı, Sarımsak & Maydanoz", portionGrams: 22, unit: "ml", unitCost: 240, portionCost: 5.28, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_seb_15", code: "REC-SEB-015",
    name: "Etli Taze Fasulye",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 260, prepTime: 25, cookTime: 50,
    calorie: 310, protein: 18.0, carb: 16.0, fat: 18.0,
    instructions: "Dana kuşbaşı etler hafif kavrulup taze ayşekadın fasulye, soğan, domates ve tereyağı ile helmelenerek pişirilir.",
    labor: 6.0, gas: 3.2, overhead: 1.0,
    ingredients: [
      { id: "ing_seb_15_1", name: "Dana Kuşbaşı", portionGrams: 60, unit: "g", unitCost: 440, portionCost: 26.4, wastagePercent: 18 },
      { id: "ing_seb_15_2", name: "Taze Ayşekadın Fasulye", portionGrams: 140, unit: "g", unitCost: 55, portionCost: 7.7, wastagePercent: 10 },
      { id: "ing_seb_15_3", name: "Domates, Soğan & Tereyağı", portionGrams: 40, unit: "g", unitCost: 70, portionCost: 2.8, wastagePercent: 5 }
    ]
  }),
  createRecipe({
    id: "rec_seb_16", code: "REC-SEB-016",
    name: "Etli Bezelye",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 260, prepTime: 20, cookTime: 45,
    calorie: 330, protein: 20.0, carb: 24.0, fat: 16.0,
    instructions: "Kuşbaşı dana eti havuç, patates ve tatlı taze bezelye ile salçalı et suyunda pişirilir.",
    labor: 5.5, gas: 3.0, overhead: 1.0,
    ingredients: [
      { id: "ing_seb_16_1", name: "Dana Kuşbaşı", portionGrams: 60, unit: "g", unitCost: 440, portionCost: 26.4, wastagePercent: 18 },
      { id: "ing_seb_16_2", name: "Taze İç Bezelye", portionGrams: 100, unit: "g", unitCost: 65, portionCost: 6.5, wastagePercent: 0 },
      { id: "ing_seb_16_3", name: "Havuç, Patates & Salçalı Sos", portionGrams: 55, unit: "g", unitCost: 40, portionCost: 2.2, wastagePercent: 8 }
    ]
  }),
  createRecipe({
    id: "rec_seb_17", code: "REC-SEB-017",
    name: "Karnabahar Yemeği (Kıymalı)",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 250, prepTime: 20, cookTime: 35,
    calorie: 280, protein: 16.0, carb: 16.0, fat: 17.0,
    instructions: "Çiçeklerine ayrılmış karnabahar dana kıyma, havuç, soğan ve salçalı sıcak suda kısık ateşte pişirilir.",
    labor: 5.5, gas: 2.5, overhead: 0.8,
    ingredients: [
      { id: "ing_seb_17_1", name: "Karnabahar (Çiçek)", portionGrams: 150, unit: "g", unitCost: 35, portionCost: 5.25, wastagePercent: 15 },
      { id: "ing_seb_17_2", name: "Dana Kıyma", portionGrams: 50, unit: "g", unitCost: 420, portionCost: 21.0, wastagePercent: 12 },
      { id: "ing_seb_17_3", name: "Havuç, Kuru Soğan & Salça", portionGrams: 35, unit: "g", unitCost: 35, portionCost: 1.23, wastagePercent: 5 }
    ]
  }),
  createRecipe({
    id: "rec_seb_18", code: "REC-SEB-018",
    name: "Kapuska (Kıymalı Lahana)",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 260, prepTime: 20, cookTime: 40,
    calorie: 290, protein: 16.0, carb: 18.0, fat: 17.0,
    instructions: "İnce doğranmış beyaz lahana kıyma, soğan, biber salçası ve acı pul biberle kavrulup suyunu çekene kadar pişirilir.",
    labor: 5.5, gas: 2.5, overhead: 0.8,
    ingredients: [
      { id: "ing_seb_18_1", name: "Beyaz Lahana (İnce Doğranmış)", portionGrams: 160, unit: "g", unitCost: 22, portionCost: 3.52, wastagePercent: 15 },
      { id: "ing_seb_18_2", name: "Dana Kıyma", portionGrams: 50, unit: "g", unitCost: 420, portionCost: 21.0, wastagePercent: 12 },
      { id: "ing_seb_18_3", name: "Biber Salçası, Soğan & Tereyağı", portionGrams: 30, unit: "g", unitCost: 80, portionCost: 2.4, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_seb_19", code: "REC-SEB-019",
    name: "Pazı Sarması",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 240, prepTime: 35, cookTime: 35,
    calorie: 330, protein: 18.0, carb: 25.0, fat: 17.0,
    allergens: ["Laktoz (Yoğurt)"],
    instructions: "Geniş pazı yapraklarına kıymalı pirinçli harç sarılır; tencerede kısık ateşte pişirilip sarımsaklı yoğurt sosuyla servis edilir.",
    labor: 6.5, gas: 2.5, overhead: 1.0,
    ingredients: [
      { id: "ing_seb_19_1", name: "Taze Pazı Yaprakları", portionGrams: 80, unit: "g", unitCost: 35, portionCost: 2.8, wastagePercent: 15 },
      { id: "ing_seb_19_2", name: "Kıymalı Pirinç Dolma Harcı", portionGrams: 90, unit: "g", unitCost: 260, portionCost: 23.4, wastagePercent: 5 },
      { id: "ing_seb_19_3", name: "Sarımsaklı Süzme Yoğurt", portionGrams: 50, unit: "g", unitCost: 75, portionCost: 3.75, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_seb_20", code: "REC-SEB-020",
    name: "Biber Dolması (Zeytinyağlı)",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 230, prepTime: 30, cookTime: 40,
    calorie: 290, protein: 4.5, carb: 40.0, fat: 12.0,
    allergens: ["Fıstık (Dolmalık Fıstık)"],
    temp: "+15°C (Ilık/Soğuk)",
    instructions: "Dolmalık biberler fıstıklı, üzümlü, naneli zeytinyağlı pirinç harcıyla doldurulur; domates kapakla kısık ateşte pişirilir.",
    labor: 5.5, gas: 2.2, overhead: 0.8,
    ingredients: [
      { id: "ing_seb_20_1", name: "Dolmalık Biber (3 adet)", portionGrams: 90, unit: "g", unitCost: 40, portionCost: 3.6, wastagePercent: 10 },
      { id: "ing_seb_20_2", name: "Zeytinyağlı Dolma İçi (Pirinç, Fıstık, Üzüm)", portionGrams: 95, unit: "g", unitCost: 110, portionCost: 10.45, wastagePercent: 0, allergen: "Fıstık" },
      { id: "ing_seb_20_3", name: "Sızma Zeytinyağı & Domates Kapak", portionGrams: 20, unit: "g", unitCost: 160, portionCost: 3.2, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_seb_21", code: "REC-SEB-021",
    name: "Lahana Sarması (Zeytinyağlı)",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 230, prepTime: 40, cookTime: 45,
    calorie: 300, protein: 5.0, carb: 42.0, fat: 13.0,
    allergens: ["Fıstık"],
    temp: "+15°C (Ilık/Soğuk)",
    instructions: "Haşlanmış sarmalık beyaz lahana yapraklarına fıstıklı baharatlı zeytinyağlı pirinç sarılır; zeytinyağı gezdirilerek pişirilir.",
    labor: 6.5, gas: 2.5, overhead: 1.0,
    ingredients: [
      { id: "ing_seb_21_1", name: "Sarmalık Beyaz Lahana", portionGrams: 80, unit: "g", unitCost: 22, portionCost: 1.76, wastagePercent: 20 },
      { id: "ing_seb_21_2", name: "Zeytinyağlı Pirinç Dolma Harcı", portionGrams: 100, unit: "g", unitCost: 95, portionCost: 9.5, wastagePercent: 0, allergen: "Fıstık" },
      { id: "ing_seb_21_3", name: "Sızma Zeytinyağı & Limon", portionGrams: 20, unit: "ml", unitCost: 240, portionCost: 4.8, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_seb_22", code: "REC-SEB-022",
    name: "Kuru Patlıcan Dolması (Zeytinyağlı)",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 230, prepTime: 35, cookTime: 45,
    calorie: 310, protein: 5.5, carb: 44.0, fat: 13.0,
    temp: "+15°C (Ilık/Soğuk)",
    instructions: "Gaziantep kuru patlıcanları nar ekşisi, sumak ekşisi, bol soğan ve zeytinyağlı pirinç harcıyla doldurulup soğuk servis edilir.",
    labor: 6.5, gas: 2.5, overhead: 1.0,
    ingredients: [
      { id: "ing_seb_22_1", name: "Kurutulmuş Antep Patlıcanı (4 adet)", portionGrams: 35, unit: "g", unitCost: 240, portionCost: 8.4, wastagePercent: 0 },
      { id: "ing_seb_22_2", name: "Ekşili Zeytinyağlı Pirinç Harcı", portionGrams: 100, unit: "g", unitCost: 85, portionCost: 8.5, wastagePercent: 0 },
      { id: "ing_seb_22_3", name: "Sızma Zeytinyağı & Nar Ekşisi", portionGrams: 22, unit: "ml", unitCost: 200, portionCost: 4.4, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_seb_23", code: "REC-SEB-023",
    name: "Semizotu Yemeği (Pirinçli)",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 240, prepTime: 15, cookTime: 20,
    calorie: 170, protein: 4.5, carb: 16.0, fat: 9.0,
    allergens: ["Laktoz (Yoğurt)"],
    instructions: "Ayıklanmış taze semizotu soğan, domates ve az pirinçle hafif ateşte pişirilir; sarımsaklı süzme yoğurtla servis edilir.",
    labor: 4.5, gas: 1.8, overhead: 0.8,
    ingredients: [
      { id: "ing_seb_23_1", name: "Taze Semizotu", portionGrams: 160, unit: "g", unitCost: 35, portionCost: 5.6, wastagePercent: 12 },
      { id: "ing_seb_23_2", name: "Baldo Pirinç & Kuru Soğan", portionGrams: 25, unit: "g", unitCost: 50, portionCost: 1.25, wastagePercent: 5 },
      { id: "ing_seb_23_3", name: "Süzme Yoğurt Garnitür & Zeytinyağı", portionGrams: 45, unit: "g", unitCost: 95, portionCost: 4.28, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_seb_24", code: "REC-SEB-024",
    name: "Borani (Ispanaklı / Pazılı)",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 240, prepTime: 20, cookTime: 20,
    calorie: 240, protein: 8.0, carb: 14.0, fat: 16.0,
    allergens: ["Laktoz (Yoğurt, Tereyağı)"],
    instructions: "Haşlanıp suyu sıkılan ıspanak/pazı sarımsaklı süzme yoğurtla karıştırılır; üzerine tereyağında kavrulmuş pul biber ve ceviz gezdirilir.",
    labor: 5.0, gas: 1.5, overhead: 0.8,
    ingredients: [
      { id: "ing_seb_24_1", name: "Haşlanmış Ispanak / Pazı", portionGrams: 130, unit: "g", unitCost: 35, portionCost: 4.55, wastagePercent: 20 },
      { id: "ing_seb_24_2", name: "Sarımsaklı Süzme Tava Yoğurdu", portionGrams: 80, unit: "g", unitCost: 75, portionCost: 6.0, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_seb_24_3", name: "Tereyağı & Pul Biber", portionGrams: 15, unit: "g", unitCost: 320, portionCost: 4.8, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_seb_25", code: "REC-SEB-025",
    name: "Kabak Kalye",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 230, prepTime: 20, cookTime: 25,
    calorie: 195, protein: 4.0, carb: 18.0, fat: 12.0,
    allergens: ["Laktoz (Yoğurt)"],
    instructions: "Osmanlı saray mutfağı usulü halka kabaklar zeytinyağında sarımsak ve koruk/limon ekşisiyle pişirilir; dereotu ile süslenir.",
    labor: 5.0, gas: 2.0, overhead: 0.8,
    ingredients: [
      { id: "ing_seb_25_1", name: "Sakız Kabağı (Halka)", portionGrams: 160, unit: "g", unitCost: 35, portionCost: 5.6, wastagePercent: 10 },
      { id: "ing_seb_25_2", name: "Sızma Zeytinyağı & Koruk Ekşisi", portionGrams: 22, unit: "ml", unitCost: 220, portionCost: 4.84, wastagePercent: 0 },
      { id: "ing_seb_25_3", name: "Taze Dereotu & Sarımsak", portionGrams: 15, unit: "g", unitCost: 50, portionCost: 0.75, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_seb_26", code: "REC-SEB-026",
    name: "Karalahana Sarması",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 250, prepTime: 40, cookTime: 45,
    calorie: 350, protein: 18.0, carb: 28.0, fat: 18.0,
    instructions: "Karadeniz usulü körpe karalahana yapraklarına kıymalı veya mısır yarmalı pirinçli harç sarılır; kemik suyu ve tereyağı ile pişirilir.",
    labor: 6.5, gas: 2.5, overhead: 1.0,
    ingredients: [
      { id: "ing_seb_26_1", name: "Taze Karalahana Yaprağı", portionGrams: 85, unit: "g", unitCost: 35, portionCost: 2.98, wastagePercent: 15 },
      { id: "ing_seb_26_2", name: "Dana Kıyma & Pirinç Harcı", portionGrams: 100, unit: "g", unitCost: 280, portionCost: 28.0, wastagePercent: 5 },
      { id: "ing_seb_26_3", name: "Tereyağı & Kırmızı Pul Biber", portionGrams: 15, unit: "g", unitCost: 320, portionCost: 4.8, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_seb_27", code: "REC-SEB-027",
    name: "Çığırtma (Bergama Usulü)",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 230, prepTime: 20, cookTime: 30,
    calorie: 240, protein: 4.0, carb: 18.0, fat: 17.0,
    temp: "+15°C (Ilık/Soğuk)",
    instructions: "Bergama geleneğiyle spiral çizilmiş bütün patlıcanlar ve köy biberleri bol sızma zeytinyağında kızartılır; bol sarımsaklı domatesle demlendirilir.",
    labor: 5.5, gas: 2.5, overhead: 0.8,
    ingredients: [
      { id: "ing_seb_27_1", name: "İnce Kemer Patlıcan (Spiral Kesim)", portionGrams: 120, unit: "g", unitCost: 40, portionCost: 4.8, wastagePercent: 10 },
      { id: "ing_seb_27_2", name: "Tatlı Köy Biberi & Sarımsak", portionGrams: 40, unit: "g", unitCost: 35, portionCost: 1.4, wastagePercent: 5 },
      { id: "ing_seb_27_3", name: "Doğranmış Domates & Ege Zeytinyağı", portionGrams: 45, unit: "g", unitCost: 140, portionCost: 6.3, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_seb_28", code: "REC-SEB-028",
    name: "Melendiz / Şevketi Bostan",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 240, prepTime: 30, cookTime: 45,
    calorie: 290, protein: 16.0, carb: 14.0, fat: 18.0,
    allergens: ["Yumurta (Terbiye)", "Gluten (Un)"],
    instructions: "Ege'nin şifalı dikeni şevketi bostan kuzu eti veya zeytinyağlı olarak unlu yumurtalı limon terbiyesiyle pişirilir.",
    labor: 6.5, gas: 2.5, overhead: 1.0,
    ingredients: [
      { id: "ing_seb_28_1", name: "Taze Şevketi Bostan (Ayıklanmış)", portionGrams: 140, unit: "g", unitCost: 140, portionCost: 19.6, wastagePercent: 15 },
      { id: "ing_seb_28_2", name: "Kuzu Kuşbaşı (Garnitür)", portionGrams: 50, unit: "g", unitCost: 460, portionCost: 23.0, wastagePercent: 15 },
      { id: "ing_seb_28_3", name: "Limonlu Unlu Terbiye & Zeytinyağı", portionGrams: 25, unit: "g", unitCost: 120, portionCost: 3.0, wastagePercent: 0, allergen: "Yumurta, Gluten" }
    ]
  }),
  createRecipe({
    id: "rec_seb_29", code: "REC-SEB-029",
    name: "Deniz Börülcesi",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 180, prepTime: 25, cookTime: 15,
    calorie: 160, protein: 3.0, carb: 8.0, fat: 14.0,
    temp: "+4°C (Soğuk Meze)",
    instructions: "Deniz börülceleri kaynar suda haşlanıp kılçıklarından sıyrılarak ayıklanır; bol sarımsak, taze limon suyu ve sızma zeytinyağı ile harmanlanır.",
    labor: 5.5, gas: 1.5, overhead: 0.8,
    ingredients: [
      { id: "ing_seb_29_1", name: "Taze Deniz Börülcesi", portionGrams: 150, unit: "g", unitCost: 80, portionCost: 12.0, wastagePercent: 35 },
      { id: "ing_seb_29_2", name: "Ezilmiş Sarımsak & Limon Suyu", portionGrams: 15, unit: "g", unitCost: 50, portionCost: 0.75, wastagePercent: 0 },
      { id: "ing_seb_29_3", name: "Erken Hasat Sızma Zeytinyağı", portionGrams: 20, unit: "ml", unitCost: 260, portionCost: 5.2, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_seb_30", code: "REC-SEB-030",
    name: "Kabak Sıyırma",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 220, prepTime: 15, cookTime: 15,
    calorie: 170, protein: 3.5, carb: 14.0, fat: 11.0,
    temp: "+15°C (Ilık/Soğuk)",
    instructions: "Sakız kabakları soyacakla şeritler halinde sıyrılır; sarımsak, taze nane ve sızma zeytinyağında 5 dakika hafif dişe gelir kıvamda sotelenir.",
    labor: 4.5, gas: 1.5, overhead: 0.8,
    ingredients: [
      { id: "ing_seb_30_1", name: "Taze Sakız Kabağı (Sıyırma Şerit)", portionGrams: 170, unit: "g", unitCost: 35, portionCost: 5.95, wastagePercent: 8 },
      { id: "ing_seb_30_2", name: "Sızma Zeytinyağı & Sarımsak", portionGrams: 20, unit: "ml", unitCost: 240, portionCost: 4.8, wastagePercent: 0 },
      { id: "ing_seb_30_3", name: "Taze Nane & Dereotu", portionGrams: 12, unit: "g", unitCost: 40, portionCost: 0.48, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_seb_31", code: "REC-SEB-031",
    name: "Mantar Yemeği / Sote",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 230, prepTime: 15, cookTime: 20,
    calorie: 180, protein: 6.0, carb: 12.0, fat: 12.0,
    instructions: "Dilimlenmiş kültür ve istiridye mantarları harlı ateşte renkli biberler, soğan, sarımsak ve zeytinyağı ile karamelize edilir.",
    labor: 4.5, gas: 2.0, overhead: 0.8,
    ingredients: [
      { id: "ing_seb_31_1", name: "Taze Kültür & İstiridye Mantarı", portionGrams: 160, unit: "g", unitCost: 75, portionCost: 12.0, wastagePercent: 10 },
      { id: "ing_seb_31_2", name: "Kapya Biber & Kuru Soğan", portionGrams: 40, unit: "g", unitCost: 35, portionCost: 1.4, wastagePercent: 5 },
      { id: "ing_seb_31_3", name: "Sızma Zeytinyağı & Dağ Kekiği", portionGrams: 15, unit: "ml", unitCost: 240, portionCost: 3.6, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_seb_32", code: "REC-SEB-032",
    name: "Domates Dolması",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 240, prepTime: 25, cookTime: 35,
    calorie: 270, protein: 5.0, carb: 38.0, fat: 11.0,
    allergens: ["Fıstık"],
    temp: "+15°C (Ilık/Soğuk)",
    instructions: "İçi oyulmuş etli domatesler fıstıklı, kuş üzümlü ve naneli zeytinyağlı pirinç harcı ile doldurulup fırında kendi suyunda pişirilir.",
    labor: 5.5, gas: 2.2, overhead: 0.8,
    ingredients: [
      { id: "ing_seb_32_1", name: "Sert Tarla Domatesi (Oyulmuş)", portionGrams: 140, unit: "g", unitCost: 30, portionCost: 4.2, wastagePercent: 10 },
      { id: "ing_seb_32_2", name: "Zeytinyağlı Dolma İçi", portionGrams: 85, unit: "g", unitCost: 95, portionCost: 8.08, wastagePercent: 0, allergen: "Fıstık" },
      { id: "ing_seb_32_3", name: "Sızma Zeytinyağı & Nane", portionGrams: 15, unit: "ml", unitCost: 240, portionCost: 3.6, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_seb_33", code: "REC-SEB-033",
    name: "Enginar Kalbi Salatası / Yemeği",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 200, prepTime: 15, cookTime: 20,
    calorie: 190, protein: 4.0, carb: 16.0, fat: 12.5,
    temp: "+15°C (Ilık/Soğuk)",
    instructions: "Körpe enginar kalpleri hafif limonlu suda haşlanıp sızma zeytinyağı, kapari, taze dereotu ve hardal emülsiyonu ile harmanlanır.",
    labor: 5.0, gas: 1.5, overhead: 0.8,
    ingredients: [
      { id: "ing_seb_33_1", name: "Körpe Enginar Kalbi", portionGrams: 140, unit: "g", unitCost: 150, portionCost: 21.0, wastagePercent: 8 },
      { id: "ing_seb_33_2", name: "Sızma Zeytinyağı & Kapari", portionGrams: 20, unit: "g", unitCost: 240, portionCost: 4.8, wastagePercent: 0 },
      { id: "ing_seb_33_3", name: "Taze Limon Suyu & İnce Dereotu", portionGrams: 15, unit: "g", unitCost: 50, portionCost: 0.75, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_seb_34", code: "REC-SEB-034",
    name: "Ot Kavurması (Ege Otları)",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 220, prepTime: 25, cookTime: 15,
    calorie: 180, protein: 5.0, carb: 12.0, fat: 13.0,
    allergens: ["Laktoz (Yoğurt)"],
    temp: "+15°C (Ilık/Soğuk)",
    instructions: "Ebegümeci, ısırgan, arapsaçı ve radika soğanla zeytinyağında sotelenir; sarımsaklı süzme yoğurt ile servis edilir.",
    labor: 5.0, gas: 1.5, overhead: 0.8,
    ingredients: [
      { id: "ing_seb_34_1", name: "Ege Yabani Otlar Karışımı (Isırgan, Ebegümeci vb.)", portionGrams: 150, unit: "g", unitCost: 75, portionCost: 11.25, wastagePercent: 15 },
      { id: "ing_seb_34_2", name: "Piyazlık Kuru Soğan & Zeytinyağı", portionGrams: 35, unit: "g", unitCost: 120, portionCost: 4.2, wastagePercent: 5 },
      { id: "ing_seb_34_3", name: "Sarımsaklı Yoğurt Garnitür", portionGrams: 40, unit: "g", unitCost: 75, portionCost: 3.0, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_seb_35", code: "REC-SEB-035",
    name: "Cibez Otu Yemeği",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 200, prepTime: 15, cookTime: 15,
    calorie: 150, protein: 4.0, carb: 10.0, fat: 11.0,
    temp: "+15°C (Ilık/Soğuk)",
    instructions: "Lahana ve karnabahar köklerinden filizlenen cibez otu hafif diri haşlanıp üzerine bol sarımsaklı sızma zeytinyağı ve limon gezdirilir.",
    labor: 4.5, gas: 1.5, overhead: 0.8,
    ingredients: [
      { id: "ing_seb_35_1", name: "Taze Cibez Otu", portionGrams: 160, unit: "g", unitCost: 65, portionCost: 10.4, wastagePercent: 12 },
      { id: "ing_seb_35_2", name: "Sızma Zeytinyağı, Sarımsak & Limon", portionGrams: 25, unit: "ml", unitCost: 220, portionCost: 5.5, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_seb_36", code: "REC-SEB-036",
    name: "Turp Otu Salatası / Yemeği",
    category: "main_veg", categoryLabel: "Sebze & Bakliyat",
    portionGrams: 200, prepTime: 15, cookTime: 12,
    calorie: 145, protein: 3.5, carb: 9.0, fat: 11.0,
    temp: "+15°C (Ilık/Soğuk)",
    instructions: "Taze tarladan toplanan turp otu yeşilliğini koruyarak haşlanır; zeytinyağı, ezilmiş diş sarımsak ve bol taze limonla ılık sunulur.",
    labor: 4.5, gas: 1.2, overhead: 0.8,
    ingredients: [
      { id: "ing_seb_36_1", name: "Taze Turp Otu", portionGrams: 160, unit: "g", unitCost: 60, portionCost: 9.6, wastagePercent: 15 },
      { id: "ing_seb_36_2", name: "Sızma Zeytinyağı, Sarımsak & Taze Limon", portionGrams: 25, unit: "ml", unitCost: 220, portionCost: 5.5, wastagePercent: 0 }
    ]
  })
];

const fileContent = `import { FoodRecipe } from "../../types";

export const vegRecipes: FoodRecipe[] = ${JSON.stringify(vegetables, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '../src/data/recipes/vegRecipes.ts'), fileContent, 'utf8');
console.log(`Generated ${vegetables.length} vegetable recipes successfully.`);
