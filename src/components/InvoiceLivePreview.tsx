import React from "react";
import type { CompanySettings, Contact, Invoice, InvoiceItem } from "../types";
import { getContactAccountCode } from "../types";
import { numberToTurkishWords } from "../utils/numberToTurkishWords";
import { getCurrencySymbol, formatDate } from "../utils/exportUtils";
import { computeInvoiceTotals, formatWithholdingBadge } from "../utils/taxCalculationService";
import { Logo } from "./Logo";

export interface InvoiceLivePreviewProps {
  invoice: Partial<Invoice>;
  companySettings: CompanySettings;
  contact?: Contact;
  eDocumentLabel?: string;
}

/** Compact live preview while editing a new invoice (create form side panel). */
export const InvoiceLivePreview: React.FC<InvoiceLivePreviewProps> = ({
  invoice,
  companySettings,
  contact,
  eDocumentLabel = "e-Fatura",
}) => {
  const invNumber = invoice.invoiceNumber || "TASLAK";
  const items: InvoiceItem[] = invoice.items || [];
  const currency = invoice.currency || companySettings?.currency || "TRY";
  const currSymbol = getCurrencySymbol(currency);

  const {
    subtotal,
    totalVat,
    totalWithholding,
    grandTotal,
    payableAmount,
    computedItems,
  } = computeInvoiceTotals(items);

  const contactName =
    invoice.contactName || contact?.name || "Müşteri seçilmedi";
  const isReceipt = invoice.docKind === "receipt";

  const isTevkifat = invoice.invoiceProfileType === "TEVKIFAT" || totalWithholding > 0;
  const isOzelMatrah =
    invoice.invoiceProfileType === "OZELMATRAH" ||
    items.some((i) => i.specialTaxBaseCode || (i.specialTaxBase !== undefined && i.specialTaxBase !== null));
  const isIstisna =
    invoice.invoiceProfileType === "ISTISNA" || items.some((i) => i.exemptionCode);

  let docBadge = isReceipt
    ? "GELİR FİŞİ"
    : eDocumentLabel.toLowerCase().includes("arşiv") ||
      eDocumentLabel.toLowerCase().includes("arsiv")
    ? "e-ARŞİV FATURA"
    : "e-FATURA";

  if (isTevkifat) {
    docBadge = `TEVKİFATLI ${docBadge}`;
  } else if (isOzelMatrah) {
    docBadge = `ÖZEL MATRAH (${docBadge})`;
  } else if (isIstisna) {
    docBadge = `İSTİSNA (${docBadge})`;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 text-[10px] leading-snug text-slate-800 shadow-xs">
      <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="min-w-0">
          <Logo size="sm" />
          <p className="font-extrabold text-slate-900 mt-1 truncate">
            {companySettings?.companyName || "Firma"}
          </p>
          <p className="text-slate-500 truncate">
            VKN: {companySettings?.taxNumber || "-"}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="inline-block bg-slate-900 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase">
            {docBadge}
          </span>
          <p className="font-mono font-bold mt-1">{invNumber}</p>
          <p className="text-slate-500">{formatDate(invoice.issueDate || new Date().toISOString())}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
          <p className="text-[9px] font-black uppercase text-indigo-700">Alıcı</p>
          <p className="font-bold truncate">{contactName}</p>
          <p className="text-slate-600">VKN: {contact?.taxNumber || invoice.taxNumber || "-"}</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
          <p className="text-[9px] font-black uppercase text-indigo-700">Cari</p>
          <p className="font-mono font-bold">
            {contact ? getContactAccountCode(contact) : "-"}
          </p>
          <p className="text-slate-600 truncate">{contact?.city || ""}</p>
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-900 text-white text-[9px] uppercase">
              <th className="py-1.5 px-2">Açıklama</th>
              <th className="py-1.5 px-2 text-center">Miktar</th>
              <th className="py-1.5 px-2 text-right">Tutar</th>
            </tr>
          </thead>
          <tbody>
            {computedItems.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-4 text-center text-slate-400">
                  Kalem ekleyin…
                </td>
              </tr>
            ) : (
              computedItems.map((item, idx) => {
                const badge = formatWithholdingBadge(item);
                return (
                  <tr key={item.id || idx} className="border-t border-slate-100">
                    <td className="py-1.5 px-2 font-semibold">
                      <div>{item.description || "Mal / Hizmet"}</div>
                      {badge && (
                        <span className="inline-block text-[8px] font-mono font-bold bg-purple-100 text-purple-800 px-1 py-0.2 rounded mt-0.5">
                          Tevkifat: {badge}
                        </span>
                      )}
                      {item.specialTaxBase !== undefined && item.specialTaxBase !== null && (
                        <span className="inline-block text-[8px] font-bold bg-amber-100 text-amber-800 px-1 py-0.2 rounded mt-0.5 ml-1">
                          Özel Matrah: {currSymbol}{Number(item.specialTaxBase).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 px-2 text-center">{item.quantity}</td>
                    <td className="py-1.5 px-2 text-right font-mono">
                      {currSymbol}
                      {(item.lineGrandTotal || item.totalWithVat || 0).toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-indigo-50/70 border border-indigo-200 rounded-lg p-2">
        <p className="text-[9px] font-black uppercase text-indigo-800">Yalnız</p>
        <p className="font-bold text-indigo-950"># {numberToTurkishWords(payableAmount)} #</p>
      </div>

      <div className="space-y-1 text-[10px]">
        <div className="flex justify-between text-slate-600">
          <span>Ara toplam</span>
          <span className="font-mono font-bold">
            {currSymbol}
            {subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Hesaplanan KDV</span>
          <span className="font-mono font-bold">
            {currSymbol}
            {totalVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
          </span>
        </div>
        {totalWithholding > 0 && (
          <div className="flex justify-between text-rose-600 font-medium">
            <span>(-) Tevkif Edilen KDV</span>
            <span className="font-mono font-bold">
              -{currSymbol}
              {totalWithholding.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
        <div className="flex justify-between text-slate-600 pt-0.5 border-t border-slate-200">
          <span>Fatura Toplamı</span>
          <span className="font-mono font-bold">
            {currSymbol}
            {grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between items-center pt-1 border-t border-slate-300 font-black text-sm">
          <span>🎯 Ödenecek Tutar</span>
          <span className="font-mono text-indigo-700">
            {currSymbol}
            {payableAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {invoice.notes?.trim() && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
          <p className="text-[9px] font-bold uppercase text-slate-500">Not</p>
          <p className="whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}
    </div>
  );
};
