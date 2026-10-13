"use client";

import clsx from "clsx";
import { addDays, addMonths, addWeeks, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { isVerified } from "@/lib/db";
import { formatTime, toKey, todayKey } from "@/lib/dates";
import type { ClassEvent, ClassRoom } from "@/lib/types";

interface Props {
  events: ClassEvent[];
  classById: Record<string, ClassRoom>;
  /** ids of entries to highlight as new */
  newIds: Set<string>;
  onSelectEvent: (e: ClassEvent) => void;
  onAddOnDate: (dateKey: string) => void;
}

export function CalendarView({ events, classById, newIds, onSelectEvent, onAddOnDate }: Props) {
  const [view, setView] = useState<"month" | "week">("month");
  const [cursor, setCursor] = useState(() => new Date());

  const byDay = useMemo(() => {
    const map: Record<string, ClassEvent[]> = {};
    for (const e of events) (map[e.date] ||= []).push(e);
    return map;
  }, [events]);

  const days = useMemo(() => {
    const start = view === "month" ? startOfWeek(startOfMonth(cursor)) : startOfWeek(cursor);
    const end = view === "month" ? endOfWeek(endOfMonth(cursor)) : endOfWeek(cursor);
    const out: Date[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
    return out;
  }, [cursor, view]);

  const move = (dir: number) => setCursor((c) => (view === "month" ? addMonths(c, dir) : addWeeks(c, dir)));
  const today = todayKey();

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
        <h2 className="mr-auto font-serif text-xl font-semibold text-navy-900">
          {view === "month" ? format(cursor, "MMMM yyyy") : `Week of ${format(days[0], "MMM d")}`}
        </h2>
        <div className="flex rounded-lg border border-line p-0.5 text-xs font-semibold">
          {(["month", "week"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={clsx("rounded-md px-3 py-1 capitalize", view === v ? "bg-navy-900 text-white" : "text-muted")}
            >
              {v}
            </button>
          ))}
        </div>
        <button className="btn btn-outline btn-sm !px-2" onClick={() => move(-1)} aria-label="Previous">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => setCursor(new Date())}>
          Today
        </button>
        <button className="btn btn-outline btn-sm !px-2" onClick={() => move(1)} aria-label="Next">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-line text-center text-[11px] font-semibold text-muted uppercase">
        {days.slice(0, 7).map((d) => (
          <div key={d.toISOString()} className="py-2">
            {format(d, "EEE")}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((d) => {
          const key = toKey(d);
          const list = byDay[key] || [];
          const muted = view === "month" && !isSameMonth(d, cursor);
          return (
            <div
              key={key}
              onClick={() => onAddOnDate(key)}
              title="Click to add an entry"
              className={clsx(
                "cursor-pointer border-r border-b border-line p-1 transition-colors hover:bg-navy-50/50 [&:nth-child(7n)]:border-r-0",
                view === "month" ? "min-h-[64px] sm:min-h-[104px]" : "min-h-[260px]",
                muted && "bg-paper/80",
              )}
            >
              <span
                className={clsx(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                  key === today ? "bg-navy-900 text-white" : muted ? "text-muted/50" : "text-navy-900",
                )}
              >
                {format(d, "d")}
              </span>
              <div className="mt-0.5 space-y-1">
                {list.map((e) => (
                  <button
                    key={e.id}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      onSelectEvent(e);
                    }}
                    className={clsx(
                      `type-${e.type}`,
                      "relative flex w-full items-center gap-1 truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium",
                      newIds.has(e.id) && "ring-2 ring-gold-500",
                    )}
                    style={{ background: "var(--type-bg)", color: "var(--type)" }}
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: classById[e.classId]?.color }} />
                    <span className="truncate">
                      {view === "week" && e.time ? `${formatTime(e.time)} ` : ""}
                      {e.title}
                    </span>
                    {isVerified(e) && <CheckCircle2 className="ml-auto hidden h-3 w-3 shrink-0 text-emerald-600 sm:block" />}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
