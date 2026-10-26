import {
  FixedAsset,
  FixedAssetCategory,
  DepreciationMethod,
  AssetDepreciationYearRecord,
  AssetMaintenanceRecord,
  AssetDisposalRecord,
} from "../types";

export interface VukAssetTemplate {
  id: string;
  category: FixedAssetCategory;
  categoryLabel: string;
  name: string;
  subCategory: string;
  usefulLifeYears: number;
  depreciationRate: number;
  isPartialYear: boolean; // Binek otomobiller için kıst amortisman zorunluluğu
  recommendedAssetAccount: string;
  recommendedDeprAccount: string;
  recommendedExpenseAccount: string;
}

export const VUK_ASSET_TEMPLATES: VukAssetTemplate[] = [
  {
    id: "vuk_it_comp",
    category: "255_demirbaslar",
    categoryLabel: "255 Demirbaşlar",
    name: "Bilgisayarlar ve Dizüstü / Masaüstü Donanımları",
    subCategory: "Bilgisayar & Donanım",
    usefulLifeYears: 4,
    depreciationRate: 25,
    isPartialYear: false,
    recommendedAssetAccount: "255.02.001 Bilgisayar Donanımları",
    recommendedDeprAccount: "257.02.001 Bilgisayar Birikmiş Amortismanı",
    recommendedExpenseAccount: "770.05.001 Amortisman Giderleri",
  },
  {
    id: "vuk_it_server",
    category: "255_demirbaslar",
    categoryLabel: "255 Demirbaşlar",
    name: "Sunucular, Veri Depolama ve Ağ (Network) Cihazları",
    subCategory: "Sunucu & Ağ Ekipmanı",
    usefulLifeYears: 5,
    depreciationRate: 20,
    isPartialYear: false,
    recommendedAssetAccount: "255.02.002 Sunucu ve Network Cihazları",
    recommendedDeprAccount: "257.02.002 Sunucu Birikmiş Amortismanı",
    recommendedExpenseAccount: "770.05.001 Amortisman Giderleri",
  },
  {
    id: "vuk_it_phone",
    category: "255_demirbaslar",
    categoryLabel: "255 Demirbaşlar",
    name: "Cep Telefonları ve Mobil İletişim Cihazları",
    subCategory: "Mobil İletişim",
    usefulLifeYears: 3,
    depreciationRate: 33.33,
    isPartialYear: false,
    recommendedAssetAccount: "255.02.003 Haberleşme Cihazları",
    recommendedDeprAccount: "257.02.003 Haberleşme Birikmiş Amortismanı",
    recommendedExpenseAccount: "770.05.001 Amortisman Giderleri",
  },
  {
    id: "vuk_car_passenger",
    category: "254_tasitlar",
    categoryLabel: "254 Taşıtlar",
    name: "Binek Otomobiller (Kıst Amortismana Tabi - VUK 320)",
    subCategory: "Binek Araç",
    usefulLifeYears: 5,
    depreciationRate: 20,
    isPartialYear: true, // VUK gereği binek otomobillerde kıst uygulanır
    recommendedAssetAccount: "254.01.001 Binek Taşıtlar",
    recommendedDeprAccount: "257.01.001 Binek Taşıtlar Birikmiş Amortismanı",
    recommendedExpenseAccount: "770.05.002 Taşıt Amortisman Giderleri",
  },
  {
    id: "vuk_car_commercial",
    category: "254_tasitlar",
    categoryLabel: "254 Taşıtlar",
    name: "Hafif Ticari Araçlar, Panelvan ve Kamyonetler",
    subCategory: "Ticari Araç",
    usefulLifeYears: 5,
    depreciationRate: 20,
    isPartialYear: false,
    recommendedAssetAccount: "254.02.001 Ticari Araçlar",
    recommendedDeprAccount: "257.02.001 Ticari Araç Birikmiş Amortismanı",
    recommendedExpenseAccount: "760.05.001 Pazarlama Dağıtım Amortismanı",
  },
  {
    id: "vuk_forklift",
    category: "254_tasitlar",
    categoryLabel: "254 Taşıtlar",
    name: "Forklift, İstifleyici ve Depo İçi İş Makineleri",
    subCategory: "İş Makinesi",
    usefulLifeYears: 6,
    depreciationRate: 16.66,
    isPartialYear: false,
    recommendedAssetAccount: "254.03.001 İş Makineleri & Forklift",
    recommendedDeprAccount: "257.03.001 İş Makineleri Birikmiş Amortismanı",
    recommendedExpenseAccount: "730.05.001 Genel Üretim Amortisman Giderleri",
  },
  {
    id: "vuk_machinery_cnc",
    category: "253_tesis_makine",
    categoryLabel: "253 Tesis, Makine ve Cihazlar",
    name: "CNC Takım Tezgahları, Torna ve İşleme Merkezleri",
    subCategory: "İmalat Makineleri",
    usefulLifeYears: 10,
    depreciationRate: 10,
    isPartialYear: false,
    recommendedAssetAccount: "253.01.001 İmalat Makineleri ve Cihazlar",
    recommendedDeprAccount: "257.01.001 İmalat Makineleri Birikmiş Amortismanı",
    recommendedExpenseAccount: "730.05.001 Genel Üretim Amortisman Giderleri",
  },
  {
    id: "vuk_compressor",
    category: "253_tesis_makine",
    categoryLabel: "253 Tesis, Makine ve Cihazlar",
    name: "Kompresör, Jeneratör ve Güç Sistemleri",
    subCategory: "Tesisat & Güç",
    usefulLifeYears: 10,
    depreciationRate: 10,
    isPartialYear: false,
    recommendedAssetAccount: "253.02.001 Tesisat & Güç Sistemleri",
    recommendedDeprAccount: "257.02.001 Tesisat Birikmiş Amortismanı",
    recommendedExpenseAccount: "730.05.001 Genel Üretim Amortisman Giderleri",
  },
  {
    id: "vuk_furniture_office",
    category: "255_demirbaslar",
    categoryLabel: "255 Demirbaşlar",
    name: "Büro ve Ofis Mobilyaları (Masa, Koltuk, Dolap)",
    subCategory: "Ofis Mobilyası",
    usefulLifeYears: 5,
    depreciationRate: 20,
    isPartialYear: false,
    recommendedAssetAccount: "255.01.001 Büro Mobilyaları",
    recommendedDeprAccount: "257.01.001 Büro Mobilyaları Birikmiş Amortismanı",
    recommendedExpenseAccount: "770.05.001 Genel Yönetim Amortismanı",
  },
  {
    id: "vuk_hvac_aircon",
    category: "253_tesis_makine",
    categoryLabel: "253 Tesis, Makine ve Cihazlar",
    name: "Klima, Havalandırma ve İklimlendirme Tesisatları",
    subCategory: "İklimlendirme",
    usefulLifeYears: 10,
    depreciationRate: 10,
    isPartialYear: false,
    recommendedAssetAccount: "253.03.001 İklimlendirme Tesisatı",
    recommendedDeprAccount: "257.03.001 İklimlendirme Birikmiş Amortismanı",
    recommendedExpenseAccount: "770.05.001 Genel Yönetim Amortismanı",
  },
  {
    id: "vuk_special_cost",
    category: "264_ozel_maliyetler",
    categoryLabel: "264 Özel Maliyetler",
    name: "Kiralık Gayrimenkul İyileştirme ve Dekorasyon",
    subCategory: "Kira Dekorasyon",
    usefulLifeYears: 5,
    depreciationRate: 20,
    isPartialYear: false,
    recommendedAssetAccount: "264.01.001 Özel Maliyetler",
    recommendedDeprAccount: "268.01.001 Birikmiş İtfa Payları",
    recommendedExpenseAccount: "770.05.003 Özel Maliyet İtfa Payı",
  },
  {
    id: "vuk_intangible_sw",
    category: "260_haklar_lisans",
    categoryLabel: "260 Haklar ve Lisanslar",
    name: "Yazılım Lisansları, ERP ve Patent Hakları",
    subCategory: "Yazılım & Haklar",
    usefulLifeYears: 3,
    depreciationRate: 33.33,
    isPartialYear: false,
    recommendedAssetAccount: "260.01.001 Bilgisayar Yazılımları & Haklar",
    recommendedDeprAccount: "268.01.002 Haklar Birikmiş İtfa Payı",
    recommendedExpenseAccount: "770.05.004 Lisans İtfa Payı",
  },
];

