import React, { useState } from "react";
import { Invoice, InvoiceItem, CompanySettings, Contact, getContactAccountCode } from "../types";
import { numberToTurkishWords } from "../utils/numberToTurkishWords";
import { getCurrencySymbol, formatDate, exportElementToPDF } from "../utils/exportUtils";
import {
  Printer,
  Download,
  X,
  QrCode,
  Building2,
  CheckCircle2,
  Users,
  Package,
  ExternalLink,
  FileText,
  Check,
  Send,
  AlertCircle,
  Calendar,
  CreditCard,
} from "lucide-react";
import { Logo } from "./Logo";
import { NavItem } from "./Sidebar";

export interface InvoicePreviewModalProps {
  invoice: Partial<Invoice>;
  companySettings: CompanySettings;
  contact?: Contact;
  isOpen?: boolean;
  isDraft?: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  onDownloadPDF?: () => void;
  onPrint?: () => void;
  onSelectTab?: (tab: NavItem) => void;
  title?: string;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  invoice,
  companySettings,
  contact,
  isOpen = true,
  isDraft = false,
  onClose,
  onConfirm,
  onDownloadPDF,
  onPrint,
  onSelectTab,
  title,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  // Safe fallback values from existing data structure
  const invType = invoice.type || "sales";
  const invNumber = invoice.invoiceNumber || "TASLAK-0001";
  const issueDate = invoice.issueDate || new Date().toISOString().split("T")[0];
  const dueDate = invoice.dueDate || issueDate;
  const items: InvoiceItem[] = invoice.items || [];
  const currency = invoice.currency || companySettings?.currency || "TRY";
  const currSymbol = getCurrencySymbol(currency);

  // Recalculate totals if not explicitly supplied
  const calculatedSubtotal = items.reduce((sum, item) => sum + (item.totalWithoutVat || 0), 0);
  const calculatedVat = items.reduce((sum, item) => sum + (item.vatAmount || 0), 0);
  const calculatedWithholding = items.reduce((sum, item) => {
    if (item.withholdingRate && item.withholdingRate > 0) {
      return sum + (item.vatAmount || 0) * item.withholdingRate;
    }
    return sum;
  }, 0);

  const subtotal = invoice.subtotal ?? calculatedSubtotal;
  const totalVat = invoice.totalVat ?? calculatedVat;
  const totalWithholding = invoice.totalWithholding ?? calculatedWithholding;
  const grandTotal = invoice.grandTotal ?? (subtotal + totalVat - totalWithholding);
  const paidAmount = invoice.paidAmount ?? 0;
  const remainingAmount = invoice.remainingAmount ?? (grandTotal - paidAmount);

  const contactName = invoice.contactName || contact?.name || "Belirtilmemiş Müşteri / Tedarikçi";
  const contactTaxOffice = contact?.taxOffice || invoice.taxNumber || "-";
  const contactTaxNo = contact?.taxNumber || invoice.taxNumber || "-";
  const accountCode = contact ? getContactAccountCode(contact) : (invType === "sales" ? "120.00000" : "320.00000");

