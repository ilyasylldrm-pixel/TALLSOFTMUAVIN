import React, { useState, useEffect } from "react";
import {
  X,
  FileCheck,
  Receipt,
  Car,
  Laptop,
  Wrench,
  User,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  Phone,
  Tag,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  Invoice,
  InvoiceItem,
  Contact,
  AutoServiceRecord,
  ItServiceRecord,
  ApplianceServiceRecord,
  EDocumentType,
} from "../types";
import { DetailPageLayout } from "./common/DetailPageLayout";

export type AnyServiceRecord = AutoServiceRecord | ItServiceRecord | ApplianceServiceRecord;

export interface ServiceInvoicingModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceType: "auto" | "it" | "appliance";
  serviceRecord: AnyServiceRecord | null;
  contacts: Contact[];
  onAddInvoice: (invoice: Invoice) => void;
  onAddContact?: (contact: Contact) => void;
  onServiceInvoiced: (serviceId: string, invoiceId: string, invoiceNumber: string) => void;
  onOpenDeliveryModal?: (record: AnyServiceRecord) => void;
}

export const ServiceInvoicingModal: React.FC<ServiceInvoicingModalProps> = ({
  isOpen,
  onClose,
  serviceType,
  serviceRecord,
  contacts = [],
  onAddInvoice,
  onAddContact,
  onServiceInvoiced,
  onOpenDeliveryModal,
}) => {
  if (!isOpen || !serviceRecord) return null;

  // Derive initial invoice items from service parts & labors
  const getInitialInvoiceItems = (): InvoiceItem[] => {
    const items: InvoiceItem[] = [];

    // Add Parts
    if ("parts" in serviceRecord && Array.isArray(serviceRecord.parts)) {
      serviceRecord.parts.forEach((part: any, index: number) => {
        const vatRate = part.vatRate ?? 20;
        const totalWithoutVat = (part.quantity || 1) * (part.unitPrice || 0);
        const vatAmount = (totalWithoutVat * vatRate) / 100;
        const totalWithVat = totalWithoutVat + vatAmount;

        const partCodeText = part.partCode ? ` [Kod: ${part.partCode}]` : "";
        const warrantyText = part.warrantyMonths ? ` (${part.warrantyMonths} Ay Garanti)` : "";

        items.push({
          id: `item_part_${Date.now()}_${index}`,
          description: `${part.partName}${partCodeText}${warrantyText}`,
          quantity: part.quantity || 1,
          unit: part.unit || "Adet",
          unitPrice: part.unitPrice || 0,
          vatRate,
          totalWithoutVat,
          vatAmount,
          totalWithVat,
          expenseCategory: "Yedek Parça & Malzeme",
        });
      });
    }

    // Add Labors
    if ("labors" in serviceRecord && Array.isArray(serviceRecord.labors)) {
      serviceRecord.labors.forEach((labor: any, index: number) => {
        const vatRate = labor.vatRate ?? 20;
        const hours = labor.hours || 1;
        const hourlyRate = labor.hourlyRate || (hours > 0 ? (labor.total || 0) / hours : 0);
        const totalWithoutVat = hours * hourlyRate;
        const vatAmount = (totalWithoutVat * vatRate) / 100;
        const totalWithVat = totalWithoutVat + vatAmount;

        const techText = labor.technicianName ? ` (Teknisyen: ${labor.technicianName})` : "";

        items.push({
          id: `item_labor_${Date.now()}_${index}`,
          description: `${labor.operationName}${techText}`,
          quantity: hours,
          unit: "Saat",
          unitPrice: hourlyRate,
          vatRate,
          totalWithoutVat,
          vatAmount,
          totalWithVat,
          expenseCategory: "Teknik Servis & İşçilik Hizmeti",
        });
      });
    }

    // Fallback if no parts or labor listed yet
    if (items.length === 0) {
      const grand = serviceRecord.grandTotal || 500;
      const vatRate = 20;
      const totalWithoutVat = grand / (1 + vatRate / 100);
      const vatAmount = grand - totalWithoutVat;

      items.push({
        id: `item_srv_${Date.now()}`,
        description: `${getServiceTitle()} Bedeli (${serviceRecord.serviceNo})`,
        quantity: 1,
        unit: "Hizmet",
        unitPrice: Number(totalWithoutVat.toFixed(2)),
        vatRate,
        totalWithoutVat: Number(totalWithoutVat.toFixed(2)),
        vatAmount: Number(vatAmount.toFixed(2)),
        totalWithVat: grand,
        expenseCategory: "Teknik Servis & Onarım",
      });
    }

    return items;
  };

  // Helper title for service type
  function getServiceTitle(): string {
    if (serviceType === "auto") {
      const autoRec = serviceRecord as AutoServiceRecord;
      return `${autoRec.plateNumber || "Araç"} Servis & Bakım Onarım`;
    }
    if (serviceType === "it") {
      const itRec = serviceRecord as ItServiceRecord;
      return `${itRec.brand || "Bilişim"} ${itRec.model || "Cihaz"} Donanım & Yazılım Servisi`;
    }
    const appRec = serviceRecord as ApplianceServiceRecord;
    return `${appRec.brand || "Ev Aletleri"} ${appRec.model || "Cihaz"} Teknik Servis`;
  }

  function getServicePrefix(): string {
    if (serviceType === "auto") return "FAT-OTO-";
    if (serviceType === "it") return "FAT-BT-";
    return "FAT-BEY-";
  }

  // Find matching contact or select from list
  const initialContact =
    contacts.find(
      (c) =>
        (serviceRecord.contactId && c.id === serviceRecord.contactId) ||
        (serviceRecord.contactName && c.name.toLowerCase().trim() === serviceRecord.contactName.toLowerCase().trim()) ||
        (serviceRecord.contactPhone && c.phone && c.phone.replace(/\D/g, "") === serviceRecord.contactPhone.replace(/\D/g, ""))
    ) || null;

  const [selectedContactId, setSelectedContactId] = useState<string>(initialContact?.id || "new");
  const [customerName, setCustomerName] = useState<string>(serviceRecord.contactName || "");
  const [customerPhone, setCustomerPhone] = useState<string>(serviceRecord.contactPhone || "");
  const [customerEmail, setCustomerEmail] = useState<string>(serviceRecord.contactEmail || "");
  const [customerAddress, setCustomerAddress] = useState<string>(
    ("serviceAddress" in serviceRecord ? (serviceRecord as ApplianceServiceRecord).serviceAddress : "") || ""
  );
  const [taxNumber, setTaxNumber] = useState<string>(initialContact?.taxNumber || "11111111111");
  const [taxOffice, setTaxOffice] = useState<string>(initialContact?.taxOffice || "Kadıköy V.D.");

  const [invoiceNumber, setInvoiceNumber] = useState<string>(
    `${getServicePrefix()}${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
  );
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [eDocType, setEDocType] = useState<EDocumentType>("e_arsiv");
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "sent">("sent");

  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>(getInitialInvoiceItems());
  const [discountAmount, setDiscountAmount] = useState<number>(serviceRecord.discountAmount || 0);

  // Auto notes generator
  const getAutoNotes = (): string => {
    if (serviceType === "auto") {
      const rec = serviceRecord as AutoServiceRecord;
      return `İş Emri No: ${rec.serviceNo} | Araç: ${rec.brand} ${rec.model} (${rec.modelYear}) | Plaka: ${rec.plateNumber} | KM: ${rec.currentKm?.toLocaleString("tr-TR")} KM. Yapılan bakım ve onarımlar teslim fişine uygundur.`;
    }
    if (serviceType === "it") {
      const rec = serviceRecord as ItServiceRecord;
      return `İş Emri No: ${rec.serviceNo} | Cihaz: ${rec.brand} ${rec.model} | Seri No: ${rec.serialNumber || "Yok"} | Arıza: ${rec.customerProblemDescription || "-"}. Donanım ve yazılım testleri başarıyla tamamlanmıştır.`;
    }
    const rec = serviceRecord as ApplianceServiceRecord;
    return `İş Emri No: ${rec.serviceNo} | Cihaz: ${rec.brand} ${rec.model} | Servis Adresi: ${rec.serviceAddress || "-"}. Montaj ve test kontrolleri tamamlanmıştır.`;
  };

  const [invoiceNotes, setInvoiceNotes] = useState<string>(getAutoNotes());
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Recalculate totals
  const subtotal = invoiceItems.reduce((sum, item) => sum + item.totalWithoutVat, 0);
  const totalVat = invoiceItems.reduce((sum, item) => sum + item.vatAmount, 0);
  const rawGrandTotal = subtotal + totalVat;
  const grandTotal = Math.max(0, rawGrandTotal - (discountAmount || 0));

  const handleItemChange = (index: number, field: keyof InvoiceItem, val: any) => {
    const updated = [...invoiceItems];
    const item = { ...updated[index], [field]: val };

    if (field === "quantity" || field === "unitPrice" || field === "vatRate") {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const vat = Number(item.vatRate) || 0;
      const totalWithout = qty * price;
      const vatAmt = (totalWithout * vat) / 100;
      item.totalWithoutVat = Number(totalWithout.toFixed(2));
      item.vatAmount = Number(vatAmt.toFixed(2));
      item.totalWithVat = Number((totalWithout + vatAmt).toFixed(2));
    }

    updated[index] = item;
    setInvoiceItems(updated);
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `item_new_${Date.now()}`,
      description: "Ek Servis / Sarf Malzeme",
      quantity: 1,
      unit: "Adet",
      unitPrice: 100,
      vatRate: 20,
      totalWithoutVat: 100,
      vatAmount: 20,
      totalWithVat: 120,
      expenseCategory: "Ek Malzeme / Hizmet",
    };
    setInvoiceItems([...invoiceItems, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (invoiceItems.length === 1) return;
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const handleContactSelect = (contactId: string) => {
    setSelectedContactId(contactId);
    if (contactId === "new") return;
    const found = contacts.find((c) => c.id === contactId);
    if (found) {
      setCustomerName(found.name);
      setCustomerPhone(found.phone || customerPhone);
      setCustomerEmail(found.email || customerEmail);
      setTaxNumber(found.taxNumber || taxNumber);
      setTaxOffice(found.taxOffice || taxOffice);
      if (found.address) setCustomerAddress(found.address);
    }
  };

  // Submit invoice creation
  const handleCreateInvoice = () => {
    let finalContactId = selectedContactId;
    let finalContactName = customerName.trim() || serviceRecord.contactName || "Servis Müşterisi";

    // If new contact selected, create one in contacts list
    if (selectedContactId === "new" || !contacts.some((c) => c.id === selectedContactId)) {
      finalContactId = `cont_${Date.now()}`;
      const newContact: Contact = {
        id: finalContactId,
        name: finalContactName,
        phone: customerPhone,
        email: customerEmail,
        address: customerAddress,
        taxNumber: taxNumber || "11111111111",
        taxOffice: taxOffice || "Vergi Dairesi",
        contactType: "customer",
        balance: 0,
        balanceType: "balanced",
        createdAt: new Date().toISOString().split("T")[0],
      };
      if (onAddContact) {
        onAddContact(newContact);
      }
    }

    const createdInvoice: Invoice = {
      id: `inv_srv_${Date.now()}`,
      invoiceNumber: invoiceNumber.trim() || `${getServicePrefix()}${Date.now().toString().slice(-6)}`,
      type: "sales",
      docKind: "invoice",
      contactId: finalContactId,
      contactName: finalContactName,
      taxNumber: taxNumber || "11111111111",
      issueDate: issueDate || new Date().toISOString().split("T")[0],
      dueDate: dueDate || issueDate || new Date().toISOString().split("T")[0],
      items: invoiceItems,
      subtotal: Number(subtotal.toFixed(2)),
      totalVat: Number(totalVat.toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2)),
      currency: "TRY",
      paidAmount: paymentStatus === "paid" ? Number(grandTotal.toFixed(2)) : 0,
      remainingAmount: paymentStatus === "paid" ? 0 : Number(grandTotal.toFixed(2)),
      status: paymentStatus === "paid" ? "paid" : "sent",
      eDocumentType: eDocType,
      eDocumentEttn: `ETTN-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      notes: invoiceNotes,
      createdAt: new Date().toISOString().split("T")[0],
    };

    // 1. Add to invoices
    onAddInvoice(createdInvoice);

    // 2. Link to service record and update status
    onServiceInvoiced(serviceRecord.id, createdInvoice.id, createdInvoice.invoiceNumber);

    setSuccessToast(`Servis Faturası (${createdInvoice.invoiceNumber}) başarıyla kesildi ve muhasebeye işlendi.`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <DetailPageLayout
      title="Servis İş Emrini Faturalandır"
      subtitle={`${serviceRecord.serviceNo} nolu servis kaydının yedek parça ve teknik işçilik kalemlerini resmi satış faturasına dönüştürün`}
      breadcrumbs={[
        { label: "Teknik Servis", onClick: onClose },
        { label: serviceRecord.serviceNo, onClick: onClose },
        { label: "Faturalandır", active: true },
      ]}
      onBack={onClose}
      statusBadge={
        <span className="px-3 py-1 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
          İŞ EMRİ FATURALANDIRMA
        </span>
      }
      headerIcon={
        serviceType === "auto" ? <Car className="w-5 h-5 text-amber-600" /> :
        serviceType === "it" ? <Laptop className="w-5 h-5 text-cyan-600" /> :
        <Wrench className="w-5 h-5 text-emerald-600" />
      }
      actions={
        <div className="flex items-center gap-2">
          {onOpenDeliveryModal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenDeliveryModal(serviceRecord);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="Ürün / Servis Teslim Tutanağını Görüntüle ve Yazdır"
            >
              <FileText className="w-3.5 h-3.5 text-purple-600" />
              <span>Teslim Tutanağı</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={handleCreateInvoice}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <FileCheck className="w-4 h-4" />
            <span>Faturayı Kes</span>
          </button>
        </div>
      }
    >
      <div className="relative w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">

        {/* SUCCESS TOAST OVERLAY */}
        {successToast && (
          <div className="p-3 bg-emerald-500 text-white text-xs font-bold text-center flex items-center justify-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successToast}</span>
          </div>
        )}

        {/* MODAL BODY */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-800">
          {/* Servis & Cihaz Bilgi Özeti Şeridi */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                {serviceType === "auto" ? "OTO" : serviceType === "it" ? "BT" : "EVA"}
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">
                  {serviceType === "auto" && (
                    <>
                      {(serviceRecord as AutoServiceRecord).brand} {(serviceRecord as AutoServiceRecord).model} • Plaka:{" "}
                      <span className="font-mono bg-slate-900 text-amber-300 px-1.5 py-0.5 rounded ml-1">
                        {(serviceRecord as AutoServiceRecord).plateNumber}
                      </span>
                    </>
                  )}
                  {serviceType === "it" && (
                    <>
                      {(serviceRecord as ItServiceRecord).brand} {(serviceRecord as ItServiceRecord).model} • SN:{" "}
                      <span className="font-mono font-bold text-purple-900">
                        {(serviceRecord as ItServiceRecord).serialNumber || "Yok"}
                      </span>
                    </>
                  )}
                  {serviceType === "appliance" && (
                    <>
                      {(serviceRecord as ApplianceServiceRecord).brand} {(serviceRecord as ApplianceServiceRecord).model} • Adres:{" "}
                      <span className="text-slate-600">
                        {(serviceRecord as ApplianceServiceRecord).district || "İstanbul"}
                      </span>
                    </>
                  )}
                </div>
                <div className="text-slate-500 font-medium mt-0.5">
                  Müşteri: <strong className="text-slate-700">{serviceRecord.contactName}</strong> | Tel: {serviceRecord.contactPhone}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Onarım Tamamlandı</span>
              </span>
            </div>
          </div>

          {/* Fatura Başlık & Müşteri / Cari Bilgileri */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cari / Müşteri Eşleştirme */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-purple-600" />
                  <span>Cari Kart / Müşteri</span>
                </span>
                <span className="text-[10px] text-purple-600 font-bold">Otomatik Eşleşti</span>
              </label>
              <select
                value={selectedContactId}
                onChange={(e) => handleContactSelect(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                <option value="new">+ Yeni Cari Oluştur ({customerName})</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.taxNumber ? `(VKN: ${c.taxNumber})` : `(Tel: ${c.phone || "-"})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Fatura Numarası */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5 text-purple-600" />
                <span>Fatura Numarası</span>
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            {/* E-Belge Türü */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-purple-600" />
                <span>E-Belge / Fatura Türü</span>
              </label>
              <select
                value={eDocType}
                onChange={(e) => setEDocType(e.target.value as EDocumentType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-purple-900 bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                <option value="e_arsiv">e-Arşiv Fatura (GİB Onaylı)</option>
                <option value="e_fatura">e-Fatura (Ticari / Temel)</option>
                <option value="paper">Kağıt / Matbu Satış Faturası</option>
              </select>
            </div>
          </div>

          {/* Tarih ve Vergi Bilgileri */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/60 p-3.5 rounded-2xl border border-slate-200/70 text-xs">
            <div className="space-y-1">
              <span className="font-bold text-slate-600 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" /> Fatura Tarihi:
              </span>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
              />
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-600 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" /> Vade Tarihi:
              </span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
              />
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-600">VKN / TCKN:</span>
              <input
                type="text"
                placeholder="11111111111"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-semibold bg-white"
              />
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-600">Tahsilat Durumu:</span>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as "paid" | "sent")}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white text-slate-800"
              >
                <option value="sent">Ödeme Bekliyor (Açık Fatura)</option>
                <option value="paid">Nakit/Kart Tahsil Edildi (Kapalı)</option>
              </select>
            </div>
          </div>

          {/* FATURA KALEMLERİ TABLOSU */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-600" />
                <span>Fatura Kalemleri (Parça ve İşçilik Dökümü)</span>
              </h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs border border-purple-200 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Kalem Ekle</span>
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-700 uppercase">
                    <th className="py-2.5 px-3">Hizmet / Parça Açıklaması</th>
                    <th className="py-2.5 px-2 w-20 text-center">Miktar</th>
                    <th className="py-2.5 px-2 w-20">Birim</th>
                    <th className="py-2.5 px-2 w-24 text-right">Birim Fiyat</th>
                    <th className="py-2.5 px-2 w-20 text-center">KDV (%)</th>
                    <th className="py-2.5 px-3 w-28 text-right">Toplam (KDV Dahil)</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoiceItems.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                          className="w-full px-2 py-1 rounded-lg border border-transparent hover:border-slate-200 focus:border-purple-500 font-semibold text-slate-800 focus:bg-white focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <input
                          type="number"
                          min="0.1"
                          step="0.5"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", parseFloat(e.target.value) || 0)}
                          className="w-full px-1.5 py-1 text-center font-bold rounded-lg border border-slate-200 focus:border-purple-500 focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                          className="w-full px-1.5 py-1 text-center rounded-lg border border-slate-200 focus:border-purple-500 focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                          className="w-full px-1.5 py-1 text-right font-mono font-bold rounded-lg border border-slate-200 focus:border-purple-500 focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <select
                          value={item.vatRate}
                          onChange={(e) => handleItemChange(idx, "vatRate", parseInt(e.target.value) || 0)}
                          className="w-full px-1 py-1 text-center font-bold rounded-lg border border-slate-200 focus:border-purple-500 focus:outline-none"
                        >
                          <option value="20">%20</option>
                          <option value="10">%10</option>
                          <option value="0">%0</option>
                        </select>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        ₺{item.totalWithVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={invoiceItems.length === 1}
                          className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fatura Altı Notlar ve Finansal Özet Kartı */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* Sol: Fatura Açıklaması / Notlar */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700">
                Fatura Açıklaması & Not (Servis Referansı):
              </label>
              <textarea
                rows={3}
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-700 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none leading-relaxed"
              />
            </div>

            {/* Sağ: Toplamlar Kartı */}
            <div className="bg-gradient-to-br from-purple-50/80 to-indigo-50/60 p-4 rounded-2xl border border-purple-200/80 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Ara Toplam (KDV Hariç):</span>
                <span className="font-mono font-bold text-slate-900">
                  ₺{subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Toplam KDV:</span>
                <span className="font-mono font-bold text-purple-900">
                  ₺{totalVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-rose-600">
                  <span>İskonto / Servis İndirimi:</span>
                  <span className="font-mono font-bold">
                    -₺{discountAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-purple-200 flex justify-between items-center">
                <span className="text-sm font-extrabold text-purple-950">Genel Toplam:</span>
                <span className="text-xl font-black text-purple-950 font-mono">
                  ₺{grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-all cursor-pointer"
            >
              İptal
            </button>

            {onOpenDeliveryModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDeliveryModal(serviceRecord);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs transition-all cursor-pointer"
                title="Ürün / Servis Teslim Tutanağını Görüntüle & Yazdır"
              >
                <FileText className="w-4 h-4 text-purple-700" />
                <span>Ürün Teslim Tutanağı</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleCreateInvoice}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-extrabold text-xs shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
          >
            <FileCheck className="w-4 h-4" />
            <span>Faturayı Kes & Servis Kaydını Faturalandır</span>
          </button>
        </div>
      </div>
    </DetailPageLayout>
  );
};
