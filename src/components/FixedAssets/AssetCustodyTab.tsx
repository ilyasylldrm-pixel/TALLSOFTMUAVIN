import React, { useState } from "react";
import {
  UserCheck,
  Building,
  Calendar,
  FileCheck2,
  Printer,
  Search,
  Plus,
  ArrowRightLeft,
  X,
  ShieldCheck,
  Tag,
  ChevronRight,
} from "lucide-react";
import { FixedAsset, Employee } from "../../types";
import { useTheme } from "../../context/ThemeContext";

interface AssetCustodyTabProps {
  assets: FixedAsset[];
  employees: Employee[];
  companyName?: string;
  onUpdateAssetCustody: (
    assetId: string,
    custody: {
      custodyEmployeeId?: string;
      custodyEmployeeName?: string;
      custodyDate?: string;
      location?: string;
      department?: string;
      status: "in_custody" | "active" | "in_storage";
    }
  ) => void;
}

export const AssetCustodyTab: React.FC<AssetCustodyTabProps> = ({
  assets,
  employees,
  companyName = "TALLSOFT MUAVİN ERP",
  onUpdateAssetCustody,
}) => {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssetForHandover, setSelectedAssetForHandover] = useState<FixedAsset | null>(null);
  const [selectedAssetForProtocol, setSelectedAssetForProtocol] = useState<FixedAsset | null>(null);

  // Form State for Handover Modal
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [handoverDate, setHandoverDate] = useState(new Date().toISOString().slice(0, 10));
  const [targetLocation, setTargetLocation] = useState("");
  const [targetDepartment, setTargetDepartment] = useState("");

  const inCustodyAssets = assets.filter(
    (a) =>
      a.status === "in_custody" ||
      (a.custodyEmployeeName && a.custodyEmployeeName.trim().length > 0)
  );

  const availableForCustody = assets.filter((a) => a.status === "active" || a.status === "in_storage");

  const filteredInCustody = inCustodyAssets.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.custodyEmployeeName &&
        a.custodyEmployeeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.location && a.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenHandover = (asset: FixedAsset) => {
    setSelectedAssetForHandover(asset);
    setSelectedEmpId(employees[0]?.id || "");
    setTargetLocation(asset.location || asset.branchName || "Genel Merkez");
    setTargetDepartment(asset.department || "Yönetim");
    setHandoverDate(new Date().toISOString().slice(0, 10));
  };

  const handleConfirmHandover = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetForHandover) return;

    const emp = employees.find((e) => e.id === selectedEmpId);
    const empName = emp ? `${emp.firstName} ${emp.lastName}` : "Bilinmeyen Personel";

    onUpdateAssetCustody(selectedAssetForHandover.id, {
      custodyEmployeeId: selectedEmpId,
      custodyEmployeeName: empName,
      custodyDate: handoverDate,
      location: targetLocation,
      department: targetDepartment,
      status: "in_custody",
    });

    setSelectedAssetForHandover(null);
  };

  const handleReturnCustody = (asset: FixedAsset) => {
    if (
      window.confirm(
        `${asset.name} (${asset.code}) zimmetten düşürülüp şirket deposuna aktarılsın mı?`
      )
    ) {
      onUpdateAssetCustody(asset.id, {
        custodyEmployeeId: undefined,
        custodyEmployeeName: undefined,
        custodyDate: undefined,
        status: "in_storage",
      });
    }
  };

  const custodyRatio =
    assets.length > 0 ? Math.round((inCustodyAssets.length / assets.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* 1. Header & Search Bar */}
      <div
        className="p-4 rounded-2xl border shadow-2xs flex flex-wrap items-center justify-between gap-3 transition-colors"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
      >
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Personel adı, demirbaş veya lokasyon ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition-all font-medium"
          />
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Toplam <strong className="text-slate-900 dark:text-slate-100 font-mono">{filteredInCustody.length}</strong> zimmetli kayıt
        </div>
      </div>

      {/* Mini Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          className="p-3.5 rounded-xl border shadow-2xs transition-colors flex items-center justify-between"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Zimmette Olan Varlıklar</span>
            <span className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-mono">
              {inCustodyAssets.length} Adet
            </span>
          </div>
          <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-xl border border-amber-200 dark:border-amber-800">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>

        <div
          className="p-3.5 rounded-xl border shadow-2xs transition-colors flex items-center justify-between"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Depoda / Boşta Olanlar</span>
            <span className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-mono">
              {availableForCustody.length} Adet
            </span>
          </div>
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-xl border border-indigo-200 dark:border-indigo-800">
            <Building className="w-4 h-4" />
          </div>
        </div>

        <div
          className="p-3.5 rounded-xl border shadow-2xs transition-colors flex items-center justify-between"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Zimmet Tahsis Oranı</span>
            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              %{custodyRatio}
            </span>
          </div>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 2. Zimmetli Varlıklar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInCustody.map((asset) => (
          <div
            key={asset.id}
            className="border rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                  {asset.code}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Zimmette
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">{asset.name}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{asset.categoryLabel || asset.category}</p>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <UserCheck className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="font-bold">
                    {asset.custodyEmployeeName || "Atanmış Personel"}
                  </span>
                </div>

                {(asset.location || asset.branchName) && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Building className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{asset.location || asset.branchName}</span>
                  </div>
                )}

                {asset.custodyDate && (
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Teslim Tarihi: {asset.custodyDate}</span>
                  </div>
                )}

                {asset.serialNumber && (
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-mono text-[11px]">Seri: {asset.serialNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions: Print Protocol or Return */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSelectedAssetForProtocol(asset)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-500" />
                <span>Teslim Tutanağı</span>
              </button>

              <button
                type="button"
                onClick={() => handleReturnCustody(asset)}
                className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-rose-200 dark:border-rose-800"
              >
                İade Al (Depoya)
              </button>
            </div>
          </div>
        ))}

        {filteredInCustody.length === 0 && (
          <div className="col-span-full bg-white dark:bg-slate-900 p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400">
            <UserCheck className="w-12 h-12 mx-auto stroke-[1.2] mb-3 text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">Zimmet kaydı bulunamadı</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Aşağıdaki boşta demirbaşlar listesinden personele yeni zimmet ataması yapabilirsiniz.
            </p>
          </div>
        )}
      </div>

      {/* 3. Section: Boştaki Demirbaşlar (Quick Handover) */}
      {availableForCustody.length > 0 && (
        <div
          className="rounded-2xl border p-5 shadow-2xs space-y-4 transition-colors"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Depoda / Boşta Olan Demirbaşlar (Zimmet Verilebilir)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aşağıdaki demirbaşları doğrudan personele veya şantiyeye zimmetleyebilirsiniz.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              {availableForCustody.length} Boşta
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            {availableForCustody.slice(0, 6).map((asset) => (
              <div
                key={asset.id}
                className="p-3 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center justify-between gap-4 text-xs transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {asset.code}
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{asset.name}</span>
                    <span className="text-slate-500 dark:text-slate-400 ml-2">({asset.categoryLabel})</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenHandover(asset)}
                  className="px-3 py-1.5 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-[0.98]"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Zimmet Ata</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Handover Modal */}
      {selectedAssetForHandover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Demirbaş Zimmetleme</h3>
              <button
                type="button"
                onClick={() => setSelectedAssetForHandover(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmHandover} className="p-6 space-y-4 text-xs">
              <div className="bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 p-3 rounded-xl text-indigo-900 dark:text-indigo-200 space-y-0.5">
                <span className="font-mono font-bold text-[11px] block text-indigo-700 dark:text-indigo-300">
                  {selectedAssetForHandover.code}
                </span>
                <p className="font-bold">{selectedAssetForHandover.name}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Zimmetlenecek Personel *
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  required
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.department || "Genel"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Zimmet Teslim Tarihi *
                </label>
                <input
                  type="date"
                  value={handoverDate}
                  onChange={(e) => setHandoverDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Lokasyon / Şube</label>
                  <input
                    type="text"
                    value={targetLocation}
                    onChange={(e) => setTargetLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Departman</label>
                  <input
                    type="text"
                    value={targetDepartment}
                    onChange={(e) => setTargetDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedAssetForHandover(null)}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white font-semibold rounded-xl cursor-pointer shadow-2xs transition-all active:scale-[0.98]"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  Zimmeti Onayla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Handover Protocol (Teslim-Tesellüm Tutanağı) Print Modal */}
      {selectedAssetForProtocol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none animate-in fade-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 print:hidden">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Demirbaş Zimmet Teslim - Tesellüm Tutanağı
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAssetForProtocol(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Protocol Body */}
            <div className="p-8 overflow-y-auto print:p-6 text-slate-900 font-sans space-y-6">
              {/* Document Header */}
              <div className="text-center border-b-2 border-slate-800 pb-4">
                <h2 className="text-xl font-extrabold uppercase tracking-wide">
                  {companyName}
                </h2>
                <h3 className="text-base font-bold text-slate-700 mt-1 uppercase tracking-wider">
                  DEMİRBAŞ VE ŞİRKET ARACI TESLİM - TESELLÜM TUTANAĞI
                </h3>
                <span className="text-xs text-slate-500 font-mono mt-1 block">
                  Belge No: ZMT-{selectedAssetForProtocol.code}-{new Date().getFullYear()}
                </span>
              </div>

              {/* Protocol Text Intro */}
              <p className="text-xs leading-relaxed text-slate-700">
                Aşağıda detaylı teknik özellikleri ve seri numarası belirtilen şirket demirbaşı, ilgili
                şirket işlerinde kullanılmak ve korunmak üzere, tam, eksiksiz, çalışır ve hasarsız vaziyette
                aşağıda ismi yazılı personele zimmet karşılığı teslim edilmiştir.
              </p>

              {/* Asset Details Table */}
              <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
                <div className="bg-slate-100 px-4 py-2 font-bold text-slate-800 border-b border-slate-300 uppercase tracking-wider">
                  Demirbaş ve Teçhizat Bilgileri
                </div>
                <div className="grid grid-cols-2 divide-x divide-y divide-slate-200">
                  <div className="p-2.5">
                    <span className="text-slate-500 font-semibold block">Demirbaş Kodu:</span>
                    <span className="font-bold font-mono text-slate-900">
                      {selectedAssetForProtocol.code}
                    </span>
                  </div>
                  <div className="p-2.5">
                    <span className="text-slate-500 font-semibold block">Demirbaş Tanımı:</span>
                    <span className="font-bold text-slate-900">
                      {selectedAssetForProtocol.name}
                    </span>
                  </div>
                  <div className="p-2.5">
                    <span className="text-slate-500 font-semibold block">Kategori / Grup:</span>
                    <span>{selectedAssetForProtocol.categoryLabel || selectedAssetForProtocol.category}</span>
                  </div>
                  <div className="p-2.5">
                    <span className="text-slate-500 font-semibold block">Marka & Model:</span>
                    <span>
                      {selectedAssetForProtocol.brand || "-"} / {selectedAssetForProtocol.model || "-"}
                    </span>
                  </div>
                  <div className="p-2.5">
                    <span className="text-slate-500 font-semibold block">Seri No / Plaka:</span>
                    <span className="font-mono font-bold">
                      {selectedAssetForProtocol.plateNumber || selectedAssetForProtocol.serialNumber || "-"}
                    </span>
                  </div>
                  <div className="p-2.5">
                    <span className="text-slate-500 font-semibold block">Teslim Tarihi:</span>
                    <span>{selectedAssetForProtocol.custodyDate || new Date().toISOString().slice(0, 10)}</span>
                  </div>
                </div>
              </div>

              {/* Legal Undertakings */}
              <div className="space-y-2 text-[11px] text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                  Zimmet ve Kullanım Şartları:
                </h5>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>
                    Teslim edilen demirbaş yalnızca şirketin ticari faaliyetleri ve görev amacıyla kullanılacaktır.
                  </li>
                  <li>
                    Kullanıcı, demirbaşın periyodik bakım, temizlik ve muhafazasından doğrudan sorumludur.
                  </li>
                  <li>
                    İş akdinin sona ermesi veya şirketin talebi halinde demirbaş eksiksiz ve çalışır durumda iade edilecektir.
                  </li>
                  <li>
                    Kullanıcı kusur veya ihmalinden kaynaklanan arıza ve hasarlarda ilgili masraflar kullanıcıya rücu edilebilir.
                  </li>
                </ol>
              </div>

              {/* Signature Blocks */}
              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
                <div className="space-y-12">
                  <div>
                    <span className="font-bold text-slate-800 block">TESLİM EDEN (YETKİLİ)</span>
                    <span className="text-slate-500 text-[11px]">İdari İşler / Depo Sorumlusu</span>
                  </div>
                  <div className="border-t border-slate-400 pt-2 text-slate-400">
                    İmza / Kaşe
                  </div>
                </div>

                <div className="space-y-12">
                  <div>
                    <span className="font-bold text-slate-800 block">TESLİM ALAN (PERSONEL)</span>
                    <span className="font-semibold text-slate-900 block mt-0.5">
                      {selectedAssetForProtocol.custodyEmployeeName || "Personel"}
                    </span>
                  </div>
                  <div className="border-t border-slate-400 pt-2 text-slate-400">
                    İmza
                  </div>
                </div>
              </div>
            </div>

            {/* Print Buttons */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5 print:hidden">
              <button
                type="button"
                onClick={() => setSelectedAssetForProtocol(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Kapat
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-2xs"
                style={{ backgroundColor: theme.primaryColor }}
              >
                <Printer className="w-4 h-4" />
                <span>Tutanağı Yazdır / PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
