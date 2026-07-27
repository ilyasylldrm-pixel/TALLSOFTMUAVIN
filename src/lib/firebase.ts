import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
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

// Initialize Firebase App lazily/safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

export const db =
  firebaseConfig.firestoreDatabaseId &&
  firebaseConfig.firestoreDatabaseId !== "(default)"
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

export const storage = getStorage(app);

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  onAuthStateChanged
};

export interface UserFileMetadata {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadDate: string;
  category: string;
  description: string;
  fileUrl?: string; // Firebase Storage Download URL
  storagePath?: string; // Firebase Storage path
  fileData?: string; // Fallback Base64 data for previewing/downloading
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
  createdAt?: string;
}

// 1. User Profile Operations
export async function saveUserProfile(user: UserProfileData): Promise<void> {
  const userRef = doc(db, "users", user.userId);
  await setDoc(
    userRef,
    {
      ...user,
      updatedAt: new Date().toISOString()
    },
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
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const storagePath = `user_files/${userId}/${Date.now()}_${sanitizedFileName}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, file, {
    contentType: file.type || "application/octet-stream",
    customMetadata: {
      uploadedBy: userId,
      originalName: file.name
    }
  });

  const fileUrl = await getDownloadURL(storageRef);
  return { fileUrl, storagePath };
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
  const filesCol = collection(db, "user_files");
  const docRef = await addDoc(filesCol, {
    ...file,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

export async function getUserFiles(userId: string): Promise<UserFileMetadata[]> {
  try {
    const filesCol = collection(db, "user_files");
    const q = query(filesCol, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    
    const files: UserFileMetadata[] = [];
    snapshot.forEach((docSnap) => {
      files.push({
        id: docSnap.id,
        ...(docSnap.data() as Omit<UserFileMetadata, "id">)
      });
    });
    
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
