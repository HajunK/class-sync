"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { Field, Spinner } from "@/components/ui";
import { friendlyAuthError, useAuth } from "@/lib/auth-context";

export default function SignupPage() {
  const { signUp, user, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ displayName: "", school: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user && !busy) router.replace("/calendar");
  }, [loading, user, busy, router]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signUp(form);
      router.replace("/calendar");
    } catch (err) {
      setError(friendlyAuthError(err));
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Join ClassSync"
      subtitle={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-navy-900 underline decoration-gold-500 decoration-2 underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name">
            <input className="input" required value={form.displayName} onChange={set("displayName")} placeholder="Minji Park" />
          </Field>
          <Field label="School">
            <input className="input" required value={form.school} onChange={set("school")} placeholder="KIS Jeju" />
          </Field>
        </div>
        <Field label="Email">
          <input className="input" type="email" required autoComplete="email" value={form.email} onChange={set("email")} />
        </Field>
        <Field label="Password" hint="At least 6 characters.">
          <input
            className="input"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={form.password}
            onChange={set("password")}
          />
        </Field>
        {error && <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>}
        <button className="btn btn-primary w-full py-3" disabled={busy}>
          {busy ? <Spinner className="h-4 w-4" /> : "Create account"}
        </button>
        <p className="text-center text-xs text-muted">Next, you&apos;ll create a class or join one with a class code.</p>
      </form>
    </AuthShell>
  );
}
