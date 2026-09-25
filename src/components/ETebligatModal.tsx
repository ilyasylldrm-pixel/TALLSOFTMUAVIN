import React, { useState } from "react";
import { ETebligatItem, CompanySettings } from "../types";
import { formatETebligatWhatsAppMessage } from "../utils/whatsappTemplates";
import { UniversalWhatsAppModal } from "./common/UniversalWhatsAppModal";
import { DetailPageLayout } from "./common/DetailPageLayout";
import { useDetailNavigation } from "../hooks/useDetailNavigation";
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
  Zap,
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
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  const tebligatNav = useDetailNavigation({
    moduleKey: "e-tebligat",
    initialMode: "detail",
    initialItem: tebligat,
  });

  const handleBack = () => {
    tebligatNav.backToList();
    onClose();
  };

  if (!isOpen || !tebligat) return null;

  const isGib = tebligat.authority === "GIB";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-100">
      <DetailPageLayout
        title={tebligat.documentTitle}
        subtitle={`${isGib ? "Gelir İdaresi Başkanlığı" : "Sosyal Güvenlik Kurumu"} · Barkod: ${tebligat.barcodeNumber} · Tebliğ: ${tebligat.servedDate}`}
        breadcrumbs={[
          { label: "E-İşlemler & Portallar", onClick: handleBack },
          { label: "e-Tebligat", onClick: handleBack },
          { label: `${tebligat.documentTitle} (Mazbata)`, active: true },
        ]}
        onBack={handleBack}
        statusBadge={
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
              tebligat.status === "read"
                ? "bg-emerald-100 text-emerald-800"
                : tebligat.status === "in_process"
                ? "bg-amber-100 text-amber-800"
                : "bg-rose-100 text-rose-800"
            }`}
          >
            {tebligat.status === "read"
              ? "Okundu & Tebliğ Alındı"
              : tebligat.status === "in_process"
              ? "İşlemde"
              : "Okunmadı / Süre İşliyor"}
          </span>
        }
        headerIcon={<Landmark className={`w-5 h-5 ${isGib ? "text-red-600" : "text-emerald-600"}`} />}
        actions={
          <div className="flex items-center gap-2">
            {onStatusChange && (
              <button
                type="button"
                onClick={() => {
                  onStatusChange(tebligat.id, tebligat.status === "read" ? "unread" : "read");
                }}
                className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs text-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{tebligat.status === "read" ? "Okunmadı Yap" : "Okundu Olarak Onayla"}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsWhatsAppOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs text-xs"
              title="Yetkiliye WhatsApp Acil Tebligat Uyarısı Gönder"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-200 fill-emerald-200" />
              <span>WhatsApp</span>
            </button>
            <a
              href={isGib ? "https://dijital.gib.gov.tr" : "https://etebligat.sgk.gov.tr/"}
              target="_blank"
              rel="noreferrer"
              className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs text-xs"
            >
              <span>{isGib ? "GİB Portala Git" : "SGK Portala Git"}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={handleBack}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-1.5 rounded-xl transition-all cursor-pointer text-xs"
            >
              Geri Dön
            </button>
          </div>
        }
      >
        <div className="bg-white rounded-3xl max-w-4xl mx-auto p-6 sm:p-8 space-y-6 border border-slate-200 shadow-sm text-xs">
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
      </DetailPageLayout>

      {/* WhatsApp Share Modal */}
      <UniversalWhatsAppModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        title="WhatsApp ile Acil e-Tebligat Bildirimi"
        documentTypeLabel="Resmi Elektronik Tebligat"
        recipientName={companySettings.eDevletCredentials?.managerName || "Şirket Yetkilisi"}
        recipientPhone={companySettings.eDevletCredentials?.mobileSignaturePhone || companySettings.phone || ""}
        defaultMessage={formatETebligatWhatsAppMessage(tebligat, companySettings)}
        documentFileName={`eTebligat_${tebligat.barcodeNumber || "Mazbata"}.pdf`}
        companySettings={companySettings}
      />
    </div>
  );
};
