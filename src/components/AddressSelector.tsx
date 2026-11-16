import React from "react";
import { AddressDetails } from "../types";
import { MapPin, Building2, Navigation, Home } from "lucide-react";
import { compileStructuredAddress, parseCommaAddressParts } from "../utils/storage";

interface AddressSelectorProps {
  title?: string;
  address?: AddressDetails;
  value?: AddressDetails;
  onChange: (details: AddressDetails) => void;
  showTaxOffice?: boolean;
  taxOfficeValue?: string;
  onTaxOfficeChange?: (taxOffice: string) => void;
  frameless?: boolean;
}

export const AddressSelector: React.FC<AddressSelectorProps> = ({
  title,
  address,
  value,
  onChange,
  showTaxOffice = false,
  taxOfficeValue = "",
  onTaxOfficeChange,
  frameless = false,
}) => {
  const safeValue: AddressDetails = address || value || {
    country: "Türkiye",
    city: "",
    district: "",
    neighborhood: "",
    street: "",
    buildingNo: "",
    doorNo: "",
    postalCode: "",
    fullAddress: "",
  };

  const buildFullAddress = (details: AddressDetails): string => {
    const compiled = compileStructuredAddress(
      details.neighborhood,
      details.street,
      details.district,
      details.city,
      details.buildingNo,
      details.doorNo,
      details.postalCode
    );
    return compiled || details.fullAddress || "";
  };

  const handleFieldChange = (field: keyof AddressDetails, val: string) => {
    const next: AddressDetails = {
      ...safeValue,
      country: safeValue.country || "Türkiye",
      [field]: val,
    };
    next.fullAddress = buildFullAddress(next);
    onChange(next);
  };

  const handleFullAddressInput = (rawFull: string) => {
    const parsed = parseCommaAddressParts(rawFull);
    onChange({
      ...safeValue,
      country: safeValue.country || "Türkiye",
      neighborhood: parsed.neighborhood || safeValue.neighborhood || "",
      street: parsed.street || safeValue.street || "",
      district: parsed.district || safeValue.district || "",
      city: parsed.city || safeValue.city || "",
      fullAddress: rawFull,
    });
  };

  const inputClass =
    "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#0f6bae] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#0f6bae]/15 transition-colors";

  return (
    <div
      className={
        frameless
          ? "space-y-4"
          : "space-y-3.5 bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/70"
      }
    >
      {!frameless && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 dark:border-slate-700/70 pb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
            <MapPin className="w-3.5 h-3.5 text-[#0f6bae] dark:text-sky-400 shrink-0" />
            <span>{title || "Adres Bilgileri"}</span>
          </div>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Mahalle, Cadde-Sokak, İlçe, İl formatı
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1">
            <Home className="w-3 h-3 text-slate-400 shrink-0" />
            <span>Mahalle *</span>
          </label>
          <input
            type="text"
            placeholder="Örn: Mecidiyeköy Mah."
            value={safeValue.neighborhood || ""}
            onChange={(e) => handleFieldChange("neighborhood", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1">
            <Navigation className="w-3 h-3 text-slate-400 shrink-0" />
            <span>Cadde / Sokak *</span>
          </label>
          <input
            type="text"
            placeholder="Örn: Büyükdere Cad."
            value={safeValue.street || ""}
            onChange={(e) => handleFieldChange("street", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            İlçe *
          </label>
          <input
            type="text"
            placeholder="Örn: Şişli"
            value={safeValue.district || ""}
            onChange={(e) => handleFieldChange("district", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            İl *
          </label>
          <input
            type="text"
            placeholder="Örn: İstanbul"
            value={safeValue.city || ""}
            onChange={(e) => handleFieldChange("city", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            Bina / Dış Kapı No
          </label>
          <input
            type="text"
            placeholder="Örn: 195"
            value={safeValue.buildingNo || ""}
            onChange={(e) => handleFieldChange("buildingNo", e.target.value)}
            className={`${inputClass} font-mono tabular-nums`}
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            Daire / Kat / Blok
          </label>
          <input
            type="text"
            placeholder="Örn: Kat: 8 D: 12"
            value={safeValue.doorNo || ""}
            onChange={(e) => handleFieldChange("doorNo", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            Posta Kodu
          </label>
          <input
            type="text"
            maxLength={5}
            placeholder="34394"
            value={safeValue.postalCode || ""}
            onChange={(e) => handleFieldChange("postalCode", e.target.value)}
            className={`${inputClass} font-mono tabular-nums`}
          />
        </div>
      </div>

      {showTaxOffice && onTaxOfficeChange && (
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-[#0f6bae] dark:text-sky-400 shrink-0" />
            <span>Vergi Dairesi</span>
          </label>
          <input
            type="text"
            placeholder="Vergi dairesi adını girin..."
            value={taxOfficeValue}
            onChange={(e) => onTaxOfficeChange(e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-200">
            Resmi Belgelere Basılacak Tam Adres
          </label>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...safeValue,
                fullAddress: buildFullAddress(safeValue),
              })
            }
            className="text-[11px] font-semibold text-[#0f6bae] dark:text-sky-400 hover:underline cursor-pointer whitespace-nowrap"
          >
            Alanlardan Otomatik Birleştir
          </button>
        </div>
        <textarea
          rows={2}
          placeholder="Mahalle, Cadde-Sokak, Bina/Kapı No, İlçe / İl"
          value={safeValue.fullAddress || ""}
          onChange={(e) => handleFullAddressInput(e.target.value)}
          className={`${inputClass} leading-relaxed`}
        />
      </div>
    </div>
  );
};
