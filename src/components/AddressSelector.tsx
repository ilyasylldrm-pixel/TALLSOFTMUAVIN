import React, { useState, useEffect, useId } from "react";
import { AddressDetails } from "../types";
import {
  MapPin,
  Building,
  Globe,
  Hash,
  Signpost,
  Database,
  Navigation,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  fetchTrAdresProvinces,
  fetchTrAdresDistricts,
  fetchTrAdresNeighborhoods,
  normalizeTurkish,
  TrAdresProvince,
  TrAdresDistrict,
  TrAdresNeighborhood,
} from "../services/tradresApi";
import {
  ALL_81_PROVINCES_AND_DISTRICTS,
  COMPREHENSIVE_STREET_DATABASE,
  getDistrictsForProvince,
  getNeighborhoodsForDistrict,
  getProvincePlateCode,
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
  const [provinces, setProvinces] = useState<TrAdresProvince[]>([]);
  const [districts, setDistricts] = useState<TrAdresDistrict[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<TrAdresNeighborhood[]>([]);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState<boolean>(false);
  const [isLoadingNeighborhoods, setIsLoadingNeighborhoods] = useState<boolean>(false);
  const [isTrAdresOnline, setIsTrAdresOnline] = useState<boolean>(true);

  const uniqueId = useId();
  const mahalleListId = `mahalle-datalist-${uniqueId}`;
  const streetListId = `street-datalist-${uniqueId}`;

  const selectedCity = address.city || "İstanbul";
  const selectedDistrict = address.district || "";
  const selectedNeighborhood = address.neighborhood || "";

  // 1. Initial Load: Fetch 81 Provinces from TrAdres API
  useEffect(() => {
    let isMounted = true;
    async function loadProvinces() {
      try {
        const list = await fetchTrAdresProvinces();
        if (isMounted) {
          if (list && list.length > 0) {
            setProvinces(list);
            setIsTrAdresOnline(true);
          } else {
            setIsTrAdresOnline(false);
          }
        }
      } catch (err) {
        if (isMounted) setIsTrAdresOnline(false);
      }
    }
    loadProvinces();
    return () => {
      isMounted = false;
    };
  }, []);

  // Helper to compile full address string
  const compileAddress = (updated: AddressDetails): string => {
    const parts: string[] = [];
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

  // 2. When City (Province) changes -> fetch Districts (Towns) from TrAdres API
  useEffect(() => {
    let isMounted = true;
    async function updateDistricts() {
      setIsLoadingDistricts(true);
      try {
        const list = await fetchTrAdresDistricts(selectedCity);
        if (!isMounted) return;

        if (list && list.length > 0) {
          setDistricts(list);
          // Check if current district is valid for new city
          const currentValid = list.find(
            (d) => normalizeTurkish(d.name) === normalizeTurkish(selectedDistrict)
          );
          if (!currentValid && list[0]) {
            handleFieldChange("district", list[0].name);
          }
        } else {
          // Fallback to static 973 districts dataset
          const fallbackList = getDistrictsForProvince(selectedCity);
          const mapped: TrAdresDistrict[] = fallbackList.map((name, idx) => ({
            id: idx + 1,
            name,
            rawName: name.toLocaleUpperCase("tr-TR"),
            provinceId: parseInt(getProvincePlateCode(selectedCity), 10) || 34,
          }));
          setDistricts(mapped);
          if (!fallbackList.includes(selectedDistrict) && mapped[0]) {
            handleFieldChange("district", mapped[0].name);
          }
        }
      } catch (err) {
        const fallbackList = getDistrictsForProvince(selectedCity);
        if (isMounted) {
          setDistricts(
            fallbackList.map((name, idx) => ({
              id: idx + 1,
              name,
              rawName: name,
              provinceId: 34,
            }))
          );
        }
      } finally {
        if (isMounted) setIsLoadingDistricts(false);
      }
    }

    updateDistricts();
    return () => {
      isMounted = false;
    };
  }, [selectedCity]);

  // 3. When District (Town) changes -> fetch Neighborhoods (Quarters) from TrAdres API
  useEffect(() => {
    if (!selectedDistrict) {
      setNeighborhoods([]);
      return;
    }

    let isMounted = true;
    async function updateNeighborhoods() {
      setIsLoadingNeighborhoods(true);
      try {
        // Find current town ID if available
        const currentDist = districts.find(
          (d) => normalizeTurkish(d.name) === normalizeTurkish(selectedDistrict)
        );
        const townIdOrName = currentDist ? currentDist.id : selectedDistrict;

        const list = await fetchTrAdresNeighborhoods(townIdOrName, selectedCity);
        if (!isMounted) return;

        if (list && list.length > 0) {
          setNeighborhoods(list);
        } else {
          // Fallback static neighborhoods
          const fallbackList = getNeighborhoodsForDistrict(selectedCity, selectedDistrict);
          setNeighborhoods(
            fallbackList.map((name, idx) => ({
              id: idx + 1,
              name,
              rawName: name,
              townId: 0,
            }))
          );
        }
      } catch (err) {
        const fallbackList = getNeighborhoodsForDistrict(selectedCity, selectedDistrict);
        if (isMounted) {
          setNeighborhoods(
            fallbackList.map((name, idx) => ({
              id: idx + 1,
              name,
              rawName: name,
              townId: 0,
            }))
          );
        }
      } finally {
        if (isMounted) setIsLoadingNeighborhoods(false);
      }
    }

    updateNeighborhoods();
    return () => {
      isMounted = false;
    };
  }, [selectedCity, selectedDistrict, districts]);

  const currentPlate = getProvincePlateCode(selectedCity);

  const content = (
    <div className="space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-indigo-600" />
          <h4 className="font-extrabold text-slate-900">{title}</h4>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold shadow-2xs">
          <Database className="w-3 h-3 text-emerald-600" />
          <span>TrAdres API (api.tradres.com.tr) & Canlı Katalog</span>
          <CheckCircle2 className="w-3 h-3 text-emerald-600 ml-0.5" />
        </div>
      </div>

      {/* Row 1: Ülke & İl (81 İl - TrAdres Dropdown) & İlçe (TrAdres Dropdown) */}
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

        {/* İl (Şehir) - 81 İl Dropdown from TrAdres */}
        <div>
          <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1 justify-between">
            <span className="flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-indigo-500" /> İl (Şehir)
            </span>
            <span className="text-[10px] text-indigo-600 font-mono bg-indigo-50 px-1.5 py-0.2 rounded font-bold">
              Plaka: {currentPlate}
            </span>
          </label>
          <select
            value={selectedCity}
            onChange={(e) => handleFieldChange("city", e.target.value)}
            className="w-full bg-white border border-slate-300 focus:border-indigo-500 rounded-xl p-2 font-semibold text-slate-800 shadow-2xs cursor-pointer"
          >
            {provinces.length > 0
              ? provinces.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.code} - {p.name}
                  </option>
                ))
              : ALL_81_PROVINCES_AND_DISTRICTS.map((prov) => (
                  <option key={prov.code} value={prov.name}>
                    {prov.code} - {prov.name}
                  </option>
                ))}
          </select>
        </div>

        {/* İlçe - TrAdres Town Dropdown */}
        <div>
          <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1 justify-between">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-indigo-500" /> İlçe
            </span>
            <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
              {isLoadingDistricts ? (
                <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" />
              ) : (
                `(${districts.length} İlçe)`
              )}
            </span>
          </label>
          <select
            value={selectedDistrict}
            onChange={(e) => handleFieldChange("district", e.target.value)}
            disabled={isLoadingDistricts}
            className="w-full bg-white border border-slate-300 focus:border-indigo-500 rounded-xl p-2 font-semibold text-slate-800 shadow-2xs cursor-pointer disabled:bg-slate-50"
          >
            {districts.length === 0 ? (
              <option value="">İlçe yükleniyor...</option>
            ) : (
              districts.map((dist) => (
                <option key={dist.id} value={dist.name}>
                  {dist.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Row 2: Mahalle (TrAdres Quarter Datalist & Dropdown) & Cadde/Sokak/Bulvar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Mahalle (TrAdres Quarter) */}
        <div>
          <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1 justify-between">
            <span className="flex items-center gap-1">
              <Signpost className="w-3.5 h-3.5 text-indigo-500" /> Mahalle / Semt (TrAdres)
            </span>
            <span className="text-[10px] text-indigo-600 font-medium flex items-center gap-1">
              {isLoadingNeighborhoods ? (
                <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" />
              ) : (
                `${neighborhoods.length} Mahalle`
              )}
            </span>
          </label>
          <input
            type="text"
            list={mahalleListId}
            placeholder="ör: Caferağa Mahallesi / Atatürk Mah."
            value={address.neighborhood || ""}
            onChange={(e) => handleFieldChange("neighborhood", e.target.value)}
            className="w-full bg-white border border-slate-300 focus:border-indigo-500 rounded-xl p-2 text-slate-800 font-medium"
          />
          <datalist id={mahalleListId}>
            {neighborhoods.map((nh) => (
              <option key={nh.id} value={nh.name} />
            ))}
          </datalist>
        </div>

        {/* Cadde / Sokak / Bulvar */}
        <div>
          <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1 justify-between">
            <span className="flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5 text-indigo-500" /> Cadde / Sokak / Bulvar
            </span>
            <span className="text-[10px] text-slate-400">Öneri listeli</span>
          </label>
          <input
            type="text"
            list={streetListId}
            placeholder="ör: Moda Cad. / Atatürk Bulv. / 1024. Sok."
            value={address.street || ""}
            onChange={(e) => handleFieldChange("street", e.target.value)}
            className="w-full bg-white border border-slate-300 focus:border-indigo-500 rounded-xl p-2 text-slate-800 font-medium"
          />
          <datalist id={streetListId}>
            {COMPREHENSIVE_STREET_DATABASE.map((st, idx) => (
              <option key={`${st}-${idx}`} value={st} />
            ))}
          </datalist>
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
            placeholder="ör: 15 / Blok A"
            value={address.buildingNo || ""}
            onChange={(e) => handleFieldChange("buildingNo", e.target.value)}
            className="w-full bg-white border border-slate-300 focus:border-indigo-500 rounded-xl p-2 font-medium"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">
            Daire / Kat / No
          </label>
          <input
            type="text"
            placeholder="ör: D:4 / Kat:2"
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

      {/* Full Open Address */}
      <div>
        <label className="block font-bold text-slate-700 mb-1">
          Açık Adres Metni (Otomatik Derlenir)
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
