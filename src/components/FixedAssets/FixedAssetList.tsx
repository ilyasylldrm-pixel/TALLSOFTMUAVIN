import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Plus,
  Download,
  Printer,
  Edit,
  Eye,
  Trash2,
  Tag,
  Building,
  Calendar,
  DollarSign,
  ArrowUpDown,
  CheckCircle2,
  Calculator,
  UserCheck,
  FileSpreadsheet,
} from "lucide-react";
import { FixedAsset, FixedAssetCategory } from "../../types";
import { formatTRY, getCategoryBadgeColor, getStatusBadgeInfo } from "../../data/fixedAssetsData";

interface FixedAssetListProps {
  assets: FixedAsset[];
  onSelectAsset: (asset: FixedAsset) => void;
  onEditAsset: (asset: FixedAsset) => void;
  onPrintLabel: (asset: FixedAsset) => void;
  onAddNew: () => void;
}

export const FixedAssetList: React.FC<FixedAssetListProps> = ({
  assets,
  onSelectAsset,
  onEditAsset,
  onPrintLabel,
  onAddNew,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof FixedAsset>("acquisitionDate");
  const [sortAsc, setSortAsc] = useState(false);

  // Filtered and Sorted Assets
  const filteredAssets = useMemo(() => {
    return assets
      .filter((a) => {
        const matchesSearch =
          a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (a.brand && a.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (a.model && a.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (a.serialNumber && a.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (a.plateNumber && a.plateNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (a.custodyEmployeeName &&
            a.custodyEmployeeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (a.location && a.location.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCat = selectedCategory === "all" || a.category === selectedCategory;
        const matchesStatus = selectedStatus === "all" || a.status === selectedStatus;

        return matchesSearch && matchesCat && matchesStatus;
      })
      .sort((a, b) => {
        let valA = a[sortField] ?? "";
        let valB = b[sortField] ?? "";

        if (typeof valA === "number" && typeof valB === "number") {
          return sortAsc ? valA - valB : valB - valA;
        }

        return sortAsc
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
  }, [assets, searchTerm, selectedCategory, selectedStatus, sortField, sortAsc]);

  const handleSort = (field: keyof FixedAsset) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleExportExcel = () => {
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
      "Kıst Amortisman",
      "Birikmiş Amortisman (TL)",
      "Net Defter Değeri (TL)",
      "Lokasyon",
      "Zimmetli Personel",
      "Durum",
    ];

    const rows = filteredAssets.map((a) => [
      a.code,
      `"${a.name.replace(/"/g, '""')}"`,
      `"${a.categoryLabel || a.category}"`,
      a.brand || "",
      a.model || "",
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
      `Demirbas_Envanter_Listesi_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Demirbaş kodu, adı, seri no, plaka, marka veya personel ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl text-xs py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">Tüm Kategoriler ({assets.length})</option>
            <option value="255_demirbaslar">255 Demirbaşlar</option>
            <option value="254_tasitlar">254 Taşıtlar</option>
            <option value="253_tesis_makine">253 Tesis & Makineler</option>
            <option value="264_ozel_maliyetler">264 Özel Maliyetler</option>
            <option value="260_haklar_lisans">260 Haklar & Lisanslar</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl text-xs py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="active">Aktif Kullanımda</option>
            <option value="in_custody">Zimmetli</option>
            <option value="in_storage">Depoda / Boşta</option>
            <option value="maintenance">Serviste / Bakımda</option>
            <option value="scrapped">Hurdaya Ayrıldı</option>
            <option value="sold">Satıldı</option>
          </select>

          {/* Export to Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Excel Formatında Envanter Listesi İndir"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel İndir</span>
          </button>

          {/* New Asset Button */}
          <button
            type="button"
            onClick={onAddNew}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Demirbaş Kartı</span>
          </button>
        </div>
      </div>

      {/* Table Data Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
                <th
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort("code")}
                >
                  <div className="flex items-center gap-1">
                    <span>Demirbaş Kodu</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    <span>Demirbaş Adı & Bilgileri</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Kategori Grubu</th>
                <th
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort("acquisitionDate")}
                >
                  <div className="flex items-center gap-1">
                    <span>Alış Tarihi</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort("purchaseCost")}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Alış Bedeli (TL)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Ömür & Oran</th>
                <th
                  className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort("accumulatedDepreciation")}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Birikmiş Amortisman</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors text-emerald-800"
                  onClick={() => handleSort("netBookValue")}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Net Defter Değeri</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Zimmet / Lokasyon</th>
                <th className="py-3 px-3 text-center">Durum</th>
                <th className="py-3 px-4 text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredAssets.map((asset) => {
                const colorInfo = getCategoryBadgeColor(asset.category);
                const statusInfo = getStatusBadgeInfo(asset.status);

                return (
                  <tr
                    key={asset.id}
                    className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                    onClick={() => onSelectAsset(asset)}
                  >
                    {/* Code & Barcode */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {asset.code}
                        </span>
                      </div>
                    </td>

                    {/* Name, Brand & Model */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5 max-w-xs">
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {asset.name}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                          {asset.brand && <span className="font-semibold">{asset.brand}</span>}
                          {asset.model && <span>{asset.model}</span>}
                          {asset.serialNumber && (
                            <span className="font-mono text-slate-400">
                              (SN: {asset.serialNumber})
                            </span>
                          )}
                          {asset.plateNumber && (
                            <span className="font-bold text-slate-800 bg-amber-100 px-1 rounded text-[10px]">
                              {asset.plateNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${colorInfo.bg} ${colorInfo.border}`}
                      >
                        {asset.categoryLabel || asset.category}
                      </span>
                    </td>

                    {/* Dates */}
                    <td className="py-3 px-4 text-slate-600">
                      <div>{asset.acquisitionDate}</div>
                      {asset.invoiceNo && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          Ftr: {asset.invoiceNo}
                        </div>
                      )}
                    </td>

                    {/* Purchase Cost */}
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatTRY(asset.purchaseCost)}
                    </td>

                    {/* Depreciation Rate */}
                    <td className="py-3 px-3 text-center text-slate-600">
                      <div className="font-semibold text-indigo-700">
                        %{asset.depreciationRate}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {asset.usefulLifeYears} Yıl
                        {asset.isPartialYear && " • Kıst"}
                      </div>
                    </td>

                    {/* Accumulated Depreciation */}
                    <td className="py-3 px-4 text-right font-semibold text-slate-700">
                      {formatTRY(asset.accumulatedDepreciation)}
                    </td>

                    {/* Net Book Value */}
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">
                      {formatTRY(asset.netBookValue)}
                    </td>

                    {/* Custody / Location */}
                    <td className="py-3 px-3">
                      {asset.custodyEmployeeName ? (
                        <div className="text-slate-800 font-medium flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate max-w-[130px]">
                            {asset.custodyEmployeeName}
                          </span>
                        </div>
                      ) : (
                        <div className="text-slate-400 text-[11px]">
                          {asset.location || asset.branchName || "Genel Merkez"}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusInfo.bg} ${statusInfo.text}`}
                      >
                        {statusInfo.label}
                      </span>
                    </td>

                    {/* Row Actions */}
                    <td
                      className="py-3 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onSelectAsset(asset)}
                          className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors cursor-pointer"
                          title="İncele / Detay"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onPrintLabel(asset)}
                          className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
                          title="Etiket Yazdır"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onEditAsset(asset)}
                          className="p-1.5 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors cursor-pointer"
                          title="Düzenle"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredAssets.length === 0 && (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Tag className="w-12 h-12 mx-auto stroke-[1.2] text-slate-300" />
            <p className="font-semibold text-slate-600">Kriterlere uygun demirbaş bulunamadı</p>
            <p className="text-xs text-slate-400">
              Filtreleri sıfırlayabilir veya "Yeni Demirbaş Kartı" butonuyla yeni bir kart oluşturabilirsiniz.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
