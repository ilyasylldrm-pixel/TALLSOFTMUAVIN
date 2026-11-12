import { normalizeMysoftTenantIdentifier } from "../services/mysoftTenant";

type TenantIdentity = {
  tenantIdentifierNumber?: string;
  taxNumber?: string;
  vkn?: string;
  tckn?: string;
};

type TenantSettings = TenantIdentity & {
  mysoftCredentials?: { tenantIdentifierNumber?: string };
};

/** Keep a selected company's tax identity ahead of shared profile defaults. */
export function selectMysoftTenantIdentifier(
  company?: TenantIdentity | null,
  settings?: TenantSettings | null,
  fallback?: string,
): string | undefined {
  const candidates = company
    ? [
        company.tenantIdentifierNumber,
        company.taxNumber,
        company.vkn,
        company.tckn,
      ]
    : [
        settings?.tenantIdentifierNumber,
        settings?.mysoftCredentials?.tenantIdentifierNumber,
        settings?.taxNumber,
        settings?.vkn,
        settings?.tckn,
        fallback,
      ];
  for (const candidate of candidates) {
    const tenant = normalizeMysoftTenantIdentifier(candidate);
    if (tenant) return tenant;
  }
  return undefined;
}
