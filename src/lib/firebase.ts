import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  setLogLevel,
  disableNetwork,
  doc,
  getDocFromServer,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  serverTimestamp,
  orderBy
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "firebase/storage";
import firebaseConfig from "../../firebase-applet-config.json";
import { InvoiceTaxItem, AppModuleKey } from "../types";
import {
  safeGetStorageItem,
  safeSetStorageItem,
  getCompaniesList,
  saveCompaniesList,
  getDeletedCompanyIds,
  getDeletedUserKeys,
  isUserMarkedDeleted,
  markUserAsDeleted,
  unmarkUserAsDeleted,
  isProtectedCompanyId,
  isProtectedUserIdentifier,
} from "../utils/storage";

// Initialize Firebase App lazily/safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Configure Firestore with long-polling to prevent WebChannel streaming drops in iframes/proxies
const targetDbId =
  (firebaseConfig as any).firestoreDatabaseId &&
  (firebaseConfig as any).firestoreDatabaseId !== "(default)"
    ? (firebaseConfig as any).firestoreDatabaseId
    : undefined;

let firestoreInstance;
try {
  setLogLevel("silent");
} catch {
  // ignore log level config errors
}
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      experimentalForceLongPolling: true,
      ignoreUndefinedProperties: true
    },
    targetDbId
  );
} catch {
  firestoreInstance = targetDbId ? getFirestore(app, targetDbId) : getFirestore(app);
}

export const db = firestoreInstance;

const QUOTA_EXHAUSTED_STORAGE_KEY = "muavin_firestore_write_quota_exhausted_ts";
const QUOTA_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours cooldown when daily quota is hit
let memoryQuotaExhaustedUntil = 0;

export function isFirestoreWriteQuotaExhausted(): boolean {
  const now = Date.now();
  if (memoryQuotaExhaustedUntil > now) return true;
  if (typeof window !== "undefined") {
    try {
      const raw =
        window.sessionStorage?.getItem(QUOTA_EXHAUSTED_STORAGE_KEY) ||
        window.localStorage?.getItem(QUOTA_EXHAUSTED_STORAGE_KEY);
      if (raw) {
        const until = Number(raw);
        if (!isNaN(until) && until > now) {
          memoryQuotaExhaustedUntil = until;
          return true;
        }
      }
    } catch {
      // ignore storage errors
    }
  }
  return false;
}

export function checkAndMarkFirestoreQuotaError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error || "");
  const code = (error as any)?.code || "";
  if (
    code === "resource-exhausted" ||
    msg.includes("resource-exhausted") ||
    msg.includes("Quota limit exceeded") ||
    msg.includes("Quota exceeded")
  ) {
    const until = Date.now() + QUOTA_COOLDOWN_MS;
    memoryQuotaExhaustedUntil = until;
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage?.setItem(QUOTA_EXHAUSTED_STORAGE_KEY, String(until));
        window.localStorage?.setItem(QUOTA_EXHAUSTED_STORAGE_KEY, String(until));
      } catch {
        // ignore
      }
    }
    try {
      void disableNetwork(db);
    } catch {
      // ignore network disable error
    }
    return true;
  }
  return false;
}

// Error Handling conforming to Firebase Integration Skill
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn("Firestore Operation Notice: ", JSON.stringify(errInfo));
  return errInfo;
}

// Connection validation is handled lazily on actual operations to preserve Firestore free-tier daily read quota.


export const storage = getStorage(app);

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  firebaseSignOut,
  onAuthStateChanged
};

export interface ExtractedDocumentData {
  taxNumber?: string; // Vergi Numarası / TCKN
  companyTitle?: string; // Ünvan (Satıcı/Düzenleyen Firma)
  invoiceNumber?: string; // Fiş veya Fatura Numarası
  issueDate?: string; // Belge Düzenleme Tarihi (YYYY-MM-DD)
  docType?: "Fatura" | "Fiş" | "Mal Alımı" | "Diğer";
  purchaseType?: "Mal Alımı" | "Gider / Masraf" | "Fiş";
  subtotal?: number; // Matrah (KDV Hariç Tutar)
  vatRate?: number; // KDV Oranı (%)
  vatAmount?: number; // KDV Tutarı
  taxItems?: InvoiceTaxItem[]; // Tüm vergi kalemleri dökümü (KDV %1/%10/%20, Tevkifat, ÖTV, ÖİV, Konaklama, Stopaj, Damga vb.)
  withholdingAmount?: number; // Toplam Tevkifat Tutarı
  otvAmount?: number; // Toplam ÖTV Tutarı
  oivAmount?: number; // Toplam ÖİV Tutarı
  accommodationTaxAmount?: number; // Toplam Konaklama Vergisi Tutarı
  stampTaxAmount?: number; // Toplam Damga Vergisi
  withholdingTaxAmount?: number; // Toplam Stopaj Tutarı
  grandTotal?: number; // Genel Toplam
  paymentMethod?: "Nakit" | "Kredi Kartı" | "Banka Transferi / EFT" | "Çek" | "Senet" | "Açık Hesap / Vadeli";
  expenseCategory?: string; // Masraf Kalemi
  notes?: string;
  isTransferredToAccounting?: boolean; // Ön muhasebeye aktarıldı mı?
}

