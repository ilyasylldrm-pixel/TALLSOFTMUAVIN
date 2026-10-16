import React, { useEffect, useRef } from "react";
import { Building2, Loader2, RefreshCw } from "lucide-react";
import { useMysoftTenants } from "../hooks/useMysoftTenants";

export interface MysoftTenantPickerProps {
  value?: string;
  hintVkn?: string;
  /** compact = fatura formu; panel = e-belge ekranı */
  variant?: "compact" | "panel";
  className?: string;
  onSelect?: (vkn: string | undefined) => void;
}

export const MysoftTenantPicker: React.FC<MysoftTenantPickerProps> = ({
  value,
  hintVkn,
  variant = "panel",
  className = "",
  onSelect,
}) => {
  const {
    tenants,
    loading,
    error,
    partnerHint,
    selectedVkn,
    setSelectedVkn,
    manualVkn,
    setManualVkn,
    lookupLoading,
    lookupByVkn,
    reload,
    selectedTenant,
  } = useMysoftTenants({ hintVkn: value || hintVkn });

  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const prevValueRef = useRef<string | undefined>(value);
  const lastEmittedVknRef = useRef<string | undefined>(value || hintVkn);

  // Sync external controlled value prop into internal selectedVkn only when value prop itself changes
  useEffect(() => {
    if (value !== prevValueRef.current) {
      prevValueRef.current = value;
      if (value !== undefined && value !== selectedVkn) {
        lastEmittedVknRef.current = value;
        setSelectedVkn(value);
      }
    }
  }, [value, selectedVkn, setSelectedVkn]);

  // Notify parent once when internal selectedVkn is resolved/changed
  useEffect(() => {
    if (selectedVkn && selectedVkn !== lastEmittedVknRef.current) {
      lastEmittedVknRef.current = selectedVkn;
      prevValueRef.current = selectedVkn;
      onSelectRef.current?.(selectedVkn);
    }
  }, [selectedVkn]);

  const handleSelect = (vkn: string) => {
    const nextVal = vkn || undefined;
    lastEmittedVknRef.current = nextVal;
    prevValueRef.current = nextVal;
    setSelectedVkn(nextVal);
    onSelectRef.current?.(nextVal);
  };

  const handleLookup = async () => {
    const tenant = await lookupByVkn();
    if (tenant) {
      lastEmittedVknRef.current = tenant.taxNumber;
      prevValueRef.current = tenant.taxNumber;
      onSelectRef.current?.(tenant.taxNumber);
    }
  };

  if (variant === "compact") {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="block text-[11px] font-bold text-purple-950">
          Kesim yapılacak mükellef (Mysoft VKN/TCKN)
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            aria-label="Mysoft mükellef"
            value={selectedVkn || ""}
            onChange={(event) => handleSelect(event.target.value)}
            disabled={loading || tenants.length === 0}
            className="flex-1 h-9 bg-white border border-purple-200 rounded-lg px-2.5 text-xs text-slate-700 outline-none focus:border-purple-500"
          >
            <option value="">
              {loading
                ? "Mükellefler yükleniyor..."
                : tenants.length === 0
                  ? "Mysoft mükellef listesi boş"
                  : "Mükellef seçin"}
            </option>
            {tenants.map((tenant, idx) => (
              <option key={`${tenant.taxNumber}_${tenant.id || idx}`} value={tenant.taxNumber}>
                {tenant.name} — {tenant.taxNumber}
                {tenant.id ? ` (#${tenant.id})` : ""}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void reload()}
            disabled={loading}
            className="h-9 px-2.5 rounded-lg border border-purple-200 text-[11px] font-semibold text-purple-700 hover:bg-purple-50 disabled:opacity-60 flex items-center gap-1.5"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Yenile
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={manualVkn}
            onChange={(event) => setManualVkn(event.target.value)}
            placeholder="VKN / TCKN ile mükellef getir"
            className="flex-1 h-9 px-2.5 rounded-lg border border-purple-200 text-xs outline-none focus:border-purple-500"
          />
          <button
            type="button"
            onClick={() => void handleLookup()}
            disabled={lookupLoading}
            className="h-9 px-2.5 rounded-lg bg-purple-100 text-purple-800 text-[11px] font-semibold hover:bg-purple-200 disabled:opacity-60"
          >
            {lookupLoading ? "Sorgulanıyor..." : "VKN ile getir"}
          </button>
        </div>
        {selectedTenant && (
          <p className="text-[10px] text-purple-800/90">
            Seçili: {selectedTenant.name} ({selectedTenant.taxNumber})
          </p>
        )}
        {partnerHint && <p className="text-[10px] text-amber-700">{partnerHint}</p>}
        {error && <p className="text-[10px] text-rose-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3 ${className}`}>
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 min-w-[180px]">
          <Building2 className="w-4 h-4 text-[#8252F6]" />
          Mysoft mükellefler
        </div>
        <select
          aria-label="Mysoft mükellef"
          value={selectedVkn || ""}
          onChange={(event) => handleSelect(event.target.value)}
          disabled={loading || tenants.length === 0}
          className="flex-1 h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm text-slate-700 outline-none focus:border-[#8252F6]"
        >
          <option value="">
            {loading
              ? "Mükellefler yükleniyor..."
              : tenants.length === 0
                ? "Listede mükellef yok"
                : "Mükellef seçin"}
          </option>
          {tenants.map((tenant, idx) => (
            <option key={`${tenant.taxNumber}_${tenant.id || idx}`} value={tenant.taxNumber}>
              {tenant.name} — {tenant.taxNumber}
              {tenant.id ? ` (#${tenant.id})` : ""}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void reload()}
          disabled={loading}
          className="h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Listeyi yenile
        </button>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={manualVkn}
          onChange={(event) => setManualVkn(event.target.value)}
          placeholder="VKN / TCKN ile mükellef getir"
          className="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#8252F6]"
        />
        <button
          type="button"
          onClick={() => void handleLookup()}
          disabled={lookupLoading}
          className="h-10 px-3 rounded-xl bg-[#F3EFFF] text-[#8252F6] text-xs font-semibold hover:bg-[#E4D7FF] disabled:opacity-60"
        >
          {lookupLoading ? "Sorgulanıyor..." : "VKN ile getir"}
        </button>
      </div>
      {partnerHint && <p className="text-xs text-amber-700">{partnerHint}</p>}
      {error && <p className="text-xs text-rose-600">{error}</p>}
      {selectedVkn && (
        <p className="text-xs text-slate-500">
          İşlemler seçilen VKN ile yapılacak: {selectedVkn}
        </p>
      )}
    </div>
  );
};
