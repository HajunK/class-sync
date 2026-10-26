"use client";

import clsx from "clsx";
import { Calculator, CalendarDays, ClipboardList, FileText, LogOut, Megaphone } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AddClassForm } from "@/components/AddClassModal";
import { AnnouncementDock } from "@/components/AnnouncementDock";
import { DataProvider } from "@/components/data";
import { NavTabs } from "@/components/NavTabs";
import { ThemeSwitcher, useAccountTheme } from "@/components/ThemeSwitcher";
import { ClassFilterBar } from "@/components/ClassFilterBar";
import { ClassTimerPill } from "@/components/ClassTimerPill";
import { Logo } from "@/components/Logo";
import { Avatar, PageLoader } from "@/components/ui";
import { useWorkspace, WorkspaceProvider } from "@/components/workspace";
import { isAdminEmail } from "@/lib/admin";
import { useAuth } from "@/lib/auth-context";

const NAV = [
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/calculator", label: "Calculator", icon: Calculator },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
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
      <DataProvider>
        <Shell signingOutRef={signingOutRef}>{children}</Shell>
      </DataProvider>
    </WorkspaceProvider>
  );
}

function Shell({ children, signingOutRef }: { children: React.ReactNode; signingOutRef: React.RefObject<boolean> }) {
  const { actor, classes, classesLoading } = useWorkspace();
  const { user, signOut } = useAuth();
  useAccountTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isEditor = pathname.split("/").length > 3; // /notes/[classId]/[sessionId]
  // The calculator is personal: no class filter, and it works before joining any class.
  const isCalculator = pathname.startsWith("/calculator");
  // Announcements are shared by everyone, so they also work before joining a class.
  const isAnnouncements = pathname.startsWith("/announcements");
  // The admin's Assessment tab covers every class, so it has no class filter either.
  const isAssessment = pathname.startsWith("/assessment");
  // The calendar is full width: Upcoming flush left under the navigation, the calendar (with its class filter) filling the rest.
  const isCalendar = pathname.startsWith("/calendar");
  const nav = isAdminEmail(user?.email) ? [...NAV, { href: "/assessment", label: "Assessment", icon: ClipboardList }] : NAV;

  // Opening a tab slides its content in from the side that tab is on (left or right of the one you left).
  const tabIndex = nav.findIndex((n) => pathname.startsWith(n.href));
  const [swipe, setSwipe] = useState({ tab: tabIndex, dir: 0, n: 0 });
  if (tabIndex !== -1 && tabIndex !== swipe.tab) setSwipe({ tab: tabIndex, dir: tabIndex > swipe.tab ? 1 : -1, n: swipe.n + 1 });

  // Load every tab ahead of time so switching doesn't wait on the network.
  const tabsKey = nav.map((n) => n.href).join(",");
  useEffect(() => {
    tabsKey.split(",").forEach((href) => {
      router.prefetch(href);
      // `next dev` compiles a page the first time it's opened, which feels like lag on the first switch. Visit each once now.
      if (process.env.NODE_ENV === "development") fetch(href).catch(() => {});
    });
  }, [tabsKey, router]);

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
          <NavTabs items={nav} pathname={pathname} />

          <div className="relative ml-auto flex items-center gap-2" ref={menuRef}>
            <ClassTimerPill classes={classes} />
            <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2.5 rounded-full py-1 pr-3 pl-1 hover:bg-white/10">
              <Avatar name={actor.name} size={32} className="!ring-gold-500" />
              <span className="hidden text-sm font-medium md:inline">{actor.name}</span>
            </button>
            {menuOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-white text-ink shadow-[var(--shadow-lift)]">
                <div className="border-b border-line px-4 py-3">
                  <p className="font-semibold text-navy-900">{actor.name}</p>
                  <p className="truncate text-xs text-muted">{user?.email}</p>
                </div>
                <div className="border-b border-line">
                  <ThemeSwitcher />
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

      {/* On the calendar tab the filter sits above the calendar instead, so the sidebar can reach the navigation. */}
      {!isEditor && !isCalculator && !isAnnouncements && !isAssessment && !isCalendar && classes.length > 0 && <ClassFilterBar />}

      <main className={clsx("mx-auto w-full flex-1 overflow-x-clip", isCalendar && "flex flex-col", !isEditor && !isCalendar && "max-w-6xl px-5 py-8")}>
        {classesLoading ? (
          <PageLoader />
        ) : classes.length === 0 && !isCalculator && !isAnnouncements && !isAssessment ? (
          <div className="mx-auto max-w-md py-16">
            <h1 className="font-heading text-3xl font-extrabold text-navy-900">Welcome to ClassSync</h1>
            <p className="mt-2 mb-6 text-muted">Join your class with the code a classmate shared, or create a new class.</p>
            <div className="card p-6">
              <AddClassForm />
            </div>
          </div>
        ) : (
          // A new key per tab replays the slide-in; the page itself is unchanged.
          <div key={swipe.n} className={clsx(isCalendar && "flex flex-1 flex-col", swipe.dir > 0 && "animate-tab-next", swipe.dir < 0 && "animate-tab-prev")}>
            {children}
          </div>
        )}
      </main>
      <AnnouncementDock />
    </div>
  );
}
