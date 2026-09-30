import React, { useState } from "react";
import {
  Boxes,
  Plus,
  Calculator,
  UserCheck,
  Wrench,
  BarChart3,
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  FixedAsset,
  AssetMaintenanceRecord,
  AssetDisposalRecord,
  Employee,
  CompanySettings,
} from "../../types";
import { formatTRY } from "../../data/fixedAssetsData";
import { useTheme } from "../../context/ThemeContext";
import { ModuleEntranceHeader } from "../common/ModuleEntranceHeader";
import { FixedAssetList } from "./FixedAssetList";
import { FixedAssetFormModal } from "./FixedAssetFormModal";
import { FixedAssetDetailModal } from "./FixedAssetDetailModal";
import { AssetLabelPrintModal } from "./AssetLabelPrintModal";
import { AssetCustodyTab } from "./AssetCustodyTab";
import { AssetMaintenanceTab } from "./AssetMaintenanceTab";
import { AssetDisposalModal } from "./AssetDisposalModal";
import { FixedAssetsAnalytics } from "./FixedAssetsAnalytics";
import { DepreciationScheduleTable } from "./DepreciationScheduleTable";

export type FixedAssetsSubTab =
  | "list"
  | "schedule"
  | "custody"
  | "maintenance"
  | "analytics";

interface FixedAssetsModuleProps {
  assets: FixedAsset[];
  maintenances: AssetMaintenanceRecord[];
  disposals: AssetDisposalRecord[];
  employees: Employee[];
  settings: CompanySettings;
  onUpdateAssets: (assets: FixedAsset[]) => void;
  onUpdateMaintenances: (maintenances: AssetMaintenanceRecord[]) => void;
  onUpdateDisposals: (disposals: AssetDisposalRecord[]) => void;
}

