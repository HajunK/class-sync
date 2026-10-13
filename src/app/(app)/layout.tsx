"use client";

import clsx from "clsx";
import { Calculator, CalendarDays, FileText, LogOut, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AddClassForm, AddClassModal } from "@/components/AddClassModal";
import { CopyCode } from "@/components/CopyCode";
import { Logo } from "@/components/Logo";
import { Avatar, ClassDot, PageLoader } from "@/components/ui";
import { useWorkspace, WorkspaceProvider } from "@/components/workspace";
import { useAuth } from "@/lib/auth-context";

const NAV = [
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/calculator", label: "Calculator", icon: Calculator },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const signingOutRef = useRef(false);

  useEffect(() => {
    if (!loading && !user && !signingOutRef.current) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) return <PageLoader label="Checking your account…" />;
  return (
    <WorkspaceProvider>
      <Shell signingOutRef={signingOutRef}>{children}</Shell>
    </WorkspaceProvider>
  );
}

function Shell({ children, signingOutRef }: { children: React.ReactNode; signingOutRef: React.RefObject<boolean> }) {
  const { actor, classes, classesLoading, classById, selectedId, select } = useWorkspace();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [adding, setAdding] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isEditor = pathname.split("/").length > 3; // /notes/[classId]/[sessionId]
  // The calculator is personal: no class filter, and it works before joining any class.
  const isCalculator = pathname.startsWith("/calculator");

  useEffect(() => {
    const close = (e: MouseEvent) => menuRef.current && !menuRef.current.contains(e.target as Node) && setMenuOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 bg-navy-900 text-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-5 sm:gap-6">
          <Link href="/calendar" aria-label="ClassSync home">
            <Logo light />
          </Link>
          <nav className="ml-2 flex items-center gap-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    "flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition sm:px-4",
                    active ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Icon className={clsx("h-4 w-4", active && "text-gold-500")} />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="relative ml-auto" ref={menuRef}>
            <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2.5 rounded-full py-1 pr-3 pl-1 hover:bg-white/10">
              <Avatar name={actor.name} size={32} className="!ring-gold-500" />
              <span className="hidden text-sm font-medium md:inline">{actor.name}</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-white text-ink shadow-[var(--shadow-lift)]">
                <div className="border-b border-line px-4 py-3">
                  <p className="font-semibold text-navy-900">{actor.name}</p>
                  <p className="truncate text-xs text-muted">{user?.email}</p>
                </div>
                <button
                  onClick={async () => {
                    signingOutRef.current = true;
                    router.replace("/");
                    await signOut();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-700 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Class filter: pick one class, or see all of them together */}
      {!isEditor && !isCalculator && classes.length > 0 && (
        <div className="border-b border-line bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-5 py-3">
            <ClassChip active={!selectedId} onClick={() => select(null)} label="All classes" color="#fcc438" />
            {classes.map((c) => (
              <ClassChip key={c.id} active={selectedId === c.id} onClick={() => select(c.id)} label={c.course} color={c.color} />
            ))}
            <button onClick={() => setAdding(true)} className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-muted hover:text-navy-900">
              <Plus className="h-3.5 w-3.5" /> Add class
            </button>
            {selectedId && classById[selectedId] && (
              <span className="ml-auto flex items-center gap-2 text-xs text-muted">
                Class code <CopyCode code={classById[selectedId].code} />
              </span>
            )}
          </div>
        </div>
      )}

      <main className={clsx("mx-auto w-full flex-1", !isEditor && "max-w-6xl px-5 py-8")}>
        {classesLoading ? (
          <PageLoader />
        ) : classes.length === 0 && !isCalculator ? (
          <div className="mx-auto max-w-md py-16">
            <h1 className="font-serif text-3xl font-semibold text-navy-900">Welcome to ClassSync</h1>
            <p className="mt-2 mb-6 text-muted">Join your class with the code a classmate shared, or create a new class.</p>
            <div className="card p-6">
              <AddClassForm />
            </div>
          </div>
        ) : (
          children
        )}
      </main>
      <AddClassModal open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}

function ClassChip({ active, onClick, label, color }: { active: boolean; onClick: () => void; label: string; color: string }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
        active ? "border-navy-900 bg-navy-900 text-white" : "border-line bg-white text-navy-900 hover:border-navy-900/30",
      )}
    >
      <ClassDot color={color} />
      {label}
    </button>
  );
}
