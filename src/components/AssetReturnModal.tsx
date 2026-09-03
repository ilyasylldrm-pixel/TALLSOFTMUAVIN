import React, { useState } from "react";
import {
  X,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Car,
  UserCheck,
  FileText,
  HelpCircle,
  Fuel,
  CheckSquare,
  Square,
  AlertCircle,
  FileCheck2,
} from "lucide-react";
import { AssetCustody } from "../types";
import { DetailPageLayout } from "./common/DetailPageLayout";

interface AssetReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: AssetCustody | null;
  defaultManagerName?: string;
  onConfirmReturn: (
    assetId: string,
    returnData: {
      returnDate: string;
      conditionOnReturn: string;
      returnNotes?: string;
      returnReceivedBy?: string;
      returnKm?: number;
      returnedAccessoriesList?: string[];
    }
  ) => void;
  onOpenPrintModal?: (asset: AssetCustody, isReturnProtocol?: boolean) => void;
}

export const AssetReturnModal: React.FC<AssetReturnModalProps> = ({
  isOpen,
  onClose,
  asset,
  defaultManagerName = "İnsan Kaynakları & İdari İşler Yetkilisi",
  onConfirmReturn,
  onOpenPrintModal,
}) => {
  if (!isOpen || !asset) return null;

  const todayStr = new Date().toISOString().split("T")[0];
  const [returnDate, setReturnDate] = useState(todayStr);
  const [conditionOnReturn, setConditionOnReturn] = useState(
    asset.conditionOnReturn || "good"
  );
  const [returnReceivedBy, setReturnReceivedBy] = useState(
    asset.returnReceivedBy || defaultManagerName
  );
  const [returnKm, setReturnKm] = useState<number | "">(
    asset.vehicleDetails?.returnKm ||
      (asset.vehicleDetails?.currentKm
        ? asset.vehicleDetails.currentKm + 150
        : "")
  );
  const [fuelLevelOnReturn, setFuelLevelOnReturn] = useState<string>("Full");
  const [returnNotes, setReturnNotes] = useState(asset.returnNotes || "");

  // Aksesuar teslim durumları
  const initialAccessories = asset.accessoriesList || [];
  const [selectedReturnedAccessories, setSelectedReturnedAccessories] = useState<
    string[]
  >(asset.returnedAccessoriesList || initialAccessories);

  const toggleAccessory = (acc: string) => {
    if (selectedReturnedAccessories.includes(acc)) {
      setSelectedReturnedAccessories(
        selectedReturnedAccessories.filter((item) => item !== acc)
      );
    } else {
      setSelectedReturnedAccessories([...selectedReturnedAccessories, acc]);
    }
  };

  const setQuickNote = (noteText: string) => {
    if (!returnNotes) {
      setReturnNotes(noteText);
    } else if (!returnNotes.includes(noteText)) {
      setReturnNotes(`${returnNotes} • ${noteText}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let compiledNotes = returnNotes.trim();
    if (asset.category === "vehicle" && fuelLevelOnReturn) {
      const fuelNote = `Yakıt Durumu: ${fuelLevelOnReturn}`;
      if (!compiledNotes.includes("Yakıt Durumu:")) {
        compiledNotes = compiledNotes
          ? `${compiledNotes} | ${fuelNote}`
          : fuelNote;
      }
    }

    onConfirmReturn(asset.id, {
      returnDate,
      conditionOnReturn,
      returnNotes: compiledNotes,
      returnReceivedBy: returnReceivedBy.trim(),
      returnKm: typeof returnKm === "number" ? returnKm : undefined,
      returnedAccessoriesList: selectedReturnedAccessories,
    });

    onClose();
  };

  return (
    <DetailPageLayout
      title="Zimmet İade Alma İşlemi"
      subtitle={`${asset.employeeName} • ${asset.assetName} • Personeldeki şirket demirbaşının teslim alınması ve tutanak kaydı`}
      breadcrumbs={[
        { label: "İnsan Kaynakları", onClick: onClose },
        { label: "Demirbaş Zimmetleri", onClick: onClose },
        { label: "İade Alma", active: true },
      ]}
      onBack={onClose}
      statusBadge={
        <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
          İADE SÜRECİ
        </span>
      }
      headerIcon={<RotateCcw className="w-5 h-5 text-amber-600" />}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Vazgeç
          </button>
          <button
            type="submit"
            form="asset-return-form"
            className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>İadeyi Onayla ve Kaydet</span>
          </button>
        </div>
      }
    >
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <form id="asset-return-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Target Asset Summary Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-bold text-slate-900 text-sm block">
                  {asset.assetName}
                </span>
                <span className="text-[11px] text-slate-500">
                  {asset.brand} {asset.model} {asset.serialNumber ? `• Seri No: ${asset.serialNumber}` : ""}
                </span>
              </div>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 rounded font-mono font-bold text-[10px]">
                {asset.barcodeNumber || "ZİMMET"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/70 text-[11px]">
              <div>
                <span className="text-slate-500">Zimmetli Personel:</span>
                <p className="font-semibold text-slate-800">
                  {asset.employeeName} {asset.employeeDepartment ? `(${asset.employeeDepartment})` : ""}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Teslim Tarihi & Durumu:</span>
                <p className="font-semibold text-slate-800">
                  {asset.assignedDate} • {asset.conditionOnDelivery === "new" ? "Sıfır" : asset.conditionOnDelivery === "excellent" ? "Çok İyi" : "İyi"}
                </p>
              </div>
            </div>
          </div>

          {/* Tarih ve Teslim Alan Yetkili */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* İade Tarihi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                İade / Teslim Alma Tarihi *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  required
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
                />
              </div>
            </div>

            {/* İadeyi Teslim Alan Yetkili */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Teslim Alan Yetkili / İK Sorumlusu *
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={returnReceivedBy}
                  onChange={(e) => setReturnReceivedBy(e.target.value)}
                  placeholder="İsim veya Departman Yetkilisi"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                />
              </div>
            </div>
          </div>

          {/* Araç İade Kilometresi ve Yakıt Bilgisi */}
          {asset.category === "vehicle" && (
            <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3">
              <div className="font-bold text-xs text-blue-900 flex items-center">
                <Car className="w-4 h-4 mr-1.5 text-blue-700" />
                Araç İade Ekspertiz & Kilometre Kaydı
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    İade Anındaki Güncel Kilometre (KM) *
                  </label>
                  <input
                    type="number"
                    required
                    min={asset.vehicleDetails?.currentKm || 0}
                    value={returnKm}
                    onChange={(e) =>
                      setReturnKm(e.target.value ? Number(e.target.value) : "")
                    }
                    placeholder={`Teslim KM: ${asset.vehicleDetails?.currentKm || 0}`}
                    className="w-full px-3 py-2 border border-blue-300 bg-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-bold text-slate-900"
                  />
                  <p className="text-[10px] text-blue-700 mt-1">
                    Teslim anında:{" "}
                    <strong>
                      {asset.vehicleDetails?.currentKm?.toLocaleString("tr-TR") || 0} KM
                    </strong>{" "}
                    idi.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center">
                    <Fuel className="w-3.5 h-3.5 mr-1 text-slate-500" />
                    İade Yakıt Depo Seviyesi
                  </label>
                  <select
                    value={fuelLevelOnReturn}
                    onChange={(e) => setFuelLevelOnReturn(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-300 bg-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Dolu (%100)">Dolu (%100)</option>
                    <option value="3/4 Depo (%75)">3/4 Depo (%75)</option>
                    <option value="Yarım Depo (%50)">Yarım Depo (%50)</option>
                    <option value="1/4 Depo (%25)">1/4 Depo (%25)</option>
                    <option value="Çeyrek Altı / Rezerv">Çeyrek Altı / Rezerv</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* İade Anındaki Kondisyon / Durum */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              İade Alınan Fiziki Durum (Kondisyon) *
            </label>
            <select
              value={conditionOnReturn}
              onChange={(e) => setConditionOnReturn(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-semibold text-slate-800"
            >
              <option value="new">Kusursuz / Sıfır Ayarında (Hasarsız)</option>
              <option value="excellent">Çok İyi / Sorunsuz & Temiz</option>
              <option value="good">İyi / Olağan Kullanım & Aşınma İzleri</option>
              <option value="fair">Orta / Kozmetik Çizik & Yıpranma Mevcut</option>
              <option value="damaged">Hasarlı / Servis, Onarım veya Parça Değişimi Gerekli</option>
              <option value="scrapped">Kullanılamaz / Hurda / Zayi</option>
            </select>
          </div>

          {/* Teslim Edilmiş Aksesuarların İade Kontrolü */}
          {initialAccessories.length > 0 && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center">
                  <CheckSquare className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Teslim Edilen Aksesuarların İade Durumu
                </span>
                <span className="text-[10px] text-slate-500">
                  {selectedReturnedAccessories.length} / {initialAccessories.length} eksiksiz
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {initialAccessories.map((acc, idx) => {
                  const isChecked = selectedReturnedAccessories.includes(acc);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleAccessory(acc)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer text-left ${
                        isChecked
                          ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                          : "bg-red-50 border-red-200 text-red-700 line-through opacity-70"
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      )}
                      <span className="truncate">{acc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* İade Notu ve Hızlı Şablonlar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                İade Açıklaması & Durum Tespit Notu
              </label>
              <span className="text-[10px] text-slate-400">
                Tutanak üzerine işlenecektir
              </span>
            </div>
            <textarea
              rows={3}
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              placeholder="Örn: Cihaz sorunsuz, kutusu ve tüm aksesuarlarıyla birlikte eksiksiz teslim alındı. Şirket hesaplarından çıkış yapıldı."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
            />

            {/* Hızlı Not Şablonları */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400 self-center mr-1">
                Hızlı Not:
              </span>
              {[
                "Eksiksiz ve hasarsız teslim alındı.",
                "Şirket hesapları ve şifreler sıfırlandı.",
                "Kozmetik çizikler mevcut, çalışır durumda.",
                "Yedek anahtar ve ruhsat teslim edildi.",
                "Tüm aksesuarlar tam.",
              ].map((template, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setQuickNote(template)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-[10px] transition-colors cursor-pointer"
                >
                  + {template}
                </button>
              ))}
            </div>
          </div>

          {/* Bilgilendirme Notu */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">İade İşlemi Sonucu:</p>
              <p className="text-amber-700 mt-0.5">
                Demirbaşın durumu <strong>"İade Alındı"</strong> olarak güncellenecek, personel zimmetinden düşülecek ve resmi <strong>İade & İbra Tutanağı</strong> tanzim edilebilecektir.
              </p>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Vazgeç
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 rounded-xl shadow-md transition-all cursor-pointer flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>İadeyi Onayla ve Kaydet</span>
            </button>
          </div>
        </form>
      </div>
    </DetailPageLayout>
  );
};
