"use client";

import clsx from "clsx";
import { format } from "date-fns";
import { Check, ChevronUp, Plus } from "lucide-react";
import { useState } from "react";
import { fromKey } from "@/lib/dates";
import type { ClassEvent, ClassRoom } from "@/lib/types";

/** Every upcoming entry across the student's classes. Check one off and it moves to Completed. */
export function UpcomingChecklist({
  events,
  classById,
  doneIds,
  onToggle,
  onOpen,
  onAdd,
}: {
  /** Upcoming entries, soonest first. */
  events: ClassEvent[];
  classById: Record<string, ClassRoom>;
  doneIds: Set<string>;
  onToggle: (e: ClassEvent, done: boolean) => void;
  onOpen: (e: ClassEvent) => void;
  /** point is where the + was clicked, so the add form can open there. */
  onAdd: (point: { x: number; y: number }) => void;
}) {
  const [showDone, setShowDone] = useState(true);
  const todo = events.filter((e) => !doneIds.has(e.id));
  const done = events.filter((e) => doneIds.has(e.id));

  return (
    // Stays in view while the calendar scrolls; scrolls on its own when the list is long.
    <div className="p-6 lg:sticky lg:top-16 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto" role="region" aria-label="Upcoming">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-heading text-2xl font-extrabold text-navy-900">Upcoming</h2>
        <button
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            onAdd({ x: r.left + r.width / 2, y: r.bottom });
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-muted transition hover:text-navy-900"
          aria-label="Add entry"
          title="Add entry"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {todo.length === 0 && <p className="py-6 text-sm text-muted">{done.length > 0 ? "All caught up." : "Nothing coming up. Add an entry with the + button."}</p>}
      <ul>
        {todo.map((e) => (
          <Row key={e.id} event={e} cls={classById[e.classId]} done={false} onToggle={onToggle} onOpen={onOpen} />
        ))}
      </ul>

      {done.length > 0 && (
        <div className="mt-4 border-t border-navy-900/10 pt-4">
          <button
            onClick={() => setShowDone((s) => !s)}
            className="flex items-center gap-2 text-sm font-semibold text-muted hover:text-navy-900"
            aria-expanded={showDone}
          >
            Completed ({done.length})
            <ChevronUp className={clsx("h-4 w-4 transition-transform", !showDone && "rotate-180")} />
          </button>
          {showDone && (
            <ul className="mt-1">
              {done.map((e) => (
                <Row key={e.id} event={e} cls={classById[e.classId]} done onToggle={onToggle} onOpen={onOpen} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Row({
  event: e,
  cls,
  done,
  onToggle,
  onOpen,
}: {
  event: ClassEvent;
  cls?: ClassRoom;
  done: boolean;
  onToggle: (e: ClassEvent, done: boolean) => void;
  onOpen: (e: ClassEvent) => void;
}) {
  const color = cls?.color ?? "#64748b";
  // "AP Biology Unit 5 quiz", unless the title already starts with the class name.
  const label = cls && !e.title.toLowerCase().startsWith(cls.course.toLowerCase()) ? `${cls.course} ${e.title}` : e.title;
  return (
    <li className="flex items-center gap-3 py-2">
      <button
        onClick={() => onToggle(e, !done)}
        role="checkbox"
        aria-checked={done}
        aria-label={`${done ? "Mark not done" : "Mark done"}: ${label}`}
        title={cls ? `${cls.course} · ${cls.section}` : undefined}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition hover:brightness-95"
        style={done ? { background: "#22a559", borderColor: "#22a559" } : { borderColor: color }}
      >
        {done && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} aria-hidden />}
      </button>
      <button
        onClick={() => onOpen(e)}
        title={label}
        className={clsx("min-w-0 flex-1 truncate text-left text-sm font-medium hover:underline", done ? "text-muted line-through" : "text-navy-900")}
      >
        {label}
      </button>
      <span className={clsx("shrink-0 rounded-full border border-line bg-white px-2.5 py-0.5 text-xs whitespace-nowrap", done ? "text-muted/70" : "text-muted")}>
        {format(fromKey(e.date), "EEE, MMM d")}
      </span>
    </li>
  );
}