export const INITIAL_FIXED_ASSETS: FixedAsset[] = [
  {
    id: "dmr-001",
    code: "DMR-2023-001",
    name: "2023 Renault Megane 1.3 TCe Icon Otomatik",
    category: "254_tasitlar",
    categoryLabel: "254 Taşıtlar",
    subCategory: "Binek Araç",
    brand: "Renault",
    model: "Megane Icon 1.3 TCe EDC",
    serialNumber: "VF1RFB00868129341",
    plateNumber: "34 TLL 542",
    barcode: "8690012023001",
    qrCode: "DMR-2023-001|34TLL542",
    acquisitionDate: "2023-04-15",
    activatedDate: "2023-04-15",
    invoiceNo: "MAI20230004128",
    invoiceDate: "2023-04-15",
    vendorName: "Mais Motorlu Araçlar A.Ş.",
    purchaseCost: 1150000,
    vatRate: 20,
    vatAmount: 230000,
    totalCost: 1380000,
    currency: "TRY",
    additionalExpenses: 15000,
    assetAccountCode: "254.01.001",
    depreciationAccountCode: "257.01.001",
    expenseAccountCode: "770.05.002",
    depreciationMethod: "normal",
    usefulLifeYears: 5,
    depreciationRate: 20,
    isPartialYear: true, // Binek araç kıst amortisman (Nisan ayında alındı, ilk yıl 9 ay)
    salvageValue: 0,
    accumulatedDepreciation: 402500, // 2023: 172.500 (9 ay) + 2024: 230.000
    netBookValue: 747500,
    location: "Genel Merkez",
    branchName: "Merkez Ofis (İstanbul)",
    department: "Genel Yönetim",
    custodyEmployeeId: "emp_01",
    custodyEmployeeName: "Ahmet Yılmaz (Genel Müdür)",
    custodyDate: "2023-04-16",
    status: "in_custody",
    warrantyEndDate: "2026-04-15",
    insuranceEndDate: "2025-04-14",
    description: "Şirket genel müdürü makam aracı olarak tahsis edilmiştir.",
    createdAt: "2023-04-15T09:00:00Z",
    updatedAt: "2024-12-31T17:00:00Z",
  },
  {
    id: "dmr-002",
    code: "DMR-2023-002",
    name: "Apple MacBook Pro 16\" M3 Max (64GB / 1TB)",
    category: "255_demirbaslar",
    categoryLabel: "255 Demirbaşlar",
    subCategory: "Bilgisayar & Donanım",
    brand: "Apple",
    model: "MacBook Pro 16-inch M3 Max Silver",
    serialNumber: "C02G90J1MD6R",
    barcode: "8690012023002",
    qrCode: "DMR-2023-002|C02G90J1MD6R",
    acquisitionDate: "2023-11-20",
    activatedDate: "2023-11-20",
    invoiceNo: "GUR20230009841",
    invoiceDate: "2023-11-20",
    vendorName: "Gürgençler Bilişim A.Ş.",
    purchaseCost: 145000,
    vatRate: 20,
    vatAmount: 29000,
    totalCost: 174000,
    currency: "TRY",
    assetAccountCode: "255.02.001",
    depreciationAccountCode: "257.02.001",
    expenseAccountCode: "770.05.001",
    depreciationMethod: "normal",
    usefulLifeYears: 4,
    depreciationRate: 25,
    isPartialYear: false,
    salvageValue: 0,
    accumulatedDepreciation: 36250, // 2024 yılı tam amortisman
    netBookValue: 108750,
    location: "Teknoloji Geliştirme Ofisi",
    branchName: "Merkez Ofis (İstanbul)",
    department: "Yazılım & Ar-Ge",
    custodyEmployeeId: "emp_04",
    custodyEmployeeName: "Mehmet Kaya (Kıdemli Yazılım Mimarı)",
    custodyDate: "2023-11-21",
    status: "in_custody",
    warrantyEndDate: "2025-11-20",
    description: "Yazılım mimarisi ve mobil uygulama geliştirme için zimmetlendi.",
    createdAt: "2023-11-20T10:30:00Z",
    updatedAt: "2024-12-31T17:00:00Z",
  },
  {
    id: "dmr-003",
    code: "DMR-2022-001",
    name: "HAAS VF-4SS CNC 4-Eksen Dikey İşleme Merkezi",
    category: "253_tesis_makine",
    categoryLabel: "253 Tesis, Makine ve Cihazlar",
    subCategory: "İmalat Makineleri",
    brand: "HAAS Automation",
    model: "VF-4SS Super Speed High Precision",
    serialNumber: "HAAS-VF4-88419",
    barcode: "8690012022001",
    qrCode: "DMR-2022-001|HAAS-VF4-88419",
    acquisitionDate: "2022-02-10",
    activatedDate: "2022-02-10",
    invoiceNo: "HAAS20220000192",
    invoiceDate: "2022-02-10",
    vendorName: "Haas Fabrika Satış Merkezi Türkiye",
    purchaseCost: 2850000,
    vatRate: 20,
    vatAmount: 570000,
    totalCost: 3420000,
    currency: "TRY",
    additionalExpenses: 45000,
    assetAccountCode: "253.01.001",
    depreciationAccountCode: "257.01.001",
    expenseAccountCode: "730.05.001",
    depreciationMethod: "normal",
    usefulLifeYears: 10,
    depreciationRate: 10,
    isPartialYear: false,
    salvageValue: 0,
    accumulatedDepreciation: 855000, // 2022, 2023, 2024 (3 x 285.000)
    netBookValue: 1995000,
    location: "Kocaeli Fabrika",
    branchName: "Dilovası Fabrika Tesisi",
    department: "Talaşlı İmalat",
    custodyEmployeeId: "emp_07",
    custodyEmployeeName: "Serkan Usta (Üretim Şefi)",
    custodyDate: "2022-02-15",
    status: "active",
    warrantyEndDate: "2025-02-10",
    description: "Ana kalıp ve hassas metal parça işleme hattı tezgahı.",
    createdAt: "2022-02-10T14:00:00Z",
    updatedAt: "2024-12-31T17:00:00Z",
  },
  {
    id: "dmr-004",
    code: "DMR-2023-003",
    name: "2023 Ford Transit 350L Panelvan (170PS Çift Teker)",
    category: "254_tasitlar",
    categoryLabel: "254 Taşıtlar",
    subCategory: "Ticari Araç",
    brand: "Ford",
    model: "Transit 350L Trend 2.0 EcoBlue",
    serialNumber: "WF0XXXTTGXPK11942",
    plateNumber: "34 KRG 982",
    barcode: "8690012023003",
    qrCode: "DMR-2023-003|34KRG982",
    acquisitionDate: "2023-06-01",
    activatedDate: "2023-06-01",
    invoiceNo: "OTA20230001294",
    invoiceDate: "2023-06-01",
    vendorName: "Otokoç Otomotiv Tic. A.Ş.",
    purchaseCost: 980000,
    vatRate: 20,
    vatAmount: 196000,
    totalCost: 1176000,
    currency: "TRY",
    assetAccountCode: "254.02.001",
    depreciationAccountCode: "257.02.001",
    expenseAccountCode: "760.05.001",
    depreciationMethod: "normal",
    usefulLifeYears: 5,
    depreciationRate: 20,
    isPartialYear: false, // Ticari araçlarda kıst zorunlu değildir
    salvageValue: 0,
    accumulatedDepreciation: 392000, // 2023 ve 2024 tam (2 x 196.000)
    netBookValue: 588000,
    location: "Lojistik & Dağıtım Merkezi",
    branchName: "Tuzla Dağıtım Deposu",
    department: "Lojistik & Sevkiyat",
    custodyEmployeeId: "emp_12",
    custodyEmployeeName: "Murat Demir (Baş Şoför)",
    custodyDate: "2023-06-05",
    status: "in_custody",
    warrantyEndDate: "2026-06-01",
    insuranceEndDate: "2025-05-30",
    description: "Marmara bölgesi sevkiyat ve malzeme tedariğinde kullanılmaktadır.",
    createdAt: "2023-06-01T08:30:00Z",
    updatedAt: "2024-12-31T17:00:00Z",
  },
  {
    id: "dmr-005",
    code: "DMR-2024-001",
    name: "Dell PowerEdge R750xs Rack Sunucu (2x Xeon Gold, 128GB)",
    category: "255_demirbaslar",
    categoryLabel: "255 Demirbaşlar",
    subCategory: "Sunucu & Ağ Ekipmanı",
    brand: "Dell",
    model: "PowerEdge R750xs 2U Rack",
    serialNumber: "DELL-R750-9941K",
    barcode: "8690012024001",
    qrCode: "DMR-2024-001|DELL-R750",
    acquisitionDate: "2024-01-15",
    activatedDate: "2024-01-15",
    invoiceNo: "IND20240000491",
    invoiceDate: "2024-01-15",
    vendorName: "İndeks Bilgisayar A.Ş.",
    purchaseCost: 320000,
    vatRate: 20,
    vatAmount: 64000,
    totalCost: 384000,
    currency: "TRY",
    assetAccountCode: "255.02.002",
    depreciationAccountCode: "257.02.002",
    expenseAccountCode: "770.05.001",
    depreciationMethod: "normal",
    usefulLifeYears: 5,
    depreciationRate: 20,
    isPartialYear: false,
    salvageValue: 0,
    accumulatedDepreciation: 64000, // 2024 yılı: 64.000
    netBookValue: 256000,
    location: "Sistem Odası",
    branchName: "Merkez Ofis (İstanbul)",
    department: "Bilgi İşlem",
    status: "active",
    warrantyEndDate: "2027-01-15",
    description: "Şirket içi veri tabanı, ERP sunucusu ve yedekleme barındırmaktadır.",
    createdAt: "2024-01-15T11:00:00Z",
    updatedAt: "2024-12-31T17:00:00Z",
  },
  {
    id: "dmr-006",
    code: "DMR-2024-002",
    name: "Linde E30 Elektrikli Forklift 3.0 Ton (Tripleks Asansör)",
    category: "254_tasitlar",
    categoryLabel: "254 Taşıtlar",
    subCategory: "İş Makinesi",
    brand: "Linde Material Handling",
    model: "E30/600 EVO 3000kg",
    serialNumber: "LINDE-E30-449102",
    barcode: "8690012024002",
    qrCode: "DMR-2024-002|LINDE-E30",
    acquisitionDate: "2024-03-10",
    activatedDate: "2024-03-10",
    invoiceNo: "HAS20240000843",
    invoiceDate: "2024-03-10",
    vendorName: "Hasel İstif Makineleri A.Ş.",
    purchaseCost: 850000,
    vatRate: 20,
    vatAmount: 170000,
    totalCost: 1020000,
    currency: "TRY",
    assetAccountCode: "254.03.001",
    depreciationAccountCode: "257.03.001",
    expenseAccountCode: "730.05.001",
    depreciationMethod: "normal",
    usefulLifeYears: 6,
    depreciationRate: 16.66,
    isPartialYear: false,
    salvageValue: 0,
    accumulatedDepreciation: 141610,
    netBookValue: 708390,
    location: "Ana Sevkiyat Deposu",
    branchName: "Dilovası Fabrika Tesisi",
    department: "Depo & Lojistik",
    custodyEmployeeId: "emp_15",
    custodyEmployeeName: "Kemal Güven (Forklift Operatörü)",
    custodyDate: "2024-03-12",
    status: "in_custody",
    warrantyEndDate: "2026-03-10",
    description: "Depo içi palet yükleme ve tır boşaltma operasyonlarında kullanılmaktadır.",
    createdAt: "2024-03-10T13:45:00Z",
    updatedAt: "2024-12-31T17:00:00Z",
  },
  {
    id: "dmr-007",
    code: "DMR-2024-003",
    name: "Koleksiyon Mobilya Yönetici Takımı & 12 Kişilik Toplantı Masası",
    category: "255_demirbaslar",
    categoryLabel: "255 Demirbaşlar",
    subCategory: "Ofis Mobilyası",
    brand: "Koleksiyon Mobilya",
    model: "Calder Yönetici Masası + Ikaros Toplantı",
    serialNumber: "KOL-2024-OFIS-09",
    barcode: "8690012024003",
    qrCode: "DMR-2024-003|KOLEKSIYON",
    acquisitionDate: "2024-05-18",
    activatedDate: "2024-05-18",
    invoiceNo: "KOL20240003182",
    invoiceDate: "2024-05-18",
    vendorName: "Koleksiyon Mobilya San. A.Ş.",
    purchaseCost: 210000,
    vatRate: 20,
    vatAmount: 42000,
    totalCost: 252000,
    currency: "TRY",
    assetAccountCode: "255.01.001",
    depreciationAccountCode: "257.01.001",
    expenseAccountCode: "770.05.001",
    depreciationMethod: "normal",
    usefulLifeYears: 5,
    depreciationRate: 20,
    isPartialYear: false,
    salvageValue: 0,
    accumulatedDepreciation: 42000,
    netBookValue: 168000,
    location: "Yönetim Katı",
    branchName: "Merkez Ofis (İstanbul)",
    department: "Genel Yönetim",
    status: "active",
    warrantyEndDate: "2026-05-18",
    description: "Yönetim kurulu toplantı odası ve genel müdürlük makam mobilyaları.",
    createdAt: "2024-05-18T15:20:00Z",
    updatedAt: "2024-12-31T17:00:00Z",
  },
  {
    id: "dmr-008",
    code: "DMR-2024-004",
    name: "Kadıköy Mağaza Özel Dekorasyon ve Havalandırma Tesisatı",
    category: "264_ozel_maliyetler",
    categoryLabel: "264 Özel Maliyetler",
    subCategory: "Kira Dekorasyon",
    brand: "Özel İmalat",
    model: "Mağaza Konsept Mimari Projesi",
    serialNumber: "MIM-2024-KDKY-01",
    barcode: "8690012024004",
    qrCode: "DMR-2024-004|OZELMALIYET",
    acquisitionDate: "2024-07-01",
    activatedDate: "2024-07-01",
    invoiceNo: "DEK20240000812",
    invoiceDate: "2024-07-01",
    vendorName: "Art Mimarlık & Dekorasyon Ltd.",
    purchaseCost: 650000,
    vatRate: 20,
    vatAmount: 130000,
    totalCost: 780000,
    currency: "TRY",
    assetAccountCode: "264.01.001",
    depreciationAccountCode: "268.01.001",
    expenseAccountCode: "770.05.003",
    depreciationMethod: "normal",
    usefulLifeYears: 5, // 5 yıllık kira sözleşmesi süresince
    depreciationRate: 20,
    isPartialYear: false,
    salvageValue: 0,
    accumulatedDepreciation: 65000, // 2024 yarım yıl itfa payı
    netBookValue: 585000,
    location: "Kadıköy Mağaza",
    branchName: "Kadıköy Şube",
    department: "Satış & Pazarlama",
    status: "active",
    warrantyEndDate: "2026-07-01",
    description: "Kadıköy kiralık mağaza için yapılan asma tavan, aydınlatma ve zemin kaplama yatırımı.",
    createdAt: "2024-07-01T10:00:00Z",
    updatedAt: "2024-12-31T17:00:00Z",
  },
];

