"use client";

import clsx from "clsx";
import { addDays, addMonths, addWeeks, endOfMonth, endOfWeek, format, isSameMonth, isSameWeek, startOfMonth, startOfWeek } from "date-fns";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { isVerified } from "@/lib/db";
import { formatTime, toKey, todayKey } from "@/lib/dates";
import type { ClassEvent, ClassRoom } from "@/lib/types";

interface Props {
  /** Entries for the month view (the classes in view). */
  events: ClassEvent[];
  /** Entries for every class, for the timeline. */
  allEvents: ClassEvent[];
  /** Every class the student is in: one timeline row each. */
  classes: ClassRoom[];
  /** The class picked in the sidebar, highlighted in the timeline. */
  selectedId: string | null;
  classById: Record<string, ClassRoom>;
  /** ids of entries to highlight as new */
  newIds: Set<string>;
  onSelectEvent: (e: ClassEvent) => void;
  /** point is where the day was clicked, so the add form can open there; classId is set from a timeline row. */
  onAddOnDate: (dateKey: string, point: { x: number; y: number }, classId?: string) => void;
}

type View = "month" | "timeline";

export function CalendarView({ events, allEvents, classes, selectedId, classById, newIds, onSelectEvent, onAddOnDate }: Props) {
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(() => new Date());
  // Set by the arrows and Today: which way the new month or week slides in from. n restarts the animation.
  const [nav, setNav] = useState<{ n: number; dir: 1 | -1 } | null>(null);

  const byDay = useMemo(() => {
    const map: Record<string, ClassEvent[]> = {};
    for (const e of events) (map[e.date] ||= []).push(e);
    return map;
  }, [events]);

  // "classId|date" → entries, for the timeline cells.
  const byClassDay = useMemo(() => {
    const map: Record<string, ClassEvent[]> = {};
    for (const e of allEvents) (map[`${e.classId}|${e.date}`] ||= []).push(e);
    return map;
  }, [allEvents]);

  const days = useMemo(() => {
    const start = view === "month" ? startOfWeek(startOfMonth(cursor)) : startOfWeek(cursor);
    const end = view === "month" ? endOfWeek(endOfMonth(cursor)) : endOfWeek(cursor);
    const out: Date[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
    return out;
  }, [cursor, view]);

  const slide = (dir: 1 | -1) => setNav((p) => ({ n: (p?.n ?? 0) + 1, dir }));
  const move = (dir: 1 | -1) => {
    setCursor((c) => (view === "month" ? addMonths(c, dir) : addWeeks(c, dir)));
    slide(dir);
  };
  const goToday = () => {
    const now = new Date();
    if (view === "month" ? isSameMonth(now, cursor) : isSameWeek(now, cursor)) return;
    setCursor(now);
    slide(now > cursor ? 1 : -1);
  };
  // Remounting the body (new key) replays its slide; switching views shouldn't slide.
  const bodyKey = nav?.n ?? 0;
  const bodySlide = nav && (nav.dir > 0 ? "animate-slide-next" : "animate-slide-prev");
  const today = todayKey();

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-6 py-3">
        <h2 className="mr-auto font-heading text-xl font-extrabold text-navy-900">
          {view === "month" ? format(cursor, "MMMM yyyy") : `Week of ${format(days[0], "MMM d")}`}
        </h2>
        <div className="flex rounded-lg border border-line p-0.5 text-xs font-semibold">
          {(["month", "timeline"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => {
                setView(v);
                setNav(null);
              }}
              className={clsx("rounded-md px-3 py-1 capitalize", view === v ? "bg-navy-900 text-white" : "text-muted")}
            >
              {v}
            </button>
          ))}
        </div>
        <button className="btn btn-outline btn-sm !px-2" onClick={() => move(-1)} aria-label="Previous">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button className="btn btn-outline btn-sm" onClick={goToday}>
          Today
        </button>
        <button className="btn btn-outline btn-sm !px-2" onClick={() => move(1)} aria-label="Next">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {view === "month" ? (
        <>
          <div className="grid grid-cols-7 border-b border-line text-center text-[11px] font-semibold text-muted uppercase">
            {days.slice(0, 7).map((d) => (
              <div key={d.toISOString()} className="py-2">
                {format(d, "EEE")}
              </div>
            ))}
          </div>

          {/* The weeks share whatever height the pane has, so the month fills the screen. */}
          <div key={bodyKey} className={clsx("grid flex-1 auto-rows-fr grid-cols-7", bodySlide)}>
            {days.map((d) => {
              const key = toKey(d);
              const muted = !isSameMonth(d, cursor);
              return (
                <div
                  key={key}
                  onClick={(ev) => onAddOnDate(key, { x: ev.clientX, y: ev.clientY })}
                  title="Click to add an entry"
                  className={clsx(
                    "min-h-[64px] cursor-pointer border-r border-b border-line p-1.5 transition-colors hover:bg-navy-50/50 sm:min-h-[112px] [&:nth-child(7n)]:border-r-0",
                    muted && "bg-paper/80",
                  )}
                >
                  <DayNumber date={d} isToday={key === today} muted={muted} />
                  <div className="mt-0.5 space-y-1">
                    {(byDay[key] || []).map((e) => (
                      <EventChip key={e.id} event={e} cls={classById[e.classId]} isNew={newIds.has(e.id)} onSelect={onSelectEvent} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : classes.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-muted">Join or create a class to see your week here.</p>
      ) : (
        // Days across, one row per class. Scrolls sideways on narrow screens with the class names pinned.
        <div key={bodyKey} className={bodySlide || undefined}>
        <div className="overflow-x-auto">
          <div className="grid min-w-[760px] grid-cols-[minmax(132px,176px)_repeat(7,minmax(0,1fr))]">
            <div className="sticky left-0 z-10 border-r border-b border-line bg-white" />
            {days.map((d, i) => {
              const key = toKey(d);
              return (
                <div
                  key={key}
                  className={clsx(
                    "flex items-center justify-center gap-1.5 border-b border-line py-2 text-[11px] font-semibold text-muted uppercase",
                    i < 6 && "border-r",
                  )}
                >
                  {format(d, "EEE")}
                  <DayNumber date={d} isToday={key === today} />
                </div>
              );
            })}

            {classes.map((c) => {
              const selected = c.id === selectedId;
              return (
                <div key={c.id} className="contents">
                  <div
                    className={clsx(
                      "sticky left-0 z-10 flex items-start gap-2 border-r border-b border-line px-3 py-2.5",
                      selected ? "bg-navy-50" : "bg-white",
                    )}
                  >
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-navy-900">{c.course}</p>
                      <p className="truncate text-xs text-muted">{c.section}</p>
                    </div>
                  </div>
                  {days.map((d, i) => {
                    const key = toKey(d);
                    return (
                      <div
                        key={key}
                        onClick={(ev) => onAddOnDate(key, { x: ev.clientX, y: ev.clientY }, c.id)}
                        title={`Add an entry for ${c.course}`}
                        className={clsx(
                          "min-h-[72px] cursor-pointer space-y-1 border-b border-line p-1 transition-colors hover:bg-navy-50/50",
                          i < 6 && "border-r",
                          selected && "bg-navy-50/40",
                        )}
                      >
                        {(byClassDay[`${c.id}|${key}`] || []).map((e) => (
                          <EventChip key={e.id} event={e} isNew={newIds.has(e.id)} onSelect={onSelectEvent} showTime />
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        </div>
      )}
    </div>
  );
}

function DayNumber({ date, isToday, muted }: { date: Date; isToday: boolean; muted?: boolean }) {
  return (
    <span
      className={clsx(
        "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
        isToday ? "bg-navy-900 text-white" : muted ? "text-muted/50" : "text-navy-900",
      )}
    >
      {format(date, "d")}
    </span>
  );
}

/** An entry in a day cell. The class dot is left out in the timeline, where the row already names the class. */
function EventChip({
  event: e,
  cls,
  isNew,
  onSelect,
  showTime,
}: {
  event: ClassEvent;
  cls?: ClassRoom;
  isNew: boolean;
  onSelect: (e: ClassEvent) => void;
  showTime?: boolean;
}) {
  return (
    <button
      onClick={(ev) => {
        ev.stopPropagation();
        onSelect(e);
      }}
      title={e.title}
      className={clsx(
        `type-${e.type}`,
        "relative flex w-full items-center gap-1 truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium",
        isNew && "ring-2 ring-navy-700",
      )}
      style={{ background: "var(--type-bg)", color: "var(--type)" }}
    >
      {cls && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: cls.color }} />}
      <span className="truncate">
        {showTime && e.time ? `${formatTime(e.time)} ` : ""}
        {e.title}
      </span>
      {isVerified(e) && <CheckCircle2 className="ml-auto hidden h-3 w-3 shrink-0 text-emerald-600 sm:block" />}
    </button>
  );
}
