import React, { useState } from "react";
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  Building2,
  Share2,
  Printer,
  ChevronRight,
  PackageCheck,
  AlertCircle,
} from "lucide-react";
import { FoodDispatchDelivery } from "../../../types";

interface FoodDispatchViewProps {
  dispatches: FoodDispatchDelivery[];
  onOpenNewDispatchModal: () => void;
  onUpdateDeliveryStatus: (dispatchId: string, deliveryIndex: number, newStatus: "delivered" | "on_the_way") => void;
  onPrintDispatchSlip: (dispatch: FoodDispatchDelivery) => void;
}

export const FoodDispatchView: React.FC<FoodDispatchViewProps> = ({
  dispatches,
  onOpenNewDispatchModal,
  onUpdateDeliveryStatus,
  onPrintDispatchSlip,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSendWhatsApp = (d: FoodDispatchDelivery, contactName: string, phone?: string, estTime?: string) => {
    const text =
      `🚚 *YEMEK SEVKİYAT BİLGİLENDİRMESİ*\n` +
      `Sayın Yetkili (${contactName}),\n` +
      `Bugünkü sıcak öğle/akşam yemeği sevkiyatınız yola çıkmıştır.\n` +
      `--------------------------------\n` +
      `🚐 *Araç Plaka:* ${d.vehiclePlate}\n` +
      `👨‍✈️ *Kaptan / Şoför:* ${d.driverName} (${d.driverPhone})\n` +
      `⏱️ *Tahmini Teslim Saati:* ${estTime || "11:15"}\n` +
      `--------------------------------\n` +
      `Yemeklerinizi termobox sıcak kapalı haznelerde teslim alabilirsiniz.\n` +
      `Afiyet olsun! (Yemek Fabrikası & Catering)`;

    const cleanPhone = phone ? phone.replace(/[^0-9]/g, "") : "";
    const phoneParam = cleanPhone ? `phone=${cleanPhone}&` : "";
    window.open(`https://api.whatsapp.com/send?${phoneParam}text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Üst Başlık & Buton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-600" />
            <span>Sevkiyat, Termobox & Araç Dağıtım Takibi</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Şantiyelere ve fabrikalara gönderilen termobox seferleri, araç plakaları, teslim irsaliyeleri ve canlı varış saatleri.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenNewDispatchModal}
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Sevkiyat Seferi Oluştur</span>
          </button>
        </div>
      </div>

      {/* Dağıtım Seferleri Listesi */}
      <div className="space-y-4">
        {dispatches.map((dispatch) => {
          const deliveries = dispatch.deliveries || [];
          const totalPortionsInDispatch = deliveries.reduce((sum, d) => sum + d.portionCount, 0);
          const totalTermoboxesInDispatch = deliveries.reduce((sum, d) => sum + (d.termoboxCount || 0), 0);

          const isAllDelivered = deliveries.length > 0 && deliveries.every((d) => d.status === "delivered");

          return (
            <div
              key={dispatch.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-blue-300 hover:shadow-sm transition-all space-y-4"
            >
              {/* Sefer Başlığı */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{dispatch.dispatchNo}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-2xs font-semibold border ${
                          isAllDelivered
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {isAllDelivered ? "Tüm Noktalar Teslim Edildi" : "Dağıtımda (Yolda)"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {dispatch.date} • {dispatch.mealType === "lunch" ? "Öğle Seferi" : "Akşam Seferi"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                    Araç: <strong className="text-slate-900">{dispatch.vehiclePlate}</strong>
                  </div>
                  <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                    Şoför: <strong className="text-slate-900">{dispatch.driverName}</strong> ({dispatch.driverPhone})
                  </div>
                  <button
                    type="button"
                    onClick={() => onPrintDispatchSlip(dispatch)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                    title="Sevkiyat Teslim Fişi Yazdır"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Teslim Noktaları Kartları */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(dispatch.deliveries || []).map((del, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border text-xs space-y-2.5 transition-all ${
                      del.status === "delivered"
                        ? "bg-emerald-50/30 border-emerald-200"
                        : "bg-slate-50/70 border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-600 shrink-0" />
                        <span className="font-bold text-slate-900 text-sm">{del.contactName}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-2xs font-semibold border ${
                          del.status === "delivered"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-amber-100 text-amber-800 border-amber-300"
                        }`}
                      >
                        {del.status === "delivered" ? "Teslim Edildi" : "Yolda"}
                      </span>
                    </div>

                    <p className="text-slate-500 text-2xs line-clamp-1">📍 {del.address}</p>

                    <div className="grid grid-cols-3 gap-2 py-2 bg-white/70 rounded-lg border border-slate-200/80 text-center">
                      <div>
                        <span className="text-2xs text-slate-400 block">Porsiyon</span>
                        <strong className="text-slate-900">{del.portionCount} Por.</strong>
                      </div>
                      <div>
                        <span className="text-2xs text-slate-400 block">Termobox</span>
                        <strong className="text-amber-800">{del.termoboxCount || 0} Adet</strong>
                      </div>
                      <div>
                        <span className="text-2xs text-slate-400 block">Tahmini Varış</span>
                        <strong className="text-slate-800">{del.estimatedArrivalTime || "11:15"}</strong>
                      </div>
                    </div>

                    {del.deliveryNoteNo && (
                      <div className="text-2xs text-slate-500 flex justify-between">
                        <span>İrsaliye No: <strong>{del.deliveryNoteNo}</strong></span>
                        {del.receivedBy && <span>Teslim Alan: <strong>{del.receivedBy}</strong></span>}
                      </div>
                    )}

                    {/* Aksiyon Butonları */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => handleSendWhatsApp(dispatch, del.contactName, del.contactPhone, del.estimatedArrivalTime)}
                        className="text-2xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>WhatsApp ile Bilgi Gönder</span>
                      </button>

                      {del.status !== "delivered" ? (
                        <button
                          type="button"
                          onClick={() => onUpdateDeliveryStatus(dispatch.id, idx, "delivered")}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-2xs flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Teslim Alındı İşaretle</span>
                        </button>
                      ) : (
                        <span className="text-2xs text-emerald-700 font-semibold flex items-center gap-1">
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>{del.actualDeliveryTime || "11:05"} Teslim Edildi</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
