import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

export const usingEmulator =
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

// Emulator mode always uses the local demo project, so it never touches real data.
const firebaseConfig = usingEmulator
  ? { apiKey: "demo-api-key", authDomain: "demo-classsync.firebaseapp.com", projectId: "demo-classsync" }
  : {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Connect once per page load (hot reload re-runs this module).
const g = globalThis as unknown as { __classsyncEmulators?: boolean };
if (usingEmulator && typeof window !== "undefined" && !g.__classsyncEmulators) {
  g.__classsyncEmulators = true;
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8085);
}
