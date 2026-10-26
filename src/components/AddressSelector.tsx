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
}

export const AddressSelector: React.FC<AddressSelectorProps> = ({
  title,
  address,
  value,
  onChange,
  showTaxOffice = false,
  taxOfficeValue = "",
  onTaxOfficeChange,
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

  return (
    <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <MapPin className="w-3.5 h-3.5 text-indigo-600" />
          <span>{title || "Adres Bilgileri"} (Mahalle, Cadde-Sokak, İlçe, İl)</span>
        </div>
        <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
          Tam Adres: Mahalle, Cadde-Sokak, İlçe, İl
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Mahalle */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
            <Home className="w-3 h-3 text-slate-400" />
            <span>1. Mahalle *</span>
          </label>
          <input
            type="text"
            placeholder="Örn: Mecidiyeköy Mah."
            value={safeValue.neighborhood || ""}
            onChange={(e) => handleFieldChange("neighborhood", e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* 2. Cadde - Sokak */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
            <Navigation className="w-3 h-3 text-slate-400" />
            <span>2. Cadde - Sokak *</span>
          </label>
          <input
            type="text"
            placeholder="Örn: Büyükdere Cad. No: 195"
            value={safeValue.street || ""}
            onChange={(e) => handleFieldChange("street", e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* 3. İlçe */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            3. İlçe *
          </label>
          <input
            type="text"
            placeholder="Örn: Şişli"
            value={safeValue.district || ""}
            onChange={(e) => handleFieldChange("district", e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* 4. İl */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            4. İl *
          </label>
          <input
            type="text"
            placeholder="Örn: İstanbul"
            value={safeValue.city || ""}
            onChange={(e) => handleFieldChange("city", e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Bina No, Daire/Kat, Posta Kodu ve Vergi Dairesi */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Bina / Kapı No
          </label>
          <input
            type="text"
            placeholder="Örn: 195"
            value={safeValue.buildingNo || ""}
            onChange={(e) => handleFieldChange("buildingNo", e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Daire / Kat / Blok
          </label>
          <input
            type="text"
            placeholder="Örn: Kat: 8 D: 12"
            value={safeValue.doorNo || ""}
            onChange={(e) => handleFieldChange("doorNo", e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Posta Kodu
          </label>
          <input
            type="text"
            maxLength={5}
            placeholder="34394"
            value={safeValue.postalCode || ""}
            onChange={(e) => handleFieldChange("postalCode", e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {showTaxOffice && onTaxOfficeChange && (
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-indigo-600" />
            <span>Vergi Dairesi</span>
          </label>
          <input
            type="text"
            placeholder="Vergi dairesi adını girin..."
            value={taxOfficeValue}
            onChange={(e) => onTaxOfficeChange(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      )}

      {/* Tam Adres (Mahalle, Cadde-Sokak, İlçe, İl) */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[11px] font-bold text-slate-700">
            Kaydedilecek Tam Adres (Mahalle, Cadde-Sokak, İlçe, İl)
          </label>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...safeValue,
                fullAddress: buildFullAddress(safeValue),
              })
            }
            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
          >
            Alanlardan Birleştir
          </button>
        </div>
        <textarea
          rows={2}
          placeholder="Mahalle, Cadde-Sokak, İlçe, İl"
          value={safeValue.fullAddress || ""}
          onChange={(e) => handleFullAddressInput(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>
    </div>
  );
};
