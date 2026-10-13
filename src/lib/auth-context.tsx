"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { auth, db } from "./firebase";
import type { UserProfile } from "./types";

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: { email: string; password: string; displayName: string; school: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;
    const unsub = onAuthStateChanged(auth, (u) => {
      unsubProfile?.();
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
        return;
      }
      unsubProfile = onSnapshot(
        doc(db, "users", u.uid),
        (snap) => {
          setProfile(
            snap.exists()
              ? ({ uid: u.uid, ...snap.data() } as UserProfile)
              : { uid: u.uid, displayName: u.displayName || u.email || "Student", email: u.email || "" },
          );
          setLoading(false);
        },
        () => setLoading(false),
      );
    });
    return () => {
      unsub();
      unsubProfile?.();
    };
  }, []);

  const value: AuthState = {
    user,
    profile,
    loading,
    async signIn(email, password) {
      await signInWithEmailAndPassword(auth, email, password);
    },
    async signUp({ email, password, displayName, school }) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
      await setDoc(doc(db, "users", cred.user.uid), {
        displayName,
        email,
        school,
        createdAt: serverTimestamp(),
      });
    },
    async signOut() {
      await fbSignOut(auth);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function displayNameOf(user: User | null, profile: UserProfile | null) {
  return profile?.displayName || user?.displayName || user?.email?.split("@")[0] || "Student";
}

export function friendlyAuthError(err: unknown) {
  const code = (err as { code?: string })?.code || "";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found"))
    return "Email or password is incorrect.";
  if (code.includes("email-already-in-use")) return "An account with this email already exists.";
  if (code.includes("weak-password")) return "Password should be at least 6 characters.";
  if (code.includes("invalid-email")) return "Please enter a valid email address.";
  if (code.includes("network-request-failed"))
    return "Can't reach Firebase. Is the emulator running? (npm run dev starts it)";
  return (err as Error)?.message || "Something went wrong.";
}
