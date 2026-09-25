const fs = require('fs');
const path = require('path');
const { createRecipe } = require('./recipeHelper.cjs');

const meats = [
  createRecipe({
    id: "rec_etl_01", code: "REC-ETL-001",
    name: "İskender Kebap",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 280, prepTime: 25, cookTime: 30,
    calorie: 620, protein: 38.0, carb: 35.0, fat: 36.0,
    allergens: ["Gluten (Pide)", "Laktoz (Yoğurt, Tereyağı)"],
    instructions: "Tırnak pide küp doğranıp fırınlanır. Üzerine ince kesilmiş dana döner eti dizilir, domates sosu gezdirilir. Yanına tava yoğurdu, köz biber-domates konup üzerine kızgın tereyağı dökülür.",
    labor: 8.5, gas: 5.0, overhead: 1.5,
    ingredients: [
      { id: "ing_etl_01_1", name: "Dana Döner Eti (Kuzu Döş Karışımlı)", portionGrams: 140, unit: "g", unitCost: 480, portionCost: 67.2, wastagePercent: 15 },
      { id: "ing_etl_01_2", name: "Tırnak Pide", portionGrams: 70, unit: "g", unitCost: 35, portionCost: 2.45, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_etl_01_3", name: "Köy Tereyağı (Kızgın)", portionGrams: 25, unit: "g", unitCost: 340, portionCost: 8.5, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_etl_01_4", name: "Koyun / Tava Yoğurdu", portionGrams: 60, unit: "g", unitCost: 75, portionCost: 4.5, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_etl_01_5", name: "Tereyağlı Domates Sosu & Köz Biber", portionGrams: 45, unit: "g", unitCost: 45, portionCost: 2.03, wastagePercent: 5 }
    ]
  }),
  createRecipe({
    id: "rec_etl_02", code: "REC-ETL-002",
    name: "Ali Nazik Kebabı",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 270, prepTime: 30, cookTime: 40,
    calorie: 480, protein: 32.0, carb: 14.0, fat: 28.0,
    allergens: ["Laktoz (Süzme Yoğurt, Tereyağı)"],
    instructions: "Közlenmiş patlıcanlar ince kıyılıp sarımsaklı süzme yoğurt ile karıştırılarak beğendi tabanı hazırlanır. Üzerine tereyağında kekik ve pul biberle sotelenmiş kuzu veya dana kuşbaşı eklenir.",
    labor: 7.5, gas: 4.0, overhead: 1.2,
    ingredients: [
      { id: "ing_etl_02_1", name: "Kuzu & Dana Lokum Kuşbaşı", portionGrams: 130, unit: "g", unitCost: 460, portionCost: 59.8, wastagePercent: 20 },
      { id: "ing_etl_02_2", name: "Közlenmiş Patlıcan", portionGrams: 100, unit: "g", unitCost: 65, portionCost: 6.5, wastagePercent: 15 },
      { id: "ing_etl_02_3", name: "Süzme Yoğurt & Sarımsak", portionGrams: 70, unit: "g", unitCost: 75, portionCost: 5.25, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_etl_02_4", name: "Tereyağı & Pul Biber", portionGrams: 15, unit: "g", unitCost: 320, portionCost: 4.8, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_etl_03", code: "REC-ETL-003",
    name: "Hünkar Beğendi",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 280, prepTime: 30, cookTime: 65,
    calorie: 520, protein: 34.0, carb: 18.0, fat: 32.0,
    allergens: ["Gluten (Un)", "Laktoz (Süt, Kaşar, Tereyağı)"],
    instructions: "Köz patlıcan un, tereyağı, süt ve eski kaşarla beşamel kıvamında beğendiye dönüştürülür. Üzerine lokum gibi pişmiş domatesli tas kebabı konur.",
    labor: 8.0, gas: 4.5, overhead: 1.5,
    ingredients: [
      { id: "ing_etl_03_1", name: "Dana Kuşbaşı (But/Kol)", portionGrams: 140, unit: "g", unitCost: 440, portionCost: 61.6, wastagePercent: 22 },
      { id: "ing_etl_03_2", name: "Közlenmiş Patlıcan", portionGrams: 90, unit: "g", unitCost: 65, portionCost: 5.85, wastagePercent: 12 },
      { id: "ing_etl_03_3", name: "Süt, Un & Tereyağı (Beşamel)", portionGrams: 60, unit: "g", unitCost: 90, portionCost: 5.4, wastagePercent: 0, allergen: "Gluten, Laktoz" },
      { id: "ing_etl_03_4", name: "Rendelenmiş Kaşar Peyniri", portionGrams: 20, unit: "g", unitCost: 260, portionCost: 5.2, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_etl_03_5", name: "Salça, Arpacık Soğan & Baharat", portionGrams: 20, unit: "g", unitCost: 65, portionCost: 1.3, wastagePercent: 5 }
    ]
  }),
  createRecipe({
    id: "rec_etl_04", code: "REC-ETL-004",
    name: "Tas Kebabı",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 250, prepTime: 20, cookTime: 70,
    calorie: 410, protein: 33.0, carb: 16.0, fat: 22.0,
    allergens: ["Laktoz"],
    instructions: "Dana kuşbaşı etler arpacık soğan, sarımsak, havuç, patates küpleri ve salçalı sıcak et suyu ile ağır ateşte helmelenene kadar pişirilir.",
    labor: 7.0, gas: 4.2, overhead: 1.2,
    ingredients: [
      { id: "ing_etl_04_1", name: "Dana Kuşbaşı", portionGrams: 140, unit: "g", unitCost: 440, portionCost: 61.6, wastagePercent: 20 },
      { id: "ing_etl_04_2", name: "Patates & Havuç Küpleri", portionGrams: 50, unit: "g", unitCost: 25, portionCost: 1.25, wastagePercent: 10 },
      { id: "ing_etl_04_3", name: "Arpacık Soğan & Sarımsak", portionGrams: 30, unit: "g", unitCost: 35, portionCost: 1.05, wastagePercent: 10 },
      { id: "ing_etl_04_4", name: "Mutfak Tereyağı & Salça", portionGrams: 18, unit: "g", unitCost: 150, portionCost: 2.7, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_etl_05", code: "REC-ETL-005",
    name: "Kuzu Tandır",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 260, prepTime: 30, cookTime: 180,
    calorie: 540, protein: 42.0, carb: 6.0, fat: 38.0,
    allergens: [],
    instructions: "Kuzu kol veya but eti taze kekik, defne yaprağı ve tane karabiberle marine edilip döküm fırında 3 saat ağır ağır tandır kıvamında pişirilir.",
    labor: 9.0, gas: 6.5, overhead: 2.0,
    ingredients: [
      { id: "ing_etl_05_1", name: "Kuzu Kol / But (Kemikli Marine)", portionGrams: 220, unit: "g", unitCost: 460, portionCost: 101.2, wastagePercent: 35 },
      { id: "ing_etl_05_2", name: "Arpacık Soğan & Sarımsak Başları", portionGrams: 30, unit: "g", unitCost: 35, portionCost: 1.05, wastagePercent: 10 },
      { id: "ing_etl_05_3", name: "Zeytinyağı, Dağ Kekiği & Tane Karabiber", portionGrams: 15, unit: "ml", unitCost: 240, portionCost: 3.6, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_etl_06", code: "REC-ETL-006",
    name: "Adana Kebap",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 260, prepTime: 30, cookTime: 20,
    calorie: 510, protein: 35.0, carb: 22.0, fat: 34.0,
    allergens: ["Gluten (Lavaş)"],
    instructions: "Zırhla çekilmiş kuzu eti, kuyruk yağı, pul biber ve tuz yoğrulup geniş şişe saplanır. Meşe kömüründe pişirilip sumaklı soğan ve lavaş ile sunulur.",
    labor: 7.5, gas: 3.5, overhead: 1.2,
    ingredients: [
      { id: "ing_etl_06_1", name: "Zırh Kıyma (Kuzu Döş & Boşluk)", portionGrams: 140, unit: "g", unitCost: 450, portionCost: 63.0, wastagePercent: 18 },
      { id: "ing_etl_06_2", name: "Kuzu Kuyruk Yağı", portionGrams: 30, unit: "g", unitCost: 280, portionCost: 8.4, wastagePercent: 0 },
      { id: "ing_etl_06_3", name: "Kapya Biber & Antep Pul Biber", portionGrams: 20, unit: "g", unitCost: 60, portionCost: 1.2, wastagePercent: 5 },
      { id: "ing_etl_06_4", name: "Tırnak Lavaş & Sumaklı Maydanozlu Soğan", portionGrams: 60, unit: "g", unitCost: 40, portionCost: 2.4, wastagePercent: 5, allergen: "Gluten" }
    ]
  }),
  createRecipe({
    id: "rec_etl_07", code: "REC-ETL-007",
    name: "Urfa Kebap",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 260, prepTime: 25, cookTime: 20,
    calorie: 490, protein: 36.0, carb: 22.0, fat: 32.0,
    allergens: ["Gluten (Lavaş)"],
    instructions: "Zırh kıyması kuyruk yağı ve tuz ile sade olarak yoğrulur; acısız ve yumuşak lezzetiyle ızgarada pişirilir, közlenmiş sebzelerle sunulur.",
    labor: 7.0, gas: 3.5, overhead: 1.2,
    ingredients: [
      { id: "ing_etl_07_1", name: "Kuzu Döş & Dana Boşluk Zırh Kıyma", portionGrams: 140, unit: "g", unitCost: 440, portionCost: 61.6, wastagePercent: 18 },
      { id: "ing_etl_07_2", name: "Kuyruk Yağı", portionGrams: 25, unit: "g", unitCost: 280, portionCost: 7.0, wastagePercent: 0 },
      { id: "ing_etl_07_3", name: "Lavaş & Köz Domates Biber", portionGrams: 60, unit: "g", unitCost: 40, portionCost: 2.4, wastagePercent: 5, allergen: "Gluten" }
    ]
  }),
  createRecipe({
    id: "rec_etl_08", code: "REC-ETL-008",
    name: "Cağ Kebabı",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 250, prepTime: 40, cookTime: 30,
    calorie: 520, protein: 40.0, carb: 12.0, fat: 35.0,
    allergens: ["Gluten (Lavaş)"],
    instructions: "Erzurum usulü kuzu budu soğan, yoğurt, karabiber ve reyhanla marine edilip yatık şişte odun ateşinde pişirilir; cağ şişleriyle kesilip sıcak lavaşta sunulur.",
    labor: 8.5, gas: 5.0, overhead: 1.5,
    ingredients: [
      { id: "ing_etl_08_1", name: "Kuzu But & Sırt Eti", portionGrams: 160, unit: "g", unitCost: 480, portionCost: 76.8, wastagePercent: 22 },
      { id: "ing_etl_08_2", name: "Marinasyon (Soğan Suyu, Yoğurt, Reyhan)", portionGrams: 30, unit: "g", unitCost: 60, portionCost: 1.8, wastagePercent: 0 },
      { id: "ing_etl_08_3", name: "Tandır Lavaş & Köz Biber", portionGrams: 50, unit: "g", unitCost: 45, portionCost: 2.25, wastagePercent: 0, allergen: "Gluten" }
    ]
  }),
  createRecipe({
    id: "rec_etl_09", code: "REC-ETL-009",
    name: "Kuru Fasulye (Etli)",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 270, prepTime: 20, cookTime: 85,
    calorie: 410, protein: 26.0, carb: 38.0, fat: 16.0,
    allergens: ["Laktoz"],
    instructions: "İspir fasulyesi akşamdan ıslatılır. Kuşbaşı dana eti tereyağı ve salça ile kavrulup güveçte fasulye ile ağır ateşte pişirilir.",
    labor: 6.5, gas: 4.5, overhead: 1.2,
    ingredients: [
      { id: "ing_etl_09_1", name: "İspir Kuru Fasulye", portionGrams: 85, unit: "g", unitCost: 110, portionCost: 9.35, wastagePercent: 0 },
      { id: "ing_etl_09_2", name: "Dana Kuşbaşı", portionGrams: 60, unit: "g", unitCost: 440, portionCost: 26.4, wastagePercent: 18 },
      { id: "ing_etl_09_3", name: "Kuru Soğan & Biber Salçası", portionGrams: 35, unit: "g", unitCost: 40, portionCost: 1.4, wastagePercent: 8 },
      { id: "ing_etl_09_4", name: "Trabzon Köy Tereyağı", portionGrams: 15, unit: "g", unitCost: 320, portionCost: 4.8, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_etl_10", code: "REC-ETL-010",
    name: "Etli Yaprak Sarması",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 240, prepTime: 45, cookTime: 50,
    calorie: 360, protein: 22.0, carb: 26.0, fat: 18.0,
    allergens: ["Laktoz (Yoğurt Garnitür)"],
    instructions: "Tokat asma yaprağına kıymalı, pirinçli, bol soğan ve dereotlu harç incecik sarılır; tereyağlı salçalı suda kısık ateşte pişirilip sarmısaklı yoğurtla servis edilir.",
    labor: 8.5, gas: 3.5, overhead: 1.2,
    ingredients: [
      { id: "ing_etl_10_1", name: "Tokat Asma Yaprağı (Salamura)", portionGrams: 50, unit: "g", unitCost: 130, portionCost: 6.5, wastagePercent: 5 },
      { id: "ing_etl_10_2", name: "Dana & Kuzu Kıyma Harcı", portionGrams: 75, unit: "g", unitCost: 420, portionCost: 31.5, wastagePercent: 12 },
      { id: "ing_etl_10_3", name: "Baldo Pirinç & Kuru Soğan", portionGrams: 35, unit: "g", unitCost: 60, portionCost: 2.1, wastagePercent: 5 },
      { id: "ing_etl_10_4", name: "Süzme Yoğurt (Garnitür) & Tereyağı", portionGrams: 50, unit: "g", unitCost: 120, portionCost: 6.0, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_etl_11", code: "REC-ETL-011",
    name: "Kilerci Güveci / Çömlek Kebabı",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 280, prepTime: 35, cookTime: 120,
    calorie: 460, protein: 35.0, carb: 20.0, fat: 26.0,
    allergens: [],
    instructions: "Toprak çömleğe kuzu kuşbaşı, sarımsak, arpacık soğan, patlıcan, domates ve biber dizilir; kapağı hamurla sıvanıp fırında 2 saat demlendirilir.",
    labor: 8.0, gas: 5.5, overhead: 1.5,
    ingredients: [
      { id: "ing_etl_11_1", name: "Kuzu Kuşbaşı", portionGrams: 140, unit: "g", unitCost: 460, portionCost: 64.4, wastagePercent: 22 },
      { id: "ing_etl_11_2", name: "Kemer Patlıcan & Köy Biberi", portionGrams: 70, unit: "g", unitCost: 35, portionCost: 2.45, wastagePercent: 12 },
      { id: "ing_etl_11_3", name: "Arpacık Soğan & Bol Diş Sarımsak", portionGrams: 40, unit: "g", unitCost: 40, portionCost: 1.6, wastagePercent: 10 },
      { id: "ing_etl_11_4", name: "Kuyruk Yağı & Domates", portionGrams: 35, unit: "g", unitCost: 100, portionCost: 3.5, wastagePercent: 5 }
    ]
  }),
  createRecipe({
    id: "rec_etl_12", code: "REC-ETL-012",
    name: "Kuru Patlıcan Dolması (Etli)",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 250, prepTime: 35, cookTime: 55,
    calorie: 390, protein: 21.0, carb: 34.0, fat: 19.0,
    allergens: ["Laktoz (Garnitür)"],
    instructions: "Gaziantep kuru patlıcanları haşlanır. Zırh kıyma, pirinç, sumak ekşisi, nar ekşisi, sarımsak ve salçalı harçla doldurulup kısık ateşte pişirilir.",
    labor: 7.5, gas: 3.5, overhead: 1.2,
    ingredients: [
      { id: "ing_etl_12_1", name: "Kurutulmuş Antep Patlıcanı (4 adet)", portionGrams: 35, unit: "g", unitCost: 240, portionCost: 8.4, wastagePercent: 0 },
      { id: "ing_etl_12_2", name: "Kuzu & Dana Kıyma", portionGrams: 70, unit: "g", unitCost: 420, portionCost: 29.4, wastagePercent: 12 },
      { id: "ing_etl_12_3", name: "Baldo Pirinç & Kuru Soğan", portionGrams: 35, unit: "g", unitCost: 65, portionCost: 2.28, wastagePercent: 5 },
      { id: "ing_etl_12_4", name: "Sumak Ekşisi, Nar Ekşisi & Salça", portionGrams: 20, unit: "g", unitCost: 120, portionCost: 2.4, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_etl_13", code: "REC-ETL-013",
    name: "Etli Biber Dolması",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 250, prepTime: 25, cookTime: 45,
    calorie: 340, protein: 20.0, carb: 28.0, fat: 16.0,
    allergens: ["Laktoz (Yoğurt)"],
    instructions: "Taze dolmalık biberler kıymalı pirinçli harçla doldurulup domates kapak kapatılır; salçalı et suyunda pişirilir.",
    labor: 6.5, gas: 3.0, overhead: 1.0,
    ingredients: [
      { id: "ing_etl_13_1", name: "Dolmalık Biber (3 adet)", portionGrams: 100, unit: "g", unitCost: 40, portionCost: 4.0, wastagePercent: 10 },
      { id: "ing_etl_13_2", name: "Dana Kıyma", portionGrams: 65, unit: "g", unitCost: 420, portionCost: 27.3, wastagePercent: 12 },
      { id: "ing_etl_13_3", name: "Pirinç, Soğan, Salça", portionGrams: 40, unit: "g", unitCost: 55, portionCost: 2.2, wastagePercent: 5 },
      { id: "ing_etl_13_4", name: "Süzme Yoğurt Garnitür", portionGrams: 40, unit: "g", unitCost: 70, portionCost: 2.8, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_etl_14", code: "REC-ETL-014",
    name: "İnegöl Köfte",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 240, prepTime: 25, cookTime: 15,
    calorie: 460, protein: 35.0, carb: 6.0, fat: 32.0,
    allergens: [],
    instructions: "Dana döş ve kuzu eti harmanlanıp karbonat ve kaya tuzu ile yoğrulur; bir gece dinlendirildikten sonra parmak şeklinde ızgarada mühürlenir.",
    labor: 6.5, gas: 3.0, overhead: 1.0,
    ingredients: [
      { id: "ing_etl_14_1", name: "Dana Döş & Kuzu Eti Kıyma", portionGrams: 160, unit: "g", unitCost: 440, portionCost: 70.4, wastagePercent: 18 },
      { id: "ing_etl_14_2", name: "Karbonat, Kaya Tuzu & Soğan Suyu", portionGrams: 15, unit: "g", unitCost: 40, portionCost: 0.6, wastagePercent: 0 },
      { id: "ing_etl_14_3", name: "Garnitür Piyaz & Köz Biber", portionGrams: 60, unit: "g", unitCost: 40, portionCost: 2.4, wastagePercent: 5 }
    ]
  }),
  createRecipe({
    id: "rec_etl_15", code: "REC-ETL-015",
    name: "Akçaabat Köfte",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 250, prepTime: 25, cookTime: 15,
    calorie: 480, protein: 36.0, carb: 8.0, fat: 34.0,
    allergens: ["Gluten (Ekmek İçi)"],
    instructions: "Trabzon Akçaabat usulü dana eti, bol sarımsak, bayat ekmek içi ve iç yağı yoğrulur. Yassı köfteler harlı ızgarada dışı çıtır içi sulu pişirilir.",
    labor: 6.8, gas: 3.2, overhead: 1.0,
    ingredients: [
      { id: "ing_etl_15_1", name: "Dana Kıyma (Döş) & Böbrek Yağı", portionGrams: 160, unit: "g", unitCost: 440, portionCost: 70.4, wastagePercent: 18 },
      { id: "ing_etl_15_2", name: "Taşköprü Sarımsağı & Bayat Ekmek", portionGrams: 25, unit: "g", unitCost: 50, portionCost: 1.25, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_etl_15_3", name: "Közlenmiş Domates & Biber Garnitür", portionGrams: 60, unit: "g", unitCost: 35, portionCost: 2.1, wastagePercent: 5 }
    ]
  }),
  createRecipe({
    id: "rec_etl_16", code: "REC-ETL-016",
    name: "Tekirdağ Köfte",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 240, prepTime: 25, cookTime: 15,
    calorie: 450, protein: 34.0, carb: 10.0, fat: 30.0,
    allergens: ["Gluten"],
    instructions: "Dana ve kuzu kıyma irmik/ekmek, soğan ve sarımsakla elastik olana dek yoğrulur; özel acı sosu ile servis edilir.",
    labor: 6.5, gas: 3.0, overhead: 1.0,
    ingredients: [
      { id: "ing_etl_16_1", name: "Dana & Kuzu Köftelik Kıyma", portionGrams: 155, unit: "g", unitCost: 440, portionCost: 68.2, wastagePercent: 18 },
      { id: "ing_etl_16_2", name: "İrmik, Soğan & Baharat", portionGrams: 20, unit: "g", unitCost: 50, portionCost: 1.0, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_etl_16_3", name: "Tekirdağ Acı Sosu & Garnitür", portionGrams: 40, unit: "g", unitCost: 60, portionCost: 2.4, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_etl_17", code: "REC-ETL-017",
    name: "İzmir Köfte",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 270, prepTime: 30, cookTime: 45,
    calorie: 440, protein: 28.0, carb: 26.0, fat: 24.0,
    allergens: ["Gluten", "Yumurta"],
    instructions: "Oval şekilli köfteler ve elma dilim patatesler hafif kızartılıp fırın tepsisine dizilir; domates salçalı sos ve sivri biberle fırınlanır.",
    labor: 6.5, gas: 3.5, overhead: 1.0,
    ingredients: [
      { id: "ing_etl_17_1", name: "Dana Kıyma Harcı (Köfte)", portionGrams: 120, unit: "g", unitCost: 420, portionCost: 50.4, wastagePercent: 15, allergen: "Gluten, Yumurta" },
      { id: "ing_etl_17_2", name: "Patates (Elma Dilim)", portionGrams: 80, unit: "g", unitCost: 22, portionCost: 1.76, wastagePercent: 10 },
      { id: "ing_etl_17_3", name: "Köy Biberi & Domates", portionGrams: 40, unit: "g", unitCost: 35, portionCost: 1.4, wastagePercent: 5 },
      { id: "ing_etl_17_4", name: "Fırın Salça Sosu & Sıvı Yağ", portionGrams: 25, unit: "g", unitCost: 60, portionCost: 1.5, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_etl_18", code: "REC-ETL-018",
    name: "Kadınbudu Köfte",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 240, prepTime: 30, cookTime: 25,
    calorie: 460, protein: 26.0, carb: 24.0, fat: 28.0,
    allergens: ["Gluten", "Yumurta"],
    instructions: "Kıymanın yarısı soğanla kavrulur, haşlanmış pirinç ve çiğ kıyma ile yoğrulur. İri oval köfteler un ve yumurtaya bulanıp altın sarısı kızartılır.",
    labor: 6.8, gas: 3.0, overhead: 1.0,
    ingredients: [
      { id: "ing_etl_18_1", name: "Dana Kıyma (Az Yağlı)", portionGrams: 120, unit: "g", unitCost: 420, portionCost: 50.4, wastagePercent: 12 },
      { id: "ing_etl_18_2", name: "Haşlanmış Kırık Pirinç", portionGrams: 40, unit: "g", unitCost: 50, portionCost: 2.0, wastagePercent: 0 },
      { id: "ing_etl_18_3", name: "Panelik Un & Yumurta", portionGrams: 30, unit: "g", unitCost: 80, portionCost: 2.4, wastagePercent: 0, allergen: "Gluten, Yumurta" },
      { id: "ing_etl_18_4", name: "Kızartma Yağı & Baharatlar", portionGrams: 20, unit: "ml", unitCost: 80, portionCost: 1.6, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_etl_19", code: "REC-ETL-019",
    name: "Elbasan Tava",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 270, prepTime: 35, cookTime: 70,
    calorie: 530, protein: 36.0, carb: 14.0, fat: 36.0,
    allergens: ["Laktoz (Yoğurt, Tereyağı)", "Yumurta", "Gluten (Un)"],
    instructions: "Lokum gibi haşlanmış kuzu eti fırın tepsisine dizilir. Yoğurt, yumurta, un ve sarımsakla hazırlanan özel sos etlerin üzerine yayılıp fırında nar gibi kızartılır.",
    labor: 8.0, gas: 4.5, overhead: 1.2,
    ingredients: [
      { id: "ing_etl_19_1", name: "Kuzu Kol / Gerdan Eti", portionGrams: 150, unit: "g", unitCost: 460, portionCost: 69.0, wastagePercent: 22 },
      { id: "ing_etl_19_2", name: "Süzme Yoğurt Terbiyesi", portionGrams: 60, unit: "g", unitCost: 75, portionCost: 4.5, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_etl_19_3", name: "Yumurta & Un", portionGrams: 25, unit: "g", unitCost: 80, portionCost: 2.0, wastagePercent: 0, allergen: "Yumurta, Gluten" },
      { id: "ing_etl_19_4", name: "Tereyağı & Sarımsak", portionGrams: 15, unit: "g", unitCost: 280, portionCost: 4.2, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_etl_20", code: "REC-ETL-020",
    name: "Beyti Kebabı",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 290, prepTime: 35, cookTime: 30,
    calorie: 580, protein: 35.0, carb: 38.0, fat: 32.0,
    allergens: ["Gluten (Lavaş)", "Laktoz (Yoğurt, Kaşar, Tereyağı)"],
    instructions: "Zırh kıyması şişte pişirilir, kaşarlı ince lavaşa sarılıp dilimlenir. Fırında kızartılıp üzerine domates sosu ve eritilmiş tereyağı dökülür; süzme yoğurt ile servis edilir.",
    labor: 8.5, gas: 4.5, overhead: 1.5,
    ingredients: [
      { id: "ing_etl_20_1", name: "Kuzu & Dana Zırh Kıyma", portionGrams: 140, unit: "g", unitCost: 440, portionCost: 61.6, wastagePercent: 18 },
      { id: "ing_etl_20_2", name: "Özel İnce Dürüm Lavaş", portionGrams: 60, unit: "g", unitCost: 45, portionCost: 2.7, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_etl_20_3", name: "Rendelenmiş Kaşar Peyniri", portionGrams: 20, unit: "g", unitCost: 260, portionCost: 5.2, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_etl_20_4", name: "Süzme Yoğurt & Tereyağlı Sos", portionGrams: 60, unit: "g", unitCost: 150, portionCost: 9.0, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_etl_21", code: "REC-ETL-021",
    name: "Çökertme Kebabı",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 280, prepTime: 30, cookTime: 25,
    calorie: 540, protein: 36.0, carb: 32.0, fat: 30.0,
    allergens: ["Laktoz (Yoğurt, Tereyağı)"],
    instructions: "Kibrit çöpü inceliğinde çıtır patatesler tabağa yayılır. Üzerine sarımsaklı yoğurt, jülyen marine dana bonfile/kontrfile ve tereyağlı domates sos dökülür.",
    labor: 8.0, gas: 4.0, overhead: 1.2,
    ingredients: [
      { id: "ing_etl_21_1", name: "Dana Kontrfile / Bonfile (Jülyen)", portionGrams: 140, unit: "g", unitCost: 550, portionCost: 77.0, wastagePercent: 15 },
      { id: "ing_etl_21_2", name: "Kibrit Patates (Kızarmış)", portionGrams: 70, unit: "g", unitCost: 35, portionCost: 2.45, wastagePercent: 15 },
      { id: "ing_etl_21_3", name: "Sarımsaklı Süzme Yoğurt", portionGrams: 60, unit: "g", unitCost: 75, portionCost: 4.5, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_etl_21_4", name: "Kızgın Tereyağlı Salça Sosu", portionGrams: 20, unit: "g", unitCost: 200, portionCost: 4.0, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_etl_22", code: "REC-ETL-022",
    name: "Kestaneli Et Yahni",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 270, prepTime: 30, cookTime: 75,
    calorie: 460, protein: 32.0, carb: 28.0, fat: 22.0,
    allergens: ["Laktoz"],
    instructions: "Dana kuşbaşı etler arpacık soğan ve havuçla karamelize edilir. Önceden haşlanıp soyulmuş kestaneler ve et suyu eklenerek kısık ateşte demlendirilir.",
    labor: 7.5, gas: 4.5, overhead: 1.2,
    ingredients: [
      { id: "ing_etl_22_1", name: "Dana Kuşbaşı", portionGrams: 130, unit: "g", unitCost: 440, portionCost: 57.2, wastagePercent: 20 },
      { id: "ing_etl_22_2", name: "Bursa Kestanesi (Ayıklanmış)", portionGrams: 50, unit: "g", unitCost: 240, portionCost: 12.0, wastagePercent: 0 },
      { id: "ing_etl_22_3", name: "Arpacık Soğan & Sarımsak", portionGrams: 35, unit: "g", unitCost: 40, portionCost: 1.4, wastagePercent: 10 },
      { id: "ing_etl_22_4", name: "Tereyağı, Salça & Et Suyu", portionGrams: 25, unit: "g", unitCost: 120, portionCost: 3.0, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_etl_23", code: "REC-ETL-023",
    name: "Ciğer Tava (Arnavut Ciğeri)",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 240, prepTime: 25, cookTime: 15,
    calorie: 430, protein: 32.0, carb: 20.0, fat: 24.0,
    allergens: ["Gluten (Un)"],
    instructions: "Zarı soyulup küp doğranmış dana ciğeri unlanıp kızgın yağda 3-4 dakika çıtır pişirilir. Kimyon, pul biber ve sumaklı piyaz soğanla harmanlanır.",
    labor: 6.5, gas: 3.0, overhead: 1.0,
    ingredients: [
      { id: "ing_etl_23_1", name: "Zarı Soyulmuş Taze Dana Ciğeri", portionGrams: 150, unit: "g", unitCost: 360, portionCost: 54.0, wastagePercent: 15 },
      { id: "ing_etl_23_2", name: "Un & Baharat (Kimyon, Pul Biber)", portionGrams: 25, unit: "g", unitCost: 60, portionCost: 1.5, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_etl_23_3", name: "Sumaklı & Maydanozlu Kırmızı Soğan Piyazı", portionGrams: 60, unit: "g", unitCost: 35, portionCost: 2.1, wastagePercent: 5 },
      { id: "ing_etl_23_4", name: "Kızartma Yağı", portionGrams: 20, unit: "ml", unitCost: 75, portionCost: 1.5, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_etl_24", code: "REC-ETL-024",
    name: "Sini Kebabı (Tepsi Kebabı)",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 270, prepTime: 25, cookTime: 35,
    calorie: 510, protein: 36.0, carb: 14.0, fat: 34.0,
    allergens: [],
    instructions: "Hatay/Antakya usulü zırh kıyması sarımsak, biber ve maydanozla yoğrulup tepsiye bastırılarak yayılır; salçalı su, domates ve biber dilimleriyle fırınlanır.",
    labor: 7.0, gas: 4.0, overhead: 1.2,
    ingredients: [
      { id: "ing_etl_24_1", name: "Dana & Kuzu Zırh Kıyma", portionGrams: 160, unit: "g", unitCost: 440, portionCost: 70.4, wastagePercent: 18 },
      { id: "ing_etl_24_2", name: "Kapya Biber, Maydanoz & Sarımsak", portionGrams: 35, unit: "g", unitCost: 45, portionCost: 1.58, wastagePercent: 5 },
      { id: "ing_etl_24_3", name: "Biber Salçası Sosu & Domates Dilimi", portionGrams: 40, unit: "g", unitCost: 50, portionCost: 2.0, wastagePercent: 5 }
    ]
  }),
  createRecipe({
    id: "rec_etl_25", code: "REC-ETL-025",
    name: "Etli Ekmek",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 280, prepTime: 30, cookTime: 12,
    calorie: 560, protein: 32.0, carb: 58.0, fat: 22.0,
    allergens: ["Gluten"],
    instructions: "Konya usulü ince açılmış mayalı hamur üzerine bıçakarası dana eti, domates, biber ve maydanozlu sulu harç yayılıp taş fırında çıtır çıtır pişirilir.",
    labor: 7.5, gas: 4.0, overhead: 1.2,
    ingredients: [
      { id: "ing_etl_25_1", name: "Özel Bıçakarası Dana Eti (Kıyma Karışımlı)", portionGrams: 110, unit: "g", unitCost: 440, portionCost: 48.4, wastagePercent: 15 },
      { id: "ing_etl_25_2", name: "Konya Unu Mayalı Hamur", portionGrams: 120, unit: "g", unitCost: 35, portionCost: 4.2, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_etl_25_3", name: "Domates, Yeşil Biber & Maydanoz Harcı", portionGrams: 50, unit: "g", unitCost: 35, portionCost: 1.75, wastagePercent: 5 }
    ]
  }),
  createRecipe({
    id: "rec_etl_26", code: "REC-ETL-026",
    name: "Fırın Kebabı (Kuzu)",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 260, prepTime: 25, cookTime: 240,
    calorie: 580, protein: 44.0, carb: 4.0, fat: 42.0,
    allergens: ["Gluten (Tırnak Pide)"],
    instructions: "Konya fırın kebabı geleneğiyle kuzu eti sadece meşe odunu ateşinde kendi yağı ve suyuyla 4 saatte lokum haline getirilir; tırnak pide üstünde verilir.",
    labor: 9.5, gas: 7.0, overhead: 2.0,
    ingredients: [
      { id: "ing_etl_26_1", name: "Kuzu Kaburga & Gerdan (Yağlı)", portionGrams: 230, unit: "g", unitCost: 460, portionCost: 105.8, wastagePercent: 38 },
      { id: "ing_etl_26_2", name: "Tırnak Pide Tabanı", portionGrams: 40, unit: "g", unitCost: 35, portionCost: 1.4, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_etl_26_3", name: "Kaya Tuzu & Köz Biber", portionGrams: 20, unit: "g", unitCost: 30, portionCost: 0.6, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_etl_27", code: "REC-ETL-027",
    name: "Tirit",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 290, prepTime: 30, cookTime: 60,
    calorie: 510, protein: 34.0, carb: 40.0, fat: 24.0,
    allergens: ["Gluten (Pide)", "Laktoz (Yoğurt, Tereyağı)"],
    instructions: "Bayat tırnak pideler kemik suyu ile ıslatılır. Üzerine sarımsaklı yoğurt, didilmiş dana/kuzu eti, tereyağlı biber sos ve maydanoz serpilir.",
    labor: 7.0, gas: 3.5, overhead: 1.2,
    ingredients: [
      { id: "ing_etl_27_1", name: "Haşlanmış Didik Kuzu / Dana Eti", portionGrams: 120, unit: "g", unitCost: 450, portionCost: 54.0, wastagePercent: 15 },
      { id: "ing_etl_27_2", name: "Küp Doğranmış Bayat Pide", portionGrams: 80, unit: "g", unitCost: 30, portionCost: 2.4, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_etl_27_3", name: "İlikli Kemik Suyu", portionGrams: 80, unit: "ml", unitCost: 35, portionCost: 2.8, wastagePercent: 0 },
      { id: "ing_etl_27_4", name: "Süzme Yoğurt & Kızgın Tereyağı", portionGrams: 50, unit: "g", unitCost: 180, portionCost: 9.0, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_etl_28", code: "REC-ETL-028",
    name: "Kavurma",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 230, prepTime: 20, cookTime: 90,
    calorie: 540, protein: 42.0, carb: 2.0, fat: 40.0,
    allergens: [],
    instructions: "Kuşbaşı dana eti kendi yağında suyunu çekene kadar kavrulur, iç yağı ilave edilip kısık ateşte lokum gibi pişirilir.",
    labor: 7.0, gas: 5.0, overhead: 1.5,
    ingredients: [
      { id: "ing_etl_28_1", name: "Dana But & Kol Kuşbaşı", portionGrams: 180, unit: "g", unitCost: 440, portionCost: 79.2, wastagePercent: 28 },
      { id: "ing_etl_28_2", name: "Kavurmalık Dana İç Yağı", portionGrams: 30, unit: "g", unitCost: 150, portionCost: 4.5, wastagePercent: 0 },
      { id: "ing_etl_28_3", name: "Kaya Tuzu & Tane Karabiber", portionGrams: 4, unit: "g", unitCost: 60, portionCost: 0.24, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_etl_29", code: "REC-ETL-029",
    name: "Saç Kavurma",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 260, prepTime: 20, cookTime: 30,
    calorie: 460, protein: 35.0, carb: 10.0, fat: 30.0,
    allergens: [],
    instructions: "Kuzu eti iç yağı ile saç tavada harlı ateşte çevrilir; arpacık soğan, sarımsak, sivri biber ve soyulmuş küp domates eklenip suyunu çektirmeden pişirilir.",
    labor: 7.0, gas: 4.0, overhead: 1.2,
    ingredients: [
      { id: "ing_etl_29_1", name: "Kuzu Kuşbaşı (Küçük Doğranmış)", portionGrams: 140, unit: "g", unitCost: 460, portionCost: 64.4, wastagePercent: 20 },
      { id: "ing_etl_29_2", name: "Kuyruk / İç Yağı", portionGrams: 20, unit: "g", unitCost: 240, portionCost: 4.8, wastagePercent: 0 },
      { id: "ing_etl_29_3", name: "Köy Biberi & Salkım Domates", portionGrams: 60, unit: "g", unitCost: 35, portionCost: 2.1, wastagePercent: 5 },
      { id: "ing_etl_29_4", name: "Sarımsak, Kekik & Pul Biber", portionGrams: 10, unit: "g", unitCost: 60, portionCost: 0.6, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_etl_30", code: "REC-ETL-030",
    name: "Kuzu Kapama",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 270, prepTime: 25, cookTime: 90,
    calorie: 470, protein: 38.0, carb: 12.0, fat: 30.0,
    allergens: ["Laktoz (Tereyağı)"],
    instructions: "Kuzu kol etleri taze taze marul, taze soğan ve dereotu ile kapama tenceresine dizilip kendi buharında ağır ağır pişirilir.",
    labor: 8.0, gas: 4.5, overhead: 1.2,
    ingredients: [
      { id: "ing_etl_30_1", name: "Kuzu Kol Parça Et", portionGrams: 160, unit: "g", unitCost: 460, portionCost: 73.6, wastagePercent: 25 },
      { id: "ing_etl_30_2", name: "Kıvırcık Marul & Taze Soğan", portionGrams: 60, unit: "g", unitCost: 45, portionCost: 2.7, wastagePercent: 10 },
      { id: "ing_etl_30_3", name: "Taze Dereotu & Tereyağı", portionGrams: 20, unit: "g", unitCost: 200, portionCost: 4.0, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_etl_31", code: "REC-ETL-031",
    name: "Karnıyarık",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 260, prepTime: 25, cookTime: 40,
    calorie: 380, protein: 22.0, carb: 18.0, fat: 24.0,
    allergens: [],
    instructions: "Alacalı soyulup kızartılan kemer patlıcanların ortası açılır, kıymalı soğanlı domatesli harç doldurulup salçalı fırınlanır.",
    labor: 6.5, gas: 3.5, overhead: 1.0,
    ingredients: [
      { id: "ing_etl_31_1", name: "Kemer Patlıcan", portionGrams: 130, unit: "g", unitCost: 40, portionCost: 5.2, wastagePercent: 12 },
      { id: "ing_etl_31_2", name: "Dana Kıyma (Karnıyarık Harcı)", portionGrams: 65, unit: "g", unitCost: 420, portionCost: 27.3, wastagePercent: 14 },
      { id: "ing_etl_31_3", name: "Soğan, Domates, Biber & Salça", portionGrams: 45, unit: "g", unitCost: 35, portionCost: 1.58, wastagePercent: 5 },
      { id: "ing_etl_31_4", name: "Kızartma Sıvı Yağı", portionGrams: 20, unit: "ml", unitCost: 80, portionCost: 1.6, wastagePercent: 10 }
    ]
  }),
  createRecipe({
    id: "rec_etl_32", code: "REC-ETL-032",
    name: "Patlıcan Kebabı",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 280, prepTime: 30, cookTime: 40,
    calorie: 490, protein: 34.0, carb: 18.0, fat: 32.0,
    allergens: [],
    instructions: "Gaziantep ve Birecik usulü yuvarlak patlıcan dilimleri arasına zırh kıyma köfteleri dizilip şişte veya fırında köz tadında pişirilir.",
    labor: 7.5, gas: 4.0, overhead: 1.2,
    ingredients: [
      { id: "ing_etl_32_1", name: "Kuzu & Dana Zırh Kıyma", portionGrams: 140, unit: "g", unitCost: 440, portionCost: 61.6, wastagePercent: 18 },
      { id: "ing_etl_32_2", name: "Birecik Patlıcanı (Dilim)", portionGrams: 120, unit: "g", unitCost: 45, portionCost: 5.4, wastagePercent: 10 },
      { id: "ing_etl_32_3", name: "Köz Biber & Domates Garnitür", portionGrams: 40, unit: "g", unitCost: 35, portionCost: 1.4, wastagePercent: 5 }
    ]
  }),
  createRecipe({
    id: "rec_etl_33", code: "REC-ETL-033",
    name: "Kuzu Güveç",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 280, prepTime: 30, cookTime: 90,
    calorie: 470, protein: 35.0, carb: 18.0, fat: 28.0,
    allergens: [],
    instructions: "Toprak güveçte kuzu eti, patlıcan, arpacık soğan, taze fasulye, domates ve sarımsak kısık ateşte kendi suyunda pişirilir.",
    labor: 7.5, gas: 4.5, overhead: 1.2,
    ingredients: [
      { id: "ing_etl_33_1", name: "Kuzu Kuşbaşı", portionGrams: 140, unit: "g", unitCost: 460, portionCost: 64.4, wastagePercent: 22 },
      { id: "ing_etl_33_2", name: "Patlıcan, Taze Fasulye & Domates", portionGrams: 75, unit: "g", unitCost: 35, portionCost: 2.63, wastagePercent: 10 },
      { id: "ing_etl_33_3", name: "Arpacık Soğan & Sarımsak", portionGrams: 35, unit: "g", unitCost: 40, portionCost: 1.4, wastagePercent: 8 }
    ]
  }),
  createRecipe({
    id: "rec_etl_34", code: "REC-ETL-034",
    name: "Ekşili Başlı",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 270, prepTime: 35, cookTime: 80,
    calorie: 430, protein: 32.0, carb: 22.0, fat: 24.0,
    allergens: [],
    instructions: "Kahramanmaraş ve Antep yöresi usulü kuzu baş eti, nohut, sumak ekşisi, kurutulmuş biber ve nane ile ekşili güveç kıvamında pişirilir.",
    labor: 7.5, gas: 4.5, overhead: 1.2,
    ingredients: [
      { id: "ing_etl_34_1", name: "Kuzu Baş / Gerdan Eti", portionGrams: 140, unit: "g", unitCost: 380, portionCost: 53.2, wastagePercent: 25 },
      { id: "ing_etl_34_2", name: "Haşlanmış Koçbaşı Nohut", portionGrams: 45, unit: "g", unitCost: 65, portionCost: 2.93, wastagePercent: 0 },
      { id: "ing_etl_34_3", name: "Doğal Sumak Ekşisi & Sarımsak", portionGrams: 25, unit: "g", unitCost: 80, portionCost: 2.0, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_etl_35", code: "REC-ETL-035",
    name: "Analı Kızlı",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 290, prepTime: 45, cookTime: 50,
    calorie: 480, protein: 28.0, carb: 42.0, fat: 22.0,
    allergens: ["Gluten"],
    instructions: "Kıymalı içli köfteler ve minik bulgur köfteleri kuzu kuşbaşı eti ve nohutlu salçalı nane sosuyla pişirilen ana yemek şaheseridir.",
    labor: 8.5, gas: 3.5, overhead: 1.5,
    ingredients: [
      { id: "ing_etl_35_1", name: "İçli Köfteler (Analı Harç)", portionGrams: 60, unit: "g", unitCost: 280, portionCost: 16.8, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_etl_35_2", name: "Bulgur Yuvalaması (Kızlı)", portionGrams: 40, unit: "g", unitCost: 80, portionCost: 3.2, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_etl_35_3", name: "Kuzu Kuşbaşı & Haşlanmış Nohut", portionGrams: 60, unit: "g", unitCost: 360, portionCost: 21.6, wastagePercent: 10 },
      { id: "ing_etl_35_4", name: "Tereyağı, Salça & Kuru Nane", portionGrams: 20, unit: "g", unitCost: 160, portionCost: 3.2, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_etl_36", code: "REC-ETL-036",
    name: "Kuzu İncik Fırın",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 320, prepTime: 25, cookTime: 140,
    calorie: 590, protein: 44.0, carb: 14.0, fat: 38.0,
    allergens: ["Gluten (Sos)"],
    instructions: "Kuzu incikler arpacık soğan, taze biberiye ve tane karabiberle mühürlenir. Fırın poşetinde kemiğinden ayrılacak yumuşaklığa gelene dek fırınlanır.",
    labor: 8.5, gas: 6.0, overhead: 1.8,
    ingredients: [
      { id: "ing_etl_36_1", name: "Taze Kuzu İncik (Kemikli)", portionGrams: 260, unit: "g", unitCost: 450, portionCost: 117.0, wastagePercent: 40 },
      { id: "ing_etl_36_2", name: "Bebek Patates & Arpacık Soğan", portionGrams: 60, unit: "g", unitCost: 35, portionCost: 2.1, wastagePercent: 10 },
      { id: "ing_etl_36_3", name: "Taze Biberiye & Zeytinyağlı Sos", portionGrams: 20, unit: "g", unitCost: 120, portionCost: 2.4, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_etl_37", code: "REC-ETL-037",
    name: "Ciğer Şiş",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 240, prepTime: 25, cookTime: 12,
    calorie: 440, protein: 35.0, carb: 16.0, fat: 26.0,
    allergens: ["Gluten (Lavaş)"],
    instructions: "Kuzu ciğeri ve aralarına kuyruk yağı dizilerek mangal ateşinde nar gibi kızartılır; kimyon ve sumaklı soğanla sıcak lavaşta servis edilir.",
    labor: 7.0, gas: 3.5, overhead: 1.0,
    ingredients: [
      { id: "ing_etl_37_1", name: "Taze Kuzu Ciğeri", portionGrams: 140, unit: "g", unitCost: 420, portionCost: 58.8, wastagePercent: 15 },
      { id: "ing_etl_37_2", name: "Kuzu Kuyruk Yağı", portionGrams: 30, unit: "g", unitCost: 280, portionCost: 8.4, wastagePercent: 0 },
      { id: "ing_etl_37_3", name: "Tandır Lavaş & Sumaklı Piyaz", portionGrams: 50, unit: "g", unitCost: 40, portionCost: 2.0, wastagePercent: 0, allergen: "Gluten" }
    ]
  }),
  createRecipe({
    id: "rec_etl_38", code: "REC-ETL-038",
    name: "Kuzu Sırtı",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 250, prepTime: 25, cookTime: 20,
    calorie: 520, protein: 42.0, carb: 4.0, fat: 38.0,
    allergens: ["Laktoz (Tereyağı)"],
    instructions: "Kuzu sırt eti taze kekik ve zeytinyağı ile marine edilir, döküm ızgarada dışı mühürlenip içi sulu ve pembe şekilde dinlendirilir.",
    labor: 8.5, gas: 4.0, overhead: 1.5,
    ingredients: [
      { id: "ing_etl_38_1", name: "Taze Kuzu Sırtı (Küşleme/Karski)", portionGrams: 180, unit: "g", unitCost: 650, portionCost: 117.0, wastagePercent: 20 },
      { id: "ing_etl_38_2", name: "Taze Kekik, Sarımsak & Tereyağı", portionGrams: 20, unit: "g", unitCost: 240, portionCost: 4.8, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_etl_39", code: "REC-ETL-039",
    name: "Büryan Kebabı",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 260, prepTime: 30, cookTime: 150,
    calorie: 560, protein: 42.0, carb: 8.0, fat: 40.0,
    allergens: ["Gluten (Pide)"],
    instructions: "Siirt ve Bitlis usulü kuzu eti derin kuyu tandırında hava almadan 2.5 saat kendi buharında pişirilir; sıcak pide üzerinde servis edilir.",
    labor: 9.0, gas: 6.0, overhead: 2.0,
    ingredients: [
      { id: "ing_etl_39_1", name: "Kuzu But & Kaburga (Kuyu Tandır)", portionGrams: 210, unit: "g", unitCost: 480, portionCost: 100.8, wastagePercent: 35 },
      { id: "ing_etl_39_2", name: "Tırnak Pide Tabanı", portionGrams: 50, unit: "g", unitCost: 35, portionCost: 1.75, wastagePercent: 0, allergen: "Gluten" }
    ]
  }),
  createRecipe({
    id: "rec_etl_40", code: "REC-ETL-040",
    name: "Orman Kebabı",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 260, prepTime: 25, cookTime: 65,
    calorie: 410, protein: 30.0, carb: 22.0, fat: 22.0,
    allergens: ["Laktoz"],
    instructions: "Bolu orman kebabı klasiği; dana kuşbaşı arpacık soğan, patates, havuç, bezelye ve dağ kekiği ile ağır ateşte güveçte pişirilir.",
    labor: 7.0, gas: 4.0, overhead: 1.2,
    ingredients: [
      { id: "ing_etl_40_1", name: "Dana Kuşbaşı", portionGrams: 130, unit: "g", unitCost: 440, portionCost: 57.2, wastagePercent: 20 },
      { id: "ing_etl_40_2", name: "Havuç, Patates & Taze Bezelye", portionGrams: 60, unit: "g", unitCost: 30, portionCost: 1.8, wastagePercent: 10 },
      { id: "ing_etl_40_3", name: "Arpacık Soğan & Dağ Kekiği", portionGrams: 25, unit: "g", unitCost: 45, portionCost: 1.13, wastagePercent: 5 }
    ]
  }),
  createRecipe({
    id: "rec_etl_41", code: "REC-ETL-041",
    name: "Pöç Kebabı",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 300, prepTime: 30, cookTime: 210,
    calorie: 580, protein: 45.0, carb: 8.0, fat: 40.0,
    allergens: [],
    instructions: "Kayseri klasiği dana kuyruk sokumu (pöç) güveçte sarımsak, arpacık soğan ve defne yaprağıyla fırında 3.5 saatte kemiğinden tel tel dökülene dek pişirilir.",
    labor: 8.5, gas: 6.5, overhead: 1.8,
    ingredients: [
      { id: "ing_etl_41_1", name: "Dana Pöç (Kuyruk Sokumu Eti)", portionGrams: 260, unit: "g", unitCost: 380, portionCost: 98.8, wastagePercent: 40 },
      { id: "ing_etl_41_2", name: "Sarımsak, Arpacık Soğan & Defne", portionGrams: 40, unit: "g", unitCost: 40, portionCost: 1.6, wastagePercent: 10 }
    ]
  }),
  createRecipe({
    id: "rec_etl_42", code: "REC-ETL-042",
    name: "Kiremitte Köfte / Et",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 270, prepTime: 25, cookTime: 25,
    calorie: 520, protein: 35.0, carb: 14.0, fat: 36.0,
    allergens: ["Laktoz (Kaşar)"],
    instructions: "Özel kiremit tabakta pişirilen köfte ve dana etleri mantar, domates, biber ve bol kaşar peyniriyle fırınlanıp cızırdayarak servis edilir.",
    labor: 7.2, gas: 3.5, overhead: 1.2,
    ingredients: [
      { id: "ing_etl_42_1", name: "Dana Izgara Köfte / Kuşbaşı", portionGrams: 140, unit: "g", unitCost: 430, portionCost: 60.2, wastagePercent: 16 },
      { id: "ing_etl_42_2", name: "Kültür Mantarı & Domates Biber", portionGrams: 50, unit: "g", unitCost: 50, portionCost: 2.5, wastagePercent: 8 },
      { id: "ing_etl_42_3", name: "Rendelenmiş Taze Kaşar Peyniri", portionGrams: 30, unit: "g", unitCost: 260, portionCost: 7.8, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_etl_43", code: "REC-ETL-043",
    name: "Kuru Et (Boşnak Usulü)",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 160, prepTime: 15, cookTime: 10,
    calorie: 390, protein: 42.0, carb: 2.0, fat: 24.0,
    allergens: [],
    instructions: "İsli meşe dumanında kurutulmuş dana but eti ince ince dilimlenip hafif tereyağında çevrilerek veya soğuk şarküteri mezesi olarak sunulur.",
    labor: 6.0, gas: 2.0, overhead: 1.0,
    ingredients: [
      { id: "ing_etl_43_1", name: "İsli Kuru Et (Dana Nuar)", portionGrams: 130, unit: "g", unitCost: 850, portionCost: 110.5, wastagePercent: 5 },
      { id: "ing_etl_43_2", name: "Köy Tereyağı & Kekik", portionGrams: 15, unit: "g", unitCost: 320, portionCost: 4.8, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_etl_44", code: "REC-ETL-044",
    name: "Abdigör Köftesi",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 260, prepTime: 50, cookTime: 40,
    calorie: 380, protein: 36.0, carb: 18.0, fat: 18.0,
    allergens: ["Gluten"],
    instructions: "Doğubayazıt saray mutfağının 400 yıllık lezzeti; yağsız dana eti taş üzerinde tokmakla macun kıvamına gelene kadar dövülür, soğan ve az pirinçle yoğrulup et suyunda haşlanır.",
    labor: 9.0, gas: 3.5, overhead: 1.5,
    ingredients: [
      { id: "ing_etl_44_1", name: "Taşta Dövülmüş Yağsız Dana Eti", portionGrams: 160, unit: "g", unitCost: 480, portionCost: 76.8, wastagePercent: 12 },
      { id: "ing_etl_44_2", name: "Kırık Pirinç & Kuru Soğan Püresi", portionGrams: 30, unit: "g", unitCost: 40, portionCost: 1.2, wastagePercent: 0 },
      { id: "ing_etl_44_3", name: "Kemik Suyu & Tereyağlı Pilav Tabanı", portionGrams: 60, unit: "g", unitCost: 60, portionCost: 3.6, wastagePercent: 0, allergen: "Gluten" }
    ]
  }),
  createRecipe({
    id: "rec_etl_45", code: "REC-ETL-045",
    name: "Oruk (İçli Köfte)",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 240, prepTime: 45, cookTime: 20,
    calorie: 460, protein: 25.0, carb: 38.0, fat: 24.0,
    allergens: ["Gluten", "Ceviz"],
    instructions: "Antakya usulü bulgur, et ve baharatla yoğrulan dış kabuk incecik oyulur; içine cevizli, kıymalı, bol soğanlı harç doldurulup fırında veya kızgın yağda pişirilir.",
    labor: 8.5, gas: 3.0, overhead: 1.2,
    ingredients: [
      { id: "ing_etl_45_1", name: "Dana & Kuzu Kıyma Harcı", portionGrams: 90, unit: "g", unitCost: 430, portionCost: 38.7, wastagePercent: 12 },
      { id: "ing_etl_45_2", name: "Köftelik İnce Esmer Bulgur", portionGrams: 60, unit: "g", unitCost: 45, portionCost: 2.7, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_etl_45_3", name: "Kırık Ceviz İçi", portionGrams: 20, unit: "g", unitCost: 400, portionCost: 8.0, wastagePercent: 0, allergen: "Ceviz" },
      { id: "ing_etl_45_4", name: "Kuru Soğan, Tereyağı & Baharatlar", portionGrams: 30, unit: "g", unitCost: 80, portionCost: 2.4, wastagePercent: 5 }
    ]
  }),
  createRecipe({
    id: "rec_etl_46", code: "REC-ETL-046",
    name: "Çiğ Köfte (Etli Geleneksel)",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 220, prepTime: 50, cookTime: 0,
    calorie: 380, protein: 26.0, carb: 36.0, fat: 14.0,
    allergens: ["Gluten (Bulgur)"],
    temp: "+4°C (Soğuk)",
    instructions: "Şanlıurfa usulü sinirleri tamamen temizlenmiş kara et (dana/kuzu nuar) taşta dövülür; isot, sarımsak, salça ve esmer bulgurla buz ile uzun süre yoğrulur.",
    labor: 8.5, gas: 0.5, overhead: 1.0,
    ingredients: [
      { id: "ing_etl_46_1", name: "Yağsız Sinirsiz Dana/Kuzu Eti (Dövülmüş)", portionGrams: 80, unit: "g", unitCost: 520, portionCost: 41.6, wastagePercent: 10 },
      { id: "ing_etl_46_2", name: "Özel Çiğ Köftelik Esmer Bulgur", portionGrams: 65, unit: "g", unitCost: 45, portionCost: 2.93, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_etl_46_3", name: "Urfa Hakiki İpek İsot & Salça", portionGrams: 30, unit: "g", unitCost: 160, portionCost: 4.8, wastagePercent: 0 },
      { id: "ing_etl_46_4", name: "Taze Nane, Maydanoz, Sarımsak & Marul", portionGrams: 40, unit: "g", unitCost: 40, portionCost: 1.6, wastagePercent: 5 }
    ]
  }),
  createRecipe({
    id: "rec_etl_47", code: "REC-ETL-047",
    name: "Tavuk Sote",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 250, prepTime: 20, cookTime: 25,
    calorie: 320, protein: 32.0, carb: 10.0, fat: 16.0,
    allergens: [],
    instructions: "Kuşbaşı tavuk göğsü harlı tavada mühürlenir; soğan, renkli biberler, domates ve kekik ile sulu sulu sotelenir.",
    labor: 5.0, gas: 2.5, overhead: 1.0,
    ingredients: [
      { id: "ing_etl_47_1", name: "Tavuk Göğüs Kuşbaşı", portionGrams: 150, unit: "g", unitCost: 190, portionCost: 28.5, wastagePercent: 10 },
      { id: "ing_etl_47_2", name: "Köy Biberi & Kapya Biber", portionGrams: 40, unit: "g", unitCost: 35, portionCost: 1.4, wastagePercent: 5 },
      { id: "ing_etl_47_3", name: "Domates, Soğan, Salça & Kekik", portionGrams: 40, unit: "g", unitCost: 35, portionCost: 1.4, wastagePercent: 5 },
      { id: "ing_etl_47_4", name: "Sıvı Yağ", portionGrams: 12, unit: "ml", unitCost: 75, portionCost: 0.9, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_etl_48", code: "REC-ETL-048",
    name: "Fırında Bütün Tavuk",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 300, prepTime: 20, cookTime: 75,
    calorie: 460, protein: 40.0, carb: 8.0, fat: 30.0,
    allergens: ["Laktoz (Tereyağlı Sos)"],
    instructions: "Bütün piliç yoğurt, salça, sarımsak ve tereyağlı özel sosla ovulup fırında nar gibi kızarana kadar nar fırınlanır.",
    labor: 6.0, gas: 4.5, overhead: 1.2,
    ingredients: [
      { id: "ing_etl_48_1", name: "Köy Tipi Bütün Piliç (Porsiyon)", portionGrams: 240, unit: "g", unitCost: 120, portionCost: 28.8, wastagePercent: 30 },
      { id: "ing_etl_48_2", name: "Marine Sos (Yoğurt, Salça, Tereyağı)", portionGrams: 30, unit: "g", unitCost: 100, portionCost: 3.0, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_etl_48_3", name: "Fırın Bebek Patates & Biber", portionGrams: 50, unit: "g", unitCost: 30, portionCost: 1.5, wastagePercent: 5 }
    ]
  }),
  createRecipe({
    id: "rec_etl_49", code: "REC-ETL-049",
    name: "Çerkez Tavuğu",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 220, prepTime: 30, cookTime: 30,
    calorie: 410, protein: 28.0, carb: 14.0, fat: 28.0,
    allergens: ["Ceviz", "Gluten"],
    temp: "+4°C (Soğuk)",
    instructions: "Haşlanmış tavuk göğsü ince tiftiklenir. Çekilmiş ceviz içi, sarımsak, bayat ekmek içi ve tavuk suyu ile macun kıvamına getirilip üzerine ceviz yağı gezdirilir.",
    labor: 6.5, gas: 2.0, overhead: 1.0,
    ingredients: [
      { id: "ing_etl_49_1", name: "Tavuk Göğüs Eti (Tiftik)", portionGrams: 110, unit: "g", unitCost: 190, portionCost: 20.9, wastagePercent: 10 },
      { id: "ing_etl_49_2", name: "Yerli Ceviz İçi (Çekilmiş)", portionGrams: 50, unit: "g", unitCost: 400, portionCost: 20.0, wastagePercent: 0, allergen: "Ceviz" },
      { id: "ing_etl_49_3", name: "Ekmek İçi, Sarımsak & Tavuk Suyu", portionGrams: 35, unit: "g", unitCost: 40, portionCost: 1.4, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_etl_49_4", name: "Kırmızı Pul Biberli Ceviz Yağı", portionGrams: 10, unit: "ml", unitCost: 250, portionCost: 2.5, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_etl_50", code: "REC-ETL-050",
    name: "Tavuklu Pilav (Pilav Üstü Tavuk)",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 280, prepTime: 20, cookTime: 35,
    calorie: 450, protein: 26.0, carb: 55.0, fat: 14.0,
    allergens: ["Laktoz (Tereyağı)"],
    instructions: "Tavuk suyuyla demlenmiş nohutlu tereyağlı tane baldo pirinç pilavının üzerine haşlanıp didilmiş tavuk eti yerleştirilir; karabiber serpilerek servis edilir.",
    labor: 5.5, gas: 3.0, overhead: 1.0,
    ingredients: [
      { id: "ing_etl_50_1", name: "Baldo Pirinç & Tavuk Suyu", portionGrams: 80, unit: "g", unitCost: 65, portionCost: 5.2, wastagePercent: 0 },
      { id: "ing_etl_50_2", name: "Didiklenmiş Tavuk Göğüs/But Eti", portionGrams: 90, unit: "g", unitCost: 190, portionCost: 17.1, wastagePercent: 10 },
      { id: "ing_etl_50_3", name: "Haşlanmış Nohut & Tereyağı", portionGrams: 30, unit: "g", unitCost: 160, portionCost: 4.8, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_etl_51", code: "REC-ETL-051",
    name: "Ali Nazik Tavuklu",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 260, prepTime: 25, cookTime: 30,
    calorie: 390, protein: 30.0, carb: 12.0, fat: 24.0,
    allergens: ["Laktoz (Yoğurt, Tereyağı)"],
    instructions: "Sarımsaklı köz patlıcan yoğurt yatağının üzerine tereyağında kekikli ve toz kırmızı biberli sotelenmiş tavuk fileto parçaları eklenir.",
    labor: 6.5, gas: 3.0, overhead: 1.0,
    ingredients: [
      { id: "ing_etl_51_1", name: "Tavuk Bonfile Kuşbaşı", portionGrams: 130, unit: "g", unitCost: 195, portionCost: 25.35, wastagePercent: 8 },
      { id: "ing_etl_51_2", name: "Köz Patlıcan & Süzme Yoğurt", portionGrams: 110, unit: "g", unitCost: 70, portionCost: 7.7, wastagePercent: 5, allergen: "Laktoz" },
      { id: "ing_etl_51_3", name: "Mutfak Tereyağı & Pul Biber", portionGrams: 15, unit: "g", unitCost: 320, portionCost: 4.8, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_etl_52", code: "REC-ETL-052",
    name: "Tavuk Güveç",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 270, prepTime: 25, cookTime: 50,
    calorie: 360, protein: 28.0, carb: 16.0, fat: 20.0,
    allergens: [],
    instructions: "Kuşbaşı tavuk but eti, mantar, biber, arpacık soğan ve domates toprak güveçte kısık ateşte fırınlanır.",
    labor: 6.0, gas: 3.5, overhead: 1.0,
    ingredients: [
      { id: "ing_etl_52_1", name: "Tavuk But Kuşbaşı (Derisiz)", portionGrams: 140, unit: "g", unitCost: 185, portionCost: 25.9, wastagePercent: 12 },
      { id: "ing_etl_52_2", name: "Kültür Mantarı & Köy Biberi", portionGrams: 50, unit: "g", unitCost: 55, portionCost: 2.75, wastagePercent: 8 },
      { id: "ing_etl_52_3", name: "Arpacık Soğan, Sarımsak & Salça", portionGrams: 35, unit: "g", unitCost: 40, portionCost: 1.4, wastagePercent: 5 }
    ]
  }),
  createRecipe({
    id: "rec_etl_53", code: "REC-ETL-053",
    name: "Mantarlı Tavuk Sote",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 260, prepTime: 20, cookTime: 25,
    calorie: 330, protein: 30.0, carb: 9.0, fat: 18.0,
    allergens: [],
    instructions: "Tavuk göğsü jülyen doğranıp kültür mantarları, renkli kapya biber ve arpacık soğanla wok tavada sotelenir.",
    labor: 5.5, gas: 2.5, overhead: 1.0,
    ingredients: [
      { id: "ing_etl_53_1", name: "Tavuk Göğüs Eti (Kuşbaşı)", portionGrams: 140, unit: "g", unitCost: 190, portionCost: 26.6, wastagePercent: 10 },
      { id: "ing_etl_53_2", name: "Taze Kültür Mantarı", portionGrams: 60, unit: "g", unitCost: 80, portionCost: 4.8, wastagePercent: 10 },
      { id: "ing_etl_53_3", name: "Kapya Biber, Sivri Biber & Sıvı Yağ", portionGrams: 35, unit: "g", unitCost: 50, portionCost: 1.75, wastagePercent: 5 }
    ]
  }),
  createRecipe({
    id: "rec_etl_54", code: "REC-ETL-054",
    name: "Tavuk Şiş",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 250, prepTime: 25, cookTime: 15,
    calorie: 370, protein: 36.0, carb: 14.0, fat: 18.0,
    allergens: ["Gluten (Lavaş)", "Laktoz (Marine)"],
    instructions: "Kuşbaşı tavuk but/göğüs yoğurt, salça, sarımsak ve zeytinyağıyla marine edilir; şişlere dizilip ızgarada yumuşacık pişirilir.",
    labor: 6.0, gas: 2.5, overhead: 1.0,
    ingredients: [
      { id: "ing_etl_54_1", name: "Tavuk But & Göğüs Kuşbaşı", portionGrams: 160, unit: "g", unitCost: 190, portionCost: 30.4, wastagePercent: 10 },
      { id: "ing_etl_54_2", name: "Yoğurtlu Marine Sos", portionGrams: 25, unit: "g", unitCost: 75, portionCost: 1.88, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_etl_54_3", name: "Lavaş & Közlenmiş Biber", portionGrams: 45, unit: "g", unitCost: 40, portionCost: 1.8, wastagePercent: 0, allergen: "Gluten" }
    ]
  }),
  createRecipe({
    id: "rec_etl_55", code: "REC-ETL-055",
    name: "Tavuk Kanat (Izgara/Fırın)",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 280, prepTime: 20, cookTime: 25,
    calorie: 480, protein: 32.0, carb: 6.0, fat: 36.0,
    allergens: [],
    instructions: "Taze tavuk kanatları zeytinyağı, pul biber, kekik ve sarımsaklı marine ile harmanlanıp ızgara veya fırında çıtır çıtır kızartılır.",
    labor: 5.5, gas: 3.0, overhead: 1.0,
    ingredients: [
      { id: "ing_etl_55_1", name: "Taze Tavuk Kanat", portionGrams: 240, unit: "g", unitCost: 160, portionCost: 38.4, wastagePercent: 35 },
      { id: "ing_etl_55_2", name: "Özel Baharatlı Kanat Sosu", portionGrams: 25, unit: "g", unitCost: 80, portionCost: 2.0, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_etl_56", code: "REC-ETL-056",
    name: "Firikli Tavuk Dolması",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 300, prepTime: 35, cookTime: 70,
    calorie: 520, protein: 35.0, carb: 45.0, fat: 22.0,
    allergens: ["Gluten", "Laktoz"],
    instructions: "Tütsülü firik buğdayı ve bademli pilavla doldurulan tavuk but/bütün piliç fırında nar gibi kızartılır.",
    labor: 7.5, gas: 4.5, overhead: 1.2,
    ingredients: [
      { id: "ing_etl_56_1", name: "Tavuk But Dolmalık", portionGrams: 160, unit: "g", unitCost: 180, portionCost: 28.8, wastagePercent: 15 },
      { id: "ing_etl_56_2", name: "Firik Bulguru & Tereyağı", portionGrams: 55, unit: "g", unitCost: 85, portionCost: 4.68, wastagePercent: 0, allergen: "Gluten, Laktoz" },
      { id: "ing_etl_56_3", name: "Badem & Baharat Karışımı", portionGrams: 15, unit: "g", unitCost: 350, portionCost: 5.25, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_etl_57", code: "REC-ETL-057",
    name: "Tavuk Köftesi",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 240, prepTime: 25, cookTime: 15,
    calorie: 360, protein: 32.0, carb: 14.0, fat: 19.0,
    allergens: ["Gluten", "Yumurta"],
    instructions: "Çekilmiş tavuk kıyması maydanoz, soğan, bayat ekmek içi ve baharatlarla yoğrulup ızgarada sulu sulu pişirilir.",
    labor: 5.5, gas: 2.5, overhead: 1.0,
    ingredients: [
      { id: "ing_etl_57_1", name: "Taze Tavuk Kıyması (But+Göğüs)", portionGrams: 160, unit: "g", unitCost: 175, portionCost: 28.0, wastagePercent: 12 },
      { id: "ing_etl_57_2", name: "Ekmek İçi, Yumurta & Soğan", portionGrams: 30, unit: "g", unitCost: 60, portionCost: 1.8, wastagePercent: 0, allergen: "Gluten, Yumurta" },
      { id: "ing_etl_57_3", name: "Garnitür Piyaz & Köz Domates", portionGrams: 40, unit: "g", unitCost: 35, portionCost: 1.4, wastagePercent: 5 }
    ]
  }),
  createRecipe({
    id: "rec_etl_58", code: "REC-ETL-058",
    name: "Kremalı Tavuk Makarna / Sote",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 280, prepTime: 20, cookTime: 25,
    calorie: 510, protein: 30.0, carb: 48.0, fat: 22.0,
    allergens: ["Gluten", "Laktoz"],
    instructions: "Jülyen tavuk parçaları mantar ile sotelenir, haşlanmış penne makarna ve taze krema-fesleğen sosuyla birleştirilir.",
    labor: 5.5, gas: 2.5, overhead: 1.0,
    ingredients: [
      { id: "ing_etl_58_1", name: "Tavuk Göğüs Eti", portionGrams: 110, unit: "g", unitCost: 190, portionCost: 20.9, wastagePercent: 10 },
      { id: "ing_etl_58_2", name: "Durum Buğdayı Penne Makarna", portionGrams: 75, unit: "g", unitCost: 40, portionCost: 3.0, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_etl_58_3", name: "Yemeklik Sıvı Krema & Mantar", portionGrams: 45, unit: "g", unitCost: 120, portionCost: 5.4, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_etl_59", code: "REC-ETL-059",
    name: "Tavuk Döner",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 250, prepTime: 25, cookTime: 25,
    calorie: 440, protein: 35.0, carb: 26.0, fat: 21.0,
    allergens: ["Gluten (Pide/Lavaş)"],
    instructions: "Özel yoğurtlu sarımsaklı marine ile dinlendirilmiş tavuk but yaprakları döner ocağında pişirilip ince yapraklar halinde kesilir.",
    labor: 6.5, gas: 3.5, overhead: 1.2,
    ingredients: [
      { id: "ing_etl_59_1", name: "Marine Tavuk But Döner Eti", portionGrams: 150, unit: "g", unitCost: 190, portionCost: 28.5, wastagePercent: 18 },
      { id: "ing_etl_59_2", name: "Lavaş / Tırnak Pide", portionGrams: 50, unit: "g", unitCost: 40, portionCost: 2.0, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_etl_59_3", name: "Turşu, Domates & Özel Sos", portionGrams: 35, unit: "g", unitCost: 45, portionCost: 1.58, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_etl_60", code: "REC-ETL-060",
    name: "Kaz Eti Tiriti",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 290, prepTime: 35, cookTime: 120,
    calorie: 580, protein: 38.0, carb: 42.0, fat: 32.0,
    allergens: ["Gluten"],
    instructions: "Kars usulü tuzlanıp ayazda kurutulmuş kaz eti haşlanır; kaz yağlı suyuyla bulgur pilavı ve yufka ekmeği ıslatılıp didilmiş kaz eti ile sunulur.",
    labor: 8.5, gas: 5.5, overhead: 1.8,
    ingredients: [
      { id: "ing_etl_60_1", name: "Doğal Kars Kaz Eti", portionGrams: 160, unit: "g", unitCost: 520, portionCost: 83.2, wastagePercent: 28 },
      { id: "ing_etl_60_2", name: "Kaz Yağlı Bulgur Pilavı & Yufka", portionGrams: 100, unit: "g", unitCost: 55, portionCost: 5.5, wastagePercent: 0, allergen: "Gluten" }
    ]
  }),
  createRecipe({
    id: "rec_etl_61", code: "REC-ETL-061",
    name: "Ördek Dolması / Eti",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 290, prepTime: 35, cookTime: 110,
    calorie: 560, protein: 36.0, carb: 35.0, fat: 32.0,
    allergens: ["Gluten", "Laktoz"],
    instructions: "Fırında nar gibi kızartılan ördek eti portakal aromalı iç pilav ile doldurularak geleneksel yöntemle pişirilir.",
    labor: 8.5, gas: 5.0, overhead: 1.8,
    ingredients: [
      { id: "ing_etl_61_1", name: "Ördek Eti (Porsiyon)", portionGrams: 170, unit: "g", unitCost: 480, portionCost: 81.6, wastagePercent: 30 },
      { id: "ing_etl_61_2", name: "Kuş Üzümlü & Fıstıklı İç Pilav", portionGrams: 80, unit: "g", unitCost: 75, portionCost: 6.0, wastagePercent: 0, allergen: "Gluten, Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_etl_62", code: "REC-ETL-062",
    name: "Köy Tavuğu Haşlama",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 280, prepTime: 20, cookTime: 90,
    calorie: 380, protein: 36.0, carb: 14.0, fat: 20.0,
    allergens: [],
    instructions: "Doğal gezen köy tavuğu havuç, patates, arpacık soğan ve tane karabiberle kısık ateşte bol şifalı suyuyla haşlanır.",
    labor: 6.0, gas: 4.5, overhead: 1.0,
    ingredients: [
      { id: "ing_etl_62_1", name: "Köy Tavuğu Parça But & Göğüs", portionGrams: 180, unit: "g", unitCost: 220, portionCost: 39.6, wastagePercent: 25 },
      { id: "ing_etl_62_2", name: "Havuç, Patates & Arpacık Soğan", portionGrams: 70, unit: "g", unitCost: 25, portionCost: 1.75, wastagePercent: 10 }
    ]
  }),
  createRecipe({
    id: "rec_etl_63", code: "REC-ETL-063",
    name: "Tavuk Pane / Schnitzel (Türk Usulü)",
    category: "main_meat", categoryLabel: "Et / Tavuk Yemekleri",
    portionGrams: 250, prepTime: 20, cookTime: 15,
    calorie: 460, protein: 34.0, carb: 28.0, fat: 22.0,
    allergens: ["Gluten", "Yumurta"],
    instructions: "Dövülerek inceltilmiş tavuk göğüs fileto un, çırpılmış yumurta ve galeta ununa bulanıp kızgın yağda altın sarısı kızartılır; limon dilimi ile servis edilir.",
    labor: 5.5, gas: 2.5, overhead: 1.0,
    ingredients: [
      { id: "ing_etl_63_1", name: "Tavuk Göğüs Fileto (Dövülmüş)", portionGrams: 160, unit: "g", unitCost: 195, portionCost: 31.2, wastagePercent: 8 },
      { id: "ing_etl_63_2", name: "Galeta Unu, Un & Yumurta", portionGrams: 40, unit: "g", unitCost: 70, portionCost: 2.8, wastagePercent: 0, allergen: "Gluten, Yumurta" },
      { id: "ing_etl_63_3", name: "Kızartma Sıvı Yağı & Limon", portionGrams: 25, unit: "ml", unitCost: 75, portionCost: 1.88, wastagePercent: 0 }
    ]
  })
];

const fileContent = `import { FoodRecipe } from "../../types";

export const meatRecipes: FoodRecipe[] = ${JSON.stringify(meats, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '../src/data/recipes/meatRecipes.ts'), fileContent, 'utf8');
console.log(`Generated ${meats.length} meat recipes successfully.`);
