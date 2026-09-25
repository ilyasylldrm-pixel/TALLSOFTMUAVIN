const fs = require('fs');
const path = require('path');
const { createRecipe } = require('./recipeHelper.cjs');

const sides = [
  createRecipe({
    id: "rec_pil_01", code: "REC-PIL-001",
    name: "Şehriyeli Pirinç Pilavı",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 200, prepTime: 15, cookTime: 25,
    calorie: 310, protein: 5.5, carb: 52.0, fat: 9.5,
    allergens: ["Gluten (Şehriye)", "Laktoz (Tereyağı)"],
    instructions: "Baldo pirinç ılık tuzlu suda dinlendirilir. Tel şehriye tereyağında altın rengi kavrulur, süzülen pirinç eklenip şeffaflaşana dek kavrulur; sıcak tavuk/et suyu eklenip demlendirilir.",
    labor: 3.5, gas: 1.8, overhead: 0.6,
    ingredients: [
      { id: "ing_pil_01_1", name: "Gönen Baldo Pirinç", portionGrams: 85, unit: "g", unitCost: 65, portionCost: 5.53, wastagePercent: 0 },
      { id: "ing_pil_01_2", name: "Tel Şehriye", portionGrams: 15, unit: "g", unitCost: 35, portionCost: 0.53, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_pil_01_3", name: "Köy Tereyağı & Sıvı Yağ", portionGrams: 18, unit: "g", unitCost: 280, portionCost: 5.04, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_pil_01_4", name: "Doğal Tavuk/Et Suyu", portionGrams: 120, unit: "ml", unitCost: 25, portionCost: 3.0, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_pil_02", code: "REC-PIL-002",
    name: "Meyhane Pilavı",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 220, prepTime: 15, cookTime: 25,
    calorie: 280, protein: 7.0, carb: 48.0, fat: 7.5,
    allergens: ["Gluten (Bulgur)"],
    instructions: "Kaba pilavlık bulgur soğan, sarımsak, kapya biber, sivri biber, domates ve biber salçası ile zeytinyağında kavrulup et suyu ile demlendirilir.",
    labor: 3.8, gas: 1.8, overhead: 0.6,
    ingredients: [
      { id: "ing_pil_02_1", name: "Kaba Pilavlık İri Bulgur", portionGrams: 90, unit: "g", unitCost: 38, portionCost: 3.42, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_pil_02_2", name: "Köy Biberi & Kapya Biber Küpleri", portionGrams: 35, unit: "g", unitCost: 35, portionCost: 1.23, wastagePercent: 5 },
      { id: "ing_pil_02_3", name: "Rende Domates, Soğan & Biber Salçası", portionGrams: 40, unit: "g", unitCost: 40, portionCost: 1.6, wastagePercent: 5 },
      { id: "ing_pil_02_4", name: "Sıvı Yağ & Tereyağı", portionGrams: 14, unit: "g", unitCost: 180, portionCost: 2.52, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_pil_03", code: "REC-PIL-003",
    name: "Bulgur Pilavı (Sade)",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 200, prepTime: 10, cookTime: 20,
    calorie: 260, protein: 6.5, carb: 46.0, fat: 6.5,
    allergens: ["Gluten (Bulgur)", "Laktoz (Tereyağı)"],
    instructions: "Doğal başbaşı bulgur köy tereyağında tane tane kavrulur, sıcak kemik suyu ile pişirilip havlu kağıt altında demlendirilir.",
    labor: 3.0, gas: 1.5, overhead: 0.5,
    ingredients: [
      { id: "ing_pil_03_1", name: "Başbaşı Sarı Bulgur", portionGrams: 85, unit: "g", unitCost: 36, portionCost: 3.06, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_pil_03_2", name: "Trabzon Köy Tereyağı", portionGrams: 16, unit: "g", unitCost: 320, portionCost: 5.12, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_pil_03_3", name: "İlikli Kemik Suyu", portionGrams: 120, unit: "ml", unitCost: 25, portionCost: 3.0, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_pil_04", code: "REC-PIL-004",
    name: "Domatesli Bulgur Pilavı",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 210, prepTime: 15, cookTime: 25,
    calorie: 270, protein: 6.8, carb: 48.0, fat: 7.0,
    allergens: ["Gluten (Bulgur)"],
    instructions: "Bol rendelenmiş yaz domatesi ve sivri biber tereyağında sotelenir; bulgur ilave edilip kısık ateşte demlendirilir.",
    labor: 3.5, gas: 1.8, overhead: 0.6,
    ingredients: [
      { id: "ing_pil_04_1", name: "Pilavlık Sarı Bulgur", portionGrams: 85, unit: "g", unitCost: 36, portionCost: 3.06, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_pil_04_2", name: "Rende Domates & Sivri Biber", portionGrams: 60, unit: "g", unitCost: 30, portionCost: 1.8, wastagePercent: 5 },
      { id: "ing_pil_04_3", name: "Mutfak Tereyağı & Zeytinyağı", portionGrams: 15, unit: "g", unitCost: 200, portionCost: 3.0, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_pil_05", code: "REC-PIL-005",
    name: "İç Pilav",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 210, prepTime: 20, cookTime: 30,
    calorie: 350, protein: 6.0, carb: 54.0, fat: 12.5,
    allergens: ["Fıstık (Dolmalık)", "Laktoz (Tereyağı)"],
    instructions: "Osmanlı usulü pirinç bol tereyağı, karamelize soğan, dolmalık fıstık, kuş üzümü, yenibahar ve tarçın ile demlendirilir.",
    labor: 4.5, gas: 2.0, overhead: 0.8,
    ingredients: [
      { id: "ing_pil_05_1", name: "Baldo Pirinç", portionGrams: 80, unit: "g", unitCost: 65, portionCost: 5.2, wastagePercent: 0 },
      { id: "ing_pil_05_2", name: "Dolmalık Fıstık & Kuş Üzümü", portionGrams: 15, unit: "g", unitCost: 450, portionCost: 6.75, wastagePercent: 0, allergen: "Fıstık" },
      { id: "ing_pil_05_3", name: "Köy Tereyağı & Baharat Karışımı (Yenibahar, Tarçın)", portionGrams: 18, unit: "g", unitCost: 320, portionCost: 5.76, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_pil_05_4", name: "Karamelize Soğan & Et Suyu", portionGrams: 40, unit: "g", unitCost: 40, portionCost: 1.6, wastagePercent: 5 }
    ]
  }),
  createRecipe({
    id: "rec_pil_06", code: "REC-PIL-006",
    name: "Perde Pilavı",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 260, prepTime: 40, cookTime: 50,
    calorie: 480, protein: 18.0, carb: 52.0, fat: 22.0,
    allergens: ["Gluten (Hamur)", "Badem", "Laktoz", "Yumurta"],
    instructions: "Siirt usulü tencereye dizilen bademler ve incecik açılan yufka içerisine kekikli tavuk eti, kuş üzümlü pirinç pilavı konup fırında nar gibi kızartılır.",
    labor: 7.5, gas: 4.0, overhead: 1.2,
    ingredients: [
      { id: "ing_pil_06_1", name: "Didiklenmiş Köy Tavuk Eti", portionGrams: 65, unit: "g", unitCost: 190, portionCost: 12.35, wastagePercent: 10 },
      { id: "ing_pil_06_2", name: "Baldo Pirinç & Kuş Üzümü", portionGrams: 60, unit: "g", unitCost: 75, portionCost: 4.5, wastagePercent: 0 },
      { id: "ing_pil_06_3", name: "Özel Perde Hamuru (Yumurta, Un, Yoğurt)", portionGrams: 50, unit: "g", unitCost: 60, portionCost: 3.0, wastagePercent: 0, allergen: "Gluten, Yumurta, Laktoz" },
      { id: "ing_pil_06_4", name: "Soyulmuş Çiğ Badem & Tereyağı", portionGrams: 20, unit: "g", unitCost: 360, portionCost: 7.2, wastagePercent: 0, allergen: "Badem, Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_pil_07", code: "REC-PIL-007",
    name: "Siyez Bulgur Pilavı",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 200, prepTime: 15, cookTime: 30,
    calorie: 270, protein: 9.0, carb: 44.0, fat: 7.0,
    allergens: ["Gluten (Siyez)"],
    instructions: "Kastamonu 12 bin yıllık ata tohumu siyez bulguru tereyağı, arpacık soğan ve kemik suyuyla kısık ateşte demlendirilir.",
    labor: 3.5, gas: 2.0, overhead: 0.6,
    ingredients: [
      { id: "ing_pil_07_1", name: "Doğal Kastamonu Siyez Bulguru", portionGrams: 85, unit: "g", unitCost: 75, portionCost: 6.38, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_pil_07_2", name: "Köy Tereyağı & Arpacık Soğan", portionGrams: 20, unit: "g", unitCost: 260, portionCost: 5.2, wastagePercent: 0 },
      { id: "ing_pil_07_3", name: "Doğal Et Suyu", portionGrams: 130, unit: "ml", unitCost: 25, portionCost: 3.25, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_pil_08", code: "REC-PIL-008",
    name: "Firik Pilavı",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 210, prepTime: 15, cookTime: 25,
    calorie: 290, protein: 8.5, carb: 48.0, fat: 8.0,
    allergens: ["Gluten (Firik)"],
    instructions: "Tütsü aromalı yeşil firik buğdayı ve pilavlık bulgur tereyağı ve et suyu ile pişirilir; dumanı üstünde demlenir.",
    labor: 3.8, gas: 2.0, overhead: 0.6,
    ingredients: [
      { id: "ing_pil_08_1", name: "Doğal Tütsülü Firik Buğdayı", portionGrams: 55, unit: "g", unitCost: 85, portionCost: 4.68, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_pil_08_2", name: "Pilavlık İri Sarı Bulgur", portionGrams: 35, unit: "g", unitCost: 36, portionCost: 1.26, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_pil_08_3", name: "Köy Tereyağı & Et Suyu", portionGrams: 20, unit: "g", unitCost: 250, portionCost: 5.0, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_pil_09", code: "REC-PIL-009",
    name: "Nohutlu Pilav",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 220, prepTime: 15, cookTime: 25,
    calorie: 330, protein: 7.5, carb: 56.0, fat: 9.0,
    allergens: ["Laktoz (Tereyağı)"],
    instructions: "Geceden ıslatılıp lokum gibi haşlanmış koçbaşı nohutlar tereyağlı baldo pirinç pilavına eklenerek dinlendirilir.",
    labor: 3.5, gas: 1.8, overhead: 0.6,
    ingredients: [
      { id: "ing_pil_09_1", name: "Baldo Pirinç", portionGrams: 80, unit: "g", unitCost: 65, portionCost: 5.2, wastagePercent: 0 },
      { id: "ing_pil_09_2", name: "Haşlanmış Koçbaşı Nohut", portionGrams: 40, unit: "g", unitCost: 65, portionCost: 2.6, wastagePercent: 0 },
      { id: "ing_pil_09_3", name: "Köy Tereyağı & Tavuk Suyu", portionGrams: 20, unit: "g", unitCost: 240, portionCost: 4.8, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_pil_10", code: "REC-PIL-010",
    name: "Sebzeli Bulgur Pilavı",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 210, prepTime: 15, cookTime: 25,
    calorie: 270, protein: 6.5, carb: 46.0, fat: 7.5,
    allergens: ["Gluten"],
    instructions: "Küp kabak, havuç, bezelye ve taze soğan zeytinyağında sotelenir; bulgurla birleştirilip demlendirilir.",
    labor: 3.5, gas: 1.8, overhead: 0.6,
    ingredients: [
      { id: "ing_pil_10_1", name: "Pilavlık Bulgur", portionGrams: 80, unit: "g", unitCost: 36, portionCost: 2.88, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_pil_10_2", name: "Karışık Sebze Küpleri (Havuç, Kabak, Bezelye)", portionGrams: 50, unit: "g", unitCost: 35, portionCost: 1.75, wastagePercent: 5 },
      { id: "ing_pil_10_3", name: "Sızma Zeytinyağı & Tereyağı", portionGrams: 15, unit: "g", unitCost: 220, portionCost: 3.3, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_pil_11", code: "REC-PIL-011",
    name: "Arpa Şehriye Pilavı",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 200, prepTime: 15, cookTime: 20,
    calorie: 300, protein: 6.5, carb: 50.0, fat: 9.0,
    allergens: ["Gluten", "Laktoz"],
    instructions: "Arpa şehriyelerin üçte biri tereyağında koyu karamel rengine kavrulur, kalanı eklenip sıcak et suyuyla demlendirilir.",
    labor: 3.2, gas: 1.8, overhead: 0.6,
    ingredients: [
      { id: "ing_pil_11_1", name: "Durum Arpa Şehriye", portionGrams: 90, unit: "g", unitCost: 38, portionCost: 3.42, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_pil_11_2", name: "Trabzon Tereyağı", portionGrams: 18, unit: "g", unitCost: 320, portionCost: 5.76, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_pil_11_3", name: "Et Suyu & Kaya Tuzu", portionGrams: 120, unit: "ml", unitCost: 25, portionCost: 3.0, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_pil_12", code: "REC-PIL-012",
    name: "Özbek Pilavı (Türk Usulü)",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 260, prepTime: 25, cookTime: 45,
    calorie: 460, protein: 22.0, carb: 52.0, fat: 19.0,
    allergens: [],
    instructions: "Kuşbaşı kuzu eti, jülyen bol sarı havuç ve bütün sarımsak başı döküm kazanda kavrulur; üzerine pirinç çekilip suyunu çekene kadar demlendirilir.",
    labor: 5.5, gas: 3.0, overhead: 1.0,
    ingredients: [
      { id: "ing_pil_12_1", name: "Kuzu Kuşbaşı Lokum", portionGrams: 65, unit: "g", unitCost: 460, portionCost: 29.9, wastagePercent: 18 },
      { id: "ing_pil_12_2", name: "Jasmine / Baldo Pirinç", portionGrams: 75, unit: "g", unitCost: 65, portionCost: 4.88, wastagePercent: 0 },
      { id: "ing_pil_12_3", name: "Sarı Havuç (Jülyen) & Bütün Sarımsak", portionGrams: 60, unit: "g", unitCost: 30, portionCost: 1.8, wastagePercent: 10 },
      { id: "ing_pil_12_4", name: "Kuyruk Yağı / Sıvı Yağ & Kimyon", portionGrams: 18, unit: "g", unitCost: 160, portionCost: 2.88, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_pil_13", code: "REC-PIL-013",
    name: "Fıstıklı / Kuş Üzümlü Pilav",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 200, prepTime: 15, cookTime: 25,
    calorie: 320, protein: 5.5, carb: 52.0, fat: 10.5,
    allergens: ["Fıstık", "Laktoz"],
    instructions: "Tereyağında kavrulmuş çam fıstığı ve ıslatılmış kuş üzümleri ile demlenen tane baldo pirinç pilavı.",
    labor: 3.5, gas: 1.8, overhead: 0.6,
    ingredients: [
      { id: "ing_pil_13_1", name: "Baldo Pirinç", portionGrams: 80, unit: "g", unitCost: 65, portionCost: 5.2, wastagePercent: 0 },
      { id: "ing_pil_13_2", name: "Çam Fıstığı & Kuş Üzümü", portionGrams: 15, unit: "g", unitCost: 480, portionCost: 7.2, wastagePercent: 0, allergen: "Fıstık" },
      { id: "ing_pil_13_3", name: "Köy Tereyağı", portionGrams: 16, unit: "g", unitCost: 320, portionCost: 5.12, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_pil_14", code: "REC-PIL-014",
    name: "Su Böreği",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 220, prepTime: 45, cookTime: 40,
    calorie: 420, protein: 14.0, carb: 42.0, fat: 22.0,
    allergens: ["Gluten", "Yumurta", "Laktoz"],
    instructions: "Bol yumurtalı elle açılan yufkalar kaynar tuzlu suda haşlanıp şoklanır; aralarına eritilmiş tereyağı ve yağlı beyaz peynir/maydanoz serpilerek fırında nar gibi pişirilir.",
    labor: 7.0, gas: 3.5, overhead: 1.2,
    ingredients: [
      { id: "ing_pil_14_1", name: "El Açması Haşlama Yufka", portionGrams: 110, unit: "g", unitCost: 60, portionCost: 6.6, wastagePercent: 0, allergen: "Gluten, Yumurta" },
      { id: "ing_pil_14_2", name: "Tam Yağlı Beyaz Peynir & Maydanoz", portionGrams: 60, unit: "g", unitCost: 190, portionCost: 11.4, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_pil_14_3", name: "Eritilmiş Köy Tereyağı", portionGrams: 25, unit: "g", unitCost: 320, portionCost: 8.0, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_pil_15", code: "REC-PIL-015",
    name: "Kol Böreği (Kıymalı / Peynirli / Patatesli)",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 230, prepTime: 40, cookTime: 35,
    calorie: 440, protein: 16.0, carb: 46.0, fat: 22.0,
    allergens: ["Gluten", "Yumurta", "Susam"],
    instructions: "Zeytinyağıyla zar gibi açılan çıtır yufka içerisine kıymalı soğanlı harç sarılıp helezon tepsiye dizilir; üzeri yumurtalanıp susamla fırınlanır.",
    labor: 6.5, gas: 3.2, overhead: 1.0,
    ingredients: [
      { id: "ing_pil_15_1", name: "El Açması Çıtır Baklava Yufkası", portionGrams: 90, unit: "g", unitCost: 55, portionCost: 4.95, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_pil_15_2", name: "Dana Kıyma & Karamelize Soğan Harcı", portionGrams: 80, unit: "g", unitCost: 380, portionCost: 30.4, wastagePercent: 5 },
      { id: "ing_pil_15_3", name: "Sıvı Yağ, Tereyağı & Çörekotu", portionGrams: 20, unit: "g", unitCost: 150, portionCost: 3.0, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_pil_16", code: "REC-PIL-016",
    name: "Sigara Böreği",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 180, prepTime: 20, cookTime: 12,
    calorie: 360, protein: 11.0, carb: 34.0, fat: 20.0,
    allergens: ["Gluten", "Laktoz"],
    instructions: "Üçgen yufkaya maydanozlu lor ve beyaz peynir harcı sarılır; uçları ıslatılıp kızgın yağda altın sarısı çıtır çıtır kızartılır.",
    labor: 4.5, gas: 2.0, overhead: 0.6,
    ingredients: [
      { id: "ing_pil_16_1", name: "Taze Üçgen Yufka (4 adet)", portionGrams: 80, unit: "g", unitCost: 45, portionCost: 3.6, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_pil_16_2", name: "Lor & Beyaz Peynir & Maydanoz", portionGrams: 65, unit: "g", unitCost: 140, portionCost: 9.1, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_pil_16_3", name: "Kızartma Sıvı Yağı", portionGrams: 20, unit: "ml", unitCost: 75, portionCost: 1.5, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_pil_17", code: "REC-PIL-017",
    name: "Paçanga Böreği",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 200, prepTime: 20, cookTime: 15,
    calorie: 430, protein: 18.0, carb: 32.0, fat: 26.0,
    allergens: ["Gluten", "Laktoz"],
    instructions: "Yufkaya çemenli Kayseri pastırması, kaşar peyniri, domates ve biber sarılıp kızgın yağda peyniri uzayana kadar kızartılır.",
    labor: 5.0, gas: 2.2, overhead: 0.8,
    ingredients: [
      { id: "ing_pil_17_1", name: "Taze Yufka", portionGrams: 60, unit: "g", unitCost: 45, portionCost: 2.7, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_pil_17_2", name: "Kayseri Pastırması (Çemenli/Çemensiz)", portionGrams: 40, unit: "g", unitCost: 680, portionCost: 27.2, wastagePercent: 0 },
      { id: "ing_pil_17_3", name: "Taze Kaşar Peyniri", portionGrams: 45, unit: "g", unitCost: 260, portionCost: 11.7, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_pil_17_4", name: "Domates & Biber & Kızartma Yağı", portionGrams: 25, unit: "g", unitCost: 70, portionCost: 1.75, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_pil_18", code: "REC-PIL-018",
    name: "Tepsi Böreği",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 220, prepTime: 25, cookTime: 35,
    calorie: 390, protein: 12.0, carb: 42.0, fat: 20.0,
    allergens: ["Gluten", "Yumurta", "Laktoz"],
    instructions: "Yufka katları arasına süt, maden suyu ve yumurtalı harç sürülüp peynirli maydanozlu iç yayılır; fırında kabara kabara pişirilir.",
    labor: 5.0, gas: 2.8, overhead: 0.8,
    ingredients: [
      { id: "ing_pil_18_1", name: "Taze Elde Açılmış Yufka", portionGrams: 100, unit: "g", unitCost: 45, portionCost: 4.5, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_pil_18_2", name: "Beyaz Peynir & Maydanoz", portionGrams: 60, unit: "g", unitCost: 180, portionCost: 10.8, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_pil_18_3", name: "Süt, Yumurta & Sıvı Yağ Sosu", portionGrams: 35, unit: "g", unitCost: 80, portionCost: 2.8, wastagePercent: 0, allergen: "Laktoz, Yumurta" }
    ]
  }),
  createRecipe({
    id: "rec_pil_19", code: "REC-PIL-019",
    name: "Boşnak Böreği",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 230, prepTime: 45, cookTime: 35,
    calorie: 450, protein: 16.0, carb: 44.0, fat: 24.0,
    allergens: ["Gluten"],
    instructions: "Zar inceliğinde çarşaf üzerinde el ile açılan Boşnak yufkası kıyma veya ıspanak harcıyla rulo yapılıp fırında çıtır pişirilir.",
    labor: 7.0, gas: 3.2, overhead: 1.0,
    ingredients: [
      { id: "ing_pil_19_1", name: "Çarşaf Usulü El Açması Hamur", portionGrams: 95, unit: "g", unitCost: 45, portionCost: 4.28, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_pil_19_2", name: "Kıymalı & Soğanlı Harç", portionGrams: 80, unit: "g", unitCost: 360, portionCost: 28.8, wastagePercent: 0 },
      { id: "ing_pil_19_3", name: "Köy Tereyağı & Sıvı Yağ Karışımı", portionGrams: 22, unit: "g", unitCost: 220, portionCost: 4.84, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_pil_20", code: "REC-PIL-020",
    name: "Gözleme (Ispanaklı / Peynirli / Kıymalı)",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 210, prepTime: 20, cookTime: 12,
    calorie: 380, protein: 12.0, carb: 46.0, fat: 16.0,
    allergens: ["Gluten", "Laktoz"],
    instructions: "Oklava ile açılan mayasız ince yufka içine ıspanak ve beyaz peynir konularak saçta iki tarafı tereyağlanıp pişirilir.",
    labor: 5.0, gas: 1.5, overhead: 0.8,
    ingredients: [
      { id: "ing_pil_20_1", name: "Sac Yufkası Hamuru", portionGrams: 100, unit: "g", unitCost: 35, portionCost: 3.5, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_pil_20_2", name: "Taze Ispanak & Beyaz Peynir Harcı", portionGrams: 70, unit: "g", unitCost: 110, portionCost: 7.7, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_pil_20_3", name: "Üst Yağlama Köy Tereyağı", portionGrams: 15, unit: "g", unitCost: 320, portionCost: 4.8, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_pil_21", code: "REC-PIL-021",
    name: "Mantı (Kayseri Usulü)",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 250, prepTime: 50, cookTime: 15,
    calorie: 460, protein: 20.0, carb: 58.0, fat: 16.0,
    allergens: ["Gluten", "Yumurta", "Laktoz"],
    instructions: "Bir kaşığa kırk adet sığacak boyutta minik minik bükülen kıymalı mantılar haşlanır; sarımsaklı yoğurt, sumak, nane ve tereyağlı salça sos ile servis edilir.",
    labor: 8.5, gas: 2.5, overhead: 1.2,
    ingredients: [
      { id: "ing_pil_21_1", name: "Kayseri Usulü El Mantısı", portionGrams: 130, unit: "g", unitCost: 140, portionCost: 18.2, wastagePercent: 0, allergen: "Gluten, Yumurta" },
      { id: "ing_pil_21_2", name: "Sarımsaklı Süzme Yoğurt", portionGrams: 70, unit: "g", unitCost: 75, portionCost: 5.25, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_pil_21_3", name: "Kızgın Tereyağlı Salça Sosu & Sumak", portionGrams: 22, unit: "g", unitCost: 240, portionCost: 5.28, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_pil_22", code: "REC-PIL-022",
    name: "Sinop Mantısı",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 250, prepTime: 45, cookTime: 15,
    calorie: 480, protein: 18.0, carb: 54.0, fat: 22.0,
    allergens: ["Gluten", "Ceviz", "Laktoz"],
    instructions: "Kulak şeklinde büyükçe bükülen kıymalı mantılar haşlanır; yarısı sarımsaklı yoğurtlu, yarısı bol cevizli ve kızgın tereyağlı olarak servis edilir.",
    labor: 7.5, gas: 2.5, overhead: 1.0,
    ingredients: [
      { id: "ing_pil_22_1", name: "Sinop Tipi İri El Mantısı", portionGrams: 140, unit: "g", unitCost: 130, portionCost: 18.2, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_pil_22_2", name: "Dövülmüş Ceviz İçi", portionGrams: 30, unit: "g", unitCost: 400, portionCost: 12.0, wastagePercent: 0, allergen: "Ceviz" },
      { id: "ing_pil_22_3", name: "Köy Tereyağı & Yoğurt", portionGrams: 45, unit: "g", unitCost: 200, portionCost: 9.0, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_pil_23", code: "REC-PIL-023",
    name: "Tepsi Mantısı",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 250, prepTime: 45, cookTime: 30,
    calorie: 490, protein: 22.0, carb: 56.0, fat: 20.0,
    allergens: ["Gluten", "Laktoz"],
    instructions: "Üstü açık kayık şeklinde bükülen mantılar tepsiye dizilir, fırında veya ocakta altı çıtırlaşana dek pişirilir; sıcak salçalı et suyu verilip demlendirilir.",
    labor: 8.0, gas: 3.0, overhead: 1.2,
    ingredients: [
      { id: "ing_pil_23_1", name: "Kayık Büküm Tepsi Mantısı", portionGrams: 140, unit: "g", unitCost: 140, portionCost: 19.6, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_pil_23_2", name: "Et Suyu & Tereyağlı Salça Sosu", portionGrams: 50, unit: "g", unitCost: 80, portionCost: 4.0, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_pil_23_3", name: "Sarımsaklı Yoğurt & Sumak", portionGrams: 50, unit: "g", unitCost: 75, portionCost: 3.75, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_pil_24", code: "REC-PIL-024",
    name: "Yağlama (Şebit)",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 280, prepTime: 35, cookTime: 25,
    calorie: 530, protein: 24.0, carb: 58.0, fat: 24.0,
    allergens: ["Gluten", "Laktoz"],
    instructions: "Kayseri klasiği incecik şebit lavaşlarının kat kat arasına kıymalı, domatesli, biberli sulu harç serilir; dörde bölünerek sarımsaklı yoğurtla servis edilir.",
    labor: 7.0, gas: 3.0, overhead: 1.0,
    ingredients: [
      { id: "ing_pil_24_1", name: "Şebit Lavaş Yufkası (6 kat)", portionGrams: 100, unit: "g", unitCost: 45, portionCost: 4.5, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_pil_24_2", name: "Kıymalı Sulu Yağlama Harcı", portionGrams: 110, unit: "g", unitCost: 320, portionCost: 35.2, wastagePercent: 0 },
      { id: "ing_pil_24_3", name: "Sarımsaklı Yoğurt", portionGrams: 50, unit: "g", unitCost: 75, portionCost: 3.75, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_pil_25", code: "REC-PIL-025",
    name: "Fırın Makarna",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 240, prepTime: 20, cookTime: 35,
    calorie: 410, protein: 15.0, carb: 50.0, fat: 17.0,
    allergens: ["Gluten", "Laktoz", "Yumurta"],
    instructions: "Kalın delikli fırın makarna beşamel sos, beyaz peynir ve rendelenmiş kaşarla karıştırılıp fırında nar gibi kızartılır.",
    labor: 4.5, gas: 2.8, overhead: 0.8,
    ingredients: [
      { id: "ing_pil_25_1", name: "Fırın Makarna (Bucatini)", portionGrams: 85, unit: "g", unitCost: 40, portionCost: 3.4, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_pil_25_2", name: "Beşamel Sos (Süt, Un, Tereyağı)", portionGrams: 65, unit: "g", unitCost: 70, portionCost: 4.55, wastagePercent: 0, allergen: "Gluten, Laktoz" },
      { id: "ing_pil_25_3", name: "Kaşar & Beyaz Peynir", portionGrams: 40, unit: "g", unitCost: 240, portionCost: 9.6, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_pil_26", code: "REC-PIL-026",
    name: "Soslu Makarna (Domates / Kıyma / Peynir)",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 230, prepTime: 15, cookTime: 15,
    calorie: 360, protein: 12.0, carb: 55.0, fat: 10.0,
    allergens: ["Gluten", "Laktoz"],
    instructions: "Haşlanmış burgu veya kalem makarna fesleğenli zengin domates sosu ve tereyağında çevrilip rendelenmiş peynirle servis edilir.",
    labor: 3.5, gas: 1.8, overhead: 0.6,
    ingredients: [
      { id: "ing_pil_26_1", name: "Durum Buğdayı Makarna", portionGrams: 85, unit: "g", unitCost: 38, portionCost: 3.23, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_pil_26_2", name: "Tereyağlı Fesleğenli Domates Sosu", portionGrams: 60, unit: "g", unitCost: 45, portionCost: 2.7, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_pil_26_3", name: "Rendelenmiş Kaşar Peyniri", portionGrams: 20, unit: "g", unitCost: 260, portionCost: 5.2, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_pil_27", code: "REC-PIL-027",
    name: "Erişte (Cevizli / Peynirli)",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 220, prepTime: 15, cookTime: 15,
    calorie: 420, protein: 14.0, carb: 52.0, fat: 18.0,
    allergens: ["Gluten", "Yumurta", "Laktoz", "Ceviz"],
    instructions: "Ev yapımı bol yumurtalı erişte haşlanır; köy tereyağında kavrulan ceviz içi ve tulum peyniri ile harmanlanır.",
    labor: 4.0, gas: 1.8, overhead: 0.6,
    ingredients: [
      { id: "ing_pil_27_1", name: "Köy Usulü Yumurtalı Ev Eriştesi", portionGrams: 90, unit: "g", unitCost: 65, portionCost: 5.85, wastagePercent: 0, allergen: "Gluten, Yumurta" },
      { id: "ing_pil_27_2", name: "İri Kırılmış Ceviz İçi", portionGrams: 25, unit: "g", unitCost: 400, portionCost: 10.0, wastagePercent: 0, allergen: "Ceviz" },
      { id: "ing_pil_27_3", name: "Tulum Peyniri & Kızgın Tereyağı", portionGrams: 35, unit: "g", unitCost: 260, portionCost: 9.1, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_pil_28", code: "REC-PIL-028",
    name: "Çiğ Börek (Çibörek)",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 200, prepTime: 25, cookTime: 10,
    calorie: 410, protein: 15.0, carb: 42.0, fat: 21.0,
    allergens: ["Gluten"],
    instructions: "Eskişehir Kırım Tatar usulü ince açılan hamura sulu çiğ kıyma ve karabiberli harç konup kızgın derin yağda puf börek gibi kabartılır.",
    labor: 5.0, gas: 2.2, overhead: 0.8,
    ingredients: [
      { id: "ing_pil_28_1", name: "Sirkeli Çibörek Hamuru", portionGrams: 85, unit: "g", unitCost: 40, portionCost: 3.4, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_pil_28_2", name: "Sulu Kıyma Harcı (Soğan Suyu, Karabiber)", portionGrams: 60, unit: "g", unitCost: 380, portionCost: 22.8, wastagePercent: 0 },
      { id: "ing_pil_28_3", name: "Derin Kızartma Sıvı Yağı", portionGrams: 25, unit: "ml", unitCost: 75, portionCost: 1.88, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_pil_29", code: "REC-PIL-029",
    name: "Pide Çeşitleri (Kıymalı / Kaşarlı / Kuşbaşılı)",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 270, prepTime: 30, cookTime: 12,
    calorie: 540, protein: 26.0, carb: 62.0, fat: 22.0,
    allergens: ["Gluten", "Laktoz"],
    instructions: "Geleneksel pide hamuru kayık şeklinde açılır; kıymalı/kuşbaşılı harç ve kaşarla taş fırında gevrek pişirilip kenarları tereyağlanır.",
    labor: 6.5, gas: 3.5, overhead: 1.0,
    ingredients: [
      { id: "ing_pil_29_1", name: "Mayalı Taş Fırın Pide Hamuru", portionGrams: 120, unit: "g", unitCost: 35, portionCost: 4.2, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_pil_29_2", name: "Kuşbaşı / Kıyma Harcı", portionGrams: 75, unit: "g", unitCost: 420, portionCost: 31.5, wastagePercent: 10 },
      { id: "ing_pil_29_3", name: "Kaşar Peyniri & Tereyağı", portionGrams: 35, unit: "g", unitCost: 260, portionCost: 9.1, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_pil_30", code: "REC-PIL-030",
    name: "Lahmacun",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 180, prepTime: 25, cookTime: 8,
    calorie: 330, protein: 16.0, carb: 40.0, fat: 12.0,
    allergens: ["Gluten"],
    instructions: "Zırh kıyması, sarımsak, maydanoz, domates ve biber salçalı harç kağıt gibi ince hamurun üzerine yayılıp taş fırında gevrek pişirilir.",
    labor: 5.0, gas: 2.5, overhead: 0.8,
    ingredients: [
      { id: "ing_pil_30_1", name: "Taş Fırın İnce Lahmacun Hamuru", portionGrams: 70, unit: "g", unitCost: 35, portionCost: 2.45, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_pil_30_2", name: "Zırh Kıyma & Baharatlı Salçalı Harç", portionGrams: 75, unit: "g", unitCost: 380, portionCost: 28.5, wastagePercent: 5 },
      { id: "ing_pil_30_3", name: "Limon Dilimi & Maydanoz Yeşillik", portionGrams: 30, unit: "g", unitCost: 35, portionCost: 1.05, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_pil_31", code: "REC-PIL-031",
    name: "Boyoz",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 140, prepTime: 40, cookTime: 25,
    calorie: 380, protein: 7.0, carb: 42.0, fat: 21.0,
    allergens: ["Gluten"],
    instructions: "İzmir geleneği un, su ve tuz ile dinlendirilen hamur tahin ve sıvı yağ ile defalarca açılarak katlanır; fırında çıtır katmerli pişirilir.",
    labor: 5.5, gas: 2.5, overhead: 0.8,
    ingredients: [
      { id: "ing_pil_31_1", name: "Özel Dinlendirilmiş Boyoz Hamuru", portionGrams: 85, unit: "g", unitCost: 40, portionCost: 3.4, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_pil_31_2", name: "Tahin & Bitkisel Açma Yağı", portionGrams: 35, unit: "g", unitCost: 140, portionCost: 4.9, wastagePercent: 0 },
      { id: "ing_pil_31_3", name: "Fırınlanmış Haşlama Yumurta", portionGrams: 50, unit: "g", unitCost: 70, portionCost: 3.5, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_pil_32", code: "REC-PIL-032",
    name: "Pişi / Hamur Kızartması",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 160, prepTime: 25, cookTime: 12,
    calorie: 390, protein: 8.0, carb: 48.0, fat: 19.0,
    allergens: ["Gluten"],
    instructions: "Mayalı yumuşak hamur bezeleri el ile açılıp ortası delinerek kızgın yağda altın sarısı puf puf kızartılır.",
    labor: 4.0, gas: 2.0, overhead: 0.6,
    ingredients: [
      { id: "ing_pil_32_1", name: "Mayalı Pişi Hamuru", portionGrams: 110, unit: "g", unitCost: 35, portionCost: 3.85, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_pil_32_2", name: "Kızartma Sıvı Yağı", portionGrams: 25, unit: "ml", unitCost: 75, portionCost: 1.88, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_pil_33", code: "REC-PIL-033",
    name: "Hingel / Hıngel",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 250, prepTime: 40, cookTime: 15,
    calorie: 430, protein: 15.0, carb: 60.0, fat: 15.0,
    allergens: ["Gluten", "Yumurta", "Laktoz"],
    instructions: "Kafkas/Sivas usulü örgü şeklinde kapatılan patatesli veya kıymalı iri mantılar haşlanır; üzerine sarımsaklı yoğurt ve kızgın tereyağı dökülür.",
    labor: 6.5, gas: 2.5, overhead: 1.0,
    ingredients: [
      { id: "ing_pil_33_1", name: "Hıngel Hamuru (Patatesli/Kıymalı Harç)", portionGrams: 150, unit: "g", unitCost: 85, portionCost: 12.75, wastagePercent: 0, allergen: "Gluten, Yumurta" },
      { id: "ing_pil_33_2", name: "Köy Tereyağı & Kırmızı Pul Biber", portionGrams: 20, unit: "g", unitCost: 320, portionCost: 6.4, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_pil_33_3", name: "Sarımsaklı Yoğurt", portionGrams: 50, unit: "g", unitCost: 75, portionCost: 3.75, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_pil_34", code: "REC-PIL-034",
    name: "Cantık (Bursa)",
    category: "side_dish", categoryLabel: "Pilav & Makarna",
    portionGrams: 200, prepTime: 25, cookTime: 15,
    calorie: 440, protein: 18.0, carb: 48.0, fat: 20.0,
    allergens: ["Gluten"],
    instructions: "Bursa usulü kabarık yuvarlak mayalı hamurun ortasına kıymalı harç bastırılıp fırında kenarları puf puf çıtır pişirilir.",
    labor: 5.5, gas: 2.8, overhead: 0.8,
    ingredients: [
      { id: "ing_pil_34_1", name: "Özel Bursa Cantık Hamuru", portionGrams: 90, unit: "g", unitCost: 35, portionCost: 3.15, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_pil_34_2", name: "Kıymalı & Domatesli Cantık Harcı", portionGrams: 70, unit: "g", unitCost: 380, portionCost: 26.6, wastagePercent: 5 },
      { id: "ing_pil_34_3", name: "Kenar Yağlama Tereyağı", portionGrams: 10, unit: "g", unitCost: 320, portionCost: 3.2, wastagePercent: 0 }
    ]
  })
];

const fileContent = `import { FoodRecipe } from "../../types";

export const sideRecipes: FoodRecipe[] = ${JSON.stringify(sides, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '../src/data/recipes/sideRecipes.ts'), fileContent, 'utf8');
console.log(`Generated ${sides.length} side recipes successfully.`);
