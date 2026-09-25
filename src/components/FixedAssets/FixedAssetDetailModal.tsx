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
} from "lucide-react";
import { FixedAsset, AssetMaintenanceRecord, Employee } from "../../types";
import { formatTRY, getCategoryBadgeColor, getStatusBadgeInfo } from "../../data/fixedAssetsData";
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-xs bg-blue-100 text-blue-800 px-2.5 py-1 rounded-lg border border-blue-200">
              {asset.code}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 leading-tight">
                  {asset.name}
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusInfo.bg} ${statusInfo.text}`}
                >
                  {statusInfo.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {asset.categoryLabel || asset.category} • {asset.brand} {asset.model}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPrintLabel(asset)}
              className="p-2 hover:bg-slate-200/80 rounded-xl text-slate-600 transition-colors"
              title="QR / Barkod Etiketi Yazdır"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onEdit(asset)}
              className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-colors"
              title="Düzenle"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-slate-200/80 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center gap-6 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === "overview"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Genel & Finansal Bilgiler
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("depreciation")}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "depreciation"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>VUK Amortisman & İtfa Planı</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("maintenance")}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "maintenance"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Bakım & Onarım ({assetMaintenances.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Financial Status Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500">
                    Aktif Giriş Maliyeti
                  </span>
                  <div className="text-lg font-bold text-slate-900">
                    {formatTRY(asset.purchaseCost)}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    KDV Tutarı: {formatTRY(asset.vatAmount)} (%{asset.vatRate})
                  </span>
                </div>

                <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-1">
                  <span className="text-[11px] font-semibold text-emerald-800">
                    Birikmiş Amortisman (İtfa)
                  </span>
                  <div className="text-lg font-bold text-emerald-700">
                    {formatTRY(asset.accumulatedDepreciation)}
                  </div>
                  <span className="text-[10px] text-emerald-600">
                    İtfa Oranı: %
                    {Math.min(
                      100,
                      Math.round(
                        (asset.accumulatedDepreciation / Math.max(1, asset.purchaseCost)) * 100
                      )
                    )}
                  </span>
                </div>

                <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-1">
                  <span className="text-[11px] font-semibold text-amber-800">
                    Net Defter Değeri (Bilanço)
                  </span>
                  <div className="text-lg font-bold text-amber-700">
                    {formatTRY(asset.netBookValue)}
                  </div>
                  <span className="text-[10px] text-amber-600">
                    Kalan İtfa Edilebilir Değer
                  </span>
                </div>
              </div>

              {/* Technical & Identification Grid */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                <div className="bg-slate-50 px-4 py-2.5 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Demirbaş Künyesi ve Teknik Detaylar
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Marka & Model:</span>
                      <span className="font-semibold text-slate-800">
                        {asset.brand || "-"} {asset.model || ""}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Seri Numarası:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {asset.serialNumber || "-"}
                      </span>
                    </div>

                    {asset.plateNumber && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Araç Plakası:</span>
                        <span className="font-bold bg-amber-100 px-2 py-0.5 rounded text-slate-900">
                          {asset.plateNumber}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Barkod / Demirbaş No:</span>
                      <span className="font-mono text-slate-700">{asset.barcode || "-"}</span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Alış & Aktife Giriş:</span>
                      <span className="font-semibold text-slate-800">{asset.acquisitionDate}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Fatura Numarası:</span>
                      <span className="font-mono text-slate-700">{asset.invoiceNo || "-"}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Tedarikçi Firma:</span>
                      <span className="font-medium text-slate-800">{asset.vendorName || "-"}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Garanti Bitiş Tarihi:</span>
                      <span className="font-semibold text-slate-700">
                        {asset.warrantyEndDate || "Belirtilmedi"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Custody and Location */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                <div className="bg-slate-50 px-4 py-2.5 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Zimmet ve Lokasyon Bilgileri
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-slate-500 font-medium block">Zimmetli Personel:</span>
                    <span className="font-bold text-slate-900 mt-1 block">
                      {asset.custodyEmployeeName || "Zimmet Atanmamış (Ortak / Depo)"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium block">Lokasyon / Şube:</span>
                    <span className="font-semibold text-slate-800 mt-1 block">
                      {asset.location || asset.branchName || "Genel Merkez"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium block">Departman / Şantiye:</span>
                    <span className="font-semibold text-slate-800 mt-1 block">
                      {asset.department || "Yönetim"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Accounting Setup (Tek Düzen) */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                <div className="bg-slate-50 px-4 py-2.5 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Tek Düzen Hesap Planı Bağlantıları
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                  <div>
                    <span className="text-slate-500 font-sans block text-[11px]">
                      Varlık Hesabı Kodu:
                    </span>
                    <span className="font-bold text-blue-700 mt-0.5 block">
                      {asset.assetAccountCode || "255.01.001"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-sans block text-[11px]">
                      Birikmiş Amortisman (257):
                    </span>
                    <span className="font-bold text-amber-700 mt-0.5 block">
                      {asset.depreciationAccountCode || "257.01.001"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-sans block text-[11px]">
                      Gider Hesabı (770/760/730):
                    </span>
                    <span className="font-bold text-emerald-700 mt-0.5 block">
                      {asset.expenseAccountCode || "770.05.001"}
                    </span>
                  </div>
                </div>
              </div>

              {asset.description && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700 block mb-1">Açıklama & Notlar:</span>
                  <p className="text-slate-600 leading-relaxed">{asset.description}</p>
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
                  <Wrench className="w-10 h-10 mx-auto stroke-[1.2] mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-600">Henüz bakım kaydı girilmemiş</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Bu demirbaş için yapılan servis ve tamiratları Bakım Yönetimi sekmesinden ekleyebilirsiniz.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {assetMaintenances.map((m) => (
                    <div key={m.id} className="p-4 hover:bg-slate-50 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{m.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-medium text-slate-600">
                            {m.maintenanceType}
                          </span>
                        </div>
                        <p className="text-slate-500 text-xs">
                          {m.date} • {m.serviceProvider}
                        </p>
                        {m.notes && <p className="text-slate-600 italic">"{m.notes}"</p>}
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 text-sm">{formatTRY(m.cost)}</span>
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
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl border border-red-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kartı Sil</span>
            </button>

            {asset.status !== "scrapped" && asset.status !== "sold" && (
              <button
                type="button"
                onClick={() => onDisposal(asset)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/80 rounded-xl border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Hurda / Satış Çıkışı Yap</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-xl"
            >
              Kapat
            </button>
            <button
              type="button"
              onClick={() => onPrintLabel(asset)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Etiketi Yazdır</span>
            </button>
            <button
              type="button"
              onClick={() => onEdit(asset)}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
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
