import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { X, Printer, Download, Check, Sparkles, Tag, ShieldCheck } from "lucide-react";
import { FixedAsset } from "../../types";

interface AssetLabelPrintModalProps {
  asset: FixedAsset;
  companyName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AssetLabelPrintModal: React.FC<AssetLabelPrintModalProps> = ({
  asset,
  companyName,
  isOpen,
  onClose,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [labelSize, setLabelSize] = useState<"standard" | "small" | "large">("standard");
  const [includeBarcode, setIncludeBarcode] = useState(true);
  const [includeSerial, setIncludeSerial] = useState(true);
  const [includeLocation, setIncludeLocation] = useState(true);
  const [includeCustody, setIncludeCustody] = useState(true);

  useEffect(() => {
    if (!asset || !isOpen) return;

    // Generate rich QR payload
    const qrData = JSON.stringify({
      code: asset.code,
      name: asset.name,
      serial: asset.serialNumber || "-",
      company: companyName,
      cat: asset.categoryLabel || asset.category,
      date: asset.acquisitionDate,
    });

    QRCode.toDataURL(qrData, {
      width: 250,
      margin: 1,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error("QR Code generation error:", err));
  }, [asset, companyName, isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Demirbaş Barkod & QR Kod Etiketi
              </h3>
              <p className="text-xs text-slate-500">
                {asset.code} • {asset.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Etiket Boyutu:</span>
            <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
              <button
                type="button"
                onClick={() => setLabelSize("small")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  labelSize === "small"
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Küçük (50x30 mm)
              </button>
              <button
                type="button"
                onClick={() => setLabelSize("standard")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  labelSize === "standard"
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Standart (70x45 mm)
              </button>
              <button
                type="button"
                onClick={() => setLabelSize("large")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  labelSize === "large"
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Geniş (100x60 mm)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={includeCustody}
                onChange={(e) => setIncludeCustody(e.target.checked)}
                className="rounded text-blue-600 focus:ring-0"
              />
              <span>Zimmetli Kişi</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={includeLocation}
                onChange={(e) => setIncludeLocation(e.target.checked)}
                className="rounded text-blue-600 focus:ring-0"
              />
              <span>Lokasyon</span>
            </label>
          </div>
        </div>

        {/* Label Canvas / Preview Area */}
        <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center bg-slate-100/70 print:p-0 print:bg-white">
          <div
            id="printable-asset-label"
            className={`bg-white border-2 border-slate-800 rounded-xl shadow-lg p-5 flex flex-col justify-between print:shadow-none print:border-black print:m-0 ${
              labelSize === "small"
                ? "w-[300px] min-h-[170px]"
                : labelSize === "large"
                ? "w-[440px] min-h-[250px]"
                : "w-[380px] min-h-[210px]"
            }`}
          >
            {/* Top Company Brand */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-[10px]">
                  M
                </div>
                <span className="text-[12px] font-extrabold uppercase tracking-wider text-slate-900">
                  {companyName || "TALLSOFT MUAVİN ERP"}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded">
                DEMİRBAŞ ETİKETİ
              </span>
            </div>

            {/* Middle Section: QR + Details */}
            <div className="flex items-start gap-4 my-auto">
              {/* QR Code Container */}
              <div className="shrink-0 flex flex-col items-center">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="Asset QR Code"
                    className={`rounded border border-slate-200 ${
                      labelSize === "small" ? "w-20 h-20" : "w-24 h-24"
                    }`}
                  />
                ) : (
                  <div className="w-20 h-20 bg-slate-100 animate-pulse rounded" />
                )}
                <span className="text-[9px] font-mono text-slate-500 mt-1 font-semibold">
                  TARA & DOĞRULA
                </span>
              </div>

              {/* Text Meta Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">
                    {asset.code}
                  </span>
                  <h4 className="text-[13px] font-bold text-slate-900 leading-tight line-clamp-2">
                    {asset.name}
                  </h4>
                </div>

                <div className="space-y-0.5 text-[10.5px] text-slate-600 pt-1">
                  {includeSerial && asset.serialNumber && (
                    <div className="flex items-center gap-1 text-slate-700">
                      <span className="font-semibold text-slate-500">Seri No:</span>
                      <span className="font-mono">{asset.serialNumber}</span>
                    </div>
                  )}

                  {asset.plateNumber && (
                    <div className="flex items-center gap-1 text-slate-700">
                      <span className="font-semibold text-slate-500">Plaka:</span>
                      <span className="font-bold text-slate-900 bg-amber-100 px-1 rounded">
                        {asset.plateNumber}
                      </span>
                    </div>
                  )}

                  {includeLocation && (asset.location || asset.branchName) && (
                    <div className="flex items-center gap-1 text-slate-700">
                      <span className="font-semibold text-slate-500">Konum:</span>
                      <span className="truncate">{asset.location || asset.branchName}</span>
                    </div>
                  )}

                  {includeCustody && asset.custodyEmployeeName && (
                    <div className="flex items-center gap-1 text-slate-700">
                      <span className="font-semibold text-slate-500">Zimmet:</span>
                      <span className="font-medium text-slate-800 truncate">
                        {asset.custodyEmployeeName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Barcode Strip & Disclaimer */}
            <div className="border-t border-slate-200 pt-2 mt-2 flex items-center justify-between text-[9px] text-slate-500">
              <div className="flex items-center gap-1 font-mono">
                <span>BARKOD:</span>
                <span className="font-bold text-slate-800">
                  {asset.barcode || asset.code.replace(/[^0-9]/g, "") || "869001002024"}
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Resmi Kayıtlı Demirbaş</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between print:hidden">
          <div className="text-xs text-slate-500">
            Termal etiket yazıcıları (Zebra, Xprinter, TSC) ve standart A4 etiket sayfaları ile tam uyumludur.
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Kapat
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Etiketi Yazdır</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
