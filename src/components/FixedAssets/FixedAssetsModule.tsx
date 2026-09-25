import React, { useState, useEffect } from "react";
import {
  Boxes,
  Plus,
  Calculator,
  UserCheck,
  Wrench,
  BarChart3,
  FileSpreadsheet,
  Tag,
  Coins,
  ShieldCheck,
  ArrowRightLeft,
  Download,
  Printer,
  Sparkles,
  Layers,
  Building2,
  Calendar,
} from "lucide-react";
import {
  FixedAsset,
  AssetMaintenanceRecord,
  AssetDisposalRecord,
  Employee,
  CompanySettings,
} from "../../types";
import { formatTRY } from "../../data/fixedAssetsData";
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

  return (
    <div className="space-y-6 pb-12">
      {/* Top Module Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md">
              <Boxes className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Demirbaşlar ve Amortisman Yönetimi
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                  VUK & TMS Uyumlu
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Şirket aktifindeki sabit kıymetler, VUK itfa planları, personel zimmet takibi ve barkodlama
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setEditingAsset(null);
                setIsFormModalOpen(true);
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Demirbaş Kartı Ekle</span>
            </button>
          </div>
        </div>

        {/* 4 Overview Mini KPI Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 text-xs">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[11px]">Kayıtlı Demirbaş</span>
              <span className="font-extrabold text-slate-900 text-sm">{assets.length} Adet</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[11px]">Toplam Aktif Maliyet</span>
              <span className="font-extrabold text-slate-900 text-sm">{formatTRY(totalCost)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[11px]">Birikmiş Amortisman</span>
              <span className="font-extrabold text-emerald-600 text-sm">
                {formatTRY(totalAccumulated)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[11px]">Zimmetli Varlıklar</span>
              <span className="font-extrabold text-amber-700 text-sm">
                {inCustodyCount} Zimmetli
              </span>
            </div>
          </div>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="flex items-center gap-2 border-t border-slate-100 mt-5 pt-3 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveSubTab("list")}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === "list"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Demirbaş Listesi & Kartlar ({assets.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("schedule")}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === "schedule"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>VUK Amortisman & İtfa Planı</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("custody")}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === "custody"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Zimmet & Lokasyon Takibi ({inCustodyCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("maintenance")}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === "maintenance"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Bakım & Servis Kayıtları ({maintenances.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("analytics")}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === "analytics"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Finansal İcmal & Rapor</span>
          </button>
        </div>
      </div>

      {/* Main Tab View Contents */}
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
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700">İncelenecek Demirbaş:</span>
              <select
                value={scheduleSelectedAssetId}
                onChange={(e) => setScheduleSelectedAssetId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl text-xs py-2 px-3 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-[280px]"
              >
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} - {a.name} ({formatTRY(a.purchaseCost)})
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              VUK 320 ve Tek Düzen Hesap Planı 257/770 amortisman kuralları geçerlidir.
            </div>
          </div>

          {(() => {
            const currentAsset = assets.find((a) => a.id === scheduleSelectedAssetId) || assets[0];
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