  const writtenAmount = numberToTurkishWords(grandTotal);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleDownloadPDF = async () => {
    if (onDownloadPDF) {
      onDownloadPDF();
      return;
    }
    setIsDownloading(true);
    try {
      const fileName = `${invNumber}_Fatura.pdf`;
      await exportElementToPDF("invoice-preview-paper", fileName);
    } catch (err) {
      console.error("PDF Export Hatası:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in">
      <div className="bg-white border border-indigo-200 text-slate-900 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[94vh] my-auto print:max-h-none print:shadow-none print:m-0 print:w-full print:max-w-none print:border-none print:bg-white print:text-black">
        {/* Control Bar Header */}
        <div className="sticky top-0 bg-slate-900 text-white p-3.5 sm:px-6 flex items-center justify-between z-20 border-b border-slate-800 shadow-sm shrink-0 print:hidden">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`text-xs font-extrabold px-3 py-1 rounded-lg uppercase tracking-wider shrink-0 ${
                isDraft
                  ? "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                  : invType === "sales"
                  ? "bg-indigo-500/20 text-indigo-200 border border-indigo-400/30"
                  : "bg-emerald-500/20 text-emerald-200 border border-emerald-400/30"
              }`}
            >
              {isDraft ? "TASLAK FATURA ÖNİZLEME" : invType === "sales" ? "SATIŞ e-ARŞİV FATURASI" : "ALIŞ FATURASI"}
            </span>
            <span className="text-xs text-slate-300 font-mono font-bold truncate">
              {invNumber}
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {onConfirm && isDraft && (
              <button
                type="button"
                onClick={onConfirm}
                className="bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/40 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Onayla & Oluştur</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/40 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-indigo-200" />
              <span>{isDownloading ? "PDF Hazırlanıyor..." : "PDF İndir"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all active:scale-95"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span className="hidden sm:inline">Yazdır</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              title="Pencereyi Kapat"
            >
              <X className="w-4 h-4 text-rose-300" />
              <span>Kapat</span>
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Canvas */}
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto space-y-6 print:p-0 print:overflow-visible custom-scrollbar">
          <div
            id="invoice-preview-paper"
            className="bg-white text-slate-900 p-6 sm:p-8 border border-slate-200 rounded-xl space-y-6 print:border-none print:p-0"
          >
            {/* Header / Company Banner */}
            <div className="flex flex-col sm:flex-row items-start justify-between border-b-2 border-slate-900 pb-6 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3 mb-2">
                  <Logo size="md" />
                </div>
                <h1 className="text-base font-extrabold tracking-tight text-slate-900">
                  {companySettings?.companyName || "FİRMA ÜNVANI"}
                </h1>
                <p className="text-xs font-medium text-slate-600 max-w-sm">
                  {companySettings?.companyTitle || companySettings?.companyName}
                </p>
                <p className="text-xs text-slate-500">
                  {companySettings?.address || "Adres bilgisi girilmemiş"}, {companySettings?.city || ""}
                </p>
                <p className="text-xs text-slate-500">
                  Tel: {companySettings?.phone || "-"} | E-posta: {companySettings?.email || "-"}
                </p>
              </div>

              <div className="text-left sm:text-right space-y-1.5 shrink-0">
                <div className={`inline-block text-white text-xs font-bold uppercase px-3 py-1 rounded tracking-wider ${
                  invoice.docKind === "receipt"
                    ? invType === "sales"
                      ? "bg-indigo-700"
                      : "bg-amber-700"
                    : "bg-slate-900"
                }`}>
                  {invoice.docKind === "receipt"
                    ? invType === "sales"
                      ? "GELİR / PERAKENDE SATIŞ FİŞİ"
                      : "GİDER / MASRAF FİŞİ"
                    : invType === "sales"
                    ? "e-ARŞİV FATURA"
                    : "ALIŞ (GİDER) FATURASI"}
                </div>
                <div className="text-xs font-mono font-bold text-slate-900">
                  {invoice.docKind === "receipt" ? "FİŞ NO:" : "FATURA NO:"} {invNumber}
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  ETTN: {invoice.id ? `8a491029-3810-4b10-${invoice.id.slice(0, 8)}` : "8a491029-3810-4b10-8201-948123019283"}
                </div>
                <div className="text-xs text-slate-600">
                  <strong>{invoice.docKind === "receipt" ? "Düzenleme Tarihi:" : "Fatura Tarihi:"}</strong> {formatDate(issueDate)}
                </div>
                <div className="text-xs text-slate-600">
                  <strong>Son Ödeme / Vade:</strong> {formatDate(dueDate)}
                </div>
              </div>
            </div>

            {/* Seller & Customer Information Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Seller */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-700 block tracking-wider">
                  SATICI BİLGİLERİ
                </span>
                <p className="font-extrabold text-slate-900">
                  {companySettings?.companyTitle || companySettings?.companyName}
                </p>
                {companySettings?.taxpayerType && (
                  <p className="text-slate-600">
                    Mükellefiyet Türü: <strong>{companySettings.taxpayerType}</strong>
                  </p>
                )}
                <p className="text-slate-600">
                  Vergi Dairesi: <strong>{companySettings?.taxOffice || "-"}</strong>
                </p>
                <p className="text-slate-600">
                  VKN / TCKN: <strong>{companySettings?.taxNumber || "-"}</strong>
                </p>
                {companySettings?.mersisNo && (
                  <p className="text-slate-600">Mersis No: {companySettings.mersisNo}</p>
                )}
                <p className="text-slate-500 pt-1">{companySettings?.address || "-"}</p>
              </div>

              {/* Buyer */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-indigo-700 block tracking-wider">
                    ALICI / MÜŞTERİ BİLGİLERİ
                  </span>
                  {accountCode && (
                    <span className="font-mono text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                      Cari Kodu: {accountCode}
                    </span>
                  )}
                </div>
                <p className="font-extrabold text-slate-900">{contactName}</p>
                <p className="text-slate-600">
                  Vergi Dairesi: <strong>{contactTaxOffice}</strong>
                </p>
                <p className="text-slate-600">
                  VKN / TCKN: <strong>{contactTaxNo}</strong>
                </p>
                <p className="text-slate-500">
                  {contact?.address || "Adres Belirtilmemiş"}, {contact?.city || ""}
                </p>
                <p className="text-slate-500">Tel: {contact?.phone || "-"}</p>
              </div>
            </div>

            {/* Invoice Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-x-auto custom-scrollbar w-full">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Sıra</th>
                    <th className="py-2.5 px-3">Mal / Hizmet Açıklaması</th>
                    <th className="py-2.5 px-3 text-center">Miktar</th>
                    <th className="py-2.5 px-3 text-center">Birim</th>
                    <th className="py-2.5 px-3 text-right">Birim Fiyat</th>
                    <th className="py-2.5 px-3 text-center">KDV %</th>
                    <th className="py-2.5 px-3 text-right">KDV Tutarı</th>
                    <th className="py-2.5 px-3 text-right">Toplam Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400 font-medium">
                        Faturada henüz kalem bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3 font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span>{item.description || "Hizmet / Ürün Kalemi"}</span>
                            {item.expenseCategory && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                                {item.expenseCategory}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-bold">{item.quantity}</td>
                        <td className="py-3 px-3 text-center text-slate-600">{item.unit || "Adet"}</td>
                        <td className="py-3 px-3 text-right font-mono">
                          {currSymbol}
                          {(item.unitPrice || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-center font-bold">%{item.vatRate || 0}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          {currSymbol}
                          {(item.vatAmount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right font-black font-mono text-slate-900">
                          {currSymbol}
                          {(item.totalWithVat || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Calculations & Notes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start pt-2">
              {/* Written Amount, IBAN & Notes */}
              <div className="space-y-3">
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs">
                  <span className="text-[10px] font-black uppercase text-indigo-800 block">
                    YALNIZ
                  </span>
                  <p className="font-extrabold text-indigo-950 mt-0.5">
                    # {writtenAmount} #
                  </p>
                </div>

                {companySettings?.defaultBankIban && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      BANKA HESAP BİLGİLERİ (HAVALE / EFT)
                    </span>
                    <p className="font-bold text-slate-800">{companySettings.defaultBankName}</p>
                    <p className="font-mono text-slate-900 font-bold">{companySettings.defaultBankIban}</p>
                  </div>
                )}

                {invoice.notes && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      FATURA NOTU
                    </span>
                    <p>{invoice.notes}</p>
                  </div>
                )}
              </div>

              {/* Totals Summary */}
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Ara Toplam (Matrah):</span>
                  <span className="font-mono font-bold">
                    {currSymbol}
                    {subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Detailed Tax Breakdown from taxItems if present */}
                {invoice.taxItems && invoice.taxItems.length > 0 ? (
                  <div className="py-1 my-1 border-y border-dashed border-slate-300 space-y-1">
                    <span className="text-[10px] font-black uppercase text-purple-900 tracking-wider block">
                      Vergi Kalemleri Dökümü
                    </span>
                    {invoice.taxItems.map((tax, tIdx) => (
                      <div key={tax.id || tIdx} className="flex justify-between text-slate-700 text-[11px] pl-1">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block"></span>
                          <span>{tax.taxName || tax.taxType}</span>
                          {tax.rate !== undefined && tax.rate > 0 && !tax.taxName.includes(`%${tax.rate}`) && (
                            <span className="text-slate-500 font-semibold">(%{tax.rate})</span>
                          )}
                          {tax.taxableAmount !== undefined && tax.taxableAmount > 0 && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              [Matrah: {currSymbol}{tax.taxableAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}]
                            </span>
                          )}
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {tax.taxType === "KDV Tevkifatı" || tax.taxType === "Stopaj" ? "-" : "+"}
                          {currSymbol}
                          {tax.taxAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Hesaplanan Toplam KDV:</span>
                      <span className="font-mono font-bold">
                        {currSymbol}
                        {totalVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {invoice.totalOtv && invoice.totalOtv > 0 && (
                      <div className="flex justify-between text-purple-700">
                        <span>Özel Tüketim Vergisi (ÖTV):</span>
                        <span className="font-mono font-bold">
                          +{currSymbol}
                          {invoice.totalOtv.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    {invoice.totalOiv && invoice.totalOiv > 0 && (
                      <div className="flex justify-between text-purple-700">
                        <span>Özel İletişim Vergisi (ÖİV):</span>
                        <span className="font-mono font-bold">
                          +{currSymbol}
                          {invoice.totalOiv.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    {invoice.totalAccommodationTax && invoice.totalAccommodationTax > 0 && (
                      <div className="flex justify-between text-purple-700">
                        <span>Konaklama Vergisi (%2):</span>
                        <span className="font-mono font-bold">
                          +{currSymbol}
                          {invoice.totalAccommodationTax.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    {invoice.totalStampTax && invoice.totalStampTax > 0 && (
                      <div className="flex justify-between text-purple-700">
                        <span>Damga Vergisi:</span>
                        <span className="font-mono font-bold">
                          +{currSymbol}
                          {invoice.totalStampTax.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    {totalWithholding > 0 && (
                      <div className="flex justify-between text-amber-700">
                        <span>Hesaplanan Tevkifat Tutarı:</span>
                        <span className="font-mono font-bold">
                          -{currSymbol}
                          {totalWithholding.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    {invoice.totalStopaj && invoice.totalStopaj > 0 && (
                      <div className="flex justify-between text-amber-700">
                        <span>Stopaj Kesintisi:</span>
                        <span className="font-mono font-bold">
                          -{currSymbol}
                          {invoice.totalStopaj.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </>
                )}

                <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-center text-sm font-black">
                  <span>ÖDENECEK GENEL TOPLAM:</span>
                  <span className="text-lg font-mono text-indigo-700">
                    {currSymbol}
                    {grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {paidAmount > 0 && (
                  <div className="pt-2 border-t border-slate-200 space-y-1 text-[11px]">
                    <div className="flex justify-between text-emerald-700">
                      <span>Tahsil Edilen / Ödenen Tutar:</span>
                      <span className="font-mono font-bold">
                        {currSymbol}
                        {paidAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-rose-700 font-bold">
                      <span>Kalan AÇIK Bakiye:</span>
                      <span className="font-mono">
                        {currSymbol}
                        {remainingAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stamp & Legal Seals */}
            <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs gap-4">
              <div className="flex items-center gap-3 text-slate-500">
                <div className="w-14 h-14 bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center p-1 shrink-0">
                  <QrCode className="w-10 h-10 text-slate-800" />
                </div>
                <div>
                  <p className="font-bold text-slate-700">e-Arşiv Karekod Doğrulama</p>
                  <p className="text-[10px] text-slate-400">
                    Bu fatura 5070 sayılı Elektronik İmza Kanunu kapsamında üretilmiştir.
                  </p>
                </div>
              </div>

              <div className="text-center w-48 space-y-1 shrink-0">
                <p className="font-bold text-slate-800">Düzenleyen Kaşe / İmza</p>
                <div className="h-12 border-b border-dashed border-slate-300"></div>
                <p className="text-[10px] text-slate-400">{companySettings?.companyName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
