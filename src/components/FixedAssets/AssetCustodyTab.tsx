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
  CheckCircle,
  Tag,
} from "lucide-react";
import { FixedAsset, Employee } from "../../types";

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
        `${asset.name} zimmetten düşürülüp şirket deposuna aktarılsın mı?`
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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-xl text-blue-700">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Demirbaş Zimmet ve Lokasyon Takip Masası
            </h3>
            <p className="text-xs text-slate-500">
              Personel, şube ve şantiyelere tahsis edilen demirbaşların takibi ve resmi tutanak basımı
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-400 block font-medium">Zimmetteki Demirbaşlar</span>
            <span className="text-base font-bold text-blue-600">
              {inCustodyAssets.length} Adet
            </span>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Personel adı, demirbaş veya lokasyon ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Toplam <strong>{filteredInCustody.length}</strong> zimmetli kayıt
        </div>
      </div>

      {/* Zimmet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInCustody.map((asset) => (
          <div
            key={asset.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {asset.code}
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Zimmette
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 leading-snug">{asset.name}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{asset.categoryLabel || asset.category}</p>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-semibold text-slate-900">
                    {asset.custodyEmployeeName || "Atanmış Personel"}
                  </span>
                </div>

                {(asset.location || asset.branchName) && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Building className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{asset.location || asset.branchName}</span>
                  </div>
                )}

                {asset.custodyDate && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Teslim Tarihi: {asset.custodyDate}</span>
                  </div>
                )}

                {asset.serialNumber && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-mono">Seri: {asset.serialNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions: Print Protocol or Return */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSelectedAssetForProtocol(asset)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Teslim Tutanağı</span>
              </button>

              <button
                type="button"
                onClick={() => handleReturnCustody(asset)}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                İade Al (Depoya)
              </button>
            </div>
          </div>
        ))}

        {filteredInCustody.length === 0 && (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
            <UserCheck className="w-12 h-12 mx-auto stroke-[1.2] mb-3 text-slate-300" />
            <p className="font-semibold text-slate-600">Zimmet kaydı bulunamadı</p>
            <p className="text-xs text-slate-400 mt-1">
              Aşağıdaki boşta demirbaşlar listesinden personele yeni zimmet ataması yapabilirsiniz.
            </p>
          </div>
        )}
      </div>

      {/* Section: Boştaki Demirbaşlar (Quick Handover) */}
      {availableForCustody.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-900">
                Depoda / Boşta Olan Demirbaşlar (Zimmet Verilebilir)
              </h4>
              <p className="text-xs text-slate-500">
                Aşağıdaki demirbaşları doğrudan bir personele veya şantiyeye zimmetleyebilirsiniz.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              {availableForCustody.length} Boşta
            </span>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
            {availableForCustody.slice(0, 5).map((asset) => (
              <div
                key={asset.id}
                className="p-3 hover:bg-slate-50 flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {asset.code}
                  </span>
                  <div>
                    <span className="font-bold text-slate-900">{asset.name}</span>
                    <span className="text-slate-500 ml-2">({asset.categoryLabel})</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenHandover(asset)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">Demirbaş Zimmetleme</h3>
              <button
                type="button"
                onClick={() => setSelectedAssetForHandover(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmHandover} className="p-6 space-y-4 text-xs">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-blue-900 space-y-0.5">
                <span className="font-mono font-bold text-[11px] block">
                  {selectedAssetForHandover.code}
                </span>
                <p className="font-bold">{selectedAssetForHandover.name}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Zimmetlenecek Personel *
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
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
                <label className="block font-semibold text-slate-700 mb-1">
                  Zimmet Teslim Tarihi *
                </label>
                <input
                  type="date"
                  value={handoverDate}
                  onChange={(e) => setHandoverDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lokasyon / Şube</label>
                  <input
                    type="text"
                    value={targetLocation}
                    onChange={(e) => setTargetLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Departman</label>
                  <input
                    type="text"
                    value={targetDepartment}
                    onChange={(e) => setTargetDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedAssetForHandover(null)}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 print:hidden">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Demirbaş Zimmet Teslim - Tesellüm Tutanağı
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAssetForProtocol(null)}
                className="text-slate-400 hover:text-slate-600"
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
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 print:hidden">
              <button
                type="button"
                onClick={() => setSelectedAssetForProtocol(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-xl"
              >
                Kapat
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer"
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
