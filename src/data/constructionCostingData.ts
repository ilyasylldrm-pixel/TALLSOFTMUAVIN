import { ConstructionProject } from "../types";

export const initialConstructionProjects: ConstructionProject[] = [
  {
    id: "proj_ins_001",
    projectCode: "İNS-2026-001",
    projectName: "Kartal Panora Konutları (48 Daire + 4 Ticari)",
    location: "İstanbul / Kartal / Karlıktepe Mah.",
    projectType: "residential",
    status: "rough_phase",
    landAreaM2: 2450,
    totalConstructionAreaM2: 6800,
    sellableAreaM2: 5200,
    unitCount: 52,
    floorsCount: 12,
    startDate: "2026-02-15",
    estimatedEndDate: "2027-06-30",
    estimatedCostPerM2: 17500, // 17.500 TL/m²
    totalEstimatedCost: 119000000, // 119.000.000 TL
    realizedCost: 0,
    estimatedSaleRevenue: 234000000, // 234.000.000 TL
    notes: "2 Bodrum + Zemin + 10 Normal Kat. C35 Hazır beton ve B420C nervürlü demir kullanılmaktadır.",
    createdAt: "2026-02-10",
    costItems: [],
    progressPayments: [
      {
        id: "hpp_001",
        projectId: "proj_ins_001",
        subcontractorName: "Anadolu Kalıp İnşaat Taşeronluğu",
        workScope: "Temel & Bodrum Katlar Kalıp-Demir İşçiliği",
        paymentNo: 1,
        period: "2026-03",
        grossAmount: 1850000,
        withholdingTaxDeduction: 92500, // %5
        guaranteeDeduction: 111000, // %6 teminat
        netPayableAmount: 1646500,
        status: "paid",
        date: "2026-03-28",
        notes: "Beton numune sonuçları şartnameye uygun onaylandı.",
      },
      {
        id: "hpp_002",
        projectId: "proj_ins_001",
        subcontractorName: "Anadolu Kalıp İnşaat Taşeronluğu",
        workScope: "Zemin + 1. - 3. Normal Katlar Kalıp-Demir İşçiliği",
        paymentNo: 2,
        period: "2026-05",
        grossAmount: 2450000,
        withholdingTaxDeduction: 122500,
        guaranteeDeduction: 147000,
        netPayableAmount: 2180500,
        status: "paid",
        date: "2026-05-30",
        notes: "Hakediş saha mühendisi ve yapı denetim tarafından onaylandı.",
      },
      {
        id: "hpp_003",
        projectId: "proj_ins_001",
        subcontractorName: "Akçansa Hazır Beton A.Ş.",
        workScope: "Temel & Zemin Kat Beton Sevkiyat Hakedişi",
        paymentNo: 1,
        period: "2026-04",
        grossAmount: 3200000,
        withholdingTaxDeduction: 0,
        guaranteeDeduction: 0,
        netPayableAmount: 3200000,
        status: "paid",
        date: "2026-04-15",
      },
      {
        id: "hpp_004",
        projectId: "proj_ins_001",
        subcontractorName: "Schneider & HES Kablo Taahhüt",
        workScope: "Kaba Elektrik Borulama & Topraklama Hakedişi",
        paymentNo: 1,
        period: "2026-06",
        grossAmount: 1100000,
        withholdingTaxDeduction: 55000,
        guaranteeDeduction: 66000,
        netPayableAmount: 979000,
        status: "approved",
        date: "2026-06-25",
        notes: "Mali onay verildi, EFT sırasına alındı.",
      },
    ],
  },
  {
    id: "proj_ins_002",
    projectCode: "İNS-2026-002",
    projectName: "Ümraniye Plaza & Ticaret Merkezi",
    location: "İstanbul / Ümraniye / Finanskent Yanı",
    projectType: "commercial",
    status: "planning",
    landAreaM2: 1800,
    totalConstructionAreaM2: 4500,
    sellableAreaM2: 3600,
    unitCount: 24,
    floorsCount: 8,
    startDate: "2026-08-01",
    estimatedEndDate: "2027-10-30",
    estimatedCostPerM2: 21000, // 21.000 TL/m² (Ticari yüksek standart)
    totalEstimatedCost: 94500000, // 94.500.000 TL
    realizedCost: 0,
    estimatedSaleRevenue: 195000000,
    notes: "A Plus Ofis & Ticari plaza. Çift cephe giydirme cam ve VRF merkezi iklimlendirme.",
    createdAt: "2026-06-15",
    costItems: [],
    progressPayments: [],
  },
];

// Bakanlık Yapı Yaklaşık Birim Maliyetleri ve Standart İnşaat Oran Dağılımları (2026 Referans)
export const CONSTRUCTION_COST_BENCHMARKS = {
  roughSharePct: 40, // Kaba İnşaat ~%40
  fineSharePct: 34, // İnce İnşaat ~%34
  mechElecSharePct: 16, // Mekanik & Elektrik ~%16
  permitOverheadPct: 10, // Ruhsat, Proje & Genel Giderler ~%10
  types: [
    { type: "residential", label: "Standart Konut (3A-3B)", avgCostM2: 15500 },
    { type: "luxury_residence", label: "Lüks Rezidans (4A-4B)", avgCostM2: 21500 },
    { type: "commercial", label: "Ticari Ofis / Plaza (4C)", avgCostM2: 23000 },
    { type: "villa", label: "Müstakil Villa (4A)", avgCostM2: 24500 },
    { type: "industrial", label: "Sanayi & Çelik Depo (3A)", avgCostM2: 11500 },
  ],
};
