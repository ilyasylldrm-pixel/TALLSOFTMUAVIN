import React from "react";
import { Invoice, CompanySettings, Contact } from "../types";
import { numberToTurkishWords } from "../utils/numberToTurkishWords";
import { getCurrencySymbol } from "../utils/exportUtils";
import { Printer, Download, X, QrCode, Building2, CheckCircle2 } from "lucide-react";
import { Logo } from "./Logo";

interface InvoicePrintModalProps {
  invoice: Invoice;
  companySettings: CompanySettings;
  contact?: Contact;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  invoice,
  companySettings,
  contact,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const writtenAmount = numberToTurkishWords(invoice.grandTotal);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-4xl w-full p-8 shadow-2xl space-y-6 my-8 print:p-0 print:shadow-none print:m-0 print:w-full print:max-w-none print:border-none print:bg-white print:text-black">
        {/* Top Control Bar (Hidden on print) */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black px-2.5 py-1 rounded-md uppercase tracking-wide">
              {invoice.type === "sales" ? "Satış e-Arşiv Faturası" : "Alış Faturası"}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Fatura No: {invoice.invoiceNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-[#8252F6] hover:bg-[#703EE5] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4 text-[#EF7D2C]" />
              <span>Yazdır / PDF İndir</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-xl cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Page Area */}
        <div id="printable-invoice" className="bg-white text-slate-900 p-8 border border-slate-200 rounded-xl space-y-6 print:border-none print:p-0">
          {/* Header Banner */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3 mb-2">
                <Logo size="md" />
              </div>
              <h1 className="text-sm font-semibold tracking-tight text-slate-900">
                {companySettings.companyName}
              </h1>
              <p className="text-xs font-medium text-slate-600 max-w-sm">
                {companySettings.companyTitle}
              </p>
              <p className="text-xs text-slate-500">
                {companySettings.address}, {companySettings.city}
              </p>
              <p className="text-xs text-slate-500">
                Tel: {companySettings.phone} | E-posta: {companySettings.email}
              </p>
            </div>

            <div className="text-right space-y-1.5">
              <div className="inline-block bg-slate-900 text-white text-xs font-semibold uppercase px-3 py-1 rounded">
                e-ARŞİV FATURA
              </div>
              <div className="text-xs font-mono font-medium text-slate-900">
                FATURA NO: {invoice.invoiceNumber}
              </div>
              <div className="text-xs text-slate-600">
                ETTN: 8a491029-3810-4b10-8201-948123019283
              </div>
              <div className="text-xs text-slate-600">
                <strong>Fatura Tarihi:</strong> {invoice.issueDate}
              </div>
              <div className="text-xs text-slate-600">
                <strong>Düzenleme Zamanı:</strong> 14:30:00
              </div>
            </div>
          </div>

          {/* Seller & Customer Information Boxes */}
          <div className="grid grid-cols-2 gap-6 text-xs">
            {/* Seller */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] font-black uppercase text-indigo-700 block tracking-wider">
                SATICI BİLGİLERİ
              </span>
              <p className="font-extrabold text-slate-900">{companySettings.companyTitle}</p>
              {companySettings.taxpayerType && (
                <p>Mükellefiyet Türü: <strong>{companySettings.taxpayerType}</strong></p>
              )}
              <p>Vergi Dairesi: <strong>{companySettings.taxOffice}</strong></p>
              <p>VKN / TCKN: <strong>{companySettings.taxNumber}</strong></p>
              <p>Mersis No: {companySettings.mersisNo || "-"}</p>
              <p className="text-slate-500">{companySettings.address}</p>
            </div>

            {/* Buyer */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] font-black uppercase text-indigo-700 block tracking-wider">
                ALICI BİLGİLERİ
              </span>
              <p className="font-extrabold text-slate-900">{invoice.contactName}</p>
              <p>
                Vergi Dairesi: <strong>{contact?.taxOffice || invoice.taxNumber || "-"}</strong>
              </p>
              <p>
                VKN / TCKN: <strong>{contact?.taxNumber || invoice.taxNumber || "-"}</strong>
              </p>
              <p className="text-slate-500">
                {contact?.address || "Adres Belirtilmemiş"}, {contact?.city || ""}
              </p>
              <p className="text-slate-500">Tel: {contact?.phone || "-"}</p>
            </div>
          </div>

          {/* Invoice Items Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
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
                {invoice.items.map((item, idx) => {
                  const currSym = getCurrencySymbol(invoice.currency);
                  return (
                    <tr key={item.id || idx} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{item.description}</td>
                      <td className="py-3 px-3 text-center font-bold">{item.quantity}</td>
                      <td className="py-3 px-3 text-center text-slate-600">{item.unit}</td>
                      <td className="py-3 px-3 text-right font-mono">
                        {currSym}{item.unitPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-center font-bold">%{item.vatRate}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {currSym}{item.vatAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right font-black font-mono text-slate-900">
                        {currSym}{item.totalWithVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals & Notes Section */}
          <div className="grid grid-cols-2 gap-6 items-start pt-2">
            {/* Written Amount & Notes */}
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl text-xs">
                <span className="text-[10px] font-black uppercase text-indigo-800 block">
                  YALNIZ
                </span>
                <p className="font-extrabold text-indigo-900 mt-0.5">
                  # {writtenAmount} #
                </p>
              </div>

              {companySettings.defaultBankIban && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    BANKA HESAP BİLGİLERİ
                  </span>
                  <p className="font-bold text-slate-800">{companySettings.defaultBankName}</p>
                  <p className="font-mono text-slate-900 font-bold">{companySettings.defaultBankIban}</p>
                </div>
              )}

              {invoice.notes && (
                <div className="text-xs text-slate-600">
                  <strong>Notlar:</strong> {invoice.notes}
                </div>
              )}
            </div>

            {/* Calculations Total Summary */}
            <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Mal Hizmet Toplam Tutarı:</span>
                <span className="font-mono font-bold">
                  {getCurrencySymbol(invoice.currency)}{invoice.subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Hesaplanan Toplam KDV:</span>
                <span className="font-mono font-bold">
                  {getCurrencySymbol(invoice.currency)}{invoice.totalVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              {invoice.totalWithholding && invoice.totalWithholding > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>Hesaplanan Tevkifat Tutarı:</span>
                  <span className="font-mono font-bold">
                    -{getCurrencySymbol(invoice.currency)}{invoice.totalWithholding.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-center text-sm font-black">
                <span>ÖDENECEK GENEL TOPLAM:</span>
                <span className="text-lg font-mono text-indigo-700">
                  {getCurrencySymbol(invoice.currency)}{invoice.grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Footer QR & Signature Stamp */}
          <div className="pt-8 border-t border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3 text-slate-500">
              <div className="w-14 h-14 bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center p-1">
                <QrCode className="w-10 h-10 text-slate-800" />
              </div>
              <div>
                <p className="font-bold text-slate-700">e-Arşiv Karekod Doğrulama</p>
                <p className="text-[10px] text-slate-400">
                  Bu fatura 5070 sayılı Elektronik İmza Kanunu kapsamında üretilmiştir.
                </p>
              </div>
            </div>

            <div className="text-center w-48 space-y-1">
              <p className="font-bold text-slate-800">Düzenleyen Kaşe / İmza</p>
              <div className="h-12 border-b border-dashed border-slate-300"></div>
              <p className="text-[10px] text-slate-400">{companySettings.companyName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
