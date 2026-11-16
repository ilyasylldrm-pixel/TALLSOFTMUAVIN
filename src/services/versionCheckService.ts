import {
  APP_BUILD_VERSION,
  VERSION_CHECK_INTERVAL_MS,
  resolveCentralUrl,
} from "../config/env";
import { centralStorageService } from "./centralStorageService";

interface RemoteVersionManifest {
  version?: string;
  packageVersion?: string;
  buildTime?: string;
}

let baselineVersion: string | null = null;
let watcherStarted = false;
let reloadInProgress = false;

async function fetchRemoteVersion(): Promise<string | null> {
  const stamp = Date.now();
  const endpoints = [
    `${resolveCentralUrl("version.json")}?_cb=${stamp}`,
    `${resolveCentralUrl("api/version")}?_cb=${stamp}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "GET",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });
      if (!res.ok) continue;
      const data = (await res.json()) as RemoteVersionManifest;
      if (data && typeof data.version === "string" && data.version.trim()) {
        return data.version.trim();
      }
    } catch {
      // try fallback endpoint
    }
  }
  return null;
}

async function performHardVersionReload(nextVersion: string): Promise<void> {
  if (reloadInProgress || typeof window === "undefined") return;
  reloadInProgress = true;

  try {
    await centralStorageService.flush(true);
  } catch {
    // ignore flush error
  }

  try {
    if ("caches" in window && window.caches) {
      const cacheNames = await window.caches.keys();
      await Promise.all(cacheNames.map((name) => window.caches.delete(name)));
    }
  } catch {
    // ignore Cache Storage cleanup errors
  }

  const nextUrl = new URL(window.location.href);
  if (nextUrl.searchParams.get("_v") === nextVersion) {
    reloadInProgress = false;
    return;
  }
  nextUrl.searchParams.set("_v", nextVersion);
  window.location.replace(nextUrl.toString());
}

/**
 * Checks central `version.json` / `/api/version` at startup, on tab focus,
 * and periodically. Automatically reloads with cache-busting when a newer
 * version is published to GitHub / server.
 */
export async function checkAndEnforceLatestVersion(): Promise<void> {
  if (typeof window === "undefined" || reloadInProgress) return;

  const remoteVersion = await fetchRemoteVersion();
  if (!remoteVersion) return;

  // Clean up temporary `_v` query param once we are already running the target version
  try {
    const currentUrl = new URL(window.location.href);
    const urlVersionParam = currentUrl.searchParams.get("_v");
    if (urlVersionParam && urlVersionParam === remoteVersion) {
      currentUrl.searchParams.delete("_v");
      window.history.replaceState({}, "", currentUrl.toString());
    }
  } catch {
    // ignore URL cleanup error
  }

  if (!baselineVersion) {
    baselineVersion = remoteVersion;
    // If production bundle was compiled with a different build version than server's active version, reload immediately
    if (
      import.meta.env.PROD &&
      APP_BUILD_VERSION &&
      APP_BUILD_VERSION !== "1.0.0-initial" &&
      remoteVersion !== "1.0.0-initial" &&
      APP_BUILD_VERSION !== remoteVersion
    ) {
      await performHardVersionReload(remoteVersion);
    }
    return;
  }

  if (remoteVersion !== baselineVersion) {
    baselineVersion = remoteVersion;
    await performHardVersionReload(remoteVersion);
  }
}

export function startVersionWatcher(): void {
  if (typeof window === "undefined" || watcherStarted) return;
  watcherStarted = true;

  void checkAndEnforceLatestVersion();

  const onVisible = () => {
    if (document.visibilityState === "visible") {
      void checkAndEnforceLatestVersion();
    }
  };

  window.addEventListener("focus", onVisible);
  document.addEventListener("visibilitychange", onVisible);
  setInterval(() => {
    if (document.visibilityState === "visible") {
      void checkAndEnforceLatestVersion();
    }
  }, VERSION_CHECK_INTERVAL_MS);
}