export interface UserFileMetadata {
  id: string;
  userId: string;
  userEmail?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadDate: string;
  category: string;
  description: string;
  fileUrl?: string; // Firebase Storage Download URL
  storagePath?: string; // Firebase Storage path
  fileData?: string; // Fallback Base64 data for previewing/downloading
  expiresAt?: number; // Expiration timestamp in ms (for temporary WhatsApp shares)
  extractedData?: ExtractedDocumentData;
}

export interface UserProfileData {
  userId: string;
  email: string;
  username?: string; // Uygulamaya giriş kullanıcı adı
  name: string;
  companyName: string;
  companyId?: string; // İlgili şirket ID'si
  phone: string;
  taxNumber: string;
  selectedLogoId: number;
  selectedLogoName: string;
  selectedLogoUrl: string;
  role: string;
  allowedModules?: AppModuleKey[]; // İzin verilen modüller (Boş/undefined ise tüm modüller serbesttir)
  passwordPlain?: string; // Admin veya şirket açılışında tanımlanan şifre
  createdByAdmin?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Deeply remove any undefined fields before saving to Firestore to prevent "Unsupported field value: undefined" errors
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === "object") {
    // If it is a Firestore FieldValue (e.g. serverTimestamp) or Date, return as-is
    if (data instanceof Date) return data;
    if ("_methodName" in (data as any) || "_delegate" in (data as any)) {
      return data;
    }
    
    const cleanObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleanObj[key] = sanitizeForFirestore(value);
      }
    }
    return cleanObj as T;
  }
  return data;
}

// 1. User Profile Operations
export const LOCAL_USERS_BACKUP_KEY = "muavin_admin_created_users_backup";

export function getLocalUsersBackup(): UserProfileData[] {
  try {
    const raw = safeGetStorageItem(LOCAL_USERS_BACKUP_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const deletedCompIds = new Set(getDeletedCompanyIds());
    return parsed.filter(
      (u) =>
        u &&
        (isProtectedUserIdentifier(u) ||
          (!isUserMarkedDeleted(u) &&
            !(u.companyId && !isProtectedCompanyId(u.companyId) && deletedCompIds.has(u.companyId))))
    );
  } catch {
    return [];
  }
}

export function saveLocalUsersBackup(usersList: UserProfileData[], allowRemoval = false): void {
  try {
    const deletedCompIds = new Set(getDeletedCompanyIds());
    const mergedMap = new Map<string, UserProfileData>();

    if (!allowRemoval) {
      try {
        const rawExisting = safeGetStorageItem(LOCAL_USERS_BACKUP_KEY);
        if (rawExisting) {
          const parsedExisting = JSON.parse(rawExisting);
          if (Array.isArray(parsedExisting)) {
            parsedExisting.forEach((u: UserProfileData) => {
              if (!u) return;
              if (
                !isProtectedUserIdentifier(u) &&
                (isUserMarkedDeleted(u) ||
                  (u.companyId && !isProtectedCompanyId(u.companyId) && deletedCompIds.has(u.companyId)))
              ) {
                return;
              }
              const key = (u.email || u.userId || u.username || "").trim().toLowerCase();
              if (key) mergedMap.set(key, u);
            });
          }
        }
      } catch {}
    }

    (Array.isArray(usersList) ? usersList : []).forEach((u) => {
      if (!u) return;
      if (
        !isProtectedUserIdentifier(u) &&
        (isUserMarkedDeleted(u) ||
          (u.companyId && !isProtectedCompanyId(u.companyId) && deletedCompIds.has(u.companyId)))
      ) {
        return;
      }
      const key = (u.email || u.userId || u.username || "").trim().toLowerCase();
      if (key) {
        const existing = mergedMap.get(key);
        mergedMap.set(key, existing ? { ...existing, ...u } : u);
      }
    });

    safeSetStorageItem(LOCAL_USERS_BACKUP_KEY, JSON.stringify(Array.from(mergedMap.values())));
  } catch (err) {
    console.warn("Local users backup save warning:", err);
  }
}

export async function saveUserProfile(user: UserProfileData): Promise<void> {
  // Unmark from deleted registry when explicitly saved/created by Admin
  unmarkUserAsDeleted({
    userId: user.userId,
    email: user.email,
    username: user.username,
  });

  // Always update local persistent backup first for immediate offline resilience
  try {
    const existing = getLocalUsersBackup();
    const index = existing.findIndex(
      (u) =>
        u.userId === user.userId ||
        (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase()) ||
        (u.username && user.username && u.username.toLowerCase() === user.username.toLowerCase())
    );
    if (index >= 0) {
      existing[index] = { ...existing[index], ...user };
    } else {
      existing.unshift(user);
    }
    saveLocalUsersBackup(existing);

    // Sync to server-side cross-device cloud store immediately
    if (typeof window !== "undefined") {
      fetch("/api/cloud-sync/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companiesRegistry: getCompaniesList(),
          usersRegistry: getLocalUsersBackup(),
        }),
      }).catch(() => {});
    }
  } catch (e) {
    console.warn("Local user sync error:", e);
  }

  // Persist to Cloud Firestore if write quota is available
  if (!isFirestoreWriteQuotaExhausted()) {
    try {
      const userRef = doc(db, "users", user.userId);
      await setDoc(
        userRef,
        sanitizeForFirestore({
          ...user,
          updatedAt: new Date().toISOString()
        }),
        { merge: true }
      );
    } catch (cloudErr) {
      checkAndMarkFirestoreQuotaError(cloudErr);
      console.warn("Firestore saveUserProfile error, local copy preserved:", cloudErr);
    }
  }
}

