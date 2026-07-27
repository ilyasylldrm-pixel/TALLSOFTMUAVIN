import React, { useState, useEffect } from "react";
import { AddressDetails } from "../types";
import {
  MapPin,
  Building,
  Globe,
  Hash,
  Signpost,
  Database,
} from "lucide-react";
import {
  fetchProvinces,
  getActiveLocationSource,
  normalizeTr,
  TurkiyeApiProvince,
} from "../services/turkiyeApi";
import {
  ALL_81_PROVINCES,
  getDistrictsForProvince,
} from "../data/locationAndTaxData";

interface AddressSelectorProps {
  address: AddressDetails;
  onChange: (updated: AddressDetails) => void;
  title?: string;
  showCardWrapper?: boolean;
}

export const AddressSelector: React.FC<AddressSelectorProps> = ({
  address,
  onChange,
  title = "Adres Seçimi & Bilgileri",
  showCardWrapper = true,
}) => {
  const [apiProvinces, setApiProvinces] = useState<TurkiyeApiProvince[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);

  // Load provinces dataset (melihozkara repository / turkiyeApi)
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const data = await fetchProvinces();
        if (isMounted && data && data.length > 0) {
          setApiProvinces(data);
        }
      } catch (err) {
        console.warn("Location data load issue:", err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedCity = address.city || "İstanbul";
  const selectedDistrict = address.district || "";

  // Helper to compile full address string
  const compileAddress = (updated: AddressDetails): string => {
    const parts = [];
    if (updated.street) parts.push(updated.street);
    if (updated.buildingNo) parts.push(`No:${updated.buildingNo}`);
    if (updated.doorNo) {
      parts.push(updated.doorNo.startsWith("D:") ? updated.doorNo : `D:${updated.doorNo}`);
    }
    if (updated.neighborhood) parts.push(updated.neighborhood);
    if (updated.district && updated.city) {
      parts.push(`${updated.district} / ${updated.city}`);
    }
    if (updated.country && updated.country !== "Türkiye") {
      parts.push(updated.country);
    }
    return parts.join(", ");
  };

  const handleFieldChange = (field: keyof AddressDetails, value: string) => {
    const updated = {
      ...address,
      [field]: value,
    };
    if (field !== "fullAddress") {
      updated.fullAddress = compileAddress(updated);
    }
    onChange(updated);
  };

  // Update district options when City changes
  useEffect(() => {
    const cityNorm = normalizeTr(selectedCity);

    if (apiProvinces.length > 0) {
      const foundProv = apiProvinces.find((p) => normalizeTr(p.name) === cityNorm);
      if (foundProv && foundProv.districts && foundProv.districts.length > 0) {
        const distNames = foundProv.districts.map((d) => d.name);
        setAvailableDistricts(distNames);
        if (!selectedDistrict || !distNames.some((d) => normalizeTr(d) === normalizeTr(selectedDistrict))) {
          if (distNames[0]) {
            handleFieldChange("district", distNames[0]);
          }
        }
        return;
      }
    }

    // Fallback local districts list
    const localDistricts = getDistrictsForProvince(selectedCity);
    setAvailableDistricts(localDistricts);
    if (!selectedDistrict || !localDistricts.some((d) => normalizeTr(d) === normalizeTr(selectedDistrict))) {
      if (localDistricts[0]) {
        handleFieldChange("district", localDistricts[0]);
      }
    }
  }, [selectedCity, apiProvinces]);

  // Province options
  const provinceOptions =
    apiProvinces.length > 0
      ? apiProvinces.map((p) => p.name)
      : ALL_81_PROVINCES.map((p) => p.name);

  const dataSourceLabel =
    getActiveLocationSource() === "melihozkara"
      ? "melihozkara Türkiye İl/İlçe Veritabanı"
      : getActiveLocationSource() === "mburakkalkan"
      ? "mburakkalkan Türkiye Veritabanı"
      : "Türkiye Yerel Veritabanı";

  const content = (
    <div className="space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-indigo-600" />
          <h4 className="font-extrabold text-slate-900">{title}</h4>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg font-bold shadow-2xs">
          <Database className="w-3 h-3 text-indigo-600 animate-pulse" />
          <span>{dataSourceLabel}</span>
        </div>
      </div>

      {/* Row 1: Ülke & İl (Şehir - Dropdown) & İlçe (Dropdown) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Ülke */}
        <div>
          <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-indigo-500" /> Ülke
          </label>
          <input
            type="text"
            placeholder="ör: Türkiye"
            value={address.country || "Türkiye"}
            onChange={(e) => handleFieldChange("country", e.target.value)}
            className="w-full bg-white border border-slate-300 focus:border-indigo-500 rounded-xl p-2 font-medium text-slate-800"
          />
        </div>

        {/* İl (Şehir) - Dropdown Select */}
        <div>
          <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
            <Building className="w-3.5 h-3.5 text-indigo-500" /> İl (Şehir)
          </label>
          <select
            value={selectedCity}
            onChange={(e) => handleFieldChange("city", e.target.value)}
            className="w-full bg-white border border-slate-300 focus:border-indigo-500 rounded-xl p-2 font-semibold text-slate-800 shadow-2xs cursor-pointer"
          >
            {provinceOptions.map((provName) => (
              <option key={provName} value={provName}>
                {provName}
              </option>
            ))}
          </select>
        </div>

        {/* İlçe - Dropdown Select */}
        <div>
          <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-indigo-500" /> İlçe
          </label>
          <select
            value={selectedDistrict}
            onChange={(e) => handleFieldChange("district", e.target.value)}
            className="w-full bg-white border border-slate-300 focus:border-indigo-500 rounded-xl p-2 font-semibold text-slate-800 shadow-2xs cursor-pointer"
          >
            {availableDistricts.length === 0 ? (
              <option value="">İlçe seçiniz...</option>
            ) : (
              availableDistricts.map((dist) => (
                <option key={dist} value={dist}>
                  {dist}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Row 2: Mahalle & Cadde/Sokak (Manual Text Inputs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Mahalle */}
        <div>
          <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
            <Signpost className="w-3.5 h-3.5 text-indigo-500" /> Mahalle
          </label>
          <input
            type="text"
            placeholder="ör: Caferağa Mah."
            value={address.neighborhood || ""}
            onChange={(e) => handleFieldChange("neighborhood", e.target.value)}
            className="w-full bg-white border border-slate-300 focus:border-indigo-500 rounded-xl p-2 text-slate-800 font-medium"
          />
        </div>

        {/* Cadde / Sokak */}
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            Cadde / Sokak / Bulvar
          </label>
          <input
            type="text"
            placeholder="ör: Moda Cad. 1024. Sokak"
            value={address.street || ""}
            onChange={(e) => handleFieldChange("street", e.target.value)}
            className="w-full bg-white border border-slate-300 focus:border-indigo-500 rounded-xl p-2 text-slate-800 font-medium"
          />
        </div>
      </div>

      {/* Row 3: Bina No & Daire No & Posta Kodu */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
            <Hash className="w-3.5 h-3.5 text-indigo-500" /> Bina No
          </label>
          <input
            type="text"
            placeholder="ör: 15"
            value={address.buildingNo || ""}
            onChange={(e) => handleFieldChange("buildingNo", e.target.value)}
            className="w-full bg-white border border-slate-300 focus:border-indigo-500 rounded-xl p-2 font-medium"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">
            Daire / Kat
          </label>
          <input
            type="text"
            placeholder="ör: D:4"
            value={address.doorNo || ""}
            onChange={(e) => handleFieldChange("doorNo", e.target.value)}
            className="w-full bg-white border border-slate-300 focus:border-indigo-500 rounded-xl p-2 font-medium"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">
            Posta Kodu
          </label>
          <input
            type="text"
            maxLength={5}
            placeholder="ör: 34710"
            value={address.postalCode || ""}
            onChange={(e) => handleFieldChange("postalCode", e.target.value)}
            className="w-full bg-white border border-slate-300 focus:border-indigo-500 rounded-xl p-2 font-mono"
          />
        </div>
      </div>

      {/* Open Address */}
      <div>
        <label className="block font-bold text-slate-700 mb-1">
          Açık Adres Detayı
        </label>
        <textarea
          rows={2}
          placeholder="Tam adres metni..."
          value={address.fullAddress || ""}
          onChange={(e) => handleFieldChange("fullAddress", e.target.value)}
          className="w-full bg-white border border-slate-300 focus:border-indigo-500 rounded-xl p-2.5 text-slate-800 font-medium text-xs leading-relaxed"
        />
      </div>
    </div>
  );

  if (!showCardWrapper) {
    return content;
  }

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
      {content}
    </div>
  );
};
