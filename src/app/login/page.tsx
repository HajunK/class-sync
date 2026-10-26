"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { Field, Spinner } from "@/components/ui";
import { friendlyAuthError, useAuth } from "@/lib/auth-context";
import { usingEmulator } from "@/lib/firebase";

const DEMO_ACCOUNTS = [
  { name: "Minji Park", email: "minji@classsync.test" },
  { name: "Daniel Lee", email: "daniel@classsync.test" },
  { name: "Sora Kim", email: "sora@classsync.test" },
];
const DEMO_PASSWORD = "classsync123";

export default function LoginPage() {
  const { signIn, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/calendar");
  }, [loading, user, router]);

  async function submit(e: React.FormEvent, creds?: { email: string; password: string }) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signIn(creds?.email ?? email, creds?.password ?? password);
      router.replace("/calendar");
    } catch (err) {
      setError(friendlyAuthError(err));
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle={
        <>
          New here?{" "}
          <Link href="/signup" className="font-semibold text-navy-900 underline decoration-navy-600 decoration-2 underline-offset-4">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <input className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <input
            className="input"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error && <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>}
        <button className="btn btn-primary w-full py-3" disabled={busy}>
          {busy ? <Spinner className="h-4 w-4" /> : "Sign in"}
        </button>
      </form>

      {usingEmulator && (
        <div className="mt-8 rounded-2xl border border-navy-600/40 bg-gold-50 p-4">
          <p className="text-xs font-semibold tracking-wide text-navy-900 uppercase">Local demo accounts</p>
          <p className="mt-1 text-xs text-muted">Seeded into the Firebase emulator. One click to sign in as a classmate.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                type="button"
                disabled={busy}
                onClick={(e) => submit(e, { email: a.email, password: DEMO_PASSWORD })}
                className="rounded-xl border border-line bg-white px-3 py-2 text-left text-xs transition hover:border-navy-900/30"
              >
                <span className="block font-semibold text-navy-900">{a.name}</span>
                <span className="block truncate text-muted">{a.email}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </AuthShell>
  );
}