export async function getUserProfile(userId: string): Promise<UserProfileData | null> {
  if (isUserMarkedDeleted({ userId })) return null;
  if (!isFirestoreWriteQuotaExhausted()) {
    try {
      const userRef = doc(db, "users", userId);
      const snapshot = await getDoc(userRef);
      if (snapshot.exists()) {
        const data = snapshot.data() as UserProfileData;
        if (isUserMarkedDeleted(data)) return null;
        return data;
      }
    } catch (err) {
      checkAndMarkFirestoreQuotaError(err);
    }
  }

  // Fallback to local backup
  const localList = getLocalUsersBackup();
  return localList.find((u) => u.userId === userId) || null;
}

// Helper to enrich a UserProfileData with guaranteed username and passwordPlain
function enrichUserProfileCredentials(user: UserProfileData, companies: ReturnType<typeof getCompaniesList>): UserProfileData {
  const matchedCompany = companies.find(
    (c) =>
      (user.companyId && c.id === user.companyId) ||
      (user.username && c.loginUsername && c.loginUsername.toLowerCase() === user.username.toLowerCase()) ||
      (user.email && c.loginEmail && c.loginEmail.toLowerCase() === user.email.toLowerCase()) ||
      (user.companyName && c.companyName && c.companyName.toLowerCase() === user.companyName.toLowerCase())
  );

  const isSysAdmin =
    user.userId === "admin" ||
    user.userId === "main_admin" ||
    user.userId === "usr_admin_001" ||
    user.email?.toLowerCase().includes("admin") ||
    user.email?.toLowerCase() === "ilyasylldrm@gmail.com" ||
    user.email?.toLowerCase() === "ilyasyildirim@outlook.com.tr" ||
    user.role?.toLowerCase().includes("admin") ||
    user.role === "Sistem Yöneticisi";

  const derivedUsername =
    user.username?.trim() ||
    matchedCompany?.loginUsername?.trim() ||
    (user.email ? user.email.split("@")[0].trim().toLowerCase() : "") ||
    (isSysAdmin ? "admin" : "kullanici");

  const derivedPassword =
    user.passwordPlain?.trim() ||
    matchedCompany?.loginPasswordPlain?.trim() ||
    (isSysAdmin ? "Admin2026!" : "Muavin2026!");

  return {
    ...user,
    username: derivedUsername,
    passwordPlain: derivedPassword,
    companyId: user.companyId || matchedCompany?.id,
    companyName: user.companyName || matchedCompany?.companyName || "Muavin Finans & ERP",
  };
}