export const INITIAL_ASSET_MAINTENANCES: AssetMaintenanceRecord[] = [
  {
    id: "mnt-001",
    assetId: "dmr-001",
    assetName: "2023 Renault Megane 1.3 TCe Icon Otomatik",
    assetCode: "DMR-2023-001",
    maintenanceType: "periodic",
    title: "20.000 KM Periyodik Yetkili Servis Bakımı",
    date: "2024-04-10",
    cost: 8400,
    isCapitalized: false,
    serviceProvider: "Mais Boğaziçi Yetkili Servis",
    performedBy: "Teknisyen Caner Güler",
    invoiceNo: "MAIS-SER-2024-9182",
    nextScheduledDate: "2025-04-10",
    notes: "Motor yağı, yağ filtresi, hava ve polen filtreleri değişti. Fren balataları kontrol edildi.",
    createdAt: "2024-04-10T16:00:00Z",
  },
  {
    id: "mnt-002",
    assetId: "dmr-003",
    assetName: "HAAS VF-4SS CNC 4-Eksen Dikey İşleme Merkezi",
    assetCode: "DMR-2022-001",
    maintenanceType: "calibration",
    title: "Yıllık Hassas Lazer Kalibrasyon ve Spindle Kontrolü",
    date: "2024-05-22",
    cost: 32000,
    isCapitalized: false,
    serviceProvider: "Renishaw Kalibrasyon Sistemleri Ltd.",
    performedBy: "Mühendis Hakan Yıldız",
    invoiceNo: "REN-2024-00142",
    nextScheduledDate: "2025-05-22",
    notes: "Eksen boşlukları sıfırlandı, lazer interferometre ile eksen doğruluğu test edilerek raporlandı.",
    createdAt: "2024-05-22T14:30:00Z",
  },
  {
    id: "mnt-003",
    assetId: "dmr-004",
    assetName: "2023 Ford Transit 350L Panelvan (170PS Çift Teker)",
    assetCode: "DMR-2023-003",
    maintenanceType: "repair",
    title: "Ön Fren Disk ve Balata Yenilemesi",
    date: "2024-08-14",
    cost: 11500,
    isCapitalized: false,
    serviceProvider: "Otokoç Taşdelen Servis",
    performedBy: "Teknisyen Ali Demir",
    invoiceNo: "OTK-2024-81726",
    nextScheduledDate: "2025-02-14",
    notes: "Ön diskler aşınma nedeniyle orijinal Ford parçaları ile yenilendi.",
    createdAt: "2024-08-14T11:20:00Z",
  },
  {
    id: "mnt-004",
    assetId: "dmr-006",
    assetName: "Linde E30 Elektrikli Forklift 3.0 Ton",
    assetCode: "DMR-2024-002",
    maintenanceType: "periodic",
    title: "İlk 500 Çalışma Saati Bakımı ve Akü Testi",
    date: "2024-09-05",
    cost: 9200,
    isCapitalized: false,
    serviceProvider: "Hasel Teknik Servis",
    performedBy: "Teknisyen Selim Aktaş",
    invoiceNo: "HSL-2024-33129",
    nextScheduledDate: "2025-03-05",
    notes: "Hidrolik yağ ve filtreler yenilendi, akü hücre sıvı seviyeleri tamamlandı.",
    createdAt: "2024-09-05T10:15:00Z",
  },
];

