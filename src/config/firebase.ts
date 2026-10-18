import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyD1cP9Bo0uXKOALyvlEHK0j0CP1izZmrrI',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'synchro9-portal-bayu.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'synchro9-portal-bayu',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'synchro9-portal-bayu.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '296804865397',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:296804865397:web:bc0b3ec64059987a0b2f3c'
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Connect to emulators if enabled in environment
if (import.meta.env.VITE_USE_EMULATORS === 'true') {
  try {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    console.log('[Firebase] Connected to local Auth and Firestore emulators');
  } catch (err) {
    console.warn('[Firebase] Emulator connection skipped or already initialized:', err);
  }
}

export default app;
