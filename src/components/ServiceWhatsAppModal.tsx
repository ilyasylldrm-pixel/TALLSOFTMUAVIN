import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  MessageCircle,
  Copy,
  Check,
  Send,
  ExternalLink,
  Car,
  Laptop,
  Wrench,
  CheckCircle2,
  Receipt,
  FileCheck,
  Calendar,
  Phone,
  User,
  Sparkles,
  Smartphone,
  Info,
} from "lucide-react";
import { DetailPageLayout } from "./common/DetailPageLayout";
import {
  AutoServiceRecord,
  ItServiceRecord,
  ApplianceServiceRecord,
  CompanySettings,
} from "../types";
import {
  fetchWhatsAppStatus,
  sendWhatsAppTextApi,
  WhatsAppClientStatus,
} from "../services/whatsappClient";

export type AnyServiceRecord = AutoServiceRecord | ItServiceRecord | ApplianceServiceRecord;

export type WhatsAppTemplateType =
  | "completed"
  | "invoiced"
  | "diagnosis_approval"
  | "reception"
  | "custom";

interface ServiceWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceType: "auto" | "it" | "appliance";
  serviceRecord: AnyServiceRecord | null;
  defaultTemplateType?: WhatsAppTemplateType;
  invoiceNumber?: string;
  companySettings?: CompanySettings;
}

