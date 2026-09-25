const fs = require('fs');
const path = require('path');
const { createRecipe } = require('./recipeHelper.cjs');

const desserts = [
  createRecipe({
    id: "rec_tat_01", code: "REC-TAT-001",
    name: "Baklava (Fıstıklı / Cevizli)",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 160, prepTime: 50, cookTime: 45,
    calorie: 520, protein: 8.0, carb: 68.0, fat: 26.0,
    allergens: ["Gluten", "Fıstık (Antep Fıstığı)", "Laktoz (Tereyağı)", "Yumurta"],
    temp: "Oda Sıcaklığı",
    instructions: "40 kat elle açılmış incecik baklava yufkaları arasına boz iç Antep fıstığı yayılır; sade yağ (urfa yağı) verilerek fırında altın sarısı pişirilir ve sıcak şerbetle buluşturulur.",
    labor: 8.0, gas: 4.0, overhead: 1.5,
    ingredients: [
      { id: "ing_tat_01_1", name: "El Açması Baklava Yufkası (40 kat)", portionGrams: 60, unit: "g", unitCost: 90, portionCost: 5.4, wastagePercent: 0, allergen: "Gluten, Yumurta" },
      { id: "ing_tat_01_2", name: "Gaziantep Boz İç Antep Fıstığı", portionGrams: 35, unit: "g", unitCost: 750, portionCost: 26.25, wastagePercent: 0, allergen: "Fıstık" },
      { id: "ing_tat_01_3", name: "Urfa Sade Yağı (Eritilmiş Tereyağı)", portionGrams: 25, unit: "g", unitCost: 450, portionCost: 11.25, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_tat_01_4", name: "Şeker Şerbeti & Limon Damlası", portionGrams: 45, unit: "g", unitCost: 35, portionCost: 1.58, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_tat_02", code: "REC-TAT-002",
    name: "Şöbiyet",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 150, prepTime: 45, cookTime: 35,
    calorie: 490, protein: 7.5, carb: 62.0, fat: 24.0,
    allergens: ["Gluten", "Fıstık", "Laktoz (Kaymak/Süt)"],
    temp: "Oda Sıcaklığı",
    instructions: "Muska şeklinde katlanan baklava yufkalarının içine irmik kaymağı ve bol Antep fıstığı konur; sade yağla fırınlanıp sıcak şerbet dökülür.",
    labor: 7.5, gas: 3.5, overhead: 1.2,
    ingredients: [
      { id: "ing_tat_02_1", name: "Baklava Yufkası Katları", portionGrams: 55, unit: "g", unitCost: 90, portionCost: 4.95, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_tat_02_2", name: "İrmik Kaymağı (Süt & İrmik)", portionGrams: 30, unit: "g", unitCost: 110, portionCost: 3.3, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_tat_02_3", name: "Antep Fıstığı İçi", portionGrams: 25, unit: "g", unitCost: 750, portionCost: 18.75, wastagePercent: 0, allergen: "Fıstık" },
      { id: "ing_tat_02_4", name: "Sade Yağ & Şerbet", portionGrams: 40, unit: "g", unitCost: 200, portionCost: 8.0, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_tat_03", code: "REC-TAT-003",
    name: "Kadayıf (Tel Kadayıf / Burma)",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 170, prepTime: 30, cookTime: 35,
    calorie: 480, protein: 7.0, carb: 65.0, fat: 22.0,
    allergens: ["Gluten", "Fıstık", "Laktoz (Tereyağı)"],
    temp: "Oda Sıcaklığı",
    instructions: "Taze tel kadayıf tereyağı ile harmanlanır; arasına bol Antep fıstığı veya ceviz serilip tepside iki yüzü nar gibi kızartılır ve ılık şerbetlenir.",
    labor: 5.5, gas: 3.0, overhead: 1.0,
    ingredients: [
      { id: "ing_tat_03_1", name: "Taze Tel Kadayıf", portionGrams: 75, unit: "g", unitCost: 65, portionCost: 4.88, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_tat_03_2", name: "Antep Fıstığı İçi (Dövülmüş)", portionGrams: 30, unit: "g", unitCost: 750, portionCost: 22.5, wastagePercent: 0, allergen: "Fıstık" },
      { id: "ing_tat_03_3", name: "Köy Tereyağı & Sade Yağ", portionGrams: 25, unit: "g", unitCost: 340, portionCost: 8.5, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_tat_03_4", name: "Kıvamlı Şerbet", portionGrams: 45, unit: "g", unitCost: 35, portionCost: 1.58, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_tat_04", code: "REC-TAT-004",
    name: "Künefe",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 180, prepTime: 20, cookTime: 15,
    calorie: 510, protein: 12.0, carb: 62.0, fat: 25.0,
    allergens: ["Gluten", "Laktoz (Antakya Peyniri, Tereyağı)", "Fıstık"],
    temp: "+70°C (Sıcak)",
    instructions: "Antakya usulü künefe tabağı tereyağı ve pekmezle yağlanır; tel kadayıf arasına tuzsuz Antakya künefe peyniri konup kısık ocakta iki tarafı çevrilerek pişirilir; sıcak şerbet dökülüp fıstıkla sunulur.",
    labor: 6.0, gas: 2.5, overhead: 1.0,
    ingredients: [
      { id: "ing_tat_04_1", name: "Taze İnce Tel Kadayıf", portionGrams: 65, unit: "g", unitCost: 65, portionCost: 4.23, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_tat_04_2", name: "Hakiki Tuzsuz Antakya Künefe Peyniri", portionGrams: 50, unit: "g", unitCost: 240, portionCost: 12.0, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_tat_04_3", name: "Köy Tereyağı & Üzüm Pekmezi", portionGrams: 25, unit: "g", unitCost: 300, portionCost: 7.5, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_tat_04_4", name: "Sıcak Şerbet & Toz Antep Fıstığı", portionGrams: 45, unit: "g", unitCost: 150, portionCost: 6.75, wastagePercent: 0, allergen: "Fıstık" }
    ]
  }),
  createRecipe({
    id: "rec_tat_05", code: "REC-TAT-005",
    name: "Revani",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 170, prepTime: 20, cookTime: 30,
    calorie: 390, protein: 6.0, carb: 66.0, fat: 12.0,
    allergens: ["Gluten (İrmik, Un)", "Yumurta", "Laktoz (Yoğurt)"],
    temp: "Oda Sıcaklığı",
    instructions: "İrmik, un, yumurta ve yoğurtla hazırlanan süngerimsi kek fırında kabartılır; fırından çıkınca soğuk limonlu şerbetle demlendirilir, hindistan ceviziyle süslenir.",
    labor: 4.0, gas: 2.5, overhead: 0.8,
    ingredients: [
      { id: "ing_tat_05_1", name: "İrmik & Buğday Unu", portionGrams: 55, unit: "g", unitCost: 40, portionCost: 2.2, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_tat_05_2", name: "Köy Yumurtası & Yoğurt", portionGrams: 40, unit: "g", unitCost: 70, portionCost: 2.8, wastagePercent: 0, allergen: "Yumurta, Laktoz" },
      { id: "ing_tat_05_3", name: "Şeker Şerbeti & Limon", portionGrams: 65, unit: "g", unitCost: 35, portionCost: 2.28, wastagePercent: 0 },
      { id: "ing_tat_05_4", name: "Hindistan Cevizi & Fıstık Süs", portionGrams: 10, unit: "g", unitCost: 180, portionCost: 1.8, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_tat_06", code: "REC-TAT-006",
    name: "Şekerpare",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 160, prepTime: 25, cookTime: 25,
    calorie: 420, protein: 5.5, carb: 68.0, fat: 15.0,
    allergens: ["Gluten", "Yumurta", "Laktoz (Tereyağı)", "Fındık"],
    temp: "Oda Sıcaklığı",
    instructions: "Tereyağlı irmikli yumuşak hamur yuvarlanıp ortasına fındık batırılır; fırında altın sarısı kızartılıp sıcak şerbete atılır.",
    labor: 4.5, gas: 2.2, overhead: 0.8,
    ingredients: [
      { id: "ing_tat_06_1", name: "Şekerpare Hamuru (İrmik, Un, Tereyağı)", portionGrams: 75, unit: "g", unitCost: 80, portionCost: 6.0, wastagePercent: 0, allergen: "Gluten, Laktoz" },
      { id: "ing_tat_06_2", name: "Kavrulmuş Giresun Fındığı", portionGrams: 15, unit: "g", unitCost: 380, portionCost: 5.7, wastagePercent: 0, allergen: "Fındık" },
      { id: "ing_tat_06_3", name: "Limonlu Şeker Şerbeti", portionGrams: 70, unit: "g", unitCost: 35, portionCost: 2.45, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_tat_07", code: "REC-TAT-007",
    name: "Kemalpaşa Tatlısı",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 160, prepTime: 15, cookTime: 25,
    calorie: 380, protein: 7.5, carb: 64.0, fat: 11.0,
    allergens: ["Gluten", "Laktoz (Peynir, Kaymak)"],
    temp: "Oda Sıcaklığı",
    instructions: "Bursa Mustafakemalpaşa taze peyniriyle fırınlanmış kuru tatlılar kaynayan şerbette kabarana kadar kaynatılır; manda kaymağı ve tahinle sunulur.",
    labor: 4.0, gas: 2.0, overhead: 0.8,
    ingredients: [
      { id: "ing_tat_07_1", name: "Hakiki Kemalpaşa Peynir Tatlısı", portionGrams: 50, unit: "g", unitCost: 90, portionCost: 4.5, wastagePercent: 0, allergen: "Gluten, Laktoz" },
      { id: "ing_tat_07_2", name: "Kaynayan Şeker Şerbeti", portionGrams: 80, unit: "g", unitCost: 35, portionCost: 2.8, wastagePercent: 0 },
      { id: "ing_tat_07_3", name: "Manda Kaymağı Garnitürü", portionGrams: 30, unit: "g", unitCost: 380, portionCost: 11.4, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_tat_08", code: "REC-TAT-008",
    name: "Kalburabastı",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 160, prepTime: 30, cookTime: 30,
    calorie: 430, protein: 6.0, carb: 66.0, fat: 17.0,
    allergens: ["Gluten", "Ceviz", "Laktoz"],
    temp: "Oda Sıcaklığı",
    instructions: "Kalbur üzerine bastırılarak desen verilen ceviz dolgulu tereyağlı hamur fırında gevrek pişirilir; sıcakken soğuk şerbet verilir.",
    labor: 4.5, gas: 2.2, overhead: 0.8,
    ingredients: [
      { id: "ing_tat_08_1", name: "Kalburabastı Hamuru (Un, İrmik, Tereyağı)", portionGrams: 70, unit: "g", unitCost: 80, portionCost: 5.6, wastagePercent: 0, allergen: "Gluten, Laktoz" },
      { id: "ing_tat_08_2", name: "İri Kırılmış Ceviz İçi", portionGrams: 25, unit: "g", unitCost: 400, portionCost: 10.0, wastagePercent: 0, allergen: "Ceviz" },
      { id: "ing_tat_08_3", name: "Kıvamlı Şerbet", portionGrams: 65, unit: "g", unitCost: 35, portionCost: 2.28, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_tat_09", code: "REC-TAT-009",
    name: "Tulumba Tatlısı",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 150, prepTime: 25, cookTime: 20,
    calorie: 410, protein: 5.0, carb: 68.0, fat: 14.0,
    allergens: ["Gluten", "Yumurta"],
    temp: "Oda Sıcaklığı",
    instructions: "Choux hamuru gibi pişirilen tulumba hamuru yıldız uçla ılık yağa sıkılır; çıtır çıtır kızartılıp hemen soğuk koyu şerbete atılır.",
    labor: 4.5, gas: 2.2, overhead: 0.8,
    ingredients: [
      { id: "ing_tat_09_1", name: "Özel Pişirilmiş Tulumba Hamuru", portionGrams: 65, unit: "g", unitCost: 50, portionCost: 3.25, wastagePercent: 0, allergen: "Gluten, Yumurta" },
      { id: "ing_tat_09_2", name: "Kızartma Yağı", portionGrams: 20, unit: "ml", unitCost: 75, portionCost: 1.5, wastagePercent: 0 },
      { id: "ing_tat_09_3", name: "Koyu Limonlu Tulumba Şerbeti", portionGrams: 70, unit: "g", unitCost: 35, portionCost: 2.45, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_tat_10", code: "REC-TAT-010",
    name: "Lokma Tatlısı",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 150, prepTime: 20, cookTime: 15,
    calorie: 390, protein: 4.5, carb: 66.0, fat: 13.0,
    allergens: ["Gluten"],
    temp: "Oda Sıcaklığı",
    instructions: "İzmir geleneği mayalı cıvık hamur avuç içinden sıkılarak kızgın yağa dökülür; altın sarısı olunca süzülüp koyu şerbetle tatlandırılır.",
    labor: 4.0, gas: 2.0, overhead: 0.8,
    ingredients: [
      { id: "ing_tat_10_1", name: "Mayalı Cıvık Lokma Hamuru", portionGrams: 65, unit: "g", unitCost: 35, portionCost: 2.28, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_tat_10_2", name: "Kızartma Sıvı Yağı", portionGrams: 20, unit: "ml", unitCost: 75, portionCost: 1.5, wastagePercent: 0 },
      { id: "ing_tat_10_3", name: "Limonlu Soğuk Şerbet & Tarçın", portionGrams: 65, unit: "g", unitCost: 35, portionCost: 2.28, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_tat_11", code: "REC-TAT-011",
    name: "Sütlaç (Fırın Sütlaç)",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 220, prepTime: 20, cookTime: 35,
    calorie: 280, protein: 7.5, carb: 48.0, fat: 7.0,
    allergens: ["Laktoz (Süt)"],
    temp: "+4°C (Soğuk)",
    instructions: "Kırık pirinç tam yağlı köy sütü, şeker ve nişasta ile kıvam alana dek kaynatılır; güveç kaplara dökülüp su dolu fırın tepsisinde üstü yanık kahverengi olana dek fırınlanır.",
    labor: 4.5, gas: 2.5, overhead: 0.8,
    ingredients: [
      { id: "ing_tat_11_1", name: "Tam Yağlı Çiğ Çiftlik Sütü", portionGrams: 160, unit: "ml", unitCost: 35, portionCost: 5.6, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_tat_11_2", name: "Kırık Baldo Pirinç & Nişasta", portionGrams: 30, unit: "g", unitCost: 45, portionCost: 1.35, wastagePercent: 0 },
      { id: "ing_tat_11_3", name: "Toz Şeker & Vanilya", portionGrams: 30, unit: "g", unitCost: 35, portionCost: 1.05, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_tat_12", code: "REC-TAT-012",
    name: "Kazandibi",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 180, prepTime: 25, cookTime: 30,
    calorie: 290, protein: 7.0, carb: 50.0, fat: 7.5,
    allergens: ["Laktoz (Süt, Tereyağı)"],
    temp: "+4°C (Soğuk)",
    instructions: "Süt, sübyeli pirinç unu ve şekerle hazırlanan muhallebi pudra şekeri ve tereyağı sürülmüş tepsinin dibinde döndürülerek karamelize yakılır; rulo dilimlenir.",
    labor: 5.0, gas: 2.5, overhead: 0.8,
    ingredients: [
      { id: "ing_tat_12_1", name: "Yağlı Süt & Sübye (Pirinç Unu)", portionGrams: 140, unit: "ml", unitCost: 35, portionCost: 4.9, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_tat_12_2", name: "Pudra Şekeri (Dip Karamel)", portionGrams: 25, unit: "g", unitCost: 40, portionCost: 1.0, wastagePercent: 0 },
      { id: "ing_tat_12_3", name: "Toz Şeker & Köy Tereyağı", portionGrams: 20, unit: "g", unitCost: 90, portionCost: 1.8, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_tat_13", code: "REC-TAT-013",
    name: "Tavuk Göğsü",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 180, prepTime: 35, cookTime: 40,
    calorie: 270, protein: 9.5, carb: 46.0, fat: 6.0,
    allergens: ["Laktoz (Süt)"],
    temp: "+4°C (Soğuk)",
    instructions: "Haşlanıp lif lif ayrılan ve suda kokusu gidene dek yıkanan tavuk göğsü eti süt, pirinç sübyesi ve şekerle tokmaklanarak sakız gibi elastik kıvama getirilir.",
    labor: 6.0, gas: 2.5, overhead: 1.0,
    ingredients: [
      { id: "ing_tat_13_1", name: "Lif Lif Ayrılmış Tavuk Göğüs Eti", portionGrams: 25, unit: "g", unitCost: 190, portionCost: 4.75, wastagePercent: 0 },
      { id: "ing_tat_13_2", name: "Tam Yağlı Çiftlik Sütü", portionGrams: 140, unit: "ml", unitCost: 35, portionCost: 4.9, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_tat_13_3", name: "Pirinç Sübyesi & Toz Şeker", portionGrams: 35, unit: "g", unitCost: 45, portionCost: 1.58, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_tat_14", code: "REC-TAT-014",
    name: "Keşkül",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 180, prepTime: 20, cookTime: 25,
    calorie: 310, protein: 7.5, carb: 44.0, fat: 12.0,
    allergens: ["Laktoz (Süt)", "Badem", "Fıstık"],
    temp: "+4°C (Soğuk)",
    instructions: "Osmanlı saray klasiği keşkül-i fukara; çekilmiş tatlı ve acı badem tozu, süt, yumurta sarısı, pirinç unu ve şekerle ipeksi pişirilir; badem ve fıstıkla süslenir.",
    labor: 4.5, gas: 2.0, overhead: 0.8,
    ingredients: [
      { id: "ing_tat_14_1", name: "Tam Yağlı Süt", portionGrams: 130, unit: "ml", unitCost: 35, portionCost: 4.55, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_tat_14_2", name: "İnce Çekilmiş Badem Unu", portionGrams: 25, unit: "g", unitCost: 380, portionCost: 9.5, wastagePercent: 0, allergen: "Badem" },
      { id: "ing_tat_14_3", name: "Pirinç Unu, Şeker & Antep Fıstığı Süs", portionGrams: 25, unit: "g", unitCost: 120, portionCost: 3.0, wastagePercent: 0, allergen: "Fıstık" }
    ]
  }),
  createRecipe({
    id: "rec_tat_15", code: "REC-TAT-015",
    name: "Muhallebi (Damla Sakızlı)",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 180, prepTime: 15, cookTime: 20,
    calorie: 260, protein: 6.5, carb: 46.0, fat: 6.5,
    allergens: ["Laktoz"],
    temp: "+4°C (Soğuk)",
    instructions: "Halis Sakız Adası damla sakızı havanda dövülür; süt, nişasta, pirinç unu ve tereyağı ile pürüzsüz pişirilir.",
    labor: 4.0, gas: 2.0, overhead: 0.6,
    ingredients: [
      { id: "ing_tat_15_1", name: "Köy Sütü", portionGrams: 140, unit: "ml", unitCost: 35, portionCost: 4.9, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_tat_15_2", name: "Nişasta, Pirinç Unu & Şeker", portionGrams: 35, unit: "g", unitCost: 40, portionCost: 1.4, wastagePercent: 0 },
      { id: "ing_tat_15_3", name: "Halis Damla Sakızı & Tereyağı", portionGrams: 8, unit: "g", unitCost: 450, portionCost: 3.6, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_tat_16", code: "REC-TAT-016",
    name: "Supangle",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 190, prepTime: 20, cookTime: 20,
    calorie: 320, protein: 7.0, carb: 48.0, fat: 12.0,
    allergens: ["Laktoz", "Gluten", "Yumurta"],
    temp: "+4°C (Soğuk)",
    instructions: "Kasedeki kakaolu kek tabanı üzerine bitter çikolatalı, kakaolu yoğun sütlü puding dökülür; buzlu su eklenerek kabuk tutması engellenir; fıstıkla süslenir.",
    labor: 4.5, gas: 2.0, overhead: 0.8,
    ingredients: [
      { id: "ing_tat_16_1", name: "Tam Yağlı Süt & Bitter Çikolata (%60)", portionGrams: 140, unit: "g", unitCost: 85, portionCost: 11.9, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_tat_16_2", name: "Kakaolu Kek Tabanı (Küp)", portionGrams: 25, unit: "g", unitCost: 70, portionCost: 1.75, wastagePercent: 0, allergen: "Gluten, Yumurta" },
      { id: "ing_tat_16_3", name: "Kakao, Nişasta & Toz Şeker", portionGrams: 25, unit: "g", unitCost: 55, portionCost: 1.38, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_tat_17", code: "REC-TAT-017",
    name: "Profiterol (Türk Usulü Pastane)",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 190, prepTime: 35, cookTime: 30,
    calorie: 360, protein: 7.5, carb: 46.0, fat: 17.0,
    allergens: ["Gluten", "Yumurta", "Laktoz"],
    temp: "+4°C (Soğuk)",
    instructions: "Pişirilen şu hamuru toplarının içine vanilyalı pastacı kreması sıkılır; üzerine ılık bitter çikolata sosu bolca dökülür.",
    labor: 5.5, gas: 2.5, overhead: 1.0,
    ingredients: [
      { id: "ing_tat_17_1", name: "Profiterol Şu Topları (4 adet)", portionGrams: 50, unit: "g", unitCost: 70, portionCost: 3.5, wastagePercent: 0, allergen: "Gluten, Yumurta" },
      { id: "ing_tat_17_2", name: "İpeksi Pastacı Kreması (Süt, Yumurta)", portionGrams: 75, unit: "g", unitCost: 75, portionCost: 5.63, wastagePercent: 0, allergen: "Laktoz, Yumurta" },
      { id: "ing_tat_17_3", name: "Yoğun Bitter Çikolata Sosu", portionGrams: 65, unit: "g", unitCost: 95, portionCost: 6.18, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_tat_18", code: "REC-TAT-018",
    name: "Güllaç",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 200, prepTime: 25, cookTime: 10,
    calorie: 290, protein: 7.0, carb: 54.0, fat: 6.5,
    allergens: ["Laktoz", "Ceviz / Fıstık"],
    temp: "+4°C (Soğuk)",
    instructions: "Ramazan klasiği mısır nişastalı güllaç yaprakları ılık şekerli gül sulu süt ile ıslatılır; orta katına bol ceviz ve fıstık konup nar taneleriyle donatılır.",
    labor: 4.5, gas: 1.5, overhead: 0.8,
    ingredients: [
      { id: "ing_tat_18_1", name: "Doğal Mısır Nişastalı Güllaç Yaprağı", portionGrams: 35, unit: "g", unitCost: 140, portionCost: 4.9, wastagePercent: 0 },
      { id: "ing_tat_18_2", name: "Gül Sulu Şekerli Yağlı Süt", portionGrams: 130, unit: "ml", unitCost: 45, portionCost: 5.85, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_tat_18_3", name: "Ceviz İçi, Nar Taneleri & Toz Fıstık", portionGrams: 35, unit: "g", unitCost: 280, portionCost: 9.8, wastagePercent: 0, allergen: "Ceviz" }
    ]
  }),
  createRecipe({
    id: "rec_tat_19", code: "REC-TAT-019",
    name: "Aşure",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 220, prepTime: 40, cookTime: 60,
    calorie: 340, protein: 8.0, carb: 68.0, fat: 6.0,
    allergens: ["Gluten (Buğday)", "Fındık", "Ceviz"],
    temp: "Oda Sıcaklığı",
    instructions: "Geceden ıslatılmış aşurelik buğday, nohut ve fasulye ağır ateşte kaynatılır; kuru incir, kayısı, kuş üzümü ve portakal kabuğu eklenir; nar, fındık, tarçınla süslenir.",
    labor: 5.5, gas: 3.0, overhead: 1.0,
    ingredients: [
      { id: "ing_tat_19_1", name: "Aşurelik Dövme Buğday", portionGrams: 50, unit: "g", unitCost: 40, portionCost: 2.0, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_tat_19_2", name: "Nohut, Kuru Fasulye & Bakliyat", portionGrams: 40, unit: "g", unitCost: 65, portionCost: 2.6, wastagePercent: 0 },
      { id: "ing_tat_19_3", name: "Kuru Meyveler (Kuru İncir, Kayısı, Kuş Üzümü)", portionGrams: 45, unit: "g", unitCost: 160, portionCost: 7.2, wastagePercent: 0 },
      { id: "ing_tat_19_4", name: "Toz Şeker, Fındık, Nar & Tarçın", portionGrams: 45, unit: "g", unitCost: 120, portionCost: 5.4, wastagePercent: 0, allergen: "Fındık" }
    ]
  }),
  createRecipe({
    id: "rec_tat_20", code: "REC-TAT-020",
    name: "Trileçe (Karamelli)",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 200, prepTime: 30, cookTime: 35,
    calorie: 330, protein: 8.0, carb: 52.0, fat: 11.0,
    allergens: ["Gluten", "Yumurta", "Laktoz (Üç Süt: Manda, Keçi, İnek)"],
    temp: "+4°C (Soğuk)",
    instructions: "Gözenekli hafif pandispanya keki manda, keçi ve inek sütü kreması karışımıyla ıslatılır; üzerine ev yapımı parlak karamel sos dökülür.",
    labor: 5.0, gas: 2.5, overhead: 0.8,
    ingredients: [
      { id: "ing_tat_20_1", name: "Trileçe Pandispanya Keki", portionGrams: 60, unit: "g", unitCost: 55, portionCost: 3.3, wastagePercent: 0, allergen: "Gluten, Yumurta" },
      { id: "ing_tat_20_2", name: "Kremalı Üç Süt Şerbeti", portionGrams: 100, unit: "ml", unitCost: 70, portionCost: 7.0, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_tat_20_3", name: "Tereyağlı Parlak Karamel Sosu", portionGrams: 40, unit: "g", unitCost: 80, portionCost: 3.2, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_tat_21", code: "REC-TAT-021",
    name: "Ayva Tatlısı (Kaymaklı)",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 210, prepTime: 20, cookTime: 70,
    calorie: 290, protein: 3.0, carb: 58.0, fat: 8.0,
    allergens: ["Laktoz (Kaymak)"],
    temp: "Oda Sıcaklığı",
    instructions: "Ortadan ikiye bölünen Eşme ayvaları çekirdekleri, karanfil ve tarçınla fırında kısık ateşte nar rengini alana dek pişirilir; manda kaymağı ve Antep fıstığı ile taçlandırılır.",
    labor: 4.5, gas: 3.0, overhead: 0.8,
    ingredients: [
      { id: "ing_tat_21_1", name: "Eşme Sulu Ayva (Yarım)", portionGrams: 130, unit: "g", unitCost: 40, portionCost: 5.2, wastagePercent: 15 },
      { id: "ing_tat_21_2", name: "Şeker, Karanfil, Çubuk Tarçın & Ayva Çekirdeği", portionGrams: 45, unit: "g", unitCost: 40, portionCost: 1.8, wastagePercent: 0 },
      { id: "ing_tat_21_3", name: "Taze Manda Kaymağı & Toz Fıstık", portionGrams: 35, unit: "g", unitCost: 380, portionCost: 13.3, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_tat_22", code: "REC-TAT-022",
    name: "Kabak Tatlısı (Tahinli & Cevizli)",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 220, prepTime: 20, cookTime: 60,
    calorie: 340, protein: 5.0, carb: 62.0, fat: 12.0,
    allergens: ["Susam (Tahin)", "Ceviz"],
    temp: "Oda Sıcaklığı",
    instructions: "Adapazarı kestane kabağı şekerle bir gece bekletilip kendi suyunda fırında karamelize edilene dek pişirilir; üzerine çifte kavrulmuş tahin ve ceviz dökülür.",
    labor: 4.0, gas: 2.8, overhead: 0.8,
    ingredients: [
      { id: "ing_tat_22_1", name: "Adapazarı Kestane Kabağı", portionGrams: 150, unit: "g", unitCost: 35, portionCost: 5.25, wastagePercent: 20 },
      { id: "ing_tat_22_2", name: "Karamelize Toz Şeker", portionGrams: 40, unit: "g", unitCost: 35, portionCost: 1.4, wastagePercent: 0 },
      { id: "ing_tat_22_3", name: "Çifte Kavrulmuş Tahin & Kırık Ceviz", portionGrams: 30, unit: "g", unitCost: 260, portionCost: 7.8, wastagePercent: 0, allergen: "Susam, Ceviz" }
    ]
  }),
  createRecipe({
    id: "rec_tat_23", code: "REC-TAT-023",
    name: "İncir Uyutması",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 180, prepTime: 20, cookTime: 10,
    calorie: 240, protein: 6.0, carb: 46.0, fat: 5.0,
    allergens: ["Laktoz (Süt)", "Ceviz"],
    temp: "+4°C (Soğuk)",
    instructions: "Kuru Aydın dağ incirleri ılık sütte püre yapılır; mayalanması için üzeri örtülüp uyutulur, buzdolabında soğutulup cevizle servis edilir.",
    labor: 3.5, gas: 1.0, overhead: 0.5,
    ingredients: [
      { id: "ing_tat_23_1", name: "Doğal Aydın Kuru Dağ İnciri", portionGrams: 60, unit: "g", unitCost: 180, portionCost: 10.8, wastagePercent: 0 },
      { id: "ing_tat_23_2", name: "Köy Sütü", portionGrams: 110, unit: "ml", unitCost: 35, portionCost: 3.85, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_tat_23_3", name: "Ceviz İçi Garnitür", portionGrams: 10, unit: "g", unitCost: 400, portionCost: 4.0, wastagePercent: 0, allergen: "Ceviz" }
    ]
  }),
  createRecipe({
    id: "rec_tat_24", code: "REC-TAT-024",
    name: "Katmer (Gaziantep)",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 170, prepTime: 25, cookTime: 12,
    calorie: 490, protein: 9.0, carb: 58.0, fat: 26.0,
    allergens: ["Gluten", "Fıstık", "Laktoz (Kaymak)"],
    temp: "+70°C (Sıcak)",
    instructions: "Gaziantep usulü havada döndürülerek zar gibi açılan hamura sahan kaymağı, şeker ve bol Antep fıstığı bohça şeklinde katlanır; taş fırında çıtır pişirilir.",
    labor: 6.5, gas: 2.5, overhead: 1.0,
    ingredients: [
      { id: "ing_tat_24_1", name: "Zar İnceliğinde Katmer Hamuru", portionGrams: 50, unit: "g", unitCost: 60, portionCost: 3.0, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_tat_24_2", name: "Hakiki Sahan Kaymağı", portionGrams: 40, unit: "g", unitCost: 360, portionCost: 14.4, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_tat_24_3", name: "Boz Antep Fıstığı (Dövülmüş) & Şeker", portionGrams: 40, unit: "g", unitCost: 750, portionCost: 30.0, wastagePercent: 0, allergen: "Fıstık" }
    ]
  }),
  createRecipe({
    id: "rec_tat_25", code: "REC-TAT-025",
    name: "Höşmerim",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 180, prepTime: 20, cookTime: 25,
    calorie: 360, protein: 11.0, carb: 48.0, fat: 15.0,
    allergens: ["Laktoz (Tuzsuz Peynir)", "Gluten (İrmik)", "Yumurta"],
    temp: "Oda Sıcaklığı",
    instructions: "Balıkesir yöresi taze mayalanmış tuzsuz koyun peyniri, irmik, şeker ve yumurta sarısı ile ağır ateşte helmelenerek altın sarısı pişirilir.",
    labor: 4.5, gas: 2.0, overhead: 0.8,
    ingredients: [
      { id: "ing_tat_25_1", name: "Taze Mayalanmış Tuzsuz Peynir", portionGrams: 90, unit: "g", unitCost: 160, portionCost: 14.4, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_tat_25_2", name: "Durum İrmiği & Yumurta Sarısı", portionGrams: 40, unit: "g", unitCost: 60, portionCost: 2.4, wastagePercent: 0, allergen: "Gluten, Yumurta" },
      { id: "ing_tat_25_3", name: "Toz Şeker", portionGrams: 50, unit: "g", unitCost: 35, portionCost: 1.75, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_tat_26", code: "REC-TAT-026",
    name: "Helva (İrmik Helvası)",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 170, prepTime: 20, cookTime: 25,
    calorie: 390, protein: 6.5, carb: 58.0, fat: 16.0,
    allergens: ["Gluten", "Laktoz (Tereyağı, Süt)", "Fıstık (Dolmalık)"],
    temp: "+60°C (Sıcak/Ilık)",
    instructions: "İrmik ve çam fıstığı bol köy tereyağında esmerleşene dek kavrulur; sıcak sütlü şeker şerbeti verilip demlendirilir, dondurmayla sunulabilir.",
    labor: 4.0, gas: 2.2, overhead: 0.8,
    ingredients: [
      { id: "ing_tat_26_1", name: "İri Tane İrmik", portionGrams: 65, unit: "g", unitCost: 40, portionCost: 2.6, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_tat_26_2", name: "Köy Tereyağı & Çam Fıstığı", portionGrams: 30, unit: "g", unitCost: 360, portionCost: 10.8, wastagePercent: 0, allergen: "Laktoz, Fıstık" },
      { id: "ing_tat_26_3", name: "Sütlü Şerbet (Süt, Su, Şeker)", portionGrams: 75, unit: "g", unitCost: 45, portionCost: 3.38, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_tat_27", code: "REC-TAT-027",
    name: "Helva (Un Helvası)",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 160, prepTime: 20, cookTime: 25,
    calorie: 410, protein: 5.5, carb: 60.0, fat: 18.0,
    allergens: ["Gluten", "Laktoz", "Ceviz"],
    temp: "+60°C (Sıcak/Ilık)",
    instructions: "Köy tereyağında un sabırla fındık kabuğu rengine gelene kadar kavrulur; ceviz içi ve sıcak şerbet eklenip kaşıkla şekil verilir.",
    labor: 4.0, gas: 2.2, overhead: 0.8,
    ingredients: [
      { id: "ing_tat_27_1", name: "Buğday Unu", portionGrams: 60, unit: "g", unitCost: 30, portionCost: 1.8, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_tat_27_2", name: "Köy Tereyağı & Sıvı Yağ", portionGrams: 30, unit: "g", unitCost: 280, portionCost: 8.4, wastagePercent: 0, allergen: "Laktoz" },
      { id: "ing_tat_27_3", name: "Ceviz İçi & Sıcak Şerbet", portionGrams: 70, unit: "g", unitCost: 90, portionCost: 6.3, wastagePercent: 0, allergen: "Ceviz" }
    ]
  }),
  createRecipe({
    id: "rec_tat_28", code: "REC-TAT-028",
    name: "Zerde",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 180, prepTime: 20, cookTime: 30,
    calorie: 220, protein: 2.5, carb: 52.0, fat: 1.0,
    allergens: ["Fıstık (Çam Fıstığı)"],
    temp: "+4°C (Soğuk)",
    instructions: "Saray mutfağının düğün tatlısı pirinç, safran/haspir ve gül suyu ile pişirilir; altın sarısı rengiyle kaseye dökülüp kuş üzümü ve narla süslenir.",
    labor: 4.0, gas: 2.0, overhead: 0.6,
    ingredients: [
      { id: "ing_tat_28_1", name: "Baldo Kırık Pirinç", portionGrams: 35, unit: "g", unitCost: 50, portionCost: 1.75, wastagePercent: 0 },
      { id: "ing_tat_28_2", name: "Halis Safran / Haspir & Gül Suyu", portionGrams: 10, unit: "g", unitCost: 400, portionCost: 4.0, wastagePercent: 0 },
      { id: "ing_tat_28_3", name: "Şeker, Çam Fıstığı, Kuş Üzümü & Nar", portionGrams: 35, unit: "g", unitCost: 150, portionCost: 5.25, wastagePercent: 0, allergen: "Fıstık" }
    ]
  }),
  createRecipe({
    id: "rec_tat_29", code: "REC-TAT-029",
    name: "Pişmaniye",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 120, prepTime: 60, cookTime: 30,
    calorie: 460, protein: 4.5, carb: 80.0, fat: 14.0,
    allergens: ["Gluten", "Laktoz (Tereyağı)", "Fıstık"],
    temp: "Oda Sıcaklığı",
    instructions: "İzmit klasiği kavrulmuş un ve ağdalaşmış şeker ustalıkla çekilerek ipek gibi binlerce tel haline getirilir; Antep fıstığıyla süslenir.",
    labor: 5.5, gas: 2.0, overhead: 1.0,
    ingredients: [
      { id: "ing_tat_29_1", name: "Geleneksel Tel Pişmaniye (Un, Şeker, Tereyağı)", portionGrams: 110, unit: "g", unitCost: 90, portionCost: 9.9, wastagePercent: 0, allergen: "Gluten, Laktoz" },
      { id: "ing_tat_29_2", name: "Antep Fıstığı Tozu Süs", portionGrams: 10, unit: "g", unitCost: 750, portionCost: 7.5, wastagePercent: 0, allergen: "Fıstık" }
    ]
  }),
  createRecipe({
    id: "rec_tat_30", code: "REC-TAT-030",
    name: "Lokum Çeşitleri",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 130, prepTime: 40, cookTime: 40,
    calorie: 390, protein: 3.5, carb: 84.0, fat: 6.0,
    allergens: ["Fıstık", "Ceviz", "Fındık"],
    temp: "Oda Sıcaklığı",
    instructions: "Geleneksel Türk lokumu kazanlarında nişasta ve şeker kaynatılır; çift kavrulmuş fıstıklı, güllü, narlı çeşitler hindistan cevizinde dinlendirilir.",
    labor: 4.5, gas: 2.0, overhead: 0.8,
    ingredients: [
      { id: "ing_tat_30_1", name: "Çifte Kavrulmuş Fıstıklı Lokum", portionGrams: 65, unit: "g", unitCost: 220, portionCost: 14.3, wastagePercent: 0, allergen: "Fıstık" },
      { id: "ing_tat_30_2", name: "Güllü & Narlı Lokum Çeşitleri", portionGrams: 65, unit: "g", unitCost: 160, portionCost: 10.4, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_tat_31", code: "REC-TAT-031",
    name: "Ekmek Kadayıfı (Kaymaklı)",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 190, prepTime: 30, cookTime: 50,
    calorie: 480, protein: 7.0, carb: 78.0, fat: 16.0,
    allergens: ["Gluten", "Laktoz (Manda Kaymağı)"],
    temp: "Oda Sıcaklığı",
    instructions: "Afyonkarahisar usulü kuru ekmek kadayıfı ıslatılıp karamelize şerbette ağır ağır çevrilerek pişirilir; kalın manda kaymağı ile servis edilir.",
    labor: 5.0, gas: 3.0, overhead: 1.0,
    ingredients: [
      { id: "ing_tat_31_1", name: "Kuru Ekmek Kadayıfı Tabanı", portionGrams: 60, unit: "g", unitCost: 80, portionCost: 4.8, wastagePercent: 0, allergen: "Gluten" },
      { id: "ing_tat_31_2", name: "Karamelize Şeker Şerbeti", portionGrams: 90, unit: "g", unitCost: 35, portionCost: 3.15, wastagePercent: 0 },
      { id: "ing_tat_31_3", name: "Afyon Manda Kaymağı", portionGrams: 40, unit: "g", unitCost: 380, portionCost: 15.2, wastagePercent: 0, allergen: "Laktoz" }
    ]
  }),
  createRecipe({
    id: "rec_tat_32", code: "REC-TAT-032",
    name: "Cezerye",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 130, prepTime: 35, cookTime: 45,
    calorie: 380, protein: 5.0, carb: 72.0, fat: 10.0,
    allergens: ["Ceviz", "Fıstık"],
    temp: "Oda Sıcaklığı",
    instructions: "Mersin usulü tatlı sarı havuç şekerle macun kıvamına gelene dek karamelize edilir; ceviz veya fıstık eklenip hindistan cevizine bulanır.",
    labor: 4.0, gas: 2.0, overhead: 0.8,
    ingredients: [
      { id: "ing_tat_32_1", name: "Karamelize Havuç Macunu", portionGrams: 85, unit: "g", unitCost: 65, portionCost: 5.53, wastagePercent: 0 },
      { id: "ing_tat_32_2", name: "Yerli Ceviz İçi & Antep Fıstığı", portionGrams: 30, unit: "g", unitCost: 400, portionCost: 12.0, wastagePercent: 0, allergen: "Ceviz, Fıstık" },
      { id: "ing_tat_32_3", name: "Hindistan Cevizi Kaplama", portionGrams: 15, unit: "g", unitCost: 140, portionCost: 2.1, wastagePercent: 0 }
    ]
  }),
  createRecipe({
    id: "rec_tat_33", code: "REC-TAT-033",
    name: "Karışık Mevsim Meyveleri Tabağı",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 250, prepTime: 12, cookTime: 0,
    calorie: 130, protein: 2.0, carb: 30.0, fat: 0.5,
    temp: "+4°C (Soğuk)",
    instructions: "Mevsimine göre taze amasya elması, deveci armudu, çilek, üzüm ve mandalina estetik tabakta dilimlenip servis edilir.",
    labor: 2.5, gas: 0.0, overhead: 0.4,
    ingredients: [
      { id: "ing_tat_33_1", name: "Mevsim Meyveleri (Elma, Armut, Çilek, Üzüm)", portionGrams: 250, unit: "g", unitCost: 45, portionCost: 11.25, wastagePercent: 12 }
    ]
  }),
  createRecipe({
    id: "rec_tat_34", code: "REC-TAT-034",
    name: "Karpuz & Kavun Tabağı",
    category: "dessert_fruit", categoryLabel: "Tatlı & Meyve",
    portionGrams: 300, prepTime: 10, cookTime: 0,
    calorie: 110, protein: 2.0, carb: 26.0, fat: 0.5,
    temp: "+4°C (Soğuk)",
    instructions: "Buz gibi soğutulmuş Diyarbakır karpuzu ve Kırkağaç bal kavunu üçgen dilimlenerek soğuk sunulur.",
    labor: 2.0, gas: 0.0, overhead: 0.4,
    ingredients: [
      { id: "ing_tat_34_1", name: "Diyarbakır Karpuzu & Kırkağaç Kavunu", portionGrams: 300, unit: "g", unitCost: 25, portionCost: 7.5, wastagePercent: 30 }
    ]
  })
];

const fileContent = `import { FoodRecipe } from "../../types";

export const dessertRecipes: FoodRecipe[] = ${JSON.stringify(desserts, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '../src/data/recipes/dessertRecipes.ts'), fileContent, 'utf8');
console.log(`Generated ${desserts.length} dessert recipes successfully.`);
