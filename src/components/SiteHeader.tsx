"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "./Logo";

export function SiteHeader() {
  const { user, loading } = useAuth();
  return (
    <header className="sticky top-0 z-40">
      <div className="bg-navy-950 text-[11px] text-white/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-1.5">
          <span className="tracking-wide">Shared class calendar · AI note merging</span>
          <span className="hidden tracking-wide sm:inline">
            For students, by students — <span className="text-gold-500">no class left behind</span>
          </span>
        </div>
      </div>
      <div className="border-b border-line/70 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" aria-label="ClassSync home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-navy-900/80 md:flex">
            <a href="#features" className="hover:text-navy-900">Features</a>
            <a href="#how" className="hover:text-navy-900">How it works</a>
            <a href="#notes" className="hover:text-navy-900">AI notes</a>
            <a href="#goals" className="hover:text-navy-900">Our goals</a>
          </nav>
          <div className="flex items-center gap-2">
            {loading ? null : user ? (
              <Link href="/calendar" className="btn btn-primary">
                Open ClassSync
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn btn-ghost hidden sm:inline-flex">
                  Sign in
                </Link>
                <Link href="/signup" className="btn btn-primary">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
