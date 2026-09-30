import { normalizeMysoftTenantIdentifier } from "../services/mysoftTenant";

export const MYSOFT_SELECTED_TENANT_KEY = "muavin_mysoft_tenant_vkn";

export function readStoredMysoftTenantVkn(): string | undefined {
  try {
    if (typeof localStorage === "undefined") return undefined;
    return normalizeMysoftTenantIdentifier(localStorage.getItem(MYSOFT_SELECTED_TENANT_KEY));
  } catch {
    return undefined;
  }
}

export function writeStoredMysoftTenantVkn(vkn?: string): void {
  try {
    if (typeof localStorage === "undefined") return;
    const normalized = normalizeMysoftTenantIdentifier(vkn);
    if (normalized) localStorage.setItem(MYSOFT_SELECTED_TENANT_KEY, normalized);
    else localStorage.removeItem(MYSOFT_SELECTED_TENANT_KEY);
  } catch {
    // ignore quota / privacy mode
  }
}
