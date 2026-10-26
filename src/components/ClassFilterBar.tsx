"use client";

import clsx from "clsx";
import { CalendarClock, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { formatSchedule } from "@/lib/schedule";
import type { ClassRoom } from "@/lib/types";
import { AddClassModal } from "./AddClassModal";
import { ClassColorPopover } from "./ClassColorPopover";
import { CopyCode } from "./CopyCode";
import { ScheduleModal } from "./ScheduleModal";
import { ClassDot } from "./ui";
import { useWorkspace } from "./workspace";

/**
 * Pick one class, or see all of them together. Also where a class's color,
 * schedule and join code live, plus adding a class.
 * "page" spans the page under the navigation; "pane" sits on top of one column
 * (the calendar), showing the filter belongs to it.
 */
export function ClassFilterBar({ variant = "page" }: { variant?: "page" | "pane" }) {
  const { actor, classes, classById, selectedId, select } = useWorkspace();
  const [adding, setAdding] = useState(false);
  const [scheduling, setScheduling] = useState<ClassRoom | null>(null);
  // Which class's color palette is open, and where. Kept while it animates closed.
  const [palette, setPalette] = useState<{ classId: string; anchor: { x: number; y: number }; open: boolean } | null>(null);
  // The palette closes on any outside mousedown, so remember if it was open when the chip was pressed.
  const paletteWasOpen = useRef(false);
  const selected = selectedId ? classById[selectedId] : null;

  return (
    <>
      {/* Pinned right under the navy header (h-16) so the navigation never scrolls away. */}
      <div className="sticky top-16 z-30 border-b border-line bg-white">
        <div className={clsx("flex flex-wrap items-center gap-2 py-3", variant === "page" ? "mx-auto max-w-6xl px-5" : "px-6")}>
          <ClassChip active={!selectedId} onClick={() => select(null)} label="All classes" color="#b4bcc4" />
          {classes.map((c) => (
            <ClassChip
              key={c.id}
              active={selectedId === c.id}
              // Clicking the class that's already selected opens its color palette just below the chip.
              onMouseDown={() => (paletteWasOpen.current = !!palette?.open)}
              onClick={(e) => {
                if (selectedId !== c.id) return select(c.id);
                if (paletteWasOpen.current) return; // pressing the chip again closes the palette
                const r = e.currentTarget.getBoundingClientRect();
                setPalette({ classId: c.id, anchor: { x: r.left - 8, y: r.bottom }, open: true });
              }}
              label={c.course}
              color={c.color}
            />
          ))}
          <button onClick={() => setAdding(true)} className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-muted hover:text-navy-900">
            <Plus className="h-3.5 w-3.5" /> Add class
          </button>
          {selected && (
            <span className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
              {/* Only the person who created the class sets when it meets. */}
              {selected.createdBy === actor.uid ? (
                <button onClick={() => setScheduling(selected)} className="flex items-center gap-1 font-semibold text-navy-900 hover:underline">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {selected.schedule ? formatSchedule(selected.schedule) : "Set class schedule"}
                </button>
              ) : (
                selected.schedule && <span>{formatSchedule(selected.schedule)}</span>
              )}
              <span className="flex items-center gap-2">
                Class code <CopyCode code={selected.code} compact />
              </span>
            </span>
          )}
        </div>
      </div>
      <AddClassModal open={adding} onClose={() => setAdding(false)} />
      <ScheduleModal cls={scheduling} onClose={() => setScheduling(null)} />
      <ClassColorPopover
        cls={palette ? (classById[palette.classId] ?? null) : null}
        anchor={palette?.anchor ?? null}
        open={!!palette?.open}
        onClose={() => setPalette((p) => p && { ...p, open: false })}
      />
    </>
  );
}

function ClassChip({
  active,
  onClick,
  onMouseDown,
  label,
  color,
}: {
  active: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseDown?: () => void;
  label: string;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      onMouseDown={onMouseDown}
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
