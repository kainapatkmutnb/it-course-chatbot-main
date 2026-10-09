import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, GoogleAuthProvider } from 'firebase/auth';
import { connectDatabaseEmulator, getDatabase } from 'firebase/database';

const useFirebaseEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';
const isTestMode = import.meta.env.MODE === 'test';

if (useFirebaseEmulator && (!isTestMode || !import.meta.env.VITE_FIREBASE_PROJECT_ID?.startsWith('demo-'))) {
  throw new Error('Firebase Emulator mode requires Vite test mode and a demo-* project ID.');
}

if (isTestMode && !useFirebaseEmulator) {
  throw new Error('Vite test mode must use the Firebase Auth and Realtime Database emulators.');
}

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: useFirebaseEmulator
    ? `http://127.0.0.1:9000/?ns=${import.meta.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb`
    : import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://it-chatbot-f663e-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Basic env validation to prevent misconfig causing net::ERR_ABORTED
const requiredEnvKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingKeys = requiredEnvKeys.filter(key => !(import.meta.env as any)[key]);
if (missingKeys.length > 0) {
  // Do not throw to avoid hard crash; log concise warning for dev
  console.warn(
    `Firebase env is incomplete. Missing: ${missingKeys.join(', ')}. This can cause authentication failures (e.g., net::ERR_ABORTED) if Identity Toolkit cannot be reached.`
  );
}

// Initialize Firebase (HMR-safe)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Realtime Database
export const db = getDatabase(app);

if (useFirebaseEmulator) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectDatabaseEmulator(db, '127.0.0.1', 9000);
}

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Configure Google Provider to only allow kmutnb.ac.th and email.kmutnb.ac.th domains
googleProvider.setCustomParameters({
  hd: 'kmutnb.ac.th' // Hosted domain restriction - note: this only works for @kmutnb.ac.th
});

// Additional configuration for broader domain support
googleProvider.addScope('email');
googleProvider.addScope('profile');

export default app;