// Admin Operations: Get all users from Firestore with local backup union and company users
export async function getAllUsersProfiles(): Promise<UserProfileData[]> {
  // 0a. Pull from server-side cross-device cloud store first (instant, quota-free)
  if (typeof window !== "undefined") {
    try {
      const resp = await fetch("/api/cloud-sync/state");
      if (resp.ok) {
        const srv = await resp.json();
        if (Array.isArray(srv?.companiesRegistry) && srv.companiesRegistry.length > 0) {
          saveCompaniesList(srv.companiesRegistry, false);
        }
        if (Array.isArray(srv?.usersRegistry) && srv.usersRegistry.length > 0) {
          saveLocalUsersBackup(srv.usersRegistry, false);
        }
      }
    } catch {
      // ignore offline
    }
  }

  // 0b. Check central_sync_state in Firestore so existing companies & users from central cloud registry are never lost
  if (!isFirestoreWriteQuotaExhausted()) {
    try {
      const syncSnap = await getDoc(doc(db, "system_settings", "central_sync_state"));
      if (syncSnap.exists()) {
        const syncData = syncSnap.data();
        if (Array.isArray(syncData?.companiesRegistry) && syncData.companiesRegistry.length > 0) {
          saveCompaniesList(syncData.companiesRegistry, false);
        }
        if (Array.isArray(syncData?.usersRegistry) && syncData.usersRegistry.length > 0) {
          saveLocalUsersBackup(syncData.usersRegistry, false);
        }
      }
    } catch (err) {
      checkAndMarkFirestoreQuotaError(err);
    }
  }

  const localList = getLocalUsersBackup();
  const companies = getCompaniesList();
  const deletedCompIds = new Set(getDeletedCompanyIds());
  const mergedMap = new Map<string, UserProfileData>();

  // 1. Always seed default system admin (protected, never deleted)
  const defaultAdmin: UserProfileData = {
    userId: "usr_admin_001",
    username: "admin",
    name: "İlyas Yıldırım (Sistem Yöneticisi)",
    email: "ilyasylldrm@gmail.com",
    companyName: "MUAVİN BİLİŞİM TEKN.DAN.A.Ş. (TEST)",
    companyId: "comp_default",
    phone: "+90 (212) 555 0100",
    taxNumber: "6220542314",
    selectedLogoId: 1,
    selectedLogoName: "E-MUAVİN Kurumsal Logo",
    selectedLogoUrl: "/logo.svg",
    role: "Sistem Yöneticisi (Admin)",
    passwordPlain: "Admin2026!",
    createdByAdmin: true,
    createdAt: "2024-01-01T00:00:00.000Z",
  };
  mergedMap.set(defaultAdmin.email.toLowerCase(), defaultAdmin);

  // 2. Include company login accounts from defined companies
  companies.forEach((comp) => {
    if (!isProtectedCompanyId(comp.id) && (deletedCompIds.has(comp.id) || comp.loginUserDeleted)) return;
    if (comp.loginUsername) {
      const cleanUser = comp.loginUsername.trim().toLowerCase();
      const email = (comp.loginEmail || `${cleanUser}@muavin.com`).trim().toLowerCase();
      const compUser: UserProfileData = {
        userId: `usr_${cleanUser}`,
        username: cleanUser,
        name: comp.loginFullName || `${comp.companyName} Yöneticisi`,
        email,
        companyName: comp.companyName,
        companyId: comp.id,
        phone: comp.phone || "+90 (212) 555 0100",
        taxNumber: comp.tenantIdentifierNumber || comp.vkn || comp.tckn || comp.taxNumber || "1234567890",
        selectedLogoId: 1,
        selectedLogoName: "E-MUAVİN Kurumsal Logo",
        selectedLogoUrl: "/logo.svg",
        role: comp.loginRole || "Firma Yöneticisi",
        allowedModules: comp.moduleRestrictionEnabled ? (comp.allowedModules as AppModuleKey[]) : undefined,
        passwordPlain: comp.loginPasswordPlain || "Muavin2026!",
        createdByAdmin: true,
        createdAt: comp.createdAt || new Date().toISOString(),
      };
      if (isProtectedUserIdentifier(compUser) || !isUserMarkedDeleted(compUser)) {
        mergedMap.set(email, compUser);
      }
    }
  });

  // 3. Add local backup users
  localList.forEach((u) => {
    if (!u) return;
    if (!isProtectedUserIdentifier(u)) {
      if (isUserMarkedDeleted(u)) return;
      if (u.companyId && !isProtectedCompanyId(u.companyId) && deletedCompIds.has(u.companyId)) return;
    }
    const key = (u.email || u.userId || "").toLowerCase();
    if (key) {
      mergedMap.set(key, enrichUserProfileCredentials(u, companies));
    }
  });

  // 4. Fetch Firestore users and merge if quota is available (never destructively delete docs during read)
  if (!isFirestoreWriteQuotaExhausted()) {
    try {
      const usersCol = collection(db, "users");
      const snapshot = await getDocs(usersCol);
      snapshot.forEach((docSnap) => {
        const u = docSnap.data() as UserProfileData;
        const docWithId = { ...u, userId: u.userId || docSnap.id };
        if (!isProtectedUserIdentifier(docWithId)) {
          if (
            isUserMarkedDeleted(docWithId) ||
            isUserMarkedDeleted({ userId: docSnap.id }) ||
            (docWithId.companyId && !isProtectedCompanyId(docWithId.companyId) && deletedCompIds.has(docWithId.companyId))
          ) {
            return;
          }
        }
        const key = (docWithId.email || docWithId.userId || "").toLowerCase();
        if (key) {
          const existing = mergedMap.get(key);
          const mergedUser: UserProfileData = {
            ...existing,
            ...docWithId,
            username: docWithId.username || existing?.username,
            passwordPlain: docWithId.passwordPlain || existing?.passwordPlain,
          };
          if (isProtectedUserIdentifier(mergedUser) || !isUserMarkedDeleted(mergedUser)) {
            mergedMap.set(key, enrichUserProfileCredentials(mergedUser, companies));
          }
        }
      });
    } catch (err) {
      checkAndMarkFirestoreQuotaError(err);
    }
  }

  const finalUsers = Array.from(mergedMap.values())
    .filter(
      (u) =>
        isProtectedUserIdentifier(u) ||
        (!isUserMarkedDeleted(u) &&
          !(u.companyId && !isProtectedCompanyId(u.companyId) && deletedCompIds.has(u.companyId)))
    )
    .map((u) => enrichUserProfileCredentials(u, companies));
  saveLocalUsersBackup(finalUsers, false);
  return finalUsers;
}

