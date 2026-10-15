import { normalizeMysoftTenantIdentifier } from "../services/mysoftTenant";
import { safeGetStorageItem, safeSetStorageItem, safeRemoveStorageItem } from "./storage";

export const MYSOFT_SELECTED_TENANT_KEY = "muavin_mysoft_tenant_vkn";

export function readStoredMysoftTenantVkn(): string | undefined {
  try {
    return normalizeMysoftTenantIdentifier(safeGetStorageItem(MYSOFT_SELECTED_TENANT_KEY));
  } catch {
    return undefined;
  }
}

export function writeStoredMysoftTenantVkn(vkn?: string): void {
  try {
    const normalized = normalizeMysoftTenantIdentifier(vkn);
    if (normalized) safeSetStorageItem(MYSOFT_SELECTED_TENANT_KEY, normalized);
    else safeRemoveStorageItem(MYSOFT_SELECTED_TENANT_KEY);
  } catch {
    // ignore quota / privacy mode
  }
}

