import React from "react";
import { ETebligatItem, CompanySettings } from "../types";
import {
  X,
  Building2,
  Calendar,
  Clock,
  Download,
  Printer,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Hash,
  Landmark,
  CheckCircle2,
  ExternalLink,
  Info,
} from "lucide-react";

interface ETebligatModalProps {
  isOpen: boolean;
  onClose: () => void;
  tebligat: ETebligatItem | null;
  companySettings: CompanySettings;
  onStatusChange?: (id: string, newStatus: ETebligatItem["status"]) => void;
}

export const ETebligatModal: React.FC<ETebligatModalProps> = ({
  isOpen,
  onClose,
  tebligat,
  companySettings,
  onStatusChange,
}) => {
  if (!isOpen || !tebligat) return null;

  const isGib = tebligat.authority === "GIB";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div
          className={`p-4 sm:p-5 flex items-center justify-between text-white ${
            isGib
              ? "bg-gradient-to-r from-red-700 via-rose-800 to-slate-900"
              : "bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-md shrink-0">
              <Landmark className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider bg-black/30 px-2.5 py-0.5 rounded-full border border-white/20">
                  {isGib ? "GİB e-Tebligat Mazbatası" : "SGK e-Tebligat Mazbatası"}
                </span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
                  {tebligat.barcodeNumber}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight mt-0.5">
                {tebligat.documentTitle}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {/* Official Document Banner */}
          <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-5 space-y-4 font-sans text-slate-800">
            {/* Header Crest */}
            <div className="text-center pb-3 border-b border-slate-300">
              <div className="font-extrabold text-xs uppercase tracking-widest text-slate-900">
                T.C. {isGib ? "HAZİNE VE MALİYE BAKANLIĞI" : "ÇALIŞMA VE SOSYAL GÜVENLİK BAKANLIĞI"}
              </div>
              <div className="text-[11px] font-bold text-slate-700">
                {isGib ? "GELİR İDARESİ BAŞKANLIĞI" : "SOSYAL GÜVENLİK KURUMU BAŞKANLIĞI"}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                {tebligat.senderUnit}
              </div>
            </div>

            {/* Mazbata Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
              <div className="space-y-1.5">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Muhatap (Mükellef / İşveren)</div>
                <div className="font-extrabold text-slate-900 text-xs">
                  {companySettings.companyTitle || companySettings.companyName}
                </div>
                <div className="text-[11px] text-slate-600 font-mono">
                  VKN/TCKN: <strong>{companySettings.taxNumber}</strong> • Vergi Dairesi: {companySettings.taxOffice}
                </div>
                {tebligat.workplaceName && (
                  <div className="text-[11px] text-emerald-800 font-bold">
                    İlgili İşyeri: {tebligat.workplaceName}
                  </div>
                )}
              </div>

              <div className="space-y-1.5 sm:border-l sm:border-slate-100 sm:pl-3 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Barkod No:</span>
                  <span className="font-bold text-slate-900">{tebligat.barcodeNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Zarf No:</span>
                  <span className="font-bold text-slate-900">{tebligat.envelopeId || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mazbata No:</span>
                  <span className="font-bold text-slate-900">{tebligat.receiptNumber || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gönderim Tarihi:</span>
                  <span className="font-bold text-slate-900">{tebligat.sentDate}</span>
                </div>
                <div className="flex justify-between text-rose-700 font-bold">
                  <span>Tebellüğ Tarihi:</span>
                  <span>{tebligat.deliveryDate} (Yasal 5. Gün)</span>
                </div>
              </div>
            </div>

            {/* Legal Notice Box */}
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start gap-2.5 text-amber-900 text-[11px]">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Yasal Tebellüğ ve Hak Düşürücü Süre Uyarısı:</strong> Elektronik Tebligat Yönetmeliği uyarınca evrak muhatabın elektronik adresine ulaştığı tarihi izleyen <strong>beşinci günün sonunda</strong> tebliğ edilmiş sayılır. Yasal itiraz ve başvuru son tarihi: <strong className="text-rose-700 font-bold font-mono">{tebligat.legalDeadlineDate || "Tebellüğden itibaren 30 gün"}</strong>
              </div>
            </div>

            {/* Content Summary */}
            <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-600" />
                Tebligatın Konusu ve İçerik Açıklaması
              </div>
              <p className="text-slate-700 text-xs leading-relaxed">
                {tebligat.contentSummary || "Resmi evrak içeriği ilgili portal üzerinden görüntülenebilir."}
              </p>

              {tebligat.amount !== undefined && tebligat.amount > 0 && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-xs">Tebliğ Edilen Tutar / Borç:</span>
                  <span className="font-mono text-base font-black text-rose-700">
                    ₺{tebligat.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

            {/* Notes Section */}
            {tebligat.notes && (
              <div className="bg-blue-50/70 border border-blue-200 p-3 rounded-xl text-blue-900 text-[11px] flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Şirket / Mali Müşavir Notu:</strong> {tebligat.notes}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-2">
            {onStatusChange && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onStatusChange(tebligat.id, tebligat.status === "read" ? "unread" : "read");
                  }}
                  className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {tebligat.status === "read" ? "Okunmadı Olarak İşaretle" : "Okundu Olarak İşaretle"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onStatusChange(tebligat.id, "in_process");
                  }}
                  className="bg-white hover:bg-slate-50 border border-slate-300 text-amber-800 font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs"
                >
                  İşleme Alındı
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={isGib ? "https://dijital.gib.gov.tr" : "https://etebligat.sgk.gov.tr/"}
              target="_blank"
              rel="noreferrer"
              className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span>{isGib ? "GİB Portalda Gör" : "SGK Portalda Gör"}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
