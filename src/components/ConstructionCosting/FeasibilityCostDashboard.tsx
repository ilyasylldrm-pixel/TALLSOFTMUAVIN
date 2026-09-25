import React, { useState, useMemo } from "react";
import {
  generalDashboardData,
  detailedCostGroupsData,
  architecturalMetrajData,
  landValuationData,
  vatSimulationData,
  cashFlowData,
  sensitivityData,
  ProjectCostMultipliers,
  DEFAULT_COST_MULTIPLIERS,
  calculateDynamicTotals,
} from "../../data/feasibilityDashboardData";
import { formatCurrency } from "../../utils/exportUtils";
import {
  Layers,
  Building2,
  TrendingUp,
  Download,
  Search,
  ChevronRight,
  ChevronDown,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  DollarSign,
  PieChart,
  HardHat,
  ShieldCheck,
  Scale,
  Percent,
  Calculator,
  Compass,
  FileText,
  MapPin,
  Flame,
  ArrowRight,
  Maximize2,
  Table,
  Check,
  Info,
  Sliders,
  RotateCcw,
  Sparkles,
  Printer,
  ChevronUp,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

// Sayfalar: 1 Numarada "Mimari Metraj & İmar Parametreleri" ve ardından 2-16 ardışık sıralama
export const ALL_SHEETS_CONFIG = [
  {
    id: "01",
    code: "01",
    dataKey: "01",
    name: "Mimari Metraj, İmar Parametreleri & Bağımsız Bölüm Cetveli",
    badge: "Metraj & Planlama",
    totalDesc: "25.080 m² Kapalı Alan",
    unitDesc: "64 Daire + 16 Dükkan",
    subTitle: "10.000 m² Arsa, 4 Blok, Kat Planları, Emsal & TAKS/KAKS, Bağımsız Bölümler ve 5.330 m² Ortak Alan",
    icon: Calculator,
  },
  {
    id: "02",
    code: "02",
    dataKey: "02",
    name: "Hafriyat, Zemin İyileştirme & İksa Sistemleri",
    badge: "İmalat Paketi",
    costGroupNo: "02",
    subTitle: "2 Alt Başlık - Saha Hazırlığı, Kazı, Fore Kazık & İksa",
    icon: HardHat,
  },
  {
    id: "03",
    code: "03",
    dataKey: "03",
    name: "Kaba Yapı ve Taşıyıcı Sistemler (Beton & Donatı)",
    badge: "İmalat Paketi",
    costGroupNo: "03",
    subTitle: "4 Alt Başlık - Radye Temel, C35/45 Düşey, C30/37 Yatay, Gazbeton",
    icon: Building2,
  },
  {
    id: "04",
    code: "04",
    dataKey: "04",
    name: "Çatı Konstrüksiyonu ve Dış Cephe Kaplamaları",
    badge: "İmalat Paketi",
    costGroupNo: "04",
    subTitle: "2 Alt Başlık - Çelik Çatı, Kenet Alüminyum, Taşyünü Mantolama, Mekanik Cephe",
    icon: Layers,
  },
  {
    id: "05",
    code: "05",
    dataKey: "05",
    name: "İnce Yapı, Mimari Kaplamalar ve Mobilya",
    badge: "İmalat Paketi",
    costGroupNo: "05",
    subTitle: "4 Alt Başlık - İzolasyon, Şap, Parke, Seramik, Boya, Doğrama, Mutfak/Banyo",
    icon: FileText,
  },
  {
    id: "06",
    code: "06",
    dataKey: "06",
    name: "Mekanik, Havalandırma ve Yangın Tesisatı (Markalı)",
    badge: "İmalat Paketi",
    costGroupNo: "06",
    subTitle: "3 Alt Başlık - Sıhhi Tesisat, Rehau Yerden Isıtma, Kaskad Kazan, Jet Fan, Sprinkler",
    icon: Flame,
  },
  {
    id: "07",
    code: "07",
    dataKey: "07",
    name: "Elektrik Dağıtım, Aydınlatma ve Zayıf Akım (Markalı)",
    badge: "İmalat Paketi",
    costGroupNo: "07",
    subTitle: "3 Alt Başlık - AG Panolar, Halogen-Free Kablo, IP İnterkom, Jeneratör, EV Şarj",
    icon: Compass,
  },
  {
    id: "08",
    code: "08",
    dataKey: "08",
    name: "Asansör ve Bina Giriş / Atık Sistemleri",
    badge: "İmalat Paketi",
    costGroupNo: "08",
    subTitle: "2 Alt Başlık - KONE/Otis 8 Adet Hızlı Asansör, Seksiyonel Otopark Kapısı, Çöp Şutu",
    icon: ArrowRight,
  },
  {
    id: "09",
    code: "09",
    dataKey: "09",
    name: "Altyapı, Çevre Güvenliği ve Peyzaj Tanzimi (10 Dönüm)",
    badge: "İmalat Paketi",
    costGroupNo: "09",
    subTitle: "2 Alt Başlık - 10 Dönüm Çevre İstinat Duvarı, 7.000 m² Rulo Çim, Otomatik Sulama",
    icon: MapPin,
  },
  {
    id: "10",
    code: "10",
    dataKey: "10",
    name: "Şantiye Yönetimi, Teknik Personel ve Ağır Ekipman",
    badge: "Genel Gider",
    costGroupNo: "10",
    subTitle: "2 Alt Başlık - 20 Aylık Teknik Kadro Bordrosu, 2 Kule Vinç, Mobilizasyon, İSG & CAR Sigortası",
    icon: ShieldCheck,
  },
  {
    id: "11",
    code: "11",
    dataKey: "11",
    name: "Resmi Harçlar, Proje Mühendislik ve Denetim",
    badge: "Genel Gider",
    costGroupNo: "11",
    subTitle: "2 Alt Başlık - Mimari/Statik/Tesisat Projeleri, Belediye Ruhsat/Otopark Harcı, Yapı Denetim",
    icon: Scale,
  },
  {
    id: "12",
    code: "12",
    dataKey: "12",
    name: "SGK Asgari İşçilik ve İlişiksizlik Hesap Cetveli",
    badge: "Mevzuat / Prim",
    costGroupNo: "12",
    subTitle: "5510 Sayılı Kanun Kapsamında ÇŞB IV-A Grubu ve Toplam Ruhsat Alanına Göre Yasal Maliyet",
    icon: DollarSign,
  },
  {
    id: "13",
    code: "13",
    dataKey: "13",
    name: "Bölge Emsal Arsa Değerleme & Kat Karşılığı Analizi",
    badge: "Fizibilite & Değerleme",
    totalDesc: "284.900.000 TL",
    unitDesc: "28.490 TL/m² Rayiç",
    subTitle: "Bölge Emsal Karşılaştırması & Kat Karşılığı vs Peşin Satın Alma Kıyası",
    icon: Building2,
  },
  {
    id: "14",
    code: "14",
    dataKey: "14",
    name: "KDV Rejimi Mevzuatı & Satış Hasılatı KDV Simülasyonu",
    badge: "Vergi & Finans",
    totalDesc: "69.157.895 TL KDV",
    unitDesc: "45 Bağımsız Bölüm",
    subTitle: "01/04/2022 Sonrası Kademeli KDV (%10, %20) & 45 Bağımsız Bölüm Matrahı",
    icon: Percent,
  },
  {
    id: "15",
    code: "15",
    dataKey: "15",
    name: "20 Aylık Şantiye Hakediş & Nakit Çıkış Akışı",
    badge: "Finans & Nakit",
    totalDesc: "419.244.900 TL",
    unitDesc: "20 Aylık Takvim",
    subTitle: "1. - 20. Ay Arası Paket Bazında Hakediş Çıkışları ve Finansman Matrisi",
    icon: Calendar,
  },
  {
    id: "16",
    code: "16",
    dataKey: "16",
    name: "Girdi Maliyeti Şokları, Hassasiyet ve Risk Analizi",
    badge: "Stratejik Analiz",
    totalDesc: "5 Girdi Şok Testi",
    unitDesc: "Risk Analizi",
    subTitle: "Demir, Beton, İşçilik Şokları (-%10 / +%40) & Kriz Senaryoları",
    icon: TrendingUp,
  },
];

export const FeasibilityCostDashboard: React.FC = () => {
  const { theme } = useTheme();
  const [activeInlineSheet, setActiveInlineSheet] = useState<string | null>("01");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isMultiplierPanelOpen, setIsMultiplierPanelOpen] = useState<boolean>(true);

  // Maliyet Çarpanları State (Kullanıcı tarafından dinamik olarak değiştirilebilir ve kaydedilir)
  const [multipliers, setMultipliers] = useState<ProjectCostMultipliers>(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const saved = window.localStorage.getItem("construction_cost_multipliers_v2");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.contractorProfitPct === "number") {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn("Maliyet çarpanları yüklenemedi:", e);
    }
    return DEFAULT_COST_MULTIPLIERS;
  });

  const handleUpdateMultiplier = (field: keyof ProjectCostMultipliers, val: number) => {
    const safeVal = Math.max(0, Math.min(100, isNaN(val) ? 0 : val));
    setMultipliers((prev) => {
      const next = { ...prev, [field]: safeVal };
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem("construction_cost_multipliers_v2", JSON.stringify(next));
        }
      } catch {}
      return next;
    });
  };

  const handleResetMultipliers = () => {
    setMultipliers(DEFAULT_COST_MULTIPLIERS);
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem("construction_cost_multipliers_v2");
      }
    } catch {}
  };

  // Dinamik Toplamların Hesaplanması
  const dynamicTotals = useMemo(() => {
    return calculateDynamicTotals(
      generalDashboardData.kpiCards.directConstructionCost,
      multipliers,
      generalDashboardData.kpiCards.totalCoveredAreaM2,
      11109,
      generalDashboardData.kpiCards.contractorSalesRevenue
    );
  }, [multipliers]);

  const handleToggleSheet = (sheetId: string) => {
    if (activeInlineSheet === sheetId) {
      setActiveInlineSheet(null);
    } else {
      setActiveInlineSheet(sheetId);
    }
  };

  const handleToggleAllSheets = () => {
    if (activeInlineSheet === "ALL_OPEN") {
      setActiveInlineSheet(null);
    } else {
      setActiveInlineSheet("ALL_OPEN");
    }
  };

  // Filtreleme
  const filteredSheets = ALL_SHEETS_CONFIG.filter((s) => {
    const matchesSearch =
      !searchTerm ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.includes(searchTerm) ||
      s.badge.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (categoryFilter === "all") return true;
    if (categoryFilter === "packages") return s.badge === "İmalat Paketi";
    if (categoryFilter === "overhead") return s.badge === "Genel Gider";
    if (categoryFilter === "finance")
      return (
        s.badge === "Mevzuat / Prim" ||
        s.badge === "Vergi & Finans" ||
        s.badge === "Finans & Nakit" ||
        s.badge === "Stratejik Analiz"
      );
    if (categoryFilter === "planning")
      return s.badge === "Metraj & Planlama" || s.badge === "Fizibilite & Değerleme";

    return true;
  });

  // CSV Dışa Aktarma
  const handleExportCSV = () => {
    const headers = ["Sira", "Sayfa_Kodu", "Sayfa_Adi", "Kategori", "Tutar_TL", "Birim_Oran_Aciklama"];
    const rows = ALL_SHEETS_CONFIG.map((sheet) => {
      const matchingCostGroup = sheet.costGroupNo
        ? generalDashboardData.costGroups.find((cg) => cg.groupNo === sheet.costGroupNo)
        : null;

      let amountVal = sheet.totalDesc || "-";
      let unitDesc = sheet.unitDesc || "-";

      if (matchingCostGroup) {
        amountVal = String(matchingCostGroup.totalAmount);
        const sharePct = (
          (matchingCostGroup.totalAmount / dynamicTotals.directCost) *
          100
        ).toFixed(1);
        const unitM2 = Math.round(
          matchingCostGroup.totalAmount / dynamicTotals.directCostPerM2
        );
        unitDesc = `${unitM2} TL/m2 (%${sharePct})`;
      }

      return [
        sheet.code,
        sheet.code,
        `"${sheet.name.replace(/"/g, '""')}"`,
        `"${sheet.badge}"`,
        amountVal,
        `"${unitDesc}"`,
      ].join(",");
    });

    const summaryFooter = [
      "",
      "TOPLAM",
      `"11 Direkt İmalat ve Yasal Harç Paketi"`,
      `"Direkt Maliyet"`,
      dynamicTotals.directCost,
      `"${dynamicTotals.directCostPerM2} TL/m²"`,
    ].join(",");

    const generalBudgetRow = [
      "",
      "GENEL_BUTCE",
      `"Genel Bütçe (KDV Hariç - %${dynamicTotals.totalAdditionsPct} Ek Çarpan Dahil)"`,
      `"Bütçe"`,
      dynamicTotals.generalBudgetExclVat,
      `"${dynamicTotals.generalBudgetPerM2} TL/m²"`,
    ].join(",");

    const vatRow = [
      "",
      "KDV_DAHIL",
      `"Toplam Proje Yatırımı (%${multipliers.vatRatePct} KDV Dahil)"`,
      `"Yatırım"`,
      dynamicTotals.totalInvestmentWithVat,
      `"${dynamicTotals.totalInvestmentPerM2} TL/m²"`,
    ].join(",");

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows, summaryFooter, generalBudgetRow, vatRow].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `16_Paketlik_Maliyet_Tablosu_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* 1. ÜST BAŞLIK & PROJE KÜNYESİ */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-2xs font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                10.000 m² ARSA | 16 SAYFA ARDIŞIK EKSİKSİZ DÖKÜM
              </span>
              <span className="text-2xs font-bold text-slate-500">
                25.080 m² Kapalı Alan • 16 Dükkan • 64 Lüks Daire • 16 Kapsamlı Bölüm
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 mt-1">
              {generalDashboardData.projectTitle}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {generalDashboardData.projectSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Excel (CSV) İndir</span>
            </button>
            <button
              type="button"
              onClick={() => setIsMultiplierPanelOpen(!isMultiplierPanelOpen)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-amber-600" />
              <span>{isMultiplierPanelOpen ? "Çarpan Panelini Gizle" : "Maliyet Çarpanlarını Ayarla"}</span>
            </button>
          </div>
        </div>

        {/* 2. DİNAMİK MALİYET ÇARPANLARI VE BÜTÇE MATRİSİ (YENİLENMİŞ & HESAPLAMALARI DÜZELTİLMİŞ) */}
        {isMultiplierPanelOpen && (
          <div className="bg-linear-to-br from-amber-50/70 via-slate-50 to-emerald-50/40 p-4 rounded-2xl border border-amber-200 shadow-2xs space-y-3.5 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-amber-200/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-2xs font-black text-xs">
                  %
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    Maliyet Çarpanları & Genel Bütçe Simülasyon Motoru
                    <span className="text-3xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Aktif Çarpan: x{dynamicTotals.multiplierFactor}
                    </span>
                  </h4>
                  <p className="text-3xs text-slate-500">
                    Aşağıdaki çarpan oranlarını değiştirerek Genel Bütçe (KDV Hariç) ve Toplam Yatırım (KDV Dahil) tutarlarını anlık güncelleyin.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetMultipliers}
                  className="px-2.5 py-1 rounded-lg text-3xs font-extrabold bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Varsayılan standart oranlara sıfırla (%15 Kâr, %8 Risk, %5 Finansman, %20 KDV)"
                >
                  <RotateCcw className="w-3 h-3 text-slate-400" />
                  <span>Varsayılan Çarpanlara Dön</span>
                </button>
              </div>
            </div>

            {/* 4 Çarpan Girdi Alanları */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Çarpan 1: Müteahhitlik / Yüklenici Kârı */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between text-2xs font-extrabold text-slate-800">
                  <span className="flex items-center gap-1 text-slate-900">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                    Müteahhitlik Kârı
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono font-black border border-blue-200">
                    %{multipliers.contractorProfitPct}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="40"
                    step="1"
                    value={multipliers.contractorProfitPct}
                    onChange={(e) => handleUpdateMultiplier("contractorProfitPct", Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={multipliers.contractorProfitPct}
                    onChange={(e) => handleUpdateMultiplier("contractorProfitPct", Number(e.target.value))}
                    className="w-14 px-1.5 py-1 text-right text-xs font-mono font-bold rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-between text-3xs text-slate-500 pt-0.5">
                  <span>Hesaplanan Kâr Tutarı:</span>
                  <span className="font-bold text-blue-800 font-mono">
                    +{formatCurrency(dynamicTotals.contractorProfitAmount)}
                  </span>
                </div>
              </div>

              {/* Çarpan 2: Beklenmeyen Giderler & Şantiye Risk Payı */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between text-2xs font-extrabold text-slate-800">
                  <span className="flex items-center gap-1 text-slate-900">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    Şantiye Risk Payı
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-mono font-black border border-amber-200">
                    %{multipliers.unforeseenRiskPct}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="25"
                    step="1"
                    value={multipliers.unforeseenRiskPct}
                    onChange={(e) => handleUpdateMultiplier("unforeseenRiskPct", Number(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={multipliers.unforeseenRiskPct}
                    onChange={(e) => handleUpdateMultiplier("unforeseenRiskPct", Number(e.target.value))}
                    className="w-14 px-1.5 py-1 text-right text-xs font-mono font-bold rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-between text-3xs text-slate-500 pt-0.5">
                  <span>Hesaplanan Risk Payı:</span>
                  <span className="font-bold text-amber-800 font-mono">
                    +{formatCurrency(dynamicTotals.unforeseenRiskAmount)}
                  </span>
                </div>
              </div>

              {/* Çarpan 3: Finansman & Enflasyon Taşıma Maliyeti */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between text-2xs font-extrabold text-slate-800">
                  <span className="flex items-center gap-1 text-slate-900">
                    <Calendar className="w-3.5 h-3.5 text-purple-600" />
                    Finansman & Enflasyon
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 font-mono font-black border border-purple-200">
                    %{multipliers.financingInflationPct}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={multipliers.financingInflationPct}
                    onChange={(e) => handleUpdateMultiplier("financingInflationPct", Number(e.target.value))}
                    className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={multipliers.financingInflationPct}
                    onChange={(e) => handleUpdateMultiplier("financingInflationPct", Number(e.target.value))}
                    className="w-14 px-1.5 py-1 text-right text-xs font-mono font-bold rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-between text-3xs text-slate-500 pt-0.5">
                  <span>Hesaplanan Finansman:</span>
                  <span className="font-bold text-purple-800 font-mono">
                    +{formatCurrency(dynamicTotals.financingInflationAmount)}
                  </span>
                </div>
              </div>

              {/* Çarpan 4: Girdi / Alış KDV Oranı */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between text-2xs font-extrabold text-slate-800">
                  <span className="flex items-center gap-1 text-slate-900">
                    <Percent className="w-3.5 h-3.5 text-emerald-600" />
                    Alış / Girdi KDV Oranı
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-mono font-black border border-emerald-200">
                    %{multipliers.vatRatePct}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="1"
                    value={multipliers.vatRatePct}
                    onChange={(e) => handleUpdateMultiplier("vatRatePct", Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={multipliers.vatRatePct}
                    onChange={(e) => handleUpdateMultiplier("vatRatePct", Number(e.target.value))}
                    className="w-14 px-1.5 py-1 text-right text-xs font-mono font-bold rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-between text-3xs text-slate-500 pt-0.5">
                  <span>KDV Yükü Tutarı:</span>
                  <span className="font-bold text-emerald-800 font-mono">
                    +{formatCurrency(dynamicTotals.vatAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Çarpan Özeti ve Etkisi Şeridi */}
            <div className="p-3 bg-white/90 rounded-xl border border-amber-200/90 flex flex-wrap items-center justify-between gap-3 text-2xs font-semibold">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-slate-600">
                  Direkt İmalat: <strong className="text-slate-900 font-mono">{formatCurrency(dynamicTotals.directCost)}</strong>
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-blue-700">
                  İlave Çarpanlar (%{dynamicTotals.totalAdditionsPct}): <strong className="font-mono">+{formatCurrency(dynamicTotals.totalAdditionsAmount)}</strong>
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-emerald-700">
                  Genel Bütçe (KDV Hariç): <strong className="font-mono">{formatCurrency(dynamicTotals.generalBudgetExclVat)}</strong>
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-indigo-700">
                  KDV Dahil Toplam Yatırım: <strong className="font-mono">{formatCurrency(dynamicTotals.totalInvestmentWithVat)}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-3xs font-extrabold border border-slate-200 font-mono">
                  m² Direkt: {dynamicTotals.directCostPerM2.toLocaleString("tr-TR")} TL
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 text-3xs font-extrabold border border-emerald-200 font-mono">
                  m² Genel Bütçe: {dynamicTotals.generalBudgetPerM2.toLocaleString("tr-TR")} TL
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 3. DİNAMİK 5 KPI KARTI (TÜM TOPLAMLAR ÇARPANLARA GÖRE ANLIK YENİLENİR) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-1">
          <div className="rounded-2xl p-4 border border-slate-200/90 shadow-2xs haze-kpi-card-bg relative overflow-hidden flex flex-col justify-between">
            <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block">
              Toplam Kapalı Alan
            </span>
            <div className="mt-2 text-xl font-bold font-mono tracking-tight text-slate-900">
              {(dynamicTotals?.totalCoveredAreaM2 ?? 25080).toLocaleString("tr-TR")}{" "}
              <span className="text-xs font-semibold text-slate-400">m²</span>
            </div>
            <span className="text-2xs text-slate-400 mt-2 block font-medium">
              16.320 m² Konut + 3.430 m² Ticari + 5.330 m² Ortak
            </span>
          </div>

          <div className="rounded-2xl p-4 border border-blue-200/80 shadow-2xs haze-kpi-card-bg relative overflow-hidden flex flex-col justify-between">
            <span className="text-2xs font-semibold text-blue-700 uppercase tracking-wider block">
              Direkt İnşaat Maliyeti
            </span>
            <div className="mt-2 text-xl font-bold font-mono tracking-tight text-blue-800">
              {formatCurrency(dynamicTotals?.directCost ?? 0)}
            </div>
            <span className="text-2xs text-blue-600 mt-2 block font-medium">
              11 Paket İmalat • {(dynamicTotals?.directCostPerM2 ?? 0).toLocaleString("tr-TR")} TL/m²
            </span>
          </div>

          <div className="rounded-2xl p-4 border border-emerald-200/80 shadow-2xs haze-kpi-card-bg relative overflow-hidden flex flex-col justify-between">
            <span className="text-2xs font-semibold text-emerald-700 uppercase tracking-wider block">
              Genel Bütçe (KDV Hariç)
            </span>
            <div className="mt-2 text-xl font-bold font-mono tracking-tight text-emerald-800">
              {formatCurrency(dynamicTotals?.generalBudgetExclVat ?? 0)}
            </div>
            <span className="text-2xs text-emerald-600 mt-2 block font-medium">
              +%{dynamicTotals?.totalAdditionsPct ?? 28} Çarpan Dahil • {(dynamicTotals?.generalBudgetPerM2 ?? 0).toLocaleString("tr-TR")} TL/m²
            </span>
          </div>

          <div className="rounded-2xl p-4 border border-amber-200/80 shadow-2xs haze-kpi-card-bg relative overflow-hidden flex flex-col justify-between">
            <span className="text-2xs font-semibold text-amber-700 uppercase tracking-wider block">
              Müteahhit Satış Hasılatı
            </span>
            <div className="mt-2 text-xl font-bold font-mono tracking-tight text-amber-800">
              {formatCurrency(dynamicTotals?.salesRevenue ?? 0)}
            </div>
            <span className="text-2xs text-amber-600 mt-2 block font-medium">
              Net Kâr: {formatCurrency(dynamicTotals?.netProfit ?? 0)} (%{dynamicTotals?.profitMarginPct ?? 0})
            </span>
          </div>

          <div className="rounded-2xl p-4 border border-indigo-200/80 shadow-2xs haze-kpi-card-bg relative overflow-hidden flex flex-col justify-between">
            <span className="text-2xs font-semibold text-indigo-700 uppercase tracking-wider block">
              Toplam Yatırım (KDV Dahil)
            </span>
            <div className="mt-2 text-xl font-bold font-mono tracking-tight text-indigo-800">
              {formatCurrency(dynamicTotals?.totalInvestmentWithVat ?? 0)}
            </div>
            <span className="text-2xs text-indigo-600 mt-2 block font-medium">
              %{multipliers.vatRatePct} KDV Dahil • {(dynamicTotals?.totalInvestmentPerM2 ?? 0).toLocaleString("tr-TR")} TL/m²
            </span>
          </div>
        </div>
      </div>

      {/* 4. İMALAT VE AYRIŞTIRILMIŞ GİDER PAKETİ DÖKÜMÜ - 16 SAYFA TAM LİSTESİ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/60">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="w-4.5 h-4.5 text-amber-600" />
              16 Paketlik İmalat ve Fizibilite Maliyet Tablosu (1'den 16'ya Tam Döküm)
            </h3>
            <p className="text-2xs text-slate-500 mt-0.5">
              1. Sayfa Mimari Metraj & İmar Analizinden 16. Sayfa Hassasiyet & Risk Analizine kadar tüm paketler ve düzeltilmiş çarpanlar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Kategori Filtresi */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-2xs font-bold">
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  categoryFilter === "all" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Tümü (16)
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("packages")}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  categoryFilter === "packages" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                İmalat (8)
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("overhead")}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  categoryFilter === "overhead" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Genel Gider (3)
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("finance")}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  categoryFilter === "finance" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Finans & Vergi (5)
              </button>
            </div>

            {/* Arama */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Paket veya sayfa ara..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 w-44"
              />
            </div>

            {/* Tümünü Aç/Kapat Butonu */}
            <button
              type="button"
              onClick={handleToggleAllSheets}
              className="px-3 py-1.5 rounded-xl text-2xs font-extrabold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
            >
              {activeInlineSheet === "ALL_OPEN" ? "Tümünü Kapat" : "Tümünü Genişlet"}
            </button>
          </div>
        </div>

        {/* 16 Sayfanın Tümü İçin Entegre Tablo */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold text-2xs uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4 w-14">Sıra</th>
                <th className="py-3 px-4">Paket / Sayfa Başlığı ve Kapsamı</th>
                <th className="py-3 px-4 w-32">Kategori</th>
                <th className="py-3 px-4 text-right w-40">Toplam Tutar / Değer</th>
                <th className="py-3 px-4 text-right w-36">Birim / Oran / Çarpan</th>
                <th className="py-3 px-4 text-center w-36">Sayfa Detayı</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredSheets.map((sheet) => {
                const Icon = sheet.icon;
                const isOpened = activeInlineSheet === sheet.id || activeInlineSheet === "ALL_OPEN";

                // Maliyet grubu eşleşmesi
                const matchingCostGroup = sheet.costGroupNo
                  ? generalDashboardData.costGroups.find((cg) => cg.groupNo === sheet.costGroupNo)
                  : null;

                let amountDisplay = sheet.totalDesc || "-";
                let unitDesc = sheet.unitDesc || "-";

                if (matchingCostGroup) {
                  amountDisplay = formatCurrency(matchingCostGroup.totalAmount);
                  const directCostSafe = dynamicTotals?.directCost || 419244900;
                  const totalAreaSafe = dynamicTotals?.totalCoveredAreaM2 || 25080;
                  const sharePct = (
                    (matchingCostGroup.totalAmount / directCostSafe) *
                    100
                  ).toFixed(1);
                  const unitM2 = Math.round(
                    matchingCostGroup.totalAmount / totalAreaSafe
                  );
                  unitDesc = `${unitM2.toLocaleString("tr-TR")} TL/m² (%${sharePct})`;
                }

                return (
                  <React.Fragment key={sheet.id}>
                    <tr
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isOpened ? "bg-amber-50/30" : ""
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-black text-slate-900">
                        <span className="w-7 h-7 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center text-xs shadow-2xs">
                          {sheet.code}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                          <div>
                            <span className="font-extrabold text-slate-900 block text-xs">
                              {sheet.name}
                            </span>
                            <span className="text-3xs text-slate-500 block">
                              {sheet.subTitle}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-3xs font-extrabold ${
                            sheet.badge === "İmalat Paketi"
                              ? "bg-blue-100 text-blue-800"
                              : sheet.badge === "Genel Gider"
                              ? "bg-slate-100 text-slate-800"
                              : sheet.badge === "Mevzuat / Prim"
                              ? "bg-purple-100 text-purple-800"
                              : sheet.badge === "Metraj & Planlama"
                              ? "bg-amber-100 text-amber-900"
                              : sheet.badge === "Fizibilite & Değerleme"
                              ? "bg-emerald-100 text-emerald-800"
                              : sheet.badge === "Vergi & Finans"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-indigo-100 text-indigo-800"
                          }`}
                        >
                          {sheet.badge}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                        {amountDisplay}
                      </td>

                      <td className="py-3 px-4 text-right font-semibold text-slate-600 text-2xs">
                        {unitDesc}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSheet(sheet.id)}
                          className={`px-3 py-1.5 rounded-xl text-2xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 mx-auto ${
                            isOpened
                              ? "bg-amber-600 text-white shadow-xs"
                              : "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200"
                          }`}
                        >
                          <span>{isOpened ? "Sayfayı Kapat" : "Sayfayı Aç"}</span>
                          {isOpened ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* SAYFA DETAYI INLINE AÇILMA PANELLERİ */}
                    {isOpened && (
                      <tr>
                        <td colSpan={6} className="p-0 border-b border-slate-200 bg-slate-50/30">
                          <div className="p-4 bg-slate-50/70 border-y border-amber-200/60 animate-in fade-in duration-200 space-y-4">
                            
                            {/* 1. SIRA: MİMARİ METRAJ & İMAR PARAMETRELERİ (EKSİKSİZ VE DETAYLI TÜM BÖLÜMLER) */}
                            {(sheet.id === "01" || sheet.dataKey === "01") && (
                              <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                                
                                {/* 1.1 Üst Başlık & Açıklama */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 text-2xs font-black">
                                      BÖLÜM 01
                                    </span>
                                    <div>
                                      <h4 className="text-sm font-extrabold text-slate-900">
                                        Mimari Metraj, İmar Parametreleri & Bağımsız Bölüm Cetveli
                                      </h4>
                                      <span className="text-3xs text-slate-500 block">
                                        10.000 m² Arsa, 4 Blok, 64 Daire, 16 Dükkan ve 5.330 m² Ortak Alan Dağılımı
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-800 text-2xs font-black border border-slate-200">
                                      Toplam Kapalı Alan: 25.080 m²
                                    </span>
                                    <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-2xs font-black border border-emerald-200">
                                      Yeşil Alan & Peyzaj: 7.000 m²
                                    </span>
                                  </div>
                                </div>

                                {/* 1.2 Dokuzlu İmar Parametreleri Kartları (TÜMÜ: IM-01'den IM-09'a) */}
                                <div>
                                  <span className="text-2xs font-black uppercase tracking-wider text-slate-500 mb-2 block flex items-center gap-1.5">
                                    <Scale className="w-3.5 h-3.5 text-amber-600" />
                                    1. İmar Durumu ve Parsel Yerleşim Parametreleri (9 Parametre)
                                  </span>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                                    {architecturalMetrajData.zoningParameters.map((p) => (
                                      <div key={p.code} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 hover:border-amber-300 transition-colors">
                                        <div className="flex items-center justify-between text-3xs font-mono font-bold text-slate-400">
                                          <span>{p.code}</span>
                                          <span className="text-amber-700">{p.unit}</span>
                                        </div>
                                        <div className="mt-1 text-sm font-black text-slate-900">
                                          {p.value}
                                        </div>
                                        <span className="text-2xs font-bold text-slate-700 block mt-0.5">
                                          {p.name}
                                        </span>
                                        <span className="text-3xs text-slate-500 block mt-0.5 leading-tight">
                                          {p.desc}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* 1.3 Alan İcmali (Area Summary) Tablosu */}
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                  <div className="px-4 py-2.5 bg-slate-100/80 font-bold text-xs text-slate-800 flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                      <PieChart className="w-4 h-4 text-indigo-600" />
                                      2. Fonksiyonel Alan İcmali ve Emsal Dağılım Tablosu
                                    </span>
                                    <span className="text-2xs text-slate-600 font-bold font-mono">
                                      Toplam Proje: 25.080 m² Brüt İnşaat Alanı (%100.0)
                                    </span>
                                  </div>
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-slate-50 text-2xs text-slate-500 font-bold border-b border-slate-200 uppercase">
                                      <tr>
                                        <th className="py-2 px-3 w-12 text-center">No</th>
                                        <th className="py-2 px-3">Fonksiyonel Kategori</th>
                                        <th className="py-2 px-3 text-center">Birim Adedi</th>
                                        <th className="py-2 px-3 text-right">Toplam Brüt Alan</th>
                                        <th className="py-2 px-3 text-center">Alansal Pay (%)</th>
                                        <th className="py-2 px-3">İmar / Emsal Durumu</th>
                                        <th className="py-2 px-3">Açıklama & Kapsam</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-2xs">
                                      {architecturalMetrajData.areaSummary.map((item) => (
                                        <tr key={item.no} className="hover:bg-slate-50">
                                          <td className="py-2 px-3 text-center font-mono font-bold text-slate-500">
                                            {item.no}
                                          </td>
                                          <td className="py-2 px-3 font-extrabold text-slate-900">
                                            {item.category}
                                          </td>
                                          <td className="py-2 px-3 text-center font-bold text-slate-700">
                                            {item.units}
                                          </td>
                                          <td className="py-2 px-3 text-right font-black text-slate-900">
                                            {item.totalGrossM2.toLocaleString("tr-TR")} m²
                                          </td>
                                          <td className="py-2 px-3 text-center">
                                            <span className="px-2 py-0.5 rounded-full text-3xs font-extrabold bg-blue-50 text-blue-800 border border-blue-200">
                                              %{item.sharePct}
                                            </span>
                                          </td>
                                          <td className="py-2 px-3 font-medium text-slate-700">
                                            <span
                                              className={`px-2 py-0.5 rounded text-3xs font-bold ${
                                                item.emsal.includes("Harici")
                                                  ? "bg-emerald-100 text-emerald-800"
                                                  : "bg-slate-100 text-slate-700"
                                              }`}
                                            >
                                              {item.emsal}
                                            </span>
                                          </td>
                                          <td className="py-2 px-3 text-slate-500">
                                            {item.note}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot className="bg-slate-50 font-bold text-2xs text-slate-900 border-t border-slate-200">
                                      <tr>
                                        <td colSpan={3} className="py-2 px-3 font-extrabold">Genel Toplam (Emsale Esas + Ortak Alanlar)</td>
                                        <td className="py-2 px-3 text-right font-black text-indigo-700 font-mono">25.080 m²</td>
                                        <td className="py-2 px-3 text-center font-black text-blue-700">%100.0</td>
                                        <td colSpan={2} className="py-2 px-3 text-slate-500 font-medium">10 Dönüm Arsa üzerinde 4 Blok Eksiksiz Ruhsat Alanı</td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>

                                {/* 1.4 Konut Daireleri Metrajı ve Ticari Dükkanlar Metrajı (Yan Yana Tam Tablolar) */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                  {/* 64 Lüks Konut Dairesi Cetveli */}
                                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                                    <div className="px-4 py-2.5 bg-slate-900 text-white font-bold text-xs flex items-center justify-between">
                                      <span className="flex items-center gap-1.5">
                                        <Building2 className="w-3.5 h-3.5 text-amber-400" />
                                        3. 64 Lüks Konut Dairesi Metraj Cetveli
                                      </span>
                                      <span className="text-2xs text-amber-300 font-extrabold font-mono">
                                        Toplam: 16.320 m² Brüt
                                      </span>
                                    </div>
                                    <table className="w-full text-left text-xs border-collapse">
                                      <thead className="bg-slate-50 text-2xs text-slate-600 font-bold border-b border-slate-200">
                                        <tr>
                                          <th className="py-2 px-3">Daire Tipi</th>
                                          <th className="py-2 px-2 text-center">Adet</th>
                                          <th className="py-2 px-2 text-right">Net m²</th>
                                          <th className="py-2 px-2 text-right">Balkon</th>
                                          <th className="py-2 px-2 text-right">Duvar/Şaft</th>
                                          <th className="py-2 px-2 text-right">Ortak Payı</th>
                                          <th className="py-2 px-2 text-right">Birim Brüt</th>
                                          <th className="py-2 px-3 text-right">Toplam Brüt</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 text-2xs">
                                        {architecturalMetrajData.apartments.map((a, i) => (
                                          <tr key={i} className="hover:bg-slate-50">
                                            <td className="py-2 px-3 font-bold text-slate-900">
                                              <div>{a.type}</div>
                                              <span className="text-3xs font-extrabold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                                Çarpan: {a.grossMultiplier}x
                                              </span>
                                            </td>
                                            <td className="py-2 px-2 text-center font-black text-amber-700">
                                              {a.count}
                                            </td>
                                            <td className="py-2 px-2 text-right font-medium text-slate-700">
                                              {a.netM2} m²
                                            </td>
                                            <td className="py-2 px-2 text-right text-slate-500">
                                              {a.balconyM2} m²
                                            </td>
                                            <td className="py-2 px-2 text-right text-slate-500">
                                              {a.wallM2} m²
                                            </td>
                                            <td className="py-2 px-2 text-right text-emerald-700 font-semibold">
                                              {a.commonShareM2} m²
                                            </td>
                                            <td className="py-2 px-2 text-right font-semibold text-slate-800">
                                              {a.unitGrossM2} m²
                                            </td>
                                            <td className="py-2 px-3 text-right font-black text-slate-900">
                                              {a.totalGrossM2.toLocaleString("tr-TR")} m²
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                      <tfoot className="bg-slate-50 font-bold text-2xs text-slate-900 border-t border-slate-200">
                                        <tr>
                                          <td className="py-2 px-3">Konut Toplamı</td>
                                          <td className="py-2 px-2 text-center font-black">64 Adet</td>
                                          <td className="py-2 px-2 text-right">9.600 m²</td>
                                          <td className="py-2 px-2 text-right">1.280 m²</td>
                                          <td className="py-2 px-2 text-right">2.240 m²</td>
                                          <td className="py-2 px-2 text-right text-emerald-700">3.200 m²</td>
                                          <td className="py-2 px-2 text-right">-</td>
                                          <td className="py-2 px-3 text-right font-black text-indigo-700 font-mono">16.320 m²</td>
                                        </tr>
                                      </tfoot>
                                    </table>
                                  </div>

                                  {/* 16 Cadde Cepheli Ticari Dükkan Cetveli */}
                                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                                    <div className="px-4 py-2.5 bg-slate-900 text-white font-bold text-xs flex items-center justify-between">
                                      <span className="flex items-center gap-1.5">
                                        <Building2 className="w-3.5 h-3.5 text-amber-400" />
                                        4. 16 Cadde Cepheli Ticari Dükkan Cetveli
                                      </span>
                                      <span className="text-2xs text-amber-300 font-extrabold font-mono">
                                        Toplam: 3.430 m² Brüt
                                      </span>
                                    </div>
                                    <table className="w-full text-left text-xs border-collapse">
                                      <thead className="bg-slate-50 text-2xs text-slate-600 font-bold border-b border-slate-200">
                                        <tr>
                                          <th className="py-2 px-3">Dükkan Tipi</th>
                                          <th className="py-2 px-2 text-center">Adet</th>
                                          <th className="py-2 px-2 text-right">Zemin Net</th>
                                          <th className="py-2 px-2 text-right">Asma Kat</th>
                                          <th className="py-2 px-2 text-right">Depo m²</th>
                                          <th className="py-2 px-2 text-right">Birim Brüt</th>
                                          <th className="py-2 px-3 text-right">Toplam Brüt</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 text-2xs">
                                        {architecturalMetrajData.commercials.map((c, i) => (
                                          <tr key={i} className="hover:bg-slate-50">
                                            <td className="py-2 px-3 font-bold text-slate-900">
                                              <div>{c.type}</div>
                                              <span className="text-3xs font-extrabold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                                Çarpan: {c.grossMultiplier}x
                                              </span>
                                            </td>
                                            <td className="py-2 px-2 text-center font-black text-amber-700">
                                              {c.count}
                                            </td>
                                            <td className="py-2 px-2 text-right font-medium text-slate-700">
                                              {c.groundNetM2} m²
                                            </td>
                                            <td className="py-2 px-2 text-right text-slate-500">
                                              {c.mezzanineM2 > 0 ? `${c.mezzanineM2} m²` : "-"}
                                            </td>
                                            <td className="py-2 px-2 text-right text-slate-500">
                                              {c.basementStorageM2 > 0 ? `${c.basementStorageM2} m²` : "-"}
                                            </td>
                                            <td className="py-2 px-2 text-right font-semibold text-slate-800">
                                              {c.unitGrossM2} m²
                                            </td>
                                            <td className="py-2 px-3 text-right font-black text-slate-900">
                                              {c.totalGrossM2.toLocaleString("tr-TR")} m²
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                      <tfoot className="bg-slate-50 font-bold text-2xs text-slate-900 border-t border-slate-200">
                                        <tr>
                                          <td className="py-2 px-3">Ticari Toplamı</td>
                                          <td className="py-2 px-2 text-center font-black">16 Adet</td>
                                          <td className="py-2 px-2 text-right">1.890 m²</td>
                                          <td className="py-2 px-2 text-right">690 m²</td>
                                          <td className="py-2 px-2 text-right">320 m²</td>
                                          <td className="py-2 px-2 text-right">-</td>
                                          <td className="py-2 px-3 text-right font-black text-indigo-700 font-mono">3.430 m²</td>
                                        </tr>
                                      </tfoot>
                                    </table>
                                  </div>
                                </div>

                                {/* 1.5 Bina, Otopark & Tesisat Ortak Alanları Tablosu (5.330 m² Tam Dağılım) */}
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                  <div className="px-4 py-2.5 bg-slate-100/80 font-bold text-xs text-slate-800 flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                      5. Bina, Kapalı Otopark, Tesisat & Sığınak Ortak Alanları (5.330 m²)
                                    </span>
                                    <span className="text-2xs text-emerald-800 font-bold font-mono">
                                      110 Araçlık Otopark + Sığınaklar + Tesisat Odaları (25.080 m² Tamamlayıcı)
                                    </span>
                                  </div>
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-slate-50 text-2xs text-slate-500 font-bold border-b border-slate-200 uppercase">
                                      <tr>
                                        <th className="py-2 px-3">Fonksiyon / Mahal Adı</th>
                                        <th className="py-2 px-3">Lokasyon / Kat</th>
                                        <th className="py-2 px-3 text-center">Birim Adedi</th>
                                        <th className="py-2 px-3 text-right">Birim m²</th>
                                        <th className="py-2 px-3 text-right">Toplam Brüt m²</th>
                                        <th className="py-2 px-3 text-center">Emsal Durumu</th>
                                        <th className="py-2 px-3">Teknik Açıklama</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-2xs">
                                      {architecturalMetrajData.commonAreas.map((ca, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                          <td className="py-2 px-3 font-bold text-slate-900">
                                            {ca.function}
                                          </td>
                                          <td className="py-2 px-3 font-medium text-slate-600">
                                            {ca.location}
                                          </td>
                                          <td className="py-2 px-3 text-center font-bold text-slate-700">
                                            {ca.count}
                                          </td>
                                          <td className="py-2 px-3 text-right text-slate-600">
                                            {ca.unitM2.toLocaleString("tr-TR")} m²
                                          </td>
                                          <td className="py-2 px-3 text-right font-black text-slate-900">
                                            {ca.totalGrossM2.toLocaleString("tr-TR")} m²
                                          </td>
                                          <td className="py-2 px-3 text-center">
                                            <span
                                              className={`px-2 py-0.5 rounded text-3xs font-extrabold ${
                                                ca.status === "Emsal Dışı"
                                                  ? "bg-emerald-100 text-emerald-800"
                                                  : ca.status === "Kısmen Emsal"
                                                  ? "bg-amber-100 text-amber-800"
                                                  : "bg-slate-100 text-slate-700"
                                              }`}
                                            >
                                              {ca.status}
                                            </span>
                                          </td>
                                          <td className="py-2 px-3 text-slate-500">
                                            {ca.desc}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot className="bg-slate-50 font-bold text-2xs text-slate-900 border-t border-slate-200">
                                      <tr>
                                        <td colSpan={4} className="py-2 px-3 font-extrabold">Ortak Alanlar Toplamı</td>
                                        <td className="py-2 px-3 text-right font-black text-indigo-700 font-mono">5.330 m²</td>
                                        <td colSpan={2} className="py-2 px-3 text-slate-500 font-medium">Büyük kısmı emsal harici yasal hacimler</td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* 2 - 12. SIRA: İMALAT VE GİDER PAKETLERİ POZLARI (dataKey="02" - "12") */}
                            {sheet.costGroupNo && detailedCostGroupsData[sheet.costGroupNo] && (
                              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                                <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-2xs font-black">
                                      {sheet.code}. BÖLÜM POZ DÖKÜMÜ
                                    </span>
                                    <span className="font-bold text-xs">
                                      {detailedCostGroupsData[sheet.costGroupNo].title}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {sheet.costGroupNo === "12" && (
                                      <span className="text-3xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-extrabold border border-amber-400/30">
                                        Yasal SGK Prim Yükü
                                      </span>
                                    )}
                                    <span className="text-2xs font-extrabold text-amber-300 font-mono">
                                      Toplam:{" "}
                                      {formatCurrency(
                                        matchingCostGroup
                                          ? matchingCostGroup.totalAmount
                                          : detailedCostGroupsData[sheet.costGroupNo].items.reduce(
                                              (s, it) => s + (it.totalAmount || 0),
                                              0
                                            )
                                      )}
                                    </span>
                                  </div>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                  <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 text-slate-600 font-bold text-2xs sticky top-0 border-b border-slate-200">
                                      <tr>
                                        <th className="py-2.5 px-3 w-16">Poz No</th>
                                        <th className="py-2.5 px-3">İş Kalemi Açıklaması</th>
                                        <th className="py-2.5 px-3">Teknik Şartname & Marka Standardı</th>
                                        <th className="py-2.5 px-3 text-center w-14">Birim</th>
                                        <th className="py-2.5 px-3 text-right w-20">Miktar</th>
                                        <th className="py-2.5 px-3 text-right w-24">Birim Fiyat</th>
                                        <th className="py-2.5 px-3 text-right w-28">Toplam Tutar</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {detailedCostGroupsData[sheet.costGroupNo].items.map((item, itIdx) => {
                                        const isParam = item.isParameter;
                                        return (
                                          <tr
                                            key={itIdx}
                                            className={`hover:bg-slate-50 ${
                                              isParam ? "bg-slate-50/50 text-slate-600" : ""
                                            }`}
                                          >
                                            <td className="py-2 px-3 font-mono font-bold text-amber-800">
                                              {item.pozNo}
                                            </td>
                                            <td className="py-2 px-3">
                                              <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-slate-900 block">
                                                  {item.name}
                                                </span>
                                                {isParam && (
                                                  <span className="text-3xs px-1.5 py-0.2 rounded font-extrabold bg-slate-200 text-slate-700">
                                                    Yasal Parametre
                                                  </span>
                                                )}
                                              </div>
                                              {item.subGroup && (
                                                <span className="text-3xs text-slate-400 font-medium">
                                                  {item.subGroup}
                                                </span>
                                              )}
                                            </td>
                                            <td className="py-2 px-3 text-slate-600 text-2xs">
                                              {item.spec}
                                            </td>
                                            <td className="py-2 px-3 text-center text-slate-500 font-bold text-2xs">
                                              {item.unit}
                                            </td>
                                            <td className="py-2 px-3 text-right font-medium text-slate-700 font-mono">
                                              {item.quantity > 0 ? item.quantity.toLocaleString("tr-TR") : "-"}
                                            </td>
                                            <td className="py-2 px-3 text-right font-medium text-slate-700 font-mono">
                                              {item.unit === "Oran"
                                                ? `%${(item.unitPrice * 100).toFixed(2)}`
                                                : item.unitPrice > 0
                                                ? `${item.unitPrice.toLocaleString("tr-TR")} TL`
                                                : "-"}
                                            </td>
                                            <td className="py-2 px-3 text-right font-extrabold text-slate-900 font-mono">
                                              {item.totalAmount > 0 ? (
                                                <span className="text-slate-900">
                                                  {formatCurrency(item.totalAmount)}
                                                </span>
                                              ) : (
                                                <span className="text-slate-400 text-2xs font-normal">
                                                  - (Matrah)
                                                </span>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                    <tfoot className="bg-slate-50 font-bold text-2xs border-t border-slate-200">
                                      <tr>
                                        <td colSpan={6} className="py-2.5 px-3 text-slate-700">
                                          {sheet.costGroupNo === "12"
                                            ? "Müteahhidin Katlanacağı Net SGK Asgari İşçilik ve İlişiksizlik Prim Yükü"
                                            : `${sheet.name} Grup İcmal Toplamı`}
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-black text-slate-900 font-mono">
                                          {formatCurrency(
                                            matchingCostGroup
                                              ? matchingCostGroup.totalAmount
                                              : detailedCostGroupsData[sheet.costGroupNo].items.reduce(
                                                  (s, it) => s + (it.totalAmount || 0),
                                                  0
                                                )
                                          )}
                                        </td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* 13. SIRA: ARSA DEĞERLEME & KAT KARŞILIĞI (dataKey="13") */}
                            {sheet.dataKey === "13" && (
                              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-2xs font-black">
                                      13. BÖLÜM
                                    </span>
                                    <h4 className="text-xs font-black text-slate-900 uppercase">
                                      Bölge Emsal Değerleme & Kat Karşılığı Kıyası
                                    </h4>
                                  </div>
                                  <span className="text-2xs text-blue-700 font-bold font-mono">
                                    Bölge Rayici: 28.490 TL/m² • Toplam: 284.900.000 TL
                                  </span>
                                </div>
                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                  <table className="w-full text-left text-2xs">
                                    <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                                      <tr>
                                        <th className="p-2">Emsal No</th>
                                        <th className="p-2">Konum & Nitelik</th>
                                        <th className="p-2 text-right">Alan</th>
                                        <th className="p-2 text-center">Emsal</th>
                                        <th className="p-2 text-right">İlan Bedeli</th>
                                        <th className="p-2 text-right">m² Birim Fiyatı</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {landValuationData.comparables.map((c, i) => (
                                        <tr key={i}>
                                          <td className="p-2 font-bold">{c.no}</td>
                                          <td className="p-2 text-slate-700">{c.location}</td>
                                          <td className="p-2 text-right">{c.areaM2.toLocaleString("tr-TR")} m²</td>
                                          <td className="p-2 text-center font-bold">{c.emsal}</td>
                                          <td className="p-2 text-right">{formatCurrency(c.price)}</td>
                                          <td className="p-2 text-right font-black text-blue-700">{c.unitPrice.toLocaleString("tr-TR")} TL/m²</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-2xs text-emerald-950">
                                    <span className="font-black block mb-1">Kat Karşılığı Tercih Nedeni (%50-%50):</span>
                                    Başlangıçta 296 Milyon TL peşin arsa maliyetine katlanılmadan proje finanse edilir. Müteahhit net kârı: {formatCurrency(dynamicTotals.netProfit)} (%{dynamicTotals.profitMarginPct} Kârlılık).
                                  </div>
                                  <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 text-2xs text-slate-800">
                                    <span className="font-black block mb-1">Peşin Arsa Satın Alma Senaryosu:</span>
                                    296.361.000 TL nakit arsa ve tapu çıkışı gerektirir. 100 bağımsız bölümün 720 Milyon TL satış hasılatı müteahhitte kalır.
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* 14. SIRA: KDV REJİMİ & FATURA SİMÜLASYONU (dataKey="14") */}
                            {sheet.dataKey === "14" && (
                              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-2xs font-black">
                                      14. BÖLÜM
                                    </span>
                                    <h4 className="text-xs font-black text-slate-900 uppercase">
                                      KDV Rejimi Simülasyonu & 45 Bağımsız Bölüm Cetveli
                                    </h4>
                                  </div>
                                  <span className="text-2xs text-indigo-700 font-bold font-mono">
                                    Hasılat KDV: {formatCurrency(vatSimulationData.totalVatSummary.totalVat)}
                                  </span>
                                </div>
                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                  <table className="w-full text-left text-2xs">
                                    <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                                      <tr>
                                        <th className="p-2">Bağımsız Bölüm Tipi</th>
                                        <th className="p-2 text-center">Adet</th>
                                        <th className="p-2 text-right">Net m²</th>
                                        <th className="p-2 text-right">KDV Hariç Matrah</th>
                                        <th className="p-2 text-right">%10 Matrah</th>
                                        <th className="p-2 text-right">%20 Matrah</th>
                                        <th className="p-2 text-right">Toplam KDV</th>
                                        <th className="p-2 text-right">KDV Dahil Satış</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {vatSimulationData.allUnitsVatAnalysis.map((u, i) => (
                                        <tr key={i}>
                                          <td className="p-2 font-bold">{u.type}</td>
                                          <td className="p-2 text-center">{u.count}</td>
                                          <td className="p-2 text-right">{u.netM2} m²</td>
                                          <td className="p-2 text-right">{formatCurrency(u.totalBaseExVat)}</td>
                                          <td className="p-2 text-right text-emerald-700 font-semibold">{formatCurrency(u.base10Pct)}</td>
                                          <td className="p-2 text-right text-blue-700 font-semibold">{formatCurrency(u.base20Pct)}</td>
                                          <td className="p-2 text-right font-bold text-amber-700">{formatCurrency(u.totalVat)}</td>
                                          <td className="p-2 text-right font-black text-slate-900">{formatCurrency(u.grossRevenueWithVat)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot className="bg-slate-50 font-bold text-2xs text-slate-900 border-t border-slate-200">
                                      <tr>
                                        <td colSpan={3} className="p-2 font-extrabold">Genel Satış Hasılatı KDV Toplamı</td>
                                        <td className="p-2 text-right font-mono font-black">{formatCurrency(vatSimulationData.totalVatSummary.totalBaseExVat)}</td>
                                        <td className="p-2 text-right text-emerald-700 font-mono">{formatCurrency(vatSimulationData.totalVatSummary.base10Pct)}</td>
                                        <td className="p-2 text-right text-blue-700 font-mono">{formatCurrency(vatSimulationData.totalVatSummary.base20Pct)}</td>
                                        <td className="p-2 text-right text-amber-800 font-mono font-black">{formatCurrency(vatSimulationData.totalVatSummary.totalVat)}</td>
                                        <td className="p-2 text-right text-indigo-900 font-mono font-black">{formatCurrency(vatSimulationData.totalVatSummary.grossRevenueWithVat)}</td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* 15. SIRA: 20 AYLIK NAKİT AKIŞI (dataKey="15") */}
                            {sheet.dataKey === "15" && (
                              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-2xs font-black">
                                      15. BÖLÜM
                                    </span>
                                    <h4 className="text-xs font-black text-slate-900 uppercase">
                                      20 Aylık Şantiye Hakediş & Nakit Akışı Matrisi
                                    </h4>
                                  </div>
                                  <span className="text-2xs text-slate-500 font-mono">
                                    Toplam Direkt Bütçe: {formatCurrency(dynamicTotals.directCost)}
                                  </span>
                                </div>
                                <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-80">
                                  <table className="w-full text-left text-3xs font-mono">
                                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                                      <tr>
                                        <th className="p-1.5 sticky left-0 bg-slate-100 z-10 w-36 font-sans">İmalat Grubu</th>
                                        <th className="p-1.5 text-right w-24">Bütçe</th>
                                        {Array.from({ length: 20 }, (_, i) => (
                                          <th key={i} className="p-1.5 text-right w-12">{i + 1}.Ay</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {cashFlowData.map((row) => (
                                        <tr key={row.groupNo} className="hover:bg-slate-50">
                                          <td className="p-1.5 sticky left-0 bg-white font-sans font-bold text-slate-900 border-r border-slate-100 z-10">
                                            {row.groupNo}. {row.title}
                                          </td>
                                          <td className="p-1.5 text-right font-bold text-slate-900 bg-slate-50">
                                            {formatCurrency(row.totalBudget)}
                                          </td>
                                          {row.monthly.map((val, mIdx) => (
                                            <td key={mIdx} className={`p-1.5 text-right ${val > 0 ? "font-bold text-slate-800" : "text-slate-300"}`}>
                                              {val > 0 ? (val / 1000).toFixed(0) + "k" : "-"}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot className="bg-slate-100 font-bold text-3xs border-t border-slate-200 sticky bottom-0">
                                      <tr>
                                        <td className="p-1.5 sticky left-0 bg-slate-100 font-sans font-extrabold text-slate-900 border-r border-slate-200 z-10">
                                          Aylık Toplam Çıkış
                                        </td>
                                        <td className="p-1.5 text-right font-black text-indigo-900">
                                          {formatCurrency(dynamicTotals.directCost)}
                                        </td>
                                        {Array.from({ length: 20 }, (_, mIdx) => {
                                          const monthSum = cashFlowData.reduce((s, r) => s + (r.monthly[mIdx] || 0), 0);
                                          return (
                                            <td key={mIdx} className="p-1.5 text-right font-extrabold text-slate-900">
                                              {(monthSum / 1000).toFixed(0)}k
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* 16. SIRA: HASSASİYET VE RİSK ANALİZİ (dataKey="16") */}
                            {sheet.dataKey === "16" && (
                              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-2xs font-black">
                                      16. BÖLÜM
                                    </span>
                                    <h4 className="text-xs font-black text-slate-900 uppercase">
                                      Girdi Şokları & Makroekonomik Senaryolar
                                    </h4>
                                  </div>
                                  <span className="text-2xs text-rose-700 font-bold">
                                    5 Kritik Emtia & 5 Piyasa Senaryosu
                                  </span>
                                </div>
                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                  <table className="w-full text-left text-2xs">
                                    <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                                      <tr>
                                        <th className="p-2">Girdi / Emtia</th>
                                        <th className="p-2 text-center">Bütçe Payı</th>
                                        <th className="p-2 text-right">-%10 Düşüş</th>
                                        <th className="p-2 text-right font-bold text-slate-900">Hedeflenen Baz</th>
                                        <th className="p-2 text-right text-amber-700">+%10 Artış</th>
                                        <th className="p-2 text-right text-rose-700">+%40 Kriz</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {sensitivityData.materials.map((m, mIdx) => (
                                        <tr key={mIdx}>
                                          <td className="p-2 font-bold">{m.name}</td>
                                          <td className="p-2 text-center">%{m.sharePct}</td>
                                          <td className="p-2 text-right text-emerald-700 font-mono">{formatCurrency(m.discount10)}</td>
                                          <td className="p-2 text-right font-bold text-slate-900 font-mono">{formatCurrency(m.base)}</td>
                                          <td className="p-2 text-right text-amber-800 font-medium font-mono">{formatCurrency(m.plus10)}</td>
                                          <td className="p-2 text-right text-rose-800 font-extrabold font-mono">{formatCurrency(m.crisis40)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>

            {/* 5. OTORİTER TABLO DİP TOPLAMI (HESAPLAMALARI VE ÇARPANLARI TAM UYUMLU) */}
            <tfoot className="bg-slate-900 text-white font-bold text-xs divide-y divide-slate-800">
              <tr>
                <td colSpan={3} className="py-3 px-4 font-extrabold text-amber-400">
                  Toplam 11 Direkt İmalat & Yasal Harç Paketi (02 - 12):
                </td>
                <td className="py-3 px-4 text-right font-black font-mono text-amber-300 text-sm">
                  {formatCurrency(dynamicTotals.directCost)}
                </td>
                <td className="py-3 px-4 text-right text-amber-200/90 text-2xs font-mono">
                  {dynamicTotals.directCostPerM2.toLocaleString("tr-TR")} TL/m² (%100.0)
                </td>
                <td className="py-3 px-4 text-center text-3xs text-slate-400">
                  Direkt İmalat
                </td>
              </tr>
              <tr className="bg-slate-950 text-slate-300 text-2xs">
                <td colSpan={3} className="py-2.5 px-4 font-semibold text-slate-300">
                  + Uygulanan Maliyet Çarpanları (+%{multipliers.contractorProfitPct} Kâr + %{multipliers.unforeseenRiskPct} Risk + %{multipliers.financingInflationPct} Finansman = %{dynamicTotals.totalAdditionsPct} Ek):
                </td>
                <td className="py-2.5 px-4 text-right font-bold font-mono text-emerald-400">
                  +{formatCurrency(dynamicTotals.totalAdditionsAmount)}
                </td>
                <td className="py-2.5 px-4 text-right text-slate-400 font-mono">
                  +{(dynamicTotals.generalBudgetPerM2 - dynamicTotals.directCostPerM2).toLocaleString("tr-TR")} TL/m²
                </td>
                <td className="py-2.5 px-4 text-center text-3xs text-emerald-400">
                  Çarpan Katsayısı: x{dynamicTotals.multiplierFactor}
                </td>
              </tr>
              <tr className="bg-slate-900 text-slate-100">
                <td colSpan={3} className="py-3 px-4 font-extrabold text-white">
                  = GENEL PROJE BÜTÇESİ (KDV HARİÇ):
                </td>
                <td className="py-3 px-4 text-right font-black font-mono text-emerald-300 text-sm">
                  {formatCurrency(dynamicTotals.generalBudgetExclVat)}
                </td>
                <td className="py-3 px-4 text-right text-emerald-200 text-2xs font-mono">
                  {dynamicTotals.generalBudgetPerM2.toLocaleString("tr-TR")} TL/m²
                </td>
                <td className="py-3 px-4 text-center text-3xs text-emerald-400 font-bold">
                  Bütçe Tavanı
                </td>
              </tr>
              <tr className="bg-slate-950 text-slate-300 text-2xs">
                <td colSpan={3} className="py-2.5 px-4 font-semibold text-slate-400">
                  + Girdi / Alış KDV Çarpanı (%{multipliers.vatRatePct}):
                </td>
                <td className="py-2.5 px-4 text-right font-bold font-mono text-indigo-400">
                  +{formatCurrency(dynamicTotals.vatAmount)}
                </td>
                <td className="py-2.5 px-4 text-right text-slate-400 font-mono">
                  +{(dynamicTotals.totalInvestmentPerM2 - dynamicTotals.generalBudgetPerM2).toLocaleString("tr-TR")} TL/m²
                </td>
                <td className="py-2.5 px-4 text-center text-3xs text-indigo-400">
                  KDV Yükü
                </td>
              </tr>
              <tr className="bg-slate-900 text-white border-t-2 border-amber-500">
                <td colSpan={3} className="py-3.5 px-4 font-black text-amber-400 text-sm">
                  = TOPLAM PROJE YATIRIMI (KDV DAHİL):
                </td>
                <td className="py-3.5 px-4 text-right font-black font-mono text-amber-400 text-base">
                  {formatCurrency(dynamicTotals.totalInvestmentWithVat)}
                </td>
                <td className="py-3.5 px-4 text-right text-amber-200 text-2xs font-mono font-black">
                  {dynamicTotals.totalInvestmentPerM2.toLocaleString("tr-TR")} TL/m²
                </td>
                <td className="py-3.5 px-4 text-center text-3xs font-extrabold text-amber-300">
                  Net Kâr: {formatCurrency(dynamicTotals.netProfit)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