export const INITIAL_ASSET_DISPOSALS: AssetDisposalRecord[] = [
  {
    id: "dsp-001",
    assetId: "dmr-old-001",
    assetName: "HP ProLiant ML350 G6 Eski Sunucu",
    assetCode: "DMR-2018-004",
    disposalType: "scrap",
    date: "2024-02-20",
    originalCost: 45000,
    accumulatedDepreciation: 45000,
    netBookValue: 0,
    salePrice: 1500, // Hurda elektronik bedeli
    gainOrLoss: 1500,
    invoiceNo: "HRD2024000001",
    customerName: "Geri Dönüşüm Elektronik Ltd.",
    notes: "Tamamen itfa edilmiş ve teknik ömrünü tamamlamış sunucu hurda olarak ayrıldı.",
    createdAt: "2024-02-20T11:00:00Z",
  },
];

// ==========================================
// 🧮 VUK AMORTİSMAN HESAPLAMA MOTORU
// ==========================================

export function calculateDepreciationSchedule(asset: FixedAsset): AssetDepreciationYearRecord[] {
  const schedule: AssetDepreciationYearRecord[] = [];
  const cost = asset.purchaseCost;
  const usefulLife = Math.max(1, asset.usefulLifeYears || 5);
  const method = asset.depreciationMethod || "normal";
  const startYear = new Date(asset.activatedDate || asset.acquisitionDate || new Date().toISOString()).getFullYear();
  const startMonth = new Date(asset.activatedDate || asset.acquisitionDate || new Date().toISOString()).getMonth() + 1; // 1 - 12
  const isBinekKist = Boolean(asset.isPartialYear);

  if (method === "none" || usefulLife <= 0) {
    return [];
  }

  let runningBookValue = cost;
  let runningAccumulated = 0;
  let remainingCatchupAmount = 0; // Binek otomobil kıst amortismanında son yıla kalan pay

  // Normal (Eşit Tutarlı / Doğrusal) Amortisman
  if (method === "normal") {
    const standardRate = Number((100 / usefulLife).toFixed(2));
    const annualBaseAmount = Number((cost / usefulLife).toFixed(2));

    for (let i = 0; i < usefulLife; i++) {
      const year = startYear + i;
      let yearAmount = annualBaseAmount;
      let partialApplied = false;
      let finalYearCatchup = false;

      // Kıst amortisman (VUK 320. md uyarınca binek otomobillerde aktife girdiği aydan yıl sonuna kadar)
      if (isBinekKist && i === 0) {
        const remainingMonthsInFirstYear = 12 - startMonth + 1;
        yearAmount = Number(((annualBaseAmount / 12) * remainingMonthsInFirstYear).toFixed(2));
        remainingCatchupAmount = annualBaseAmount - yearAmount;
        partialApplied = true;
      }

      // Son yıl kıst kalanını ekle (VUK kuralı: Kalan süre amortisman süresinin son yılına eklenir)
      if (isBinekKist && i === usefulLife - 1) {
        yearAmount = Number((yearAmount + remainingCatchupAmount).toFixed(2));
        finalYearCatchup = true;
      }

      // Son yıl yuvarlama düzeltmesi (tam maliyeti aşmasın)
      if (i === usefulLife - 1) {
        const expectedTotal = cost;
        const currentSum = runningAccumulated + yearAmount;
        if (Math.abs(currentSum - expectedTotal) > 0.01) {
          yearAmount = Number((expectedTotal - runningAccumulated).toFixed(2));
        }
      }

      const qAmount = Number((yearAmount / 4).toFixed(2));
      const q4Amount = Number((yearAmount - qAmount * 3).toFixed(2)); // Küsurat düzeltmesi

      const yearRecord: AssetDepreciationYearRecord = {
        year,
        openingBookValue: runningBookValue,
        depreciationRate: standardRate,
        annualDepreciation: yearAmount,
        q1Amount: qAmount,
        q2Amount: qAmount,
        q3Amount: qAmount,
        q4Amount,
        accumulatedDepreciation: Number((runningAccumulated + yearAmount).toFixed(2)),
        closingNetBookValue: Number(Math.max(0, runningBookValue - yearAmount).toFixed(2)),
        isPartialApplied: partialApplied,
        isFinalYearCatchup: finalYearCatchup,
        journalEntryPreview: {
          debitAccount: asset.expenseAccountCode || "770.05.001",
          debitTitle: "Amortisman Giderleri",
          creditAccount: asset.depreciationAccountCode || "257.01.001",
          creditTitle: "Birikmiş Amortismanlar",
          amount: yearAmount,
        },
      };

      runningAccumulated += yearAmount;
      runningBookValue = Math.max(0, runningBookValue - yearAmount);
      schedule.push(yearRecord);
    }
  }

  // Azalan Bakiyeler (Hızlandırılmış) Amortisman (Çift Oranlı, Max %50)
  else if (method === "declining_balance") {
    const rawRate = (100 / usefulLife) * 2;
    const rate = Math.min(50, Number(rawRate.toFixed(2))); // VUK kuralı: %50'yi geçemez

    for (let i = 0; i < usefulLife; i++) {
      const year = startYear + i;
      let yearAmount = 0;

      // Son yılda kalan net defter değerinin tamamı amortismana tabi tutulur (VUK kuralı)
      if (i === usefulLife - 1) {
        yearAmount = Number(runningBookValue.toFixed(2));
      } else {
        yearAmount = Number(((runningBookValue * rate) / 100).toFixed(2));
      }

      const qAmount = Number((yearAmount / 4).toFixed(2));
      const q4Amount = Number((yearAmount - qAmount * 3).toFixed(2));

      const yearRecord: AssetDepreciationYearRecord = {
        year,
        openingBookValue: runningBookValue,
        depreciationRate: rate,
        annualDepreciation: yearAmount,
        q1Amount: qAmount,
        q2Amount: qAmount,
        q3Amount: qAmount,
        q4Amount,
        accumulatedDepreciation: Number((runningAccumulated + yearAmount).toFixed(2)),
        closingNetBookValue: Number(Math.max(0, runningBookValue - yearAmount).toFixed(2)),
        journalEntryPreview: {
          debitAccount: asset.expenseAccountCode || "770.05.001",
          debitTitle: "Amortisman Giderleri",
          creditAccount: asset.depreciationAccountCode || "257.01.001",
          creditTitle: "Birikmiş Amortismanlar",
          amount: yearAmount,
        },
      };

      runningAccumulated += yearAmount;
      runningBookValue = Math.max(0, runningBookValue - yearAmount);
      schedule.push(yearRecord);
    }
  }

  return schedule;
}

