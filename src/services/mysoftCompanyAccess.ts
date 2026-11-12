/**
 * Şirket / Firma bazlı Mysoft e-Belge API erişim yöneticisi ve şifreli kimlik deposu.
 *
 * Mysoft VKN/TCKN Eşleştirme Masasında eşleştirilen her şirket kendi:
 *   - VKN (10 hane) veya TCKN (11 hane) `tenantIdentifierNumber` değeri,
 *   - Web Servis Kullanıcı Adı & Şifresi (`password` grant) VEYA
 *   - OAuth2 `Client ID` & `Client Secret` (`client_credentials` grant) VEYA
 *   - Sunucudaki merkezi İş Ortağı / Mali Müşavir anahtarı (`partner_default`)
 * ile gerçek zamanlı Mysoft API erişimi sağlar.
 *
 * Tüm parolalar ve clientSecret değerleri AES-256-GCM ile şifrelenerek
 * `data/mysoft_connections.json` dosyasında tutulur; tarayıcıya yalnızca maskeli özet döner.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  MysoftApiError,
  MysoftConfigurationError,
  MysoftEdocumentClient,
  getMysoftConfig,
  type MysoftConfig,
  type MysoftGrantType,
  type MysoftTokenIdentity,
} from "./mysoftEdocument.ts";
import { normalizeMysoftTenantIdentifier } from "./mysoftTenant.ts";

export type MysoftCompanyEnvironment = "prod" | "test";
export type MysoftCompanyAuthType = "password" | "client_credentials" | "partner_default";
export type MysoftCompanyAccessState =
  | "connected"
  | "partner_connected"
  | "configured_untested"
  | "error"
  | "unconfigured";

export interface EncryptedMysoftSecret {
  iv: string;
  tag: string;
  ct: string;
}

export interface StoredMysoftCompanyConnection {
  companyId: string;
  companyName?: string;
  tenantIdentifierNumber?: string;
  matchedType?: "vkn" | "tckn";
  authType?: MysoftCompanyAuthType;
  environment?: MysoftCompanyEnvironment;
  usernameEnc?: EncryptedMysoftSecret;
  passwordEnc?: EncryptedMysoftSecret;
  clientIdEnc?: EncryptedMysoftSecret;
  clientSecretEnc?: EncryptedMysoftSecret;
  connectorGuid?: string;
  eFaturaPrefix?: string;
  eArsivPrefix?: string;
  resolvedTenantTitle?: string;
  resolvedTaxOffice?: string;
  lastStatus?: MysoftCompanyAccessState;
  lastMessage?: string;
  lastError?: string;
  lastVerifiedAt?: string;
  updatedAt: string;
}

interface StoreFileShape {
  version: 1;
  connections: Record<string, StoredMysoftCompanyConnection>;
}

export interface CloudSyncCompanySnapshot {
  companiesRegistry?: Array<Record<string, unknown>>;
  companiesData?: Record<string, { data?: { settings?: Record<string, unknown> } }>;
}

export interface MysoftCompanyAccessPublicView {
  companyId: string;
  companyName: string;
  tenantIdentifierNumber: string;
  matchedType: "vkn" | "tckn";
  isMatched: boolean;
  authType: MysoftCompanyAuthType;
  authSource: "company_credentials" | "cloud_sync_credentials" | "server_partner_env" | "unconfigured";
  environment: MysoftCompanyEnvironment;
  baseUrl: string;
  hasUsername: boolean;
  hasPassword: boolean;
  hasClientId: boolean;
  hasClientSecret: boolean;
  usernamePreview: string;
  passwordMasked: string;
  clientIdMasked: string;
  clientSecretMasked: string;
  connectorGuid: string;
  configured: boolean;
  mockMode: boolean;
  status: MysoftCompanyAccessState;
  statusMessage: string;
  lastError: string;
  lastVerifiedAt: string | null;
  resolvedTenantTitle: string;
  resolvedTaxOffice: string;
  eFaturaPrefix: string;
  eArsivPrefix: string;
  updatedAt: string | null;
}

export interface UpsertMysoftCompanyAccessInput {
  companyId: string;
  companyName?: string;
  tenantIdentifierNumber?: string;
  matchedType?: "vkn" | "tckn";
  authType?: MysoftCompanyAuthType;
  environment?: MysoftCompanyEnvironment;
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
  connectorGuid?: string;
  clearCredentials?: boolean;
}

export interface VerifyMysoftCompanyAccessResult {
  ok: boolean;
  access: MysoftCompanyAccessPublicView;
  identity?: MysoftTokenIdentity;
  tenant?: {
    taxNumber: string;
    name: string;
    taxOffice?: string;
    city?: string;
    district?: string;
  } | null;
  prefixes?: {
    eFaturaPrefix?: string;
    eFaturaNextNumber?: string;
    eFaturaLastNumber?: string;
    eArsivPrefix?: string;
    eArsivNextNumber?: string;
    eArsivLastNumber?: string;
  } | null;
  testedAt: string;
  message: string;
}

const PROD_BASE_URL = "https://edocumentapi.mysoft.com.tr";
const TEST_BASE_URL = "https://edocumentapi.mytest.tr";

export function maskCredentialValue(value?: string, visibleStart = 3, visibleEnd = 2): string {
  const clean = String(value || "").trim();
  if (!clean) return "";
  if (clean.length <= visibleStart + visibleEnd) {
    return `${clean[0]}${"•".repeat(Math.max(3, clean.length - 1))}`;
  }
  return `${clean.slice(0, visibleStart)}${"•".repeat(6)}${clean.slice(-visibleEnd)}`;
}

function deriveKey(raw: string): Buffer {
  return crypto.scryptSync(raw, "muavin-mysoft-company-access-v1", 32);
}

function loadOrCreateMasterKey(dataDir: string): Buffer {
  const envSecret = process.env.MYSOFT_CREDENTIALS_SECRET?.trim() || process.env.TRENDYOL_SECRET_KEY?.trim();
  if (envSecret && envSecret.length >= 16) return deriveKey(envSecret);

  const keyFile = path.join(dataDir, ".mysoft.key");
  try {
    if (fs.existsSync(keyFile)) {
      const existing = fs.readFileSync(keyFile, "utf8").trim();
      if (existing.length >= 32) return deriveKey(existing);
    }
  } catch {
    // Fall through to generate
  }
  fs.mkdirSync(dataDir, { recursive: true });
  const generated = crypto.randomBytes(32).toString("hex");
  try {
    fs.writeFileSync(keyFile, generated, { mode: 0o600 });
  } catch {
    // Ephemeral fallback if filesystem is read-only
  }
  return deriveKey(generated);
}

function trimStr(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function baseUrlForEnvironment(env: MysoftCompanyEnvironment, fallbackBaseUrl?: string): string {
  if (env === "test") return TEST_BASE_URL;
  if (env === "prod") return PROD_BASE_URL;
  return fallbackBaseUrl || PROD_BASE_URL;
}

export class MysoftCompanyAccessManager {
  private readonly filePath: string;
  private readonly masterKey: Buffer;
  private readonly resolveCloudSyncSnapshot?: () => CloudSyncCompanySnapshot | null | undefined;
  private state: StoreFileShape = { version: 1, connections: {} };
  private writeChain: Promise<void> = Promise.resolve();
  private readonly clientCache = new Map<string, MysoftEdocumentClient>();

  constructor(options: {
    dataDir?: string;
    masterSecret?: string;
    resolveCloudSyncSnapshot?: () => CloudSyncCompanySnapshot | null | undefined;
  } = {}) {
    const dataDir = options.dataDir || path.resolve(process.cwd(), "data");
    this.filePath = path.join(dataDir, "mysoft_connections.json");
    this.masterKey = options.masterSecret
      ? deriveKey(options.masterSecret)
      : loadOrCreateMasterKey(dataDir);
    this.resolveCloudSyncSnapshot = options.resolveCloudSyncSnapshot;
    this.loadSync();
  }

  private loadSync(): void {
    try {
      if (!fs.existsSync(this.filePath)) return;
      const parsed = JSON.parse(fs.readFileSync(this.filePath, "utf8")) as Partial<StoreFileShape>;
      if (parsed && typeof parsed === "object" && parsed.connections && typeof parsed.connections === "object") {
        this.state = {
          version: 1,
          connections: parsed.connections as Record<string, StoredMysoftCompanyConnection>,
        };
      }
    } catch (error) {
      console.error("[mysoft-access] Şirket bağlantı deposu okunamadı:", error instanceof Error ? error.message : error);
    }
  }

  private persist(): Promise<void> {
    const payload = JSON.stringify(this.state, null, 2);
    this.writeChain = this.writeChain.then(async () => {
      await fs.promises.mkdir(path.dirname(this.filePath), { recursive: true });
      const tmp = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
      await fs.promises.writeFile(tmp, payload, { mode: 0o600 });
      await fs.promises.rename(tmp, this.filePath);
    });
    return this.writeChain;
  }

  private aad(companyId: string): Buffer {
    return Buffer.from(`mysoft:${companyId}`, "utf8");
  }

  private encrypt(plain: string, companyId: string): EncryptedMysoftSecret {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", this.masterKey, iv);
    cipher.setAAD(this.aad(companyId));
    const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
    return {
      iv: iv.toString("base64"),
      tag: cipher.getAuthTag().toString("base64"),
      ct: ct.toString("base64"),
    };
  }

  private decrypt(secret: EncryptedMysoftSecret | undefined, companyId: string): string {
    if (!secret || !secret.iv || !secret.tag || !secret.ct) return "";
    try {
      const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        this.masterKey,
        Buffer.from(secret.iv, "base64"),
      );
      decipher.setAAD(this.aad(companyId));
      decipher.setAuthTag(Buffer.from(secret.tag, "base64"));
      const buf = Buffer.concat([
        decipher.update(Buffer.from(secret.ct, "base64")),
        decipher.final(),
      ]);
      return buf.toString("utf8");
    } catch {
      return "";
    }
  }

  /** Cloud-sync içindeki eşleştirilmiş şirket bilgisini yedek (fallback) olarak okur. */
  private findCloudCompanyData(companyId?: string, tenantIdentifierNumber?: string): {
    companyId?: string;
    companyName?: string;
    tenantIdentifierNumber?: string;
    matchedType?: "vkn" | "tckn";
    username?: string;
    password?: string;
    clientId?: string;
    clientSecret?: string;
    authType?: MysoftCompanyAuthType;
    environment?: MysoftCompanyEnvironment;
    connectorGuid?: string;
    eFaturaPrefix?: string;
    eArsivPrefix?: string;
  } | null {
    const snapshot = this.resolveCloudSyncSnapshot?.();
    if (!snapshot) return null;
    const cleanTenant = normalizeMysoftTenantIdentifier(tenantIdentifierNumber);
    const registry = Array.isArray(snapshot.companiesRegistry) ? snapshot.companiesRegistry : [];
    const companiesData = snapshot.companiesData || {};

    let regMatch: Record<string, unknown> | undefined;
    if (companyId) {
      regMatch = registry.find((c) => trimStr(c.id) === companyId);
    }
    if (!regMatch && cleanTenant) {
      regMatch = registry.find((c) => {
        const candidates = [c.tenantIdentifierNumber, c.vkn, c.tckn, c.taxNumber];
        return candidates.some((v) => normalizeMysoftTenantIdentifier(v) === cleanTenant);
      });
    }

    const resolvedCompId = companyId || (regMatch ? trimStr(regMatch.id) : "");
    let settings: Record<string, unknown> | undefined = resolvedCompId
      ? companiesData[resolvedCompId]?.data?.settings
      : undefined;

    if (!settings && cleanTenant) {
      for (const [cid, entry] of Object.entries(companiesData)) {
        const st = entry?.data?.settings;
        if (!st) continue;
        const myCreds = (st.mysoftCredentials && typeof st.mysoftCredentials === "object"
          ? st.mysoftCredentials
          : {}) as Record<string, unknown>;
        const stTenant = normalizeMysoftTenantIdentifier(
          st.tenantIdentifierNumber ?? myCreds.tenantIdentifierNumber ?? st.taxNumber ?? st.vknTckn,
        );
        if (stTenant === cleanTenant) {
          settings = st;
          if (!regMatch) regMatch = { id: cid };
          break;
        }
      }
    }

    if (!regMatch && !settings) return null;

    const regCreds = (regMatch?.mysoftCredentials && typeof regMatch.mysoftCredentials === "object"
      ? regMatch.mysoftCredentials
      : {}) as Record<string, unknown>;
    const stCreds = (settings?.mysoftCredentials && typeof settings.mysoftCredentials === "object"
      ? settings.mysoftCredentials
      : {}) as Record<string, unknown>;

    const resolvedTenant = normalizeMysoftTenantIdentifier(
      regMatch?.tenantIdentifierNumber ??
        settings?.tenantIdentifierNumber ??
        regCreds.tenantIdentifierNumber ??
        stCreds.tenantIdentifierNumber ??
        regMatch?.vkn ??
        regMatch?.tckn ??
        regMatch?.taxNumber ??
        settings?.taxNumber ??
        cleanTenant,
    );

    const username =
      trimStr(regMatch?.mysoftUsername) ||
      trimStr(regCreds.username) ||
      trimStr(stCreds.username) ||
      trimStr(settings?.mysoftUsername);
    const password =
      trimStr(regMatch?.mysoftPassword) ||
      trimStr(regCreds.password) ||
      trimStr(stCreds.password) ||
      trimStr(settings?.mysoftPassword);
    const clientId =
      trimStr(regMatch?.mysoftClientId) ||
      trimStr(regCreds.clientId) ||
      trimStr(stCreds.clientId);
    const clientSecret =
      trimStr(regMatch?.mysoftClientSecret) ||
      trimStr(regCreds.clientSecret) ||
      trimStr(stCreds.clientSecret);
    const rawAuthType = trimStr(regMatch?.mysoftAuthType || regCreds.authType || stCreds.authType);
    const authType: MysoftCompanyAuthType | undefined =
      rawAuthType === "client_credentials" || rawAuthType === "password" || rawAuthType === "partner_default"
        ? rawAuthType
        : undefined;
    const rawEnv = trimStr(regMatch?.mysoftEnvironment || regCreds.environment || stCreds.environment);
    const environment: MysoftCompanyEnvironment | undefined =
      rawEnv === "test" ? "test" : rawEnv === "prod" ? "prod" : undefined;

    return {
      companyId: resolvedCompId || undefined,
      companyName:
        trimStr(regMatch?.companyName) ||
        trimStr(regMatch?.companyTitle) ||
        trimStr(settings?.companyName) ||
        trimStr(settings?.companyTitle) ||
        undefined,
      tenantIdentifierNumber: resolvedTenant,
      matchedType: resolvedTenant?.length === 11 ? "tckn" : "vkn",
      username: username || undefined,
      password: password || undefined,
      clientId: clientId || undefined,
      clientSecret: clientSecret || undefined,
      authType,
      environment,
      connectorGuid: trimStr(regMatch?.mysoftConnectorGuid || regCreds.connectorGuid || stCreds.connectorGuid) || undefined,
      eFaturaPrefix: trimStr(regMatch?.eFaturaPrefix || settings?.eFaturaPrefix) || undefined,
      eArsivPrefix: trimStr(regMatch?.eArsivPrefix || settings?.eArsivPrefix) || undefined,
    };
  }

  private findStoredConnection(companyId?: string, tenantIdentifierNumber?: string): StoredMysoftCompanyConnection | null {
    if (companyId && this.state.connections[companyId]) {
      return this.state.connections[companyId];
    }
    const cleanTenant = normalizeMysoftTenantIdentifier(tenantIdentifierNumber);
    if (cleanTenant) {
      for (const conn of Object.values(this.state.connections)) {
        if (normalizeMysoftTenantIdentifier(conn.tenantIdentifierNumber) === cleanTenant) {
          return conn;
        }
      }
    }
    return null;
  }

  private getOrCreateClient(config: MysoftConfig): MysoftEdocumentClient {
    const fingerprint = crypto
      .createHash("sha256")
      .update(
        JSON.stringify({
          baseUrl: config.baseUrl,
          tokenUrl: config.tokenUrl,
          grantType: config.grantType,
          clientId: config.clientId || "",
          clientSecret: config.clientSecret || "",
          username: config.username || "",
          password: config.password || "",
          tenantIdentifierNumber: config.tenantIdentifierNumber || "",
          connectorGuid: config.connectorGuid || "",
          mockMode: config.mockMode,
        }),
      )
      .digest("hex");

    const cached = this.clientCache.get(fingerprint);
    if (cached) return cached;

    if (this.clientCache.size > 200) {
      const oldestKey = this.clientCache.keys().next().value;
      if (oldestKey) this.clientCache.delete(oldestKey);
    }

    const client = new MysoftEdocumentClient(config);
    this.clientCache.set(fingerprint, client);
    return client;
  }

  /**
   * İstek bağlamına (companyId ve/veya VKN/TCKN) göre doğru Mysoft API istemcisini çözer.
   */
  resolveClient(context: {
    companyId?: string;
    tenantIdentifierNumber?: string;
    draftOverride?: {
      environment?: MysoftCompanyEnvironment;
      authType?: MysoftCompanyAuthType;
      username?: string;
      password?: string;
      clientId?: string;
      clientSecret?: string;
      connectorGuid?: string;
    };
  } = {}): {
    client: MysoftEdocumentClient;
    companyId?: string;
    tenantIdentifierNumber?: string;
    authSource: "company_credentials" | "cloud_sync_credentials" | "server_partner_env" | "unconfigured";
  } {
    const baseEnvConfig = getMysoftConfig();
    const stored = this.findStoredConnection(context.companyId, context.tenantIdentifierNumber);
    const cloud = this.findCloudCompanyData(
      context.companyId || stored?.companyId,
      context.tenantIdentifierNumber || stored?.tenantIdentifierNumber,
    );

    const resolvedCompanyId = context.companyId || stored?.companyId || cloud?.companyId;
    const resolvedTenant =
      normalizeMysoftTenantIdentifier(context.tenantIdentifierNumber) ||
      normalizeMysoftTenantIdentifier(stored?.tenantIdentifierNumber) ||
      normalizeMysoftTenantIdentifier(cloud?.tenantIdentifierNumber) ||
      baseEnvConfig.tenantIdentifierNumber;

    const storedUsername = stored ? this.decrypt(stored.usernameEnc, stored.companyId) : "";
    const storedPassword = stored ? this.decrypt(stored.passwordEnc, stored.companyId) : "";
    const storedClientId = stored ? this.decrypt(stored.clientIdEnc, stored.companyId) : "";
    const storedClientSecret = stored ? this.decrypt(stored.clientSecretEnc, stored.companyId) : "";

    const draft = context.draftOverride;
    const effectiveEnv: MysoftCompanyEnvironment =
      draft?.environment ||
      stored?.environment ||
      cloud?.environment ||
      (baseEnvConfig.baseUrl === TEST_BASE_URL ? "test" : "prod");

    const username = trimStr(draft?.username) || storedUsername || trimStr(cloud?.username);
    const password = trimStr(draft?.password) || storedPassword || trimStr(cloud?.password);
    const clientId = trimStr(draft?.clientId) || storedClientId || trimStr(cloud?.clientId);
    const clientSecret = trimStr(draft?.clientSecret) || storedClientSecret || trimStr(cloud?.clientSecret);
    const connectorGuid =
      trimStr(draft?.connectorGuid) ||
      trimStr(stored?.connectorGuid) ||
      trimStr(cloud?.connectorGuid) ||
      baseEnvConfig.connectorGuid;

    const requestedAuthType: MysoftCompanyAuthType | undefined =
      draft?.authType || stored?.authType || cloud?.authType;

    const hasCompanyClientCreds = Boolean(clientId && clientSecret);
    const hasCompanyPasswordCreds = Boolean(username && password);
    const wantsPartnerDefault = requestedAuthType === "partner_default";

    // 1. Şirkete özel kimlik bilgileri varsa (OAuth2 Client ID/Secret veya Kullanıcı Adı/Şifre)
    if (!wantsPartnerDefault && (hasCompanyClientCreds || hasCompanyPasswordCreds)) {
      const grantType: MysoftGrantType =
        requestedAuthType === "client_credentials" && hasCompanyClientCreds
          ? "client_credentials"
          : requestedAuthType === "password" && hasCompanyPasswordCreds
            ? "password"
            : hasCompanyClientCreds
              ? "client_credentials"
              : "password";

      const baseUrl = baseUrlForEnvironment(effectiveEnv, baseEnvConfig.baseUrl);
      const tokenUrl = `${baseUrl}/oauth/token`;

      const companyConfig: MysoftConfig = {
        ...baseEnvConfig,
        baseUrl,
        tokenUrl,
        grantType,
        clientId: grantType === "client_credentials" ? clientId : clientId || baseEnvConfig.clientId,
        clientSecret: grantType === "client_credentials" ? clientSecret : clientSecret || baseEnvConfig.clientSecret,
        username: grantType === "password" ? username : undefined,
        password: grantType === "password" ? password : undefined,
        tenantIdentifierNumber: resolvedTenant,
        connectorGuid,
        mockMode: false,
      };

      const fromStored = Boolean(
        (draft && (draft.username || draft.clientId)) ||
          storedUsername ||
          storedPassword ||
          storedClientId ||
          storedClientSecret,
      );

      return {
        client: this.getOrCreateClient(companyConfig),
        companyId: resolvedCompanyId,
        tenantIdentifierNumber: resolvedTenant,
        authSource: fromStored ? "company_credentials" : "cloud_sync_credentials",
      };
    }

    // 2. Sunucu ortamında tanımlı merkezi İş Ortağı / Mali Müşavir anahtarı varsa
    const serverHasRealCreds =
      !baseEnvConfig.mockMode &&
      Boolean(
        (baseEnvConfig.clientId && baseEnvConfig.clientSecret) ||
          (baseEnvConfig.username && baseEnvConfig.password),
      );
    if (serverHasRealCreds) {
      const partnerConfig: MysoftConfig = {
        ...baseEnvConfig,
        tenantIdentifierNumber: resolvedTenant,
        connectorGuid,
      };
      return {
        client: this.getOrCreateClient(partnerConfig),
        companyId: resolvedCompanyId,
        tenantIdentifierNumber: resolvedTenant,
        authSource: "server_partner_env",
      };
    }

    // 3. Henüz kimlik bilgisi girilmemiş şirket (simülasyon / mock fallback)
    const fallbackConfig: MysoftConfig = {
      ...baseEnvConfig,
      tenantIdentifierNumber: resolvedTenant,
      connectorGuid,
    };
    return {
      client: this.getOrCreateClient(fallbackConfig),
      companyId: resolvedCompanyId,
      tenantIdentifierNumber: resolvedTenant,
      authSource: "unconfigured",
    };
  }

  /** Tek bir şirketin maskelenmiş Mysoft API erişim durumunu döner. */
  getPublicView(companyId: string, fallbackInfo?: {
    companyName?: string;
    tenantIdentifierNumber?: string;
    matchedType?: "vkn" | "tckn";
  }): MysoftCompanyAccessPublicView {
    const stored = this.state.connections[companyId];
    const cloud = this.findCloudCompanyData(companyId, fallbackInfo?.tenantIdentifierNumber);
    const baseEnv = getMysoftConfig();

    const username = (stored ? this.decrypt(stored.usernameEnc, companyId) : "") || trimStr(cloud?.username);
    const password = (stored ? this.decrypt(stored.passwordEnc, companyId) : "") || trimStr(cloud?.password);
    const clientId = (stored ? this.decrypt(stored.clientIdEnc, companyId) : "") || trimStr(cloud?.clientId);
    const clientSecret = (stored ? this.decrypt(stored.clientSecretEnc, companyId) : "") || trimStr(cloud?.clientSecret);

    const tenant =
      normalizeMysoftTenantIdentifier(stored?.tenantIdentifierNumber) ||
      normalizeMysoftTenantIdentifier(fallbackInfo?.tenantIdentifierNumber) ||
      normalizeMysoftTenantIdentifier(cloud?.tenantIdentifierNumber) ||
      "";

    const matchedType: "vkn" | "tckn" =
      stored?.matchedType ||
      fallbackInfo?.matchedType ||
      (tenant.length === 11 ? "tckn" : "vkn");

    const resolved = this.resolveClient({ companyId, tenantIdentifierNumber: tenant || undefined });
    const environment: MysoftCompanyEnvironment =
      stored?.environment ||
      cloud?.environment ||
      (resolved.client.config.baseUrl === TEST_BASE_URL ? "test" : "prod");

    const authType: MysoftCompanyAuthType =
      stored?.authType ||
      cloud?.authType ||
      (clientId && clientSecret
        ? "client_credentials"
        : username && password
          ? "password"
          : resolved.authSource === "server_partner_env"
            ? "partner_default"
            : "password");

    const configured = resolved.authSource !== "unconfigured" && !resolved.client.config.mockMode;

    let status: MysoftCompanyAccessState = "unconfigured";
    if (stored?.lastStatus && configured) {
      status = stored.lastStatus;
    } else if (configured) {
      status = resolved.authSource === "server_partner_env" ? "partner_connected" : "configured_untested";
    }

    const statusMessage =
      stored?.lastMessage ||
      (status === "connected"
        ? "Mysoft API bağlantısı doğrulandı ve aktif."
        : status === "partner_connected"
          ? "Merkezi İş Ortağı API anahtarı üzerinden erişim aktif."
          : status === "configured_untested"
            ? "API kimlik bilgileri kayıtlı; canlı doğrulama yapılabilir."
            : status === "error"
              ? stored?.lastError || "Mysoft API doğrulaması başarısız."
              : tenant
                ? "VKN/TCKN eşleşti ancak Mysoft API kullanıcı adı/şifre veya Client ID/Secret girilmedi."
                : "Henüz VKN/TCKN eşleştirmesi ve API bilgisi tanımlanmadı.");

    return {
      companyId,
      companyName:
        trimStr(stored?.companyName) ||
        trimStr(fallbackInfo?.companyName) ||
        trimStr(cloud?.companyName) ||
        companyId,
      tenantIdentifierNumber: tenant,
      matchedType,
      isMatched: tenant.length === 10 || tenant.length === 11,
      authType,
      authSource: resolved.authSource,
      environment,
      baseUrl: baseUrlForEnvironment(environment, baseEnv.baseUrl),
      hasUsername: Boolean(username),
      hasPassword: Boolean(password),
      hasClientId: Boolean(clientId),
      hasClientSecret: Boolean(clientSecret),
      usernamePreview: username,
      passwordMasked: maskCredentialValue(password, 1, 1),
      clientIdMasked: maskCredentialValue(clientId, 4, 3),
      clientSecretMasked: maskCredentialValue(clientSecret, 2, 2),
      connectorGuid: trimStr(stored?.connectorGuid || cloud?.connectorGuid),
      configured,
      mockMode: resolved.client.config.mockMode,
      status,
      statusMessage,
      lastError: trimStr(stored?.lastError),
      lastVerifiedAt: stored?.lastVerifiedAt || null,
      resolvedTenantTitle: trimStr(stored?.resolvedTenantTitle),
      resolvedTaxOffice: trimStr(stored?.resolvedTaxOffice),
      eFaturaPrefix: trimStr(stored?.eFaturaPrefix || cloud?.eFaturaPrefix),
      eArsivPrefix: trimStr(stored?.eArsivPrefix || cloud?.eArsivPrefix),
      updatedAt: stored?.updatedAt || null,
    };
  }

  /** Sistemdeki tüm eşleştirilmiş şirketlerin Mysoft API erişim özetini listeler. */
  listAllPublicViews(): MysoftCompanyAccessPublicView[] {
    const ids = new Set<string>(Object.keys(this.state.connections));
    const snapshot = this.resolveCloudSyncSnapshot?.();
    if (snapshot?.companiesRegistry && Array.isArray(snapshot.companiesRegistry)) {
      for (const comp of snapshot.companiesRegistry) {
        const cid = trimStr(comp?.id);
        if (cid) ids.add(cid);
      }
    }
    if (snapshot?.companiesData) {
      for (const cid of Object.keys(snapshot.companiesData)) {
        if (cid) ids.add(cid);
      }
    }
    return Array.from(ids).map((cid) => this.getPublicView(cid));
  }

  /** Şirket Mysoft VKN/TCKN eşleştirmesini ve API kimlik bilgilerini kaydeder/günceller. */
  async upsertConnection(input: UpsertMysoftCompanyAccessInput): Promise<MysoftCompanyAccessPublicView> {
    const companyId = trimStr(input.companyId);
    if (!companyId) {
      throw new Error("companyId zorunludur.");
    }
    const existing = this.state.connections[companyId];
    const now = new Date().toISOString();

    const cleanTenant =
      normalizeMysoftTenantIdentifier(input.tenantIdentifierNumber) ||
      existing?.tenantIdentifierNumber;

    const matchedType: "vkn" | "tckn" =
      input.matchedType ||
      (cleanTenant?.length === 11 ? "tckn" : existing?.matchedType || "vkn");

    const environment: MysoftCompanyEnvironment =
      input.environment === "test"
        ? "test"
        : input.environment === "prod"
          ? "prod"
          : existing?.environment || "prod";

    const nextUsername = input.clearCredentials
      ? ""
      : input.username !== undefined
        ? trimStr(input.username)
        : existing
          ? this.decrypt(existing.usernameEnc, companyId)
          : "";

    const nextPassword = input.clearCredentials
      ? ""
      : input.password !== undefined && trimStr(input.password) !== ""
        ? trimStr(input.password)
        : existing
          ? this.decrypt(existing.passwordEnc, companyId)
          : "";

    const nextClientId = input.clearCredentials
      ? ""
      : input.clientId !== undefined
        ? trimStr(input.clientId)
        : existing
          ? this.decrypt(existing.clientIdEnc, companyId)
          : "";

    const nextClientSecret = input.clearCredentials
      ? ""
      : input.clientSecret !== undefined && trimStr(input.clientSecret) !== ""
        ? trimStr(input.clientSecret)
        : existing
          ? this.decrypt(existing.clientSecretEnc, companyId)
          : "";

    const authType: MysoftCompanyAuthType =
      input.authType ||
      existing?.authType ||
      (nextClientId && nextClientSecret
        ? "client_credentials"
        : nextUsername && nextPassword
          ? "password"
          : "password");

    const record: StoredMysoftCompanyConnection = {
      companyId,
      companyName: trimStr(input.companyName) || existing?.companyName || companyId,
      tenantIdentifierNumber: cleanTenant,
      matchedType,
      authType,
      environment,
      usernameEnc: nextUsername ? this.encrypt(nextUsername, companyId) : undefined,
      passwordEnc: nextPassword ? this.encrypt(nextPassword, companyId) : undefined,
      clientIdEnc: nextClientId ? this.encrypt(nextClientId, companyId) : undefined,
      clientSecretEnc: nextClientSecret ? this.encrypt(nextClientSecret, companyId) : undefined,
      connectorGuid:
        input.connectorGuid !== undefined
          ? trimStr(input.connectorGuid) || undefined
          : existing?.connectorGuid,
      eFaturaPrefix: existing?.eFaturaPrefix,
      eArsivPrefix: existing?.eArsivPrefix,
      resolvedTenantTitle: existing?.resolvedTenantTitle,
      resolvedTaxOffice: existing?.resolvedTaxOffice,
      lastStatus: existing?.lastStatus,
      lastMessage: existing?.lastMessage,
      lastError: "",
      lastVerifiedAt: existing?.lastVerifiedAt,
      updatedAt: now,
    };

    this.state.connections[companyId] = record;
    this.clientCache.clear();
    await this.persist();
    return this.getPublicView(companyId);
  }

  async deleteConnection(companyId: string): Promise<void> {
    const cid = trimStr(companyId);
    if (!cid || !this.state.connections[cid]) return;
    delete this.state.connections[cid];
    this.clientCache.clear();
    await this.persist();
  }

  /**
   * Eşleştirilen şirketin Mysoft API erişimini canlı olarak doğrular:
   *  1. OAuth2 `/oauth/token` üzerinden gerçek erişim jetonu (Bearer Token) alır.
   *  2. Mükellef VKN/TCKN bilgisini Mysoft'tan sorgular (`getTenantWithIdentifier` / `getTaxPayerDetailInfo`).
   *  3. Şirketin resmi e-Fatura & e-Arşiv ön eklerini ve son numaratörünü çeker.
   */
  async verifyCompanyAccess(options: {
    companyId: string;
    companyName?: string;
    tenantIdentifierNumber?: string;
    matchedType?: "vkn" | "tckn";
    environment?: MysoftCompanyEnvironment;
    authType?: MysoftCompanyAuthType;
    username?: string;
    password?: string;
    clientId?: string;
    clientSecret?: string;
    connectorGuid?: string;
    persistCredentials?: boolean;
  }): Promise<VerifyMysoftCompanyAccessResult> {
    const companyId = trimStr(options.companyId);
    if (!companyId) {
      throw new Error("companyId zorunludur.");
    }

    if (options.persistCredentials) {
      await this.upsertConnection({
        companyId,
        companyName: options.companyName,
        tenantIdentifierNumber: options.tenantIdentifierNumber,
        matchedType: options.matchedType,
        environment: options.environment,
        authType: options.authType,
        username: options.username,
        password: options.password,
        clientId: options.clientId,
        clientSecret: options.clientSecret,
        connectorGuid: options.connectorGuid,
      });
    }

    const resolved = this.resolveClient({
      companyId,
      tenantIdentifierNumber: options.tenantIdentifierNumber,
      draftOverride: {
        environment: options.environment,
        authType: options.authType,
        username: options.username,
        password: options.password,
        clientId: options.clientId,
        clientSecret: options.clientSecret,
        connectorGuid: options.connectorGuid,
      },
    });

    const testedAt = new Date().toISOString();
    const targetTenant =
      normalizeMysoftTenantIdentifier(options.tenantIdentifierNumber) ||
      resolved.tenantIdentifierNumber ||
      "";

    if (resolved.authSource === "unconfigured" || resolved.client.config.mockMode) {
      const msg =
        "Mysoft API kimlik bilgisi tanımlı değil. Lütfen şirketin Mysoft Kullanıcı Adı & Şifresini veya OAuth2 Client ID & Secret bilgilerini girin.";
      await this.updateVerificationMetadata(companyId, {
        companyName: options.companyName,
        tenantIdentifierNumber: targetTenant || undefined,
        status: "unconfigured",
        message: msg,
        error: msg,
        verifiedAt: undefined,
      });
      return {
        ok: false,
        access: this.getPublicView(companyId, {
          companyName: options.companyName,
          tenantIdentifierNumber: targetTenant,
          matchedType: options.matchedType,
        }),
        tenant: null,
        prefixes: null,
        testedAt,
        message: msg,
      };
    }

    try {
      // 1. OAuth2 Token doğrulaması (başarısız olursa MysoftApiError / MysoftConfigurationError fırlatır)
      const identity = await resolved.client.getTokenIdentity();

      // 2. Eşleştirilen VKN/TCKN için mükellef doğrulaması
      let resolvedTenantInfo: {
        taxNumber: string;
        name: string;
        taxOffice?: string;
        city?: string;
        district?: string;
      } | null = null;

      if (targetTenant) {
        try {
          const tenantRaw = (await resolved.client.getTenantWithIdentifier(targetTenant)) as Record<string, unknown> | null;
          const dataObj =
            tenantRaw && typeof tenantRaw === "object" && "data" in tenantRaw
              ? (Array.isArray(tenantRaw.data) ? tenantRaw.data[0] : tenantRaw.data)
              : tenantRaw;
          if (dataObj && typeof dataObj === "object") {
            const rec = dataObj as Record<string, unknown>;
            const name = trimStr(
              rec.tenantName ?? rec.accountName ?? rec.title ?? rec.companyName ?? rec.name,
            );
            const vknVal =
              normalizeMysoftTenantIdentifier(
                rec.vknTckn ?? rec.identifierNumber ?? rec.taxNumber ?? rec.tenantIdentifierNumber,
              ) || targetTenant;
            if (name || vknVal) {
              resolvedTenantInfo = {
                taxNumber: vknVal,
                name: name || options.companyName || vknVal,
                taxOffice: trimStr(rec.taxOfficeName) || undefined,
                city: trimStr(rec.cityName) || undefined,
                district: trimStr(rec.citySubdivision ?? rec.townName ?? rec.district) || undefined,
              };
            }
          }
        } catch {
          // İş ortağı olmayan tekil şirket hesaplarında getUserCompanyInfo veya getTaxPayerDetailInfo çalışır
        }

        if (!resolvedTenantInfo) {
          try {
            const userCompRaw = (await resolved.client.requestDocumentOperation(
              "generalcard.user-company-info",
              { tenantIdentifierNumber: targetTenant || undefined },
            )) as Record<string, unknown> | null;
            const compData =
              userCompRaw && typeof userCompRaw === "object" && "data" in userCompRaw
                ? userCompRaw.data
                : userCompRaw;
            if (compData && typeof compData === "object") {
              const rec = compData as Record<string, unknown>;
              const name = trimStr(
                rec.companyName ?? rec.title ?? rec.accountName ?? rec.tenantName ?? rec.name,
              );
              const vknVal =
                normalizeMysoftTenantIdentifier(
                  rec.identifierNumber ?? rec.vknTckn ?? rec.taxNumber,
                ) || targetTenant;
              if (name && (!targetTenant || vknVal === targetTenant)) {
                resolvedTenantInfo = {
                  taxNumber: vknVal,
                  name,
                  taxOffice: trimStr(rec.taxOfficeName ?? rec.taxOffice) || undefined,
                  city: trimStr(rec.cityName ?? rec.city) || undefined,
                  district: trimStr(rec.townName ?? rec.district) || undefined,
                };
              }
            }
          } catch {
            // Devam et
          }
        }

        if (!resolvedTenantInfo) {
          try {
            const detail = await resolved.client.getTaxPayerDetailInfo(targetTenant, targetTenant);
            const detailData = detail?.data;
            if (detailData) {
              const fullName = [trimStr(detailData.firstName), trimStr(detailData.lastName)]
                .filter(Boolean)
                .join(" ");
              const resolvedTitle =
                trimStr(detailData.identityTitle) || trimStr(detailData.tradeName) || fullName;
              const resolvedId =
                normalizeMysoftTenantIdentifier(
                  detailData.taxIdentifierNumber ?? detailData.tcIdentifierNumber,
                ) || targetTenant;
              const primaryAddress = Array.isArray(detailData.taxpayerAddressList)
                ? detailData.taxpayerAddressList[0]
                : undefined;
              if (resolvedTitle) {
                resolvedTenantInfo = {
                  taxNumber: resolvedId,
                  name: resolvedTitle,
                  taxOffice: trimStr(detailData.taxOfficeName) || undefined,
                  city: trimStr(primaryAddress?.cityName) || undefined,
                  district:
                    trimStr(primaryAddress?.townName ?? primaryAddress?.district) || undefined,
                };
              }
            }
          } catch {
            // Devam et: OAuth2 token geçerliyse erişim yine de doğrulanmıştır
          }
        }
      }

      // 3. Resmi belge ön ekleri ve sıradaki numaratörleri çek
      let prefixesInfo: VerifyMysoftCompanyAccessResult["prefixes"] = null;
      if (targetTenant) {
        try {
          const docNums = await resolved.client.getTenantDocumentNumbersWithSequence(targetTenant);
          prefixesInfo = {
            eFaturaPrefix: docNums.eFaturaPrefix || undefined,
            eFaturaNextNumber: docNums.eFaturaNextNumber || undefined,
            eFaturaLastNumber: docNums.eFaturaLastNumber || undefined,
            eArsivPrefix: docNums.eArsivPrefix || undefined,
            eArsivNextNumber: docNums.eArsivNextNumber || undefined,
            eArsivLastNumber: docNums.eArsivLastNumber || undefined,
          };
        } catch {
          // Numaratör listesi opsiyonel
        }
      }

      const finalStatus: MysoftCompanyAccessState =
        resolved.authSource === "server_partner_env" ? "partner_connected" : "connected";

      const titleLabel = resolvedTenantInfo?.name || options.companyName || targetTenant || companyId;
      const prefixSummary =
        prefixesInfo?.eFaturaPrefix || prefixesInfo?.eArsivPrefix
          ? ` • Ön Ekler: ${prefixesInfo.eFaturaPrefix || "-"} / ${prefixesInfo.eArsivPrefix || "-"}`
          : "";
      const successMessage =
        finalStatus === "partner_connected"
          ? `"${titleLabel}" (${targetTenant || "VKN"}) için Mysoft İş Ortağı API erişimi doğrulandı${prefixSummary}.`
          : `"${titleLabel}" (${targetTenant || "VKN"}) için doğrudan Mysoft API erişimi doğrulandı${prefixSummary}.`;

      await this.updateVerificationMetadata(companyId, {
        companyName: options.companyName || resolvedTenantInfo?.name,
        tenantIdentifierNumber: targetTenant || resolvedTenantInfo?.taxNumber,
        status: finalStatus,
        message: successMessage,
        error: "",
        verifiedAt: testedAt,
        resolvedTenantTitle: resolvedTenantInfo?.name,
        resolvedTaxOffice: resolvedTenantInfo?.taxOffice,
        eFaturaPrefix: prefixesInfo?.eFaturaPrefix,
        eArsivPrefix: prefixesInfo?.eArsivPrefix,
      });

      return {
        ok: true,
        access: this.getPublicView(companyId, {
          companyName: options.companyName,
          tenantIdentifierNumber: targetTenant,
          matchedType: options.matchedType,
        }),
        identity,
        tenant: resolvedTenantInfo,
        prefixes: prefixesInfo,
        testedAt,
        message: successMessage,
      };
    } catch (error) {
      const errMessage =
        error instanceof MysoftApiError || error instanceof MysoftConfigurationError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Mysoft API bağlantısı kurulamadı.";

      await this.updateVerificationMetadata(companyId, {
        companyName: options.companyName,
        tenantIdentifierNumber: targetTenant || undefined,
        status: "error",
        message: `Mysoft API bağlantı hatası: ${errMessage}`,
        error: errMessage,
        verifiedAt: testedAt,
      });

      return {
        ok: false,
        access: this.getPublicView(companyId, {
          companyName: options.companyName,
          tenantIdentifierNumber: targetTenant,
          matchedType: options.matchedType,
        }),
        tenant: null,
        prefixes: null,
        testedAt,
        message: errMessage,
      };
    }
  }

  private async updateVerificationMetadata(
    companyId: string,
    meta: {
      companyName?: string;
      tenantIdentifierNumber?: string;
      status: MysoftCompanyAccessState;
      message: string;
      error: string;
      verifiedAt?: string;
      resolvedTenantTitle?: string;
      resolvedTaxOffice?: string;
      eFaturaPrefix?: string;
      eArsivPrefix?: string;
    },
  ): Promise<void> {
    const existing = this.state.connections[companyId];
    const cleanTenant =
      normalizeMysoftTenantIdentifier(meta.tenantIdentifierNumber) || existing?.tenantIdentifierNumber;

    const record: StoredMysoftCompanyConnection = {
      companyId,
      companyName: trimStr(meta.companyName) || existing?.companyName || companyId,
      tenantIdentifierNumber: cleanTenant,
      matchedType: existing?.matchedType || (cleanTenant?.length === 11 ? "tckn" : "vkn"),
      authType: existing?.authType,
      environment: existing?.environment,
      usernameEnc: existing?.usernameEnc,
      passwordEnc: existing?.passwordEnc,
      clientIdEnc: existing?.clientIdEnc,
      clientSecretEnc: existing?.clientSecretEnc,
      connectorGuid: existing?.connectorGuid,
      eFaturaPrefix: meta.eFaturaPrefix || existing?.eFaturaPrefix,
      eArsivPrefix: meta.eArsivPrefix || existing?.eArsivPrefix,
      resolvedTenantTitle: meta.resolvedTenantTitle || existing?.resolvedTenantTitle,
      resolvedTaxOffice: meta.resolvedTaxOffice || existing?.resolvedTaxOffice,
      lastStatus: meta.status,
      lastMessage: meta.message,
      lastError: meta.error,
      lastVerifiedAt: meta.verifiedAt ?? existing?.lastVerifiedAt,
      updatedAt: new Date().toISOString(),
    };

    this.state.connections[companyId] = record;
    await this.persist();
  }
}
