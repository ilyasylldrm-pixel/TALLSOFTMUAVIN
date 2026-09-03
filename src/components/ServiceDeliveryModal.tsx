import React, { useState, useRef } from "react";
import {
  X,
  Printer,
  Receipt,
  MessageCircle,
  FileText,
  Calendar,
  Clock,
  ShieldCheck,
  User,
  Phone,
  MapPin,
  Car,
  Laptop,
  Wrench,
  CheckCircle2,
  FileCheck,
  Send,
  Sparkles,
  Info,
  PenTool,
  RotateCcw,
  Trash2,
  Smartphone,
  Package,
  AlertTriangle,
} from "lucide-react";
import {
  AutoServiceRecord,
  ItServiceRecord,
  ApplianceServiceRecord,
  CompanySettings,
} from "../types";
import { DigitalSignaturePad } from "./DigitalSignaturePad";
import { DetailPageLayout } from "./common/DetailPageLayout";

export type AnyServiceRecord = AutoServiceRecord | ItServiceRecord | ApplianceServiceRecord;

interface ServiceDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceType: "auto" | "it" | "appliance";
  serviceRecord: AnyServiceRecord | null;
  companySettings?: CompanySettings;
  onOpenInvoicing?: (record: AnyServiceRecord) => void;
  onOpenWhatsApp?: (record: AnyServiceRecord) => void;
  onMarkDelivered?: (serviceId: string) => void;
}

