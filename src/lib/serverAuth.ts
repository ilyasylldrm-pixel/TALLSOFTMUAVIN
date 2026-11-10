/**
 * Sunucu tarafı kimlik doğrulama yardımcıları.
 *
 * - Şifreler scrypt ile hash'lenir; düz metin şifre sunucudan asla dışarı verilmez.
 * - Giriş sonrası HMAC-SHA256 ile imzalı bir oturum anahtarı üretilir. Anahtar
 *   hem HttpOnly çerez olarak hem de yanıt gövdesinde (Bearer kullanımı için) döner.
 */
import crypto from "node:crypto";
import firebaseConfig from "../../firebase-applet-config.json";

export const SESSION_COOKIE = "muavin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 saat

/** Sadece bu e-posta adresleri sistem yöneticisi sayılır. */
export const SYSTEM_ADMIN_EMAILS = new Set([
  "ilyasyildirim@outlook.com.tr",
  "ilyasylldrm@gmail.com",
  "admin@muavin.com",
]);

export interface SessionUser {
  uid: string;
  email: string;
  companyId: string;
  role: string;
  isAdmin: boolean;
}

// ---------------------------------------------------------------------------
// Oturum anahtarı imzalama
// ---------------------------------------------------------------------------

function resolveSessionSecret(): Buffer {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32) {
    return Buffer.from(process.env.SESSION_SECRET, "utf8");
  }
  // SESSION_SECRET tanımlı değilse, tüm Cloud Run örneklerinde aynı olan ve
  // dışarıdan bilinemeyen sunucu sırlarından türetilir.
  const material = [
    process.env.SQL_PASSWORD,
    process.env.MYSOFT_CLIENT_SECRET,
    process.env.GEMINI_API_KEY,
  ]
    .filter(Boolean)
    .join("|");
  if (material) {
    return crypto.createHash("sha256").update(`muavin-session-v1|${material}`).digest();
  }
  // Yerel geliştirme: süreç başına rastgele (yeniden başlatınca oturumlar düşer).
  return crypto.randomBytes(32);
}

const SESSION_SECRET = resolveSessionSecret();

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString("base64url");
}

export function signSession(user: SessionUser): string {
  const payload = { ...user, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS };
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(crypto.createHmac("sha256", SESSION_SECRET).update(body).digest());
  return `ms1.${body}.${sig}`;
}

export function verifySession(token: string | undefined | null): SessionUser | null {
  if (!token || !token.startsWith("ms1.")) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [, body, sig] = parts;
  const expected = b64url(crypto.createHmac("sha256", SESSION_SECRET).update(body).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload || typeof payload.exp !== "number" || payload.exp < Date.now() / 1000) return null;
    return {
      uid: String(payload.uid || ""),
      email: String(payload.email || ""),
      companyId: String(payload.companyId || ""),
      role: String(payload.role || ""),
      isAdmin: payload.isAdmin === true,
    };
  } catch {
    return null;
  }
}

export function sessionCookieHeader(token: string, secure: boolean): string {
  return [
    `${SESSION_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_TTL_SECONDS}`,
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function clearSessionCookieHeader(secure: boolean): string {
  return [`${SESSION_COOKIE}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0", secure ? "Secure" : ""]
    .filter(Boolean)
    .join("; ");
}

export function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    if (part.slice(0, idx).trim() === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}

// ---------------------------------------------------------------------------
// Şifre hash'leme
// ---------------------------------------------------------------------------

export function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(plain, salt, 32);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPasswordHash(plain: string, stored: string | undefined | null): boolean {
  if (!stored || !stored.startsWith("scrypt$")) return false;
  const [, saltB64, hashB64] = stored.split("$");
  try {
    const expected = Buffer.from(hashB64, "base64");
    const actual = crypto.scryptSync(plain, Buffer.from(saltB64, "base64"), expected.length);
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function safeEqualString(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

/**
 * Kayıttaki şifreyle karşılaştırır. Eski kayıtlarda düz metin şifre olabileceği
 * için onu da (sabit zamanlı) kabul eder; sunucu bu kayıtları ilk fırsatta hash'ler.
 */
export function checkPassword(entered: string, hash?: string | null, legacyPlain?: string | null): boolean {
  if (!entered) return false;
  if (hash && verifyPasswordHash(entered, hash)) return true;
  if (legacyPlain) {
    return safeEqualString(entered, legacyPlain) || safeEqualString(entered.trim(), legacyPlain.trim());
  }
  return false;
}

/**
 * Bir kayıttaki düz metin şifre alanlarını hash'e çevirir ve düz metni siler.
 * Değişiklik olduysa true döner.
 */
export function hashPlainPasswordFields(
  obj: any,
  pairs: Array<[plainKey: string, hashKey: string]>,
): boolean {
  if (!obj || typeof obj !== "object") return false;
  let changed = false;
  for (const [plainKey, hashKey] of pairs) {
    const plain = obj[plainKey];
    if (typeof plain === "string" && plain.length > 0 && !plain.startsWith("••")) {
      obj[hashKey] = hashPassword(plain);
      changed = true;
    }
    if (plainKey in obj) {
      delete obj[plainKey];
      changed = true;
    }
  }
  return changed;
}

// ---------------------------------------------------------------------------
// Firebase Authentication ile şifre doğrulama (Firebase hesabı olan kullanıcılar için)
// ---------------------------------------------------------------------------

export async function verifyFirebasePassword(email: string, password: string): Promise<boolean> {
  const apiKey = (firebaseConfig as any).apiKey;
  if (!apiKey || !email.includes("@")) return false;
  try {
    const resp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: false }),
        signal: AbortSignal.timeout(8000),
      },
    );
    return resp.ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Basit kaba kuvvet koruması (örnek başına, bellek içi)
// ---------------------------------------------------------------------------

const failedAttempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;

export function isRateLimited(key: string): boolean {
  const entry = failedAttempts.get(key);
  if (!entry) return false;
  if (Date.now() - entry.first > WINDOW_MS) {
    failedAttempts.delete(key);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

export function recordFailure(key: string): void {
  const entry = failedAttempts.get(key);
  if (!entry || Date.now() - entry.first > WINDOW_MS) {
    failedAttempts.set(key, { count: 1, first: Date.now() });
  } else {
    entry.count += 1;
  }
}

export function clearFailures(key: string): void {
  failedAttempts.delete(key);
}

export function isAdminRole(role: unknown): boolean {
  return typeof role === "string" && role.includes("Sistem Yöneticisi");
}
