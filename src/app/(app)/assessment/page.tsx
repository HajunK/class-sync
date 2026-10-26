"use client";

import clsx from "clsx";
import { addDays, addMonths, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { useMemo, useState } from "react";
import { useData } from "@/components/data";
import { EmptyState, PageLoader, TypeBadge } from "@/components/ui";
import { isAdminEmail } from "@/lib/admin";
import { useAuth } from "@/lib/auth-context";
import { toKey, todayKey } from "@/lib/dates";
import type { ClassEvent } from "@/lib/types";

const MAX_DOTS = 4;

/** Admin only: every calendar entry from every class, by day. */
export default function AssessmentPage() {
  const { user } = useAuth();
  const admin = isAdminEmail(user?.email);
  const { adminEvents: events, adminClasses: classes } = useData();
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(todayKey);

  const byDay = useMemo(() => {
    const map: Record<string, ClassEvent[]> = {};
    for (const e of events.data) (map[e.date] ||= []).push(e);
    return map;
  }, [events.data]);
  const classById = useMemo(() => Object.fromEntries(classes.data.map((c) => [c.id, c])), [classes.data]);

  const days = useMemo(() => {
    const out: Date[] = [];
    for (let d = startOfWeek(startOfMonth(cursor)); d <= endOfWeek(endOfMonth(cursor)); d = addDays(d, 1)) out.push(d);
    return out;
  }, [cursor]);

  if (!admin) return <p className="py-16 text-center text-sm text-muted">This page isn&apos;t available for your account.</p>;
  if (events.loading || classes.loading) return <PageLoader />;
  if (events.denied || classes.denied) {
    return (
      <EmptyState
        icon={<ClipboardList className="h-6 w-6" />}
        title="Couldn't load every class"
        body="Firestore refused the read. Publish the latest firestore.rules to this project, then reload."
      />
    );
  }

  const today = todayKey();
  const list = (byDay[selected] || []).slice().sort((a, b) => (classById[a.classId]?.course ?? "").localeCompare(classById[b.classId]?.course ?? "") || a.title.localeCompare(b.title));
  const selectedDate = new Date(`${selected}T00:00:00`);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-3xl font-extrabold text-navy-900">Assessment</h1>
        <p className="text-sm text-muted">
          Every entry students added, across {classes.data.length} {classes.data.length === 1 ? "class" : "classes"}. Pick a day to see them all.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <section className="card p-5" aria-label="Assessment calendar">
          <div className="mb-3 flex items-center justify-between">
            <button className="btn btn-outline btn-sm !px-2" onClick={() => setCursor((c) => addMonths(c, -1))} aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="font-heading text-lg font-bold text-navy-900">{format(cursor, "MMMM yyyy")}</h2>
            <button className="btn btn-outline btn-sm !px-2" onClick={() => setCursor((c) => addMonths(c, 1))} aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-muted uppercase">
            {days.slice(0, 7).map((d) => (
              <div key={d.toISOString()} className="py-1.5">
                {format(d, "EEE")}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d) => {
              const key = toKey(d);
              const count = byDay[key]?.length ?? 0;
              const isSelected = key === selected;
              return (
                <button
                  key={key}
                  onClick={() => setSelected(key)}
                  aria-pressed={isSelected}
                  aria-label={`${format(d, "MMMM d, yyyy")}, ${count} ${count === 1 ? "entry" : "entries"}`}
                  className={clsx(
                    "flex h-14 flex-col items-center justify-center gap-1 rounded-xl text-sm font-semibold transition",
                    isSelected ? "bg-navy-900 text-white" : "hover:bg-navy-50",
                    !isSelected && !isSameMonth(d, cursor) && "text-muted/50",
                    !isSelected && key === today && "ring-2 ring-navy-900/40 ring-inset",
                  )}
                >
                  {format(d, "d")}
                  <span className="flex h-1.5 items-center gap-0.5" aria-hidden>
                    {(byDay[key] || []).slice(0, MAX_DOTS).map((e) => (
                      <span key={e.id} className={clsx(`type-${e.type}`, "h-1.5 w-1.5 rounded-full")} style={{ background: isSelected ? "#fff" : "var(--type)" }} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="card p-5" aria-label="Entries for the selected day">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="font-heading text-2xl font-extrabold text-navy-900">{format(selectedDate, "MMMM d, yyyy")}</h2>
            <span className="text-sm text-muted">
              {list.length} {list.length === 1 ? "entry" : "entries"}
            </span>
          </div>
          {list.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">Nothing is scheduled for this day.</p>
          ) : (
            <ul className="divide-y divide-line">
              {list.map((e) => {
                const cls = classById[e.classId];
                return (
                  <li key={e.id} className="flex items-start gap-3 py-3">
                    <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: cls?.color ?? "#64748b" }} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold break-words text-navy-900">{cls ? `${cls.course} · ${cls.section}` : "Unknown class"}</p>
                      <p className="text-sm break-words text-ink">{e.title}</p>
                      <p className="mt-0.5 text-xs text-muted">Added by {e.createdByName || "a student"}</p>
                    </div>
                    <TypeBadge type={e.type} />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
