"use client";

import { format } from "date-fns";
import { BellRing, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { CalendarView } from "@/components/CalendarView";
import { EventDetailModal } from "@/components/EventDetailModal";
import { EventFormModal } from "@/components/EventFormModal";
import { useWorkspace } from "@/components/workspace";
import { isNewForMe, markClassSeen, useEvents } from "@/lib/db";
import { fromKey, todayKey, tsToDate } from "@/lib/dates";
import type { ClassEvent } from "@/lib/types";

export default function CalendarPage() {
  const { actor, classes, visible, classById, memberships, selectedId } = useWorkspace();
  // The timeline shows every class; the month view and the banner follow the sidebar's pick.
  const allClassIds = useMemo(() => classes.map((c) => c.id), [classes]);
  const allEvents = useEvents(allClassIds);
  const visibleIds = useMemo(() => new Set(visible.map((c) => c.id)), [visible]);
  const events = useMemo(() => allEvents.filter((e) => visibleIds.has(e.classId)), [allEvents, visibleIds]);

  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState<{ open: boolean; event?: ClassEvent | null; date?: string; anchor?: { x: number; y: number }; classId?: string }>({ open: false });
  const opened = openId ? allEvents.find((e) => e.id === openId) ?? null : null;

  // Missed-announcement catch-up: upcoming entries a classmate added or changed since my last visit.
  const today = todayKey();
  const isNew = (e: ClassEvent) =>
    e.date >= today && !!memberships[e.classId] && isNewForMe(e, actor.uid, tsToDate(memberships[e.classId].lastSeenAt));
  const newEvents = events.filter(isNew);
  const newIds = new Set(allEvents.filter(isNew).map((e) => e.id));

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-navy-900">Calendar</h1>
          <p className="text-sm text-muted">
            {selectedId ? `${classById[selectedId].course} · ${classById[selectedId].section}` : "All your classes"}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setForm({ open: true })}>
          <Plus className="h-4 w-4" /> Add entry
        </button>
      </div>

      {newEvents.length > 0 && (
        <div className="rounded-xl border border-gold-500 bg-gold-50 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-semibold text-navy-900">
              <BellRing className="h-4 w-4 text-gold-600" />
              {newEvents.length} new or changed {newEvents.length === 1 ? "entry" : "entries"} since your last visit
            </p>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => Promise.all([...new Set(newEvents.map((e) => e.classId))].map((id) => markClassSeen(actor.uid, id)))}
            >
              Mark as seen
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {newEvents.map((e) => (
              <button
                key={e.id}
                onClick={() => setOpenId(e.id)}
                className="rounded-lg bg-white px-2.5 py-1 text-xs text-navy-900 ring-1 ring-gold-500/50 hover:ring-gold-500"
              >
                <span className="font-semibold">{format(fromKey(e.date), "MMM d")}</span> · {e.title}
                <span className="text-muted"> · {classById[e.classId]?.course}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <CalendarView
        events={events}
        allEvents={allEvents}
        classes={classes}
        selectedId={selectedId}
        classById={classById}
        newIds={newIds}
        onSelectEvent={(e) => setOpenId(e.id)}
        onAddOnDate={(date, anchor, classId) => setForm({ open: true, date, anchor, classId })}
      />

      <EventDetailModal
        event={opened}
        cls={opened ? classById[opened.classId] : undefined}
        actor={actor}
        onClose={() => setOpenId(null)}
        onEdit={(e) => {
          setOpenId(null);
          setForm({ open: true, event: e });
        }}
      />
      <EventFormModal
        open={form.open}
        event={form.event}
        defaultDate={form.date}
        anchor={form.anchor}
        defaultClassId={form.classId ?? selectedId ?? undefined}
        // A timeline row can name a class outside the sidebar's pick, so offer every class then.
        classes={form.classId ? classes : visible}
        actor={actor}
        // Keep the click point so the popover can animate closed where it opened.
        onClose={() => setForm((f) => ({ ...f, open: false }))}
      />
    </div>
  );
}