// Find user profile by email or username across Firestore (direct query and case-insensitive fallback + local backup)
export async function findUserProfileByEmail(identifier: string): Promise<UserProfileData | null> {
  const clean = identifier.trim().toLowerCase();
  if (!clean) return null;
  if (isUserMarkedDeleted({ userId: clean, email: clean, username: clean })) {
    return null;
  }

  // 1. Direct Firestore query by email or username (when quota is available)
  if (!isFirestoreWriteQuotaExhausted()) {
    try {
      const usersCol = collection(db, "users");
      // Check by email first
      const qEmail = query(usersCol, where("email", "==", clean));
      const snapshotEmail = await getDocs(qEmail);
      if (!snapshotEmail.empty) {
        const found = snapshotEmail.docs[0].data() as UserProfileData;
        if (!isUserMarkedDeleted(found)) return found;
      }

      // Check by username
      const qUser = query(usersCol, where("username", "==", clean));
      const snapshotUser = await getDocs(qUser);
      if (!snapshotUser.empty) {
        const found = snapshotUser.docs[0].data() as UserProfileData;
        if (!isUserMarkedDeleted(found)) return found;
      }

      // 2. Case-insensitive Firestore search across all profiles
      const allUsers = await getAllUsersProfiles();
      const match = allUsers.find(
        (u) =>
          !isUserMarkedDeleted(u) &&
          ((u.email && u.email.trim().toLowerCase() === clean) ||
            (u.username && u.username.trim().toLowerCase() === clean))
      );
      if (match) return match;
    } catch (err) {
      checkAndMarkFirestoreQuotaError(err);
    }
  }

  // 3. Fallback to local persistent backup
  const localList = getLocalUsersBackup();
  const localMatch = localList.find(
    (u) =>
      !isUserMarkedDeleted(u) &&
      ((u.email && u.email.trim().toLowerCase() === clean) ||
        (u.username && u.username.trim().toLowerCase() === clean))
  );
  if (localMatch) return localMatch;

  // 4. Fallback to registered companies list with login credentials
  try {
    const companies = getCompaniesList();
    const matchedComp = companies.find(
      (c) =>
        !c.loginUserDeleted &&
        ((c.loginUsername && c.loginUsername.trim().toLowerCase() === clean) ||
          (c.loginEmail && c.loginEmail.trim().toLowerCase() === clean) ||
          (c.email && c.email.trim().toLowerCase() === clean))
    );
    if (matchedComp && matchedComp.loginUsername) {
      const cleanUser = matchedComp.loginUsername.trim().toLowerCase();
      const compProfile: UserProfileData = {
        userId: `usr_${cleanUser}`,
        username: cleanUser,
        name: matchedComp.loginFullName || `${matchedComp.companyName} Yöneticisi`,
        email: matchedComp.loginEmail || `${cleanUser}@muavin.com`,
        companyName: matchedComp.companyName,
        companyId: matchedComp.id,
        phone: matchedComp.phone || "+90 (212) 555 0100",
        taxNumber:
          matchedComp.tenantIdentifierNumber ||
          matchedComp.vkn ||
          matchedComp.tckn ||
          matchedComp.taxNumber ||
          "1234567890",
        selectedLogoId: 1,
        selectedLogoName: "E-MUAVİN Kurumsal Logo",
        selectedLogoUrl: "/logo.svg",
        role: matchedComp.loginRole || "Firma Yöneticisi",
        allowedModules: matchedComp.moduleRestrictionEnabled
          ? (matchedComp.allowedModules as AppModuleKey[])
          : undefined,
        passwordPlain: matchedComp.loginPasswordPlain,
        createdByAdmin: true,
        createdAt: matchedComp.createdAt,
        updatedAt: matchedComp.createdAt,
      };
      if (!isUserMarkedDeleted(compProfile)) {
        return compProfile;
      }
    }
  } catch (compErr) {
    console.warn("Error finding user profile from companies list:", compErr);
  }

  return null;
}