export const ServiceWhatsAppModal: React.FC<ServiceWhatsAppModalProps> = ({
  isOpen,
  onClose,
  serviceType,
  serviceRecord,
  defaultTemplateType,
  invoiceNumber,
  companySettings,
}) => {
  const [templateType, setTemplateType] = useState<WhatsAppTemplateType>("completed");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [isWebWhatsApp, setIsWebWhatsApp] = useState<boolean>(false);

  // Derive initial template type based on record state
  useEffect(() => {
    if (!serviceRecord) return;

    if (defaultTemplateType) {
      setTemplateType(defaultTemplateType);
      return;
    }

    if (serviceRecord.invoiceNumber || serviceRecord.invoiceId || invoiceNumber) {
      setTemplateType("invoiced");
    } else if (
      serviceRecord.status === "ready" ||
      serviceRecord.status === "completed" ||
      serviceRecord.status === "ready_delivered" ||
      serviceRecord.status === "delivered"
    ) {
      setTemplateType("completed");
    } else if (serviceRecord.status === "quote_pending") {
      setTemplateType("diagnosis_approval");
    } else {
      setTemplateType("completed");
    }
  }, [serviceRecord, defaultTemplateType, invoiceNumber]);

  // Set initial phone number
  useEffect(() => {
    if (!serviceRecord) return;
    setPhoneNumber(serviceRecord.contactPhone || "");
  }, [serviceRecord]);

  // Extract service specific info
  const serviceDetails = useMemo(() => {
    if (!serviceRecord) return { title: "", itemSummary: "", partsList: "", laborList: "" };

    let title = "";
    let itemSummary = "";
    let partsList = "";
    let laborList = "";

    if (serviceType === "auto") {
      const auto = serviceRecord as AutoServiceRecord;
      title = `${auto.plateNumber} (${auto.brand} ${auto.model})`;
      itemSummary = `Plaka: *${auto.plateNumber}* | Araç: *${auto.brand} ${auto.model} (${auto.modelYear})* | KM: *${auto.currentKm?.toLocaleString("tr-TR")} KM*`;
    } else if (serviceType === "it") {
      const it = serviceRecord as ItServiceRecord;
      title = `${it.brand} ${it.model}`;
      itemSummary = `Cihaz: *${it.brand} ${it.model}* ${it.serialNumber ? `(Seri No: ${it.serialNumber})` : ""}`;
    } else if (serviceType === "appliance") {
      const app = serviceRecord as ApplianceServiceRecord;
      title = `${app.brand} ${app.model}`;
      itemSummary = `Cihaz: *${app.brand} ${app.model}* ${app.serviceLocation === "on_site" ? "(Adreste Servis)" : "(Atölyede Servis)"}`;
    }

    if ("parts" in serviceRecord && Array.isArray(serviceRecord.parts) && serviceRecord.parts.length > 0) {
      partsList = serviceRecord.parts
        .map((p: any) => `• ${p.partName} (${p.quantity} Adet - ₺${((p.quantity || 1) * (p.unitPrice || 0)).toLocaleString("tr-TR", { minimumFractionDigits: 2 })})`)
        .join("\n");
    }

    if ("labors" in serviceRecord && Array.isArray(serviceRecord.labors) && serviceRecord.labors.length > 0) {
      laborList = serviceRecord.labors
        .map((l: any) => `• ${l.operationName} (₺${(l.total || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })})`)
        .join("\n");
    }

    return { title, itemSummary, partsList, laborList };
  }, [serviceRecord, serviceType]);

  // Generate message based on template
  useEffect(() => {
    if (!serviceRecord) return;

    const companyName = companySettings?.companyName || "Teknik Servis Merkezi";
    const companyPhone = companySettings?.phone || "";
    const iban = companySettings?.defaultBankIban || "";
    const bankName = companySettings?.defaultBankName || "";
    const grandTotalStr = `₺${(serviceRecord.grandTotal || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`;
    const effectiveInvoiceNo = invoiceNumber || serviceRecord.invoiceNumber || serviceRecord.invoiceId || "E-Fatura";

    let text = "";

    if (templateType === "completed") {
      if (serviceType === "auto") {
        const auto = serviceRecord as AutoServiceRecord;
        text = `Sayın *${auto.contactName}*,\n\n*${auto.plateNumber}* plakalı *${auto.brand} ${auto.model}* aracınızın servis bakım ve onarım işlemleri başarıyla tamamlanmış olup test sürüşü yapılmıştır. Aracınız teslime hazırdır. 🚗✨\n\n📋 *Servis Özeti:* [${auto.serviceNo}]\n• Giriş KM: ${auto.currentKm?.toLocaleString("tr-TR")} KM\n${serviceDetails.partsList ? `\n🔩 *Değişen Parçalar:*\n${serviceDetails.partsList}\n` : ""}${serviceDetails.laborList ? `\n🛠️ *Yapılan İşlemler:*\n${serviceDetails.laborList}\n` : ""}\n💰 *Toplam Tutar:* *${grandTotalStr}*\n\nAracınızı mesai saatlerimiz içerisinde servisimizden teslim alabilirsiniz. Bizi tercih ettiğiniz için teşekkür eder, iyi yolculuklar dileriz!\n\n🏢 *${companyName}*${companyPhone ? `\n📞 İletişim: ${companyPhone}` : ""}`;
      } else if (serviceType === "it") {
        const it = serviceRecord as ItServiceRecord;
        text = `Sayın *${it.contactName}*,\n\nServisimize bıraktığınız *${it.brand} ${it.model}* cihazınızın teknik onarım, bakım ve laboratuvar testleri başarıyla tamamlanmıştır. Cihazınız teslime hazırdır. 💻✨\n\n📋 *Servis No:* *${it.serviceNo}*\n${serviceDetails.partsList ? `\n🔩 *Takılan Donanım / Parçalar:*\n${serviceDetails.partsList}\n` : ""}${serviceDetails.laborList ? `\n🛠️ *Yapılan İşlemler:*\n${serviceDetails.laborList}\n` : ""}\n💰 *Toplam Tutar:* *${grandTotalStr}*\n\nCihazınızı servis merkezimizden teslim fişiniz ile teslim alabilirsiniz.\n\n🏢 *${companyName}*${companyPhone ? `\n📞 İletişim: ${companyPhone}` : ""}`;
      } else {
        const app = serviceRecord as ApplianceServiceRecord;
        text = `Sayın *${app.contactName}*,\n\n*${app.brand} ${app.model}* cihazınızın arıza onarım ve periyodik kontrolleri başarıyla tamamlanmıştır. ✅\n\n📋 *Servis Kayıt No:* *${app.serviceNo}*\n${serviceDetails.partsList ? `\n🔩 *Değişen Parçalar:*\n${serviceDetails.partsList}\n` : ""}${serviceDetails.laborList ? `\n🛠️ *Uygulanan Hizmetler:*\n${serviceDetails.laborList}\n` : ""}\n💰 *Toplam Tutar:* *${grandTotalStr}*\n${app.isWarrantyActive ? "🛡️ *İşlem Garanti Kapsamındadır.*\n" : ""}\nCihazınızı iyi günlerde kullanmanızı dileriz.\n\n🏢 *${companyName}*${companyPhone ? `\n📞 İletişim: ${companyPhone}` : ""}`;
      }
    } else if (templateType === "invoiced") {
      text = `Sayın *${serviceRecord.contactName}*,\n\n*${serviceDetails.title}* için düzenlenen *${serviceRecord.serviceNo}* numaralı servis işlemine ait e-faturanız kesilmiştir. 🧾\n\n📄 *Fatura Numarası:* *${effectiveInvoiceNo}*\n💰 *Genel Toplam:* *${grandTotalStr}*\n📅 *Fatura Tarihi:* ${new Date().toLocaleDateString("tr-TR")}\n${iban ? `\n🏦 *Banka & IBAN Bilgilerimiz:*\n${bankName ? `Banka: ${bankName}\n` : ""}IBAN: \`${iban}\`\nAlıcı: ${companyName}\n` : ""}\nFaturanız kayıtlı e-posta adresinize gönderilmiştir. Detaylı bilgi ve ödeme dekontu iletimi için bu hat üzerinden bize ulaşabilirsiniz.\n\n🏢 *${companyName}*${companyPhone ? `\n📞 İletişim: ${companyPhone}` : ""}`;
    } else if (templateType === "diagnosis_approval") {
      let complaint = "";
      if ("customerComplaint" in serviceRecord) complaint = serviceRecord.customerComplaint;
      if ("customerProblemDescription" in serviceRecord) complaint = serviceRecord.customerProblemDescription;

      text = `Sayın *${serviceRecord.contactName}*,\n\n*${serviceDetails.title}* için teknik ekibimiz tarafından arıza tespiti ve ekspertiz çalışması tamamlanmıştır. 🔍\n\n📋 *Servis No:* *${serviceRecord.serviceNo}*\n${complaint ? `⚠️ *Mevcut Şikayet:* ${complaint}\n` : ""}${serviceDetails.partsList ? `\n🔩 *Gereken Yedek Parçalar:*\n${serviceDetails.partsList}\n` : ""}${serviceDetails.laborList ? `\n🛠️ *Planlanan İşçilik:*\n${serviceDetails.laborList}\n` : ""}\n💰 *Tahmini Toplam Maliyet:* *${grandTotalStr}* (KDV Dahil)\n\nOnarım işlemlerine başlamamız için bu mesajı *"ONAYLIYORUM"* yazarak yanıtlayabilir veya servis danışmanımızla iletişime geçebilirsiniz.\n\n🏢 *${companyName}*${companyPhone ? `\n📞 İletişim: ${companyPhone}` : ""}`;
    } else if (templateType === "reception") {
      text = `Sayın *${serviceRecord.contactName}*,\n\n*${serviceDetails.title}* servis kabul ve kayıt işlemleri başarıyla tamamlanmıştır. 📝\n\n📋 *Servis Takip No:* *${serviceRecord.serviceNo}*\n📅 *Kayıt Tarihi:* ${serviceRecord.entryDate}\n\nTeknik ekibimiz en kısa sürede teşhis ve inceleme çalışmalarına başlayacak olup durum hakkında tarafınıza bilgi verilecektir.\n\n🏢 *${companyName}*${companyPhone ? `\n📞 İletişim: ${companyPhone}` : ""}`;
    }

    setMessage(text);
  }, [templateType, serviceRecord, serviceType, serviceDetails, invoiceNumber, companySettings]);

  if (!isOpen || !serviceRecord) return null;

  // Format phone number for WhatsApp URL (e.g. +905551234567 -> 905551234567)
  const getCleanPhone = (phone: string): string => {
    let clean = phone.replace(/[^0-9]/g, "");
    if (clean.startsWith("0")) {
      clean = "90" + clean.substring(1);
    } else if (!clean.startsWith("90") && clean.length === 10) {
      clean = "90" + clean;
    }
    return clean;
  };

  const cleanPhone = getCleanPhone(phoneNumber);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  const [waStatus, setWaStatus] = useState<WhatsAppClientStatus | null>(null);
  const [isDirectSending, setIsDirectSending] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchWhatsAppStatus().then(setWaStatus).catch(() => {});
    }
  }, [isOpen]);

  const handleSendDirect = async () => {
    if (!cleanPhone || !message.trim()) {
      alert("Lütfen geçerli bir telefon numarası ve mesaj girin.");
      return;
    }
    setIsDirectSending(true);
    try {
      const res = await sendWhatsAppTextApi(
        cleanPhone,
        message,
        serviceRecord ? `${serviceRecord.contactName} (${serviceRecord.serviceNo})` : "Servis Müşterisi"
      );
      if (res.success) {
        alert("✅ Servis bilgilendirme mesajı WhatsApp üzerinden doğrudan müşteriye iletildi!");
        onClose();
      } else {
        alert(`WhatsApp doğrudan gönderim hatası: ${res.error || "Bilinmeyen hata"}\n\nDilerseniz 'WhatsApp'ta Aç ve Gönder' seçeneğini kullanabilirsiniz.`);
      }
    } catch (e: any) {
      alert("Hata: " + e.message);
    } finally {
      setIsDirectSending(false);
    }
  };

  const handleOpenWhatsApp = () => {
    const encodedText = encodeURIComponent(message);
    const targetUrl = isWebWhatsApp
      ? `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
      : `https://wa.me/${cleanPhone}?text=${encodedText}`;

    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  const handleInsertVariable = (val: string) => {
    setMessage((prev) => prev + " " + val);
  };

  return (
    <DetailPageLayout
      title="WhatsApp Müşteri Bilgilendirme"
      subtitle={`${serviceRecord.contactName} • ${serviceDetails.title} • Servis No: ${serviceRecord.serviceNo}`}
      breadcrumbs={[
        { label: "Teknik Servis", onClick: onClose },
        { label: serviceRecord.serviceNo, onClick: onClose },
        { label: "WhatsApp Bildirimi", active: true },
      ]}
      onBack={onClose}
      statusBadge={
        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-xl">
          WHATSAPP ENTEGRASYONU
        </span>
      }
      headerIcon={<MessageCircle className="w-5 h-5 text-emerald-600" />}
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
            type="button"
            onClick={handleOpenWhatsApp}
            disabled={!cleanPhone || !message.trim()}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>WhatsApp ile Gönder</span>
          </button>
        </div>
      }
    >
      <div className="bg-white rounded-3xl shadow-sm border border-emerald-200/80 w-full max-w-3xl mx-auto flex flex-col overflow-hidden">

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-5 bg-slate-50/50 flex-1">
          {/* 1. Şablon Seçimi */}
          <div>
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Mesaj Şablonu Seçin:
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Tamamlandı */}
              <button
                type="button"
                onClick={() => setTemplateType("completed")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  templateType === "completed"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <CheckCircle2 className={`w-5 h-5 ${templateType === "completed" ? "text-emerald-600" : "text-slate-400"}`} />
                  <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Önerilen
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold">Servis Tamamlandı</div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight">Teslime hazır bilgisi</div>
                </div>
              </button>

              {/* Faturalandı */}
              <button
                type="button"
                onClick={() => setTemplateType("invoiced")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  templateType === "invoiced"
                    ? "bg-purple-50 border-purple-500 text-purple-950 ring-2 ring-purple-500/20 shadow-xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Receipt className={`w-5 h-5 ${templateType === "invoiced" ? "text-purple-600" : "text-slate-400"}`} />
                  {(serviceRecord.invoiceNumber || serviceRecord.invoiceId || invoiceNumber) && (
                    <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                      Faturalı
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold">Fatura & Ödeme</div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight">Fatura no & IBAN bildirimi</div>
                </div>
              </button>

              {/* Teşhis & Onay */}
              <button
                type="button"
                onClick={() => setTemplateType("diagnosis_approval")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  templateType === "diagnosis_approval"
                    ? "bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-500/20 shadow-xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Wrench className={`w-5 h-5 ${templateType === "diagnosis_approval" ? "text-amber-600" : "text-slate-400"}`} />
                </div>
                <div>
                  <div className="text-xs font-bold">Teşhis & Fiyat Onayı</div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight">Parça & maliyet onayı</div>
                </div>
              </button>

              {/* Servis Kabul */}
              <button
                type="button"
                onClick={() => setTemplateType("reception")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  templateType === "reception"
                    ? "bg-blue-50 border-blue-500 text-blue-950 ring-2 ring-blue-500/20 shadow-xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Calendar className={`w-5 h-5 ${templateType === "reception" ? "text-blue-600" : "text-slate-400"}`} />
                </div>
                <div>
                  <div className="text-xs font-bold">Kayıt & Kabul</div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight">Giriş / Randevu teyidi</div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Telefon Numarası & Hedef Cari */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Alıcı Cari Hesap / Müşteri:
              </label>
              <div className="text-sm font-bold text-slate-900 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
                {serviceRecord.contactName}
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                WhatsApp Telefon Numarası:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="05XX XXX XX XX"
                  className="w-full px-3 py-2 font-mono text-sm font-bold text-slate-900 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="absolute right-3 top-2.5 text-[11px] font-bold text-emerald-700">
                  +{cleanPhone || "90"}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Canlı Mesaj Taslağı Düzenleyici */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                WhatsApp Mesaj Taslağı:
              </label>

              {/* Hızlı Değişken Ekleme */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
                <span className="text-slate-400 font-bold hidden sm:inline">Ekle:</span>
                <button
                  type="button"
                  onClick={() => handleInsertVariable(serviceRecord.serviceNo)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold cursor-pointer"
                >
                  +ServisNo
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertVariable(`₺${(serviceRecord.grandTotal || 0).toLocaleString("tr-TR")}`)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold cursor-pointer"
                >
                  +Tutar
                </button>
                {companySettings?.defaultBankIban && (
                  <button
                    type="button"
                    onClick={() => handleInsertVariable(`IBAN: ${companySettings.defaultBankIban}`)}
                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold cursor-pointer"
                  >
                    +IBAN
                  </button>
                )}
              </div>
            </div>

            {/* WhatsApp Görünümlü Canlı Mesaj Alanı */}
            <div className="relative rounded-2xl border border-emerald-200 overflow-hidden shadow-sm bg-[#EFEAE2]">
              {/* WhatsApp Balonu Deseni ve Başlık */}
              <div className="bg-[#075E54] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-300" />
                  <span>WhatsApp İleti Önizlemesi</span>
                </div>
                <span className="text-[10px] text-emerald-200 font-mono">
                  {message.length} karakter • {message.split(/\s+/).filter(Boolean).length} kelime
                </span>
              </div>

              {/* Mesaj Balonu Editörü */}
              <div className="p-4">
                <div className="bg-white rounded-2xl p-3 shadow-md border border-emerald-100 relative">
                  <textarea
                    rows={9}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full text-xs sm:text-sm font-sans text-slate-800 bg-transparent border-0 focus:ring-0 focus:outline-none resize-y leading-relaxed font-normal"
                    placeholder="Mesaj metnini buraya yazın..."
                  />

                  <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
                    <span>{new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
                    <span className="text-emerald-600 font-black">✓✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp Web vs Uygulama Seçimi */}
          <div className="flex items-center justify-between px-3 py-2 bg-emerald-50/70 rounded-xl border border-emerald-200/60 text-xs">
            <div className="flex items-center gap-2 text-emerald-950 font-medium">
              <Info className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {isWebWhatsApp
                  ? "Tarayıcı sekmesinde WhatsApp Web açılacaktır."
                  : "Cihazınızdaki WhatsApp masaüstü/mobil uygulaması açılacaktır."}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsWebWhatsApp(!isWebWhatsApp)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
            >
              {isWebWhatsApp ? "Uygulama Moduna Geç" : "WhatsApp Web Moduna Geç"}
            </button>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyMessage}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-xs transition-all cursor-pointer w-full sm:w-auto ${
                copied
                  ? "bg-emerald-100 border-emerald-400 text-emerald-800"
                  : "bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700"
              }`}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Mesaj Kopyalandı!" : "Metni Kopyala"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-all cursor-pointer"
            >
              Kapat
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {waStatus?.status === "connected" && (
              <button
                type="button"
                onClick={handleSendDirect}
                disabled={isDirectSending || !cleanPhone || !message.trim()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer"
              >
                <Send className={`w-4 h-4 ${isDirectSending ? "animate-spin" : ""}`} />
                <span>{isDirectSending ? "İletiliyor..." : "🟢 Doğrudan WhatsApp ile Gönder"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenWhatsApp}
              disabled={!cleanPhone || !message.trim()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>WhatsApp Web'de Aç</span>
            </button>
          </div>
        </div>
      </div>
    </DetailPageLayout>
  );
};
