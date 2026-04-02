import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

// Auth functions
export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

// Types
export interface UserSession {
  uid: string;
  history: number[];
  updatedAt: Timestamp;
}

// Firestore operations
export const saveUserSession = async (uid: string, history: number[]) => {
  const sessionRef = doc(db, 'user_sessions', uid);
  await setDoc(sessionRef, {
    uid,
    history,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

export const getUserSession = async (uid: string) => {
  const sessionRef = doc(db, 'user_sessions', uid);
  const docSnap = await getDoc(sessionRef);
  return docSnap.exists() ? (docSnap.data() as UserSession) : null;
};
