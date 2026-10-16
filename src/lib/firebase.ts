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
  getDeletedCompanyIds,
  getDeletedUserKeys,
  isUserMarkedDeleted,
  markUserAsDeleted,
  unmarkUserAsDeleted,
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

// Validate Connection to Firestore (Non-blocking bootstrap validation)
if (typeof window !== "undefined") {
  setTimeout(async () => {
    try {
      await getDocFromServer(doc(db, "test", "connection"));
    } catch (error) {
      if (error instanceof Error && error.message.includes("the client is offline")) {
        console.warn("Firestore: Cihaz/istemci yerel modda çevrimdışı önbellek ile çalışıyor.");
      }
    }
  }, 1000);
}

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
const LOCAL_USERS_BACKUP_KEY = "muavin_admin_created_users_backup";

function getLocalUsersBackup(): UserProfileData[] {
  try {
    const raw = safeGetStorageItem(LOCAL_USERS_BACKUP_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const deletedCompIds = new Set(getDeletedCompanyIds());
    return parsed.filter(
      (u) =>
        u &&
        !isUserMarkedDeleted(u) &&
        !(u.companyId && deletedCompIds.has(u.companyId))
    );
  } catch {
    return [];
  }
}

function saveLocalUsersBackup(usersList: UserProfileData[]): void {
  try {
    const deletedCompIds = new Set(getDeletedCompanyIds());
    const filtered = (Array.isArray(usersList) ? usersList : []).filter(
      (u) =>
        u &&
        !isUserMarkedDeleted(u) &&
        !(u.companyId && deletedCompIds.has(u.companyId))
    );
    safeSetStorageItem(LOCAL_USERS_BACKUP_KEY, JSON.stringify(filtered));
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
  } catch (e) {
    console.warn("Local user sync error:", e);
  }

  // Persist to Cloud Firestore
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
    console.warn("Firestore saveUserProfile error, local copy preserved:", cloudErr);
  }
}

export async function getUserProfile(userId: string): Promise<UserProfileData | null> {
  if (isUserMarkedDeleted({ userId })) return null;
  try {
    const userRef = doc(db, "users", userId);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
      const data = snapshot.data() as UserProfileData;
      if (isUserMarkedDeleted(data)) return null;
      return data;
    }
  } catch (err) {
    console.error("Error fetching user profile from Firestore:", err);
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
  const localList = getLocalUsersBackup();
  const companies = getCompaniesList();
  const deletedCompIds = new Set(getDeletedCompanyIds());
  const mergedMap = new Map<string, UserProfileData>();

  // 1. Seed default system admin if not deleted
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
  if (!isUserMarkedDeleted(defaultAdmin)) {
    mergedMap.set(defaultAdmin.email.toLowerCase(), defaultAdmin);
  }

  // 2. Include company login accounts from defined companies (skip if company or its login user was deleted)
  companies.forEach((comp) => {
    if (deletedCompIds.has(comp.id) || comp.loginUserDeleted) return;
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
      if (!isUserMarkedDeleted(compUser)) {
        mergedMap.set(email, compUser);
      }
    }
  });

  // 3. Add local backup users (excluding deleted users & deleted companies)
  localList.forEach((u) => {
    if (!u || isUserMarkedDeleted(u)) return;
    if (u.companyId && deletedCompIds.has(u.companyId)) return;
    const key = (u.email || u.userId || "").toLowerCase();
    if (key) {
      mergedMap.set(key, enrichUserProfileCredentials(u, companies));
    }
  });

  // 4. Fetch Firestore users and merge (skipping and cleaning up any deleted users)
  try {
    const usersCol = collection(db, "users");
    const snapshot = await getDocs(usersCol);
    snapshot.forEach((docSnap) => {
      const u = docSnap.data() as UserProfileData;
      const docWithId = { ...u, userId: u.userId || docSnap.id };
      if (
        isUserMarkedDeleted(docWithId) ||
        isUserMarkedDeleted({ userId: docSnap.id }) ||
        (docWithId.companyId && deletedCompIds.has(docWithId.companyId))
      ) {
        // Purge stale deleted document from Firestore silently
        deleteDoc(docSnap.ref).catch(() => {});
        return;
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
        if (!isUserMarkedDeleted(mergedUser)) {
          mergedMap.set(key, enrichUserProfileCredentials(mergedUser, companies));
        }
      }
    });
  } catch (err) {
    console.error("Error fetching all users for admin from Firestore, using local backup:", err);
  }

  const finalUsers = Array.from(mergedMap.values())
    .filter((u) => !isUserMarkedDeleted(u) && !(u.companyId && deletedCompIds.has(u.companyId)))
    .map((u) => enrichUserProfileCredentials(u, companies));
  saveLocalUsersBackup(finalUsers);
  return finalUsers;
}

