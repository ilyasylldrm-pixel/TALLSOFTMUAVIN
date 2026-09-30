import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Download,
  Printer,
  Edit,
  Eye,
  Tag,
  Calendar,
  ArrowUpDown,
  UserCheck,
  FileSpreadsheet,
  LayoutGrid,
  List,
  Building,
  ShieldCheck,
  Calculator,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { FixedAsset } from "../../types";
import { formatTRY, getCategoryBadgeColor, getStatusBadgeInfo } from "../../data/fixedAssetsData";
import { useTheme } from "../../context/ThemeContext";

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
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof FixedAsset>("acquisitionDate");
  const [sortAsc, setSortAsc] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

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

  // Filtered Totals
  const filteredCost = filteredAssets.reduce((sum, a) => sum + (a.purchaseCost || 0), 0);
  const filteredDepr = filteredAssets.reduce(
    (sum, a) => sum + (a.accumulatedDepreciation || 0),
    0
  );
  const filteredNet = filteredAssets.reduce((sum, a) => sum + (a.netBookValue || 0), 0);

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
      "Kıst Dönem",
      "Birikmiş Amortisman (TL)",
      "Net Defter Değeri (TL)",
      "Lokasyon / Şube",
      "Zimmetli Personel",
      "Durum",
    ];

    const rows = filteredAssets.map((a) => [
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
      `Demirbas_Envanter_Listesi_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* 1. Modern Controls & Search Bar */}
      <div
        className="p-4 rounded-2xl border shadow-2xs flex flex-wrap items-center justify-between gap-3 transition-colors"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
      >
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Demirbaş kodu, adı, seri no, plaka veya personel ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition-all font-medium"
          />
        </div>

        {/* Filters and View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium cursor-pointer"
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
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium cursor-pointer"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="active">Aktif Kullanımda</option>
            <option value="in_custody">Zimmetli</option>
            <option value="in_storage">Depoda / Boşta</option>
            <option value="maintenance">Serviste / Bakımda</option>
            <option value="scrapped">Hurdaya Ayrıldı</option>
            <option value="sold">Satıldı</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
              title="Tablo Görünümü"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
              title="Kart / Izgara Görünümü"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Export to Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 active:scale-[0.98]"
            title="Excel Formatında Envanter Listesi İndir"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel İndir</span>
          </button>

          {/* New Asset Button */}
          <button
            type="button"
            onClick={onAddNew}
            className="px-3.5 py-2 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-[0.98]"
            style={{ backgroundColor: theme.primaryColor }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yeni Demirbaş</span>
          </button>
        </div>
      </div>

      {/* Mini Financial Filter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-medium">
        <div
          className="p-3 rounded-xl border shadow-2xs transition-colors flex items-center justify-between"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <span className="text-slate-500 dark:text-slate-400">Listelenen:</span>
          <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
            {filteredAssets.length} / {assets.length} Varlık
          </span>
        </div>
        <div
          className="p-3 rounded-xl border shadow-2xs transition-colors flex items-center justify-between"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <span className="text-slate-500 dark:text-slate-400">Toplam Alış:</span>
          <span className="font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
            {formatTRY(filteredCost)}
          </span>
        </div>
        <div
          className="p-3 rounded-xl border shadow-2xs transition-colors flex items-center justify-between"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <span className="text-slate-500 dark:text-slate-400">Birikmiş İtfa:</span>
          <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
            {formatTRY(filteredDepr)}
          </span>
        </div>
        <div
          className="p-3 rounded-xl border shadow-2xs transition-colors flex items-center justify-between"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <span className="text-slate-500 dark:text-slate-400">Net Defter:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
            {formatTRY(filteredNet)}
          </span>
        </div>
      </div>

      {/* 2. View Mode: Table Grid View */}
      {viewMode === "table" ? (
        <div
          className="rounded-2xl border shadow-2xs overflow-hidden transition-colors"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs data-grid">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => handleSort("code")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Demirbaş Kodu</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Demirbaş Adı & Bilgileri</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3">Kategori</th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => handleSort("acquisitionDate")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Alış Tarihi</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => handleSort("purchaseCost")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Alış Bedeli</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center">Ömür & Oran</th>
                  <th
                    className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => handleSort("accumulatedDepreciation")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Birikmiş Amortisman</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => handleSort("netBookValue")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Net Defter Değeri</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3">Zimmet / Konum</th>
                  <th className="py-3 px-3 text-center">Durum</th>
                  <th className="py-3 px-4 text-center">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredAssets.map((asset) => {
                  const statusInfo = getStatusBadgeInfo(asset.status);

                  return (
                    <tr
                      key={asset.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition-colors group cursor-pointer text-slate-900 dark:text-slate-100"
                      onClick={() => onSelectAsset(asset)}
                    >
                      {/* Code */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {asset.code}
                        </span>
                      </td>

                      {/* Name, Brand & Model */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5 max-w-xs">
                          <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {asset.name}
                          </div>
                          {/* Clean unboxed metadata with typographic separators */}
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                            {asset.brand && <span className="font-semibold">{asset.brand}</span>}
                            {asset.brand && asset.model && <span aria-hidden="true">·</span>}
                            {asset.model && <span>{asset.model}</span>}
                            {asset.serialNumber && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono opacity-80">SN: {asset.serialNumber}</span>
                              </>
                            )}
                            {asset.plateNumber && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200 bg-amber-100 dark:bg-amber-950/60 px-1 rounded text-[10px]">
                                  {asset.plateNumber}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                          {asset.categoryLabel || asset.category}
                        </span>
                      </td>

                      {/* Dates */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                        <div>{asset.acquisitionDate}</div>
                        {asset.invoiceNo && (
                          <div className="text-[10px] text-slate-400">
                            Ftr: {asset.invoiceNo}
                          </div>
                        )}
                      </td>

                      {/* Purchase Cost */}
                      <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        {formatTRY(asset.purchaseCost)}
                      </td>

                      {/* Depreciation Rate */}
                      <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-300">
                        <div className="font-semibold text-indigo-600 dark:text-indigo-400">
                          %{asset.depreciationRate}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {asset.usefulLifeYears} Yıl
                          {asset.isPartialYear && " • Kıst"}
                        </div>
                      </td>

                      {/* Accumulated Depreciation */}
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {formatTRY(asset.accumulatedDepreciation)}
                      </td>

                      {/* Net Book Value */}
                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatTRY(asset.netBookValue)}
                      </td>

                      {/* Custody / Location */}
                      <td className="py-3 px-3">
                        {asset.custodyEmployeeName ? (
                          <div className="text-slate-800 dark:text-slate-200 font-medium flex items-center gap-1.5 text-xs">
                            <UserCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
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
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block border ${
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
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                            title="İncele / Detay"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onPrintLabel(asset)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                            title="Barkod / Etiket Yazdır"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onEditAsset(asset)}
                            className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors cursor-pointer"
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

              {/* Table Footer Totals */}
              {filteredAssets.length > 0 && (
                <tfoot className="bg-slate-50 dark:bg-slate-850/80 border-t-2 border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-800 dark:text-slate-200">
                  <tr>
                    <td colSpan={4} className="py-3 px-4">
                      <span>Filtrelenen Toplam ({filteredAssets.length} Demirbaş)</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {formatTRY(filteredCost)}
                    </td>
                    <td className="py-3 px-3 text-center">-</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      {formatTRY(filteredDepr)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatTRY(filteredNet)}
                    </td>
                    <td colSpan={3} className="py-3 px-4"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {filteredAssets.length === 0 && (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Tag className="w-12 h-12 mx-auto stroke-[1.2] text-slate-300 dark:text-slate-600" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                Kriterlere uygun demirbaş bulunamadı
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Arama teriminizi temizleyebilir veya "Yeni Demirbaş" butonuyla sisteme ekleyebilirsiniz.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* 3. View Mode: Card Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => {
            const statusInfo = getStatusBadgeInfo(asset.status);
            const deprPct =
              asset.purchaseCost > 0
                ? Math.min(100, Math.round((asset.accumulatedDepreciation / asset.purchaseCost) * 100))
                : 0;

            return (
              <div
                key={asset.id}
                onClick={() => onSelectAsset(asset)}
                className="rounded-2xl border p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                      {asset.code}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                        asset.status === "in_custody"
                          ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                          : asset.status === "active"
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mt-2">
                    {asset.name}
                  </h4>

                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                    <span>{asset.categoryLabel || asset.category}</span>
                    {asset.brand && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{asset.brand}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress bar for depreciation */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Amortisman İtfa Oranı:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                      %{deprPct}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${deprPct}%` }}
                    />
                  </div>
                </div>

                {/* Financial Values */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Alış Bedeli</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {formatTRY(asset.purchaseCost)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Net Defter Değeri</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatTRY(asset.netBookValue)}
                    </span>
                  </div>
                </div>

                {/* Footer Personnel & Action */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 truncate max-w-[160px]">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate">{asset.custodyEmployeeName || "Zimmetli Değil"}</span>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onPrintLabel(asset)}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      title="Etiket Yazdır"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditAsset(asset)}
                      className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                      title="Düzenle"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredAssets.length === 0 && (
            <div className="col-span-full p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Tag className="w-12 h-12 mx-auto stroke-[1.2] text-slate-300 dark:text-slate-600" />
              <p className="font-semibold text-slate-600 dark:text-slate-300 mt-2">
                Kriterlere uygun demirbaş bulunamadı
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
