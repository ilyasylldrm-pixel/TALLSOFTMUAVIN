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
  doc,
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

// Initialize Firebase App lazily/safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export const db =
  firebaseConfig.firestoreDatabaseId &&
  firebaseConfig.firestoreDatabaseId !== "(default)"
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

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
  name: string;
  companyName: string;
  phone: string;
  taxNumber: string;
  selectedLogoId: number;
  selectedLogoName: string;
  selectedLogoUrl: string;
  role: string;
  allowedModules?: AppModuleKey[]; // İzin verilen modüller (Boş/undefined ise tüm modüller serbesttir)
  passwordPlain?: string; // Admin tarafından oluşturulduğunda kullanıcıya iletilen şifre
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
export async function saveUserProfile(user: UserProfileData): Promise<void> {
  const userRef = doc(db, "users", user.userId);
  await setDoc(
    userRef,
    sanitizeForFirestore({
      ...user,
      updatedAt: new Date().toISOString()
    }),
    { merge: true }
  );
}

export async function getUserProfile(userId: string): Promise<UserProfileData | null> {
  try {
    const userRef = doc(db, "users", userId);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
      return snapshot.data() as UserProfileData;
    }
  } catch (err) {
    console.error("Error fetching user profile:", err);
  }
  return null;
}

// Admin Operations: Get all users from Firestore
export async function getAllUsersProfiles(): Promise<UserProfileData[]> {
  try {
    const usersCol = collection(db, "users");
    const snapshot = await getDocs(usersCol);
    const usersList: UserProfileData[] = [];
    snapshot.forEach((docSnap) => {
      usersList.push(docSnap.data() as UserProfileData);
    });
    return usersList;
  } catch (err) {
    console.error("Error fetching all users for admin:", err);
    return [];
  }
}

// Admin Operations: Delete a user profile from Firestore
export async function deleteUserProfile(userId: string): Promise<void> {
  try {
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
  } catch (err) {
    console.error("Error deleting user profile:", err);
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
