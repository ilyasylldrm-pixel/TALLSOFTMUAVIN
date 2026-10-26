import React, { useEffect, useState } from "react";
import type { CompanySettings, Contact, Invoice, InvoiceItem, InvoicePreviewCssConfig } from "../types";
import { getContactAccountCode } from "../types";
import { numberToTurkishWords } from "../utils/numberToTurkishWords";
import { getCurrencySymbol, formatDate } from "../utils/exportUtils";
import { computeInvoiceTotals, formatWithholdingBadge } from "../utils/taxCalculationService";
import {
  formatAddressWithBranch,
  getCompanyHeadquartersAddress,
  resolveBranchAddressFromBranches,
} from "../utils/storage";
import { Logo } from "./Logo";
import {
  GibOfficialSealSvg,
  DigitalCompanyStampSvg,
  resolveInvoiceDesignSettings,
  resolveInvoiceThemePalette,
  resolveOfficialEDocumentKind,
  getIndependentInvoiceCssConfig,
  buildInvoicePreviewScopedCss,
} from "./OfficialGIBInvoicePaper";

export interface InvoiceLivePreviewProps {
  invoice: Partial<Invoice>;
  companySettings: CompanySettings;
  contact?: Contact;
  eDocumentLabel?: string;
}

/** Compact official GIB XSLT live preview while creating/editing an invoice. */
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

  const design = resolveInvoiceDesignSettings(companySettings);
  const [cssConfig, setCssConfig] = useState<InvoicePreviewCssConfig>(() =>
    getIndependentInvoiceCssConfig(design.cssConfig)
  );

  useEffect(() => {
    const sync = () => {
      setCssConfig(getIndependentInvoiceCssConfig(design.cssConfig));
    };
    window.addEventListener("muavin:invoice-css-config-changed", sync);
    return () => window.removeEventListener("muavin:invoice-css-config-changed", sync);
  }, [design.cssConfig]);

  const palette = resolveInvoiceThemePalette(design);

  const isExplicitEArsiv =
    eDocumentLabel.toLowerCase().includes("arşiv") ||
    eDocumentLabel.toLowerCase().includes("arsiv") ||
    invoice.invoiceScenario === "EARSIVFATURA";

  const docMeta = resolveOfficialEDocumentKind(
    invoice,
    companySettings,
    contact,
    isExplicitEArsiv ? "e_arsiv" : "auto"
  );

  const {
    grossTotal,
    totalDiscount,
    subtotal,
    totalVat,
    totalWithholding,
    grandTotal,
    payableAmount,
    computedItems,
  } = computeInvoiceTotals(items);

  const contactName =
    invoice.contactName || contact?.companyTitle || contact?.name || "Müşteri seçilmedi";
  const customerBranchName = invoice.customerBranchName || contact?.branchName;
  const customerBranchCode = invoice.customerBranchCode || contact?.branchCode;
  const customerFullAddress = formatAddressWithBranch(
    invoice.customerAddress || contact?.address,
    invoice.customerCity || contact?.city,
    invoice.customerDistrict || contact?.district,
    customerBranchName,
    customerBranchCode
  );

  const sellerTitle =
    companySettings?.companyTitle || companySettings?.companyName || "Firma Ünvanı";
  const sellerHqAddress =
    getCompanyHeadquartersAddress(companySettings) ||
    companySettings?.address ||
    "-";
  const resolvedSellerBranch = resolveBranchAddressFromBranches({
    branchId: invoice.branchId,
    branchCode: invoice.branchCode,
    branchName: invoice.branchName,
    fallbackBranchAddress: invoice.branchAddress,
  });
  const sellerBranchName = (invoice.branchName || resolvedSellerBranch.branchName || "").trim();
  const sellerBranchAddress = (resolvedSellerBranch.branchAddress || "").trim();
  const sellerTaxNo =
    companySettings?.vkn ||
    companySettings?.tckn ||
    companySettings?.taxNumber ||
    "-";

  const bankIban =
    invoice.paymentIban || companySettings?.defaultBankIban || companySettings?.iban || "";
  const bankName =
    invoice.paymentBankName ||
    invoice.paymentAccountName ||
    companySettings?.defaultBankName ||
    companySettings?.bankName ||
    "";

  const signatureNode =
    design.showSignatureStamp !== false ? (
      <div className="issuer-signature-css-target mt-1.5 w-full border border-slate-300 rounded p-1 text-center bg-white">
        <span className="text-[6.5px] font-black uppercase text-slate-500 block mb-0.5 w-full">
          {docMeta.isEArsiv ? "DÜZENLEYEN İMZA" : "MALİ MÜHÜR / İMZA"}
        </span>
        {design.stampImageUrl ? (
          <img
            src={design.stampImageUrl}
            alt="Kaşe"
            className="max-h-9 mx-auto object-contain"
          />
        ) : (
          <DigitalCompanyStampSvg
            companyName={sellerTitle}
            taxOffice={companySettings?.taxOffice}
            taxNumber={sellerTaxNo}
            color="#1e3a8a"
          />
        )}
      </div>
    ) : null;

  return (
    <div
      id="invoice-live-preview-paper"
      className="bg-white border border-slate-300 rounded-xl p-3.5 space-y-2.5 text-[9.5px] leading-snug text-slate-900 shadow-xs"
    >
      <style>{buildInvoicePreviewScopedCss("invoice-live-preview-paper", cssConfig)}</style>

      {/* 1. Top 3-Column GIB Header */}
      <div className="grid grid-cols-12 gap-2 items-start border-b-2 border-slate-900 pb-2.5">
        {/* Left: Seller */}
        <div
          style={{ borderColor: palette.border }}
          className="col-span-5 border-y py-1 space-y-0.5 min-w-0"
        >
          <div className="issuer-seller-css-target space-y-0.5">
            <p
              style={{ color: palette.primary }}
              className="font-black text-[10px] uppercase leading-tight truncate"
              title={sellerTitle}
            >
              {sellerTitle}
            </p>
            <p className="text-slate-600 line-clamp-2 text-[8.5px]">
              <strong className="text-slate-800">Merkez:</strong> {sellerHqAddress}
            </p>
            {(sellerBranchName || sellerBranchAddress) && (
              <p className="text-purple-800 font-semibold line-clamp-2 text-[8.5px]">
                <strong className="font-bold">
                  Şube{sellerBranchName ? ` (${sellerBranchName})` : ""}:
                </strong>{" "}
                {sellerBranchAddress || "-"}
              </p>
            )}
            <p className="text-slate-700 font-semibold text-[8.5px]">
              VD: {companySettings?.taxOffice || "-"} • VKN:{" "}
              <span className="font-mono font-bold">{sellerTaxNo}</span>
            </p>
          </div>
          {cssConfig.signatureZone === "under_seller" && signatureNode}
        </div>

        {/* Center: GIB Seal + Title + Issuer Signature/Stamp */}
        <div className="col-span-3 flex flex-col items-center justify-start text-center">
          <div className="gib-logo-css-target w-full">
            {!docMeta.isReceipt && design.showGibSeal !== false && (
              <GibOfficialSealSvg
                color={design.colorTheme === "classic" ? "#111827" : "#b91c1c"}
                size={Math.min(64, Math.max(34, Math.round((cssConfig.gibLogoSize || 76) * 0.56)))}
              />
            )}
            <span
              style={{ color: palette.primary }}
              className="font-black text-[10px] tracking-tight mt-1 leading-none block"
            >
              {docMeta.docTitle}
            </span>
            <span className="text-[7px] font-bold uppercase text-slate-500 mt-0.5 block">
              {docMeta.scenarioCode}
            </span>
          </div>

          {(cssConfig.signatureZone || "under_gib") === "under_gib" && signatureNode}
        </div>

        {/* Right: Logo & Metadata Table */}
        <div className="col-span-4 flex flex-col items-end space-y-1">
          {design.showCompanyLogo !== false && (
            <div className="max-h-7 overflow-hidden flex justify-end">
              <Logo size="sm" src={companySettings?.logoUrl || "/logo.svg"} />
            </div>
          )}
          <div className="w-full border border-slate-700 text-[8.5px]">
            <div className="flex justify-between px-1.5 py-0.5 bg-slate-100 border-b border-slate-300">
              <span className="font-bold">Özelleştirme:</span>
              <span className="font-mono font-bold">TR1.2</span>
            </div>
            <div className="flex justify-between px-1.5 py-0.5 border-b border-slate-300">
              <span className="font-bold">Tip:</span>
              <span className="font-mono font-extrabold">{docMeta.profileCode}</span>
            </div>
            <div className="flex justify-between px-1.5 py-0.5 bg-slate-100 border-b border-slate-300">
              <span className="font-bold">Fatura No:</span>
              <span className="font-mono font-black truncate max-w-[85px]">{invNumber}</span>
            </div>
            <div className="flex justify-between px-1.5 py-0.5">
              <span className="font-bold">Tarih:</span>
              <span className="font-mono">{formatDate(invoice.issueDate || new Date().toISOString())}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SAYIN (Buyer) Box */}
      <div
        style={{ borderColor: palette.border }}
        className="border-y py-1.5 px-2 bg-slate-50/70 space-y-0.5"
      >
        <div className="flex items-center justify-between">
          <span
            style={{ color: palette.primary }}
            className="text-[8.5px] font-black uppercase tracking-wider"
          >
            SAYIN (ALICI BİLGİLERİ)
          </span>
          <span className="font-mono text-[8px] text-slate-500 font-bold">
            Cari: {contact ? getContactAccountCode(contact) : "-"}
          </span>
        </div>
        <p className="font-black text-slate-900 text-[10px] truncate">{contactName}</p>
        {customerBranchName && (
          <p className="text-indigo-800 font-bold truncate text-[8.5px]">
            Şube: {customerBranchName}
            {customerBranchCode ? ` (${customerBranchCode})` : ""}
          </p>
        )}
        {customerFullAddress && (
          <p className="text-slate-600 truncate text-[8.5px]" title={customerFullAddress}>
            {customerFullAddress}
          </p>
        )}
        <p className="text-slate-700 text-[8.5px]">
          VD: <strong>{invoice.taxOffice || contact?.taxOffice || "-"}</strong> • VKN/TCKN:{" "}
          <strong className="font-mono">{contact?.taxNumber || invoice.taxNumber || "-"}</strong>
        </p>
      </div>

      {/* 3. Line Items Table */}
      <div className="border border-slate-700 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr
              style={{ backgroundColor: palette.headerBg, color: palette.headerText }}
              className="text-[8.5px] uppercase font-bold"
            >
              <th className="py-1 px-1.5 border-r border-slate-400/40 w-6 text-center">#</th>
              <th className="py-1 px-1.5 border-r border-slate-400/40">Mal / Hizmet</th>
              <th className="py-1 px-1.5 border-r border-slate-400/40 text-center">Miktar</th>
              <th className="py-1 px-1.5 border-r border-slate-400/40 text-center">KDV</th>
              <th className="py-1 px-1.5 text-right">Tutar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {computedItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-3 text-center text-slate-400">
                  Kalem ekleyin…
                </td>
              </tr>
            ) : (
              computedItems.map((item, idx) => {
                const badge = formatWithholdingBadge(item);
                return (
                  <tr key={item.id || idx}>
                    <td className="py-1 px-1.5 border-r border-slate-200 text-center font-mono text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-1 px-1.5 border-r border-slate-200 font-semibold">
                      <div className="truncate max-w-[140px]">
                        {item.description || "Mal / Hizmet"}
                      </div>
                      {badge && (
                        <span className="inline-block text-[7.5px] font-mono font-bold bg-purple-100 text-purple-800 px-1 rounded">
                          Tevkifat: {badge}
                        </span>
                      )}
                    </td>
                    <td className="py-1 px-1.5 border-r border-slate-200 text-center font-mono">
                      {item.quantity} {item.unit || "Adet"}
                    </td>
                    <td className="py-1 px-1.5 border-r border-slate-200 text-center font-mono">
                      %{item.vatRate ?? 0}
                    </td>
                    <td className="py-1 px-1.5 text-right font-mono font-bold">
                      {currSymbol}
                      {(item.effectiveTaxableAmount ?? item.totalWithoutVat ?? 0).toLocaleString(
                        "tr-TR",
                        { minimumFractionDigits: 2 }
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Bottom Grid: Left (Yalnız, IBAN, Legal) & Right (Totals + Stamp) */}
      <div className="grid grid-cols-12 gap-2 items-start">
        <div className="col-span-6 space-y-1.5">
          <div
            style={{
              backgroundColor: palette.headerBg,
              color: palette.headerText,
              borderColor: palette.border,
            }}
            className="border p-1.5"
          >
            <span className="text-[7.5px] font-black uppercase opacity-85 block">YALNIZ:</span>
            <p className="font-bold text-[8.5px]">
              # {numberToTurkishWords(payableAmount)} #
            </p>
          </div>

          {bankIban && (
            <div className="border border-slate-300 p-1.5 text-[8px] space-y-0.5">
              <span className="font-black uppercase text-slate-600 block">BANKA / IBAN:</span>
              {bankName && <p className="font-semibold text-slate-800 truncate">{bankName}</p>}
              <p className="font-mono font-bold text-slate-900 truncate">{bankIban}</p>
            </div>
          )}

          <div
            style={{
              backgroundColor: palette.headerBg,
              color: palette.headerText,
              borderColor: palette.border,
            }}
            className="border p-1.5 text-[8px] space-y-0.5"
          >
            {design.irsaliyeYerineGecer !== false && !docMeta.isReceipt && (
              <p className="font-black">• İrsaliye yerine geçer.</p>
            )}
            <p className="leading-tight opacity-95">
              •{" "}
              {docMeta.isEArsiv
                ? "e-Arşiv izni kapsamında elektronik ortamda iletilmiştir."
                : "5070 sayılı Kanun gereği elektronik imzalıdır."}
            </p>
          </div>
          {cssConfig.signatureZone === "bottom_left" && signatureNode}
        </div>

        <div className="col-span-6 space-y-1.5">
          <div className="border border-slate-700 text-[8.5px] divide-y divide-slate-200">
            {totalDiscount > 0 && (
              <>
                <div className="flex justify-between px-1.5 py-0.5">
                  <span>Mal/Hizmet Toplam:</span>
                  <span className="font-mono font-bold">
                    {currSymbol}
                    {grossTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between px-1.5 py-0.5 text-rose-700">
                  <span>Toplam İskonto:</span>
                  <span className="font-mono font-bold">
                    -{currSymbol}
                    {totalDiscount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between px-1.5 py-0.5">
              <span>KDV Matrahı:</span>
              <span className="font-mono font-bold">
                {currSymbol}
                {subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between px-1.5 py-0.5">
              <span>Hesaplanan KDV:</span>
              <span className="font-mono font-bold">
                {currSymbol}
                {totalVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            {totalWithholding > 0 && (
              <div className="flex justify-between px-1.5 py-0.5 text-rose-700">
                <span>Tevkif Edilen KDV:</span>
                <span className="font-mono font-bold">
                  -{currSymbol}
                  {totalWithholding.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <div className="flex justify-between px-1.5 py-0.5 bg-slate-50 font-bold">
              <span>Vergiler Dahil:</span>
              <span className="font-mono">
                {currSymbol}
                {grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div
              style={{ backgroundColor: palette.headerBg, color: palette.headerText }}
              className="flex justify-between items-center px-1.5 py-1 font-black text-[9.5px]"
            >
              <span>ÖDENECEK:</span>
              <span className="font-mono">
                {currSymbol}
                {payableAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          {cssConfig.signatureZone === "bottom_right" && signatureNode}
        </div>
      </div>
    </div>
  );
};