export function formatTRY(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function getCategoryBadgeColor(category: FixedAssetCategory): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (category) {
    case "254_tasitlar":
      return {
        bg: "bg-blue-50 text-blue-700",
        text: "text-blue-700",
        border: "border-blue-200",
        dot: "bg-blue-500",
      };
    case "255_demirbaslar":
      return {
        bg: "bg-emerald-50 text-emerald-700",
        text: "text-emerald-700",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
      };
    case "253_tesis_makine":
      return {
        bg: "bg-purple-50 text-purple-700",
        text: "text-purple-700",
        border: "border-purple-200",
        dot: "bg-purple-500",
      };
    case "264_ozel_maliyetler":
      return {
        bg: "bg-amber-50 text-amber-700",
        text: "text-amber-700",
        border: "border-amber-200",
        dot: "bg-amber-500",
      };
    case "260_haklar_lisans":
      return {
        bg: "bg-indigo-50 text-indigo-700",
        text: "text-indigo-700",
        border: "border-indigo-200",
        dot: "bg-indigo-500",
      };
    case "252_binalar":
      return {
        bg: "bg-rose-50 text-rose-700",
        text: "text-rose-700",
        border: "border-rose-200",
        dot: "bg-rose-500",
      };
    default:
      return {
        bg: "bg-slate-50 text-slate-700",
        text: "text-slate-700",
        border: "border-slate-200",
        dot: "bg-slate-500",
      };
  }
}

export function getStatusBadgeInfo(status: string): { label: string; bg: string; text: string } {
  switch (status) {
    case "active":
      return { label: "Aktif Kullanımda", bg: "bg-emerald-100", text: "text-emerald-800" };
    case "in_custody":
      return { label: "Zimmetli", bg: "bg-blue-100", text: "text-blue-800" };
    case "in_storage":
      return { label: "Depoda / Boşta", bg: "bg-slate-100", text: "text-slate-800" };
    case "maintenance":
      return { label: "Serviste / Bakımda", bg: "bg-amber-100", text: "text-amber-800" };
    case "scrapped":
      return { label: "Hurdaya Ayrıldı", bg: "bg-red-100", text: "text-red-800" };
    case "sold":
      return { label: "Satıldı / Çıkış", bg: "bg-purple-100", text: "text-purple-800" };
    default:
      return { label: status, bg: "bg-slate-100", text: "text-slate-800" };
  }
}
