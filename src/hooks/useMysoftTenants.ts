import { useCallback, useEffect, useState } from "react";
import {
  getMysoftConnectionStatus,
  getMysoftTenant,
  listMysoftTenants,
  normalizeMysoftTenantIdentifier,
  type MysoftTenant,
} from "../services/mysoftEDocumentService";
import {
  readStoredMysoftTenantVkn,
  writeStoredMysoftTenantVkn,
} from "../utils/mysoftTenantStorage";

export interface UseMysoftTenantsOptions {
  /** Pre-select when it matches a linked tenant (company profile VKN, etc.). */
  hintVkn?: string;
  /** Load tenant directory on mount. */
  autoLoad?: boolean;
}

function pickInitialVkn(hintVkn?: string): string | undefined {
  const stored = readStoredMysoftTenantVkn();
  const hint = normalizeMysoftTenantIdentifier(hintVkn);
  return stored || hint;
}

function pickFromRows(rows: MysoftTenant[], current?: string, hint?: string): string | undefined {
  const hintMatch = hint ? rows.find((row) => row.taxNumber === hint) : undefined;
  if (hintMatch) return hintMatch.taxNumber;
  if (rows.length === 1) return rows[0].taxNumber;
  if (current && rows.some((row) => row.taxNumber === current)) return current;
  return current;
}

function deduplicateTenants(rows: MysoftTenant[]): MysoftTenant[] {
  const map = new Map<string, MysoftTenant>();
  for (const row of rows) {
    if (!row || !row.taxNumber) continue;
    const key = row.taxNumber.trim();
    if (!map.has(key) || (!map.get(key)!.id && row.id)) {
      map.set(key, row);
    }
  }
  return Array.from(map.values());
}

export function useMysoftTenants(options: UseMysoftTenantsOptions = {}) {
  const hintVkn = normalizeMysoftTenantIdentifier(options.hintVkn);
  const autoLoad = options.autoLoad !== false;

  const [tenants, setTenants] = useState<MysoftTenant[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);
  const [partnerHint, setPartnerHint] = useState<string | null>(null);
  const [selectedVkn, setSelectedVknState] = useState<string | undefined>(() =>
    pickInitialVkn(hintVkn),
  );
  const [manualVkn, setManualVkn] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);

  const setSelectedVkn = useCallback((vkn: string | undefined) => {
    const normalized = normalizeMysoftTenantIdentifier(vkn);
    setSelectedVknState(normalized);
    writeStoredMysoftTenantVkn(normalized);
  }, []);

  const applyPick = useCallback(
    (rows: MysoftTenant[]) => {
      setSelectedVknState((current) => {
        const next = pickFromRows(rows, current, hintVkn);
        if (next) writeStoredMysoftTenantVkn(next);
        return next;
      });
    },
    [hintVkn],
  );

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    const status = await getMysoftConnectionStatus().catch(() => null);
    const identity = status?.identity;
    if (identity?.businessPartnerId) {
      setPartnerHint(
        `İş ortağı ${identity.businessPartnerId}: belge çekmeden önce listeden müşteri seçin (VKN/TCKN).`,
      );
    } else {
      setPartnerHint(null);
    }
    try {
      const rows = await listMysoftTenants();
      const uniqueRows = deduplicateTenants(rows);
      setTenants(uniqueRows);
      applyPick(uniqueRows);
      if (uniqueRows.length === 0) {
        setError(
          "Müşteri listesi boş döndü. Erişim anahtarı yetkisini ve sunucu .env kaydını kontrol edin.",
        );
      }
    } catch (loadError) {
      setTenants([]);
      setSelectedVkn(undefined);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Mysoft müşteri listesi alınamadı.",
      );
    } finally {
      setLoading(false);
    }
  }, [applyPick, setSelectedVkn]);

  const lookupByVkn = useCallback(async () => {
    const vkn = normalizeMysoftTenantIdentifier(manualVkn);
    if (!vkn) {
      setError("10 haneli VKN veya 11 haneli TCKN girin.");
      return null;
    }
    setLookupLoading(true);
    setError(null);
    try {
      const tenant = await getMysoftTenant(vkn);
      if (!tenant) {
        setError("Bu VKN erişim anahtarına tanımlı değil.");
        return null;
      }
      setTenants((current) => {
        const next = [tenant, ...current.filter((row) => row.taxNumber !== tenant.taxNumber)];
        return next;
      });
      setSelectedVkn(tenant.taxNumber);
      setManualVkn("");
      return tenant;
    } catch (lookupError) {
      setError(
        lookupError instanceof Error
          ? lookupError.message
          : "VKN sorgusu başarısız.",
      );
      return null;
    } finally {
      setLookupLoading(false);
    }
  }, [manualVkn, setSelectedVkn]);

  useEffect(() => {
    if (!autoLoad) return;
    void reload();
  }, [autoLoad, reload]);

  useEffect(() => {
    if (!hintVkn || tenants.length === 0) return;
    applyPick(tenants);
  }, [hintVkn, tenants, applyPick]);

  const selectedTenant = tenants.find((row) => row.taxNumber === selectedVkn);

  return {
    tenants,
    loading,
    error,
    partnerHint,
    selectedVkn,
    selectedTenant,
    setSelectedVkn,
    manualVkn,
    setManualVkn,
    lookupLoading,
    lookupByVkn,
    reload,
  };
}
