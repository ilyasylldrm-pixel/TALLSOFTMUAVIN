import React, { useState } from "react";
import {
  X,
  Tag,
  Building,
  Calendar,
  DollarSign,
  FileText,
  Calculator,
  UserCheck,
  Wrench,
  Trash2,
  Edit,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Coins,
  TrendingDown,
  Layers,
} from "lucide-react";
import { FixedAsset, AssetMaintenanceRecord, Employee } from "../../types";
import { formatTRY, getCategoryBadgeColor, getStatusBadgeInfo } from "../../data/fixedAssetsData";
import { useTheme } from "../../context/ThemeContext";
import { DepreciationScheduleTable } from "./DepreciationScheduleTable";

interface FixedAssetDetailModalProps {
  asset: FixedAsset;
  employees: Employee[];
  maintenances: AssetMaintenanceRecord[];
  companyName: string;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (asset: FixedAsset) => void;
  onPrintLabel: (asset: FixedAsset) => void;
  onDisposal: (asset: FixedAsset) => void;
  onDelete: (assetId: string) => void;
}

export const FixedAssetDetailModal: React.FC<FixedAssetDetailModalProps> = ({
  asset,
  employees,
  maintenances,
  companyName,
  isOpen,
  onClose,
  onEdit,
  onPrintLabel,
  onDisposal,
  onDelete,
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<"overview" | "depreciation" | "maintenance">(
    "overview"
  );

  if (!isOpen) return null;

  const colorInfo = getCategoryBadgeColor(asset.category);
  const statusInfo = getStatusBadgeInfo(asset.status);
  const assetMaintenances = maintenances.filter((m) => m.assetId === asset.id);

  const handleDeleteConfirm = () => {
    if (
      window.confirm(
        `"${asset.name}" (${asset.code}) kodlu demirbaş kartını silmek istediğinize emin misiniz?`
      )
    ) {
      onDelete(asset.id);
      onClose();
    }
  };

  const deprRatio =
    asset.purchaseCost > 0
      ? Math.min(100, Math.round((asset.accumulatedDepreciation / asset.purchaseCost) * 100))
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div
        className="rounded-2xl shadow-2xl max-w-4xl w-full border overflow-hidden my-6 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 transition-colors"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850/80 shrink-0">
          <div className="flex items-center gap-3">
            <span
              className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg border shadow-2xs"
              style={{
                backgroundColor: `${theme.primaryColor}15`,
                color: theme.primaryColor,
                borderColor: `${theme.primaryColor}30`,
              }}
            >
              {asset.code}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 leading-tight">
                  {asset.name}
                </h3>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                    asset.status === "in_custody"
                      ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                      : asset.status === "active"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                      : asset.status === "maintenance"
                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {statusInfo.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>{asset.categoryLabel || asset.category}</span>
                {asset.brand && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{asset.brand}</span>
                  </>
                )}
                {asset.model && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{asset.model}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onPrintLabel(asset)}
              className="p-2 hover:bg-slate-200/80 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="QR / Barkod Etiketi Yazdır"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onEdit(asset)}
              className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl transition-colors cursor-pointer"
              title="Düzenle"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-slate-200/80 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          className="px-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-6 text-xs font-bold shrink-0 transition-colors"
          style={{ backgroundColor: theme.cardBg }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === "overview"
                ? "text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
            style={activeTab === "overview" ? { borderColor: theme.primaryColor, color: theme.primaryColor } : {}}
          >
            Genel & Finansal Bilgiler
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("depreciation")}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "depreciation"
                ? "text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
            style={activeTab === "depreciation" ? { borderColor: theme.primaryColor, color: theme.primaryColor } : {}}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>VUK Amortisman & İtfa Planı</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("maintenance")}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "maintenance"
                ? "text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
            style={activeTab === "maintenance" ? { borderColor: theme.primaryColor, color: theme.primaryColor } : {}}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Bakım & Onarım ({assetMaintenances.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs custom-scrollbar">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Financial Status Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Aktif Giriş Maliyeti
                  </span>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                    {formatTRY(asset.purchaseCost)}
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    KDV Tutarı: {formatTRY(asset.vatAmount || 0)} (%{asset.vatRate})
                  </span>
                </div>

                <div className="bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl p-4 space-y-1">
                  <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                    Birikmiş Amortisman (İtfa)
                  </span>
                  <div className="text-lg font-bold text-indigo-700 dark:text-indigo-300 font-mono tabular-nums">
                    {formatTRY(asset.accumulatedDepreciation)}
                  </div>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400">
                    İtfa Oranı: %{deprRatio} ({asset.usefulLifeYears} Yıl Ömür)
                  </span>
                </div>

                <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 space-y-1">
                  <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                    Net Defter Değeri (Bilanço)
                  </span>
                  <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300 font-mono tabular-nums">
                    {formatTRY(asset.netBookValue)}
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    Kalan İtfa Edilebilir Değer
                  </span>
                </div>
              </div>

              {/* Technical & Identification Grid */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                  Demirbaş Künyesi ve Teknik Detaylar
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Marka & Model:</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {asset.brand || "-"} {asset.model || ""}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Seri Numarası:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {asset.serialNumber || "-"}
                      </span>
                    </div>

                    {asset.plateNumber && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Araç Plakası:</span>
                        <span className="font-bold bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded text-slate-900 dark:text-slate-100 border border-amber-200 dark:border-amber-800">
                          {asset.plateNumber}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Barkod / Demirbaş No:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{asset.barcode || "-"}</span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Alış & Aktife Giriş:</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">{asset.acquisitionDate}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Fatura Numarası:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{asset.invoiceNo || "-"}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Tedarikçi Firma:</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{asset.vendorName || "-"}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Garanti Bitiş Tarihi:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {asset.warrantyEndDate || "Belirtilmedi"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Custody and Location */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                  Zimmet ve Lokasyon Bilgileri
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 font-medium block">Zimmetli Personel:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 mt-1 block">
                      {asset.custodyEmployeeName || "Zimmet Atanmamış (Ortak / Depo)"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 font-medium block">Lokasyon / Şube:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 mt-1 block">
                      {asset.location || asset.branchName || "Genel Merkez"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 font-medium block">Departman / Şantiye:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 mt-1 block">
                      {asset.department || "Yönetim"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Accounting Setup (Tek Düzen) */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                  Tek Düzen Hesap Planı Bağlantıları
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 font-sans block text-[11px]">
                      Varlık Hesabı Kodu:
                    </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                      {asset.assetAccountCode || "255.01.001"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 font-sans block text-[11px]">
                      Birikmiş Amortisman (257):
                    </span>
                    <span className="font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">
                      {asset.depreciationAccountCode || "257.01.001"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 font-sans block text-[11px]">
                      Gider Hesabı (770/760/730):
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                      {asset.expenseAccountCode || "770.05.001"}
                    </span>
                  </div>
                </div>
              </div>

              {asset.description && (
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Açıklama & Notlar:</span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{asset.description}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "depreciation" && (
            <DepreciationScheduleTable asset={asset} companyName={companyName} />
          )}

          {activeTab === "maintenance" && (
            <div className="space-y-4">
              {assetMaintenances.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Wrench className="w-10 h-10 mx-auto stroke-[1.2] mb-2 text-slate-300 dark:text-slate-600" />
                  <p className="font-semibold text-slate-600 dark:text-slate-300">Henüz bakım kaydı girilmemiş</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Bu demirbaş için yapılan servis ve tamiratları Bakım sekmesinden ekleyebilirsiniz.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  {assetMaintenances.map((m) => (
                    <div key={m.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-850/60 flex items-center justify-between transition-colors">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{m.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {m.maintenanceType}
                          </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs">
                          {m.date} • {m.serviceProvider}
                        </p>
                        {m.notes && <p className="text-slate-600 dark:text-slate-400 italic">"{m.notes}"</p>}
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm font-mono tabular-nums">
                          {formatTRY(m.cost)}
                        </span>
                        {m.invoiceNo && (
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {m.invoiceNo}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer with Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="px-3.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/50 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kartı Sil</span>
            </button>

            {asset.status !== "scrapped" && asset.status !== "sold" && (
              <button
                type="button"
                onClick={() => onDisposal(asset)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Hurda / Satış Çıkışı Yap</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
            >
              Kapat
            </button>
            <button
              type="button"
              onClick={() => onPrintLabel(asset)}
              className="px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-[0.98]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Etiketi Yazdır</span>
            </button>
            <button
              type="button"
              onClick={() => onEdit(asset)}
              className="px-5 py-2 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-[0.98]"
              style={{ backgroundColor: theme.primaryColor }}
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Düzenle</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

