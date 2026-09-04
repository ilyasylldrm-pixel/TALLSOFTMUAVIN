import React, { useState } from "react";
import {
  ShieldCheck,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Thermometer,
  Clock,
  Printer,
  Trash2,
  FileCheck,
} from "lucide-react";
import { FoodWitnessSample } from "../../../types";

interface FoodSamplesViewProps {
  samples: FoodWitnessSample[];
  onOpenNewSampleModal: () => void;
  onDisposeSample: (sampleId: string) => void;
}

export const FoodSamplesView: React.FC<FoodSamplesViewProps> = ({
  samples,
  onOpenNewSampleModal,
  onDisposeSample,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredSamples = samples.filter((s) => {
    const matchesSearch =
      s.dishName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.sampleNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.takenBy.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Üst Başlık & Buton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <span>Yasal 72 Saatlik Gıda Şahit Numune Defteri</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Türk Gıda Kodeksi mevzuatına uygun olarak her partiden alınan 250 gr steril şahit numuneler, saklama dolap dereceleri ve imha kayıtları.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenNewSampleModal}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Şahit Numune Kaydet</span>
          </button>
        </div>
      </div>

      {/* Arama ve Filtreler */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Yemek adı, numune protokol no veya gıda mühendisi ara..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              filterStatus === "all"
                ? "bg-purple-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Tüm Kayıtlar ({samples.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("retained")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              filterStatus === "retained"
                ? "bg-purple-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Dolapta Saklananlar ({samples.filter((s) => s.status === "retained").length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("disposed")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              filterStatus === "disposed"
                ? "bg-purple-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Süresi Dolup İmha Edilenler
          </button>
        </div>
      </div>

      {/* Şahit Numune Tablosu */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-2xs uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Protokol No</th>
                <th className="py-3 px-4">Tarih / Saat</th>
                <th className="py-3 px-4">Yemek Adı</th>
                <th className="py-3 px-4">Alınan Sıcaklık (°C)</th>
                <th className="py-3 px-4">Dolap Sıcaklığı</th>
                <th className="py-3 px-4">Numuneyi Alan Yetkili</th>
                <th className="py-3 px-4">Yasal İmha Tarihi</th>
                <th className="py-3 px-4 text-center">Durum</th>
                <th className="py-3 px-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSamples.map((sample) => {
                const isRetained = sample.status === "retained";

                return (
                  <tr key={sample.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-xs">
                      {sample.sampleNo}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      <div>{sample.date}</div>
                      <span className="text-2xs text-slate-400">{sample.takenAtTime} ({sample.mealType === "lunch" ? "Öğle" : "Akşam"})</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {sample.dishName}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-orange-700 font-mono text-xs">
                      +{sample.sampleTempCelsius}°C
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-blue-700 font-mono text-xs">
                      +{sample.storageTempCelsius}°C (Dolap 1)
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 text-xs">
                      {sample.takenBy}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs font-medium">
                      {sample.disposeDate} (72 Saat)
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {isRetained ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          <Clock className="w-3 h-3" />
                          <span>Dolapta Saklanıyor</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <CheckCircle2 className="w-3 h-3 text-slate-500" />
                          <span>İmha Tutanağı İmzalandı</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isRetained ? (
                        <button
                          type="button"
                          onClick={() => onDisposeSample(sample.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-2xs transition-colors cursor-pointer"
                          title="72 saat doldu, imha edildi olarak kaydet"
                        >
                          İmha Et
                        </button>
                      ) : (
                        <span className="text-2xs text-slate-400 font-mono">İmha Tamam</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredSamples.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    Aranan kritere uygun şahit numune kaydı bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