export const findUserProfileByIdentifier = findUserProfileByEmail;

// System Policy Check: Check if user registration or login is authorized
// "admin kullanıcı oluşturmadığı sürece yeni kayıt yapma"
export async function isUserCreatedByAdmin(identifier: string): Promise<{
  isAuthorized: boolean;
  isSysAdmin: boolean;
  existingProfile: UserProfileData | null;
  message?: string;
}> {
  const clean = identifier.trim().toLowerCase();
  if (!clean) {
    return {
      isAuthorized: false,
      isSysAdmin: false,
      existingProfile: null,
      message: "Lütfen geçerli bir kullanıcı adı veya e-posta adresi giriniz.",
    };
  }

  if (isUserMarkedDeleted({ userId: clean, email: clean, username: clean })) {
    return {
      isAuthorized: false,
      isSysAdmin: false,
      existingProfile: null,
      message: `Kayıt/Giriş Engellendi: '${clean}' kullanıcısı yönetici tarafından sistemden kalıcı olarak silinmiştir.`,
    };
  }

  // Check if identifier belongs to root system administrator
  const isSysAdmin =
    clean === "ilyasyildirim@outlook.com.tr" ||
    clean === "ilyasylldrm@gmail.com" ||
    clean === "admin@muavin.com" ||
    clean === "admin" ||
    clean.includes("admin");

  if (isSysAdmin) {
    return {
      isAuthorized: true,
      isSysAdmin: true,
      existingProfile: null,
    };
  }

  // Look up user in Firestore users collection (by email or username)
  const existingProfile = await findUserProfileByEmail(clean);

  if (existingProfile) {
    return {
      isAuthorized: true,
      isSysAdmin: false,
      existingProfile,
    };
  }

  return {
    isAuthorized: false,
    isSysAdmin: false,
    existingProfile: null,
    message: `Kayıt/Giriş Engellendi: '${clean}' kullanıcısı için sistemde oluşturulmuş bir hesap kaydı bulunmamaktadır. Şirket veya Admin tarafından kullanıcı açılmadığı sürece sisteme giriş yapılamaz.`,
  };
}

// Admin Operations: Delete a user profile from Firestore and local backup permanently
export async function deleteUserProfile(
  userId: string,
  extraIdentifiers?: { email?: string; username?: string; companyId?: string }
): Promise<void> {
  await deleteUserProfileAndData(userId, false, extraIdentifiers);
}