// Find user profile by email or username across Firestore (direct query and case-insensitive fallback + local backup)
export async function findUserProfileByEmail(identifier: string): Promise<UserProfileData | null> {
  const clean = identifier.trim().toLowerCase();
  if (!clean) return null;
  if (isUserMarkedDeleted({ userId: clean, email: clean, username: clean })) {
    return null;
  }

  // 1. Direct Firestore query by email or username
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
    console.error("Error looking up user profile by email/username in Firestore:", err);
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

    markUserAsDeleted({
      userId,
      email: targetEmail || undefined,
      username: targetUsername || undefined,
      companyId: targetCompanyId,
    });

    if (Array.isArray(parsedBackup)) {
      const filtered = parsedBackup.filter((u) => {
        if (!u) return false;
        if (u.userId === userId || (u as any).id === userId) return false;
        if (targetEmail && u.email?.trim().toLowerCase() === targetEmail) return false;
        if (targetUsername && u.username?.trim().toLowerCase() === targetUsername) return false;
        return !isUserMarkedDeleted(u);
      });
      saveLocalUsersBackup(filtered);
    }

    // 1. Delete user doc(s) from 'users' collection in Firestore (by doc id + matching email/username)
    try {
      const userRef = doc(db, "users", userId);
      await deleteDoc(userRef);
    } catch {
      // ignore if doc id doesn't exist
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
    } catch {
      // ignore offline Firestore query error
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
        console.warn("Could not delete user files from user_files collection:", fileErr);
      }
    }
  } catch (err) {
    console.error("Error deleting user profile and data:", err);
    throw err;
  }
}

// Admin Operations: Get all user files across the database
export async function getAllFilesForAdmin(): Promise<UserFileMetadata[]> {
  try {
    const filesCol = collection(db, "user_files");
    const snapshot = await getDocs(filesCol);
    const filesList: UserFileMetadata[] = [];
    snapshot.forEach((docSnap) => {
      filesList.push({
        id: docSnap.id,
        ...(docSnap.data() as Omit<UserFileMetadata, "id">)
      });
    });
    return filesList.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  } catch (err) {
    console.error("Error fetching all files for admin:", err);
    return [];
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
  const filesCol = collection(db, "user_files");
  const sanitized = sanitizeForFirestore({
    ...file,
    createdAt: serverTimestamp()
  });
  const docRef = await addDoc(filesCol, sanitized);
  return docRef.id;
}

export async function getUserFiles(userId: string): Promise<UserFileMetadata[]> {
  try {
    const filesCol = collection(db, "user_files");
    const q = query(filesCol, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    
    const files: UserFileMetadata[] = [];
    const now = Date.now();

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() as Omit<UserFileMetadata, "id">;
      // If file has expired, purge it in background
      if (data.expiresAt && data.expiresAt <= now) {
        deleteUserFile(docSnap.id, data.storagePath).catch((err) =>
          console.warn("Expired file cleanup error:", err)
        );
        continue;
      }

      files.push({
        id: docSnap.id,
        ...data
      });
    }
    
    // Sort client-side by upload date
    return files.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  } catch (err) {
    console.error("Error fetching user files:", err);
    return [];
  }
}

export async function deleteUserFile(fileId: string, storagePath?: string): Promise<void> {
  if (storagePath) {
    await deleteFileFromStorage(storagePath);
  }
  const fileRef = doc(db, "user_files", fileId);
  await deleteDoc(fileRef);
}

// Fallback stubs for legacy token helpers
export const setCachedAccessToken = (_token?: string): void => {};
export const getCachedAccessToken = (): string | null => null;
