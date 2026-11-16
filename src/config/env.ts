/// <reference types="vite/client" />

declare const __APP_BUILD_VERSION__: string | undefined;

const rawApiBase = (import.meta.env?.VITE_API_BASE_URL ?? ".").trim();

/**
 * Normalized base prefix for API & static asset calls.
 * Defaults to "." so requests resolve relatively (`./api/...`, `./version.json`)
 * regardless of root domain or subdirectory deployment (e.g. GitHub Pages / reverse proxy).
 */
export const API_BASE_URL: string = rawApiBase
  ? rawApiBase.replace(/\/+$/, "")
  : ".";

export const VERSION_CHECK_INTERVAL_MS: number = Math.max(
  15_000,
  Number(import.meta.env?.VITE_VERSION_CHECK_INTERVAL_MS) || 60_000
);

export const CENTRAL_SYNC_POLL_MS: number = Math.max(
  5_000,
  Number(import.meta.env?.VITE_CENTRAL_SYNC_POLL_MS) || 12_000
);

export const APP_BUILD_VERSION: string =
  typeof __APP_BUILD_VERSION__ !== "undefined" && __APP_BUILD_VERSION__
    ? __APP_BUILD_VERSION__
    : "1.0.0";

/**
 * Resolves any `/api/...` or relative path against `VITE_API_BASE_URL` (default `.`).
 */
export function resolveCentralUrl(targetPath: string): string {
  const clean = String(targetPath || "").trim();
  if (!clean) return API_BASE_URL;
  if (/^https?:\/\//i.test(clean)) return clean;
  const normalizedPath = clean.replace(/^\.\//, "").replace(/^\/+/, "");
  return `${API_BASE_URL}/${normalizedPath}`;
}
