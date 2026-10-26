"use client";

import { Megaphone, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { timeAgo, tsToDate } from "@/lib/dates";
import { useData } from "./data";
import { dismissAnnouncement } from "@/lib/db";

const SHOWN = 3;

/**
 * Announcements pinned to the bottom of every tab. They don't time out; the X clears one
 * from your screen (saved to your account), and its author can delete it for everyone.
 */
export function AnnouncementDock() {
  const { user, profile } = useAuth();
  const { data } = useData().announcements;
  const cleared = new Set(profile?.dismissedAnnouncementIds);
  const announcements = data.filter((a) => !cleared.has(a.id));
  if (!user || announcements.length === 0) return null;
  const shown = announcements.slice(0, SHOWN);
  const more = announcements.length - shown.length;

  return (
    <section
      aria-label="Announcements"
      aria-live="polite"
      className="pointer-events-none fixed right-0 bottom-0 z-30 flex max-h-screen w-full flex-col-reverse gap-2 overflow-y-auto overscroll-contain p-3 sm:right-4 sm:bottom-4 sm:max-h-[calc(100vh-2rem)] sm:w-96 sm:p-0"
    >
      {shown.map((a, i) => (
        <article key={a.id} className="animate-fade-up pointer-events-auto relative rounded-2xl border border-navy-600/50 bg-white p-4 shadow-[var(--shadow-lift)]">
          <button
            onClick={() => dismissAnnouncement(user.uid, a.id).catch((err) => toast.error((err as Error).message))}
            className="absolute top-2 right-2 rounded-full p-1 text-muted transition hover:bg-navy-50 hover:text-navy-900"
            aria-label={`Clear announcement: ${a.title}`}
            title="Clear"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <div className="flex items-start gap-3">
            <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" aria-hidden />
            <div className="min-w-0 flex-1 pr-5">
              <h2 className="text-sm font-semibold break-words text-navy-900">{a.title}</h2>
              <p className="text-[11px] text-muted">
                {a.authorName} · {timeAgo(tsToDate(a.createdAt))}
              </p>
              <p className="mt-1.5 max-h-32 overflow-y-auto text-sm whitespace-pre-wrap break-words text-ink">{a.description}</p>
              {i === shown.length - 1 && more > 0 && (
                <Link href="/announcements" className="mt-2 inline-block text-xs font-semibold text-navy-900 underline-offset-2 hover:underline">
                  {more} more {more === 1 ? "announcement" : "announcements"}
                </Link>
              )}
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
