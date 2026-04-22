import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email || undefined,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId || undefined,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Auth functions
export const loginWithGoogle = async () => {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    // Only log if it's not a user-cancelled action to reduce noise
    if (error?.code !== 'auth/popup-closed-by-user') {
      console.error("Firebase Login Error:", error);
    }
    // Re-throw so the UI can catch it, but now it's a controlled throw
    throw error;
  }
};

export const logout = async () => {
  try {
    return await signOut(auth);
  } catch (error) {
    console.error("Firebase Logout Error:", error);
    throw error;
  }
};

// Types
export interface UserSession {
  uid: string;
  history: number[];
  customRules?: any[];
  updatedAt: Timestamp;
}

// Firestore operations
export const saveUserSession = async (uid: string, history: number[], customRules?: any[]) => {
  const path = `user_sessions/${uid}`;
  const sessionRef = doc(db, 'user_sessions', uid);
  try {
    await setDoc(sessionRef, {
      uid,
      history,
      customRules: customRules || [],
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getUserSession = async (uid: string) => {
  const path = `user_sessions/${uid}`;
  const sessionRef = doc(db, 'user_sessions', uid);
  try {
    const docSnap = await getDoc(sessionRef);
    return docSnap.exists() ? (docSnap.data() as UserSession) : null;
  } catch (error) {
    // Log but don't re-throw here to prevent unhandled rejections in the auth listener
    console.error('Firestore GET Error: ', error);
    return null;
  }
};