// Admin Operations: Delete user profile and optionally their uploaded files permanently
export async function deleteUserProfileAndData(
  userId: string,
  deleteFiles: boolean = false,
  extraIdentifiers?: { email?: string; username?: string; companyId?: string }
): Promise<void> {
  try {
    // 0. Capture user details before removing from local persistent backup, then mark permanently deleted
    const rawBackup = safeGetStorageItem(LOCAL_USERS_BACKUP_KEY);
    const parsedBackup: UserProfileData[] = rawBackup ? JSON.parse(rawBackup) : [];
    const targetInBackup = Array.isArray(parsedBackup)
      ? parsedBackup.find((u) => u && (u.userId === userId || (u as any).id === userId))
      : undefined;

    const targetEmail = (extraIdentifiers?.email || targetInBackup?.email || "").trim().toLowerCase();
    const targetUsername = (extraIdentifiers?.username || targetInBackup?.username || "").trim().toLowerCase();
    const targetCompanyId = extraIdentifiers?.companyId || targetInBackup?.companyId;

    if (
      isProtectedUserIdentifier({
        userId,
        email: targetEmail || undefined,
        username: targetUsername || undefined,
      })
    ) {
      return;
    }

    markUserAsDeleted({
      userId,
      email: targetEmail || undefined,
      username: targetUsername || undefined,
      companyId: targetCompanyId,
    });

    if (Array.isArray(parsedBackup)) {
      const filtered = parsedBackup.filter((u) => {
        if (!u) return false;
        if (isProtectedUserIdentifier(u)) return true;
        if (u.userId === userId || (u as any).id === userId) return false;
        if (targetEmail && u.email?.trim().toLowerCase() === targetEmail) return false;
        if (targetUsername && u.username?.trim().toLowerCase() === targetUsername) return false;
        return !isUserMarkedDeleted(u);
      });
      saveLocalUsersBackup(filtered, true);
    }

    // 1. Delete user doc(s) from 'users' collection in Firestore (by doc id + matching email/username)
    if (!isFirestoreWriteQuotaExhausted()) {
      try {
        const userRef = doc(db, "users", userId);
        await deleteDoc(userRef);
      } catch (err) {
        checkAndMarkFirestoreQuotaError(err);
      }

      try {
        const usersCol = collection(db, "users");
        const allSnap = await getDocs(usersCol);
        const matchingDeletePromises: Promise<void>[] = [];
        allSnap.forEach((docSnap) => {
          const d = docSnap.data() as UserProfileData;
          const dEmail = (d.email || "").trim().toLowerCase();
          const dUser = (d.username || "").trim().toLowerCase();
          if (
            docSnap.id === userId ||
            d.userId === userId ||
            (targetEmail && dEmail === targetEmail) ||
            (targetUsername && dUser === targetUsername)
          ) {
            matchingDeletePromises.push(deleteDoc(docSnap.ref));
          }
        });
        if (matchingDeletePromises.length > 0) {
          await Promise.all(matchingDeletePromises);
        }
      } catch (err) {
        checkAndMarkFirestoreQuotaError(err);
      }

      // 2. Optionally delete associated user files from 'user_files' collection
      if (deleteFiles) {
        try {
          const filesCol = collection(db, "user_files");
          const q = query(filesCol, where("userId", "==", userId));
          const snapshot = await getDocs(q);
          const deletePromises = snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref));
          await Promise.all(deletePromises);
        } catch (fileErr) {
          checkAndMarkFirestoreQuotaError(fileErr);
          console.warn("Could not delete user files from user_files collection:", fileErr);
        }
      }
    }
  } catch (err) {
    console.error("Error deleting user profile and data:", err);
    throw err;
  }
}

const LOCAL_USER_FILES_BACKUP_KEY = "muavin_user_files_backup";

