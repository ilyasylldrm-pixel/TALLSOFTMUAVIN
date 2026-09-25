const fs = require('fs');
const path = require('path');
const { createRecipe } = require('./recipeHelper.cjs');

const beverages = [
  createRecipe({
    id: "rec_ice_01", code: "REC-ICE-001",
    name: "Türk Çayı (Rize Demleme)",
    category: "beverage", categoryLabel: "İçecekler",
    portionGrams: 150, prepTime: 5, cookTime: 20,
    calorie: 2, protein: 0.1, carb: 0.4, fat: 0.0,
    temp: "+85°C (Sıcak)",
    instructions: "Rize mayıs sürgünü siyah çay porselen demlikte kireçsiz tatlı suyla 20 dakika demlendirilir; ince belli bardakta taze sunulur.",
    labor: 1.5, gas: 0.8, overhead: 0.3,
    ingredients: [
      { id: "ing_ice_01_1", name: "Rize Siyah Çayı (Mayıs Sürgünü)", portionGrams: 5, unit: "g", unitCost: 160, portionCost: 0.8, wastagePercent: 0 },
      { id: "ing_ice_01_2", name: "Arıtılmış Kaynak Suyu", portionGrams: 150, unit: "ml", unitCost: 2, portionCost: 0.3, wastagePercent: 0 },
      { id: "ing_ice_01_3", name: "Pancar Kesme Şeker (İsteğe bağlı)", portionGrams: 8, unit: "g", unitCost: 35, portionCost: 0.28, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_ice_02", code: "REC-ICE-002",
    name: "Türk Kahvesi",
    category: "beverage", categoryLabel: "İçecekler",
    portionGrams: 80, prepTime: 3, cookTime: 5,
    calorie: 15, protein: 0.5, carb: 2.0, fat: 0.4,
    temp: "+80°C (Sıcak)",
    instructions: "Taze çekilmiş incecik Arabica kahvesi bakır cezvede soğuk suyla kısık ateşte veya kumda köpürene kadar pişirilir; lokum ve suyla ikram edilir.",
    labor: 2.5, gas: 0.5, overhead: 0.3,
    ingredients: [
      { id: "ing_ice_02_1", name: "Taş Değirmende Çekilmiş Türk Kahvesi", portionGrams: 8, unit: "g", unitCost: 320, portionCost: 2.56, wastagePercent: 0 },
      { id: "ing_ice_02_2", name: "Kaynak Suyu & Şeker", portionGrams: 70, unit: "ml", unitCost: 5, portionCost: 0.35, wastagePercent: 0 },
      { id: "ing_ice_02_3", name: "İkram Çifte Kavrulmuş Lokum", portionGrams: 15, unit: "g", unitCost: 200, portionCost: 3.0, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_ice_03", code: "REC-ICE-003",
    name: "Ayran (Köy / Yayık / Açık Köpüklü)",
    category: "beverage", categoryLabel: "İçecekler",
    portionGrams: 250, prepTime: 5, cookTime: 0,
    calorie: 95, protein: 5.5, carb: 6.5, fat: 5.0,
    allergens: ["Laktoz (Yoğurt)"],
    temp: "+4°C (Soğuk)",
    instructions: "Tam yağlı koyun ve inek yoğurdu soğuk kaynak suyu ve kaya tuzu ile yayık makinesinde yoğun köpük oluşana dek çırpılır.",
    labor: 1.5, gas: 0.0, overhead: 0.3,
    ingredients: [
      { id: "ing_ice_03_1", name: "Tam Yağlı Köy Yoğurdu", portionGrams: 130, unit: "g", unitCost: 55, portionCost: 7.15, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_ice_03_2", name: "Soğuk Kaynak Suyu & Kaya Tuzu", portionGrams: 120, unit: "ml", unitCost: 2, portionCost: 0.24, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_ice_04", code: "REC-ICE-004",
    name: "Şalgam Suyu (Acılı / Acısız)",
    category: "beverage", categoryLabel: "İçecekler",
    portionGrams: 250, prepTime: 5, cookTime: 0,
    calorie: 30, protein: 1.0, carb: 6.0, fat: 0.1,
    temp: "+4°C (Soğuk)",
    instructions: "Adana usulü mor havuç, şalgam turpu ve bulgur mayası ile fermente edilmiş doğal şalgam suyu; acı süs biberi turşusu ile servis edilir.",
    labor: 1.2, gas: 0.0, overhead: 0.3,
    ingredients: [
      { id: "ing_ice_04_1", name: "Doğal Fermente Adana Şalgam Suyu", portionGrams: 230, unit: "ml", unitCost: 25, portionCost: 5.75, wastagePercent: 0 },
      { id: "ing_ice_04_2", name: "Tane Mor Havuç & Acı Biber", portionGrams: 20, unit: "g", unitCost: 40, portionCost: 0.8, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_ice_05", code: "REC-ICE-005",
    name: "Osmanlı Şerbeti (Gül / Demirhindi / Hibiskus)",
    category: "beverage", categoryLabel: "İçecekler",
    portionGrams: 250, prepTime: 15, cookTime: 30,
    calorie: 120, protein: 0.5, carb: 29.0, fat: 0.0,
    temp: "+4°C (Soğuk)",
    instructions: "Demirhindi meyvesi, hibiskus, karanfil, çubuk tarçın, zencefil ve bal ile kaynatılıp soğutulur; buz ile ferahlatıcı servis edilir.",
    labor: 2.5, gas: 1.2, overhead: 0.4,
    ingredients: [
      { id: "ing_ice_05_1", name: "Demirhindi & Hibiskus Çiçeği", portionGrams: 20, unit: "g", unitCost: 180, portionCost: 3.6, wastagePercent: 0 },
      { id: "ing_ice_05_2", name: "Baharat Karışımı (Çubuk Tarçın, Karanfil, Zencefil)", portionGrams: 10, unit: "g", unitCost: 220, portionCost: 2.2, wastagePercent: 0 },
      { id: "ing_ice_05_3", name: "Çiçek Balı & Pancar Şekeri", portionGrams: 25, unit: "g", unitCost: 140, portionCost: 3.5, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_ice_06", code: "REC-ICE-006",
    name: "Limonata (Ev Yapımı - Naneli)",
    category: "beverage", categoryLabel: "İçecekler",
    portionGrams: 250, prepTime: 15, cookTime: 0,
    calorie: 110, protein: 0.5, carb: 27.0, fat: 0.1,
    temp: "+4°C (Soğuk)",
    instructions: "Limon kabukları şekerle ovularak esansı çıkarılır; taze sıkılmış limon suyu, soğuk su ve taze nane yaprakları ile buz gibi karıştırılır.",
    labor: 2.0, gas: 0.0, overhead: 0.3,
    ingredients: [
      { id: "ing_ice_06_1", name: "Taze Sıkılmış Finike Limonu", portionGrams: 70, unit: "g", unitCost: 40, portionCost: 2.8, wastagePercent: 40 },
      { id: "ing_ice_06_2", name: "Limon Kabuğu Esansı & Şeker", portionGrams: 25, unit: "g", unitCost: 35, portionCost: 0.88, wastagePercent: 0 },
      { id: "ing_ice_06_3", name: "Taze Nane Yaprakları & Kaynak Suyu", portionGrams: 160, unit: "ml", unitCost: 15, portionCost: 2.4, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_ice_07", code: "REC-ICE-007",
    name: "Boza",
    category: "beverage", categoryLabel: "İçecekler",
    portionGrams: 220, prepTime: 20, cookTime: 40,
    calorie: 240, protein: 4.5, carb: 52.0, fat: 1.0,
    allergens: ["Gluten (Darı/Buğday)"],
    temp: "+10°C (Serin)",
    instructions: "Darı irmiği kaynatılıp süzülür ve fermente edilir; yoğun boza kıvamına gelince üzerine bol tarçın ve sarı leblebi eklenir.",
    labor: 3.0, gas: 1.5, overhead: 0.5,
    ingredients: [
      { id: "ing_ice_07_1", name: "Doğal Fermente Geleneksel Boza", portionGrams: 180, unit: "ml", unitCost: 45, portionCost: 8.1, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_ice_07_2", name: "Çifte Kavrulmuş Çorum Leblebisi", portionGrams: 25, unit: "g", unitCost: 120, portionCost: 3.0, wastagePercent: 0 },
      { id: "ing_ice_07_3", name: "Toz Seylan Tarçını", portionGrams: 5, unit: "g", unitCost: 200, portionCost: 1.0, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_ice_08", code: "REC-ICE-008",
    name: "Sahlep (Doğal Dağ Salebi)",
    category: "beverage", categoryLabel: "İçecekler",
    portionGrams: 220, prepTime: 10, cookTime: 20,
    calorie: 210, protein: 7.0, carb: 34.0, fat: 5.5,
    allergens: ["Laktoz (Süt)"],
    temp: "+75°C (Sıcak)",
    instructions: "Kastamonu taşköprü saf dağ salebi kök tozu süt ve şekerle kısık ateşte sürekli çırpılarak sakız kıvamına gelene kadar pişirilir; tarçınla sunulur.",
    labor: 3.5, gas: 1.5, overhead: 0.5,
    ingredients: [
      { id: "ing_ice_08_1", name: "Halis Taşköprü Dağ Salebi Tozu", portionGrams: 6, unit: "g", unitCost: 3200, portionCost: 19.2, wastagePercent: 0 },
      { id: "ing_ice_08_2", name: "Tam Yağlı Köy Sütü", portionGrams: 190, unit: "ml", unitCost: 35, portionCost: 6.65, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_ice_08_3", name: "Toz Şeker & Bol Toz Tarçın", portionGrams: 20, unit: "g", unitCost: 50, portionCost: 1.0, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_ice_09", code: "REC-ICE-009",
    name: "Şıra",
    category: "beverage", categoryLabel: "İçecekler",
    portionGrams: 220, prepTime: 10, cookTime: 0,
    calorie: 140, protein: 0.8, carb: 34.0, fat: 0.1,
    temp: "+4°C (Soğuk)",
    instructions: "Taze ezilmiş kırmızı üzüm şırası fermente olmadan pastörize edilip soğutulur; özellikle döner ve kebapların yanında içilir.",
    labor: 1.5, gas: 0.5, overhead: 0.3,
    ingredients: [
      { id: "ing_ice_09_1", name: "Doğal Taze Sıkılmış Üzüm Şırası", portionGrams: 220, unit: "ml", unitCost: 45, portionCost: 9.9, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_ice_10", code: "REC-ICE-10",
    name: "Reyhan Şerbeti",
    category: "beverage", categoryLabel: "İçecekler",
    portionGrams: 250, prepTime: 10, cookTime: 10,
    calorie: 95, protein: 0.3, carb: 24.0, fat: 0.0,
    temp: "+4°C (Soğuk)",
    instructions: "Mor reyhan yaprakları kaynar su, limon tuzu ve şekerle demlendirilir; mor renkli enfes aromalı şerbet süzülüp buzla sunulur.",
    labor: 1.8, gas: 0.5, overhead: 0.3,
    ingredients: [
      { id: "ing_ice_10_1", name: "Taze Mor Reyhan Demeti", portionGrams: 40, unit: "g", unitCost: 80, portionCost: 3.2, wastagePercent: 10 },
      { id: "ing_ice_10_2", name: "Toz Şeker & Limon Tuzu", portionGrams: 22, unit: "g", unitCost: 35, portionCost: 0.77, wastagePercent: 0 },
      { id: "ing_ice_10_3", name: "Kaynak Suyu & Buz", portionGrams: 200, unit: "ml", unitCost: 3, portionCost: 0.6, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_ice_11", code: "REC-ICE-011",
    name: "Karadut Suyu",
    category: "beverage", categoryLabel: "İçecekler",
    portionGrams: 250, prepTime: 10, cookTime: 0,
    calorie: 125, protein: 1.0, carb: 30.0, fat: 0.2,
    temp: "+4°C (Soğuk)",
    instructions: "Ege yöresi yabani karadut meyveleri ezilerek suyu çıkarılır; soğuk kaynak suyu ile inceltilip buz gibi servis edilir.",
    labor: 1.8, gas: 0.0, overhead: 0.3,
    ingredients: [
      { id: "ing_ice_11_1", name: "Ege Doğal Karadut Özü", portionGrams: 80, unit: "g", unitCost: 140, portionCost: 11.2, wastagePercent: 0 },
      { id: "ing_ice_11_2", name: "Kaynak Suyu & Parça Buz", portionGrams: 170, unit: "ml", unitCost: 3, portionCost: 0.51, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_ice_12", code: "REC-ICE-012",
    name: "Koruk Suyu",
    category: "beverage", categoryLabel: "İçecekler",
    portionGrams: 220, prepTime: 15, cookTime: 0,
    calorie: 80, protein: 0.4, carb: 20.0, fat: 0.0,
    temp: "+4°C (Soğuk)",
    instructions: "Olgunlaşmamış ekşi koruk üzümleri ezilip suyu süzülür; az şeker ve suyla dengelenerek serinletici ekşi şerbet yapılır.",
    labor: 2.0, gas: 0.0, overhead: 0.3,
    ingredients: [
      { id: "ing_ice_12_1", name: "Taze Sıkılmış Ham Koruk Üzüm Suyu", portionGrams: 100, unit: "ml", unitCost: 80, portionCost: 8.0, wastagePercent: 15 },
      { id: "ing_ice_12_2", name: "Kaynak Suyu & Şeker Şurubu", portionGrams: 120, unit: "ml", unitCost: 15, portionCost: 1.8, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_ice_13", code: "REC-ICE-013",
    name: "Meyve Suyu (Taze Sıkma Portakal / Nar)",
    category: "beverage", categoryLabel: "İçecekler",
    portionGrams: 250, prepTime: 8, cookTime: 0,
    calorie: 120, protein: 1.8, carb: 28.0, fat: 0.3,
    temp: "+4°C (Soğuk)",
    instructions: "Finike sulu sıkmalık portakalları veya Antakya narları sipariş anında hidrolik preste taze sıkılır; katkısız sunulur.",
    labor: 2.0, gas: 0.0, overhead: 0.3,
    ingredients: [
      { id: "ing_ice_13_1", name: "Finike Sıkmalık Portakal & Hicaz Narı", portionGrams: 400, unit: "g", unitCost: 35, portionCost: 14.0, wastagePercent: 45 }
    ]
  }),
  createRecipe({
    id: "rec_ice_14", code: "REC-ICE-014",
    name: "Soda / Maden Suyu (Sade / Limonlu)",
    category: "beverage", categoryLabel: "İçecekler",
    portionGrams: 200, prepTime: 2, cookTime: 0,
    calorie: 0, protein: 0.0, carb: 0.0, fat: 0.0,
    temp: "+4°C (Soğuk)",
    instructions: "Doğal zengin mineralli kaynak maden suyu, dilim taze limon ve buz eşliğinde cam şişede servis edilir.",
    labor: 0.8, gas: 0.0, overhead: 0.2,
    ingredients: [
      { id: "ing_ice_14_1", name: "Doğal Mineralli Maden Suyu (200ml Cam Şişe)", portionGrams: 200, unit: "ml", unitCost: 18, portionCost: 3.6, wastagePercent: 0 },
      { id: "ing_ice_14_2", name: "Taze Limon Dilimi & Buz", portionGrams: 20, unit: "g", unitCost: 35, portionCost: 0.7, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_ice_15", code: "REC-ICE-015",
    name: "Yayık Ayranı (Fesleğenli / Naneli)",
    category: "beverage", categoryLabel: "İçecekler",
    portionGrams: 250, prepTime: 5, cookTime: 0,
    calorie: 98, protein: 5.5, carb: 6.8, fat: 5.2,
    allergens: ["Laktoz"],
    temp: "+4°C (Soğuk)",
    instructions: "Yayık yoğurdu, taze bahçe fesleğeni veya dağ nanesi ile blenderda yüksek devirde köpürtülerek hazırlanır.",
    labor: 1.8, gas: 0.0, overhead: 0.3,
    ingredients: [
      { id: "ing_ice_15_1", name: "Tam Yağlı Köy Yoğurdu", portionGrams: 130, unit: "g", unitCost: 55, portionCost: 7.15, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_ice_15_2", name: "Taze Fesleğen & Nane Yaprakları", portionGrams: 10, unit: "g", unitCost: 120, portionCost: 1.2, wastagePercent: 10 },
      { id: "ing_ice_15_3", name: "Soğuk Kaynak Suyu & Kaya Tuzu", portionGrams: 120, unit: "ml", unitCost: 2, portionCost: 0.24, wastagePercent: 0 }
    ]
  })
];

const fileContent = `import { FoodRecipe } from "../../types";

export const beverageRecipes: FoodRecipe[] = ${JSON.stringify(beverages, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '../src/data/recipes/beverageRecipes.ts'), fileContent, 'utf8');
console.log(`Generated ${beverages.length} beverage recipes successfully.`);