export const ServiceDeliveryModal: React.FC<ServiceDeliveryModalProps> = ({
  isOpen,
  onClose,
  serviceType,
  serviceRecord,
  companySettings,
  onOpenInvoicing,
  onOpenWhatsApp,
  onMarkDelivered,
}) => {
  const [deliveryDate, setDeliveryDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [deliveryTime, setDeliveryTime] = useState<string>(
    new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
  );
  const [deliveryNotes, setDeliveryNotes] = useState<string>(
    "Cihaz/Araç fonksiyonel ve güvenlik testlerinden başarıyla geçmiş olup eksiksiz olarak çalışır durumda teslim edilmiştir."
  );
  const [isDeliveredMarked, setIsDeliveredMarked] = useState<boolean>(false);

  // Digital Signature States
  const [customerSignature, setCustomerSignature] = useState<string | null>(null);
  const [customerSignerInfo, setCustomerSignerInfo] = useState<{ name: string; timestamp: string } | null>(null);

  const [technicianSignature, setTechnicianSignature] = useState<string | null>(null);
  const [technicianSignerInfo, setTechnicianSignerInfo] = useState<{ name: string; timestamp: string } | null>(null);

  const [signingRole, setSigningRole] = useState<"customer" | "technician" | null>(null);


  if (!isOpen || !serviceRecord) return null;

  const companyName = companySettings?.companyName || "MUAVİN TEKNİK SERVİS YÖNETİMİ";
  const companyPhone = companySettings?.phone || "0850 300 00 00";
  const companyEmail = companySettings?.email || "servis@muavinmuhasebe.com";
  const companyAddress = companySettings?.address || "Merkez Mah. Sanayi Cad. No:12";
  const companyTaxNumber = companySettings?.taxNumber || "1234567890";
  const companyTaxOffice = companySettings?.taxOffice || "Merkez";

  // Document Title by Service Type
  const getDocumentTitle = () => {
    if (serviceType === "auto") return "ARAÇ TESLİM VE İŞ BİTİM TUTANAĞI";
    if (serviceType === "it") return "BİLİŞİM CİHAZ & DONANIM TESLİM TUTANAĞI";
    return "EV ALETİ & KLİMA ÜRÜN TESLİM TUTANAĞI";
  };

  // Specific vehicle / device labels
  const renderItemDetails = () => {
    if (serviceType === "auto") {
      const auto = serviceRecord as AutoServiceRecord;
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 font-bold block">Plaka:</span>
            <span className="font-mono font-black text-slate-900 text-sm">{auto.plateNumber}</span>
          </div>
          <div>
            <span className="text-slate-500 font-bold block">Araç Marka / Model:</span>
            <span className="font-bold text-slate-800">{auto.brand} {auto.model} ({auto.modelYear})</span>
          </div>
          <div>
            <span className="text-slate-500 font-bold block">Şasi No (VIN):</span>
            <span className="font-mono text-slate-700">{auto.chassisNumber || "Belirtilmedi"}</span>
          </div>
          <div>
            <span className="text-slate-500 font-bold block">Giriş / Teslim KM:</span>
            <span className="font-bold text-purple-900">{auto.currentKm?.toLocaleString("tr-TR")} KM</span>
          </div>
        </div>
      );
    }

    if (serviceType === "it") {
      const it = serviceRecord as ItServiceRecord;
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 font-bold block">Cihaz Türü:</span>
            <span className="font-bold text-slate-900 capitalize">{it.deviceType}</span>
          </div>
          <div>
            <span className="text-slate-500 font-bold block">Marka & Model:</span>
            <span className="font-bold text-slate-800">{it.brand} {it.model}</span>
          </div>
          <div>
            <span className="text-slate-500 font-bold block">Seri No (S/N):</span>
            <span className="font-mono font-bold text-purple-950">{it.serialNumber || "Yok"}</span>
          </div>
          <div>
            <span className="text-slate-500 font-bold block">Teslim Edilen Aksesuarlar:</span>
            <span className="text-slate-700">{it.accessoriesIncluded || "Yalnız Cihaz"}</span>
          </div>
        </div>
      );
    }

    const app = serviceRecord as ApplianceServiceRecord;
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
        <div>
          <span className="text-slate-500 font-bold block">Kategori & Tür:</span>
          <span className="font-bold text-slate-900 capitalize">{app.category} / {app.deviceType}</span>
        </div>
        <div>
          <span className="text-slate-500 font-bold block">Cihaz Marka & Model:</span>
          <span className="font-bold text-slate-800">{app.brand} {app.model}</span>
        </div>
        <div>
          <span className="text-slate-500 font-bold block">Seri No:</span>
          <span className="font-mono text-slate-700">{app.serialNumber || "Belirtilmedi"}</span>
        </div>
        <div>
          <span className="text-slate-500 font-bold block">Servis Lokasyonu:</span>
          <span className="font-bold text-slate-800">{app.serviceLocation === "on_site" ? "Saha / Adreste Servis" : "Servis Atölyesi"}</span>
        </div>
      </div>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleMarkDeliveredClick = () => {
    if (onMarkDelivered && serviceRecord.id) {
      onMarkDelivered(serviceRecord.id);
      setIsDeliveredMarked(true);
    }
  };

  const complaintText =
    ("customerComplaint" in serviceRecord && serviceRecord.customerComplaint) ||
    ("customerProblemDescription" in serviceRecord && serviceRecord.customerProblemDescription) ||
    "Periyodik bakım ve kontrol";

  const diagnosisReport =
    ("workshopDiagnosis" in serviceRecord && serviceRecord.workshopDiagnosis) ||
    ("technicianReport" in serviceRecord && serviceRecord.technicianReport) ||
    "Onarım, test ve kontrol işlemleri eksiksiz tamamlanmıştır.";

  const hasInvoice = Boolean(serviceRecord.invoiceNumber || serviceRecord.invoiceId);
  const invoiceNo = serviceRecord.invoiceNumber || serviceRecord.invoiceId || "Henüz Kesilmedi";

  return (
    <DetailPageLayout
      title={`Ürün & Servis Teslim Tutanağı - ${serviceRecord.serviceNo}`}
      subtitle={`${serviceRecord.contactName} • Teslimat Tarihi: ${deliveryDate} ${deliveryTime}`}
      breadcrumbs={[
        { label: serviceType === "auto" ? "Oto Servis" : serviceType === "it" ? "BT Servis" : "Beyaz Eşya Servis", onClick: onClose },
        { label: `Teslim Tutanağı #${serviceRecord.serviceNo}`, active: true },
      ]}
      onBack={onClose}
      statusBadge={
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 text-xs font-bold rounded-xl border bg-purple-50 text-purple-700 border-purple-200">
            {isDeliveredMarked ? "Teslim Edildi" : "Teslim Aşamasında"}
          </span>
          {hasInvoice && (
            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5" />
              <span>{invoiceNo}</span>
            </span>
          )}
        </div>
      }
      headerIcon={<FileText className="w-5 h-5 text-purple-600" />}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {onOpenInvoicing && (
            <button
              type="button"
              onClick={() => onOpenInvoicing(serviceRecord)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-purple-200" />
              <span>{hasInvoice ? "Faturayı Gör" : "Fatura Kes"}</span>
            </button>
          )}

          {onOpenWhatsApp && (
            <button
              type="button"
              onClick={() => onOpenWhatsApp(serviceRecord)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-200" />
              <span>WhatsApp</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shadow transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>Yazdır / PDF</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="border border-slate-200 text-slate-600 hover:bg-slate-100 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95"
          >
            Geri Dön
          </button>
        </div>
      }
    >
      <div className="max-w-4xl mx-auto space-y-4">

        {/* QUICK ACTIONS BANNER (Screen Only) */}
        <div className="px-6 py-2.5 bg-purple-50 border-b border-purple-100 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 print:hidden">
          <div className="flex items-center gap-2 text-purple-950 font-bold">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Hızlı İşlemler:</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Ekranda İmza Al (Tablet / Dokunmatik) */}
            <button
              type="button"
              onClick={() => setSigningRole("customer")}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              title="Tablet veya Mobil Cihazda Müşteri İmzası Al"
            >
              <PenTool className="w-3.5 h-3.5 text-purple-300" />
              <span>{customerSignature ? "Müşteri İmzası Alındı ✓" : "Ekranda İmza Al (Tablet)"}</span>
            </button>

            {/* WhatsApp Gönder */}
            {onOpenWhatsApp && (
              <button
                type="button"
                onClick={() => onOpenWhatsApp(serviceRecord)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                title="Müşteriye WhatsApp Teslim Mesajı Gönder"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp İle Bildir</span>
              </button>
            )}

            {/* Faturalandır */}
            {onOpenInvoicing && !hasInvoice && (
              <button
                type="button"
                onClick={() => onOpenInvoicing(serviceRecord)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                title="İş Emrini Faturalandır & Satış Faturası Kes"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Faturaya Gönder</span>
              </button>
            )}

            {/* Durumu Teslim Edildi Yap */}
            {onMarkDelivered && serviceRecord.status !== "delivered" && serviceRecord.status !== "ready_delivered" && (
              <button
                type="button"
                onClick={handleMarkDeliveredClick}
                disabled={isDeliveredMarked}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isDeliveredMarked ? "Durum: Teslim Edildi ✓" : "Durumu 'Teslim Edildi' Yap"}</span>
              </button>
            )}
          </div>
        </div>

        {/* PRINTABLE DOCUMENT BODY */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-5 flex-1 bg-white text-slate-900 font-sans printable-content">
          {/* FİRMA VE BELGE BAŞLIĞI */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-900 pb-4 gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                {companyName}
              </h2>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">
                {companyAddress}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Tel: {companyPhone} • E-Posta: {companyEmail} • Vergi D.: {companyTaxOffice} ({companyTaxNumber})
              </p>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <div className="inline-block px-3 py-1 rounded-lg bg-slate-100 border border-slate-300 font-mono font-black text-sm text-purple-950">
                SERİ NO: {serviceRecord.serviceNo}
              </div>
              <div className="text-xs font-bold text-slate-600 mt-1.5 flex items-center sm:justify-end gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Kabul: {serviceRecord.entryDate} {serviceRecord.entryTime || ""}</span>
              </div>
              <div className="text-xs font-bold text-purple-900 flex items-center sm:justify-end gap-1">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                <span>Teslim: {deliveryDate} {deliveryTime}</span>
              </div>
            </div>
          </div>

          {/* BELGE BAŞLIĞI BANDI */}
          <div className="bg-slate-100 py-2.5 px-4 rounded-xl font-black text-slate-900 text-center uppercase tracking-wider text-sm border border-slate-300 shadow-2xs">
            {getDocumentTitle()}
          </div>

          {/* MÜŞTERİ & CARİ BİLGİLERİ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-purple-900 font-black uppercase pb-1 border-b border-slate-200">
                <User className="w-3.5 h-3.5" />
                <span>Müşteri / Cari Hesap Bilgileri</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <span className="text-slate-500 font-medium">Cari Ünvan:</span>
                <span className="col-span-2 font-bold text-slate-900">{serviceRecord.contactName}</span>
                <span className="text-slate-500 font-medium">İletişim Tel:</span>
                <span className="col-span-2 font-bold text-slate-900">{serviceRecord.contactPhone}</span>
                <span className="text-slate-500 font-medium">E-Posta:</span>
                <span className="col-span-2 text-slate-700">{serviceRecord.contactEmail || "-"}</span>
                <span className="text-slate-500 font-medium">Fatura Durumu:</span>
                <span className="col-span-2 font-bold text-slate-900">
                  {hasInvoice ? (
                    <span className="text-emerald-700">Fatura Kesildi ({invoiceNo})</span>
                  ) : (
                    <span className="text-amber-800">Fatura Beklemede</span>
                  )}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-purple-900 font-black uppercase pb-1 border-b border-slate-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Servis & Danışman Bilgileri</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <span className="text-slate-500 font-medium">Sorumlu Danışman:</span>
                <span className="col-span-2 font-bold text-slate-900">{serviceRecord.assignedTechnician || "Yetkili Servis"}</span>
                <span className="text-slate-500 font-medium">Servis Türü:</span>
                <span className="col-span-2 capitalize font-semibold text-slate-800">
                  {serviceType === "auto" ? "Otomotiv Bakım & Onarım" : serviceType === "it" ? "Bilişim Donanım & Laboratuvar" : "Beyaz Eşya & İklimlendirme"}
                </span>
                <span className="text-slate-500 font-medium">Teslim Durumu:</span>
                <span className="col-span-2 font-bold text-emerald-800">
                  Eksiksiz & Test Edilmiş Olarak Teslime Hazır
                </span>
              </div>
            </div>
          </div>

          {/* ARAÇ / CİHAZ TEKNİK DETAYLARI */}
          <div>
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
              Teslim Edilen Araç / Cihaz Özellikleri
            </h4>
            {renderItemDetails()}
          </div>

          {/* TESLİM ALINAN AKSESUARLAR & FİZİKSEL DURUM / KUSUR BİLGİSİ (YENİ) */}
          {(() => {
            const accText =
              ("accessoriesReceived" in serviceRecord && serviceRecord.accessoriesReceived) ||
              ("accessoriesIncluded" in serviceRecord && serviceRecord.accessoriesIncluded) ||
              ("valuableItemsInCar" in serviceRecord && serviceRecord.valuableItemsInCar) ||
              "";
            
            const condText =
              ("damagePhysicalCondition" in serviceRecord && serviceRecord.damagePhysicalCondition) ||
              "";

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Beraberinde Getirilen / Teslim Alınanlar */}
                <div className="bg-purple-50/50 p-3.5 rounded-2xl border border-purple-200/80 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-950 font-black uppercase pb-1 border-b border-purple-200">
                    <Package className="w-3.5 h-3.5 text-purple-700" />
                    <span>Beraberinde Teslim Alınan Aksesuar & Eşyalar</span>
                  </div>
                  <p className="font-semibold text-slate-900 mt-1 leading-relaxed">
                    {accText ? accText : "Müşteri beraberinde teslim edilen harici aksesuar / parça bulunmamaktadır (Yalnız Cihaz/Araç)."}
                  </p>
                </div>

                {/* Fiziksel Durum, Çizik, Deformasyon & Kusurlar */}
                <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200/80 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-950 font-black uppercase pb-1 border-b border-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                    <span>Giriş / Teslim Alma Fiziksel Durumu & Deformasyon</span>
                  </div>
                  <p className="font-semibold text-slate-900 mt-1 leading-relaxed">
                    {condText ? (
                      <span className="text-amber-950 font-bold">{condText}</span>
                    ) : (
                      <span className="text-emerald-800 font-bold">Kayıt anında tespit edilen belirgin çizik, kırık veya deformasyon bulunmamaktadır (Kusursuz / Standart Durumda).</span>
                    )}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* ŞİKAYET VE YAPILAN TEKNİK İŞLEMLER */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div>
              <span className="font-extrabold text-slate-500 uppercase text-[10px] block">Müşteri Bildirimi & Şikayet:</span>
              <p className="font-medium text-slate-900 mt-0.5">{complaintText}</p>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <span className="font-extrabold text-purple-950 uppercase text-[10px] block">Uygulanan Onarım, Bakım ve Test Sonucu:</span>
              <p className="font-semibold text-slate-900 mt-0.5">{diagnosisReport}</p>
            </div>
          </div>

          {/* PARÇA VE İŞÇİLİK TABLOSU */}
          <div>
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
              Değiştirilen Yedek Parçalar & Uygulanan İşçilik Hizmetleri
            </h4>
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-black">
                    <th className="py-2.5 px-3.5">İşlem / Parça Açıklaması</th>
                    <th className="py-2.5 px-3">Tür</th>
                    <th className="py-2.5 px-3 text-right">Miktar</th>
                    <th className="py-2.5 px-3 text-right">Birim Fiyat</th>
                    <th className="py-2.5 px-3 text-right">KDV %</th>
                    <th className="py-2.5 px-3.5 text-right">Toplam Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {"parts" in serviceRecord && Array.isArray(serviceRecord.parts) && serviceRecord.parts.map((p: any) => (
                    <tr key={p.id}>
                      <td className="py-2 px-3.5 font-bold text-slate-900">{p.partName}</td>
                      <td className="py-2 px-3 text-slate-500 capitalize">{p.partType || p.category || "Yedek Parça"}</td>
                      <td className="py-2 px-3 text-right font-mono">{p.quantity} {p.unit || "Adet"}</td>
                      <td className="py-2 px-3 text-right font-mono">₺{(p.unitPrice || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
                      <td className="py-2 px-3 text-right font-mono">%{p.vatRate || 20}</td>
                      <td className="py-2 px-3.5 text-right font-black text-slate-900 font-mono">
                        ₺{(p.total || (p.quantity || 1) * (p.unitPrice || 0)).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  {"labors" in serviceRecord && Array.isArray(serviceRecord.labors) && serviceRecord.labors.map((l: any) => (
                    <tr key={l.id}>
                      <td className="py-2 px-3.5 font-bold text-purple-950">İşçilik: {l.operationName}</td>
                      <td className="py-2 px-3 text-slate-500">Teknik Hizmet</td>
                      <td className="py-2 px-3 text-right font-mono">{l.hours} Saat</td>
                      <td className="py-2 px-3 text-right font-mono">₺{(l.hourlyRate || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
                      <td className="py-2 px-3 text-right font-mono">%{l.vatRate || 20}</td>
                      <td className="py-2 px-3.5 text-right font-black text-purple-950 font-mono">
                        ₺{(l.total || (l.hours || 1) * (l.hourlyRate || 0)).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TOPLAMLAR */}
          <div className="flex justify-end pt-1">
            <div className="w-72 space-y-1.5 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex justify-between font-semibold text-slate-600">
                <span>Yedek Parça / Malzeme:</span>
                <span className="font-mono">₺{(serviceRecord.partsTotal || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-600">
                <span>İşçilik & Laboratuvar:</span>
                <span className="font-mono">₺{(serviceRecord.laborTotal || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-600">
                <span>Hesaplanan KDV (%20):</span>
                <span className="font-mono">₺{(serviceRecord.totalVat || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-purple-950 pt-2 border-t border-slate-300">
                <span>GENEL TOPLAM:</span>
                <span className="font-mono">₺{(serviceRecord.grandTotal || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* GARANTİ VE TESLİM TAAHHÜTNAMESİ */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <div className="font-black text-slate-800 uppercase flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Garanti ve Teslim Alma Hükümleri:</span>
            </div>
            <p>
              1. İşbu tutanakta listelenen onarım/bakım işlemleri ve değişen orijinal yedek parçalar firmamız tarafından <strong>1 (bir) yıl</strong> süreyle servis ve montaj garantisi kapsamındadır.
            </p>
            <p>
              2. Müşteri/kullanıcı kaynaklı darbe, düşme, sıvı teması, elektrik şebeke voltaj dalgalanmaları veya yetkisiz 3. şahıslar tarafından yapılan müdahaleler garanti kapsamı dışındadır.
            </p>
            <p className="font-bold text-slate-900 pt-1">
              3. Müşteri Beyanı: Yukarıda teknik bilgileri, değişen parçaları ve işçilik dökümü belirtilen ürünümü/aracımı; tüm kontrolleri yapılmış, çalışır vaziyette, sağlam ve eksiksiz olarak teslim aldım.
            </p>
          </div>

          {/* İMZA VE ONAY ALANLARI (DİJİTAL İMZA ENTEGRELİ) */}
          <div className="grid grid-cols-2 gap-8 sm:gap-12 pt-6 border-t-2 border-slate-300 text-xs">
            {/* TESLİM EDEN (YETKİLİ) */}
            <div className="text-center flex flex-col items-center justify-between min-h-[140px]">
              <div>
                <p className="font-black text-slate-900">Teslim Eden (Yetkili Servis Danışmanı / Usta)</p>
                <p className="text-slate-500 mt-0.5">{serviceRecord.assignedTechnician || companyName}</p>
              </div>

              <div className="w-full flex flex-col items-center justify-center my-2">
                {technicianSignature ? (
                  <div className="relative group flex flex-col items-center">
                    <img
                      src={technicianSignature}
                      alt="Yetkili İmzası"
                      className="max-h-20 max-w-[200px] object-contain"
                    />
                    {technicianSignerInfo?.timestamp && (
                      <span className="text-[9px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                        E-İmza: {technicianSignerInfo.timestamp}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setTechnicianSignature(null);
                        setTechnicianSignerInfo(null);
                      }}
                      className="absolute -top-2 -right-6 p-1 bg-rose-50 text-rose-600 rounded-full opacity-0 group-hover:opacity-100 hover:bg-rose-100 transition-opacity print:hidden cursor-pointer"
                      title="İmzayı Sil"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-48 my-3 flex flex-col items-center">
                    <div className="border-b border-slate-300 w-full mb-1.5" />
                    <button
                      type="button"
                      onClick={() => setSigningRole("technician")}
                      className="print:hidden inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200 transition-all cursor-pointer"
                    >
                      <PenTool className="w-3 h-3" />
                      <span>Yetkili E-İmza At</span>
                    </button>
                  </div>
                )}
              </div>

              <span className="text-[10px] text-slate-400 font-semibold">Yetkili İmza & Kaşe</span>
            </div>

            {/* TESLİM ALAN (MÜŞTERİ) */}
            <div className="text-center flex flex-col items-center justify-between min-h-[140px]">
              <div>
                <p className="font-black text-slate-900">Teslim Alan (Müşteri / Cari Yetkilisi)</p>
                <p className="text-slate-500 mt-0.5">{serviceRecord.contactName}</p>
              </div>

              <div className="w-full flex flex-col items-center justify-center my-2">
                {customerSignature ? (
                  <div className="relative group flex flex-col items-center">
                    <img
                      src={customerSignature}
                      alt="Müşteri İmzası"
                      className="max-h-20 max-w-[200px] object-contain"
                    />
                    {customerSignerInfo?.timestamp && (
                      <span className="text-[9px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                        E-İmza: {customerSignerInfo.timestamp}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerSignature(null);
                        setCustomerSignerInfo(null);
                      }}
                      className="absolute -top-2 -right-6 p-1 bg-rose-50 text-rose-600 rounded-full opacity-0 group-hover:opacity-100 hover:bg-rose-100 transition-opacity print:hidden cursor-pointer"
                      title="İmzayı Sil"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-48 my-3 flex flex-col items-center">
                    <div className="border-b border-slate-300 w-full mb-1.5" />
                    <button
                      type="button"
                      onClick={() => setSigningRole("customer")}
                      className="print:hidden inline-flex items-center gap-1.5 text-xs font-black text-white bg-purple-700 hover:bg-purple-800 px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-purple-200" />
                      <span>Ekranda İmzalat (Tablet/Mobil)</span>
                    </button>
                  </div>
                )}
              </div>

              <span className="text-[10px] text-slate-400 font-semibold">Müşteri İmzası</span>
            </div>
          </div>
        </div>

        {/* FOOTER (Screen Only) */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Dokunmatik ekrandan alınan dijital imza doğrudan A4 ve PDF çıktısına aktarılır.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
            >
              Geri Dön
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs shadow-md shadow-purple-700/20 active:scale-95 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Tutanağı Yazdır / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* DİJİTAL İMZA MODAL POPUP (TABLET & DOKUNMATİK EKRAN İÇİN) */}
      {signingRole && (
        <DigitalSignaturePad
          isModal={true}
          title={signingRole === "customer" ? "Müşteri / Teslim Alan Dijital İmzası" : "Yetkili Servis Danışmanı İmzası"}
          signerRole={signingRole === "customer" ? "Teslim Alan (Müşteri)" : "Teslim Eden (Yetkili)"}
          signerName={
            signingRole === "customer"
              ? serviceRecord.contactName
              : serviceRecord.assignedTechnician || companyName
          }
          initialSignature={signingRole === "customer" ? customerSignature : technicianSignature}
          onSave={(dataUrl, info) => {
            if (signingRole === "customer") {
              setCustomerSignature(dataUrl);
              if (info) setCustomerSignerInfo(info);
            } else {
              setTechnicianSignature(dataUrl);
              if (info) setTechnicianSignerInfo(info);
            }
            setSigningRole(null);
          }}
          onClose={() => setSigningRole(null)}
        />
      )}
    </DetailPageLayout>
  );
};