function getLocalUserFilesBackup(): UserFileMetadata[] {
  try {
    const raw = safeGetStorageItem(LOCAL_USER_FILES_BACKUP_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalUserFilesBackup(files: UserFileMetadata[]): void {
  try {
    safeSetStorageItem(LOCAL_USER_FILES_BACKUP_KEY, JSON.stringify(files.slice(0, 200)));
  } catch {
    // ignore storage quota errors
  }
}

// Admin Operations: Get all user files across the database
export async function getAllFilesForAdmin(): Promise<UserFileMetadata[]> {
  const localFiles = getLocalUserFilesBackup();
  if (isFirestoreWriteQuotaExhausted()) {
    return localFiles.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  }
  try {
    const filesCol = collection(db, "user_files");
    const snapshot = await getDocs(filesCol);
    const mergedMap = new Map<string, UserFileMetadata>();
    localFiles.forEach((f) => {
      if (f?.id) mergedMap.set(f.id, f);
    });
    snapshot.forEach((docSnap) => {
      mergedMap.set(docSnap.id, {
        id: docSnap.id,
        ...(docSnap.data() as Omit<UserFileMetadata, "id">),
      });
    });
    const filesList = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    );
    saveLocalUserFilesBackup(filesList);
    return filesList;
  } catch (err) {
    checkAndMarkFirestoreQuotaError(err);
    return localFiles.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  }
}

// 2. Firebase Storage Upload & Delete Operations
export async function uploadFileToStorage(
  userId: string,
  file: File
): Promise<{ fileUrl: string; storagePath: string }> {
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Dosya boyutu çok büyük (Maksimum 8 MB yükleyebilirsiniz).");
  }

  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const storagePath = `user_files/${userId}/${Date.now()}_${sanitizedFileName}`;
  const storageRef = ref(storage, storagePath);

  try {
    await uploadBytes(storageRef, file, {
      contentType: file.type || "application/octet-stream",
      customMetadata: {
        uploadedBy: userId,
        originalName: file.name
      }
    });

    const fileUrl = await getDownloadURL(storageRef);
    return { fileUrl, storagePath };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes("payload") || errorMsg.includes("exceeds") || errorMsg.includes("11534336")) {
      throw new Error("Yükleme sınır uyarısı: Dosya boyutu sunucu yükleme limitini (10 MB) aşıyor.");
    }
    throw err;
  }
}

export async function deleteFileFromStorage(storagePath: string): Promise<void> {
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (err) {
    console.warn("Could not delete file from Firebase Storage:", err);
  }
}

// 3. User File & Metadata Operations (Strictly scoped by userId)
export async function saveUserFile(file: Omit<UserFileMetadata, "id">): Promise<string> {
  if (file.fileData && file.fileData.length > 900000) {
    throw new Error("Veritabanı uyarısı: Dosya boyutu veritabanı doküman limitini (1 MB) aşıyor.");
  }
  const localId = `local_${Date.now()}`;
  const existingLocal = getLocalUserFilesBackup();

  if (isFirestoreWriteQuotaExhausted()) {
    saveLocalUserFilesBackup([{ id: localId, ...file }, ...existingLocal]);
    return localId;
  }
  try {
    const filesCol = collection(db, "user_files");
    const sanitized = sanitizeForFirestore({
      ...file,
      createdAt: serverTimestamp()
    });
    const docRef = await addDoc(filesCol, sanitized);
    saveLocalUserFilesBackup([{ id: docRef.id, ...file }, ...existingLocal]);
    return docRef.id;
  } catch (err) {
    checkAndMarkFirestoreQuotaError(err);
    saveLocalUserFilesBackup([{ id: localId, ...file }, ...existingLocal]);
    return localId;
  }
}

export async function getUserFiles(userId: string): Promise<UserFileMetadata[]> {
  const now = Date.now();
  const localUserFiles = getLocalUserFilesBackup().filter(
    (f) => f && f.userId === userId && (!f.expiresAt || f.expiresAt > now)
  );
  if (isFirestoreWriteQuotaExhausted()) {
    return localUserFiles.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  }
  try {
    const filesCol = collection(db, "user_files");
    const q = query(filesCol, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    
    const mergedMap = new Map<string, UserFileMetadata>();
    localUserFiles.forEach((f) => mergedMap.set(f.id, f));

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() as Omit<UserFileMetadata, "id">;
      // If file has expired, purge it in background
      if (data.expiresAt && data.expiresAt <= now) {
        if (!isFirestoreWriteQuotaExhausted()) {
          deleteUserFile(docSnap.id, data.storagePath).catch(() => {});
        }
        continue;
      }

      mergedMap.set(docSnap.id, {
        id: docSnap.id,
        ...data
      });
    }
    
    const files = Array.from(mergedMap.values());
    // Sort client-side by upload date
    return files.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  } catch (err) {
    checkAndMarkFirestoreQuotaError(err);
    return localUserFiles.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  }
}

export async function deleteUserFile(fileId: string, storagePath?: string): Promise<void> {
  const existingLocal = getLocalUserFilesBackup();
  saveLocalUserFilesBackup(existingLocal.filter((f) => f && f.id !== fileId));

  if (storagePath) {
    await deleteFileFromStorage(storagePath);
  }
  if (isFirestoreWriteQuotaExhausted()) return;
  try {
    const fileRef = doc(db, "user_files", fileId);
    await deleteDoc(fileRef);
  } catch (err) {
    checkAndMarkFirestoreQuotaError(err);
  }
}

// Fallback stubs for legacy token helpers
export const setCachedAccessToken = (_token?: string): void => {};
export const getCachedAccessToken = (): string | null => null;
