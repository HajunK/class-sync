import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "./Logo";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: ReactNode; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-navy-900 p-12 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-gold-500/20 blur-3xl" />
        <Link href="/" className="relative">
          <Logo light />
        </Link>
        <div className="relative mt-auto max-w-md">
          <p className="font-heading text-4xl leading-tight font-extrabold">
            &ldquo;I was out sick on Tuesday — and still knew about Friday&apos;s quiz <em className="text-gold-500">before</em> I got
            back.&rdquo;
          </p>
          <p className="mt-6 text-sm text-white/60">What ClassSync is built for.</p>
          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-8 text-sm">
            <div>
              <p className="font-heading text-3xl font-extrabold text-gold-500">1</p>
              <p className="text-white/60">shared calendar</p>
            </div>
            <div>
              <p className="font-heading text-3xl font-extrabold text-gold-500">∞</p>
              <p className="text-white/60">classmates confirming</p>
            </div>
            <div>
              <p className="font-heading text-3xl font-extrabold text-gold-500">0</p>
              <p className="text-white/60">missed announcements</p>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-10 inline-block lg:hidden">
            <Logo />
          </Link>
          <h1 className="font-heading text-4xl font-extrabold text-navy-900">{title}</h1>
          <p className="mt-2 text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
