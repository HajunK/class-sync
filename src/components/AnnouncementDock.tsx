"use client";

import { Megaphone } from "lucide-react";
import Link from "next/link";
import { timeAgo, tsToDate } from "@/lib/dates";
import { useAnnouncements } from "@/lib/db";

const SHOWN = 3;

/**
 * Announcements pinned to the bottom of every tab. They have no close button and
 * don't time out; an announcement goes away only when its author deletes it.
 */
export function AnnouncementDock() {
  const { data: announcements } = useAnnouncements();
  if (announcements.length === 0) return null;
  const shown = announcements.slice(0, SHOWN);
  const more = announcements.length - shown.length;

  return (
    <section
      aria-label="Announcements"
      aria-live="polite"
      className="pointer-events-none fixed right-0 bottom-0 z-30 flex w-full flex-col-reverse gap-2 p-3 sm:right-4 sm:bottom-4 sm:w-96 sm:p-0"
    >
      {shown.map((a, i) => (
        <article key={a.id} className="animate-fade-up pointer-events-auto rounded-2xl border border-gold-500/60 bg-white p-4 shadow-[var(--shadow-lift)]">
          <div className="flex items-start gap-3">
            <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" aria-hidden />
            <div className="min-w-0 flex-1">
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