export const FixedAssetsModule: React.FC<FixedAssetsModuleProps> = ({
  assets,
  maintenances,
  disposals,
  employees,
  settings,
  onUpdateAssets,
  onUpdateMaintenances,
  onUpdateDisposals,
}) => {
  const { theme } = useTheme();
  const [activeSubTab, setActiveSubTab] = useState<FixedAssetsSubTab>("list");

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null);
  const [selectedDetailAsset, setSelectedDetailAsset] = useState<FixedAsset | null>(null);
  const [labelPrintAsset, setLabelPrintAsset] = useState<FixedAsset | null>(null);
  const [disposalAsset, setDisposalAsset] = useState<FixedAsset | null>(null);

  // Selected asset for standalone schedule view
  const [scheduleSelectedAssetId, setScheduleSelectedAssetId] = useState<string>(
    assets[0]?.id || ""
  );

  // Financial Summary Totals
  const totalCost = assets.reduce((sum, a) => sum + (a.purchaseCost || 0), 0);
  const totalAccumulated = assets.reduce(
    (sum, a) => sum + (a.accumulatedDepreciation || 0),
    0
  );
  const totalNetBookValue = assets.reduce((sum, a) => sum + (a.netBookValue || 0), 0);
  const inCustodyCount = assets.filter((a) => a.status === "in_custody").length;

  // Add / Edit Asset Handler
  const handleSaveAsset = (
    assetData: Omit<FixedAsset, "id" | "createdAt" | "updatedAt">
  ) => {
    const now = new Date().toISOString();
    if (editingAsset) {
      // Edit existing
      const updated = assets.map((a) =>
        a.id === editingAsset.id
          ? {
              ...a,
              ...assetData,
              updatedAt: now,
            }
          : a
      );
      onUpdateAssets(updated);
      if (selectedDetailAsset?.id === editingAsset.id) {
        setSelectedDetailAsset({ ...selectedDetailAsset, ...assetData, updatedAt: now });
      }
    } else {
      // New asset
      const newAsset: FixedAsset = {
        ...assetData,
        id: `dmr_${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      };
      onUpdateAssets([newAsset, ...assets]);
    }

    setEditingAsset(null);
  };

  // Delete Asset Handler
  const handleDeleteAsset = (assetId: string) => {
    const updated = assets.filter((a) => a.id !== assetId);
    onUpdateAssets(updated);
  };

  // Update Custody
  const handleUpdateAssetCustody = (
    assetId: string,
    custody: {
      custodyEmployeeId?: string;
      custodyEmployeeName?: string;
      custodyDate?: string;
      location?: string;
      department?: string;
      status: "in_custody" | "active" | "in_storage";
    }
  ) => {
    const updated = assets.map((a) =>
      a.id === assetId
        ? {
            ...a,
            ...custody,
            updatedAt: new Date().toISOString(),
          }
        : a
    );
    onUpdateAssets(updated);
  };

  // Add Maintenance Record
  const handleAddMaintenance = (
    record: Omit<AssetMaintenanceRecord, "id" | "createdAt">
  ) => {
    const newRecord: AssetMaintenanceRecord = {
      ...record,
      id: `mnt_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    onUpdateMaintenances([newRecord, ...maintenances]);

    // If capitalized, add to asset purchaseCost
    if (record.isCapitalized) {
      const updated = assets.map((a) =>
        a.id === record.assetId
          ? {
              ...a,
              purchaseCost: a.purchaseCost + record.cost,
              netBookValue: a.netBookValue + record.cost,
              updatedAt: new Date().toISOString(),
            }
          : a
      );
      onUpdateAssets(updated);
    }
  };

  // Disposal Handler
  const handleConfirmDisposal = (
    disposalData: Omit<AssetDisposalRecord, "id" | "createdAt">
  ) => {
    const newDisposal: AssetDisposalRecord = {
      ...disposalData,
      id: `dsp_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    onUpdateDisposals([newDisposal, ...disposals]);

    // Update asset status to scrapped or sold
    const updated = assets.map((a) =>
      a.id === disposalData.assetId
        ? {
            ...a,
            status: (disposalData.disposalType === "sale" ? "sold" : "scrapped") as any,
            netBookValue: 0,
            updatedAt: new Date().toISOString(),
          }
        : a
    );
    onUpdateAssets(updated);
  };

  // Export all assets to CSV
  const handleExportAllCsv = () => {
    const headers = [
      "Demirbaş Kodu",
      "Demirbaş Adı",
      "Kategori",
      "Marka",
      "Model",
      "Seri No / Plaka",
      "Alış Tarihi",
      "Aktif Giriş Tarihi",
      "Fatura No",
      "Tedarikçi",
      "Alış Bedeli (TL)",
      "KDV Oranı (%)",
      "Toplam Bedel (TL)",
      "Amortisman Yöntemi",
      "Faydalı Ömür (Yıl)",
      "Amortisman Oranı (%)",
      "Kıst Dönem",
      "Birikmiş Amortisman (TL)",
      "Net Defter Değeri (TL)",
      "Lokasyon / Şube",
      "Zimmetli Personel",
      "Durum",
    ];

    const rows = assets.map((a) => [
      a.code,
      `"${a.name.replace(/"/g, '""')}"`,
      `"${a.categoryLabel || a.category}"`,
      `"${a.brand || ""}"`,
      `"${a.model || ""}"`,
      a.plateNumber || a.serialNumber || "",
      a.acquisitionDate,
      a.activatedDate || a.acquisitionDate,
      a.invoiceNo || "",
      `"${a.vendorName || ""}"`,
      a.purchaseCost.toFixed(2),
      a.vatRate,
      a.totalCost.toFixed(2),
      a.depreciationMethod === "normal"
        ? "Normal"
        : a.depreciationMethod === "declining_balance"
        ? "Azalan Bakiyeler"
        : "Muaf",
      a.usefulLifeYears,
      `%${a.depreciationRate}`,
      a.isPartialYear ? "Evet (Kıst)" : "Hayır",
      a.accumulatedDepreciation.toFixed(2),
      a.netBookValue.toFixed(2),
      `"${a.location || a.branchName || ""}"`,
      `"${a.custodyEmployeeName || ""}"`,
      a.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Demirbas_Sabit_Kiymet_Envanteri_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-4 sm:space-y-6 px-3 sm:px-6 py-4 animate-fadeIn">
      {/* 1. Modern Module Entrance Header */}
      <ModuleEntranceHeader
        id="fixed-assets-header"
        badge="VUK Sabit Kıymetler & Envanter"
        badgeIcon={<Boxes className="w-2.5 h-2.5 text-[#0f6bae]" />}
        title="Demirbaşlar ve Amortisman Yönetimi"
        description="Şirket aktifindeki sabit kıymetler, VUK itfa planları, personel zimmet takibi, periyodik bakım ve barkodlama."
        stats={[
          {
            label: "Kayıtlı Demirbaş",
            value: `${assets.length} Adet`,
            tone: "info",
          },
          {
            label: "Aktif Maliyet",
            value: formatTRY(totalCost),
            tone: "default",
          },
          {
            label: "Birikmiş Amortisman",
            value: formatTRY(totalAccumulated),
            tone: "success",
          },
          {
            label: "Net Defter Değeri",
            value: formatTRY(totalNetBookValue),
            tone: "default",
          },
          {
            label: "Zimmetli Varlık",
            value: `${inCustodyCount} Adet`,
            tone: "warning",
          },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportAllCsv}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 active:scale-[0.98]"
              title="Tüm sabit kıymet envanterini Excel/CSV olarak indir"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Excel İndir</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingAsset(null);
                setIsFormModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-2xs transition-all cursor-pointer active:scale-[0.98] shrink-0"
              style={{ backgroundColor: theme.primaryColor }}
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Demirbaş Kartı Ekle</span>
            </button>
          </div>
        }
      />

      {/* 2. Sub-Tab Segmented Navigation Bar */}
      <div
        className="p-1.5 rounded-2xl border shadow-2xs flex items-center gap-1.5 overflow-x-auto scrollbar-none transition-colors"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
      >
        <button
          type="button"
          onClick={() => setActiveSubTab("list")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeSubTab === "list"
              ? "text-white shadow-2xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
          }`}
          style={activeSubTab === "list" ? { backgroundColor: theme.primaryColor } : {}}
        >
          <Boxes className="w-4 h-4" />
          <span>Demirbaş Listesi & Kartlar</span>
          <span
            className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
              activeSubTab === "list"
                ? "bg-white/20 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80"
            }`}
          >
            {assets.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("schedule")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeSubTab === "schedule"
              ? "text-white shadow-2xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
          }`}
          style={activeSubTab === "schedule" ? { backgroundColor: theme.primaryColor } : {}}
        >
          <Calculator className="w-4 h-4" />
          <span>VUK Amortisman & İtfa Planı</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("custody")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeSubTab === "custody"
              ? "text-white shadow-2xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
          }`}
          style={activeSubTab === "custody" ? { backgroundColor: theme.primaryColor } : {}}
        >
          <UserCheck className="w-4 h-4" />
          <span>Zimmet & Lokasyon Takibi</span>
          <span
            className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
              activeSubTab === "custody"
                ? "bg-white/20 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80"
            }`}
          >
            {inCustodyCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("maintenance")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeSubTab === "maintenance"
              ? "text-white shadow-2xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
          }`}
          style={activeSubTab === "maintenance" ? { backgroundColor: theme.primaryColor } : {}}
        >
          <Wrench className="w-4 h-4" />
          <span>Bakım & Onarım Kayıtları</span>
          <span
            className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
              activeSubTab === "maintenance"
                ? "bg-white/20 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80"
            }`}
          >
            {maintenances.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("analytics")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeSubTab === "analytics"
              ? "text-white shadow-2xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
          }`}
          style={activeSubTab === "analytics" ? { backgroundColor: theme.primaryColor } : {}}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Sabit Kıymet Analitiği & Rapor</span>
        </button>
      </div>

      {/* 3. Main Sub-Tab View Contents */}
      {activeSubTab === "list" && (
        <FixedAssetList
          assets={assets}
          onSelectAsset={(asset) => setSelectedDetailAsset(asset)}
          onEditAsset={(asset) => {
            setEditingAsset(asset);
            setIsFormModalOpen(true);
          }}
          onPrintLabel={(asset) => setLabelPrintAsset(asset)}
          onAddNew={() => {
            setEditingAsset(null);
            setIsFormModalOpen(true);
          }}
        />
      )}

      {activeSubTab === "schedule" && (
        <div className="space-y-4">
          {/* Asset Selector */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                İncelenecek Demirbaş:
              </span>
              <select
                value={scheduleSelectedAssetId}
                onChange={(e) => setScheduleSelectedAssetId(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs py-2 px-3 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden min-w-[280px]"
              >
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} - {a.name} ({formatTRY(a.purchaseCost)})
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              VUK 320 ve Tek Düzen Hesap Planı 257/770 amortisman kuralları geçerlidir.
            </div>
          </div>

          {(() => {
            const currentAsset =
              assets.find((a) => a.id === scheduleSelectedAssetId) || assets[0];
            if (!currentAsset) return null;
            return (
              <DepreciationScheduleTable
                asset={currentAsset}
                companyName={settings.companyName || "Şirket"}
              />
            );
          })()}
        </div>
      )}

      {activeSubTab === "custody" && (
        <AssetCustodyTab
          assets={assets}
          employees={employees}
          companyName={settings.companyName || "TALLSOFT MUAVİN ERP"}
          onUpdateAssetCustody={handleUpdateAssetCustody}
        />
      )}

      {activeSubTab === "maintenance" && (
        <AssetMaintenanceTab
          assets={assets}
          maintenances={maintenances}
          onAddMaintenance={handleAddMaintenance}
        />
      )}

      {activeSubTab === "analytics" && (
        <FixedAssetsAnalytics assets={assets} maintenances={maintenances} />
      )}

      {/* Modals */}
      {isFormModalOpen && (
        <FixedAssetFormModal
          asset={editingAsset}
          employees={employees}
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingAsset(null);
          }}
          onSave={handleSaveAsset}
        />
      )}

      {selectedDetailAsset && (
        <FixedAssetDetailModal
          asset={selectedDetailAsset}
          employees={employees}
          maintenances={maintenances}
          companyName={settings.companyName || "TALLSOFT MUAVİN ERP"}
          isOpen={Boolean(selectedDetailAsset)}
          onClose={() => setSelectedDetailAsset(null)}
          onEdit={(asset) => {
            setSelectedDetailAsset(null);
            setEditingAsset(asset);
            setIsFormModalOpen(true);
          }}
          onPrintLabel={(asset) => setLabelPrintAsset(asset)}
          onDisposal={(asset) => {
            setSelectedDetailAsset(null);
            setDisposalAsset(asset);
          }}
          onDelete={handleDeleteAsset}
        />
      )}

      {labelPrintAsset && (
        <AssetLabelPrintModal
          asset={labelPrintAsset}
          companyName={settings.companyName || "TALLSOFT MUAVİN ERP"}
          isOpen={Boolean(labelPrintAsset)}
          onClose={() => setLabelPrintAsset(null)}
        />
      )}

      {disposalAsset && (
        <AssetDisposalModal
          asset={disposalAsset}
          isOpen={Boolean(disposalAsset)}
          onClose={() => setDisposalAsset(null)}
          onConfirmDisposal={handleConfirmDisposal}
        />
      )}
    </div>
  );
};
