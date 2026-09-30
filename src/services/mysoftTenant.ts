/**
 * Mysoft e-Document v8 treats `tenantIdentifierNumber` as the taxpayer
 * VKN/TCKN, not the portal tenant table id or a Via/GUID.
 *
 * Swagger (GetInvoiceInboxListForPeriodRequestModel):
 * "İşlem yapılması istenen müşterinin VKN/TCKN si gönderilir. Eğer servis
 * kullanıcısına birden fazla müşteri bağlandıysa kullanılacak bir alandır.
 * Bir müşteri varsa boş bırakınız."
 */

const VKN_TCKN = /^(?:\d{10}|\d{11})$/;

export function digitsOnly(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "");
}

/** Return a VKN/TCKN Mysoft will accept, or undefined so the field is omitted. */
export function normalizeMysoftTenantIdentifier(value?: unknown): string | undefined {
  const digits = digitsOnly(value);
  return VKN_TCKN.test(digits) ? digits : undefined;
}

export function isMysoftTenantScopeError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  const details =
    error && typeof error === "object" && "details" in error
      ? JSON.stringify((error as { details?: unknown }).details || "")
      : "";
  // Do not match every mention of tenantIdentifierNumber: partner accounts
  // return 00243 when the field is missing, and stripping it would retry the
  // same failure.
  return /00164|firma kaydı bulunamadı/i.test(`${message} ${details}`);
}
